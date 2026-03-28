/**
 * Enhanced Credit Consumption Service
 * 
 * Handles real-time credit deduction, balance monitoring, and alerts
 * for all operations (Kai chat, SMS, email, calls).
 */

import { getDb } from "../db";
import { aiCreditBalance, aiCreditTransactions, organizations } from "../../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";

/**
 * Credit costs for different operation types
 */
export const CREDIT_COSTS = {
  KAI_CHAT: 1,              // 1 credit per message
  SMS: 1,                   // 1 credit per SMS
  EMAIL: 2,                 // 2 credits per email
  CALL_PER_MINUTE: 10,      // 10 credits per minute of call
  AUTOMATION: 1,            // 1 credit per automation
  DATA_ANALYSIS: 5,         // 5 credits per analysis
} as const;

/**
 * Task types for credit transactions
 */
export type TaskType = 
  | 'kai_chat'
  | 'ai_sms'
  | 'ai_email'
  | 'ai_phone_call'
  | 'automation'
  | 'data_analysis'
  | 'other';

/**
 * Credit balance thresholds for alerts
 */
export const CREDIT_THRESHOLDS = {
  WARNING: 50,        // Show warning below this
  CRITICAL: 10,       // Show critical alert below this
  BLOCKING: 0,        // Block operations at this level
} as const;

/**
 * Alert levels for credit monitoring
 */
export type AlertLevel = 'none' | 'warning' | 'critical' | 'blocked';

/**
 * Credit consumption result
 */
export interface CreditConsumptionResult {
  success: boolean;
  newBalance: number;
  transactionId?: number;
  alertLevel: AlertLevel;
  message?: string;
  error?: string;
}

/**
 * Check if organization has sufficient credits for an operation
 */
export async function checkSufficientBalance(
  organizationId: number,
  requiredCredits: number
): Promise<{ 
  sufficient: boolean
  currentBalance: number
  alertLevel: AlertLevel
  message?: string 
}> {
  const db = await getDb();
  if (!db) {
    return {
      sufficient: false,
      currentBalance: 0,
      alertLevel: 'blocked',
      message: "Database not available",
    };
  }

  const balance = await db
    .select()
    .from(aiCreditBalance)
    .where(eq(aiCreditBalance.organizationId, organizationId))
    .limit(1);

  if (!balance || balance.length === 0) {
    return {
      sufficient: false,
      currentBalance: 0,
      alertLevel: 'blocked',
      message: "No credit balance found. Please contact support.",
    };
  }

  const currentBalance = balance[0].balance;
  let alertLevel: AlertLevel = 'none';
  let message: string | undefined;

  if (currentBalance < requiredCredits) {
    return {
      sufficient: false,
      currentBalance,
      alertLevel: 'blocked',
      message: `Insufficient credits. Required: ${requiredCredits}, Available: ${currentBalance}. Please top up your credits.`,
    };
  }

  const balanceAfterOperation = currentBalance - requiredCredits;

  // Determine alert level
  if (balanceAfterOperation < CREDIT_THRESHOLDS.CRITICAL) {
    alertLevel = 'critical';
    message = `Critical: Only ${balanceAfterOperation} credits remaining after this operation.`;
  } else if (balanceAfterOperation < CREDIT_THRESHOLDS.WARNING) {
    alertLevel = 'warning';
    message = `Warning: Low credit balance. ${balanceAfterOperation} credits remaining after this operation.`;
  }

  return {
    sufficient: true,
    currentBalance,
    alertLevel,
    message,
  };
}

/**
 * Deduct credits from organization balance with real-time tracking
 */
