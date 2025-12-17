import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: any;
  onSuccess?: () => void;
}

export function ProgramModal({ open, onOpenChange, program, onSuccess }: ProgramModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    termLength: 12,
    eligibility: "open" as "open" | "invitation_only",
    ageRange: "",
    showOnKiosk: 1,
  });

  const utils = trpc.useUtils();
  const createMutation = trpc.billing.createProgram.useMutation({
    onSuccess: () => {
      toast.success("Program created successfully");
      utils.billing.getPrograms.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to create program: ${error.message}`);
    },
  });

  const updateMutation = trpc.billing.updateProgram.useMutation({
    onSuccess: () => {
      toast.success("Program updated successfully");
      utils.billing.getPrograms.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to update program: ${error.message}`);
    },
  });

  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name || "",
        description: program.description || "",
        termLength: program.termLength || 12,
        eligibility: program.eligibility || "open",
        ageRange: program.ageRange || "",
        showOnKiosk: program.showOnKiosk ?? 1,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        termLength: 12,
        eligibility: "open",
        ageRange: "",
        showOnKiosk: 1,
      });
    }
  }, [program, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (program) {
      updateMutation.mutate({ id: program.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{program ? "Edit Program" : "Create New Program"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Program Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Kids Karate"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the program..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="termLength">Term Length (months)</Label>
              <Input
                id="termLength"
                type="number"
                value={formData.termLength}
                onChange={(e) => setFormData({ ...formData, termLength: parseInt(e.target.value) || 0 })}
                placeholder="12"
              />
            </div>

            <div>
              <Label htmlFor="ageRange">Age Range</Label>
              <Input
                id="ageRange"
                value={formData.ageRange}
                onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                placeholder="e.g., Ages 4-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eligibility">Eligibility</Label>
              <Select
                value={formData.eligibility}
                onValueChange={(value: "open" | "invitation_only") => setFormData({ ...formData, eligibility: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open to All</SelectItem>
                  <SelectItem value="invitation_only">Invitation Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="showOnKiosk">Show on Kiosk</Label>
              <Select
                value={formData.showOnKiosk.toString()}
                onValueChange={(value) => setFormData({ ...formData, showOnKiosk: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Yes</SelectItem>
                  <SelectItem value="0">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : program ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
