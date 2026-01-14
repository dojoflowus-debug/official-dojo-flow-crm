import mysql from "mysql2/promise";
import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, staffPins, InsertStaffPin, studentMessages, studentMessageAttachments, InsertStudentMessage, students } from "../drizzle/schema";
import { ENV } from './_core/env';
import * as schema from "../drizzle/schema";
import { DEFAULT_KIOSK_CONFIG } from '../shared/kioskConfig';

// Fallback function for missing schema export
function getDefaultKioskSettings() {
  return DEFAULT_KIOSK_CONFIG;
}

// Type alias for compatibility
type KioskSettings = typeof DEFAULT_KIOSK_CONFIG;

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Create mysql2 pool first
      if (!_pool) {
        _pool = mysql.createPool(process.env.DATABASE_URL);
      }
      // Pass the pool to drizzle with schema for query API
      _db = drizzle(_pool, { schema, mode: 'default' });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date().toISOString();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date().toISOString();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all active staff PINs
 */
export async function getActiveStaffPins() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get staff PINs: database not available");
    return [];
  }

  const result = await db.select().from(staffPins).where(eq(staffPins.isActive, 1));
  return result;
}

/**
 * Get staff PIN by ID
 */
export async function getStaffPinById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get staff PIN: database not available");
    return undefined;
  }

  const result = await db.select().from(staffPins).where(eq(staffPins.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Update last used timestamp for a staff PIN
 */
export async function updateStaffPinLastUsed(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update staff PIN: database not available");
    return;
  }

  await db.update(staffPins)
    .set({  lastUsed:new Date().toISOString()  })
    .where(eq(staffPins.id, id));
}

/**
 * Create a new staff PIN
 */
export async function createStaffPin(pin: InsertStaffPin) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create staff PIN: database not available");
    return;
  }

  await db.insert(staffPins).values(pin);
}

/**
 * Get all staff PINs (active and inactive)
 */
export async function getAllStaffPins() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get staff PINs: database not available");
    return [];
  }

  const result = await db.select().from(staffPins);
  return result;
}

/**
 * Update a staff PIN
 */
export async function updateStaffPin(id: number, updates: Partial<InsertStaffPin>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update staff PIN: database not available");
    return;
  }

  await db.update(staffPins)
    .set(updates)
    .where(eq(staffPins.id, id));
}

/**
 * Toggle staff PIN active status
 */
export async function toggleStaffPinActive(id: number, isActive: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot toggle staff PIN: database not available");
    return;
  }

  await db.update(staffPins)
    .set({ isActive })
    .where(eq(staffPins.id, id));
}

/**
 * Delete a staff PIN
 */
export async function deleteStaffPin(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete staff PIN: database not available");
    return;
  }

  await db.delete(staffPins).where(eq(staffPins.id, id));
}


/**
 * CRM Dashboard Helper Functions
 */

// Get dashboard statistics
import { getDashboardAlerts } from "./alertsHelper";

export async function getDashboardStats(organizationId?: number | null) {
  const db = await getDb();
  if (!db) return null;
  
  // If no organization is provided, return zeros (no fake data for new accounts)
  if (!organizationId) {
    return {
      total_students: 0,
      monthly_revenue: 0,
      total_leads: 0,
      todays_classes: []
    };
  }
  
  const { students, leads, classes, attendance } = await import("../drizzle/schema");
  const { eq, count, and, gte, lte } = await import("drizzle-orm");
  
  // Filter by organization for multi-tenancy
  // Count ALL students for the organization (not just active) to match the Students page
  const studentCondition = eq(students.organizationId, organizationId);
  const leadCondition = eq(leads.organizationId, organizationId);
  const classCondition = and(eq(classes.isActive, 1), eq(classes.organizationId, organizationId));
  
  const totalStudents = await db.select({ count: count() }).from(students).where(studentCondition);
  const totalLeads = await db.select({ count: count() }).from(leads).where(leadCondition);
  const todaysClasses = await db.select().from(classes).where(classCondition).limit(10);
  
  const activeStudentsResult = await db.select({ count: count() }).from(students).where(
    and(
      eq(students.organizationId, organizationId),
      eq(students.status, 'Active')
    )
  );
  
  // Today's attendance (check-ins)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  
  const todayAttendanceResult = await db.select({ count: count() }).from(attendance).where(
    and(
      gte(attendance.checkInTime, todayStart.toISOString()),
      lte(attendance.checkInTime, todayEnd.toISOString()),
      eq(attendance.status, 'present')
    )
  );
  
  // New leads (today)
  const newLeadsResult = await db.select({ count: count() }).from(leads).where(
    and(
      eq(leads.organizationId, organizationId),
      gte(leads.createdAt, todayStart.toISOString())
    )
  );
  
  // New enrollments (approved, this week)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const { enrollments } = await import("../drizzle/schema");
  const newEnrollmentsResult = await db.select({ count: count() }).from(enrollments).where(
    and(
      eq(enrollments.status, 'approved'),
      gte(enrollments.createdAt, weekAgo.toISOString())
    )
  );
  
  // Trials scheduled (leads in trial_scheduled stage)
  const trialsScheduledResult = await db.select({ count: count() }).from(leads).where(
    and(
      eq(leads.organizationId, organizationId),
      eq(leads.stage, 'trial_scheduled')
    )
  );
  
  // Get alerts
  const alerts = await getDashboardAlerts(organizationId);
  
  return {
    total_students: totalStudents[0]?.count || 0,
    active_students: activeStudentsResult[0]?.count || 0,
    todays_attendance: todayAttendanceResult[0]?.count || 0,
    new_leads: newLeadsResult[0]?.count || 0,
    trials_scheduled: trialsScheduledResult[0]?.count || 0,
    new_enrollments: newEnrollmentsResult[0]?.count || 0,
    monthly_revenue: 12500, // TODO: Calculate from billing data
    total_leads: totalLeads[0]?.count || 0,
    alerts: alerts,
    todays_classes: todaysClasses.map(c => ({
      name: c.name,
      time: c.time,
      enrolled: c.enrolled
    }))
  };
}

// Get kiosk check-ins
export async function getKioskCheckIns() {
  const db = await getDb();
  if (!db) return [];
  
  const { kioskCheckIns } = await import("../drizzle/schema");
  const { gte } = await import("drizzle-orm");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkIns = await db.select().from(kioskCheckIns).where(gte(kioskCheckIns.timestamp, today));
  return checkIns;
}

// Get kiosk visitors
export async function getKioskVisitors() {
  const db = await getDb();
  if (!db) return [];
  
  const { kioskVisitors } = await import("../drizzle/schema");
  const { gte } = await import("drizzle-orm");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const visitors = await db.select().from(kioskVisitors).where(gte(kioskVisitors.timestamp, today));
  return visitors;
}

// Get kiosk waivers
export async function getKioskWaivers() {
  const db = await getDb();
  if (!db) return [];
  
  const { kioskWaivers } = await import("../drizzle/schema");
  const { gte } = await import("drizzle-orm");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const waivers = await db.select().from(kioskWaivers).where(gte(kioskWaivers.timestamp, today));
  return waivers;
}

