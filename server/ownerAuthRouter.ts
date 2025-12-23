import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc.js";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcrypt";
import { getDb } from "./db.js";
import { users, verificationCodes, onboardingProgress, organizationUsers, organizations } from "../drizzle/schema.js";
import { eq, and, gt } from "drizzle-orm";

/**
 * Owner Authentication Router
 * Handles owner signup, login, and verification flows
 * Separate from student/client authentication
 */

// Helper: Generate 6-digit OTP code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Send verification code via email (mock for now)
async function sendVerificationEmail(email: string, code: string): Promise<void> {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`📧 Verification code for ${email}: ${code}`);
  // In production, send actual email here
}

// Helper: Send verification code via SMS (mock for now)
async function sendVerificationSMS(phone: string, code: string): Promise<void> {
  // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
  console.log(`📱 Verification code for ${phone}: ${code}`);
  // In production, send actual SMS here
}

export const ownerAuthRouter = router({
  /**
   * Step 1: Create owner account
   * Creates user record and sends verification code
   */
  signup: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        email: z.string().email("Valid email is required"),
        phone: z.string().min(10, "Valid phone number is required"),
        password: z.string().min(8, "Password must be at least 8 characters").optional(),
        agreeToTerms: z.boolean().refine((val) => val === true, {
          message: "You must agree to Terms and Privacy Policy",
        }),
      })
    )
    .mutation(async ({ input }) => {
      // Check if email already exists
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      
      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      // Hash password if provided
      let passwordHash: string | undefined;
      if (input.password) {
        passwordHash = await bcrypt.hash(input.password, 10);
      }

      // Create user record
      const [newUser] = await db.insert(users).values({
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        password: passwordHash,
        role: "owner",
        loginMethod: input.password ? "password" : "otp",
      });

      const userId = newUser.insertId;

      // Create onboarding progress record
      await db.insert(onboardingProgress).values({
        userId,
        currentStep: 1,
        accountData: JSON.stringify({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
        }),
      });

      // Generate and send verification code
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await db.insert(verificationCodes).values({
        identifier: input.email,
        code,
        type: "email",
        expiresAt,
      });

      // Send verification email
      await sendVerificationEmail(input.email, code);

      // Optionally send SMS if phone provided
      if (input.phone) {
        await db.insert(verificationCodes).values({
          identifier: input.phone,
          code,
          type: "sms",
          expiresAt,
        });
        await sendVerificationSMS(input.phone, code);
      }

      return {
        success: true,
        userId,
        message: "Verification code sent to your email",
      };
    }),

  /**
   * Step 2: Verify email/phone with OTP code
   */
  verifyCode: publicProcedure
    .input(
      z.object({
        identifier: z.string(), // email or phone
        code: z.string().length(6, "Code must be 6 digits"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Find valid verification code
      const [verification] = await db
        .select()
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.identifier, input.identifier),
            eq(verificationCodes.code, input.code),
            eq(verificationCodes.isUsed, 0),
            gt(verificationCodes.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!verification) {
        // Increment attempts
        await db
          .update(verificationCodes)
          .set({ attempts: verification?.attempts ? verification.attempts + 1 : 1 })
          .where(eq(verificationCodes.identifier, input.identifier));

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired verification code",
        });
      }

      // Mark code as used
      await db
        .update(verificationCodes)
        .set({ isUsed: 1 })
        .where(eq(verificationCodes.id, verification.id));

      // Find user and update onboarding progress
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.identifier))
        .limit(1);

      if (user) {
        await db
          .update(onboardingProgress)
          .set({
            isVerified: 1,
            currentStep: 2,
          })
          .where(eq(onboardingProgress.userId, user.id));
      }

      return {
        success: true,
        message: "Email verified successfully",
        userId: user?.id,
      };
    }),

  /**
   * Owner Login - Email + Password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().optional(),
        code: z.string().length(6).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, input.email), eq(users.role, "owner")))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Verify password or OTP
      if (input.password) {
        if (!user.password) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This account uses OTP login. Please request a verification code.",
          });
        }

        const isValid = await bcrypt.compare(input.password, user.password);
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }
      } else if (input.code) {
        // Verify OTP code
        const [verification] = await db
          .select()
          .from(verificationCodes)
          .where(
            and(
              eq(verificationCodes.identifier, input.email),
              eq(verificationCodes.code, input.code),
              eq(verificationCodes.type, "login"),
              eq(verificationCodes.isUsed, 0),
              gt(verificationCodes.expiresAt, new Date())
            )
          )
          .limit(1);

        if (!verification) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid or expired verification code",
          });
        }

        // Mark code as used
        await db
          .update(verificationCodes)
          .set({ isUsed: 1 })
          .where(eq(verificationCodes.id, verification.id));
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Password or verification code required",
        });
      }

      // Update last signed in
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Check if owner has an organization
      const orgMemberships = await db
        .select({
          organizationId: organizationUsers.organizationId,
          organizationName: organizations.name,
        })
        .from(organizationUsers)
        .innerJoin(organizations, eq(organizationUsers.organizationId, organizations.id))
        .where(eq(organizationUsers.userId, user.id))
        .limit(1);

      const hasOrganization = orgMemberships.length > 0;

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        hasOrganization,
        organizationId: hasOrganization ? orgMemberships[0].organizationId : null,
        organizationName: hasOrganization ? orgMemberships[0].organizationName : null,
      };
    }),

  /**
   * Request OTP for passwordless login
   */
  requestLoginCode: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Check if user exists
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, input.email), eq(users.role, "owner")))
        .limit(1);

      if (!user) {
        // Don't reveal if user exists or not
        return {
          success: true,
          message: "If an account exists, a verification code has been sent",
        };
      }

      // Generate and send OTP
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await db.insert(verificationCodes).values({
        identifier: input.email,
        code,
        type: "login",
        expiresAt,
      });

      await sendVerificationEmail(input.email, code);

      return {
        success: true,
        message: "Verification code sent to your email",
      };
    }),
});
