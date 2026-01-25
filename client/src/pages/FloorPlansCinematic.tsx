import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Grid3x3, Square, Users, ChevronRight, ChevronDown, Package } from "lucide-react";
import { toast } from "sonner";
import ManagementLayout from '@/components/ManagementLayout';
import { Link } from "react-router-dom";
import { CinematicFloorPlanner } from "@/components/CinematicFloorPlanner";
import { EquipmentSetupPanelV2 } from "@/components/EquipmentSetupPanelV2";
import { cn } from "@/lib/utils";

type TemplateType = "kickboxing_bags" | "yoga_grid" | "karate_lines";

interface FloorPlan {
  id: number;
  roomName: string;
  lengthFeet: number | null;
  widthFeet: number | null;
  squareFeet: number | null;
  safetySpacingFeet: number;
  templateType: TemplateType;
  matRotation: "horizontal" | "vertical" | null;
  maxCapacity: number;
  isActive: number;
  notes: string | null;
  bagsInstalled?: number;
  bagsOnHand?: number;
  defaultLayout?: string;
  createdAt: Date;
  updatedAt: Date;
}

const templateIcons = {
  kickboxing_bags: Package,
  yoga_grid: Grid3x3,
  karate_lines: Users,
};

const templateLabels = {
  kickboxing_bags: "Kickboxing Bags",
  yoga_grid: "Yoga Grid",
  karate_lines: "Karate Lines",
};

