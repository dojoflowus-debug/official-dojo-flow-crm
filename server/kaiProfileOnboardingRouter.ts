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
  getStatus: orgScopedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const orgId = ctx.currentOrganizationId;

    // Get school profile
    let profile: {
      schoolName: string;
      displayName: string | null;
      logoLightUrl: string | null;
      logoDarkUrl: string | null;
      logoLightData: string | null;
      logoDarkData: string | null;
      phone: string | null;
      email: string | null;
      website: string | null;
      addressStreet: string | null;
      addressCity: string | null;
      addressState: string | null;
      addressPostal: string | null;
    } | null = null;
    try {
      const [row] = await db
        .select()
        .from(schoolProfiles)
        .where(eq(schoolProfiles.organizationId, orgId))
        .limit(1);
      profile = row || null;
    } catch (e) {
      console.warn("[KAI Onboarding] school_profiles query failed:", e);
    }

    // Get dojo settings
    let settings: { operatorName: string | null; schoolName: string | null; setupCompleted: number | null; martialArtsStyle: string | null } | null = null;
    try {
      const [row] = await db
        .select({
          operatorName: dojoSettings.operatorName,
          schoolName: dojoSettings.schoolName,
          setupCompleted: dojoSettings.setupCompleted,
          martialArtsStyle: dojoSettings.martialArtsStyle,
        })
        .from(dojoSettings)
        .where(eq(dojoSettings.organizationId, orgId))
        .limit(1);
      settings = row || null;
    } catch (e) {
      console.warn("[KAI Onboarding] dojoSettings query failed:", e);
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
      console.warn("[KAI Onboarding] organizations query failed:", e);
    }

    // Determine which fields are present
    const hasOwnerName = !!(settings?.operatorName && settings.operatorName.trim().length > 0);
    const hasSchoolName = !!(
      (profile?.schoolName && profile.schoolName !== "My Dojo" && profile.schoolName.trim().length > 0) ||
      (settings?.schoolName && settings.schoolName.trim().length > 0)
    );
    const hasLogoLight = !!(
      (profile?.logoLightUrl && profile.logoLightUrl.trim().length > 0) ||
      (profile?.logoLightData && profile.logoLightData.trim().length > 0)
    );
    const hasLogoDark = !!(
      (profile?.logoDarkUrl && profile.logoDarkUrl.trim().length > 0) ||
      (profile?.logoDarkData && profile.logoDarkData.trim().length > 0)
    );
    const hasMartialArtsStyle = !!(settings?.martialArtsStyle && settings.martialArtsStyle.trim().length > 0);
    const hasAddress = !!(profile?.addressStreet && profile.addressStreet.trim().length > 0);
    const hasCityStateZip = !!(profile?.addressCity && profile.addressCity.trim().length > 0);
    const hasPhone = !!(profile?.phone && profile.phone.trim().length > 0);
    const hasEmail = !!(profile?.email && profile.email.trim().length > 0);
    const hasWebsite = !!(profile?.website && profile.website.trim().length > 0);

    // Check if onboarding is already completed/skipped
    const isCompleted = org?.onboardingStatus === "completed" || org?.onboardingStatus === "skipped";

    // Determine missing steps (only required ones block completion)
    const missingSteps: string[] = [];
    if (!hasOwnerName) missingSteps.push("owner_name");
    if (!hasSchoolName) missingSteps.push("school_name");
    if (!hasMartialArtsStyle) missingSteps.push("martial_arts_style");
    if (!hasAddress) missingSteps.push("address");
    if (!hasCityStateZip) missingSteps.push("city_state_zip");
    if (!hasPhone) missingSteps.push("phone");
    if (!hasEmail) missingSteps.push("email");
    if (!hasWebsite) missingSteps.push("website");
    if (!hasLogoLight) missingSteps.push("logo_light");
    if (!hasLogoDark) missingSteps.push("logo_dark");

    // needsOnboarding only if not completed AND there are missing required steps
    // Once completed, never show again (user can update in Settings)
    const needsOnboarding = !isCompleted && missingSteps.length > 0;

    return {
      isCompleted,
      needsOnboarding,
      missingSteps,
      currentStep: org?.onboardingStep || 1,
      profile: profile
        ? {
            schoolName: profile.schoolName,
            displayName: profile.displayName,
            logoLightUrl: profile.logoLightUrl || profile.logoLightData || null,
            logoDarkUrl: profile.logoDarkUrl || profile.logoDarkData || null,
          }
        : null,
      settings: settings
        ? {
            operatorName: settings.operatorName,
            schoolName: settings.schoolName,
          }
        : null,
    };
  }),

  /**
   * Save owner name (step 1)
   */
  saveOwnerName: orgScopedProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const orgId = ctx.currentOrganizationId;

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
        const [legacySettings] = await db.select({ id: dojoSettings.id }).from(dojoSettings).limit(1);
        if (legacySettings) {
          await db.update(dojoSettings)
            .set({ operatorName: input.name, organizationId: orgId, updatedAt: new Date().toISOString() })
            .where(eq(dojoSettings.id, legacySettings.id));
        } else {
          await db.insert(dojoSettings).values({ operatorName: input.name, organizationId: orgId, setupCompleted: 0 });
        }
      }

      await db.update(organizations)
        .set({ onboardingStatus: "in_progress", onboardingStep: 2 })
        .where(eq(organizations.id, orgId));

      return { success: true };
    }),

  /**
   * Save school name (step 2)
   */
  saveSchoolName: orgScopedProcedure
    .input(z.object({ schoolName: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const orgId = ctx.currentOrganizationId;

      await upsertSchoolProfile(orgId, { schoolName: input.schoolName });

      const [existing] = await db
        .select({ id: dojoSettings.id })
        .from(dojoSettings)
        .where(eq(dojoSettings.organizationId, orgId))
        .limit(1);

      if (existing) {
        await db.update(dojoSettings)
          .set({ schoolName: input.schoolName, updatedAt: new Date().toISOString() })
          .where(eq(dojoSettings.organizationId, orgId));
      }

      await db.update(organizations)
        .set({ name: input.schoolName, onboardingStep: 3 })
        .where(eq(organizations.id, orgId));

      return { success: true };
    }),

  /**
   * Save a single profile field (generic mutation for address, phone, email, website, etc.)
   */
  saveProfileField: orgScopedProcedure
    .input(
      z.object({
        field: z.enum([
          "martialArtsStyle",
          "addressStreet",
          "cityStateZip",
          "phone",
          "email",
          "website",
        ]),
        value: z.string().max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const orgId = ctx.currentOrganizationId;

      if (input.field === "martialArtsStyle") {
        // Save to dojo_settings.martialArtsStyle
        const [existing] = await db
          .select({ id: dojoSettings.id })
          .from(dojoSettings)
          .where(eq(dojoSettings.organizationId, orgId))
          .limit(1);

        if (existing) {
          await db.update(dojoSettings)
            .set({ martialArtsStyle: input.value, updatedAt: new Date().toISOString() })
            .where(eq(dojoSettings.organizationId, orgId));
        }
        return { success: true };
      }

      if (input.field === "cityStateZip") {
        // Parse JSON: { city, state, zip }
        let city = "", state = "", zip = "";
        try {
          const parsed = JSON.parse(input.value);
          city = parsed.city || "";
          state = parsed.state || "";
          zip = parsed.zip || "";
        } catch {
          // Fallback: treat entire value as city
          city = input.value;
        }
        await upsertSchoolProfile(orgId, { addressCity: city, addressState: state, addressPostal: zip });
        return { success: true };
      }

      // Map field names to school_profiles columns
      const fieldMap: Record<string, Partial<typeof schoolProfiles.$inferInsert>> = {
        addressStreet: { addressStreet: input.value },
        phone: { phone: input.value },
        email: { email: input.value },
        website: { website: input.value },
      };

      const updateData = fieldMap[input.field];
      if (updateData) {
        await upsertSchoolProfile(orgId, updateData);
      }

      return { success: true };
    }),

  /**
   * Upload a logo by storing the base64 data directly in the database.
   * No external storage service needed — works on Railway without AWS/Forge API.
   */
  uploadLogo: orgScopedProcedure
    .input(
      z.object({
        type: z.enum(["light", "dark"]),
        fileData: z.string(),
        mimeType: z.string().default("image/png"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const orgId = ctx.currentOrganizationId;

      let dataUrl = input.fileData;
      if (!dataUrl.startsWith("data:")) {
        dataUrl = `data:${input.mimeType};base64,${dataUrl}`;
      }

      const maxBytes = 3 * 1024 * 1024;
      if (dataUrl.length > maxBytes) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: "Logo file is too large. Please use an image under 2MB.",
        });
      }

      // Write to both data column (for large base64) AND url column (for Settings page display)
      const updateData =
        input.type === "light"
          ? { logoLightData: dataUrl, logoLightUrl: dataUrl, logoIconLightUrl: dataUrl }
          : { logoDarkData: dataUrl, logoDarkUrl: dataUrl, logoIconDarkUrl: dataUrl };

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

      if (input.type === "light") {
        await db.update(organizations).set({ onboardingStep: 4 }).where(eq(organizations.id, orgId));
      } else {
        await db.update(organizations).set({ onboardingStep: 5 }).where(eq(organizations.id, orgId));
      }

      return { success: true, url: dataUrl };
    }),

  /**
   * Save logo URL (when a URL is already available, not base64)
   */
  saveLogo: orgScopedProcedure
    .input(z.object({ type: z.enum(["light", "dark"]), url: z.string().max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const orgId = ctx.currentOrganizationId;
      const isDataUrl = input.url.startsWith("data:");

      let updateData: Record<string, string>;
      if (isDataUrl) {
        updateData = input.type === "light" ? { logoLightData: input.url } : { logoDarkData: input.url };
      } else {
        updateData =
          input.type === "light"
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
        await db.insert(schoolProfiles).values({ organizationId: orgId, schoolName: "My Dojo", ...updateData });
      }

      return { success: true };
    }),

  /**
   * Mark onboarding as complete or skipped
   */
  completeOnboarding: orgScopedProcedure
    .input(z.object({ skipped: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const orgId = ctx.currentOrganizationId;

      await db.update(organizations)
        .set({ onboardingStatus: input.skipped ? "skipped" : "completed", onboardingStep: 99 })
        .where(eq(organizations.id, orgId));

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
