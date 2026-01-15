/**
 * Default Kiosk Configuration
 * Used when a kiosk has no config or config is empty
 * Includes: background, cards, buttons, logo placeholder
 */

export const DEFAULT_KIOSK_CONFIG = {
  moodPreset: 'dojo-dark',
  cardStyle: {
    opacity: 0.9,
    blur: 15,
    frostAmount: 16,
    saturation: 14,
    border: 'ON',
    borderColor: '#ffffff',
  },
  typography: {
    fontFamily: 'Noto Sans',
    fontSize: 16,
    fontWeight: 400,
  },
  buttonStyling: {
    borderRadius: 24,
    backgroundColor: '#ef4444',
    textColor: '#ffffff',
    fontSize: 16,
    fontWeight: 600,
  },
  backgroundTheme: 'martial-arts-dojo',
  blur: 0,
  dim: 0,
  accentColor: '#ef4444',
  
  // Layout: Cards to display
  layout: {
    cards: [
      {
        id: 'check-in',
        title: 'Check In',
        subtitle: 'Tap here to check into class',
        icon: '✓',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        action: 'check-in',
      },
      {
        id: 'start-training',
        title: 'Start Training',
        subtitle: 'New students start here',
        icon: '+',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        action: 'start-training',
      },
    ],
    showLogo: true,
    logoUrl: null, // Will use placeholder
    showTime: true,
    showFocus: true,
  },
};

/**
 * Create a starter kiosk layout with Check In and Start Training cards
 */
export function getStarterKioskLayout() {
  return {
    ...DEFAULT_KIOSK_CONFIG,
    layout: {
      ...DEFAULT_KIOSK_CONFIG.layout,
      cards: [
        {
          id: 'check-in',
          type: 'card',
          title: 'Check In',
          subtitle: 'Tap here to check into class',
          icon: '✓',
          position: { row: 0, col: 0 },
          size: { rows: 1, cols: 1 },
          action: 'check-in',
        },
        {
          id: 'start-training',
          type: 'card',
          title: 'Start Training',
          subtitle: 'New students start here',
          icon: '+',
          position: { row: 0, col: 1 },
          size: { rows: 1, cols: 1 },
          action: 'start-training',
        },
      ],
    },
  };
}

/**
 * Ensure config has all required fields with defaults
 */
export function normalizeKioskConfig(config: any) {
  if (!config) {
    return getStarterKioskLayout();
  }

  const normalizedLayout = config.layout || DEFAULT_KIOSK_CONFIG.layout;
  
  return {
    moodPreset: config.moodPreset || DEFAULT_KIOSK_CONFIG.moodPreset,
    cardStyle: { ...DEFAULT_KIOSK_CONFIG.cardStyle, ...config.cardStyle },
    typography: { ...DEFAULT_KIOSK_CONFIG.typography, ...config.typography },
    buttonStyling: { ...DEFAULT_KIOSK_CONFIG.buttonStyling, ...config.buttonStyling },
    backgroundTheme: config.backgroundTheme || DEFAULT_KIOSK_CONFIG.backgroundTheme,
    blur: config.blur !== undefined ? config.blur : DEFAULT_KIOSK_CONFIG.blur,
    dim: config.dim !== undefined ? config.dim : DEFAULT_KIOSK_CONFIG.dim,
    accentColor: config.accentColor || DEFAULT_KIOSK_CONFIG.accentColor,
    layout: {
      ...DEFAULT_KIOSK_CONFIG.layout,
      ...normalizedLayout,
      cards: normalizedLayout?.cards || DEFAULT_KIOSK_CONFIG.layout.cards,
    },
  };
}
