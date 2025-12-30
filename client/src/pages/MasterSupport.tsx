import { useState } from "react";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  User,
  ArrowRight,
} from "lucide-react";
import { MasterDashboardLayout } from "@/components/MasterDashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data
const tickets = [
  {
    id: "TKT-001",
    subject: "Unable to process payments",
    school: "Dragon MMA Academy",
    priority: "high",
    status: "open",
    created: "2 hours ago",
    lastUpdate: "30 min ago",
  },
  {
    id: "TKT-002",
    subject: "Student check-in not working",
    school: "Eden Jiu-Jitsu",
    priority: "medium",
    status: "in_progress",
    created: "5 hours ago",
    lastUpdate: "1 hour ago",
  },
  {
    id: "TKT-003",
    subject: "Need help with automation setup",
    school: "Apex Karate Academy",
    priority: "low",
    status: "open",
    created: "1 day ago",
    lastUpdate: "3 hours ago",
  },
  {
    id: "TKT-004",
    subject: "Billing discrepancy",
    school: "Flexbox Martial Arts",
    priority: "high",
    status: "in_progress",
    created: "1 day ago",
    lastUpdate: "2 hours ago",
  },
  {
    id: "TKT-005",
    subject: "Feature request: Custom reports",
    school: "Iron Fist Dojo",
    priority: "low",
    status: "resolved",
    created: "2 days ago",
    lastUpdate: "1 day ago",
  },
  {
    id: "TKT-006",
    subject: "API integration help needed",
    school: "Elite Combat Sports",
    priority: "medium",
    status: "resolved",
    created: "3 days ago",
    lastUpdate: "2 days ago",
  },
];

const priorityStyles = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-amber-500/20 text-amber-400",
  low: "bg-blue-500/20 text-blue-400",
};

const statusStyles = {
  open: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Open" },
  in_progress: { bg: "bg-blue-500/20", text: "text-blue-400", label: "In Progress" },
  resolved: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Resolved" },
};

export default function MasterSupport() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const openTickets = tickets.filter((t) => t.status === "open").length;
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedToday = tickets.filter((t) => t.status === "resolved").length;

  return (
    <MasterDashboardLayout
      title="Support"
      subtitle="Manage support tickets and customer inquiries"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Open Tickets"
          value={openTickets}
          icon={<AlertCircle className="w-5 h-5" />}
          accentColor="amber"
        />
        <KPICard
          title="In Progress"
          value={inProgressTickets}
          icon={<Clock className="w-5 h-5" />}
          accentColor="blue"
        />
        <KPICard
          title="Resolved Today"
          value={resolvedToday}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="green"
        />
        <KPICard
          title="Avg. Response Time"
          value="2.4h"
          subtitle="Last 7 days"
          icon={<MessageSquare className="w-5 h-5" />}
          accentColor="purple"
        />
      </div>

      {/* Tickets Table */}
      <div className="md-glass-card">
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">Support Tickets</h3>
              <span className="px-2 py-0.5 text-xs bg-white/10 text-white/60 rounded-full">
                {filteredTickets.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 text-sm"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1d] border-white/10">
                  <SelectItem value="all" className="text-white">All Status</SelectItem>
                  <SelectItem value="open" className="text-white">Open</SelectItem>
                  <SelectItem value="in_progress" className="text-white">In Progress</SelectItem>
                  <SelectItem value="resolved" className="text-white">Resolved</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1d] border-white/10">
                  <SelectItem value="all" className="text-white">All Priority</SelectItem>
                  <SelectItem value="high" className="text-white">High</SelectItem>
                  <SelectItem value="medium" className="text-white">Medium</SelectItem>
                  <SelectItem value="low" className="text-white">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                  School
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                  Priority
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                  Last Update
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/50">
                    No tickets found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{ticket.subject}</p>
                        <p className="text-xs text-white/40">{ticket.id} • {ticket.created}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs bg-white/10 text-white/70">
                            {ticket.school.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white/80">{ticket.school}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2 py-1 text-xs rounded-full capitalize",
                          priorityStyles[ticket.priority as keyof typeof priorityStyles]
                        )}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2 py-1 text-xs rounded-full",
                          statusStyles[ticket.status as keyof typeof statusStyles].bg,
                          statusStyles[ticket.status as keyof typeof statusStyles].text
                        )}
                      >
                        {statusStyles[ticket.status as keyof typeof statusStyles].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/60">{ticket.lastUpdate}</td>
                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/60 hover:text-white hover:bg-white/5"
                      >
                        View
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MasterDashboardLayout>
  );
}
