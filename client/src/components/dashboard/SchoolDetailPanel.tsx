import { useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { School } from "./SchoolsTable";

interface SchoolDetailPanelProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for the detail panel
const mockSchoolDetails = {
  email: "contact@edenjj.com",
  phone: "(310) 555-0123",
  joinedDate: "Mar 15, 2024",
  lastBilling: "7 days ago",
  automationsActive: 5,
  aiCreditsUsed: 1240,
  monthlyRevenue: 4520,
  revenueChange: 12,
  activityData: [
    { date: "Mon", value: 45 },
    { date: "Tue", value: 52 },
    { date: "Wed", value: 38 },
    { date: "Thu", value: 65 },
    { date: "Fri", value: 48 },
    { date: "Sat", value: 72 },
    { date: "Sun", value: 35 },
  ],
};

export function SchoolDetailPanel({
  school,
  isOpen,
  onClose,
}: SchoolDetailPanelProps) {
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
                <AvatarImage src={school.logoUrl} />
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
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-white/50">Last Billing</p>
                  <p className="text-lg font-semibold text-white">{mockSchoolDetails.lastBilling}</p>
                </div>
              </div>
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
                value="students"
                className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
              >
                Students
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Activity Chart */}
              <div className="md-glass-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-white">Activity</h3>
                  <span className="text-xs text-white/50">Last 7 days</span>
                </div>
                <div className="h-32 flex items-end gap-2">
                  {mockSchoolDetails.activityData.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-red-500/50 to-red-500/20 rounded-t"
                        style={{ height: `${(item.value / 80) * 100}%` }}
                      />
                      <span className="text-xs text-white/40">{item.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="md-glass-card p-4 space-y-3">
                <h3 className="text-sm font-medium text-white mb-3">Contact</h3>
                <div className="flex items-center gap-3 text-white/70">
                  <MapPin className="w-4 h-4 text-white/40" />
                  <span className="text-sm">{school.location}</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <Mail className="w-4 h-4 text-white/40" />
                  <span className="text-sm">{mockSchoolDetails.email}</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <Phone className="w-4 h-4 text-white/40" />
                  <span className="text-sm">{mockSchoolDetails.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <Calendar className="w-4 h-4 text-white/40" />
                  <span className="text-sm">Joined {mockSchoolDetails.joinedDate}</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="md-glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-white/50">Automation</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {mockSchoolDetails.automationsActive}
                  </p>
                  <p className="text-xs text-emerald-400">active</p>
                </div>
                <div className="md-glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-white/50">AI Credits</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {mockSchoolDetails.aiCreditsUsed.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/40">this month</p>
                </div>
              </div>

              {/* Revenue */}
              <div className="md-glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/50">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-white">
                      ${mockSchoolDetails.monthlyRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>+{mockSchoolDetails.revenueChange}%</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="students" className="mt-4">
              <div className="md-glass-card p-4">
                <p className="text-white/50 text-sm text-center py-8">
                  Student list will be loaded here
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              View Details
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
