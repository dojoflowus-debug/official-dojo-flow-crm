/**
 * Avatar Helper - Single source of truth for avatar rendering
 * Ensures consistent avatar display across the application
 */

export interface User {
  id?: number
  name?: string
  email?: string
  photoUrl?: string
  photoUrlSmall?: string
}

/**
 * Get avatar URL with cache busting support
 * @param user - User object containing photoUrl
 * @param cacheBust - If true, appends timestamp to prevent caching
 * @returns Avatar URL or null if no photo
 */
export function getUserAvatarUrl(user: User | null | undefined, cacheBust = false): string | null {
  if (!user?.photoUrl) return null
  
  // Add cache busting parameter if needed (after successful upload)
  if (cacheBust) {
    const separator = user.photoUrl.includes('?') ? '&' : '?'
    return `${user.photoUrl}${separator}t=${Date.now()}`
  }
  
  return user.photoUrl
}

/**
 * Get user initials for avatar fallback
 * @param user - User object
 * @returns Two-letter initials
 */
export function getUserInitials(user: User | null | undefined): string {
  if (!user) return 'U'
  
  // Try name first, then email prefix
  const displayName = user.name || user.email?.split('@')[0]
  if (!displayName) return 'U'
  
  const names = displayName.split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }
  
  return displayName.substring(0, 2).toUpperCase()
}

/**
 * Get display name with fallback
 * @param user - User object
 * @returns Display name
 */
export function getDisplayName(user: User | null | undefined): string {
  if (!user) return 'User'
  if (user.name) return user.name
  if (user.email) return user.email.split('@')[0]
  return 'User'
}
