/**
 * Utility functions for DojoFlow Kiosk
 */

/**
 * Get the custom avatar name from localStorage
 * Falls back to "Kai" if no custom name is set
 */
export function getAvatarName(): string {
  if (typeof window === 'undefined') {
    // Server-side: return default
    return 'Kai';
  }
  
  try {
    const savedName = localStorage.getItem('avatarName');
    return savedName || 'Kai';
  } catch (error) {
    console.warn('[getAvatarName] Error reading from localStorage:', error);
    return 'Kai';
  }
}

/**
 * Set the custom avatar name in localStorage
 */
export function setAvatarName(name: string): void {
  if (typeof window === 'undefined') {
    console.warn('[setAvatarName] Cannot set avatar name on server-side');
    return;
  }
  
  try {
    localStorage.setItem('avatarName', name);
  } catch (error) {
    console.error('[setAvatarName] Error writing to localStorage:', error);
  }
}
