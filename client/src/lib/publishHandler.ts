/**
 * Publish Handler for Option A (MVP)
 * Handles kiosk configuration publishing with localStorage persistence
 * 
 * Key features:
 * - Creates published snapshots with version and timestamp
 * - Maintains version history in localStorage
 * - Provides detailed error diagnostics
 * - No backend/TRPC calls (pure localStorage)
 */

import type { KioskConfig } from '../../../shared/kioskConfig';

export interface PublishedKioskData {
  config: KioskConfig;
  version: number;
  publishedAt: string;
  locationId: string | number;
  deviceType: string;
}

export interface PublishResult {
  success: boolean;
  message: string;
  version: number;
  publishedAt: string;
  error?: string;
}

/**
 * Publish kiosk configuration to localStorage
 * Creates a snapshot with version tracking and timestamp
 * 
 * @param locationId - Location identifier (string or number)
 * @param deviceType - Device type (e.g., 'wall-kiosk', 'tablet', 'front-desk')
 * @param draftConfig - The kiosk configuration to publish
 * @returns PublishResult with success status and message
 */
export function publishKiosk(
  locationId: string | number,
  deviceType: string,
  draftConfig: KioskConfig
): PublishResult {
  try {
    // Validate required fields
    if (!locationId) {
      throw new Error('Location ID is required to publish kiosk');
    }
    if (!deviceType) {
      throw new Error('Device type is required to publish kiosk');
    }
    if (!draftConfig) {
      throw new Error('No kiosk configuration to publish');
    }

    // Generate storage keys
    const publishKey = `kiosk_published_${locationId}_${deviceType}`;
    const versionKey = `kiosk_published_version_${locationId}_${deviceType}`;
    const timestampKey = `kiosk_published_timestamp_${locationId}_${deviceType}`;
    const historyKey = `kiosk_published_history_${locationId}_${deviceType}`;

    // Get current version
    const currentVersion = parseInt(localStorage.getItem(versionKey) || '0', 10);
    const newVersion = currentVersion + 1;
    const now = new Date().toISOString();

    // Create published snapshot
    const publishedData: PublishedKioskData = {
      config: JSON.parse(JSON.stringify(draftConfig)), // Deep clone
      version: newVersion,
      publishedAt: now,
      locationId,
      deviceType,
    };

    // Save published config snapshot
    localStorage.setItem(publishKey, JSON.stringify(publishedData));
    localStorage.setItem(versionKey, newVersion.toString());
    localStorage.setItem(timestampKey, now);

    // Update version history (keep last 10 versions)
    try {
      const historyStr = localStorage.getItem(historyKey) || '[]';
      const history = JSON.parse(historyStr) as Array<{ version: number; publishedAt: string }>;
      
      history.push({ version: newVersion, publishedAt: now });
      
      // Keep only last 10 versions in history
      if (history.length > 10) {
        history.shift();
      }
      
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (historyErr) {
      console.warn('[Publish] Failed to update version history', historyErr);
      // Continue anyway - history is optional
    }

    // Log success
    console.log('[Publish Success]', {
      locationId,
      deviceType,
      version: newVersion,
      configSize: JSON.stringify(draftConfig).length,
      publishedAt: now,
    });

    return {
      success: true,
      message: `Kiosk published successfully (v${newVersion})`,
      version: newVersion,
      publishedAt: now,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while publishing';
    
    console.error('[Publish Error]', {
      error: errorMessage,
      locationId,
      deviceType,
      configExists: !!draftConfig,
      stack: err instanceof Error ? err.stack : undefined,
    });

    return {
      success: false,
      message: `Failed to publish kiosk: ${errorMessage}`,
      version: 0,
      publishedAt: new Date().toISOString(),
      error: errorMessage,
    };
  }
}

/**
 * Get published kiosk configuration
 * 
 * @param locationId - Location identifier
 * @param deviceType - Device type
 * @returns PublishedKioskData or null if not found
 */
export function getPublishedKiosk(
  locationId: string | number,
  deviceType: string
): PublishedKioskData | null {
  try {
    const publishKey = `kiosk_published_${locationId}_${deviceType}`;
    const stored = localStorage.getItem(publishKey);
    
    if (!stored) return null;
    
    return JSON.parse(stored) as PublishedKioskData;
  } catch (err) {
    console.error('[Get Published Kiosk Error]', {
      error: err instanceof Error ? err.message : 'Unknown error',
      locationId,
      deviceType,
    });
    return null;
  }
}

/**
 * Get published version number
 * 
 * @param locationId - Location identifier
 * @param deviceType - Device type
 * @returns Version number (0 if not found)
 */
export function getPublishedVersion(
  locationId: string | number,
  deviceType: string
): number {
  try {
    const versionKey = `kiosk_published_version_${locationId}_${deviceType}`;
    return parseInt(localStorage.getItem(versionKey) || '0', 10);
  } catch (err) {
    console.error('[Get Published Version Error]', err);
    return 0;
  }
}

/**
 * Get last published timestamp
 * 
 * @param locationId - Location identifier
 * @param deviceType - Device type
 * @returns ISO timestamp string or null
 */
export function getLastPublishedTime(
  locationId: string | number,
  deviceType: string
): string | null {
  try {
    const timestampKey = `kiosk_published_timestamp_${locationId}_${deviceType}`;
    return localStorage.getItem(timestampKey);
  } catch (err) {
    console.error('[Get Last Published Time Error]', err);
    return null;
  }
}

/**
 * Get version history
 * 
 * @param locationId - Location identifier
 * @param deviceType - Device type
 * @returns Array of version history entries
 */
export function getVersionHistory(
  locationId: string | number,
  deviceType: string
): Array<{ version: number; publishedAt: string }> {
  try {
    const historyKey = `kiosk_published_history_${locationId}_${deviceType}`;
    const historyStr = localStorage.getItem(historyKey) || '[]';
    return JSON.parse(historyStr) as Array<{ version: number; publishedAt: string }>;
  } catch (err) {
    console.error('[Get Version History Error]', err);
    return [];
  }
}

/**
 * Rollback to a previous published version
 * 
 * @param locationId - Location identifier
 * @param deviceType - Device type
 * @param targetVersion - Version number to rollback to
 * @returns PublishResult with success status
 */
export function rollbackToVersion(
  locationId: string | number,
  deviceType: string,
  targetVersion: number
): PublishResult {
  try {
    if (targetVersion < 1) {
      throw new Error('Invalid version number');
    }

    // Get version history to find the target version
    const history = getVersionHistory(locationId, deviceType);
    const targetEntry = history.find(h => h.version === targetVersion);
    
    if (!targetEntry) {
      throw new Error(`Version ${targetVersion} not found in history`);
    }

    // For now, we can't actually retrieve old configs since we only store current
    // In a real implementation, you'd store each version separately
    throw new Error('Rollback not yet implemented - requires version history storage');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred during rollback';
    
    console.error('[Rollback Error]', {
      error: errorMessage,
      locationId,
      deviceType,
      targetVersion,
    });

    return {
      success: false,
      message: `Failed to rollback to version ${targetVersion}: ${errorMessage}`,
      version: 0,
      publishedAt: new Date().toISOString(),
      error: errorMessage,
    };
  }
}

/**
 * Clear published configuration
 * 
 * @param locationId - Location identifier
 * @param deviceType - Device type
 */
export function clearPublished(
  locationId: string | number,
  deviceType: string
): void {
  try {
    const publishKey = `kiosk_published_${locationId}_${deviceType}`;
    const versionKey = `kiosk_published_version_${locationId}_${deviceType}`;
    const timestampKey = `kiosk_published_timestamp_${locationId}_${deviceType}`;
    const historyKey = `kiosk_published_history_${locationId}_${deviceType}`;
    
    localStorage.removeItem(publishKey);
    localStorage.removeItem(versionKey);
    localStorage.removeItem(timestampKey);
    localStorage.removeItem(historyKey);
    
    console.log('[Clear Published Success]', { locationId, deviceType });
  } catch (err) {
    console.error('[Clear Published Error]', err);
  }
}
