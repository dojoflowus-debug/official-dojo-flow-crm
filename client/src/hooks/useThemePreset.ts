/**
 * useThemePreset - React hook for managing theme presets with localStorage persistence
 * Features: atomic updates, custom tracking, reset functionality
 */

import { useEffect, useState, useCallback } from 'react';
import { MOOD_PRESETS } from '../../../shared/kioskConfig';
import {
  loadThemePresetState,
  saveThemePresetState,
  applyPreset,
  markAsCustom,
  resetAllToPreset,
  resetSection,
  updateThemeValue,
  type ThemePresetState,
} from '@/lib/themePresetProvider';

interface UseThemePresetOptions {
  locationId: string | number;
  deviceType: string;
  defaultPresetKey?: string;
  onThemeChange?: (themeValues: any) => void;
}

export function useThemePreset(options: UseThemePresetOptions) {
  const {
    locationId,
    deviceType,
    defaultPresetKey = 'dojo-dark',
    onThemeChange,
  } = options;

  const [state, setState] = useState<ThemePresetState>(() => {
    // Load from localStorage on initial render
    const stored = loadThemePresetState(locationId, deviceType);
    return stored;
  });

  // Persist state whenever it changes
  useEffect(() => {
    saveThemePresetState(locationId, deviceType, state);
  }, [state, locationId, deviceType]);

  // Notify parent when theme values change
  useEffect(() => {
    if (onThemeChange) {
      onThemeChange(state.themeValues);
    }
  }, [state.themeValues, onThemeChange]);

  const selectPreset = useCallback((presetKey: string) => {
    const newState = applyPreset(presetKey);
    setState(newState);
  }, []);

  const markCustom = useCallback(() => {
    setState(prev => markAsCustom(prev));
  }, []);

  const updateValue = useCallback((path: string, value: any) => {
    setState(prev => updateThemeValue(prev, path, value));
  }, []);

  const resetSectionToPreset = useCallback((section: string) => {
    setState(prev => resetSection(prev, section));
  }, []);

  const resetAllToDefault = useCallback(() => {
    setState(prev => resetAllToPreset(prev));
  }, []);

  const getCurrentPreset = useCallback(() => {
    return MOOD_PRESETS[state.selectedPresetKey] || MOOD_PRESETS['dojo-dark'];
  }, [state.selectedPresetKey]);

  const getCustomBadge = useCallback(() => {
    return state.isCustom ? 'Custom' : state.selectedPresetKey;
  }, [state.isCustom, state.selectedPresetKey]);

  return {
    // State
    selectedPresetKey: state.selectedPresetKey,
    isCustom: state.isCustom,
    themeValues: state.themeValues,
    lastModified: state.lastModified,

    // Actions
    selectPreset,
    markCustom,
    updateValue,
    resetSectionToPreset,
    resetAllToDefault,
    getCurrentPreset,
    getCustomBadge,
  };
}