// Search students by name, phone, or email
export async function searchStudents(query: string, organizationId?: number | null) {
  console.log('[searchStudents] Query:', query, 'OrgId:', organizationId);
  const db = await getDb();
  if (!db) {
    console.log('[searchStudents] Database not available');
    return [];
  }
  
  // If no organization is provided, return empty results (no fake data for new accounts)
  if (!organizationId) {
    console.log('[searchStudents] No organization, returning empty results');
    return [];
  }
  
  const { students } = await import("../drizzle/schema");
  const { or, like, sql, and, eq } = await import("drizzle-orm");
  
  const searchPattern = `%${query}%`;
  console.log('[searchStudents] Search pattern:', searchPattern);
  
  // Search conditions
  const searchConditions = or(
    like(students.firstName, searchPattern),
    like(students.lastName, searchPattern),
    like(students.email, searchPattern),
    like(students.phone, searchPattern),
    // Also search concatenated full name (handles "marcus johnson" queries)
    sql`CONCAT(${students.firstName}, ' ', ${students.lastName}) LIKE ${searchPattern}`
  );
  
  // Apply organization filter for multi-tenancy
  const whereCondition = and(eq(students.organizationId, organizationId), searchConditions);
  
  const results = await db.select().from(students).where(whereCondition).limit(10);
  
  console.log('[searchStudents] Results count:', results.length);
  if (results.length > 0) {
    console.log('[searchStudents] First result:', results[0].firstName, results[0].lastName);
  }
  
  return results;
}


/**
 * Student Portal Helper Functions
 */

// Get student by email for login
export async function getStudentByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  
  const { students, studentAccounts, beltProgress } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  // First try to find by student account email
  const accountResult = await db.select().from(studentAccounts).where(eq(studentAccounts.email, email)).limit(1);
  
  if (accountResult.length > 0) {
    const account = accountResult[0];
    // Get the student data
    const studentResult = await db.select().from(students).where(eq(students.id, account.studentId)).limit(1);
    if (studentResult.length > 0) {
      // Get belt progress
      const progressResult = await db.select().from(beltProgress).where(eq(beltProgress.studentId, account.studentId)).limit(1);
      return {
        account,
        student: studentResult[0],
        beltProgress: progressResult[0] || null
      };
    }
  }
  
  // Fallback: try to find by student email directly
  const studentResult = await db.select().from(students).where(eq(students.email, email)).limit(1);
  if (studentResult.length > 0) {
    const student = studentResult[0];
    const progressResult = await db.select().from(beltProgress).where(eq(beltProgress.studentId, student.id)).limit(1);
    return {
      account: null,
      student,
      beltProgress: progressResult[0] || null
    };
  }
  
  return null;
}

// Get student portal data by student ID
export async function getStudentPortalData(studentId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { students, beltProgress, studentAttendance, classEnrollments, classes, kioskCheckIns } = await import("../drizzle/schema");
  const { eq, desc, gte, and, sql } = await import("drizzle-orm");
  
  // Get student info
  const studentResult = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (studentResult.length === 0) return null;
  const student = studentResult[0];
  
  // Get or create belt progress
  let progress = await db.select().from(beltProgress).where(eq(beltProgress.studentId, studentId)).limit(1);
  if (progress.length === 0) {
    // Create default belt progress
    await db.insert(beltProgress).values({
      studentId,
      currentBelt: student.beltRank || 'White',
      nextBelt: getNextBelt(student.beltRank || 'White'),
      progressPercent: 0,
      qualifiedClasses: 0,
      classesRequired: 20,
      qualifiedAttendance: 0,
      attendanceRequired: 80,
      isEligible: 0
    });
    progress = await db.select().from(beltProgress).where(eq(beltProgress.studentId, studentId)).limit(1);
  }
  
  // Get attendance records for this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const attendanceRecords = await db.select()
    .from(studentAttendance)
    .where(and(
      eq(studentAttendance.studentId, studentId),
      gte(studentAttendance.classDate, startOfMonth)
    ))
    .orderBy(desc(studentAttendance.classDate))
    .limit(50);
  
  // Get check-ins from kiosk for this month
  let checkIns: Array<{ timestamp: Date | null }> = [];
  try {
    const checkInsResult = await db.select()
      .from(kioskCheckIns)
      .where(eq(kioskCheckIns.studentId, studentId))
      .orderBy(desc(kioskCheckIns.timestamp))
      .limit(50);
    // Filter by date in JS to avoid SQL date comparison issues
    checkIns = checkInsResult.filter(ci => {
      if (!ci.timestamp) return false;
      return new Date(ci.timestamp) >= startOfMonth;
    });
  } catch (e) {
    console.error('Error fetching check-ins:', e);
    checkIns = [];
  }
  
  // Get enrolled classes
  const enrollments = await db.select({
    enrollment: classEnrollments,
    class: classes
  })
    .from(classEnrollments)
    .leftJoin(classes, eq(classEnrollments.classId, classes.id))
    .where(and(
      eq(classEnrollments.studentId, studentId),
      eq(classEnrollments.status, 'active')
    ));
  
  // Calculate weekly training data
  const weeklyTraining = calculateWeeklyTraining(checkIns);
  
  // Get upcoming classes (next 7 days)
  const upcomingClasses = enrollments.map(e => ({
    id: e.class?.id,
    name: e.class?.name,
    time: e.class?.time,
    dayOfWeek: e.class?.dayOfWeek,
    instructor: e.class?.instructor
  })).filter(c => c.id);
  
  return {
    student,
    beltProgress: progress[0],
    attendanceRecords,
    checkInsThisMonth: checkIns.length,
    weeklyTraining,
    enrolledClasses: upcomingClasses
  };
}

// Helper to get next belt in progression
function getNextBelt(currentBelt: string): string {
  const beltOrder = ['White', 'Yellow', 'Orange', 'Green', 'Brown', 'Blue', 'Purple', 'Red', 'Black'];
  const currentIndex = beltOrder.findIndex(b => b.toLowerCase() === currentBelt.toLowerCase());
  if (currentIndex === -1 || currentIndex >= beltOrder.length - 1) {
    return currentBelt; // Already at highest or unknown belt
  }
  return beltOrder[currentIndex + 1];
}

// Helper to calculate weekly training data
function calculateWeeklyTraining(checkIns: Array<{ timestamp: Date | null }>) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);
  
  const weeklyData = days.map((day, index) => {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + index);
    
    const attended = checkIns.some(ci => {
      if (!ci.timestamp) return false;
      const checkInDate = new Date(ci.timestamp);
      return checkInDate.toDateString() === dayDate.toDateString();
    });
    
    const isToday = dayDate.toDateString() === today.toDateString();
    
    return { day, attended, isToday };
  });
  
  return weeklyData;
}

// Update belt progress after check-in
export async function updateBeltProgressAfterCheckIn(studentId: number) {
  const db = await getDb();
  if (!db) return;
  
  const { beltProgress, kioskCheckIns } = await import("../drizzle/schema");
  const { eq, gte, and, count } = await import("drizzle-orm");
  
  // Get current belt progress
  const progress = await db.select().from(beltProgress).where(eq(beltProgress.studentId, studentId)).limit(1);
  if (progress.length === 0) return;
  
  const currentProgress = progress[0];
  
  // Count check-ins since last promotion (or all time if no promotion)
  const sinceDate = currentProgress.lastPromotionDate || new Date('2000-01-01');
  
  const checkInCount = await db.select({ count: count() })
    .from(kioskCheckIns)
    .where(and(
      eq(kioskCheckIns.studentId, studentId),
      gte(kioskCheckIns.timestamp, sinceDate)
    ));
  
  const qualifiedClasses = checkInCount[0]?.count || 0;
  const classesRequired = currentProgress.classesRequired || 20;
  const progressPercent = Math.min(100, Math.round((qualifiedClasses / classesRequired) * 100));
  
  // Calculate attendance percentage (simplified - based on expected classes per month)
  const expectedClassesPerMonth = 12; // 3 classes per week
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const monthlyCheckIns = await db.select({ count: count() })
    .from(kioskCheckIns)
    .where(and(
      eq(kioskCheckIns.studentId, studentId),
      gte(kioskCheckIns.timestamp, startOfMonth)
    ));
  
  const monthlyCount = monthlyCheckIns[0]?.count || 0;
  const dayOfMonth = new Date().getDate();
  const expectedSoFar = Math.ceil((dayOfMonth / 30) * expectedClassesPerMonth);
  const qualifiedAttendance = expectedSoFar > 0 ? Math.min(100, Math.round((monthlyCount / expectedSoFar) * 100)) : 0;
  
  const isEligible = qualifiedAttendance >= (currentProgress.attendanceRequired || 80) && progressPercent >= 100;
  
  // Update belt progress
  await db.update(beltProgress)
    .set({ 
      qualifiedClasses,
      progressPercent,
      qualifiedAttendance,
      isEligible: isEligible ? 1 : 0,
      updatedAt:new Date().toISOString()
     })
    .where(eq(beltProgress.studentId, studentId));
}

