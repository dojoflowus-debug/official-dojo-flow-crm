import { aiCreditBalance, aiCreditTransactions, organizations } from '../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getDb } from './db';

/**
 * Credit costs for different AI features
 */
export const CREDIT_COSTS = {
  CHAT_MESSAGE: 1,
  SMS_MESSAGE: 5,
  VOICE_CALL: 10,
  EMAIL_MESSAGE: 3,
  SCHEDULE_EXTRACTION: 2,
  CLASS_CREATION: 3,
} as const;

/**
 * Feature types that require credits
 */
export type FeatureType = keyof typeof CREDIT_COSTS;

/**
 * Map CREDIT_COSTS feature keys to the DB taskType enum values
 */
const FEATURE_TO_TASK_TYPE: Record<FeatureType, 'kai_chat' | 'ai_sms' | 'ai_email' | 'ai_phone_call' | 'automation' | 'data_analysis' | 'other'> = {
  CHAT_MESSAGE: 'kai_chat',
  SMS_MESSAGE: 'ai_sms',
  EMAIL_MESSAGE: 'ai_email',
  VOICE_CALL: 'ai_phone_call',
  SCHEDULE_EXTRACTION: 'data_analysis',
  CLASS_CREATION: 'automation',
};

/**
 * Subscription status types
 */
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'no_subscription';

/**
 * Check if user has active subscription or sufficient credits
 */
export async function checkSubscriptionStatus(organizationId: number): Promise<{
  hasActiveSubscription: boolean;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  isBillingExempt: boolean;
}> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Get organization billing status
    const org = await db
      .select({
        billingExempt: organizations.billingExempt,
        subscriptionStatus: organizations.subscriptionStatus,
        trialEndsAt: organizations.trialEndsAt,
      })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!org.length) {
      return {
        hasActiveSubscription: false,
        status: 'no_subscription',
        trialEndsAt: null,
        isBillingExempt: false,
      };
    }

    const { billingExempt, subscriptionStatus, trialEndsAt } = org[0];

    // Billing exempt organizations always have access
    if (billingExempt) {
      return {
        hasActiveSubscription: true,
        status: 'active',
        trialEndsAt: null,
        isBillingExempt: true,
      };
    }

    // Check if trial is still active
    const now = new Date();
    const isTrialActive = trialEndsAt && trialEndsAt > now;

    // Determine subscription status
    let status: SubscriptionStatus = (subscriptionStatus as SubscriptionStatus) || 'no_subscription';
    if (isTrialActive) {
      status = 'trialing';
    }

    const hasActiveSubscription = status === 'active' || status === 'trialing';

    return {
      hasActiveSubscription,
      status,
      trialEndsAt: isTrialActive ? trialEndsAt : null,
      isBillingExempt: false,
    };
  } catch (error) {
    console.error('[creditMiddleware] Error checking subscription status:', error);
    return {
      hasActiveSubscription: false,
      status: 'no_subscription',
      trialEndsAt: null,
      isBillingExempt: false,
    };
  }
}

/**
 * Get current credit balance for organization
 */
export async function getCreditBalance(organizationId: number): Promise<number> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const balance = await db
      .select({ balance: aiCreditBalance.balance })
      .from(aiCreditBalance)
      .where(eq(aiCreditBalance.organizationId, organizationId))
      .limit(1);

    return balance.length > 0 ? balance[0].balance : 0;
  } catch (error) {
    console.error('[creditMiddleware] Error getting credit balance:', error);
    return 0;
  }
}

/**
 * Check if user has sufficient credits for a feature
 */
export async function hasSufficientCredits(
  organizationId: number,
  featureType: FeatureType
): Promise<boolean> {
  const requiredCredits = CREDIT_COSTS[featureType];
  const currentBalance = await getCreditBalance(organizationId);
  return currentBalance >= requiredCredits;
}

/**
 * Deduct credits for a feature usage
 * Returns success/failure with updated balance
 */
