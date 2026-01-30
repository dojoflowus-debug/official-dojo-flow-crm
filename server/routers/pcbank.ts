import { z } from 'zod';
import { router, orgScopedProcedure } from '../trpc';
import { db } from '../db';
import { pcBankApplications, pcBankApplicationHistory } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * PC Bank Card Application Router
 * Handles CRUD operations for payment processor onboarding
 */

// Validation schema for application data
const applicationDataSchema = z.object({
  // Step 1: Business Identity
  legalBusinessName: z.string().optional(),
  dbaName: z.string().optional(),
  businessEmail: z.string().email().optional(),
  businessPhone: z.string().optional(),
  website: z.string().url().optional(),
  dateBusinessStarted: z.string().optional(),
  
  // Step 2: Location Info
  businessAddress: z.string().optional(),
  businessCity: z.string().optional(),
  businessState: z.string().optional(),
  businessZip: z.string().optional(),
  businessCountry: z.string().optional(),
  
  // Step 3: Corporate/Tax
  ein: z.string().optional(),
  businessType: z.string().optional(),
  stateOfIncorporation: z.string().optional(),
  
  // Step 4: Owner/Principal
  ownerFirstName: z.string().optional(),
  ownerLastName: z.string().optional(),
  ownerTitle: z.string().optional(),
  ownerSSN: z.string().optional(),
  ownerDOB: z.string().optional(),
  ownerAddress: z.string().optional(),
  ownerCity: z.string().optional(),
  ownerState: z.string().optional(),
  ownerZip: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().email().optional(),
  ownerOwnershipPercent: z.string().optional(),
  
  // Step 5: Banking & Processing
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankRoutingNumber: z.string().optional(),
  averageMonthlyVolume: z.string().optional(),
  averageTicketSize: z.string().optional(),
  highestTicketSize: z.string().optional(),
  
  // Step 6: Uploads
  uploadedDocuments: z.record(z.string()).optional(),
  
  // Step 7: Review & Submit
  agreeToTerms: z.boolean().optional(),
  authorizedSignature: z.string().optional(),
  signatureDate: z.string().optional(),
  
  // Progress tracking
  currentStep: z.number().min(1).max(7).optional(),
  completionPercent: z.number().min(0).max(100).optional(),
});

export const pcbankRouter = router({
  /**
   * Get the current application for the organization
   * Returns null if no application exists
   */
  getApplication: orgScopedProcedure
    .query(async ({ ctx }) => {
      const [application] = await db
        .select()
        .from(pcBankApplications)
        .where(eq(pcBankApplications.organizationId, ctx.currentOrganizationId))
        .limit(1);
      
      return application || null;
    }),

  /**
   * Create or update application (auto-save draft)
   */
  saveApplication: orgScopedProcedure
    .input(applicationDataSchema)
    .mutation(async ({ ctx, input }) => {
      const existingApp = await db
        .select()
        .from(pcBankApplications)
        .where(eq(pcBankApplications.organizationId, ctx.currentOrganizationId))
        .limit(1);

      if (existingApp.length > 0) {
        // Update existing application
        const [updated] = await db
          .update(pcBankApplications)
          .set({
            ...input,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(pcBankApplications.id, existingApp[0].id))
          .returning();

        // Log history
        await db.insert(pcBankApplicationHistory).values({
          applicationId: existingApp[0].id,
          organizationId: ctx.currentOrganizationId,
          userId: ctx.user.id,
          action: 'updated',
          changes: input,
        });

        return updated;
      } else {
        // Create new application
        const [created] = await db
          .insert(pcBankApplications)
          .values({
            organizationId: ctx.currentOrganizationId,
            userId: ctx.user.id,
            status: 'draft',
            ...input,
          })
          .returning();

        // Log history
        await db.insert(pcBankApplicationHistory).values({
          applicationId: created.id,
          organizationId: ctx.currentOrganizationId,
          userId: ctx.user.id,
          action: 'created',
        });

        return created;
      }
    }),

  /**
   * Submit application to FillFaster
   * Changes status from draft to submitted
   */
  submitApplication: orgScopedProcedure
    .mutation(async ({ ctx }) => {
      const [application] = await db
        .select()
        .from(pcBankApplications)
        .where(
          and(
            eq(pcBankApplications.organizationId, ctx.currentOrganizationId),
            eq(pcBankApplications.status, 'draft')
          )
        )
        .limit(1);

      if (!application) {
        throw new Error('No draft application found');
      }

      // Validate required fields before submission
      const requiredFields = [
        'legalBusinessName',
        'businessEmail',
        'businessPhone',
        'businessAddress',
        'businessCity',
        'businessState',
        'businessZip',
        'ein',
        'businessType',
        'ownerFirstName',
        'ownerLastName',
        'ownerSSN',
        'ownerDOB',
        'bankName',
        'bankAccountNumber',
        'bankRoutingNumber',
      ];

      const missingFields = requiredFields.filter(
        (field) => !application[field as keyof typeof application]
      );

      if (missingFields.length > 0) {
        throw new Error(
          `Missing required fields: ${missingFields.join(', ')}`
        );
      }

      if (!application.agreeToTerms) {
        throw new Error('You must agree to the terms and conditions');
      }

      // TODO: Call FillFaster API to submit application
      // For now, we'll just update the status
      const fillFasterSubmissionId = `FF-${Date.now()}-${application.id}`;
      const ipAddress = ctx.req.ip || ctx.req.headers['x-forwarded-for'] || 'unknown';

      const [updated] = await db
        .update(pcBankApplications)
        .set({
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          fillFasterSubmissionId,
          ipAddress: ipAddress as string,
          completionPercent: 100,
        })
        .where(eq(pcBankApplications.id, application.id))
        .returning();

      // Log history
      await db.insert(pcBankApplicationHistory).values({
        applicationId: application.id,
        organizationId: ctx.currentOrganizationId,
        userId: ctx.user.id,
        action: 'submitted',
        previousStatus: 'draft',
        newStatus: 'submitted',
        notes: `Submitted to FillFaster with ID: ${fillFasterSubmissionId}`,
      });

      return updated;
    }),

  /**
   * Get application history/audit trail
   */
  getApplicationHistory: orgScopedProcedure
    .query(async ({ ctx }) => {
      const [application] = await db
        .select()
        .from(pcBankApplications)
        .where(eq(pcBankApplications.organizationId, ctx.currentOrganizationId))
        .limit(1);

      if (!application) {
        return [];
      }

      const history = await db
        .select()
        .from(pcBankApplicationHistory)
        .where(eq(pcBankApplicationHistory.applicationId, application.id))
        .orderBy(desc(pcBankApplicationHistory.createdAt));

      return history;
    }),

  /**
   * Delete application (only if draft)
   */
  deleteApplication: orgScopedProcedure
    .mutation(async ({ ctx }) => {
      const [application] = await db
        .select()
        .from(pcBankApplications)
        .where(
          and(
            eq(pcBankApplications.organizationId, ctx.currentOrganizationId),
            eq(pcBankApplications.status, 'draft')
          )
        )
        .limit(1);

      if (!application) {
        throw new Error('No draft application found to delete');
      }

      await db
        .delete(pcBankApplications)
        .where(eq(pcBankApplications.id, application.id));

      return { success: true };
    }),
});
