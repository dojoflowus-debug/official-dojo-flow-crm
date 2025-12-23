import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getAllPlans,
  getPlanById,
  getPlanBySlug,
  getOrganizationSubscription,
  upsertOrganizationSubscription,
  cancelOrganizationSubscription,
  getCreditBalance,
  initializeCreditBalance,
  deductCredits,
  addCredits,
  getCreditTransactions,
  createCreditTopUp,
  completeCreditTopUp,
  resetMonthlyCredits
} from "./subscriptionDb";
import { createSubscriptionCheckout } from "./stripeSubscription";

export const subscriptionRouter = router({
  /**
   * Get all available subscription plans
   */
  getPlans: publicProcedure.query(async () => {
    return getAllPlans();
  }),

  /**
   * Get a specific plan by ID
   */
  getPlan: publicProcedure
    .input(z.object({ planId: z.number() }))
    .query(async ({ input }) => {
      const plan = await getPlanById(input.planId);
      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
      }
      return plan;
    }),

  /**
   * Get organization's current subscription (requires auth)
   */
  getCurrentSubscription: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const subscription = await getOrganizationSubscription(input.organizationId);
      if (!subscription) {
        return null;
      }

      // Also fetch the plan details
      const plan = await getPlanById(subscription.planId);
      
      return {
        ...subscription,
        plan
      };
    }),

  /**
   * Upgrade/change subscription plan
   */
  changePlan: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      planId: z.number(),
      billingCycle: z.enum(['monthly', 'annual']).default('monthly')
    }))
    .mutation(async ({ input }) => {
      const plan = await getPlanById(input.planId);
      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
      }

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + (input.billingCycle === 'annual' ? 12 : 1));

      await upsertOrganizationSubscription({
        organizationId: input.organizationId,
        planId: input.planId,
        status: 'active',
        billingCycle: input.billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd
      });

      // Initialize or reset credit balance with new plan's allowance
      const existingBalance = await getCreditBalance(input.organizationId);
      
      if (!existingBalance) {
        await initializeCreditBalance(input.organizationId, plan.monthlyCredits);
      } else {
        await resetMonthlyCredits(input.organizationId, plan.monthlyCredits);
      }

      return { success: true };
    }),

  /**
   * Cancel subscription
   */
  cancelSubscription: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      reason: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      await cancelOrganizationSubscription(input.organizationId, input.reason);
      return { success: true };
    }),

  /**
   * Get credit balance
   */
  getCreditBalance: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const balance = await getCreditBalance(input.organizationId);
      if (!balance) {
        return null;
      }
      return balance;
    }),

  /**
   * Get credit transactions with optional filters
   */
  getCreditTransactions: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      limit: z.number().optional(),
      offset: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      taskType: z.enum(['kai_chat', 'ai_sms', 'ai_email', 'ai_phone_call', 'automation', 'data_analysis', 'other']).optional()
    }))
    .query(async ({ input }) => {
      return getCreditTransactions(input.organizationId, {
        limit: input.limit,
        offset: input.offset,
        startDate: input.startDate,
        endDate: input.endDate,
        taskType: input.taskType
      });
    }),

  /**
   * Internal procedure to deduct credits (used by other routers)
   * Not exposed to frontend directly
   */
  deductCredits: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      amount: z.number(),
      taskType: z.enum(['kai_chat', 'ai_sms', 'ai_email', 'ai_phone_call', 'automation', 'data_analysis', 'other']),
      description: z.string(),
      metadata: z.record(z.any()).optional(),
      userId: z.number().optional()
    }))
    .mutation(async ({ input }) => {
      const success = await deductCredits(
        input.organizationId,
        input.amount,
        input.taskType,
        input.description,
        input.metadata,
        input.userId
      );

      if (!success) {
        throw new TRPCError({ 
          code: "PRECONDITION_FAILED", 
          message: "Insufficient credits. Please purchase more credits or upgrade your plan." 
        });
      }

      return { success: true };
    }),

  /**
   * Check if organization has enough credits for an operation
   */
  checkCredits: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      amount: z.number()
    }))
    .query(async ({ input }) => {
      const balance = await getCreditBalance(input.organizationId);
      
      if (!balance) {
        return { hasCredits: false, balance: 0 };
      }

      return {
        hasCredits: balance.balance >= input.amount,
        balance: balance.balance
      };
    }),

  /**
   * Get credit usage summary
   */
  getCreditUsageSummary: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ input }) => {
      const transactions = await getCreditTransactions(input.organizationId, {
        startDate: input.startDate,
        endDate: input.endDate
      });

      const summary = {
        totalDeductions: 0,
        totalAdditions: 0,
        byTaskType: {} as Record<string, number>,
        transactionCount: transactions.length
      };

      transactions.forEach(tx => {
        if (tx.type === 'deduction') {
          summary.totalDeductions += Math.abs(tx.amount);
          if (tx.taskType) {
            summary.byTaskType[tx.taskType] = (summary.byTaskType[tx.taskType] || 0) + Math.abs(tx.amount);
          }
        } else {
          summary.totalAdditions += tx.amount;
        }
      });

      return summary;
    }),

  /**
   * Create Stripe checkout session for subscription
   */
  createCheckoutSession: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      planId: z.number(),
      customerEmail: z.string().email().optional()
    }))
    .mutation(async ({ input }) => {
      const baseUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:3000';
      
      const result = await createSubscriptionCheckout({
        organizationId: input.organizationId,
        planId: input.planId,
        successUrl: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/pricing`,
        customerEmail: input.customerEmail
      });

      return result;
    })
});
