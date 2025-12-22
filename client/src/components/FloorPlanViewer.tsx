import { useEffect, useRef } from "react";

interface Spot {
  id: number;
  spotNumber: number;
  spotLabel: string;
  positionX: number;
  positionY: number;
}

interface FloorPlan {
  id: number;
  roomName: string;
  lengthFeet: number | null;
  widthFeet: number | null;
  squareFeet: number | null;
  templateType: string;
  spots: Spot[];
}

interface FloorPlanViewerProps {
  floorPlan: FloorPlan;
  highlightedSpots?: number[]; // Array of spot IDs to highlight
  onSpotClick?: (spot: Spot) => void;
}

export function FloorPlanViewer({
  floorPlan,
  highlightedSpots = [],
  onSpotClick,
}: FloorPlanViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Draw room outline
    ctx.strokeStyle = "#64748b"; // slate-500
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Draw room dimensions label
    ctx.fillStyle = "#94a3b8"; // slate-400
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    const dimensionText = `${floorPlan.lengthFeet || "?"} ft × ${
      floorPlan.widthFeet || "?"
    } ft`;
    ctx.fillText(dimensionText, canvas.width / 2, 30);

    // Draw spots
    floorPlan.spots.forEach((spot) => {
      const x = (spot.positionX / 100) * (canvas.width - 40) + 20;
      const y = (spot.positionY / 100) * (canvas.height - 40) + 20;

      const isHighlighted = highlightedSpots.includes(spot.id);

      // Draw spot circle
      ctx.beginPath();
      ctx.arc(x, y, isHighlighted ? 18 : 15, 0, 2 * Math.PI);
      ctx.fillStyle = isHighlighted ? "#e53935" : "#3b82f6"; // red or blue
      ctx.fill();
      ctx.strokeStyle = isHighlighted ? "#b71c1c" : "#1e40af";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw spot label
      ctx.fillStyle = "#ffffff";
      ctx.font = isHighlighted ? "bold 12px sans-serif" : "11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(spot.spotLabel, x, y);
    });

    // Draw template type badge
    ctx.fillStyle = "rgba(30, 41, 59, 0.9)"; // slate-800 with opacity
    ctx.fillRect(canvas.width - 150, canvas.height - 40, 140, 30);
    ctx.fillStyle = "#f1f5f9"; // slate-100
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(
      `Template: ${floorPlan.templateType}`,
      canvas.width - 145,
      canvas.height - 22
    );
  }, [floorPlan, highlightedSpots]);

  // Handle canvas click to detect spot clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSpotClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if click is near any spot
    for (const spot of floorPlan.spots) {
      const spotX = (spot.positionX / 100) * (canvas.width - 40) + 20;
      const spotY = (spot.positionY / 100) * (canvas.height - 40) + 20;

      const distance = Math.sqrt(
        Math.pow(clickX - spotX, 2) + Math.pow(clickY - spotY, 2)
      );

      if (distance <= 18) {
        // Click radius
        onSpotClick(spot);
        break;
      }
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {floorPlan.roomName}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {floorPlan.spots.length} spots • {floorPlan.templateType} layout
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full cursor-pointer"
          style={{ maxWidth: "100%" }}
        />
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-700" />
          <span className="text-slate-600 dark:text-slate-400">
            Available Spot
          </span>
        </div>
        {highlightedSpots.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-700" />
            <span className="text-slate-600 dark:text-slate-400">
              Highlighted
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
