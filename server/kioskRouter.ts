import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { locations } from "../drizzle/schema";

// Kiosk settings schema
const kioskSettingsSchema = z.object({
  theme: z.enum(["default", "modern", "minimal", "bold"]).default("default"),
  appearance: z.object({
    accentColor: z.string().default("#ef4444"), // red-500
    logoLight: z.string().optional(),
    logoDark: z.string().optional(),
    headline: z.string().default("Welcome to Training"),
    subtext: z.string().default("Sign in or get started below"),
    backgroundIntensity: z.number().min(0).max(100).default(70),
    backgroundBlur: z.number().min(0).max(10).default(3),
  }),
  behavior: z.object({
    showMemberLogin: z.boolean().default(true),
    showNewStudent: z.boolean().default(true),
    idleTimeout: z.number().min(10).max(300).default(30), // seconds
    autoReturn: z.boolean().default(true),
    kaiEnrollment: z.boolean().default(false),
    facialRecognition: z.boolean().default(false), // future feature
  }),
});

export type KioskSettings = z.infer<typeof kioskSettingsSchema>;

// Default kiosk settings
export const defaultKioskSettings: KioskSettings = {
  theme: "default",
  appearance: {
    accentColor: "#ef4444",
    headline: "Welcome to Training",
    subtext: "Sign in or get started below",
    backgroundIntensity: 70,
    backgroundBlur: 3,
  },
  behavior: {
    showMemberLogin: true,
    showNewStudent: true,
    idleTimeout: 30,
    autoReturn: true,
    kaiEnrollment: false,
    facialRecognition: false,
  },
};

// Generate slug from location name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const kioskRouter = router({
  /**
   * Get kiosk settings for a location (admin only)
   */
  getKioskSettings: protectedProcedure
    .input(z.object({ locationId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const location = await ctx.db
        .select()
        .from(locations)
        .where(eq(locations.id, input.locationId))
        .limit(1);

      if (!location || location.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Location not found",
        });
      }

      const loc = location[0];
      let settings = defaultKioskSettings;

      if (loc.kioskSettings) {
        try {
          settings = JSON.parse(loc.kioskSettings);
        } catch (e) {
          console.error("Failed to parse kiosk settings:", e);
        }
      }

      return {
        locationId: loc.id,
        locationName: loc.name,
        kioskEnabled: loc.kioskEnabled === 1,
        kioskSlug: loc.kioskSlug,
        kioskUrl: loc.kioskSlug
          ? `${process.env.VITE_APP_URL || ""}/kiosk/${loc.kioskSlug}`
          : null,
        settings,
      };
    }),

  /**
   * Update kiosk settings for a location (admin only)
   */
  updateKioskSettings: protectedProcedure
    .input(
      z.object({
        locationId: z.number(),
        kioskEnabled: z.boolean(),
        settings: kioskSettingsSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Get location to generate slug if needed
      const location = await ctx.db
        .select()
        .from(locations)
        .where(eq(locations.id, input.locationId))
        .limit(1);

      if (!location || location.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Location not found",
        });
      }

      const loc = location[0];
      let slug = loc.kioskSlug;

      // Generate slug if enabling kiosk and no slug exists
      if (input.kioskEnabled && !slug) {
        slug = generateSlug(loc.name);
        
        // Check if slug already exists
        const existing = await ctx.db
          .select()
          .from(locations)
          .where(eq(locations.kioskSlug, slug))
          .limit(1);

        if (existing && existing.length > 0) {
          // Add location ID to make it unique
          slug = `${slug}-${input.locationId}`;
        }
      }

      // Update location
      await ctx.db
        .update(locations)
        .set({
          kioskEnabled: input.kioskEnabled ? 1 : 0,
          kioskSlug: slug,
          kioskSettings: JSON.stringify(input.settings),
          updatedAt: new Date(),
        })
        .where(eq(locations.id, input.locationId));

      return {
        success: true,
        kioskSlug: slug,
        kioskUrl: slug
          ? `${process.env.VITE_APP_URL || ""}/kiosk/${slug}`
          : null,
      };
    }),

  /**
   * Get kiosk runtime configuration by slug (public)
   */
  getKioskRuntime: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const location = await ctx.db
        .select()
        .from(locations)
        .where(eq(locations.kioskSlug, input.slug))
        .limit(1);

      if (!location || location.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kiosk not found",
        });
      }

      const loc = location[0];

      if (loc.kioskEnabled !== 1) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Kiosk is disabled for this location",
        });
      }

      let settings = defaultKioskSettings;

      if (loc.kioskSettings) {
        try {
          settings = JSON.parse(loc.kioskSettings);
        } catch (e) {
          console.error("Failed to parse kiosk settings:", e);
        }
      }

      return {
        locationId: loc.id,
        locationName: loc.name,
        locationAddress: loc.address,
        settings,
      };
    }),

  /**
   * List all locations with kiosk status (admin only)
   */
  listLocations: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    const allLocations = await ctx.db
      .select({
        id: locations.id,
        name: locations.name,
        address: locations.address,
        kioskEnabled: locations.kioskEnabled,
        kioskSlug: locations.kioskSlug,
      })
      .from(locations)
      .where(eq(locations.isActive, 1));

    return allLocations.map((loc) => ({
      ...loc,
      kioskEnabled: loc.kioskEnabled === 1,
      kioskUrl: loc.kioskSlug
        ? `${process.env.VITE_APP_URL || ""}/kiosk/${loc.kioskSlug}`
        : null,
    }));
  }),
});
