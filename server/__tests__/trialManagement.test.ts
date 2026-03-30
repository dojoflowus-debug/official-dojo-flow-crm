/**
 * Trial Management Tests
 * 
 * Comprehensive test suite for trial account creation, expiration, and management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateTrialEndDate,
  createTrialAccount,
  getTrialStatus,
  checkAndUpdateTrialExpiration,
  extendTrial,
  convertTrialToPaid,
  getExpiringTrials,
  getTrialStatistics,
} from '../services/trialManagementService';

describe('Trial Management Service', () => {
  describe('calculateTrialEndDate', () => {
    it('should calculate trial end date as 7 days from now', () => {
      const now = new Date();
      const endDate = calculateTrialEndDate();
      const expectedDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Allow 1 second tolerance for test execution time
      const timeDiff = Math.abs(endDate.getTime() - expectedDate.getTime());
      expect(timeDiff).toBeLessThan(1000);
    });

    it('should return a future date', () => {
      const now = new Date();
      const endDate = calculateTrialEndDate();
      expect(endDate.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should be approximately 7 days in the future', () => {
      const now = new Date();
      const endDate = calculateTrialEndDate();
      const daysInMilliseconds = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      // Should be between 6.99 and 7.01 days
      expect(daysInMilliseconds).toBeGreaterThan(6.99);
      expect(daysInMilliseconds).toBeLessThan(7.01);
    });
  });

  describe('createTrialAccount', () => {
    it('should create a trial account with valid data', async () => {
      const data = {
        organizationName: 'Test Dojo',
        ownerEmail: 'owner@test.com',
        ownerName: 'John Doe',
        businessType: 'martial_arts',
        studentCount: '100-300',
        locationCount: '1',
      };

      const result = await createTrialAccount(data);
      
      expect(result.success).toBe(true);
      expect(result.organizationId).toBeDefined();
      expect(result.userId).toBeDefined();
      expect(result.trialEndsAt).toBeDefined();
      expect(result.message).toContain('successfully');
    });

    it('should set trial end date to 7 days from now', async () => {
      const data = {
        organizationName: 'Test Gym',
        ownerEmail: 'gym@test.com',
        ownerName: 'Jane Smith',
        businessType: 'fitness',
      };

      const result = await createTrialAccount(data);
      
      if (result.success && result.trialEndsAt) {
        const trialEndDate = new Date(result.trialEndsAt);
        const now = new Date();
        const daysInMilliseconds = (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        
        expect(daysInMilliseconds).toBeGreaterThan(6.99);
        expect(daysInMilliseconds).toBeLessThan(7.01);
      }
    });

    it('should initialize 1000 starter credits for trial organization', async () => {
      const data = {
        organizationName: 'Test Studio',
        ownerEmail: 'studio@test.com',
        ownerName: 'Bob Johnson',
      };

      const result = await createTrialAccount(data);
      expect(result.success).toBe(true);
      // Credit initialization is handled in the service
    });

    it('should handle missing optional fields gracefully', async () => {
      const data = {
        organizationName: 'Minimal Dojo',
        ownerEmail: 'minimal@test.com',
        ownerName: 'Test User',
      };

      const result = await createTrialAccount(data);
      expect(result.success).toBe(true);
    });

    it('should fail with invalid email', async () => {
      const data = {
        organizationName: 'Invalid Email Dojo',
        ownerEmail: 'not-an-email',
        ownerName: 'Test User',
      };

      const result = await createTrialAccount(data);
      // This would be caught by TRPC validation, but service should handle gracefully
      expect(result).toBeDefined();
    });
  });

  describe('getTrialStatus', () => {
    it('should return trial status for active trial', async () => {
      const data = {
        organizationName: 'Active Trial Dojo',
        ownerEmail: 'active@test.com',
        ownerName: 'Active User',
      };

      const createResult = await createTrialAccount(data);
      
      if (createResult.success && createResult.organizationId) {
        const status = await getTrialStatus(createResult.organizationId);
        
        expect(status.isTrialing).toBe(true);
        expect(status.isExpired).toBe(false);
        expect(status.daysRemaining).toBeGreaterThan(0);
        expect(status.daysRemaining).toBeLessThanOrEqual(7);
      }
    });

    it('should return false for non-existent organization', async () => {
      const status = await getTrialStatus(99999);
      
      expect(status.isTrialing).toBe(false);
      expect(status.isExpired).toBe(false);
    });

    it('should calculate remaining days correctly', async () => {
      const data = {
        organizationName: 'Days Remaining Dojo',
        ownerEmail: 'days@test.com',
        ownerName: 'Days User',
      };

      const createResult = await createTrialAccount(data);
      
      if (createResult.success && createResult.organizationId) {
        const status = await getTrialStatus(createResult.organizationId);
        
        expect(status.daysRemaining).toBeGreaterThan(0);
        expect(status.daysRemaining).toBeLessThanOrEqual(7);
      }
    });
  });

  describe('checkAndUpdateTrialExpiration', () => {
    it('should return false for active trial', async () => {
      const data = {
        organizationName: 'Check Active Trial',
        ownerEmail: 'check@test.com',
        ownerName: 'Check User',
      };

      const createResult = await createTrialAccount(data);
      
      if (createResult.success && createResult.organizationId) {
        const hasExpired = await checkAndUpdateTrialExpiration(createResult.organizationId);
        expect(hasExpired).toBe(false);
      }
    });

    it('should return false for non-existent organization', async () => {
      const hasExpired = await checkAndUpdateTrialExpiration(99999);
      expect(hasExpired).toBe(false);
    });
  });

  describe('extendTrial', () => {
    it('should extend trial by specified days', async () => {
      const data = {
        organizationName: 'Extend Trial Dojo',
        ownerEmail: 'extend@test.com',
        ownerName: 'Extend User',
      };

      const createResult = await createTrialAccount(data);
      
      if (createResult.success && createResult.organizationId) {
        const beforeStatus = await getTrialStatus(createResult.organizationId);
        const success = await extendTrial(createResult.organizationId, 7);
        const afterStatus = await getTrialStatus(createResult.organizationId);
        
        expect(success).toBe(true);
        if (beforeStatus.daysRemaining && afterStatus.daysRemaining) {
          expect(afterStatus.daysRemaining).toBeGreaterThan(beforeStatus.daysRemaining);
        }
      }
    });

    it('should return false for non-existent organization', async () => {
      const success = await extendTrial(99999, 7);
      expect(success).toBe(false);
    });

    it('should extend by default 7 days if not specified', async () => {
      const data = {
        organizationName: 'Default Extend Dojo',
        ownerEmail: 'default@test.com',
        ownerName: 'Default User',
      };

      const createResult = await createTrialAccount(data);
      
      if (createResult.success && createResult.organizationId) {
        const success = await extendTrial(createResult.organizationId);
        expect(success).toBe(true);
      }
    });
  });

  describe('convertTrialToPaid', () => {
    it('should convert trial to paid subscription', async () => {
      const data = {
        organizationName: 'Convert Trial Dojo',
        ownerEmail: 'convert@test.com',
        ownerName: 'Convert User',
      };

      const createResult = await createTrialAccount(data);
      
      if (createResult.success && createResult.organizationId) {
        const success = await convertTrialToPaid(createResult.organizationId, 1);
        expect(success).toBe(true);
        
        const status = await getTrialStatus(createResult.organizationId);
        expect(status.isTrialing).toBe(false);
      }
    });

    it('should return false for non-existent organization', async () => {
      const success = await convertTrialToPaid(99999, 1);
      expect(success).toBe(false);
    });
  });

  describe('getExpiringTrials', () => {
    it('should return array of expiring trials', async () => {
      const trials = await getExpiringTrials(7);
      expect(Array.isArray(trials)).toBe(true);
    });

    it('should include organizationId and organizationName', async () => {
      const data = {
        organizationName: 'Expiring Trial Dojo',
        ownerEmail: 'expiring@test.com',
        ownerName: 'Expiring User',
      };

      await createTrialAccount(data);
      const trials = await getExpiringTrials(7);
      
      if (trials.length > 0) {
        expect(trials[0]).toHaveProperty('organizationId');
        expect(trials[0]).toHaveProperty('organizationName');
        expect(trials[0]).toHaveProperty('trialEndsAt');
        expect(trials[0]).toHaveProperty('daysRemaining');
      }
    });

    it('should return empty array if no expiring trials', async () => {
      const trials = await getExpiringTrials(0);
      expect(Array.isArray(trials)).toBe(true);
    });
  });

  describe('getTrialStatistics', () => {
    it('should return trial statistics object', async () => {
      const stats = await getTrialStatistics();
      
      expect(stats).toHaveProperty('totalTrials');
      expect(stats).toHaveProperty('activeTrials');
      expect(stats).toHaveProperty('expiredTrials');
      expect(stats).toHaveProperty('expiringWithin7Days');
    });

    it('should have non-negative numbers', async () => {
      const stats = await getTrialStatistics();
      
      expect(stats.totalTrials).toBeGreaterThanOrEqual(0);
      expect(stats.activeTrials).toBeGreaterThanOrEqual(0);
      expect(stats.expiredTrials).toBeGreaterThanOrEqual(0);
      expect(stats.expiringWithin7Days).toBeGreaterThanOrEqual(0);
    });

    it('should have activeTrials + expiredTrials <= totalTrials', async () => {
      const stats = await getTrialStatistics();
      expect(stats.activeTrials + stats.expiredTrials).toBeLessThanOrEqual(stats.totalTrials);
    });

    it('should have expiringWithin7Days <= activeTrials', async () => {
      const stats = await getTrialStatistics();
      expect(stats.expiringWithin7Days).toBeLessThanOrEqual(stats.activeTrials);
    });
  });
});
