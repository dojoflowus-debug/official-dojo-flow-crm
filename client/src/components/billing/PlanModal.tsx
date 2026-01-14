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
    billingFrequency: "monthly" as "monthly" | "weekly" | "daily" | "drop_in",
    priceAmount: "",
    termLength: "12",
    termLengthUnits: "months" as "months" | "weeks" | "days" | "visits",
    termLengthValue: "",
    registrationFee: "",
    billingCycle: "monthly",
    billingAnchorDayOfWeek: "1", // Monday
    visitPackSize: "",
    visitPackExpiryDays: "",
    chargeOnAttendance: false,
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
        billingFrequency: (plan.billingFrequency || "monthly") as any,
        // Convert from cents to dollars
        priceAmount: plan.priceAmount ? (plan.priceAmount / 100).toFixed(2) : 
                     plan.monthlyAmount ? (plan.monthlyAmount / 100).toFixed(2) : "",
        termLength: plan.termLength?.toString() || "12",
        termLengthUnits: (plan.termLengthUnits || "months") as any,
        termLengthValue: plan.termLengthValue?.toString() || "",
        registrationFee: plan.registrationFee ? (plan.registrationFee / 100).toFixed(2) : "",
        billingCycle: plan.billingCycle || "monthly",
        billingAnchorDayOfWeek: plan.billingAnchorDayOfWeek?.toString() || "1",
        visitPackSize: plan.visitPackSize?.toString() || "",
        visitPackExpiryDays: plan.visitPackExpiryDays?.toString() || "",
        chargeOnAttendance: !!plan.chargeOnAttendance,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        billingFrequency: "monthly",
        priceAmount: "",
        termLength: "12",
        termLengthUnits: "months",
        termLengthValue: "",
        registrationFee: "",
        billingCycle: "monthly",
        billingAnchorDayOfWeek: "1",
        visitPackSize: "",
        visitPackExpiryDays: "",
        chargeOnAttendance: false,
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

    // Convert price from dollars to cents
    const priceInCents = Math.round(parseFloat(formData.priceAmount) * 100);

    const data: any = {
      name: formData.name,
      description: formData.description || undefined,
      billingFrequency: formData.billingFrequency,
      priceAmount: priceInCents,
      monthlyPrice: priceInCents, // For backward compatibility
      registrationFee: formData.registrationFee ? Math.round(parseFloat(formData.registrationFee) * 100) : undefined,
      billingCycle: formData.billingCycle,
    };

    // Add frequency-specific fields
    if (formData.billingFrequency === "monthly") {
      data.termLength = parseInt(formData.termLength);
      data.termLengthUnits = "months";
      data.termLengthValue = parseInt(formData.termLength);
    } else if (formData.billingFrequency === "weekly") {
      data.billingAnchorDayOfWeek = parseInt(formData.billingAnchorDayOfWeek);
      if (formData.termLengthValue) {
        data.termLengthUnits = "weeks";
        data.termLengthValue = parseInt(formData.termLengthValue);
      }
    } else if (formData.billingFrequency === "daily") {
      if (formData.termLengthValue) {
        data.termLengthUnits = "days";
        data.termLengthValue = parseInt(formData.termLengthValue);
      }
      data.chargeOnAttendance = formData.chargeOnAttendance ? 1 : 0;
    } else if (formData.billingFrequency === "drop_in") {
      data.perVisitPrice = priceInCents;
      if (formData.visitPackSize) {
        data.visitPackSize = parseInt(formData.visitPackSize);
      }
      if (formData.visitPackExpiryDays) {
        data.visitPackExpiryDays = parseInt(formData.visitPackExpiryDays);
      }
    }

    if (planId) {
      updateMutation.mutate({ id: planId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Helper to get the price label based on frequency
  const getPriceLabel = () => {
    switch (formData.billingFrequency) {
      case "weekly":
        return "Weekly Price *";
      case "daily":
        return "Daily Price *";
      case "drop_in":
        return "Price Per Visit *";
      default:
        return "Monthly Price *";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          <div>
            <Label htmlFor="billingFrequency">Billing Frequency *</Label>
            <Select
              value={formData.billingFrequency}
              onValueChange={(value: any) => setFormData({ ...formData, billingFrequency: value })}
            >
              <SelectTrigger id="billingFrequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="drop_in">Drop-in</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priceAmount">{getPriceLabel()}</Label>
              <Input
                id="priceAmount"
                type="number"
                step="0.01"
                value={formData.priceAmount}
                onChange={(e) => setFormData({ ...formData, priceAmount: e.target.value })}
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

          {/* Monthly-specific fields */}
          {formData.billingFrequency === "monthly" && (
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
          )}

          {/* Weekly-specific fields */}
          {formData.billingFrequency === "weekly" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billingAnchorDayOfWeek">Billing Day</Label>
                <Select
                  value={formData.billingAnchorDayOfWeek}
                  onValueChange={(value) => setFormData({ ...formData, billingAnchorDayOfWeek: value })}
                >
                  <SelectTrigger id="billingAnchorDayOfWeek">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="termLengthValue">Term Length (weeks)</Label>
                <Input
                  id="termLengthValue"
                  type="number"
                  value={formData.termLengthValue}
                  onChange={(e) => setFormData({ ...formData, termLengthValue: e.target.value })}
                  placeholder="8"
                />
              </div>
            </div>
          )}

          {/* Daily-specific fields */}
          {formData.billingFrequency === "daily" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="termLengthValue">Term Length (days)</Label>
                <Input
                  id="termLengthValue"
                  type="number"
                  value={formData.termLengthValue}
                  onChange={(e) => setFormData({ ...formData, termLengthValue: e.target.value })}
                  placeholder="30"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="chargeOnAttendance"
                  checked={formData.chargeOnAttendance}
                  onChange={(e) => setFormData({ ...formData, chargeOnAttendance: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="chargeOnAttendance" className="cursor-pointer">
                  Charge on attendance
                </Label>
              </div>
            </div>
          )}

          {/* Drop-in-specific fields */}
          {formData.billingFrequency === "drop_in" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="visitPackSize">Visit Pack Size</Label>
                <Input
                  id="visitPackSize"
                  type="number"
                  value={formData.visitPackSize}
                  onChange={(e) => setFormData({ ...formData, visitPackSize: e.target.value })}
                  placeholder="1, 5, 10, 20"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of visits in the pack (e.g., 1, 5, 10, 20)
                </p>
              </div>

              <div>
                <Label htmlFor="visitPackExpiryDays">Expiry (days)</Label>
                <Input
                  id="visitPackExpiryDays"
                  type="number"
                  value={formData.visitPackExpiryDays}
                  onChange={(e) => setFormData({ ...formData, visitPackExpiryDays: e.target.value })}
                  placeholder="90"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Days until visit pack expires
                </p>
              </div>
            </div>
          )}

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
