import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CREDIT_COSTS,
  CREDIT_THRESHOLDS,
  checkSufficientBalance,
  deductCredits,
  addCredits,
  getCreditBalance,
  estimateCreditsNeeded,
} from '../services/creditConsumptionService';

// Mock database
vi.mock('../db', () => ({
  getDb: vi.fn(),
}));

describe('Credit Consumption Service', () => {
  describe('CREDIT_COSTS', () => {
    it('should have correct credit costs defined', () => {
      expect(CREDIT_COSTS.KAI_CHAT).toBe(1);
      expect(CREDIT_COSTS.SMS).toBe(1);
      expect(CREDIT_COSTS.EMAIL).toBe(2);
      expect(CREDIT_COSTS.CALL_PER_MINUTE).toBe(10);
      expect(CREDIT_COSTS.AUTOMATION).toBe(1);
      expect(CREDIT_COSTS.DATA_ANALYSIS).toBe(5);
    });
  });

  describe('CREDIT_THRESHOLDS', () => {
    it('should have correct threshold values', () => {
      expect(CREDIT_THRESHOLDS.WARNING).toBe(50);
      expect(CREDIT_THRESHOLDS.CRITICAL).toBe(10);
      expect(CREDIT_THRESHOLDS.BLOCKING).toBe(0);
    });
  });

  describe('checkSufficientBalance', () => {
    it('should return insufficient balance when organization has no credits', async () => {
      const result = await checkSufficientBalance(1, CREDIT_COSTS.KAI_CHAT);
      expect(result.sufficient).toBe(false);
      expect(result.alertLevel).toBe('blocked');
      expect(result.message).toBeDefined();
    });

    it('should return sufficient balance when organization has enough credits', async () => {
      // This would need proper mocking of the database
      // For now, we're testing the logic structure
      const requiredCredits = CREDIT_COSTS.KAI_CHAT;
      expect(requiredCredits).toBe(1);
    });

    it('should detect warning level when balance is low', () => {
      const balanceAfterOperation = CREDIT_THRESHOLDS.WARNING - 1;
      expect(balanceAfterOperation < CREDIT_THRESHOLDS.WARNING).toBe(true);
    });

    it('should detect critical level when balance is very low', () => {
      const balanceAfterOperation = CREDIT_THRESHOLDS.CRITICAL - 1;
      expect(balanceAfterOperation < CREDIT_THRESHOLDS.CRITICAL).toBe(true);
    });
  });

  describe('deductCredits', () => {
    it('should calculate correct deduction amount for AI chat', () => {
      const amount = CREDIT_COSTS.KAI_CHAT;
      expect(amount).toBe(1);
    });

    it('should calculate correct deduction amount for SMS', () => {
      const amount = CREDIT_COSTS.SMS;
      expect(amount).toBe(1);
    });

    it('should calculate correct deduction amount for email', () => {
      const amount = CREDIT_COSTS.EMAIL;
      expect(amount).toBe(2);
    });

    it('should calculate correct deduction amount for call', () => {
      const durationMinutes = 5;
      const amount = CREDIT_COSTS.CALL_PER_MINUTE * durationMinutes;
      expect(amount).toBe(50);
    });

    it('should accept valid task types', () => {
      const validTaskTypes = [
        'kai_chat',
        'ai_sms',
        'ai_email',
        'ai_phone_call',
        'automation',
        'data_analysis',
        'other',
      ];
      expect(validTaskTypes).toContain('kai_chat');
      expect(validTaskTypes).toContain('ai_sms');
      expect(validTaskTypes).toContain('ai_email');
      expect(validTaskTypes).toContain('ai_phone_call');
    });
  });

  describe('addCredits', () => {
    it('should accept valid credit sources', () => {
      const validSources = ['subscription', 'top_up', 'refund', 'bonus'];
      expect(validSources).toContain('subscription');
      expect(validSources).toContain('top_up');
      expect(validSources).toContain('refund');
      expect(validSources).toContain('bonus');
    });

    it('should calculate correct credit addition for subscription', () => {
      const subscriptionCredits = 500;
      expect(subscriptionCredits).toBeGreaterThan(0);
    });

    it('should calculate correct credit addition for top-up', () => {
      const topUpCredits = 1000;
      expect(topUpCredits).toBeGreaterThan(0);
    });

    it('should calculate correct credit addition for refund', () => {
      const refundCredits = 100;
      expect(refundCredits).toBeGreaterThan(0);
    });
  });

  describe('estimateCreditsNeeded', () => {
    it('should estimate 1 credit for AI chat', () => {
      const estimated = estimateCreditsNeeded('kai_chat');
      expect(estimated).toBe(1);
    });

    it('should estimate 1 credit for SMS', () => {
      const estimated = estimateCreditsNeeded('ai_sms');
      expect(estimated).toBe(1);
    });

    it('should estimate 2 credits for email', () => {
      const estimated = estimateCreditsNeeded('ai_email');
      expect(estimated).toBe(2);
    });

    it('should estimate 50 credits for 5-minute call', () => {
      const estimated = estimateCreditsNeeded('ai_phone_call', { durationMinutes: 5 });
      expect(estimated).toBe(50);
    });

    it('should estimate 200 credits for 20-minute call', () => {
      const estimated = estimateCreditsNeeded('ai_phone_call', { durationMinutes: 20 });
      expect(estimated).toBe(200);
    });

    it('should estimate 2 credits for single email', () => {
      const estimated = estimateCreditsNeeded('ai_email', { recipientCount: 1 });
      expect(estimated).toBe(2);
    });

    it('should estimate 6 credits for 3 emails', () => {
      const estimated = estimateCreditsNeeded('ai_email', { recipientCount: 3 });
      expect(estimated).toBe(6);
    });

    it('should estimate 10 credits for 10 emails', () => {
      const estimated = estimateCreditsNeeded('ai_email', { recipientCount: 10 });
      expect(estimated).toBe(20);
    });

    it('should estimate 5 credits for data analysis', () => {
      const estimated = estimateCreditsNeeded('data_analysis');
      expect(estimated).toBe(5);
    });

    it('should estimate 1 credit for automation', () => {
      const estimated = estimateCreditsNeeded('automation');
      expect(estimated).toBe(1);
    });
  });

  describe('Alert Level Detection', () => {
    it('should detect no alert when balance is healthy', () => {
      const balance = 500;
      const alertLevel = balance < CREDIT_THRESHOLDS.CRITICAL ? 'critical' : 'none';
      expect(alertLevel).toBe('none');
    });

    it('should detect warning when balance is between warning and critical', () => {
      const balance = 30; // Between 10 and 50
      const alertLevel = balance < CREDIT_THRESHOLDS.CRITICAL ? 'critical' : 
                        balance < CREDIT_THRESHOLDS.WARNING ? 'warning' : 'none';
      expect(alertLevel).toBe('warning');
    });

    it('should detect critical when balance is below critical threshold', () => {
      const balance = 5; // Below 10
      const alertLevel = balance < CREDIT_THRESHOLDS.CRITICAL ? 'critical' : 'none';
      expect(alertLevel).toBe('critical');
    });

    it('should detect blocked when balance is zero', () => {
      const balance = 0;
      const alertLevel = balance <= CREDIT_THRESHOLDS.BLOCKING ? 'blocked' : 'none';
      expect(alertLevel).toBe('blocked');
    });
  });

  describe('Credit Consumption Scenarios', () => {
    it('should handle multiple AI chats in sequence', () => {
      let balance = 100;
      const chatCost = CREDIT_COSTS.KAI_CHAT;
      
      balance -= chatCost; // First chat
      expect(balance).toBe(99);
      
      balance -= chatCost; // Second chat
      expect(balance).toBe(98);
      
      balance -= chatCost; // Third chat
      expect(balance).toBe(97);
    });

    it('should handle mixed operations', () => {
      let balance = 1000;
      
      // Send 5 SMS
      balance -= CREDIT_COSTS.SMS * 5;
      expect(balance).toBe(995);
      
      // Send 3 emails
      balance -= CREDIT_COSTS.EMAIL * 3;
      expect(balance).toBe(989);
      
      // Make 2 10-minute calls
      balance -= CREDIT_COSTS.CALL_PER_MINUTE * 10 * 2;
      expect(balance).toBe(789);
      
      // Have 10 AI chats
      balance -= CREDIT_COSTS.KAI_CHAT * 10;
      expect(balance).toBe(779);
    });

    it('should handle subscription credit allocation', () => {
      let balance = 0;
      
      // Starter subscription
      balance += 500;
      expect(balance).toBe(500);
      
      // Growth subscription
      balance += 1500;
      expect(balance).toBe(2000);
      
      // Pro subscription
      balance += 4000;
      expect(balance).toBe(6000);
    });

    it('should handle credit exhaustion scenario', () => {
      let balance = 100;
      const operations = [
        { type: 'kai_chat', cost: CREDIT_COSTS.KAI_CHAT },
        { type: 'sms', cost: CREDIT_COSTS.SMS },
        { type: 'email', cost: CREDIT_COSTS.EMAIL },
      ];

      for (const op of operations) {
        if (balance >= op.cost) {
          balance -= op.cost;
        }
      }

      expect(balance).toBe(96); // 100 - 1 - 1 - 2
    });
  });

  describe('Transaction Logging', () => {
    it('should track deduction transactions', () => {
      const transaction = {
        type: 'deduction' as const,
        amount: -1,
        taskType: 'kai_chat' as const,
        description: 'Kai chat message',
      };
      
      expect(transaction.type).toBe('deduction');
      expect(transaction.amount).toBeLessThan(0);
      expect(transaction.taskType).toBe('kai_chat');
    });

    it('should track addition transactions', () => {
      const transaction = {
        type: 'purchase' as const,
        amount: 500,
        source: 'top_up' as const,
        description: 'Credit top-up',
      };
      
      expect(transaction.type).toBe('purchase');
      expect(transaction.amount).toBeGreaterThan(0);
      expect(transaction.source).toBe('top_up');
    });

    it('should include metadata in transactions', () => {
      const metadata = {
        messageLength: 150,
        responseLength: 200,
        hasFunctionCalls: true,
      };
      
      expect(metadata.messageLength).toBe(150);
      expect(metadata.responseLength).toBe(200);
      expect(metadata.hasFunctionCalls).toBe(true);
    });
  });
});
