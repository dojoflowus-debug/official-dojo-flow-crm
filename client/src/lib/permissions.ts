/**
 * Permission constants for student deletion system
 */

export const DELETION_PERMISSIONS = {
  REQUEST: 'students.delete.request',
  APPROVE: 'students.delete.approve',
  EXECUTE: 'students.delete.execute',
  VIEW_REQUESTS: 'students.delete.viewRequests',
} as const;

/**
 * Default permissions by role
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  instructor: [],
  manager: [DELETION_PERMISSIONS.REQUEST, DELETION_PERMISSIONS.VIEW_REQUESTS],
  owner: [
    DELETION_PERMISSIONS.REQUEST,
    DELETION_PERMISSIONS.APPROVE,
    DELETION_PERMISSIONS.EXECUTE,
    DELETION_PERMISSIONS.VIEW_REQUESTS,
  ],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(userPermissions: string[] | undefined, permission: string): boolean {
  return userPermissions?.includes(permission) ?? false;
}

/**
 * Check if user can request deletion
 */
export function canRequestDeletion(userPermissions: string[] | undefined): boolean {
  return hasPermission(userPermissions, DELETION_PERMISSIONS.REQUEST);
}

/**
 * Check if user can approve deletion
 */
export function canApproveDeletion(userPermissions: string[] | undefined): boolean {
  return hasPermission(userPermissions, DELETION_PERMISSIONS.APPROVE);
}

/**
 * Check if user can view deletion requests
 */
export function canViewDeletionRequests(userPermissions: string[] | undefined): boolean {
  return hasPermission(userPermissions, DELETION_PERMISSIONS.VIEW_REQUESTS);
}
