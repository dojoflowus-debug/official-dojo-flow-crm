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

// PHOTOREALISTIC Bag Marker - Heavy, cylindrical, grounded
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

  // WARM COLOR PALETTE - muted teal for available, warm amber for occupied
  const ringColor = isEmpty 
    ? "rgba(45, 160, 140, 0.5)" // muted teal
    : "rgba(255, 100, 40, 0.7)"; // warm amber/orange

  // Check for special roles
  const isInstructor = assignment?.beltRank?.toLowerCase().includes("instructor");
  const isReserved = assignment?.beltRank?.toLowerCase().includes("reserved");

  // Determine spot styling based on template type
  const isBag = spot.spotType === "bag" || templateType === "kickboxing_bags";
  const isMat = spot.spotType === "mat" || templateType === "yoga_grid";

  // Scale factor for bag size based on zoom
  const bagScale = Math.max(0.6, Math.min(1.2, scale));

  // Calculate depth-based adjustments (bags further back appear smaller/darker)
  const depthFactor = 1 - (spot.positionY / 100) * 0.2;
  const depthScale = bagScale * depthFactor;
  const depthOpacity = 0.7 + (1 - spot.positionY / 100) * 0.3;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDraggable && isDesign) {
      e.preventDefault();
      e.stopPropagation();
      onDragStart(spot.id, e);
    }
  };

  return (
    <div
      className={cn(
        "absolute transform -translate-x-1/2 -translate-y-1/2 group",
        isDraggable && isDesign && "cursor-grab",
        isDragging && "cursor-grabbing z-50"
      )}
      style={{
        left: `${spot.positionX}%`,
        top: `${spot.positionY}%`,
        opacity: depthOpacity,
        filter: spot.positionY < 30 ? "blur(0.3px)" : "none", // Slight blur for distant bags
      }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
    >
      {/* PHOTOREALISTIC Floor glow ring - soft specular reflection */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 rounded-full",
          !isDragging && (isKiosk || isLive) && isEmpty && "animate-pulse"
        )}
        style={{
          width: `${130 * depthScale}px`,
          height: `${45 * depthScale}px`,
          bottom: `${-8 * depthScale}px`,
          background: `radial-gradient(ellipse at center, ${ringColor} 0%, ${ringColor.replace(/[\d.]+\)$/, '0.2)')} 50%, transparent 75%)`,
          boxShadow: `0 0 ${25 * depthScale}px ${ringColor.replace(/[\d.]+\)$/, '0.3)')}`,
          border: `1px solid ${ringColor.replace(/[\d.]+\)$/, '0.15)')}`,
          transform: isDragging ? "scale(1.15)" : "scale(1)",
          transition: "transform 0.15s ease-out",
        }}
      />

      {/* Drag indicator for design mode */}
      {isDraggable && isDesign && (
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
          style={{
            background: "rgba(20,18,16,0.9)",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "9px",
            color: "rgba(255,200,150,0.7)",
            border: "1px solid rgba(255,180,120,0.15)",
          }}
        >
          <GripVertical className="w-2.5 h-2.5 inline mr-1" />
          Drag to move
        </div>
      )}

      {isBag ? (
        // PHOTOREALISTIC 3D Kickboxing Bag
        <div className="relative flex flex-col items-center">
          {/* Red number badge on TOP */}
          <div
            className="relative z-20 flex items-center justify-center rounded-md mb-0.5"
            style={{
              width: `${28 * depthScale}px`,
              height: `${20 * depthScale}px`,
              background: "linear-gradient(180deg, #dc2626 0%, #991b1b 100%)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
              border: "1px solid rgba(0,0,0,0.3)",
            }}
          >
            <span 
              className="font-bold text-white"
              style={{ 
                fontSize: `${11 * depthScale}px`,
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              }}
            >
              {spot.spotNumber}
            </span>
          </div>

          {/* PHOTOREALISTIC Bag body - heavy, cylindrical, leather/rubber texture */}
          <div
            className={cn(
              "relative transition-all",
              !isDragging && "group-hover:scale-[1.02]",
              isSelected && "ring-2 ring-amber-400/50"
            )}
            style={{
              width: `${56 * depthScale}px`,
              height: `${85 * depthScale}px`,
              // Cylindrical gradient with leather/rubber feel
              background: isEmpty 
                ? `linear-gradient(90deg, 
                    #1a1816 0%, 
                    #2d2825 15%,
                    #3a3530 35%,
                    #3d3835 50%,
                    #353230 65%,
                    #252220 85%,
                    #1a1816 100%
                  )`
                : `linear-gradient(90deg, 
                    #2a2520 0%, 
                    #4a4035 15%,
                    #5a4d42 35%,
                    #5d5045 50%,
                    #4d4238 65%,
                    #3a3228 85%,
                    #2a2520 100%
                  )`,
              borderRadius: `${6 * depthScale}px`,
              // Deep shadow for grounded feel
              boxShadow: `
                0 ${12 * depthScale}px ${25 * depthScale}px rgba(0,0,0,0.6),
                0 ${4 * depthScale}px ${8 * depthScale}px rgba(0,0,0,0.4),
                inset 0 ${2 * depthScale}px ${4 * depthScale}px rgba(255,200,150,0.08),
                inset 0 ${-2 * depthScale}px ${6 * depthScale}px rgba(0,0,0,0.3)
              `,
              transform: isDragging ? "scale(1.08) translateY(-4px)" : "scale(1)",
              transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out",
            }}
          >
            {/* Leather/rubber texture overlay - micro grain */}
            <div 
              className="absolute inset-0 rounded-md opacity-40"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0,0,0,0.08) 2px,
                    rgba(0,0,0,0.08) 3px
                  ),
                  repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 8px,
                    rgba(255,200,150,0.02) 8px,
                    rgba(255,200,150,0.02) 9px
                  )
                `,
                borderRadius: `${6 * depthScale}px`,
              }}
            />

            {/* Top highlight - specular response */}
            <div 
              className="absolute inset-x-0 top-0 rounded-t-md"
              style={{
                height: `${20 * depthScale}px`,
                background: "linear-gradient(180deg, rgba(255,220,180,0.12) 0%, transparent 100%)",
                borderRadius: `${6 * depthScale}px ${6 * depthScale}px 0 0`,
              }}
            />

            {/* Left edge rim light */}
            <div 
              className="absolute left-0 inset-y-0 rounded-l-md"
              style={{
                width: `${4 * depthScale}px`,
                background: "linear-gradient(90deg, rgba(255,180,120,0.15) 0%, transparent 100%)",
                borderRadius: `${6 * depthScale}px 0 0 ${6 * depthScale}px`,
              }}
            />

            {/* Right edge shadow */}
            <div 
              className="absolute right-0 inset-y-0 rounded-r-md"
              style={{
                width: `${6 * depthScale}px`,
                background: "linear-gradient(270deg, rgba(0,0,0,0.25) 0%, transparent 100%)",
                borderRadius: `0 ${6 * depthScale}px ${6 * depthScale}px 0`,
              }}
            />

            {/* Center vertical highlight - cylindrical shape */}
            <div 
              className="absolute inset-y-2 left-1/2 -translate-x-1/2"
              style={{
                width: `${12 * depthScale}px`,
                background: "linear-gradient(180deg, rgba(255,200,150,0.06) 0%, rgba(255,180,120,0.03) 50%, transparent 100%)",
                borderRadius: `${4 * depthScale}px`,
              }}
            />

            {/* Red accent panel for occupied bags */}
            {!isEmpty && (
              <div 
                className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
                style={{
                  top: `${12 * depthScale}px`,
                  width: `${36 * depthScale}px`,
                  height: `${28 * depthScale}px`,
                  background: "linear-gradient(180deg, #b91c1c 0%, #7f1d1d 100%)",
                  borderRadius: `${3 * depthScale}px`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                <span 
                  className="font-bold text-white"
                  style={{ 
                    fontSize: `${13 * depthScale}px`,
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  {initials}
                </span>
              </div>
            )}

            {/* Special labels */}
            {(isInstructor || isReserved) && (
              <div 
                className="absolute bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded"
                style={{
                  background: isInstructor ? "rgba(220,38,38,0.9)" : "rgba(180,140,100,0.8)",
                  fontSize: `${7 * depthScale}px`,
                  fontWeight: 600,
                  color: "white",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                }}
              >
                {isInstructor ? "Instructor" : "Reserved"}
              </div>
            )}
          </div>

          {/* Floor spot number label */}
          <div 
            className="mt-1 text-center"
            style={{
              fontSize: `${10 * depthScale}px`,
              color: "rgba(255,200,150,0.25)",
              fontWeight: 500,
            }}
          >
            {spot.spotNumber}
          </div>
        </div>
      ) : isMat ? (
        // Yoga mat spot
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

// PHOTOREALISTIC Front of Class Stage - Real wall with studio lighting
function FrontOfClassStage({ scale = 1 }: { scale?: number }) {
  return (
    <div className="absolute inset-x-4 top-4 pointer-events-none">
      <div 
        className="relative rounded-t-lg overflow-hidden"
        style={{
          height: `${85 * scale}px`,
          // Real wall material - warm concrete/plaster
          background: `linear-gradient(180deg, 
            #2a2622 0%, 
            #252220 30%, 
            #201d1a 60%, 
            #1a1816 100%
          )`,
          boxShadow: "inset 0 -3px 25px rgba(0,0,0,0.6), 0 4px 25px rgba(0,0,0,0.5)",
        }}
      >
        {/* Wall texture - subtle plaster/concrete grain */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")
            `,
            opacity: 0.03,
            mixBlendMode: "overlay",
          }}
        />

        {/* Brick/panel texture overlay */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 40px,
                rgba(255,200,150,0.02) 40px,
                rgba(255,200,150,0.02) 41px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 20px,
                rgba(255,180,120,0.015) 20px,
                rgba(255,180,120,0.015) 21px
              )
            `,
          }}
        />

        {/* PRIMARY WARM LIGHT STRIP - main light source */}
        <div 
          className="absolute inset-x-0 top-0"
          style={{
            height: `${10 * scale}px`,
            background: "linear-gradient(90deg, transparent 3%, rgba(255,130,50,0.8) 20%, rgba(255,160,80,0.95) 50%, rgba(255,130,50,0.8) 80%, transparent 97%)",
            boxShadow: `
              0 0 40px rgba(255,120,40,0.6), 
              0 0 80px rgba(255,100,30,0.4),
              0 0 120px rgba(255,80,20,0.2)
            `,
          }}
        />
        
        {/* Light cones from strip - directional */}
        <div className="absolute inset-x-0 top-0 flex justify-around px-12" style={{ height: `${50 * scale}px` }}>
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="h-full"
              style={{
                width: `${90 * scale}px`,
                background: `radial-gradient(ellipse 100% 150% at center top, 
                  rgba(255,150,70,0.15) 0%, 
                  rgba(255,120,50,0.08) 30%,
                  rgba(255,100,40,0.03) 60%, 
                  transparent 90%
                )`,
              }}
            />
          ))}
        </div>

        {/* Stage glow bleeding onto floor */}
        <div 
          className="absolute inset-x-0"
          style={{
            bottom: `${-70 * scale}px`,
            height: `${90 * scale}px`,
            background: `linear-gradient(180deg, 
              rgba(255,110,40,0.15) 0%, 
              rgba(255,90,30,0.08) 30%, 
              rgba(255,70,20,0.03) 60%, 
              transparent 100%
            )`,
          }}
        />

        {/* FRONT OF CLASS label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="font-semibold uppercase"
            style={{ 
              fontSize: `${14 * scale}px`,
              letterSpacing: "0.4em",
              color: "rgba(255,230,200,0.45)",
              textShadow: "0 0 25px rgba(255,140,70,0.4), 0 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            Front of Class
          </span>
        </div>

        {/* Instructor podium/marker */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1.5">
          <div 
            className="rounded-sm"
            style={{
              width: `${28 * scale}px`,
              height: `${14 * scale}px`,
              background: "linear-gradient(180deg, #3d3835 0%, #1f1c1a 100%)",
              boxShadow: "0 3px 8px rgba(0,0,0,0.6), 0 0 15px rgba(255,110,50,0.1)",
              border: "1px solid rgba(255,180,120,0.05)",
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
            background: "rgba(45, 160, 140, 0.7)",
            boxShadow: "0 0 8px rgba(45, 160, 140, 0.4)",
          }}
        />
        <span className="text-white/50" style={{ fontSize: "11px" }}>Available Spot</span>
      </div>
      
      {/* Occupied Spot - warm amber */}
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{
            background: "rgba(255, 100, 40, 0.8)",
            boxShadow: "0 0 8px rgba(255, 100, 40, 0.5)",
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
  const baseHeight = 520;
  const heightPerRow = 145;
  const calculatedHeight = Math.max(baseHeight, 220 + (rows * heightPerRow));

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

      {/* PHOTOREALISTIC Floor Canvas */}
      <div 
        ref={containerRef}
        className="rounded-xl overflow-auto"
        style={{
          // Warm glass frame
          background: "linear-gradient(180deg, rgba(35,30,26,0.7) 0%, rgba(22,18,16,0.8) 100%)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,180,120,0.06)",
          boxShadow: `
            0 10px 50px rgba(0,0,0,0.6), 
            inset 0 1px 0 rgba(255,200,150,0.03), 
            0 0 80px rgba(255,90,30,0.02)
          `,
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
          {/* PHOTOREALISTIC Base floor - warm rubber mat */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 95% 75% at center 40%, 
                  #2d2824 0%, 
                  #262220 25%,
                  #1e1c1a 45%,
                  #161412 65%,
                  #100e0c 85%,
                  #0a0908 100%
                )
              `,
            }}
          />

          {/* RUBBER MAT TEXTURE - realistic micro-grain */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")
              `,
              opacity: 0.04,
              mixBlendMode: "overlay",
            }}
          />

          {/* MAT TILE SEAMS - subtle segmentation */}
          <div 
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 95px,
                  rgba(0,0,0,0.15) 95px,
                  rgba(0,0,0,0.15) 96px,
                  rgba(255,200,150,0.02) 96px,
                  rgba(255,200,150,0.02) 97px,
                  transparent 97px,
                  transparent 100px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 95px,
                  rgba(0,0,0,0.12) 95px,
                  rgba(0,0,0,0.12) 96px,
                  rgba(255,180,120,0.015) 96px,
                  rgba(255,180,120,0.015) 97px,
                  transparent 97px,
                  transparent 100px
                )
              `,
            }}
          />

          {/* SPECULAR RESPONSE - floor light reflection */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 60% 40% at 50% 25%, 
                  rgba(255,180,120,0.04) 0%, 
                  transparent 70%
                ),
                radial-gradient(ellipse 80% 50% at 50% 80%, 
                  rgba(255,200,150,0.03) 0%, 
                  transparent 60%
                )
              `,
            }}
          />

          {/* 3D DEPTH GRADIENT - darker back, brighter front */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, 
                rgba(0,0,0,0.55) 0%, 
                rgba(0,0,0,0.4) 15%,
                rgba(0,0,0,0.2) 30%, 
                rgba(0,0,0,0.05) 50%, 
                transparent 60%,
                rgba(255,200,150,0.015) 75%,
                rgba(255,180,120,0.025) 90%,
                rgba(255,160,100,0.03) 100%
              )`,
            }}
          />

          {/* ATMOSPHERIC HAZE - back wall depth */}
          <div 
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: "30%",
              background: `linear-gradient(180deg, 
                rgba(50,45,40,0.35) 0%, 
                rgba(40,35,30,0.2) 40%, 
                rgba(30,25,22,0.08) 70%,
                transparent 100%
              )`,
              filter: "blur(2px)",
            }}
          />

          {/* VIGNETTE - darker corners for depth */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 80% 65% at center 50%, 
                  transparent 20%, 
                  rgba(12,10,8,0.4) 55%,
                  rgba(8,6,5,0.65) 80%,
                  rgba(4,3,2,0.8) 100%
                )
              `,
            }}
          />

          {/* PRIMARY WARM LIGHT from stage */}
          <div 
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: `${220 * zoom}px`,
              background: `linear-gradient(180deg, 
                rgba(255,110,40,0.18) 0%, 
                rgba(255,90,30,0.1) 25%, 
                rgba(255,70,20,0.04) 50%, 
                transparent 100%
              )`,
            }}
          />

          {/* OVERHEAD SOFT FILL - secondary light */}
          <div className="absolute inset-x-0 top-0 flex justify-around px-16 pointer-events-none" style={{ height: "45%" }}>
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                style={{
                  width: `${70 * zoom}px`,
                  height: "100%",
                  background: `linear-gradient(180deg, 
                    rgba(255,150,70,0.08) 0%, 
                    rgba(255,130,50,0.04) 35%, 
                    rgba(255,110,40,0.015) 65%,
                    transparent 100%
                  )`,
                  transform: `rotate(${(i - 2) * 1.5}deg)`,
                  transformOrigin: "top center",
                }}
              />
            ))}
          </div>

          {/* AMBIENT ROOM GLOW - low-level fill */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 100% 80% at 50% 100%, 
                  rgba(255,180,120,0.02) 0%, 
                  transparent 50%
                )
              `,
            }}
          />

          {/* Mat boundary */}
          <div 
            className="absolute rounded-lg pointer-events-none"
            style={{
              left: "16px",
              right: "16px",
              top: "16px",
              bottom: "16px",
              border: "1px dashed rgba(255,180,120,0.04)",
              boxShadow: "inset 0 0 100px rgba(0,0,0,0.25)",
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
                border: "1px dashed rgba(255,180,120,0.05)",
                background: "rgba(255,200,150,0.01)",
              }}
            >
              <span className="absolute top-2 left-2 text-white/15 font-medium" style={{ fontSize: "10px" }}>
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

          {/* Room dimensions */}
          <div className="absolute bottom-3 right-4" style={{ fontSize: `${11 * zoom}px`, color: "rgba(255,210,170,0.25)" }}>
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
