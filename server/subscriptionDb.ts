import { getDb } from "./db";
import { 
  subscriptionPlans, 
  organizationSubscriptions,
  aiCreditBalance,
  aiCreditTransactions,
  creditTopUps,
  type SubscriptionPlan,
  type OrganizationSubscription,
  type AiCreditBalance,
  type AiCreditTransaction,
  type InsertOrganizationSubscription,
  type InsertAiCreditBalance,
  type InsertAiCreditTransaction,
  type InsertCreditTopUp
} from "../drizzle/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

/**
 * Get all active subscription plans
 */
export async function getAllPlans(): Promise<SubscriptionPlan[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, 1)).orderBy(subscriptionPlans.displayOrder);
}

/**
 * Get a specific plan by ID
 */
export async function getPlanById(planId: number): Promise<SubscriptionPlan | undefined> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId));
  return plans[0];
}

/**
 * Get a specific plan by slug
 */
export async function getPlanBySlug(slug: string): Promise<SubscriptionPlan | undefined> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, slug));
  return plans[0];
}

/**
 * Get organization's current subscription
 */
export async function getOrganizationSubscription(organizationId: number): Promise<OrganizationSubscription | undefined> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const subs = await db.select().from(organizationSubscriptions).where(eq(organizationSubscriptions.organizationId, organizationId));
  return subs[0];
}

/**
 * Create or update organization subscription
 */
export async function upsertOrganizationSubscription(data: InsertOrganizationSubscription): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.insert(organizationSubscriptions).values(data).onDuplicateKeyUpdate({
    set: {
      planId: data.planId,
      status: data.status,
      billingCycle: data.billingCycle,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      trialEndsAt: data.trialEndsAt,
      stripeSubscriptionId: data.stripeSubscriptionId,
      stripeCustomerId: data.stripeCustomerId,
      updatedAt: new Date()
    }
  });
}

/**
 * Cancel organization subscription
 */
export async function cancelOrganizationSubscription(organizationId: number, reason?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(organizationSubscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: reason,
      updatedAt: new Date()
    })
    .where(eq(organizationSubscriptions.organizationId, organizationId));
}

/**
 * Get organization's credit balance
 */
export async function getCreditBalance(organizationId: number): Promise<AiCreditBalance | undefined> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const balances = await db.select().from(aiCreditBalance).where(eq(aiCreditBalance.organizationId, organizationId));
  return balances[0];
}

/**
 * Initialize credit balance for new organization
 */
export async function initializeCreditBalance(organizationId: number, initialCredits: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const now = new Date();
  const nextReset = new Date(now);
  nextReset.setMonth(nextReset.getMonth() + 1);

  await db.insert(aiCreditBalance).values({
    organizationId,
    balance: initialCredits,
    periodAllowance: initialCredits,
    periodUsed: 0,
    totalPurchased: 0,
    totalUsed: 0,
    lastResetAt: now,
    nextResetAt: nextReset,
    lowCreditThreshold: 50,
    lowCreditAlertSent: 0
  });
}

/**
 * Deduct credits from organization balance
 * Returns true if successful, false if insufficient credits
 */
export async function deductCredits(
  organizationId: number,
  amount: number,
  taskType: AiCreditTransaction['taskType'],
  description: string,
  metadata?: Record<string, any>,
  userId?: number
): Promise<boolean> {
  const balance = await getCreditBalance(organizationId);
  
  if (!balance || balance.balance < amount) {
    return false;
  }

  const newBalance = balance.balance - amount;
  const newPeriodUsed = balance.periodUsed + amount;
  const newTotalUsed = balance.totalUsed + amount;

  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Update balance
  await db.update(aiCreditBalance)
    .set({
      balance: newBalance,
      periodUsed: newPeriodUsed,
      totalUsed: newTotalUsed,
      updatedAt: new Date()
    })
    .where(eq(aiCreditBalance.organizationId, organizationId));

  // Log transaction
  await db.insert(aiCreditTransactions).values({
    organizationId,
    type: "deduction",
    amount: -amount,
    balanceAfter: newBalance,
    taskType,
    description,
    metadata: metadata ? JSON.stringify(metadata) : null,
    userId
  });

  return true;
}

/**
 * Add credits to organization balance (purchase, allocation, bonus)
 */
