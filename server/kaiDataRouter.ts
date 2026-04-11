/**
 * Kai Data Tools Router
 * Provides structured data query tools for Kai to fetch student and lead information
 * with permission-aware filtering and UI-ready payloads
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { students, leads, classes, classSessions, classEnrollments, studentAttendance, signedWaivers, kiosks, kioskLocations, studentTuition, dojoSettings } from "../drizzle/schema";
import { eq, like, and, or, sql, desc, asc, gte, lte } from "drizzle-orm";
import { validateFluidPayKey, getMonthlyRevenue, getRecentTransactions, getRevenueHistory, getAllTransactions } from "./services/fluidpay";
import type { Database } from "./db";
import type { TrpcContext } from "./_core/context";

/**
 * Resolve the current organization ID from session or fall back to user's first membership.
 * This handles cases where the session cookie is missing (e.g., JWT-only auth).
 */
async function resolveOrgId(ctx: TrpcContext, db: Database): Promise<number | null> {
  if (ctx.currentOrganizationId) return ctx.currentOrganizationId;
  if (!ctx.user) return null;
  try {
    const { organizationUsers } = await import('../drizzle/schema');
    const memberships = await db
      .select({ organizationId: organizationUsers.organizationId })
      .from(organizationUsers)
      .where(eq(organizationUsers.userId, ctx.user.id))
      .limit(1);
    return memberships.length > 0 ? memberships[0].organizationId : null;
  } catch {
    return null;
  }
}

/**
 * Student card payload shape - matches existing Student Card UI
 */
const studentCardPayload = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  age: z.number().nullable(),
  beltRank: z.string().nullable(),
  status: z.enum(["Active", "Inactive", "On Hold"]),
  membershipStatus: z.string().nullable(),
  photoUrl: z.string().nullable(),
  program: z.string().nullable(),
  streetAddress: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zipCode: z.string().nullable(),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  guardianName: z.string().nullable(),
  guardianRelationship: z.string().nullable(),
  guardianPhone: z.string().nullable(),
  guardianEmail: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Lead card payload shape
 */
const leadCardPayload = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  status: z.enum([
    "New Lead",
    "Attempting Contact",
    "Contact Made",
    "Intro Scheduled",
    "Offer Presented",
    "Enrolled",
    "Nurture",
    "Lost/Winback"
  ]),
  source: z.string().nullable(),
  notes: z.string().nullable(),
  message: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zipCode: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Class card payload shape
 */
