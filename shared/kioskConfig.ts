/**
 * Unified Kiosk Configuration Type - Premium Design System
 * Single source of truth for all kiosk settings across editor, DB, and runtime
 * Supports luxury, kids, zen, dark, and minimal kiosk designs
 */

// ============================================================================
// CARD & PANEL STYLES
// ============================================================================

export interface CardStyle {
  // Background type
  backgroundType: 'solid' | 'glass' | 'dark-glass' | 'transparent';
  
  // Glass morphism properties
  opacity: number; // 0-100%
  blur: number; // 0-30px
  saturate: number; // 80-150%
  
  // Visual properties
  borderStrength: number; // 0-100% (controls border opacity)
  shadowDepth: number; // 0-100% (controls shadow intensity)
  cornerRadius: number; // 0-32px
  
  // Colors
  backgroundColor: string; // Hex color
  borderColor: string; // Hex color
  shadowColor: string; // Hex color
}

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

export interface TypographyConfig {
  // Font selection
  fontFamily: string; // System or premium font
  fontWeight: number; // 400-900
  letterSpacing: number; // -2 to 4px
  
  // Text colors
  headerColor: string; // Hex
  bodyColor: string; // Hex
  buttonTextColor: string; // Hex
  timeWidgetColor: string; // Hex
  
  // Text effects
  enableGlow: boolean; // Soft glow on text
  glowColor: string; // Hex
  glowBlur: number; // 0-20px
  
  enableShadow: boolean; // Text shadow
  shadowColor: string; // Hex
  shadowBlur: number; // 0-10px
  
  // Font sizes
  titleSize: number; // px (24-72)
  titleWeight: number; // 400-900
  subtitleSize: number; // px (14-48)
  buttonFontSize: number; // px (12-24)
}

// ============================================================================
// ACCENT & MOOD SYSTEM
// ============================================================================

export interface AccentSystem {
  // Primary accent
  primaryAccent: string; // Hex color (main buttons, highlights)
  
  // Secondary accent
  secondaryAccent: string; // Hex color (secondary actions)
  
  // Glow color (for glass effects)
  glowColor: string; // Hex color
  
  // Divider color
  dividerColor: string; // Hex color
  
  // Current mood preset
  moodPreset: 'dojo-dark' | 'kids-bright' | 'zen' | 'luxury' | 'high-contrast' | 'minimal' | 'custom';
}

// Mood preset definitions
export interface MoodPreset {
  name: string;
  description: string;
  cardStyle: CardStyle;
  typography: TypographyConfig;
  accent: AccentSystem;
  background: {
    blur: number;
    vignette: number;
    warmth: number;
    overlay: number;
  };
  uiControls: UIControls;
}

// ============================================================================
// BACKGROUND INTELLIGENCE
// ============================================================================

export interface BackgroundConfig {
  type: 'solid' | 'preset' | 'custom';
  color: string; // Hex color for solid backgrounds
  presetKey: string | null; // Preset identifier
  customUrl: string | null; // Custom image URL
  
  // Fit modes
  fit: 'cover' | 'contain' | 'stretch' | 'parallax' | 'cinematic-crop';
  
  // Effects
  blur: number; // 0-24px
  dim: number; // 0-100% (dark overlay)
  vignette: number; // 0-100% (edge darkening)
  warmth: number; // -50 to 50 (color temperature)
  
  // Parallax effect
  parallaxIntensity: number; // 0-100%
}

// ============================================================================
// KIOSK UI CONTROLS
// ============================================================================

export interface UIControls {
  // Button styles
  buttonStyle: 'soft' | 'pill' | 'glass' | 'solid';
  buttonGlowStrength: number; // 0-100%
  
  // Button animations
  buttonAnimation: 'none' | 'pulse' | 'breathing-glow' | 'subtle-lift';
  
  // Layout
  sectionSpacing: number; // 0-40px (gap between sections)
  gridDensity: 'compact' | 'normal' | 'spacious'; // Card grid density
  
  // Interaction
  enableHoverEffects: boolean;
  enableTouchFeedback: boolean;
}

// ============================================================================
// MAIN KIOSK CONFIG
// ============================================================================

export interface KioskConfig {
  // Theme & Colors
  theme: {
    accentColor: string; // Hex color for buttons, highlights (legacy)
    fontFamily: string; // Font family name (legacy)
  };

