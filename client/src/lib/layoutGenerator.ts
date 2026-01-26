/**
 * Layout Generator - Physics-Based Equipment Placement
 * 
 * Creates spot positions based on real-world equipment dimensions,
 * safety clearances, and room geometry.
 * 
 * All positions are normalized (0-100) for percentage-based rendering.
 */

import {
  EquipmentProfile,
  WAVEMASTER_XXL,
  getDefaultProfileForTemplate,
  calculateMaxCapacity,
  clampToValidBounds,
} from './equipmentProfiles';

// Re-export for convenience
export { WAVEMASTER_XXL };

export interface LayoutPosition {
  spotId: number;
  positionX: number; // 0-100
  positionY: number; // 0-100
}

export interface LayoutConfig {
  preset: string;
  rows: number;
  cols: number;
  spacing: number; // feet (legacy, now derived from equipment)
  padding: number; // feet (legacy, now derived from equipment)
  roomWidth: number; // feet
  roomHeight: number; // feet (depth)
  totalSpots: number;
  stageHeight?: number; // feet reserved for stage/front area
  equipmentType?: string; // equipment profile ID
  useMinimumClearance?: boolean; // tight fit mode
}

export interface LayoutResult {
  positions: LayoutPosition[];
  maxCapacity: number;
  actualCount: number;
  warning?: string;
  equipmentProfile: EquipmentProfile;
  stationSpacing: number; // feet between station centers
}

/**
 * Get equipment profile for layout
 */
function getEquipmentForLayout(config: LayoutConfig): EquipmentProfile {
  if (config.equipmentType) {
    // Could look up by ID in the future
    return WAVEMASTER_XXL;
  }
  return WAVEMASTER_XXL; // Default to WaveMaster for kickboxing
}

/**
 * Generate physics-based grid layout
 * 
 * Calculates actual station positions based on:
 * - Equipment physical dimensions
 * - Required safety clearances
 * - Wall padding requirements
 * - Room geometry
 */
export function generateGridLayout(config: LayoutConfig): LayoutResult {
  const profile = getEquipmentForLayout(config);
  const { roomWidth, roomHeight, totalSpots, stageHeight = 3, useMinimumClearance = false } = config;
  
  // Calculate capacity based on physics
  const capacity = calculateMaxCapacity(roomWidth, roomHeight - stageHeight, profile, useMinimumClearance);
  
  // Determine actual count (clamped to max capacity)
  const actualCount = Math.min(totalSpots, capacity.maxCapacity);
  
  if (actualCount === 0) {
    return {
      positions: [],
      maxCapacity: capacity.maxCapacity,
      actualCount: 0,
      warning: capacity.warning,
      equipmentProfile: profile,
      stationSpacing: capacity.stationSpacing,
    };
  }
  
  // Calculate optimal grid dimensions
  const aspectRatio = roomWidth / (roomHeight - stageHeight);
  let cols = Math.ceil(Math.sqrt(actualCount * aspectRatio));
  let rows = Math.ceil(actualCount / cols);
  
  // Ensure we don't exceed capacity
  while (cols > capacity.maxColumns && cols > 1) {
    cols--;
    rows = Math.ceil(actualCount / cols);
  }
  while (rows > capacity.maxRows && rows > 1) {
    rows--;
    cols = Math.ceil(actualCount / rows);
  }
  
  const positions: LayoutPosition[] = [];
  const clearance = useMinimumClearance ? profile.minimumClearance : profile.recommendedClearance;
  const stationDiameter = profile.baseDiameter + (2 * clearance);
  const wallPadding = profile.wallPadding;
  
  // Calculate usable area
  const usableWidth = roomWidth - (2 * wallPadding);
  const usableDepth = roomHeight - stageHeight - (2 * wallPadding);
  
  // Calculate spacing to center the grid
  const gridWidth = cols * stationDiameter;
  const gridDepth = rows * stationDiameter;
  
  const startX = wallPadding + (usableWidth - gridWidth) / 2 + stationDiameter / 2;
  const startY = stageHeight + wallPadding + (usableDepth - gridDepth) / 2 + stationDiameter / 2;
  
  let spotIndex = 0;
  for (let row = 0; row < rows && spotIndex < actualCount; row++) {
    for (let col = 0; col < cols && spotIndex < actualCount; col++) {
      const xFt = startX + col * stationDiameter;
      const yFt = startY + row * stationDiameter;
      
      // Convert to percentage
      const positionX = (xFt / roomWidth) * 100;
      const positionY = (yFt / roomHeight) * 100;
      
      positions.push({
        spotId: spotIndex + 1,
        positionX: Math.round(positionX * 10) / 10,
        positionY: Math.round(positionY * 10) / 10,
      });
      
      spotIndex++;
    }
  }
  
  let warning = capacity.warning;
  if (totalSpots > capacity.maxCapacity) {
    warning = `Requested ${totalSpots} stations, but room can only safely fit ${capacity.maxCapacity}. Placed ${actualCount} stations.`;
  }
  
  return {
    positions,
    maxCapacity: capacity.maxCapacity,
    actualCount,
    warning,
    equipmentProfile: profile,
    stationSpacing: stationDiameter,
  };
}

