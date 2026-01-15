/**
 * Kiosk Config Provider - Adapter for localStorage management
 * Designed to swap with TRPC backend later without refactoring UI
 */

export interface KioskBranding {
  logoDataUrl?: string; // base64 data URL for png/jpg/svg
}

export interface KioskContent {
  headline: string;
  subheadline: string;
  helper?: string;
  footer?: string;
}

export interface KioskConfig {
  locationId: string;
  deviceType: 'front_desk' | 'wall_kiosk' | 'tablet';
  branding: KioskBranding;
  content: KioskContent;
}

// Default content for new kiosks
const DEFAULT_CONTENT: KioskContent = {
  headline: 'Welcome',
  subheadline: 'Tap the screen to begin',
  helper: 'Need help? See the front desk.',
  footer: 'Discipline • Confidence • Fitness',
};

const DEFAULT_BRANDING: KioskBranding = {
  logoDataUrl: undefined,
};

/**
 * Get the storage key for a kiosk config
 */
function getStorageKey(locationId: string, deviceType: string): string {
  return `kiosk_config_${locationId}_${deviceType}`;
}

/**
 * Get kiosk config from localStorage
 */
export async function getKioskConfig(
  locationId: string,
  deviceType: string
): Promise<KioskConfig> {
  const key = getStorageKey(locationId, deviceType);
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (err) {
      console.error('Failed to parse kiosk config:', err);
    }
  }

  // Return default config
  return {
    locationId,
    deviceType: deviceType as any,
    branding: DEFAULT_BRANDING,
    content: DEFAULT_CONTENT,
  };
}

/**
 * Save kiosk config to localStorage
 */
export async function saveKioskConfig(config: KioskConfig): Promise<void> {
  const key = getStorageKey(config.locationId, config.deviceType);
  localStorage.setItem(key, JSON.stringify(config));
}

/**
 * Update kiosk branding (logo)
 */
export async function updateKioskBranding(
  locationId: string,
  deviceType: string,
  branding: Partial<KioskBranding>
): Promise<KioskConfig> {
  const config = await getKioskConfig(locationId, deviceType);
  config.branding = { ...config.branding, ...branding };
  await saveKioskConfig(config);
  return config;
}

/**
 * Update kiosk content (headline, subheadline, etc.)
 */
export async function updateKioskContent(
  locationId: string,
  deviceType: string,
  content: Partial<KioskContent>
): Promise<KioskConfig> {
  const config = await getKioskConfig(locationId, deviceType);
  config.content = { ...config.content, ...content };
  await saveKioskConfig(config);
  return config;
}

/**
 * Reset kiosk config to defaults
 */
export async function resetKioskConfig(
  locationId: string,
  deviceType: string
): Promise<KioskConfig> {
  const config: KioskConfig = {
    locationId,
    deviceType: deviceType as any,
    branding: DEFAULT_BRANDING,
    content: DEFAULT_CONTENT,
  };
  await saveKioskConfig(config);
  return config;
}

/**
 * Delete kiosk config
 */
export async function deleteKioskConfig(
  locationId: string,
  deviceType: string
): Promise<void> {
  const key = getStorageKey(locationId, deviceType);
  localStorage.removeItem(key);
}
