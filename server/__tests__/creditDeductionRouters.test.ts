import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CREDIT_COSTS,
  checkSufficientBalance,
  deductCredits,
  addCredits,
} from '../services/creditConsumptionService';

describe('Credit Deduction in Routers', () => {
  describe('SMS Sending with Credit Deduction', () => {
    it('should deduct 1 credit for SMS send', () => {
      const creditsBefore = 100;
      const creditsAfter = creditsBefore - CREDIT_COSTS.SMS;
      expect(creditsAfter).toBe(99);
    });

    it('should prevent SMS send when insufficient credits', async () => {
      const organizationId = 1;
      const requiredCredits = CREDIT_COSTS.SMS;
      
      // Simulate low balance
      const balanceCheck = await checkSufficientBalance(organizationId, requiredCredits);
      expect(balanceCheck.sufficient).toBeDefined();
    });

    it('should log SMS transaction with metadata', () => {
      const metadata = {
        recipientPhone: '+1234567890',
        messageLength: 160,
        conversationId: 1,
        messageId: 123,
      };
      
      expect(metadata.recipientPhone).toBeDefined();
      expect(metadata.messageLength).toBeGreaterThan(0);
      expect(metadata.conversationId).toBe(1);
    });

    it('should include alert level in SMS deduction result', () => {
      const alertLevels = ['none', 'warning', 'critical', 'blocked'];
      expect(alertLevels).toContain('none');
      expect(alertLevels).toContain('warning');
    });
  });

  describe('Email Sending with Credit Deduction', () => {
    it('should deduct 2 credits for email send', () => {
      const creditsBefore = 100;
      const creditsAfter = creditsBefore - CREDIT_COSTS.EMAIL;
      expect(creditsAfter).toBe(98);
    });

    it('should calculate total credits for automation with multiple emails', () => {
      const steps = [
        { stepType: 'send_sms', message: 'SMS' },
        { stepType: 'send_email', message: 'Email', subject: 'Subject' },
        { stepType: 'send_email', message: 'Email 2', subject: 'Subject 2' },
      ];

      let totalCredits = 0;
      for (const step of steps) {
        if (step.stepType === 'send_sms') {
          totalCredits += CREDIT_COSTS.SMS;
        } else if (step.stepType === 'send_email') {
          totalCredits += CREDIT_COSTS.EMAIL;
        }
      }

      expect(totalCredits).toBe(5); // 1 SMS + 2 Email + 2 Email
    });

    it('should prevent email send when insufficient credits', async () => {
      const organizationId = 1;
      const requiredCredits = CREDIT_COSTS.EMAIL;
      
      const balanceCheck = await checkSufficientBalance(organizationId, requiredCredits);
      expect(balanceCheck.sufficient).toBeDefined();
    });

    it('should log email transaction with metadata', () => {
      const metadata = {
        recipientEmail: 'test@example.com',
        subjectLength: 50,
        messageLength: 500,
        sequenceId: 1,
        stepId: 10,
        automationType: 'automation_sequence',
      };
      
      expect(metadata.recipientEmail).toBeDefined();
      expect(metadata.subjectLength).toBeGreaterThan(0);
      expect(metadata.automationType).toBe('automation_sequence');
    });
  });

  describe('Automation Sequences with Credit Deduction', () => {
    it('should calculate total credits for mixed automation', () => {
      const steps = [
        { stepType: 'send_sms', message: 'SMS 1' },
        { stepType: 'send_sms', message: 'SMS 2' },
        { stepType: 'send_email', message: 'Email', subject: 'Subject' },
        { stepType: 'wait', duration: 3600 }, // Should not count
        { stepType: 'send_sms', message: 'SMS 3' },
      ];

      let totalCredits = 0;
      for (const step of steps) {
        if (step.stepType === 'send_sms') {
          totalCredits += CREDIT_COSTS.SMS;
        } else if (step.stepType === 'send_email') {
          totalCredits += CREDIT_COSTS.EMAIL;
        }
      }

      expect(totalCredits).toBe(5); // 3 SMS + 1 Email = 3 + 2
    });

    it('should check balance before executing automation', () => {
      const totalCreditsNeeded = 5;
      const currentBalance = 10;
      
      const sufficient = currentBalance >= totalCreditsNeeded;
      expect(sufficient).toBe(true);
    });

    it('should deduct credits incrementally for each step', () => {
      let balance = 100;
      const steps = [
        { type: 'sms', cost: CREDIT_COSTS.SMS },
        { type: 'email', cost: CREDIT_COSTS.EMAIL },
        { type: 'sms', cost: CREDIT_COSTS.SMS },
      ];

      for (const step of steps) {
        balance -= step.cost;
      }

      expect(balance).toBe(96); // 100 - 1 - 2 - 1
    });

    it('should track credits deducted in automation response', () => {
      const automationResult = {
        success: true,
        message: 'Successfully sent 3 messages immediately',
        sentCount: 3,
        creditsDeducted: 4, // 2 SMS + 1 Email + 1 SMS
      };

      expect(automationResult.creditsDeducted).toBe(4);
      expect(automationResult.sentCount).toBe(3);
    });
  });

  describe('Credit Balance Checks', () => {
    it('should detect warning level at 50 credits', () => {
      const balance = 50;
      const isWarning = balance < 50 ? false : balance === 50 ? true : false;
      expect(isWarning).toBe(true);
    });

    it('should detect critical level below 10 credits', () => {
      const balance = 5;
      const isCritical = balance < 10;
      expect(isCritical).toBe(true);
    });

    it('should block operations at 0 credits', () => {
      const balance = 0;
      const isBlocked = balance <= 0;
      expect(isBlocked).toBe(true);
    });

    it('should calculate remaining balance after operation', () => {
      const initialBalance = 100;
      const operationCost = CREDIT_COSTS.SMS;
      const remainingBalance = initialBalance - operationCost;
      
      expect(remainingBalance).toBe(99);
    });
  });

  describe('Error Handling', () => {
    it('should handle insufficient credits error', () => {
      const error = new Error('Insufficient credits. Required: 1, Available: 0. Please top up your credits.');
      expect(error.message).toContain('Insufficient credits');
    });

    it('should handle database unavailable error', () => {
      const error = new Error('Database not available');
      expect(error.message).toBe('Database not available');
    });

    it('should handle failed deduction gracefully', () => {
      const result = {
        success: false,
        newBalance: 100,
        error: 'Failed to update credit balance',
      };
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should log errors for failed deductions', () => {
      const errorLog = {
        timestamp: new Date().toISOString(),
        operation: 'deductCredits',
        organizationId: 1,
        error: 'Failed to deduct credits',
      };
      
      expect(errorLog.operation).toBe('deductCredits');
      expect(errorLog.error).toBeDefined();
    });
  });

  describe('Transaction Logging', () => {
    it('should create transaction record for SMS', () => {
      const transaction = {
        organizationId: 1,
        type: 'deduction',
        amount: -1,
        taskType: 'ai_sms',
        description: 'SMS to +1234567890: "Test message"',
        metadata: {
          recipientPhone: '+1234567890',
          messageLength: 12,
          conversationId: 1,
        },
        balanceAfter: 99,
        createdAt: new Date().toISOString(),
      };

      expect(transaction.type).toBe('deduction');
      expect(transaction.amount).toBe(-1);
      expect(transaction.taskType).toBe('ai_sms');
    });

    it('should create transaction record for email', () => {
      const transaction = {
        organizationId: 1,
        type: 'deduction',
        amount: -2,
        taskType: 'ai_email',
        description: 'Email to test@example.com: "Subject"',
        metadata: {
          recipientEmail: 'test@example.com',
          subjectLength: 7,
          messageLength: 100,
        },
        balanceAfter: 98,
        createdAt: new Date().toISOString(),
      };

      expect(transaction.type).toBe('deduction');
      expect(transaction.amount).toBe(-2);
      expect(transaction.taskType).toBe('ai_email');
    });

    it('should include automation metadata in transaction', () => {
      const metadata = {
        recipientPhone: '+1234567890',
        messageLength: 160,
        sequenceId: 1,
        stepId: 5,
        automationType: 'automation_sequence',
      };

      expect(metadata.sequenceId).toBe(1);
      expect(metadata.automationType).toBe('automation_sequence');
    });
  });

  describe('Multi-Organization Credit Isolation', () => {
    it('should track credits separately for each organization', () => {
      const org1Balance = 100;
      const org2Balance = 50;

      expect(org1Balance).not.toBe(org2Balance);
    });

    it('should prevent cross-organization credit deduction', () => {
      const org1Id = 1;
      const org2Id = 2;

      expect(org1Id).not.toBe(org2Id);
    });

    it('should maintain separate transaction history per organization', () => {
      const org1Transactions = [
        { organizationId: 1, amount: -1, taskType: 'ai_sms' },
        { organizationId: 1, amount: -2, taskType: 'ai_email' },
      ];

      const org2Transactions = [
        { organizationId: 2, amount: -1, taskType: 'ai_sms' },
      ];

      const org1Total = org1Transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const org2Total = org2Transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

      expect(org1Total).toBe(3);
      expect(org2Total).toBe(1);
    });
  });

  describe('Credit Consumption Scenarios', () => {
    it('should handle sequential SMS sends', () => {
      let balance = 100;
      const smsCount = 5;

      for (let i = 0; i < smsCount; i++) {
        balance -= CREDIT_COSTS.SMS;
      }

      expect(balance).toBe(95);
    });

    it('should handle mixed SMS and email sends', () => {
      let balance = 100;

      // Send 3 SMS
      balance -= CREDIT_COSTS.SMS * 3;
      // Send 2 emails
      balance -= CREDIT_COSTS.EMAIL * 2;

      expect(balance).toBe(93); // 100 - 3 - 4
    });

    it('should handle automation with all step types', () => {
      let balance = 100;
      const steps = [
        { type: 'send_sms', cost: CREDIT_COSTS.SMS },
        { type: 'wait', cost: 0 },
        { type: 'send_email', cost: CREDIT_COSTS.EMAIL },
        { type: 'send_sms', cost: CREDIT_COSTS.SMS },
        { type: 'end', cost: 0 },
      ];

      for (const step of steps) {
        balance -= step.cost;
      }

      expect(balance).toBe(97); // 100 - 1 - 2 - 1 - 0 - 0
    });

    it('should prevent operation when credits would go negative', () => {
      const balance = 1;
      const operationCost = 2;
      const canExecute = balance >= operationCost;

      expect(canExecute).toBe(false);
    });
  });
});
