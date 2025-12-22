import { useEffect, useRef, useState } from "react";
import { User, Package, Grid3x3, Users } from "lucide-react";

interface Spot {
  id: number;
  spotNumber: number;
  spotLabel: string;
  positionX: number;
  positionY: number;
  spotType: "bag" | "mat" | "rank_position";
  rowPosition?: "front" | "middle" | "back";
  beltRank?: string;
}

interface FloorPlan {
  id: number;
  roomName: string;
  lengthFeet: number | null;
  widthFeet: number | null;
  squareFeet: number | null;
  templateType: string;
  matRotation?: "horizontal" | "vertical" | null;
  spots: Spot[];
}

interface FloorPlanViewerProps {
  floorPlan: FloorPlan;
  highlightedSpots?: number[]; // Array of spot IDs to highlight
  onSpotClick?: (spot: Spot) => void;
  livePreview?: boolean; // Toggle for live class preview mode
  assignedStudents?: { spotId: number; studentName: string; beltRank?: string }[];
}

// Belt rank colors for karate template
const BELT_COLORS: Record<string, string> = {
  white: "#f8f9fa",
  yellow: "#ffd700",
  orange: "#ff8c00",
  green: "#32cd32",
  blue: "#1e90ff",
  purple: "#9370db",
  brown: "#8b4513",
  red: "#dc143c",
  black: "#1a1a1a",
};

// Rendering helper functions for each spot type
function renderBagSpot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  spot: any,
  isHighlighted: boolean,
  isEmpty: boolean,
  assignment: any
) {
  // Draw bag icon (rectangular bag shape)
  const bagWidth = 24;
  const bagHeight = 36;

  // Shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Bag body
  ctx.fillStyle = isEmpty ? "#6b7280" : "#dc2626"; // Red for bags
  ctx.fillRect(x - bagWidth / 2, y - bagHeight / 2, bagWidth, bagHeight);

  // Bag outline
  ctx.strokeStyle = isHighlighted ? "#b71c1c" : "#991b1b";
  ctx.lineWidth = isHighlighted ? 3 : 2;
  ctx.strokeRect(x - bagWidth / 2, y - bagHeight / 2, bagWidth, bagHeight);

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // Draw bag number
  ctx.fillStyle = isEmpty ? "#9ca3af" : "#ffffff";
  ctx.font = isHighlighted ? "bold 14px sans-serif" : "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (assignment) {
    const initials = assignment.studentName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();
    ctx.fillText(initials, x, y);
  } else {
    ctx.fillText(spot.spotNumber.toString(), x, y);
  }
}

function renderMatSpot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  spot: any,
  isHighlighted: boolean,
  isEmpty: boolean,
  assignment: any,
  rotation: "horizontal" | "vertical" = "horizontal"
) {
  // Draw mat with rotation support
  // Horizontal: 30px wide × 18px tall (6ft × 2ft ratio)
  // Vertical: 18px wide × 30px tall (2ft × 6ft ratio)
  const matWidth = rotation === "horizontal" ? 30 : 18;
  const matHeight = rotation === "horizontal" ? 18 : 30;

  // Shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Mat body
  ctx.fillStyle = isEmpty ? "#6b7280" : "#7c3aed"; // Purple for mats
  ctx.fillRect(x - matWidth / 2, y - matHeight / 2, matWidth, matHeight);

  // Mat outline
  ctx.strokeStyle = isHighlighted ? "#b71c1c" : "#5b21b6";
  ctx.lineWidth = isHighlighted ? 3 : 2;
  ctx.strokeRect(x - matWidth / 2, y - matHeight / 2, matWidth, matHeight);

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // Draw mat label
  ctx.fillStyle = isEmpty ? "#9ca3af" : "#ffffff";
  ctx.font = isHighlighted ? "bold 10px sans-serif" : "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (assignment) {
    const initials = assignment.studentName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();
    ctx.fillText(initials, x, y);
  } else {
    ctx.fillText(spot.spotLabel, x, y);
  }
}