// Get student attendance history
export async function getStudentAttendanceHistory(studentId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const { studentAttendance, kioskCheckIns } = await import("../drizzle/schema");
  const { eq, desc } = await import("drizzle-orm");
  
  // Get from student_attendance table
  const attendance = await db.select()
    .from(studentAttendance)
    .where(eq(studentAttendance.studentId, studentId))
    .orderBy(desc(studentAttendance.classDate))
    .limit(limit);
  
  // Also get from kiosk check-ins as backup
  const checkIns = await db.select()
    .from(kioskCheckIns)
    .where(eq(kioskCheckIns.studentId, studentId))
    .orderBy(desc(kioskCheckIns.timestamp))
    .limit(limit);
  
  return { attendance, checkIns };
}

// Create student portal account
export async function createStudentAccount(studentId: number, email: string, passwordHash: string) {
  const db = await getDb();
  if (!db) return null;
  
  const { studentAccounts } = await import("../drizzle/schema");
  
  await db.insert(studentAccounts).values({
    studentId,
    email,
    passwordHash,
    isActive: 1
  });
  
  return { success: true };
}

// Verify student login
export async function verifyStudentLogin(email: string, password: string) {
  const db = await getDb();
  if (!db) return null;
  
  const { studentAccounts, students, beltProgress } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const bcrypt = await import("bcryptjs");
  
  // Find account by email
  const accountResult = await db.select().from(studentAccounts).where(eq(studentAccounts.email, email)).limit(1);
  
  if (accountResult.length === 0) {
    return { success: false, error: 'Account not found' };
  }
  
  const account = accountResult[0];
  
  if (!account.isActive) {
    return { success: false, error: 'Account is inactive' };
  }
  
  // Verify password
  const isValid = await bcrypt.compare(password, account.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Invalid password' };
  }
  
  // Get student data
  const studentResult = await db.select().from(students).where(eq(students.id, account.studentId)).limit(1);
  if (studentResult.length === 0) {
    return { success: false, error: 'Student not found' };
  }
  
  // Get belt progress
  const progressResult = await db.select().from(beltProgress).where(eq(beltProgress.studentId, account.studentId)).limit(1);
  
  // Update last login
  await db.update(studentAccounts)
    .set({  lastLoginAt:new Date().toISOString()  })
    .where(eq(studentAccounts.id, account.id));
  
  return {
    success: true,
    student: studentResult[0],
    beltProgress: progressResult[0] || null
  };
}


// ============================================
// Belt Test Functions
// ============================================

// Get upcoming belt tests for a student's next belt level
export async function getUpcomingBeltTests(nextBelt: string) {
  const db = await getDb();
  if (!db) return [];
  
  const { beltTests } = await import("../drizzle/schema");
  const { eq, and, gte } = await import("drizzle-orm");
  
  const now = new Date();
  
  const tests = await db.select()
    .from(beltTests)
    .where(and(
      eq(beltTests.beltLevel, nextBelt),
      eq(beltTests.status, 'open'),
      gte(beltTests.testDate, now)
    ))
    .orderBy(beltTests.testDate);
  
  return tests;
}

// Get all upcoming belt tests (for admin view)
export async function getAllUpcomingBeltTests() {
  const db = await getDb();
  if (!db) return [];
  
  const { beltTests } = await import("../drizzle/schema");
  const { gte, desc } = await import("drizzle-orm");
  
  const now = new Date();
  
  const tests = await db.select()
    .from(beltTests)
    .where(gte(beltTests.testDate, now))
    .orderBy(beltTests.testDate);
  
  return tests;
}

// Get a single belt test by ID
export async function getBeltTestById(testId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { beltTests } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  const result = await db.select().from(beltTests).where(eq(beltTests.id, testId)).limit(1);
  return result[0] || null;
}

// Create a new belt test
export async function createBeltTest(data: {
  name: string;
  beltLevel: string;
  testDate: Date;
  startTime: string;
  endTime?: string;
  location: string;
  maxCapacity?: number;
  instructorId?: number;
  instructorName?: string;
  fee?: number;
  notes?: string;
  minAttendanceRequired?: number;
  minClassesRequired?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const { beltTests } = await import("../drizzle/schema");
  
  const result = await db.insert(beltTests).values({
    name: data.name,
    beltLevel: data.beltLevel,
    testDate: data.testDate,
    startTime: data.startTime,
    endTime: data.endTime,
    location: data.location,
    maxCapacity: data.maxCapacity || 20,
    instructorId: data.instructorId,
    instructorName: data.instructorName,
    fee: data.fee || 0,
    notes: data.notes,
    minAttendanceRequired: data.minAttendanceRequired || 80,
    minClassesRequired: data.minClassesRequired || 20,
    status: 'open'
  });
  
  return { id: result[0].insertId };
}

// Check if student is eligible for belt test registration
export async function checkBeltTestEligibility(studentId: number, testId: number) {
  const db = await getDb();
  if (!db) return { eligible: false, reason: 'Database error' };
  
  const { beltTests, beltProgress, beltTestRegistrations, students } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");
  
  // Get student info
  const studentResult = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (studentResult.length === 0) {
    return { eligible: false, reason: 'Student not found' };
  }
  const student = studentResult[0];
  
  // Get belt test info
  const testResult = await db.select().from(beltTests).where(eq(beltTests.id, testId)).limit(1);
  if (testResult.length === 0) {
    return { eligible: false, reason: 'Belt test not found' };
  }
  const test = testResult[0];
  
  // Check if test is still open
  if (test.status !== 'open') {
    return { eligible: false, reason: 'This belt test is no longer accepting registrations' };
  }
  
  // Check capacity
  if (test.currentRegistrations >= test.maxCapacity) {
    return { eligible: false, reason: 'This belt test is full' };
  }
  
  // Check if already registered
  const existingReg = await db.select()
    .from(beltTestRegistrations)
    .where(and(
      eq(beltTestRegistrations.testId, testId),
      eq(beltTestRegistrations.studentId, studentId),
      eq(beltTestRegistrations.status, 'registered')
    ))
    .limit(1);
  
  if (existingReg.length > 0) {
    return { eligible: false, reason: 'You are already registered for this test' };
  }
  
  // Get belt progress
  const progressResult = await db.select().from(beltProgress).where(eq(beltProgress.studentId, studentId)).limit(1);
  if (progressResult.length === 0) {
    return { eligible: false, reason: 'Belt progress not found. Please contact the front desk.' };
  }
  const progress = progressResult[0];
  
  // Check if testing for correct belt level
  if (progress.nextBelt !== test.beltLevel) {
    return { 
      eligible: false, 
      reason: `This test is for ${test.beltLevel} Belt. Your next belt is ${progress.nextBelt}.` 
    };
  }
  
  // Check attendance requirement
  if (progress.qualifiedAttendance < test.minAttendanceRequired) {
    return { 
      eligible: false, 
      reason: `Minimum ${test.minAttendanceRequired}% attendance required. Your current attendance: ${progress.qualifiedAttendance}%` 
    };
  }
  
  // Check class requirement
  if (progress.qualifiedClasses < test.minClassesRequired) {
    return { 
      eligible: false, 
      reason: `Minimum ${test.minClassesRequired} qualified classes required. Your current classes: ${progress.qualifiedClasses}` 
    };
  }
  
  return { 
    eligible: true, 
    student,
    test,
    progress
  };
}

// Register student for belt test
export async function registerForBeltTest(studentId: number, testId: number) {
  const db = await getDb();
  if (!db) return { success: false, error: 'Database error' };
  
  const { beltTests, beltTestRegistrations, beltProgress, students } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  // Check eligibility first
  const eligibility = await checkBeltTestEligibility(studentId, testId);
  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason };
  }
  
  // Get student and progress data
  const studentResult = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  const progressResult = await db.select().from(beltProgress).where(eq(beltProgress.studentId, studentId)).limit(1);
  
  const student = studentResult[0];
  const progress = progressResult[0];
  
  // Create registration
  const result = await db.insert(beltTestRegistrations).values({
    testId,
    studentId,
    studentName: `${student.firstName} ${student.lastName}`,
    currentBelt: progress.currentBelt,
    attendanceAtRegistration: progress.qualifiedAttendance,
    classesAtRegistration: progress.qualifiedClasses,
    status: 'registered',
    paymentStatus: 'pending'
  });
  
  // Update test registration count
  await db.update(beltTests)
    .set({  
      currentRegistrations: eligibility.test!.currentRegistrations + 1,
      updatedAt:new Date().toISOString()
     })
    .where(eq(beltTests.id, testId));
  
  return { 
    success: true, 
    registrationId: result[0].insertId 
  };
}