/**
 * Generate staggered layout - offset rows for better visibility
 */
export function generateStaggeredLayout(config: LayoutConfig): LayoutResult {
  const profile = getEquipmentForLayout(config);
  const { roomWidth, roomHeight, totalSpots, stageHeight = 3, useMinimumClearance = false } = config;
  
  const capacity = calculateMaxCapacity(roomWidth, roomHeight - stageHeight, profile, useMinimumClearance);
  const actualCount = Math.min(totalSpots, capacity.maxCapacity);
  
  if (actualCount === 0) {
    return {
      positions: [],
      maxCapacity: capacity.maxCapacity,
      actualCount: 0,
      warning: capacity.warning,
      equipmentProfile: profile,
      stationSpacing: capacity.stationSpacing,
    };
  }
  
  const clearance = useMinimumClearance ? profile.minimumClearance : profile.recommendedClearance;
  const stationDiameter = profile.baseDiameter + (2 * clearance);
  const wallPadding = profile.wallPadding;
  
  // For staggered, we need slightly more horizontal space for offset
  const staggerOffset = stationDiameter * 0.5;
  const effectiveWidth = roomWidth - (2 * wallPadding) - staggerOffset;
  
  const cols = Math.floor(effectiveWidth / stationDiameter);
  const rows = Math.ceil(actualCount / cols);
  
  const positions: LayoutPosition[] = [];
  const usableDepth = roomHeight - stageHeight - (2 * wallPadding);
  
  const rowSpacing = Math.min(stationDiameter, usableDepth / (rows + 1));
  const startY = stageHeight + wallPadding + rowSpacing;
  
  let spotIndex = 0;
  for (let row = 0; row < rows && spotIndex < actualCount; row++) {
    const offset = row % 2 === 1 ? staggerOffset : 0;
    const colsInRow = row % 2 === 1 ? cols - 1 : cols;
    
    for (let col = 0; col < colsInRow && spotIndex < actualCount; col++) {
      const xFt = wallPadding + stationDiameter / 2 + offset + col * stationDiameter;
      const yFt = startY + row * rowSpacing;
      
      // Clamp to bounds
      const clamped = clampToValidBounds(
        (xFt / roomWidth) * 100,
        (yFt / roomHeight) * 100,
        roomWidth,
        roomHeight,
        profile
      );
      
      positions.push({
        spotId: spotIndex + 1,
        positionX: Math.round(clamped.x * 10) / 10,
        positionY: Math.round(clamped.y * 10) / 10,
      });
      
      spotIndex++;
    }
  }
  
  let warning = capacity.warning;
  if (totalSpots > capacity.maxCapacity) {
    warning = `Requested ${totalSpots} stations, but room can only safely fit ${capacity.maxCapacity}. Placed ${actualCount} stations.`;
  }
  
  return {
    positions,
    maxCapacity: capacity.maxCapacity,
    actualCount,
    warning,
    equipmentProfile: profile,
    stationSpacing: stationDiameter,
  };
}

