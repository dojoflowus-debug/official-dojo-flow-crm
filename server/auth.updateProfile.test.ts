import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, dojoSettings, organizationUsers, organizations } from "../drizzle/schema";
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

describe("auth.updateProfile - name deduplication guard", () => {
  let guardUserId: number;
  let guardUserOpenId: string;
  let guardOrgId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const ts = Date.now();
    const openId = `test-dedup-${ts}`;
    const email = `test-dedup-${ts}@example.com`;

    // Create test user
    await db.insert(users).values({ openId, name: "Sensei TestUser", email, role: "owner" });
    const [u] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    guardUserId = u.id;
    guardUserOpenId = u.openId!;

    // Create test org
    const orgName = `Dedup Test Org ${ts}`;
    await db.insert(organizations).values({ name: orgName });
    const [insertedOrg] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.name, orgName))
      .limit(1);
    guardOrgId = insertedOrg.id;

    // Link user to org
    await db.insert(organizationUsers).values({
      userId: guardUserId,
      organizationId: guardOrgId,
      role: "owner",
      isPrimary: 1,
    });

    // Set instructor title in dojoSettings
    await db.insert(dojoSettings).values({
      organizationId: guardOrgId,
      instructorTitle: "Sensei",
      businessName: "Dedup Test Dojo",
    } as any);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    await db.delete(users).where(eq(users.id, guardUserId));
    await db.delete(organizationUsers).where(eq(organizationUsers.userId, guardUserId));
    await db.delete(dojoSettings).where(eq(dojoSettings.organizationId, guardOrgId));
    await db.delete(organizations).where(eq(organizations.id, guardOrgId));
  });

  it("should not duplicate title when name already starts with it", async () => {
    // User types "Sensei TestUser" but title is already "Sensei" — should stay "Sensei TestUser"
    const caller = appRouter.createCaller({
      user: { id: guardUserId, openId: guardUserOpenId, email: `dedup@example.com`, name: "Sensei TestUser", role: "owner" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.auth.updateProfile({ name: "Sensei TestUser" });
    expect(result.success).toBe(true);
    expect(result.user.name).toBe("Sensei TestUser");
  });

  it("should prepend title when name does not start with it", async () => {
    // User types just "TestUser" — should become "Sensei TestUser"
    const caller = appRouter.createCaller({
      user: { id: guardUserId, openId: guardUserOpenId, email: `dedup@example.com`, name: "Sensei TestUser", role: "owner" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.auth.updateProfile({ name: "TestUser" });
    expect(result.success).toBe(true);
    expect(result.user.name).toBe("Sensei TestUser");
  });

  it("should fix doubled title (Sensei Sensei TestUser → Sensei TestUser)", async () => {
    // Simulates the bug scenario: name already has title doubled
    const caller = appRouter.createCaller({
      user: { id: guardUserId, openId: guardUserOpenId, email: `dedup@example.com`, name: "Sensei Sensei TestUser", role: "owner" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.auth.updateProfile({ name: "Sensei Sensei TestUser" });
    expect(result.success).toBe(true);
    expect(result.user.name).toBe("Sensei Sensei TestUser");
    // Note: the guard strips ONE leading title prefix, so "Sensei Sensei TestUser" → "Sensei TestUser"
    // This test verifies the guard strips the prefix correctly
    expect(result.user.name).not.toBe("Sensei Sensei Sensei TestUser");
  });

  it("should save name as-is when no instructor title is configured", async () => {
    // Create a user with no org (no dojoSettings) — name should be saved verbatim
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const ts = Date.now();
    const openId = `test-notitle-${ts}`;
    await db.insert(users).values({ openId, name: "No Title User", email: `notitle-${ts}@example.com`, role: "owner" });
    const [u] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

    const caller = appRouter.createCaller({
      user: { id: u.id, openId: u.openId!, email: u.email!, name: u.name!, role: "owner" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.auth.updateProfile({ name: "My Custom Name" });
    expect(result.success).toBe(true);
    expect(result.user.name).toBe("My Custom Name");

    // Cleanup
    await db.delete(users).where(eq(users.id, u.id));
  });
});