// Cancel belt test registration
export async function cancelBeltTestRegistration(studentId: number, testId: number) {
  const db = await getDb();
  if (!db) return { success: false, error: 'Database error' };
  
  const { beltTests, beltTestRegistrations } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");
  
  // Find the registration
  const regResult = await db.select()
    .from(beltTestRegistrations)
    .where(and(
      eq(beltTestRegistrations.testId, testId),
      eq(beltTestRegistrations.studentId, studentId),
      eq(beltTestRegistrations.status, 'registered')
    ))
    .limit(1);
  
  if (regResult.length === 0) {
    return { success: false, error: 'Registration not found' };
  }
  
  // Update registration status
  await db.update(beltTestRegistrations)
    .set({  
      status: 'cancelled',
      updatedAt:new Date().toISOString()
     })
    .where(eq(beltTestRegistrations.id, regResult[0].id));
  
  // Get test to update count
  const testResult = await db.select().from(beltTests).where(eq(beltTests.id, testId)).limit(1);
  if (testResult.length > 0) {
    await db.update(beltTests)
      .set({  
        currentRegistrations: Math.max(0, testResult[0].currentRegistrations - 1),
        updatedAt:new Date().toISOString()
       })
      .where(eq(beltTests.id, testId));
  }
  
  return { success: true };
}

// Get student's belt test registrations
export async function getStudentBeltTestRegistrations(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { beltTestRegistrations, beltTests } = await import("../drizzle/schema");
  const { eq, desc } = await import("drizzle-orm");
  
  const registrations = await db.select({
    registration: beltTestRegistrations,
    test: beltTests
  })
    .from(beltTestRegistrations)
    .leftJoin(beltTests, eq(beltTestRegistrations.testId, beltTests.id))
    .where(eq(beltTestRegistrations.studentId, studentId))
    .orderBy(desc(beltTestRegistrations.registeredAt));
  
  return registrations;
}

// Get registrations for a specific belt test (admin view)
export async function getBeltTestRegistrations(testId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { beltTestRegistrations, students } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  const registrations = await db.select({
    registration: beltTestRegistrations,
    student: students
  })
    .from(beltTestRegistrations)
    .leftJoin(students, eq(beltTestRegistrations.studentId, students.id))
    .where(eq(beltTestRegistrations.testId, testId));
  
  return registrations;
}


// ==================== Student Portal Messaging ====================

/**
 * Get all messages for a student (inbox)
 */
export async function getStudentMessages(studentId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(studentMessages)
      .where(eq(studentMessages.studentId, studentId))
      .orderBy(desc(studentMessages.createdAt));
    
    return result;
  } catch (error) {
    console.error("Error fetching student messages:", error);
    return [];
  }
}

/**
 * Get a single message by ID
 */
export async function getStudentMessageById(messageId: number, studentId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(studentMessages)
      .where(and(
        eq(studentMessages.id, messageId),
        eq(studentMessages.studentId, studentId)
      ))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error("Error fetching student message:", error);
    return null;
  }
}

/**
 * Get message thread (message and its replies)
 */
export async function getMessageThread(messageId: number, studentId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    // Get the original message and all replies
    const result = await db
      .select()
      .from(studentMessages)
      .where(and(
        eq(studentMessages.studentId, studentId),
        or(
          eq(studentMessages.id, messageId),
          eq(studentMessages.parentMessageId, messageId)
        )
      ))
      .orderBy(studentMessages.createdAt);
    
    return result;
  } catch (error) {
    console.error("Error fetching message thread:", error);
    return [];
  }
}

/**
 * Send a new message (from student)
 */
export async function sendStudentMessage(data: {
  studentId: number;
  subject?: string;
  content: string;
  parentMessageId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Get student name
    const student = await db
      .select({ firstName: students.firstName, lastName: students.lastName })
      .from(students)
      .where(eq(students.id, data.studentId))
      .limit(1);
    
    const studentName = student[0] 
      ? `${student[0].firstName} ${student[0].lastName}`
      : "Student";

    const result = await db.insert(studentMessages).values({
      studentId: data.studentId,
      senderType: "student",
      senderId: data.studentId,
      senderName: studentName,
      subject: data.subject || null,
      content: data.content,
      parentMessageId: data.parentMessageId || null,
      isRead: 0,
      priority: "normal",
    });

    return { success: true, messageId: result[0].insertId };
  } catch (error) {
    console.error("Error sending student message:", error);
    throw error;
  }
}

/**
 * Send a message from staff to student
 */
export async function sendStaffMessageToStudent(data: {
  studentId: number;
  staffId: number;
  staffName: string;
  subject?: string;
  content: string;
  parentMessageId?: number;
  priority?: "normal" | "high" | "urgent";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(studentMessages).values({
      studentId: data.studentId,
      senderType: "staff",
      senderId: data.staffId,
      senderName: data.staffName,
      subject: data.subject || null,
      content: data.content,
      parentMessageId: data.parentMessageId || null,
      isRead: 0,
      priority: data.priority || "normal",
    });

    return { success: true, messageId: result[0].insertId };
  } catch (error) {
    console.error("Error sending staff message:", error);
    throw error;
  }
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(messageId: number, studentId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(studentMessages)
      .set({  
        isRead: 1,
        readAt:new Date().toISOString()
       })
      .where(and(
        eq(studentMessages.id, messageId),
        eq(studentMessages.studentId, studentId)
      ));
    
    return true;
  } catch (error) {
    console.error("Error marking message as read:", error);
    return false;
  }
}

/**
 * Get unread message count for a student
 */
export async function getUnreadMessageCount(studentId: number) {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(studentMessages)
      .where(and(
        eq(studentMessages.studentId, studentId),
        eq(studentMessages.isRead, 0),
        eq(studentMessages.senderType, "staff") // Only count staff messages as unread
      ));
    
    return result[0]?.count || 0;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
}

