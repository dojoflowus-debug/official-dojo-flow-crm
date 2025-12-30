import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MasterDashboardLayout } from "@/components/MasterDashboardLayout";
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

export default function MasterSchools() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const statusFilter = searchParams.get("status");

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

  // Filter schools based on URL params
  const filteredSchools = statusFilter
    ? mockSchools.filter((s) => s.status === statusFilter)
    : mockSchools;

  return (
    <MasterDashboardLayout
      title="Schools"
      subtitle={`${filteredSchools.length} schools${statusFilter ? ` with status: ${statusFilter}` : ""}`}
    >
      <SchoolsTable
        schools={filteredSchools}
        onSchoolClick={handleSchoolClick}
        onViewDetails={handleViewDetails}
      />

      <SchoolDetailPanel
        school={selectedSchool}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
      />
    </MasterDashboardLayout>
  );
}
