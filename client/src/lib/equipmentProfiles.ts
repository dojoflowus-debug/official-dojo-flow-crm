/**
 * Equipment Physical Profiles
 * 
 * Real-world dimensions and clearance requirements for training equipment.
 * All measurements are in feet unless otherwise specified.
 * 
 * This is the foundation for physics-based capacity calculations,
 * collision detection, and realistic layout generation.
 */

export interface EquipmentProfile {
  id: string;
  name: string;
  category: 'bag' | 'mat' | 'station' | 'equipment';
  
  // Physical dimensions (in feet)
  baseDiameter: number;      // Diameter of the base/footprint
  equipmentDiameter: number; // Diameter of the main equipment (bag, mat, etc.)
  height: number;            // Height of the equipment
  
  // Safety clearance (in feet)
  recommendedClearance: number;  // Minimum clearance around the station
  minimumClearance: number;      // Absolute minimum (tight fit)
  
  // Calculated values
  effectiveStationDiameter: number;  // baseDiameter + (2 * recommendedClearance)
  effectiveStationRadius: number;    // effectiveStationDiameter / 2
  
  // Wall requirements
  wallPadding: number;  // Minimum distance from walls
  
  // Display
  color: string;
  icon: string;
}

/**
 * WaveMaster XXL - Century's flagship freestanding bag
 * 
 * Physical specs:
 * - Base diameter: 28 inches (2.33 ft)
 * - Bag diameter: 18 inches (1.5 ft)  
 * - Height: 69 inches (5.75 ft)
 * - Base weight when filled: ~270 lbs
 * 
 * Safety requirements:
 * - Recommended clearance: 3 ft (for full range of motion)
 * - Minimum clearance: 2 ft (tight training)
 */
export const WAVEMASTER_XXL: EquipmentProfile = {
  id: 'wavemaster_xxl',
  name: 'WaveMaster XXL',
  category: 'bag',
  
  // Physical dimensions in feet
  baseDiameter: 28 / 12,        // 28 inches = 2.33 ft
  equipmentDiameter: 18 / 12,   // 18 inches = 1.5 ft
  height: 69 / 12,              // 69 inches = 5.75 ft
  
  // Safety clearance in feet
  recommendedClearance: 3,      // 3 ft for comfortable training
  minimumClearance: 2,          // 2 ft absolute minimum
  
  // Calculated: base + 2*clearance
  effectiveStationDiameter: (28 / 12) + (2 * 3),  // 2.33 + 6 = 8.33 ft
  effectiveStationRadius: ((28 / 12) + (2 * 3)) / 2,  // 4.17 ft
  
  // Wall padding
  wallPadding: 2,  // 2 ft from walls
  
  // Display
  color: '#dc2626',  // Red
  icon: 'bag',
};

/**
 * Standard Heavy Bag (hanging)
 */
export const HEAVY_BAG_STANDARD: EquipmentProfile = {
  id: 'heavy_bag_standard',
  name: 'Heavy Bag (100lb)',
  category: 'bag',
  
  baseDiameter: 14 / 12,        // 14 inch diameter
  equipmentDiameter: 14 / 12,
  height: 48 / 12,              // 4 ft bag
  
  recommendedClearance: 4,      // More swing room needed
  minimumClearance: 3,
  
  effectiveStationDiameter: (14 / 12) + (2 * 4),  // ~9.17 ft
  effectiveStationRadius: ((14 / 12) + (2 * 4)) / 2,
  
  wallPadding: 3,
  
  color: '#1e40af',
  icon: 'bag',
};

/**
 * Yoga Mat Station
 */
