/**
 * Stripe Subscription Integration Tests
 * 
 * Tests subscription checkout, webhook handling, and credit allocation
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createSubscriptionCheckout, handleCheckoutComplete, handleSubscriptionRenewed } from './stripeSubscription';
import { getDb } from './db';
import { organizationSubscriptions, aiCreditBalance, subscriptionPlans } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Stripe Subscription Integration', () => {
  let testOrganizationId: number;
  let testPlanId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get an existing plan for testing
    const plans = await db.select().from(subscriptionPlans).limit(1);
    if (plans.length === 0) {
      throw new Error('No subscription plans found. Run seed script first.');
    }
    testPlanId = plans[0].id;
    testOrganizationId = 99999; // Use a test organization ID
  });

  afterAll(async () => {
    // Cleanup test data
    const db = await getDb();
    if (!db) return;

    await db.delete(organizationSubscriptions)
      .where(eq(organizationSubscriptions.organizationId, testOrganizationId));
    await db.delete(aiCreditBalance)
      .where(eq(aiCreditBalance.organizationId, testOrganizationId));
  });

  it('should create a Stripe checkout session', async () => {
    const result = await createSubscriptionCheckout({
      organizationId: testOrganizationId,
      planId: testPlanId,
      successUrl: 'http://localhost:3000/billing/success?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'http://localhost:3000/pricing',
      customerEmail: 'test@example.com'
    });

    expect(result).toHaveProperty('sessionId');
    expect(result).toHaveProperty('url');
    expect(result.url).toContain('stripe.com');
  });

  it('should handle successful checkout and allocate credits', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get plan details
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, testPlanId),
    });
    if (!plan) throw new Error('Plan not found');

    // Mock Stripe checkout session
    const mockSession = {
      id: 'cs_test_' + Date.now(),
      subscription: 'sub_test_' + Date.now(),
      customer: 'cus_test_' + Date.now(),
      metadata: {
        organizationId: testOrganizationId,
        planId: testPlanId
      }
    } as any;

    await handleCheckoutComplete(mockSession);

    // Verify subscription was created
    const subscription = await db.query.organizationSubscriptions.findFirst({
      where: eq(organizationSubscriptions.organizationId, testOrganizationId),
    });

    expect(subscription).toBeDefined();
    expect(subscription?.planId).toBe(testPlanId);
    expect(subscription?.status).toBe('active');
    expect(subscription?.stripeSubscriptionId).toBe(mockSession.subscription);
    expect(subscription?.stripeCustomerId).toBe(mockSession.customer);

    // Verify credits were allocated
    const creditBalance = await db.query.aiCreditBalance.findFirst({
      where: eq(aiCreditBalance.organizationId, testOrganizationId),
    });

    expect(creditBalance).toBeDefined();
    expect(creditBalance?.balance).toBe(plan.monthlyCredits);
  });

  it('should handle subscription renewal and add credits', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get existing subscription
    const existingSub = await db.query.organizationSubscriptions.findFirst({
      where: eq(organizationSubscriptions.organizationId, testOrganizationId),
    });
    if (!existingSub) throw new Error('Subscription not found');

    // Get plan details
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, testPlanId),
    });
    if (!plan) throw new Error('Plan not found');

    // Get initial credit balance
    const initialBalance = await db.query.aiCreditBalance.findFirst({
      where: eq(aiCreditBalance.organizationId, testOrganizationId),
    });
    const initialCredits = initialBalance?.balance || 0;

    // Mock Stripe subscription renewal
    const mockSubscription = {
      id: existingSub.stripeSubscriptionId,
      customer: existingSub.stripeCustomerId,
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    } as any;

    await handleSubscriptionRenewed(mockSubscription);

    // Verify credits were added
    const newBalance = await db.query.aiCreditBalance.findFirst({
      where: eq(aiCreditBalance.organizationId, testOrganizationId),
    });

    expect(newBalance).toBeDefined();
    expect(newBalance?.balance).toBe(initialCredits + plan.monthlyCredits);
  });

  it('should update subscription period on renewal', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const existingSub = await db.query.organizationSubscriptions.findFirst({
      where: eq(organizationSubscriptions.organizationId, testOrganizationId),
    });
    if (!existingSub) throw new Error('Subscription not found');

    const newPeriodStart = Math.floor(Date.now() / 1000);
    const newPeriodEnd = newPeriodStart + 30 * 24 * 60 * 60;

    const mockSubscription = {
      id: existingSub.stripeSubscriptionId,
      customer: existingSub.stripeCustomerId,
      current_period_start: newPeriodStart,
      current_period_end: newPeriodEnd,
    } as any;

    await handleSubscriptionRenewed(mockSubscription);

    const updatedSub = await db.query.organizationSubscriptions.findFirst({
      where: eq(organizationSubscriptions.organizationId, testOrganizationId),
    });

    expect(updatedSub).toBeDefined();
    expect(updatedSub?.currentPeriodStart).toBeInstanceOf(Date);
    expect(updatedSub?.currentPeriodEnd).toBeInstanceOf(Date);
  });
});