/**
 * Generate perimeter layout - stations around the edges
 */
export function generatePerimeterLayout(config: LayoutConfig): LayoutResult {
  const profile = getEquipmentForLayout(config);
  const { roomWidth, roomHeight, totalSpots, stageHeight = 3, useMinimumClearance = false } = config;
  
  const clearance = useMinimumClearance ? profile.minimumClearance : profile.recommendedClearance;
  const stationDiameter = profile.baseDiameter + (2 * clearance);
  const wallPadding = profile.wallPadding;
  
  // Calculate perimeter capacity
  const usableWidth = roomWidth - (2 * wallPadding);
  const usableDepth = roomHeight - stageHeight - (2 * wallPadding);
  
  const spotsOnWidth = Math.floor(usableWidth / stationDiameter);
  const spotsOnDepth = Math.floor(usableDepth / stationDiameter);
  
  // Perimeter = 2*width + 2*depth - 4 corners
  const maxCapacity = Math.max(0, 2 * spotsOnWidth + 2 * Math.max(0, spotsOnDepth - 2));
  const actualCount = Math.min(totalSpots, maxCapacity);
  
  if (actualCount === 0) {
    return {
      positions: [],
      maxCapacity,
      actualCount: 0,
      warning: `Room too small for perimeter layout with ${profile.name}`,
      equipmentProfile: profile,
      stationSpacing: stationDiameter,
    };
  }
  
  const positions: LayoutPosition[] = [];
  
  // Distribute spots around perimeter
  const topCount = Math.ceil(actualCount / 4);
  const rightCount = Math.ceil(actualCount / 4);
  const bottomCount = Math.ceil(actualCount / 4);
  const leftCount = actualCount - topCount - rightCount - bottomCount;
  
  let spotIndex = 0;
  
  // Top row
  const topY = stageHeight + wallPadding + stationDiameter / 2;
  for (let i = 0; i < topCount && spotIndex < actualCount; i++) {
    const xFt = wallPadding + stationDiameter / 2 + i * (usableWidth / topCount);
    positions.push({
      spotId: spotIndex + 1,
      positionX: Math.round((xFt / roomWidth) * 100 * 10) / 10,
      positionY: Math.round((topY / roomHeight) * 100 * 10) / 10,
    });
    spotIndex++;
  }
  
  // Right column
  const rightX = roomWidth - wallPadding - stationDiameter / 2;
  for (let i = 0; i < rightCount && spotIndex < actualCount; i++) {
    const yFt = topY + stationDiameter + i * ((usableDepth - stationDiameter) / rightCount);
    positions.push({
      spotId: spotIndex + 1,
      positionX: Math.round((rightX / roomWidth) * 100 * 10) / 10,
      positionY: Math.round((yFt / roomHeight) * 100 * 10) / 10,
    });
    spotIndex++;
  }
  
  // Bottom row (reverse)
  const bottomY = roomHeight - wallPadding - stationDiameter / 2;
  for (let i = bottomCount - 1; i >= 0 && spotIndex < actualCount; i--) {
    const xFt = wallPadding + stationDiameter / 2 + i * (usableWidth / bottomCount);
    positions.push({
      spotId: spotIndex + 1,
      positionX: Math.round((xFt / roomWidth) * 100 * 10) / 10,
      positionY: Math.round((bottomY / roomHeight) * 100 * 10) / 10,
    });
    spotIndex++;
  }
  
  // Left column (reverse)
  const leftX = wallPadding + stationDiameter / 2;
  for (let i = leftCount - 1; i >= 0 && spotIndex < actualCount; i--) {
    const yFt = topY + stationDiameter + i * ((usableDepth - stationDiameter) / Math.max(1, leftCount));
    positions.push({
      spotId: spotIndex + 1,
      positionX: Math.round((leftX / roomWidth) * 100 * 10) / 10,
      positionY: Math.round((yFt / roomHeight) * 100 * 10) / 10,
    });
    spotIndex++;
  }
  
  let warning: string | undefined;
  if (totalSpots > maxCapacity) {
    warning = `Requested ${totalSpots} stations, but perimeter can only fit ${maxCapacity}. Placed ${actualCount} stations.`;
  }
  
  return {
    positions,
    maxCapacity,
    actualCount,
    warning,
    equipmentProfile: profile,
    stationSpacing: stationDiameter,
  };
}

