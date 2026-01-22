/**
 * Stripe Subscription Service
 * 
 * Handles subscription checkout, webhooks, and lifecycle management
 */

import Stripe from 'stripe';
import { getDb } from './db';
import { organizationSubscriptions, aiCreditBalance, subscriptionPlans, creditTopUps, aiCreditTransactions } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover' as any,
});

/**
 * Create Stripe checkout session for subscription
 */
export async function createSubscriptionCheckout(params: {
  organizationId: number;
  planId: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}) {
  const { organizationId, planId, successUrl, cancelUrl, customerEmail } = params;

  // Get plan details
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const planResults = await db.select().from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, planId))
    .limit(1);
  
  const plan = planResults[0];

  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  // Check if organization already has a Stripe customer ID
  const existingSub = await db.select().from(organizationSubscriptions)
    .where(eq(organizationSubscriptions.organizationId, organizationId))
    .limit(1);
  
  const existingSubRecord = existingSub[0];

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            description: plan.name || undefined,
          },
          recurring: {
            interval: 'month',
          },
          unit_amount: plan.monthlyPrice, // Already in cents
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      organizationId: organizationId.toString(),
      planId: planId.toString(),
    },
  };

  // Add customer email if provided
  if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  // Use existing customer if available
  if (existingSubRecord?.stripeCustomerId) {
    sessionParams.customer = existingSubRecord.stripeCustomerId;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Handle successful subscription checkout
 */
export async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { organizationId, planId, trialType } = session.metadata as { organizationId: string; planId?: string; trialType?: string };

  if (!organizationId) {
    throw new Error('Missing organizationId in checkout session metadata');
  }

  const orgId = parseInt(organizationId);
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  // Get database connection
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Determine if this is a trial checkout
  const isTrial = trialType === 'trial_7day';
  
  let planIdToUse = planId ? parseInt(planId) : 1; // Default to plan 1 if not provided
  let creditsToAllocate = 100; // Default trial credits

  // If not a trial, get plan details for credit allocation
  if (!isTrial && planId) {
    const pId = parseInt(planId);
    const planResults = await db.select().from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, pId))
      .limit(1);
    
    const plan = planResults[0];

    if (!plan) {
      throw new Error('Plan not found');
    }

    planIdToUse = pId;
    creditsToAllocate = plan.monthlyCredits;
  }

  // Check if subscription already exists
  const existingResults = await db.select().from(organizationSubscriptions)
    .where(eq(organizationSubscriptions.organizationId, orgId))
    .limit(1);
  
  const existing = existingResults[0];

  // Calculate trial end date (7 days from now)
  const trialEndDate = isTrial 
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (existing) {
    // Update existing subscription
    await db.update(organizationSubscriptions)
      .set({
        planId: planIdToUse,
        status: isTrial ? 'trialing' : 'active',
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: trialEndDate,
        trialEndsAt: isTrial ? trialEndDate : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(organizationSubscriptions.organizationId, orgId));
  } else {
    // Create new subscription
    await db.insert(organizationSubscriptions).values({
      organizationId: orgId,
      planId: planIdToUse,
      status: isTrial ? 'trialing' : 'active',
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: trialEndDate,
      trialEndsAt: isTrial ? trialEndDate : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Allocate credits (100 for trial, plan credits for regular)
  await allocateMonthlyCredits(orgId, creditsToAllocate);

  console.log(`[Stripe Webhook] Checkout completed for org ${orgId}. Trial: ${isTrial}, Credits: ${creditsToAllocate}`);

  return { success: true };
}

/**
 * Allocate monthly credits to organization
 */
async function allocateMonthlyCredits(organizationId: number, credits: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const existingResults = await db.select().from(aiCreditBalance)
    .where(eq(aiCreditBalance.organizationId, organizationId))
    .limit(1);
  
  const existing = existingResults[0];

  if (existing) {
    // Add credits to existing balance
    await db.update(aiCreditBalance)
      .set({
        balance: existing.balance + credits,
        updatedAt:new Date().toISOString(),
      })
      .where(eq(aiCreditBalance.organizationId, organizationId));
  } else {
    // Create new credit balance
    await db.insert(aiCreditBalance).values({
      organizationId,
      balance: credits,
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
    });
  }
}

/**
 * Handle subscription renewal
 */
export async function handleSubscriptionRenewed(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find organization by Stripe customer ID
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const orgSubResults = await db.select().from(organizationSubscriptions)
    .where(eq(organizationSubscriptions.stripeCustomerId, customerId))
    .limit(1);
  
  const orgSub = orgSubResults[0];

  if (!orgSub) {
    throw new Error('Organization subscription not found');
  }

  // Get plan details
  const planResults = await db.select().from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, orgSub.planId))
    .limit(1);
  
  const plan = planResults[0];

  if (!plan) {
    throw new Error('Plan not found');
  }

  // Update subscription period - get period from first subscription item
  const subscriptionItem = subscription.items.data[0];
  if (subscriptionItem) {
    await db.update(organizationSubscriptions)
      .set({
        currentPeriodStart: new Date(subscriptionItem.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscriptionItem.current_period_end * 1000).toISOString(),
        updatedAt:new Date().toISOString(),
      })
      .where(eq(organizationSubscriptions.organizationId, orgSub.organizationId));
  }

  // Allocate monthly credits
  await allocateMonthlyCredits(orgSub.organizationId, plan.monthlyCredits);

  return { success: true };
}

/**
 * Handle subscription cancellation
 */
export async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find organization by Stripe customer ID
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const orgSubResults = await db.select().from(organizationSubscriptions)
    .where(eq(organizationSubscriptions.stripeCustomerId, customerId))
    .limit(1);
  
  const orgSub = orgSubResults[0];

  if (!orgSub) {
    throw new Error('Organization subscription not found');
  }

  // Update subscription status
  await db.update(organizationSubscriptions)
    .set({
      status: 'cancelled',
      cancelledAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
    })
    .where(eq(organizationSubscriptions.organizationId, orgSub.organizationId));

  return { success: true };
}

