import { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Zap,
  MessageSquare,
  Image,
  FileText,
  Bot,
  AlertTriangle,
} from "lucide-react";
import { MasterDashboardLayout } from "@/components/MasterDashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

// Mock data
const usageByFeature = [
  { feature: "Chat Completions", credits: 28450, percentage: 52, icon: MessageSquare, color: "text-blue-400" },
  { feature: "Image Generation", credits: 12840, percentage: 24, icon: Image, color: "text-purple-400" },
  { feature: "Document Analysis", credits: 8120, percentage: 15, icon: FileText, color: "text-emerald-400" },
  { feature: "Automations", credits: 4872, percentage: 9, icon: Bot, color: "text-amber-400" },
];

const dailyUsage = [
  { day: "Mon", credits: 7200 },
  { day: "Tue", credits: 8100 },
  { day: "Wed", credits: 6800 },
  { day: "Thu", credits: 9200 },
  { day: "Fri", credits: 8500 },
  { day: "Sat", credits: 5200 },
  { day: "Sun", credits: 4800 },
];

const topConsumers = [
  { name: "Iron Fist Dojo", credits: 8450, plan: "Enterprise", percentage: 85 },
  { name: "Elite Combat Sports", credits: 6200, plan: "Pro", percentage: 92 },
  { name: "Apex Karate Academy", credits: 5100, plan: "Pro", percentage: 76 },
  { name: "Flexbox Martial Arts", credits: 4800, plan: "Pro", percentage: 72 },
  { name: "Eden Jiu-Jitsu", credits: 4200, plan: "Growth", percentage: 95 },
];

const alerts = [
  { school: "Eden Jiu-Jitsu", message: "95% of monthly credits used", severity: "high" },
  { school: "Elite Combat Sports", message: "92% of monthly credits used", severity: "medium" },
];

export default function MasterAIUsage() {
  const [timeRange, setTimeRange] = useState("7d");
  const maxDaily = Math.max(...dailyUsage.map((d) => d.credits));

  return (
    <MasterDashboardLayout
      title="AI Usage"
      subtitle="Monitor AI credit consumption across all schools"
    >
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-8 space-y-3">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border",
                alert.severity === "high"
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-amber-500/10 border-amber-500/30"
              )}
            >
              <AlertTriangle
                className={cn(
                  "w-5 h-5",
                  alert.severity === "high" ? "text-red-400" : "text-amber-400"
                )}
              />
              <div className="flex-1">
                <p className="text-white font-medium">{alert.school}</p>
                <p className="text-sm text-white/60">{alert.message}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                View Details
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Credits Used"
          value="54,282"
          trend={{ value: 12, label: "vs last week", direction: "up" }}
          icon={<Sparkles className="w-5 h-5" />}
          accentColor="purple"
        />
        <KPICard
          title="Credits Available"
          value="713,560"
          subtitle="Platform pool"
          icon={<Zap className="w-5 h-5" />}
          accentColor="green"
        />
        <KPICard
          title="Avg. per School"
          value="335"
          trend={{ value: 8, label: "vs last week", direction: "up" }}
          icon={<Bot className="w-5 h-5" />}
          accentColor="blue"
        />
        <KPICard
          title="Cost This Month"
          value="$2,714"
          trend={{ value: 5, label: "vs last month", direction: "up" }}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Usage Chart */}
        <div className="md-glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Daily Usage</h3>
              <p className="text-sm text-white/50">Credits consumed per day</p>
            </div>
            <div className="flex items-center gap-2">
              {["7d", "30d", "90d"].map((range) => (
                <Button
                  key={range}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "text-white/60 hover:text-white hover:bg-white/5",
                    timeRange === range && "bg-purple-500/20 text-purple-400"
                  )}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
          <div className="h-48 flex items-end gap-3">
            {dailyUsage.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-purple-500/60 to-purple-500/20 rounded-t transition-all duration-300 hover:from-purple-500/80 hover:to-purple-500/40"
                  style={{ height: `${(item.credits / maxDaily) * 100}%` }}
                />
                <span className="text-xs text-white/40">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage by Feature */}
        <div className="md-glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Usage by Feature</h3>
          <div className="space-y-5">
            {usageByFeature.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-5 h-5", item.color)} />
                      <span className="text-white/80">{item.feature}</span>
                    </div>
                    <span className="text-white font-medium">
                      {item.credits.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        item.color.replace("text-", "bg-")
                      )}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Consumers */}
      <div className="md-glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Top AI Credit Consumers</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 text-sm font-medium text-white/50">School</th>
                <th className="text-left py-3 text-sm font-medium text-white/50">Plan</th>
                <th className="text-left py-3 text-sm font-medium text-white/50">Credits Used</th>
                <th className="text-left py-3 text-sm font-medium text-white/50">Usage</th>
                <th className="text-left py-3 text-sm font-medium text-white/50">Status</th>
              </tr>
            </thead>
            <tbody>
              {topConsumers.map((school, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 text-purple-400 text-xs">
                          {school.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium">{school.name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-white/10 text-white/70">
                      {school.plan}
                    </span>
                  </td>
                  <td className="py-4 text-white">{school.credits.toLocaleString()}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <Progress value={school.percentage} className="w-24 h-2" />
                      <span className="text-sm text-white/60">{school.percentage}%</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span
                      className={cn(
                        "px-2 py-1 text-xs rounded-full",
                        school.percentage >= 90
                          ? "bg-red-500/20 text-red-400"
                          : school.percentage >= 75
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      )}
                    >
                      {school.percentage >= 90
                        ? "Critical"
                        : school.percentage >= 75
                        ? "Warning"
                        : "Normal"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MasterDashboardLayout>
  );
}
