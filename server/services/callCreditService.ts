/**
 * Call Credit Tracking Service
 * 
 * Manages credit deduction for phone calls with duration-based billing.
 * Tracks call start/end times, calculates duration, and deducts appropriate credits.
 */

import { getDb } from '../db';
import { eq } from 'drizzle-orm';

const CREDIT_COSTS = {
  CALL_PER_MINUTE: 10, // 10 credits per minute of call time
  CALL_MINIMUM: 1, // Minimum 1 minute (10 credits)
  CALL_SETUP: 5, // 5 credits for call setup/initiation
};

interface CallSession {
  callId: string;
  organizationId: number;
  recipientPhone: string;
  startTime: Date;
  endTime?: Date;
  durationSeconds?: number;
  durationMinutes?: number;
  creditsDeducted?: number;
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

interface CallStartResult {
  success: boolean;
  callId: string;
  setupCreditsDeducted: number;
  message?: string;
  error?: string;
}

interface CallEndResult {
  success: boolean;
  callId: string;
  durationMinutes: number;
  durationSeconds: number;
  creditsDeducted: number;
  totalCreditsDeducted: number;
  newBalance: number;
  alertLevel: 'none' | 'warning' | 'critical' | 'blocked';
  message?: string;
  error?: string;
}

interface CallDurationResult {
  durationSeconds: number;
  durationMinutes: number;
  roundedMinutes: number;
  creditsToDeduct: number;
}

/**
 * Calculate call duration and credits to deduct
 */
export function calculateCallDuration(startTime: Date, endTime: Date): CallDurationResult {
  const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  const durationMinutes = durationSeconds / 60;
  
  // Round up to nearest minute for billing
  const roundedMinutes = Math.ceil(durationMinutes);
  const minimumMinutes = Math.max(roundedMinutes, CREDIT_COSTS.CALL_MINIMUM);
  
  // Calculate credits (10 per minute)
  const creditsToDeduct = minimumMinutes * CREDIT_COSTS.CALL_PER_MINUTE;
  
  return {
    durationSeconds,
    durationMinutes,
    roundedMinutes: minimumMinutes,
    creditsToDeduct,
  };
}

/**
 * Start a call session and deduct setup credits
 */
export async function startCallSession(
  callId: string,
  organizationId: number,
  recipientPhone: string,
  metadata?: Record<string, any>
): Promise<CallStartResult> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        callId,
        setupCreditsDeducted: 0,
        error: 'Database not available',
      };
    }

    // Check if organization exists and has sufficient credits for setup
    const { checkSufficientBalance, deductCredits } = await import('./creditConsumptionService');
    const balanceCheck = await checkSufficientBalance(organizationId, CREDIT_COSTS.CALL_SETUP);

    if (!balanceCheck.sufficient) {
      return {
        success: false,
        callId,
        setupCreditsDeducted: 0,
        error: balanceCheck.message || 'Insufficient credits for call setup',
      };
    }

    // Deduct setup credits
    const deductResult = await deductCredits({
      organizationId,
      amount: CREDIT_COSTS.CALL_SETUP,
      taskType: 'ai_phone_call',
      description: `Call setup to ${recipientPhone}`,
      metadata: {
        callId,
        recipientPhone,
        callPhase: 'setup',
        ...metadata,
      },
    });

    if (!deductResult.success) {
      console.error('[CallCredit] Failed to deduct setup credits:', deductResult.error);
      return {
        success: false,
        callId,
        setupCreditsDeducted: 0,
        error: 'Failed to deduct setup credits',
      };
    }

    console.log('[CallCredit] Call session started. Setup credits deducted:', CREDIT_COSTS.CALL_SETUP);

    return {
      success: true,
      callId,
      setupCreditsDeducted: CREDIT_COSTS.CALL_SETUP,
      message: `Call setup initiated. ${CREDIT_COSTS.CALL_SETUP} credits deducted.`,
    };
  } catch (error) {
    console.error('[CallCredit] Error starting call session:', error);
    return {
      success: false,
      callId,
      setupCreditsDeducted: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * End a call session and deduct duration-based credits
 */
export async function endCallSession(
  callId: string,
  organizationId: number,
  startTime: Date,
  endTime: Date,
  recipientPhone: string,
  metadata?: Record<string, any>
): Promise<CallEndResult> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        callId,
        durationMinutes: 0,
        durationSeconds: 0,
        creditsDeducted: 0,
        totalCreditsDeducted: 0,
        newBalance: 0,
        alertLevel: 'none',
        error: 'Database not available',
      };
    }

    // Calculate call duration and credits
    const durationCalc = calculateCallDuration(startTime, endTime);

    // Deduct duration-based credits
    const { deductCredits } = await import('./creditConsumptionService');
    const deductResult = await deductCredits({
      organizationId,
      amount: durationCalc.creditsToDeduct,
      taskType: 'ai_phone_call',
      description: `Phone call to ${recipientPhone} (${durationCalc.roundedMinutes} min)`,
      metadata: {
        callId,
        recipientPhone,
        durationSeconds: durationCalc.durationSeconds,
        durationMinutes: durationCalc.durationMinutes,
        roundedMinutes: durationCalc.roundedMinutes,
        callPhase: 'duration',
        ...metadata,
      },
    });

    if (!deductResult.success) {
      console.error('[CallCredit] Failed to deduct duration credits:', deductResult.error);
      return {
        success: false,
        callId,
        durationMinutes: durationCalc.durationMinutes,
        durationSeconds: durationCalc.durationSeconds,
        creditsDeducted: 0,
        totalCreditsDeducted: CREDIT_COSTS.CALL_SETUP, // Only setup was deducted
        newBalance: 0,
        alertLevel: 'none',
        error: 'Failed to deduct duration credits',
      };
    }

    console.log('[CallCredit] Call session ended. Duration credits deducted:', durationCalc.creditsToDeduct);

    // Total credits deducted (setup + duration)
    const totalCreditsDeducted = CREDIT_COSTS.CALL_SETUP + durationCalc.creditsToDeduct;

    return {
      success: true,
      callId,
      durationMinutes: durationCalc.durationMinutes,
      durationSeconds: durationCalc.durationSeconds,
      creditsDeducted: durationCalc.creditsToDeduct,
      totalCreditsDeducted,
      newBalance: deductResult.newBalance || 0,
      alertLevel: deductResult.alertLevel || 'none',
      message: `Call ended. ${durationCalc.roundedMinutes} min, ${durationCalc.creditsToDeduct} credits deducted.`,
    };
  } catch (error) {
    console.error('[CallCredit] Error ending call session:', error);
    return {
      success: false,
      callId,
      durationMinutes: 0,
      durationSeconds: 0,
      creditsDeducted: 0,
      totalCreditsDeducted: 0,
      newBalance: 0,
      alertLevel: 'none',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Estimate credits needed for a call of specified duration
 */
export function estimateCallCredits(durationMinutes: number): number {
  const minimumMinutes = Math.max(durationMinutes, CREDIT_COSTS.CALL_MINIMUM);
  const durationCredits = minimumMinutes * CREDIT_COSTS.CALL_PER_MINUTE;
  const totalCredits = CREDIT_COSTS.CALL_SETUP + durationCredits;
  return totalCredits;
}

/**
 * Get call credit costs
 */
export function getCallCreditCosts() {
  return {
    perMinute: CREDIT_COSTS.CALL_PER_MINUTE,
    setupCost: CREDIT_COSTS.CALL_SETUP,
    minimumDuration: CREDIT_COSTS.CALL_MINIMUM,
  };
}

/**
 * Format call duration for display
 */
export function formatCallDuration(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  
  if (minutes === 0) {
    return `${seconds}s`;
  } else if (seconds === 0) {
    return `${minutes}m`;
  } else {
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Calculate cost breakdown for a call
 */
export function getCallCostBreakdown(durationSeconds: number) {
  const durationCalc = calculateCallDuration(new Date(0), new Date(durationSeconds * 1000));
  
  return {
    setupCost: CREDIT_COSTS.CALL_SETUP,
    durationCost: durationCalc.creditsToDeduct,
    totalCost: CREDIT_COSTS.CALL_SETUP + durationCalc.creditsToDeduct,
    durationMinutes: durationCalc.roundedMinutes,
    durationFormatted: formatCallDuration(durationSeconds),
  };
}

export { CREDIT_COSTS };