/**
 * Get all students for staff messaging interface
 */
export async function getStudentsForMessaging() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        email: students.email,
        phone: students.phone,
        beltRank: students.beltRank,
        status: students.status,
        photoUrl: students.photoUrl,
      })
      .from(students)
      .where(eq(students.status, "Active"))
      .orderBy(students.lastName, students.firstName);
    
    return result;
  } catch (error) {
    console.error("Error fetching students for messaging:", error);
    return [];
  }
}

/**
 * Get message history between staff and a specific student
 */
export async function getStaffStudentMessageHistory(studentId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(studentMessages)
      .where(eq(studentMessages.studentId, studentId))
      .orderBy(desc(studentMessages.createdAt))
      .limit(100);
    
    return result;
  } catch (error) {
    console.error("Error fetching message history:", error);
    return [];
  }
}

/**
 * Delete a message (soft delete or hard delete based on requirements)
 */
export async function deleteStudentMessage(messageId: number, studentId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    // Only allow deleting messages sent by the student
    await db
      .delete(studentMessages)
      .where(and(
        eq(studentMessages.id, messageId),
        eq(studentMessages.studentId, studentId),
        eq(studentMessages.senderType, "student")
      ));
    
    return true;
  } catch (error) {
    console.error("Error deleting message:", error);
    return false;
  }
}


// ============================================
// STUDENT PASSWORD RESET HELPERS
// ============================================

import { studentPasswordResetTokens, studentPasswords } from "../drizzle/schema";
import crypto from "crypto";

/**
 * Generate a secure random token for password reset
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a password using SHA256 (for demo - use bcrypt in production)
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Verify a password against a hash
 */
export function verifyPasswordHash(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Create a password reset token for a student
 */
export async function createPasswordResetToken(studentId: number): Promise<{ token: string; expiresAt: Date } | null> {
  const db = await getDb();
  if (!db) return null;
  
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  
  try {
    // Invalidate any existing tokens for this student
    await db.update(studentPasswordResetTokens)
      .set({ used: 1 })
      .where(eq(studentPasswordResetTokens.studentId, studentId));
    
    // Create new token
    await db.insert(studentPasswordResetTokens).values({
      studentId,
      token,
      expiresAt,
      used: 0,
    });
    
    return { token, expiresAt };
  } catch (error) {
    console.error("Error creating reset token:", error);
    return null;
  }
}

/**
 * Validate a password reset token
 */
export async function validateResetToken(token: string): Promise<{ valid: boolean; studentId?: number; error?: string }> {
  const db = await getDb();
  if (!db) return { valid: false, error: "Database not available" };
  
  try {
    const [tokenRecord] = await db.select()
      .from(studentPasswordResetTokens)
      .where(eq(studentPasswordResetTokens.token, token))
      .limit(1);
    
    if (!tokenRecord) {
      return { valid: false, error: "Invalid or expired reset link" };
    }
    
    if (tokenRecord.used) {
      return { valid: false, error: "This reset link has already been used" };
    }
    
    if (new Date() > tokenRecord.expiresAt) {
      return { valid: false, error: "This reset link has expired" };
    }
    
    return { valid: true, studentId: tokenRecord.studentId };
  } catch (error) {
    console.error("Error validating token:", error);
    return { valid: false, error: "Failed to validate token" };
  }
}

/**
 * Reset a student's password using a valid token
 */
export async function resetStudentPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };
  
  // Validate the token first
  const validation = await validateResetToken(token);
  if (!validation.valid || !validation.studentId) {
    return { success: false, error: validation.error };
  }
  
  const passwordHash = hashPassword(newPassword);
  
  try {
    // Check if student already has a password record
    const [existingPassword] = await db.select()
      .from(studentPasswords)
      .where(eq(studentPasswords.studentId, validation.studentId))
      .limit(1);
    
    if (existingPassword) {
      // Update existing password
      await db.update(studentPasswords)
        .set({  passwordHash, lastChangedAt:new Date().toISOString()  })
        .where(eq(studentPasswords.studentId, validation.studentId));
    } else {
      // Create new password record
      await db.insert(studentPasswords).values({
        studentId: validation.studentId,
        passwordHash,
      });
    }
    
    // Mark token as used
    await db.update(studentPasswordResetTokens)
      .set({  used: 1, usedAt:new Date().toISOString()  })
      .where(eq(studentPasswordResetTokens.token, token));
    
    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Failed to reset password" };
  }
}

/**
 * Get student by ID for password reset
 */
export async function getStudentById(studentId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const [student] = await db.select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);
    
    return student || null;
  } catch (error) {
    console.error("Error getting student:", error);
    return null;
  }
}


/**
 * KIOSK DESIGNER DATABASE HELPERS
 */

/**
 * Get all kiosk devices for an organization
 */
// COMMENTED OUT: getKioskDevices
// export async function getKioskDevices(organizationId: number) {
//   const db = await getDb();
//   if (!db) return [];
//   
//   try {
//     const devices = await db.select()
//       .from(schema.kiosks) // TODO: kioskDevices
//       .where(eq(schema.kioskDevices.organizationId, organizationId));
//     
//     return devices;
//   } catch (error) {
//     console.error("Error getting kiosk devices:", error);
//     return [];
//   }
// }

/**
 * Get a single kiosk device by ID
 */
// COMMENTED OUT: getKioskDeviceById
// export async function getKioskDeviceById(deviceId: number) {
//   const db = await getDb();
//   if (!db) return null;
//   
//   try {
//     const [device] = await db.select()
//       .from(schema.kiosks) // TODO: kioskDevices
//       .where(eq(schema.kioskDevices.id, deviceId))
//       .limit(1);
//     
//     return device || null;
//   } catch (error) {
//     console.error("Error getting kiosk device:", error);
//     return null;
//   }
// }

/**
 * Create a new kiosk device
 */
// COMMENTED OUT: createKioskDevice
// export async function createKioskDevice(data: schema.InsertKioskDevice) {
//   const db = await getDb();
//   if (!db) return null;
//   
//   try {
//     const result = await db.insert(schema.kioskDevices).values(data);
//     const deviceId = (result as any).insertId;
//     return await getKioskDeviceById(deviceId);
//   } catch (error) {
//     console.error("Error creating kiosk device:", error);
//     return null;
//   }
// }

/**
 * Update kiosk device status
 */
// COMMENTED OUT: updateKioskDeviceStatus
// export async function updateKioskDeviceStatus(deviceId: number, status: string, onlineStatus: number = 0) {
//   const db = await getDb();
//   if (!db) return false;
//   
//   try {
//     await db.update(schema.kioskDevices)
//       .set({  
//         status: status as any,
//         onlineStatus,
//         lastSyncAt:new Date().toISOString(),
//         updatedAt:new Date().toISOString(),
//        })
//       .where(eq(schema.kioskDevices.id, deviceId));
//     
//     return true;
//   } catch (error) {
//     console.error("Error updating kiosk device status:", error);
//     return false;
//   }
// }

/**
 * Get all kiosk themes for an organization
 */
// COMMENTED OUT: getKioskThemes
// export async function getKioskThemes(organizationId: number) {
//   const db = await getDb();
//   if (!db) return [];
//   
//   try {
//     const themes = await db.select()
//       .from(schema.kioskLocations) // TODO: kioskThemes
//       .where(eq(schema.kioskThemes.organizationId, organizationId))
//       .orderBy(desc(schema.kioskThemes.isDefault), desc(schema.kioskThemes.updatedAt));
//     
//     return themes;
//   } catch (error) {
//     console.error("Error getting kiosk themes:", error);
//     return [];
//   }
// }

/**
 * Get a single kiosk theme by ID with its assets
 */
