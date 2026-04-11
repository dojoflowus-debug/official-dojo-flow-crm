import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Zap,
  Clock,
  RefreshCw,
} from "lucide-react";

interface StudentBillingTabProps {
  studentId: number;
  studentName: string;
}

const frequencyLabel: Record<string, string> = {
  monthly: "Monthly",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  quarterly: "Quarterly",
  annual: "Annual",
  one_time: "One-time",
};

const statusColor: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  paused: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  past_due: "bg-red-500/20 text-red-400 border-red-500/30",
};

const paymentStatusIcon: Record<string, JSX.Element> = {
  success: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
  pending: <Clock className="w-4 h-4 text-yellow-400" />,
  refunded: <RefreshCw className="w-4 h-4 text-blue-400" />,
  voided: <XCircle className="w-4 h-4 text-gray-400" />,
};

export default function StudentBillingTab({ studentId, studentName }: StudentBillingTabProps) {
  const { toast } = useToast();
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [showChargeDialog, setShowChargeDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<number | null>(null);

  // Queries
  const { data: billingStatus, isLoading, refetch } = trpc.tuitionBilling.getStudentBillingStatus.useQuery(
    { studentId },
    { enabled: !!studentId }
  );
  const { data: plans } = trpc.tuitionBilling.listTuitionPlans.useQuery();

  // Mutations
  const enrollMutation = trpc.tuitionBilling.enrollStudentInPlan.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Enrolled!", description: data.message });
        setShowEnrollDialog(false);
        setSelectedPlanId("");
        refetch();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    },
    onError: (err) => {
      toast({ title: "Enrollment failed", description: err.message, variant: "destructive" });
    },
  });

  const chargeMutation = trpc.tuitionBilling.chargeStudentTuition.useMutation({
    onSuccess: (data) => {
      toast({ title: "Payment Successful!", description: data.message });
      setShowChargeDialog(false);
      refetch();
    },
    onError: (err) => {
      toast({ title: "Charge Failed", description: err.message, variant: "destructive" });
    },
  });

  const cancelEnrollmentMutation = trpc.tuitionBilling.cancelEnrollment.useMutation({
    onSuccess: () => {
      toast({ title: "Enrollment cancelled" });
      refetch();
    },
  });

  const handleEnroll = () => {
    if (!selectedPlanId) return;
    enrollMutation.mutate({ studentId, planId: parseInt(selectedPlanId) });
  };

  const handleCharge = () => {
    chargeMutation.mutate({
      studentId,
      enrollmentId: selectedEnrollmentId || undefined,
    });
  };

  const activeEnrollments = billingStatus?.enrollments.filter(e => e.status === "active") || [];
  const allEnrollments = billingStatus?.enrollments || [];
  const payments = billingStatus?.payments || [];
  const hasCard = activeEnrollments.some(e => e.hasCard);
  const primaryEnrollment = activeEnrollments[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-white/[0.03] border border-white/10">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-red-400" />
              <span className="text-xs text-white/50">Active Plans</span>
            </div>
            <div className="text-2xl font-bold text-white">{activeEnrollments.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.03] border border-white/10">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-xs text-white/50">Monthly</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${activeEnrollments.reduce((sum, e) => sum + e.amountDollars, 0).toFixed(0)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.03] border border-white/10">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-white/50">Payments</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {payments.filter(p => p.status === "success").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Enrollments */}
      <Card className="bg-white/[0.03] border border-white/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-red-400" />
              Tuition Enrollments
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowEnrollDialog(true)}
              className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs gap-1"
            >
              <Plus className="w-3 h-3" />
              Enroll
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {allEnrollments.length === 0 ? (
            <div className="text-center py-6 text-white/40">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No tuition plans assigned yet</p>
              <p className="text-xs mt-1">Click "Enroll" to assign a tuition plan</p>
            </div>
          ) : (
            allEnrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-start justify-between p-3 rounded-lg bg-white/[0.03] border border-white/10"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm">{enrollment.planName}</span>
                    <Badge className={`text-xs border ${statusColor[enrollment.status] || statusColor.active}`}>
                      {enrollment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span className="text-green-400 font-medium">${enrollment.amountDollars.toFixed(2)}</span>
                    <span>{frequencyLabel[enrollment.frequency] || enrollment.frequency}</span>
                    {enrollment.nextBillingDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Next: {new Date(enrollment.nextBillingDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {enrollment.hasCard ? (
                    <div className="flex items-center gap-1 mt-1 text-xs text-white/40">
                      <CreditCard className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">{enrollment.cardBrand || "Card"} •••• {enrollment.cardLast4}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-1 text-xs text-yellow-400">
                      <AlertCircle className="w-3 h-3" />
                      <span>No card on file — add payment method to charge</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {enrollment.status === "active" && enrollment.hasCard && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedEnrollmentId(enrollment.id);
                        setShowChargeDialog(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs gap-1"
                    >
                      <Zap className="w-3 h-3" />
                      Charge
                    </Button>
                  )}
                  {enrollment.status === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelEnrollmentMutation.mutate({ enrollmentId: enrollment.id })}
                      className="border-white/20 text-white/60 hover:text-white h-7 text-xs"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Card on File Notice */}
      {activeEnrollments.length > 0 && !hasCard && (
        <Card className="bg-yellow-500/10 border border-yellow-500/30">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-300">No payment method on file</p>
                <p className="text-xs text-yellow-400/70 mt-0.5">
                  To charge tuition, a card must be saved. Ask the student to add their card via the student portal, or use the FluidPay dashboard to add a card to their vault.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card className="bg-white/[0.03] border border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-6 text-white/40">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No payment records yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                >
                  <div className="flex items-center gap-2">
                    {paymentStatusIcon[payment.status] || paymentStatusIcon.pending}
                    <div>
                      <p className="text-sm text-white">{payment.description || "Tuition payment"}</p>
                      <p className="text-xs text-white/40">
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : new Date(payment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {payment.fluidpayTransactionId && (
                          <span className="ml-2 text-white/25">#{payment.fluidpayTransactionId.slice(-8)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${payment.status === "success" ? "text-green-400" : payment.status === "failed" ? "text-red-400" : "text-white/60"}`}>
                      ${payment.amountDollars.toFixed(2)}
                    </p>
                    <p className="text-xs text-white/30 capitalize">{payment.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enroll Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="bg-[#1a1a2e] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Enroll in Tuition Plan</DialogTitle>
            <DialogDescription className="text-white/50">
              Assign a tuition plan to {studentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {plans && plans.length > 0 ? (
              <div>
                <label className="text-sm text-white/70 mb-2 block">Select Plan</label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger className="bg-white/[0.05] border-white/20 text-white">
                    <SelectValue placeholder="Choose a tuition plan..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/20">
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={String(plan.id)} className="text-white">
                        {plan.name} — ${plan.amountDollars.toFixed(2)}/{frequencyLabel[plan.frequency] || plan.frequency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-center py-4 text-white/50">
                <p className="text-sm">No tuition plans created yet.</p>
                <p className="text-xs mt-1">Go to Settings → Tuition Plans to create one first.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnrollDialog(false)} className="border-white/20 text-white/70">
              Cancel
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={!selectedPlanId || enrollMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {enrollMutation.isPending ? "Enrolling..." : "Enroll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Charge Dialog */}
      <Dialog open={showChargeDialog} onOpenChange={setShowChargeDialog}>
        <DialogContent className="bg-[#1a1a2e] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Charge Tuition</DialogTitle>
            <DialogDescription className="text-white/50">
              Charge {studentName}'s card on file for their tuition
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {primaryEnrollment && (
              <div className="p-3 rounded-lg bg-white/[0.05] border border-white/10 space-y-1">
                <p className="text-sm font-medium text-white">{primaryEnrollment.planName}</p>
                <p className="text-2xl font-bold text-green-400">${primaryEnrollment.amountDollars.toFixed(2)}</p>
                {primaryEnrollment.cardLast4 && (
                  <p className="text-xs text-white/50 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    {primaryEnrollment.cardBrand || "Card"} ending in {primaryEnrollment.cardLast4}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChargeDialog(false)} className="border-white/20 text-white/70">
              Cancel
            </Button>
            <Button
              onClick={handleCharge}
              disabled={chargeMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <Zap className="w-4 h-4" />
              {chargeMutation.isPending ? "Charging..." : `Charge $${primaryEnrollment?.amountDollars.toFixed(2) || "0.00"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
