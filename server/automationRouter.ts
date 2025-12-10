import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { automationSequences, automationSteps, automationEnrollments, leads, students } from "../drizzle/schema";
import { getAvailableTemplates, installAutomationTemplate } from "./services/installAutomationTemplate";
import { eq, and } from "drizzle-orm";

export const automationRouter = router({
  // Get all sequences
  getAll: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const sequences = await db.select().from(automationSequences).orderBy(automationSequences.createdAt);
      return sequences;
    }),

  // Get single sequence with steps
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [sequence] = await db.select()
        .from(automationSequences)
        .where(eq(automationSequences.id, input.id))
        .limit(1);
      
      if (!sequence) throw new Error("Sequence not found");
      
      const steps = await db.select()
        .from(automationSteps)
        .where(eq(automationSteps.sequenceId, input.id))
        .orderBy(automationSteps.stepOrder);
      
      return { ...sequence, steps };
    }),

  // Create sequence
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      trigger: z.enum([
        "new_lead",
        "trial_scheduled",
        "trial_completed",
        "trial_no_show",
        "enrollment",
        "missed_class",
        "inactive_student",
        "renewal_due",
        "custom"
      ]),
      triggerConditions: z.any().optional(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [sequence] = await db.insert(automationSequences).values({
        name: input.name,
        description: input.description,
        trigger: input.trigger,
        triggerConditions: input.triggerConditions ? JSON.stringify(input.triggerConditions) : null,
        isActive: input.isActive ? 1 : 0,
        createdBy: ctx.user.id,
      });
      
      return { id: sequence.insertId };
    }),

  // Update sequence
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.isActive !== undefined) updateData.isActive = input.isActive ? 1 : 0;
      
      await db.update(automationSequences)
        .set(updateData)
        .where(eq(automationSequences.id, input.id));
      
      return { success: true };
    }),

  // Delete sequence
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Delete enrollments
      await db.delete(automationEnrollments).where(eq(automationEnrollments.sequenceId, input.id));
      
      // Delete steps
      await db.delete(automationSteps).where(eq(automationSteps.sequenceId, input.id));
      
      // Delete sequence
      await db.delete(automationSequences).where(eq(automationSequences.id, input.id));
      
      return { success: true };
    }),

  // Add step to sequence
  addStep: protectedProcedure
    .input(z.object({
      sequenceId: z.number(),
      stepOrder: z.number(),
      stepType: z.enum(["wait", "send_sms", "send_email", "condition", "end"]),
      name: z.string().optional(),
      waitMinutes: z.number().optional(),
      subject: z.string().optional(),
      message: z.string().optional(),
      condition: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [step] = await db.insert(automationSteps).values({
        sequenceId: input.sequenceId,
        stepOrder: input.stepOrder,
        stepType: input.stepType,
        name: input.name,
        waitMinutes: input.waitMinutes,
        subject: input.subject,
        message: input.message,
        condition: input.condition ? JSON.stringify(input.condition) : null,
      });
      
      return { id: step.insertId };
    }),

  // Update step
  updateStep: protectedProcedure
    .input(z.object({
      id: z.number(),
      stepOrder: z.number().optional(),
      name: z.string().optional(),
      waitMinutes: z.number().optional(),
      subject: z.string().optional(),
      message: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const updateData: any = {};
      if (input.stepOrder !== undefined) updateData.stepOrder = input.stepOrder;
      if (input.name !== undefined) updateData.name = input.name;
      if (input.waitMinutes !== undefined) updateData.waitMinutes = input.waitMinutes;
      if (input.subject !== undefined) updateData.subject = input.subject;
      if (input.message !== undefined) updateData.message = input.message;
      
      await db.update(automationSteps)
        .set(updateData)
        .where(eq(automationSteps.id, input.id));
      
      return { success: true };
    }),

  // Delete step
  deleteStep: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(automationSteps).where(eq(automationSteps.id, input.id));
      
      return { success: true };
    }),

  // Get enrollments for a sequence
  getEnrollments: protectedProcedure
    .input(z.object({ sequenceId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const enrollments = await db.select()
        .from(automationEnrollments)
        .where(eq(automationEnrollments.sequenceId, input.sequenceId))
        .orderBy(automationEnrollments.enrolledAt);
      
      return enrollments;
    }),

  // Enroll someone in a sequence
  enroll: protectedProcedure
    .input(z.object({
      sequenceId: z.number(),
      enrolledType: z.enum(["lead", "student"]),
      enrolledId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get first step of sequence
      const [firstStep] = await db.select()
        .from(automationSteps)
        .where(eq(automationSteps.sequenceId, input.sequenceId))
        .orderBy(automationSteps.stepOrder)
        .limit(1);
      
      // Calculate next execution time based on first step
      let nextExecutionAt = new Date();
      if (firstStep && firstStep.stepType === "wait" && firstStep.waitMinutes) {
        nextExecutionAt = new Date(Date.now() + firstStep.waitMinutes * 60 * 1000);
      }
      
      const [enrollment] = await db.insert(automationEnrollments).values({
        sequenceId: input.sequenceId,
        enrolledType: input.enrolledType,
        enrolledId: input.enrolledId,
        currentStepId: firstStep?.id || null,
        status: "active",
        nextExecutionAt,
      });
      
      // Update sequence enrollment count
      await db.update(automationSequences)
        .set({
          enrollmentCount: (await db.select().from(automationEnrollments)
            .where(eq(automationEnrollments.sequenceId, input.sequenceId))).length,
        })
        .where(eq(automationSequences.id, input.sequenceId));
      
      return { id: enrollment.insertId };
    }),

  // Unenroll someone from a sequence
  unenroll: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(automationEnrollments)
        .set({ status: "cancelled" })
        .where(eq(automationEnrollments.id, input.enrollmentId));
      
      return { success: true };
    }),

  // Get automation statistics
  getStats: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const sequences = await db.select().from(automationSequences);
      const enrollments = await db.select().from(automationEnrollments);
      
      const stats = {
        totalSequences: sequences.length,
        activeSequences: sequences.filter(s => s.isActive === 1).length,
        totalEnrollments: enrollments.length,
        activeEnrollments: enrollments.filter(e => e.status === "active").length,
        completedEnrollments: enrollments.filter(e => e.status === "completed").length,
      };
      
      return stats;
    }),

  // Get available templates
  getTemplates: protectedProcedure
    .query(async () => {
      const templates = await getAvailableTemplates();
      return templates;
    }),

  // Install a template
  installTemplate: protectedProcedure
    .input(z.object({
      templateName: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await installAutomationTemplate(input.templateName, ctx.user.id);
      return result;
    }),

  // Send automation immediately (skip wait times)
  sendNow: protectedProcedure
    .input(z.object({
      sequenceId: z.number(),
      enrolledType: z.enum(["lead", "student"]),
      enrolledId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get sequence with all steps
      const [sequence] = await db.select()
        .from(automationSequences)
        .where(eq(automationSequences.id, input.sequenceId))
        .limit(1);
      
      if (!sequence) throw new Error("Sequence not found");
      
      const steps = await db.select()
        .from(automationSteps)
        .where(eq(automationSteps.sequenceId, input.sequenceId))
        .orderBy(automationSteps.stepOrder);
      
      if (steps.length === 0) throw new Error("No steps found in sequence");
      
      // Get lead/student data
      let recipientData: any;
      if (input.enrolledType === "lead") {
        const [lead] = await db.select()
          .from(leads)
          .where(eq(leads.id, input.enrolledId))
          .limit(1);
        recipientData = lead;
      } else {
        const [student] = await db.select()
          .from(students)
          .where(eq(students.id, input.enrolledId))
          .limit(1);
        recipientData = student;
      }
      
      if (!recipientData) throw new Error("Recipient not found");
      
      // Import automation engine functions
      const { replaceVariables } = await import("./services/automationEngine.js");
      const { sendSMS } = await import("./services/twilio.js");
      const { sendEmail } = await import("./services/sendgrid.js");
      
      let sentCount = 0;
      const errors: string[] = [];
      
      // Execute all steps immediately (skip wait steps)
      for (const step of steps) {
        if (step.stepType === "wait" || step.stepType === "end") {
          continue; // Skip wait and end steps
        }
        
        try {
          if (step.stepType === "send_sms" && step.message) {
            const message = await replaceVariables(step.message, recipientData);
            await sendSMS(recipientData.phone, message);
            sentCount++;
          } else if (step.stepType === "send_email" && step.message && step.subject) {
            const subject = await replaceVariables(step.subject, recipientData);
            const message = await replaceVariables(step.message, recipientData);
            await sendEmail(recipientData.email, subject, message);
            sentCount++;
          }
        } catch (error: any) {
          errors.push(`Step ${step.stepOrder}: ${error.message}`);
        }
      }
      
      if (errors.length > 0) {
        throw new Error(`Sent ${sentCount} messages with ${errors.length} errors: ${errors.join(", ")}`);
      }
      
      return { 
        success: true, 
        message: `Successfully sent ${sentCount} messages immediately`,
        sentCount 
      };
    }),

  // Reset to default templates (delete all and reinstall based on industry)
  resetToDefault: protectedProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { dojoSettings, automationTemplates } = await import("../drizzle/schema");
      
      // Get current industry from settings
      const [settings] = await db.select().from(dojoSettings).limit(1);
      const industry = settings?.industry || 'martial_arts';
      
      // Delete all existing automation sequences and their steps (cascade will handle steps and enrollments)
      await db.delete(automationSequences);
      
      // Get all templates for the selected industry
      const templates = await db.select()
        .from(automationTemplates)
        .where(eq(automationTemplates.industry, industry));
      
      let installedCount = 0;
      
      // Install each template as an automation sequence
      for (const template of templates) {
        // Create the automation sequence
        const [sequence] = await db.insert(automationSequences)
          .values({
            name: template.name,
            description: template.description,
            trigger: template.trigger,
            isActive: 0, // Start as inactive - user can activate when ready
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        
        // Parse template steps and create automation steps
        const templateSteps = JSON.parse(template.steps);
        
        for (const step of templateSteps) {
          await db.insert(automationSteps).values({
            sequenceId: sequence.id,
            stepOrder: step.stepOrder,
            stepType: step.stepType,
            waitDuration: step.waitDuration || null,
            waitUnit: step.waitUnit || null,
            messageContent: step.messageContent || null,
            emailSubject: step.emailSubject || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        
        installedCount++;
      }
      
      return { 
        success: true, 
        message: `Reset complete! Installed ${installedCount} default templates for ${industry}.`,
        installedCount 
      };
    }),
});