// Cinematic Control Rail - Room Item
function RoomItem({ 
  plan, 
  isSelected, 
  onClick,
  onEdit,
  onDelete,
}: { 
  plan: FloorPlan; 
  isSelected: boolean; 
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = templateIcons[plan.templateType] || Square;
  const spotCount = plan.maxCapacity || 0;
  
  return (
    <div
      onClick={onClick}
      title={plan.roomName}
      className={cn(
        "group relative flex items-center gap-2 py-2 px-2 cursor-pointer transition-all duration-150",
        "rounded-md",
        isSelected 
          ? "bg-white/[0.06]" 
          : "hover:bg-white/[0.03]"
      )}
    >
      {/* Active indicator - slim vertical accent */}
      <div 
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full transition-all duration-200",
          isSelected 
            ? "bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.4)]" 
            : "bg-transparent"
        )}
      />
      
      {/* Icon - small and refined */}
      <div 
        className={cn(
          "w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors",
          isSelected ? "bg-white/[0.08]" : "bg-white/[0.04]"
        )}
      >
        <Icon className={cn(
          "w-3 h-3",
          plan.templateType === "kickboxing_bags" && "text-red-400/70",
          plan.templateType === "yoga_grid" && "text-purple-400/70",
          plan.templateType === "karate_lines" && "text-blue-400/70",
        )} />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 pl-0.5">
        {/* Room name - smaller, medium weight, letter-spacing */}
        <div 
          className={cn(
            "text-[11px] font-medium tracking-wide truncate transition-colors leading-tight",
            isSelected ? "text-white/90" : "text-white/55 group-hover:text-white/70"
          )}
        >
          {plan.roomName}
        </div>
        
        {/* Template type - small, muted */}
        <div className="text-[9px] text-white/30 tracking-wider mt-0.5">
          {templateLabels[plan.templateType]}
        </div>
        
        {/* Meta - HUD style, very subtle */}
        <div className="flex items-center gap-2 mt-1 text-[8px] text-white/20 tracking-wider font-mono">
          <span>{plan.lengthFeet || "?"}×{plan.widthFeet || "?"} ft</span>
          <span className="text-white/10">•</span>
          <span>{spotCount} spots</span>
        </div>
      </div>
      
      {/* Action buttons - only on selected, very subtle */}
      {isSelected && (
        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
          >
            <Edit className="w-2.5 h-2.5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400/70 transition-colors"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// Cinematic Control Rail - Section Header
function SectionHeader({ 
  title, 
  icon: Icon, 
  count,
  isExpanded,
  onToggle,
}: { 
  title: string;
  icon: React.ElementType;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  if (count === 0) return null;
  
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-2 py-1.5 text-white/35 hover:text-white/50 transition-colors"
    >
      <div className="flex items-center gap-1.5">
        <Icon className="w-2.5 h-2.5" />
        <span className="text-[9px] font-semibold tracking-[0.15em] uppercase">{title}</span>
        <span className="text-[8px] text-white/20 font-mono">({count})</span>
      </div>
      <ChevronDown className={cn(
        "w-2.5 h-2.5 transition-transform duration-200",
        isExpanded && "rotate-180"
      )} />
    </button>
  );
}

// Room Type Section
function RoomTypeSection({ 
  title, 
  icon, 
  plans, 
  selectedId, 
  onSelect,
  onEdit,
  onDelete,
  isExpanded,
  onToggle,
}: { 
  title: string;
  icon: React.ElementType;
  plans: FloorPlan[];
  selectedId: number | null;
  onSelect: (plan: FloorPlan) => void;
  onEdit: (plan: FloorPlan) => void;
  onDelete: (plan: FloorPlan) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  if (plans.length === 0) return null;
  
  return (
    <div className="space-y-0.5">
      <SectionHeader
        title={title}
        icon={icon}
        count={plans.length}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      
      {isExpanded && (
        <div className="space-y-0.5 ml-1">
          {plans.map((plan) => (
            <RoomItem
              key={plan.id}
              plan={plan}
              isSelected={selectedId === plan.id}
              onClick={() => onSelect(plan)}
              onEdit={() => onEdit(plan)}
              onDelete={() => onDelete(plan)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FloorPlansCinematicContent() {
  const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    kickboxing: true,
    yoga: true,
    karate: true,
    dance: true,
  });

  // Form state
  const [roomName, setRoomName] = useState("");
  const [lengthFeet, setLengthFeet] = useState("");
  const [widthFeet, setWidthFeet] = useState("");
  const [safetySpacingFeet, setSafetySpacingFeet] = useState("3");
  const [templateType, setTemplateType] = useState<TemplateType>("kickboxing_bags");
  const [matRotation, setMatRotation] = useState<"horizontal" | "vertical">("horizontal");
  const [notes, setNotes] = useState("");
  const [bagsOnHand, setBagsOnHand] = useState(0);
  const [bagsInstalled, setBagsInstalled] = useState(0);
  const [defaultLayout, setDefaultLayout] = useState<string>("grid");

  const utils = trpc.useUtils();
  const { data: floorPlans, isLoading } = trpc.floorPlans.getAll.useQuery();
  const { data: floorPlanWithSpots } = trpc.floorPlans.getById.useQuery(
    { id: selectedPlan?.id || 0 },
    { enabled: !!selectedPlan }
  );

  const createMutation = trpc.floorPlans.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Floor plan "${data.roomName}" created successfully`);
      utils.floorPlans.getAll.invalidate();
      
      if (bagsInstalled > 0 && bagsInstalled <= bagsOnHand) {
        generateStationsMutation.mutate({
          floorPlanId: data.id,
          bagsInstalled,
          layout: defaultLayout as "grid" | "staggered" | "perimeter" | "wall",
        });
      }
      
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to create floor plan', { description: error.message });
    },
  });

  const updateMutation = trpc.floorPlans.update.useMutation({
    onSuccess: (data) => {
      toast.success(`Floor plan "${data.roomName}" updated`);
      utils.floorPlans.getAll.invalidate();
      if (selectedPlan) {
        utils.floorPlans.getById.invalidate({ id: selectedPlan.id });
      }
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to update floor plan', { description: error.message });
    },
  });

  const deleteMutation = trpc.floorPlans.delete.useMutation({
    onSuccess: () => {
      toast.success('Floor plan deleted');
      utils.floorPlans.getAll.invalidate();
      setSelectedPlan(null);
    },
    onError: (error) => {
      toast.error('Failed to delete floor plan', { description: error.message });
    },
  });

  const generateStationsMutation = trpc.floorPlans.generateStations.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated ${data.generatedCount} stations`);
      utils.floorPlans.getAll.invalidate();
      if (selectedPlan) {
        utils.floorPlans.getById.invalidate({ id: selectedPlan.id });
      }
    },
    onError: (error) => {
      toast.error('Failed to generate stations', { description: error.message });
    },
  });

  const resetForm = () => {
    setRoomName("");
    setLengthFeet("");
    setWidthFeet("");
    setSafetySpacingFeet("3");
    setTemplateType("kickboxing_bags");
    setMatRotation("horizontal");
    setNotes("");
    setBagsOnHand(0);
    setBagsInstalled(0);
    setDefaultLayout("grid");
  };

  const handleCreate = () => {
    if (!roomName.trim()) {
      toast.error("Room name is required");
      return;
    }

    createMutation.mutate({
      roomName: roomName.trim(),
      lengthFeet: lengthFeet ? parseFloat(lengthFeet) : 40,
      widthFeet: widthFeet ? parseFloat(widthFeet) : 30,
      safetySpacingFeet: parseFloat(safetySpacingFeet) || 3,
      templateType,
      matRotation,
      notes: notes.trim() || undefined,
      locationId: 1,
    });
  };

  const handleEdit = (plan: FloorPlan) => {
    setRoomName(plan.roomName);
    setLengthFeet(plan.lengthFeet?.toString() || "");
    setWidthFeet(plan.widthFeet?.toString() || "");
    setSafetySpacingFeet(plan.safetySpacingFeet.toString());
    setTemplateType(plan.templateType);
    setMatRotation(plan.matRotation || "horizontal");
    setNotes(plan.notes || "");
    setBagsOnHand(plan.bagsOnHand || 0);
    setBagsInstalled(plan.bagsInstalled || 0);
    setDefaultLayout(plan.defaultLayout || "grid");
    setSelectedPlan(plan);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedPlan) return;
    if (!roomName.trim()) {
      toast.error("Room name is required");
      return;
    }

    updateMutation.mutate({
      id: selectedPlan.id,
      roomName: roomName.trim(),
      lengthFeet: lengthFeet ? parseFloat(lengthFeet) : null,
      widthFeet: widthFeet ? parseFloat(widthFeet) : null,
      safetySpacingFeet: parseFloat(safetySpacingFeet),
      matRotation,
      notes: notes.trim() || null,
      bagsOnHand: templateType === 'kickboxing_bags' ? bagsOnHand : undefined,
      bagsInstalled: templateType === 'kickboxing_bags' ? bagsInstalled : undefined,
      defaultLayout: templateType === 'kickboxing_bags' ? defaultLayout : undefined,
    });
  };

  const handleDelete = (plan: FloorPlan) => {
    if (confirm(`Are you sure you want to delete "${plan.roomName}"?`)) {
      deleteMutation.mutate({ id: plan.id });
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Group floor plans by template type
  const kickboxingPlans = floorPlans?.filter(p => p.templateType === "kickboxing_bags") || [];
  const yogaPlans = floorPlans?.filter(p => p.templateType === "yoga_grid") || [];
  const karatePlans = floorPlans?.filter(p => p.templateType === "karate_lines") || [];

  // Auto-select first plan if none selected
  if (!selectedPlan && floorPlans && floorPlans.length > 0) {
    setSelectedPlan(floorPlans[0]);
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      {/* Left Control Rail - Cinematic Room Selector */}
      <div 
        className="w-48 flex-shrink-0 overflow-y-auto"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.35) 100%)",
          borderRight: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* Rail Header - minimal */}
        <div className="px-3 py-3 border-b border-white/[0.03]">
          <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/25">
            Studios
          </div>
        </div>

        {/* Room List - compact */}
        <div className="p-2 space-y-3">
          <RoomTypeSection
            title="Kickboxing"
            icon={Package}
            plans={kickboxingPlans}
            selectedId={selectedPlan?.id || null}
            onSelect={setSelectedPlan}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isExpanded={expandedSections.kickboxing}
            onToggle={() => toggleSection("kickboxing")}
          />

          <RoomTypeSection
            title="Karate"
            icon={Users}
            plans={karatePlans}
            selectedId={selectedPlan?.id || null}
            onSelect={setSelectedPlan}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isExpanded={expandedSections.karate}
            onToggle={() => toggleSection("karate")}
          />

          <RoomTypeSection
            title="Yoga"
            icon={Grid3x3}
            plans={yogaPlans}
            selectedId={selectedPlan?.id || null}
            onSelect={setSelectedPlan}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isExpanded={expandedSections.yoga}
            onToggle={() => toggleSection("yoga")}
          />

          {/* Dance placeholder - very subtle */}
          <div className="pt-2 border-t border-white/[0.03]">
            <div className="flex items-center gap-1.5 px-2 py-1 text-white/20">
              <Grid3x3 className="w-2.5 h-2.5" />
              <span className="text-[9px] font-semibold tracking-[0.15em] uppercase">Dance</span>
            </div>
            <div className="px-2 py-1.5 text-[8px] text-white/15 font-mono">
              0 active
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Floor Planner Canvas */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/50 mb-2">
              <Link to="/" className="hover:text-white/70 transition-colors">Dashboard</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Floor Plans</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Floor Plans</h1>
            <p className="text-white/50 mt-1">Manage room layouts and spot assignments</p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={resetForm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Floor Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl" style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.15)',
              border: '3px solid rgba(255,255,255,0.9)',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              background: 'rgba(0,0,0,0.92)',
              padding: '20px'
            }}>
              <DialogHeader className="pb-3 border-b border-white/10">
                <DialogTitle className="text-2xl font-bold text-white">Create Floor Plan</DialogTitle>
                <DialogDescription className="text-white/60">
                  Define a new room layout with spot assignments
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-white/90">Room Name *</Label>
                  <Input
                    placeholder="e.g., Main Dojo, Studio A"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Length (feet)</Label>
                    <Input
                      type="number"
                      placeholder="40"
                      value={lengthFeet}
                      onChange={(e) => setLengthFeet(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm">Width (feet)</Label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={widthFeet}
                      onChange={(e) => setWidthFeet(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/90">Safety Spacing (feet)</Label>
                  <Input
                    type="number"
                    placeholder="3"
                    value={safetySpacingFeet}
                    onChange={(e) => setSafetySpacingFeet(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/90">Layout Template *</Label>
                  <Select value={templateType} onValueChange={(v) => setTemplateType(v as TemplateType)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      {Object.entries(templateLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-white">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/90">Notes</Label>
                  <Textarea
                    placeholder="Additional information..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                {templateType === "kickboxing_bags" && (
                  <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <h3 className="text-white font-semibold">Equipment Setup</h3>
                    <div className="space-y-2">
                      <Label className="text-white/90">Bags On Hand (Inventory)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={bagsOnHand}
                        onChange={(e) => setBagsOnHand(parseInt(e.target.value) || 0)}
                        className="bg-white/5 border-white/10 text-white"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/90">Bags to Install in This Room</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={bagsInstalled}
                        onChange={(e) => setBagsInstalled(parseInt(e.target.value) || 0)}
                        className="bg-white/5 border-white/10 text-white"
                        min="0"
                      />
                      {bagsInstalled > bagsOnHand && bagsOnHand > 0 && (
                        <p className="text-red-400 text-sm">Cannot install more bags than available</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/90">Default Layout</Label>
                      <Select value={defaultLayout} onValueChange={setDefaultLayout}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10">
                          <SelectItem value="grid" className="text-white">Grid</SelectItem>
                          <SelectItem value="staggered" className="text-white">Staggered</SelectItem>
                          <SelectItem value="bag_wall" className="text-white">Wall</SelectItem>
                          <SelectItem value="perimeter" className="text-white">Perimeter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={() => {
                        if (bagsInstalled > 0 && bagsInstalled <= bagsOnHand) {
                          toast.info(`Stations will be generated with ${defaultLayout} layout after creating the floor plan`);
                        }
                      }}
                      disabled={bagsInstalled === 0 || bagsInstalled > bagsOnHand || createMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                      {createMutation.isPending ? "Generating..." : "Generate Stations"}
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-white/20 text-white hover:bg-white/10">
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-red-600 hover:bg-red-700">
                  {createMutation.isPending ? "Creating..." : "Create Floor Plan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Floor Planner Canvas */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
          </div>
        ) : floorPlanWithSpots ? (
          <CinematicFloorPlanner
            floorPlan={floorPlanWithSpots}
            showModeSwitch={true}
            onSpotClick={(spot) => {
              console.log("Spot clicked:", spot);
            }}
          />
        ) : selectedPlan && floorPlanWithSpots ? (
          <div className="flex-1 flex gap-6 min-h-0">
            <div className="flex-1 min-w-0">
              <CinematicFloorPlanner
                floorPlan={floorPlanWithSpots}
                showModeSwitch={true}
                onSpotClick={(spot) => {
                  console.log("Spot clicked:", spot);
                }}
              />
            </div>
            <div className="flex-shrink-0">
              <EquipmentSetupPanelV2
                templateType={selectedPlan.templateType}
                onGenerateStations={(count, layout) => {
                  toast.success(`Generated ${count} stations with ${layout} layout`);
                }}
                onSave={(bagsOnHand, bagsInstalled, layout) => {
                  toast.success(`Saved: ${bagsInstalled} bags installed`);
                }}
              />
            </div>
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center h-96 rounded-2xl"
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px dashed rgba(255,255,255,0.2)",
            }}
          >
            <Grid3x3 className="w-16 h-16 text-white/20 mb-4" />
            <h3 className="text-xl font-semibold text-white/60 mb-2">No Floor Plans Yet</h3>
            <p className="text-white/40 mb-6">Create your first floor plan to get started</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Floor Plan
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl" style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.15)',
          border: '3px solid rgba(255,255,255,0.9)',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          background: 'rgba(0,0,0,0.92)',
          padding: '20px'
        }}>
          <DialogHeader className="pb-3 border-b border-white/10">
            <DialogTitle className="text-2xl font-bold text-white">Edit Floor Plan</DialogTitle>
            <DialogDescription className="text-white/60">
              Update room layout settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/90">Room Name *</Label>
              <Input
                placeholder="e.g., Main Dojo, Studio A"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Length (feet)</Label>
                <Input
                  type="number"
                  placeholder="40"
                  value={lengthFeet}
                  onChange={(e) => setLengthFeet(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Width (feet)</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={widthFeet}
                  onChange={(e) => setWidthFeet(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/90">Safety Spacing (feet)</Label>
              <Input
                type="number"
                placeholder="3"
                value={safetySpacingFeet}
                onChange={(e) => setSafetySpacingFeet(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/90">Notes</Label>
              <Textarea
                placeholder="Additional information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="bg-red-600 hover:bg-red-700">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FloorPlansCinematic() {
  return (
    <ManagementLayout>
      <FloorPlansCinematicContent />
    </ManagementLayout>
  );
}
