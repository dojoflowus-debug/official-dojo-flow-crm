/**
 * Class Reminder Service
 * 
 * Handles sending SMS reminders to students 24 hours before their classes.
 * Uses Twilio for SMS delivery and tracks sent reminders in the database.
 */

import { getDb } from "./db";
import { 
  classReminders, 
  classEnrollments, 
  classes, 
  students, 
  smsPreferences 
} from "../drizzle/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { sendSMS } from "./_core/twilio";

interface ReminderResult {
  success: boolean;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

/**
 * Get the next occurrence of a class based on day of week and time
 */
function getNextClassDate(dayOfWeek: string, timeStr: string): Date {
  const daysMap: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };

  const targetDay = daysMap[dayOfWeek];
  if (targetDay === undefined) {
    throw new Error(`Invalid day of week: ${dayOfWeek}`);
  }

  const now = new Date();
  const currentDay = now.getDay();
  
  // Calculate days until next occurrence
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) {
    daysUntil += 7;
  } else if (daysUntil === 0) {
    // Check if the class time has passed today
    const [hours, minutes] = parseTime(timeStr);
    const classTimeToday = new Date(now);
    classTimeToday.setHours(hours, minutes, 0, 0);
    
    if (now > classTimeToday) {
      daysUntil = 7; // Next week
    }
  }

  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntil);
  
  // Set the class time
  const [hours, minutes] = parseTime(timeStr);
  nextDate.setHours(hours, minutes, 0, 0);
  
  return nextDate;
}

/**
 * Parse time string like "6:00 PM" or "18:00" to hours and minutes
 */
function parseTime(timeStr: string): [number, number] {
  // Handle 12-hour format (e.g., "6:00 PM")
  const match12h = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match12h) {
    let hours = parseInt(match12h[1], 10);
    const minutes = parseInt(match12h[2], 10);
    const period = match12h[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return [hours, minutes];
  }
  
  // Handle 24-hour format (e.g., "18:00")
  const match24h = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match24h) {
    return [parseInt(match24h[1], 10), parseInt(match24h[2], 10)];
  }
  
  throw new Error(`Unable to parse time: ${timeStr}`);
}

/**
 * Format date for SMS message
 */
function formatClassDateTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Check if a reminder has already been sent for this student/class/date combination
 */
