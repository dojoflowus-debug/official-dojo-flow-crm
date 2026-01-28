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
import { getCreditTransactions } from "./subscriptionDb";

export const creditRouter = router({
  /**
   * Get current credit balance for the organization
   */
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = ctx.currentOrganizationId;
    if (!organizationId) {
      // Return empty balance for users without an organization (new accounts)
      return {
        creditsRemaining: 0,
        totalCredits: 0,
        usedCredits: 0,
        warningLevel: 'none' as const,
        thresholds: CREDIT_THRESHOLDS,
      };
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
      const organizationId = ctx.currentOrganizationId;
      if (!organizationId) {
        // Return insufficient balance for users without an organization
        return {
          sufficient: false,
          currentBalance: 0,
          requiredCredits: input.requiredCredits,
          remainingAfter: -input.requiredCredits,
          message: 'No organization found. Please complete your account setup.',
          operationType: input.operationType,
        };
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
      const organizationId = ctx.currentOrganizationId;
      if (!organizationId) {
        throw new Error("No organization found. Please complete your account setup.");
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

  /**
   * Get recent credit transactions
   */
  getRecentTransactions: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      const organizationId = ctx.currentOrganizationId;
      if (!organizationId) {
        return [];
      }

      const transactions = await getCreditTransactions(organizationId, {
        limit: input.limit,
        offset: input.offset,
      });

      return transactions.map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        createdAt: tx.createdAt,
        balanceAfter: tx.balanceAfter,
        taskType: tx.taskType,
        metadata: tx.metadata ? JSON.parse(tx.metadata) : null,
      }));
    }),
});
