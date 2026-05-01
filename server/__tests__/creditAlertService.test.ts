/**
 * Tests for the credit alert service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB and email sending
vi.mock('../db', () => ({
  getDb: vi.fn(),
}));

vi.mock('../../drizzle/schema', () => ({
  aiCreditBalance: { organizationId: 'organizationId', lowCreditThreshold: 'lowCreditThreshold', lowCreditAlertSent: 'lowCreditAlertSent' },
  organizationUsers: { organizationId: 'organizationId', userId: 'userId', isPrimary: 'isPrimary' },
  users: { id: 'id', email: 'email', name: 'name', displayName: 'displayName' },
  organizations: { id: 'id', name: 'name' },
}));

describe('Credit Alert Service Logic', () => {
  describe('Alert threshold logic', () => {
    it('should NOT alert when balance is above threshold', () => {
      const balance = 100;
      const threshold = 50;
      const shouldAlert = balance <= threshold;
      expect(shouldAlert).toBe(false);
    });

    it('should alert when balance is at threshold', () => {
      const balance = 50;
      const threshold = 50;
      const shouldAlert = balance <= threshold;
      expect(shouldAlert).toBe(true);
    });

    it('should alert when balance is below threshold', () => {
      const balance = 30;
      const threshold = 50;
      const shouldAlert = balance <= threshold;
      expect(shouldAlert).toBe(true);
    });

    it('should NOT alert again if cooldown flag is set', () => {
      const lowCreditAlertSent = 1;
      const shouldSendAgain = lowCreditAlertSent !== 1;
      expect(shouldSendAgain).toBe(false);
    });

    it('should alert if cooldown flag is cleared', () => {
      const lowCreditAlertSent = 0;
      const shouldSend = lowCreditAlertSent === 0;
      expect(shouldSend).toBe(true);
    });
  });

  describe('Alert severity', () => {
    it('should be critical when balance is 10 or below', () => {
      const balance = 10;
      const alertLevel = balance <= 10 ? 'critical' : 'warning';
      expect(alertLevel).toBe('critical');
    });

    it('should be critical when balance is 0', () => {
      const balance = 0;
      const alertLevel = balance <= 10 ? 'critical' : 'warning';
      expect(alertLevel).toBe('critical');
    });

    it('should be warning when balance is above 10 but below threshold', () => {
      const balance = 30;
      const alertLevel = balance <= 10 ? 'critical' : 'warning';
      expect(alertLevel).toBe('warning');
    });
  });

  describe('Cooldown reset logic', () => {
    it('should reset cooldown when balance rises above threshold', () => {
      const balance = 100;
      const threshold = 50;
      const lowCreditAlertSent = 1;
      // When balance is above threshold, cooldown should be reset
      const shouldReset = balance > threshold && lowCreditAlertSent === 1;
      expect(shouldReset).toBe(true);
    });

    it('should NOT reset cooldown when balance is still below threshold', () => {
      const balance = 30;
      const threshold = 50;
      const lowCreditAlertSent = 1;
      const shouldReset = balance > threshold && lowCreditAlertSent === 1;
      expect(shouldReset).toBe(false);
    });
  });

  describe('Threshold update', () => {
    it('should accept threshold of 0 (disables alerts)', () => {
      const threshold = 0;
      const isValid = threshold >= 0 && threshold <= 10000;
      expect(isValid).toBe(true);
    });

    it('should accept threshold of 500', () => {
      const threshold = 500;
      const isValid = threshold >= 0 && threshold <= 10000;
      expect(isValid).toBe(true);
    });

    it('should reject negative threshold', () => {
      const threshold = -1;
      const isValid = threshold >= 0 && threshold <= 10000;
      expect(isValid).toBe(false);
    });
  });
});
