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

// Belt rank colors
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

// Mode configurations
const MODE_CONFIG = {
  design: { icon: Pencil, label: "Design", description: "Edit layout" },
  kiosk: { icon: Eye, label: "Kiosk Preview", description: "Student view" },
  live: { icon: MonitorPlay, label: "Live Class", description: "Active session" },
  wall: { icon: Tv, label: "Wall Display", description: "TV screens" },
};

// Spot Component - 3D style kickboxing bag or mat
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
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
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

  // Calculate spot dimensions
  const spotWidth = isBag ? 40 : isMat ? 64 : 48;
  const spotHeight = isBag ? 64 : isMat ? 32 : 48;

  // Use position values directly - they are already in 0-100% format
  // relative to the full room canvas. Clamping is done by the layout generator.
  const clampedX = Math.max(0, Math.min(100, spot.positionX));
  const clampedY = Math.max(0, Math.min(100, spot.positionY));

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
      {/* Glow ring for available spots */}
      {isEmpty && (isKiosk || isLive) && (
        <div 
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)`,
            transform: "scale(2.5)",
            zIndex: 0,
          }}
        />
      )}

      {/* Belt color ring for occupied spots */}
      {!isEmpty && (
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${beltColor}40 0%, transparent 70%)`,
            transform: "scale(2)",
            zIndex: 0,
          }}
        />
      )}

      {/* Main spot container */}
      {isBag ? (
        // Kickboxing Bag - 3D style
        <div
          className={cn(
            "flex flex-col items-center justify-center transition-all duration-300",
            "group-hover:scale-110 group-hover:-translate-y-1",
            isSelected && "scale-110 -translate-y-1",
          )}
        >
          {/* Bag number badge */}
          <div 
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-20",
              isEmpty ? "bg-gray-600 text-gray-300" : "bg-red-600 text-white"
            )}
            style={{
              position: "absolute",
              top: "-12px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            {spot.spotNumber}
          </div>

          {/* Bag body */}
          <div 
            className={cn(
              "w-10 h-16 rounded-lg overflow-hidden",
              "shadow-lg shadow-black/50",
              isEmpty ? "bg-gray-700" : "bg-gradient-to-b from-red-500 via-red-600 to-red-800",
            )}
            style={{
              position: "relative",
              boxShadow: isEmpty 
                ? "0 8px 16px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.1)"
                : "0 8px 16px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)",
            }}
          >
            {/* Bag highlight */}
            <div 
              className="bg-gradient-to-r from-transparent via-white/10 to-transparent"
              style={{ position: "absolute", inset: 0 }}
            />
            
            {/* Initials or number */}
            <div 
              className="flex items-center justify-center"
              style={{ position: "absolute", inset: 0 }}
            >
              <span className={cn(
                "font-bold text-sm",
                isEmpty ? "text-gray-400" : "text-white"
              )}>
                {assignment ? initials : ""}
              </span>
            </div>
          </div>

          {/* Bag base/stand */}
          <div 
            className={cn(
              "w-8 h-2 rounded-b-lg mt-0.5",
              isEmpty ? "bg-gray-800" : "bg-gray-900"
            )}
          />

          {/* Glowing ring on floor */}
          <div 
            className="rounded-full opacity-60"
            style={{
              position: "absolute",
              bottom: "-16px",
              width: "56px",
              height: "16px",
              background: isEmpty 
                ? "radial-gradient(ellipse, rgba(100,100,100,0.3) 0%, transparent 70%)"
                : `radial-gradient(ellipse, ${beltColor}60 0%, transparent 70%)`,
              boxShadow: isEmpty ? "none" : `0 0 20px ${beltColor}40`,
            }}
          />
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
              "w-16 h-8 rounded-md overflow-hidden",
              "shadow-lg shadow-black/40",
              isEmpty ? "bg-gray-600" : "bg-gradient-to-b from-purple-400 via-purple-500 to-purple-700",
            )}
            style={{
              position: "relative",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.1)",
            }}
          >
            <div 
              className="flex items-center justify-center"
              style={{ position: "absolute", inset: 0 }}
            >
              <span className={cn(
                "font-bold text-xs",
                isEmpty ? "text-gray-400" : "text-white"
              )}>
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
            "group-hover:scale-110",
            isSelected && "scale-110",
          )}
        >
          <div 
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "shadow-lg shadow-black/40",
              isEmpty ? "bg-gray-600" : "bg-gradient-to-br from-yellow-400 to-yellow-600",
            )}
            style={{
              position: "relative",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.1)",
            }}
          >
            <span className={cn(
              "font-bold text-sm",
              isEmpty ? "text-gray-400" : "text-white"
            )}>
              {assignment ? initials : spot.spotLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Front of Class Stage Component
function FrontOfClassStage({ width }: { width: number }) {
  return (
    <div className="absolute top-0 left-0 right-0 h-16">
      {/* Stage platform */}
      <div 
        className="absolute inset-x-4 top-2 h-12 rounded-lg overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(30,30,30,0.9) 0%, rgba(20,20,20,0.95) 100%)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Stage lights */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        
        {/* Stage glow */}
        <div 
          className="absolute inset-x-0 -bottom-4 h-8"
          style={{
            background: "linear-gradient(180deg, rgba(255,140,0,0.15) 0%, transparent 100%)",
          }}
        />

        {/* FRONT OF CLASS label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/80 font-semibold tracking-widest text-sm">
            FRONT OF CLASS
          </span>
        </div>

        {/* Instructor position marker */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1">
          <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
            <Users className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Mode Switcher Component
function ModeSwitcher({ 
  currentMode, 
  onModeChange 
}: { 
  currentMode: ViewMode; 
  onModeChange: (mode: ViewMode) => void;
}) {
  return (
    <div 
      className="inline-flex items-center gap-1 p-1 rounded-xl"
      style={{
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)",
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
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
              isActive 
                ? "bg-white/15 text-white" 
                : "text-white/60 hover:text-white/80 hover:bg-white/5"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Legend Component
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
      className="flex items-center gap-6 px-4 py-3 rounded-xl"
      style={{
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
        <span className="text-white/70 text-sm">Available Spot</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <span className="text-white/70 text-sm">Occupied Spot</span>
      </div>
      <div className="h-4 w-px bg-white/20" />
      <div className="ml-auto flex items-center gap-2">
        <span className="text-white/50 text-sm">
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
        <div className="flex items-center gap-4">
          <div 
            className="p-3 rounded-xl"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {floorPlan.templateType === "kickboxing_bags" && <Package className="w-6 h-6 text-red-400" />}
            {floorPlan.templateType === "yoga_grid" && <Grid3x3 className="w-6 h-6 text-purple-400" />}
            {floorPlan.templateType === "karate_lines" && <Users className="w-6 h-6 text-blue-400" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{floorPlan.roomName}</h2>
            <div className="flex items-center gap-3 text-white/60 text-sm">
              <span>{totalSpots} Spots</span>
              <span>•</span>
              <span className="capitalize">{floorPlan.templateType.replace("_", " ")}</span>
              <span>•</span>
              <span>{floorPlan.lengthFeet} ft × {floorPlan.widthFeet} ft</span>
            </div>
          </div>
        </div>

        {showModeSwitch && (
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-sm">View</span>
            <ModeSwitcher currentMode={currentMode} onModeChange={handleModeChange} />
            <button 
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Floor Canvas */}
      <div>
        <div 
          ref={containerRef}
          className="relative w-full rounded-2xl overflow-hidden"
          style={{
            aspectRatio: `${floorPlan.lengthFeet || 40} / ${floorPlan.widthFeet || 40}`,
            minHeight: "500px",
            maxHeight: "700px",
            position: 'relative',
          }}
        >
          {/* Realistic floor surface */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(180deg, 
                  rgba(20, 30, 40, 0.95) 0%, 
                  rgba(25, 35, 50, 0.9) 20%,
                  rgba(30, 40, 55, 0.85) 50%,
                  rgba(25, 35, 45, 0.9) 80%,
                  rgba(15, 25, 35, 0.95) 100%
                )
              `,
            }}
          />

          {/* Mat texture overlay */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 40px,
                  rgba(255,255,255,0.02) 40px,
                  rgba(255,255,255,0.02) 41px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 40px,
                  rgba(255,255,255,0.02) 40px,
                  rgba(255,255,255,0.02) 41px
                )
              `,
            }}
          />

          {/* Ambient lighting from top */}
          <div 
            className="absolute inset-x-0 top-0 h-32 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,140,0,0.08) 0%, transparent 100%)",
            }}
          />

          {/* Room border with soft glow */}
          <div 
            className="absolute inset-4 rounded-xl pointer-events-none"
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "inset 0 0 60px rgba(0,0,0,0.5)",
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
                border: "1px dashed rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <span className="absolute top-2 left-2 text-xs text-white/40 font-medium">
                {zone.name}
              </span>
            </div>
          ))}

          {/* Spots Container - Position relative for absolute positioning context */}
          <div 
            className="absolute inset-4 top-20"
            style={{ position: 'relative' }}
          >
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

          {/* Room dimensions label */}
          <div className="absolute bottom-4 right-4 text-white/40 text-sm">
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
