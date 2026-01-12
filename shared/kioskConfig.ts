/**
 * Unified Kiosk Configuration Type
 * Single source of truth for all kiosk settings across editor, DB, and runtime
 */

export interface KioskConfig {
  // Theme & Colors
  theme: {
    accentColor: string; // Hex color for buttons, highlights
    fontFamily: string; // Font family name
  };

  // Content - Text and labels displayed on kiosk
  content: {
    headline: string; // Main title (e.g., "Welcome to Training")
    subtext: string; // Subtitle (e.g., "Tap to begin")
    tileLeft: {
      title: string; // e.g., "Check In"
      subtitle: string; // e.g., "Tap here to check into class"
      button: string; // Button label
    };
    tileRight: {
      title: string; // e.g., "Start Training"
      subtitle: string; // e.g., "New students start here"
      button: string; // Button label
    };
    infoLeftLabel: string; // e.g., "Next Class"
    infoRightLabel: string; // e.g., "Today's Focus"
  };

  // Typography - Font sizes and weights
  typography: {
    titleSize: number; // px (24-72)
    titleWeight: number; // 400-900
    subtitleSize: number; // px (14-48)
    letterSpacing: number; // px (-2 to 4)
    buttonFontSize: number; // px (12-24)
  };

  // Layout - Display options
  layout: {
    showClock: boolean; // Show time display
    showInfoBar: boolean; // Show next class and today's focus
  };

  // Background - Image, color, effects
  background: {
    type: 'color' | 'image' | 'preset' | 'custom'; // Background type
    color: string; // Hex color for solid backgrounds
    presetKey: string | null; // Preset identifier (e.g., 'dojo-warm-lights')
    customUrl: string | null; // Custom image URL
    blur: number; // Blur amount (0-24)
    dim: number; // Dim/overlay amount (0-100)
    fit: 'cover' | 'contain' | 'stretch'; // Image fit mode
  };

  // Behavior - Kiosk interaction settings
  behavior: {
    autoAdvanceSeconds?: number; // Auto-advance to next screen
    enableSound?: boolean; // Enable audio feedback
    enableHaptics?: boolean; // Enable haptic feedback
    showMemberLogin?: boolean; // Show member login button
    showNewStudent?: boolean; // Show new student button
    idleSeconds?: number; // Idle timeout before screensaver (in seconds)
  };

  // Screensaver - Idle behavior
  screensaver: {
    enabled: boolean; // Show screensaver on idle
    idleSeconds: number; // Seconds before screensaver appears
    message: string; // Message to display
    showLogo: boolean; // Show logo on screensaver
  }
}

/**
 * Default kiosk configuration
 */
export const DEFAULT_KIOSK_CONFIG: KioskConfig = {
  theme: {
    accentColor: '#ef4444',
    fontFamily: 'Inter',
  },
  content: {
    headline: 'Welcome to Training',
    subtext: 'Tap to begin',
    tileLeft: {
      title: 'Check In',
      subtitle: 'Tap here to check into class',
      button: 'Check In',
    },
    tileRight: {
      title: 'Start Training',
      subtitle: 'New students start here',
      button: 'Start Training',
    },
    infoLeftLabel: 'Next Class',
    infoRightLabel: "Today's Focus",
  },
  typography: {
    titleSize: 48,
    titleWeight: 700,
    subtitleSize: 24,
    letterSpacing: 0,
    buttonFontSize: 16,
  },
  layout: {
    showClock: true,
    showInfoBar: true,
  },
  background: {
    type: 'color',
    color: '#ffffff',
    presetKey: null,
    customUrl: null,
    blur: 0,
    dim: 0,
    fit: 'cover',
  },
  behavior: {
    autoAdvanceSeconds: undefined,
    enableSound: false,
    enableHaptics: false,
    showMemberLogin: true,
    showNewStudent: true,
    idleSeconds: 60,
  },
  screensaver: {
    enabled: true,
    idleSeconds: 60,
    message: 'Tap the screen to check-in',
    showLogo: true,
  },
};

/**
 * Kiosk location with draft/published configs
 */
export interface KioskLocation {
  id: number;
  name: string;
  slug: string;
  isEnabled: boolean;
  draft: KioskConfig;
  published: KioskConfig;
  draftSavedAt?: string; // ISO timestamp
  publishedAt?: string; // ISO timestamp
  version: number; // Incremented on publish
  createdAt: string;
  updatedAt: string;
}
