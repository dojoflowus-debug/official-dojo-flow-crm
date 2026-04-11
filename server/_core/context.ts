import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import type { Database } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /** Current organization ID from session (for multi-tenant access control) */
  currentOrganizationId: number | null;
  /** Location slug from Kiosk sessions (for location-bound authentication) */
  locationSlug: string | null;
  /** Database connection */
  db: Database | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let currentOrganizationId: number | null = null;
  let locationSlug: string | null = null;
  let db: Database | null = null;

  // Always initialize DB — must run regardless of auth status so public procedures work
  try {
    const { getDb } = await import("../db");
    db = await getDb();
  } catch (e) {
    console.log('[Context] Error getting database:', e);
  }

  try {
    user = await sdk.authenticateRequest(opts.req);
    
    // Extract organization and location context from session cookie
    const sessionCookie = opts.req.cookies?.session;
    console.log('[Context] Session cookie raw:', sessionCookie ? 'present' : 'missing');
    
    let sessionUserId: number | null = null;
    
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie);
        console.log('[Context] Session data parsed:', { userId: sessionData.userId, orgId: sessionData.currentOrganizationId });
        currentOrganizationId = sessionData.currentOrganizationId || null;
        locationSlug = sessionData.locationSlug || null;
        sessionUserId = sessionData.userId || null;
      } catch (e) {
        console.log('[Context] Error parsing session cookie:', e);
      }
    }

    // If the session cookie has a userId that differs from the SDK-authenticated user,
    // load the correct user from DB. This handles the case where the SDK token is shared
    // (e.g., OWNER_OPEN_ID env var) but the session cookie identifies the real user.
    if (sessionUserId && db && user && user.id !== sessionUserId) {
      try {
        const { users } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [correctUser] = await db.select().from(users).where(eq(users.id, sessionUserId)).limit(1);
        if (correctUser) {
          console.log('[Context] Correcting user from SDK user', user.id, '(', user.email, ') to session user', correctUser.id, '(', correctUser.email, ')');
          user = correctUser as User;
        }
      } catch (e) {
        console.log('[Context] Error loading correct user from session:', e);
      }
    }
    
    // Check for org ID from custom request header (sent by frontend as fallback when cookies are unavailable)
    if (!currentOrganizationId) {
      const headerOrgId = opts.req.headers['x-organization-id'];
      if (headerOrgId) {
        const parsed = parseInt(String(headerOrgId), 10);
        if (!isNaN(parsed)) {
          currentOrganizationId = parsed;
          console.log('[Context] Got org from x-organization-id header:', currentOrganizationId);
        }
      }
    }
    
    // Check for user ID from custom request header (sent by frontend as fallback)
    if (user && db) {
      const headerUserId = opts.req.headers['x-user-id'];
      if (headerUserId) {
        const parsedUserId = parseInt(String(headerUserId), 10);
        if (!isNaN(parsedUserId) && parsedUserId !== user.id) {
          try {
            const { users: usersTable } = await import('../../drizzle/schema');
            const { eq: eqHeader } = await import('drizzle-orm');
            const [headerUser] = await db.select().from(usersTable).where(eqHeader(usersTable.id, parsedUserId)).limit(1);
            if (headerUser) {
              console.log('[Context] Correcting user from header: SDK user', user.id, '->', 'header user', headerUser.id, headerUser.email);
              user = headerUser as typeof user;
            }
          } catch (e) {
            console.log('[Context] Error loading user from header:', e);
          }
        }
      }
    }

    // If no org from session cookie, try to get it from user's organization membership
    if (!currentOrganizationId && user && db) {
      try {
        const { organizationUsers } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const orgMemberships = await db
          .select({ organizationId: organizationUsers.organizationId })
          .from(organizationUsers)
          .where(eq(organizationUsers.userId, user.id))
          .limit(1);
        if (orgMemberships.length > 0) {
          currentOrganizationId = orgMemberships[0].organizationId;
          console.log('[Context] Got org from DB lookup:', currentOrganizationId, 'for user:', user?.id, user?.email);
        }
      } catch (e) {
        console.log('[Context] Error looking up org from DB:', e);
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    currentOrganizationId,
    locationSlug,
    db,
  };
}
