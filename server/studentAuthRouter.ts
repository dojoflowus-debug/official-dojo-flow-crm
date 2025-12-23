import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { getDb } from "./db";
import { users, organizationUsers, organizations } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";

/**
 * Student/Parent Authentication Router
 * Handles student/parent login with organization resolution
 */
export const studentAuthRouter = router({
  /**
   * Student/Parent login with email + password
   * Returns list of organizations the student belongs to
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

      // Check if user is a student (role = "user" for students/parents)
      if (user.role !== "user") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This login is for students and parents only. Please use the correct login page for your role.",
        });
      }

      // Get all organizations this student belongs to
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
          message: "You are not associated with any school. Please contact your school administrator.",
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
});
