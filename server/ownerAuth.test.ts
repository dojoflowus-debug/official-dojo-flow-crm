import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, verificationCodes, onboardingProgress } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Owner Authentication & Onboarding Tests
 * Tests signup, verification, login, and workspace creation flows
 */

describe("Owner Authentication & Onboarding", () => {
  let testUserId: number;
  let testEmail: string;
  let testVerificationCode: string;

  beforeAll(async () => {
    // Clean up any existing test data
    testEmail = `test-owner-${Date.now()}@example.com`;
    const db = await getDb();
    if (db) {
      await db.delete(users).where(eq(users.email, testEmail));
    }
  });

  afterAll(async () => {
    // Clean up test data
    const db = await getDb();
    if (db && testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
      await db.delete(verificationCodes).where(eq(verificationCodes.identifier, testEmail));
      await db.delete(onboardingProgress).where(eq(onboardingProgress.userId, testUserId));
    }
  });

  describe("Owner Signup", () => {
    it("should create a new owner account", async () => {
      const caller = appRouter.createCaller({ user: null });

      const result = await caller.ownerAuth.signup({
        firstName: "Test",
        lastName: "Owner",
        email: testEmail,
        phone: "5551234567",
        password: "testpassword123",
        agreeToTerms: true,
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBeGreaterThan(0);
      expect(result.message).toContain("Verification code sent");

      testUserId = result.userId;

      // Verify user was created in database
      const db = await getDb();
      if (db) {
        const [user] = await db.select().from(users).where(eq(users.id, testUserId)).limit(1);
        expect(user).toBeDefined();
        expect(user.email).toBe(testEmail);
        expect(user.role).toBe("owner");
        expect(user.password).toBeDefined(); // Should be hashed

        // Verify verification code was created
        const [code] = await db
          .select()
          .from(verificationCodes)
          .where(eq(verificationCodes.identifier, testEmail))
          .limit(1);
        expect(code).toBeDefined();
        expect(code.code).toHaveLength(6);
        testVerificationCode = code.code;

        // Verify onboarding progress was created
        const [progress] = await db
          .select()
          .from(onboardingProgress)
          .where(eq(onboardingProgress.userId, testUserId))
          .limit(1);
        expect(progress).toBeDefined();
        expect(progress.currentStep).toBe(1);
      }
    });

    it("should reject duplicate email", async () => {
      const caller = appRouter.createCaller({ user: null });

      await expect(
        caller.ownerAuth.signup({
          firstName: "Duplicate",
          lastName: "User",
          email: testEmail,
          phone: "5559999999",
          password: "password123",
          agreeToTerms: true,
        })
      ).rejects.toThrow("An account with this email already exists");
    });

    it("should reject signup without agreeing to terms", async () => {
      const caller = appRouter.createCaller({ user: null });

      await expect(
        caller.ownerAuth.signup({
          firstName: "Test",
          lastName: "User",
          email: "new@example.com",
          phone: "5551111111",
          password: "password123",
          agreeToTerms: false,
        })
      ).rejects.toThrow();
    });
  });

  describe("Email Verification", () => {
    it("should verify email with correct code", async () => {
      const caller = appRouter.createCaller({ user: null });

      const result = await caller.ownerAuth.verifyCode({
        identifier: testEmail,
        code: testVerificationCode,
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBe(testUserId);

      // Verify onboarding progress was updated
      const db = await getDb();
      if (db) {
        const [progress] = await db
          .select()
          .from(onboardingProgress)
          .where(eq(onboardingProgress.userId, testUserId))
          .limit(1);
        expect(progress.isVerified).toBe(1);
        expect(progress.currentStep).toBe(2);
      }
    });

    it("should reject invalid verification code", async () => {
      const caller = appRouter.createCaller({ user: null });

      await expect(
        caller.ownerAuth.verifyCode({
          identifier: testEmail,
          code: "000000",
        })
      ).rejects.toThrow("Invalid or expired verification code");
    });
  });

  describe("School Profile", () => {
    it("should save school profile data", async () => {
      const caller = appRouter.createCaller({ user: null });

      const result = await caller.onboarding.saveSchoolProfile({
        userId: testUserId,
        schoolName: "Test Martial Arts Academy",
        address: "123 Test St",
        city: "Test City",
        state: "NY",
        zipCode: "10001",
        timezone: "America/New_York",
        programs: ["Kids Karate", "Adults Kickboxing"],
        estimatedStudents: 50,
        launchDate: new Date().toISOString(),
      });

      expect(result.success).toBe(true);

      // Verify progress was updated
      const db = await getDb();
      if (db) {
        const [progress] = await db
          .select()
          .from(onboardingProgress)
          .where(eq(onboardingProgress.userId, testUserId))
          .limit(1);
        expect(progress.currentStep).toBe(3);
        expect(progress.schoolData).toBeDefined();
        const schoolData = JSON.parse(progress.schoolData!);
        expect(schoolData.schoolName).toBe("Test Martial Arts Academy");
      }
    });
  });

  describe("Plan Selection", () => {
    it("should retrieve available plans", async () => {
      const caller = appRouter.createCaller({ user: null });

      const plans = await caller.onboarding.getPlans();

      expect(plans).toBeDefined();
      expect(plans.length).toBeGreaterThan(0);
      expect(plans[0]).toHaveProperty("id");
      expect(plans[0]).toHaveProperty("name");
      expect(plans[0]).toHaveProperty("price");
      expect(plans[0]).toHaveProperty("features");
    });

    it("should select a plan", async () => {
      const caller = appRouter.createCaller({ user: null });

      const result = await caller.onboarding.selectPlan({
        userId: testUserId,
        planId: 1,
      });

      expect(result.success).toBe(true);

      // Verify progress was updated
      const db = await getDb();
      if (db) {
        const [progress] = await db
          .select()
          .from(onboardingProgress)
          .where(eq(onboardingProgress.userId, testUserId))
          .limit(1);
        expect(progress.selectedPlanId).toBe(1);
        expect(progress.currentStep).toBe(4);
      }
    });
  });

  describe("Workspace Creation", () => {
    it("should create organization and workspace", async () => {
      const caller = appRouter.createCaller({ user: null });

      const result = await caller.onboarding.createWorkspace({
        userId: testUserId,
      });

      expect(result.success).toBe(true);
      expect(result.organizationId).toBeGreaterThan(0);

      // Verify onboarding is completed
      const db = await getDb();
      if (db) {
        const [progress] = await db
          .select()
          .from(onboardingProgress)
          .where(eq(onboardingProgress.userId, testUserId))
          .limit(1);
        expect(progress.isCompleted).toBe(1);
        expect(progress.completedAt).toBeDefined();
      }
    });
  });

  describe("Owner Login", () => {
    it("should login with email and password", async () => {
      const caller = appRouter.createCaller({ user: null });

      const result = await caller.ownerAuth.login({
        email: testEmail,
        password: "testpassword123",
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      expect(result.user.role).toBe("owner");
    });

    it("should reject invalid password", async () => {
      const caller = appRouter.createCaller({ user: null });

      await expect(
        caller.ownerAuth.login({
          email: testEmail,
          password: "wrongpassword",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("should reject non-existent email", async () => {
      const caller = appRouter.createCaller({ user: null });

      await expect(
        caller.ownerAuth.login({
          email: "nonexistent@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Invalid email or password");
    });
  });

  describe("Onboarding Progress Retrieval", () => {
    it("should retrieve onboarding progress", async () => {
      const caller = appRouter.createCaller({ user: null });

      const progress = await caller.onboarding.getProgress({
        userId: testUserId,
      });

      expect(progress).toBeDefined();
      expect(progress?.isCompleted).toBe(true);
      expect(progress?.isVerified).toBe(true);
      expect(progress?.schoolData).toBeDefined();
      expect(progress?.selectedPlanId).toBe(1);
    });

    it("should return null for non-existent user", async () => {
      const caller = appRouter.createCaller({ user: null });

      const progress = await caller.onboarding.getProgress({
        userId: 999999,
      });

      expect(progress).toBeNull();
    });
  });
});
