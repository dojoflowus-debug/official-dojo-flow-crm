import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Grid3x3, Square, Users } from "lucide-react";
import { toast } from "sonner";

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

export default function FloorPlanBuilder() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  // Form state
  const [roomName, setRoomName] = useState("");
  const [lengthFeet, setLengthFeet] = useState("");
  const [widthFeet, setWidthFeet] = useState("");
  const [safetySpacing, setSafetySpacing] = useState("3");
  const [templateType, setTemplateType] = useState<TemplateType>("kickboxing_bags");
  const [notes, setNotes] = useState("");

  // Queries
  const { data: floorPlans, isLoading, refetch } = trpc.floorPlans.list.useQuery();
  const { data: selectedPlan } = trpc.floorPlans.get.useQuery(
    { id: selectedPlanId! },
    { enabled: !!selectedPlanId }
  );

  // Mutations
  const createMutation = trpc.floorPlans.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Floor Plan Created",
        description: `${data.spotsGenerated} spots generated successfully`,
      });
      refetch();
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = trpc.floorPlans.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Floor Plan Deleted",
        description: "Floor plan and all spots removed",
      });
      refetch();
      setSelectedPlanId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setRoomName("");
    setLengthFeet("");
    setWidthFeet("");
    setSafetySpacing("3");
    setTemplateType("kickboxing_bags");
    setNotes("");
  };

  const handleCreate = () => {
    if (!roomName || !lengthFeet || !widthFeet) {
      toast({
        title: "Missing Information",
        description: "Please fill in room name and dimensions",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      roomName,
      lengthFeet: parseInt(lengthFeet),
      widthFeet: parseInt(widthFeet),
      safetySpacingFeet: parseInt(safetySpacing),
      templateType,
      notes: notes || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this floor plan?")) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Floor Plans</h1>
          <p className="text-muted-foreground mt-1">
            Manage room layouts and spot assignments for classes
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Floor Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Floor Plan</DialogTitle>
              <DialogDescription>
                Define a room layout and generate spot assignments automatically
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Room Name */}
              <div className="space-y-2">
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  placeholder="e.g., Main Dojo, Studio A"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>

              {/* Dimensions */}
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

              {/* Safety Spacing */}
              <div className="space-y-2">
                <Label htmlFor="spacing">Safety Spacing (feet)</Label>
                <Input
                  id="spacing"
                  type="number"
                  placeholder="3"
                  value={safetySpacing}
                  onChange={(e) => setSafetySpacing(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Minimum distance between spots for safety
                </p>
              </div>

              {/* Template Type */}
              <div className="space-y-2">
                <Label htmlFor="template">Layout Template</Label>
                <Select value={templateType} onValueChange={(value) => setTemplateType(value as TemplateType)}>
                  <SelectTrigger id="template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(templateLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {templateDescriptions[templateType]}
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional information about this room..."
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
      {!floorPlans || floorPlans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Grid3x3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Floor Plans Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first floor plan to start managing class capacity and spot assignments
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Floor Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {floorPlans.map((plan) => {
            const Icon = templateIcons[plan.templateType];
            return (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPlanId === plan.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{plan.roomName}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(plan.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{templateLabels[plan.templateType]}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dimensions:</span>
                      <span className="font-medium">
                        {plan.lengthFeet}' × {plan.widthFeet}'
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capacity:</span>
                      <span className="font-medium">{plan.maxCapacity} spots</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Safety Spacing:</span>
                      <span className="font-medium">{plan.safetySpacingFeet}'</span>
                    </div>
                    {plan.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-muted-foreground text-xs">{plan.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Selected Plan Details */}
      {selectedPlan && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Spot Layout Preview</CardTitle>
            <CardDescription>
              {selectedPlan.spots.length} spots generated for {selectedPlan.roomName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative bg-muted/20 rounded-lg p-8 min-h-[400px] border-2 border-dashed">
              {/* Render spots as positioned elements */}
              {selectedPlan.spots.map((spot) => (
                <div
                  key={spot.id}
                  className="absolute bg-primary/10 border-2 border-primary rounded-md flex items-center justify-center text-xs font-medium"
                  style={{
                    left: `${spot.positionX}%`,
                    top: `${spot.positionY}%`,
                    width: "60px",
                    height: "60px",
                    transform: "translate(-50%, -50%)",
                  }}
                  title={spot.spotLabel}
                >
                  {spot.spotNumber}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedPlan.spots.slice(0, 10).map((spot) => (
                <div
                  key={spot.id}
                  className="px-3 py-1 bg-muted rounded-full text-sm"
                >
                  {spot.spotLabel}
                </div>
              ))}
              {selectedPlan.spots.length > 10 && (
                <div className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                  +{selectedPlan.spots.length - 10} more
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