const classCardPayload = z.object({
  id: z.number(),
  name: z.string(),
  time: z.string(),
  enrolled: z.number(),
  capacity: z.number(),
  instructor: z.string().nullable(),
  instructorId: z.number().nullable(),
  dayOfWeek: z.string().nullable(),
  program: z.string().nullable(),
  level: z.string().nullable(),
  room: z.string().nullable(),
  isActive: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Attendance record payload
 */
const attendanceRecordPayload = z.object({
  id: z.number(),
  studentId: z.number(),
  classId: z.number(),
  date: z.string(),
  status: z.enum(["Present", "Absent", "Late", "Excused"]),
  createdAt: z.string(),
});

/**
 * UI Block types for structured responses
 */
export const uiBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("student_card"),
    data: studentCardPayload,
  }),
  z.object({
    type: z.literal("student_list"),
    data: z.object({
      students: z.array(studentCardPayload),
      totalCount: z.number(),
      query: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("lead_card"),
    data: leadCardPayload,
  }),
  z.object({
    type: z.literal("lead_list"),
    data: z.object({
      leads: z.array(leadCardPayload),
      totalCount: z.number(),
      query: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("class_card"),
    data: classCardPayload,
  }),
  z.object({
    type: z.literal("class_list"),
    data: z.object({
      classes: z.array(classCardPayload),
      totalCount: z.number(),
    }),
  }),
  z.object({
    type: z.literal("attendance_summary"),
    data: z.object({
      classId: z.number(),
      className: z.string(),
      date: z.string(),
      totalEnrolled: z.number(),
      present: z.number(),
      absent: z.number(),
      late: z.number(),
      excused: z.number(),
      attendanceRate: z.number(),
    }),
  }),
  z.object({
    type: z.literal("chip"),
    data: z.object({
      label: z.string(),
      entityType: z.enum(["student", "lead", "class"]),
      entityId: z.number(),
    }),
  }),
  z.object({
    type: z.literal("kiosk_checkin"),
    data: z.object({
      id: z.number(),
      studentId: z.number(),
      studentName: z.string(),
      locationId: z.number(),
      checkInTime: z.string(),
      status: z.enum(["attended", "missed", "excused", "upcoming"]),
    }),
  }),
  z.object({
    type: z.literal("kiosk_checkin_list"),
    data: z.object({
      checkins: z.array(z.object({
        id: z.number(),
        studentId: z.number(),
        studentName: z.string(),
        locationId: z.number(),
        checkInTime: z.string(),
        status: z.enum(["attended", "missed", "excused", "upcoming"]),
      })),
      totalCount: z.number(),
      locationId: z.number(),
      dateRange: z.object({ start: z.string(), end: z.string() }).optional(),
    }),
  }),
  z.object({
    type: z.literal("waiver_status"),
    data: z.object({
      personId: z.number(),
      personName: z.string(),
      hasValidWaiver: z.boolean(),
      waiverSignedAt: z.string().nullable(),
      waiverExpiresAt: z.string().nullable(),
      signerType: z.enum(["student", "guardian"]).nullable(),
    }),
  }),
  z.object({
    type: z.literal("revenue_summary"),
    data: z.object({
      totalRevenue: z.number(),
      totalTransactions: z.number(),
      averageTransactionValue: z.number(),
      dateRange: z.object({ start: z.string(), end: z.string() }),
      locationId: z.number(),
    }),
  }),
  z.object({
    type: z.literal("overdue_account"),
    data: z.object({
      studentId: z.number(),
      studentName: z.string(),
      totalOverdue: z.number(),
      daysPastDue: z.number(),
      lastPaymentDate: z.string().nullable(),
    }),
  }),
  z.object({
    type: z.literal("overdue_accounts_list"),
    data: z.object({
      accounts: z.array(z.object({
        studentId: z.number(),
        studentName: z.string(),
        totalOverdue: z.number(),
        daysPastDue: z.number(),
        lastPaymentDate: z.string().nullable(),
      })),
      totalCount: z.number(),
      locationId: z.number(),
    }),
  }),
]);

export type UIBlock = z.infer<typeof uiBlockSchema>;

export const kaiDataRouter = router({
  /**
   * Search students by name, email, or phone
   * Returns limited PII for chat display
   */
  searchStudents: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().default(10),
        // Future: locationId for multi-location support
        locationId: z.number().optional(),
      })
    )
    .output(
      z.object({
        students: z.array(studentCardPayload),
        totalCount: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const searchTerm = `%${input.query}%`;
      
      // Build conditions with organization filter for multi-tenancy
      const orgId = ctx.currentOrganizationId;
      
      // If user has no organization, return empty results (no fake data)
      if (!orgId) {
        return { students: [], totalCount: 0 };
      }
      
      const searchConditions = or(
        like(students.firstName, searchTerm),
        like(students.lastName, searchTerm),
        like(students.email, searchTerm),
        like(students.phone, searchTerm)
      );
      
      const whereCondition = and(eq(students.organizationId, orgId), searchConditions);

      const results = await db
        .select()
        .from(students)
        .where(whereCondition)
        .limit(input.limit)
        .orderBy(desc(students.updatedAt));

      const totalCount = results.length;

      return {
        students: results,
        totalCount,
      };
    }),

  /**
   * Get full student card data by ID
   */
  getStudent: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .output(studentCardPayload.nullable())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      // If user has no organization, return null (no fake data)
      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return null;
      }
      
      const whereCondition = and(eq(students.id, input.studentId), eq(students.organizationId, orgId));

      const result = await db
        .select()
        .from(students)
        .where(whereCondition)
        .limit(1);

      return result[0] || null;
    }),

  /**
   * List students at risk (inactive or on hold)
   */
  listAtRiskStudents: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
        locationId: z.number().optional(),
      })
    )
    .output(
      z.object({
        students: z.array(studentCardPayload),
        totalCount: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      // If user has no organization, return empty results (no fake data)
      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return { students: [], totalCount: 0 };
      }
      
      const statusCondition = or(
        eq(students.status, "Inactive"),
        eq(students.status, "On Hold")
      );
      
      const whereCondition = and(eq(students.organizationId, orgId), statusCondition);

      // Students who are inactive or on hold
      const results = await db
        .select()
        .from(students)
        .where(whereCondition)
        .orderBy(desc(students.updatedAt))
        .limit(50);

      return {
        students: results,
        totalCount: results.length,
      };
    }),

  /**
   * List students with late payments
   * Note: This is a placeholder - full implementation requires billing table
   */
  listLatePayments: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
        locationId: z.number().optional(),
      })
    )
    .output(
      z.object({
        students: z.array(studentCardPayload),
        totalCount: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      // If user has no organization, return empty results (no fake data)
      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return { students: [], totalCount: 0 };
      }
      
      const statusCondition = like(students.membershipStatus, "%Overdue%");
      const whereCondition = and(eq(students.organizationId, orgId), statusCondition);

      // Placeholder: Return students with "Overdue" membership status
      // In production, this would query a billing/payments table
      const results = await db
        .select()
        .from(students)
        .where(whereCondition)
        .orderBy(desc(students.updatedAt))
        .limit(50);

      return {
        students: results,
        totalCount: results.length,
      };
    }),

  /**
   * Search leads by name, email, or phone
   */
  searchLeads: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().default(10),
        locationId: z.number().optional(),
      })
    )
    .output(
      z.object({
        leads: z.array(leadCardPayload),
        totalCount: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const searchTerm = `%${input.query}%`;
      
      // Build conditions with organization filter for multi-tenancy
      const orgId = ctx.currentOrganizationId;
      
      // If user has no organization, return empty results (no fake data)
      if (!orgId) {
        return { leads: [], totalCount: 0 };
      }
      
      const searchConditions = or(
        like(leads.firstName, searchTerm),
        like(leads.lastName, searchTerm),
        like(leads.email, searchTerm),
        like(leads.phone, searchTerm)
      );
      
      const whereCondition = and(eq(leads.organizationId, orgId), searchConditions);

      const results = await db
        .select()
        .from(leads)
        .where(whereCondition)
        .limit(input.limit)
        .orderBy(desc(leads.updatedAt));

      const totalCount = results.length;

      return {
        leads: results,
        totalCount,
      };
    }),

  /**
   * Get full lead card data by ID
   */
  getLead: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .output(leadCardPayload.nullable())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      // If user has no organization, return null (no fake data)
      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return null;
      }
      
      const whereCondition = and(eq(leads.id, input.leadId), eq(leads.organizationId, orgId));

      const result = await db
        .select()
        .from(leads)
        .where(whereCondition)
        .limit(1);

      return result[0] || null;
    }),

  /**
   * Get new leads (created in last N days)
   */
  getNewLeads: protectedProcedure
    .input(
      z.object({
        days: z.number().default(7),
        locationId: z.number().optional(),
      })
    )
    .output(
      z.object({
        leads: z.array(leadCardPayload),
        totalCount: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      // If user has no organization, return empty results (no fake data)
      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return { leads: [], totalCount: 0 };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.days);

      const statusCondition = eq(leads.status, "New Lead");
      const whereCondition = and(eq(leads.organizationId, orgId), statusCondition);

      const results = await db
        .select()
        .from(leads)
        .where(whereCondition)
        .orderBy(desc(leads.createdAt))
        .limit(50);

      return {
        leads: results,
        totalCount: results.length,
      };
    }),

  /**
   * List all active classes
   */
  listClasses: protectedProcedure
    .input(
      z.object({
        programId: z.number().optional(),
        instructorId: z.number().optional(),
        dayOfWeek: z.string().optional(),
        limit: z.number().default(50),
      })
    )
    .output(
      z.object({
        classes: z.array(classCardPayload),
        totalCount: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return { classes: [], totalCount: 0 };
      }

      const conditions = [eq(classes.organizationId, orgId), eq(classes.isActive, 1)];
      
      if (input.programId) {
        conditions.push(eq(classes.program, input.programId.toString()));
      }
      if (input.instructorId) {
        conditions.push(eq(classes.instructorId, input.instructorId));
      }
      if (input.dayOfWeek) {
        conditions.push(eq(classes.dayOfWeek, input.dayOfWeek));
      }

      const results = await db
        .select()
        .from(classes)
        .where(and(...conditions))
        .orderBy(asc(classes.time))
        .limit(input.limit);

      return {
        classes: results,
        totalCount: results.length,
      };
    }),

  /**
   * Get class roster with attendance info
   */
  getClassRoster: protectedProcedure
    .input(
      z.object({
        classId: z.number(),
        date: z.string().optional(),
      })
    )
    .output(
      z.object({
        classId: z.number(),
        className: z.string(),
        date: z.string(),
        students: z.array(
          z.object({
            studentId: z.number(),
            firstName: z.string(),
            lastName: z.string(),
            status: z.enum(["Present", "Absent", "Late", "Excused"]).optional(),
          })
        ),
        totalEnrolled: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return { classId: input.classId, className: "", date: input.date || "", students: [], totalEnrolled: 0 };
      }

      // Get class info
      const classInfo = await db
        .select()
        .from(classes)
        .where(and(eq(classes.id, input.classId), eq(classes.organizationId, orgId)))
        .limit(1);

      if (!classInfo.length) {
        return { classId: input.classId, className: "", date: input.date || "", students: [], totalEnrolled: 0 };
      }

      // Get enrolled students
      const enrolledStudents = await db
        .select()
        .from(classEnrollments)
        .where(eq(classEnrollments.classId, input.classId))
        .limit(100);

      // Get attendance for the date if provided
      const attendanceRecords = input.date
        ? await db
            .select()
            .from(studentAttendance)
            .where(and(eq(studentAttendance.classId, input.classId), eq(studentAttendance.classDate, input.date)))
        : [];

      const attendanceMap = new Map(attendanceRecords.map(r => [r.studentId, r.status]));

      return {
        classId: input.classId,
        className: classInfo[0].name,
        date: input.date || new Date().toISOString().split('T')[0],
        students: enrolledStudents.map(e => ({
          studentId: e.studentId,
          firstName: "", // Would need to join with students table
          lastName: "",
          status: attendanceMap.get(e.studentId) as any,
        })),
        totalEnrolled: enrolledStudents.length,
      };
    }),

  /**
   * Get class capacity info
   */
  getClassCapacity: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .output(
      z.object({
        classId: z.number(),
        className: z.string(),
        capacity: z.number(),
        enrolled: z.number(),
        available: z.number(),
        occupancyRate: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return { classId: input.classId, className: "", capacity: 0, enrolled: 0, available: 0, occupancyRate: 0 };
      }

      const classInfo = await db
        .select()
        .from(classes)
        .where(and(eq(classes.id, input.classId), eq(classes.organizationId, orgId)))
        .limit(1);

      if (!classInfo.length) {
        return { classId: input.classId, className: "", capacity: 0, enrolled: 0, available: 0, occupancyRate: 0 };
      }

      const c = classInfo[0];
      const available = Math.max(0, c.capacity - c.enrolled);
      const occupancyRate = c.capacity > 0 ? (c.enrolled / c.capacity) * 100 : 0;

      return {
        classId: input.classId,
        className: c.name,
        capacity: c.capacity,
        enrolled: c.enrolled,
        available,
        occupancyRate: Math.round(occupancyRate),
      };
    }),

  /**
   * Get attendance summary for a date range
   */
  getAttendanceSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        programId: z.number().optional(),
      })
    )
    .output(
      z.object({
        totalClasses: z.number(),
        totalAttendance: z.number(),
        averageAttendanceRate: z.number(),
        byClass: z.array(
          z.object({
            classId: z.number(),
            className: z.string(),
            totalSessions: z.number(),
            averageAttendanceRate: z.number(),
          })
        ),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return { totalClasses: 0, totalAttendance: 0, averageAttendanceRate: 0, byClass: [] };
      }

      // Get attendance records for date range
      const attendanceData = await db
        .select()
        .from(studentAttendance)
        .where(
          and(
            gte(studentAttendance.classDate, input.startDate),
            lte(studentAttendance.classDate, input.endDate)
          )
        );

      // Group by class and calculate stats
      const byClassMap = new Map();
      let totalPresent = 0;
      let totalRecords = 0;

      for (const record of attendanceData) {
        if (record.status === "attended") totalPresent++;
        totalRecords++;

        if (!byClassMap.has(record.classId)) {
          byClassMap.set(record.classId, { present: 0, total: 0 });
        }
        const stats = byClassMap.get(record.classId);
        if (record.status === "attended") stats.present++;
        stats.total++;
      }

      const byClass = Array.from(byClassMap.entries()).map(([classId, stats]) => ({
        classId,
        className: `Class ${classId}`,
        totalSessions: stats.total,
        averageAttendanceRate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
      }));

      const averageAttendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

      return {
        totalClasses: byClass.length,
        totalAttendance: totalRecords,
        averageAttendanceRate,
        byClass,
      };
    }),

  /**
   * KIOSK ACTIVITY MODULE
   * Provides check-in tracking and visitor analytics for kiosk locations
   */

  /**
   * Get today's check-ins for a specific location
   */
  getKioskToday: protectedProcedure
    .input(
      z.object({
        locationId: z.number(),
      })
    )
    .output(
      z.object({
        checkins: z.array(
          z.object({
            id: z.number(),
            studentId: z.number(),
            studentName: z.string(),
            locationId: z.number(),
            checkInTime: z.string(),
            status: z.enum(["attended", "missed", "excused", "upcoming"]),
          })
        ),
        totalCount: z.number(),
        locationId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return { checkins: [], totalCount: 0, locationId: input.locationId };
      }

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Get attendance records for today (using classDate as check-in date)
      const attendanceData = await db
        .select()
        .from(studentAttendance)
        .where(eq(studentAttendance.classDate, today))
        .limit(100);

      // Enrich with student names
      const checkins = [];
      for (const record of attendanceData) {
        const studentData = await db
          .select()
          .from(students)
          .where(eq(students.id, record.studentId))
          .limit(1);

        if (studentData.length > 0) {
          const student = studentData[0];
          checkins.push({
            id: record.id,
            studentId: record.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            locationId: input.locationId,
            checkInTime: record.classDate,
            status: record.status,
          });
        }
      }

      return {
        checkins,
        totalCount: checkins.length,
        locationId: input.locationId,
      };
    }),

  /**
   * Get check-ins for a date range
   */
  getCheckins: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        locationId: z.number(),
      })
    )
    .output(
      z.object({
        checkins: z.array(
          z.object({
            id: z.number(),
            studentId: z.number(),
            studentName: z.string(),
            locationId: z.number(),
            checkInTime: z.string(),
            status: z.enum(["attended", "missed", "excused", "upcoming"]),
          })
        ),
        totalCount: z.number(),
        locationId: z.number(),
        dateRange: z.object({ start: z.string(), end: z.string() }),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return {
          checkins: [],
          totalCount: 0,
          locationId: input.locationId,
          dateRange: { start: input.startDate, end: input.endDate },
        };
      }

      // Get attendance records for date range
      const attendanceData = await db
        .select()
        .from(studentAttendance)
        .where(
          and(
            gte(studentAttendance.classDate, input.startDate),
            lte(studentAttendance.classDate, input.endDate)
          )
        )
        .limit(500);

      // Enrich with student names
      const checkins = [];
      for (const record of attendanceData) {
        const studentData = await db
          .select()
          .from(students)
          .where(eq(students.id, record.studentId))
          .limit(1);

        if (studentData.length > 0) {
          const student = studentData[0];
          checkins.push({
            id: record.id,
            studentId: record.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            locationId: input.locationId,
            checkInTime: record.classDate,
            status: record.status,
          });
        }
      }

      return {
        checkins,
        totalCount: checkins.length,
        locationId: input.locationId,
        dateRange: { start: input.startDate, end: input.endDate },
      };
    }),

  /**
   * Get new visitors (students who checked in for first time in date range)
   */
  getNewVisitors: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        locationId: z.number(),
      })
    )
    .output(
      z.object({
        visitors: z.array(
          z.object({
            studentId: z.number(),
            studentName: z.string(),
            firstCheckInDate: z.string(),
            status: z.enum(["Active", "Inactive", "On Hold"]),
          })
        ),
        totalCount: z.number(),
        locationId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return { visitors: [], totalCount: 0, locationId: input.locationId };
      }

      // Get attendance records for date range
      const attendanceData = await db
        .select()
        .from(studentAttendance)
        .where(
          and(
            gte(studentAttendance.classDate, input.startDate),
            lte(studentAttendance.classDate, input.endDate)
          )
        );

      // Group by student and find first check-in
      const visitorMap = new Map();
      for (const record of attendanceData) {
        if (!visitorMap.has(record.studentId)) {
          visitorMap.set(record.studentId, record.classDate);
        }
      }

      // Enrich with student data
      const visitors = [];
      for (const [studentId, firstDate] of visitorMap.entries()) {
        const studentData = await db
          .select()
          .from(students)
          .where(eq(students.id, studentId))
          .limit(1);

        if (studentData.length > 0) {
          const student = studentData[0];
          visitors.push({
            studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            firstCheckInDate: firstDate,
            status: student.status,
          });
        }
      }

      return {
        visitors,
        totalCount: visitors.length,
        locationId: input.locationId,
      };
    }),

  /**
   * Get waiver status for a person (student)
   */
  getWaiverStatus: protectedProcedure
    .input(
      z.object({
        personId: z.number(),
      })
    )
    .output(
      z.object({
        personId: z.number(),
        personName: z.string(),
        hasValidWaiver: z.boolean(),
        waiverSignedAt: z.string().nullable(),
        waiverExpiresAt: z.string().nullable(),
        signerType: z.enum(["student", "guardian"]).nullable(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return {
          personId: input.personId,
          personName: "",
          hasValidWaiver: false,
          waiverSignedAt: null,
          waiverExpiresAt: null,
          signerType: null,
        };
      }

      // Get student info
      const studentData = await db
        .select()
        .from(students)
        .where(eq(students.id, input.personId))
        .limit(1);

      if (!studentData.length) {
        return {
          personId: input.personId,
          personName: "",
          hasValidWaiver: false,
          waiverSignedAt: null,
          waiverExpiresAt: null,
          signerType: null,
        };
      }

      const student = studentData[0];

      // Get most recent waiver for this student
      const waiverData = await db
        .select()
        .from(signedWaivers)
        .where(eq(signedWaivers.studentId, input.personId))
        .orderBy(desc(signedWaivers.signedAt))
        .limit(1);

      if (!waiverData.length) {
        return {
          personId: input.personId,
          personName: `${student.firstName} ${student.lastName}`,
          hasValidWaiver: false,
          waiverSignedAt: null,
          waiverExpiresAt: null,
          signerType: null,
        };
      }

      const waiver = waiverData[0];
      // Assume waivers are valid for 1 year from signing
      const expiresAt = new Date(waiver.signedAt);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      const hasValidWaiver = expiresAt > new Date();

      return {
        personId: input.personId,
        personName: `${student.firstName} ${student.lastName}`,
        hasValidWaiver,
        waiverSignedAt: waiver.signedAt,
        waiverExpiresAt: expiresAt.toISOString().split('T')[0],
        signerType: waiver.signerType as "student" | "guardian",
      };
    }),

  /**
   * BILLING MODULE
   * Provides revenue tracking and payment analytics for billing management
   */

  /**
   * Get revenue summary for a date range
   */
  getRevenueSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        locationId: z.number().optional(),
      })
    )
    .output(
      z.object({
        totalRevenue: z.number(),
        totalTransactions: z.number(),
        averageTransactionValue: z.number(),
        dateRange: z.object({ start: z.string(), end: z.string() }),
        locationId: z.number().optional(),
        source: z.string().optional(),
        fluidpayData: z.object({
          totalDollars: z.number(),
          settledDollars: z.number(),
          pendingDollars: z.number(),
          refundDollars: z.number(),
          month: z.string(),
          year: z.number(),
        }).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      // Resolve org ID: use session org, fall back to user's first org membership
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) {
        return {
          totalRevenue: 0,
          totalTransactions: 0,
          averageTransactionValue: 0,
          dateRange: { start: input.startDate, end: input.endDate },
          locationId: input.locationId,
        };
      }

      // Check if FluidPay is connected — use live data if available
      try {
        const settings = await db.select().from(dojoSettings).where(eq(dojoSettings.organizationId, orgId)).limit(1);
        const fpKey = (settings[0] as any)?.fluidpayApiKey;
        if (fpKey) {
          // Parse year/month from startDate (e.g. "2026-04-01")
          const [yearStr, monthStr] = input.startDate.split('-');
          const year = parseInt(yearStr, 10);
          const month = parseInt(monthStr, 10);
          const rev = await getMonthlyRevenue(fpKey, year, month);
          const totalRevenueCents = rev.totalDollars * 100; // convert back to cents for consistency
          const txCount = rev.transactionCount || 0;
          return {
            totalRevenue: Math.round(rev.totalDollars * 100), // stored in cents
            totalTransactions: txCount,
            averageTransactionValue: txCount > 0 ? Math.round((rev.totalDollars * 100) / txCount) : 0,
            dateRange: { start: input.startDate, end: input.endDate },
            locationId: input.locationId,
            source: 'fluidpay' as any,
            fluidpayData: {
              totalDollars: rev.totalDollars,
              settledDollars: rev.settledDollars,
              pendingDollars: rev.pendingDollars,
              refundDollars: rev.refundDollars,
              month: rev.month,
              year: rev.year,
            } as any,
          };
        }
      } catch (fpErr: any) {
        console.error('[getRevenueSummary] FluidPay error:', fpErr.message);
      }

      // Fallback: Get tuition records for date range that are paid
      const tuitionData = await db
        .select()
        .from(studentTuition)
        .where(
          and(
            gte(studentTuition.paidDate, input.startDate),
            lte(studentTuition.paidDate, input.endDate),
            eq(studentTuition.status, "paid")
          )
        )
        .limit(1000);

      let totalRevenue = 0;
      for (const record of tuitionData) {
        totalRevenue += record.amount || 0;
      }

      const totalTransactions = tuitionData.length;
      const averageTransactionValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

      return {
        totalRevenue,
        totalTransactions,
        averageTransactionValue,
        dateRange: { start: input.startDate, end: input.endDate },
        locationId: input.locationId,
      };
    }),

  /**
   * Get overdue accounts (students with past-due tuition)
   */
  getOverdueAccounts: protectedProcedure
    .input(
      z.object({
        daysPastDue: z.number().default(30),
        locationId: z.number().optional(),
      })
    )
    .output(
      z.object({
        accounts: z.array(
          z.object({
            studentId: z.number(),
            studentName: z.string(),
            totalOverdue: z.number(),
            daysPastDue: z.number(),
            lastPaymentDate: z.string().nullable(),
          })
        ),
        totalCount: z.number(),
        locationId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return {
          accounts: [],
          totalCount: 0,
          locationId: input.locationId,
        };
      }

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.daysPastDue);
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

      // Get overdue tuition records
      const overdueData = await db
        .select()
        .from(studentTuition)
        .where(
          and(
            eq(studentTuition.status, "overdue"),
            lte(studentTuition.dueDate, cutoffDateStr)
          )
        )
        .limit(500);

      // Group by student and calculate totals
      const accountMap = new Map();
      for (const record of overdueData) {
        if (!accountMap.has(record.studentId)) {
          accountMap.set(record.studentId, {
            totalOverdue: 0,
            lastPaymentDate: null,
            dueDate: record.dueDate,
          });
        }
        const account = accountMap.get(record.studentId);
        account.totalOverdue += record.amount || 0;
      }

      // Enrich with student data
      const accounts = [];
      for (const [studentId, accountData] of accountMap.entries()) {
        const studentData = await db
          .select()
          .from(students)
          .where(eq(students.id, studentId))
          .limit(1);

        if (studentData.length > 0) {
          const student = studentData[0];
          const today = new Date();
          const dueDate = new Date(accountData.dueDate);
          const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

          accounts.push({
            studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            totalOverdue: accountData.totalOverdue,
            daysPastDue: Math.max(0, daysPastDue),
            lastPaymentDate: accountData.lastPaymentDate,
          });
        }
      }

      return {
        accounts,
        totalCount: accounts.length,
        locationId: input.locationId,
      };
    }),

  /**
   * Get failed payment attempts (placeholder for future payment processor integration)
   */
  getFailedPayments: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        locationId: z.number().optional(),
      })
    )
    .output(
      z.object({
        payments: z.array(
          z.object({
            id: z.number(),
            studentId: z.number(),
            studentName: z.string(),
            amount: z.number(),
            failureDate: z.string(),
            failureReason: z.string(),
          })
        ),
        totalCount: z.number(),
        dateRange: z.object({ start: z.string(), end: z.string() }),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return {
          payments: [],
          totalCount: 0,
          dateRange: { start: input.startDate, end: input.endDate },
        };
      }

      // Get failed tuition records (placeholder implementation)
      // In production, this would query a payment processor API or failed_payments table
      const failedData = await db
        .select()
        .from(studentTuition)
        .where(
          and(
            eq(studentTuition.status, "pending"),
            lte(studentTuition.dueDate, new Date().toISOString().split('T')[0])
          )
        )
        .limit(500);

      // Map to failed payment format
      const payments = [];
      for (const record of failedData) {
        const studentData = await db
          .select()
          .from(students)
          .where(eq(students.id, record.studentId))
          .limit(1);

        if (studentData.length > 0) {
          const student = studentData[0];
          payments.push({
            id: record.id,
            studentId: record.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            amount: record.amount || 0,
            failureDate: record.dueDate,
            failureReason: "Payment past due",
          });
        }
      }

      return {
        payments,
        totalCount: payments.length,
        dateRange: { start: input.startDate, end: input.endDate },
      };
    }),

  /**
   * Connect FluidPay API key for this organization
   */
  connectFluidPay: protectedProcedure
    .input(z.object({ apiKey: z.string().min(10) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) throw new Error("No organization found");

      // Validate the key against FluidPay
      const validation = await validateFluidPayKey(input.apiKey);
      if (!validation.valid) {
        return { success: false, error: validation.error || 'Invalid API key' };
      }

      // Store the key in dojo_settings
      const existing = await db.select({ id: dojoSettings.id })
        .from(dojoSettings)
        .where(eq(dojoSettings.organizationId, orgId))
        .limit(1);

      if (existing.length > 0) {
        await db.update(dojoSettings)
          .set({ fluidpayApiKey: input.apiKey } as any)
          .where(eq(dojoSettings.organizationId, orgId));
      } else {
        await db.insert(dojoSettings).values({ organizationId: orgId, fluidpayApiKey: input.apiKey } as any);
      }

      return { success: true, message: 'FluidPay connected successfully!' };
    }),

  /**
   * Get FluidPay monthly revenue for this organization
   */
  getFluidPayRevenue: protectedProcedure
    .input(z.object({ year: z.number().optional(), month: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) return { connected: false, error: 'No organization found' };

      const settings = await db.select()
        .from(dojoSettings)
        .where(eq(dojoSettings.organizationId, orgId))
        .limit(1);

      const apiKey = (settings[0] as any)?.fluidpayApiKey;
      if (!apiKey) {
        return { connected: false, error: 'FluidPay not connected. Ask Kai to connect your FluidPay account.' };
      }

      try {
        const revenue = await getMonthlyRevenue(apiKey, input.year, input.month);
        return { connected: true, ...revenue };
      } catch (err: any) {
        return { connected: true, error: err.message };
      }
    }),

  /**
   * Get recent FluidPay transactions for this organization
   */
  getFluidPayTransactions: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) return { connected: false, transactions: [], error: 'No organization found' };

      const settings = await db.select()
        .from(dojoSettings)
        .where(eq(dojoSettings.organizationId, orgId))
        .limit(1);

      const apiKey = (settings[0] as any)?.fluidpayApiKey;
      if (!apiKey) {
        return { connected: false, transactions: [], error: 'FluidPay not connected.' };
      }

      try {
        const transactions = await getRecentTransactions(apiKey, input.limit);
        return { connected: true, transactions };
      } catch (err: any) {
        return { connected: true, transactions: [], error: err.message };
      }
    }),

  /**
   * Get FluidPay revenue history for the last N months (for chart display)
   */
  getFluidPayRevenueHistory: protectedProcedure
    .input(z.object({ months: z.number().default(6) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) return { connected: false, history: [], error: 'No organization found' };

      const settings = await db.select()
        .from(dojoSettings)
        .where(eq(dojoSettings.organizationId, orgId))
        .limit(1);

      const apiKey = (settings[0] as any)?.fluidpayApiKey;
      if (!apiKey) {
        return { connected: false, history: [], error: 'FluidPay not connected.' };
      }

      try {
        const history = await getRevenueHistory(apiKey, input.months);
        return { connected: true, history };
      } catch (err: any) {
        return { connected: true, history: [], error: err.message };
      }
    }),

  /**
   * Get all FluidPay transactions for a date range (for full history table)
   */
  getFluidPayAllTransactions: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      limit: z.number().default(100),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) return { connected: false, transactions: [], totalCount: 0, error: 'No organization found' };

      const settings = await db.select()
        .from(dojoSettings)
        .where(eq(dojoSettings.organizationId, orgId))
        .limit(1);

      const apiKey = (settings[0] as any)?.fluidpayApiKey;
      if (!apiKey) {
        return { connected: false, transactions: [], totalCount: 0, error: 'FluidPay not connected.' };
      }

      try {
        const result = await getAllTransactions(apiKey, input.startDate, input.endDate, input.limit);
        return { connected: true, ...result };
      } catch (err: any) {
        return { connected: true, transactions: [], totalCount: 0, error: err.message };
      }
    }),
});

export type KaiDataRouter = typeof kaiDataRouter;
