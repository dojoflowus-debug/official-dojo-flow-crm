import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { users, organizationUsers } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getDb, getUserByOpenId, upsertUser } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { OAuth2Client } from "google-auth-library";

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
        console.log("[GoogleAuth] Starting token verification for userType:", input.userType);
        // Verify token with Google
        const googleUser = await verifyGoogleIdToken(input.idToken);
        console.log("[GoogleAuth] Token verified successfully for email:", googleUser.email);

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
            googleSub: googleUser.sub,
            authProvider: "google",
            emailVerified: googleUser.email_verified ? 1 : 0,
            photoUrl: googleUser.picture || null,
            photoUrlSmall: googleUser.picture || null,
          });

          // Fetch the newly created user
          const [newUser] = await db
            .select()
            .from(users)
            .where(eq(users.openId, openId))
            .limit(1);

          if (!newUser) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create user account",
            });
          }

          user = newUser;
          isNewUser = true;
        }

        // Check owner authorization if userType is "owner"
        if (input.userType === "owner") {
          const isAuthorized =
            user.role === "owner" ||
            user.role === "admin" ||
            user.role === "staff";

          if (!isAuthorized) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `Your account (${user.email}) is not authorized to access the owner dashboard. Please contact your administrator.`,
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
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error("VITE_GOOGLE_CLIENT_ID environment variable not set");
    }

    console.log("[GoogleAuth] Verifying token with Client ID:", clientId.substring(0, 20) + "...");
    
    // Use google-auth-library for proper token verification
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error("Invalid token payload");
    }

    const { sub, email, name, picture, email_verified } = payload;

    if (!sub || !email) {
      throw new Error("Invalid token: missing sub or email");
    }

    console.log("[GoogleAuth] Token verified successfully for:", email);

    return {
      sub: sub as string,
      email: email as string,
      name: (name as string) || "",
      picture: (picture as string) || "",
      email_verified: email_verified === true,
    };
  } catch (error) {
    console.error("[GoogleAuth] Token verification failed:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[GoogleAuth] Error details:", {
      message: errorMessage,
      type: error?.constructor?.name,
    });

    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid Google token: ${errorMessage}`,
    });
  }
}
