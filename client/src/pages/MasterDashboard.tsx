import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Users, Sparkles, TrendingUp } from "lucide-react";
import { MasterDashboardLayout } from "@/components/MasterDashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { HealthStatusCard } from "@/components/dashboard/HealthStatusCard";
import { SchoolsTable, type School } from "@/components/dashboard/SchoolsTable";
import { SchoolDetailPanel } from "@/components/dashboard/SchoolDetailPanel";

// Mock data for demonstration
const mockSchools: School[] = [
  {
    id: 1,
    name: "Eden Jiu-Jitsu",
    owner: "David Kim",
    location: "Los Angeles, CA",
    plan: "Growth",
    status: "Active",
    studentCount: 228,
    lastActivity: "View code",
  },
  {
    id: 2,
    name: "Primefit Gym",
    owner: "David Kim",
    location: "Los Angeles, CA",
    plan: "Starter",
    status: "Active",
    studentCount: 242,
    lastActivity: "Renew ago",
  },
  {
    id: 3,
    name: "Harmony Yoga Studio",
    owner: "Donald Kim",
    location: "Los Angeles, CA",
    plan: "Growth",
    status: "Active",
    studentCount: 224,
    lastActivity: "Vnirn ago",
  },
  {
    id: 4,
    name: "Apex Karate Academy",
    owner: "David Kim",
    location: "San Francisco, CA",
    plan: "Pro",
    status: "Active",
    studentCount: 278,
    lastActivity: "10 Timer ago",
  },
  {
    id: 5,
    name: "Flexbox Martial Arts",
    owner: "Smith MMA",
    location: "San Francisco, CA",
    plan: "Pro",
    status: "Active",
    studentCount: 253,
    lastActivity: "11 hours ago",
  },
  {
    id: 6,
    name: "Dragon MMA Academy",
    owner: "James Chen",
    location: "Seattle, WA",
    plan: "Growth",
    status: "Warning",
    studentCount: 156,
    lastActivity: "3 days ago",
  },
  {
    id: 7,
    name: "Phoenix Kickboxing",
    owner: "Sarah Johnson",
    location: "Phoenix, AZ",
    plan: "Starter",
    status: "Risk",
    studentCount: 89,
    lastActivity: "1 week ago",
  },
  {
    id: 8,
    name: "Elite Combat Sports",
    owner: "Mike Thompson",
    location: "Denver, CO",
    plan: "Pro",
    status: "Active",
    studentCount: 312,
    lastActivity: "2 hours ago",
  },
  {
    id: 9,
    name: "Zen Martial Arts",
    owner: "Lisa Park",
    location: "Portland, OR",
    plan: "Growth",
    status: "Warning",
    studentCount: 134,
    lastActivity: "5 days ago",
  },
  {
    id: 10,
    name: "Iron Fist Dojo",
    owner: "Robert Lee",
    location: "Austin, TX",
    plan: "Enterprise",
    status: "Active",
    studentCount: 445,
    lastActivity: "Just now",
  },
];

const mockStats = {
  totalSchools: 162,
  activeSchools: 141,
  totalStudents: 17945,
  aiUsage: 54282,
  healthyCount: 138,
  warningCount: 18,
  riskCount: 5,
};

export default function MasterDashboard() {
  const navigate = useNavigate();
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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

  return (
    <MasterDashboardLayout
      title="Dashboard"
      alertBanner={{
        message: "5 schools need attention. Check your at risk list now.",
        action: {
          label: "View",
          onClick: () => navigate("/master/schools/at-risk"),
        },
      }}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Schools"
          value={mockStats.totalSchools}
          icon={<Building2 className="w-5 h-5" />}
          accentColor="red"
        />
        <KPICard
          title="Active Schools"
          value={mockStats.activeSchools}
          trend={{ value: 2, label: "this week", direction: "up" }}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="green"
        />
        <KPICard
          title="Total Students"
          value={mockStats.totalStudents.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          accentColor="blue"
        />
        <KPICard
          title="AI Usage"
          value={mockStats.aiUsage.toLocaleString()}
          subtitle="713,560 this month"
          icon={<Sparkles className="w-5 h-5" />}
          accentColor="purple"
        />
      </div>

      {/* Health Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <HealthStatusCard
          status="healthy"
          count={mockStats.healthyCount}
          label="Healthy"
          onClick={() => navigate("/master/schools?status=Active")}
        />
        <HealthStatusCard
          status="warning"
          count={mockStats.warningCount}
          label="Needs Attention"
          onClick={() => navigate("/master/schools?status=Warning")}
        />
        <HealthStatusCard
          status="risk"
          count={mockStats.riskCount}
          label="At Risk"
          onClick={() => navigate("/master/schools/at-risk")}
        />
      </div>

      {/* Schools Table */}
      <SchoolsTable
        schools={mockSchools}
        onSchoolClick={handleSchoolClick}
        onViewDetails={handleViewDetails}
      />

      {/* School Detail Panel */}
      <SchoolDetailPanel
        school={selectedSchool}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
      />
    </MasterDashboardLayout>
  );
}
