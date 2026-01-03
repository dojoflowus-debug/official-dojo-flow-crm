import { router, protectedProcedure } from "./_core/trpc";
import { getUserByOpenId, getDb } from "./db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { organizationUsers, organizations, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getSessionCookieOptions } from "./_core/cookies";

/**
 * Authentication Router
 * 
 * Provides endpoints for user authentication and profile management
 */
export const authRouter = router({
  /**
   * Get current authenticated user
   * Returns user profile with role information
   */
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserByOpenId(ctx.user.openId);
    
    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      openId: user.openId,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastSignedIn: user.lastSignedIn,
    };
  }),

  /**
   * Select active organization for multi-org users
   * Updates session cookie with selected organization
   */
  selectOrganization: protectedProcedure
    .input(
      z.object({
        organizationId: z.number(),
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

      // Verify user has access to this organization
      const [membership] = await db
        .select({
          role: organizationUsers.role,
          organizationName: organizations.name,
        })
        .from(organizationUsers)
        .innerJoin(organizations, eq(organizationUsers.organizationId, organizations.id))
        .where(
          and(
            eq(organizationUsers.userId, ctx.user.id),
            eq(organizationUsers.organizationId, input.organizationId)
          )
        )
        .limit(1);

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this organization",
        });
      }

      // Update session cookie with selected organization
      const sessionData = {
        userId: ctx.user.id,
        email: ctx.user.email,
        name: ctx.user.name,
        role: ctx.user.role,
        currentOrganizationId: input.organizationId,
      };

      ctx.res.cookie("session", JSON.stringify(sessionData), getSessionCookieOptions());

      return {
        success: true,
        organizationId: input.organizationId,
        organizationName: membership.organizationName,
        role: membership.role,
      };
    }),

  /**
   * Update user profile
   * Allows users to update their name, email, phone, and bio
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").optional(),
        email: z.string().email("Invalid email address").optional(),
        phone: z.string().optional(),
        bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
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

      // Check if email is being changed and if it's already taken
      if (input.email) {
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (existingUser && existingUser.id !== ctx.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This email is already in use",
          });
        }
      }

      // Update user profile
      await db
        .update(users)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.email !== undefined && { email: input.email }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.bio !== undefined && { bio: input.bio }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      // Fetch updated user
      const updatedUser = await getUserByOpenId(ctx.user.openId);

      if (!updatedUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch updated user",
        });
      }

      return {
        success: true,
        user: {
          id: updatedUser.id,
          openId: updatedUser.openId,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          bio: updatedUser.bio,
          role: updatedUser.role,
        },
      };
    }),
});
