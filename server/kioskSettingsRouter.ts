import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { storagePut } from './storage';
import { getKioskSettingsByLocationSlug, updateKioskBackgroundImage, resetKioskBackground, updateKioskBackgroundEffects, updateLocationKioskTheme, getKioskSettingsByLocationId } from './db';
import { eq } from 'drizzle-orm';
import { kioskLocations } from '../drizzle/schema';
import { KioskConfigSchema } from '../shared/kioskConfigSchema';

export const kioskSettingsRouter = router({
  getSettings: protectedProcedure
    .input(z.object({ locationSlug: z.string() }))
    .query(async ({ input }) => {
      try {
        const settings = await getKioskSettingsByLocationSlug(input.locationSlug);
        return { success: true, settings };
      } catch (error) {
        console.error('[Kiosk Settings] Get error:', error);
        throw new Error('Failed to get kiosk settings');
      }
    }),

  uploadBackgroundImage: protectedProcedure
    .input(z.object({
      locationId: z.number().min(1),
      fileName: z.string(),
      fileData: z.string(),
      mimeType: z.string(),
      blur: z.number().min(0).max(24).optional().default(0),
      dim: z.number().min(0).max(70).optional().default(0),
    }))
    .mutation(async ({ input }) => {
      try {
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');
        const fileSizeMB = buffer.length / (1024 * 1024);
        
        if (fileSizeMB > 8) throw new Error('File size must be less than 8MB');
        const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validMimeTypes.includes(input.mimeType)) throw new Error('Invalid file type');

        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const extension = input.fileName.split('.').pop() || 'jpg';
        const fileKey = `kiosk-backgrounds/bg-${input.locationId}-${timestamp}-${randomSuffix}.${extension}`;

        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        const success = await updateKioskBackgroundImage(input.locationId, url, input.blur, input.dim);

        if (!success) throw new Error('Failed to save background settings');
        return { success: true, url, fileKey };
      } catch (error) {
        console.error('[Kiosk Settings] Background upload error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to upload background image');
      }
    }),

  updateBackgroundEffects: protectedProcedure
    .input(z.object({
      locationId: z.number().min(1),
      blur: z.number().min(0).max(24),
      dim: z.number().min(0).max(70),
    }))
    .mutation(async ({ input }) => {
      try {
        const success = await updateKioskBackgroundEffects(input.locationId, input.blur, input.dim);
        if (!success) throw new Error('Failed to update background effects');
        const settings = await getKioskSettingsByLocationId(input.locationId);
        return { success: true, settings };
      } catch (error) {
        console.error('[Kiosk Settings] Update effects error:', error);
        throw new Error('Failed to update background effects');
      }
    }),

  resetBackground: protectedProcedure
    .input(z.object({
      locationId: z.number().min(1),
      presetKey: z.string().optional().default('dojo-warm-lights'),
    }))
    .mutation(async ({ input }) => {
      try {
        const success = await resetKioskBackground(input.locationId, input.presetKey);
        if (!success) throw new Error('Failed to reset background');
        const settings = await getKioskSettingsByLocationId(input.locationId);
        return { success: true, settings };
      } catch (error) {
        console.error('[Kiosk Settings] Reset background error:', error);
        throw new Error('Failed to reset background');
      }
    }),

  updateTheme: protectedProcedure
    .input(z.object({
      locationId: z.number().min(1),
      mode: z.enum(['dark', 'light']),
      primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
      accentColor: z.string().regex(/^#[0-9A-F]{6}$/i),
    }))
    .mutation(async ({ input }) => {
      try {
        const success = await updateLocationKioskTheme(input.locationId, input.mode, input.primaryColor, input.accentColor);
        if (!success) throw new Error('Failed to update theme');
        const settings = await getKioskSettingsByLocationId(input.locationId);
        return { success: true, settings };
      } catch (error) {
        console.error('[Kiosk Settings] Update theme error:', error);
        throw new Error('Failed to update theme');
      }
    }),

  /**
   * Save draft configuration for a kiosk location
   */
  saveDraft: protectedProcedure
    .input(z.object({
      locationSlug: z.string(),
      config: KioskConfigSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.db) throw new Error('Database not available');
        
        const locations = await ctx.db
          .select()
          .from(kioskLocations)
          .where(eq(kioskLocations.kioskSlug, input.locationSlug))
          .limit(1);
        
        if (!locations || locations.length === 0) {
          throw new Error('Location not found');
        }
        
        const location = locations[0];
        
        await ctx.db
          .update(kioskLocations)
          .set({
            kioskAppearanceDraft: JSON.stringify(input.config),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(kioskLocations.id, location.id));
        
        return {
          success: true,
          message: 'Draft saved successfully',
          draftSavedAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[Kiosk Settings] Save draft error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to save draft');
      }
    }),

  /**
   * Publish configuration for a kiosk location
   */
  publish: protectedProcedure
    .input(z.object({
      locationSlug: z.string(),
      config: KioskConfigSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.db) throw new Error('Database not available');
        
        const locations = await ctx.db
          .select()
          .from(kioskLocations)
          .where(eq(kioskLocations.kioskSlug, input.locationSlug))
          .limit(1);
        
        if (!locations || locations.length === 0) {
          throw new Error('Location not found');
        }
        
        const location = locations[0];
        
        await ctx.db
          .update(kioskLocations)
          .set({
            kioskAppearancePublished: JSON.stringify(input.config),
            kioskAppearanceVersion: (location.kioskAppearanceVersion || 0) + 1,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(kioskLocations.id, location.id));
        
        return {
          success: true,
          message: 'Published successfully',
          publishedAt: new Date().toISOString(),
          version: (location.kioskAppearanceVersion || 0) + 1,
        };
      } catch (error) {
        console.error('[Kiosk Settings] Publish error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to publish');
      }
    }),
});
