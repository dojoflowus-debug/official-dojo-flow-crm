import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { dojoSettings } from '../drizzle/schema';
import { storagePut } from './storage';
import { eq } from 'drizzle-orm';

export const kioskSettingsRouter = router({
  // Update kiosk settings (business name and logo)
  update: protectedProcedure
    .input(
      z.object({
        businessName: z.string().min(1, 'Business name is required'),
        logoSquare: z.string().url('Logo must be a valid URL').optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Update dojo_settings table
        const db = await getDb();
        if (!db) {
          throw new Error('Database connection not available');
        }
        
        await db
          .update(dojoSettings)
          .set({
            businessName: input.businessName,
            logoSquare: input.logoSquare || null,
          })
          .execute();

        return {
          success: true,
          message: 'Kiosk settings updated successfully',
        };
      } catch (error) {
        console.error('[Kiosk Settings] Update error:', error);
        throw new Error('Failed to update kiosk settings');
      }
    }),

  // Upload logo to S3
  uploadLogo: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Extract base64 data (remove data:image/...;base64, prefix)
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate unique filename
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const extension = input.fileName.split('.').pop() || 'png';
        const fileKey = `kiosk-logos/logo-${timestamp}-${randomSuffix}.${extension}`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        return {
          success: true,
          url,
          fileKey,
        };
      } catch (error) {
        console.error('[Kiosk Settings] Upload error:', error);
        throw new Error('Failed to upload logo');
      }
    }),
});
