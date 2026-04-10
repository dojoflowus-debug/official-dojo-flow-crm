/**
 * Staff Permission System for DojoFlow
 *
 * Role hierarchy (highest → lowest):
 *   owner > admin > manager > instructor > front_desk / coach / trainer / assistant
 *
 * Permissions matrix:
 *   Action                    | owner | admin | manager | instructor | front_desk
 *   --------------------------|-------|-------|---------|------------|----------
 *   delete/archive student    |  ✓    |  ✓    |   ✗     |    ✗       |   ✗
 *   edit student profile      |  ✓    |  ✓    |   ✓     |    ✗       |   ✗
 *   add lead                  |  ✓    |  ✓    |   ✓     |    ✗       |   ✓
 *   update lead status        |  ✓    |  ✓    |   ✓     |    ✗       |   ✗
 *   mark attendance           |  ✓    |  ✓    |   ✓     |    ✓       |   ✗
 *   view financials           |  ✓    |  ✓    |   ✓     |    ✗       |   ✗
 *   send SMS blast            |  ✓    |  ✓    |   ✓     |    ✗       |   ✗
 *   view students/leads       |  ✓    |  ✓    |   ✓     |    ✓       |   ✓
 *   manage staff              |  ✓    |  ✓    |   ✗     |    ✗       |   ✗
 */

export type StaffRole =
  | "owner"
  | "admin"
  | "manager"
  | "instructor"
  | "front_desk"
  | "coach"
  | "trainer"
  | "assistant"
  | "staff"         // legacy
  | "read_only";    // legacy

/** Numeric rank — higher = more privileged */
const ROLE_RANK: Record<StaffRole, number> = {
  owner:      100,
  admin:       80,
  manager:     60,
  instructor:  40,
  coach:       40,
  trainer:     40,
  front_desk:  20,
  assistant:   20,
  staff:       20,
  read_only:   10,
};

function rank(role: StaffRole | string): number {
  return ROLE_RANK[(role as StaffRole)] ?? 0;
}

/** Kai-action permission requirements */
export const KAI_ACTION_PERMISSIONS: Record<
  string,
  { minRole: StaffRole; description: string }
> = {
  // ── Destructive ──────────────────────────────────────────────────────────
  remove_student:        { minRole: "admin",      description: "remove/delete a student" },
  archive_student:       { minRole: "admin",      description: "archive a student" },
  delete_lead:           { minRole: "admin",      description: "delete a lead" },
  manage_staff:          { minRole: "admin",      description: "manage staff members" },

  // ── Write ────────────────────────────────────────────────────────────────
  edit_student:          { minRole: "manager",    description: "edit a student profile" },
  add_lead:              { minRole: "front_desk", description: "add a new lead" },
  update_lead_status:    { minRole: "manager",    description: "update a lead's status or pipeline stage" },
  move_lead_stage:       { minRole: "manager",    description: "move a lead to a different pipeline stage" },
  mark_attendance:       { minRole: "instructor", description: "mark student attendance" },
  send_sms_blast:        { minRole: "manager",    description: "send an SMS blast" },

  // ── Read ─────────────────────────────────────────────────────────────────
  search_students:       { minRole: "front_desk", description: "search students" },
  get_student_count:     { minRole: "front_desk", description: "get student count" },
  get_at_risk_students:  { minRole: "instructor", description: "view at-risk students" },
  search_leads:          { minRole: "front_desk", description: "search leads" },
  get_new_leads:         { minRole: "front_desk", description: "view new leads" },
  list_classes:          { minRole: "front_desk", description: "list classes" },
  get_class_roster:      { minRole: "instructor", description: "view class roster" },
  get_attendance_summary:{ minRole: "instructor", description: "view attendance summary" },
  get_revenue_summary:   { minRole: "manager",    description: "view revenue summary" },
  update_user_name:      { minRole: "front_desk", description: "update display name" },
};

/**
 * Check whether a user with the given role is allowed to execute a Kai action.
 * Returns { allowed: true } or { allowed: false, reason: string }
 */
export function checkKaiPermission(
  userRole: string,
  actionName: string
): { allowed: true } | { allowed: false; reason: string } {
  const perm = KAI_ACTION_PERMISSIONS[actionName];
  if (!perm) {
    // Unknown action — allow by default (read-only lookup)
    return { allowed: true };
  }

  const userRank = rank(userRole);
  const requiredRank = rank(perm.minRole);

  if (userRank >= requiredRank) {
    return { allowed: true };
  }

  const roleLabel = (userRole || "staff").replace(/_/g, " ");
  const requiredLabel = perm.minRole.replace(/_/g, " ");

  return {
    allowed: false,
    reason: `**Permission denied.** Your role is **${roleLabel}**, but this action requires **${requiredLabel}** or higher.\n\nTo ${perm.description}, please ask an Admin or Owner to perform this action, or contact your school administrator.`,
  };
}

/**
 * Get a user's effective role from the context object.
 * Checks organization_users first, then falls back to users.role.
 */
export async function getUserRole(ctx: any): Promise<StaffRole> {
  try {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) return "staff";

    const userId = ctx?.user?.id;
    const orgId = ctx?.user?.organizationId;
    if (!userId || !orgId) return "staff";

    // Check organization_users for this user+org combo
    const { organizationUsers } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    const [ouRow] = await db
      .select({ role: organizationUsers.role })
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.userId, userId),
          eq(organizationUsers.organizationId, orgId)
        )
      )
      .limit(1);

    if (ouRow?.role) return ouRow.role as StaffRole;

    // Fallback: users.role
    const { users } = await import("../drizzle/schema");
    const [uRow] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return (uRow?.role as StaffRole) || "staff";
  } catch {
    return "staff";
  }
}
