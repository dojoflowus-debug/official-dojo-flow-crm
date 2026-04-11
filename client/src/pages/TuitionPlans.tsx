import { useState } from "react";
import { trpc } from "@/lib/trpc";
import ManagementLayout from "@/components/ManagementLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, DollarSign, Edit, Trash2, CreditCard, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const frequencyOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
  { value: "one_time", label: "One-time" },
];

interface PlanForm {
  name: string;
  description: string;
  amountDollars: string;
  frequency: string;
}

const emptyForm: PlanForm = {
  name: "",
  description: "",
  amountDollars: "",
  frequency: "monthly",
};

export default function TuitionPlans() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: plans, isLoading, refetch } = trpc.tuitionBilling.listTuitionPlans.useQuery();

  const createMutation = trpc.tuitionBilling.createTuitionPlan.useMutation({
    onSuccess: () => {
      toast({ title: "Plan created!", description: `"${form.name}" is ready to assign to students.` });
      setShowCreateDialog(false);
      setForm(emptyForm);
      refetch();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = trpc.tuitionBilling.updateTuitionPlan.useMutation({
    onSuccess: () => {
      toast({ title: "Plan updated!" });
      setEditingPlan(null);
      setForm(emptyForm);
      refetch();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = trpc.tuitionBilling.deleteTuitionPlan.useMutation({
    onSuccess: () => {
      toast({ title: "Plan deactivated" });
      setDeleteConfirmId(null);
      refetch();
    },
  });

  const handleSubmit = () => {
    const amount = parseFloat(form.amountDollars);
    if (!form.name.trim() || isNaN(amount) || amount <= 0) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (editingPlan) {
      updateMutation.mutate({
        id: editingPlan.id,
        name: form.name,
        description: form.description || undefined,
        amountDollars: amount,
        frequency: form.frequency as any,
      });
    } else {
      createMutation.mutate({
        name: form.name,
        description: form.description || undefined,
        amountDollars: amount,
        frequency: form.frequency as any,
      });
    }
  };

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description || "",
      amountDollars: plan.amountDollars.toString(),
      frequency: plan.frequency,
    });
  };

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setShowCreateDialog(true);
  };

  const isDialogOpen = showCreateDialog || !!editingPlan;

  return (
    <ManagementLayout>
      <div className="min-h-full bg-background pb-24">
        {/* Header */}
        <div className="relative z-30 bg-background/50 backdrop-blur-xl border-b border-white/5">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-red-400" />
                Tuition Plans
              </h1>
              <Button
                onClick={openCreate}
                className="bg-red-600 hover:bg-red-700 text-white gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                New Plan
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 space-y-4">
          {/* Info Banner */}
          <Card className="bg-blue-500/10 border border-blue-500/30">
            <CardContent className="pt-4 pb-3">
              <p className="text-sm text-blue-300">
                <strong>Tuition Plans</strong> define the recurring billing amounts for your students.
                Once created, you can assign them to individual students from their profile page and charge their card on file via FluidPay.
              </p>
            </CardContent>
          </Card>

          {/* Plans Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
            </div>
          ) : !plans || plans.length === 0 ? (
            <Card className="bg-white/[0.03] border border-white/10">
              <CardContent className="py-16 text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-white/20" />
                <h3 className="text-lg font-medium text-white mb-2">No tuition plans yet</h3>
                <p className="text-white/50 text-sm mb-6">
                  Create your first tuition plan to start collecting student payments via FluidPay.
                </p>
                <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base text-white">{plan.name}</CardTitle>
                        {plan.description && (
                          <p className="text-xs text-white/50 mt-1">{plan.description}</p>
                        )}
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-2xl font-bold text-white">${plan.amountDollars.toFixed(2)}</span>
                      <span className="text-white/40 text-sm">
                        / {frequencyOptions.find(f => f.value === plan.frequency)?.label || plan.frequency}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(plan)}
                        className="flex-1 border-white/20 text-white/70 hover:text-white h-8 text-xs gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirmId(plan.id)}
                        className="border-red-500/30 text-red-400 hover:text-red-300 h-8 text-xs gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) { setShowCreateDialog(false); setEditingPlan(null); setForm(emptyForm); }
        }}>
          <DialogContent className="bg-[#1a1a2e] border border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit Tuition Plan" : "Create Tuition Plan"}</DialogTitle>
              <DialogDescription className="text-white/50">
                {editingPlan ? "Update the plan details" : "Define a new recurring tuition plan for your students"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-white/70 text-sm">Plan Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Monthly Karate, Kids Program"
                  className="mt-1 bg-white/[0.05] border-white/20 text-white placeholder:text-white/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70 text-sm">Amount ($) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amountDollars}
                    onChange={(e) => setForm(f => ({ ...f, amountDollars: e.target.value }))}
                    placeholder="99.00"
                    className="mt-1 bg-white/[0.05] border-white/20 text-white placeholder:text-white/30"
                  />
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Frequency</Label>
                  <Select value={form.frequency} onValueChange={(v) => setForm(f => ({ ...f, frequency: v }))}>
                    <SelectTrigger className="mt-1 bg-white/[0.05] border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/20">
                      {frequencyOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-white">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-white/70 text-sm">Description (optional)</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of what's included"
                  className="mt-1 bg-white/[0.05] border-white/20 text-white placeholder:text-white/30"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setShowCreateDialog(false); setEditingPlan(null); setForm(emptyForm); }}
                className="border-white/20 text-white/70"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingPlan ? "Save Changes" : "Create Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
          <DialogContent className="bg-[#1a1a2e] border border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Deactivate Plan?</DialogTitle>
              <DialogDescription className="text-white/50">
                This plan will be deactivated and no longer available for new enrollments. Existing enrollments will not be affected.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="border-white/20 text-white/70">
                Cancel
              </Button>
              <Button
                onClick={() => deleteConfirmId && deleteMutation.mutate({ id: deleteConfirmId })}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteMutation.isPending ? "Deactivating..." : "Deactivate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ManagementLayout>
  );
}
