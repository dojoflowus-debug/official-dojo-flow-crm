import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import EnrollStudentModal from "@/components/EnrollStudentModal";
import {
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Zap,
  TrendingUp,
  Receipt,
  Wallet,
  ChevronRight,
  Ban,
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
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  paused: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  cancelled: "bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/30",
  past_due: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

const paymentStatusConfig: Record<string, { icon: JSX.Element; color: string; label: string }> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "text-emerald-500",
    label: "Paid",
  },
  failed: {
    icon: <XCircle className="w-4 h-4" />,
    color: "text-red-500",
    label: "Failed",
  },
  declined: {
    icon: <Ban className="w-4 h-4" />,
    color: "text-red-400",
    label: "Declined",
  },
  pending: {
    icon: <Clock className="w-4 h-4" />,
    color: "text-amber-500",
    label: "Pending",
  },
  refunded: {
    icon: <RefreshCw className="w-4 h-4" />,
    color: "text-blue-500",
    label: "Refunded",
  },
  voided: {
    icon: <XCircle className="w-4 h-4" />,
    color: "text-slate-400",
    label: "Voided",
  },
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtCurrency(dollars: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(dollars);
}

export default function StudentBillingTab({ studentId, studentName }: StudentBillingTabProps) {
  const { toast } = useToast();
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [chargingEnrollmentId, setChargingEnrollmentId] = useState<number | null>(null);

  // Queries
  const { data: billingStatus, isLoading, refetch } = trpc.tuitionBilling.getStudentBillingStatus.useQuery(
    { studentId },
    { enabled: !!studentId }
  );

  // Mutations
  const chargeMutation = trpc.tuitionBilling.chargeStudentTuition.useMutation({
    onSuccess: (data) => {
      toast({ title: "Payment Successful!", description: data.message });
      setChargingEnrollmentId(null);
      refetch();
    },
    onError: (err) => {
      toast({ title: "Charge Failed", description: err.message, variant: "destructive" });
      setChargingEnrollmentId(null);
    },
  });

  const cancelEnrollmentMutation = trpc.tuitionBilling.cancelEnrollment.useMutation({
    onSuccess: () => {
      toast({ title: "Enrollment cancelled" });
      refetch();
    },
  });

  const activeEnrollments = billingStatus?.enrollments.filter(e => e.status === "active") || [];
  const allEnrollments = billingStatus?.enrollments || [];
  const payments = billingStatus?.payments || [];

  // Stats
  const totalPaid = payments.filter(p => p.status === "success").reduce((sum, p) => sum + p.amountDollars, 0);
  const totalFailed = payments.filter(p => p.status === "failed" || p.status === "declined").length;
  const monthlyTotal = activeEnrollments.reduce((sum, e) => sum + e.amountDollars, 0);
  const nextBilling = activeEnrollments
    .filter(e => e.nextBillingDate)
    .sort((a, b) => new Date(a.nextBillingDate!).getTime() - new Date(b.nextBillingDate!).getTime())[0]?.nextBillingDate;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-red-500" />
            <span className="text-xs text-muted-foreground font-medium">Active Plans</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{activeEnrollments.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground font-medium">Monthly</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{fmtCurrency(monthlyTotal)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground font-medium">Total Paid</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{fmtCurrency(totalPaid)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-violet-500" />
            <span className="text-xs text-muted-foreground font-medium">Next Billing</span>
          </div>
          <div className="text-sm font-semibold text-foreground">{nextBilling ? fmtDate(nextBilling) : "—"}</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="enrollments" className="w-full">
        <TabsList className="w-full justify-start border-b border-border bg-transparent rounded-none h-auto p-0 gap-0">
          <TabsTrigger
            value="enrollments"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <CreditCard className="w-4 h-4 mr-1.5" />
            Enrollments
            {allEnrollments.length > 0 && (
              <span className="ml-1.5 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                {allEnrollments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Receipt className="w-4 h-4 mr-1.5" />
            Payments
            {payments.length > 0 && (
              <span className="ml-1.5 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                {payments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="card"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Wallet className="w-4 h-4 mr-1.5" />
            Card on File
          </TabsTrigger>
        </TabsList>

        {/* ── Enrollments Tab ── */}
        <TabsContent value="enrollments" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {allEnrollments.length === 0
                ? "No tuition plans assigned yet."
                : `${activeEnrollments.length} active · ${allEnrollments.length - activeEnrollments.length} inactive`}
            </p>
            <Button
              size="sm"
              onClick={() => setShowEnrollModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Enroll
            </Button>
          </div>

          {allEnrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-border">
              <CreditCard className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No tuition plans assigned</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Click "Enroll" to assign a tuition plan to {studentName.split(" ")[0]}.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-start justify-between p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-foreground text-sm">{enrollment.planName}</span>
                      <Badge className={`text-xs border ${statusColor[enrollment.status] || statusColor.active}`}>
                        {enrollment.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {fmtCurrency(enrollment.amountDollars)} / {frequencyLabel[enrollment.frequency] || enrollment.frequency}
                      </span>
                      {enrollment.startDate && (
                        <span>Started {fmtDate(enrollment.startDate)}</span>
                      )}
                      {enrollment.nextBillingDate && enrollment.status === "active" && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Next: {fmtDate(enrollment.nextBillingDate)}
                        </span>
                      )}
                    </div>
                    {enrollment.hasCard ? (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <CreditCard className="w-3 h-3" />
                        <span>{enrollment.cardBrand || "Card"} •••• {enrollment.cardLast4}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-3 h-3" />
                        <span>No card on file</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    {enrollment.status === "active" && enrollment.hasCard && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setChargingEnrollmentId(enrollment.id);
                          chargeMutation.mutate({ studentId, enrollmentId: enrollment.id });
                        }}
                        disabled={chargeMutation.isPending && chargingEnrollmentId === enrollment.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        {chargeMutation.isPending && chargingEnrollmentId === enrollment.id ? "..." : "Charge"}
                      </Button>
                    )}
                    {enrollment.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelEnrollmentMutation.mutate({ enrollmentId: enrollment.id })}
                        disabled={cancelEnrollmentMutation.isPending}
                        className="h-7 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/50"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No card warning */}
          {activeEnrollments.length > 0 && !activeEnrollments.some(e => e.hasCard) && (
            <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">No payment method on file</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use the Enroll button to add a card via the secure payment form.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Payments Tab ── */}
        <TabsContent value="payments" className="mt-4">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-border">
              <Receipt className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No payment records yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Payments will appear here once charges are processed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Failed payments alert */}
              {totalFailed > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{totalFailed} failed payment{totalFailed > 1 ? "s" : ""} on record</span>
                </div>
              )}

              {/* Payment list */}
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5">Status</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5">Description</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Date</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-2.5">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map((payment) => {
                      const cfg = paymentStatusConfig[payment.status] || paymentStatusConfig.pending;
                      return (
                        <tr key={payment.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className={`flex items-center gap-1.5 ${cfg.color}`}>
                              {cfg.icon}
                              <span className="text-xs font-medium">{cfg.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-foreground font-medium text-xs">{payment.description || "Tuition payment"}</p>
                            {payment.fluidpayTransactionId && (
                              <p className="text-muted-foreground/50 text-[10px] mt-0.5 font-mono">
                                #{payment.fluidpayTransactionId.slice(-10)}
                              </p>
                            )}
                            {payment.failureReason && (
                              <p className="text-red-500 text-[10px] mt-0.5">{payment.failureReason}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <p className="text-xs text-muted-foreground">
                              {fmtDate(payment.paidAt || payment.createdAt)}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-sm font-semibold ${
                              payment.status === "success"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : payment.status === "refunded"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-muted-foreground"
                            }`}>
                              {payment.status === "refunded" ? "−" : ""}{fmtCurrency(payment.amountDollars)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-muted/30">
                      <td colSpan={2} className="px-4 py-2.5 text-xs text-muted-foreground">
                        {payments.filter(p => p.status === "success").length} successful · {totalFailed} failed
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell" />
                      <td className="px-4 py-2.5 text-right text-sm font-bold text-foreground">
                        {fmtCurrency(totalPaid)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Card on File Tab ── */}
        <TabsContent value="card" className="mt-4">
          {activeEnrollments.filter(e => e.hasCard).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-border">
              <Wallet className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No card on file</p>
              <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
                Enroll the student in a plan and add a card to enable automatic billing.
              </p>
              <Button
                size="sm"
                onClick={() => setShowEnrollModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Enroll & Add Card
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeEnrollments.filter(e => e.hasCard).map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
                >
                  {/* Card icon */}
                  <div className="w-12 h-8 rounded-md bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {enrollment.cardBrand || "Card"} •••• {enrollment.cardLast4}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Used for: {enrollment.planName}
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                    Active
                  </Badge>
                </div>
              ))}
              <p className="text-xs text-muted-foreground px-1">
                Cards are stored securely via FluidPay's vault. To update a card, cancel the enrollment and re-enroll with a new card.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <EnrollStudentModal
          studentId={studentId}
          studentName={studentName}
          onClose={() => {
            setShowEnrollModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
