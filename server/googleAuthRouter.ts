import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { users, organizationUsers } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getDb, getUserByOpenId, upsertUser } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import axios from "axios";

/**
 * Google OAuth Router
 * 
 * Handles Google Sign-In authentication flow:
 * 1. Verify Google ID token
 * 2. Link or create user account
 * 3. Create session
 * 4. Return authenticated user
 */
export const googleAuthRouter = router({
  /**
   * Verify Google ID token and authenticate user
   * 
   * Flow:
   * 1. Verify token with Google
   * 2. Check if user exists by email
   * 3. Link Google account or create new user
   * 4. Create session and return user
   */
  verifyGoogleToken: publicProcedure
    .input(
      z.object({
        idToken: z.string(),
        userType: z.enum(["student", "owner", "staff"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify token with Google
        const googleUser = await verifyGoogleIdToken(input.idToken);

        if (!googleUser.email) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Google account does not have an email",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Check if user exists by email
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, googleUser.email))
          .limit(1);

        let user = existingUser;
        let isNewUser = false;

        if (existingUser) {
          // Link Google account to existing user
          await db
            .update(users)
            .set({
              googleSub: googleUser.sub,
              authProvider: "google",
              emailVerified: googleUser.email_verified ? 1 : 0,
              photoUrl: googleUser.picture || existingUser.photoUrl,
              photoUrlSmall: googleUser.picture || existingUser.photoUrlSmall,
              lastSignedIn: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .where(eq(users.id, existingUser.id));

          user = {
            ...existingUser,
            googleSub: googleUser.sub,
            authProvider: "google",
            emailVerified: googleUser.email_verified ? 1 : 0,
            photoUrl: googleUser.picture || existingUser.photoUrl,
            photoUrlSmall: googleUser.picture || existingUser.photoUrlSmall,
            lastSignedIn: new Date().toISOString(),
          };
        } else {
          // Create new user
          const openId = `google_${googleUser.sub}`;

          await upsertUser({
            openId,
            name: googleUser.name || null,
            email: googleUser.email,
            loginMethod: "google",
            lastSignedIn: new Date().toISOString(),
          });

          const newUser = await getUserByOpenId(openId);
          if (!newUser) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create user",
            });
          }

          // Update with Google-specific fields
          await db
            .update(users)
            .set({
              googleSub: googleUser.sub,
              authProvider: "google",
              emailVerified: googleUser.email_verified ? 1 : 0,
              photoUrl: googleUser.picture,
              photoUrlSmall: googleUser.picture,
            })
            .where(eq(users.id, newUser.id));

          user = {
            ...newUser,
            googleSub: googleUser.sub,
            authProvider: "google",
            emailVerified: googleUser.email_verified ? 1 : 0,
            photoUrl: googleUser.picture,
            photoUrlSmall: googleUser.picture,
          };

          isNewUser = true;
        }

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to process user",
          });
        }

        // For owner/staff login, check authorization
        if (input.userType === "owner" || input.userType === "staff") {
          // Check if user has appropriate role
          if (user.role !== "owner" && user.role !== "staff" && user.role !== "admin") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `This email is not authorized for ${input.userType} access. Please contact your administrator.`,
            });
          }
        }

        // Create session token
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        // Set session cookies
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        // Get user's organization for multi-tenancy
        let currentOrganizationId: number | null = null;

        const orgMemberships = await db
          .select({ organizationId: organizationUsers.organizationId })
          .from(organizationUsers)
          .where(eq(organizationUsers.userId, user.id))
          .limit(1);

        if (orgMemberships.length > 0) {
          currentOrganizationId = orgMemberships[0].organizationId;
        }

        // Set session cookie with organization context
        const sessionData = {
          userId: user.id,
          email: user.email,
          name: user.name,
          currentOrganizationId,
        };
        ctx.res.cookie("session", JSON.stringify(sessionData), {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return {
          success: true,
          isNewUser,
          user: {
            id: user.id,
            openId: user.openId,
            name: user.name,
            email: user.email,
            role: user.role,
            photoUrl: user.photoUrl,
            photoUrlSmall: user.photoUrlSmall,
            emailVerified: user.emailVerified === 1,
            authProvider: user.authProvider,
          },
        };
      } catch (error) {
        console.error("[GoogleAuth] Error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Google authentication failed",
        });
      }
    }),
});

/**
 * Verify Google ID token with Google's servers
 * Returns decoded token payload
 */
async function verifyGoogleIdToken(idToken: string): Promise<{
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}> {
  try {
    // Use Google's tokeninfo endpoint to verify the token
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?id_token=${idToken}`,
      {
        timeout: 5000,
      }
    );

    const { sub, email, name, picture, email_verified } = response.data;

    if (!sub || !email) {
      throw new Error("Invalid token: missing sub or email");
    }

    return {
      sub,
      email,
      name: name || "",
      picture: picture || "",
      email_verified: email_verified === true || email_verified === "true",
    };
  } catch (error) {
    console.error("[GoogleAuth] Token verification failed:", error);

    if (axios.isAxiosError(error)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid Google token",
      });
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to verify Google token",
    });
  }
}