export async function deductCredits(
  organizationId: number,
  userId: number,
  featureType: FeatureType,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const creditCost = CREDIT_COSTS[featureType];
  const taskType = FEATURE_TO_TASK_TYPE[featureType] || 'other';

  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Check current balance
    const currentBalance = await getCreditBalance(organizationId);

    if (currentBalance < creditCost) {
      return {
        success: false,
        newBalance: currentBalance,
        error: `Insufficient credits. Required: ${creditCost}, Available: ${currentBalance}`,
      };
    }

    const newBalance = currentBalance - creditCost;

    // Create transaction record with correct column names and enum values
    await db.insert(aiCreditTransactions).values({
      organizationId,
      userId,
      type: 'deduction',
      amount: creditCost,
      balanceAfter: newBalance,
      taskType,
      description: `${featureType} credit deduction`,
      metadata: JSON.stringify(metadata || {}),
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });

    // Update balance and usage counters atomically
    await db
      .update(aiCreditBalance)
      .set({
        balance: newBalance,
        periodUsed: sql`${aiCreditBalance.periodUsed} + ${creditCost}`,
        totalUsed: sql`${aiCreditBalance.totalUsed} + ${creditCost}`,
      })
      .where(eq(aiCreditBalance.organizationId, organizationId));

    console.log(`[creditMiddleware] Deducted ${creditCost} credits for ${featureType} (org ${organizationId}). New balance: ${newBalance}`);

    return {
      success: true,
      newBalance,
    };
  } catch (error) {
    console.error('[creditMiddleware] Error deducting credits:', error);
    return {
      success: false,
      newBalance: await getCreditBalance(organizationId),
      error: 'Failed to process credit deduction',
    };
  }
}

/**
 * Add credits to organization (for trial, purchases, etc.)
 */
export async function addCredits(
  organizationId: number,
  amount: number,
  reason: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Get current balance first
    const currentBalance = await getCreditBalance(organizationId);
    const newBalance = currentBalance + amount;

    // Create transaction record with correct schema
    await db.insert(aiCreditTransactions).values({
      organizationId,
      userId: 0, // System transaction
      type: 'allocation',
      amount,
      balanceAfter: newBalance,
      taskType: 'other',
      description: reason,
      metadata: JSON.stringify({ reason, ...metadata }),
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });

    // Update balance
    await db
      .update(aiCreditBalance)
      .set({
        balance: newBalance,
        totalPurchased: sql`${aiCreditBalance.totalPurchased} + ${amount}`,
      })
      .where(eq(aiCreditBalance.organizationId, organizationId));

    return {
      success: true,
      newBalance,
    };
  } catch (error) {
    console.error('[creditMiddleware] Error adding credits:', error);
    return {
      success: false,
      newBalance: await getCreditBalance(organizationId),
      error: 'Failed to add credits',
    };
  }
}

/**
 * Enforce credit access for a feature
 * Throws error if user doesn't have access
 */
export async function enforceFeatureAccess(
  organizationId: number,
  featureType: FeatureType
): Promise<void> {
  // Check subscription status
  const subscription = await checkSubscriptionStatus(organizationId);

  // If billing exempt, allow access immediately
  if (subscription.isBillingExempt) {
    return;
  }

  // Check if user has sufficient credits
  const hasCredits = await hasSufficientCredits(organizationId, featureType);
  if (hasCredits) {
    return; // Has credits, allow access
  }

  // If no credits, check if they have an active subscription
  if (!subscription.hasActiveSubscription) {
    throw new Error('SUBSCRIPTION_REQUIRED');
  }

  // Has subscription but no credits
  throw new Error('INSUFFICIENT_CREDITS');
}

/**
 * Get credit usage report for organization
 */
export async function getCreditUsageReport(organizationId: number, days: number = 30) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const transactions = await db
      .select()
      .from(aiCreditTransactions)
      .where(
        and(
          eq(aiCreditTransactions.organizationId, organizationId),
        )
      );

    // Group by task type
    const byFeature = transactions.reduce(
      (acc, tx) => {
        const feature = tx.taskType || 'other';
        if (!acc[feature]) {
          acc[feature] = { count: 0, totalCredits: 0 };
        }
        if (tx.type === 'deduction') {
          acc[feature].count += 1;
          acc[feature].totalCredits += tx.amount;
        }
        return acc;
      },
      {} as Record<string, { count: number; totalCredits: number }>
    );

    return {
      period: { startDate: new Date(Date.now() - days * 86400000), endDate: new Date() },
      byFeature,
      totalTransactions: transactions.length,
    };
  } catch (error) {
    console.error('[creditMiddleware] Error getting credit usage report:', error);
    return {
      period: { startDate: new Date(), endDate: new Date() },
      byFeature: {},
      totalTransactions: 0,
    };
  }
}
