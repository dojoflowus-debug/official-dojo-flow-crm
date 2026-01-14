/**
 * Credit Consumption Tests
 * 
 * Tests for credit deduction, balance checks, and transaction logging
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb } from './db';
import {
  checkSufficientBalance,
  deductCredits,
  addCredits,
  getCreditBalance,
  CREDIT_COSTS,
  CREDIT_THRESHOLDS,
} from './creditConsumption';
import { aiCreditBalance, aiCreditTransactions, organizations } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Credit Consumption System', () => {
  const testOrgId = 99998; // Use a fixed test organization ID

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Clean up any existing test data
    await db.delete(aiCreditTransactions).where(eq(aiCreditTransactions.organizationId, testOrgId));
    await db.delete(aiCreditBalance).where(eq(aiCreditBalance.organizationId, testOrgId));

    // Initialize credit balance for test
    await db.insert(aiCreditBalance).values({
      organizationId: testOrgId,
      balance: 100,
      periodAllowance: 100,
      periodUsed: 0,
      totalPurchased: 0,
      totalUsed: 0,
      nextResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up after each test
    await db.delete(aiCreditTransactions).where(eq(aiCreditTransactions.organizationId, testOrgId));
    await db.delete(aiCreditBalance).where(eq(aiCreditBalance.organizationId, testOrgId));
  });

  describe('checkSufficientBalance', () => {
    it('should return sufficient=true when balance is adequate', async () => {
      const result = await checkSufficientBalance(testOrgId, 10);
      
      expect(result.sufficient).toBe(true);
      expect(result.currentBalance).toBe(100);
      expect(result.message).toBeUndefined();
    });

    it('should return sufficient=false when balance is insufficient', async () => {
      const result = await checkSufficientBalance(testOrgId, 150);
      
      expect(result.sufficient).toBe(false);
      expect(result.currentBalance).toBe(100);
      expect(result.message).toContain('Insufficient credits');
      expect(result.message).toContain('Required: 150');
      expect(result.message).toContain('Available: 100');
    });

    it('should warn when balance will be low after operation', async () => {
      const result = await checkSufficientBalance(testOrgId, 60);
      
      expect(result.sufficient).toBe(true);
      expect(result.currentBalance).toBe(100);
      expect(result.message).toContain('Warning: Low credit balance');
      expect(result.message).toContain('40 credits remaining');
    });

    it('should return error when organization has no credit balance', async () => {
      const result = await checkSufficientBalance(99999, 10);
      
      expect(result.sufficient).toBe(false);
      expect(result.currentBalance).toBe(0);
      expect(result.message).toContain('No credit balance found');
    });
  });

  describe('deductCredits', () => {
    it('should successfully deduct credits and log transaction', async () => {
      const result = await deductCredits({
        organizationId: testOrgId,
        amount: 10,
        taskType: 'kai_chat',
        description: 'Test Kai chat message',
        metadata: { test: true },
      });

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(90);
      expect(result.transactionId).toBeDefined();

      // Verify balance was updated
      const balance = await getCreditBalance(testOrgId);
      expect(balance.creditsRemaining).toBe(90);
      expect(balance.creditsUsed).toBe(10);

      // Verify transaction was logged
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const transactions = await db
        .select()
        .from(aiCreditTransactions)
        .where(eq(aiCreditTransactions.organizationId, testOrgId));
      
      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount).toBe(-10);
      expect(transactions[0].taskType).toBe('kai_chat');
      expect(transactions[0].description).toBe('Test Kai chat message');
      expect(transactions[0].balanceAfter).toBe(90);
    });

    it('should fail when insufficient balance', async () => {
      const result = await deductCredits({
        organizationId: testOrgId,
        amount: 150,
        taskType: 'ai_sms',
        description: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.newBalance).toBe(100);
      expect(result.error).toContain('Insufficient credits');

      // Verify balance was NOT updated
      const balance = await getCreditBalance(testOrgId);
      expect(balance.creditsRemaining).toBe(100);
      expect(balance.creditsUsed).toBe(0);
    });

    it('should handle multiple deductions correctly', async () => {
      // First deduction
      const result1 = await deductCredits({
        organizationId: testOrgId,
        amount: 30,
        taskType: 'ai_sms',
        description: 'SMS 1',
      });
      expect(result1.success).toBe(true);
      expect(result1.newBalance).toBe(70);

      // Second deduction
      const result2 = await deductCredits({
        organizationId: testOrgId,
        amount: 20,
        taskType: 'ai_email',
        description: 'Email 1',
      });
      expect(result2.success).toBe(true);
      expect(result2.newBalance).toBe(50);

      // Verify final balance
      const balance = await getCreditBalance(testOrgId);
      expect(balance.creditsRemaining).toBe(50);
      expect(balance.creditsUsed).toBe(50);
    });
  });

  describe('addCredits', () => {
    it('should successfully add credits and log transaction', async () => {
      const result = await addCredits({
        organizationId: testOrgId,
        amount: 50,
        source: 'top_up',
        description: 'Test credit top-up',
        metadata: { paymentId: 'test123' },
      });

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(150);
      expect(result.transactionId).toBeDefined();

      // Verify balance was updated
      const balance = await getCreditBalance(testOrgId);
      expect(balance.creditsRemaining).toBe(150);

      // Verify transaction was logged
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const transactions = await db
        .select()
        .from(aiCreditTransactions)
        .where(eq(aiCreditTransactions.organizationId, testOrgId));
      
      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount).toBe(50);
      expect(transactions[0].type).toBe('purchase'); // top_up maps to 'purchase' type
      expect(transactions[0].taskType).toBeNull(); // No taskType for credit additions
      expect(transactions[0].description).toBe('Test credit top-up');
      expect(transactions[0].balanceAfter).toBe(150);
    });

    it('should handle subscription credit allocation', async () => {
      const result = await addCredits({
        organizationId: testOrgId,
        amount: 1000,
        source: 'subscription',
        description: 'Monthly subscription credits',
      });

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(1100);
    });
  });

  describe('getCreditBalance', () => {
    it('should return current credit balance', async () => {
      const balance = await getCreditBalance(testOrgId);

      expect(balance.creditsRemaining).toBe(100);
      expect(balance.creditsUsed).toBe(0);
      expect(balance.planAllowance).toBe(100);
      expect(balance.renewalDate).toBeInstanceOf(Date);
    });

    it('should return zero balance for non-existent organization', async () => {
      const balance = await getCreditBalance(99999);

      expect(balance.creditsRemaining).toBe(0);
      expect(balance.creditsUsed).toBe(0);
      expect(balance.planAllowance).toBe(0);
      expect(balance.renewalDate).toBeNull();
    });
  });

  describe('Credit Costs and Thresholds', () => {
    it('should have correct credit costs defined', () => {
      expect(CREDIT_COSTS.KAI_CHAT).toBe(1);
      expect(CREDIT_COSTS.SMS).toBe(1);
      expect(CREDIT_COSTS.EMAIL).toBe(2);
      expect(CREDIT_COSTS.CALL_PER_MINUTE).toBe(10);
    });

    it('should have correct thresholds defined', () => {
      expect(CREDIT_THRESHOLDS.WARNING).toBe(50);
      expect(CREDIT_THRESHOLDS.CRITICAL).toBe(10);
      expect(CREDIT_THRESHOLDS.BLOCKING).toBe(0);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical daily usage pattern', async () => {
      // Morning: 5 Kai chats
      for (let i = 0; i < 5; i++) {
        const result = await deductCredits({
          organizationId: testOrgId,
          amount: CREDIT_COSTS.KAI_CHAT,
          taskType: 'kai_chat',
          description: `Morning chat ${i + 1}`,
        });
        expect(result.success).toBe(true);
      }

      // Afternoon: 3 SMS, 2 emails
      for (let i = 0; i < 3; i++) {
        const result = await deductCredits({
          organizationId: testOrgId,
          amount: CREDIT_COSTS.SMS,
          taskType: 'ai_sms',
          description: `SMS ${i + 1}`,
        });
        expect(result.success).toBe(true);
      }

      for (let i = 0; i < 2; i++) {
        const result = await deductCredits({
          organizationId: testOrgId,
          amount: CREDIT_COSTS.EMAIL,
          taskType: 'ai_email',
          description: `Email ${i + 1}`,
        });
        expect(result.success).toBe(true);
      }

      // Total used: 5 (chat) + 3 (sms) + 4 (email) = 12 credits
      const balance = await getCreditBalance(testOrgId);
      expect(balance.creditsRemaining).toBe(88);
      expect(balance.creditsUsed).toBe(12);
    });

    it('should block operations when credits run out', async () => {
      // Deduct most credits
      await deductCredits({
        organizationId: testOrgId,
        amount: 99,
        taskType: 'kai_chat',
        description: 'Large deduction',
      });

      // Try to make a phone call (10 credits)
      const result = await deductCredits({
        organizationId: testOrgId,
        amount: CREDIT_COSTS.CALL_PER_MINUTE,
        taskType: 'ai_phone_call',
        description: 'Phone call',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient credits');
      
      const balance = await getCreditBalance(testOrgId);
      expect(balance.creditsRemaining).toBe(1);
    });

    it('should allow top-up and resume operations', async () => {
      // Drain credits
      await deductCredits({
        organizationId: testOrgId,
        amount: 100,
        taskType: 'kai_chat',
        description: 'Drain all credits',
      });

      // Verify blocked
      const blockedResult = await deductCredits({
        organizationId: testOrgId,
        amount: 1,
        taskType: 'kai_chat',
        description: 'Should fail',
      });
      expect(blockedResult.success).toBe(false);

      // Top up
      await addCredits({
        organizationId: testOrgId,
        amount: 50,
        source: 'top_up',
        description: 'Emergency top-up',
      });

      // Verify operations resume
      const resumedResult = await deductCredits({
        organizationId: testOrgId,
        amount: 1,
        taskType: 'kai_chat',
        description: 'Should succeed',
      });
      expect(resumedResult.success).toBe(true);
      expect(resumedResult.newBalance).toBe(49);
    });
  });
});
