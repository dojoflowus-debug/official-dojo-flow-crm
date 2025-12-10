import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../db";
import bcrypt from "bcryptjs";

describe("Registration Debug Tests", () => {
  beforeAll(async () => {
    const db = await getDb();
    expect(db).toBeDefined();
  });

  it("should hash password with bcrypt", async () => {
    const password = "testpassword123";
    const hashedPassword = await bcrypt.hash(password, 10);
    
    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword.length).toBeGreaterThan(20);
    
    // Verify the hash
    const isValid = await bcrypt.compare(password, hashedPassword);
    expect(isValid).toBe(true);
  });

  it("should connect to database", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
  });
});