export const YOGA_MAT: EquipmentProfile = {
  id: 'yoga_mat',
  name: 'Yoga Mat',
  category: 'mat',
  
  // Standard yoga mat: 24" x 68" (2ft x 5.67ft)
  baseDiameter: 6,              // Treating as circular for simplicity (diagonal)
  equipmentDiameter: 6,
  height: 0.02,                 // ~1/4 inch thick
  
  recommendedClearance: 2,      // Arm span clearance
  minimumClearance: 1,
  
  effectiveStationDiameter: 6 + (2 * 2),  // 10 ft
  effectiveStationRadius: 5,
  
  wallPadding: 1,
  
  color: '#059669',
  icon: 'mat',
};

/**
 * Equipment profiles registry
 */
export const EQUIPMENT_PROFILES: Record<string, EquipmentProfile> = {
  wavemaster_xxl: WAVEMASTER_XXL,
  heavy_bag_standard: HEAVY_BAG_STANDARD,
  yoga_mat: YOGA_MAT,
};

/**
 * Get equipment profile by ID
 */
export function getEquipmentProfile(id: string): EquipmentProfile | undefined {
  return EQUIPMENT_PROFILES[id];
}

/**
 * Get default equipment profile for a template type
 */
export function getDefaultProfileForTemplate(templateType: string): EquipmentProfile {
  switch (templateType) {
    case 'kickboxing_bags':
      return WAVEMASTER_XXL;
    case 'yoga_grid':
      return YOGA_MAT;
    case 'karate_lines':
      return YOGA_MAT; // Use mat spacing for karate
    default:
      return WAVEMASTER_XXL;
  }
}

/**
 * Calculate maximum capacity for a room given equipment profile
 * 
 * @param roomWidthFt - Room width in feet
 * @param roomDepthFt - Room depth in feet  
 * @param profile - Equipment profile
 * @param useMinimumClearance - Use minimum clearance instead of recommended
 * @returns Maximum number of stations that fit
 */
export function calculateMaxCapacity(
  roomWidthFt: number,
  roomDepthFt: number,
  profile: EquipmentProfile,
  useMinimumClearance: boolean = false
): {
  maxCapacity: number;
  maxColumns: number;
  maxRows: number;
  usableWidth: number;
  usableDepth: number;
  stationSpacing: number;
  warning?: string;
} {
  const clearance = useMinimumClearance ? profile.minimumClearance : profile.recommendedClearance;
  const stationDiameter = profile.baseDiameter + (2 * clearance);
  const wallPadding = profile.wallPadding;
  
  // Usable space after wall padding
  const usableWidth = roomWidthFt - (2 * wallPadding);
  const usableDepth = roomDepthFt - (2 * wallPadding);
  
  // Check if room is too small for even one station
  if (usableWidth < stationDiameter || usableDepth < stationDiameter) {
    return {
      maxCapacity: 0,
      maxColumns: 0,
      maxRows: 0,
      usableWidth,
      usableDepth,
      stationSpacing: stationDiameter,
      warning: `Room is too small for ${profile.name}. Minimum room size: ${(stationDiameter + 2 * wallPadding).toFixed(1)} ft × ${(stationDiameter + 2 * wallPadding).toFixed(1)} ft`,
    };
  }
  
  // Calculate how many stations fit in each dimension
  // First station takes stationDiameter, each additional takes stationDiameter (center-to-center)
  const maxColumns = Math.floor(usableWidth / stationDiameter);
  const maxRows = Math.floor(usableDepth / stationDiameter);
  const maxCapacity = maxColumns * maxRows;
  
  let warning: string | undefined;
  if (maxCapacity === 0) {
    warning = `Room dimensions (${roomWidthFt}×${roomDepthFt} ft) cannot safely fit any ${profile.name} stations with ${clearance} ft clearance.`;
  } else if (maxCapacity === 1) {
    warning = `Room can only fit 1 ${profile.name} with safe clearance.`;
  }
  
  return {
    maxCapacity,
    maxColumns,
    maxRows,
    usableWidth,
    usableDepth,
    stationSpacing: stationDiameter,
    warning,
  };
}

