import { useState, useEffect, useCallback } from 'react';
import {
  DeviceEmulatorState,
  DeviceOrientation,
  ZoomLevel,
  getDevicePreset,
  getDefaultDevice,
  getDefaultEmulatorState,
  getEmulatorStateKey,
  DEVICE_PRESETS,
} from '../../../shared/deviceEmulator';

/**
 * Hook for managing device emulator state with localStorage persistence
 */
export function useDeviceEmulator(
  orgId: number,
  locationId: number,
  kioskId: number,
  kioskType?: string
) {
  const stateKey = getEmulatorStateKey(orgId, locationId, kioskId);
  const defaultDeviceId = getDefaultDevice(kioskType);

  // Initialize state from localStorage or defaults
  const [state, setState] = useState<DeviceEmulatorState>(() => {
    try {
      const stored = localStorage.getItem(stateKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate that device still exists
        if (DEVICE_PRESETS[parsed.deviceId]) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load emulator state from localStorage:', e);
    }

    return getDefaultEmulatorState(defaultDeviceId);
  });

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(stateKey, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save emulator state to localStorage:', e);
    }
  }, [state, stateKey]);

  // Change device
  const setDevice = useCallback((deviceId: string) => {
    const preset = getDevicePreset(deviceId);
    if (!preset) return;

    setState(prev => ({
      ...prev,
      deviceId,
      // Reset orientation to default if current orientation not supported
      orientation: preset.supportedOrientations.includes(prev.orientation)
        ? prev.orientation
        : preset.defaultOrientation,
    }));
  }, []);

  // Toggle orientation
  const toggleOrientation = useCallback(() => {
    const preset = getDevicePreset(state.deviceId);
    if (!preset || preset.supportedOrientations.length < 2) return;

    const newOrientation: DeviceOrientation = state.orientation === 'portrait' ? 'landscape' : 'portrait';
    if (preset.supportedOrientations.includes(newOrientation)) {
      setState(prev => ({ ...prev, orientation: newOrientation }));
    }
  }, [state.deviceId]);

  // Set zoom level
  const setZoomLevel = useCallback((zoomLevel: ZoomLevel) => {
    setState(prev => ({ ...prev, zoomLevel }));
  }, []);

  // Toggle frame
  const toggleFrame = useCallback(() => {
    setState(prev => ({ ...prev, showFrame: !prev.showFrame }));
  }, []);

  // Toggle touch simulation
  const toggleSimulateTouch = useCallback(() => {
    setState(prev => ({ ...prev, simulateTouch: !prev.simulateTouch }));
  }, []);

  // Get current device preset
  const currentPreset = getDevicePreset(state.deviceId);

  return {
    state,
    currentPreset,
    setDevice,
    toggleOrientation,
    setZoomLevel,
    toggleFrame,
    toggleSimulateTouch,
  };
}
