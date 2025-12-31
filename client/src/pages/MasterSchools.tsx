import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MasterDashboardLayout } from "@/components/MasterDashboardLayout";
import { SchoolsTable, type School } from "@/components/dashboard/SchoolsTable";
import { SchoolDetailPanel } from "@/components/dashboard/SchoolDetailPanel";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function MasterSchools() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const statusFilter = searchParams.get("status") as "all" | "Active" | "Warning" | "Risk" | null;

  // Fetch real schools from the database
  const { data, isLoading, error } = trpc.masterDashboard.getSchools.useQuery({
    status: statusFilter || "all",
    limit: 100,
    offset: 0,
  });

  const handleSchoolClick = (school: School) => {
    setSelectedSchool(school);
    setIsPanelOpen(true);
  };

  const handleViewDetails = (school: School) => {
    navigate(`/master/schools/${school.id}`);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedSchool(null), 300);
  };

  // Get schools from API response
  const schools: School[] = data?.schools || [];
  const totalCount = data?.total || 0;

  return (
    <MasterDashboardLayout
      title="Schools"
      subtitle={`${totalCount} schools${statusFilter && statusFilter !== "all" ? ` with status: ${statusFilter}` : ""}`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading schools...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-destructive mb-2">Failed to load schools</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      ) : schools.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground mb-2">No schools found</p>
          <p className="text-sm text-muted-foreground">
            {statusFilter && statusFilter !== "all"
              ? `No schools with status "${statusFilter}"`
              : "Schools will appear here once they sign up"}
          </p>
        </div>
      ) : (
        <SchoolsTable
          schools={schools}
          onSchoolClick={handleSchoolClick}
          onViewDetails={handleViewDetails}
        />
      )}

      <SchoolDetailPanel
        school={selectedSchool}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
      />
    </MasterDashboardLayout>
  );
}
