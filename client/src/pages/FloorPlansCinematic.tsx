import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Grid3x3, Square, Users, Home, ChevronRight, Eye, ChevronDown, Package, Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ManagementLayout from '@/components/ManagementLayout';
import { Link } from "react-router-dom";
import { CinematicFloorPlanner } from "@/components/CinematicFloorPlanner";
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

const templateDescriptions = {
  kickboxing_bags: "Heavy bags arranged in rows for kickboxing classes",
  yoga_grid: "Mat grid layout (A1, A2, B1, B2...) for yoga and stretching",
  karate_lines: "Traditional lineup formation sorted by belt rank",
};

// Sidebar Room Card Component
function RoomCard({ 
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
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl cursor-pointer transition-all duration-200",
        "border",
        isSelected 
          ? "bg-white/10 border-white/30 shadow-lg" 
          : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15"
      )}
    >
      <div className="flex items-start gap-3">
        <div 
          className={cn(
            "p-2 rounded-lg",
            plan.templateType === "kickboxing_bags" && "bg-red-500/20",
            plan.templateType === "yoga_grid" && "bg-purple-500/20",
            plan.templateType === "karate_lines" && "bg-blue-500/20",
          )}
        >
          <Icon className={cn(
            "w-5 h-5",
            plan.templateType === "kickboxing_bags" && "text-red-400",
            plan.templateType === "yoga_grid" && "text-purple-400",
            plan.templateType === "karate_lines" && "text-blue-400",
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{plan.roomName}</h3>
          <p className="text-xs text-white/50 mt-0.5">{templateLabels[plan.templateType]}</p>
        </div>
        {isSelected && (
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Room stats */}
      <div className="mt-3 flex items-center gap-4 text-xs text-white/40">
        <span>📐 {plan.lengthFeet || "?"} ft × {plan.widthFeet || "?"} ft</span>
        <span>👥 {plan.maxCapacity} spots</span>
      </div>
      
      {/* Safety spacing */}
      <div className="mt-2 text-xs text-white/40">
        Safety Spacing: {plan.safetySpacingFeet} ft
      </div>
    </div>
  );
}

// Room Type Section Component
function RoomTypeSection({ 
  title, 
  icon: Icon, 
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
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-1.5 text-white/60 hover:text-white/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-white/40">({plans.length})</span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-200",
          isExpanded && "rotate-180"
        )} />
      </button>
      
      {isExpanded && (
        <div className="space-y-2">
          {plans.map((plan) => (
            <RoomCard
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

  const resetForm = () => {
    setRoomName("");
    setLengthFeet("");
    setWidthFeet("");
    setSafetySpacingFeet("3");
    setTemplateType("kickboxing_bags");
    setMatRotation("horizontal");
    setNotes("");
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
      {/* Left Sidebar - Room Selection */}
      <div 
        className="w-64 flex-shrink-0 border-r border-white/10 overflow-y-auto"
        style={{
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-white/60" />
              <span className="font-semibold text-white">Dashboard</span>
            </div>
            <ChevronDown className="w-4 h-4 text-white/40" />
          </div>
        </div>

        {/* Elevations Section */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-white/60">
            <Eye className="w-4 h-4" />
            <span className="text-sm">Elevations</span>
            <ChevronDown className="w-4 h-4 ml-auto" />
          </div>
        </div>

        {/* Room List */}
        <div className="p-4 space-y-4">
          <RoomTypeSection
            title="Kickboxing Room"
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
            title="Karate Lineup"
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
            title="Yoga Grid"
            icon={Grid3x3}
            plans={yogaPlans}
            selectedId={selectedPlan?.id || null}
            onSelect={setSelectedPlan}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isExpanded={expandedSections.yoga}
            onToggle={() => toggleSection("yoga")}
          />

          {/* Dance / Gymnastics placeholder */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 py-1.5 text-white/40">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Dance / Gymnastics</span>
            </div>
            <div className="px-2 py-3 text-xs text-white/30 text-center">
              0 / Active
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Floor Planner Canvas */}
      <div className="flex-1 overflow-y-auto p-6">
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
        ) : selectedPlan ? (
          <div className="flex items-center justify-center h-96 text-white/50">
            Loading floor plan...
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
