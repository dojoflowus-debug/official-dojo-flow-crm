import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getKioskDevices,
  getKioskDeviceById,
  createKioskDevice,
  updateKioskDeviceStatus,
  getKioskThemes,
  getKioskThemeById,
  createKioskTheme,
  updateKioskTheme,
  deleteKioskTheme,
  setActiveKioskTheme,
  upsertKioskThemeAsset,
  getActiveThemeForDevice,
  createKioskDeployment,
  getDeviceDeployments,
  createKioskSchedule,
  getThemeSchedules,
  updateKioskSchedule,
  deleteKioskSchedule,
} from "./db";

/**
 * Kiosk Designer Router - All procedures for kiosk theme management and deployment
 */
export const kioskDesignerRouter = router({
  /**
   * Get all kiosk devices for the current organization
   */
  getDevices: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user?.organizationId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No organization' });
      }

      const devices = await getKioskDevices(ctx.user.organizationId);
      return devices;
    }),

  /**
   * Get a single kiosk device by ID
   */
  getDevice: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .query(async ({ input }) => {
      const device = await getKioskDeviceById(input.deviceId);
      if (!device) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Device not found' });
      }
      return device;
    }),

  /**
   * Create a new kiosk device
   */
  createDevice: protectedProcedure
    .input(z.object({
      deviceName: z.string().min(1),
      location: z.string().min(1),
      deviceType: z.enum(['physical', 'virtual', 'web']).default('physical'),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.organizationId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No organization' });
      }

      const device = await createKioskDevice({
        organizationId: ctx.user.organizationId,
        deviceName: input.deviceName,
        location: input.location,
        deviceType: input.deviceType,
        status: 'inactive',
        onlineStatus: 0,
      });

      if (!device) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create device' });
      }

      return device;
    }),

  /**
   * Update device status
   */
  updateDeviceStatus: protectedProcedure
    .input(z.object({
      deviceId: z.number(),
      status: z.enum(['active', 'inactive', 'maintenance', 'offline']),
      onlineStatus: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const success = await updateKioskDeviceStatus(
        input.deviceId,
        input.status,
        input.onlineStatus ?? 0
      );

      if (!success) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update device' });
      }

      return { success: true };
    }),

  /**
   * Get all kiosk themes for the current organization
   */
  getThemes: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user?.organizationId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No organization' });
      }

      const themes = await getKioskThemes(ctx.user.organizationId);
      return themes;
    }),

  /**
   * Get a single kiosk theme with its assets
   */
  getTheme: protectedProcedure
    .input(z.object({ themeId: z.number() }))
    .query(async ({ input }) => {
      const theme = await getKioskThemeById(input.themeId);
      if (!theme) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Theme not found' });
      }
      return theme;
    }),

  /**
   * Create a new kiosk theme
   */
  createTheme: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      isDefault: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.organizationId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No organization' });
      }

      const theme = await createKioskTheme({
        organizationId: ctx.user.organizationId,
        name: input.name,
        description: input.description,
        isDefault: input.isDefault,
        isActive: 0,
      });

      if (!theme) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create theme' });
      }

      return theme;
    }),

  /**
   * Update a kiosk theme
   */
  updateTheme: protectedProcedure
    .input(z.object({
      themeId: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const success = await updateKioskTheme(input.themeId, {
        name: input.name,
        description: input.description,
      });

      if (!success) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update theme' });
      }

      return { success: true };
    }),

  /**
   * Delete a kiosk theme
   */
  deleteTheme: protectedProcedure
    .input(z.object({ themeId: z.number() }))
    .mutation(async ({ input }) => {
      const success = await deleteKioskTheme(input.themeId);

      if (!success) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete theme' });
      }

      return { success: true };
    }),

  /**
   * Set a theme as active
   */
  setActiveTheme: protectedProcedure
    .input(z.object({ themeId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.organizationId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No organization' });
      }

      const success = await setActiveKioskTheme(ctx.user.organizationId, input.themeId);

      if (!success) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to set active theme' });
      }

      return { success: true };
    }),

  /**
   * Duplicate a theme (create a copy)
   */
  duplicateTheme: protectedProcedure
    .input(z.object({
      themeId: z.number(),
      newName: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.organizationId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No organization' });
      }

      // Get the original theme
      const originalTheme = await getKioskThemeById(input.themeId);
      if (!originalTheme) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Theme not found' });
      }

      // Create a new theme with the same assets
      const newTheme = await createKioskTheme({
        organizationId: ctx.user.organizationId,
        name: input.newName,
        description: originalTheme.description,
        isDefault: 0,
        isActive: 0,
      });

      if (!newTheme) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to duplicate theme' });
      }

      // Copy assets from original theme
      if (originalTheme.assets && Array.isArray(originalTheme.assets)) {
        for (const asset of originalTheme.assets) {
          await upsertKioskThemeAsset({
            themeId: (newTheme as any).id,
            assetType: asset.assetType,
            assetKey: asset.assetKey,
            assetValue: asset.assetValue,
            assetUrl: asset.assetUrl,
          });
        }
      }

      return newTheme;
    }),

  /**
   * Update theme assets (colors, images, text, etc.)
   */
  updateThemeAsset: protectedProcedure
    .input(z.object({
      themeId: z.number(),
      assetType: z.string(),
      assetKey: z.string(),
      assetValue: z.string(),
      assetUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const assetId = await upsertKioskThemeAsset({
        themeId: input.themeId,
        assetType: input.assetType as any,
        assetKey: input.assetKey,
        assetValue: input.assetValue,
        assetUrl: input.assetUrl,
      });

      if (!assetId) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update asset' });
      }

      return { success: true, assetId };
    }),

  /**
   * Get active theme for a device
   */
  getActiveThemeForDevice: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .query(async ({ input }) => {
      const theme = await getActiveThemeForDevice(input.deviceId);
      return theme;
    }),

  /**
   * Deploy a theme to a device
   */
  deployTheme: protectedProcedure
    .input(z.object({
      deviceId: z.number(),
      themeId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const deployment = await createKioskDeployment({
        deviceId: input.deviceId,
        themeId: input.themeId,
        deploymentStatus: 'pending',
        deployedBy: ctx.user?.id,
      });

      if (!deployment) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create deployment' });
      }

      // Simulate deployment completion (in production, this would trigger a real deployment)
      setTimeout(async () => {
        await updateKioskSchedule((deployment as any).id, {
          deploymentStatus: 'deployed',
          deployedAt:new Date().toISOString().toISOString(),
        });
      }, 1000);

      return deployment;
    }),

  /**
   * Get deployment history for a device
   */
  getDeploymentHistory: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .query(async ({ input }) => {
      const deployments = await getDeviceDeployments(input.deviceId);
      return deployments;
    }),

  /**
   * Create a theme schedule (for seasonal/holiday themes)
   */
  createSchedule: protectedProcedure
    .input(z.object({
      themeId: z.number(),
      startDate: z.date(),
      endDate: z.date(),
      isRecurring: z.number().default(0),
      cronExpression: z.string().optional(),
      autoRevert: z.number().default(1),
      revertThemeId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const schedule = await createKioskSchedule({
        themeId: input.themeId,
        startDate: input.startDate.toISOString(),
        endDate: input.endDate.toISOString(),
        isRecurring: input.isRecurring,
        cronExpression: input.cronExpression,
        autoRevert: input.autoRevert,
        revertThemeId: input.revertThemeId,
        isActive: 1,
      });

      if (!schedule) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create schedule' });
      }

      return schedule;
    }),

  /**
   * Get schedules for a theme
   */
  getSchedules: protectedProcedure
    .input(z.object({ themeId: z.number() }))
    .query(async ({ input }) => {
      const schedules = await getThemeSchedules(input.themeId);
      return schedules;
    }),

  /**
   * Update a schedule
   */
  updateSchedule: protectedProcedure
    .input(z.object({
      scheduleId: z.number(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const success = await updateKioskSchedule(input.scheduleId, {
        startDate: input.startDate?.toISOString(),
        endDate: input.endDate?.toISOString(),
        isActive: input.isActive,
      });

      if (!success) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update schedule' });
      }

      return { success: true };
    }),

  /**
   * Delete a schedule
   */
  deleteSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.number() }))
    .mutation(async ({ input }) => {
      const success = await deleteKioskSchedule(input.scheduleId);

      if (!success) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete schedule' });
      }

      return { success: true };
    }),
});
