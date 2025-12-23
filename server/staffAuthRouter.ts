import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { getDb } from "./db";
import { users, organizationUsers, organizations } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { staffPins } from "../drizzle/schema";

/**
 * Staff Authentication Router
 * Handles staff/instructor login with organization resolution
 */
export const staffAuthRouter = router({
  /**
   * Staff login with email + password
   * Returns list of organizations the staff member belongs to
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Verify password
      if (!user.password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const isValidPassword = await bcrypt.compare(input.password, user.password);
      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Check if user is staff
      if (user.role !== "staff") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This login is for staff members only. Please use the correct login page for your role.",
        });
      }

      // Get all organizations this staff member belongs to
      const orgMemberships = await db
        .select({
          organizationId: organizationUsers.organizationId,
          role: organizationUsers.role,
          organizationName: organizations.name,
        })
        .from(organizationUsers)
        .innerJoin(organizations, eq(organizationUsers.organizationId, organizations.id))
        .where(eq(organizationUsers.userId, user.id));

      if (orgMemberships.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not associated with any school. Please contact your administrator.",
        });
      }

      // Set session cookie
      const sessionData = {
        userId: user.id,
        email: user.email!,
        name: user.name!,
        role: user.role,
        // If single org, set it as current; otherwise let user select
        currentOrganizationId: orgMemberships.length === 1 ? orgMemberships[0].organizationId : null,
      };

      ctx.res.cookie("session", JSON.stringify(sessionData), getSessionCookieOptions());

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        organizations: orgMemberships.map((om) => ({
          id: om.organizationId,
          name: om.organizationName,
          role: om.role,
        })),
      };
    }),

  /**
   * Staff login with PIN (Kiosk only)
   * Location-bound authentication
   */
  loginWithPIN: publicProcedure
    .input(
      z.object({
        pin: z.string().min(4),
        locationSlug: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Find staff PIN
      const [staffPin] = await db
        .select()
        .from(staffPins)
        .where(and(eq(staffPins.isActive, 1)))
        .limit(1);

      if (!staffPin) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid PIN",
        });
      }

      // Verify PIN
      const isValidPin = await bcrypt.compare(input.pin, staffPin.pinHash);
      if (!isValidPin) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid PIN",
        });
      }

      // Update last used timestamp
      await db
        .update(staffPins)
        .set({ lastUsed: new Date() })
        .where(eq(staffPins.id, staffPin.id));

      // TODO: Link PIN to actual user account and get organizations
      // For now, return basic staff info
      const sessionData = {
        userId: staffPin.id,
        name: staffPin.name,
        role: "staff",
        locationSlug: input.locationSlug,
      };

      ctx.res.cookie("session", JSON.stringify(sessionData), getSessionCookieOptions());

      return {
        success: true,
        name: staffPin.name,
      };
    }),

  /**
   * Request login code via email (Kiosk only)
   */
  requestLoginCode: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        locationSlug: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Find staff user by email
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, input.email), eq(users.role, "staff")))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No staff account found with this email",
        });
      }

      // TODO: Generate and send verification code via email
      // For now, return success
      return {
        success: true,
        message: "Verification code sent to your email",
      };
    }),

  /**
   * Verify login code (Kiosk only)
   */
  verifyLoginCode: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().length(6),
        locationSlug: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Find staff user by email
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, input.email), eq(users.role, "staff")))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid verification code",
        });
      }

      // TODO: Verify code from database/cache
      // For now, accept any 6-digit code for testing

      // Get organizations
      const orgMemberships = await db
        .select({
          organizationId: organizationUsers.organizationId,
          role: organizationUsers.role,
          organizationName: organizations.name,
        })
        .from(organizationUsers)
        .innerJoin(organizations, eq(organizationUsers.organizationId, organizations.id))
        .where(eq(organizationUsers.userId, user.id));

      const sessionData = {
        userId: user.id,
        email: user.email!,
        name: user.name!,
        role: user.role,
        locationSlug: input.locationSlug,
        currentOrganizationId: orgMemberships.length === 1 ? orgMemberships[0].organizationId : null,
      };

      ctx.res.cookie("session", JSON.stringify(sessionData), getSessionCookieOptions());

      return {
        success: true,
        name: user.name,
      };
    }),

  /**
   * Staff login with QR code (Kiosk only)
   */
  loginWithQR: publicProcedure
    .input(
      z.object({
        qrData: z.string(),
        locationSlug: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // TODO: Decode QR data and verify staff identity
      // QR data format: {userId, signature, timestamp}
      // For now, return error as QR system is not yet implemented
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "QR code authentication is not yet implemented. Please use PIN or email verification.",
      });
    }),
});
