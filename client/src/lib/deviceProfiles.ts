/**
 * Device Profiles for Kiosk Studio
 * Defines unique layouts, scaling, and safe zones for each device type
 */

export type DeviceProfileType = 'front-desk' | 'wall-kiosk' | 'tablet';

export interface SafeZone {
  top: number;    // pixels from top
  bottom: number; // pixels from bottom
  left: number;   // pixels from left
  right: number;  // pixels from right
}

export interface DeviceProfile {
  id: DeviceProfileType;
  name: string;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  scale: number;
  safeZones: SafeZone;
  description: string;
  defaultLayout: {
    logoPosition: 'top' | 'center' | 'hidden';
    timePosition: 'top-right' | 'center' | 'hidden';
    cardsGridColumns: number;
    cardSize: 'small' | 'medium' | 'large';
    buttonPosition: 'bottom' | 'center';
  };
}

export const DEVICE_PROFILES: Record<DeviceProfileType, DeviceProfile> = {
  'front-desk': {
    id: 'front-desk',
    name: 'Front Desk',
    width: 1920,
    height: 1080,
    orientation: 'landscape',
    scale: 1,
    safeZones: {
      top: 80,
      bottom: 80,
      left: 100,
      right: 100,
    },
    description: 'Wall-mounted display at front desk (1920x1080 landscape)',
    defaultLayout: {
      logoPosition: 'top',
      timePosition: 'top-right',
      cardsGridColumns: 3,
      cardSize: 'large',
      buttonPosition: 'bottom',
    },
  },
  'wall-kiosk': {
    id: 'wall-kiosk',
    name: 'Wall Kiosk',
    width: 1920,
    height: 1080,
    orientation: 'landscape',
    scale: 1,
    safeZones: {
      top: 60,
      bottom: 60,
      left: 80,
      right: 80,
    },
    description: 'Interactive wall-mounted kiosk (1920x1080 landscape)',
    defaultLayout: {
      logoPosition: 'center',
      timePosition: 'top-right',
      cardsGridColumns: 2,
      cardSize: 'large',
      buttonPosition: 'bottom',
    },
  },
  'tablet': {
    id: 'tablet',
    name: 'Tablet',
    width: 1024,
    height: 768,
    orientation: 'portrait',
    scale: 0.75,
    safeZones: {
      top: 40,
      bottom: 40,
      left: 40,
      right: 40,
    },
    description: 'Tablet or small display (1024x768 flexible)',
    defaultLayout: {
      logoPosition: 'top',
      timePosition: 'hidden',
      cardsGridColumns: 1,
      cardSize: 'medium',
      buttonPosition: 'bottom',
    },
  },
};

/**
 * Get device profile by ID
 */
export function getDeviceProfile(profileId: DeviceProfileType): DeviceProfile {
  return DEVICE_PROFILES[profileId] || DEVICE_PROFILES['wall-kiosk'];
}

/**
 * Get all available device profiles
 */
export function getAllDeviceProfiles(): DeviceProfile[] {
  return Object.values(DEVICE_PROFILES);
}

/**
 * Get profile name by ID
 */
export function getProfileName(profileId: DeviceProfileType): string {
  return getDeviceProfile(profileId).name;
}
