import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  MapPin,
  Users,
  Calendar,
  CreditCard,
  Activity,
  Zap,
  TrendingUp,
  Mail,
  Phone,
  ExternalLink,
  Building,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { School } from "./SchoolsTable";

interface SchoolDetailPanelProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
}

const paymentStatusConfig = {
  current: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/20", label: "Current" },
  delinquent: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/20", label: "Delinquent" },
  trial: { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/20", label: "Trial" },
  cancelled: { icon: X, color: "text-red-400", bg: "bg-red-500/20", label: "Cancelled" },
};

export function SchoolDetailPanel({
  school,
  isOpen,
  onClose,
}: SchoolDetailPanelProps) {
  const navigate = useNavigate();

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!school) return null;

  const paymentConfig = paymentStatusConfig[school.paymentStatus || "current"];
  const PaymentIcon = paymentConfig.icon;

  // Calculate credit usage percentage
  const creditUsagePercent = school.creditsAllowance && school.creditsAllowance > 0
    ? Math.round(((school.creditsUsed || 0) / school.creditsAllowance) * 100)
    : 0;

  const handleViewDetails = () => {
    onClose();
    navigate(`/master/schools/${school.id}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "md-slide-panel",
          isOpen && "open"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#111113]/95 backdrop-blur-xl border-b border-white/5 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 rounded-xl border-2 border-white/10">
                <AvatarImage src={school.logoUrl || undefined} />
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white text-lg">
                  {school.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold text-white">{school.name}</h2>
                <p className="text-sm text-white/50">{school.owner} • {school.plan}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/60 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="md-glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-white/50">Students</p>
                  <p className="text-lg font-semibold text-white">{school.studentCount}</p>
                </div>
              </div>
            </div>
            <div className="md-glass-card p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", paymentConfig.bg)}>
                  <PaymentIcon className={cn("w-4 h-4", paymentConfig.color)} />
                </div>
                <div>
                  <p className="text-xs text-white/50">Payment Status</p>
                  <p className={cn("text-lg font-semibold", paymentConfig.color)}>
                    {paymentConfig.label}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Balance Card */}
          <div className="md-glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">AI Credits</span>
              </div>
              <span className={cn(
                "text-2xl font-bold",
                (school.credits || 0) < 50 ? "text-amber-400" : "text-white"
              )}>
                {(school.credits || 0).toLocaleString()}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/50">
                <span>Used this period</span>
                <span>{(school.creditsUsed || 0).toLocaleString()} / {(school.creditsAllowance || 0).toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all",
                    creditUsagePercent > 80 ? "bg-amber-500" : "bg-purple-500"
                  )}
                  style={{ width: `${Math.min(creditUsagePercent, 100)}%` }}
                />
              </div>
              {(school.credits || 0) < 50 && (
                <p className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Low credit balance
                </p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full bg-white/5 border border-white/10 p-1">
              <TabsTrigger
                value="overview"
                className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
              >
                Billing
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
              >
                Team
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Contact Info */}
              <div className="md-glass-card p-4 space-y-3">
                <h3 className="text-sm font-medium text-white mb-3">Contact & Location</h3>
                <div className="flex items-center gap-3 text-white/70">
                  <MapPin className="w-4 h-4 text-white/40" />
                  <span className="text-sm">{school.fullAddress || school.location}</span>
                </div>
                {school.ownerEmail && (
                  <div className="flex items-center gap-3 text-white/70">
                    <Mail className="w-4 h-4 text-white/40" />
                    <span className="text-sm">{school.ownerEmail}</span>
                  </div>
                )}
                {school.timezone && (
                  <div className="flex items-center gap-3 text-white/70">
                    <Clock className="w-4 h-4 text-white/40" />
                    <span className="text-sm">{school.timezone}</span>
                  </div>
                )}
                {school.joinedDate && (
                  <div className="flex items-center gap-3 text-white/70">
                    <Calendar className="w-4 h-4 text-white/40" />
                    <span className="text-sm">
                      Joined {new Date(school.joinedDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Programs */}
              {school.programs && school.programs.length > 0 && (
                <div className="md-glass-card p-4">
                  <h3 className="text-sm font-medium text-white mb-3">Programs Offered</h3>
                  <div className="flex flex-wrap gap-2">
                    {school.programs.map((program, i) => (
                      <Badge 
                        key={i} 
                        variant="secondary"
                        className="bg-white/10 text-white/70 hover:bg-white/15"
                      >
                        {program}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity */}
              <div className="md-glass-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-white">Last Activity</span>
                  </div>
                  <span className="text-sm text-white/70">{school.lastActivity || "Never"}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="billing" className="mt-4 space-y-4">
              {/* Subscription Info */}
              <div className="md-glass-card p-4 space-y-4">
                <h3 className="text-sm font-medium text-white">Subscription</h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Plan</span>
                  <Badge className={cn(
                    "text-sm",
                    school.plan === "Starter" && "bg-blue-500/20 text-blue-400",
                    school.plan === "Growth" && "bg-emerald-500/20 text-emerald-400",
                    school.plan === "Pro" && "bg-purple-500/20 text-purple-400",
                    school.plan === "Enterprise" && "bg-amber-500/20 text-amber-400"
                  )}>
                    {school.plan}
                  </Badge>
                </div>

                {school.monthlyPrice !== undefined && school.monthlyPrice > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">Amount</span>
                    <span className="text-white font-medium">
                      ${school.monthlyPrice}/{school.billingCycle === "annual" ? "year" : "month"}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-white/50">Status</span>
                  <div className={cn("flex items-center gap-1", paymentConfig.color)}>
                    <PaymentIcon className="w-4 h-4" />
                    <span>{paymentConfig.label}</span>
                  </div>
                </div>

                {school.paymentStatus === "trial" && school.trialEndsAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">Trial Ends</span>
                    <span className="text-blue-400">
                      {new Date(school.trialEndsAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {school.nextBillingDate && school.paymentStatus !== "trial" && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">Next Billing</span>
                    <span className="text-white/70">
                      {new Date(school.nextBillingDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Warning */}
              {school.paymentStatus === "delinquent" && (
                <div className="md-glass-card p-4 border border-amber-500/30 bg-amber-500/10">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-400">Payment Overdue</p>
                      <p className="text-xs text-white/60 mt-1">
                        This school has an overdue payment. Contact the owner to resolve.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="team" className="mt-4 space-y-4">
              {/* Team Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="md-glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-white/50">Staff Members</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{school.staffCount || 0}</p>
                  <p className="text-xs text-white/40">instructors & staff</p>
                </div>
                <div className="md-glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-white/50">Sub-Users</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{school.subUserCount || 0}</p>
                  <p className="text-xs text-white/40">with platform access</p>
                </div>
              </div>

              {/* Team Info */}
              <div className="md-glass-card p-4">
                <p className="text-white/50 text-sm text-center py-4">
                  View full team details in the school dashboard
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button
              className="w-full bg-red-500 hover:bg-red-600 text-white"
              onClick={handleViewDetails}
            >
              View Full Details
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Run Diagnostics
              </Button>
              <Button
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Contact Owner
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SchoolDetailPanel;
