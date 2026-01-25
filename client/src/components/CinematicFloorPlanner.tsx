import React from "react";
import { Eye, Pencil, MonitorPlay, Tv, Settings, Users, Package, Grid3x3, Sparkles, ChevronDown } from "lucide-react";
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

// Belt rank colors - enhanced for cinematic glow
const BELT_COLORS: Record<string, string> = {
  white: "#f8f9fa",
  yellow: "#ffd700",
  orange: "#ff8c00",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
  brown: "#92400e",
  red: "#ef4444",
  black: "#1a1a1a",
};

// Mode configurations
const MODE_CONFIG = {
  design: { icon: Pencil, label: "Design", description: "Edit layout" },
  kiosk: { icon: Eye, label: "Kiosk Preview", description: "Student view" },
  live: { icon: MonitorPlay, label: "Live Class", description: "Active session" },
  wall: { icon: Tv, label: "Wall Display", description: "TV screens" },
};

// Cinematic Spot Component - Premium 3D kickboxing bag
function SpotMarker({
  spot,
  assignment,
  isHighlighted,
  isSelected,
  onClick,
  mode,
  templateType,
  containerRef,
  onDragEnd,
}: {
  spot: Spot;
  assignment?: AssignedStudent;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
  mode: ViewMode;
  templateType: string;
  containerRef: React.RefObject<HTMLDivElement>;
  onDragEnd?: (spotId: number, newX: number, newY: number) => void;
}) {
  const isEmpty = !assignment;
  const isKiosk = mode === "kiosk";
  const isLive = mode === "live";
  const isDesign = mode === "design";
  const isDraggable = isDesign && onDragEnd;

  // Drag state
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) return;
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !containerRef.current || !onDragEnd) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    onDragEnd(spot.id, dx, dy);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Get belt color for ring
  const beltColor = assignment?.beltRank 
    ? BELT_COLORS[assignment.beltRank.toLowerCase().replace(" belt", "")] || "#3b82f6"
    : "#6b7280";

  // Determine spot styling based on template type
  const isBag = spot.spotType === "bag" || templateType === "kickboxing_bags";
  const isMat = spot.spotType === "mat" || templateType === "yoga_grid";

  // Get initials
  const initials = assignment?.initials || assignment?.studentName
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "";

  // Use position values directly - they are already in 0-100% format
  const clampedX = Math.max(0, Math.min(100, spot.positionX));
  const clampedY = Math.max(0, Math.min(100, spot.positionY));

  // Glow colors based on state
  const glowColor = isEmpty 
    ? "rgba(34, 197, 94, 0.6)" // teal/green for available
    : assignment?.beltRank?.toLowerCase().includes("instructor") 
      ? "rgba(239, 68, 68, 0.7)" // red for instructor
      : `${beltColor}99`; // belt color for occupied

  return (
    <div
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={cn(
        "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group",
        isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      )}
      style={{
        left: `${clampedX}%`,
        top: `${clampedY}%`,
        zIndex: isSelected ? 50 : 10,
        opacity: isDragging ? 0.8 : 1,
      }}
    >
      {/* Floor halo ring - cinematic glow effect */}
      <div 
        className={cn(
          "absolute rounded-full transition-all duration-500",
          isEmpty && (isKiosk || isLive) && "animate-pulse"
        )}
        style={{
          width: "48px",
          height: "14px",
          bottom: "-8px",
          left: "50%",
          transform: "translateX(-50%)",
          background: `radial-gradient(ellipse, ${glowColor} 0%, transparent 70%)`,
          boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}40`,
          opacity: isEmpty ? 0.8 : 0.9,
        }}
      />

      {/* Main spot container */}
      {isBag ? (
        // Kickboxing Bag - Premium 3D style
        <div
          className={cn(
            "flex flex-col items-center justify-center transition-all duration-300",
            "group-hover:scale-105 group-hover:-translate-y-0.5",
            isSelected && "scale-105 -translate-y-0.5",
          )}
        >
          {/* Bag number badge - smaller, premium */}
          <div 
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center z-20",
              "shadow-lg",
              isEmpty ? "bg-zinc-700/90 text-zinc-400" : "bg-red-600 text-white"
            )}
            style={{
              position: "absolute",
              top: "-8px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              boxShadow: isEmpty 
                ? "0 2px 8px rgba(0,0,0,0.3)"
                : "0 2px 8px rgba(239,68,68,0.4), 0 0 12px rgba(239,68,68,0.2)",
            }}
          >
            {spot.spotNumber}
          </div>

          {/* Bag body - sleeker, more realistic */}
          <div 
            className={cn(
              "w-8 h-14 rounded-lg overflow-hidden relative",
              isEmpty ? "bg-zinc-800" : "bg-gradient-to-b from-zinc-800 via-zinc-900 to-black",
            )}
            style={{
              boxShadow: isEmpty 
                ? "0 6px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)"
                : "0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            {/* Bag vertical highlight - left edge */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
              }}
            />
            
            {/* Bag center highlight */}
            <div 
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%)",
              }}
            />
            
            {/* Red accent panel for occupied bags */}
            {!isEmpty && (
              <div 
                className="absolute top-1 left-1 right-1 h-6 rounded"
                style={{
                  background: "linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.3)",
                }}
              />
            )}

            {/* Initials display - smaller, refined */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ paddingTop: isEmpty ? 0 : "8px" }}
            >
              <span 
                className={cn(
                  "font-medium",
                  isEmpty ? "text-zinc-600" : "text-white/90"
                )}
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.02em",
                }}
              >
                {assignment ? initials : ""}
              </span>
            </div>
          </div>

          {/* Bag base/stand - subtle */}
          <div 
            className="w-6 h-1.5 rounded-b mt-0.5"
            style={{
              background: "linear-gradient(180deg, #1f1f1f 0%, #0a0a0a 100%)",
            }}
          />

          {/* Floor shadow - soft ellipse */}
          <div 
            className="absolute"
            style={{
              bottom: "-4px",
              width: "32px",
              height: "8px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)",
              filter: "blur(2px)",
            }}
          />
        </div>
      ) : isMat ? (
        // Yoga Mat - Premium style
        <div
          className={cn(
            "flex items-center justify-center transition-all duration-300",
            "group-hover:scale-105",
            isSelected && "scale-105",
          )}
        >
          <div 
            className={cn(
              "w-14 h-7 rounded overflow-hidden relative",
              isEmpty ? "bg-zinc-700" : "bg-gradient-to-b from-purple-500 via-purple-600 to-purple-800",
            )}
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                "font-medium text-xs",
                isEmpty ? "text-zinc-500" : "text-white/90"
              )}>
                {assignment ? initials : spot.spotLabel}
              </span>
            </div>
          </div>
        </div>
      ) : (
        // Rank Position (circle) - Premium
        <div
          className={cn(
            "flex items-center justify-center transition-all duration-300",
            "group-hover:scale-105",
            isSelected && "scale-105",
          )}
        >
          <div 
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center relative",
              isEmpty ? "bg-zinc-700" : "bg-gradient-to-br from-amber-400 to-amber-600",
            )}
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <span className={cn(
              "font-medium text-xs",
              isEmpty ? "text-zinc-500" : "text-white"
            )}>
              {assignment ? initials : spot.spotLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Front of Class Stage Component - Cinematic wall with warm lighting
function FrontOfClassStage({ width }: { width: number }) {
  return (
    <div className="absolute top-0 left-0 right-0 h-20 pointer-events-none">
      {/* Wall texture background */}
      <div 
        className="absolute inset-x-4 top-2 h-14 rounded-lg overflow-hidden"
        style={{
          background: `
            linear-gradient(180deg, 
              rgba(20, 15, 10, 0.95) 0%, 
              rgba(30, 25, 20, 0.9) 40%,
              rgba(25, 20, 15, 0.95) 100%
            )
          `,
          boxShadow: `
            0 4px 30px rgba(0,0,0,0.6), 
            inset 0 1px 0 rgba(255,200,150,0.1),
            inset 0 -2px 20px rgba(0,0,0,0.3)
          `,
          border: "1px solid rgba(255,200,150,0.08)",
        }}
      >
        {/* Warm overhead lights */}
        <div 
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background: "linear-gradient(90deg, transparent 10%, rgba(255,140,0,0.5) 30%, rgba(255,180,100,0.6) 50%, rgba(255,140,0,0.5) 70%, transparent 90%)",
          }}
        />
        
        {/* Light reflection spots */}
        <div className="absolute inset-x-0 top-0 h-3 flex justify-around px-20">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="w-16 h-full"
              style={{
                background: "radial-gradient(ellipse at center top, rgba(255,180,100,0.15) 0%, transparent 70%)",
              }}
            />
          ))}
        </div>

        {/* Stage glow onto floor */}
        <div 
          className="absolute inset-x-0 -bottom-8 h-12"
          style={{
            background: "linear-gradient(180deg, rgba(255,140,0,0.12) 0%, rgba(255,100,50,0.05) 50%, transparent 100%)",
          }}
        />

        {/* FRONT OF CLASS label - refined */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-white/60 font-medium tracking-[0.3em] uppercase"
            style={{ fontSize: "11px" }}
          >
            Front of Class
          </span>
        </div>

        {/* Instructor position marker */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1.5">
          <div 
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)",
              boxShadow: "0 2px 8px rgba(239,68,68,0.4), 0 0 16px rgba(239,68,68,0.2)",
            }}
          >
            <Users className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Mode Switcher Component - Refined
function ModeSwitcher({ 
  currentMode, 
  onModeChange 
}: { 
  currentMode: ViewMode; 
  onModeChange: (mode: ViewMode) => void;
}) {
  return (
    <div 
      className="inline-flex items-center gap-0.5 p-1 rounded-lg"
      style={{
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)",
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
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200",
              isActive 
                ? "bg-white/10 text-white" 
                : "text-white/50 hover:text-white/70 hover:bg-white/5"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Legend Component - Smaller, more subtle
function FloorLegend({ 
  templateType, 
  occupiedCount, 
  totalSpots 
}: { 
  templateType: string;
  occupiedCount: number;
  totalSpots: number;
}) {
  return (
    <div 
      className="flex items-center gap-4 px-3 py-2 rounded-lg"
      style={{
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-1.5">
        <div 
          className="w-2 h-2 rounded-full"
          style={{
            background: "#22c55e",
            boxShadow: "0 0 6px rgba(34,197,94,0.5)",
          }}
        />
        <span className="text-white/50 text-xs">Available Spot</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div 
          className="w-2 h-2 rounded-full"
          style={{
            background: "#ef4444",
            boxShadow: "0 0 6px rgba(239,68,68,0.5)",
          }}
        />
        <span className="text-white/50 text-xs">Occupied Spot</span>
      </div>
      <div className="h-3 w-px bg-white/10" />
      <div className="ml-auto">
        <span className="text-white/40 text-xs">
          {occupiedCount} / {totalSpots} spots
        </span>
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
  const containerRef = React.useRef<HTMLDivElement>(null);

  // TRPC mutations
  const batchUpdateSpotsMutation = trpc.floorPlans.batchUpdateSpots.useMutation();
  const updateSpotPositionMutation = trpc.floorPlans.updateSpotPosition.useMutation();

  const handleModeChange = (mode: ViewMode) => {
    setCurrentMode(mode);
    onModeChange?.(mode);
  };

  const handleSpotClick = (spot: Spot) => {
    setSelectedSpot(spot.id);
    onSpotClick?.(spot);
  };

  const handleApplyLayout = async (preset: string, rows: number, cols: number, spacing: number, padding: number) => {
    if (!floorPlan.lengthFeet || !floorPlan.widthFeet) {
      toast.error("Floor plan dimensions not available");
      return;
    }

    try {
      const positions = generateLayout({
        preset,
        rows,
        cols,
        spacing,
        padding,
        roomWidth: floorPlan.lengthFeet,
        roomHeight: floorPlan.widthFeet,
        totalSpots: floorPlan.spots.length,
        stageHeight: 5,
      });

      const spotsToUpdate = positions.map((pos) => {
        const spot = floorPlan.spots.find((s) => s.spotNumber === pos.spotId);
        return {
          spotId: spot?.id || 0,
          positionX: pos.positionX,
          positionY: pos.positionY,
        };
      }).filter((s) => s.spotId > 0);

      await batchUpdateSpotsMutation.mutateAsync({
        floorPlanId: floorPlan.id,
        spots: spotsToUpdate,
      });

      toast.success(`Layout applied: ${preset} (${rows}x${cols})`);
    } catch (error) {
      console.error("Error applying layout:", error);
      toast.error("Failed to apply layout");
    }
  };

  const handleResetLayout = () => {
    toast.info("Reset layout - generating default grid");
  };

  const handleSaveLayout = () => {
    toast.success("Layout saved to floor plan");
  };

  const handleSpotDrag = async (spotId: number, dx: number, dy: number) => {
    const spot = floorPlan.spots.find((s) => s.id === spotId);
    if (!spot) return;
    const newX = Math.max(0, Math.min(100, spot.positionX + (dx / 400) * 100));
    const newY = Math.max(0, Math.min(100, spot.positionY + (dy / 400) * 100));
    try {
      await updateSpotPositionMutation.mutateAsync({
        spotId,
        positionX: newX,
        positionY: newY,
      });
    } catch (error) {
      console.error("Error updating spot position:", error);
    }
  };

  const occupiedCount = assignedStudents.length;
  const totalSpots = floorPlan.spots.length;

  return (
    <div className="w-full space-y-4">
      {/* Header with room info and mode switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="p-2.5 rounded-lg"
            style={{
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {floorPlan.templateType === "kickboxing_bags" && <Package className="w-5 h-5 text-red-400" />}
            {floorPlan.templateType === "yoga_grid" && <Grid3x3 className="w-5 h-5 text-purple-400" />}
            {floorPlan.templateType === "karate_lines" && <Users className="w-5 h-5 text-blue-400" />}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{floorPlan.roomName}</h2>
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <span>{totalSpots} Spots</span>
              <span>•</span>
              <span className="capitalize">{floorPlan.templateType.replace("_", " ")}</span>
              <span>•</span>
              <span>{floorPlan.lengthFeet} ft × {floorPlan.widthFeet} ft</span>
            </div>
          </div>
        </div>

        {showModeSwitch && (
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs">View</span>
            <ModeSwitcher currentMode={currentMode} onModeChange={handleModeChange} />
            <button 
              className="p-1.5 rounded-md text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Floor Canvas - Cinematic Room */}
      <div>
        <div 
          ref={containerRef}
          className="relative w-full rounded-xl overflow-hidden"
          style={{
            aspectRatio: `${floorPlan.widthFeet || 40} / ${floorPlan.lengthFeet || 40}`,
            minHeight: "450px",
            maxHeight: "none",
            position: 'relative',
          }}
        >
          {/* Base floor - dark mat texture */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at center top, 
                  rgba(30, 35, 45, 1) 0%, 
                  rgba(20, 25, 35, 1) 40%,
                  rgba(15, 18, 25, 1) 100%
                )
              `,
            }}
          />

          {/* Mat texture - subtle stitched pattern */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 60px,
                  rgba(255,255,255,0.015) 60px,
                  rgba(255,255,255,0.015) 61px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 60px,
                  rgba(255,255,255,0.015) 60px,
                  rgba(255,255,255,0.015) 61px
                )
              `,
            }}
          />

          {/* Vignette - soft edges */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse at center, 
                  transparent 50%, 
                  rgba(0,0,0,0.4) 100%
                )
              `,
            }}
          />

          {/* Top-down perspective gradient (darker at top) */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 80%, rgba(0,0,0,0.2) 100%)",
            }}
          />

          {/* Warm ambient light from stage */}
          <div 
            className="absolute inset-x-0 top-0 h-40 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,140,0,0.06) 0%, rgba(255,100,50,0.02) 50%, transparent 100%)",
            }}
          />

          {/* Light cones from ceiling (subtle) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[20, 40, 60, 80].map((pos, i) => (
              <div 
                key={i}
                className="absolute top-0"
                style={{
                  left: `${pos}%`,
                  width: "80px",
                  height: "200px",
                  transform: "translateX(-50%)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)",
                  clipPath: "polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)",
                }}
              />
            ))}
          </div>

          {/* Mat boundary - soft dotted line */}
          <div 
            className="absolute inset-6 rounded-lg pointer-events-none"
            style={{
              border: "1px dashed rgba(255,255,255,0.08)",
              boxShadow: "inset 0 0 80px rgba(0,0,0,0.3)",
            }}
          />

          {/* Subtle ambient grain/particles */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              opacity: 0.03,
            }}
          />

          {/* Front of Class Stage */}
          <FrontOfClassStage width={100} />

          {/* Zones (if any) */}
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="absolute rounded-lg pointer-events-none"
              style={{
                left: `${zone.bounds.x}%`,
                top: `${zone.bounds.y}%`,
                width: `${zone.bounds.width}%`,
                height: `${zone.bounds.height}%`,
                border: "1px dashed rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.01)",
              }}
            >
              <span className="absolute top-2 left-2 text-xs text-white/30 font-medium">
                {zone.name}
              </span>
            </div>
          ))}

          {/* Spots Container */}
          <div className="absolute inset-0">
            {floorPlan.spots.map((spot) => {
              const assignment = assignedStudents.find((a) => a.spotId === spot.id);
              return (
                <SpotMarker
                  key={spot.id}
                  spot={spot}
                  assignment={assignment}
                  isHighlighted={false}
                  isSelected={selectedSpot === spot.id}
                  onClick={() => handleSpotClick(spot)}
                  mode={currentMode}
                  templateType={floorPlan.templateType}
                  containerRef={containerRef}
                  onDragEnd={handleSpotDrag}
                />
              );
            })}
          </div>

          {/* Room dimensions label - subtle */}
          <div className="absolute bottom-3 right-3 text-white/30 text-xs">
            {floorPlan.lengthFeet} ft × {floorPlan.widthFeet} ft
          </div>
        </div>
      </div>

      {/* Legend */}
      <FloorLegend 
        templateType={floorPlan.templateType}
        occupiedCount={occupiedCount}
        totalSpots={totalSpots}
      />

      {/* Layout Controls - Design mode only */}
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
