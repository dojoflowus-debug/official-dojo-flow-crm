import { router, orgScopedProcedure } from './_core/trpc';
import { z } from 'zod';
import { KioskConfig } from '../shared/kioskConfig';

export const designTemplatesRouter = router({
  // Create a new design template
  create: orgScopedProcedure
    .input(z.object({
      name: z.string().min(1, 'Template name is required').max(255),
      description: z.string().max(500).optional(),
      config: z.record(z.any()), // KioskConfig object
      isPublic: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Note: Database table creation pending migration
      // For now, return mock response
      return {
        id: Math.random(),
        organizationId: ctx.currentOrganizationId,
        createdByUserId: ctx.user?.id || 'unknown',
        name: input.name,
        description: input.description,
        config: input.config,
        isPublic: input.isPublic,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }),

  // List all templates for the organization
  list: orgScopedProcedure
    .query(async ({ ctx }) => {
      // Note: Database table creation pending migration
      // For now, return empty array
      return [];
    }),

  // Get a specific template
  getById: orgScopedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      // Note: Database table creation pending migration
      return null;
    }),

  // Update a template
  update: orgScopedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().max(500).optional(),
      config: z.record(z.any()).optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Note: Database table creation pending migration
      return { success: true };
    }),

  // Delete a template
  delete: orgScopedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Note: Database table creation pending migration
      return { success: true };
    }),

  // Duplicate a template
  duplicate: orgScopedProcedure
    .input(z.object({
      id: z.number(),
      newName: z.string().min(1).max(255),
    }))
    .mutation(async ({ ctx, input }) => {
      // Note: Database table creation pending migration
      return { success: true };
    }),

  // Apply template to a kiosk
  applyToKiosk: orgScopedProcedure
    .input(z.object({
      templateId: z.number(),
      kioskId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Note: Database table creation pending migration
      return { success: true };
    }),
});
