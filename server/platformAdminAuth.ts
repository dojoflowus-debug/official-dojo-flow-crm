/**
 * Platform Admin Authentication
 * Handles login for DojoFlow internal administrators
 */

import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";


export const platformAdminAuthRouter = router({
  /**
   * Platform admin login
   * Verifies email/password and globalRole = 'platform_admin'
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email));

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      // Verify password
      if (!user.password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const passwordValid = await bcrypt.compare(input.password, user.password);
      if (!passwordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      // Verify platform admin role
      if (user.globalRole !== "platform_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Platform admin access required",
        });
      }

      // TODO: Implement proper session management for platform admins
      // For now, just return success

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          globalRole: user.globalRole,
        },
      };
    }),

  /**
   * Platform admin logout
   */
  logout: publicProcedure.mutation(async () => {
    // TODO: Clear session cookie
    return { success: true };
  }),
});
