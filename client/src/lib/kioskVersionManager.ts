/**
 * Kiosk Version Manager
 * Manages saving, loading, and comparing kiosk configuration versions
 * Uses localStorage for MVP, can be swapped with TRPC later
 */

export interface KioskVersion {
  id: string;
  versionNumber: number;
  name: string;
  description?: string;
  config: {
    logoDataUrl?: string;
    contentData?: { headline: string; subheadline: string; helper?: string; footer?: string };
    theme?: any;
    layout?: any;
    behavior?: any;
  };
  createdAt: string;
  createdBy?: string;
  isDeployed: boolean;
  deployedAt?: string;
  deviceType: string;
  locationId: string;
}

export interface VersionHistory {
  versions: KioskVersion[];
  currentDeployedVersionId?: string;
  lastDeployedAt?: string;
}

const STORAGE_KEY_PREFIX = 'kiosk_versions_';

/**
 * Get storage key for a specific location and device type
 */
function getStorageKey(locationId: string, deviceType: string): string {
  return `${STORAGE_KEY_PREFIX}${locationId}_${deviceType}`;
}

/**
 * Get all versions for a location and device type
 */
export function getVersionHistory(locationId: string, deviceType: string): VersionHistory {
  const key = getStorageKey(locationId, deviceType);
  const stored = localStorage.getItem(key);
  
  if (!stored) {
    return { versions: [] };
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return { versions: [] };
  }
}

/**
 * Save a new version of the kiosk configuration
 */
export function saveVersion(
  locationId: string,
  deviceType: string,
  config: KioskVersion['config'],
  name: string,
  description?: string
): KioskVersion {
  const history = getVersionHistory(locationId, deviceType);
  
  const versionNumber = (history.versions.length || 0) + 1;
  const version: KioskVersion = {
    id: `v${versionNumber}_${Date.now()}`,
    versionNumber,
    name: name || `Version ${versionNumber}`,
    description,
    config,
    createdAt: new Date().toISOString(),
    createdBy: 'Studio User',
    isDeployed: false,
    deviceType,
    locationId,
  };
  
  history.versions.push(version);
  
  const key = getStorageKey(locationId, deviceType);
  localStorage.setItem(key, JSON.stringify(history));
  
  return version;
}

/**
 * Get a specific version by ID
 */
export function getVersion(locationId: string, deviceType: string, versionId: string): KioskVersion | null {
  const history = getVersionHistory(locationId, deviceType);
  return history.versions.find(v => v.id === versionId) || null;
}

/**
 * Deploy a version (mark as deployed and set as current)
 */
export function deployVersion(locationId: string, deviceType: string, versionId: string): KioskVersion | null {
  const history = getVersionHistory(locationId, deviceType);
  const version = history.versions.find(v => v.id === versionId);
  
  if (!version) return null;
  
  // Mark all versions as not deployed
  history.versions.forEach(v => {
    v.isDeployed = false;
    delete v.deployedAt;
  });
  
  // Mark this version as deployed
  version.isDeployed = true;
  version.deployedAt = new Date().toISOString();
  history.currentDeployedVersionId = versionId;
  history.lastDeployedAt = version.deployedAt;
  
  const key = getStorageKey(locationId, deviceType);
  localStorage.setItem(key, JSON.stringify(history));
  
  return version;
}

/**
 * Rollback to a previous version
 */
export function rollbackToVersion(locationId: string, deviceType: string, versionId: string): KioskVersion | null {
  const history = getVersionHistory(locationId, deviceType);
  const version = history.versions.find(v => v.id === versionId);
  
  if (!version) return null;
  
  // Create a new version based on the rollback target
  const newVersion = saveVersion(
    locationId,
    deviceType,
    version.config,
    `Rollback to ${version.name}`,
    `Rolled back from version ${version.versionNumber}`
  );
  
  // Deploy the new version
  return deployVersion(locationId, deviceType, newVersion.id);
}

/**
 * Delete a version
 */
export function deleteVersion(locationId: string, deviceType: string, versionId: string): boolean {
  const history = getVersionHistory(locationId, deviceType);
  const index = history.versions.findIndex(v => v.id === versionId);
  
  if (index === -1) return false;
  
  history.versions.splice(index, 1);
  
  const key = getStorageKey(locationId, deviceType);
  localStorage.setItem(key, JSON.stringify(history));
  
  return true;
}

/**
 * Get the currently deployed version
 */
export function getCurrentDeployedVersion(locationId: string, deviceType: string): KioskVersion | null {
  const history = getVersionHistory(locationId, deviceType);
  if (!history.currentDeployedVersionId) return null;
  
  return history.versions.find(v => v.id === history.currentDeployedVersionId) || null;
}

/**
 * Compare two versions and return differences
 */
export function compareVersions(
  locationId: string,
  deviceType: string,
  versionId1: string,
  versionId2: string
): { added: string[]; removed: string[]; modified: string[] } {
  const v1 = getVersion(locationId, deviceType, versionId1);
  const v2 = getVersion(locationId, deviceType, versionId2);
  
  if (!v1 || !v2) {
    return { added: [], removed: [], modified: [] };
  }
  
  const changes = { added: [] as string[], removed: [] as string[], modified: [] as string[] };
  
  // Compare logo
  if (v1.config.logoDataUrl !== v2.config.logoDataUrl) {
    if (v1.config.logoDataUrl && !v2.config.logoDataUrl) changes.removed.push('Logo');
    if (!v1.config.logoDataUrl && v2.config.logoDataUrl) changes.added.push('Logo');
    if (v1.config.logoDataUrl && v2.config.logoDataUrl) changes.modified.push('Logo');
  }
  
  // Compare content
  if (JSON.stringify(v1.config.contentData) !== JSON.stringify(v2.config.contentData)) {
    changes.modified.push('Content');
  }
  
  // Compare theme
  if (JSON.stringify(v1.config.theme) !== JSON.stringify(v2.config.theme)) {
    changes.modified.push('Theme');
  }
  
  return changes;
}

/**
 * Export version as JSON
 */
export function exportVersion(version: KioskVersion): string {
  return JSON.stringify(version, null, 2);
}

/**
 * Import version from JSON
 */
export function importVersion(locationId: string, deviceType: string, jsonString: string): KioskVersion | null {
  try {
    const imported = JSON.parse(jsonString);
    return saveVersion(
      locationId,
      deviceType,
      imported.config,
      `Imported: ${imported.name}`,
      `Imported from external source`
    );
  } catch {
    return null;
  }
}
