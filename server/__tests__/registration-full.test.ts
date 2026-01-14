import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

describe("Full Registration Flow Test", () => {
  let testEmail: string;

  beforeAll(async () => {
    testEmail = `test${Date.now()}@example.com`;
  });

  it("should create a new user with hashed password", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    
    if (!db) {
      throw new Error("Database not available");
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    expect(existingUser.length).toBe(0);

    // Hash password
    const password = "testpassword123";
    const hashedPassword = await bcrypt.hash(password, 10);
    expect(hashedPassword).toBeDefined();

    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        email: testEmail,
        password: hashedPassword,
        name: testEmail.split("@")[0],
        provider: "local",
        role: "owner",
      })
      .returning();

    expect(newUser).toBeDefined();
    expect(newUser.length).toBe(1);
    expect(newUser[0].email).toBe(testEmail);
    expect(newUser[0].password).toBe(hashedPassword);
    expect(newUser[0].provider).toBe("local");
    expect(newUser[0].role).toBe("owner");

    // Verify password
    const isValidPassword = await bcrypt.compare(password, newUser[0].password!);
    expect(isValidPassword).toBe(true);

    // Clean up - delete test user
    await db.delete(users).where(eq(users.email, testEmail));
  });

  it("should detect duplicate email", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    
    if (!db) {
      throw new Error("Database not available");
    }

    const duplicateEmail = `duplicate${Date.now()}@example.com`;
    const password = "testpassword123";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create first user
    await db
      .insert(users)
      .values({
        email: duplicateEmail,
        password: hashedPassword,
        name: duplicateEmail.split("@")[0],
        provider: "local",
        role: "owner",
      })
      .returning();

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, duplicateEmail))
      .limit(1);

    expect(existingUser.length).toBeGreaterThan(0);

    // Clean up
    await db.delete(users).where(eq(users.email, duplicateEmail));
  });
});