/**
 * Handle payment failure
 */
export async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find organization by Stripe customer ID
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const orgSubResults = await db.select().from(organizationSubscriptions)
    .where(eq(organizationSubscriptions.stripeCustomerId, customerId))
    .limit(1);
  
  const orgSub = orgSubResults[0];

  if (!orgSub) {
    throw new Error('Organization subscription not found');
  }

  // Update subscription status to past_due
  await db.update(organizationSubscriptions)
    .set({
      status: 'past_due',
      updatedAt:new Date().toISOString(),
    })
    .where(eq(organizationSubscriptions.organizationId, orgSub.organizationId));

  return { success: true };
}

/**
 * Create Stripe checkout session for credit top-up
 */
export async function createCreditTopUpCheckout(params: {
  organizationId: number;
  credits: number;
  amountInCents: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  userId?: number;
}) {
  const { organizationId, credits, amountInCents, successUrl, cancelUrl, customerEmail, userId } = params;

  // Get existing customer ID if available
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const existingSub = await db.select().from(organizationSubscriptions)
    .where(eq(organizationSubscriptions.organizationId, organizationId))
    .limit(1);
  
  const existingSubRecord = existingSub[0];

  // Create top-up record
  const topUpResult = await db.insert(creditTopUps).values({
    organizationId,
    credits,
    amountPaid: amountInCents,
    currency: 'USD',
    status: 'pending',
    purchasedBy: userId ?? null,
  });
  
  const topUpId = (topUpResult as any).insertId || 0;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${credits} AI Credits`,
            description: `Top up your DojoFlow AI credits balance`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      type: 'credit_top_up',
      organizationId: organizationId.toString(),
      credits: credits.toString(),
      topUpId: topUpId.toString(),
    },
  };

  // Add customer email if provided
  if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  // Use existing customer if available
  if (existingSubRecord?.stripeCustomerId) {
    sessionParams.customer = existingSubRecord.stripeCustomerId;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  // Update top-up with Stripe session ID
  await db.update(creditTopUps)
    .set({
      stripePaymentIntentId: session.payment_intent as string || session.id,
      updatedAt:new Date().toISOString(),
    })
    .where(eq(creditTopUps.id, topUpId));

  return {
    sessionId: session.id,
    url: session.url,
    topUpId,
  };
}

/**
 * Handle successful credit top-up payment
 */
export async function handleCreditTopUpComplete(session: Stripe.Checkout.Session) {
  const { organizationId, credits, topUpId } = session.metadata as { 
    organizationId: string; 
    credits: string; 
    topUpId: string;
  };

  if (!organizationId || !credits || !topUpId) {
    throw new Error('Missing metadata in checkout session');
  }

  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Update top-up status
  const now = new Date().toISOString();
  await db.update(creditTopUps)
    .set({
      status: 'completed',
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(creditTopUps.id, parseInt(topUpId)));

  // Add credits to balance
  const creditAmount = parseInt(credits);
  const existingResults = await db.select().from(aiCreditBalance)
    .where(eq(aiCreditBalance.organizationId, parseInt(organizationId)))
    .limit(1);
  
  const existing = existingResults[0];

  if (existing) {
    await db.update(aiCreditBalance)
      .set({
        balance: existing.balance + creditAmount,
        totalPurchased: existing.totalPurchased + creditAmount,
        updatedAt:new Date().toISOString(),
      })
      .where(eq(aiCreditBalance.organizationId, parseInt(organizationId)));
  } else {
    // Create new balance record
    await db.insert(aiCreditBalance).values({
      organizationId: parseInt(organizationId),
      balance: creditAmount,
      periodAllowance: 0,
      periodUsed: 0,
      totalPurchased: creditAmount,
      totalUsed: 0,
    });
  }

  // Log transaction
  const newBalance = existing ? existing.balance + creditAmount : creditAmount;
  await db.insert(aiCreditTransactions).values({
    organizationId: parseInt(organizationId),
    type: 'purchase',
    amount: creditAmount,
    balanceAfter: newBalance,
    description: `Credit top-up: ${creditAmount} credits purchased`,
    metadata: JSON.stringify({
      topUpId: parseInt(topUpId),
      sessionId: session.id,
      amountPaid: session.amount_total,
    }),
  });

  return { success: true, creditsAdded: creditAmount, newBalance };
}

export { stripe };

/**
 * Create Stripe checkout session for 7-day trial
 */
export async function createTrialCheckout(params: {
  organizationId: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}) {
  const { organizationId, successUrl, cancelUrl, customerEmail } = params;

  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Check if organization already has a Stripe customer ID
  const existingSub = await db.select().from(organizationSubscriptions)
    .where(eq(organizationSubscriptions.organizationId, organizationId))
    .limit(1);
  
  const existingSubRecord = existingSub[0];

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'DojoFlow 7-Day Trial',
            description: 'Start your 7-day free trial with 100 AI credits',
          },
          recurring: {
            interval: 'month',
            trial_period_days: 7,
          },
          unit_amount: 2999, // $29.99/month after trial
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      organizationId: organizationId.toString(),
      trialType: 'trial_7day',
    },
  };

  // Add customer email if provided
  if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  // Use existing customer if available
  if (existingSubRecord?.stripeCustomerId) {
    sessionParams.customer = existingSubRecord.stripeCustomerId;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return {
    sessionId: session.id,
    url: session.url,
  };
}
