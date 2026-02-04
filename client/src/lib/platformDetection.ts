/**
 * Platform Detection Utility
 * Detects the user's platform (iOS, Android, Desktop) for adaptive theming
 */

export type PlatformType = 'ios' | 'android' | 'desktop';
export type ThemeMode = 'auto' | 'apple' | 'android';

/**
 * Detects the user's platform based on user agent and platform data
 * @returns 'ios' | 'android' | 'desktop'
 */
export function getPlatformTheme(): PlatformType {
  // Try modern User-Agent Client Hints API first
  if ('userAgentData' in navigator) {
    const uaData = (navigator as any).userAgentData;
    if (uaData?.platform) {
      const platform = uaData.platform.toLowerCase();
      if (platform.includes('ios') || platform.includes('iphone') || platform.includes('ipad') || platform.includes('mac')) {
        return 'ios';
      }
      if (platform.includes('android')) {
        return 'android';
      }
    }
  }

  // Fallback to traditional navigator.platform and userAgent
  const platform = navigator.platform?.toLowerCase() || '';
  const userAgent = navigator.userAgent.toLowerCase();

  // Check for iOS devices
  if (
    platform.includes('iphone') ||
    platform.includes('ipad') ||
    platform.includes('ipod') ||
    userAgent.includes('iphone') ||
    userAgent.includes('ipad') ||
    userAgent.includes('ipod')
  ) {
    return 'ios';
  }

  // Check for macOS (treat as iOS for Apple aesthetic)
  if (
    platform.includes('mac') ||
    userAgent.includes('macintosh') ||
    userAgent.includes('mac os x')
  ) {
    return 'ios';
  }

  // Check for Android
  if (platform.includes('android') || userAgent.includes('android')) {
    return 'android';
  }

  // Default to iOS theme for desktop (clean glass aesthetic)
  return 'ios';
}

/**
 * Gets the effective theme based on user preference and platform detection
 * @param themeOverride User's theme preference ('auto' | 'apple' | 'android')
 * @returns The effective platform theme to use
 */
export function getEffectiveTheme(themeOverride: ThemeMode = 'auto'): PlatformType {
  if (themeOverride === 'apple') {
    return 'ios';
  }
  if (themeOverride === 'android') {
    return 'android';
  }
  // Auto mode: detect platform
  return getPlatformTheme();
}

/**
 * Generates initials from a name for fallback logo
 * @param name School or organization name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return 'AI';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return (words[0][0] + words[1][0]).toUpperCase();
}
