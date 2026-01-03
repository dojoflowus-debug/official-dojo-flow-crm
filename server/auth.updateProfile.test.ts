import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("auth.updateProfile", () => {
  let testUserId: number;
  let testUserOpenId: string;

  beforeAll(async () => {
    // Create a test user
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const timestamp = Date.now();
    const testEmail = `test-profile-${timestamp}@example.com`;
    const testOpenId = `test-profile-${timestamp}`;

    await db.insert(users).values({
      openId: testOpenId,
      name: "Test User",
      email: testEmail,
      role: "owner",
    });

    // Fetch the created user
    const [createdUser] = await db
      .select()
      .from(users)
      .where(eq(users.openId, testOpenId))
      .limit(1);

    testUserId = createdUser.id;
    testUserOpenId = createdUser.openId!;
  });

  it("should update user profile successfully", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: testUserOpenId,
        email: `test-profile-${Date.now()}@example.com`,
        name: "Test User",
        role: "owner",
      },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.auth.updateProfile({
      name: "Updated Name",
      phone: "+1234567890",
      bio: "This is my updated bio",
    });

    expect(result.success).toBe(true);
    expect(result.user.name).toBe("Updated Name");
    expect(result.user.phone).toBe("+1234567890");
    expect(result.user.bio).toBe("This is my updated bio");
  });

  it("should update only provided fields", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: testUserOpenId,
        email: `test-profile-${Date.now()}@example.com`,
        name: "Test User",
        role: "owner",
      },
      req: {} as any,
      res: {} as any,
    });

    // Update only name
    const result = await caller.auth.updateProfile({
      name: "Only Name Updated",
    });

    expect(result.success).toBe(true);
    expect(result.user.name).toBe("Only Name Updated");
  });

  it("should reject bio longer than 160 characters", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: testUserOpenId,
        email: `test-profile-${Date.now()}@example.com`,
        name: "Test User",
        role: "owner",
      },
      req: {} as any,
      res: {} as any,
    });

    const longBio = "a".repeat(161);

    await expect(
      caller.auth.updateProfile({
        bio: longBio,
      })
    ).rejects.toThrow();
  });

  it("should reject invalid email format", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: testUserOpenId,
        email: `test-profile-${Date.now()}@example.com`,
        name: "Test User",
        role: "owner",
      },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.auth.updateProfile({
        email: "invalid-email",
      })
    ).rejects.toThrow();
  });

  it("should reject duplicate email", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create another user with a specific email
    const existingEmail = `existing-${Date.now()}@example.com`;
    await db.insert(users).values({
      openId: `test-existing-${Date.now()}`,
      name: "Existing User",
      email: existingEmail,
      role: "user",
    });

    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: testUserOpenId,
        email: `test-profile-${Date.now()}@example.com`,
        name: "Test User",
        role: "owner",
      },
      req: {} as any,
      res: {} as any,
    });

    // Try to update to existing email
    await expect(
      caller.auth.updateProfile({
        email: existingEmail,
      })
    ).rejects.toThrow("This email is already in use");
  });

  it("should allow updating to same email (no change)", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: testUserOpenId,
        email: currentUser.email!,
        name: "Test User",
        role: "owner",
      },
      req: {} as any,
      res: {} as any,
    });

    // Update to same email should work
    const result = await caller.auth.updateProfile({
      email: currentUser.email!,
      name: "Same Email Update",
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe(currentUser.email);
  });
});
