import { router, protectedProcedure } from "./_core/trpc";
import { getUserByOpenId, getDb } from "./db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { organizationUsers, organizations } from "../drizzle/schema";
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
});