/**
 * Generate single-row bag wall layout
 */
export function generateBagWallLayout(config: LayoutConfig): LayoutResult {
  const profile = getEquipmentForLayout(config);
  const { roomWidth, roomHeight, totalSpots, stageHeight = 3, useMinimumClearance = false } = config;
  
  const clearance = useMinimumClearance ? profile.minimumClearance : profile.recommendedClearance;
  const stationDiameter = profile.baseDiameter + (2 * clearance);
  const wallPadding = profile.wallPadding;
  
  const usableWidth = roomWidth - (2 * wallPadding);
  const maxCapacity = Math.floor(usableWidth / stationDiameter);
  const actualCount = Math.min(totalSpots, maxCapacity);
  
  if (actualCount === 0) {
    return {
      positions: [],
      maxCapacity,
      actualCount: 0,
      warning: `Room too narrow for ${profile.name} wall layout`,
      equipmentProfile: profile,
      stationSpacing: stationDiameter,
    };
  }
  
  const positions: LayoutPosition[] = [];
  const yFt = stageHeight + wallPadding + stationDiameter / 2;
  
  // Center the row
  const rowWidth = actualCount * stationDiameter;
  const startX = wallPadding + (usableWidth - rowWidth) / 2 + stationDiameter / 2;
  
  for (let i = 0; i < actualCount; i++) {
    const xFt = startX + i * stationDiameter;
    positions.push({
      spotId: i + 1,
      positionX: Math.round((xFt / roomWidth) * 100 * 10) / 10,
      positionY: Math.round((yFt / roomHeight) * 100 * 10) / 10,
    });
  }
  
  let warning: string | undefined;
  if (totalSpots > maxCapacity) {
    warning = `Requested ${totalSpots} stations, but wall can only fit ${maxCapacity}. Placed ${actualCount} stations.`;
  }
  
  return {
    positions,
    maxCapacity,
    actualCount,
    warning,
    equipmentProfile: profile,
    stationSpacing: stationDiameter,
  };
}

/**
 * Main layout generator - routes to appropriate preset
 * Returns full result with capacity info
 */
export function generateLayout(config: LayoutConfig): LayoutPosition[] {
  const result = generateLayoutWithCapacity(config);
  return result.positions;
}

/**
 * Generate layout with full capacity information
 */
export function generateLayoutWithCapacity(config: LayoutConfig): LayoutResult {
  switch (config.preset) {
    case "grid":
      return generateGridLayout(config);
    case "staggered":
      return generateStaggeredLayout(config);
    case "perimeter":
      return generatePerimeterLayout(config);
    case "bag_wall":
      return generateBagWallLayout(config);
    default:
      return generateGridLayout(config);
  }
}

/**
 * Calculate room capacity without generating layout
 */
export function getRoomCapacity(
  roomWidthFt: number,
  roomDepthFt: number,
  equipmentType: string = 'wavemaster_xxl',
  stageHeight: number = 3,
  useMinimumClearance: boolean = false
): {
  maxCapacity: number;
  maxColumns: number;
  maxRows: number;
  stationSpacing: number;
  warning?: string;
  equipmentProfile: EquipmentProfile;
} {
  const profile = WAVEMASTER_XXL; // Could look up by equipmentType
  const capacity = calculateMaxCapacity(
    roomWidthFt,
    roomDepthFt - stageHeight,
    profile,
    useMinimumClearance
  );
  
  return {
    ...capacity,
    equipmentProfile: profile,
  };
}
