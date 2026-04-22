import { Router } from "express";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sdk } from "../_core/sdk";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";

const router = Router();

/**
 * Helper function to set JWT session cookie for local auth users
 * This ensures compatibility with the tRPC authentication system
 */
async function setSessionCookie(user: any, req: any, res: any) {
  const db = await getDb();
  
  // Generate a unique openId if user doesn't have one (for local auth users)
  let openId = user.openId;
  if (!openId) {
    openId = `local_${user.id}_${crypto.randomBytes(8).toString("hex")}`;
    // Update user with openId
    if (db) {
      await db
        .update(users)
        .set({ openId })
        .where(eq(users.id, user.id));
    }
  }

  // Create JWT session token using SDK
  const sessionToken = await sdk.createSessionToken(openId, {
    name: user.name || user.email?.split("@")[0] || "User",
  });

  // Set the session cookie
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, {
    ...cookieOptions,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
  });
  
  // Get user's organization for multi-tenancy support
  let currentOrganizationId: number | null = null;
  if (db) {
    const { organizationUsers } = await import("../../drizzle/schema");
    const orgMemberships = await db
      .select({ organizationId: organizationUsers.organizationId })
      .from(organizationUsers)
      .where(eq(organizationUsers.userId, user.id))
      .limit(1);
    if (orgMemberships.length > 0) {
      currentOrganizationId = orgMemberships[0].organizationId;
    }
  }
  
  // Set session cookie with organization context (for REST API endpoints)
  const sessionData = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    currentOrganizationId,
  };
  res.cookie("session", JSON.stringify(sessionData), {
    ...cookieOptions,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
  });
}

/**
 * Register new user with email and password
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate openId for new user
    const openId = `local_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;

    // Create new user with openId
    await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name: email.split("@")[0], // Use email prefix as default name
        provider: "local",
        role: "owner", // Default role
        openId,
      });

    // Fetch the newly created user
    const newUserResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (newUserResult.length === 0) {
      return res.status(500).json({ error: "Failed to create user" });
    }

    const newUser = newUserResult[0];

    // Set JWT session cookie for tRPC compatibility
    await setSessionCookie(newUser, req, res);

    // Also set passport session for backward compatibility
    req.login(newUser, (err: any) => {
      if (err) {
        console.error("Passport login error after registration:", err);
        // Still return success since JWT cookie is set
      }
      res.json({ success: true, user: { id: newUser.id, email: newUser.email } });
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * Login with email and password
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Find user by email
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = userResult[0];

    // Check if user has a password (local auth)
    if (!user.password) {
      return res.status(401).json({ error: "This account uses social login. Please sign in with Google." });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Set JWT session cookie for tRPC compatibility
    await setSessionCookie(user, req, res);

    // Also set passport session for backward compatibility
    req.login(user, (err: any) => {
      if (err) {
        console.error("Passport login error:", err);
        // Still return success since JWT cookie is set
      }
      res.json({ success: true, user: { id: user.id, email: user.email } });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * Request password reset
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Find user by email
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      // Don't reveal if email exists or not for security
      return res.json({ success: true, message: "If an account exists with this email, a password reset link has been sent." });
    }

    const user = userResult[0];

    // Allow password reset for both local auth users and OAuth users
    // OAuth users can use this to set a local password as backup authentication

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 86400000); // 24 hours from now

    // Save reset token to database
    await db
      .update(users)
      .set({
        resetToken,
        resetTokenExpiry,
      })
      .where(eq(users.id, user.id));
    
    console.log(`[Password Reset] Token generated for user ${email}: ${resetToken.substring(0, 10)}...`)

    // Send reset email
    const sendEmail = async () => {
      console.log("[Password Reset] Preparing to send email to:", email);
      const sgMail = require("@sendgrid/mail");
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${resetToken}`;
      console.log("[Password Reset] Reset URL:", resetUrl);

      const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL || "noreply@dojoflow.com",
        subject: "Password Reset Request - DojoFlow",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Password Reset Request</h2>
            <p>You requested to reset your password for your DojoFlow account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${resetUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      };

      await sgMail.send(msg);
    };

    // Send email
    console.log("[Password Reset] SENDGRID_API_KEY present:", !!process.env.SENDGRID_API_KEY);
    console.log("[Password Reset] SENDGRID_FROM_EMAIL:", process.env.SENDGRID_FROM_EMAIL);
    
    if (process.env.SENDGRID_API_KEY) {
      try {
        console.log("[Password Reset] Attempting to send email...");
        await sendEmail();
        console.log(`[Password Reset] ✅ Email sent successfully to ${email}`);
      } catch (err) {
        console.error("[Password Reset] ❌ Failed to send email:", err);
        // Still return success to not reveal if email exists
      }
    } else {
      console.log("[Password Reset] ⚠️ SendGrid not configured. Reset link:", `${req.protocol}://${req.get("host")}/reset-password?token=${resetToken}`);
    }

    res.json({ success: true, message: "If an account exists with this email, a password reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to process password reset request" });
  }
});

/**
 * Reset password with token
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    console.log(`[Password Reset] Attempting reset with token: ${token?.substring(0, 10)}...`);

    if (!token || !newPassword) {
      console.log("[Password Reset] Missing token or password");
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Find user by reset token
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token))
      .limit(1);
    
    console.log(`[Password Reset] Found ${userResult.length} user(s) with token`);

    if (userResult.length === 0) {
      console.log("[Password Reset] No user found with this token");
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const user = userResult[0];

    // Check if token is expired
    console.log(`[Password Reset] Token expiry: ${user.resetTokenExpiry}, Current time: ${new Date()}`);
    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      console.log("[Password Reset] Token is expired");
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }
    console.log("[Password Reset] Token is valid")

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      })
      .where(eq(users.id, user.id));

    res.json({ success: true, message: "Password has been reset successfully", role: user.role });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
