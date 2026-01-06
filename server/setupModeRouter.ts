import { protectedProcedure, router } from "./_core/trpc.js";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db.js";
import { organizations } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { z } from "zod";

/**
 * Kai Setup Mode Router
 * Manages the 8-step onboarding wizard for new schools
 * 
 * Phases:
 * 1. School Identity (name, logo, phone, email, address, timezone)
 * 2. Programs (select programs, age groups)
 * 3. Class Schedule (add classes, CSV/Excel upload, handwritten schedule photos)
 * 4. Pricing & Billing (plans, trial offer, enrollment fee, billing rules)
 * 5. Staff (add staff members + roles)
 * 6. Students Import (CSV import or skip)
 * 7. Communication (sender phone/email, messaging defaults)
 * 8. Review & Launch (summary + "Activate School")
 */

export const setupModeRouter = router({
  /**
   * Get current onboarding status and progress for an organization
   */
  getStatus: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      // Verify user has access to this organization
      if (ctx.user?.organizationId !== input.organizationId && ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      return {
        status: org.onboardingStatus,
        currentStep: org.onboardingStep,
        checklist: org.onboardingChecklist ? JSON.parse(org.onboardingChecklist) : {},
        completedAt: org.onboardingCompletedAt,
      };
    }),

  /**
   * Save progress for a specific onboarding step
   * Auto-increments to next step on success
   */
  saveStep: protectedProcedure
    .input(
      z.object({
        organizationId: z.number(),
        step: z.number().min(1).max(8),
        data: z.record(z.any()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      // Verify user has access
      if (ctx.user?.organizationId !== input.organizationId && ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Parse existing checklist
      const checklist = org.onboardingChecklist ? JSON.parse(org.onboardingChecklist) : {};

      // Mark step as completed
      checklist[`step_${input.step}`] = {
        completed: true,
        completedAt: new Date().toISOString(),
        data: input.data,
      };

      // Determine next step (or mark as completed if this is step 8)
      const nextStep = input.step === 8 ? 8 : input.step + 1;
      const newStatus = input.step === 8 ? "completed" : "in_progress";

      // Update organization
      await db
        .update(organizations)
        .set({
          onboardingStatus: newStatus,
          onboardingStep: nextStep,
          onboardingChecklist: JSON.stringify(checklist),
          onboardingCompletedAt: input.step === 8 ? new Date() : null,
        })
        .where(eq(organizations.id, input.organizationId));

      return {
        status: newStatus,
        currentStep: nextStep,
        checklist,
      };
    }),

  /**
   * Skip setup (allows dashboard access with reminder banner)
   */
  skipSetup: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      // Verify user has access
      if (ctx.user?.organizationId !== input.organizationId && ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Update status to skipped
      await db
        .update(organizations)
        .set({
          onboardingStatus: "skipped",
        })
        .where(eq(organizations.id, input.organizationId));

      return { status: "skipped" };
    }),

  /**
   * Complete setup (mark as fully completed)
   */
  completeSetup: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      // Verify user has access
      if (ctx.user?.organizationId !== input.organizationId && ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Update status to completed
      await db
        .update(organizations)
        .set({
          onboardingStatus: "completed",
          onboardingStep: 8,
          onboardingCompletedAt: new Date(),
        })
        .where(eq(organizations.id, input.organizationId));

      return { status: "completed", completedAt: new Date() };
    }),

  /**
   * Resume setup at the last step
   */
  resumeSetup: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      // Verify user has access
      if (ctx.user?.organizationId !== input.organizationId && ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const checklist = org.onboardingChecklist ? JSON.parse(org.onboardingChecklist) : {};

      return {
        status: org.onboardingStatus,
        lastStep: org.onboardingStep,
        checklist,
        stepData: checklist[`step_${org.onboardingStep}`]?.data || null,
      };
    }),
});