function renderRankPosition(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  spot: any,
  isHighlighted: boolean,
  isEmpty: boolean,
  assignment: any,
  rowPosition: "front" | "middle" | "back"
) {
  // Determine spot size based on row position (front row larger)
  let spotRadius = 15;
  if (rowPosition === "front") spotRadius = 18;
  if (rowPosition === "back") spotRadius = 13;
  if (isHighlighted) spotRadius += 3;

  // Get belt color
  let spotColor = "#3b82f6"; // Default blue
  if (assignment?.beltRank) {
    const rank = assignment.beltRank.toLowerCase().replace(" belt", "");
    spotColor = BELT_COLORS[rank] || "#3b82f6";
  } else if (isEmpty) {
    spotColor = "#6b7280"; // Gray for empty
  }

  // Draw spot circle with shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.beginPath();
  ctx.arc(x, y, spotRadius, 0, 2 * Math.PI);
  ctx.fillStyle = spotColor;
  ctx.fill();

  // Draw rank-based outline (belt color ring)
  if (assignment?.beltRank) {
    const rank = assignment.beltRank.toLowerCase().replace(" belt", "");
    ctx.strokeStyle = BELT_COLORS[rank] || "#3b82f6";
    ctx.lineWidth = 3;
    ctx.stroke();
  } else {
    ctx.strokeStyle = isHighlighted ? "#b71c1c" : "#1e3a8a";
    ctx.lineWidth = isHighlighted ? 3 : 2;
    ctx.stroke();
  }

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // Draw spot label or student initials
  ctx.fillStyle = isEmpty ? "#9ca3af" : "#ffffff";
  ctx.font = isHighlighted
    ? "bold 11px sans-serif"
    : isEmpty
    ? "10px sans-serif"
    : "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (assignment) {
    const initials = assignment.studentName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();
    ctx.fillText(initials, x, y);
  } else {
    ctx.fillText(spot.spotLabel, x, y);
  }
}

