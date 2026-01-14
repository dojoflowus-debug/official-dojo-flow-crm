import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Users, Sparkles, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { MasterDashboardLayout } from "@/components/MasterDashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { HealthStatusCard } from "@/components/dashboard/HealthStatusCard";
import { SchoolsTable, type School } from "@/components/dashboard/SchoolsTable";
import { SchoolDetailPanel } from "@/components/dashboard/SchoolDetailPanel";
import { trpc } from "@/lib/trpc";

export default function MasterDashboard() {
  const navigate = useNavigate();
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Fetch real stats from API - handle errors gracefully
  const { data: stats, isLoading: statsLoading, error: statsError } = trpc.masterDashboard.getStats.useQuery(
    undefined,
    { retry: false }
  );
  
  // Fetch real schools from API - handle errors gracefully
  const { data: schoolsData, isLoading: schoolsLoading, error: schoolsError } = trpc.masterDashboard.getSchools.useQuery(
    { status: "all", limit: 50 },
    { retry: false }
  );

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

  // Show loading state
  if (statsLoading || schoolsLoading) {
    return (
      <MasterDashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <span className="ml-3 text-zinc-400">Loading dashboard data...</span>
        </div>
      </MasterDashboardLayout>
    );
  }

  // Handle authentication/authorization errors - show empty state instead of blocking
  const hasError = statsError || schoolsError;
  
  // Default values - show zeros when no data or error
  const dashboardStats = stats || {
    totalSchools: 0,
    activeSchools: 0,
    totalStudents: 0,
    aiUsage: 0,
    healthyCount: 0,
    warningCount: 0,
    riskCount: 0,
  };

  const schools: School[] = schoolsData?.schools || [];

  // Only show alert banner if there are at-risk schools
  const alertBanner = dashboardStats.riskCount > 0 ? {
    message: `${dashboardStats.riskCount} school${dashboardStats.riskCount > 1 ? 's' : ''} need attention. Check your at risk list now.`,
    action: {
      label: "View",
      onClick: () => navigate("/master/schools/at-risk"),
    },
  } : undefined;

  return (
    <MasterDashboardLayout
      title="Dashboard"
      alertBanner={alertBanner}
    >
      {/* Show auth warning if there's an error */}
      {hasError && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-200 font-medium">Authentication Required</p>
            <p className="text-amber-200/70 text-sm mt-1">
              Please log in as a platform admin to view real organization data. Currently showing empty state.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Schools"
          value={dashboardStats.totalSchools}
          icon={<Building2 className="w-5 h-5" />}
          accentColor="red"
        />
        <KPICard
          title="Active Schools"
          value={dashboardStats.activeSchools}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="green"
        />
        <KPICard
          title="Total Students"
          value={dashboardStats.totalStudents.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          accentColor="blue"
        />
        <KPICard
          title="AI Usage"
          value={dashboardStats.aiUsage.toLocaleString()}
          subtitle="Total credits used"
          icon={<Sparkles className="w-5 h-5" />}
          accentColor="purple"
        />
      </div>

      {/* Health Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <HealthStatusCard
          status="healthy"
          count={dashboardStats.healthyCount}
          label="Healthy"
          onClick={() => navigate("/master/schools?status=Active")}
        />
        <HealthStatusCard
          status="warning"
          count={dashboardStats.warningCount}
          label="Needs Attention"
          onClick={() => navigate("/master/schools?status=Warning")}
        />
        <HealthStatusCard
          status="risk"
          count={dashboardStats.riskCount}
          label="At Risk"
          onClick={() => navigate("/master/schools/at-risk")}
        />
      </div>

      {/* Schools Table - Real Data */}
      {schools.length > 0 ? (
        <SchoolsTable
          schools={schools}
          onSchoolClick={handleSchoolClick}
          onViewDetails={handleViewDetails}
        />
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
          <Building2 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No Schools Enrolled Yet</h3>
          <p className="text-zinc-500 max-w-md mx-auto">
            When schools sign up for DojoFlow, they will appear here. You'll be able to monitor their activity, subscription status, and AI usage.
          </p>
        </div>
      )}

      {/* School Detail Panel */}
      <SchoolDetailPanel
        school={selectedSchool}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
      />
    </MasterDashboardLayout>
  );
}
