import { z } from "zod";
import { router, orgScopedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { dojoSettings, organizations, schoolProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getSchoolProfile, upsertSchoolProfile } from "./schoolProfileDb";

/**
 * KAI Profile Onboarding Router
 * 
 * Handles the conversational onboarding flow where KAI guides new users
 * through setting up their school profile directly from the KAI dashboard.
 */
export const kaiProfileOnboardingRouter = router({
  /**
   * Get the current onboarding status for the organization.
   * Returns which fields are missing and what step to start from.
   */
  getStatus: orgScopedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const orgId = ctx.currentOrganizationId;

      // Get school profile
      const [profile] = await db
        .select()
        .from(schoolProfiles)
        .where(eq(schoolProfiles.organizationId, orgId))
        .limit(1);

      // Get dojo settings (for operatorName / AI name)
      const [settings] = await db
        .select({
          operatorName: dojoSettings.operatorName,
          schoolName: dojoSettings.schoolName,
          setupCompleted: dojoSettings.setupCompleted,
          organizationId: dojoSettings.organizationId,
        })
        .from(dojoSettings)
        .where(eq(dojoSettings.organizationId, orgId))
        .limit(1);

      // Get organization onboarding status
      const [org] = await db
        .select({
          onboardingStatus: organizations.onboardingStatus,
          onboardingStep: organizations.onboardingStep,
          name: organizations.name,
        })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

      // Determine which fields are missing
      const hasOwnerName = !!(settings?.operatorName && settings.operatorName.trim().length > 0);
      const hasSchoolName = !!(
        (profile?.schoolName && profile.schoolName !== "My Dojo" && profile.schoolName.trim().length > 0) ||
        (settings?.schoolName && settings.schoolName.trim().length > 0)
      );
      const hasLogoLight = !!(profile?.logoLightUrl && profile.logoLightUrl.trim().length > 0);
      const hasLogoDark = !!(profile?.logoDarkUrl && profile.logoDarkUrl.trim().length > 0);

      // Check if onboarding is already completed/skipped
      const isCompleted = org?.onboardingStatus === "completed" || org?.onboardingStatus === "skipped";

      // Determine missing steps
      const missingSteps: string[] = [];
      if (!hasOwnerName) missingSteps.push("owner_name");
      if (!hasSchoolName) missingSteps.push("school_name");
      if (!hasLogoLight) missingSteps.push("logo_light");
      if (!hasLogoDark) missingSteps.push("logo_dark");

      return {
        isCompleted,
        needsOnboarding: !isCompleted && missingSteps.length > 0,
        missingSteps,
        currentStep: org?.onboardingStep || 1,
        profile: profile ? {
          schoolName: profile.schoolName,
          displayName: profile.displayName,
          logoLightUrl: profile.logoLightUrl,
          logoDarkUrl: profile.logoDarkUrl,
        } : null,
        settings: settings ? {
          operatorName: settings.operatorName,
          schoolName: settings.schoolName,
        } : null,
      };
    }),

  /**
   * Save owner name (step 1)
   */
  saveOwnerName: orgScopedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const orgId = ctx.currentOrganizationId;

      // Check if dojo settings exist for this org
      const [existing] = await db
        .select({ id: dojoSettings.id })
        .from(dojoSettings)
        .where(eq(dojoSettings.organizationId, orgId))
        .limit(1);

      if (existing) {
        await db.update(dojoSettings)
          .set({ operatorName: input.name, updatedAt: new Date().toISOString() })
          .where(eq(dojoSettings.organizationId, orgId));
      } else {
        // Also check for settings without org ID (legacy)
        const [legacySettings] = await db
          .select({ id: dojoSettings.id })
          .from(dojoSettings)
          .limit(1);

        if (legacySettings) {
          await db.update(dojoSettings)
            .set({ operatorName: input.name, organizationId: orgId, updatedAt: new Date().toISOString() })
            .where(eq(dojoSettings.id, legacySettings.id));
        } else {
          await db.insert(dojoSettings).values({
            operatorName: input.name,
            organizationId: orgId,
            setupCompleted: 0,
          });
        }
      }

      // Update onboarding step
      await db.update(organizations)
        .set({ onboardingStatus: "in_progress", onboardingStep: 2 })
        .where(eq(organizations.id, orgId));

      return { success: true };
    }),

  /**
   * Save school name (step 2)
   */
  saveSchoolName: orgScopedProcedure
    .input(z.object({
      schoolName: z.string().min(1).max(255),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const orgId = ctx.currentOrganizationId;

      // Upsert school profile
      await upsertSchoolProfile(orgId, { schoolName: input.schoolName });

      // Also update dojo settings school name
      const [existing] = await db
        .select({ id: dojoSettings.id })
        .from(dojoSettings)
        .where(eq(dojoSettings.organizationId, orgId))
        .limit(1);

      if (existing) {
        await db.update(dojoSettings)
          .set({ schoolName: input.schoolName, updatedAt: new Date().toISOString() })
          .where(eq(dojoSettings.organizationId, orgId));
      } else {
        const [legacySettings] = await db
          .select({ id: dojoSettings.id })
          .from(dojoSettings)
          .limit(1);
        if (legacySettings) {
          await db.update(dojoSettings)
            .set({ schoolName: input.schoolName, organizationId: orgId, updatedAt: new Date().toISOString() })
            .where(eq(dojoSettings.id, legacySettings.id));
        }
      }

      // Update org name too
      await db.update(organizations)
        .set({ name: input.schoolName, onboardingStep: 3 })
        .where(eq(organizations.id, orgId));

      return { success: true };
    }),

  /**
   * Save logo URL (step 3 & 4)
   */
  saveLogo: orgScopedProcedure
    .input(z.object({
      type: z.enum(["light", "dark"]),
      url: z.string().url().max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const orgId = ctx.currentOrganizationId;

      // Update school profile logo
      const updateData = input.type === "light"
        ? { logoLightUrl: input.url, logoIconLightUrl: input.url }
        : { logoDarkUrl: input.url, logoIconDarkUrl: input.url };

      const [existing] = await db
        .select({ id: schoolProfiles.id })
        .from(schoolProfiles)
        .where(eq(schoolProfiles.organizationId, orgId))
        .limit(1);

      if (existing) {
        await db.update(schoolProfiles)
          .set({ ...updateData, updatedAt: new Date().toISOString() })
          .where(eq(schoolProfiles.organizationId, orgId));
      } else {
        await db.insert(schoolProfiles).values({
          organizationId: orgId,
          schoolName: "My Dojo",
          ...updateData,
        });
      }

      // Also update organizations.logoUrl for backward compat
      if (input.type === "light") {
        await db.update(organizations)
          .set({ logoUrl: input.url, onboardingStep: 4 })
          .where(eq(organizations.id, orgId));
      } else {
        await db.update(organizations)
          .set({ onboardingStep: 5 })
          .where(eq(organizations.id, orgId));
      }

      return { success: true };
    }),

  /**
   * Mark onboarding as complete or skipped
   */
  completeOnboarding: orgScopedProcedure
    .input(z.object({
      skipped: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const orgId = ctx.currentOrganizationId;

      await db.update(organizations)
        .set({
          onboardingStatus: input.skipped ? "skipped" : "completed",
          onboardingStep: 99,
        })
        .where(eq(organizations.id, orgId));

      // Mark dojo settings as setup completed
      const [existing] = await db
        .select({ id: dojoSettings.id })
        .from(dojoSettings)
        .where(eq(dojoSettings.organizationId, orgId))
        .limit(1);

      if (existing) {
        await db.update(dojoSettings)
          .set({ setupCompleted: 1, updatedAt: new Date().toISOString() })
          .where(eq(dojoSettings.organizationId, orgId));
      }

      return { success: true };
    }),
});
