import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "./db";

/**
 * User Router
 * 
 * Handles user profile and account management
 */
export const userRouter = router({
  /**
   * Complete user onboarding and update profile
   */
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1, "Name is required"),
        preferredName: z.string().optional().default(""),
        phone: z.string().optional().default(""),
        bio: z.string().optional().default(""),
        photoUrl: z.string().optional().default(""),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        console.log("[User] Completing onboarding for user:", userId);

        // Update user profile
        await db
          .update(users)
          .set({
            displayName: input.displayName,
            preferredName: input.preferredName || null,
            phone: input.phone || null,
            bio: input.bio || null,
            photoUrl: input.photoUrl || null,
            onboardingCompleted: 1,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(users.id, userId));

        console.log("[User] Onboarding completed for user:", userId);

        return {
          success: true,
          message: "Profile completed successfully",
        };
      } catch (error) {
        console.error("[User] Error completing onboarding:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to complete onboarding",
        });
      }
    }),

  /**
   * Check if user has completed onboarding
   */
  checkOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      const [user] = await db
        .select({
          onboardingCompleted: users.onboardingCompleted,
          displayName: users.displayName,
          photoUrl: users.photoUrl,
          authProvider: users.authProvider,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        completed: user.onboardingCompleted === 1,
        hasDisplayName: !!user.displayName,
        hasPhoto: !!user.photoUrl,
        authProvider: user.authProvider,
      };
    } catch (error) {
      console.error("[User] Error checking onboarding status:", error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check onboarding status",
      });
    }
  }),

  /**
   * Get current user profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          displayName: users.displayName,
          preferredName: users.preferredName,
          email: users.email,
          phone: users.phone,
          bio: users.bio,
          photoUrl: users.photoUrl,
          photoUrlSmall: users.photoUrlSmall,
          role: users.role,
          authProvider: users.authProvider,
          emailVerified: users.emailVerified,
          onboardingCompleted: users.onboardingCompleted,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    } catch (error) {
      console.error("[User] Error getting profile:", error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get user profile",
      });
    }
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().optional(),
        preferredName: z.string().optional(),
        phone: z.string().optional(),
        bio: z.string().optional(),
        photoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Build update object with only provided fields
        const updateData: any = {
          updatedAt: new Date().toISOString(),
        };

        if (input.displayName !== undefined) updateData.displayName = input.displayName;
        if (input.preferredName !== undefined) updateData.preferredName = input.preferredName;
        if (input.phone !== undefined) updateData.phone = input.phone;
        if (input.bio !== undefined) updateData.bio = input.bio;
        if (input.photoUrl !== undefined) updateData.photoUrl = input.photoUrl;

        await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, userId));

        console.log("[User] Profile updated for user:", userId);

        return {
          success: true,
          message: "Profile updated successfully",
        };
      } catch (error) {
        console.error("[User] Error updating profile:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
        });
      }
    }),
});
