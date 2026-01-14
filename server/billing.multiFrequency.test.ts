import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";

describe("Multi-Frequency Billing Plans", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    caller = appRouter.createCaller({} as any);
  });

  it("should create a monthly plan (existing behavior)", async () => {
    const plan = await caller.billing.createPlan({
      name: "Test Monthly Plan",
      description: "Monthly billing test",
      billingFrequency: "monthly",
      priceAmount: 14900, // $149 in cents
      monthlyPrice: 14900,
      termLength: 12,
      registrationFee: 9900,
      billingCycle: "monthly",
    });

    expect(plan).toBeDefined();
    
    // Verify in database
    const db = await getDb();
    const { membershipPlans } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    const [dbPlan] = await db!.select().from(membershipPlans).where(eq(membershipPlans.name, "Test Monthly Plan"));
    
    expect(dbPlan.billingFrequency).toBe("monthly");
    expect(dbPlan.priceAmount).toBe(14900);
    expect(dbPlan.monthlyAmount).toBe(14900);
    expect(dbPlan.termLength).toBe(12);
  });

  it("should create a weekly plan with billing day", async () => {
    const plan = await caller.billing.createPlan({
      name: "Test Weekly Plan",
      description: "Weekly billing for summer camp",
      billingFrequency: "weekly",
      priceAmount: 7900, // $79 in cents
      monthlyPrice: 7900,
      billingAnchorDayOfWeek: 1, // Monday
      termLengthUnits: "weeks",
      termLengthValue: 8,
      registrationFee: 5000,
    });

    expect(plan).toBeDefined();
    
    const db = await getDb();
    const { membershipPlans } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    const [dbPlan] = await db!.select().from(membershipPlans).where(eq(membershipPlans.name, "Test Weekly Plan"));
    
    expect(dbPlan.billingFrequency).toBe("weekly");
    expect(dbPlan.priceAmount).toBe(7900);
    expect(dbPlan.billingAnchorDayOfWeek).toBe(1);
    expect(dbPlan.termLengthUnits).toBe("weeks");
    expect(dbPlan.termLengthValue).toBe(8);
  });

  it("should create a daily plan with charge on attendance", async () => {
    const plan = await caller.billing.createPlan({
      name: "Test Daily Plan",
      description: "Daily pass for drop-in training",
      billingFrequency: "daily",
      priceAmount: 2500, // $25 in cents
      monthlyPrice: 2500,
      termLengthUnits: "days",
      termLengthValue: 30,
      chargeOnAttendance: 1,
    });

    expect(plan).toBeDefined();
    
    const db = await getDb();
    const { membershipPlans } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    const [dbPlan] = await db!.select().from(membershipPlans).where(eq(membershipPlans.name, "Test Daily Plan"));
    
    expect(dbPlan.billingFrequency).toBe("daily");
    expect(dbPlan.priceAmount).toBe(2500);
    expect(dbPlan.termLengthUnits).toBe("days");
    expect(dbPlan.termLengthValue).toBe(30);
    expect(dbPlan.chargeOnAttendance).toBe(1);
  });

  it("should create a drop-in plan with visit pack", async () => {
    const plan = await caller.billing.createPlan({
      name: "Test Drop-in Plan",
      description: "10-visit pack for kickboxing",
      billingFrequency: "drop_in",
      priceAmount: 2000, // $20 per visit in cents
      monthlyPrice: 2000,
      perVisitPrice: 2000,
      visitPackSize: 10,
      visitPackExpiryDays: 90,
    });

    expect(plan).toBeDefined();
    
    const db = await getDb();
    const { membershipPlans } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    const [dbPlan] = await db!.select().from(membershipPlans).where(eq(membershipPlans.name, "Test Drop-in Plan"));
    
    expect(dbPlan.billingFrequency).toBe("drop_in");
    expect(dbPlan.priceAmount).toBe(2000);
    expect(dbPlan.perVisitPrice).toBe(2000);
    expect(dbPlan.visitPackSize).toBe(10);
    expect(dbPlan.visitPackExpiryDays).toBe(90);
  });

  it("should update a plan's billing frequency", async () => {
    // Create a monthly plan
    const plan = await caller.billing.createPlan({
      name: "Test Convertible Plan",
      description: "Will be converted to weekly",
      billingFrequency: "monthly",
      priceAmount: 19900,
      monthlyPrice: 19900,
      termLength: 12,
    });

    expect(plan).toBeDefined();
    
    const db = await getDb();
    const { membershipPlans } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    const [dbPlan] = await db!.select().from(membershipPlans).where(eq(membershipPlans.name, "Test Convertible Plan"));
    const planId = dbPlan.id;

    // Update to weekly
    await caller.billing.updatePlan({
      id: planId,
      billingFrequency: "weekly",
      priceAmount: 8900,
      monthlyPrice: 8900,
      billingAnchorDayOfWeek: 3, // Wednesday
      termLengthUnits: "weeks",
      termLengthValue: 12,
    });

    const [updatedPlan] = await db!.select().from(membershipPlans).where(eq(membershipPlans.id, planId));
    
    expect(updatedPlan.billingFrequency).toBe("weekly");
    expect(updatedPlan.priceAmount).toBe(8900);
    expect(updatedPlan.billingAnchorDayOfWeek).toBe(3);
    expect(updatedPlan.termLengthUnits).toBe("weeks");
    expect(updatedPlan.termLengthValue).toBe(12);
  });

  it("should maintain backward compatibility with existing monthly plans", async () => {
    // Query existing plans (should have been backfilled)
    const plans = await caller.billing.getPlans();
    
    const monthlyPlans = plans.filter(p => p.billingFrequency === "monthly" || !p.billingFrequency);
    
    // All existing plans should have priceAmount set
    monthlyPlans.forEach(plan => {
      expect(plan.priceAmount || plan.monthlyAmount).toBeGreaterThan(0);
    });
  });
});
