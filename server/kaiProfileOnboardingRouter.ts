import { z } from "zod";
import { router, orgScopedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { dojoSettings, organizations, schoolProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { upsertSchoolProfile } from "./schoolProfileDb";

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

      // Get school profile (table may not exist yet in older deployments)
      let profile: {
        schoolName: string;
        displayName: string | null;
        logoLightUrl: string | null;
        logoDarkUrl: string | null;
        logoLightData: string | null;
        logoDarkData: string | null;
        logoIconLightUrl: string | null;
        logoIconDarkUrl: string | null;
      } | null = null;
      try {
        const [row] = await db
          .select()
          .from(schoolProfiles)
          .where(eq(schoolProfiles.organizationId, orgId))
          .limit(1);
        profile = row || null;
      } catch (e) {
        // school_profiles table doesn't exist yet — treat as no profile
        console.warn('[KAI Onboarding] school_profiles table not found, treating as empty');
      }

      // Get dojo settings (for operatorName / AI name)
      let settings: { operatorName: string | null; schoolName: string | null; setupCompleted: number | null; organizationId: number | null } | null = null;
      try {
        const [row] = await db
          .select({
            operatorName: dojoSettings.operatorName,
            schoolName: dojoSettings.schoolName,
            setupCompleted: dojoSettings.setupCompleted,
            organizationId: dojoSettings.organizationId,
          })
          .from(dojoSettings)
          .where(eq(dojoSettings.organizationId, orgId))
          .limit(1);
        settings = row || null;
      } catch (e) {
        console.warn('[KAI Onboarding] dojoSettings query failed:', e);
      }

      // Get organization onboarding status
      let org: { onboardingStatus: string | null; onboardingStep: number | null; name: string | null } | null = null;
      try {
        const [row] = await db
          .select({
            onboardingStatus: organizations.onboardingStatus,
            onboardingStep: organizations.onboardingStep,
            name: organizations.name,
          })
          .from(organizations)
          .where(eq(organizations.id, orgId))
          .limit(1);
        org = row || null;
      } catch (e) {
        console.warn('[KAI Onboarding] organizations query failed:', e);
      }

      // Determine which fields are missing
      const hasOwnerName = !!(settings?.operatorName && settings.operatorName.trim().length > 0);
      const hasSchoolName = !!(
        (profile?.schoolName && profile.schoolName !== "My Dojo" && profile.schoolName.trim().length > 0) ||
        (settings?.schoolName && settings.schoolName.trim().length > 0)
      );
      // Logo is present if we have either a URL or inline data
      const hasLogoLight = !!(
        (profile?.logoLightUrl && profile.logoLightUrl.trim().length > 0) ||
        (profile?.logoLightData && profile.logoLightData.trim().length > 0)
      );
      const hasLogoDark = !!(
        (profile?.logoDarkUrl && profile.logoDarkUrl.trim().length > 0) ||
        (profile?.logoDarkData && profile.logoDarkData.trim().length > 0)
      );

      // Check if onboarding is already completed/skipped
      const isCompleted = org?.onboardingStatus === "completed" || org?.onboardingStatus === "skipped";

      // Determine missing steps
      const missingSteps: string[] = [];
      if (!hasOwnerName) missingSteps.push("owner_name");
      if (!hasSchoolName) missingSteps.push("school_name");
      if (!hasLogoLight) missingSteps.push("logo_light");
      if (!hasLogoDark) missingSteps.push("logo_dark");

      // needsOnboarding is true if:
      // 1. Onboarding was never completed AND there are missing steps, OR
      // 2. Critical branding fields (logos) are still missing even after completion
      const hasCriticalMissing = !hasLogoLight || !hasLogoDark;
      const needsOnboarding = (!isCompleted && missingSteps.length > 0) || (isCompleted && hasCriticalMissing);

      return {
        isCompleted,
        needsOnboarding,
        missingSteps,
        currentStep: org?.onboardingStep || 1,
        profile: profile ? {
          schoolName: profile.schoolName,
          displayName: profile.displayName,
          logoLightUrl: profile.logoLightUrl || profile.logoLightData || null,
          logoDarkUrl: profile.logoDarkUrl || profile.logoDarkData || null,
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
   * Upload a logo by storing the base64 data directly in the database.
   * This approach requires no external storage service (no AWS S3, no Forge API).
   * The base64 data URL is stored in logo_light_data / logo_dark_data columns.
   */
  uploadLogo: orgScopedProcedure
    .input(z.object({
      type: z.enum(["light", "dark"]),
      fileData: z.string(), // base64 data URL (e.g. "data:image/png;base64,...")
      mimeType: z.string().default("image/png"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const orgId = ctx.currentOrganizationId;

      // Ensure the data URL has the proper prefix
      let dataUrl = input.fileData;
      if (!dataUrl.startsWith('data:')) {
        dataUrl = `data:${input.mimeType};base64,${dataUrl}`;
      }

      // Validate size (base64 of 2MB = ~2.7MB string)
      const maxBytes = 3 * 1024 * 1024; // 3MB string limit
      if (dataUrl.length > maxBytes) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: "Logo file is too large. Please use an image under 2MB.",
        });
      }

      // Determine which column to update
      const updateData = input.type === "light"
        ? { logoLightData: dataUrl }
        : { logoDarkData: dataUrl };

      // Upsert school profile with logo data
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

      // Update onboarding step
      if (input.type === "light") {
        await db.update(organizations)
          .set({ onboardingStep: 4 })
          .where(eq(organizations.id, orgId));
      } else {
        await db.update(organizations)
          .set({ onboardingStep: 5 })
          .where(eq(organizations.id, orgId));
      }

      // Return the data URL as the "url" so the frontend can display it immediately
      return { success: true, url: dataUrl };
    }),

  /**
   * Save logo URL (step 3 & 4) — used when a URL is already available
   */
  saveLogo: orgScopedProcedure
    .input(z.object({
      type: z.enum(["light", "dark"]),
      url: z.string().max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const orgId = ctx.currentOrganizationId;

      // Determine if this is a data URL or a regular URL
      const isDataUrl = input.url.startsWith('data:');

      // Update school profile logo
      let updateData: Record<string, string>;
      if (isDataUrl) {
        updateData = input.type === "light"
          ? { logoLightData: input.url }
          : { logoDarkData: input.url };
      } else {
        updateData = input.type === "light"
          ? { logoLightUrl: input.url, logoIconLightUrl: input.url }
          : { logoDarkUrl: input.url, logoIconDarkUrl: input.url };
      }

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

      // Also update organizations.logoUrl for backward compat (only for real URLs)
      if (!isDataUrl) {
        if (input.type === "light") {
          await db.update(organizations)
            .set({ logoUrl: input.url, onboardingStep: 4 })
            .where(eq(organizations.id, orgId));
        } else {
          await db.update(organizations)
            .set({ onboardingStep: 5 })
            .where(eq(organizations.id, orgId));
        }
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
