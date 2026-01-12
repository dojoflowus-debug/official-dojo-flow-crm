import { router, protectedProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { kiosks } from '../drizzle/schema';
import { getDb } from './db';
import { KioskConfigSchema } from '../shared/kioskConfigSchema';

/**
 * Generate a unique slug from a name
 */
function generateSlug(name: string, orgId: number): string {
  return `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;
}

export const kioskDeviceRouter = router({
  /**
   * List all kiosks for a specific location
   */
  listByLocation: protectedProcedure
    .input(z.object({ locationId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const result = await ctx.db
          .select()
          .from(kiosks)
          .where(
            and(
              eq(kiosks.organizationId, ctx.organizationId),
              eq(kiosks.locationId, input.locationId)
            )
          );

        return result.map(k => ({
          id: k.id,
          name: k.name,
          slug: k.slug,
          isActive: k.isActive,
          config: k.config ? JSON.parse(k.config) : null,
          createdAt: k.createdAt,
          updatedAt: k.updatedAt,
        }));
      } catch (e) {
        console.error('[Kiosk Device] List by location error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list kiosks',
        });
      }
    }),

  /**
   * Create a new kiosk device
   */
  create: protectedProcedure
    .input(
      z.object({
        locationId: z.number(),
        name: z.string().min(1).max(255),
        config: KioskConfigSchema.optional(),
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
        const orgId = ctx.currentOrganizationId || 180001; // Fallback to default org
        const slug = generateSlug(input.name, orgId)
        
        const result = await ctx.db
          .insert(kiosks)
          .values({
            organizationId: orgId,
            locationId: input.locationId,
            name: input.name,
            slug: slug,
            isActive: 1,
            config: input.config ? JSON.stringify(input.config) : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })

        const kioskId = result[0];

        return {
          id: kioskId,
          name: input.name,
          slug: slug,
          isActive: 1,
          config: input.config || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error('[Kiosk Device] Create error:', errorMsg, e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create kiosk: ${errorMsg}`,
        })
      }
    }),

  /**
   * Update a kiosk device
   */
  update: protectedProcedure
    .input(
      z.object({
        kioskId: z.number(),
        patch: z.object({
          name: z.string().optional(),
          config: z.record(z.any()).optional(),
          isActive: z.number().optional(),
        }),
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
        const updateData: any = {
          updatedAt: new Date().toISOString(),
        };

        if (input.patch.name !== undefined) {
          updateData.name = input.patch.name;
        }

        if (input.patch.config !== undefined) {
          updateData.config = JSON.stringify(input.patch.config);
        }

        if (input.patch.isActive !== undefined) {
          updateData.isActive = input.patch.isActive;
        }

        await ctx.db
          .update(kiosks)
          .set(updateData)
          .where(
            and(
              eq(kiosks.id, input.kioskId),
              eq(kiosks.organizationId, ctx.organizationId)
            )
          );

        return { success: true };
      } catch (e) {
        console.error('[Kiosk Device] Update error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update kiosk',
        });
      }
    }),

  /**
   * Delete a kiosk device (soft delete by setting isActive to 0)
   */
  delete: protectedProcedure
    .input(z.object({ kioskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        await ctx.db
          .update(kiosks)
          .set({
            isActive: 0,
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(kiosks.id, input.kioskId),
              eq(kiosks.organizationId, ctx.organizationId)
            )
          );

        return { success: true };
      } catch (e) {
        console.error('[Kiosk Device] Delete error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete kiosk',
        });
      }
    }),

  /**
   * Duplicate a kiosk device
   */
  duplicate: protectedProcedure
    .input(z.object({ kioskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Get the original kiosk
        const original = await ctx.db
          .select()
          .from(kiosks)
          .where(
            and(
              eq(kiosks.id, input.kioskId),
              eq(kiosks.organizationId, ctx.organizationId)
            )
          )
          .limit(1);

        if (!original || original.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Kiosk not found',
          });
        }

        const orig = original[0];
        const newName = `${orig.name} (Copy)`;
        const newSlug = generateSlug(newName, ctx.organizationId);

        const result = await ctx.db
          .insert(kiosks)
          .values({
            organizationId: ctx.organizationId,
            locationId: orig.locationId,
            name: newName,
            slug: newSlug,
            isActive: 1,
            config: orig.config,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        const newKioskId = result[0];

        return {
          id: newKioskId,
          name: newName,
          slug: newSlug,
          isActive: 1,
          config: orig.config ? JSON.parse(orig.config) : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch (e) {
        console.error('[Kiosk Device] Duplicate error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to duplicate kiosk',
        });
      }
    }),

  /**
   * Get a single kiosk by ID
   */
  getById: protectedProcedure
    .input(z.object({ kioskId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const result = await ctx.db
          .select()
          .from(kiosks)
          .where(
            and(
              eq(kiosks.id, input.kioskId),
              eq(kiosks.organizationId, ctx.organizationId)
            )
          )
          .limit(1);

        if (!result || result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Kiosk not found',
          });
        }

        const k = result[0];
        return {
          id: k.id,
          name: k.name,
          slug: k.slug,
          isActive: k.isActive,
          config: k.config ? JSON.parse(k.config) : null,
          createdAt: k.createdAt,
          updatedAt: k.updatedAt,
        };
      } catch (e) {
        console.error('[Kiosk Device] Get by ID error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get kiosk',
        });
      }
    }),
});
