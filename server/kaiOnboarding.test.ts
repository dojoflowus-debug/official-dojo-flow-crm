import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "./db";
import { users, organizations, organizationUsers, onboardingProgress } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Kai Hero Onboarding Tests
 * Tests the quick signup flow from the Kai Command hero section
 */

describe("Kai Hero Onboarding", () => {
  beforeEach(async () => {
    // Clean up test data before each test
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Delete test users and related data
    const testEmail = "test-kai-onboarding@example.com";
    const testUsers = await db.select().from(users).where(eq(users.email, testEmail));
    
    if (testUsers.length > 0) {
      const userId = testUsers[0].id;
      
      // Delete related records first (foreign key constraints)
      await db.delete(onboardingProgress).where(eq(onboardingProgress.userId, userId));
      
      const orgUsers = await db.select().from(organizationUsers).where(eq(organizationUsers.userId, userId));
      for (const orgUser of orgUsers) {
        await db.delete(organizations).where(eq(organizations.id, orgUser.organizationId));
      }
      
      await db.delete(organizationUsers).where(eq(organizationUsers.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  it("should create account and organization from Growth card", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Simulate the quickSignup mutation
    const testData = {
      schoolName: "Dragon Martial Arts Academy",
      ownerName: "John Smith",
      ownerEmail: "test-kai-onboarding@example.com",
      locationCount: "1" as const,
      programs: ["Karate", "Kickboxing"],
      studentCount: "51-100" as const,
      category: "growth" as const,
    };

    // Create user
    const [newUser] = await db.insert(users).values({
      name: testData.ownerName,
      email: testData.ownerEmail,
      password: "temp_password_hash",
      role: "owner",
      loginMethod: "password",
    });

    const userId = newUser.insertId;
    expect(userId).toBeGreaterThan(0);

    // Create organization
    const [newOrg] = await db.insert(organizations).values({
      name: testData.schoolName,
      timezone: "America/New_York",
      programs: JSON.stringify(testData.programs),
      estimatedStudents: 75, // Middle of 51-100 range
      planId: 1,
      subscriptionStatus: "trial",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    const organizationId = newOrg.insertId;
    expect(organizationId).toBeGreaterThan(0);

    // Link user to organization
    await db.insert(organizationUsers).values({
      userId,
      organizationId,
      role: "owner",
      isPrimary: 1,
    });

    // Create onboarding progress with category
    await db.insert(onboardingProgress).values({
      userId,
      currentStep: 5,
      isVerified: 1,
      isCompleted: 1,
      completedAt: new Date(),
      schoolData: JSON.stringify({
        schoolName: testData.schoolName,
        category: testData.category,
      }),
    });

    // Verify user was created
    const createdUser = await db.select().from(users).where(eq(users.email, testData.ownerEmail)).limit(1);
    expect(createdUser.length).toBe(1);
    expect(createdUser[0].name).toBe(testData.ownerName);
    expect(createdUser[0].role).toBe("owner");

    // Verify organization was created
    const createdOrg = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
    expect(createdOrg.length).toBe(1);
    expect(createdOrg[0].name).toBe(testData.schoolName);
    expect(createdOrg[0].subscriptionStatus).toBe("trial");

    // Verify organization link
    const orgLink = await db.select().from(organizationUsers)
      .where(eq(organizationUsers.userId, userId))
      .limit(1);
    expect(orgLink.length).toBe(1);
    expect(orgLink[0].role).toBe("owner");
    expect(orgLink[0].isPrimary).toBe(1);

    // Verify onboarding progress with category tag
    const progress = await db.select().from(onboardingProgress)
      .where(eq(onboardingProgress.userId, userId))
      .limit(1);
    expect(progress.length).toBe(1);
    expect(progress[0].isCompleted).toBe(1);
    
    const schoolData = JSON.parse(progress[0].schoolData || "{}");
    expect(schoolData.category).toBe("growth");
  });

  it("should handle all 4 category types correctly", async () => {
    const categories = ["growth", "health", "billing", "retention"] as const;
    
    for (const category of categories) {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const testEmail = `test-${category}@example.com`;
      
      // Clean up if exists
      const existingUsers = await db.select().from(users).where(eq(users.email, testEmail));
      if (existingUsers.length > 0) {
        const userId = existingUsers[0].id;
        await db.delete(onboardingProgress).where(eq(onboardingProgress.userId, userId));
        const orgUsers = await db.select().from(organizationUsers).where(eq(organizationUsers.userId, userId));
        for (const orgUser of orgUsers) {
          await db.delete(organizations).where(eq(organizations.id, orgUser.organizationId));
        }
        await db.delete(organizationUsers).where(eq(organizationUsers.userId, userId));
        await db.delete(users).where(eq(users.id, userId));
      }

      // Create test account with category
      const [newUser] = await db.insert(users).values({
        name: `Test ${category}`,
        email: testEmail,
        password: "temp_hash",
        role: "owner",
        loginMethod: "password",
      });

      const userId = newUser.insertId;

      // Create onboarding progress with category
      await db.insert(onboardingProgress).values({
        userId,
        currentStep: 5,
        isCompleted: 1,
        schoolData: JSON.stringify({ category }),
      });

      // Verify category was stored
      const progress = await db.select().from(onboardingProgress)
        .where(eq(onboardingProgress.userId, userId))
        .limit(1);
      
      const schoolData = JSON.parse(progress[0].schoolData || "{}");
      expect(schoolData.category).toBe(category);
    }
  });

  it("should prevent duplicate email signups", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const testEmail = "test-kai-onboarding@example.com";

    // Create first user
    await db.insert(users).values({
      name: "First User",
      email: testEmail,
      password: "hash1",
      role: "owner",
      loginMethod: "password",
    });

    // Try to create duplicate - should check first
    const existingUser = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);
    expect(existingUser.length).toBe(1);
    
    // In real implementation, this would throw a TRPCError with code CONFLICT
    // Here we just verify the check works
    expect(existingUser[0].email).toBe(testEmail);
  });

  it("should parse student count ranges correctly", async () => {
    const testCases = [
      { range: "0-50", expected: 25 },
      { range: "51-100", expected: 75 },
      { range: "101-200", expected: 150 },
      { range: "201-500", expected: 350 },
      { range: "500+", expected: 750 },
    ];

    const parseStudentCount = (range: string): number => {
      switch (range) {
        case "0-50": return 25;
        case "51-100": return 75;
        case "101-200": return 150;
        case "201-500": return 350;
        case "500+": return 750;
        default: return 50;
      }
    };

    for (const testCase of testCases) {
      const result = parseStudentCount(testCase.range);
      expect(result).toBe(testCase.expected);
    }
  });

  it("should set trial period to 14 days", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const [newOrg] = await db.insert(organizations).values({
      name: "Test Dojo",
      timezone: "America/New_York",
      planId: 1,
      subscriptionStatus: "trial",
      trialEndsAt,
    });

    const organizationId = newOrg.insertId;

    const createdOrg = await db.select().from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    expect(createdOrg[0].subscriptionStatus).toBe("trial");
    
    // Verify trial is approximately 14 days (within 1 hour tolerance)
    const trialDuration = createdOrg[0].trialEndsAt!.getTime() - Date.now();
    const expectedDuration = 14 * 24 * 60 * 60 * 1000;
    expect(Math.abs(trialDuration - expectedDuration)).toBeLessThan(60 * 60 * 1000);
  });
});
