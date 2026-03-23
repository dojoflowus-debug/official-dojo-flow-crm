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
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie);
        console.log('[Context] Session data parsed:', { userId: sessionData.userId, orgId: sessionData.currentOrganizationId });
        currentOrganizationId = sessionData.currentOrganizationId || null;
        locationSlug = sessionData.locationSlug || null;
      } catch (e) {
        console.log('[Context] Error parsing session cookie:', e);
        // Invalid session data, ignore
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
          console.log('[Context] Got org from DB lookup:', currentOrganizationId);
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
