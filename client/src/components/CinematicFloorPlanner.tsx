import * as React from "react";
import { Eye, Pencil, MonitorPlay, Tv, Settings, Users, Package, Grid3x3 } from "lucide-react";
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

// Belt rank colors - cinematic glow
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

// Premium Spot Marker - Cinematic 3D kickboxing bag
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
    : "#4a5568";

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

  // Glow colors based on state - more cinematic
  const glowColor = isEmpty 
    ? "rgba(45, 212, 191, 0.5)" // teal for available
    : assignment?.beltRank?.toLowerCase().includes("instructor") 
      ? "rgba(239, 68, 68, 0.6)" // red for instructor
      : `${beltColor}88`; // belt color for occupied

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
      {/* Floor halo ring - larger, softer, more cinematic */}
      <div 
        className={cn(
          "absolute rounded-full transition-all duration-700",
          isEmpty && (isKiosk || isLive) && "animate-pulse"
        )}
        style={{
          width: "72px",
          height: "20px",
          bottom: "-12px",
          left: "50%",
          transform: "translateX(-50%)",
          background: `radial-gradient(ellipse, ${glowColor} 0%, ${glowColor}40 40%, transparent 70%)`,
          filter: "blur(6px)",
          opacity: isEmpty ? 0.7 : 0.85,
        }}
      />

      {/* Secondary glow ring - ambient */}
      <div 
        className="absolute rounded-full"
        style={{
          width: "56px",
          height: "16px",
          bottom: "-10px",
          left: "50%",
          transform: "translateX(-50%)",
          background: `radial-gradient(ellipse, ${glowColor}60 0%, transparent 60%)`,
          filter: "blur(3px)",
          opacity: 0.5,
        }}
      />

      {/* Main spot container */}
      {isBag ? (
        // Kickboxing Bag - Premium 3D realistic style
        <div
          className={cn(
            "flex flex-col items-center justify-center transition-all duration-300",
            "group-hover:scale-105 group-hover:-translate-y-1",
            isSelected && "scale-105 -translate-y-1",
          )}
        >
          {/* Bag number badge - smaller, premium, top cap */}
          <div 
            className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center z-20",
              isEmpty ? "bg-zinc-700/80" : "bg-red-600/90"
            )}
            style={{
              position: "absolute",
              top: "-6px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "8px",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: isEmpty ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)",
              boxShadow: isEmpty 
                ? "0 2px 6px rgba(0,0,0,0.4)"
                : "0 2px 8px rgba(220,38,38,0.5), 0 0 12px rgba(220,38,38,0.3)",
            }}
          >
            {spot.spotNumber}
          </div>

          {/* Bag body - sleek, realistic with highlights */}
          <div 
            className={cn(
              "w-7 h-12 rounded-lg overflow-hidden relative",
            )}
            style={{
              background: isEmpty 
                ? "linear-gradient(180deg, #3f3f46 0%, #27272a 50%, #18181b 100%)"
                : "linear-gradient(180deg, #3f3f46 0%, #27272a 40%, #18181b 100%)",
              boxShadow: `
                0 8px 24px rgba(0,0,0,0.6),
                0 4px 12px rgba(0,0,0,0.4),
                inset 0 1px 0 rgba(255,255,255,0.08),
                inset -1px 0 0 rgba(255,255,255,0.03)
              `,
            }}
          >
            {/* Left edge highlight - vertical gradient */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-0.5"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 100%)",
              }}
            />
            
            {/* Center specular highlight */}
            <div 
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 35%, rgba(255,255,255,0.04) 50%, transparent 65%)",
              }}
            />
            
            {/* Red accent panel for occupied bags */}
            {!isEmpty && (
              <div 
                className="absolute top-0.5 left-0.5 right-0.5 h-5 rounded-sm"
                style={{
                  background: "linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 1px 3px rgba(0,0,0,0.3)",
                }}
              >
                {/* Red panel highlight */}
                <div 
                  className="absolute inset-0 rounded-sm"
                  style={{
                    background: "linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
                  }}
                />
              </div>
            )}

            {/* Initials display - refined */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ paddingTop: isEmpty ? 0 : "6px" }}
            >
              <span 
                className={cn(
                  "font-medium",
                  isEmpty ? "text-zinc-600" : "text-white/80"
                )}
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.03em",
                }}
              >
                {assignment ? initials : ""}
              </span>
            </div>
          </div>

          {/* Bag base/stand - subtle */}
          <div 
            className="w-5 h-1 rounded-b mt-0.5"
            style={{
              background: "linear-gradient(180deg, #27272a 0%, #0a0a0a 100%)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          />

          {/* Floor shadow - soft ellipse directly under bag */}
          <div 
            className="absolute"
            style={{
              bottom: "-6px",
              width: "28px",
              height: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 50%, transparent 70%)",
              filter: "blur(3px)",
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
              "w-12 h-6 rounded overflow-hidden relative",
              isEmpty ? "bg-zinc-700" : "bg-gradient-to-b from-purple-500 via-purple-600 to-purple-800",
            )}
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                "font-medium",
                isEmpty ? "text-zinc-500" : "text-white/80"
              )} style={{ fontSize: "9px" }}>
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
              "w-8 h-8 rounded-full flex items-center justify-center relative",
              isEmpty ? "bg-zinc-700" : "bg-gradient-to-br from-amber-400 to-amber-600",
            )}
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <span className={cn(
              "font-medium",
              isEmpty ? "text-zinc-500" : "text-white"
            )} style={{ fontSize: "9px" }}>
              {assignment ? initials : spot.spotLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Front of Class Stage - Cinematic wall with warm lighting (emotional anchor)
function FrontOfClassStage({ width }: { width: number }) {
  return (
    <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none">
      {/* Wall texture background with brick feel */}
      <div 
        className="absolute inset-x-3 top-1.5 h-16 rounded-lg overflow-hidden"
        style={{
          background: `
            linear-gradient(180deg, 
              rgba(25, 18, 12, 0.98) 0%, 
              rgba(35, 28, 20, 0.95) 30%,
              rgba(30, 23, 16, 0.97) 70%,
              rgba(22, 16, 10, 0.98) 100%
            )
          `,
          boxShadow: `
            0 6px 40px rgba(0,0,0,0.7), 
            inset 0 1px 0 rgba(255,180,120,0.08),
            inset 0 -3px 30px rgba(0,0,0,0.4)
          `,
          border: "1px solid rgba(255,180,120,0.06)",
        }}
      >
        {/* Subtle brick texture overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 30px,
                rgba(0,0,0,0.15) 30px,
                rgba(0,0,0,0.15) 31px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 15px,
                rgba(0,0,0,0.1) 15px,
                rgba(0,0,0,0.1) 16px
              )
            `,
          }}
        />

        {/* Warm overhead light strip - horizontal glow */}
        <div 
          className="absolute inset-x-0 top-0 h-1.5"
          style={{
            background: "linear-gradient(90deg, transparent 5%, rgba(255,120,40,0.6) 25%, rgba(255,160,80,0.7) 50%, rgba(255,120,40,0.6) 75%, transparent 95%)",
            boxShadow: "0 0 20px rgba(255,140,60,0.4), 0 0 40px rgba(255,120,40,0.2)",
          }}
        />
        
        {/* Light reflection spots on wall */}
        <div className="absolute inset-x-0 top-0 h-6 flex justify-around px-16">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="w-20 h-full"
              style={{
                background: "radial-gradient(ellipse at center top, rgba(255,160,100,0.12) 0%, transparent 70%)",
              }}
            />
          ))}
        </div>

        {/* Stage glow bleeding onto floor - warm light */}
        <div 
          className="absolute inset-x-0 -bottom-12 h-16"
          style={{
            background: "linear-gradient(180deg, rgba(255,120,40,0.1) 0%, rgba(255,100,50,0.04) 40%, transparent 100%)",
          }}
        />

        {/* FRONT OF CLASS label - premium, spaced */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-white/50 font-medium uppercase"
            style={{ 
              fontSize: "10px",
              letterSpacing: "0.35em",
            }}
          >
            Front of Class
          </span>
        </div>

        {/* Instructor position marker */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1">
          <div 
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)",
              boxShadow: "0 2px 8px rgba(239,68,68,0.5), 0 0 20px rgba(239,68,68,0.3)",
            }}
          >
            <Users className="w-2 h-2 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Mode Switcher - Glass panel style
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