  // Content - Text and labels displayed on kiosk
  content: {
    headline: string;
    subtext: string;
    tileLeft: {
      title: string;
      subtitle: string;
      button: string;
    };
    tileRight: {
      title: string;
      subtitle: string;
      button: string;
    };
    infoLeftLabel: string;
    infoRightLabel: string;
  };

  // Typography - Font sizes and weights (legacy)
  typography: {
    titleSize: number;
    titleWeight: number;
    subtitleSize: number;
    letterSpacing: number;
    buttonFontSize: number;
  };

  // Layout - Display options
  layout: {
    showClock: boolean;
    showInfoBar: boolean;
  };

  // Background - Image, color, effects
  background: {
    type: 'solid' | 'preset' | 'custom';
    color: string;
    presetKey: string | null;
    customUrl: string | null;
    blur: number;
    dim: number;
    fit: 'cover' | 'contain' | 'stretch';
  };

  // Behavior - Kiosk interaction settings
  behavior: {
    autoAdvanceSeconds?: number;
    enableSound?: boolean;
    enableHaptics?: boolean;
    showMemberLogin?: boolean;
    showNewStudent?: boolean;
    idleSeconds?: number;
  };

  // Screensaver - Idle behavior
  screensaver: {
    enabled: boolean;
    idleSeconds: number;
    message: string;
    showLogo: boolean;
  };

  // ========== NEW PREMIUM DESIGN SYSTEM ==========

  // Card & Panel Customization
  cardStyle?: CardStyle;

  // Enhanced Typography
  typographySystem?: TypographyConfig;

  // Accent & Mood System
  accentSystem?: AccentSystem;

  // Background Intelligence
  backgroundIntelligence?: BackgroundConfig;

  // Kiosk UI Controls
  uiControls?: UIControls;
}

// ============================================================================
// MOOD PRESETS
// ============================================================================