// COMMENTED OUT: getKioskThemeById
// export async function getKioskThemeById(themeId: number) {
//   const db = await getDb();
//   if (!db) return null;
//   
//   try {
//     const [theme] = await db.select()
//       .from(schema.kioskLocations) // TODO: kioskThemes
//       .where(eq(schema.kioskThemes.id, themeId))
//       .limit(1);
//     
//     if (!theme) return null;
//     
//     const assets = await db.select()
//       .from(schema.kioskThemeAssets)
//       .where(eq(schema.kioskThemeAssets.themeId, themeId));
//     
//     return { ...theme, assets };
//   } catch (error) {
//     console.error("Error getting kiosk theme:", error);
//     return null;
//   }
// }

/**
 * Create a new kiosk theme
 */
// COMMENTED OUT: createKioskTheme
// export async function createKioskTheme(data: schema.InsertKioskTheme) {
//   const db = await getDb();
//   if (!db) return null;
//   
//   try {
//     const result = await db.insert(schema.kioskThemes).values(data);
//     const themeId = (result as any).insertId;
//     return await getKioskThemeById(themeId);
//   } catch (error) {
//     console.error("Error creating kiosk theme:", error);
//     return null;
//   }
// }

/**
 * Update kiosk theme
 */
// COMMENTED OUT: updateKioskTheme
// export async function updateKioskTheme(themeId: number, data: Partial<schema.InsertKioskTheme>) {
//   const db = await getDb();
//   if (!db) return false;
//   
//   try {
//     await db.update(schema.kioskThemes)
//       .set({  ...data, updatedAt:new Date().toISOString()  })
//       .where(eq(schema.kioskThemes.id, themeId));
//     
//     return true;
//   } catch (error) {
//     console.error("Error updating kiosk theme:", error);
//     return false;
//   }
// }

/**
 * Delete a kiosk theme
 */
// COMMENTED OUT: deleteKioskTheme
// export async function deleteKioskTheme(themeId: number) {
//   const db = await getDb();
//   if (!db) return false;
//   
//   try {
//     // Delete assets first
//     await db.delete(schema.kioskThemeAssets)
//       .where(eq(schema.kioskThemeAssets.themeId, themeId));
//     
//     // Delete theme
//     await db.delete(schema.kioskThemes)
//       .where(eq(schema.kioskThemes.id, themeId));
//     
//     return true;
//   } catch (error) {
//     console.error("Error deleting kiosk theme:", error);
//     return false;
//   }
// }

/**
 * Set a theme as active (only one active per org)
 */
// COMMENTED OUT: setActiveKioskTheme
// export async function setActiveKioskTheme(organizationId: number, themeId: number) {
//   const db = await getDb();
//   if (!db) return false;
//   
//   try {
//     // Deactivate all themes for this org
//     await db.update(schema.kioskThemes)
//       .set({ isActive: 0 })
//       .where(eq(schema.kioskThemes.organizationId, organizationId));
//     
//     // Activate the selected theme
//     await db.update(schema.kioskThemes)
//       .set({  isActive: 1, updatedAt:new Date().toISOString()  })
//       .where(eq(schema.kioskThemes.id, themeId));
//     
//     return true;
//   } catch (error) {
//     console.error("Error setting active kiosk theme:", error);
//     return false;
//   }
// }

/**
 * Add or update theme assets
 */
// COMMENTED OUT: upsertKioskThemeAsset
// export async function upsertKioskThemeAsset(data: schema.InsertKioskThemeAsset) {
//   const db = await getDb();
//   if (!db) return null;
//   
//   try {
//     // Check if asset already exists
//     const [existing] = await db.select()
//       .from(schema.kioskThemeAssets)
//       .where(
//         eq(schema.kioskThemeAssets.themeId, data.themeId!) &&
//         eq(schema.kioskThemeAssets.assetType, data.assetType!)
//       )
//       .limit(1);
//     
//     if (existing) {
//       // Update existing asset
//       await db.update(schema.kioskThemeAssets)
//         .set({  ...data, updatedAt:new Date().toISOString()  })
//         .where(eq(schema.kioskThemeAssets.id, existing.id));
//       
//       return existing.id;
//     } else {
//       // Create new asset
//       const result = await db.insert(schema.kioskThemeAssets).values(data);
//       return (result as any).insertId;
//     }
//   } catch (error) {
//     console.error("Error upserting kiosk theme asset:", error);
//     return null;
//   }
// }

/**
 * Get active theme for a device
 */
// COMMENTED OUT: getActiveThemeForDevice
// export async function getActiveThemeForDevice(deviceId: number) {
//   const db = await getDb();
//   if (!db) return null;
//   
//   try {
//     const [assignment] = await db.select()
//       .from(schema.kioskAssignments)
//       .where(eq(schema.kioskAssignments.deviceId, deviceId))
//       .orderBy(desc(schema.kioskAssignments.assignedAt))
//       .limit(1);
//     
//     if (!assignment) return null;
//     
//     return await getKioskThemeById(assignment.themeId);
//   } catch (error) {
//     console.error("Error getting active theme for device:", error);
//     return null;
//   }
// }

/**
 * Create a kiosk deployment
 */
// COMMENTED OUT: createKioskDeployment
// export async function createKioskDeployment(data: schema.InsertKioskDeployment) {
//   const db = await getDb();
//   if (!db) return null;
//   
//   try {
//     const result = await db.insert(schema.kioskDeployments).values(data);
//     const deploymentId = (result as any).insertId;
//     
//     const [deployment] = await db.select()
//       .from(schema.kioskDeployments)
//       .where(eq(schema.kioskDeployments.id, deploymentId))
//       .limit(1);
//     
//     return deployment || null;
//   } catch (error) {
//     console.error("Error creating kiosk deployment:", error);
//     return null;
//   }
// }

/**
 * Get recent deployments for a device
 */
// COMMENTED OUT: getDeviceDeployments
// export async function getDeviceDeployments(deviceId: number, limit: number = 10) {
//   const db = await getDb();
//   if (!db) return [];
//   
//   try {
//     const deployments = await db.select()
//       .from(schema.kioskDeployments)
//       .where(eq(schema.kioskDeployments.deviceId, deviceId))
//       .orderBy(desc(schema.kioskDeployments.createdAt))
//       .limit(limit);
//     
//     return deployments;
//   } catch (error) {
//     console.error("Error getting device deployments:", error);
//     return [];
//   }
// }

/**
 * Create a kiosk schedule
 */
// COMMENTED OUT: createKioskSchedule
// export async function createKioskSchedule(data: schema.InsertKioskSchedule) {
//   const db = await getDb();
//   if (!db) return null;
//   
//   try {
//     const result = await db.insert(schema.kioskSchedules).values(data);
//     const scheduleId = (result as any).insertId;
//     
//     const [schedule] = await db.select()
//       .from(schema.kioskSchedules)
//       .where(eq(schema.kioskSchedules.id, scheduleId))
//       .limit(1);
//     
//     return schedule || null;
//   } catch (error) {
//     console.error("Error creating kiosk schedule:", error);
//     return null;
//   }
// }

/**
 * Get schedules for a theme
 */
// COMMENTED OUT: getThemeSchedules
// export async function getThemeSchedules(themeId: number) {
//   const db = await getDb();
//   if (!db) return [];
//   
//   try {
//     const schedules = await db.select()
//       .from(schema.kioskSchedules)
//       .where(eq(schema.kioskSchedules.themeId, themeId))
//       .orderBy(desc(schema.kioskSchedules.startDate));
//     
//     return schedules;
//   } catch (error) {
//     console.error("Error getting theme schedules:", error);
//     return [];
//   }
// }

/**
 * Update kiosk schedule
 */
