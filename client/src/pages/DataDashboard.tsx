import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  DollarSign,
  Activity,
  UserCheck,
  UserPlus,
  FileCheck,
  Calendar,
} from "lucide-react";

interface DashboardStats {
  studentCount: number;
  revenue: number;
  leadCount: number;
  classes: Array<{
    id: number;
    name: string;
    time: string;
    instructor: string;
  }>;
}

export default function DataDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [waivers, setWaivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats
        const statsRes = await fetch("/api/trpc/dashboard.stats");
        const statsData = await statsRes.json();
        console.log("Stats response:", statsData);
        
        if (statsData.result?.data) {
          setStats(statsData.result.data);
        }

        // Fetch kiosk data
        const checkInsRes = await fetch("/api/trpc/kiosk.checkIns");
        const checkInsData = await checkInsRes.json();
        console.log("CheckIns response:", checkInsData);
        
        if (checkInsData.result?.data) {
          setCheckIns(checkInsData.result.data);
        }

        const visitorsRes = await fetch("/api/trpc/kiosk.visitors");
        const visitorsData = await visitorsRes.json();
        console.log("Visitors response:", visitorsData);
        
        if (visitorsData.result?.data) {
          setVisitors(visitorsData.result.data);
        }

        const waiversRes = await fetch("/api/trpc/kiosk.waivers");
        const waiversData = await waiversRes.json();
        console.log("Waivers response:", waiversData);
        
        if (waiversData.result?.data) {
          setWaivers(waiversData.result.data);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            DojoFlow CRM Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time dojo management and analytics
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Students
              </CardTitle>
              <Users className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats?.studentCount ?? 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Active members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${stats?.revenue?.toLocaleString() ?? 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Total this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Leads
              </CardTitle>
              <Activity className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {stats?.leadCount ?? 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">In pipeline</p>
            </CardContent>
          </Card>
        </div>

        {/* Kiosk Activity */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Kiosk Activity Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {checkIns.length}
                  </div>
                  <div className="text-sm text-gray-600">Check-Ins</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {visitors.length}
                  </div>
                  <div className="text-sm text-gray-600">New Visitors</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {waivers.length}
                  </div>
                  <div className="text-sm text-gray-600">Waivers Signed</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-2xl">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.classes && stats.classes.length > 0 ? (
              <div className="space-y-4">
                {stats.classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r"
                  >
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {cls.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Instructor: {cls.instructor}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-blue-600">
                        {cls.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No classes scheduled for today
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
