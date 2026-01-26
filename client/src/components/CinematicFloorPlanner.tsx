import React from "react";
import { Eye, Pencil, MonitorPlay, Tv, Settings, Users, Package, Grid3x3, ZoomIn, ZoomOut, Maximize2, Move, GripVertical, Upload, Image, X, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";
import { LayoutControls } from "./LayoutControls";
import { generateLayout } from "@/lib/layoutGenerator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { WaveMasterBag } from "./WaveMasterBag";
import { 
  WAVEMASTER_XXL, 
  isValidPosition, 
  clampToValidBounds,
  getSafetyZoneRadiusPercent 
} from "@/lib/equipmentProfiles";

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
  showSafetyZone = false,
  safetyZoneRadiusX = 0,
  safetyZoneRadiusY = 0,
  hasCollision = false,
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
  showSafetyZone?: boolean;
  safetyZoneRadiusX?: number;
  safetyZoneRadiusY?: number;
  hasCollision?: boolean;
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

  // Calculate depth-based adjustments - FINAL REALISM PASS
  const depthFactor = 1 - (spot.positionY / 100) * 0.15; // Micro size falloff on distant rows
  const depthScale = bagScale * depthFactor;
  const depthOpacity = 0.88 + (1 - spot.positionY / 100) * 0.12; // Front brighter, back slightly softer
  const depthBlur = (spot.positionY / 100) * 0.4; // Slight blur on distant bags

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isDraggable && isDesign) {
      e.preventDefault();
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      onDragStart(spot.id, e as any);
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
      onPointerDown={handlePointerDown}
    >
      {/* Safety Zone Indicator - shows clearance area in design mode */}
      {showSafetyZone && isDesign && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: `${safetyZoneRadiusX * 2}%`,
            height: `${safetyZoneRadiusY * 2}%`,
            minWidth: '150px',
            minHeight: '150px',
            border: hasCollision 
              ? '2px dashed rgba(239, 68, 68, 0.6)' 
              : '1px dashed rgba(100, 200, 180, 0.3)',
            background: hasCollision
              ? 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.1) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at center, rgba(100, 200, 180, 0.05) 0%, transparent 70%)',
            transition: 'all 0.15s ease-out',
          }}
        />
      )}

      {/* FINAL REALISM - Controlled floor reflection under bags */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 rounded-full",
          !isDragging && (isKiosk || isLive) && isEmpty && "animate-pulse"
        )}
        style={{
          width: `${135 * depthScale}px`,
          height: `${48 * depthScale}px`,
          bottom: `${-10 * depthScale}px`,
          background: `radial-gradient(ellipse at center, ${ringColor} 0%, ${ringColor.replace(/[\d.]+\)$/, '0.3)')} 45%, transparent 70%)`,
          boxShadow: `0 0 ${35 * depthScale}px ${ringColor.replace(/[\d.]+\)$/, '0.4)')}`,
          border: `1px solid ${ringColor.replace(/[\d.]+\)$/, '0.25)')}`,
          transform: isDragging ? "scale(1.15)" : "scale(1)",
          transition: "transform 0.15s ease-out",
          filter: `blur(${depthBlur}px)`,
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
        // PHOTOREALISTIC SVG WAVEMASTER BAG
        <svg 
          width={48 * depthScale} 
          height={170 * depthScale} 
          viewBox="0 0 48 170" 
          className="relative"
          style={{ filter: `blur(${depthBlur * 0.5}px)` }}
        >
          <WaveMasterBag 
            x={24} 
            y={20} 
            scale={depthScale} 
            isOccupied={!isEmpty} 
            studentInitials={initials} 
            spotNumber={spot.spotNumber} 
            isSelected={isSelected} 
            isDragging={isDragging}
          />
        </svg>
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

export function CinematicFloorPlanner({
  floorPlan,
  assignedStudents = [],
  onSpotClick,
  onModeChange,
  initialMode = "design",
  zones = [],
  showModeSwitch = true,
}: CinematicFloorPlannerProps) {
  const [mode, setMode] = React.useState<ViewMode>(initialMode);
  const [selectedSpot, setSelectedSpot] = React.useState<Spot | null>(null);
  const [draggedSpot, setDraggedSpot] = React.useState<number | null>(null);
  const [spots, setSpots] = React.useState<Spot[]>(floorPlan.spots);

  // Sync spots state when floorPlan changes (e.g., after refetch)
  React.useEffect(() => {
    setSpots(floorPlan.spots);
  }, [floorPlan.spots]);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(100);
  const [panMode, setPanMode] = React.useState(false);
  const [snapToGrid, setSnapToGrid] = React.useState(false);
  const [collisionDetected, setCollisionDetected] = React.useState(false);
  const [panOffset, setPanOffset] = React.useState({ x: 0, y: 0 });
  const [showBackgroundUpload, setShowBackgroundUpload] = React.useState(false);
  const [backgroundOpacity, setBackgroundOpacity] = React.useState(floorPlan.backgroundOpacity ?? 30);
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });

  // Mutations
  const updateSpotPosition = trpc.floorPlans.updateSpotPosition.useMutation();
  const uploadBackgroundImage = trpc.floorPlans.uploadBackgroundImage.useMutation();
  const updateBackgroundOpacity = trpc.floorPlans.updateBackgroundOpacity.useMutation();

  const handleModeChange = (newMode: ViewMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
  };

  const handleSpotClick = (spot: Spot) => {
    setSelectedSpot(spot);
    onSpotClick?.(spot);
  };

  const handleDragStart = (spotId: number, e: React.MouseEvent) => {
    if (mode !== "design") return;
    
    // Use spots state for current position
    const spot = spots.find(s => s.id === spotId);
    if (!spot) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    setDraggedSpot(spotId);
    setDragOffset({
      x: e.clientX - (canvasRect.left + (canvasRect.width * spot.positionX) / 100),
      y: e.clientY - (canvasRect.top + (canvasRect.height * spot.positionY) / 100),
    });
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (draggedSpot === null || mode !== "design") return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const x = ((e.clientX - canvasRect.left - dragOffset.x) / canvasRect.width) * 100;
    const y = ((e.clientY - canvasRect.top - dragOffset.y) / canvasRect.height) * 100;

    // Get room dimensions
    const roomWidthFt = floorPlan.widthFeet || 30;
    const roomDepthFt = floorPlan.lengthFeet || 30;

    // Apply physics-based clamping to keep within valid bounds
    let clamped = clampToValidBounds(x, y, roomWidthFt, roomDepthFt, WAVEMASTER_XXL);
    let finalX = clamped.x;
    let finalY = clamped.y;

    // Apply snap-to-grid if enabled
    if (snapToGrid) {
      const gridSize = 10; // Snap to 10% grid
      finalX = Math.round(finalX / gridSize) * gridSize;
      finalY = Math.round(finalY / gridSize) * gridSize;
      // Re-clamp after snapping
      clamped = clampToValidBounds(finalX, finalY, roomWidthFt, roomDepthFt, WAVEMASTER_XXL);
      finalX = clamped.x;
      finalY = clamped.y;
    }

    // Check collision with other spots
    const otherPositions = spots
      .filter(s => s.id !== draggedSpot)
      .map(s => ({ x: s.positionX, y: s.positionY }));
    
    const draggedIndex = spots.findIndex(s => s.id === draggedSpot);
    const validation = isValidPosition(
      finalX, 
      finalY, 
      roomWidthFt, 
      roomDepthFt, 
      WAVEMASTER_XXL, 
      otherPositions,
      -1 // No exclusion needed since we already filtered
    );

    // If collision detected, show visual feedback but still allow movement
    // (The bag will show collision state visually)
    setCollisionDetected(!validation.valid && validation.collisionWith !== undefined);

    // Update local state for immediate visual feedback
    setSpots(prevSpots =>
      prevSpots.map(spot =>
        spot.id === draggedSpot
          ? { ...spot, positionX: finalX, positionY: finalY }
          : spot
      )
    );
  };

  const handleDragEnd = async (spotId: number) => {
    if (mode !== "design") return;

    // Use spots state (which has the updated position) instead of floorPlan.spots
    const spot = spots.find(s => s.id === spotId);
    if (!spot) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    try {
      await updateSpotPosition.mutateAsync({
        spotId,
        positionX: spot.positionX,
        positionY: spot.positionY,
      });
      toast.success("✓ Bag position saved", {
        description: `Bag #${spotId} saved at (${Math.round(spot.positionX)}%, ${Math.round(spot.positionY)}%)`,
      });
    } catch (error) {
      toast.error("Failed to save bag position");
    }

    setDraggedSpot(null);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(300, prev + 25));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(50, prev - 25));
  };

  const handleFitToView = () => {
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (draggedSpot === null && panMode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (draggedSpot !== null) {
      e.preventDefault();
      handleDrag(e as any);
      return;
    }

    if (!isPanning || !panMode) return;

    const deltaX = e.clientX - panStart.x;
    const deltaY = e.clientY - panStart.y;

    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));

    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasPointerUp = () => {
    setIsPanning(false);
    if (draggedSpot !== null) {
      handleDragEnd(draggedSpot);
    }
  };

  const handleBackgroundUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();

      await uploadBackgroundImage.mutateAsync({
        floorPlanId: floorPlan.id,
        imageUrl: url,
      });

      toast.success("Background image uploaded");
    } catch (error) {
      toast.error("Failed to upload background image");
    }
  };

  const handleRemoveBackground = async () => {
    try {
      await uploadBackgroundImage.mutateAsync({
        floorPlanId: floorPlan.id,
        imageUrl: null,
      });
      toast.success("Background image removed");
    } catch (error) {
      toast.error("Failed to remove background image");
    }
  };

  const assignmentMap = new Map(
    assignedStudents.map(s => [s.spotId, s])
  );

  const isDesign = mode === "design";
  const isKiosk = mode === "kiosk";
  const isLive = mode === "live";
  const isWall = mode === "wall";

  // Calculate canvas dimensions
  const rows = Math.ceil(spots.length / 7);
  const canvasHeight = rows * 140;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{floorPlan.roomName}</h2>
          {showModeSwitch && (
            <div className="flex gap-2">
              {(Object.entries(MODE_CONFIG) as [ViewMode, typeof MODE_CONFIG[ViewMode]][]).map(
                ([modeKey, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={modeKey}
                      onClick={() => handleModeChange(modeKey)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                        mode === modeKey
                          ? "bg-amber-600/40 text-amber-200 border border-amber-500/30"
                          : "bg-slate-800/40 text-slate-400 hover:bg-slate-700/40"
                      )}
                      title={config.description}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{config.label}</span>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDesign && (
            <button
              onClick={() => setShowBackgroundUpload(!showBackgroundUpload)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-700/40 transition-all"
              title="Upload background image"
            >
              <Image className="w-4 h-4" />
              <span className="text-sm">Background</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-800/40 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-slate-700/40 rounded transition-all"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm px-2 min-w-12 text-center">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-slate-700/40 rounded transition-all"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleFitToView}
              className="p-2 hover:bg-slate-700/40 rounded transition-all"
              title="Fit to view"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setPanMode(!panMode)}
            className={cn(
              "p-2 rounded transition-all",
              panMode
                ? "bg-amber-600/40 text-amber-200"
                : "bg-slate-800/40 hover:bg-slate-700/40"
            )}
            title="Pan mode"
          >
            <Move className="w-4 h-4" />
          </button>

          {isDesign && (
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={cn(
                "p-2 rounded transition-all",
                snapToGrid
                  ? "bg-green-600/40 text-green-200"
                  : "bg-slate-800/40 hover:bg-slate-700/40"
              )}
              title="Snap to grid (10% increments)"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Background Upload Panel */}
      {showBackgroundUpload && isDesign && (
        <div className="p-4 border-b border-slate-800 bg-slate-800/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Room Background</h3>
            <button
              onClick={() => setShowBackgroundUpload(false)}
              className="p-1 hover:bg-slate-700/40 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!floorPlan.backgroundImageUrl ? (
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBackgroundUpload(file);
                }}
                className="hidden"
              />
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-slate-500 transition-colors">
                <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-400">Click to upload room photo</p>
              </div>
            </label>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Opacity</span>
                <span className="text-sm font-semibold">{backgroundOpacity}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                value={backgroundOpacity}
                onChange={(e) => {
                  const newOpacity = parseInt(e.target.value);
                  setBackgroundOpacity(newOpacity);
                  updateBackgroundOpacity.mutate({
                    floorPlanId: floorPlan.id,
                    opacity: newOpacity,
                  });
                }}
                className="w-full"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBackgroundUpload(false)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-700/40 hover:bg-slate-600/40 transition-all text-sm"
                >
                  Done
                </button>
                <button
                  onClick={handleRemoveBackground}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-900/40 hover:bg-red-800/40 transition-all text-sm text-red-300"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Design Mode Banner */}
      {isDesign && (
        <div className="px-4 py-2 bg-teal-900/30 border-b border-teal-800/50 text-teal-200 text-sm flex items-center gap-2">
          <GripVertical className="w-4 h-4" />
          Drag bags to position them exactly where your hanging bags are located
        </div>
      )}

      {/* Canvas Container */}
      <div
        ref={canvasRef}
        className={cn(
          "flex-1 relative overflow-auto",
          panMode && "cursor-grab",
          isPanning && "cursor-grabbing"
        )}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerUp}
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -25 : 25;
            setZoom(prev => Math.max(50, Math.min(300, prev + delta)));
          }
        }}
        style={{
          maxHeight: "70vh",
        }}
      >
        {/* Canvas Content */}
        <div
          style={{
            transform: `scale(${zoom / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: "top left",
            transition: isPanning ? "none" : "transform 0.1s ease-out",
          }}
        >
          {/* Room Canvas */}
          <div
            className="relative mx-auto"
            style={{
              width: "100%",
              height: `${canvasHeight}px`,
              background: `linear-gradient(180deg, 
                #424038 0%,
                #3a3632 20%,
                #3a3632 80%,
                #2a2420 100%
              )`,
              backgroundImage: `
                radial-gradient(circle at 50% 0%, rgba(255,200,150,0.08) 0%, transparent 40%),
                radial-gradient(circle at 20% 30%, rgba(255,180,120,0.06) 0%, transparent 35%),
                radial-gradient(circle at 80% 30%, rgba(255,180,120,0.06) 0%, transparent 35%),
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 49px,
                  rgba(255,255,255,0.02) 49px,
                  rgba(255,255,255,0.02) 50px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 49px,
                  rgba(255,255,255,0.02) 49px,
                  rgba(255,255,255,0.02) 50px
                )
              `,
              boxShadow: `
                inset 0 0 80px rgba(0,0,0,0.6),
                inset 0 0 40px rgba(0,0,0,0.4)
              `,
              border: "2px dashed rgba(255,200,150,0.15)",
              overflow: "hidden",
            }}
          >
            {/* Background image if uploaded */}
            {floorPlan.backgroundImageUrl && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${floorPlan.backgroundImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  opacity: backgroundOpacity / 100,
                  zIndex: 0,
                }}
              />
            )}

            {/* Front of Class Stage */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "60px",
                background: "linear-gradient(180deg, #2a2420 0%, #3a3632 100%)",
                borderBottom: "2px solid rgba(255,180,120,0.2)",
                boxShadow: `
                  0 20px 40px rgba(255,180,120,0.1),
                  inset 0 -1px 0 rgba(255,255,255,0.05)
                `,
              }}
            >
              {/* Light strip */}
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  left: "10%",
                  right: "10%",
                  height: "1.5px",
                  background: "linear-gradient(90deg, transparent, rgba(255,200,150,0.4), transparent)",
                  boxShadow: "0 0 20px rgba(255,180,120,0.3)",
                }}
              />

              {/* Front of Class text */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "rgba(255,200,150,0.4)",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                }}
              >
                Front of Class
              </div>

              {/* Instructor podium marker */}
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "20px",
                  height: "12px",
                  background: "linear-gradient(180deg, rgba(220,38,38,0.4) 0%, rgba(153,27,27,0.4) 100%)",
                  borderRadius: "2px",
                  border: "1px solid rgba(220,38,38,0.3)",
                }}
              />
            </div>

            {/* Spot Markers - using spots state for real-time drag feedback */}
            {spots.map((spot) => {
              const assignment = assignmentMap.get(spot.id);
              const isHighlighted = selectedSpot?.id === spot.id;

              // Calculate safety zone radius for this spot
              const safetyZoneRadius = getSafetyZoneRadiusPercent(
                floorPlan.widthFeet || 30,
                floorPlan.lengthFeet || 30,
                WAVEMASTER_XXL
              );

              return (
                <DraggableSpotMarker
                  key={spot.id}
                  spot={spot}
                  assignment={assignment}
                  isHighlighted={isHighlighted}
                  isSelected={isHighlighted}
                  onClick={() => handleSpotClick(spot)}
                  mode={mode}
                  templateType={floorPlan.templateType}
                  scale={zoom / 100}
                  isDraggable={isDesign}
                  onDragStart={handleDragStart}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedSpot === spot.id}
                  showSafetyZone={isDesign && (draggedSpot === spot.id || snapToGrid)}
                  safetyZoneRadiusX={safetyZoneRadius.radiusX}
                  safetyZoneRadiusY={safetyZoneRadius.radiusY}
                  hasCollision={draggedSpot === spot.id && collisionDetected}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Layout Controls (Design Mode Only) */}
      {isDesign && (
        <LayoutControls
          floorPlan={floorPlan}
          onLayoutChange={() => {
            // Refetch floor plan data
          }}
        />
      )}

      {/* Legend */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(60, 180, 160, 0.6) 0%, transparent 70%)",
                }}
              />
              <span className="text-slate-400">Available Spot</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(255, 120, 50, 0.75) 0%, transparent 70%)",
                }}
              />
              <span className="text-slate-400">Occupied Spot</span>
            </div>
          </div>
          <div className="text-slate-500">
            {spots.length} spots • {assignedStudents.length} assigned
          </div>
        </div>
      </div>
    </div>
  );
}
