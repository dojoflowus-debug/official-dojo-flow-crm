/**
 * SessionUser - Canonical user type for the entire application
 * 
 * This is the single source of truth for user data across:
 * - Frontend (useAuth hook)
 * - Server context (ctx.user)
 * - tRPC procedures (input/output)
 * - Components and pages
 */

export interface SessionUser {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  photoUrl?: string | null;
  photoUrlSmall?: string | null;
  role: "user" | "admin" | "owner" | "staff";
  globalRole?: "platform_admin" | "support" | "none";
  activeOrgId: number | null;
  activeLocationId?: number | null;
  setupCompleted?: boolean;
  staffId?: string | null;
  locationIds?: number[];
  phone?: string | null;
  bio?: string | null;
}

/**
 * Mapper: Convert database User row to SessionUser
 */
export function dbUserToSessionUser(
  dbUser: any,
  activeOrgId: number | null = null
): SessionUser {
  return {
    id: dbUser.id,
    openId: dbUser.openId || "",
    name: dbUser.name || null,
    email: dbUser.email || null,
    photoUrl: dbUser.photoUrl || null,
    photoUrlSmall: dbUser.photoUrlSmall || null,
    role: dbUser.role || "user",
    globalRole: dbUser.globalRole || "none",
    activeOrgId,
    setupCompleted: false,
    staffId: dbUser.staffId || null,
    locationIds: dbUser.locationIds ? JSON.parse(dbUser.locationIds) : [],
    phone: dbUser.phone || null,
    bio: dbUser.bio || null,
  };
}

/**
 * Type guard: Check if value is a SessionUser
 */
export function isSessionUser(value: any): value is SessionUser {
  return (
    value &&
    typeof value === "object" &&
    typeof value.id === "number" &&
    typeof value.openId === "string"
  );
}
