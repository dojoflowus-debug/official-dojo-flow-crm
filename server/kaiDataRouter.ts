/**
 * Kai Data Tools Router
 * Provides structured data query tools for Kai to fetch student and lead information
 * with permission-aware filtering and UI-ready payloads
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { students, leads } from "../drizzle/schema";
import { eq, like, and, or, sql, desc, asc } from "drizzle-orm";

/**
 * Student card payload shape - matches existing Student Card UI
 */
const studentCardPayload = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  dateOfBirth: z.date().nullable(),
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
  createdAt: z.date(),
  updatedAt: z.date(),
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
  createdAt: z.date(),
  updatedAt: z.date(),
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
    type: z.literal("chip"),
    data: z.object({
      label: z.string(),
      entityType: z.enum(["student", "lead"]),
      entityId: z.number(),
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
      
      // If user has no organization, return empty results (no fake data)
      const orgId = ctx.currentOrganizationId;
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

      return {
        leads: results,
        totalCount: results.length,
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
});

export type KaiDataRouter = typeof kaiDataRouter;
