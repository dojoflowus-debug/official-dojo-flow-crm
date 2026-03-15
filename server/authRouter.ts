import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getUserByOpenId, getDb } from "./db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { organizationUsers, organizations, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getSessionCookieOptions } from "./_core/cookies";
import { storagePut } from "./storage";

/**
 * Authentication Router
 * 
 * Provides endpoints for user authentication and profile management
 */
export const authRouter = router({
  /**
   * Get current authenticated user
   * Returns user profile with role information and active organization
   */
  getCurrentUser: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    const user = await getUserByOpenId(ctx.user.openId);
    
    if (!user) {
      throw new Error("User not found");
    }

    // Get user's primary organization
    const db = await getDb();
    let activeOrgId: number | null = null;
    
    if (db) {
      const [primaryOrg] = await db
        .select({
          organizationId: organizationUsers.organizationId,
        })
        .from(organizationUsers)
        .where(
          and(
            eq(organizationUsers.userId, user.id),
            eq(organizationUsers.isPrimary, 1)
          )
        )
        .limit(1);
      
      if (primaryOrg) {
        activeOrgId = primaryOrg.organizationId;
      } else {
        // If no primary org, get the first organization
        const [firstOrg] = await db
          .select({
            organizationId: organizationUsers.organizationId,
          })
          .from(organizationUsers)
          .where(eq(organizationUsers.userId, user.id))
          .limit(1);
        
        if (firstOrg) {
          activeOrgId = firstOrg.organizationId;
        }
      }
    }

    return {
      id: user.id,
      openId: user.openId,
      name: user.name,
      email: user.email,
      role: user.role,
      photoUrl: user.photoUrl,
      photoUrlSmall: user.photoUrlSmall,
      createdAt: user.createdAt,
      lastSignedIn: user.lastSignedIn,
      activeOrgId,
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
          updatedAt:new Date().toISOString(),
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

  /**
   * Upload profile picture
   * Accepts base64 encoded image and uploads to S3
   */
  uploadProfilePicture: protectedProcedure
    .input(
      z.object({
        imageData: z.string(), // base64 encoded image
        mimeType: z.string(),
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

      try {
        // Validate MIME type
        const validMimeTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
        if (!validMimeTypes.includes(input.mimeType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid image format. Supported formats: JPG, PNG, HEIC, WebP",
          });
        }

        // Remove data URL prefix if present
        const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, "");

        // Validate base64 data size (max 5MB for profile photos)
        const maxSizeBytes = 5 * 1024 * 1024; // 5MB
        const estimatedSize = Math.ceil(base64Data.length * 0.75); // base64 is ~33% larger than binary
        if (estimatedSize > maxSizeBytes) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Photo is too large. Maximum size is 5MB. Please use a smaller image or reduce quality.",
          });
        }

        // Create data URL from base64 data
        // Use image/jpeg for HEIC/HEIF since the frontend converts them to JPEG
        const effectiveMimeType = input.mimeType.includes('heic') || input.mimeType.includes('heif') 
          ? 'image/jpeg' 
          : input.mimeType;
        const dataUrl = `data:${effectiveMimeType};base64,${base64Data}`;

        // Update user record with data URL
        await db
          .update(users)
          .set({
            photoUrl: dataUrl,
            photoUrlSmall: dataUrl, // For now, use same URL for both
            updatedAt: new Date().toISOString(),
          })
          .where(eq(users.id, ctx.user.id));

        console.log(`[Profile Photo Upload] User ${ctx.user.id}: Photo saved as data URL (${Math.round(estimatedSize / 1024)}KB)`);

        return {
          success: true,
          photoUrl: dataUrl,
        };
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload profile picture",
        });
      }
    }),

  /**
   * Delete profile picture
   * Removes profile picture from user account
   */
  deleteProfilePicture: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    // Update user record to remove photo URLs
    await db
      .update(users)
      .set({
        photoUrl: null,
        photoUrlSmall: null,
        updatedAt:new Date().toISOString(),
      })
      .where(eq(users.id, ctx.user.id));

    return {
      success: true,
    };
  }),
});