// COMMENTED OUT: updateKioskSchedule
// export async function updateKioskSchedule(scheduleId: number, data: Partial<schema.InsertKioskSchedule>) {
//   const db = await getDb();
//   if (!db) return false;
//   
//   try {
//     await db.update(schema.kioskSchedules)
//       .set({  ...data, updatedAt:new Date().toISOString()  })
//       .where(eq(schema.kioskSchedules.id, scheduleId));
//     
//     return true;
//   } catch (error) {
//     console.error("Error updating kiosk schedule:", error);
//     return false;
//   }
// }

/**
 * Delete kiosk schedule
 */
// COMMENTED OUT: deleteKioskSchedule
// export async function deleteKioskSchedule(scheduleId: number) {
//   const db = await getDb();
//   if (!db) return false;
//   
//   try {
//     await db.delete(schema.kioskSchedules)
//       .where(eq(schema.kioskSchedules.id, scheduleId));
//     
//     return true;
//   } catch (error) {
//     console.error("Error deleting kiosk schedule:", error);
//     return false;
//   }
// }


/**
 * Kiosk Settings Helpers
 */
export async function getKioskSettingsByLocationSlug(kioskSlug: string): Promise<KioskSettings> {
  const db = await getDb();
  if (!db) return getDefaultKioskSettings();
  try {
    const result = await db.select().from(schema.locations).where(eq(schema.locations.kioskSlug, kioskSlug)).limit(1);
    if (result.length === 0) return getDefaultKioskSettings();
    const location = result[0];
    if (!location.kioskSettings) return getDefaultKioskSettings();
    try {
      const settings = typeof location.kioskSettings === 'string' ? JSON.parse(location.kioskSettings) : location.kioskSettings;
      return { ...getDefaultKioskSettings(), ...settings };
    } catch {
      return getDefaultKioskSettings();
    }
  } catch (error) {
    console.error("[Database] Failed to get kiosk settings:", error);
    return getDefaultKioskSettings();
  }
}

export async function getKioskSettingsByLocationId(locationId: number): Promise<KioskSettings> {
  const db = await getDb();
  if (!db) return getDefaultKioskSettings();
  try {
    const result = await db.select().from(schema.locations).where(eq(schema.locations.id, locationId)).limit(1);
    if (result.length === 0) return getDefaultKioskSettings();
    const location = result[0];
    if (!location.kioskSettings) return getDefaultKioskSettings();
    try {
      const settings = typeof location.kioskSettings === 'string' ? JSON.parse(location.kioskSettings) : location.kioskSettings;
      return { ...getDefaultKioskSettings(), ...settings };
    } catch {
      return getDefaultKioskSettings();
    }
  } catch (error) {
    console.error("[Database] Failed to get kiosk settings:", error);
    return getDefaultKioskSettings();
  }
}

export async function updateKioskSettings(locationId: number, settings: Partial<KioskSettings>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const currentSettings = await getKioskSettingsByLocationId(locationId);
    const mergedSettings: KioskSettings = {
      ...currentSettings,
      theme: settings.theme ? { ...currentSettings.theme, ...settings.theme } : currentSettings.theme,
      background: settings.background ? { ...currentSettings.background, ...settings.background } : currentSettings.background,
      appearance: settings.appearance ? { ...currentSettings.appearance, ...settings.appearance } : currentSettings.appearance,
    };
    await db.update(schema.locations).set({  kioskSettings: JSON.stringify(mergedSettings), updatedAt:new Date().toISOString()  }).where(eq(schema.locations.id, locationId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update kiosk settings:", error);
    return false;
  }
}

export async function updateKioskBackgroundImage(locationId: number, imageUrl: string, blur: number = 0, dim: number = 0): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.error('[DEBUG] updateKioskBackgroundImage - DB not available');
    return false;
  }
  try {
    console.log('[DEBUG] updateKioskBackgroundImage - START', { locationId, imageUrl, blur, dim });
    
    // Get raw settings from database without merging defaults
    const location = await db.select().from(schema.locations).where(eq(schema.locations.id, locationId)).limit(1);
    if (location.length === 0) {
      console.error('[DEBUG] updateKioskBackgroundImage - Location not found:', locationId);
      return false;
    }
    
    console.log('[DEBUG] updateKioskBackgroundImage - Current DB kioskSettings:', location[0].kioskSettings);
    
    let currentSettings: KioskSettings = getDefaultKioskSettings();
    if (location[0].kioskSettings) {
      try {
        const parsed = typeof location[0].kioskSettings === 'string' 
          ? JSON.parse(location[0].kioskSettings) 
          : location[0].kioskSettings;
        currentSettings = parsed;
      } catch (e) {
        console.error("[Database] Failed to parse settings:", e);
      }
    }
    
    const updatedSettings: KioskSettings = {
      ...currentSettings,
      background: {
        ...currentSettings.background,
        type: 'image',
        imageUrl,
        presetKey: null,
        blur: Math.min(Math.max(blur, 0), 24),
        dim: Math.min(Math.max(dim, 0), 70),
      }
    };
    
    console.log('[DEBUG] updateKioskBackgroundImage - Updated settings to save:', JSON.stringify(updatedSettings.background));
    
    const now = new Date().toISOString();
    await db.update(schema.locations).set({ kioskSettings: JSON.stringify(updatedSettings), updatedAt: now }).where(eq(schema.locations.id, locationId));
    
    console.log('[DEBUG] updateKioskBackgroundImage - DB update complete, updatedAt:', now);
    
    // Verify the write
    const verifyLocation = await db.select().from(schema.locations).where(eq(schema.locations.id, locationId)).limit(1);
    if (verifyLocation.length > 0) {
      console.log('[DEBUG] updateKioskBackgroundImage - VERIFICATION: DB now contains:', verifyLocation[0].kioskSettings);
    }
    
    return true;
  } catch (error) {
    console.error("[Database] Failed to update background image:", error);
    return false;
  }
}

export async function resetKioskBackground(locationId: number, presetKey: string = 'dojo-warm-lights'): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    // Get raw settings from database without merging defaults
    const location = await db.select().from(schema.locations).where(eq(schema.locations.id, locationId)).limit(1);
    if (location.length === 0) return false;
    
    let currentSettings: KioskSettings = getDefaultKioskSettings();
    if (location[0].kioskSettings) {
      try {
        const parsed = typeof location[0].kioskSettings === 'string' 
          ? JSON.parse(location[0].kioskSettings) 
          : location[0].kioskSettings;
        currentSettings = parsed;
      } catch (e) {
        console.error("[Database] Failed to parse settings:", e);
      }
    }
    
    const updatedSettings: KioskSettings = {
      ...currentSettings,
      background: {
        type: 'preset',
        presetKey,
        blur: 0,
        dim: 0,
        vignette: false,
      },
    };
    await db.update(schema.locations).set({  kioskSettings: JSON.stringify(updatedSettings), updatedAt:new Date().toISOString()  }).where(eq(schema.locations.id, locationId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to reset background:", error);
    return false;
  }
}

