import { z } from "zod";
import { router, orgScopedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getSchoolProfile, upsertSchoolProfile, updateSchoolLogo } from "./schoolProfileDb";

// Validation schema for school profile
const schoolProfileSchema = z.object({
  schoolName: z.string().min(1, "School name is required").max(255),
  displayName: z.string().max(255).optional().nullable(),
  tagline: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email("Invalid email address").max(255).optional().nullable().or(z.literal("")),
  website: z.string().url("Invalid website URL").max(500).optional().nullable().or(z.literal("")),
  addressStreet: z.string().max(255).optional().nullable(),
  addressCity: z.string().max(100).optional().nullable(),
  addressState: z.string().max(100).optional().nullable(),
  addressPostal: z.string().max(20).optional().nullable(),
  addressCountry: z.string().max(100).optional().nullable(),
  logoLightUrl: z.string().max(1000).optional().nullable(),
  logoDarkUrl: z.string().max(1000).optional().nullable(),
  logoIconLightUrl: z.string().max(1000).optional().nullable(),
  logoIconDarkUrl: z.string().max(1000).optional().nullable(),
  brandColorPrimary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional().nullable(),
  brandColorSecondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional().nullable(),
  brandColorTertiary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional().nullable(),
  timezone: z.string().max(100).optional().nullable(),
  currency: z.string().max(10).optional().nullable(),
});

export const schoolProfileRouter = router({
  /**
   * Get the current organization's school profile
   * Creates an empty profile if none exists
   */
  get: orgScopedProcedure
    .query(async ({ ctx }) => {
      try {
        const profile = await getSchoolProfile(ctx.currentOrganizationId);
        return profile;
      } catch (error: any) {
        console.error("[SchoolProfile] Error getting profile:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get school profile",
        });
      }
    }),

  /**
   * Update the current organization's school profile
   */
  upsert: orgScopedProcedure
    .input(schoolProfileSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Clean up empty strings to null for optional URL fields
        const cleanedInput = {
          ...input,
          email: input.email === "" ? null : input.email,
          website: input.website === "" ? null : input.website,
        };
        
        const profile = await upsertSchoolProfile(ctx.currentOrganizationId, cleanedInput);
        return profile;
      } catch (error: any) {
        console.error("[SchoolProfile] Error upserting profile:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to save school profile",
        });
      }
    }),

  /**
   * Update logo URL for the school profile
   */
  updateLogo: orgScopedProcedure
    .input(z.object({
      type: z.enum(["light", "dark", "icon-light", "icon-dark"]),
      url: z.string().max(1000).nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const profile = await updateSchoolLogo(
          ctx.currentOrganizationId,
          input.type,
          input.url
        );
        return profile;
      } catch (error: any) {
        console.error("[SchoolProfile] Error updating logo:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update logo",
        });
      }
    }),

  /**
   * Get list of common timezones
   */
  getTimezones: orgScopedProcedure
    .query(async () => {
      // Return common timezones
      return [
        { value: "America/New_York", label: "Eastern Time (US & Canada)" },
        { value: "America/Chicago", label: "Central Time (US & Canada)" },
        { value: "America/Denver", label: "Mountain Time (US & Canada)" },
        { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
        { value: "America/Anchorage", label: "Alaska" },
        { value: "Pacific/Honolulu", label: "Hawaii" },
        { value: "America/Phoenix", label: "Arizona" },
        { value: "America/Toronto", label: "Toronto" },
        { value: "America/Vancouver", label: "Vancouver" },
        { value: "Europe/London", label: "London" },
        { value: "Europe/Paris", label: "Paris" },
        { value: "Europe/Berlin", label: "Berlin" },
        { value: "Asia/Tokyo", label: "Tokyo" },
        { value: "Asia/Shanghai", label: "Shanghai" },
        { value: "Asia/Singapore", label: "Singapore" },
        { value: "Australia/Sydney", label: "Sydney" },
        { value: "Australia/Melbourne", label: "Melbourne" },
        { value: "Pacific/Auckland", label: "Auckland" },
      ];
    }),
});
