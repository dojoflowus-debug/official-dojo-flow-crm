import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { kiosk_locations } from '../drizzle/schema';
import { storagePut, storageGet } from './storage';

/**
 * Kiosk Appearance Schema - defines all customizable settings
 */
const kioskAppearanceSchema = z.object({
  // Background settings
  background: z.object({
    type: z.enum(['color', 'image', 'preset']).default('color'),
    color: z.string().default('#ffffff'), // Hex color
    presetKey: z.string().nullable().optional(), // e.g., 'dojo-warm', 'minimal-white'
    customUrl: z.string().nullable().optional(), // Custom uploaded image URL
    blur: z.number().min(0).max(24).default(0),
    dim: z.number().min(0).max(100).default(0),
    fit: z.enum(['cover', 'contain', 'stretch']).default('cover'),
  }),
  
  // Typography settings
  typography: z.object({
    fontFamily: z.string().default('system-ui'),
    titleSize: z.number().min(16).max(96).default(48),
    titleWeight: z.number().min(300).max(900).default(700),
    subtitleSize: z.number().min(12).max(48).default(24),
    letterSpacing: z.number().min(-2).max(10).default(0),
    buttonFontSize: z.number().min(12).max(32).default(16),
  }),
  
  // Layout settings
  layout: z.object({
    spacing: z.enum(['compact', 'comfortable', 'spacious']).default('comfortable'),
    alignment: z.enum(['left', 'center', 'right']).default('center'),
    maxWidth: z.number().min(300).max(1200).default(800),
  }),
  
  // Content settings
  content: z.object({
    headline: z.string().default('Welcome to Training'),
    subtext: z.string().default('Sign in or get started below'),
    logoUrl: z.string().nullable().optional(),
    accentColor: z.string().default('#ef4444'),
  }),
  
  // Behavior settings
  behavior: z.object({
    showMemberLogin: z.boolean().default(true),
    showNewStudent: z.boolean().default(true),
    idleSeconds: z.number().min(10).max(600).default(60),
    autoReturn: z.boolean().default(true),
    screensaverEnabled: z.boolean().default(true),
    screensaverMessage: z.string().default('Tap to continue'),
    screensaverLogoUrl: z.string().nullable().optional(),
  }),
});

export type KioskAppearance = z.infer<typeof kioskAppearanceSchema>;

/**
 * Get default appearance settings
 */
export const getDefaultAppearance = (): KioskAppearance => ({
  background: {
    type: 'color',
    color: '#ffffff',
    presetKey: null,
    customUrl: null,
    blur: 0,
    dim: 0,
    fit: 'cover',
  },
  typography: {
    fontFamily: 'system-ui',
    titleSize: 48,
    titleWeight: 700,
    subtitleSize: 24,
    letterSpacing: 0,
    buttonFontSize: 16,
  },
  layout: {
    spacing: 'comfortable',
    alignment: 'center',
    maxWidth: 800,
  },
  content: {
    headline: 'Welcome to Training',
    subtext: 'Sign in or get started below',
    logoUrl: null,
    accentColor: '#ef4444',
  },
  behavior: {
    showMemberLogin: true,
    showNewStudent: true,
    idleSeconds: 60,
    autoReturn: true,
    screensaverEnabled: true,
    screensaverMessage: 'Tap to continue',
    screensaverLogoUrl: null,
  },
});

/**
 * Resolve background to actual values
 */
export const resolveKioskBackground = (appearance: KioskAppearance) => {
  const bg = appearance.background;
  
  if (bg.type === 'color') {
    return {
      type: 'color',
      color: bg.color,
      blur: bg.blur,
      dim: bg.dim,
      fit: bg.fit,
    };
  }
  
  if (bg.type === 'image' && bg.customUrl) {
    return {
      type: 'image',
      url: bg.customUrl,
      blur: bg.blur,
      dim: bg.dim,
      fit: bg.fit,
    };
  }
  
  if (bg.type === 'preset' && bg.presetKey) {
    // Map preset key to actual URL
    const presetMap: Record<string, string> = {
      'dojo-warm': '/public/presets/dojo-warm.jpg',
      'minimal-white': '/public/presets/minimal-white.jpg',
      'night-mode': '/public/presets/night-mode.jpg',
      'high-contrast': '/public/presets/high-contrast.jpg',
    };
    
    return {
      type: 'image',
      url: presetMap[bg.presetKey] || '/public/presets/minimal-white.jpg',
      blur: bg.blur,
      dim: bg.dim,
      fit: bg.fit,
    };
  }
  
  // Default to white background
  return {
    type: 'color',
    color: '#ffffff',
    blur: 0,
    dim: 0,
    fit: 'cover',
  };
};

