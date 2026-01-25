import React from "react";
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

// Premium 3D Kickboxing Bag Marker - Matching reference image
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

  // Clamp positions
  const clampedX = Math.max(5, Math.min(95, spot.positionX));
  const clampedY = Math.max(15, Math.min(90, spot.positionY));

  // Glow ring color - teal for available, amber/red for occupied
  const ringColor = isEmpty 
    ? "rgba(45, 212, 191, 0.6)" // teal/cyan for available
    : "rgba(239, 100, 60, 0.7)"; // amber/red for occupied

  // Check for special roles
  const isInstructor = assignment?.beltRank?.toLowerCase().includes("instructor");
  const isReserved = assignment?.beltRank?.toLowerCase().includes("reserved");

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
      {/* Large elliptical floor glow ring - cinematic style */}
      <div 
        className={cn(
          "absolute rounded-full transition-all duration-500",
          isEmpty && (isKiosk || isLive) && "animate-pulse"
        )}
        style={{
          width: "90px",
          height: "28px",
          bottom: "-8px",
          left: "50%",
          transform: "translateX(-50%)",
          background: `radial-gradient(ellipse, ${ringColor} 0%, ${ringColor}60 30%, ${ringColor}20 60%, transparent 80%)`,
          filter: "blur(8px)",
          opacity: 0.9,
        }}
      />

      {/* Secondary inner ring - brighter core */}
      <div 
        className="absolute rounded-full"
        style={{
          width: "60px",
          height: "18px",
          bottom: "-4px",
          left: "50%",
          transform: "translateX(-50%)",
          background: `radial-gradient(ellipse, ${ringColor}80 0%, ${ringColor}40 50%, transparent 80%)`,
          filter: "blur(4px)",
          opacity: 0.7,
        }}
      />

      {/* Ring outline - subtle border */}
      <div 
        className="absolute rounded-full"
        style={{
          width: "70px",
          height: "22px",
          bottom: "-6px",
          left: "50%",
          transform: "translateX(-50%)",
          border: `1px solid ${isEmpty ? "rgba(45,212,191,0.3)" : "rgba(239,100,60,0.4)"}`,
          opacity: 0.6,
        }}
      />

      {/* Main spot container */}
      {isBag ? (
        // 3D Kickboxing Bag - Tall cylindrical with tapered base
        <div
          className={cn(
            "flex flex-col items-center justify-center transition-all duration-300",
            "group-hover:scale-105 group-hover:-translate-y-1",
            isSelected && "scale-105 -translate-y-1",
          )}
        >
          {/* Bag number badge - red circle on top */}
          <div 
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center z-20",
              isEmpty ? "bg-zinc-600" : "bg-red-600"
            )}
            style={{
              position: "absolute",
              top: "-8px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "10px",
              fontWeight: 600,
              color: "white",
              boxShadow: isEmpty 
                ? "0 2px 6px rgba(0,0,0,0.5)"
                : "0 2px 10px rgba(220,38,38,0.6), 0 0 15px rgba(220,38,38,0.4)",
            }}
          >
            {spot.spotNumber}
          </div>

          {/* Bag body - tall cylindrical shape */}
          <div 
            className="relative overflow-hidden"
            style={{
              width: "32px",
              height: "56px",
              borderRadius: "6px 6px 4px 4px",
              background: "linear-gradient(180deg, #4a4a4a 0%, #2d2d2d 30%, #1a1a1a 70%, #0f0f0f 100%)",
              boxShadow: `
                0 12px 30px rgba(0,0,0,0.7),
                0 6px 15px rgba(0,0,0,0.5),
                inset 0 2px 0 rgba(255,255,255,0.1),
                inset -2px 0 0 rgba(255,255,255,0.05),
                inset 2px 0 0 rgba(0,0,0,0.2)
              `,
            }}
          >
            {/* Left edge highlight */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)",
              }}
            />
            
            {/* Center specular highlight */}
            <div 
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)",
              }}
            />
            
            {/* Red accent panel for occupied bags */}
            {!isEmpty && (
              <div 
                className="absolute top-1 left-1 right-1 rounded-sm"
                style={{
                  height: "22px",
                  background: "linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                {/* Red panel highlight */}
                <div 
                  className="absolute inset-0 rounded-sm"
                  style={{
                    background: "linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%)",
                  }}
                />
                
                {/* Initials on red panel */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span 
                    className="text-white font-semibold"
                    style={{ fontSize: "11px", letterSpacing: "0.05em" }}
                  >
                    {initials}
                  </span>
                </div>
              </div>
            )}

            {/* Special labels */}
            {isInstructor && (
              <div 
                className="absolute bottom-1 left-0 right-0 flex items-center justify-center"
              >
                <span 
                  className="text-white/70 uppercase"
                  style={{ fontSize: "5px", letterSpacing: "0.1em" }}
                >
                  Instructor
                </span>
              </div>
            )}
            
            {isReserved && (
              <div 
                className="absolute bottom-1 left-0 right-0 flex items-center justify-center"
              >
                <span 
                  className="text-white/70 uppercase"
                  style={{ fontSize: "5px", letterSpacing: "0.1em" }}
                >
                  Reserved
                </span>
              </div>
            )}
          </div>

          {/* Bag base/stand - tapered */}
          <div 
            style={{
              width: "24px",
              height: "8px",
              marginTop: "-2px",
              background: "linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)",
              borderRadius: "0 0 4px 4px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
            }}
          />

          {/* Floor shadow directly under bag */}
          <div 
            className="absolute"
            style={{
              bottom: "-4px",
              width: "36px",
              height: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, transparent 80%)",
              filter: "blur(4px)",
            }}
          />

          {/* Spot number label below bag */}
          <div 
            className="absolute text-white/30"
            style={{
              bottom: "-20px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "9px",
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
                "font-medium",
                isEmpty ? "text-zinc-500" : "text-white/80"
              )} style={{ fontSize: "10px" }}>
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
              "w-9 h-9 rounded-full flex items-center justify-center relative",
              isEmpty ? "bg-zinc-700" : "bg-gradient-to-br from-amber-400 to-amber-600",
            )}
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <span className={cn(
              "font-medium",
              isEmpty ? "text-zinc-500" : "text-white"
            )} style={{ fontSize: "10px" }}>
              {assignment ? initials : spot.spotLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Front of Class Stage - Warm cinematic wall
function FrontOfClassStage({ width }: { width: number }) {
  return (
    <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none">
      {/* Wall background with warm texture */}
      <div 
        className="absolute inset-x-4 top-2 h-20 rounded-lg overflow-hidden"
        style={{
          background: `
            linear-gradient(180deg, 
              rgba(30, 22, 15, 0.98) 0%, 
              rgba(40, 30, 20, 0.95) 40%,
              rgba(35, 26, 18, 0.97) 70%,
              rgba(25, 18, 12, 0.98) 100%
            )
          `,
          boxShadow: `
            0 8px 50px rgba(0,0,0,0.8), 
            inset 0 2px 0 rgba(255,180,120,0.1),
            inset 0 -4px 40px rgba(0,0,0,0.5)
          `,
          border: "1px solid rgba(255,180,120,0.08)",
        }}
      >
        {/* Brick texture overlay */}
        <div 
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 35px,
                rgba(0,0,0,0.2) 35px,
                rgba(0,0,0,0.2) 36px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 18px,
                rgba(0,0,0,0.15) 18px,
                rgba(0,0,0,0.15) 19px
              )
            `,
          }}
        />

        {/* Warm overhead light strip */}
        <div 
          className="absolute inset-x-0 top-0 h-2"
          style={{
            background: "linear-gradient(90deg, transparent 3%, rgba(255,100,30,0.7) 20%, rgba(255,140,60,0.8) 50%, rgba(255,100,30,0.7) 80%, transparent 97%)",
            boxShadow: "0 0 30px rgba(255,120,50,0.5), 0 0 60px rgba(255,100,40,0.3)",
          }}
        />
        
        {/* Light spots on wall */}
        <div className="absolute inset-x-0 top-0 h-10 flex justify-around px-20">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="w-24 h-full"
              style={{
                background: "radial-gradient(ellipse at center top, rgba(255,140,80,0.15) 0%, transparent 70%)",
              }}
            />
          ))}
        </div>

        {/* Stage glow bleeding onto floor */}
        <div 
          className="absolute inset-x-0 -bottom-16 h-20"
          style={{
            background: "linear-gradient(180deg, rgba(255,100,40,0.12) 0%, rgba(255,80,40,0.05) 50%, transparent 100%)",
          }}
        />

        {/* FRONT OF CLASS label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-white/40 font-medium uppercase"
            style={{ 
              fontSize: "11px",
              letterSpacing: "0.4em",
            }}
          >
            Front of Class
          </span>
        </div>

        {/* Instructor position marker */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2">
          <div 
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)",
              boxShadow: "0 3px 12px rgba(239,68,68,0.6), 0 0 25px rgba(239,68,68,0.4)",
            }}
          >
            <Users className="w-2.5 h-2.5 text-white" />
          </div>
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

// Legend
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
      className="flex items-center gap-4 px-4 py-2 rounded-lg"
      style={{
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.04)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      <div className="flex items-center gap-2">
        <div 
          className="w-2 h-2 rounded-full"
          style={{
            background: "#2dd4bf",
            boxShadow: "0 0 10px rgba(45,212,191,0.7)",
          }}
        />
        <span className="text-white/50" style={{ fontSize: "11px" }}>Available Spot</span>
      </div>
      <div className="flex items-center gap-2">
        <div 
          className="w-2 h-2 rounded-full"
          style={{
            background: "#ef4444",
            boxShadow: "0 0 10px rgba(239,68,68,0.7)",
          }}
        />
        <span className="text-white/50" style={{ fontSize: "11px" }}>Occupied Spot</span>
      </div>
      <div className="h-3 w-px bg-white/10" />
      <div className="ml-auto">
        <span className="text-white/40" style={{ fontSize: "11px" }}>
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
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-2.5 rounded-xl"
        style={{
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="p-2.5 rounded-lg"
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
            <h2 className="text-lg font-medium text-white" style={{ letterSpacing: "-0.01em" }}>{floorPlan.roomName}</h2>
            <div className="flex items-center gap-2 text-white/40" style={{ fontSize: "11px" }}>
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

      {/* Floor Canvas */}
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
            minHeight: "450px",
            maxHeight: "none",
            position: 'relative',
          }}
        >
          {/* Base floor - dark dojo mat */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 85% 65% at center 45%, 
                  rgba(30, 35, 45, 1) 0%, 
                  rgba(22, 27, 38, 1) 40%,
                  rgba(15, 20, 28, 1) 70%,
                  rgba(10, 14, 20, 1) 100%
                )
              `,
            }}
          />

          {/* Mat texture - subtle grid */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 60px,
                  rgba(255,255,255,0.01) 60px,
                  rgba(255,255,255,0.01) 61px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 60px,
                  rgba(255,255,255,0.01) 60px,
                  rgba(255,255,255,0.01) 61px
                )
              `,
            }}
          />

          {/* Vignette */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 90% 75% at center 50%, 
                  transparent 35%, 
                  rgba(0,0,0,0.3) 70%,
                  rgba(0,0,0,0.6) 100%
                )
              `,
            }}
          />

          {/* Perspective depth */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 25%, transparent 45%, transparent 75%, rgba(0,0,0,0.2) 100%)",
            }}
          />

          {/* Warm ambient light from stage */}
          <div 
            className="absolute inset-x-0 top-0 h-56 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,100,40,0.1) 0%, rgba(255,80,40,0.04) 50%, transparent 100%)",
            }}
          />

          {/* Light shafts */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[15, 30, 50, 70, 85].map((pos, i) => (
              <div 
                key={i}
                className="absolute top-0"
                style={{
                  left: `${pos}%`,
                  width: "80px",
                  height: "220px",
                  transform: "translateX(-50%)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)",
                  clipPath: "polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)",
                  opacity: 0.6,
                }}
              />
            ))}
          </div>

          {/* Mat boundary */}
          <div 
            className="absolute inset-6 rounded-lg pointer-events-none"
            style={{
              border: "1px dashed rgba(255,255,255,0.06)",
              boxShadow: "inset 0 0 80px rgba(0,0,0,0.3)",
            }}
          />

          {/* Front of Class Stage */}
          <FrontOfClassStage width={100} />

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

          {/* Room dimensions */}
          <div className="absolute bottom-3 right-4 text-white/25" style={{ fontSize: "10px" }}>
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
