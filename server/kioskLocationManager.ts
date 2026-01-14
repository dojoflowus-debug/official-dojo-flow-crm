import { router, protectedProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { kiosk_locations } from '../drizzle/schema';
import { getDb } from './db';

/**
 * Kiosk Location Manager - Handles CRUD operations for kiosk locations
 */
export const kioskLocationManagerRouter = router({
  /**
   * Rename a kiosk location
   */
  renameLocation: protectedProcedure
    .input(z.object({
      locationId: z.number().positive(),
      name: z.string().min(1).max(255),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db || !ctx.organizationId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database or organization context not available',
        });
      }

      try {
        const result = await ctx.db
          .update(kiosk_locations)
          .set({
            name: input.name,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(kiosk_locations.id, input.locationId));

        if (result.rowsAffected === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Location not found',
          });
        }

        return { success: true, message: 'Location renamed' };
      } catch (error) {
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
      if (!ctx.db || !ctx.organizationId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database or organization context not available',
        });
      }

      try {
        // Fetch the source location
        const sourceLocation = await ctx.db
          .select()
          .from(kiosk_locations)
          .where(eq(kiosk_locations.id, input.locationId))
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
          .insert(kiosk_locations)
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
      if (!ctx.db || !ctx.organizationId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database or organization context not available',
        });
      }

      try {
        // Check if this is the last active location
        const activeLocations = await ctx.db
          .select()
          .from(kiosk_locations)
          .where(eq(kiosk_locations.isActive, 1));

        if (activeLocations.length === 1 && activeLocations[0].id === input.locationId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot archive the last active location',
          });
        }

        const result = await ctx.db
          .update(kiosk_locations)
          .set({
            isActive: 0,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(kiosk_locations.id, input.locationId));

        if (result.rowsAffected === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Location not found',
          });
        }

        return { success: true, message: 'Location archived' };
      } catch (error) {
        console.error('Error archiving location:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to archive location',
        });
      }
    }),

  /**
   * Restore an archived location
   */
  restoreLocation: protectedProcedure
    .input(z.object({
      locationId: z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db || !ctx.organizationId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database or organization context not available',
        });
      }

      try {
        const result = await ctx.db
          .update(kiosk_locations)
          .set({
            isActive: 1,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(kiosk_locations.id, input.locationId));

        if (result.rowsAffected === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Location not found',
          });
        }

        return { success: true, message: 'Location restored' };
      } catch (error) {
        console.error('Error restoring location:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to restore location',
        });
      }
    }),
});
