import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * Kiosk Designer Router - All procedures for kiosk theme management and deployment
 * NOTE: Temporarily disabled due to missing schema tables (kioskDevices, kioskThemes, etc.)
 */
export const kioskDesignerRouter = router({
  /**
   * Placeholder: Get all kiosk devices for the current organization
   */
  getDevices: protectedProcedure
    .query(async ({ ctx }) => {
      throw new TRPCError({ 
        code: 'NOT_IMPLEMENTED', 
        message: 'Kiosk designer features are not yet available' 
      });
    }),
  
  /**
   * Placeholder: Get a single kiosk device by ID
   */
  getDevice: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .query(async ({ input }) => {
      throw new TRPCError({ 
        code: 'NOT_IMPLEMENTED', 
        message: 'Kiosk designer features are not yet available' 
      });
    }),
  
  /**
   * Placeholder: Create a new kiosk device
   */
  createDevice: protectedProcedure
    .input(z.object({ 
      name: z.string(),
      organizationId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      throw new TRPCError({ 
        code: 'NOT_IMPLEMENTED', 
        message: 'Kiosk designer features are not yet available' 
      });
    }),
  
  /**
   * Placeholder: Update kiosk device status
   */
  updateDeviceStatus: protectedProcedure
    .input(z.object({ 
      deviceId: z.number(),
      status: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      throw new TRPCError({ 
        code: 'NOT_IMPLEMENTED', 
        message: 'Kiosk designer features are not yet available' 
      });
    }),
  
  /**
   * Placeholder: Get all kiosk themes
   */
  getThemes: protectedProcedure
    .query(async ({ ctx }) => {
      throw new TRPCError({ 
        code: 'NOT_IMPLEMENTED', 
        message: 'Kiosk designer features are not yet available' 
      });
    }),
  
  /**
   * Placeholder: Get a single kiosk theme
   */
  getTheme: protectedProcedure
    .input(z.object({ themeId: z.number() }))
    .query(async ({ ctx, input }) => {
      throw new TRPCError({ 
        code: 'NOT_IMPLEMENTED', 
        message: 'Kiosk designer features are not yet available' 
      });
    }),
  
  /**
   * Placeholder: Create a new kiosk theme
   */
  createTheme: protectedProcedure
    .input(z.object({ 
      name: z.string(),
      organizationId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      throw new TRPCError({ 
        code: 'NOT_IMPLEMENTED', 
        message: 'Kiosk designer features are not yet available' 
      });
    }),
  
  /**
   * Placeholder: Update a kiosk theme
   */
  updateTheme: protectedProcedure
    .input(z.object({ 
      themeId: z.number(),
      name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      throw new TRPCError({ 
        code: 'NOT_IMPLEMENTED', 
        message: 'Kiosk designer features are not yet available' 
      });
    }),
  
  /**
   * Placeholder: Delete a kiosk theme
   */
  deleteTheme: protectedProcedure
    .input(z.object({ themeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      throw new TRPCError({ 
        code: 'NOT_IMPLEMENTED', 
        message: 'Kiosk designer features are not yet available' 
      });
    }),
});
