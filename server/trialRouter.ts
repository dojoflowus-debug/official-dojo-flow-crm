/**
 * Trial Router
 * 
 * TRPC routes for trial account management including creation, status checking,
 * and expiration handling.
 */

import { router, protectedProcedure, publicProcedure } from './_core/trpc';
import { z } from 'zod';
import {
  createTrialAccount,
  getTrialStatus,
  checkAndUpdateTrialExpiration,
  extendTrial,
  convertTrialToPaid,
  getExpiringTrials,
  getTrialStatistics,
} from './services/trialManagementService';

export const trialRouter = router({
  /**
   * Create a new trial account
   */
  createTrialAccount: publicProcedure
    .input(z.object({
      organizationName: z.string().min(1, 'Organization name is required').max(255),
      ownerEmail: z.string().email('Invalid email address'),
      ownerName: z.string().min(1, 'Owner name is required').max(255),
      businessType: z.string().optional(),
      studentCount: z.string().optional(),
      locationCount: z.string().optional(),
      timezone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await createTrialAccount(input);
        return result;
      } catch (error) {
        console.error('Error creating trial account:', error);
        return {
          success: false,
          message: 'Failed to create trial account',
          error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        };
      }
    }),

  /**
   * Get trial status for current organization
   */
  getTrialStatus: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const status = await getTrialStatus(ctx.organizationId);
        return status;
      } catch (error) {
        console.error('Error getting trial status:', error);
        return {
          isTrialing: false,
          isExpired: false,
        };
      }
    }),

  /**
   * Check if trial has expired and update status
   */
  checkTrialExpiration: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const hasExpired = await checkAndUpdateTrialExpiration(ctx.organizationId);
        
        if (hasExpired) {
          return {
            success: true,
            message: 'Trial has expired. Account has been set to inactive.',
            isExpired: true,
          };
        }

        return {
          success: true,
          message: 'Trial is still active',
          isExpired: false,
        };
      } catch (error) {
        console.error('Error checking trial expiration:', error);
        return {
          success: false,
          message: 'Failed to check trial expiration',
          isExpired: false,
        };
      }
    }),

  /**
   * Extend trial period (admin only)
   */
  extendTrial: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      additionalDays: z.number().int().positive().default(7),
    }))
    .mutation(async ({ input, ctx }) => {
      // TODO: Add admin role check
      try {
        const success = await extendTrial(input.organizationId, input.additionalDays);
        
        if (success) {
          return {
            success: true,
            message: `Trial extended by ${input.additionalDays} days`,
          };
        }

        return {
          success: false,
          message: 'Failed to extend trial',
        };
      } catch (error) {
        console.error('Error extending trial:', error);
        return {
          success: false,
          message: 'Error extending trial',
        };
      }
    }),

  /**
   * Convert trial to paid subscription
   */
  convertTrialToPaid: protectedProcedure
    .input(z.object({
      planId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await convertTrialToPaid(ctx.organizationId, input.planId);
        
        if (success) {
          return {
            success: true,
            message: 'Trial converted to paid subscription',
          };
        }

        return {
          success: false,
          message: 'Failed to convert trial to paid',
        };
      } catch (error) {
        console.error('Error converting trial to paid:', error);
        return {
          success: false,
          message: 'Error converting trial to paid',
        };
      }
    }),

  /**
   * Get expiring trials (admin only)
   */
  getExpiringTrials: protectedProcedure
    .input(z.object({
      withinDays: z.number().int().positive().default(7),
    }))
    .query(async ({ input }) => {
      try {
        // TODO: Add admin role check
        const trials = await getExpiringTrials(input.withinDays);
        return {
          success: true,
          trials,
        };
      } catch (error) {
        console.error('Error getting expiring trials:', error);
        return {
          success: false,
          trials: [],
        };
      }
    }),

  /**
   * Get trial statistics (admin only)
   */
  getTrialStatistics: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // TODO: Add admin role check
        const stats = await getTrialStatistics();
        return {
          success: true,
          ...stats,
        };
      } catch (error) {
        console.error('Error getting trial statistics:', error);
        return {
          success: false,
          totalTrials: 0,
          activeTrials: 0,
          expiredTrials: 0,
          expiringWithin7Days: 0,
        };
      }
    }),
});
