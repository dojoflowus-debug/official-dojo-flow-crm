import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

// Mock context for testing
const createMockContext = (userId?: number, organizationId?: number): Context => ({
  user: userId ? {
    id: userId,
    name: "Test User",
    email: "test@example.com",
    role: "owner",
    openId: "test-open-id",
    provider: null,
    providerId: null,
    password: null,
    resetToken: null,
    resetTokenExpiry: null,
    loginMethod: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date()
  } : null,
  req: {} as any,
  res: {} as any,
  db: null
});

describe("Subscription Router", () => {
  const caller = appRouter.createCaller(createMockContext(1, 1));

  describe("getPlans", () => {
    it("should return all active subscription plans", async () => {
      const plans = await caller.subscription.getPlans();
      
      expect(plans).toBeDefined();
      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThan(0);
      
      // Verify plan structure
      const starterPlan = plans.find(p => p.slug === 'starter');
      expect(starterPlan).toBeDefined();
      expect(starterPlan?.name).toBe('Starter');
      expect(starterPlan?.monthlyPrice).toBe(14900);
      expect(starterPlan?.maxStudents).toBe(150);
      expect(starterPlan?.monthlyCredits).toBe(300);
      expect(starterPlan?.aiPhoneEnabled).toBe(0);

      const growthPlan = plans.find(p => p.slug === 'growth');
      expect(growthPlan).toBeDefined();
      expect(growthPlan?.name).toBe('Growth');
      expect(growthPlan?.monthlyPrice).toBe(29900);
      expect(growthPlan?.maxStudents).toBe(400);
      expect(growthPlan?.monthlyCredits).toBe(1200);
      expect(growthPlan?.aiPhoneEnabled).toBe(1);

      const proPlan = plans.find(p => p.slug === 'pro');
      expect(proPlan).toBeDefined();
      expect(proPlan?.name).toBe('Pro');
      expect(proPlan?.monthlyPrice).toBe(49900);
      expect(proPlan?.monthlyCredits).toBe(3000);
    });

    it("should return plans in correct display order", async () => {
      const plans = await caller.subscription.getPlans();
      
      expect(plans[0].slug).toBe('starter');
      expect(plans[1].slug).toBe('growth');
      expect(plans[2].slug).toBe('pro');
      expect(plans[3].slug).toBe('enterprise');
    });
  });

  describe("getPlan", () => {
    it("should return a specific plan by ID", async () => {
      const plans = await caller.subscription.getPlans();
      const starterPlan = plans.find(p => p.slug === 'starter');
      
      if (!starterPlan) {
        throw new Error('Starter plan not found');
      }

      const plan = await caller.subscription.getPlan({ planId: starterPlan.id });
      
      expect(plan).toBeDefined();
      expect(plan.id).toBe(starterPlan.id);
      expect(plan.slug).toBe('starter');
    });

    it("should throw error for non-existent plan", async () => {
      await expect(
        caller.subscription.getPlan({ planId: 99999 })
      ).rejects.toThrow("Plan not found");
    });
  });

  describe("Credit System", () => {
    it("should check credits for organization", async () => {
      // This test assumes organization 1 exists
      // In a real test, you'd create a test organization first
      const result = await caller.subscription.checkCredits({
        organizationId: 1,
        amount: 10
      });

      expect(result).toBeDefined();
      expect(typeof result.hasCredits).toBe('boolean');
      expect(typeof result.balance).toBe('number');
    });

    it("should get credit balance for organization", async () => {
      const balance = await caller.subscription.getCreditBalance({
        organizationId: 1
      });

      // Balance might be null if not initialized
      if (balance) {
        expect(balance).toBeDefined();
        expect(typeof balance.balance).toBe('number');
        expect(typeof balance.periodAllowance).toBe('number');
        expect(typeof balance.periodUsed).toBe('number');
      }
    });

    it("should get credit usage summary", async () => {
      const summary = await caller.subscription.getCreditUsageSummary({
        organizationId: 1
      });

      expect(summary).toBeDefined();
      expect(typeof summary.totalDeductions).toBe('number');
      expect(typeof summary.totalAdditions).toBe('number');
      expect(typeof summary.transactionCount).toBe('number');
      expect(summary.byTaskType).toBeDefined();
    });
  });

  describe("Credit Transactions", () => {
    it("should get credit transactions with pagination", async () => {
      const transactions = await caller.subscription.getCreditTransactions({
        organizationId: 1,
        limit: 10,
        offset: 0
      });

      expect(Array.isArray(transactions)).toBe(true);
    });

    it("should filter transactions by date range", async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const transactions = await caller.subscription.getCreditTransactions({
        organizationId: 1,
        startDate,
        endDate: new Date()
      });

      expect(Array.isArray(transactions)).toBe(true);
    });

    it("should filter transactions by task type", async () => {
      const transactions = await caller.subscription.getCreditTransactions({
        organizationId: 1,
        taskType: 'kai_chat'
      });

      expect(Array.isArray(transactions)).toBe(true);
      
      // All transactions should be kai_chat type
      transactions.forEach(tx => {
        if (tx.taskType) {
          expect(tx.taskType).toBe('kai_chat');
        }
      });
    });
  });
});

describe("Subscription Plan Features", () => {
  const caller = appRouter.createCaller(createMockContext(1, 1));

  it("should have correct features for Starter plan", async () => {
    const plans = await caller.subscription.getPlans();
    const starter = plans.find(p => p.slug === 'starter');
    
    expect(starter).toBeDefined();
    expect(starter?.maxStudents).toBe(150);
    expect(starter?.maxLocations).toBe(1);
    expect(starter?.monthlyCredits).toBe(300);
    expect(starter?.aiPhoneEnabled).toBe(0);
  });

  it("should have correct features for Growth plan", async () => {
    const plans = await caller.subscription.getPlans();
    const growth = plans.find(p => p.slug === 'growth');
    
    expect(growth).toBeDefined();
    expect(growth?.maxStudents).toBe(400);
    expect(growth?.maxLocations).toBe(2);
    expect(growth?.monthlyCredits).toBe(1200);
    expect(growth?.aiPhoneEnabled).toBe(1);
  });

  it("should have correct features for Pro plan", async () => {
    const plans = await caller.subscription.getPlans();
    const pro = plans.find(p => p.slug === 'pro');
    
    expect(pro).toBeDefined();
    expect(pro?.maxStudents).toBe(999999); // Unlimited
    expect(pro?.maxLocations).toBe(999); // Unlimited
    expect(pro?.monthlyCredits).toBe(3000);
    expect(pro?.aiPhoneEnabled).toBe(1);
  });

  it("should parse features JSON correctly", async () => {
    const plans = await caller.subscription.getPlans();
    
    plans.forEach(plan => {
      expect(plan.features).toBeDefined();
      expect(typeof plan.features).toBe('string');
      
      // Should be valid JSON
      const features = JSON.parse(plan.features);
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBeGreaterThan(0);
    });
  });
});
