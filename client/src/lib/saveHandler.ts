/**
 * Save Handler for Option A (MVP)
 * Handles kiosk configuration saving with localStorage persistence
 * 
 * Key features:
 * - Saves draft config to localStorage by {locationId}:{deviceType}
 * - Tracks save timestamps and version history
 * - Provides error diagnostics with real error messages
 * - No backend/TRPC calls (pure localStorage)
 */

import type { KioskConfig } from '../../../shared/kioskConfig';

export interface SavedDraftData {
  config: KioskConfig;
  savedAt: string;
  version: number;
  locationId: string | number;
  deviceType: string;
  configHash: string; // For detecting unsaved changes
}

export interface SaveResult {
  success: boolean;
  message: string;
  savedAt: string;
  version: number;
  error?: string;
}

/**
 * Generate a simple hash of the config for change detection
 */
function generateConfigHash(config: KioskConfig): string {
  try {
    const json = JSON.stringify(config);
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  } catch (err) {
    return 'error';
  }
}

/**
 * Save draft configuration to localStorage
 * 
 * @param locationId - Location identifier (string or number)
 * @param deviceType - Device type (e.g., 'wall-kiosk', 'tablet', 'front-desk')
 * @param draftConfig - The kiosk configuration to save
 * @returns SaveResult with success status and message
 */
export function saveDraft(
  locationId: string | number,
  deviceType: string,
  draftConfig: KioskConfig
): SaveResult {
  try {
    // Validate inputs
    if (!locationId) {
      throw new Error('Location ID is required for saving draft');
    }
    if (!deviceType) {
      throw new Error('Device type is required for saving draft');
    }
    if (!draftConfig) {
      throw new Error('No kiosk configuration to save');
    }

    // Generate storage key
    const draftKey = `kiosk_draft_${locationId}_${deviceType}`;
    const versionKey = `kiosk_draft_version_${locationId}_${deviceType}`;
    const timestampKey = `kiosk_draft_timestamp_${locationId}_${deviceType}`;

    // Get current version
    const currentVersion = parseInt(localStorage.getItem(versionKey) || '0', 10);
    const newVersion = currentVersion + 1;
    const now = new Date().toISOString();

    // Create saved draft data
    const savedData: SavedDraftData = {
      config: JSON.parse(JSON.stringify(draftConfig)), // Deep clone
      savedAt: now,
      version: newVersion,
      locationId,
      deviceType,
      configHash: generateConfigHash(draftConfig),
    };

    // Save to localStorage
    localStorage.setItem(draftKey, JSON.stringify(savedData));
    localStorage.setItem(versionKey, newVersion.toString());
    localStorage.setItem(timestampKey, now);

    // Log success
    console.log('[Save Draft Success]', {
      locationId,
      deviceType,
      version: newVersion,
      configSize: JSON.stringify(draftConfig).length,
      savedAt: now,
      configHash: savedData.configHash,
    });

    return {
      success: true,
      message: `Draft saved successfully (v${newVersion})`,
      savedAt: now,
      version: newVersion,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while saving draft';
    
    console.error('[Save Draft Error]', {
      error: errorMessage,
      locationId,
      deviceType,
      stack: err instanceof Error ? err.stack : undefined,
    });

    return {
      success: false,
      message: `Failed to save draft: ${errorMessage}`,
      savedAt: new Date().toISOString(),
      version: 0,
      error: errorMessage,
    };
  }
}

/**
 * Load draft configuration from localStorage
 * 
 * @param locationId - Location identifier
 * @param deviceType - Device type
 * @returns SavedDraftData or null if not found
 */
export function loadDraft(
  locationId: string | number,
  deviceType: string
): SavedDraftData | null {
  try {
    const draftKey = `kiosk_draft_${locationId}_${deviceType}`;
    const stored = localStorage.getItem(draftKey);
    
    if (!stored) return null;
    
    return JSON.parse(stored) as SavedDraftData;
  } catch (err) {
    console.error('[Load Draft Error]', {
      error: err instanceof Error ? err.message : 'Unknown error',
      locationId,
      deviceType,
    });
    return null;
  }
}

/**
 * Get last saved timestamp for a draft
 * 
 * @param locationId - Location identifier
 * @param deviceType - Device type
 * @returns ISO timestamp string or null
 */
export function getLastSavedTime(
  locationId: string | number,
  deviceType: string
): string | null {
  try {
    const timestampKey = `kiosk_draft_timestamp_${locationId}_${deviceType}`;
    return localStorage.getItem(timestampKey);
  } catch (err) {
    console.error('[Get Last Saved Time Error]', err);
    return null;
  }
}

/**
 * Get draft version number
 * 
 * @param locationId - Location identifier
 * @param deviceType - Device type
 * @returns Version number (0 if not found)
 */
export function getDraftVersion(
  locationId: string | number,
  deviceType: string
): number {
  try {
    const versionKey = `kiosk_draft_version_${locationId}_${deviceType}`;
    return parseInt(localStorage.getItem(versionKey) || '0', 10);
  } catch (err) {
    console.error('[Get Draft Version Error]', err);
    return 0;
  }
}

/**
 * Check if there are unsaved changes
 * 
 * @param locationId - Location identifier
 * @param deviceType - Device type
 * @param currentConfig - Current configuration to compare
 * @returns true if there are unsaved changes
 */
export function hasUnsavedChanges(
  locationId: string | number,
  deviceType: string,
  currentConfig: KioskConfig
): boolean {
  try {
    const draft = loadDraft(locationId, deviceType);
    if (!draft) return true; // No saved draft = unsaved changes
    
    const currentHash = generateConfigHash(currentConfig);
    return currentHash !== draft.configHash;
  } catch (err) {
    console.error('[Check Unsaved Changes Error]', err);
    return true; // Assume unsaved on error
  }
}

/**
 * Clear draft from localStorage
 * 
 * @param locationId - Location identifier
 * @param deviceType - Device type
 */
export function clearDraft(
  locationId: string | number,
  deviceType: string
): void {
  try {
    const draftKey = `kiosk_draft_${locationId}_${deviceType}`;
    const versionKey = `kiosk_draft_version_${locationId}_${deviceType}`;
    const timestampKey = `kiosk_draft_timestamp_${locationId}_${deviceType}`;
    
    localStorage.removeItem(draftKey);
    localStorage.removeItem(versionKey);
    localStorage.removeItem(timestampKey);
    
    console.log('[Clear Draft Success]', { locationId, deviceType });
  } catch (err) {
    console.error('[Clear Draft Error]', err);
  }
}
