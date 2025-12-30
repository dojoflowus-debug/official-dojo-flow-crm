import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  Activity,
  Calendar,
} from "lucide-react";
import { MasterDashboardLayout } from "@/components/MasterDashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data for charts
const revenueData = [
  { month: "Jan", value: 32000 },
  { month: "Feb", value: 35000 },
  { month: "Mar", value: 38000 },
  { month: "Apr", value: 42000 },
  { month: "May", value: 45000 },
  { month: "Jun", value: 48000 },
  { month: "Jul", value: 52000 },
  { month: "Aug", value: 55000 },
  { month: "Sep", value: 58000 },
  { month: "Oct", value: 62000 },
  { month: "Nov", value: 65000 },
  { month: "Dec", value: 68520 },
];

const schoolGrowthData = [
  { month: "Jan", value: 120 },
  { month: "Feb", value: 125 },
  { month: "Mar", value: 132 },
  { month: "Apr", value: 138 },
  { month: "May", value: 142 },
  { month: "Jun", value: 148 },
  { month: "Jul", value: 152 },
  { month: "Aug", value: 155 },
  { month: "Sep", value: 158 },
  { month: "Oct", value: 160 },
  { month: "Nov", value: 162 },
  { month: "Dec", value: 162 },
];

const topSchools = [
  { name: "Iron Fist Dojo", students: 445, revenue: 8900, growth: 15 },
  { name: "Elite Combat Sports", students: 312, revenue: 6240, growth: 12 },
  { name: "Apex Karate Academy", students: 278, revenue: 5560, growth: 8 },
  { name: "Flexbox Martial Arts", students: 253, revenue: 5060, growth: 10 },
  { name: "Primefit Gym", students: 242, revenue: 4840, growth: 5 },
];

const planDistribution = [
  { plan: "Starter", count: 45, percentage: 28, color: "bg-blue-500" },
  { plan: "Growth", count: 72, percentage: 44, color: "bg-emerald-500" },
  { plan: "Pro", count: 35, percentage: 22, color: "bg-purple-500" },
  { plan: "Enterprise", count: 10, percentage: 6, color: "bg-amber-500" },
];

export default function MasterAnalytics() {
  const [timeRange, setTimeRange] = useState("12m");

  const maxRevenue = Math.max(...revenueData.map((d) => d.value));
  const maxSchools = Math.max(...schoolGrowthData.map((d) => d.value));

  return (
    <MasterDashboardLayout
      title="Analytics"
      subtitle="Platform performance and growth metrics"
    >
      {/* Time Range Filter */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-white/50" />
          <span className="text-white/70">Time Range:</span>
        </div>
        <div className="flex items-center gap-2">
          {["7d", "30d", "3m", "12m", "all"].map((range) => (
            <Button
              key={range}
              variant="ghost"
              size="sm"
              onClick={() => setTimeRange(range)}
              className={cn(
                "text-white/60 hover:text-white hover:bg-white/5",
                timeRange === range && "bg-red-500/20 text-red-400"
              )}
            >
              {range === "all" ? "All Time" : range.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Revenue"
          value="$68,520"
          trend={{ value: 12, label: "vs last month", direction: "up" }}
          icon={<DollarSign className="w-5 h-5" />}
          accentColor="green"
        />
        <KPICard
          title="New Schools"
          value="24"
          trend={{ value: 8, label: "vs last month", direction: "up" }}
          icon={<Building2 className="w-5 h-5" />}
          accentColor="blue"
        />
        <KPICard
          title="Churn Rate"
          value="2.4%"
          trend={{ value: 0.3, label: "vs last month", direction: "down" }}
          icon={<Activity className="w-5 h-5" />}
          accentColor="amber"
        />
        <KPICard
          title="Avg. Students/School"
          value="110"
          trend={{ value: 5, label: "vs last month", direction: "up" }}
          icon={<Users className="w-5 h-5" />}
          accentColor="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="md-glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Monthly Revenue</h3>
              <p className="text-sm text-white/50">Platform-wide MRR</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">+12% YoY</span>
            </div>
          </div>
          <div className="h-64 flex items-end gap-2">
            {revenueData.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-emerald-500/60 to-emerald-500/20 rounded-t transition-all duration-300 hover:from-emerald-500/80 hover:to-emerald-500/40"
                  style={{ height: `${(item.value / maxRevenue) * 100}%` }}
                />
                <span className="text-xs text-white/40">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* School Growth Chart */}
        <div className="md-glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">School Growth</h3>
              <p className="text-sm text-white/50">Total active schools</p>
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">+35% YoY</span>
            </div>
          </div>
          <div className="h-64 flex items-end gap-2">
            {schoolGrowthData.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-blue-500/60 to-blue-500/20 rounded-t transition-all duration-300 hover:from-blue-500/80 hover:to-blue-500/40"
                  style={{ height: `${(item.value / maxSchools) * 100}%` }}
                />
                <span className="text-xs text-white/40">{item.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Schools */}
        <div className="lg:col-span-2 md-glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Top Performing Schools</h3>
          <div className="space-y-4">
            {topSchools.map((school, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/20 text-red-400 font-semibold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-white">{school.name}</p>
                    <p className="text-sm text-white/50">{school.students} students</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-medium text-white">${school.revenue.toLocaleString()}</p>
                    <p className="text-xs text-white/50">MRR</p>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">+{school.growth}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="md-glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Plan Distribution</h3>
          <div className="space-y-4">
            {planDistribution.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70">{item.plan}</span>
                  <span className="text-white font-medium">{item.count} schools</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", item.color)}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Total Schools</span>
              <span className="text-white font-semibold">162</span>
            </div>
          </div>
        </div>
      </div>
    </MasterDashboardLayout>
  );
}
