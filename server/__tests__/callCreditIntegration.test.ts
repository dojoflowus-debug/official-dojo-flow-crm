import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateCallDuration,
  estimateCallCredits,
  getCallCreditCosts,
  formatCallDuration,
  getCallCostBreakdown,
} from '../services/callCreditService';

describe('Call Credit Integration', () => {
  describe('Call Duration Calculation', () => {
    it('should calculate duration for calls under 1 minute', () => {
      const startTime = new Date('2026-03-28T10:00:00Z');
      const endTime = new Date('2026-03-28T10:00:30Z');

      const result = calculateCallDuration(startTime, endTime);

      expect(result.durationSeconds).toBe(30);
      expect(result.durationMinutes).toBe(0.5);
      expect(result.roundedMinutes).toBe(1); // Rounds up to 1 minute minimum
      expect(result.creditsToDeduct).toBe(10); // 1 minute * 10 credits/min
    });

    it('should calculate duration for calls exactly 1 minute', () => {
      const startTime = new Date('2026-03-28T10:00:00Z');
      const endTime = new Date('2026-03-28T10:01:00Z');

      const result = calculateCallDuration(startTime, endTime);

      expect(result.durationSeconds).toBe(60);
      expect(result.durationMinutes).toBe(1);
      expect(result.roundedMinutes).toBe(1);
      expect(result.creditsToDeduct).toBe(10);
    });

    it('should calculate duration for calls over 1 minute', () => {
      const startTime = new Date('2026-03-28T10:00:00Z');
      const endTime = new Date('2026-03-28T10:05:30Z');

      const result = calculateCallDuration(startTime, endTime);

      expect(result.durationSeconds).toBe(330);
      expect(result.durationMinutes).toBe(5.5);
      expect(result.roundedMinutes).toBe(6); // Rounds up to 6 minutes
      expect(result.creditsToDeduct).toBe(60); // 6 minutes * 10 credits/min
    });

    it('should calculate duration for long calls', () => {
      const startTime = new Date('2026-03-28T10:00:00Z');
      const endTime = new Date('2026-03-28T10:30:15Z');

      const result = calculateCallDuration(startTime, endTime);

      expect(result.durationSeconds).toBe(1815);
      expect(result.durationMinutes).toBe(30.25);
      expect(result.roundedMinutes).toBe(31); // Rounds up
      expect(result.creditsToDeduct).toBe(310); // 31 minutes * 10 credits/min
    });

    it('should handle hour-long calls', () => {
      const startTime = new Date('2026-03-28T10:00:00Z');
      const endTime = new Date('2026-03-28T11:00:00Z');

      const result = calculateCallDuration(startTime, endTime);

      expect(result.durationSeconds).toBe(3600);
      expect(result.durationMinutes).toBe(60);
      expect(result.roundedMinutes).toBe(60);
      expect(result.creditsToDeduct).toBe(600); // 60 minutes * 10 credits/min
    });
  });

  describe('Call Credit Estimation', () => {
    it('should estimate credits for 1 minute call', () => {
      const credits = estimateCallCredits(1);
      expect(credits).toBe(15); // 5 setup + 10 duration
    });

    it('should estimate credits for 5 minute call', () => {
      const credits = estimateCallCredits(5);
      expect(credits).toBe(55); // 5 setup + 50 duration
    });

    it('should estimate credits for 30 minute call', () => {
      const credits = estimateCallCredits(30);
      expect(credits).toBe(305); // 5 setup + 300 duration
    });

    it('should estimate credits for 60 minute call', () => {
      const credits = estimateCallCredits(60);
      expect(credits).toBe(605); // 5 setup + 600 duration
    });

    it('should estimate credits for fractional minutes', () => {
      const credits = estimateCallCredits(2.5);
      expect(credits).toBe(35); // 5 setup + 30 duration (rounds up to 3 min)
    });
  });

  describe('Call Credit Costs', () => {
    it('should return correct credit cost structure', () => {
      const costs = getCallCreditCosts();

      expect(costs.perMinute).toBe(10);
      expect(costs.setupCost).toBe(5);
      expect(costs.minimumDuration).toBe(1);
    });

    it('should have consistent costs across calls', () => {
      const costs1 = getCallCreditCosts();
      const costs2 = getCallCreditCosts();

      expect(costs1).toEqual(costs2);
    });
  });

  describe('Call Duration Formatting', () => {
    it('should format seconds only', () => {
      expect(formatCallDuration(30)).toBe('30s');
      expect(formatCallDuration(45)).toBe('45s');
    });

    it('should format minutes only', () => {
      expect(formatCallDuration(60)).toBe('1m');
      expect(formatCallDuration(300)).toBe('5m');
    });

    it('should format minutes and seconds', () => {
      expect(formatCallDuration(65)).toBe('1m 5s');
      expect(formatCallDuration(125)).toBe('2m 5s');
    });

    it('should format hours, minutes, and seconds', () => {
      expect(formatCallDuration(3661)).toBe('1h 1m 1s');
      expect(formatCallDuration(7325)).toBe('2h 2m 5s');
    });
  });

  describe('Call Cost Breakdown', () => {
    it('should provide breakdown for short call', () => {
      const breakdown = getCallCostBreakdown(30);

      expect(breakdown.setupCost).toBe(5);
      expect(breakdown.durationCost).toBe(10); // 1 minute minimum
      expect(breakdown.totalCost).toBe(15);
      expect(breakdown.durationMinutes).toBe(1);
      expect(breakdown.durationFormatted).toBe('30s');
    });

    it('should provide breakdown for medium call', () => {
      const breakdown = getCallCostBreakdown(300);

      expect(breakdown.setupCost).toBe(5);
      expect(breakdown.durationCost).toBe(50); // 5 minutes
      expect(breakdown.totalCost).toBe(55);
      expect(breakdown.durationMinutes).toBe(5);
      expect(breakdown.durationFormatted).toBe('5m');
    });

    it('should provide breakdown for long call', () => {
      const breakdown = getCallCostBreakdown(3600);

      expect(breakdown.setupCost).toBe(5);
      expect(breakdown.durationCost).toBe(600); // 60 minutes
      expect(breakdown.totalCost).toBe(605);
      expect(breakdown.durationMinutes).toBe(60);
      expect(breakdown.durationFormatted).toBe('1h');
    });
  });

  describe('Call Credit Scenarios', () => {
    it('should handle sequential calls with different durations', () => {
      const call1 = estimateCallCredits(1);
      const call2 = estimateCallCredits(5);
      const call3 = estimateCallCredits(10);

      const totalCredits = call1 + call2 + call3;

      expect(call1).toBe(15);
      expect(call2).toBe(55);
      expect(call3).toBe(105);
      expect(totalCredits).toBe(175);
    });

    it('should calculate cost for back-to-back calls', () => {
      const call1Duration = 300; // 5 minutes
      const call2Duration = 600; // 10 minutes

      const call1Cost = estimateCallCredits(5);
      const call2Cost = estimateCallCredits(10);

      expect(call1Cost).toBe(55);
      expect(call2Cost).toBe(105);
      expect(call1Cost + call2Cost).toBe(160);
    });

    it('should handle calls with rounding edge cases', () => {
      // 1 minute 1 second should round up to 2 minutes
      const breakdown1 = getCallCostBreakdown(61);
      expect(breakdown1.durationMinutes).toBe(2);
      expect(breakdown1.durationCost).toBe(20);

      // 2 minutes 59 seconds should round up to 3 minutes
      const breakdown2 = getCallCostBreakdown(179);
      expect(breakdown2.durationMinutes).toBe(3);
      expect(breakdown2.durationCost).toBe(30);
    });

    it('should calculate cost for calls under minimum duration', () => {
      // 1 second call should still cost minimum
      const breakdown = getCallCostBreakdown(1);
      expect(breakdown.durationMinutes).toBe(1);
      expect(breakdown.durationCost).toBe(10);
      expect(breakdown.totalCost).toBe(15);
    });
  });

  describe('Credit Balance Impact', () => {
    it('should calculate remaining balance after single call', () => {
      const initialBalance = 1000;
      const callCredits = estimateCallCredits(10);
      const remainingBalance = initialBalance - callCredits;

      expect(callCredits).toBe(105); // 5 setup + 100 duration
      expect(remainingBalance).toBe(895);
    });

    it('should calculate remaining balance after multiple calls', () => {
      let balance = 1000;

      // Call 1: 5 minutes
      balance -= estimateCallCredits(5);
      expect(balance).toBe(945);

      // Call 2: 10 minutes
      balance -= estimateCallCredits(10);
      expect(balance).toBe(840);

      // Call 3: 3 minutes
      balance -= estimateCallCredits(3);
      expect(balance).toBe(775);
    });

    it('should prevent calls when insufficient credits', () => {
      const balance = 50;
      const callCost = estimateCallCredits(5); // 55 credits

      const canMakeCall = balance >= callCost;
      expect(canMakeCall).toBe(false);
    });

    it('should allow calls when sufficient credits', () => {
      const balance = 100;
      const callCost = estimateCallCredits(5); // 55 credits

      const canMakeCall = balance >= callCost;
      expect(canMakeCall).toBe(true);
    });
  });

  describe('Call Duration Rounding', () => {
    it('should round up partial minutes', () => {
      const durations = [1, 30, 59, 61, 119, 121];
      const expectedRounded = [1, 1, 1, 2, 2, 3];

      durations.forEach((duration, index) => {
        const breakdown = getCallCostBreakdown(duration);
        expect(breakdown.durationMinutes).toBe(expectedRounded[index]);
      });
    });

    it('should handle exact minute boundaries', () => {
      const durations = [60, 120, 180, 300, 600];

      durations.forEach((duration) => {
        const breakdown = getCallCostBreakdown(duration);
        const expectedMinutes = duration / 60;
        expect(breakdown.durationMinutes).toBe(expectedMinutes);
      });
    });
  });

  describe('Call Cost Comparisons', () => {
    it('should show cost difference between call durations', () => {
      const cost1Min = estimateCallCredits(1);
      const cost5Min = estimateCallCredits(5);
      const cost10Min = estimateCallCredits(10);

      expect(cost5Min - cost1Min).toBe(40); // 4 additional minutes * 10
      expect(cost10Min - cost5Min).toBe(50); // 5 additional minutes * 10
    });

    it('should show that setup cost is significant for short calls', () => {
      const cost1Min = estimateCallCredits(1);
      const setupPortion = 5 / cost1Min;

      expect(setupPortion).toBeCloseTo(0.333, 2); // Setup is 33% of 1-min call cost
    });

    it('should show that setup cost is negligible for long calls', () => {
      const cost60Min = estimateCallCredits(60);
      const setupPortion = 5 / cost60Min;

      expect(setupPortion).toBeCloseTo(0.008, 2); // Setup is less than 1% of 60-min call cost
    });
  });
});
