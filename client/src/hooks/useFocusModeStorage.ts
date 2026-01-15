/**
 * useFocusModeStorage Hook
 * 
 * Provides localStorage persistence for Focus Mode state.
 * Syncs with FocusModeContext for consistent state management.
 */

import { useEffect, useCallback } from 'react';
import { useFocusMode } from '@/contexts/FocusModeContext';

const FOCUS_MODE_KEY = 'dojoflow_focus_mode';

export function useFocusModeStorage() {
  const { isFocusMode, setFocusMode } = useFocusMode();

  // Initialize from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(FOCUS_MODE_KEY);
    if (saved === 'true') {
      setFocusMode(true);
    }
  }, []);

  // Persist to localStorage when state changes
  useEffect(() => {
    localStorage.setItem(FOCUS_MODE_KEY, isFocusMode.toString());
  }, [isFocusMode]);

  const toggleFocusMode = useCallback(() => {
    setFocusMode(!isFocusMode);
  }, [isFocusMode, setFocusMode]);

  const enableFocusMode = useCallback(() => {
    setFocusMode(true);
  }, [setFocusMode]);

  const disableFocusMode = useCallback(() => {
    setFocusMode(false);
  }, [setFocusMode]);

  return {
    isFocusMode,
    toggleFocusMode,
    enableFocusMode,
    disableFocusMode,
  };
}
