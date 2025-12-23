/**
 * Credit Router
 * 
 * tRPC procedures for credit balance checks and consumption
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  checkSufficientBalance,
  deductCredits,
  addCredits,
  getCreditBalance,
  CREDIT_COSTS,
  CREDIT_THRESHOLDS,
} from "./creditConsumption";

export const creditRouter = router({
  /**
   * Get current credit balance for the organization
   */
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = ctx.user.organizationId;
    if (!organizationId) {
      throw new Error("No organization found for user");
    }

    const balance = await getCreditBalance(organizationId);
    
    // Calculate warning level
    let warningLevel: 'none' | 'warning' | 'critical' | 'blocking' = 'none';
    if (balance.creditsRemaining === CREDIT_THRESHOLDS.BLOCKING) {
      warningLevel = 'blocking';
    } else if (balance.creditsRemaining < CREDIT_THRESHOLDS.CRITICAL) {
      warningLevel = 'critical';
    } else if (balance.creditsRemaining < CREDIT_THRESHOLDS.WARNING) {
      warningLevel = 'warning';
    }

    return {
      ...balance,
      warningLevel,
      thresholds: CREDIT_THRESHOLDS,
    };
  }),

  /**
   * Check if organization has sufficient credits for an operation
   */
  checkBalance: protectedProcedure
    .input(z.object({
      requiredCredits: z.number().min(0),
      operationType: z.enum(['kai_chat', 'sms', 'email', 'phone_call', 'voice_synthesis', 'image_generation']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const organizationId = ctx.user.organizationId;
      if (!organizationId) {
        throw new Error("No organization found for user");
      }

      const result = await checkSufficientBalance(organizationId, input.requiredCredits);
      
      return {
        sufficient: result.sufficient,
        currentBalance: result.currentBalance,
        requiredCredits: input.requiredCredits,
        remainingAfter: result.currentBalance - input.requiredCredits,
        message: result.message,
        operationType: input.operationType,
      };
    }),

  /**
   * Deduct credits for an operation (internal use)
   */
  deduct: protectedProcedure
    .input(z.object({
      amount: z.number().min(0),
      taskType: z.enum(['kai_chat', 'sms', 'email', 'phone_call', 'voice_synthesis', 'image_generation', 'data_extraction']),
      description: z.string(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = ctx.user.organizationId;
      if (!organizationId) {
        throw new Error("No organization found for user");
      }

      const result = await deductCredits({
        organizationId,
        amount: input.amount,
        taskType: input.taskType,
        description: input.description,
        metadata: input.metadata,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to deduct credits");
      }

      return {
        success: true,
        newBalance: result.newBalance,
        transactionId: result.transactionId,
        amountDeducted: input.amount,
      };
    }),

  /**
   * Get credit costs for different operations
   */
  getCosts: protectedProcedure.query(() => {
    return {
      costs: CREDIT_COSTS,
      thresholds: CREDIT_THRESHOLDS,
    };
  }),
});
