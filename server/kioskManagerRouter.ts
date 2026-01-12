import { router, protectedProcedure, publicProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { locations, kioskLocations } from '../drizzle/schema';
import { getDb } from './db';

// Default kiosk settings
const DEFAULT_SETTINGS = {
  theme: { accentColor: '#ef4444', fontFamily: 'Inter' },
  content: {
    headline: 'Welcome to Training',
    subtext: 'Tap to begin',
    tileLeft: { title: 'Check In', subtitle: 'Tap here to check into class', button: 'Check In' },
    tileRight: { title: 'Start Training', subtitle: 'New students start here', button: 'Start Training' },
    infoLeftLabel: 'Next Class',
    infoRightLabel: 'Today\'s Focus'
  },
  layout: { showClock: true, showInfoBar: true },
  background: { type: 'solid', color: '#ffffff', presetKey: null, customUrl: null, blur: 0, dim: 0, fit: 'cover' },
  screensaver: { enabled: true, idleSeconds: 60, message: 'Tap the screen to check-in', showLogo: true }
};

/**
 * Kiosk Manager Router - Handles location and kiosk configuration management
 */
export const kioskManagerRouter = router({
  /**
   * Seed default location if none exist
   */
  seedDefaultLocation: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.db || !ctx.organizationId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database or organization context not available',
        });
      }

      try {
        // Check if any kiosk locations exist
        const existing = await ctx.db
          .select()
          .from(kioskLocations)
          .limit(1);

        if (existing.length > 0) {
          return { success: true, message: 'Locations already exist' };
        }

        // Create default location
        const result = await ctx.db
          .insert(kioskLocations)
          .values({
            name: 'Main Dojo',
            locationId: null,
            isActive: 1,
            kioskAppearanceDraft: JSON.stringify(DEFAULT_SETTINGS),
            kioskAppearancePublished: JSON.stringify(DEFAULT_SETTINGS),
            kioskAppearanceVersion: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        return {
          success: true,
          message: 'Default location created',
          locationId: result[0],
        };
      } catch (error) {
        console.error('Error seeding default location:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to seed default location',
        });
      }
    }),

  /**
   * Get all kiosk locations (PUBLIC - for kiosk display)
   */
  getKioskLocations: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const result = await ctx.db
          .select()
          .from(kioskLocations)
          .where(eq(kioskLocations.isActive, 1));

        return result.map(loc => ({
          id: loc.id,
          name: loc.name,
          slug: loc.name?.toLowerCase().replace(/\s+/g, '-'),
          isEnabled: loc.isActive,
          createdAt: loc.createdAt,
          updatedAt: loc.updatedAt,
        }));
      } catch (error) {
        console.error('Error fetching kiosk locations:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch kiosk locations',
        });
      }
    }),

  /**
   * Get all locations for the organization (original method)
   */
  getLocations: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.db || !ctx.organizationId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database or organization context not available',
        });
      }

      try {
        const result = await ctx.db
          .select()
          .from(locations)
          .where(eq(locations.organizationId, ctx.organizationId));

        return result.map(loc => ({
          id: loc.id,
          name: loc.name,
          address: loc.address,
          city: loc.city,
          state: loc.state,
          zipCode: loc.zipCode,
          isActive: loc.isActive,
          kioskEnabled: loc.kioskEnabled,
          createdAt: loc.createdAt,
          updatedAt: loc.updatedAt,
        }));
      } catch (error) {
        console.error('Error fetching locations:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch locations',
        });
      }
    }),

  /**
   * Get a single location with its kiosk configuration
   */
  getLocation: protectedProcedure
    .input(z.object({ locationId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.db || !ctx.organizationId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database or organization context not available',
        });
      }

      try {
        const location = await ctx.db
          .select()
          .from(locations)
          .where(
            and(
              eq(locations.id, input.locationId),
              eq(locations.organizationId, ctx.organizationId)
            )
          )
          .limit(1);

        if (!location || location.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Location not found',
          });
        }

        return location[0];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Error fetching location:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch location',
        });
      }
    }),

  /**
   * Create a new kiosk location
   */
  createKioskLocation: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Location name is required'),
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
        const result = await ctx.db
          .insert(kioskLocations)
          .values({
            name: input.name,
            locationId: null,
            isActive: 1,
            kioskAppearanceDraft: JSON.stringify(DEFAULT_SETTINGS),
            kioskAppearancePublished: JSON.stringify(DEFAULT_SETTINGS),
            kioskAppearanceVersion: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        return {
          success: true,
          locationId: result[0],
          message: 'Kiosk location created successfully',
        };
      } catch (error) {
        console.error('Error creating kiosk location:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create kiosk location',
        });
      }
    }),

  /**
   * Create a new location (original method)
   */
  createLocation: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Location name is required'),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db || !ctx.organizationId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database or organization context not available',
        });
      }

      try {
        const result = await ctx.db
          .insert(locations)
          .values({
            name: input.name,
            address: input.address,
            city: input.city,
            state: input.state,
            zipCode: input.zipCode,
            organizationId: ctx.organizationId,
            isActive: 1,
            kioskEnabled: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        return {
          success: true,
          locationId: result[0],
          message: 'Location created successfully',
        };
      } catch (error) {
        console.error('Error creating location:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create location',
        });
      }
    }),

  /**
   * Update a kiosk location
   */
  updateLocation: protectedProcedure
    .input(
      z.object({
        locationId: z.number(),
        name: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        isActive: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db || !ctx.organizationId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database or organization context not available',
        });
      }

      try {
        const updateData: any = {
          updatedAt: new Date().toISOString(),
        };

        if (input.name !== undefined) updateData.name = input.name;
        if (input.address !== undefined) updateData.address = input.address;
        if (input.city !== undefined) updateData.city = input.city;
        if (input.state !== undefined) updateData.state = input.state;
        if (input.zipCode !== undefined) updateData.zipCode = input.zipCode;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        await ctx.db
          .update(locations)
          .set(updateData)
          .where(
            and(
              eq(locations.id, input.locationId),
              eq(locations.organizationId, ctx.organizationId)
            )
          );

        return {
          success: true,
          message: 'Location updated successfully',
        };
      } catch (error) {
        console.error('Error updating location:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update location',
        });
      }
    }),

  /**
   * Delete a kiosk location
   */
  deleteLocation: protectedProcedure
    .input(z.object({ locationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db || !ctx.organizationId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database or organization context not available',
        });
      }

      try {
        await ctx.db
          .delete(locations)
          .where(
            and(
              eq(locations.id, input.locationId),
              eq(locations.organizationId, ctx.organizationId)
            )
          );

        return {
          success: true,
          message: 'Location deleted successfully',
        };
      } catch (error) {
        console.error('Error deleting location:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete location',
        });
      }
    }),

  /**
   * Get kiosk configuration by location ID (PUBLIC - for kiosk display)
   */
  getKioskConfig: publicProcedure
    .input(z.object({ kioskLocationId: z.number().positive() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      // Return null if invalid location ID
      if (input.kioskLocationId <= 0) {
        return null;
      }

      try {
        const config = await ctx.db
          .select()
          .from(kioskLocations)
          .where(eq(kioskLocations.id, input.kioskLocationId))
          .limit(1);

        if (!config || config.length === 0) {
          return null;
        }

        const data = config[0];
        return {
          id: data.id,
          name: data.name,
          slug: data.name?.toLowerCase().replace(/\s+/g, '-'),
          isEnabled: data.isActive,
          draft: data.kioskAppearanceDraft ? JSON.parse(data.kioskAppearanceDraft) : DEFAULT_SETTINGS,
          published: data.kioskAppearancePublished ? JSON.parse(data.kioskAppearancePublished) : DEFAULT_SETTINGS,
          version: data.kioskAppearanceVersion,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      } catch (error) {
        console.error('Error fetching kiosk config:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch kiosk configuration',
        });
      }
    }),

  /**
   * Update kiosk appearance (draft)
   */
  updateKioskAppearance: protectedProcedure
    .input(
      z.object({
        kioskLocationId: z.number(),
        appearance: z.record(z.any()),
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
        const appearanceJson = JSON.stringify(input.appearance);

        await ctx.db
          .update(kioskLocations)
          .set({
            kioskAppearanceDraft: appearanceJson,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(kioskLocations.id, input.kioskLocationId));

        return {
          success: true,
          message: 'Kiosk appearance updated (draft)',
        };
      } catch (error) {
        console.error('Error updating kiosk appearance:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update kiosk appearance',
        });
      }
    }),

  /**
   * Publish kiosk appearance
   */
  publishKioskAppearance: protectedProcedure
    .input(z.object({ kioskLocationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const config = await ctx.db
          .select()
          .from(kioskLocations)
          .where(eq(kioskLocations.id, input.kioskLocationId))
          .limit(1);

        if (!config || config.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Kiosk configuration not found',
          });
        }

        const currentConfig = config[0];
        const newVersion = (currentConfig.kioskAppearanceVersion || 1) + 1;

        await ctx.db
          .update(kioskLocations)
          .set({
            kioskAppearancePublished: currentConfig.kioskAppearanceDraft,
            kioskAppearanceVersion: newVersion,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(kioskLocations.id, input.kioskLocationId));

        return {
          success: true,
          version: newVersion,
          message: 'Kiosk appearance published successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Error publishing kiosk appearance:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to publish kiosk appearance',
        });
      }
    }),

  /**
   * Rename a kiosk location
   */
  renameLocation: protectedProcedure
    .input(z.object({
      locationId: z.number().positive(),
      name: z.string().min(1).max(255),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const result = await ctx.db
          .update(kioskLocations)
          .set({
            name: input.name,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(kioskLocations.id, input.locationId));

        if (result.rowsAffected === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Location not found',
          });
        }

        return { success: true, message: 'Location renamed' };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Error renaming location:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to rename location',
        });
      }
    }),

  /**
   * Duplicate a kiosk location with all its settings
   */
  duplicateLocation: protectedProcedure
    .input(z.object({
      locationId: z.number().positive(),
      name: z.string().min(1).max(255),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Fetch the source location
        const sourceLocation = await ctx.db
          .select()
          .from(kioskLocations)
          .where(eq(kioskLocations.id, input.locationId))
          .limit(1);

        if (sourceLocation.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Location not found',
          });
        }

        const source = sourceLocation[0];

        // Create a new location with copied settings
        const result = await ctx.db
          .insert(kioskLocations)
          .values({
            name: input.name,
            locationId: source.locationId,
            isActive: 1,
            kioskAppearanceDraft: source.kioskAppearanceDraft,
            kioskAppearancePublished: source.kioskAppearancePublished,
            kioskAppearanceVersion: source.kioskAppearanceVersion,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        return {
          id: result[0],
          name: input.name,
          isActive: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Error duplicating location:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to duplicate location',
        });
      }
    }),

  /**
   * Archive a kiosk location (soft delete - sets isActive to 0)
   */
  archiveLocation: protectedProcedure
    .input(z.object({
      locationId: z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Check if this is the last active location
        const activeLocations = await ctx.db
          .select()
          .from(kioskLocations)
          .where(eq(kioskLocations.isActive, 1));

        if (activeLocations.length === 1 && activeLocations[0].id === input.locationId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot archive the last active location',
          });
        }

        const result = await ctx.db
          .update(kioskLocations)
          .set({
            isActive: 0,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(kioskLocations.id, input.locationId));

        if (result.rowsAffected === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Location not found',
          });
        }

        return { success: true, message: 'Location archived' };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Error archiving location:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to archive location',
        });
      }
    }),
});
