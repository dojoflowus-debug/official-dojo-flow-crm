import { describe, it, expect } from "vitest";

describe("Google OAuth Configuration", () => {
  it("should have GOOGLE_CLIENT_ID environment variable", () => {
    expect(process.env.GOOGLE_CLIENT_ID).toBeDefined();
    expect(process.env.GOOGLE_CLIENT_ID).not.toBe("");
  });

  it("should have GOOGLE_CLIENT_SECRET environment variable", () => {
    expect(process.env.GOOGLE_CLIENT_SECRET).toBeDefined();
    expect(process.env.GOOGLE_CLIENT_SECRET).not.toBe("");
  });

  it("should have SESSION_SECRET environment variable", () => {
    expect(process.env.SESSION_SECRET).toBeDefined();
    expect(process.env.SESSION_SECRET).not.toBe("");
  });

  it("GOOGLE_CLIENT_ID should be a valid format", () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    expect(clientId).toBeDefined();
    // Google Client IDs typically end with .apps.googleusercontent.com
    expect(clientId).toMatch(/\.apps\.googleusercontent\.com$/);
  });
});
