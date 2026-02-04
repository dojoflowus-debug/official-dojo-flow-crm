import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { organizations } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const organizationsRouter = router({
  /**
   * Get public organization info (logo, name, brandColor) for lead capture pages
   * This endpoint is public and doesn't require authentication
   */
  getPublicInfo: publicProcedure
    .input(z.object({
      organizationId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const org = await db
        .select({
          name: organizations.name,
          logoUrl: organizations.logoUrl,
          brandColorPrimary: organizations.brandColorPrimary,
          brandColorSecondary: organizations.brandColorSecondary,
          brandColorTertiary: organizations.brandColorTertiary,
        })
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);

      if (!org || org.length === 0) {
        return {
          name: 'Dojo AI',
          logoUrl: null,
          brandColorPrimary: '#EF4444', // Default red
          brandColorSecondary: '#1E40AF', // Default blue
          brandColorTertiary: '#F59E0B', // Default amber
        };
      }

      return {
        name: org[0].name || 'Dojo AI',
        logoUrl: org[0].logoUrl || null,
        brandColorPrimary: org[0].brandColorPrimary || '#EF4444',
        brandColorSecondary: org[0].brandColorSecondary || '#1E40AF',
        brandColorTertiary: org[0].brandColorTertiary || '#F59E0B',
      };
    }),
});
