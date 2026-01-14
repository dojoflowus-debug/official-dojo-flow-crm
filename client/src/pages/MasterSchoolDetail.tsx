import { useParams, useNavigate } from "react-router-dom";
import { MasterDashboardLayout } from "@/components/MasterDashboardLayout";
import { trpc } from "@/lib/trpc";
import { 
  Loader2, 
  ArrowLeft, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Users, 
  Zap,
  DollarSign,
  Building,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserPlus,
  CreditCard,
  Activity,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const paymentStatusConfig = {
  trial: { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/20", label: "Trial" },
  active: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/20", label: "Active" },
  past_due: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/20", label: "Past Due" },
  cancelled: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20", label: "Cancelled" },
  paused: { icon: Clock, color: "text-white/50", bg: "bg-white/10", label: "Paused" },
};

export default function MasterSchoolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const schoolId = parseInt(id || "0", 10);

  const { data, isLoading, error } = trpc.masterDashboard.getSchoolDetails.useQuery(
    { schoolId },
    { enabled: schoolId > 0 }
  );

  if (isLoading) {
    return (
      <MasterDashboardLayout title="School Details" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading school details...</span>
        </div>
      </MasterDashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <MasterDashboardLayout title="School Details" subtitle="Error">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-destructive mb-2">Failed to load school details</p>
          <p className="text-sm text-muted-foreground">{error?.message || "School not found"}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate("/master/schools")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Schools
          </Button>
        </div>
      </MasterDashboardLayout>
    );
  }

  const { organization, owner, subscription, planDetails, studentCount, creditBalance, creditsUsed, creditsAllowance, staffMembers, subUsers } = data;
  
  const status = subscription?.status || organization.subscriptionStatus || "trial";
  const statusConfig = paymentStatusConfig[status as keyof typeof paymentStatusConfig] || paymentStatusConfig.trial;
  const StatusIcon = statusConfig.icon;

  // Parse programs
  const programs = Array.isArray(organization.programs) ? organization.programs : [];

  // Calculate credit usage percentage
  const creditUsagePercent = creditsAllowance > 0 ? Math.round((creditsUsed / creditsAllowance) * 100) : 0;

  return (
    <MasterDashboardLayout 
      title={organization.name} 
      subtitle={`${organization.city || ""}, ${organization.state || ""}`}
    >
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="mb-6 text-white/60 hover:text-white"
        onClick={() => navigate("/master/schools")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Schools
      </Button>

      {/* Header Card */}
      <div className="md-glass-card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 rounded-xl border-2 border-white/10">
              <AvatarImage src={organization.logoUrl || undefined} />
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white text-xl">
                {organization.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-white">{organization.name}</h1>
              <p className="text-white/50">{owner?.userName || "No owner"}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={cn("text-sm", statusConfig.bg, statusConfig.color)}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                {planDetails && (
                  <Badge variant="secondary" className="bg-white/10 text-white/70">
                    {planDetails.name} Plan
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
            <Settings className="w-4 h-4 mr-2" />
            Manage
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="md-glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-white/50">Students</p>
              <p className="text-2xl font-bold text-white">{studentCount}</p>
            </div>
          </div>
        </div>
        <div className="md-glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-white/50">AI Credits</p>
              <p className={cn(
                "text-2xl font-bold",
                creditBalance < 50 ? "text-amber-400" : "text-white"
              )}>
                {creditBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="md-glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <UserPlus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-white/50">Staff</p>
              <p className="text-2xl font-bold text-white">{staffMembers.length}</p>
            </div>
          </div>
        </div>
        <div className="md-glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-white/50">Monthly</p>
              <p className="text-2xl font-bold text-white">
                ${planDetails ? (planDetails.monthlyPrice / 100).toFixed(0) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full bg-white/5 border border-white/10 p-1 mb-6">
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
            Billing & Credits
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
          >
            Team & Users
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
          >
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="md-glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
              <div className="space-y-4">
                {organization.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-white/40 mt-0.5" />
                    <div>
                      <p className="text-white/70">{organization.address}</p>
                      <p className="text-white/70">
                        {organization.city}, {organization.state} {organization.zipCode}
                      </p>
                    </div>
                  </div>
                )}
                {owner?.userEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-white/40" />
                    <span className="text-white/70">{owner.userEmail}</span>
                  </div>
                )}
                {organization.timezone && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-white/40" />
                    <span className="text-white/70">{organization.timezone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-white/40" />
                  <span className="text-white/70">
                    Joined {new Date(organization.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Programs */}
            <div className="md-glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Programs Offered</h3>
              {programs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {programs.map((program: string, i: number) => (
                    <Badge 
                      key={i} 
                      variant="secondary"
                      className="bg-white/10 text-white/70 hover:bg-white/15 px-3 py-1"
                    >
                      {program}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-white/50">No programs specified</p>
              )}
              
              {organization.estimatedStudents && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-white/50">Estimated Students at Signup</p>
                  <p className="text-lg font-semibold text-white">{organization.estimatedStudents}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Subscription Details */}
            <div className="md-glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Subscription</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Plan</span>
                  <Badge className={cn(
                    "text-sm",
                    planDetails?.name === "Starter" && "bg-blue-500/20 text-blue-400",
                    planDetails?.name === "Growth" && "bg-emerald-500/20 text-emerald-400",
                    planDetails?.name === "Pro" && "bg-purple-500/20 text-purple-400",
                    planDetails?.name === "Enterprise" && "bg-amber-500/20 text-amber-400"
                  )}>
                    {planDetails?.name || "Free"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Status</span>
                  <div className={cn("flex items-center gap-1", statusConfig.color)}>
                    <StatusIcon className="w-4 h-4" />
                    <span>{statusConfig.label}</span>
                  </div>
                </div>
                {planDetails && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">Monthly Price</span>
                    <span className="text-white font-medium">
                      ${(planDetails.monthlyPrice / 100).toFixed(2)}/mo
                    </span>
                  </div>
                )}
                {subscription?.billingCycle && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">Billing Cycle</span>
                    <span className="text-white/70 capitalize">{subscription.billingCycle}</span>
                  </div>
                )}
                {subscription?.currentPeriodEnd && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">Next Billing</span>
                    <span className="text-white/70">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {organization.trialEndsAt && status === "trial" && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">Trial Ends</span>
                    <span className="text-blue-400">
                      {new Date(organization.trialEndsAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Credits */}
            <div className="md-glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">AI Credits</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Current Balance</span>
                  <span className={cn(
                    "text-2xl font-bold",
                    creditBalance < 50 ? "text-amber-400" : "text-white"
                  )}>
                    {creditBalance.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Used this period</span>
                    <span className="text-white/70">
                      {creditsUsed.toLocaleString()} / {creditsAllowance.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        creditUsagePercent > 80 ? "bg-amber-500" : "bg-purple-500"
                      )}
                      style={{ width: `${Math.min(creditUsagePercent, 100)}%` }}
                    />
                  </div>
                </div>
                {creditBalance < 50 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-400">Low credit balance</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Warning */}
          {status === "past_due" && (
            <div className="md-glass-card p-6 border border-amber-500/30 bg-amber-500/10">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-amber-400">Payment Overdue</h4>
                  <p className="text-white/60 mt-1">
                    This school has an overdue payment. Contact the owner to resolve the billing issue.
                  </p>
                  <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-black">
                    Contact Owner
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Staff Members */}
            <div className="md-glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Staff Members</h3>
                <Badge variant="secondary" className="bg-white/10 text-white/70">
                  {staffMembers.length}
                </Badge>
              </div>
              {staffMembers.length > 0 ? (
                <div className="space-y-3">
                  {staffMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-white/10 text-white/70 text-xs">
                            {member.name.split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">{member.name}</p>
                          <p className="text-xs text-white/50 capitalize">{member.role}</p>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs",
                          member.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50"
                        )}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/50 text-center py-8">No staff members added</p>
              )}
            </div>

            {/* Sub-Users */}
            <div className="md-glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Platform Users</h3>
                <Badge variant="secondary" className="bg-white/10 text-white/70">
                  {subUsers.length}
                </Badge>
              </div>
              {subUsers.length > 0 ? (
                <div className="space-y-3">
                  {subUsers.map((user, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-white/10 text-white/70 text-xs">
                            {(user.userName || "?").split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">{user.userName || "Unknown"}</p>
                          <p className="text-xs text-white/50">{user.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-white/10 text-white/70 capitalize">
                          {user.role}
                        </Badge>
                        {user.isPrimary === 1 && (
                          <Badge className="text-xs bg-amber-500/20 text-amber-400">
                            Primary
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/50 text-center py-8">No platform users</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="md-glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <span className="text-white/50">Last Activity</span>
              <span className="text-white/70">
                {organization.lastActivity 
                  ? new Date(organization.lastActivity).toLocaleString()
                  : "No activity recorded"}
              </span>
            </div>
            <p className="text-white/40 text-sm text-center mt-8">
              Detailed activity logs coming soon
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </MasterDashboardLayout>
  );
}
