/**
 * Call Tracking Router
 * 
 * TRPC router for managing phone call sessions with integrated credit deduction.
 * Handles call initiation, duration tracking, and billing.
 */

import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { getDb } from './db';
import { eq } from 'drizzle-orm';

export const callTrackingRouter = router({
  /**
   * Initiate a phone call and deduct setup credits
   */
  startCall: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      recipientPhone: z.string(),
      callType: z.enum(['outbound', 'inbound']).default('outbound'),
      estimatedDurationMinutes: z.number().optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Generate unique call ID
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Import call credit service
      const { startCallSession } = await import('./services/callCreditService');

      // Start call session and deduct setup credits
      const result = await startCallSession(
        callId,
        input.organizationId,
        input.recipientPhone,
        {
          callType: input.callType,
          estimatedDurationMinutes: input.estimatedDurationMinutes,
          initiatedBy: ctx.user.id,
          ...input.metadata,
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to initiate call');
      }

      return {
        callId,
        setupCreditsDeducted: result.setupCreditsDeducted,
        message: result.message,
      };
    }),

  /**
   * End a phone call and deduct duration-based credits
   */
  endCall: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      callId: z.string(),
      recipientPhone: z.string(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Import call credit service
      const { endCallSession } = await import('./services/callCreditService');

      // End call session and deduct duration credits
      const result = await endCallSession(
        input.callId,
        input.organizationId,
        new Date(input.startTime),
        new Date(input.endTime),
        input.recipientPhone,
        {
          endedBy: ctx.user.id,
          ...input.metadata,
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to end call');
      }

      return {
        callId: result.callId,
        durationMinutes: result.durationMinutes,
        durationSeconds: result.durationSeconds,
        creditsDeducted: result.creditsDeducted,
        totalCreditsDeducted: result.totalCreditsDeducted,
        newBalance: result.newBalance,
        alertLevel: result.alertLevel,
        message: result.message,
      };
    }),

  /**
   * Estimate credits needed for a call
   */
  estimateCallCredits: protectedProcedure
    .input(z.object({
      durationMinutes: z.number().min(1),
    }))
    .query(({ input }) => {
      const { estimateCallCredits, getCallCreditCosts } = require('./services/callCreditService');
      
      const totalCredits = estimateCallCredits(input.durationMinutes);
      const costs = getCallCreditCosts();

      return {
        estimatedDurationMinutes: input.durationMinutes,
        setupCost: costs.setupCost,
        durationCost: input.durationMinutes * costs.perMinute,
        totalEstimatedCredits: totalCredits,
        breakdown: {
          setup: costs.setupCost,
          perMinute: costs.perMinute,
          duration: input.durationMinutes * costs.perMinute,
          total: totalCredits,
        },
      };
    }),

  /**
   * Get call cost breakdown
   */
  getCallCostBreakdown: protectedProcedure
    .input(z.object({
      durationSeconds: z.number().min(0),
    }))
    .query(({ input }) => {
      const { getCallCostBreakdown } = require('./services/callCreditService');
      return getCallCostBreakdown(input.durationSeconds);
    }),

  /**
   * Get call credit costs
   */
  getCallCreditCosts: protectedProcedure
    .query(() => {
      const { getCallCreditCosts } = require('./services/callCreditService');
      return getCallCreditCosts();
    }),
});
