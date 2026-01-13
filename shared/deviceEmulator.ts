/**
 * Device Emulator Types and Constants
 * Defines all supported device presets for kiosk preview testing
 */

export type DeviceOrientation = 'portrait' | 'landscape';
export type ZoomLevel = 50 | 75 | 100 | 'fit';

export interface DevicePreset {
  id: string;
  name: string;
  category: 'kiosk' | 'sanity-check';
  width: number;
  height: number;
  supportedOrientations: DeviceOrientation[];
  defaultOrientation: DeviceOrientation;
  description?: string;
  safeAreaInsets?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface DeviceEmulatorState {
  deviceId: string;
  orientation: DeviceOrientation;
  zoomLevel: ZoomLevel;
  showFrame: boolean;
  simulateTouch: boolean;
}

/**
 * All supported device presets
 * Organized by category: kiosk-first (priority) and sanity checks (secondary)
 */
export const DEVICE_PRESETS: Record<string, DevicePreset> = {
  // Kiosk-first (priority)
  'ipad-10-2': {
    id: 'ipad-10-2',
    name: 'iPad 10.2"',
    category: 'kiosk',
    width: 810,
    height: 1080,
    supportedOrientations: ['portrait', 'landscape'],
    defaultOrientation: 'portrait',
    description: 'iPad 10.2" Gen - Common kiosk display',
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  'ipad-pro-12-9': {
    id: 'ipad-pro-12-9',
    name: 'iPad Pro 12.9"',
    category: 'kiosk',
    width: 1024,
    height: 1366,
    supportedOrientations: ['portrait', 'landscape'],
    defaultOrientation: 'portrait',
    description: 'iPad Pro 12.9" - Premium kiosk display',
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  'touch-kiosk-1080p': {
    id: 'touch-kiosk-1080p',
    name: 'Touch Kiosk 1080p',
    category: 'kiosk',
    width: 1920,
    height: 1080,
    supportedOrientations: ['landscape'],
    defaultOrientation: 'landscape',
    description: 'Full HD touch kiosk - Standard resolution',
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  'touch-kiosk-4k': {
    id: 'touch-kiosk-4k',
    name: 'Touch Kiosk 4K',
    category: 'kiosk',
    width: 3840,
    height: 2160,
    supportedOrientations: ['landscape'],
    defaultOrientation: 'landscape',
    description: '4K touch kiosk - High resolution',
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  },

  // Quick sanity checks (secondary)
  'iphone-14': {
    id: 'iphone-14',
    name: 'iPhone 14',
    category: 'sanity-check',
    width: 390,
    height: 844,
    supportedOrientations: ['portrait', 'landscape'],
    defaultOrientation: 'portrait',
    description: 'iPhone 14 - Sanity check for mobile',
    safeAreaInsets: { top: 47, bottom: 34, left: 0, right: 0 },
  },
  'android-large': {
    id: 'android-large',
    name: 'Android Large',
    category: 'sanity-check',
    width: 412,
    height: 915,
    supportedOrientations: ['portrait', 'landscape'],
    defaultOrientation: 'portrait',
    description: 'Android Large - Sanity check for Android',
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  'laptop': {
    id: 'laptop',
    name: 'Laptop',
    category: 'sanity-check',
    width: 1440,
    height: 900,
    supportedOrientations: ['landscape'],
    defaultOrientation: 'landscape',
    description: 'Laptop - Sanity check for desktop',
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  'desktop': {
    id: 'desktop',
    name: 'Desktop',
    category: 'sanity-check',
    width: 1920,
    height: 1080,
    supportedOrientations: ['landscape'],
    defaultOrientation: 'landscape',
    description: 'Desktop 1080p - Sanity check for desktop',
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  },
};

/**
 * Get device preset by ID
 */
export function getDevicePreset(deviceId: string): DevicePreset | undefined {
  return DEVICE_PRESETS[deviceId];
}

/**
 * Get all kiosk-first devices
 */
export function getKioskDevices(): DevicePreset[] {
  return Object.values(DEVICE_PRESETS).filter(d => d.category === 'kiosk');
}

/**
 * Get all sanity check devices
 */
export function getSanityCheckDevices(): DevicePreset[] {
  return Object.values(DEVICE_PRESETS).filter(d => d.category === 'sanity-check');
}

/**
 * Get default device based on kiosk type
 */
export function getDefaultDevice(kioskType?: string): string {
  // Default to Touch Kiosk 1080p for kiosk type
  if (kioskType === 'kiosk') {
    return 'touch-kiosk-1080p';
  }
  // Default to iPad 10.2" portrait for other types
  return 'ipad-10-2';
}

/**
 * Calculate viewport dimensions after rotation
 */
export function getViewportDimensions(
  preset: DevicePreset,
  orientation: DeviceOrientation
): { width: number; height: number } {
  if (orientation === 'landscape' && preset.supportedOrientations.includes('landscape')) {
    // Swap dimensions for landscape
    return { width: preset.height, height: preset.width };
  }
  return { width: preset.width, height: preset.height };
}

/**
 * Calculate scale factor for zoom level
 */
export function getZoomScale(zoomLevel: ZoomLevel, containerWidth: number, deviceWidth: number): number {
  if (zoomLevel === 'fit') {
    return containerWidth / deviceWidth;
  }
  return zoomLevel / 100;
}

/**
 * Generate localStorage key for device emulator state
 */
export function getEmulatorStateKey(orgId: number, locationId: number, kioskId: number): string {
  return `kiosk-emulator:${orgId}:${locationId}:${kioskId}`;
}

/**
 * Default emulator state
 */
export function getDefaultEmulatorState(deviceId: string): DeviceEmulatorState {
  const preset = getDevicePreset(deviceId);
  if (!preset) {
    return {
      deviceId: 'touch-kiosk-1080p',
      orientation: 'landscape',
      zoomLevel: 'fit',
      showFrame: true,
      simulateTouch: false,
    };
  }

  return {
    deviceId,
    orientation: preset.defaultOrientation,
    zoomLevel: 'fit',
    showFrame: true,
    simulateTouch: preset.category === 'kiosk',
  };
}
