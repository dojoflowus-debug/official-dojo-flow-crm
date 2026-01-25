import React from "react";

interface Spot {
  id: number;
  spotNumber: number;
  spotLabel: string;
  positionX: number;
  positionY: number;
  spotType: "bag" | "mat" | "rank_position";
}

interface FloorPlanDebugOverlayProps {
  spots: Spot[];
  roomWidth: number;
  roomHeight: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function FloorPlanDebugOverlay({
  spots,
  roomWidth,
  roomHeight,
  containerRef,
}: FloorPlanDebugOverlayProps) {
  // Calculate bounds
  const positionsX = spots.map((s) => s.positionX);
  const positionsY = spots.map((s) => s.positionY);
  const minX = Math.min(...positionsX);
  const maxX = Math.max(...positionsX);
  const minY = Math.min(...positionsY);
  const maxY = Math.max(...positionsY);

  // Detect overlaps (spots within 5% of each other)
  const overlaps = spots.filter((spot, idx) => {
    return spots.some((other, otherIdx) => {
      if (idx === otherIdx) return false;
      const distX = Math.abs(spot.positionX - other.positionX);
      const distY = Math.abs(spot.positionY - other.positionY);
      return distX < 5 && distY < 5;
    });
  });

  // Detect out-of-bounds spots
  const outOfBounds = spots.filter((s) => s.positionX < 0 || s.positionX > 100 || s.positionY < 0 || s.positionY > 100);

  // Get container dimensions for pixel conversion
  const containerRect = containerRef.current?.getBoundingClientRect();
  const containerWidth = containerRect?.width || 1;
  const containerHeight = containerRect?.height || 1;

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-black/80 text-white text-xs p-3 rounded-lg border border-white/20 font-mono max-w-xs">
      <div className="mb-2 font-bold text-yellow-400">🐛 DEBUG OVERLAY</div>
      
      <div className="space-y-1 mb-3 text-white/80">
        <div>Total Spots: {spots.length}</div>
        <div>Room: {roomWidth} ft × {roomHeight} ft</div>
        <div>Container: {Math.round(containerWidth)} × {Math.round(containerHeight)} px</div>
      </div>

      <div className="space-y-1 mb-3 border-t border-white/20 pt-2">
        <div className="text-cyan-400">Position Range (%):</div>
        <div>X: {minX.toFixed(1)}% → {maxX.toFixed(1)}%</div>
        <div>Y: {minY.toFixed(1)}% → {maxY.toFixed(1)}%</div>
      </div>

      <div className="space-y-1 mb-3 border-t border-white/20 pt-2">
        <div className={overlaps.length > 0 ? "text-red-400" : "text-green-400"}>
          Overlaps: {overlaps.length}
        </div>
        {overlaps.length > 0 && (
          <div className="text-red-300">
            Spots: {overlaps.map((s) => s.spotNumber).join(", ")}
          </div>
        )}
      </div>

      <div className="space-y-1 border-t border-white/20 pt-2">
        <div className={outOfBounds.length > 0 ? "text-red-400" : "text-green-400"}>
          Out-of-Bounds: {outOfBounds.length}
        </div>
        {outOfBounds.length > 0 && (
          <div className="text-red-300">
            Spots: {outOfBounds.map((s) => s.spotNumber).join(", ")}
          </div>
        )}
      </div>

      {/* Minimap */}
      <div className="mt-3 border-t border-white/20 pt-2">
        <div className="text-cyan-400 mb-1">Minimap:</div>
        <svg
          width="120"
          height="80"
          className="border border-white/20 bg-black/50 rounded"
          viewBox="0 0 100 100"
        >
          {/* Room rectangle */}
          <rect x="0" y="0" width="100" height="100" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />

          {/* Spots as dots */}
          {spots.map((spot) => {
            const isOverlap = overlaps.some((o) => o.id === spot.id);
            const isOOB = outOfBounds.some((o) => o.id === spot.id);
            const color = isOOB ? "#ff4444" : isOverlap ? "#ffaa00" : "#44ff44";

            return (
              <circle
                key={spot.id}
                cx={spot.positionX}
                cy={spot.positionY}
                r="1.5"
                fill={color}
                opacity="0.8"
              />
            );
          })}

          {/* Bounds box */}
          {spots.length > 0 && (
            <rect
              x={minX}
              y={minY}
              width={maxX - minX}
              height={maxY - minY}
              fill="none"
              stroke="rgba(100,200,255,0.4)"
              strokeWidth="0.3"
              strokeDasharray="1,1"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