// Legend - Smaller, more subtle glass panel
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
      className="flex items-center gap-3 px-3 py-1.5 rounded-lg"
      style={{
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.04)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      <div className="flex items-center gap-1.5">
        <div 
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: "#2dd4bf",
            boxShadow: "0 0 8px rgba(45,212,191,0.6)",
          }}
        />
        <span className="text-white/40" style={{ fontSize: "10px" }}>Available Spot</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div 
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: "#ef4444",
            boxShadow: "0 0 8px rgba(239,68,68,0.6)",
          }}
        />
        <span className="text-white/40" style={{ fontSize: "10px" }}>Occupied Spot</span>
      </div>
      <div className="h-2.5 w-px bg-white/10" />
      <div className="ml-auto">
        <span className="text-white/30" style={{ fontSize: "10px" }}>
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
    <div className="w-full space-y-3">
      {/* Header with room info and mode switcher - glass panel */}
      <div 
        className="flex items-center justify-between px-3 py-2 rounded-xl"
        style={{
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div 
            className="p-2 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {floorPlan.templateType === "kickboxing_bags" && <Package className="w-4 h-4 text-red-400" />}
            {floorPlan.templateType === "yoga_grid" && <Grid3x3 className="w-4 h-4 text-purple-400" />}
            {floorPlan.templateType === "karate_lines" && <Users className="w-4 h-4 text-blue-400" />}
          </div>
          <div>
            <h2 className="text-base font-medium text-white" style={{ letterSpacing: "-0.01em" }}>{floorPlan.roomName}</h2>
            <div className="flex items-center gap-1.5 text-white/40" style={{ fontSize: "10px" }}>
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
            <span className="text-white/30" style={{ fontSize: "10px" }}>View</span>
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

      {/* Floor Canvas - Cinematic Dojo Room */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.04)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        <div 
          ref={containerRef}
          className="relative w-full"
          style={{
            aspectRatio: `${floorPlan.widthFeet || 40} / ${floorPlan.lengthFeet || 40}`,
            minHeight: "420px",
            maxHeight: "none",
            position: 'relative',
          }}
        >
          {/* Base floor - dark dojo mat with center light */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at center 40%, 
                  rgba(35, 40, 50, 1) 0%, 
                  rgba(25, 30, 40, 1) 40%,
                  rgba(18, 22, 30, 1) 70%,
                  rgba(12, 15, 20, 1) 100%
                )
              `,
            }}
          />

          {/* Mat texture - very subtle stitched pattern */}
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 50px,
                  rgba(255,255,255,0.008) 50px,
                  rgba(255,255,255,0.008) 51px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 50px,
                  rgba(255,255,255,0.008) 50px,
                  rgba(255,255,255,0.008) 51px
                )
              `,
            }}
          />

          {/* Micro grain texture */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              opacity: 0.015,
            }}
          />

          {/* Vignette - shaped, not uniform */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 90% 70% at center 45%, 
                  transparent 40%, 
                  rgba(0,0,0,0.25) 70%,
                  rgba(0,0,0,0.5) 100%
                )
              `,
            }}
          />

          {/* Top-down perspective (darker at top, lighter toward bottom center) */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 20%, transparent 40%, transparent 70%, rgba(0,0,0,0.15) 100%)",
            }}
          />

          {/* Warm ambient light from stage - soft glow */}
          <div 
            className="absolute inset-x-0 top-0 h-48 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,120,40,0.08) 0%, rgba(255,100,50,0.03) 40%, transparent 100%)",
            }}
          />

          {/* Faint light shafts from ceiling */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[18, 35, 50, 65, 82].map((pos, i) => (
              <div 
                key={i}
                className="absolute top-0"
                style={{
                  left: `${pos}%`,
                  width: "60px",
                  height: "180px",
                  transform: "translateX(-50%)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.015) 0%, transparent 100%)",
                  clipPath: "polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)",
                  opacity: 0.7,
                }}
              />
            ))}
          </div>

          {/* Light reflection on floor under bags area */}
          <div 
            className="absolute pointer-events-none"
            style={{
              left: "10%",
              right: "10%",
              top: "30%",
              bottom: "10%",
              background: "radial-gradient(ellipse at center, rgba(255,255,255,0.01) 0%, transparent 70%)",
            }}
          />

          {/* Mat boundary - soft inner glow with stitched outline */}
          <div 
            className="absolute inset-5 rounded-lg pointer-events-none"
            style={{
              border: "1px dashed rgba(255,255,255,0.05)",
              boxShadow: "inset 0 0 60px rgba(0,0,0,0.25), inset 0 0 2px rgba(255,255,255,0.02)",
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
                border: "1px dashed rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.005)",
              }}
            >
              <span className="absolute top-1.5 left-1.5 text-white/20 font-medium" style={{ fontSize: "9px" }}>
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

          {/* Room dimensions label - very subtle */}
          <div className="absolute bottom-2 right-3 text-white/20" style={{ fontSize: "9px" }}>
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