export function FloorPlanViewer({
  floorPlan,
  highlightedSpots = [],
  onSpotClick,
  livePreview = false,
  assignedStudents = [],
}: FloorPlanViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Determine row position based on Y coordinate
  const getRowPosition = (positionY: number): "front" | "middle" | "back" => {
    if (positionY < 33) return "front";
    if (positionY < 67) return "middle";
    return "back";
  };

  // Get belt color for a spot
  const getBeltColor = (spot: Spot): string => {
    if (!livePreview) return "#3b82f6"; // Default blue

    const assignment = assignedStudents.find((a) => a.spotId === spot.id);
    if (assignment?.beltRank) {
      const rank = assignment.beltRank.toLowerCase().replace(" belt", "");
      return BELT_COLORS[rank] || "#3b82f6";
    }
    return "#6b7280"; // Gray for empty spots in live preview
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const containerWidth = canvas.parentElement?.clientWidth || 800;
    const aspectRatio =
      (floorPlan.widthFeet || 40) / (floorPlan.lengthFeet || 40);
    canvas.width = containerWidth;
    canvas.height = containerWidth / aspectRatio;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dojo mat background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#2d3748"); // Dark gray-blue
    gradient.addColorStop(0.5, "#374151"); // Medium gray
    gradient.addColorStop(1, "#1f2937"); // Darker gray
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle texture pattern
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    for (let i = 0; i < canvas.width; i += 20) {
      for (let j = 0; j < canvas.height; j += 20) {
        if ((i + j) % 40 === 0) {
          ctx.fillRect(i, j, 10, 10);
        }
      }
    }

    // Draw room outline with padding
    const padding = 40;
    ctx.strokeStyle = "#4b5563"; // Gray-600
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      padding,
      padding,
      canvas.width - padding * 2,
      canvas.height - padding * 2
    );
    ctx.setLineDash([]);

    // Draw "FRONT OF CLASS" indicator at top
    const frontY = padding - 10;
    ctx.fillStyle = "#ef4444"; // Red
    ctx.fillRect(canvas.width / 2 - 80, frontY - 20, 160, 24);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FRONT OF CLASS", canvas.width / 2, frontY - 8);

    // Draw instructor position marker
    const instructorX = canvas.width / 2;
    const instructorY = padding + 15;
    
    // Draw instructor icon background
    ctx.fillStyle = "#ef4444"; // Red
    ctx.beginPath();
    ctx.arc(instructorX, instructorY, 12, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw simple instructor icon (person silhouette)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    // Head
    ctx.beginPath();
    ctx.arc(instructorX, instructorY - 3, 3, 0, 2 * Math.PI);
    ctx.stroke();
    // Body
    ctx.beginPath();
    ctx.moveTo(instructorX, instructorY);
    ctx.lineTo(instructorX, instructorY + 6);
    ctx.stroke();
    // Arms
    ctx.beginPath();
    ctx.moveTo(instructorX - 4, instructorY + 2);
    ctx.lineTo(instructorX + 4, instructorY + 2);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "9px sans-serif";
    ctx.fillText("INSTRUCTOR", instructorX, instructorY + 20);

    // Draw spots with template-aware rendering
    floorPlan.spots.forEach((spot) => {
      const x =
        (spot.positionX / 100) * (canvas.width - padding * 2) + padding;
      const y =
        (spot.positionY / 100) * (canvas.height - padding * 2) + padding;

      const rowPosition = getRowPosition(spot.positionY);
      const isHighlighted = highlightedSpots.includes(spot.id);
      const assignment = assignedStudents.find((a) => a.spotId === spot.id);
      const isEmpty = livePreview && !assignment;
      const spotOpacity = isEmpty ? 0.3 : 1.0;

      ctx.globalAlpha = spotOpacity;

      // Render based on spot type
      if (spot.spotType === "bag") {
        renderBagSpot(ctx, x, y, spot, isHighlighted, isEmpty, assignment);
      } else if (spot.spotType === "mat") {
        renderMatSpot(
          ctx,
          x,
          y,
          spot,
          isHighlighted,
          isEmpty,
          assignment,
          floorPlan.matRotation || "horizontal"
        );
      } else if (spot.spotType === "rank_position") {
        renderRankPosition(ctx, x, y, spot, isHighlighted, isEmpty, assignment, rowPosition);
      }

      ctx.globalAlpha = 1.0;
    });

    // Draw room dimensions label
    ctx.fillStyle = "#9ca3af"; // Gray-400
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    const dimensionText = `${floorPlan.lengthFeet || "?"} ft × ${
      floorPlan.widthFeet || "?"
    } ft`;
    ctx.fillText(dimensionText, canvas.width - padding, canvas.height - 10);

    // Draw template type badge
    ctx.fillStyle = "rgba(17, 24, 39, 0.85)"; // Gray-900 with opacity
    ctx.fillRect(padding, canvas.height - 35, 150, 25);
    ctx.fillStyle = "#f3f4f6"; // Gray-100
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(
      `Template: ${floorPlan.templateType}`,
      padding + 8,
      canvas.height - 20
    );
  }, [floorPlan, highlightedSpots, livePreview, assignedStudents]);

  // Handle canvas click to detect spot clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSpotClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const padding = 40;

    // Check if click is near any spot
    for (const spot of floorPlan.spots) {
      const spotX =
        (spot.positionX / 100) * (canvas.width - padding * 2) + padding;
      const spotY =
        (spot.positionY / 100) * (canvas.height - padding * 2) + padding;

      const distance = Math.sqrt(
        Math.pow(clickX - spotX, 2) + Math.pow(clickY - spotY, 2)
      );

      if (distance <= 20) {
        // Click radius
        onSpotClick(spot);
        break;
      }
    }
  };

  const occupiedCount = assignedStudents.length;
  const totalSpots = floorPlan.spots.length;
  const capacityPercentage = Math.round((occupiedCount / totalSpots) * 100);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            {floorPlan.templateType === "kickboxing_bags" && (
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg" title="Kickboxing Bags Template">
                <Package className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            )}
            {floorPlan.templateType === "yoga_grid" && (
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg" title="Yoga Grid Template">
                <Grid3x3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            )}
            {floorPlan.templateType === "karate_lines" && (
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg" title="Karate Lines Template">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {floorPlan.roomName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {floorPlan.spots.length} spots
              </p>
              <span className="text-slate-400">•</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {floorPlan.templateType === "kickboxing_bags" && "Kickboxing Bags"}
                {floorPlan.templateType === "yoga_grid" && "Yoga Grid"}
                {floorPlan.templateType === "karate_lines" && "Karate Lines"}
              </span>
            </div>
          </div>
        </div>
        {livePreview && (
          <div className="text-right">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Capacity: {occupiedCount} / {totalSpots}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {capacityPercentage}% full
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-lg p-2 border-2 border-slate-700">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full cursor-pointer rounded"
          style={{ maxWidth: "100%" }}
        />
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm flex-wrap">
        {!livePreview ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-800" />
              <span className="text-slate-600 dark:text-slate-400">
                Available Spot
              </span>
            </div>
            {highlightedSpots.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-800" />
                <span className="text-slate-600 dark:text-slate-400">
                  Highlighted
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-800" />
              <span className="text-slate-600 dark:text-slate-400">
                Occupied ({occupiedCount})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-500 border-2 border-gray-700 opacity-30" />
              <span className="text-slate-600 dark:text-slate-400">
                Empty ({totalSpots - occupiedCount})
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