export const MOOD_PRESETS: Record<string, MoodPreset> = {
  'dojo-dark': {
    name: 'Dojo Dark',
    description: 'Premium dark cinematic aesthetic for martial arts studios',
    cardStyle: {
      backgroundType: 'dark-glass',
      opacity: 65,
      blur: 16,
      saturate: 120,
      borderStrength: 6,
      shadowDepth: 45,
      cornerRadius: 16,
      backgroundColor: 'rgba(11, 13, 16, 0.65)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      shadowColor: 'rgba(0, 0, 0, 0.45)',
    },
    typography: {
      fontFamily: 'Inter',
      fontWeight: 500,
      letterSpacing: 0,
      headerColor: '#ffffff',
      bodyColor: 'rgba(255, 255, 255, 0.8)',
      buttonTextColor: '#ffffff',
      timeWidgetColor: 'rgba(255, 255, 255, 0.9)',
      enableGlow: false,
      glowColor: '#ffffff',
      glowBlur: 0,
      enableShadow: false,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowBlur: 0,
      titleSize: 48,
      titleWeight: 700,
      subtitleSize: 24,
      buttonFontSize: 16,
    },
    accent: {
      primaryAccent: '#ef4444',
      secondaryAccent: '#f87171',
      glowColor: '#ef4444',
      dividerColor: 'rgba(255, 255, 255, 0.1)',
      moodPreset: 'dojo-dark',
    },
    background: {
      blur: 8,
      vignette: 30,
      warmth: 0,
      overlay: 20,
    },
    uiControls: {
      buttonStyle: 'glass',
      buttonGlowStrength: 0,
      buttonAnimation: 'subtle-lift',
      sectionSpacing: 24,
      gridDensity: 'normal',
      enableHoverEffects: true,
      enableTouchFeedback: true,
    },
  },

  'kids-bright': {
    name: 'Kids Bright',
    description: 'Colorful, playful design for kids classes',
    cardStyle: {
      backgroundType: 'glass',
      opacity: 90,
      blur: 12,
      saturate: 130,
      borderStrength: 20,
      shadowDepth: 20,
      cornerRadius: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      shadowColor: 'rgba(0, 0, 0, 0.1)',
    },
    typography: {
      fontFamily: 'Inter',
      fontWeight: 600,
      letterSpacing: 0.5,
      headerColor: '#1f2937',
      bodyColor: '#4b5563',
      buttonTextColor: '#ffffff',
      timeWidgetColor: '#1f2937',
      enableGlow: true,
      glowColor: '#fbbf24',
      glowBlur: 8,
      enableShadow: false,
      shadowColor: 'rgba(0, 0, 0, 0)',
      shadowBlur: 0,
      titleSize: 56,
      titleWeight: 800,
      subtitleSize: 28,
      buttonFontSize: 18,
    },
    accent: {
      primaryAccent: '#3b82f6',
      secondaryAccent: '#10b981',
      glowColor: '#fbbf24',
      dividerColor: 'rgba(59, 130, 246, 0.2)',
      moodPreset: 'kids-bright',
    },
    background: {
      blur: 0,
      vignette: 0,
      warmth: 20,
      overlay: 0,
    },
    uiControls: {
      buttonStyle: 'pill',
      buttonGlowStrength: 30,
      buttonAnimation: 'pulse',
      sectionSpacing: 32,
      gridDensity: 'spacious',
      enableHoverEffects: true,
      enableTouchFeedback: true,
    },
  },

  'zen': {
    name: 'Zen',
    description: 'Minimal, calm aesthetic for meditation and wellness',
    cardStyle: {
      backgroundType: 'transparent',
      opacity: 50,
      blur: 20,
      saturate: 100,
      borderStrength: 2,
      shadowDepth: 10,
      cornerRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      shadowColor: 'rgba(0, 0, 0, 0.05)',
    },
    typography: {
      fontFamily: 'Inter',
      fontWeight: 400,
      letterSpacing: 1,
      headerColor: 'rgba(0, 0, 0, 0.7)',
      bodyColor: 'rgba(0, 0, 0, 0.5)',
      buttonTextColor: 'rgba(0, 0, 0, 0.8)',
      timeWidgetColor: 'rgba(0, 0, 0, 0.6)',
      enableGlow: false,
      glowColor: '#ffffff',
      glowBlur: 0,
      enableShadow: false,
      shadowColor: 'rgba(0, 0, 0, 0)',
      shadowBlur: 0,
      titleSize: 40,
      titleWeight: 300,
      subtitleSize: 18,
      buttonFontSize: 14,
    },
    accent: {
      primaryAccent: '#6b7280',
      secondaryAccent: '#9ca3af',
      glowColor: '#ffffff',
      dividerColor: 'rgba(0, 0, 0, 0.1)',
      moodPreset: 'zen',
    },
    background: {
      blur: 16,
      vignette: 20,
      warmth: -10,
      overlay: 10,
    },
    uiControls: {
      buttonStyle: 'soft',
      buttonGlowStrength: 0,
      buttonAnimation: 'breathing-glow',
      sectionSpacing: 20,
      gridDensity: 'compact',
      enableHoverEffects: false,
      enableTouchFeedback: true,
    },
  },

  'luxury': {
    name: 'Luxury',
    description: 'High-end premium aesthetic for luxury gyms and studios',
    cardStyle: {
      backgroundType: 'glass',
      opacity: 75,
      blur: 18,
      saturate: 110,
      borderStrength: 8,
      shadowDepth: 60,
      cornerRadius: 8,
      backgroundColor: 'rgba(30, 30, 35, 0.75)',
      borderColor: 'rgba(215, 180, 130, 0.3)',
      shadowColor: 'rgba(0, 0, 0, 0.6)',
    },
    typography: {
      fontFamily: 'Inter',
      fontWeight: 400,
      letterSpacing: 1.5,
      headerColor: '#f5f5f5',
      bodyColor: 'rgba(245, 245, 245, 0.8)',
      buttonTextColor: '#f5f5f5',
      timeWidgetColor: 'rgba(245, 245, 245, 0.9)',
      enableGlow: true,
      glowColor: '#d7b482',
      glowBlur: 12,
      enableShadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowBlur: 8,
      titleSize: 52,
      titleWeight: 300,
      subtitleSize: 22,
      buttonFontSize: 15,
    },
    accent: {
      primaryAccent: '#d7b482',
      secondaryAccent: '#b8956a',
      glowColor: '#d7b482',
      dividerColor: 'rgba(215, 180, 130, 0.2)',
      moodPreset: 'luxury',
    },
    background: {
      blur: 12,
      vignette: 40,
      warmth: 10,
      overlay: 30,
    },
    uiControls: {
      buttonStyle: 'solid',
      buttonGlowStrength: 20,
      buttonAnimation: 'subtle-lift',
      sectionSpacing: 28,
      gridDensity: 'normal',
      enableHoverEffects: true,
      enableTouchFeedback: true,
    },
  },

  'high-contrast': {
    name: 'High Contrast',
    description: 'Maximum readability for accessibility',
    cardStyle: {
      backgroundType: 'solid',
      opacity: 100,
      blur: 0,
      saturate: 100,
      borderStrength: 100,
      shadowDepth: 30,
      cornerRadius: 4,
      backgroundColor: '#ffffff',
      borderColor: '#000000',
      shadowColor: 'rgba(0, 0, 0, 0.3)',
    },
    typography: {
      fontFamily: 'Inter',
      fontWeight: 700,
      letterSpacing: 0,
      headerColor: '#000000',
      bodyColor: '#000000',
      buttonTextColor: '#ffffff',
      timeWidgetColor: '#000000',
      enableGlow: false,
      glowColor: '#ffffff',
      glowBlur: 0,
      enableShadow: false,
      shadowColor: 'rgba(0, 0, 0, 0)',
      shadowBlur: 0,
      titleSize: 64,
      titleWeight: 900,
      subtitleSize: 32,
      buttonFontSize: 20,
    },
    accent: {
      primaryAccent: '#000000',
      secondaryAccent: '#333333',
      glowColor: '#000000',
      dividerColor: '#000000',
      moodPreset: 'high-contrast',
    },
    background: {
      blur: 0,
      vignette: 0,
      warmth: 0,
      overlay: 0,
    },
    uiControls: {
      buttonStyle: 'solid',
      buttonGlowStrength: 0,
      buttonAnimation: 'none',
      sectionSpacing: 16,
      gridDensity: 'spacious',
      enableHoverEffects: true,
      enableTouchFeedback: true,
    },
  },

  'minimal': {
    name: 'Minimal',
    description: 'Clean, simple aesthetic with focus on content',
    cardStyle: {
      backgroundType: 'solid',
      opacity: 100,
      blur: 0,
      saturate: 100,
      borderStrength: 0,
      shadowDepth: 5,
      cornerRadius: 0,
      backgroundColor: '#ffffff',
      borderColor: 'rgba(0, 0, 0, 0)',
      shadowColor: 'rgba(0, 0, 0, 0.05)',
    },
    typography: {
      fontFamily: 'Inter',
      fontWeight: 500,
      letterSpacing: 0,
      headerColor: '#1f2937',
      bodyColor: '#6b7280',
      buttonTextColor: '#ffffff',
      timeWidgetColor: '#1f2937',
      enableGlow: false,
      glowColor: '#ffffff',
      glowBlur: 0,
      enableShadow: false,
      shadowColor: 'rgba(0, 0, 0, 0)',
      shadowBlur: 0,
      titleSize: 44,
      titleWeight: 600,
      subtitleSize: 20,
      buttonFontSize: 16,
    },
    accent: {
      primaryAccent: '#111827',
      secondaryAccent: '#6b7280',
      glowColor: '#ffffff',
      dividerColor: 'rgba(0, 0, 0, 0.1)',
      moodPreset: 'minimal',
    },
    background: {
      blur: 0,
      vignette: 0,
      warmth: 0,
      overlay: 0,
    },
    uiControls: {
      buttonStyle: 'solid',
      buttonGlowStrength: 0,
      buttonAnimation: 'none',
      sectionSpacing: 16,
      gridDensity: 'compact',
      enableHoverEffects: false,
      enableTouchFeedback: true,
    },
  },
};

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
    type: 'solid',
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
  // Premium design system defaults
  cardStyle: MOOD_PRESETS['dojo-dark'].cardStyle,
  typographySystem: MOOD_PRESETS['dojo-dark'].typography,
  accentSystem: MOOD_PRESETS['dojo-dark'].accent,
  backgroundIntelligence: {
    type: 'preset',
    color: '#000000',
    presetKey: 'dojo-warm-lights',
    customUrl: null,
    fit: 'cover',
    blur: 8,
    dim: 20,
    vignette: 30,
    warmth: 0,
    parallaxIntensity: 0,
  },
  uiControls: MOOD_PRESETS['dojo-dark'].uiControls,
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
  draftSavedAt?: string;
  publishedAt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
