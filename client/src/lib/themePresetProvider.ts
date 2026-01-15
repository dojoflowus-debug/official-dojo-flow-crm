/**
 * themePresetProvider - Core theme preset state management with localStorage persistence
 * Features: atomic updates, custom tracking, reset functionality, validation
 */

import { MOOD_PRESETS, KioskConfig } from '../../../shared/kioskConfig';

export interface ThemePresetState {
  selectedPresetKey: string;
  isCustom: boolean;
  themeValues: any;
  lastModified: string;
}

const STORAGE_PREFIX = 'theme_preset';

/**
 * Build a complete theme object from a preset, ensuring all properties are present
 */
export function buildCompleteThemeObject(preset: any): any {
  return {
    cardStyle: {
      opacity: preset.cardStyle?.opacity ?? 0.85,
      blur: preset.cardStyle?.blur ?? 12,
      backgroundColor: preset.cardStyle?.backgroundColor ?? 'rgba(255, 255, 255, 0.1)',
      borderColor: preset.cardStyle?.borderColor ?? 'rgba(255, 255, 255, 0.2)',
      borderWidth: preset.cardStyle?.borderWidth ?? 1,
      shadowColor: preset.cardStyle?.shadowColor ?? 'rgba(0, 0, 0, 0.3)',
      shadowBlur: preset.cardStyle?.shadowBlur ?? 16,
      shadowSpread: preset.cardStyle?.shadowSpread ?? 0,
      borderRadius: preset.cardStyle?.borderRadius ?? 16,
    },
    typographySystem: {
      fontFamily: preset.typography?.fontFamily ?? 'Inter',
      titleSize: preset.typography?.titleSize ?? 32,
      subtitleSize: preset.typography?.subtitleSize ?? 18,
      bodySize: preset.typography?.bodySize ?? 16,
      captionSize: preset.typography?.captionSize ?? 12,
      titleWeight: preset.typography?.titleWeight ?? 700,
      subtitleWeight: preset.typography?.subtitleWeight ?? 600,
      bodyWeight: preset.typography?.bodyWeight ?? 400,
      captionWeight: preset.typography?.captionWeight ?? 500,
      titleColor: preset.typography?.titleColor ?? '#ffffff',
      subtitleColor: preset.typography?.subtitleColor ?? '#f5f5f5',
      bodyColor: preset.typography?.bodyColor ?? '#e0e0e0',
      captionColor: preset.typography?.captionColor ?? '#a0a0a0',
    },
    accentSystem: {
      primaryAccent: preset.accentColor ?? '#ef4444',
      secondaryAccent: preset.secondaryAccent ?? '#f97316',
      accentOpacity: preset.accentOpacity ?? 1,
    },
    backgroundIntelligence: {
      type: preset.background?.type ?? 'solid',
      color: preset.background?.color ?? '#ffffff',
      blur: preset.background?.blur ?? 0,
      dim: preset.background?.dim ?? 0,
      imageUrl: preset.background?.imageUrl,
    },
    uiControls: {
      buttonRadius: preset.uiControls?.buttonRadius ?? 12,
      buttonPadding: preset.uiControls?.buttonPadding ?? 12,
      inputRadius: preset.uiControls?.inputRadius ?? 8,
      transitionDuration: preset.uiControls?.transitionDuration ?? 300,
    },
  };
}

/**
 * Load preset state from localStorage with fallback to defaults
 */
export function loadThemePresetState(locationId: string | number, deviceType: string): ThemePresetState {
  const key = `${STORAGE_PREFIX}_${locationId}_${deviceType}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        selectedPresetKey: parsed.selectedPresetKey || 'dojo-dark',
        isCustom: parsed.isCustom || false,
        themeValues: parsed.themeValues || buildCompleteThemeObject(MOOD_PRESETS['dojo-dark']),
        lastModified: parsed.lastModified || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn(`Failed to load theme preset for ${key}:`, err);
  }

  // Return defaults
  return {
    selectedPresetKey: 'dojo-dark',
    isCustom: false,
    themeValues: buildCompleteThemeObject(MOOD_PRESETS['dojo-dark']),
    lastModified: new Date().toISOString(),
  };
}

/**
 * Save preset state to localStorage
 */
export function saveThemePresetState(locationId: string | number, deviceType: string, state: ThemePresetState): void {
  const key = `${STORAGE_PREFIX}_${locationId}_${deviceType}`;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (err) {
    console.error(`Failed to save theme preset for ${key}:`, err);
  }
}

/**
 * Apply a preset atomically (single state update)
 */
export function applyPreset(presetKey: string): ThemePresetState {
  const preset = MOOD_PRESETS[presetKey] || MOOD_PRESETS['dojo-dark'];
  return {
    selectedPresetKey: presetKey,
    isCustom: false,
    themeValues: buildCompleteThemeObject(preset),
    lastModified: new Date().toISOString(),
  };
}

/**
 * Mark theme as custom (user has modified it)
 */
export function markAsCustom(state: ThemePresetState): ThemePresetState {
  return {
    ...state,
    isCustom: true,
    lastModified: new Date().toISOString(),
  };
}

/**
 * Update a single theme value and mark as custom
 */
export function updateThemeValue(state: ThemePresetState, path: string, value: any): ThemePresetState {
  const keys = path.split('.');
  const updated = JSON.parse(JSON.stringify(state.themeValues));

  let current = updated;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;

  return {
    ...state,
    themeValues: updated,
    isCustom: true,
    lastModified: new Date().toISOString(),
  };
}

/**
 * Reset a section to preset defaults
 */
export function resetSection(state: ThemePresetState, section: string): ThemePresetState {
  const preset = MOOD_PRESETS[state.selectedPresetKey] || MOOD_PRESETS['dojo-dark'];
  const completeTheme = buildCompleteThemeObject(preset);

  const updated = JSON.parse(JSON.stringify(state.themeValues));
  if (section === 'cardStyle') {
    updated.cardStyle = completeTheme.cardStyle;
  } else if (section === 'typographySystem') {
    updated.typographySystem = completeTheme.typographySystem;
  } else if (section === 'accentSystem') {
    updated.accentSystem = completeTheme.accentSystem;
  } else if (section === 'backgroundIntelligence') {
    updated.backgroundIntelligence = completeTheme.backgroundIntelligence;
  } else if (section === 'uiControls') {
    updated.uiControls = completeTheme.uiControls;
  }

  return {
    ...state,
    themeValues: updated,
    isCustom: false,
    lastModified: new Date().toISOString(),
  };
}

/**
 * Reset entire theme to preset defaults
 */
export function resetAllToPreset(state: ThemePresetState): ThemePresetState {
  const preset = MOOD_PRESETS[state.selectedPresetKey] || MOOD_PRESETS['dojo-dark'];
  return {
    selectedPresetKey: state.selectedPresetKey,
    isCustom: false,
    themeValues: buildCompleteThemeObject(preset),
    lastModified: new Date().toISOString(),
  };
}

/**
 * Merge theme values into kiosk config
 */
export function mergeThemeIntoConfig(config: any, state: ThemePresetState): any {
  return {
    ...config,
    ...state.themeValues,
  };
}
