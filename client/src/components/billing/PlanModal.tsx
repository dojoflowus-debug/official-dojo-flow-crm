import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface PlanModalProps {
  open: boolean;
  onClose: () => void;
  planId?: number;
}

export function PlanModal({ open, onClose, planId }: PlanModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    monthlyPrice: "",
    termLength: "12",
    registrationFee: "",
    billingCycle: "monthly",
  });

  const utils = trpc.useUtils();

  // Fetch plan data if editing
  const { data: plans } = trpc.billing.getPlans.useQuery(undefined, {
    enabled: !!planId,
  });

  const plan = plans?.find((p) => p.id === planId);

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description || "",
        // Convert from cents to dollars
        monthlyPrice: plan.monthlyAmount ? (plan.monthlyAmount / 100).toFixed(2) : "",
        termLength: plan.termLength?.toString() || "12",
        registrationFee: plan.registrationFee ? (plan.registrationFee / 100).toFixed(2) : "",
        billingCycle: plan.billingCycle || "monthly",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        monthlyPrice: "",
        termLength: "12",
        registrationFee: "",
        billingCycle: "monthly",
      });
    }
  }, [plan]);

  const createMutation = trpc.billing.createPlan.useMutation({
    onSuccess: () => {
      toast.success("Plan created successfully");
      utils.billing.getPlans.invalidate();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to create plan: ${error.message}`);
    },
  });

  const updateMutation = trpc.billing.updatePlan.useMutation({
    onSuccess: () => {
      toast.success("Plan updated successfully");
      utils.billing.getPlans.invalidate();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to update plan: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      description: formData.description || null,
      monthlyPrice: parseFloat(formData.monthlyPrice),
      termLength: parseInt(formData.termLength),
      registrationFee: formData.registrationFee ? parseFloat(formData.registrationFee) : null,
      billingCycle: formData.billingCycle,
    };

    if (planId) {
      updateMutation.mutate({ id: planId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{planId ? "Edit Plan" : "Add New Plan"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Plan Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Starter Plan"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the plan"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthlyPrice">Monthly Price *</Label>
              <Input
                id="monthlyPrice"
                type="number"
                step="0.01"
                value={formData.monthlyPrice}
                onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                placeholder="149.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="registrationFee">Registration Fee</Label>
              <Input
                id="registrationFee"
                type="number"
                step="0.01"
                value={formData.registrationFee}
                onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                placeholder="99.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="termLength">Term Length (months) *</Label>
              <Input
                id="termLength"
                type="number"
                value={formData.termLength}
                onChange={(e) => setFormData({ ...formData, termLength: e.target.value })}
                placeholder="12"
                required
              />
            </div>

            <div>
              <Label htmlFor="billingCycle">Billing Cycle *</Label>
              <Select
                value={formData.billingCycle}
                onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}
              >
                <SelectTrigger id="billingCycle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : planId ? "Update Plan" : "Create Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