export const kioskStudioRouter = router({
  /**
   * Get current draft and published settings for a location
   */
  getSettings: protectedProcedure
    .input(z.object({ locationId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const location = await ctx.db
          .select()
          .from(kiosk_locations)
          .where(eq(kiosk_locations.id, input.locationId))
          .limit(1);

        if (!location || location.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Location not found',
          });
        }

        const loc = location[0];
        const draft = loc.kioskAppearanceDraft
          ? JSON.parse(loc.kioskAppearanceDraft)
          : getDefaultAppearance();
        const published = loc.kioskAppearancePublished
          ? JSON.parse(loc.kioskAppearancePublished)
          : getDefaultAppearance();

        return {
          draft: kioskAppearanceSchema.parse(draft),
          published: kioskAppearanceSchema.parse(published),
          version: loc.kioskAppearanceVersion || 1,
        };
      } catch (e) {
        console.error('[Kiosk Studio] Get settings error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get kiosk settings',
        });
      }
    }),

  /**
   * Save draft settings (no publish)
   */
  saveDraft: protectedProcedure
    .input(
      z.object({
        locationId: z.number(),
        appearance: kioskAppearanceSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        await ctx.db
          .update(kiosk_locations)
          .set({
            kioskAppearanceDraft: JSON.stringify(input.appearance),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(kiosk_locations.id, input.locationId));

        return { success: true, message: 'Draft saved' };
      } catch (e) {
        console.error('[Kiosk Studio] Save draft error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save draft',
        });
      }
    }),

  /**
   * Publish draft settings (copy draft to published and increment version)
   */
  publish: protectedProcedure
    .input(z.object({ locationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const location = await ctx.db
          .select()
          .from(kiosk_locations)
          .where(eq(kiosk_locations.id, input.locationId))
          .limit(1);

        if (!location || location.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Location not found',
          });
        }

        const loc = location[0];
        const draft = loc.kioskAppearanceDraft || JSON.stringify(getDefaultAppearance());
        const newVersion = (loc.kioskAppearanceVersion || 1) + 1;

        await ctx.db
          .update(kiosk_locations)
          .set({
            kioskAppearancePublished: draft,
            kioskAppearanceVersion: newVersion,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(kiosk_locations.id, input.locationId));

        return {
          success: true,
          message: 'Settings published',
          version: newVersion,
        };
      } catch (e) {
        console.error('[Kiosk Studio] Publish error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to publish settings',
        });
      }
    }),

  /**
   * Reset to default settings
   */
  resetToDefault: protectedProcedure
    .input(z.object({ locationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const defaultAppearance = getDefaultAppearance();

        await ctx.db
          .update(kiosk_locations)
          .set({
            kioskAppearanceDraft: JSON.stringify(defaultAppearance),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(kiosk_locations.id, input.locationId));

        return {
          success: true,
          message: 'Reset to default',
          appearance: defaultAppearance,
        };
      } catch (e) {
        console.error('[Kiosk Studio] Reset error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reset settings',
        });
      }
    }),

  /**
   * Upload background image
   */
  uploadBackgroundImage: protectedProcedure
    .input(
      z.object({
        locationId: z.number(),
        fileName: z.string(),
        fileData: z.string(),
        mimeType: z.string(),
        blur: z.number().min(0).max(24).optional().default(0),
        dim: z.number().min(0).max(100).optional().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');
        const fileSizeMB = buffer.length / (1024 * 1024);

        if (fileSizeMB > 8) {
          throw new Error('File size must be less than 8MB');
        }

        const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validMimeTypes.includes(input.mimeType)) {
          throw new Error('Invalid file type. Supported: JPEG, PNG, WebP');
        }

        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const extension = input.fileName.split('.').pop() || 'jpg';
        const fileKey = `kiosk-backgrounds/bg-${input.locationId}-${timestamp}-${randomSuffix}.${extension}`;

        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Update draft with new image URL
        const location = await ctx.db
          .select()
          .from(kiosk_locations)
          .where(eq(kiosk_locations.id, input.locationId))
          .limit(1);

        if (location && location.length > 0) {
          const draft = location[0].kioskAppearanceDraft
            ? JSON.parse(location[0].kioskAppearanceDraft)
            : getDefaultAppearance();

          draft.background.type = 'image';
          draft.background.customUrl = url;
          draft.background.blur = input.blur;
          draft.background.dim = input.dim;

          await ctx.db
            .update(kiosk_locations)
            .set({
              kioskAppearanceDraft: JSON.stringify(draft),
              updatedAt: new Date().toISOString(),
            })
            .where(eq(kiosk_locations.id, input.locationId));
        }

        return {
          success: true,
          url,
          message: 'Background image uploaded successfully',
        };
      } catch (e) {
        console.error('[Kiosk Studio] Upload error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: e instanceof Error ? e.message : 'Failed to upload background image',
        });
      }
    }),

  /**
   * Get published settings for kiosk display (public)
   */
  getPublishedSettings: protectedProcedure
    .input(z.object({ locationId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const location = await ctx.db
          .select()
          .from(kiosk_locations)
          .where(eq(kiosk_locations.id, input.locationId))
          .limit(1);

        if (!location || location.length === 0) {
          return {
            appearance: getDefaultAppearance(),
            version: 1,
          };
        }

        const loc = location[0];
        const published = loc.kioskAppearancePublished
          ? JSON.parse(loc.kioskAppearancePublished)
          : getDefaultAppearance();

        return {
          appearance: kioskAppearanceSchema.parse(published),
          version: loc.kioskAppearanceVersion || 1,
        };
      } catch (e) {
        console.error('[Kiosk Studio] Get published error:', e);
        return {
          appearance: getDefaultAppearance(),
          version: 1,
        };
      }
    }),

  /**
   * Apply theme preset to draft
   */
  applyThemePreset: protectedProcedure
    .input(
      z.object({
        locationId: z.number(),
        presetName: z.enum(['minimal-white', 'dojo-warm', 'night-mode', 'high-contrast']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const presets: Record<string, Partial<KioskAppearance>> = {
          'minimal-white': {
            background: {
              type: 'color',
              color: '#ffffff',
              presetKey: 'minimal-white',
              customUrl: null,
              blur: 0,
              dim: 0,
              fit: 'cover',
            },
            content: {
              headline: 'Welcome',
              subtext: 'Sign in or get started',
              logoUrl: null,
              accentColor: '#000000',
            },
          },
          'dojo-warm': {
            background: {
              type: 'preset',
              color: '#f5e6d3',
              presetKey: 'dojo-warm',
              customUrl: null,
              blur: 0,
              dim: 0,
              fit: 'cover',
            },
            content: {
              headline: 'Welcome to Dojo',
              subtext: 'Train. Grow. Achieve.',
              logoUrl: null,
              accentColor: '#d97706',
            },
          },
          'night-mode': {
            background: {
              type: 'color',
              color: '#1a1a1a',
              presetKey: 'night-mode',
              customUrl: null,
              blur: 0,
              dim: 0,
              fit: 'cover',
            },
            content: {
              headline: 'Welcome',
              subtext: 'Sign in or get started',
              logoUrl: null,
              accentColor: '#60a5fa',
            },
          },
          'high-contrast': {
            background: {
              type: 'color',
              color: '#ffffff',
              presetKey: 'high-contrast',
              customUrl: null,
              blur: 0,
              dim: 0,
              fit: 'cover',
            },
            content: {
              headline: 'Welcome',
              subtext: 'Sign in or get started',
              logoUrl: null,
              accentColor: '#ff0000',
            },
          },
        };

        const location = await ctx.db
          .select()
          .from(kiosk_locations)
          .where(eq(kiosk_locations.id, input.locationId))
          .limit(1);

        if (!location || location.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Location not found',
          });
        }

        const draft = location[0].kioskAppearanceDraft
          ? JSON.parse(location[0].kioskAppearanceDraft)
          : getDefaultAppearance();

        const preset = presets[input.presetName];
        const updated = {
          ...draft,
          ...preset,
        };

        await ctx.db
          .update(kiosk_locations)
          .set({
            kioskAppearanceDraft: JSON.stringify(updated),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(kiosk_locations.id, input.locationId));

        return {
          success: true,
          message: `Applied ${input.presetName} preset`,
          appearance: updated,
        };
      } catch (e) {
        console.error('[Kiosk Studio] Apply preset error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to apply preset',
        });
      }
    }),
});
