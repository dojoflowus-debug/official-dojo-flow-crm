import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { organizations, schoolProfiles } from '../../drizzle/schema';
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
      
      // Join with school_profiles to get detailed branding info
      const result = await db
        .select({
          orgName: organizations.name,
          orgLogoUrl: organizations.logoUrl,
          schoolName: schoolProfiles.schoolName,
          displayName: schoolProfiles.displayName,
          logoLightUrl: schoolProfiles.logoLightUrl,
          logoDarkUrl: schoolProfiles.logoDarkUrl,
          brandColorPrimary: schoolProfiles.brandColorPrimary,
          brandColorSecondary: schoolProfiles.brandColorSecondary,
          brandColorTertiary: schoolProfiles.brandColorTertiary,
        })
        .from(organizations)
        .leftJoin(schoolProfiles, eq(schoolProfiles.organizationId, organizations.id))
        .where(eq(organizations.id, input.organizationId))
        .limit(1);

      if (!result || result.length === 0) {
        return {
          name: 'Dojo AI',
          logoUrl: null,
          brandColorPrimary: '#EF4444', // Default red
          brandColorSecondary: '#1E40AF', // Default blue
          brandColorTertiary: '#F59E0B', // Default amber
        };
      }

      const data = result[0];
      
      console.log('[organizations.getPublicInfo] Raw data:', data);
      
      // Prioritize school_profiles data, fall back to organizations data
      const response = {
        name: data.schoolName || data.displayName || data.orgName || 'Dojo AI',
        logoUrl: data.logoLightUrl || data.logoDarkUrl || data.orgLogoUrl || null,
        logoIconLightUrl: data.logoIconLightUrl || null,
        logoIconDarkUrl: data.logoIconDarkUrl || null,
        brandColorPrimary: data.brandColorPrimary || '#EF4444',
        brandColorSecondary: data.brandColorSecondary || '#1E40AF',
        brandColorTertiary: data.brandColorTertiary || '#F59E0B',
      };
      
      console.log('[organizations.getPublicInfo] Returning:', response);
      return response;
    }),
});
