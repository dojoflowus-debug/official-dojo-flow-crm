/**
 * AI Credit Cost Constants
 * 
 * Credits represent AI labor performed by Kai, not user actions.
 * These costs are used to deduct credits for AI-driven tasks.
 */

export const CREDIT_COSTS = {
  // Kai AI chat response
  KAI_CHAT: 1,
  
  // AI-written SMS message
  AI_SMS: 1,
  
  // AI-written email
  AI_EMAIL: 2,
  
  // AI phone call (range based on duration)
  AI_PHONE_CALL_MIN: 8,
  AI_PHONE_CALL_MAX: 15,
  AI_PHONE_CALL_AVG: 12,
  
  // Multi-step automation sequence
  AUTOMATION_MIN: 5,
  AUTOMATION_MAX: 10,
  AUTOMATION_AVG: 7,
  
  // Data analysis and strategy reports
  DATA_ANALYSIS: 3,
} as const;

/**
 * Calculate credit cost for AI phone call based on duration
 * @param durationSeconds Call duration in seconds
 * @returns Credit cost (8-15 credits)
 */
export function calculatePhoneCallCredits(durationSeconds: number): number {
  // Base cost: 8 credits for calls up to 2 minutes
  if (durationSeconds <= 120) {
    return CREDIT_COSTS.AI_PHONE_CALL_MIN;
  }
  
  // Scale up to 15 credits for calls up to 10 minutes
  if (durationSeconds <= 600) {
    const ratio = (durationSeconds - 120) / (600 - 120);
    const cost = CREDIT_COSTS.AI_PHONE_CALL_MIN + 
                 Math.floor(ratio * (CREDIT_COSTS.AI_PHONE_CALL_MAX - CREDIT_COSTS.AI_PHONE_CALL_MIN));
    return Math.min(cost, CREDIT_COSTS.AI_PHONE_CALL_MAX);
  }
  
  // Cap at 15 credits for longer calls
  return CREDIT_COSTS.AI_PHONE_CALL_MAX;
}

/**
 * Calculate credit cost for automation based on number of steps
 * @param stepCount Number of automation steps
 * @returns Credit cost (5-10 credits)
 */
export function calculateAutomationCredits(stepCount: number): number {
  // Base cost: 5 credits for 1-3 steps
  if (stepCount <= 3) {
    return CREDIT_COSTS.AUTOMATION_MIN;
  }
  
  // Scale up to 10 credits for 10+ steps
  if (stepCount <= 10) {
    const ratio = (stepCount - 3) / (10 - 3);
    const cost = CREDIT_COSTS.AUTOMATION_MIN + 
                 Math.floor(ratio * (CREDIT_COSTS.AUTOMATION_MAX - CREDIT_COSTS.AUTOMATION_MIN));
    return Math.min(cost, CREDIT_COSTS.AUTOMATION_MAX);
  }
  
  // Cap at 10 credits for complex automations
  return CREDIT_COSTS.AUTOMATION_MAX;
}

/**
 * Get human-readable description of credit costs
 */
export function getCreditCostDescription(taskType: string): string {
  switch (taskType) {
    case 'kai_chat':
      return `${CREDIT_COSTS.KAI_CHAT} credit per response`;
    case 'ai_sms':
      return `${CREDIT_COSTS.AI_SMS} credit per message`;
    case 'ai_email':
      return `${CREDIT_COSTS.AI_EMAIL} credits per email`;
    case 'ai_phone_call':
      return `${CREDIT_COSTS.AI_PHONE_CALL_MIN}-${CREDIT_COSTS.AI_PHONE_CALL_MAX} credits per call`;
    case 'automation':
      return `${CREDIT_COSTS.AUTOMATION_MIN}-${CREDIT_COSTS.AUTOMATION_MAX} credits per sequence`;
    case 'data_analysis':
      return `${CREDIT_COSTS.DATA_ANALYSIS} credits per report`;
    default:
      return 'Variable cost';
  }
}
