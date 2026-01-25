import * as React from "react";
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

// Draggable Spot Marker with cinematic 3D bag styling
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

  // WARM COLOR PALETTE - teal/mint for available, warm amber/orange for occupied
  const ringColor = isEmpty 
    ? "rgba(45, 180, 160, 0.6)" // muted teal for available
    : "rgba(255, 120, 50, 0.75)"; // warm amber/orange for occupied

  // Check for special roles
  const isInstructor = assignment?.beltRank?.toLowerCase().includes("instructor");
  const isReserved = assignment?.beltRank?.toLowerCase().includes("reserved");

  // Determine spot styling based on template type
  const isBag = spot.spotType === "bag" || templateType === "kickboxing_bags";
  const isMat = spot.spotType === "mat" || templateType === "yoga_grid";

  // Scale factor for bag size based on zoom
  const bagScale = Math.max(0.6, Math.min(1.2, scale));

  // Calculate depth-based adjustments (bags further back appear smaller/darker)
  const depthFactor = 1 - (spot.positionY / 100) * 0.15;
  const depthScale = bagScale * depthFactor;

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
        opacity: isDragging ? 0.9 : depthFactor,
        filter: `brightness(${0.85 + depthFactor * 0.15})`,
      }}
    >
      {/* Drag indicator for Design mode */}
      {isDraggable && isDesign && !isDragging && (
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: "rgba(255, 160, 80, 0.9)",
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

      {/* Ground contact shadow - soft diffused shadow beneath bag */}
      <div 
        className="absolute"
        style={{
          width: `${90 * depthScale}px`,
          height: `${24 * depthScale}px`,
          bottom: `${-8 * depthScale}px`,
          left: "50%",
          transform: "translateX(-50%)",
          background: `radial-gradient(ellipse 100% 100% at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)`,
          filter: "blur(8px)",
        }}
      />

      {/* Floor glow ring - warm tones */}
      <div 
        className={cn(
          "absolute rounded-full transition-all duration-500",
          isEmpty && (isKiosk || isLive) && "animate-pulse",
          isDragging && "ring-2 ring-amber-400 ring-offset-2 ring-offset-transparent"
        )}
        style={{
          width: `${110 * depthScale}px`,
          height: `${36 * depthScale}px`,
          bottom: `${-4 * depthScale}px`,
          left: "50%",
          transform: "translateX(-50%)",
          background: isDragging 
            ? `radial-gradient(ellipse 100% 100% at center, rgba(255,160,80,0.8) 0%, rgba(255,120,50,0.4) 40%, rgba(255,100,40,0.15) 70%, transparent 100%)`
            : `radial-gradient(ellipse 100% 100% at center, ${ringColor} 0%, ${ringColor}40 40%, ${ringColor}15 70%, transparent 100%)`,
          filter: "blur(10px)",
          opacity: isDragging ? 1 : 0.75,
        }}
      />

      {/* Ring outline - subtle warm border */}
      <div 
        className="absolute rounded-full"
        style={{
          width: `${90 * depthScale}px`,
          height: `${28 * depthScale}px`,
          bottom: `${2 * depthScale}px`,
          left: "50%",
          transform: "translateX(-50%)",
          border: isDragging 
            ? "2px solid rgba(255,160,80,0.7)"
            : `1.5px solid ${isEmpty ? "rgba(45,180,160,0.4)" : "rgba(255,120,50,0.5)"}`,
          borderRadius: "50%",
          opacity: 0.7,
        }}
      />

      {/* Main spot container */}
      {isBag ? (
        // 3D Kickboxing Bag - Cinematic with warm highlights
        <div
          className={cn(
            "flex flex-col items-center justify-center transition-all",
            !isDragging && "group-hover:scale-105 group-hover:-translate-y-1",
            isSelected && !isDragging && "scale-105 -translate-y-1",
            isDragging && "scale-110"
          )}
        >
          {/* Bag number badge - red/amber on TOP of bag */}
          <div 
            className={cn(
              "rounded-md flex items-center justify-center z-20",
              isEmpty ? "bg-zinc-600" : "bg-red-600"
            )}
            style={{
              position: "absolute",
              top: `${-14 * depthScale}px`,
              left: "50%",
              transform: "translateX(-50%)",
              width: `${24 * depthScale}px`,
              height: `${20 * depthScale}px`,
              fontSize: `${12 * depthScale}px`,
              fontWeight: 700,
              color: "white",
              borderRadius: "4px",
              boxShadow: isEmpty 
                ? "0 2px 8px rgba(0,0,0,0.6)"
                : "0 2px 12px rgba(220,38,38,0.6), 0 0 16px rgba(255,80,40,0.4)",
            }}
          >
            {spot.spotNumber}
          </div>

          {/* Bag body - trapezoidal with warm lighting */}
          <div 
            className="relative overflow-hidden"
            style={{
              width: `${48 * depthScale}px`,
              height: `${72 * depthScale}px`,
              clipPath: "polygon(5% 0%, 95% 0%, 85% 100%, 15% 100%)",
              background: `linear-gradient(180deg, 
                #3d3530 0%, 
                #2d2825 15%, 
                #1f1c1a 40%, 
                #151312 70%, 
                #0d0c0b 100%
              )`,
              boxShadow: isDragging
                ? "0 20px 50px rgba(0,0,0,0.9), 0 10px 25px rgba(255,120,50,0.2)"
                : "0 15px 40px rgba(0,0,0,0.7), 0 8px 20px rgba(0,0,0,0.5)",
            }}
          >
            {/* Top highlight - warm light from above */}
            <div 
              className="absolute inset-x-0 top-0"
              style={{
                height: "8px",
                background: "linear-gradient(180deg, rgba(255,200,150,0.15) 0%, transparent 100%)",
              }}
            />
            
            {/* Left edge rim light - warm */}
            <div 
              className="absolute left-0 top-0 bottom-0"
              style={{
                width: "4px",
                background: "linear-gradient(180deg, rgba(255,180,120,0.18) 0%, rgba(255,150,100,0.08) 50%, rgba(255,120,80,0.02) 100%)",
              }}
            />
            
            {/* Center specular highlight */}
            <div 
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 35%, rgba(255,220,180,0.06) 50%, transparent 65%)",
              }}
            />
            
            {/* Red accent panel for occupied bags */}
            {!isEmpty && (
              <div 
                className="absolute top-2 left-2 right-2 rounded-sm"
                style={{
                  height: `${28 * depthScale}px`,
                  background: "linear-gradient(180deg, #ef4444 0%, #dc2626 40%, #b91c1c 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.4)",
                }}
              >
                {/* Red panel warm shine */}
                <div 
                  className="absolute inset-0 rounded-sm"
                  style={{
                    background: "linear-gradient(90deg, transparent 20%, rgba(255,200,150,0.2) 50%, transparent 80%)",
                  }}
                />
                
                {/* Initials on red panel */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span 
                    className="text-white font-bold"
                    style={{ fontSize: `${13 * depthScale}px`, letterSpacing: "0.05em", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                  >
                    {initials}
                  </span>
                </div>
              </div>
            )}

            {/* Special labels - INSTRUCTOR / RESERVED */}
            {isInstructor && (
              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center">
                <span 
                  className="text-white/80 uppercase font-medium px-1 py-0.5 rounded"
                  style={{ 
                    fontSize: `${6 * depthScale}px`, 
                    letterSpacing: "0.08em",
                    background: "rgba(0,0,0,0.5)",
                  }}
                >
                  Instructor
                </span>
              </div>
            )}
            
            {isReserved && (
              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center">
                <span 
                  className="text-white/80 uppercase font-medium px-1 py-0.5 rounded"
                  style={{ 
                    fontSize: `${6 * depthScale}px`, 
                    letterSpacing: "0.08em",
                    background: "rgba(0,0,0,0.5)",
                  }}
                >
                  Reserved
                </span>
              </div>
            )}
          </div>

          {/* Floor spot number label */}
          <div 
            className="mt-1 text-center"
            style={{
              fontSize: `${10 * depthScale}px`,
              color: "rgba(255,255,255,0.35)",
              fontWeight: 500,
            }}
          >
            {spot.spotNumber}
          </div>
        </div>
      ) : isMat ? (
        // Yoga Mat
        <div
          className={cn(
            "rounded-lg transition-all",
            !isDragging && "group-hover:scale-105",
            isSelected && "ring-2 ring-amber-400"
          )}
          style={{
            width: `${56 * depthScale}px`,
            height: `${80 * depthScale}px`,
            background: isEmpty 
              ? "linear-gradient(180deg, #3d3530 0%, #2d2825 100%)"
              : "linear-gradient(180deg, #5b4a3d 0%, #4a3d32 100%)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/60 font-semibold" style={{ fontSize: `${14 * depthScale}px` }}>
              {spot.spotLabel || spot.spotNumber}
            </span>
          </div>
        </div>
      ) : (
        // Default rank position
        <div
          className={cn(
            "rounded-full transition-all",
            !isDragging && "group-hover:scale-110",
            isSelected && "ring-2 ring-amber-400"
          )}
          style={{
            width: `${40 * depthScale}px`,
            height: `${40 * depthScale}px`,
            background: isEmpty 
              ? "rgba(60,50,45,0.8)"
              : `linear-gradient(135deg, ${BELT_COLORS[assignment?.beltRank?.toLowerCase() || "white"]} 0%, rgba(0,0,0,0.3) 100%)`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold" style={{ fontSize: `${12 * depthScale}px` }}>
              {isEmpty ? spot.spotNumber : initials}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Front of Class Stage - Warm cinematic lighting
function FrontOfClassStage({ scale = 1 }: { scale?: number }) {
  return (
    <div className="absolute inset-x-4 top-4 pointer-events-none">
      <div 
        className="relative rounded-t-lg overflow-hidden"
        style={{
          height: `${80 * scale}px`,
          background: `linear-gradient(180deg, 
            #2a2420 0%, 
            #1f1a18 40%, 
            #181514 100%
          )`,
          boxShadow: "inset 0 -2px 20px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.4)",
        }}
      >
        {/* Warm brick/wall texture overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 30px,
                rgba(255,200,150,0.03) 30px,
                rgba(255,200,150,0.03) 31px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 15px,
                rgba(255,180,120,0.02) 15px,
                rgba(255,180,120,0.02) 16px
              )
            `,
          }}
        />

        {/* Warm overhead light strip */}
        <div 
          className="absolute inset-x-0 top-0"
          style={{
            height: `${8 * scale}px`,
            background: "linear-gradient(90deg, transparent 5%, rgba(255,140,60,0.7) 25%, rgba(255,180,100,0.85) 50%, rgba(255,140,60,0.7) 75%, transparent 95%)",
            boxShadow: "0 0 30px rgba(255,130,50,0.5), 0 0 60px rgba(255,100,40,0.3)",
          }}
        />
        
        {/* Downward light cones */}
        <div className="absolute inset-x-0 top-0 flex justify-around px-16" style={{ height: `${40 * scale}px` }}>
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="h-full"
              style={{
                width: `${80 * scale}px`,
                background: `radial-gradient(ellipse at center top, rgba(255,160,80,0.12) 0%, rgba(255,120,50,0.05) 50%, transparent 80%)`,
              }}
            />
          ))}
        </div>

        {/* Stage glow bleeding onto floor */}
        <div 
          className="absolute inset-x-0 h-20"
          style={{
            bottom: `${-60 * scale}px`,
            background: "linear-gradient(180deg, rgba(255,120,50,0.1) 0%, rgba(255,100,40,0.04) 40%, transparent 100%)",
          }}
        />

        {/* FRONT OF CLASS label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="font-semibold uppercase"
            style={{ 
              fontSize: `${13 * scale}px`,
              letterSpacing: "0.35em",
              color: "rgba(255,240,220,0.5)",
              textShadow: "0 0 20px rgba(255,150,80,0.3)",
            }}
          >
            Front of Class
          </span>
        </div>

        {/* Instructor podium/marker */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1">
          <div 
            className="rounded-sm"
            style={{
              width: `${24 * scale}px`,
              height: `${12 * scale}px`,
              background: "linear-gradient(180deg, #3a3530 0%, #1a1815 100%)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.5), 0 0 10px rgba(255,120,50,0.1)",
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
        background: "rgba(20,18,16,0.8)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,200,150,0.08)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,200,150,0.05)",
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
                ? "bg-white/10 text-amber-100" 
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
        background: "rgba(20,18,16,0.8)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,200,150,0.06)",
      }}
    >
      <button
        onClick={onZoomOut}
        className="p-1.5 rounded-md text-white/50 hover:text-amber-200 hover:bg-white/10 transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <span className="text-white/50 px-2 min-w-[50px] text-center" style={{ fontSize: "11px" }}>
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={onZoomIn}
        className="p-1.5 rounded-md text-white/50 hover:text-amber-200 hover:bg-white/10 transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-white/10 mx-1" />
      <button
        onClick={onFitToView}
        className="p-1.5 rounded-md text-white/50 hover:text-amber-200 hover:bg-white/10 transition-colors"
        title="Fit to View"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
      <button
        onClick={onTogglePan}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          isPanning 
            ? "text-amber-400 bg-amber-400/20" 
            : "text-white/50 hover:text-amber-200 hover:bg-white/10"
        )}
        title="Pan Mode"
      >
        <Move className="w-4 h-4" />
      </button>
    </div>
  );
}

// Legend - warm color scheme
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
        background: "rgba(20,18,16,0.6)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,200,150,0.05)",
      }}
    >
      {/* Available Spot - muted teal */}
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{
            background: "rgba(45, 180, 160, 0.7)",
            boxShadow: "0 0 8px rgba(45, 180, 160, 0.4)",
          }}
        />
        <span className="text-white/50" style={{ fontSize: "11px" }}>Available Spot</span>
      </div>
      
      {/* Occupied Spot - warm amber */}
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{
            background: "rgba(255, 120, 50, 0.8)",
            boxShadow: "0 0 8px rgba(255, 120, 50, 0.5)",
          }}
        />
        <span className="text-white/50" style={{ fontSize: "11px" }}>Occupied Spot</span>
      </div>
      
      {/* Design mode hint */}
      {isDesignMode && (
        <>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <GripVertical className="w-3 h-3 text-amber-400/60" />
            <span className="text-amber-400/60" style={{ fontSize: "11px" }}>Drag bags to reposition</span>
          </div>
        </>
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

  // Calculate canvas height based on number of spots
  const spotCount = floorPlan.spots.length;
  const rows = Math.ceil(spotCount / 5);
  const baseHeight = 500;
  const heightPerRow = 140;
  const calculatedHeight = Math.max(baseHeight, 200 + (rows * heightPerRow));

  const isDesignMode = currentMode === "design";

  const handleModeChange = (mode: ViewMode) => {
    setCurrentMode(mode);
    onModeChange?.(mode);
    setDraggingSpotId(null);
  };

  const handleSpotClick = (spot: Spot) => {
    if (!isPanning && !draggingSpotId) {
      setSelectedSpot(spot.id);
      onSpotClick?.(spot);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleFitToView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const handleTogglePan = () => setIsPanning(prev => !prev);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((isPanning || e.button === 1) && !draggingSpotId) {
      setIsDraggingCanvas(true);
      setCanvasDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setPan({ x: e.clientX - canvasDragStart.x, y: e.clientY - canvasDragStart.y });
    }
    
    if (draggingSpotId !== null && canvasRef.current) {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const deltaX = (e.clientX - dragStartPos.x) / rect.width * 100;
      const deltaY = (e.clientY - dragStartPos.y) / rect.height * 100;
      const newX = Math.max(5, Math.min(95, originalSpotPos.x + deltaX));
      const newY = Math.max(15, Math.min(95, originalSpotPos.y + deltaY));
      setSpotPositions(prev => ({ ...prev, [draggingSpotId]: { x: newX, y: newY } }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
    
    if (draggingSpotId !== null) {
      const newPos = spotPositions[draggingSpotId];
      if (newPos) {
        updateSpotMutation.mutate({
          spotId: draggingSpotId,
          positionX: newPos.x,
          positionY: newPos.y,
        }, {
          onSuccess: () => {
            toast.success('Bag position saved');
            utils.floorPlans.getById.invalidate({ id: floorPlan.id });
          },
          onError: () => toast.error('Failed to save position')
        });
      }
      setDraggingSpotId(null);
    }
  };

  const handleSpotDragStart = (spotId: number, e: React.MouseEvent) => {
    if (!isDesignMode) return;
    const spot = floorPlan.spots.find(s => s.id === spotId);
    if (!spot) return;
    setDraggingSpotId(spotId);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setOriginalSpotPos({ x: spot.positionX, y: spot.positionY });
    setSpotPositions(prev => ({ ...prev, [spotId]: { x: spot.positionX, y: spot.positionY } }));
  };

  const handleApplyLayout = async (layoutType: string) => {
    const newPositions = generateLayout(floorPlan.spots.length, layoutType, floorPlan.widthFeet || 40, floorPlan.lengthFeet || 30);
    for (let i = 0; i < floorPlan.spots.length; i++) {
      const spot = floorPlan.spots[i];
      const newPos = newPositions[i];
      if (newPos) {
        try {
          await updateSpotMutation.mutateAsync({ spotId: spot.id, positionX: newPos.x, positionY: newPos.y });
        } catch (error) {
          console.error('Failed to update spot position:', error);
        }
      }
    }
    utils.floorPlans.getById.invalidate({ id: floorPlan.id });
    toast.success(`Applied ${layoutType} layout`);
  };

  const handleResetLayout = async () => {
    const defaultPositions = generateLayout(floorPlan.spots.length, 'grid', floorPlan.widthFeet || 40, floorPlan.lengthFeet || 30);
    let successCount = 0;
    for (let i = 0; i < floorPlan.spots.length; i++) {
      const spot = floorPlan.spots[i];
      const newPos = defaultPositions[i];
      if (newPos) {
        try {
          await updateSpotMutation.mutateAsync({ spotId: spot.id, positionX: newPos.x, positionY: newPos.y });
          successCount++;
        } catch (error) {
          console.error('Failed to reset spot position:', error);
        }
      }
    }
    setSpotPositions({});
    utils.floorPlans.getById.invalidate({ id: floorPlan.id });
    toast.success(`Reset ${successCount} bags to default grid positions`);
  };

  const handleSaveLayout = async () => {
    for (const spot of floorPlan.spots) {
      try {
        await updateSpotMutation.mutateAsync({ spotId: spot.id, positionX: spot.positionX, positionY: spot.positionY });
      } catch (error) {
        console.error('Failed to save spot position:', error);
      }
    }
    toast.success('Layout saved');
  };

  const occupiedCount = assignedStudents.length;
  const totalSpots = floorPlan.spots.length;

  const getSpotPosition = (spot: Spot) => {
    if (spotPositions[spot.id]) return spotPositions[spot.id];
    return { x: spot.positionX, y: spot.positionY };
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header with mode switcher and zoom controls */}
      <div 
        className="flex items-center justify-between px-3 py-2 rounded-lg"
        style={{
          background: "rgba(20,18,16,0.5)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,200,150,0.05)",
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
              className="p-1.5 rounded-md text-white/40 hover:text-amber-200 hover:bg-white/5 transition-colors"
              style={{
                background: "rgba(20,18,16,0.5)",
                border: "1px solid rgba(255,200,150,0.05)",
              }}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Design mode instruction banner - warm amber */}
      {isDesignMode && (
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{
            background: "rgba(255, 140, 60, 0.1)",
            border: "1px solid rgba(255, 140, 60, 0.2)",
          }}
        >
          <GripVertical className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-sm">
            <strong>Design Mode:</strong> Drag bags to position them exactly where your hanging bags are located.
          </span>
        </div>
      )}

      {/* Floor Canvas - CINEMATIC WARM ENVIRONMENT */}
      <div 
        ref={containerRef}
        className="rounded-xl overflow-auto"
        style={{
          // Warm glass frame with subtle glow
          background: "linear-gradient(180deg, rgba(40,32,28,0.6) 0%, rgba(25,20,18,0.7) 100%)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,180,120,0.08)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,200,150,0.04), 0 0 60px rgba(255,100,40,0.03)",
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
          {/* Base floor - WARM CHARCOAL/GRAPHITE (no blue!) */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 90% 70% at center 35%, 
                  #2a2420 0%, 
                  #221e1a 30%,
                  #1a1614 55%,
                  #121010 80%,
                  #0a0908 100%
                )
              `,
            }}
          />

          {/* Rubber mat texture - warm tones */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 48px,
                  rgba(255,200,150,0.015) 48px,
                  rgba(255,200,150,0.015) 50px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 48px,
                  rgba(255,180,120,0.015) 48px,
                  rgba(255,180,120,0.015) 50px
                )
              `,
            }}
          />

          {/* 3D Perspective depth - darker at back, brighter at front */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, 
                rgba(0,0,0,0.5) 0%, 
                rgba(0,0,0,0.35) 15%,
                rgba(0,0,0,0.15) 35%, 
                transparent 50%, 
                rgba(255,200,150,0.02) 70%,
                rgba(255,180,120,0.03) 85%,
                rgba(255,160,100,0.04) 100%
              )`,
            }}
          />

          {/* Back wall haze - atmospheric depth */}
          <div 
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: "25%",
              background: "linear-gradient(180deg, rgba(60,50,45,0.3) 0%, rgba(40,35,30,0.15) 50%, transparent 100%)",
            }}
          />

          {/* Vignette - warm corners */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 85% 70% at center 45%, 
                  transparent 25%, 
                  rgba(15,12,10,0.35) 60%,
                  rgba(10,8,6,0.6) 85%,
                  rgba(5,4,3,0.75) 100%
                )
              `,
            }}
          />

          {/* Warm ambient light from stage */}
          <div 
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: `${200 * zoom}px`,
              background: `linear-gradient(180deg, 
                rgba(255,120,50,0.12) 0%, 
                rgba(255,100,40,0.06) 30%, 
                rgba(255,80,30,0.02) 60%, 
                transparent 100%
              )`,
            }}
          />

          {/* Light shafts from ceiling - warm */}
          <div className="absolute inset-x-0 top-0 flex justify-around px-20 pointer-events-none" style={{ height: "40%" }}>
            {[...Array(4)].map((_, i) => (
              <div 
                key={i}
                style={{
                  width: `${60 * zoom}px`,
                  height: "100%",
                  background: `linear-gradient(180deg, 
                    rgba(255,160,80,0.06) 0%, 
                    rgba(255,140,60,0.03) 40%, 
                    transparent 100%
                  )`,
                  transform: `rotate(${(i - 1.5) * 2}deg)`,
                  transformOrigin: "top center",
                }}
              />
            ))}
          </div>

          {/* Mat boundary - subtle warm border */}
          <div 
            className="absolute rounded-lg pointer-events-none"
            style={{
              left: "16px",
              right: "16px",
              top: "16px",
              bottom: "16px",
              border: "1px dashed rgba(255,180,120,0.06)",
              boxShadow: "inset 0 0 80px rgba(0,0,0,0.2)",
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
                border: "1px dashed rgba(255,180,120,0.06)",
                background: "rgba(255,200,150,0.01)",
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

          {/* Room dimensions - warm text */}
          <div className="absolute bottom-3 right-4" style={{ fontSize: `${11 * zoom}px`, color: "rgba(255,220,180,0.3)" }}>
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
