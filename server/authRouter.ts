import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getUserByOpenId, getDb } from "./db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { organizationUsers, organizations, users, dojoSettings } from "../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
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
    
    // Use the corrected user from context (which already handles session cookie userId mismatch)
    // ctx.user is already the correct user after context.ts fix
    let user = ctx.user;
    
    // Double-check: if session cookie has a different userId, load that user
    const sessionCookie = ctx.req?.cookies?.session;
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie);
        if (sessionData.userId && sessionData.userId !== user.id) {
          const db2 = await getDb();
          if (db2) {
            const [correctUser] = await db2.select().from(users).where(eq(users.id, sessionData.userId)).limit(1);
            if (correctUser) {
              console.log('[getCurrentUser] Using session user', correctUser.id, correctUser.email, 'instead of SDK user', user.id);
              user = correctUser as typeof user;
            }
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    }
    
    // Also check x-user-id header (sent by frontend from localStorage after login)
    const headerUserId = ctx.req?.headers?.['x-user-id'];
    if (headerUserId) {
      const parsedHeaderUserId = parseInt(String(headerUserId), 10);
      if (!isNaN(parsedHeaderUserId) && parsedHeaderUserId !== user.id) {
        const db3 = await getDb();
        if (db3) {
          const [headerUser] = await db3.select().from(users).where(eq(users.id, parsedHeaderUserId)).limit(1);
          if (headerUser) {
            console.log('[getCurrentUser] Using x-user-id header user', headerUser.id, headerUser.email, 'instead of SDK user', user.id);
            user = headerUser as typeof user;
          }
        }
      }
    }
    
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
        // If no primary org, get the first organization (deterministic ordering)
        const [firstOrg] = await db
          .select({
            organizationId: organizationUsers.organizationId,
          })
          .from(organizationUsers)
          .where(eq(organizationUsers.userId, user.id))
          .orderBy(asc(organizationUsers.id))
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
      preferredName: user.preferredName ?? null,
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

      // Deduplication guard: if the user has an instructor title stored in their org's
      // dojoSettings, ensure the saved name is always "<Title> <BaseName>" — never doubled.
      // e.g. if title = "Sensei" and user types "Sensei Demo", save as "Sensei Demo" (not "Sensei Sensei Demo")
      // e.g. if title = "Sensei" and user types "Demo", save as "Sensei Demo"
      let resolvedName = input.name;
      if (resolvedName !== undefined) {
        try {
          // Get the user's active org ID from their membership
          const [membership] = await db
            .select({ organizationId: organizationUsers.organizationId })
            .from(organizationUsers)
            .where(eq(organizationUsers.userId, ctx.user.id))
            .limit(1);

          if (membership) {
            const [orgSettings] = await db
              .select({ instructorTitle: dojoSettings.instructorTitle })
              .from(dojoSettings)
              .where(eq(dojoSettings.organizationId, membership.organizationId))
              .limit(1);

            const title = orgSettings?.instructorTitle?.trim();
            if (title) {
              // Strip any existing title prefix (case-insensitive) before applying
              let baseName = resolvedName.trim();
              if (baseName.toLowerCase().startsWith(title.toLowerCase() + ' ')) {
                baseName = baseName.slice(title.length + 1).trim();
              }
              // Rebuild as "<Title> <BaseName>" only if baseName is non-empty
              resolvedName = baseName ? `${title} ${baseName}` : title;
            }
          }
        } catch (e) {
          // Non-fatal: if we can't fetch the title, save the name as-is
          console.warn('[updateProfile] Could not fetch instructor title for dedup guard:', e);
        }
      }

      // Update user profile
      await db
        .update(users)
        .set({
          ...(resolvedName !== undefined && { name: resolvedName }),
          ...(input.email !== undefined && { email: input.email }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.bio !== undefined && { bio: input.bio }),
          updatedAt: new Date().toISOString(),
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

        // Use image/jpeg for HEIC/HEIF since the frontend converts them to JPEG
        const effectiveMimeType = input.mimeType.includes('heic') || input.mimeType.includes('heif') 
          ? 'image/jpeg' 
          : input.mimeType;

        // Convert base64 to Buffer and upload to S3 storage
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const ext = effectiveMimeType.split('/')[1] || 'jpg';
        const storageKey = `profile-photos/${ctx.user.id}-${Date.now()}.${ext}`;

        let photoUrl: string;
        try {
          const uploadResult = await storagePut(storageKey, imageBuffer, effectiveMimeType);
          photoUrl = uploadResult.url;
          console.log(`[Profile Photo Upload] User ${ctx.user.id}: Photo uploaded to S3 at ${photoUrl} (${Math.round(estimatedSize / 1024)}KB)`);
        } catch (storageError) {
          console.error('[Profile Photo Upload] S3 upload failed, falling back to data URL:', storageError);
          // Fallback: store as data URL (may fail for large images on varchar(500) columns)
          photoUrl = `data:${effectiveMimeType};base64,${base64Data}`;
        }

        // Update user record with the photo URL (S3 URL is short; data URL fallback may be large)
        await db
          .update(users)
          .set({
            photoUrl: photoUrl,
            photoUrlSmall: photoUrl,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(users.id, ctx.user.id));

        return {
          success: true,
          photoUrl,
        };
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        if (error instanceof TRPCError) throw error;
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
