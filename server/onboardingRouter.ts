import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc.js";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db.js";
import {
  onboardingProgress,
  organizations,
  organizationUsers,
  users,
} from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

/**
 * Onboarding Router
 * Manages owner onboarding wizard progress and workspace creation
 */

export const onboardingRouter = router({
  /**
   * Get current onboarding progress for a user
   */
  getProgress: publicProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [progress] = await db
        .select()
        .from(onboardingProgress)
        .where(eq(onboardingProgress.userId, input.userId))
        .limit(1);

      if (!progress) {
        return null;
      }

      return {
        currentStep: progress.currentStep,
        isVerified: progress.isVerified === 1,
        accountData: progress.accountData ? JSON.parse(progress.accountData) : null,
        schoolData: progress.schoolData ? JSON.parse(progress.schoolData) : null,
        selectedPlanId: progress.selectedPlanId,
        paymentCompleted: progress.paymentCompleted === 1,
        isCompleted: progress.isCompleted === 1,
      };
    }),

  /**
   * Save school profile data (Step 3)
   */
  saveSchoolProfile: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        schoolName: z.string().min(1, "School name is required"),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        timezone: z.string().default("America/New_York"),
        programs: z.array(z.string()).optional(),
        estimatedStudents: z.number().optional(),
        launchDate: z.string().optional(), // ISO date string
        logoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, ...schoolData } = input;
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Save to onboarding progress
      await db
        .update(onboardingProgress)
        .set({
          schoolData: JSON.stringify(schoolData),
          currentStep: 3,
        })
        .where(eq(onboardingProgress.userId, userId));

      return {
        success: true,
        message: "School profile saved",
      };
    }),

  /**
   * Select plan (Step 4)
   */
  selectPlan: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        planId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      await db
        .update(onboardingProgress)
        .set({
          selectedPlanId: input.planId,
          currentStep: 4,
        })
        .where(eq(onboardingProgress.userId, input.userId));

      return {
        success: true,
        message: "Plan selected",
      };
    }),

  /**
   * Complete payment (Step 4.5)
   */
  completePayment: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        paymentIntentId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      await db
        .update(onboardingProgress)
        .set({
          paymentCompleted: 1,
          currentStep: 5,
        })
        .where(eq(onboardingProgress.userId, input.userId));

      return {
        success: true,
        message: "Payment completed",
      };
    }),

  /**
   * Create workspace (Step 5)
   * Generates organization, location, and default settings
   */
  createWorkspace: publicProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Get onboarding progress
      const [progress] = await db
        .select()
        .from(onboardingProgress)
        .where(eq(onboardingProgress.userId, input.userId))
        .limit(1);

      if (!progress) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Onboarding progress not found",
        });
      }

      if (!progress.schoolData) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "School profile data is required",
        });
      }

      const schoolData = JSON.parse(progress.schoolData);

      // Create organization
      const [newOrg] = await db.insert(organizations).values({
        name: schoolData.schoolName,
        address: schoolData.address,
        city: schoolData.city,
        state: schoolData.state,
        zipCode: schoolData.zipCode,
        timezone: schoolData.timezone || "America/New_York",
        programs: schoolData.programs ? JSON.stringify(schoolData.programs) : null,
        estimatedStudents: schoolData.estimatedStudents,
        launchDate: schoolData.launchDate ? new Date(schoolData.launchDate) : null,
        logoUrl: schoolData.logoUrl,
        planId: progress.selectedPlanId,
        subscriptionStatus: progress.paymentCompleted ? "active" : "trial",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      });

      const organizationId = newOrg.insertId;

      // Link user to organization as owner
      await db.insert(organizationUsers).values({
        userId: input.userId,
        organizationId,
        role: "owner",
        isPrimary: 1,
      });

      // Mark onboarding as completed
      await db
        .update(onboardingProgress)
        .set({
          isCompleted: 1,
          completedAt: new Date(),
        })
        .where(eq(onboardingProgress.userId, input.userId));

      // TODO: Create default settings, tags, and starter data
      // - Default class categories
      // - Default belt ranks
      // - Default email templates
      // - Sample programs

      return {
        success: true,
        organizationId,
        message: "Workspace created successfully",
      };
    }),

  /**
   * Get available pricing plans
   */
  getPlans: publicProcedure.query(async () => {
    // TODO: Fetch from database or config
    // For now, return hardcoded plans
    return [
      {
        id: 1,
        name: "Starter",
        price: 0,
        interval: "month",
        features: [
          "Up to 50 students",
          "Basic CRM",
          "Kiosk check-in",
          "Email support",
        ],
        isTrial: true,
      },
      {
        id: 2,
        name: "Growth",
        price: 99,
        interval: "month",
        features: [
          "Up to 200 students",
          "Advanced CRM",
          "Kiosk check-in",
          "AI Assistant (Kai)",
          "Analytics dashboard",
          "Priority support",
        ],
        isPopular: true,
      },
      {
        id: 3,
        name: "Pro",
        price: 199,
        interval: "month",
        features: [
          "Unlimited students",
          "Multi-location support",
          "Advanced analytics",
          "Custom integrations",
          "Dedicated support",
          "White-label options",
        ],
      },
    ];
  }),
});
