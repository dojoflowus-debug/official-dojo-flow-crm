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
  addCredits,
  getCreditTransactions,
  createCreditTopUp,
  completeCreditTopUp,
  resetMonthlyCredits
} from "./subscriptionDb";
import { deductCredits } from "./creditConsumption";
import { createSubscriptionCheckout, createTrialCheckout, handleCheckoutComplete } from "./stripeSubscription";
import { stripe } from "./stripe";

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
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: periodEnd.toISOString()
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
      const result = await deductCredits({
        organizationId: input.organizationId,
        amount: input.amount,
        taskType: input.taskType,
        description: input.description,
        metadata: input.metadata,
      });

      if (!result.success) {
        throw new TRPCError({ 
          code: "PRECONDITION_FAILED", 
          message: result.error || "Insufficient credits. Please purchase more credits or upgrade your plan." 
        });
      }

      return { success: true, newBalance: result.newBalance };
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
   * Create Stripe checkout session for 7-day trial
   */
  createTrialCheckout: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      customerEmail: z.string().email().optional()
    }))
    .mutation(async ({ input }) => {
      const baseUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:3000';
      
      const result = await createTrialCheckout({
        organizationId: input.organizationId,
        successUrl: baseUrl + '/billing/success?session_id={CHECKOUT_SESSION_ID}&trial=true',
        cancelUrl: baseUrl + '/pricing',
        customerEmail: input.customerEmail
      });

      return result;
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
    }),

  /**
   * Create Stripe checkout session for credit top-up
   */
  createCreditTopUpCheckout: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      credits: z.number().min(100).max(25000),
      customerEmail: z.string().email().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { createCreditTopUpCheckout } = await import('./stripeSubscription');
      const baseUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:3000';
      
      // Package-based pricing (matches AddCreditsModal packages)
      const packagePrices: Record<number, number> = {
        1000: 4900,   // $49
        3000: 9900,   // $99
        7500: 19900,  // $199
        20000: 44900, // $449
      };
      // Fall back to $0.049/credit for custom amounts
      const amountInCents = packagePrices[input.credits] ?? Math.round(input.credits * 4.9);
      
      const result = await createCreditTopUpCheckout({
        organizationId: input.organizationId,
        credits: input.credits,
        amountInCents,
        successUrl: `${baseUrl}/kai?credits=success`,
        cancelUrl: `${baseUrl}/kai?credits=cancel`,
        customerEmail: input.customerEmail,
        userId: ctx.user?.id
      });

      return result;
    }),

  /**
   * Get credit top-up pricing tiers
   */
  getCreditTopUpPricing: publicProcedure.query(() => {
    const basePrice = 10;
    return {
      tiers: [
        { credits: 100, price: 1000, pricePerCredit: basePrice, savings: 0, label: 'Starter Pack' },
        { credits: 250, price: 2250, pricePerCredit: 9, savings: 10, label: 'Value Pack' },
        { credits: 500, price: 4000, pricePerCredit: 8, savings: 20, label: 'Pro Pack' },
        { credits: 1000, price: 7000, pricePerCredit: 7, savings: 30, label: 'Business Pack' },
      ],
      customPricing: {
        minCredits: 100,
        maxCredits: 10000,
        pricePerCredit: basePrice,
      }
    };
  }),

  /**
   * Get billing snapshot - returns all plan and billing data needed for the modal
   */
  getBillingSnapshot: protectedProcedure
    .input(z.object({
      organizationId: z.number()
    }))
    .query(async ({ input }) => {
      try {
        // Get subscription and plan
        const subscription = await getOrganizationSubscription(input.organizationId);
        const plan = subscription ? await getPlanById(subscription.planId) : null;
        
        // Get credit balance
        const creditBalance = await getCreditBalance(input.organizationId);
        
        return {
          planName: plan?.name || 'Free Plan',
          status: subscription?.status || 'trial',
          renewalDate: subscription?.currentPeriodEnd || null,
          monthlyCreditsIncluded: plan?.monthlyCredits || 0,
          currentCreditBalance: creditBalance?.balance || 0,
          orgId: input.organizationId,
          stripeCustomerId: subscription?.stripeCustomerId || null,
          stripeSubscriptionId: subscription?.stripeSubscriptionId || null,
          billingCycle: subscription?.billingCycle || 'monthly',
          totalPurchased: creditBalance?.totalPurchased || 0,
          totalUsed: creditBalance?.totalUsed || 0
        };
      } catch (error) {
        console.error('[getBillingSnapshot] Error:', error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch billing snapshot" });
      }
    }),

  /**
   * Get default payment method from Stripe
   */
  getDefaultPaymentMethod: protectedProcedure
    .input(z.object({
      organizationId: z.number()
    }))
    .query(async ({ input }) => {
      try {
        if (!stripe) {
          return null;
        }

        const subscription = await getOrganizationSubscription(input.organizationId);
        if (!subscription?.stripeCustomerId) {
          return null;
        }

        // Get customer from Stripe
        const customer = await stripe.customers.retrieve(subscription.stripeCustomerId) as any;
        
        if (!customer.invoice_settings?.default_payment_method) {
          return null;
        }

        // Get the payment method details
        const paymentMethod = await stripe.paymentMethods.retrieve(
          customer.invoice_settings.default_payment_method as string
        ) as any;

        if (paymentMethod.type === 'card' && paymentMethod.card) {
          return {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year
          };
        }

        return null;
      } catch (error) {
        console.error('[getDefaultPaymentMethod] Error:', error);
        return null; // Gracefully return null on error
      }
    }),

  createBillingPortalSession: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      returnUrl: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      if (!stripe) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });
      }

      try {
        console.log('[Billing Portal] Creating session for org:', input.organizationId);
        let subscription = await getOrganizationSubscription(input.organizationId);
        console.log('[Billing Portal] Current subscription:', subscription);
        
        if (!subscription || !subscription.stripeCustomerId) {
          if (!subscription) {
            const defaultPlan = await getPlanById(1);
            if (!defaultPlan) {
              throw new TRPCError({ code: "NOT_FOUND", message: "Default plan not found" });
            }
            
            const now = new Date();
            const periodEnd = new Date(now);
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            
            await upsertOrganizationSubscription({
              organizationId: input.organizationId,
              planId: defaultPlan.id,
              status: 'trial',
              billingCycle: 'monthly',
              currentPeriodStart: now.toISOString(),
              currentPeriodEnd: periodEnd.toISOString(),
            });
            
            subscription = await getOrganizationSubscription(input.organizationId);
          }
          
          if (!subscription?.stripeCustomerId) {
            console.log('[Billing Portal] Creating Stripe customer');
            let customer;
            try {
              customer = await stripe.customers.create({
                metadata: {
                  organizationId: input.organizationId.toString(),
                },
              });
              console.log('[Billing Portal] Stripe customer created:', customer.id);
            } catch (e: any) {
              console.error('[Billing Portal] Stripe customer creation error:', e);
              throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message ?? "Failed to create Stripe customer" });
            }
            
            await upsertOrganizationSubscription({
              ...subscription!,
              stripeCustomerId: customer!.id,
            });
            
            subscription = await getOrganizationSubscription(input.organizationId);
          }
        }

        if (!subscription?.stripeCustomerId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create Stripe customer" });
        }

        const baseUrl = input.returnUrl || process.env.VITE_FRONTEND_URL || 'http://localhost:3000';
        const returnUrl = baseUrl + '/kai?billing=return';
        console.log('[Billing Portal] Creating portal session for customer:', subscription.stripeCustomerId, 'return URL:', returnUrl);

        try {
          const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: returnUrl,
          });
          console.log('[Billing Portal] Portal session created:', session.url);
          return { url: session.url };
        } catch (e: any) {
          console.error('[Billing Portal] Stripe portal session error:', e);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message ?? "Stripe portal failed" });
        }
      } catch (error) {
        console.error('[Billing Portal] Error:', error);
        if (error instanceof TRPCError) throw error;
        
        // Handle Stripe-specific errors
        if (error instanceof Error) {
          const errorMessage = error.message || 'Unknown error';
          if (errorMessage.includes('resource_missing')) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Stripe customer not found. Please contact support." });
          }
          if (errorMessage.includes('invalid_request')) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid billing portal request. Please try again." });
          }
        }
        
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create billing portal" });
      }
    }),

  /**
   * Verify a completed Stripe checkout session and activate subscription
   * Called from BillingSuccess page as a fallback when webhook hasn't fired yet
   */
  verifyCheckoutSession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      organizationId: z.number()
    }))
    .mutation(async ({ input }) => {
      try {
        // Retrieve the session from Stripe to verify it's paid
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);
        
        if (!session) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Checkout session not found" });
        }

        // Only process completed/paid sessions
        if (session.payment_status !== 'paid' && session.status !== 'complete') {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Payment not completed" });
        }

        // Check if subscription already activated (idempotent)
        const existing = await getOrganizationSubscription(input.organizationId);
        if (existing && (existing.status === 'active' || existing.status === 'trialing') && existing.stripeSubscriptionId) {
          // Already activated — return success without re-processing
          return { success: true, alreadyActivated: true };
        }

        // Activate the subscription by processing the checkout session
        if (session.mode === 'subscription') {
          await handleCheckoutComplete(session as any);
        }

        return { success: true, alreadyActivated: false };
      } catch (error: any) {
        console.error('[verifyCheckoutSession] Error:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "Failed to verify checkout" });
      }
    })
});
