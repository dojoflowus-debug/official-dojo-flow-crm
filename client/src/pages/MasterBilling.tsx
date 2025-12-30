import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
} from "lucide-react";
import { MasterDashboardLayout } from "@/components/MasterDashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data
const recentTransactions = [
  { id: 1, school: "Iron Fist Dojo", amount: 299, status: "completed", plan: "Enterprise", date: "Dec 30, 2024" },
  { id: 2, school: "Elite Combat Sports", amount: 149, status: "completed", plan: "Pro", date: "Dec 30, 2024" },
  { id: 3, school: "Eden Jiu-Jitsu", amount: 79, status: "pending", plan: "Growth", date: "Dec 29, 2024" },
  { id: 4, school: "Apex Karate Academy", amount: 149, status: "completed", plan: "Pro", date: "Dec 29, 2024" },
  { id: 5, school: "Dragon MMA Academy", amount: 79, status: "failed", plan: "Growth", date: "Dec 28, 2024" },
  { id: 6, school: "Phoenix Kickboxing", amount: 49, status: "completed", plan: "Starter", date: "Dec 28, 2024" },
  { id: 7, school: "Harmony Yoga Studio", amount: 79, status: "completed", plan: "Growth", date: "Dec 27, 2024" },
  { id: 8, school: "Primefit Gym", amount: 49, status: "completed", plan: "Starter", date: "Dec 27, 2024" },
];

const revenueByPlan = [
  { plan: "Starter", revenue: 8820, schools: 45, color: "bg-blue-500" },
  { plan: "Growth", revenue: 22680, schools: 72, color: "bg-emerald-500" },
  { plan: "Pro", revenue: 20860, schools: 35, color: "bg-purple-500" },
  { plan: "Enterprise", revenue: 16160, schools: 10, color: "bg-amber-500" },
];

const failedPayments = [
  { school: "Dragon MMA Academy", amount: 79, reason: "Card declined", attempts: 2 },
  { school: "Zen Martial Arts", amount: 79, reason: "Insufficient funds", attempts: 1 },
  { school: "Phoenix Kickboxing", amount: 49, reason: "Card expired", attempts: 3 },
];

export default function MasterBilling() {
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredTransactions = statusFilter === "all"
    ? recentTransactions
    : recentTransactions.filter((t) => t.status === statusFilter);

  const totalRevenue = revenueByPlan.reduce((sum, p) => sum + p.revenue, 0);

  return (
    <MasterDashboardLayout
      title="Billing"
      subtitle="Revenue tracking and payment management"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Monthly Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          trend={{ value: 12, label: "vs last month", direction: "up" }}
          icon={<DollarSign className="w-5 h-5" />}
          accentColor="green"
        />
        <KPICard
          title="Active Subscriptions"
          value="162"
          trend={{ value: 5, label: "new this month", direction: "up" }}
          icon={<CreditCard className="w-5 h-5" />}
          accentColor="blue"
        />
        <KPICard
          title="Failed Payments"
          value="3"
          subtitle="$207 at risk"
          icon={<AlertCircle className="w-5 h-5" />}
          accentColor="red"
        />
        <KPICard
          title="Avg. Revenue/School"
          value="$423"
          trend={{ value: 8, label: "vs last month", direction: "up" }}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="purple"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue by Plan */}
        <div className="md-glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Revenue by Plan</h3>
          <div className="space-y-4">
            {revenueByPlan.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", item.color)} />
                    <span className="text-white font-medium">{item.plan}</span>
                  </div>
                  <span className="text-white font-semibold">
                    ${item.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-white/50">
                  <span>{item.schools} schools</span>
                  <span>{Math.round((item.revenue / totalRevenue) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Total MRR</span>
              <span className="text-2xl font-bold text-white">
                ${totalRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Failed Payments */}
        <div className="md-glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Failed Payments</h3>
            <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full">
              {failedPayments.length} pending
            </span>
          </div>
          <div className="space-y-4">
            {failedPayments.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{item.school}</span>
                  <span className="text-red-400 font-semibold">${item.amount}</span>
                </div>
                <p className="text-sm text-white/50 mb-3">{item.reason}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">
                    {item.attempts} retry attempt{item.attempts > 1 ? "s" : ""}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="md-glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4 mr-3" />
              Export Revenue Report
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <CreditCard className="w-4 h-4 mr-3" />
              View All Subscriptions
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <AlertCircle className="w-4 h-4 mr-3" />
              Manage Failed Payments
            </Button>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-medium">Payment Health</span>
            </div>
            <p className="text-sm text-white/60">
              98.1% success rate this month
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="md-glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1d] border-white/10">
                <SelectItem value="all" className="text-white">All Status</SelectItem>
                <SelectItem value="completed" className="text-white">Completed</SelectItem>
                <SelectItem value="pending" className="text-white">Pending</SelectItem>
                <SelectItem value="failed" className="text-white">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 text-sm font-medium text-white/50">School</th>
                <th className="text-left py-3 text-sm font-medium text-white/50">Plan</th>
                <th className="text-left py-3 text-sm font-medium text-white/50">Amount</th>
                <th className="text-left py-3 text-sm font-medium text-white/50">Status</th>
                <th className="text-left py-3 text-sm font-medium text-white/50">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 text-xs">
                          {tx.school.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium">{tx.school}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-white/10 text-white/70">
                      {tx.plan}
                    </span>
                  </td>
                  <td className="py-4 text-white font-medium">${tx.amount}</td>
                  <td className="py-4">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 text-sm",
                        tx.status === "completed" && "text-emerald-400",
                        tx.status === "pending" && "text-amber-400",
                        tx.status === "failed" && "text-red-400"
                      )}
                    >
                      {tx.status === "completed" && <CheckCircle2 className="w-4 h-4" />}
                      {tx.status === "pending" && <Clock className="w-4 h-4" />}
                      {tx.status === "failed" && <AlertCircle className="w-4 h-4" />}
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 text-white/60">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MasterDashboardLayout>
  );
}