export async function deductCredits(params: {
  organizationId: number;
  amount: number;
  taskType: TaskType;
  description: string;
  metadata?: Record<string, any>;
}): Promise<CreditConsumptionResult> {
  const { organizationId, amount, taskType, description, metadata } = params;

  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        newBalance: 0,
        alertLevel: 'blocked',
        error: "Database not available",
      };
    }

    // Check balance first
    const balanceCheck = await checkSufficientBalance(organizationId, amount);
    if (!balanceCheck.sufficient) {
      return {
        success: false,
        newBalance: balanceCheck.currentBalance,
        alertLevel: balanceCheck.alertLevel,
        error: balanceCheck.message,
      };
    }

    // Get current balance record
    const currentBalanceRecord = await db
      .select()
      .from(aiCreditBalance)
      .where(eq(aiCreditBalance.organizationId, organizationId))
      .limit(1);

    if (!currentBalanceRecord || currentBalanceRecord.length === 0) {
      return {
        success: false,
        newBalance: 0,
        alertLevel: 'blocked',
        error: "Credit balance not found",
      };
    }

    const record = currentBalanceRecord[0];
    const newBalance = record.balance - amount;

    // Update balance with transaction
    await db
      .update(aiCreditBalance)
      .set({
        balance: newBalance,
        periodUsed: (record.periodUsed || 0) + amount,
        totalUsed: (record.totalUsed || 0) + amount,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(aiCreditBalance.organizationId, organizationId));

    // Log transaction
    const transaction = await db
      .insert(aiCreditTransactions)
      .values({
        organizationId,
        type: 'deduction',
        amount: -amount,
        taskType,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString(),
      });

    // Check alert level after deduction
    let alertLevel: AlertLevel = 'none';
    let message: string | undefined;

    if (newBalance < CREDIT_THRESHOLDS.CRITICAL) {
      alertLevel = 'critical';
      message = `Critical: Only ${newBalance} credits remaining.`;
    } else if (newBalance < CREDIT_THRESHOLDS.WARNING) {
      alertLevel = 'warning';
      message = `Warning: Low credit balance (${newBalance} credits remaining).`;
    }

    // Send alert if needed
    if (alertLevel !== 'none') {
      await sendCreditAlert(organizationId, alertLevel, newBalance);
    }

    return {
      success: true,
      newBalance,
      transactionId: Number(transaction.insertId),
      alertLevel,
      message,
    };
  } catch (error) {
    console.error("[CreditConsumption] Error deducting credits:", error);
    return {
      success: false,
      newBalance: 0,
      alertLevel: 'blocked',
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Add credits to organization balance
 */
export async function addCredits(params: {
  organizationId: number;
  amount: number;
  source: 'subscription' | 'top_up' | 'refund' | 'bonus';
  description: string;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; newBalance: number; transactionId?: number; error?: string }> {
  const { organizationId, amount, source, description, metadata } = params;

  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        newBalance: 0,
        error: "Database not available",
      };
    }

    // Get current balance
    const balance = await db
      .select()
      .from(aiCreditBalance)
      .where(eq(aiCreditBalance.organizationId, organizationId))
      .limit(1);

    if (!balance || balance.length === 0) {
      return {
        success: false,
        newBalance: 0,
        error: "No credit balance found",
      };
    }

    const currentBalance = balance[0].balance;
    const newBalance = currentBalance + amount;

    // Update balance
    await db
      .update(aiCreditBalance)
      .set({
        balance: newBalance,
        totalPurchased: source === 'top_up' ? (balance[0].totalPurchased || 0) + amount : balance[0].totalPurchased,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(aiCreditBalance.organizationId, organizationId));

    // Log transaction
    const transactionType = source === 'subscription' ? 'allocation' : 
                           source === 'top_up' ? 'purchase' : 
                           source === 'refund' ? 'refund' : 'bonus';
    
    const transaction = await db
      .insert(aiCreditTransactions)
      .values({
        organizationId,
        type: transactionType as any,
        amount: amount,
        taskType: null,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString(),
      });

    console.log(`[Credits] Added ${amount} credits to org ${organizationId} (${source}). New balance: ${newBalance}`);

    return {
      success: true,
      newBalance,
      transactionId: Number(transaction.insertId),
    };
  } catch (error) {
    console.error("[CreditConsumption] Error adding credits:", error);
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get current credit balance for organization
 */
export async function getCreditBalance(organizationId: number): Promise<{
  creditsRemaining: number;
  creditsUsed: number;
  planAllowance: number;
  renewalDate: Date | null;
  alertLevel: AlertLevel;
}> {
  const db = await getDb();
  if (!db) {
    return {
      creditsRemaining: 0,
      creditsUsed: 0,
      planAllowance: 0,
      renewalDate: null,
      alertLevel: 'blocked',
    };
  }

  const balance = await db
    .select()
    .from(aiCreditBalance)
    .where(eq(aiCreditBalance.organizationId, organizationId))
    .limit(1);

  if (!balance || balance.length === 0) {
    // Auto-initialize with 1,000 starter credits
    try {
      const now = new Date().toISOString();
      const nextReset = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await db.insert(aiCreditBalance).values({
        organizationId,
        balance: 1000,
        periodAllowance: 1000,
        periodUsed: 0,
        totalPurchased: 0,
        totalUsed: 0,
        lowCreditThreshold: 50,
        lowCreditAlertSent: 0,
        lastResetAt: now,
        nextResetAt: nextReset,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`[Credits] Auto-initialized 1,000 starter credits for org ${organizationId}`);
      return {
        creditsRemaining: 1000,
        creditsUsed: 0,
        planAllowance: 1000,
        renewalDate: new Date(nextReset),
        alertLevel: 'none',
      };
    } catch (initError) {
      console.error('[Credits] Failed to auto-initialize credits:', initError);
      return { 
        creditsRemaining: 0, 
        creditsUsed: 0, 
        planAllowance: 0, 
        renewalDate: null,
        alertLevel: 'blocked',
      };
    }
  }

  const record = balance[0];
  let alertLevel: AlertLevel = 'none';

  if (record.balance < CREDIT_THRESHOLDS.CRITICAL) {
    alertLevel = 'critical';
  } else if (record.balance < CREDIT_THRESHOLDS.WARNING) {
    alertLevel = 'warning';
  }

  return {
    creditsRemaining: record.balance,
    creditsUsed: record.periodUsed || 0,
    planAllowance: record.periodAllowance || 0,
    renewalDate: record.nextResetAt ? new Date(record.nextResetAt) : null,
    alertLevel,
  };
}

/**
 * Send credit alert to organization
 */
async function sendCreditAlert(
  organizationId: number,
  alertLevel: AlertLevel,
  currentBalance: number
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Get organization details
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!org || org.length === 0) return;

    const organization = org[0];
    const subject = alertLevel === 'critical' 
      ? '🚨 Critical: Your DojoFlow credits are running out!' 
      : '⚠️ Warning: Your DojoFlow credits are low';

    const message = alertLevel === 'critical'
      ? `Your organization has only ${currentBalance} credits remaining. Operations will be blocked when credits reach zero. Please top up immediately.`
      : `Your organization has ${currentBalance} credits remaining. Consider purchasing more credits to avoid service interruption.`;

    console.log(`[Credits] Alert (${alertLevel}): Org ${organizationId} - ${message}`);

    // In production, send email notification here
    // await sendEmailNotification(organization.email, subject, message);
  } catch (error) {
    console.error("[CreditConsumption] Error sending alert:", error);
  }
}

/**
 * Get credit transaction history
 */
export async function getCreditTransactionHistory(
  organizationId: number,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const transactions = await db
      .select()
      .from(aiCreditTransactions)
      .where(eq(aiCreditTransactions.organizationId, organizationId))
      .orderBy((t) => t.createdAt)
      .limit(limit)
      .offset(offset);

    return transactions || [];
  } catch (error) {
    console.error("[CreditConsumption] Error fetching transaction history:", error);
    return [];
  }
}

/**
 * Estimate credits needed for operation
 */
export function estimateCreditsNeeded(
  operationType: TaskType,
  metadata?: {
    messageLength?: number;
    durationMinutes?: number;
    recipientCount?: number;
  }
): number {
  let credits = CREDIT_COSTS[operationType === 'ai_phone_call' ? 'CALL_PER_MINUTE' : operationType as keyof typeof CREDIT_COSTS] || 1;

  // Adjust based on metadata
  if (metadata?.durationMinutes && operationType === 'ai_phone_call') {
    credits = CREDIT_COSTS.CALL_PER_MINUTE * metadata.durationMinutes;
  }

  if (metadata?.recipientCount && operationType === 'ai_email') {
    credits = CREDIT_COSTS.EMAIL * metadata.recipientCount;
  }

  return credits;
}

export default {
  CREDIT_COSTS,
  CREDIT_THRESHOLDS,
  checkSufficientBalance,
  deductCredits,
  addCredits,
  getCreditBalance,
  getCreditTransactionHistory,
  estimateCreditsNeeded,
};
