import { TRPCError } from '@trpc/server';
import { organizations } from '../drizzle/schema';
import { eq, and, or } from 'drizzle-orm';
import { z } from 'zod';
import { kiosks } from '../drizzle/schema';
import { getDb } from './db';
import { router, protectedProcedure, publicProcedure } from './_core/trpc';
import { KioskConfigSchema } from '../shared/kioskConfigSchema';
import { DEFAULT_KIOSK_CONFIG } from '../shared/kioskConfig';

/**
 * Generate a unique slug from a name
 */
function generateSlug(name: string, orgId: number): string {
  return `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;
}

/**
 * Parse kiosk config from JSON string
 * Handles both legacy (single config) and new (draft/published) formats
 */
function parseKioskConfig(configStr: string | null) {
  if (!configStr) return { draft: null, published: null, enabled: true };
  
  try {
    const parsed = JSON.parse(configStr);
    // Check if it's the new format (has draft/published keys)
    if (parsed.draft !== undefined || parsed.published !== undefined) {
      return {
        draft: parsed.draft || null,
        published: parsed.published || null,
        enabled: parsed.enabled !== false,
      };
    }
    // Legacy format - single config, treat as draft
    return {
      draft: parsed,
      published: null,
      enabled: true,
    };
  } catch (e) {
    return { draft: null, published: null, enabled: true };
  }
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
              eq(kiosks.organizationId, ctx.currentOrganizationId!),
              eq(kiosks.locationId, input.locationId)
            )
          );

        return result.map(k => {
          const configData = parseKioskConfig(k.config);
          return {
            id: k.id,
            name: k.name,
            slug: k.slug,
            isActive: k.isActive,
            draftConfig: configData.draft || DEFAULT_KIOSK_CONFIG,
            publishedConfig: configData.published || DEFAULT_KIOSK_CONFIG,
            enabled: configData.enabled,
            createdAt: k.createdAt,
            updatedAt: k.updatedAt,
          };
        });
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
        const orgId = ctx.currentOrganizationId;
        const slug = generateSlug(input.name, orgId);
        
        // Store config in new format (draft/published)
        const configData = {
          draft: input.config || null,
          published: null,
          enabled: true,
        };
        
        const result = await ctx.db
          .insert(kiosks)
          .values({
            organizationId: orgId,
            locationId: input.locationId,
            name: input.name,
            slug: slug,
            isActive: 1,
            config: JSON.stringify(configData),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        const kioskId = result[0];

        return {
          id: kioskId,
          name: input.name,
          slug: slug,
          isActive: 1,
          draftConfig: input.config || DEFAULT_KIOSK_CONFIG,
          publishedConfig: DEFAULT_KIOSK_CONFIG,
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch (e) {
        console.error('[Kiosk Device] Create error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create kiosk',
        });
      }
    }),

  /**
   * Get a specific kiosk by ID
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
              eq(kiosks.organizationId, ctx.currentOrganizationId!)
            )
          )
          .limit(1);

        if (!result || result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Kiosk not found',
          });
        }

        const kiosk = result[0];
        const configData = parseKioskConfig(kiosk.config);

        return {
          id: kiosk.id,
          name: kiosk.name,
          slug: kiosk.slug,
          isActive: kiosk.isActive,
          draftConfig: configData.draft || DEFAULT_KIOSK_CONFIG,
          publishedConfig: configData.published || DEFAULT_KIOSK_CONFIG,
          enabled: configData.enabled,
          createdAt: kiosk.createdAt,
          updatedAt: kiosk.updatedAt,
        };
      } catch (e) {
        console.error('[Kiosk Device] Get by ID error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get kiosk',
        });
      }
    }),

  /**
   * Get kiosk by slug (public, returns published config only)
   * NOTE: This is a PUBLIC procedure - kiosk displays call this without authentication
   * The slug must be globally unique OR we need to accept orgPublicId as well
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Query by slug only - assumes slug is globally unique per organization
        // If you need org scoping, pass orgPublicId in the URL
        const result = await ctx.db
          .select()
          .from(kiosks)
          .where(eq(kiosks.slug, input.slug))
          .limit(1);

        if (!result || result.length === 0) {
          console.log('[Kiosk Device] Kiosk not found for slug:', input.slug);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'NO_KIOSK_FOUND',
          });
        }

        const kiosk = result[0];
        
        // Check if isActive (using existing schema field)
        if (kiosk.isActive !== 1) {
          console.log('[Kiosk Device] Kiosk is disabled:', kiosk.id);
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'DISABLED',
          });
        }

        // Parse config from legacy field
        const configData = parseKioskConfig(kiosk.config);
        const publishedConfig = configData.published;

        // Use published config or fallback to DEFAULT_KIOSK_CONFIG
        const finalConfig = publishedConfig || DEFAULT_KIOSK_CONFIG;

        return {
          id: kiosk.id,
          organizationId: kiosk.organizationId,
          name: kiosk.name,
          slug: kiosk.slug,
          isActive: kiosk.isActive,
          publishedConfig: finalConfig,
        };
      } catch (e) {
        if (e instanceof TRPCError) throw e;
        console.error('[Kiosk Device] Get by slug error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'QUERY_ERROR',
        });
      }
    }),

  /**
   * Save draft configuration for a kiosk
   */
  saveDraft: protectedProcedure
    .input(
      z.object({
        kioskId: z.number(),
        config: KioskConfigSchema,
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
        // Get current kiosk
        const current = await ctx.db
          .select()
          .from(kiosks)
          .where(
            and(
              eq(kiosks.id, input.kioskId),
              eq(kiosks.organizationId, ctx.organizationId)
            )
          )
          .limit(1);

        if (!current || current.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Kiosk not found',
          });
        }

        // Ensure input.config is not undefined
        if (!input.config) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Configuration is required',
          });
        }

        // Validate the input config using safeParse
        const validationResult = KioskConfigSchema.safeParse(input.config);
        if (!validationResult.success) {
          console.error('[Kiosk Device] Draft config validation failed:', validationResult.error);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid kiosk configuration',
          });
        }

        // Update draft in config field - ensure all values are defined
        const currentConfig = parseKioskConfig(current[0].config);
        const newConfig = {
          draft: validationResult.data || DEFAULT_KIOSK_CONFIG,
          published: currentConfig.published || DEFAULT_KIOSK_CONFIG,
          enabled: currentConfig.enabled !== false,
        };

        await ctx.db
          .update(kiosks)
          .set({
            config: JSON.stringify(newConfig),
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(kiosks.id, input.kioskId),
              eq(kiosks.organizationId, ctx.organizationId)
            )
          );

        return {
          success: true,
          message: 'Draft saved',
          draftConfig: input.config,
        };
      } catch (e) {
        console.error('[Kiosk Device] Save draft error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save draft',
        });
      }
    }),

  /**
   * Publish kiosk configuration
   * Copies draft config to published config and sets publishedAt timestamp
   */
  publish: protectedProcedure
    .input(
      z.object({
        kioskId: z.number(),
        config: KioskConfigSchema.optional(), // If not provided, publish current draft
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
        // Get current kiosk to read draft
        const current = await ctx.db
          .select()
          .from(kiosks)
          .where(
            and(
              eq(kiosks.id, input.kioskId),
              eq(kiosks.organizationId, ctx.organizationId)
            )
          )
          .limit(1);

        if (!current || current.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Kiosk not found',
          });
        }

        // Use provided config or current draft
        let configToPublish = input.config;
        if (!configToPublish) {
          // Try to get from draftConfig field
          if (current[0].draftConfig) {
            try {
              configToPublish = JSON.parse(current[0].draftConfig);
            } catch (e) {
              console.error('[Kiosk Device] Failed to parse draftConfig:', e);
            }
          }
          // Fall back to legacy config field
          if (!configToPublish) {
            const configData = parseKioskConfig(current[0].config);
            configToPublish = configData.draft || configData.published;
          }
        }

        // Ensure we have a config before validation
        if (!configToPublish) {
          configToPublish = DEFAULT_KIOSK_CONFIG;
        }

        // Validate the config using safeParse
        const validationResult = KioskConfigSchema.safeParse(configToPublish);
        if (!validationResult.success) {
          console.error('[Kiosk Device] Config validation failed:', validationResult.error);
          // Use DEFAULT_KIOSK_CONFIG if validation fails
          configToPublish = DEFAULT_KIOSK_CONFIG;
        } else {
          // Use the validated config
          configToPublish = validationResult.data;
        }

        const now = new Date().toISOString();
        
        // Store both draft and published config (ensure not undefined)
        const newConfig = {
          draft: configToPublish || DEFAULT_KIOSK_CONFIG,
          published: configToPublish || DEFAULT_KIOSK_CONFIG,
          enabled: true,
        };

        await ctx.db
          .update(kiosks)
          .set({
            config: JSON.stringify(newConfig),
            isActive: 1,
            updatedAt: now,
          })
          .where(
            and(
              eq(kiosks.id, input.kioskId),
              eq(kiosks.organizationId, ctx.organizationId)
            )
          );

        return {
          success: true,
          message: 'Published successfully',
          publishedAt: now,
          publishedConfig: configToPublish,
        };
      } catch (e) {
        console.error('[Kiosk Device] Publish error:', e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to publish',
        });
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
              eq(kiosks.organizationId, ctx.currentOrganizationId!),            )
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
        const newSlug = generateSlug(newName, ctx.currentOrganizationId!);

        const result = await ctx.db
          .insert(kiosks)
          .values({
            organizationId: ctx.currentOrganizationId!,
            locationId: orig.locationId,
            name: newName,
            slug: newSlug,
            isActive: 1,
            config: orig.config,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        return {
          id: result[0],
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
});