export async function addCredits(
  organizationId: number,
  amount: number,
  type: 'allocation' | 'purchase' | 'bonus',
  description: string,
  metadata?: Record<string, any>,
  userId?: number
): Promise<void> {
  const balance = await getCreditBalance(organizationId);
  
  if (!balance) {
    throw new Error('Credit balance not initialized for organization');
  }

  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const newBalance = balance.balance + amount;
  const newTotalPurchased = type === 'purchase' ? balance.totalPurchased + amount : balance.totalPurchased;

  // Update balance
  await db.update(aiCreditBalance)
    .set({
      balance: newBalance,
      totalPurchased: newTotalPurchased,
      updatedAt: new Date()
    })
    .where(eq(aiCreditBalance.organizationId, organizationId));

  // Log transaction
  await db.insert(aiCreditTransactions).values({
    organizationId,
    type,
    amount,
    balanceAfter: newBalance,
    description,
    metadata: metadata ? JSON.stringify(metadata) : null,
    userId
  });
}

/**
 * Get credit transactions for organization
 */
export async function getCreditTransactions(
  organizationId: number,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    taskType?: AiCreditTransaction['taskType'];
  }
): Promise<AiCreditTransaction[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  let query = db.select().from(aiCreditTransactions).where(eq(aiCreditTransactions.organizationId, organizationId));

  if (options?.startDate) {
    query = query.where(and(
      eq(aiCreditTransactions.organizationId, organizationId),
      gte(aiCreditTransactions.createdAt, options.startDate)
    )) as any;
  }

  if (options?.endDate) {
    query = query.where(and(
      eq(aiCreditTransactions.organizationId, organizationId),
      lte(aiCreditTransactions.createdAt, options.endDate)
    )) as any;
  }

  if (options?.taskType) {
    query = query.where(and(
      eq(aiCreditTransactions.organizationId, organizationId),
      eq(aiCreditTransactions.taskType, options.taskType)
    )) as any;
  }

  query = query.orderBy(desc(aiCreditTransactions.createdAt));

  if (options?.limit) {
    query = query.limit(options.limit) as any;
  }

  if (options?.offset) {
    query = query.offset(options.offset) as any;
  }

  return query;
}

/**
 * Create credit top-up record
 */
export async function createCreditTopUp(data: InsertCreditTopUp): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(creditTopUps).values(data);
  return result[0].insertId;
}

/**
 * Complete credit top-up and add credits to balance
 */
export async function completeCreditTopUp(topUpId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const topUps = await db.select().from(creditTopUps).where(eq(creditTopUps.id, topUpId));
  const topUp = topUps[0];

  if (!topUp) {
    throw new Error('Top-up not found');
  }

  if (topUp.status === 'completed') {
    return; // Already completed
  }

  // Update top-up status
  await db.update(creditTopUps)
    .set({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(creditTopUps.id, topUpId));

  // Add credits to balance
  await addCredits(
    topUp.organizationId,
    topUp.credits,
    'purchase',
    `Credit top-up: ${topUp.credits} credits purchased`,
    { topUpId, amountPaid: topUp.amountPaid },
    topUp.purchasedBy ?? undefined
  );
}

/**
 * Reset monthly credit allowance (called at billing cycle renewal)
 */
export async function resetMonthlyCredits(organizationId: number, newAllowance: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const now = new Date();
  const nextReset = new Date(now);
  nextReset.setMonth(nextReset.getMonth() + 1);

  const balance = await getCreditBalance(organizationId);
  
  if (!balance) {
    throw new Error('Credit balance not initialized for organization');
  }

  // Add new allowance to balance
  const newBalance = balance.balance + newAllowance;

  await db.update(aiCreditBalance)
    .set({
      balance: newBalance,
      periodAllowance: newAllowance,
      periodUsed: 0,
      lastResetAt: now,
      nextResetAt: nextReset,
      lowCreditAlertSent: 0,
      updatedAt: new Date()
    })
    .where(eq(aiCreditBalance.organizationId, organizationId));

  // Log allocation
  await db.insert(aiCreditTransactions).values({
    organizationId,
    type: 'allocation',
    amount: newAllowance,
    balanceAfter: newBalance,
    description: `Monthly credit allocation: ${newAllowance} credits`,
    metadata: JSON.stringify({ period: now.toISOString() })
  });
}
