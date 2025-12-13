import { eq, desc, and, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, staffPins, InsertStaffPin, studentMessages, studentMessageAttachments, InsertStudentMessage, students } from "../drizzle/schema";
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
      updatedAt: new Date()
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
      updatedAt: new Date()
    })
    .where(eq(beltTestRegistrations.id, regResult[0].id));
  
  // Get test to update count
  const testResult = await db.select().from(beltTests).where(eq(beltTests.id, testId)).limit(1);
  if (testResult.length > 0) {
    await db.update(beltTests)
      .set({ 
        currentRegistrations: Math.max(0, testResult[0].currentRegistrations - 1),
        updatedAt: new Date()
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
        readAt: new Date()
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
