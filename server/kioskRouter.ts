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
    backgroundImageUrl: z.string().optional(), // S3 URL for custom background
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
    backgroundImageUrl: undefined, // Will use default white background if not set
    backgroundIntensity: 0, // No overlay by default
    backgroundBlur: 0, // No blur by default
  },
  behavior: {
    showMemberLogin: true,
    showNewStudent: true,
    idleTimeout: 60, // 60 seconds default
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
          const parsed = JSON.parse(loc.kioskSettings);
          // Validate and merge with defaults to ensure all required fields exist
          settings = kioskSettingsSchema.parse(parsed);
        } catch (e) {
          console.error("Failed to parse kiosk settings:", e);
          // Use defaults if parsing or validation fails
          settings = defaultKioskSettings;
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
      console.log('[TRUTH_TRACE] updateKioskSettings SAVE INPUT:', JSON.stringify(input, null, 2));
      
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
      const settingsJson = JSON.stringify(input.settings);
      console.log('[TRUTH_TRACE] updateKioskSettings - About to save to DB:', { locationId: input.locationId, kioskEnabled: input.kioskEnabled, settingsJson: settingsJson });
      
      await ctx.db
        .update(locations)
        .set({
          kioskEnabled: input.kioskEnabled ? 1 : 0,
          kioskSlug: slug,
          kioskSettings: settingsJson,
          updatedAt:new Date().toISOString(),
        })
        .where(eq(locations.id, input.locationId));

      const result = {
        success: true,
        kioskSlug: slug,
        kioskUrl: slug
          ? `${process.env.VITE_APP_URL || ""}/kiosk/${slug}`
          : null,
      };
      
      console.log('[TRUTH_TRACE] updateKioskSettings SAVE RESULT:', JSON.stringify(result));
      return result;
    }),

  /**
   * Get kiosk runtime data with classes and students (public)
   * Fetches real-time data for the kiosk display
   */
  getKioskData: publicProcedure
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

      // Fetch upcoming classes for this location
      const { classes: classesTable, classEnrollments } = await import("../drizzle/schema");
      const { and, gte } = await import("drizzle-orm");
      
      const upcomingClasses = await ctx.db
        .select()
        .from(classesTable)
        .where(
          and(
            eq(classesTable.locationId, loc.id),
            eq(classesTable.isActive, 1)
          )
        )
        .limit(5);

      // Get today's focus (from class descriptions or announcements)
      const todaysFocus = upcomingClasses
        .slice(0, 3)
        .map(c => c.name)
        .filter(Boolean);

      return {
        locationId: loc.id,
        locationName: loc.name,
        locationAddress: loc.address,
        upcomingClasses: upcomingClasses.map(c => ({
          id: c.id,
          name: c.name,
          time: c.startTime,
          instructor: c.instructorName,
          capacity: c.capacity,
        })),
        todaysFocus: todaysFocus.length > 0 ? todaysFocus : ['Discipline', 'Confidence', 'Fitness'],
        nextClass: upcomingClasses[0] ? {
          name: upcomingClasses[0].name,
          time: upcomingClasses[0].startTime,
          minutesUntil: 30, // Will be calculated on client
        } : null,
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
          const parsed = JSON.parse(loc.kioskSettings);
          // Validate and merge with defaults to ensure all required fields exist
          settings = kioskSettingsSchema.parse(parsed);
        } catch (e) {
          console.error("Failed to parse kiosk settings:", e);
          // Use defaults if parsing or validation fails
          settings = defaultKioskSettings;
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

  /**
   * Get all preset backgrounds
   */
  getPresetBackgrounds: publicProcedure.query(async ({ ctx }) => {
    const { getPresetBackgrounds } = await import("./db");
    const backgrounds = await getPresetBackgrounds();
    return backgrounds;
  }),

  /**
   * Get public preset backgrounds from /client/public folder
   * Returns curated list of images suitable for kiosk backgrounds
   */
  getPublicPresetBackgrounds: publicProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
    // Curated list of preset backgrounds from public folder
    const presets = [
      // Training & Martial Arts
      {
        key: 'martial-arts-class',
        label: 'Martial Arts Class',
        imageUrl: '/martial-arts-class.jpg',
        category: 'training',
      },
      {
        key: 'hero-martial-arts',
        label: 'Hero Martial Arts',
        imageUrl: '/hero-martial-arts.jpg',
        category: 'training',
      },
      {
        key: 'taekwondo-class',
        label: 'Taekwondo Class',
        imageUrl: '/taekwondo-class.jpg',
        category: 'training',
      },
      {
        key: 'kids-martial-arts',
        label: 'Kids Martial Arts',
        imageUrl: '/kids-martial-arts.jpeg',
        category: 'training',
      },
      {
        key: 'belt-ceremony',
        label: 'Belt Ceremony',
        imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/uYEOkKpvvrKpVZSd.jpg',
        category: 'events',
      },
      // Wellness & Yoga
      {
        key: 'yoga-class',
        label: 'Yoga Class',
        imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/GdoSQiQBsJYnSmYP.jpg',
        category: 'wellness',
      },
      {
        key: 'yoga-studio-interior',
        label: 'Yoga Studio Interior',
        imageUrl: '/yoga-studio-interior.jpg',
        category: 'wellness',
      },
      {
        key: 'yoga-studio-modern',
        label: 'Modern Yoga Studio',
        imageUrl: '/yoga-studio-modern.jpg',
        category: 'wellness',
      },
      // Fitness
      {
        key: 'fitness-gym-interior',
        label: 'Fitness Gym',
        imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/LdvGiMXAKXQpZGqZ.jpg',
        category: 'fitness',
      },
      {
        key: 'personal-training',
        label: 'Personal Training',
        imageUrl: '/personal-training.jpg',
        category: 'fitness',
      },
      {
        key: 'fitness-hiit-class',
        label: 'HIIT Class',
        imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/OoAIOWSzzrtOeGct.png',
        category: 'fitness',
      },
      {
        key: 'fitness-group-class',
        label: 'Group Fitness Class',
        imageUrl: '/fitness-group-class.webp',
        category: 'fitness',
      },
      {
        key: 'fitness-class',
        label: 'Fitness Class',
        imageUrl: '/fitness-class.webp',
        category: 'fitness',
      },
      // Ambiance & Environment
      {
        key: 'env-zen-bamboo',
        label: 'Zen Bamboo',
        imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/DAMSUsdbzODERGTZ.jpg',
        category: 'ambiance',
      },
      {
        key: 'env-modern-white',
        label: 'Modern White',
        imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ZsouCVeOgEIjYUOk.jpg',
        category: 'ambiance',
      },
      {
        key: 'env-luxury-dojo',
        label: 'Luxury Dojo',
        imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/synbACcAtcrjANvY.jpg',
        category: 'ambiance',
      },
      {
        key: 'env-neon-dojo',
        label: 'Neon Dojo',
        imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ZBpYBQPXaEIVcTIs.jpg',
        category: 'ambiance',
      },
      {
        key: 'env-samurai-dojo',
        label: 'Samurai Dojo',
        imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/AAtHwKyLeHXmdqPs.jpg',
        category: 'ambiance',
      },
      // Welcome Screens
      {
        key: 'kiosk-welcome-bg',
        label: 'Kiosk Welcome',
        imageUrl: '/kiosk-welcome-bg.jpg',
        category: 'welcome',
      },
      {
        key: 'login-hero-dojoflow',
        label: 'DojoFlow Hero',
        imageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/pZRidNalhhnGhhfJ.jpg',
        category: 'welcome',
      },
    ];
    return presets;
  }),

  /**
   * Get location background with fallback logic
   */
  getLocationBackground: publicProcedure
    .input(z.object({ locationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { getLocationBackgroundWithFallback } = await import("./db");
      console.log('[TRUTH_TRACE] getLocationBackground query - locationId:', input.locationId);
      const background = await getLocationBackgroundWithFallback(input.locationId);
      console.log('[TRUTH_TRACE] getLocationBackground query - RETURNING background:', JSON.stringify(background));
      return background;
    }),

  /**
   * Update location background settings (protected)
   */
  updateLocationBackground: protectedProcedure
    .input(
      z.object({
        locationId: z.number(),
        source: z.enum(["preset", "custom"]),
        presetKey: z.string().optional().nullable(),
        customUrl: z.string().optional().nullable(),
        blur: z.number().min(0).max(24).optional(),
        dim: z.number().min(0).max(70).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const { updateLocationBackground } = await import("./db");
      const success = await updateLocationBackground(input.locationId, {
        source: input.source,
        presetKey: input.presetKey,
        customUrl: input.customUrl,
        blur: input.blur ?? 0,
        dim: input.dim ?? 0,
      });

      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update background settings",
        });
      }

      return { success: true, message: "Background updated successfully" };
    }),

  /**
   * Upload custom background image
   */
  uploadCustomBackground: protectedProcedure
    .input(
      z.object({
        locationId: z.number(),
        fileData: z.string(), // base64 encoded
        fileName: z.string(),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        // Import storage utilities
        const { storagePut } = await import("./storage");

        // Decode base64 and convert to buffer
        const buffer = Buffer.from(input.fileData, "base64");

        // Validate file size (5-8MB)
        const maxSize = 8 * 1024 * 1024; // 8MB
        if (buffer.length > maxSize) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File size exceeds 8MB limit",
          });
        }

        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `kiosk-backgrounds/location-${input.locationId}/${timestamp}-${randomSuffix}.jpg`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Update location background settings
        const { updateLocationBackground } = await import("./db");
        const success = await updateLocationBackground(input.locationId, {
          source: "custom",
          customUrl: url,
          blur: 0,
          dim: 0,
        });

        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to save background settings",
          });
        }

        return { success: true, url, message: "Background uploaded successfully" };
      } catch (error) {
        console.error("[kioskRouter] uploadCustomBackground error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to upload background",
        });
      }
    }),

  /**
   * Upload background image and save to appearance settings
   */
  uploadBackgroundImage: protectedProcedure
    .input(
      z.object({
        locationId: z.number(),
        fileData: z.string(), // base64 encoded
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const { storagePut } = await import("./storage");
        const { updateKioskSettings } = await import("./db");

        // Decode base64 and convert to buffer
        const buffer = Buffer.from(input.fileData, "base64");

        // Validate file size (8MB max)
        const maxSize = 8 * 1024 * 1024;
        if (buffer.length > maxSize) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File size exceeds 8MB limit",
          });
        }

        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `kiosk-backgrounds/location-${input.locationId}/${timestamp}-${randomSuffix}.jpg`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Update kiosk settings with background image URL
        const success = await updateKioskSettings(input.locationId, {
          appearance: {
            backgroundImageUrl: url,
          },
        });

        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to save background settings",
          });
        }

        return { success: true, url, message: "Background image uploaded successfully" };
      } catch (error) {
        console.error("[kioskRouter] uploadBackgroundImage error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to upload background image",
        });
      }
    }),

  /**
   * Remove custom background and revert to preset
   */
  /**
   * Student check-in endpoint
   * Records student check-in for attendance tracking
   */
  checkInStudent: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        studentId: z.number().optional(),
        studentName: z.string().optional(),
        classSessionId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Get location by slug
        const location = await ctx.db
          .select()
          .from(locations)
          .where(eq(locations.kioskSlug, input.slug))
          .limit(1);

        if (!location || location.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Location not found",
          });
        }

        const loc = location[0];

        // Import check-in table
        const { kioskCheckIns, students } = await import("../drizzle/schema");

        // Record check-in
        const checkInResult = await ctx.db
          .insert(kioskCheckIns)
          .values({
            studentId: input.studentId || null,
            checkInType: input.studentId ? 'student' : 'visitor',
            checkInTime: new Date().toISOString(),
            classSessionId: input.classSessionId || null,
          });

        // If student ID provided, also update attendance record
        if (input.studentId && input.classSessionId) {
          const { attendance } = await import("../drizzle/schema");
          
          await ctx.db
            .insert(attendance)
            .values({
              studentId: input.studentId,
              classSessionId: input.classSessionId,
              status: 'present',
              checkInTime: new Date().toISOString(),
            })
            .onDuplicateKeyUpdate({
              set: {
                status: 'present',
                checkInTime: new Date().toISOString(),
              },
            });
        }

        return {
          success: true,
          checkInId: checkInResult[0],
          message: `Check-in recorded for ${input.studentName || 'visitor'}`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[kioskRouter] checkInStudent error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to check in student",
        });
      }
    }),

  /**
   * Search for students by name or ID
   */
  searchStudents: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        query: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Get location by slug
        const location = await ctx.db
          .select()
          .from(locations)
          .where(eq(locations.kioskSlug, input.slug))
          .limit(1);

        if (!location || location.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Location not found",
          });
        }

        const loc = location[0];
        const { students } = await import("../drizzle/schema");
        const { or, like } = await import("drizzle-orm");

        // Search students by name or ID
        const searchResults = await ctx.db
          .select()
          .from(students)
          .where(
            or(
              like(students.firstName, `%${input.query}%`),
              like(students.lastName, `%${input.query}%`),
              like(students.email, `%${input.query}%`)
            )
          )
          .limit(10);

        return searchResults.map(s => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email,
          phone: s.phone,
          beltRank: s.beltRank,
          status: s.status,
          membershipStatus: s.membershipStatus,
        }));
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[kioskRouter] searchStudents error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to search students",
        });
      }
    }),

  removeCustomBackground: protectedProcedure
    .input(z.object({ locationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const { removeCustomBackground } = await import("./db");
      const success = await removeCustomBackground(input.locationId);

      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove custom background",
        });
      }

      return { success: true, message: "Custom background removed" };
    }),

  /**
   * Get a specific kiosk by ID
   */
  getKiosk: protectedProcedure
    .input(z.object({ kioskId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { kiosks } = await import("../drizzle/schema");
      const kiosk = await ctx.db
        .select()
        .from(kiosks)
        .where(eq(kiosks.id, input.kioskId))
        .limit(1);

      if (!kiosk || kiosk.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kiosk not found",
        });
      }

      const k = kiosk[0];
      let config = {};

      if (k.config) {
        try {
          config = JSON.parse(k.config);
        } catch (e) {
          console.error("Failed to parse kiosk config:", e);
          config = {};
        }
      }

      return {
        id: k.id,
        organizationId: k.organizationId,
        locationId: k.locationId,
        name: k.name,
        slug: k.slug,
        isActive: k.isActive === 1,
        config,
        createdAt: k.createdAt,
        updatedAt: k.updatedAt,
      };
    }),
});
