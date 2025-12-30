import { useState } from "react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface School {
  id: number;
  name: string;
  owner: string;
  ownerAvatar?: string;
  location: string;
  plan: "Starter" | "Growth" | "Pro" | "Enterprise";
  status: "Active" | "Warning" | "Risk" | "Inactive";
  studentCount: number;
  lastActivity?: string;
  logoUrl?: string;
}

interface SchoolsTableProps {
  schools: School[];
  onSchoolClick?: (school: School) => void;
  onViewDetails?: (school: School) => void;
  isLoading?: boolean;
}

const planStyles = {
  Starter: "md-plan-starter",
  Growth: "md-plan-growth",
  Pro: "md-plan-pro",
  Enterprise: "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300",
};

const statusStyles = {
  Active: "md-badge-active",
  Warning: "md-badge-warning",
  Risk: "md-badge-risk",
  Inactive: "bg-white/10 text-white/50",
};

export function SchoolsTable({
  schools,
  onSchoolClick,
  onViewDetails,
  isLoading,
}: SchoolsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter schools
  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || school.status === statusFilter;

    const matchesPlan = planFilter === "all" || school.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSchools.length / itemsPerPage);
  const paginatedSchools = filteredSchools.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="md-table">
      {/* Table Header with Search and Filters */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Schools</h3>
            <span className="px-2 py-0.5 text-xs bg-white/10 text-white/60 rounded-full">
              {filteredSchools.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search school name, email, city"
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
                <SelectItem value="Active" className="text-white">Active</SelectItem>
                <SelectItem value="Warning" className="text-white">Warning</SelectItem>
                <SelectItem value="Risk" className="text-white">At Risk</SelectItem>
                <SelectItem value="Inactive" className="text-white">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Plan Filter */}
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1d] border-white/10">
                <SelectItem value="all" className="text-white">All Plans</SelectItem>
                <SelectItem value="Starter" className="text-white">Starter</SelectItem>
                <SelectItem value="Growth" className="text-white">Growth</SelectItem>
                <SelectItem value="Pro" className="text-white">Pro</SelectItem>
                <SelectItem value="Enterprise" className="text-white">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="md-table-header">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                School Name
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                Owner
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                Location
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                Plan
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                Students
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="md-table-row animate-pulse">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10" />
                      <div className="h-4 w-32 bg-white/10 rounded" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-24 bg-white/10 rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-28 bg-white/10 rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-16 bg-white/10 rounded-full" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-16 bg-white/10 rounded-full" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-12 bg-white/10 rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-8 w-20 bg-white/10 rounded" />
                  </td>
                </tr>
              ))
            ) : paginatedSchools.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-white/50">
                  No schools found matching your criteria
                </td>
              </tr>
            ) : (
              paginatedSchools.map((school) => (
                <tr
                  key={school.id}
                  className="md-table-row cursor-pointer"
                  onClick={() => onSchoolClick?.(school)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 rounded-lg border border-white/10">
                        <AvatarImage src={school.logoUrl} />
                        <AvatarFallback className="rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 text-sm">
                          {school.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{school.name}</p>
                        <p className="text-xs text-white/40">
                          {school.lastActivity || "Active today"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={school.ownerAvatar} />
                        <AvatarFallback className="text-xs bg-white/10 text-white/70">
                          {school.owner.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white/80">{school.owner}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-white/60">
                      <MapPin className="w-4 h-4" />
                      <span>{school.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("md-badge", planStyles[school.plan])}>
                      {school.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("md-badge", statusStyles[school.status])}>
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          school.status === "Active" && "bg-emerald-400",
                          school.status === "Warning" && "bg-amber-400",
                          school.status === "Risk" && "bg-red-400",
                          school.status === "Inactive" && "bg-white/40"
                        )}
                      />
                      {school.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">{school.studentCount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails?.(school);
                        }}
                        className="text-white/60 hover:text-white hover:bg-white/5"
                      >
                        View
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/40 hover:text-white hover:bg-white/5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#1a1a1d] border-white/10"
                        >
                          <DropdownMenuItem className="text-white/70 hover:text-white hover:bg-white/5">
                            Edit School
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-white/70 hover:text-white hover:bg-white/5">
                            View Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-white/70 hover:text-white hover:bg-white/5">
                            Contact Owner
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            Suspend School
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
          <p className="text-sm text-white/50">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredSchools.length)} of{" "}
            {filteredSchools.length} schools
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "w-8 h-8",
                    currentPage === pageNum
                      ? "bg-red-500/20 text-red-400"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="text-white/40">...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className={cn(
                    "w-8 h-8",
                    currentPage === totalPages
                      ? "bg-red-500/20 text-red-400"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  {totalPages}
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchoolsTable;
