/**
 * Local Publish Handler for Option A (MVP)
 * Handles kiosk configuration publishing with localStorage persistence
 */

export interface PublishedKioskData {
  config: any;
  version: number;
  publishedAt: string;
  locationId: string;
  deviceType: string;
}

export function publishKiosk(
  locationId: string,
  deviceType: string,
  draftConfig: any
): PublishedKioskData {
  // Validate required fields
  if (!locationId) {
    throw new Error('Location ID is required');
  }
  if (!deviceType) {
    throw new Error('Device type is required');
  }
  if (!draftConfig) {
    throw new Error('No kiosk configuration to publish');
  }

  // Get current published version from localStorage
  const publishKey = `kiosk_published_${locationId}_${deviceType}`;
  const versionKey = `kiosk_published_version_${locationId}_${deviceType}`;
  
  const currentVersion = parseInt(localStorage.getItem(versionKey) || '0', 10);
  const newVersion = currentVersion + 1;

  // Save published config snapshot
  const publishedData: PublishedKioskData = {
    config: JSON.parse(JSON.stringify(draftConfig)),
    version: newVersion,
    publishedAt: new Date().toISOString(),
    locationId,
    deviceType,
  };

  localStorage.setItem(publishKey, JSON.stringify(publishedData));
  localStorage.setItem(versionKey, newVersion.toString());

  // Log success
  console.log('[Publish Success]', {
    locationId,
    deviceType,
    version: newVersion,
    configSize: JSON.stringify(draftConfig).length,
    publishedAt: publishedData.publishedAt,
  });

  return publishedData;
}

export function getPublishedKiosk(
  locationId: string,
  deviceType: string
): PublishedKioskData | null {
  const publishKey = `kiosk_published_${locationId}_${deviceType}`;
  const stored = localStorage.getItem(publishKey);
  
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as PublishedKioskData;
  } catch (err) {
    console.error('[Get Published Kiosk Error]', err);
    return null;
  }
}

export function getPublishedVersion(
  locationId: string,
  deviceType: string
): number {
  const versionKey = `kiosk_published_version_${locationId}_${deviceType}`;
  return parseInt(localStorage.getItem(versionKey) || '0', 10);
}
