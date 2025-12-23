/**
 * Stripe Subscription Service
 * 
 * Handles subscription checkout, webhooks, and lifecycle management
 */

import Stripe from 'stripe';
import { getDb } from './db';
import { organizationSubscriptions, aiCreditBalance, subscriptionPlans } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
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
  
  const plan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, planId),
  });

  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  // Check if organization already has a Stripe customer ID
  const existingSub = await db.query.organizationSubscriptions.findFirst({
    where: eq(organizationSubscriptions.organizationId, organizationId),
  });

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            description: plan.description || undefined,
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
  if (existingSub?.stripeCustomerId) {
    sessionParams.customer = existingSub.stripeCustomerId;
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
  const { organizationId, planId } = session.metadata as { organizationId: string; planId: string };

  if (!organizationId || !planId) {
    throw new Error('Missing metadata in checkout session');
  }

  const orgId = parseInt(organizationId);
  const pId = parseInt(planId);
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  // Get plan details for credit allocation
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const plan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, pId),
  });

  if (!plan) {
    throw new Error('Plan not found');
  }

  // Check if subscription already exists
  const existing = await db.query.organizationSubscriptions.findFirst({
    where: eq(organizationSubscriptions.organizationId, orgId),
  });

  if (existing) {
    // Update existing subscription
    await db.update(organizationSubscriptions)
      .set({
        planId: pId,
        status: 'active',
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        updatedAt: new Date(),
      })
      .where(eq(organizationSubscriptions.organizationId, orgId));
  } else {
    // Create new subscription
    await db.insert(organizationSubscriptions).values({
      organizationId: orgId,
      planId: pId,
      status: 'active',
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Allocate monthly credits
  await allocateMonthlyCredits(orgId, plan.monthlyCredits);

  return { success: true };
}

/**
 * Allocate monthly credits to organization
 */
async function allocateMonthlyCredits(organizationId: number, credits: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const existing = await db.query.aiCreditBalance.findFirst({
    where: eq(aiCreditBalance.organizationId, organizationId),
  });

  if (existing) {
    // Add credits to existing balance
    await db.update(aiCreditBalance)
      .set({
        balance: existing.balance + credits,
        updatedAt: new Date(),
      })
      .where(eq(aiCreditBalance.organizationId, organizationId));
  } else {
    // Create new credit balance
    await db.insert(aiCreditBalance).values({
      organizationId,
      balance: credits,
      createdAt: new Date(),
      updatedAt: new Date(),
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
  
  const orgSub = await db.query.organizationSubscriptions.findFirst({
    where: eq(organizationSubscriptions.stripeCustomerId, customerId),
  });

  if (!orgSub) {
    throw new Error('Organization subscription not found');
  }

  // Get plan details
  const plan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, orgSub.planId),
  });

  if (!plan) {
    throw new Error('Plan not found');
  }

  // Update subscription period
  await db.update(organizationSubscriptions)
    .set({
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date(),
    })
    .where(eq(organizationSubscriptions.organizationId, orgSub.organizationId));

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
  
  const orgSub = await db.query.organizationSubscriptions.findFirst({
    where: eq(organizationSubscriptions.stripeCustomerId, customerId),
  });

  if (!orgSub) {
    throw new Error('Organization subscription not found');
  }

  // Update subscription status
  await db.update(organizationSubscriptions)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date(),
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
  
  const orgSub = await db.query.organizationSubscriptions.findFirst({
    where: eq(organizationSubscriptions.stripeCustomerId, customerId),
  });

  if (!orgSub) {
    throw new Error('Organization subscription not found');
  }

  // Update subscription status to past_due
  await db.update(organizationSubscriptions)
    .set({
      status: 'past_due',
      updatedAt: new Date(),
    })
    .where(eq(organizationSubscriptions.organizationId, orgSub.organizationId));

  return { success: true };
}

export { stripe };
