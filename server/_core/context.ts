import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /** Current organization ID from session (for multi-tenant access control) */
  currentOrganizationId: number | null;
  /** Location slug from Kiosk sessions (for location-bound authentication) */
  locationSlug: string | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let currentOrganizationId: number | null = null;
  let locationSlug: string | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
    
    // Extract organization and location context from session cookie
    const sessionCookie = opts.req.cookies?.session;
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie);
        currentOrganizationId = sessionData.currentOrganizationId || null;
        locationSlug = sessionData.locationSlug || null;
      } catch (e) {
        // Invalid session data, ignore
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
  };
}
