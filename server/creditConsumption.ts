/**
 * Credit Consumption Service
 * 
 * Handles credit deduction, balance checks, and transaction logging
 * for all AI-powered operations (Kai chat, SMS, email, calls).
 */

import { getDb } from "./db";
import { aiCreditBalance, aiCreditTransactions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Credit costs for different operation types
 */
export const CREDIT_COSTS = {
  KAI_CHAT: 1,           // 1 credit per message
  SMS: 1,                // 1 credit per SMS
  EMAIL: 2,              // 2 credits per email
  CALL_PER_MINUTE: 10,   // 10 credits per minute of call
} as const;

/**
 * Task types for credit transactions (matching schema enums)
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
 * Credit balance thresholds
 */
export const CREDIT_THRESHOLDS = {
  WARNING: 50,   // Show warning below this
  CRITICAL: 10,  // Show critical alert below this
  BLOCKING: 0,   // Block operations at this level
} as const;

/**
 * Check if organization has sufficient credits for an operation
 */
export async function checkSufficientBalance(
  organizationId: number,
  requiredCredits: number
): Promise<{ sufficient: boolean; currentBalance: number; message?: string }> {
  const db = await getDb();
  if (!db) {
    return {
      sufficient: false,
      currentBalance: 0,
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
      message: "No credit balance found. Please contact support.",
    };
  }

  const currentBalance = balance[0].balance;

  if (currentBalance < requiredCredits) {
    return {
      sufficient: false,
      currentBalance,
      message: `Insufficient credits. Required: ${requiredCredits}, Available: ${currentBalance}. Please top up your credits.`,
    };
  }

  // Warn if balance is getting low
  if (currentBalance - requiredCredits < CREDIT_THRESHOLDS.WARNING) {
    return {
      sufficient: true,
      currentBalance,
      message: `Warning: Low credit balance. ${currentBalance - requiredCredits} credits remaining after this operation.`,
    };
  }

  return {
    sufficient: true,
    currentBalance,
  };
}

/**
 * Deduct credits from organization balance and log transaction
 */
export async function deductCredits(params: {
  organizationId: number;
  amount: number;
  taskType: TaskType;
  description: string;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; newBalance: number; transactionId?: number; error?: string }> {
  const { organizationId, amount, taskType, description, metadata } = params;

  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        newBalance: 0,
        error: "Database not available",
      };
    }

    // Check balance first
    const balanceCheck = await checkSufficientBalance(organizationId, amount);
    if (!balanceCheck.sufficient) {
      return {
        success: false,
        newBalance: balanceCheck.currentBalance,
        error: balanceCheck.message,
      };
    }

    // Get current balance to calculate usage correctly
    const currentBalanceRecord = await db
      .select()
      .from(aiCreditBalance)
      .where(eq(aiCreditBalance.organizationId, organizationId))
      .limit(1);

    if (!currentBalanceRecord || currentBalanceRecord.length === 0) {
      return {
        success: false,
        newBalance: 0,
        error: "Credit balance not found",
      };
    }

    const currentBalance = currentBalanceRecord[0].balance;
    const currentPeriodUsed = currentBalanceRecord[0].periodUsed;
    const currentTotalUsed = currentBalanceRecord[0].totalUsed;

    // Deduct credits and increment usage counters
    const updated = await db
      .update(aiCreditBalance)
      .set({
        balance: currentBalance - amount,
        periodUsed: currentPeriodUsed + amount,
        totalUsed: currentTotalUsed + amount,
        updatedAt: new Date(),
      })
      .where(eq(aiCreditBalance.organizationId, organizationId));

    if (!updated) {
      return {
        success: false,
        newBalance: currentBalance,
        error: "Failed to update credit balance",
      };
    }

    const newBalance = currentBalance - amount;

    // Log transaction
    const transaction = await db
      .insert(aiCreditTransactions)
      .values({
        organizationId,
        type: 'deduction',
        amount: -amount, // Negative for deductions
        taskType,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        balanceAfter: newBalance,
        createdAt: new Date(),
      });

    return {
      success: true,
      newBalance,
      transactionId: Number(transaction.insertId),
    };
  } catch (error) {
    console.error("[CreditConsumption] Error deducting credits:", error);
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Add credits to organization balance (for top-ups, subscriptions)
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
    const currentTotalPurchased = balance[0].totalPurchased;
    const newBalance = currentBalance + amount;

    // Add credits and update purchase counter
    const updated = await db
      .update(aiCreditBalance)
      .set({
        balance: newBalance,
        totalPurchased: source === 'top_up' ? currentTotalPurchased + amount : currentTotalPurchased,
        updatedAt: new Date(),
      })
      .where(eq(aiCreditBalance.organizationId, organizationId));

    if (!updated) {
      return {
        success: false,
        newBalance: currentBalance,
        error: "Failed to update credit balance",
      };
    }

    // Log transaction
    const transactionType = source === 'subscription' ? 'allocation' : 
                           source === 'top_up' ? 'purchase' : 
                           source === 'refund' ? 'refund' : 'bonus';
    
    const transaction = await db
      .insert(aiCreditTransactions)
      .values({
        organizationId,
        type: transactionType as any,
        amount: amount, // Positive for additions
        taskType: null, // No task type for credit additions
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        balanceAfter: newBalance,
        createdAt: new Date(),
      });

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
}> {
  const db = await getDb();
  if (!db) {
    return {
      creditsRemaining: 0,
      creditsUsed: 0,
      planAllowance: 0,
      renewalDate: null,
    };
  }

  const balance = await db
    .select()
    .from(aiCreditBalance)
    .where(eq(aiCreditBalance.organizationId, organizationId))
    .limit(1);

  if (!balance || balance.length === 0) {
    return {
      creditsRemaining: 0,
      creditsUsed: 0,
      planAllowance: 0,
      renewalDate: null,
    };
  }

  return {
    creditsRemaining: balance[0].balance,
    creditsUsed: balance[0].periodUsed,
    planAllowance: balance[0].periodAllowance,
    renewalDate: balance[0].nextResetAt,
  };
}
