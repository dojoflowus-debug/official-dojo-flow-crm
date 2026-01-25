import React from "react";
import { Eye, Pencil, MonitorPlay, Tv, Settings, Users, Package, Grid3x3, ZoomIn, ZoomOut, Maximize2, Move, GripVertical, Upload, Image, X, Sliders } from "lucide-react";
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
  backgroundImageUrl?: string | null;
  backgroundOpacity?: number | null;
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

// REBALANCED Bag Marker - Clear, readable, physical
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
    ? "rgba(60, 180, 160, 0.6)" // brighter teal
    : "rgba(255, 120, 50, 0.75)"; // warm amber/orange

  // Check for special roles
  const isInstructor = assignment?.beltRank?.toLowerCase().includes("instructor");
  const isReserved = assignment?.beltRank?.toLowerCase().includes("reserved");

  // Determine spot styling based on template type
  const isBag = spot.spotType === "bag" || templateType === "kickboxing_bags";
  const isMat = spot.spotType === "mat" || templateType === "yoga_grid";

  // Scale factor for bag size based on zoom
  const bagScale = Math.max(0.6, Math.min(1.2, scale));

  // Calculate depth-based adjustments - REDUCED darkness for distant bags
  const depthFactor = 1 - (spot.positionY / 100) * 0.12; // Reduced from 0.2
  const depthScale = bagScale * depthFactor;
  const depthOpacity = 0.85 + (1 - spot.positionY / 100) * 0.15; // Brighter overall

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
      }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
    >
      {/* REBALANCED Floor glow ring - visible but not overpowering */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 rounded-full",
          !isDragging && (isKiosk || isLive) && isEmpty && "animate-pulse"
        )}
        style={{
          width: `${130 * depthScale}px`,
          height: `${45 * depthScale}px`,
          bottom: `${-8 * depthScale}px`,
          background: `radial-gradient(ellipse at center, ${ringColor} 0%, ${ringColor.replace(/[\d.]+\)$/, '0.25)')} 50%, transparent 75%)`,
          boxShadow: `0 0 ${30 * depthScale}px ${ringColor.replace(/[\d.]+\)$/, '0.35)')}`,
          border: `1px solid ${ringColor.replace(/[\d.]+\)$/, '0.2)')}`,
          transform: isDragging ? "scale(1.15)" : "scale(1)",
          transition: "transform 0.15s ease-out",
        }}
      />

      {/* Drag indicator for design mode */}
      {isDraggable && isDesign && (
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
          style={{
            background: "rgba(30,28,26,0.95)",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "9px",
            color: "rgba(255,210,170,0.8)",
            border: "1px solid rgba(255,180,120,0.2)",
          }}
        >
          <GripVertical className="w-2.5 h-2.5 inline mr-1" />
          Drag to move
        </div>
      )}

      {isBag ? (
        // REBALANCED 3D Kickboxing Bag - Brighter, clearer silhouette
        <div className="relative flex flex-col items-center">
          {/* Red number badge on TOP */}
          <div
            className="relative z-20 flex items-center justify-center rounded-md mb-0.5"
            style={{
              width: `${28 * depthScale}px`,
              height: `${20 * depthScale}px`,
              background: "linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              border: "1px solid rgba(0,0,0,0.25)",
            }}
          >
            <span 
              className="font-bold text-white"
              style={{ 
                fontSize: `${11 * depthScale}px`,
                textShadow: "0 1px 2px rgba(0,0,0,0.4)",
              }}
            >
              {spot.spotNumber}
            </span>
          </div>

          {/* REBALANCED Bag body - BRIGHTER, clearer cylindrical shading */}
          <div
            className={cn(
              "relative transition-all",
              !isDragging && "group-hover:scale-[1.02]",
              isSelected && "ring-2 ring-amber-400/50"
            )}
            style={{
              width: `${56 * depthScale}px`,
              height: `${85 * depthScale}px`,
              // BRIGHTER cylindrical gradient - visible bag faces
              background: isEmpty 
                ? `linear-gradient(90deg, 
                    #2a2826 0%, 
                    #3d3a36 12%,
                    #4a4642 28%,
                    #524e4a 42%,
                    #4a4642 58%,
                    #3d3a36 72%,
                    #2a2826 88%,
                    #1f1d1b 100%
                  )`
                : `linear-gradient(90deg, 
                    #3a3530 0%, 
                    #5a524a 12%,
                    #6a6258 28%,
                    #726a60 42%,
                    #6a6258 58%,
                    #5a524a 72%,
                    #3a3530 88%,
                    #2a2520 100%
                  )`,
              borderRadius: "4px 4px 8px 8px",
              clipPath: "polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)",
              boxShadow: `
                inset 2px 0 8px rgba(255,220,180,0.08),
                inset -4px 0 12px rgba(0,0,0,0.4),
                0 8px 20px rgba(0,0,0,0.5)
              `,
            }}
          >
            {/* TOP HIGHLIGHT - stronger for visibility */}
            <div 
              className="absolute inset-x-0 top-0 rounded-t"
              style={{
                height: "20%",
                background: "linear-gradient(180deg, rgba(255,220,180,0.2) 0%, transparent 100%)",
              }}
            />

            {/* LEFT RIM LIGHT - key light reflection */}
            <div 
              className="absolute left-0 top-0 bottom-0"
              style={{
                width: "18%",
                background: "linear-gradient(90deg, rgba(255,200,150,0.18) 0%, transparent 100%)",
              }}
            />

            {/* CENTER SPECULAR - subtle highlight */}
            <div 
              className="absolute top-1/4 left-1/3 right-1/3"
              style={{
                height: "30%",
                background: "radial-gradient(ellipse at center, rgba(255,240,220,0.08) 0%, transparent 70%)",
              }}
            />

            {/* REAR EDGE - darker for depth */}
            <div 
              className="absolute right-0 top-0 bottom-0"
              style={{
                width: "15%",
                background: "linear-gradient(270deg, rgba(0,0,0,0.35) 0%, transparent 100%)",
              }}
            />

            {/* Leather/rubber texture - subtle grain */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 4px,
                    rgba(0,0,0,0.08) 4px,
                    rgba(0,0,0,0.08) 5px
                  )
                `,
              }}
            />

            {/* Red panel for occupied bags */}
            {!isEmpty && (
              <div 
                className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
                style={{
                  top: "35%",
                  width: "70%",
                  height: "30%",
                  background: "linear-gradient(180deg, rgba(220,38,38,0.85) 0%, rgba(153,27,27,0.85) 100%)",
                  borderRadius: "3px",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                <span 
                  className="font-bold text-white"
                  style={{ 
                    fontSize: `${12 * depthScale}px`,
                    textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                  }}
                >
                  {initials}
                </span>
              </div>
            )}

            {/* Special labels */}
            {isInstructor && (
              <div 
                className="absolute bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-white font-bold uppercase"
                style={{ 
                  fontSize: `${7 * depthScale}px`,
                  background: "rgba(220,38,38,0.9)",
                  letterSpacing: "0.05em",
                }}
              >
                Instructor
              </div>
            )}
            {isReserved && (
              <div 
                className="absolute bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-white font-bold uppercase"
                style={{ 
                  fontSize: `${7 * depthScale}px`,
                  background: "rgba(180,83,9,0.9)",
                  letterSpacing: "0.05em",
                }}
              >
                Reserved
              </div>
            )}
          </div>

          {/* VISIBLE CONTACT SHADOW - grounded */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              width: `${50 * depthScale}px`,
              height: `${14 * depthScale}px`,
              bottom: `${-5 * depthScale}px`,
              background: "radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 50%, transparent 80%)",
              filter: "blur(4px)",
            }}
          />

          {/* Floor spot number label */}
          <div 
            className="mt-1 text-center font-medium"
            style={{ 
              fontSize: `${10 * depthScale}px`,
              color: "rgba(255,220,180,0.35)",
            }}
          >
            {spot.spotNumber}
          </div>
        </div>
      ) : (
        // Mat spot (yoga, dance, etc.)
        <div className="relative flex flex-col items-center">
          <div
            className={cn(
              "rounded-lg flex items-center justify-center transition-all",
              !isDragging && "group-hover:scale-105",
              isSelected && "ring-2 ring-amber-400/50"
            )}
            style={{
              width: `${70 * depthScale}px`,
              height: `${70 * depthScale}px`,
              background: isEmpty 
                ? "linear-gradient(180deg, rgba(60,55,50,0.6) 0%, rgba(45,40,35,0.6) 100%)"
                : "linear-gradient(180deg, rgba(80,70,60,0.7) 0%, rgba(60,50,40,0.7) 100%)",
              border: `2px solid ${isEmpty ? "rgba(60,180,160,0.4)" : "rgba(255,120,50,0.5)"}`,
              boxShadow: `0 4px 15px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}
          >
            <span 
              className="font-bold"
              style={{ 
                fontSize: `${16 * depthScale}px`,
                color: isEmpty ? "rgba(60,180,160,0.8)" : "rgba(255,200,150,0.9)",
              }}
            >
              {isEmpty ? spot.spotNumber : initials}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// REBALANCED Front of Class Stage - Warm key light source
function FrontOfClassStage({ scale = 1 }: { scale?: number }) {
  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none">
      {/* Stage/wall area */}
      <div 
        className="relative mx-4 rounded-b-lg overflow-hidden"
        style={{
          height: `${75 * scale}px`,
          // BRIGHTER warm wall
          background: `linear-gradient(180deg, 
            #3a3530 0%, 
            #302c28 30%, 
            #262320 60%, 
            #1e1c1a 100%
          )`,
          boxShadow: "inset 0 -3px 20px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.4)",
        }}
      >
        {/* Wall texture */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")
            `,
            opacity: 0.04,
            mixBlendMode: "overlay",
          }}
        />

        {/* Brick/panel texture */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 40px,
                rgba(255,200,150,0.03) 40px,
                rgba(255,200,150,0.03) 41px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 20px,
                rgba(255,180,120,0.02) 20px,
                rgba(255,180,120,0.02) 21px
              )
            `,
          }}
        />

        {/* PRIMARY KEY LIGHT STRIP - main light source */}
        <div 
          className="absolute inset-x-0 top-0"
          style={{
            height: `${12 * scale}px`,
            background: "linear-gradient(90deg, transparent 5%, rgba(255,150,70,0.9) 20%, rgba(255,180,100,1) 50%, rgba(255,150,70,0.9) 80%, transparent 95%)",
            boxShadow: `
              0 0 30px rgba(255,140,60,0.7), 
              0 0 60px rgba(255,120,50,0.5),
              0 0 100px rgba(255,100,40,0.3)
            `,
          }}
        />
        
        {/* Light cones from strip - KEY LIGHT falloff */}
        <div className="absolute inset-x-0 top-0 flex justify-around px-12" style={{ height: `${55 * scale}px` }}>
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="h-full"
              style={{
                width: `${90 * scale}px`,
                background: `radial-gradient(ellipse 100% 150% at center top, 
                  rgba(255,160,80,0.2) 0%, 
                  rgba(255,140,60,0.12) 30%,
                  rgba(255,120,50,0.05) 60%, 
                  transparent 90%
                )`,
              }}
            />
          ))}
        </div>

        {/* Stage glow bleeding onto floor - KEY LIGHT spill */}
        <div 
          className="absolute inset-x-0"
          style={{
            bottom: `${-80 * scale}px`,
            height: `${100 * scale}px`,
            background: `linear-gradient(180deg, 
              rgba(255,130,50,0.2) 0%, 
              rgba(255,110,40,0.12) 30%, 
              rgba(255,90,30,0.05) 60%, 
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
              color: "rgba(255,240,220,0.55)",
              textShadow: "0 0 20px rgba(255,160,90,0.5), 0 2px 4px rgba(0,0,0,0.4)",
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
              background: "linear-gradient(180deg, #4a4540 0%, #2a2825 100%)",
              boxShadow: "0 3px 8px rgba(0,0,0,0.5), 0 0 12px rgba(255,130,60,0.15)",
              border: "1px solid rgba(255,180,120,0.08)",
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
        background: "rgba(30,28,26,0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,200,150,0.1)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,200,150,0.06)",
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
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              isActive 
                ? "text-amber-200" 
                : "text-white/50 hover:text-white/70 hover:bg-white/5"
            )}
            style={isActive ? {
              background: "linear-gradient(180deg, rgba(255,160,80,0.2) 0%, rgba(255,120,50,0.15) 100%)",
              boxShadow: "0 0 15px rgba(255,120,50,0.15), inset 0 1px 0 rgba(255,200,150,0.1)",
            } : {}}
          >
            <Icon className="w-3.5 h-3.5" />
            {config.label}
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
    <div className="flex items-center gap-1">
      <button 
        onClick={onZoomOut}
        className="p-1.5 rounded-md text-white/50 hover:text-amber-200 hover:bg-white/5 transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <span className="text-white/50 text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
      <button 
        onClick={onZoomIn}
        className="p-1.5 rounded-md text-white/50 hover:text-amber-200 hover:bg-white/5 transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-4 bg-white/10 mx-1" />
      <button 
        onClick={onFitToView}
        className="p-1.5 rounded-md text-white/50 hover:text-amber-200 hover:bg-white/5 transition-colors"
        title="Fit to View"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
      <button 
        onClick={onTogglePan}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          isPanning 
            ? "text-amber-200 bg-amber-500/20" 
            : "text-white/50 hover:text-amber-200 hover:bg-white/5"
        )}
        title="Pan Mode"
      >
        <Move className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Floor Legend
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
      className="flex items-center justify-between px-4 py-2 rounded-lg"
      style={{
        background: "rgba(30,28,26,0.5)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,200,150,0.06)",
      }}
    >
      <div className="flex items-center gap-6">
        {/* Available indicator */}
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(60,180,160,0.8) 0%, rgba(60,180,160,0.4) 70%, transparent 100%)",
              boxShadow: "0 0 8px rgba(60,180,160,0.5)",
            }}
          />
          <span className="text-white/50 text-xs">Available Spot</span>
        </div>

        {/* Occupied indicator */}
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(255,120,50,0.9) 0%, rgba(255,120,50,0.5) 70%, transparent 100%)",
              boxShadow: "0 0 8px rgba(255,120,50,0.5)",
            }}
          />
          <span className="text-white/50 text-xs">Occupied Spot</span>
        </div>

        {/* Design mode hint */}
        {isDesignMode && (
          <div className="flex items-center gap-2 text-amber-400/60">
            <GripVertical className="w-3 h-3" />
            <span className="text-xs">Drag bags to reposition</span>
          </div>
        )}
      </div>

      <div className="text-white/40 text-xs">
        {occupiedCount} / {totalSpots} spots filled
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
  const updateBackgroundMutation = trpc.floorPlans.updateBackgroundImage.useMutation();
  const updateOpacityMutation = trpc.floorPlans.updateBackgroundOpacity.useMutation();
  const utils = trpc.useUtils();
  
  // Background image state
  const [showBackgroundControls, setShowBackgroundControls] = React.useState(false);
  const [backgroundOpacity, setBackgroundOpacity] = React.useState(floorPlan.backgroundOpacity ?? 30);
  const [showBackground, setShowBackground] = React.useState(!!floorPlan.backgroundImageUrl);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  // Background image handlers
  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }
    
    try {
      toast.loading('Uploading background image...');
      
      // Upload to S3 via API
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const { url } = await response.json();
      
      // Update floor plan with background image URL
      await updateBackgroundMutation.mutateAsync({
        floorPlanId: floorPlan.id,
        backgroundImageUrl: url,
        backgroundOpacity: backgroundOpacity,
      });
      
      setShowBackground(true);
      utils.floorPlans.getById.invalidate({ id: floorPlan.id });
      toast.dismiss();
      toast.success('Background image uploaded');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to upload background image');
      console.error('Upload error:', error);
    }
  };

  const handleRemoveBackground = async () => {
    try {
      await updateBackgroundMutation.mutateAsync({
        floorPlanId: floorPlan.id,
        backgroundImageUrl: null,
      });
      setShowBackground(false);
      utils.floorPlans.getById.invalidate({ id: floorPlan.id });
      toast.success('Background image removed');
    } catch (error) {
      toast.error('Failed to remove background image');
    }
  };

  const handleOpacityChange = (value: number) => {
    setBackgroundOpacity(value);
  };

  const handleOpacitySave = async () => {
    try {
      await updateOpacityMutation.mutateAsync({
        floorPlanId: floorPlan.id,
        backgroundOpacity: backgroundOpacity,
      });
      toast.success('Opacity saved');
    } catch (error) {
      toast.error('Failed to save opacity');
    }
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
          background: "rgba(30,28,26,0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,200,150,0.08)",
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
            
            {/* Background Image Button - Design mode only */}
            {isDesignMode && (
              <button 
                onClick={() => setShowBackgroundControls(!showBackgroundControls)}
                className={cn(
                  "p-1.5 rounded-md transition-colors flex items-center gap-1.5",
                  showBackgroundControls || floorPlan.backgroundImageUrl
                    ? "text-amber-200 bg-amber-500/20" 
                    : "text-white/40 hover:text-amber-200 hover:bg-white/5"
                )}
                style={{
                  background: showBackgroundControls ? "rgba(255,160,80,0.2)" : "rgba(30,28,26,0.6)",
                  border: "1px solid rgba(255,200,150,0.08)",
                }}
                title="Background Image"
              >
                <Image className="w-3.5 h-3.5" />
                <span className="text-xs">Background</span>
              </button>
            )}
            
            <button 
              className="p-1.5 rounded-md text-white/40 hover:text-amber-200 hover:bg-white/5 transition-colors"
              style={{
                background: "rgba(30,28,26,0.6)",
                border: "1px solid rgba(255,200,150,0.08)",
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
            background: "rgba(255, 150, 70, 0.12)",
            border: "1px solid rgba(255, 150, 70, 0.25)",
          }}
        >
          <GripVertical className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-sm">
            <strong>Design Mode:</strong> Drag bags to position them exactly where your hanging bags are located.
          </span>
        </div>
      )}

      {/* Background Image Controls Panel */}
      {showBackgroundControls && isDesignMode && (
        <div 
          className="flex items-center gap-4 px-4 py-3 rounded-lg"
          style={{
            background: "rgba(30,28,26,0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,200,150,0.12)",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleBackgroundUpload}
            className="hidden"
          />
          
          {!floorPlan.backgroundImageUrl ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: "linear-gradient(180deg, rgba(255,160,80,0.25) 0%, rgba(255,120,50,0.2) 100%)",
                border: "1px solid rgba(255,160,80,0.3)",
                color: "rgba(255,200,150,0.9)",
              }}
            >
              <Upload className="w-4 h-4" />
              Upload Room Photo
            </button>
          ) : (
            <>
              {/* Show/Hide Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBackground}
                  onChange={(e) => setShowBackground(e.target.checked)}
                  className="sr-only"
                />
                <div 
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors relative",
                    showBackground ? "bg-amber-500/50" : "bg-white/10"
                  )}
                >
                  <div 
                    className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                      showBackground ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </div>
                <span className="text-white/60 text-xs">Show</span>
              </label>
              
              {/* Opacity Slider */}
              <div className="flex items-center gap-2 flex-1">
                <Sliders className="w-3.5 h-3.5 text-white/40" />
                <span className="text-white/40 text-xs">Opacity</span>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={backgroundOpacity}
                  onChange={(e) => handleOpacityChange(Number(e.target.value))}
                  onMouseUp={handleOpacitySave}
                  onTouchEnd={handleOpacitySave}
                  className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                  style={{
                    accentColor: "rgba(255,160,80,0.8)",
                  }}
                />
                <span className="text-white/50 text-xs w-8">{backgroundOpacity}%</span>
              </div>
              
              {/* Replace Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-md text-white/50 hover:text-amber-200 hover:bg-white/5 transition-colors"
                title="Replace Image"
              >
                <Upload className="w-4 h-4" />
              </button>
              
              {/* Remove Button */}
              <button
                onClick={handleRemoveBackground}
                className="p-2 rounded-md text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Remove Background"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}

      {/* REBALANCED Floor Canvas - Visible surface, clear bags, controlled mood */}
      <div 
        ref={containerRef}
        className="rounded-xl overflow-auto"
        style={{
          // Warm glass frame
          background: "linear-gradient(180deg, rgba(45,40,36,0.75) 0%, rgba(32,28,26,0.85) 100%)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,180,120,0.1)",
          boxShadow: `
            0 10px 50px rgba(0,0,0,0.5), 
            inset 0 1px 0 rgba(255,200,150,0.05), 
            0 0 60px rgba(255,100,40,0.03)
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
          {/* BACKGROUND IMAGE LAYER - for tracing room layout */}
          {floorPlan.backgroundImageUrl && showBackground && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${floorPlan.backgroundImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: backgroundOpacity / 100,
                zIndex: 1,
              }}
            />
          )}

          {/* REBALANCED Base floor - BRIGHTER warm rubber mat */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 100% 85% at center 45%, 
                  #3a3632 0%, 
                  #343230 20%,
                  #2e2c2a 40%,
                  #282624 60%,
                  #222120 80%,
                  #1c1a18 100%
                )
              `,
              opacity: floorPlan.backgroundImageUrl && showBackground ? 0.7 : 1,
            }}
          />

          {/* RUBBER MAT TEXTURE - visible grain */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")
              `,
              opacity: 0.06,
              mixBlendMode: "overlay",
            }}
          />

          {/* MAT TILE SEAMS - clear segmentation */}
          <div 
            className="absolute inset-0 opacity-35"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 98px,
                  rgba(0,0,0,0.12) 98px,
                  rgba(0,0,0,0.12) 99px,
                  rgba(255,200,150,0.03) 99px,
                  rgba(255,200,150,0.03) 100px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 98px,
                  rgba(0,0,0,0.1) 98px,
                  rgba(0,0,0,0.1) 99px,
                  rgba(255,180,120,0.025) 99px,
                  rgba(255,180,120,0.025) 100px
                )
              `,
            }}
          />

          {/* SPECULAR RESPONSE - floor light reflection from key light */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 70% 50% at 50% 20%, 
                  rgba(255,180,120,0.08) 0%, 
                  transparent 60%
                ),
                radial-gradient(ellipse 90% 60% at 50% 85%, 
                  rgba(255,200,150,0.05) 0%, 
                  transparent 50%
                )
              `,
            }}
          />

          {/* 3D DEPTH GRADIENT - REDUCED darkness, visible floor */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, 
                rgba(0,0,0,0.35) 0%, 
                rgba(0,0,0,0.2) 15%,
                rgba(0,0,0,0.08) 30%, 
                transparent 50%, 
                rgba(255,200,150,0.02) 70%,
                rgba(255,180,120,0.04) 90%,
                rgba(255,160,100,0.05) 100%
              )`,
            }}
          />

          {/* ATMOSPHERIC HAZE - EDGES ONLY, not covering floor */}
          <div 
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: "18%",
              background: `linear-gradient(180deg, 
                rgba(45,40,35,0.25) 0%, 
                rgba(35,32,28,0.12) 50%, 
                transparent 100%
              )`,
            }}
          />

          {/* VIGNETTE - REDUCED, corners only */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 85% 70% at center 50%, 
                  transparent 30%, 
                  rgba(18,16,14,0.25) 60%,
                  rgba(12,10,8,0.45) 85%,
                  rgba(8,6,5,0.6) 100%
                )
              `,
            }}
          />

          {/* PRIMARY KEY LIGHT from stage - visible falloff */}
          <div 
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: `${200 * zoom}px`,
              background: `linear-gradient(180deg, 
                rgba(255,130,60,0.22) 0%, 
                rgba(255,110,50,0.14) 25%, 
                rgba(255,90,40,0.06) 50%, 
                transparent 100%
              )`,
            }}
          />

          {/* OVERHEAD FILL LIGHT - ensures bags are readable */}
          <div className="absolute inset-x-0 top-0 flex justify-around px-16 pointer-events-none" style={{ height: "50%" }}>
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                style={{
                  width: `${80 * zoom}px`,
                  height: "100%",
                  background: `linear-gradient(180deg, 
                    rgba(255,160,90,0.12) 0%, 
                    rgba(255,140,70,0.06) 40%, 
                    rgba(255,120,50,0.02) 70%,
                    transparent 100%
                  )`,
                  transform: `rotate(${(i - 2) * 1.5}deg)`,
                  transformOrigin: "top center",
                }}
              />
            ))}
          </div>

          {/* AMBIENT FILL - low-level room glow */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 100% 80% at 50% 100%, 
                  rgba(255,180,120,0.035) 0%, 
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
              border: "1px dashed rgba(255,180,120,0.06)",
              boxShadow: "inset 0 0 80px rgba(0,0,0,0.15)",
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
                border: "1px dashed rgba(255,180,120,0.08)",
                background: "rgba(255,200,150,0.015)",
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

          {/* Room dimensions */}
          <div className="absolute bottom-3 right-4" style={{ fontSize: `${11 * zoom}px`, color: "rgba(255,210,170,0.35)" }}>
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