/**
 * Check if a position is valid (within bounds and not colliding)
 * 
 * @param x - X position (0-100 percentage)
 * @param y - Y position (0-100 percentage)
 * @param roomWidthFt - Room width in feet
 * @param roomDepthFt - Room depth in feet
 * @param profile - Equipment profile
 * @param existingPositions - Array of existing positions to check collision against
 * @param excludeIndex - Index to exclude from collision check (for dragging)
 */
export function isValidPosition(
  x: number,
  y: number,
  roomWidthFt: number,
  roomDepthFt: number,
  profile: EquipmentProfile,
  existingPositions: Array<{ x: number; y: number }> = [],
  excludeIndex: number = -1
): {
  valid: boolean;
  reason?: string;
  collisionWith?: number;
} {
  const clearance = profile.recommendedClearance;
  const stationRadius = (profile.baseDiameter / 2) + clearance;
  const wallPadding = profile.wallPadding;
  
  // Convert percentage to feet
  const xFt = (x / 100) * roomWidthFt;
  const yFt = (y / 100) * roomDepthFt;
  
  // Check wall boundaries
  if (xFt < wallPadding + stationRadius) {
    return { valid: false, reason: 'Too close to left wall' };
  }
  if (xFt > roomWidthFt - wallPadding - stationRadius) {
    return { valid: false, reason: 'Too close to right wall' };
  }
  if (yFt < wallPadding + stationRadius) {
    return { valid: false, reason: 'Too close to front wall' };
  }
  if (yFt > roomDepthFt - wallPadding - stationRadius) {
    return { valid: false, reason: 'Too close to back wall' };
  }
  
  // Check collision with other stations
  const minDistance = profile.baseDiameter + (2 * clearance); // Center-to-center minimum
  
  for (let i = 0; i < existingPositions.length; i++) {
    if (i === excludeIndex) continue;
    
    const other = existingPositions[i];
    const otherXFt = (other.x / 100) * roomWidthFt;
    const otherYFt = (other.y / 100) * roomDepthFt;
    
    const distance = Math.sqrt(
      Math.pow(xFt - otherXFt, 2) + Math.pow(yFt - otherYFt, 2)
    );
    
    if (distance < minDistance) {
      return { 
        valid: false, 
        reason: `Too close to station ${i + 1} (${distance.toFixed(1)} ft, need ${minDistance.toFixed(1)} ft)`,
        collisionWith: i,
      };
    }
  }
  
  return { valid: true };
}

/**
 * Clamp a position to valid bounds
 */
export function clampToValidBounds(
  x: number,
  y: number,
  roomWidthFt: number,
  roomDepthFt: number,
  profile: EquipmentProfile
): { x: number; y: number } {
  const clearance = profile.recommendedClearance;
  const stationRadius = (profile.baseDiameter / 2) + clearance;
  const wallPadding = profile.wallPadding;
  
  // Calculate min/max in feet
  const minXFt = wallPadding + stationRadius;
  const maxXFt = roomWidthFt - wallPadding - stationRadius;
  const minYFt = wallPadding + stationRadius;
  const maxYFt = roomDepthFt - wallPadding - stationRadius;
  
  // Convert percentage to feet, clamp, convert back
  const xFt = Math.max(minXFt, Math.min(maxXFt, (x / 100) * roomWidthFt));
  const yFt = Math.max(minYFt, Math.min(maxYFt, (y / 100) * roomDepthFt));
  
  return {
    x: (xFt / roomWidthFt) * 100,
    y: (yFt / roomDepthFt) * 100,
  };
}

/**
 * Get safety zone radius as percentage of room dimensions
 */
export function getSafetyZoneRadiusPercent(
  roomWidthFt: number,
  roomDepthFt: number,
  profile: EquipmentProfile
): { radiusX: number; radiusY: number } {
  const clearance = profile.recommendedClearance;
  const stationRadius = (profile.baseDiameter / 2) + clearance;
  
  return {
    radiusX: (stationRadius / roomWidthFt) * 100,
    radiusY: (stationRadius / roomDepthFt) * 100,
  };
}
