/**
 * Layout Generator - Creates spot positions based on presets
 * All positions are normalized (0-100) for percentage-based rendering
 */

interface LayoutPosition {
  spotId: number;
  positionX: number; // 0-100
  positionY: number; // 0-100
}

interface LayoutConfig {
  preset: string;
  rows: number;
  cols: number;
  spacing: number; // feet
  padding: number; // feet
  roomWidth: number; // feet
  roomHeight: number; // feet
  totalSpots: number;
  stageHeight?: number; // feet reserved for stage
}

/**
 * Generate grid layout - uniform rows and columns
 */
export function generateGridLayout(config: LayoutConfig): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const { rows, cols, padding, roomWidth, roomHeight, totalSpots, stageHeight = 5 } = config;

  // Available space (excluding padding and stage)
  const availableWidth = roomWidth - padding * 2;
  const availableHeight = roomHeight - padding * 2 - stageHeight;

  // Calculate spacing between spots
  const spotSpacingX = availableWidth / (cols + 1);
  const spotSpacingY = availableHeight / (rows + 1);

  let spotIndex = 0;
  for (let row = 0; row < rows && spotIndex < totalSpots; row++) {
    for (let col = 0; col < cols && spotIndex < totalSpots; col++) {
      const x = padding + spotSpacingX * (col + 1);
      const y = padding + stageHeight + spotSpacingY * (row + 1);

      // Convert to percentage (0-100)
      const positionX = (x / roomWidth) * 100;
      const positionY = (y / roomHeight) * 100;

      positions.push({
        spotId: spotIndex + 1,
        positionX: Math.round(positionX),
        positionY: Math.round(positionY),
      });

      spotIndex++;
    }
  }

  return positions;
}

/**
 * Generate staggered layout - offset rows for depth effect
 */
export function generateStaggeredLayout(config: LayoutConfig): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const { rows, cols, padding, roomWidth, roomHeight, totalSpots, stageHeight = 5 } = config;

  const availableWidth = roomWidth - padding * 2;
  const availableHeight = roomHeight - padding * 2 - stageHeight;

  const spotSpacingX = availableWidth / (cols + 1);
  const spotSpacingY = availableHeight / (rows + 1);

  let spotIndex = 0;
  for (let row = 0; row < rows && spotIndex < totalSpots; row++) {
    // Offset every other row for staggered effect
    const offset = row % 2 === 1 ? spotSpacingX / 2 : 0;

    for (let col = 0; col < cols && spotIndex < totalSpots; col++) {
      const x = padding + spotSpacingX * (col + 1) + offset;
      const y = padding + stageHeight + spotSpacingY * (row + 1);

      // Clamp to room boundaries
      const clampedX = Math.max(padding, Math.min(x, roomWidth - padding));
      const clampedY = Math.max(padding + stageHeight, Math.min(y, roomHeight - padding));

      const positionX = (clampedX / roomWidth) * 100;
      const positionY = (clampedY / roomHeight) * 100;

      positions.push({
        spotId: spotIndex + 1,
        positionX: Math.round(positionX),
        positionY: Math.round(positionY),
      });

      spotIndex++;
    }
  }

  return positions;
}

/**
 * Generate perimeter layout - spots around the edges
 */
export function generatePerimeterLayout(config: LayoutConfig): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const { padding, roomWidth, roomHeight, totalSpots, stageHeight = 5 } = config;

  const availableWidth = roomWidth - padding * 2;
  const availableHeight = roomHeight - padding * 2 - stageHeight;

  const topY = padding + stageHeight;
  const bottomY = roomHeight - padding;
  const leftX = padding;
  const rightX = roomWidth - padding;

  let spotIndex = 0;

  // Top row
  const topSpots = Math.ceil(totalSpots / 4);
  for (let i = 0; i < topSpots && spotIndex < totalSpots; i++) {
    const x = leftX + (availableWidth / topSpots) * (i + 0.5);
    positions.push({
      spotId: spotIndex + 1,
      positionX: Math.round((x / roomWidth) * 100),
      positionY: Math.round((topY / roomHeight) * 100),
    });
    spotIndex++;
  }

  // Right column
  const rightSpots = Math.ceil(totalSpots / 4);
  for (let i = 0; i < rightSpots && spotIndex < totalSpots; i++) {
    const y = topY + (availableHeight / rightSpots) * (i + 0.5);
    positions.push({
      spotId: spotIndex + 1,
      positionX: Math.round((rightX / roomWidth) * 100),
      positionY: Math.round((y / roomHeight) * 100),
    });
    spotIndex++;
  }

  // Bottom row (reverse)
  const bottomSpots = Math.ceil(totalSpots / 4);
  for (let i = bottomSpots - 1; i >= 0 && spotIndex < totalSpots; i--) {
    const x = leftX + (availableWidth / bottomSpots) * (i + 0.5);
    positions.push({
      spotId: spotIndex + 1,
      positionX: Math.round((x / roomWidth) * 100),
      positionY: Math.round((bottomY / roomHeight) * 100),
    });
    spotIndex++;
  }

  // Left column (reverse)
  const leftSpots = Math.ceil(totalSpots / 4);
  for (let i = leftSpots - 1; i >= 0 && spotIndex < totalSpots; i--) {
    const y = topY + (availableHeight / leftSpots) * (i + 0.5);
    positions.push({
      spotId: spotIndex + 1,
      positionX: Math.round((leftX / roomWidth) * 100),
      positionY: Math.round((y / roomHeight) * 100),
    });
    spotIndex++;
  }

  return positions;
}

/**
 * Generate bag wall layout - single row at front
 */
export function generateBagWallLayout(config: LayoutConfig): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const { padding, roomWidth, roomHeight, totalSpots, stageHeight = 5 } = config;

  const availableWidth = roomWidth - padding * 2;
  const y = padding + stageHeight + 5; // 5 feet below stage

  for (let i = 0; i < totalSpots; i++) {
    const x = padding + (availableWidth / totalSpots) * (i + 0.5);

    positions.push({
      spotId: i + 1,
      positionX: Math.round((x / roomWidth) * 100),
      positionY: Math.round((y / roomHeight) * 100),
    });
  }

  return positions;
}

/**
 * Main layout generator - routes to appropriate preset
 */
export function generateLayout(config: LayoutConfig): LayoutPosition[] {
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
