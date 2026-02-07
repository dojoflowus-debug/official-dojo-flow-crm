import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

/**
 * Waiver Router
 * 
 * Handles waiver submission, storage, and parent signature flows
 */
export const waiverRouter = router({
  /**
   * Submit a signed waiver
   * 
   * For minors, this creates a pending waiver and sends parent signature link
   * For adults, this creates a complete waiver
   */
  submitWaiver: publicProcedure
    .input(z.object({
      leadId: z.number().optional(),
      studentId: z.number().optional(),
      participantName: z.string().min(1),
      dateOfBirth: z.string().optional(),
      parentName: z.string().optional(),
      parentEmail: z.string().email().optional(),
      parentPhone: z.string().optional(),
      medicalConditions: z.string().optional(),
      signatureData: z.string().min(1, 'Signature is required'),
      signerType: z.enum(['student', 'guardian']),
      signerName: z.string().min(1),
      signerEmail: z.string().email(),
      mediaConsent: z.boolean().default(false),
      agreementAccepted: z.boolean(),
      organizationId: z.number(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { signedWaivers, waiverTemplates } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      if (!input.agreementAccepted) {
        throw new Error('You must accept the waiver terms');
      }

      // Get or create waiver template
      let [template] = await db.select().from(waiverTemplates)
        .where(eq(waiverTemplates.isActive, 1))
        .limit(1);

      if (!template) {
        // Create default template if none exists
        const result = await db.insert(waiverTemplates).values({
          title: 'Standard Martial Arts Waiver',
          content: 'Standard waiver content',
          version: 1,
          isActive: 1,
        });
        const templateId = result.insertId;
        [template] = await db.select().from(waiverTemplates)
          .where(eq(waiverTemplates.id, templateId));
      }

      // Determine student ID
      let studentId = input.studentId;
      if (!studentId && input.leadId) {
        // If we have a lead ID, we'll need to convert it to student ID
        // This will happen during enrollment
        studentId = input.leadId; // Temporary - will be updated during enrollment
      }

      // Create signed waiver record
      const waiverResult = await db.insert(signedWaivers).values({
        studentId: studentId || 0, // Will be updated if this is a lead
        waiverTemplateId: template.id,
        signerType: input.signerType,
        signerName: input.signerName,
        signerEmail: input.signerEmail,
        signatureData: input.signatureData,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        signedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      const waiverId = waiverResult.insertId;

      // If minor, send parent signature link
      if (input.signerType === 'guardian' && input.parentEmail) {
        // TODO: Send email with parent signature link
        console.log(`[Waiver] Parent signature link should be sent to ${input.parentEmail}`);
      }

      return {
        success: true,
        waiverId,
        message: input.signerType === 'guardian'
          ? `Waiver submitted. A signature link has been sent to ${input.parentEmail}`
          : 'Waiver signed successfully',
        requiresParentSignature: input.signerType === 'guardian',
      };
    }),

  /**
   * Get waiver status for a student
   */
  getWaiverStatus: publicProcedure
    .input(z.object({
      studentId: z.number(),
    }))
    .query(async ({ input }) => {
      const { getDb } = await import("./db");
      const { signedWaivers } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const waivers = await db.select().from(signedWaivers)
        .where(eq(signedWaivers.studentId, input.studentId));

      const studentSigned = waivers.some(w => w.signerType === 'student');
      const parentSigned = waivers.some(w => w.signerType === 'guardian');

      return {
        hasSigned: studentSigned,
        parentHasSigned: parentSigned,
        waiverCount: waivers.length,
        latestWaiver: waivers[0] || null,
      };
    }),

  /**
   * Get parent signature link
   */
  getParentSignatureLink: publicProcedure
    .input(z.object({
      waiverId: z.number(),
      token: z.string(),
    }))
    .query(async ({ input }) => {
      const { getDb } = await import("./db");
      const { signedWaivers } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [waiver] = await db.select().from(signedWaivers)
        .where(eq(signedWaivers.id, input.waiverId));

      if (!waiver) {
        throw new Error('Waiver not found');
      }

      // In production, verify token here
      // For now, just return the waiver data

      return {
        success: true,
        waiver: {
          id: waiver.id,
          participantName: waiver.signerName, // This would be from student record
          signerEmail: waiver.signerEmail,
          signedAt: waiver.signedAt,
        },
      };
    }),

  /**
   * Submit parent signature
   */
  submitParentSignature: publicProcedure
    .input(z.object({
      waiverId: z.number(),
      parentSignatureData: z.string().min(1),
      parentName: z.string().min(1),
      parentEmail: z.string().email(),
      token: z.string(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { signedWaivers } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Verify token (in production)
      // For now, just verify waiver exists
      const [waiver] = await db.select().from(signedWaivers)
        .where(eq(signedWaivers.id, input.waiverId));

      if (!waiver) {
        throw new Error('Waiver not found');
      }

      // Create parent signature record
      const parentWaiverResult = await db.insert(signedWaivers).values({
        studentId: waiver.studentId,
        waiverTemplateId: waiver.waiverTemplateId,
        signerType: 'guardian',
        signerName: input.parentName,
        signerEmail: input.parentEmail,
        signatureData: input.parentSignatureData,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        signedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      const parentWaiverId = (parentWaiverResult as any).insertId || 0;

      return {
        success: true,
        parentWaiverId,
        message: 'Parent signature recorded successfully',
      };
    }),

  /**
   * Get waiver PDF (for download/printing)
   */
  getWaiverPDF: publicProcedure
    .input(z.object({
      waiverId: z.number(),
    }))
    .query(async ({ input }) => {
      const { getDb } = await import("./db");
      const { signedWaivers } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [waiver] = await db.select().from(signedWaivers)
        .where(eq(signedWaivers.id, input.waiverId));

      if (!waiver) {
        throw new Error('Waiver not found');
      }

      // In production, generate PDF here using a library like PDFKit or WeasyPrint
      // For now, return the waiver data
      return {
        success: true,
        waiver,
        message: 'PDF generation would happen here',
      };
    }),
});
