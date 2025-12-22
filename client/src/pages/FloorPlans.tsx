import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Grid3x3, Square, Users, Home, ChevronRight, Eye } from "lucide-react";
import { toast } from "sonner";
import BottomNavLayout from "@/components/BottomNavLayout";
import { Link } from "react-router-dom";
import { FloorPlanViewer } from "@/components/FloorPlanViewer";

type TemplateType = "kickboxing_bags" | "yoga_grid" | "karate_lines";

interface FloorPlan {
  id: number;
  roomName: string;
  lengthFeet: number | null;
  widthFeet: number | null;
  squareFeet: number | null;
  safetySpacingFeet: number;
  templateType: TemplateType;
  maxCapacity: number;
  isActive: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const templateIcons = {
  kickboxing_bags: Square,
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

function FloorPlansContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingPlan, setViewingPlan] = useState<FloorPlan | null>(null);

  // Form state
  const [roomName, setRoomName] = useState("");
  const [lengthFeet, setLengthFeet] = useState("");
  const [widthFeet, setWidthFeet] = useState("");
  const [safetySpacingFeet, setSafetySpacingFeet] = useState("3");
  const [templateType, setTemplateType] = useState<TemplateType>("kickboxing_bags");
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();
  const { data: floorPlans, isLoading } = trpc.floorPlans.getAll.useQuery();
  const { data: floorPlanWithSpots, isLoading: isLoadingSpots } = trpc.floorPlans.get.useQuery(
    { id: viewingPlan?.id || 0 },
    { enabled: !!viewingPlan }
  );
  const createMutation = trpc.floorPlans.create.useMutation({
    onSuccess: () => {
      toast.success("Floor plan created successfully");
      utils.floorPlans.getAll.invalidate();
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to create floor plan: ${error.message}`);
    },
  });

  const updateMutation = trpc.floorPlans.update.useMutation({
    onSuccess: () => {
      toast.success("Floor plan updated successfully");
      utils.floorPlans.getAll.invalidate();
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update floor plan: ${error.message}`);
    },
  });

  const deleteMutation = trpc.floorPlans.delete.useMutation({
    onSuccess: () => {
      toast.success("Floor plan deleted successfully");
      utils.floorPlans.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete floor plan: ${error.message}`);
    },
  });

  const resetForm = () => {
    setRoomName("");
    setLengthFeet("");
    setWidthFeet("");
    setSafetySpacingFeet("3");
    setTemplateType("kickboxing_bags");
    setNotes("");
    setSelectedPlanId(null);
  };

  const handleCreate = () => {
    if (!roomName.trim()) {
      toast.error("Room name is required");
      return;
    }

    const length = lengthFeet ? parseFloat(lengthFeet) : null;
    const width = widthFeet ? parseFloat(widthFeet) : null;

    createMutation.mutate({
      roomName: roomName.trim(),
      lengthFeet: length,
      widthFeet: width,
      safetySpacingFeet: parseFloat(safetySpacingFeet),
      templateType,
      notes: notes.trim() || null,
    });
  };

  const handleEdit = (plan: FloorPlan) => {
    setSelectedPlanId(plan.id);
    setRoomName(plan.roomName);
    setLengthFeet(plan.lengthFeet?.toString() || "");
    setWidthFeet(plan.widthFeet?.toString() || "");
    setSafetySpacingFeet(plan.safetySpacingFeet.toString());
    setTemplateType(plan.templateType);
    setNotes(plan.notes || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedPlanId) return;
    if (!roomName.trim()) {
      toast.error("Room name is required");
      return;
    }

    const length = lengthFeet ? parseFloat(lengthFeet) : null;
    const width = widthFeet ? parseFloat(widthFeet) : null;

    updateMutation.mutate({
      id: selectedPlanId,
      roomName: roomName.trim(),
      lengthFeet: length,
      widthFeet: width,
      safetySpacingFeet: parseFloat(safetySpacingFeet),
      templateType,
      notes: notes.trim() || null,
    });
  };

  const handleDelete = (id: number, roomName: string) => {
    if (confirm(`Are you sure you want to delete "${roomName}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Floor Plans</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Floor Plans</h1>
            <p className="text-muted-foreground mt-2">
              Manage room layouts and spot assignments for classes
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Floor Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Floor Plan</DialogTitle>
                <DialogDescription>
                  Define a new room layout with spot assignments
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Room Name *</Label>
                  <Input
                    id="roomName"
                    placeholder="e.g., Main Dojo, Studio A"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="length">Length (feet)</Label>
                    <Input
                      id="length"
                      type="number"
                      placeholder="40"
                      value={lengthFeet}
                      onChange={(e) => setLengthFeet(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (feet)</Label>
                    <Input
                      id="width"
                      type="number"
                      placeholder="30"
                      value={widthFeet}
                      onChange={(e) => setWidthFeet(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spacing">Safety Spacing (feet)</Label>
                  <Input
                    id="spacing"
                    type="number"
                    placeholder="3"
                    value={safetySpacingFeet}
                    onChange={(e) => setSafetySpacingFeet(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum distance between spots for safety
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template">Layout Template *</Label>
                  <Select value={templateType} onValueChange={(v) => setTemplateType(v as TemplateType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(templateLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {templateLabels[key as TemplateType]}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {templateDescriptions[templateType]}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional information about this floor plan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Floor Plan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Floor Plans Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading floor plans...
          </div>
        ) : !floorPlans || floorPlans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Grid3x3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No floor plans yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first floor plan to start managing class layouts and spot assignments
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Floor Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {floorPlans.map((plan) => {
              const Icon = templateIcons[plan.templateType];
              return (
                <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{plan.roomName}</CardTitle>
                          <CardDescription>
                            {templateLabels[plan.templateType]}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setViewingPlan(plan);
                            setIsViewDialogOpen(true);
                          }}
                          title="View floor plan"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(plan.id, plan.roomName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Capacity:</span>
                        <span className="font-semibold">{plan.maxCapacity} spots</span>
                      </div>
                      {plan.lengthFeet && plan.widthFeet && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dimensions:</span>
                          <span>{plan.lengthFeet}' × {plan.widthFeet}'</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Safety Spacing:</span>
                        <span>{plan.safetySpacingFeet} feet</span>
                      </div>
                      {plan.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">{plan.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Floor Plan</DialogTitle>
              <DialogDescription>
                Update room layout and spot configuration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-roomName">Room Name *</Label>
                <Input
                  id="edit-roomName"
                  placeholder="e.g., Main Dojo, Studio A"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-length">Length (feet)</Label>
                  <Input
                    id="edit-length"
                    type="number"
                    placeholder="40"
                    value={lengthFeet}
                    onChange={(e) => setLengthFeet(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-width">Width (feet)</Label>
                  <Input
                    id="edit-width"
                    type="number"
                    placeholder="30"
                    value={widthFeet}
                    onChange={(e) => setWidthFeet(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-spacing">Safety Spacing (feet)</Label>
                <Input
                  id="edit-spacing"
                  type="number"
                  placeholder="3"
                  value={safetySpacingFeet}
                  onChange={(e) => setSafetySpacingFeet(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-template">Layout Template *</Label>
                <Select value={templateType} onValueChange={(v) => setTemplateType(v as TemplateType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(templateLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Additional information..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Floor Plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Floor Plan Viewer</DialogTitle>
              <DialogDescription>
                Visual layout showing all spot positions
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {isLoadingSpots ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading floor plan...
                </div>
              ) : floorPlanWithSpots ? (
                <FloorPlanViewer floorPlan={floorPlanWithSpots} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Floor plan not found
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function FloorPlans() {
  return (
    <BottomNavLayout>
      <FloorPlansContent />
    </BottomNavLayout>
  );
}
