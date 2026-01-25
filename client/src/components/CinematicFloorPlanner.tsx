import React from "react";
import { Eye, Pencil, MonitorPlay, Tv, Settings, Users, Package, Grid3x3, ZoomIn, ZoomOut, Maximize2, Move, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { LayoutControls } from "./LayoutControls";
import { generateLayout } from "@/lib/layoutGenerator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Types
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

interface AssignedStudent {
  spotId: number;
  studentName: string;
  beltRank?: string;
  initials?: string;
}

interface Zone {
  id: string;
  name: string;
  type: "karate" | "kickboxing" | "yoga" | "dance" | "gymnastics";
  bounds: { x: number; y: number; width: number; height: number };
}

type ViewMode = "design" | "kiosk" | "live" | "wall";

interface CinematicFloorPlannerProps {
  floorPlan: FloorPlan;
  assignedStudents?: AssignedStudent[];
  onSpotClick?: (spot: Spot) => void;
  onModeChange?: (mode: ViewMode) => void;
  initialMode?: ViewMode;
  zones?: Zone[];
  showModeSwitch?: boolean;
}

// Belt rank colors
const BELT_COLORS: Record<string, string> = {
  white: "#e8e8e8",
  yellow: "#f5c542",
  orange: "#e87d2d",
  green: "#2d9e5c",
  blue: "#3b7dd8",
  purple: "#8b5cf6",
  brown: "#8b5a2b",
  red: "#dc2626",
  black: "#2a2a2a",
};

// Mode configurations
const MODE_CONFIG = {
  design: { icon: Pencil, label: "Design", description: "Edit layout" },
  kiosk: { icon: Eye, label: "Kiosk Preview", description: "Student view" },
  live: { icon: MonitorPlay, label: "Live Class", description: "Active session" },
  wall: { icon: Tv, label: "Wall Display", description: "TV screens" },
};

// Draggable Spot Marker with drag-and-drop support
function DraggableSpotMarker({
  spot,
  assignment,
  isHighlighted,
  isSelected,
  onClick,
  mode,
  templateType,
  scale = 1,
  isDraggable,
  onDragStart,
  onDrag,
  onDragEnd,
  isDragging,
}: {
  spot: Spot;
  assignment?: AssignedStudent;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
  mode: ViewMode;
  templateType: string;
  scale?: number;
  isDraggable: boolean;
  onDragStart: (spotId: number, e: React.MouseEvent) => void;
  onDrag: (spotId: number, e: React.MouseEvent) => void;
  onDragEnd: (spotId: number) => void;
  isDragging: boolean;
}) {
  const isEmpty = !assignment;
  const isKiosk = mode === "kiosk";
  const isLive = mode === "live";
  const isDesign = mode === "design";

  // Get initials
  const initials = assignment?.initials || assignment?.studentName
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "";

  // Glow ring color - teal/cyan for available, amber/orange for occupied (matching reference)
  const ringColor = isEmpty 
    ? "rgba(45, 212, 191, 0.7)" // teal/cyan for available
    : "rgba(255, 140, 60, 0.8)"; // amber/orange for occupied

  // Check for special roles
  const isInstructor = assignment?.beltRank?.toLowerCase().includes("instructor");
  const isReserved = assignment?.beltRank?.toLowerCase().includes("reserved");

  // Determine spot styling based on template type
  const isBag = spot.spotType === "bag" || templateType === "kickboxing_bags";
  const isMat = spot.spotType === "mat" || templateType === "yoga_grid";

  // Scale factor for bag size based on zoom
  const bagScale = Math.max(0.6, Math.min(1.2, scale));

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDraggable && isDesign) {
      e.preventDefault();
      e.stopPropagation();
      onDragStart(spot.id, e);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (!isDragging) {
          onClick();
        }
      }}
      onMouseDown={handleMouseDown}
      className={cn(
        "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all group",
        isSelected && "z-50",
        isDragging ? "z-[100] cursor-grabbing duration-0" : "duration-200",
        isDraggable && isDesign && !isDragging && "cursor-grab hover:scale-105",
        !isDraggable && "cursor-pointer"
      )}
      style={{
        left: `${spot.positionX}%`,
        top: `${spot.positionY}%`,
        opacity: isDragging ? 0.9 : 1,
      }}
    >
      {/* Drag indicator for Design mode */}
      {isDraggable && isDesign && !isDragging && (
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: "rgba(45, 212, 191, 0.9)",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "9px",
            color: "white",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          <GripVertical className="w-3 h-3 inline-block mr-1" />
          Drag to move
        </div>
      )}

      {/* Large elliptical floor glow ring - matching reference exactly */}
      <div 
        className={cn(
          "absolute rounded-full transition-all duration-500",
          isEmpty && (isKiosk || isLive) && "animate-pulse",
          isDragging && "ring-2 ring-teal-400 ring-offset-2 ring-offset-transparent"
        )}
        style={{
          width: `${120 * bagScale}px`,
          height: `${40 * bagScale}px`,
          bottom: "0px",
          left: "50%",
          transform: "translateX(-50%)",
          background: isDragging 
            ? `radial-gradient(ellipse 100% 100% at center, rgba(45, 212, 191, 0.9) 0%, rgba(45, 212, 191, 0.5) 40%, rgba(45, 212, 191, 0.2) 70%, transparent 100%)`
            : `radial-gradient(ellipse 100% 100% at center, ${ringColor} 0%, ${ringColor}50 40%, ${ringColor}20 70%, transparent 100%)`,
          filter: "blur(12px)",
          opacity: isDragging ? 1 : 0.85,
        }}
      />

      {/* Ring outline - visible border like reference */}
      <div 
        className="absolute rounded-full"
        style={{
          width: `${100 * bagScale}px`,
          height: `${32 * bagScale}px`,
          bottom: `${4 * bagScale}px`,
          left: "50%",
          transform: "translateX(-50%)",
          border: isDragging 
            ? "2px solid rgba(45,212,191,0.8)"
            : `1.5px solid ${isEmpty ? "rgba(45,212,191,0.5)" : "rgba(255,140,60,0.6)"}`,
          borderRadius: "50%",
          opacity: 0.8,
        }}
      />

      {/* Main spot container */}
      {isBag ? (
        // 3D Kickboxing Bag - Matching reference: wider trapezoidal shape with tapered base
        <div
          className={cn(
            "flex flex-col items-center justify-center transition-all",
            !isDragging && "group-hover:scale-105 group-hover:-translate-y-1",
            isSelected && !isDragging && "scale-105 -translate-y-1",
            isDragging && "scale-110"
          )}
        >
          {/* Bag number badge - red circle on TOP of bag (matching reference) */}
          <div 
            className={cn(
              "rounded-md flex items-center justify-center z-20",
              isEmpty ? "bg-zinc-700" : "bg-red-600"
            )}
            style={{
              position: "absolute",
              top: `${-14 * bagScale}px`,
              left: "50%",
              transform: "translateX(-50%)",
              width: `${24 * bagScale}px`,
              height: `${20 * bagScale}px`,
              fontSize: `${12 * bagScale}px`,
              fontWeight: 700,
              color: "white",
              borderRadius: "4px",
              boxShadow: isEmpty 
                ? "0 2px 8px rgba(0,0,0,0.6)"
                : "0 2px 12px rgba(220,38,38,0.7), 0 0 20px rgba(220,38,38,0.5)",
            }}
          >
            {spot.spotNumber}
          </div>

          {/* Bag body - trapezoidal shape matching reference (wider at top, tapered at bottom) */}
          <div 
            className="relative overflow-hidden"
            style={{
              width: `${48 * bagScale}px`,
              height: `${72 * bagScale}px`,
              clipPath: "polygon(5% 0%, 95% 0%, 85% 100%, 15% 100%)",
              background: "linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 20%, #1a1a1a 60%, #0d0d0d 100%)",
              boxShadow: isDragging
                ? "0 20px 50px rgba(0,0,0,0.9), 0 10px 25px rgba(45,212,191,0.3)"
                : "0 15px 40px rgba(0,0,0,0.8), 0 8px 20px rgba(0,0,0,0.6)",
            }}
          >
            {/* Left edge highlight */}
            <div 
              className="absolute left-0 top-0 bottom-0"
              style={{
                width: "4px",
                background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.01) 100%)",
              }}
            />
            
            {/* Center specular highlight */}
            <div 
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 35%, rgba(255,255,255,0.05) 50%, transparent 65%)",
              }}
            />
            
            {/* Red accent panel for occupied bags - matching reference */}
            {!isEmpty && (
              <div 
                className="absolute top-2 left-2 right-2 rounded-sm"
                style={{
                  height: `${28 * bagScale}px`,
                  background: "linear-gradient(180deg, #ef4444 0%, #dc2626 40%, #b91c1c 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 6px rgba(0,0,0,0.4)",
                }}
              >
                {/* Red panel shine */}
                <div 
                  className="absolute inset-0 rounded-sm"
                  style={{
                    background: "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.2) 50%, transparent 80%)",
                  }}
                />
                
                {/* Initials on red panel - matching reference (T.K., R.W., etc.) */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span 
                    className="text-white font-bold"
                    style={{ fontSize: `${13 * bagScale}px`, letterSpacing: "0.05em", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                  >
                    {initials}
                  </span>
                </div>
              </div>
            )}

            {/* Special labels - INSTRUCTOR / RESERVED */}
            {isInstructor && (
              <div 
                className="absolute bottom-2 left-0 right-0 flex items-center justify-center"
              >
                <span 
                  className="text-white/80 uppercase font-medium px-1 py-0.5 rounded"
                  style={{ 
                    fontSize: `${6 * bagScale}px`, 
                    letterSpacing: "0.08em",
                    background: "rgba(0,0,0,0.5)",
                  }}
                >
                  Instructor
                </span>
              </div>
            )}
            
            {isReserved && (
              <div 
                className="absolute bottom-2 left-0 right-0 flex items-center justify-center"
              >
                <span 
                  className="text-white/80 uppercase font-medium px-1 py-0.5 rounded"
                  style={{ 
                    fontSize: `${6 * bagScale}px`, 
                    letterSpacing: "0.08em",
                    background: "rgba(0,0,0,0.5)",
                  }}
                >
                  Reserved
                </span>
              </div>
            )}

            {/* Horizontal stripes on bag body (subtle detail) */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 8px,
                    rgba(255,255,255,0.03) 8px,
                    rgba(255,255,255,0.03) 9px
                  )
                `,
              }}
            />
          </div>

          {/* Bag base/stand - wider tapered base matching reference */}
          <div 
            style={{
              width: `${32 * bagScale}px`,
              height: `${12 * bagScale}px`,
              marginTop: "-2px",
              background: "linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)",
              clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)",
              boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
            }}
          />

          {/* Floor shadow directly under bag */}
          <div 
            className="absolute"
            style={{
              bottom: `${2 * bagScale}px`,
              width: `${50 * bagScale}px`,
              height: `${16 * bagScale}px`,
              left: "50%",
              transform: "translateX(-50%)",
              background: "radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 80%)",
              filter: "blur(6px)",
            }}
          />

          {/* Spot number label BELOW bag - matching reference (gray text) */}
          <div 
            className="absolute text-white/35 font-medium"
            style={{
              bottom: `${-24 * bagScale}px`,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: `${11 * bagScale}px`,
            }}
          >
            {spot.spotNumber}
          </div>
        </div>
      ) : isMat ? (
        // Yoga Mat
        <div
          className={cn(
            "flex items-center justify-center transition-all duration-300",
            "group-hover:scale-105",
            isSelected && "scale-105",
          )}
        >
          <div 
            className={cn(
              "rounded overflow-hidden relative",
              isEmpty ? "bg-zinc-700" : "bg-gradient-to-b from-purple-500 via-purple-600 to-purple-800",
            )}
            style={{
              width: `${56 * bagScale}px`,
              height: `${28 * bagScale}px`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                "font-medium",
                isEmpty ? "text-zinc-500" : "text-white/80"
              )} style={{ fontSize: `${10 * bagScale}px` }}>
                {assignment ? initials : spot.spotLabel}
              </span>
            </div>
          </div>
        </div>
      ) : (
        // Rank Position (circle)
        <div
          className={cn(
            "flex items-center justify-center transition-all duration-300",
            "group-hover:scale-105",
            isSelected && "scale-105",
          )}
        >
          <div 
            className={cn(
              "rounded-full flex items-center justify-center relative",
              isEmpty ? "bg-zinc-700" : "bg-gradient-to-br from-amber-400 to-amber-600",
            )}
            style={{
              width: `${36 * bagScale}px`,
              height: `${36 * bagScale}px`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <span className={cn(
              "font-medium",
              isEmpty ? "text-zinc-500" : "text-white"
            )} style={{ fontSize: `${10 * bagScale}px` }}>
              {assignment ? initials : spot.spotLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Front of Class Stage - Matching reference exactly
function FrontOfClassStage({ scale = 1 }: { scale?: number }) {
  return (
    <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ height: `${96 * scale}px` }}>
      {/* Dark wall background */}
      <div 
        className="absolute inset-x-4 top-2 rounded-lg overflow-hidden"
        style={{
          height: `${64 * scale}px`,
          background: `
            linear-gradient(180deg, 
              rgba(20, 18, 15, 0.98) 0%, 
              rgba(30, 25, 20, 0.96) 50%,
              rgba(25, 20, 15, 0.98) 100%
            )
          `,
          boxShadow: `
            0 8px 40px rgba(0,0,0,0.7), 
            inset 0 -2px 30px rgba(0,0,0,0.4)
          `,
          border: "1px solid rgba(255,150,100,0.06)",
        }}
      >
        {/* Warm overhead light strip - matching reference */}
        <div 
          className="absolute inset-x-0 top-0"
          style={{
            height: `${6 * scale}px`,
            background: "linear-gradient(90deg, transparent 5%, rgba(255,120,40,0.8) 25%, rgba(255,160,80,0.9) 50%, rgba(255,120,40,0.8) 75%, transparent 95%)",
            boxShadow: "0 0 25px rgba(255,130,50,0.6), 0 0 50px rgba(255,100,40,0.4)",
          }}
        />
        
        {/* Light glow spots on wall */}
        <div className="absolute inset-x-0 top-0 flex justify-around px-16" style={{ height: `${32 * scale}px` }}>
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="h-full"
              style={{
                width: `${80 * scale}px`,
                background: "radial-gradient(ellipse at center top, rgba(255,140,80,0.12) 0%, transparent 70%)",
              }}
            />
          ))}
        </div>

        {/* Stage glow bleeding onto floor */}
        <div 
          className="absolute inset-x-0 h-16"
          style={{
            bottom: `${-48 * scale}px`,
            background: "linear-gradient(180deg, rgba(255,100,40,0.08) 0%, rgba(255,80,40,0.03) 50%, transparent 100%)",
          }}
        />

        {/* FRONT OF CLASS label - matching reference exactly */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-white/50 font-semibold uppercase"
            style={{ 
              fontSize: `${13 * scale}px`,
              letterSpacing: "0.35em",
            }}
          >
            Front of Class
          </span>
        </div>

        {/* Instructor podium/marker - small rectangle below text */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1">
          <div 
            className="rounded-sm"
            style={{
              width: `${24 * scale}px`,
              height: `${12 * scale}px`,
              background: "linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Mode Switcher
function ModeSwitcher({ 
  currentMode, 
  onModeChange 
}: { 
  currentMode: ViewMode; 
  onModeChange: (mode: ViewMode) => void;
}) {
  return (
    <div 
      className="inline-flex items-center gap-0.5 p-0.5 rounded-lg"
      style={{
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {(Object.keys(MODE_CONFIG) as ViewMode[]).map((mode) => {
        const config = MODE_CONFIG[mode];
        const Icon = config.icon;
        const isActive = currentMode === mode;
        
        return (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md transition-all duration-200",
              isActive 
                ? "bg-white/10 text-white" 
                : "text-white/40 hover:text-white/60 hover:bg-white/5"
            )}
          >
            <Icon className="w-3 h-3" />
            <span style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.02em" }}>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Zoom Controls
function ZoomControls({ 
  zoom, 
  onZoomIn, 
  onZoomOut, 
  onFitToView,
  isPanning,
  onTogglePan,
}: { 
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
  isPanning: boolean;
  onTogglePan: () => void;
}) {
  return (
    <div 
      className="flex items-center gap-1 p-1 rounded-lg"
      style={{
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <button
        onClick={onZoomOut}
        className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <span className="text-white/50 px-2 min-w-[50px] text-center" style={{ fontSize: "11px" }}>
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={onZoomIn}
        className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-white/10 mx-1" />
      <button
        onClick={onFitToView}
        className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        title="Fit to View"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
      <button
        onClick={onTogglePan}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          isPanning 
            ? "text-teal-400 bg-teal-400/20" 
            : "text-white/50 hover:text-white hover:bg-white/10"
        )}
        title="Pan Mode"
      >
        <Move className="w-4 h-4" />
      </button>
    </div>
  );
}

// Legend - matching reference
function FloorLegend({ 
  templateType, 
  occupiedCount, 
  totalSpots,
  isDesignMode,
}: { 
  templateType: string;
  occupiedCount: number;
  totalSpots: number;
  isDesignMode: boolean;
}) {
  return (
    <div 
      className="flex items-center gap-6 px-4 py-2.5 rounded-lg mt-3"
      style={{
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* Available Spot */}
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{
            background: "rgba(45, 212, 191, 0.8)",
            boxShadow: "0 0 8px rgba(45, 212, 191, 0.5)",
          }}
        />
        <span className="text-white/50" style={{ fontSize: "11px" }}>Available Spot</span>
      </div>
      
      {/* Occupied Spot */}
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{
            background: "rgba(255, 140, 60, 0.8)",
            boxShadow: "0 0 8px rgba(255, 140, 60, 0.5)",
          }}
        />
        <span className="text-white/50" style={{ fontSize: "11px" }}>Occupied Spot</span>
      </div>

      {/* Design mode hint */}
      {isDesignMode && (
        <div className="flex items-center gap-2">
          <GripVertical className="w-3 h-3 text-teal-400" />
          <span className="text-teal-400/70" style={{ fontSize: "11px" }}>Drag bags to reposition</span>
        </div>
      )}

      {/* Spot count */}
      <div className="ml-auto text-white/40" style={{ fontSize: "11px" }}>
        {occupiedCount} / {totalSpots} spots
      </div>
    </div>
  );
}

// Main Component
export function CinematicFloorPlanner({
  floorPlan,
  assignedStudents = [],
  onSpotClick,
  onModeChange,
  initialMode = "design",
  zones = [],
  showModeSwitch = true,
}: CinematicFloorPlannerProps) {
  const [currentMode, setCurrentMode] = React.useState<ViewMode>(initialMode);
  const [selectedSpot, setSelectedSpot] = React.useState<number | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = React.useState(false);
  const [canvasDragStart, setCanvasDragStart] = React.useState({ x: 0, y: 0 });
  
  // Spot dragging state
  const [draggingSpotId, setDraggingSpotId] = React.useState<number | null>(null);
  const [spotPositions, setSpotPositions] = React.useState<Record<number, { x: number; y: number }>>({});
  const [dragStartPos, setDragStartPos] = React.useState({ x: 0, y: 0 });
  const [originalSpotPos, setOriginalSpotPos] = React.useState({ x: 0, y: 0 });
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);
  
  const updateSpotMutation = trpc.floorPlans.updateSpotPosition.useMutation();
  const utils = trpc.useUtils();

  // Calculate canvas height based on number of spots to ensure all are visible
  const spotCount = floorPlan.spots.length;
  const rows = Math.ceil(spotCount / 5); // Assume 5 columns
  const baseHeight = 500;
  const heightPerRow = 140;
  const calculatedHeight = Math.max(baseHeight, 200 + (rows * heightPerRow));

  const isDesignMode = currentMode === "design";

  const handleModeChange = (mode: ViewMode) => {
    setCurrentMode(mode);
    onModeChange?.(mode);
    // Clear dragging state when switching modes
    setDraggingSpotId(null);
  };

  const handleSpotClick = (spot: Spot) => {
    if (!isPanning && !draggingSpotId) {
      setSelectedSpot(spot.id);
      onSpotClick?.(spot);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleFitToView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleTogglePan = () => {
    setIsPanning(prev => !prev);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
    }
  };

  // Canvas pan handling
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only pan if in pan mode or middle mouse button, and not dragging a spot
    if ((isPanning || e.button === 1) && !draggingSpotId) {
      setIsDraggingCanvas(true);
      setCanvasDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setPan({
        x: e.clientX - canvasDragStart.x,
        y: e.clientY - canvasDragStart.y,
      });
    }
    
    // Handle spot dragging
    if (draggingSpotId !== null && canvasRef.current) {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      
      // Calculate new position as percentage
      const deltaX = (e.clientX - dragStartPos.x) / rect.width * 100;
      const deltaY = (e.clientY - dragStartPos.y) / rect.height * 100;
      
      const newX = Math.max(5, Math.min(95, originalSpotPos.x + deltaX));
      const newY = Math.max(15, Math.min(95, originalSpotPos.y + deltaY));
      
      setSpotPositions(prev => ({
        ...prev,
        [draggingSpotId]: { x: newX, y: newY }
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
    
    // Save spot position if dragging
    if (draggingSpotId !== null) {
      const newPos = spotPositions[draggingSpotId];
      if (newPos) {
        // Save to database
        updateSpotMutation.mutate({
          spotId: draggingSpotId,
          positionX: newPos.x,
          positionY: newPos.y,
        }, {
          onSuccess: () => {
            toast.success('Bag position saved');
            utils.floorPlans.getById.invalidate({ id: floorPlan.id });
          },
          onError: () => {
            toast.error('Failed to save position');
          }
        });
      }
      setDraggingSpotId(null);
    }
  };

  // Spot drag handlers
  const handleSpotDragStart = (spotId: number, e: React.MouseEvent) => {
    if (!isDesignMode) return;
    
    const spot = floorPlan.spots.find(s => s.id === spotId);
    if (!spot) return;
    
    setDraggingSpotId(spotId);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setOriginalSpotPos({ x: spot.positionX, y: spot.positionY });
    
    // Initialize position in local state
    setSpotPositions(prev => ({
      ...prev,
      [spotId]: { x: spot.positionX, y: spot.positionY }
    }));
  };

  const handleApplyLayout = async (layoutType: string) => {
    const newPositions = generateLayout(
      floorPlan.spots.length,
      layoutType,
      floorPlan.widthFeet || 40,
      floorPlan.lengthFeet || 30
    );
    
    for (let i = 0; i < floorPlan.spots.length; i++) {
      const spot = floorPlan.spots[i];
      const newPos = newPositions[i];
      if (newPos) {
        try {
          await updateSpotMutation.mutateAsync({
            spotId: spot.id,
            positionX: newPos.x,
            positionY: newPos.y,
          });
        } catch (error) {
          console.error('Failed to update spot position:', error);
        }
      }
    }
    
    utils.floorPlans.getById.invalidate({ id: floorPlan.id });
    toast.success(`Applied ${layoutType} layout`);
  };

  const handleResetLayout = () => {
    utils.floorPlans.getById.invalidate({ id: floorPlan.id });
    toast.info('Layout reset');
  };

  const handleSaveLayout = async () => {
    for (const spot of floorPlan.spots) {
      try {
        await updateSpotMutation.mutateAsync({
          spotId: spot.id,
          positionX: spot.positionX,
          positionY: spot.positionY,
        });
      } catch (error) {
        console.error('Failed to save spot position:', error);
      }
    }
    toast.success('Layout saved');
  };

  const occupiedCount = assignedStudents.length;
  const totalSpots = floorPlan.spots.length;

  // Get current position for a spot (from local state if dragging, otherwise from floorPlan)
  const getSpotPosition = (spot: Spot) => {
    if (spotPositions[spot.id]) {
      return spotPositions[spot.id];
    }
    return { x: spot.positionX, y: spot.positionY };
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header with mode switcher and zoom controls */}
      <div 
        className="flex items-center justify-between px-3 py-2 rounded-lg"
        style={{
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-white/50" style={{ fontSize: "11px" }}>View</span>
          <ZoomControls 
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitToView={handleFitToView}
            isPanning={isPanning}
            onTogglePan={handleTogglePan}
          />
        </div>
        
        {showModeSwitch && (
          <div className="flex items-center gap-2">
            <ModeSwitcher currentMode={currentMode} onModeChange={handleModeChange} />
            <button 
              className="p-1.5 rounded-md text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Design mode instruction banner */}
      {isDesignMode && (
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{
            background: "rgba(45, 212, 191, 0.1)",
            border: "1px solid rgba(45, 212, 191, 0.2)",
          }}
        >
          <GripVertical className="w-4 h-4 text-teal-400" />
          <span className="text-teal-400 text-sm">
            <strong>Design Mode:</strong> Drag bags to position them exactly where your hanging bags are located.
          </span>
        </div>
      )}

      {/* Floor Canvas - scrollable and zoomable */}
      <div 
        ref={containerRef}
        className="rounded-xl overflow-auto"
        style={{
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.04)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
          maxHeight: "70vh",
          cursor: isPanning ? (isDraggingCanvas ? "grabbing" : "grab") : "default",
        }}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        <div 
          ref={canvasRef}
          className="relative"
          style={{
            width: `${100 * zoom}%`,
            minWidth: "100%",
            height: `${calculatedHeight * zoom}px`,
            minHeight: `${calculatedHeight}px`,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: "top left",
            transition: isDraggingCanvas || draggingSpotId ? "none" : "transform 0.1s ease-out",
          }}
        >
          {/* Base floor - dark mat matching reference */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 90% 70% at center 40%, 
                  rgba(28, 32, 40, 1) 0%, 
                  rgba(20, 24, 32, 1) 40%,
                  rgba(14, 18, 24, 1) 70%,
                  rgba(8, 10, 14, 1) 100%
                )
              `,
            }}
          />

          {/* Mat texture - perspective grid lines */}
          <div 
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 50px,
                  rgba(255,255,255,0.03) 50px,
                  rgba(255,255,255,0.03) 51px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 50px,
                  rgba(255,255,255,0.03) 50px,
                  rgba(255,255,255,0.03) 51px
                )
              `,
            }}
          />

          {/* Darker vignette */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 85% 70% at center 45%, 
                  transparent 30%, 
                  rgba(0,0,0,0.4) 65%,
                  rgba(0,0,0,0.7) 100%
                )
              `,
            }}
          />

          {/* Perspective depth - top darker */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 30%, transparent 50%, transparent 80%, rgba(0,0,0,0.15) 100%)",
            }}
          />

          {/* Warm ambient light from stage */}
          <div 
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: `${192 * zoom}px`,
              background: "linear-gradient(180deg, rgba(255,100,40,0.08) 0%, rgba(255,80,40,0.03) 50%, transparent 100%)",
            }}
          />

          {/* Mat boundary - subtle dashed border */}
          <div 
            className="absolute rounded-lg pointer-events-none"
            style={{
              left: "16px",
              right: "16px",
              top: "16px",
              bottom: "16px",
              border: "1px dashed rgba(255,255,255,0.08)",
              boxShadow: "inset 0 0 60px rgba(0,0,0,0.25)",
            }}
          />

          {/* Front of Class Stage */}
          <FrontOfClassStage scale={zoom} />

          {/* Zones */}
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="absolute rounded-lg pointer-events-none"
              style={{
                left: `${zone.bounds.x}%`,
                top: `${zone.bounds.y}%`,
                width: `${zone.bounds.width}%`,
                height: `${zone.bounds.height}%`,
                border: "1px dashed rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.005)",
              }}
            >
              <span className="absolute top-2 left-2 text-white/20 font-medium" style={{ fontSize: "10px" }}>
                {zone.name}
              </span>
            </div>
          ))}

          {/* Spots Container */}
          <div className="absolute inset-0">
            {floorPlan.spots.map((spot) => {
              const assignment = assignedStudents.find((a) => a.spotId === spot.id);
              const position = getSpotPosition(spot);
              const spotWithPosition = { ...spot, positionX: position.x, positionY: position.y };
              
              return (
                <DraggableSpotMarker
                  key={spot.id}
                  spot={spotWithPosition}
                  assignment={assignment}
                  isHighlighted={false}
                  isSelected={selectedSpot === spot.id}
                  onClick={() => handleSpotClick(spot)}
                  mode={currentMode}
                  templateType={floorPlan.templateType}
                  scale={zoom}
                  isDraggable={isDesignMode}
                  onDragStart={handleSpotDragStart}
                  onDrag={() => {}}
                  onDragEnd={() => {}}
                  isDragging={draggingSpotId === spot.id}
                />
              );
            })}
          </div>

          {/* Room dimensions - bottom right corner */}
          <div className="absolute bottom-3 right-4 text-white/30" style={{ fontSize: `${11 * zoom}px` }}>
            {floorPlan.lengthFeet} ft × {floorPlan.widthFeet} ft
          </div>
        </div>
      </div>

      {/* Legend */}
      <FloorLegend 
        templateType={floorPlan.templateType}
        occupiedCount={occupiedCount}
        totalSpots={totalSpots}
        isDesignMode={isDesignMode}
      />

      {/* Layout Controls */}
      <LayoutControls
        isVisible={currentMode === "design"}
        onApplyLayout={handleApplyLayout}
        onResetLayout={handleResetLayout}
        onSaveLayout={handleSaveLayout}
      />
    </div>
  );
}

export default CinematicFloorPlanner;
