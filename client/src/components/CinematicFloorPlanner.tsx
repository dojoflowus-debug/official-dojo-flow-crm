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

// Premium 3D Kickboxing Bag Marker - Matching reference image EXACTLY
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
  const clampedX = Math.max(8, Math.min(92, spot.positionX));
  const clampedY = Math.max(18, Math.min(88, spot.positionY));

  // Glow ring color - teal/cyan for available, amber/orange for occupied (matching reference)
  const ringColor = isEmpty 
    ? "rgba(45, 212, 191, 0.7)" // teal/cyan for available
    : "rgba(255, 140, 60, 0.8)"; // amber/orange for occupied

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
      {/* Large elliptical floor glow ring - matching reference exactly */}
      <div 
        className={cn(
          "absolute rounded-full transition-all duration-500",
          isEmpty && (isKiosk || isLive) && "animate-pulse"
        )}
        style={{
          width: "120px",
          height: "40px",
          bottom: "0px",
          left: "50%",
          transform: "translateX(-50%)",
          background: `radial-gradient(ellipse 100% 100% at center, ${ringColor} 0%, ${ringColor}50 40%, ${ringColor}20 70%, transparent 100%)`,
          filter: "blur(12px)",
          opacity: 0.85,
        }}
      />

      {/* Ring outline - visible border like reference */}
      <div 
        className="absolute rounded-full"
        style={{
          width: "100px",
          height: "32px",
          bottom: "4px",
          left: "50%",
          transform: "translateX(-50%)",
          border: `1.5px solid ${isEmpty ? "rgba(45,212,191,0.5)" : "rgba(255,140,60,0.6)"}`,
          borderRadius: "50%",
          opacity: 0.8,
        }}
      />

      {/* Main spot container */}
      {isBag ? (
        // 3D Kickboxing Bag - Matching reference: wider trapezoidal shape with tapered base
        <div
          className={cn(
            "flex flex-col items-center justify-center transition-all duration-300",
            "group-hover:scale-105 group-hover:-translate-y-1",
            isSelected && "scale-105 -translate-y-1",
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
              top: "-14px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "24px",
              height: "20px",
              fontSize: "12px",
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
              width: "48px",
              height: "72px",
              clipPath: "polygon(5% 0%, 95% 0%, 85% 100%, 15% 100%)",
              background: "linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 20%, #1a1a1a 60%, #0d0d0d 100%)",
              boxShadow: `
                0 15px 40px rgba(0,0,0,0.8),
                0 8px 20px rgba(0,0,0,0.6)
              `,
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
                  height: "28px",
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
                    style={{ fontSize: "13px", letterSpacing: "0.05em", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
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
                    fontSize: "6px", 
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
                    fontSize: "6px", 
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
              width: "32px",
              height: "12px",
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
              bottom: "2px",
              width: "50px",
              height: "16px",
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
              bottom: "-24px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "11px",
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

// Front of Class Stage - Matching reference exactly
function FrontOfClassStage({ width }: { width: number }) {
  return (
    <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none">
      {/* Dark wall background */}
      <div 
        className="absolute inset-x-4 top-2 h-16 rounded-lg overflow-hidden"
        style={{
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
          className="absolute inset-x-0 top-0 h-1.5"
          style={{
            background: "linear-gradient(90deg, transparent 5%, rgba(255,120,40,0.8) 25%, rgba(255,160,80,0.9) 50%, rgba(255,120,40,0.8) 75%, transparent 95%)",
            boxShadow: "0 0 25px rgba(255,130,50,0.6), 0 0 50px rgba(255,100,40,0.4)",
          }}
        />
        
        {/* Light glow spots on wall */}
        <div className="absolute inset-x-0 top-0 h-8 flex justify-around px-16">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="w-20 h-full"
              style={{
                background: "radial-gradient(ellipse at center top, rgba(255,140,80,0.12) 0%, transparent 70%)",
              }}
            />
          ))}
        </div>

        {/* Stage glow bleeding onto floor */}
        <div 
          className="absolute inset-x-0 -bottom-12 h-16"
          style={{
            background: "linear-gradient(180deg, rgba(255,100,40,0.08) 0%, rgba(255,80,40,0.03) 50%, transparent 100%)",
          }}
        />

        {/* FRONT OF CLASS label - matching reference exactly */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-white/50 font-semibold uppercase"
            style={{ 
              fontSize: "13px",
              letterSpacing: "0.35em",
            }}
          >
            Front of Class
          </span>
        </div>

        {/* Instructor podium/marker - small rectangle below text */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1">
          <div 
            className="w-6 h-3 rounded-sm"
            style={{
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

// Legend - matching reference
function FloorLegend({ 
  templateType, 
  occupiedCount, 
  totalSpots 
}: { 
  templateType: string;
  occupiedCount: number;
  totalSpots: number;
}) {
  const availableCount = totalSpots - occupiedCount;
  
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
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const updateSpotMutation = trpc.floorPlans.updateSpotPosition.useMutation();
  const utils = trpc.useUtils();

  const handleModeChange = (mode: ViewMode) => {
    setCurrentMode(mode);
    onModeChange?.(mode);
  };

  const handleSpotClick = (spot: Spot) => {
    setSelectedSpot(spot.id);
    onSpotClick?.(spot);
  };

  const handleSpotDrag = async (spotId: number, deltaX: number, deltaY: number) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    const spot = floorPlan.spots.find(s => s.id === spotId);
    if (!spot) return;
    
    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;
    
    const newX = Math.max(5, Math.min(95, spot.positionX + deltaXPercent));
    const newY = Math.max(15, Math.min(90, spot.positionY + deltaYPercent));
    
    spot.positionX = newX;
    spot.positionY = newY;
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

  return (
    <div className="flex flex-col gap-3">
      {/* Header with mode switcher */}
      <div 
        className="flex items-center justify-between px-3 py-2 rounded-lg"
        style={{
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <span className="text-white/50" style={{ fontSize: "11px" }}>View</span>
        
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

      {/* Floor Canvas - matching reference with darker mat and perspective lines */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.04)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        <div 
          ref={containerRef}
          className="relative w-full"
          style={{
            aspectRatio: `${floorPlan.widthFeet || 40} / ${floorPlan.lengthFeet || 40}`,
            minHeight: "480px",
            maxHeight: "none",
            position: 'relative',
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

          {/* Mat texture - perspective grid lines converging toward front (matching reference) */}
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

          {/* Darker vignette - matching reference (darker corners) */}
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
            className="absolute inset-x-0 top-0 h-48 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,100,40,0.08) 0%, rgba(255,80,40,0.03) 50%, transparent 100%)",
            }}
          />

          {/* Mat boundary - subtle dashed border */}
          <div 
            className="absolute inset-4 rounded-lg pointer-events-none"
            style={{
              border: "1px dashed rgba(255,255,255,0.08)",
              boxShadow: "inset 0 0 60px rgba(0,0,0,0.25)",
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

          {/* Room dimensions - bottom right corner */}
          <div className="absolute bottom-3 right-4 text-white/30" style={{ fontSize: "11px" }}>
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