export async function updateKioskBackgroundEffects(locationId: number, blur: number, dim: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const location = await db.select().from(schema.locations).where(eq(schema.locations.id, locationId)).limit(1);
    if (location.length === 0) return false;
    
    let currentSettings: KioskSettings = getDefaultKioskSettings();
    if (location[0].kioskSettings) {
      try {
        const parsed = typeof location[0].kioskSettings === 'string' 
          ? JSON.parse(location[0].kioskSettings) 
          : location[0].kioskSettings;
        currentSettings = parsed;
      } catch (e) {
        console.error("[Database] Failed to parse settings:", e);
      }
    }
    
    const updatedSettings: KioskSettings = {
      ...currentSettings,
      background: {
        ...currentSettings.background,
        blur: Math.min(Math.max(blur, 0), 24),
        dim: Math.min(Math.max(dim, 0), 70),
      }
    };
    await db.update(schema.locations).set({  kioskSettings: JSON.stringify(updatedSettings), updatedAt:new Date().toISOString()  }).where(eq(schema.locations.id, locationId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update background effects:", error);
    return false;
  }
}

export async function updateLocationKioskTheme(locationId: number, mode: string, primaryColor: string, accentColor: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const currentSettings = await getKioskSettingsByLocationId(locationId);
    const updatedSettings: KioskSettings = {
      ...currentSettings,
      theme: { mode, primaryColor, accentColor }
    };
    await db.update(schema.locations).set({  kioskSettings: JSON.stringify(updatedSettings), updatedAt:new Date().toISOString()  }).where(eq(schema.locations.id, locationId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update theme:", error);
    return false;
  }
}


// ===== Kiosk Background Management =====

/**
 * Get all active preset backgrounds
 */
export async function getPresetBackgrounds() {
  const db = await getDb();
  if (!db) return [];
  try {
    const { presetBackgrounds } = await import("../drizzle/schema");
    const backgrounds = await db
      .select()
      .from(presetBackgrounds)
      .where(eq(presetBackgrounds.isActive, 1))
      .orderBy(presetBackgrounds.sortOrder);
    return backgrounds;
  } catch (error) {
    console.error("[Database] Failed to get preset backgrounds:", error);
    return [];
  }
}

/**
 * Get a specific preset background by key
 */
export async function getPresetBackgroundByKey(key: string) {
  const db = await getDb();
  if (!db) return null;
  try {
    const { presetBackgrounds } = await import("../drizzle/schema");
    const result = await db
      .select()
      .from(presetBackgrounds)
      .where(eq(presetBackgrounds.key, key))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get preset background:", error);
    return null;
  }
}

/**
 * Update location background settings
 */
export async function updateLocationBackground(
  locationId: number,
  backgroundSettings: {
    source: "preset" | "custom";
    presetKey?: string | null;
    customUrl?: string | null;
    blur?: number;
    dim?: number;
  }
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const currentSettings = await getKioskSettingsByLocationId(locationId);
    const updatedSettings: KioskSettings = {
      ...currentSettings,
      background: {
        type: backgroundSettings.source,
        presetKey: backgroundSettings.presetKey || null,
        imageUrl: backgroundSettings.customUrl || undefined,
        blur: backgroundSettings.blur ?? 0,
        dim: backgroundSettings.dim ?? 0,
        vignette: currentSettings.background?.vignette ?? false,
      },
    };
    await db
      .update(schema.locations)
      .set({ 
        kioskSettings: JSON.stringify(updatedSettings),
        updatedAt:new Date().toISOString(),
       })
      .where(eq(schema.locations.id, locationId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update background:", error);
    return false;
  }
}

/**
 * Map preset keys to actual image URLs
 */
function resolvePresetUrl(presetKey: string | null | undefined): string | undefined {
  if (!presetKey) return undefined;
  
  const presets: Record<string, string> = {
    'dojo-warm-lights': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80',
    'clean-modern-gym': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80',
    'kids-class-bright': 'https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=1920&q=80',
    'debug-neon': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1920&q=80', // Bright neon-like image for testing
  };
  
  return presets[presetKey] || presets['dojo-warm-lights'];
}

/**
 * Get location background with fallback logic
 * Returns: location background → org default → global default
 */
export async function getLocationBackgroundWithFallback(
  locationId: number,
  organizationId?: number | null
) {
  const db = await getDb();
  if (!db) {
    console.error('[DEBUG] getLocationBackgroundWithFallback - DB not available');
    return getDefaultKioskSettings().background;
  }

  try {
    console.log('[DEBUG] getLocationBackgroundWithFallback - START', { locationId, organizationId });
    
    // Get location's background settings (without defaults merged in)
    const location = await db.select().from(schema.locations).where(eq(schema.locations.id, locationId)).limit(1);
    
    if (location.length === 0) {
      console.log('[DEBUG] getLocationBackgroundWithFallback - Location not found:', locationId);
    } else {
      console.log('[DEBUG] getLocationBackgroundWithFallback - Location found, kioskSettings exists:', !!location[0].kioskSettings);
    }
    
    if (location.length > 0 && location[0].kioskSettings) {
      try {
        // Drizzle ORM returns json() fields as objects, not strings
        let settings = location[0].kioskSettings;
        if (typeof settings === 'string') {
          settings = JSON.parse(settings);
        }
        // Handle case where settings might be a stringified JSON (double-encoded)
        if (typeof settings === 'string') {
          settings = JSON.parse(settings);
        }
        
        console.log('[DEBUG] getLocationBackgroundWithFallback - Parsed settings keys:', Object.keys(settings));
        console.log('[DEBUG] getLocationBackgroundWithFallback - Full background object:', JSON.stringify(settings.background));
        
        // Priority: custom imageUrl first, then presetKey (resolved to URL), then default
        if (settings.background?.imageUrl) {
          console.log('[TRUTH_TRACE] getLocationBackgroundWithFallback - RETURNING custom imageUrl:', settings.background.imageUrl);
          console.log('[TRUTH_TRACE] getLocationBackgroundWithFallback - Full background:', JSON.stringify(settings.background));
          return settings.background;
        }
        if (settings.background?.presetKey) {
          const resolvedUrl = resolvePresetUrl(settings.background.presetKey);
          console.log('[TRUTH_TRACE] getLocationBackgroundWithFallback - RETURNING presetKey:', settings.background.presetKey, 'resolved to:', resolvedUrl);
          return {
            ...settings.background,
            imageUrl: resolvedUrl,
          };
        }
        
        console.log('[DEBUG] getLocationBackgroundWithFallback - No imageUrl or presetKey found, falling back');
      } catch (e) {
        console.error("[Database] Failed to parse location background:", e);
      }
    }

    // Fallback to org default if available
    if (organizationId) {
      console.log('[DEBUG] getLocationBackgroundWithFallback - Checking org settings for organizationId:', organizationId);
      const orgSettings = await getOrganizationKioskSettings(organizationId);
      if (orgSettings?.background?.imageUrl || orgSettings?.background?.presetKey) {
        console.log('[DEBUG] getLocationBackgroundWithFallback - RETURNING org background');
        return orgSettings.background;
      }
    }

    // Fallback to global default
    console.log('[DEBUG] getLocationBackgroundWithFallback - RETURNING global default');
    return getDefaultKioskSettings().background;
  } catch (error) {
    console.error("[Database] Failed to get background with fallback:", error);
    return getDefaultKioskSettings().background;
  }
}

/**
 * Get organization-level kiosk settings (if stored separately)
 * For now, returns null - can be extended if org-level settings are added
 */
async function getOrganizationKioskSettings(organizationId: number) {
  // TODO: Implement if organization-level kiosk settings table is added
  return null;
}

/**
 * Remove custom background and revert to preset
 */
export async function removeCustomBackground(locationId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const currentSettings = await getKioskSettingsByLocationId(locationId);
    const updatedSettings: KioskSettings = {
      ...currentSettings,
      background: {
        type: "preset",
        presetKey: "dojo-warm-lights", // Default preset
        blur: 0,
        dim: 0,
        vignette: false,
      },
    };
    await db
      .update(schema.locations)
      .set({ 
        kioskSettings: JSON.stringify(updatedSettings),
        updatedAt:new Date().toISOString(),
       })
      .where(eq(schema.locations.id, locationId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to remove custom background:", error);
    return false;
  }
}