async function hasReminderBeenSent(
  studentId: number,
  classId: number,
  classDate: Date
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Create a date range for the class date (same day)
  const startOfDay = new Date(classDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(classDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  const existing = await db
    .select()
    .from(classReminders)
    .where(
      and(
        eq(classReminders.studentId, studentId),
        eq(classReminders.classId, classId),
        gte(classReminders.classDate, startOfDay),
        lte(classReminders.classDate, endOfDay)
      )
    )
    .limit(1);
  
  return existing.length > 0;
}

/**
 * Get student's SMS preferences
 */
async function getStudentSmsPreferences(studentId: number): Promise<{
  optedIn: boolean;
  classReminders: boolean;
  reminderHoursBefore: number;
} | null> {
  const db = await getDb();
  if (!db) return null;
  
  const prefs = await db
    .select()
    .from(smsPreferences)
    .where(eq(smsPreferences.studentId, studentId))
    .limit(1);
  
  if (prefs.length === 0) {
    // Default preferences if none set
    return {
      optedIn: true,
      classReminders: true,
      reminderHoursBefore: 24
    };
  }
  
  return {
    optedIn: prefs[0].optedIn === 1,
    classReminders: prefs[0].classReminders === 1,
    reminderHoursBefore: prefs[0].reminderHoursBefore
  };
}

/**
 * Send a class reminder SMS to a student
 */
async function sendClassReminderSMS(
  student: { id: number; firstName: string; phone: string | null },
  classInfo: { id: number; name: string; time: string; dayOfWeek: string | null },
  classDate: Date
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!student.phone) {
    return { success: false, error: 'Student has no phone number' };
  }
  
  const formattedDateTime = formatClassDateTime(classDate);
  const message = `Hi ${student.firstName}! 🥋 Reminder: Your ${classInfo.name} class is tomorrow at ${formattedDateTime}. See you on the mat! - DojoFlow`;
  
  const result = await sendSMS({
    to: student.phone,
    body: message
  });
  
  return result;
}

/**
 * Process and send reminders for all upcoming classes
 * This should be called periodically (e.g., every hour) by a background job
 */
export async function processClassReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    success: true,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
  
  const db = await getDb();
  if (!db) {
    result.success = false;
    result.errors.push('Database not initialized');
    return result;
  }
  
  console.log('[ClassReminder] Starting reminder processing...');
  
  try {
    // Get all active classes
    const activeClasses = await db
      .select()
      .from(classes)
      .where(eq(classes.isActive, 1));
    
    console.log(`[ClassReminder] Found ${activeClasses.length} active classes`);
    
    const now = new Date();
    
    for (const classInfo of activeClasses) {
      if (!classInfo.dayOfWeek) continue;
      
      // Calculate the next occurrence of this class
      const nextClassDate = getNextClassDate(classInfo.dayOfWeek, classInfo.time);
      
      // Check if the class is within the reminder window (24 hours)
      const hoursUntilClass = (nextClassDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Only send reminders for classes 23-25 hours away (to account for job timing)
      if (hoursUntilClass < 23 || hoursUntilClass > 25) {
        continue;
      }
      
      console.log(`[ClassReminder] Processing class: ${classInfo.name} at ${nextClassDate}`);
      
      // Get all enrolled students for this class
      const enrollments = await db
        .select({
          enrollment: classEnrollments,
          student: students
        })
        .from(classEnrollments)
        .innerJoin(students, eq(classEnrollments.studentId, students.id))
        .where(
          and(
            eq(classEnrollments.classId, classInfo.id),
            eq(classEnrollments.status, 'active'),
            eq(classEnrollments.smsRemindersEnabled, 1)
          )
        );
      
      console.log(`[ClassReminder] Found ${enrollments.length} enrolled students for ${classInfo.name}`);
      
      for (const { student } of enrollments) {
        // Check SMS preferences
        const prefs = await getStudentSmsPreferences(student.id);
        if (!prefs || !prefs.optedIn || !prefs.classReminders) {
          result.skipped++;
          continue;
        }
        
        // Check if reminder already sent
        const alreadySent = await hasReminderBeenSent(student.id, classInfo.id, nextClassDate);
        if (alreadySent) {
          result.skipped++;
          continue;
        }
        
        // Check if student has a phone number
        if (!student.phone) {
          result.skipped++;
          continue;
        }
        
        // Create reminder record (pending)
        const [reminderRecord] = await db
          .insert(classReminders)
          .values({
            studentId: student.id,
            classId: classInfo.id,
            classDate: nextClassDate,
            phoneNumber: student.phone,
            status: 'pending'
          });
        
        const reminderId = reminderRecord.insertId;
        
        // Send the SMS
        const smsResult = await sendClassReminderSMS(student, classInfo, nextClassDate);
        
        // Update reminder record with result
        if (smsResult.success) {
          await db
            .update(classReminders)
            .set({
              status: 'sent',
              twilioMessageId: smsResult.messageId,
              sentAt: new Date()
            })
            .where(eq(classReminders.id, Number(reminderId)));
          
          result.sent++;
          console.log(`[ClassReminder] Sent reminder to ${student.firstName} (${student.phone})`);
        } else {
          await db
            .update(classReminders)
            .set({
              status: 'failed',
              errorMessage: smsResult.error
            })
            .where(eq(classReminders.id, Number(reminderId)));
          
          result.failed++;
          result.errors.push(`Failed to send to ${student.firstName}: ${smsResult.error}`);
          console.error(`[ClassReminder] Failed to send to ${student.firstName}: ${smsResult.error}`);
        }
      }
    }
    
    console.log(`[ClassReminder] Processing complete. Sent: ${result.sent}, Failed: ${result.failed}, Skipped: ${result.skipped}`);
    
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    console.error('[ClassReminder] Error processing reminders:', error);
  }
  
  return result;
}

/**
 * Send a test reminder to verify Twilio configuration
 */
export async function sendTestReminder(
  phoneNumber: string,
  studentName: string = 'Test Student'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `Hi ${studentName}! 🥋 This is a test reminder from DojoFlow. Your SMS notifications are working correctly!`;
  
  return sendSMS({
    to: phoneNumber,
    body: message
  });
}

/**
 * Get reminder history for a student
 */
export async function getStudentReminderHistory(
  studentId: number,
  limit: number = 20
): Promise<Array<{
  id: number;
  classId: number;
  classDate: Date;
  status: string;
  sentAt: Date | null;
}>> {
  const db = await getDb();
  if (!db) return [];
  
  const reminders = await db
    .select({
      id: classReminders.id,
      classId: classReminders.classId,
      classDate: classReminders.classDate,
      status: classReminders.status,
      sentAt: classReminders.sentAt
    })
    .from(classReminders)
    .where(eq(classReminders.studentId, studentId))
    .orderBy(classReminders.createdAt)
    .limit(limit);
  
  return reminders;
}

/**
 * Update student's SMS preferences
 */
export async function updateSmsPreferences(
  studentId: number,
  preferences: {
    optedIn?: boolean;
    classReminders?: boolean;
    billingReminders?: boolean;
    promotionalMessages?: boolean;
    reminderHoursBefore?: number;
  }
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    // Check if preferences exist
    const existing = await db
      .select()
      .from(smsPreferences)
      .where(eq(smsPreferences.studentId, studentId))
      .limit(1);
    
    const values: any = {};
    if (preferences.optedIn !== undefined) values.optedIn = preferences.optedIn ? 1 : 0;
    if (preferences.classReminders !== undefined) values.classReminders = preferences.classReminders ? 1 : 0;
    if (preferences.billingReminders !== undefined) values.billingReminders = preferences.billingReminders ? 1 : 0;
    if (preferences.promotionalMessages !== undefined) values.promotionalMessages = preferences.promotionalMessages ? 1 : 0;
    if (preferences.reminderHoursBefore !== undefined) values.reminderHoursBefore = preferences.reminderHoursBefore;
    
    if (existing.length === 0) {
      // Create new preferences
      await db.insert(smsPreferences).values({
        studentId,
        ...values
      });
    } else {
      // Update existing preferences
      await db
        .update(smsPreferences)
        .set(values)
        .where(eq(smsPreferences.studentId, studentId));
    }
    
    return true;
  } catch (error) {
    console.error('[ClassReminder] Error updating SMS preferences:', error);
    return false;
  }
}
