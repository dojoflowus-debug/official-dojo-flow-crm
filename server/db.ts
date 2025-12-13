import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, staffPins, InsertStaffPin } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
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
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
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
    .set({ lastUsed: new Date() })
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
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  
  const { students, leads, classes } = await import("../drizzle/schema");
  const { eq, count } = await import("drizzle-orm");
  
  const totalStudents = await db.select({ count: count() }).from(students).where(eq(students.status, 'Active'));
  const totalLeads = await db.select({ count: count() }).from(leads);
  const todaysClasses = await db.select().from(classes).where(eq(classes.isActive, 1)).limit(10);
  
  return {
    total_students: totalStudents[0]?.count || 0,
    monthly_revenue: 12500, // TODO: Calculate from billing data
    total_leads: totalLeads[0]?.count || 0,
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
export async function searchStudents(query: string) {
  const db = await getDb();
  if (!db) return [];
  
  const { students } = await import("../drizzle/schema");
  const { or, like } = await import("drizzle-orm");
  
  const searchPattern = `%${query}%`;
  const results = await db.select().from(students).where(
    or(
      like(students.firstName, searchPattern),
      like(students.lastName, searchPattern),
      like(students.email, searchPattern),
      like(students.phone, searchPattern)
    )
  ).limit(10);
  
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
      updatedAt: new Date()
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
    .set({ lastLoginAt: new Date() })
    .where(eq(studentAccounts.id, account.id));
  
  return {
    success: true,
    student: studentResult[0],
    beltProgress: progressResult[0] || null
  };
}
