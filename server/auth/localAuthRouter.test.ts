import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";
import express from "express";
import localAuthRouter from "./localAuthRouter";
import { getDb } from "../db";

// Mock SendGrid
vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
  },
}));

describe("Password Reset Flow", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/auth", localAuthRouter);
  });

  it("should accept password reset request for valid email", async () => {
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "sensei30002003@gmail.com" })
      .expect(200);

    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("password reset link");
  });

  it("should return success even for non-existent email (security)", async () => {
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nonexistent@example.com" })
      .expect(200);

    expect(response.body).toHaveProperty("success", true);
  });

  it("should reject request without email", async () => {
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty("error", "Email is required");
  });

  it("should save reset token to database for valid user", async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // First, make the password reset request
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "sensei30002003@gmail.com" })
      .expect(200);

    // Then verify the reset token was saved
    const { users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, "sensei30002003@gmail.com"))
      .limit(1);

    expect(userResult.length).toBe(1);
    const user = userResult[0];
    
    // Check that reset token and expiry were set
    expect(user.resetToken).toBeTruthy();
    expect(user.resetTokenExpiry).toBeTruthy();
    
    // Check that token expiry is in the future
    if (user.resetTokenExpiry) {
      expect(new Date(user.resetTokenExpiry).getTime()).toBeGreaterThan(Date.now());
    }
  });

  it("should call SendGrid send method when SENDGRID_API_KEY is set", async () => {
    // This test verifies that the email sending logic is triggered
    const sgMail = await import("@sendgrid/mail");
    
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "sensei30002003@gmail.com" })
      .expect(200);

    // Give async email sending a moment to execute
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify SendGrid was called (mocked)
    expect(sgMail.default.send).toHaveBeenCalled();
  });
});
