/**
 * SMS Reminder Router
 * 
 * tRPC procedures for managing SMS class reminders
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { 
  processClassReminders, 
  sendTestReminder, 
  getStudentReminderHistory,
  updateSmsPreferences 
} from "./classReminderService";

export const smsReminderRouter = router({
  /**
   * Manually trigger reminder processing (admin only)
   */
  processReminders: protectedProcedure
    .mutation(async () => {
      const result = await processClassReminders();
      return result;
    }),

  /**
   * Send a test SMS to verify Twilio configuration
   */
  sendTest: protectedProcedure
    .input(z.object({
      phoneNumber: z.string().min(10),
      studentName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await sendTestReminder(input.phoneNumber, input.studentName);
      return result;
    }),

  /**
   * Get reminder history for a student
   */
  getHistory: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      limit: z.number().optional().default(20),
    }))
    .query(async ({ input }) => {
      const history = await getStudentReminderHistory(input.studentId, input.limit);
      return history;
    }),

  /**
   * Get SMS preferences for a student
   */
  getPreferences: protectedProcedure
    .input(z.object({
      studentId: z.number(),
    }))
    .query(async ({ input }) => {
      const { getDb } = await import("./db");
      const { smsPreferences } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [prefs] = await db
        .select()
        .from(smsPreferences)
        .where(eq(smsPreferences.studentId, input.studentId))
        .limit(1);
      
      // Return defaults if no preferences set
      if (!prefs) {
        return {
          studentId: input.studentId,
          optedIn: true,
          classReminders: true,
          billingReminders: true,
          promotionalMessages: false,
          reminderHoursBefore: 24,
        };
      }
      
      return {
        studentId: prefs.studentId,
        optedIn: prefs.optedIn === 1,
        classReminders: prefs.classReminders === 1,
        billingReminders: prefs.billingReminders === 1,
        promotionalMessages: prefs.promotionalMessages === 1,
        reminderHoursBefore: prefs.reminderHoursBefore,
      };
    }),

  /**
   * Update SMS preferences for a student
   */
  updatePreferences: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      optedIn: z.boolean().optional(),
      classReminders: z.boolean().optional(),
      billingReminders: z.boolean().optional(),
      promotionalMessages: z.boolean().optional(),
      reminderHoursBefore: z.number().min(1).max(72).optional(),
    }))
    .mutation(async ({ input }) => {
      const { studentId, ...preferences } = input;
      const success = await updateSmsPreferences(studentId, preferences);
      return { success };
    }),

  /**
   * Enroll a student in a class with SMS reminders
   */
  enrollInClass: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      classId: z.number(),
      smsRemindersEnabled: z.boolean().optional().default(true),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { classEnrollments } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if already enrolled
      const [existing] = await db
        .select()
        .from(classEnrollments)
        .where(and(
          eq(classEnrollments.studentId, input.studentId),
          eq(classEnrollments.classId, input.classId)
        ))
        .limit(1);
      
      if (existing) {
        // Update existing enrollment
        await db
          .update(classEnrollments)
          .set({
            status: 'active',
            smsRemindersEnabled: input.smsRemindersEnabled ? 1 : 0,
          })
          .where(eq(classEnrollments.id, existing.id));
        
        return { success: true, action: 'updated' };
      }
      
      // Create new enrollment
      await db.insert(classEnrollments).values({
        studentId: input.studentId,
        classId: input.classId,
        smsRemindersEnabled: input.smsRemindersEnabled ? 1 : 0,
        status: 'active',
      });
      
      return { success: true, action: 'created' };
    }),

  /**
   * Update class enrollment SMS reminder setting
   */
  updateEnrollmentReminders: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      classId: z.number(),
      smsRemindersEnabled: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { classEnrollments } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(classEnrollments)
        .set({ smsRemindersEnabled: input.smsRemindersEnabled ? 1 : 0 })
        .where(and(
          eq(classEnrollments.studentId, input.studentId),
          eq(classEnrollments.classId, input.classId)
        ));
      
      return { success: true };
    }),

  /**
   * Get all class enrollments for a student
   */
  getStudentEnrollments: protectedProcedure
    .input(z.object({
      studentId: z.number(),
    }))
    .query(async ({ input }) => {
      const { getDb } = await import("./db");
      const { classEnrollments, classes } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const enrollments = await db
        .select({
          enrollment: classEnrollments,
          class: classes,
        })
        .from(classEnrollments)
        .innerJoin(classes, eq(classEnrollments.classId, classes.id))
        .where(eq(classEnrollments.studentId, input.studentId));
      
      return enrollments.map(e => ({
        id: e.enrollment.id,
        classId: e.class.id,
        className: e.class.name,
        classTime: e.class.time,
        dayOfWeek: e.class.dayOfWeek,
        instructor: e.class.instructor,
        smsRemindersEnabled: e.enrollment.smsRemindersEnabled === 1,
        status: e.enrollment.status,
      }));
    }),

  /**
   * Unenroll a student from a class
   */
  unenrollFromClass: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      classId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { classEnrollments } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(classEnrollments)
        .set({ status: 'cancelled' })
        .where(and(
          eq(classEnrollments.studentId, input.studentId),
          eq(classEnrollments.classId, input.classId)
        ));
      
      return { success: true };
    }),

  /**
   * Get all available classes for enrollment
   */
  getAvailableClasses: publicProcedure
    .query(async () => {
      const { getDb } = await import("./db");
      const { classes } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const availableClasses = await db
        .select()
        .from(classes)
        .where(eq(classes.isActive, 1));
      
      return availableClasses;
    }),

  /**
   * Get reminder stats (admin dashboard)
   */
  getStats: protectedProcedure
    .query(async () => {
      const { getDb } = await import("./db");
      const { classReminders } = await import("../drizzle/schema");
      const { eq, gte, sql } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get stats for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const stats = await db
        .select({
          status: classReminders.status,
          count: sql<number>`COUNT(*)`,
        })
        .from(classReminders)
        .where(gte(classReminders.createdAt, thirtyDaysAgo))
        .groupBy(classReminders.status);
      
      const result = {
        sent: 0,
        failed: 0,
        pending: 0,
        delivered: 0,
        total: 0,
      };
      
      for (const row of stats) {
        const count = Number(row.count);
        result[row.status as keyof typeof result] = count;
        result.total += count;
      }
      
      return result;
    }),
});
