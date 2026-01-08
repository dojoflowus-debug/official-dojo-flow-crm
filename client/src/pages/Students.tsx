import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// Components
import StudentCard from '@/components/StudentCard';

// Icons
import {
  Search,
  Filter,
  List,
  Map,
  BarChart3,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserPlus,
  ChevronRight,
  Phone,
  Mail,
  MessageSquare,
  X,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: string;
  beltRank?: string;
  program?: string;
  photoUrl?: string;
  latitude?: string;
  longitude?: string;
  createdAt?: string;
}

interface KPIMetric {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Active': 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  'At Risk': 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
  'Inactive': 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30',
  'On Hold': 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
  'Trial': 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
};

type ViewMode = 'list' | 'map' | 'segments' | 'analytics';

export default function StudentsDashboard() {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [programFilter, setProgramFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'needs-attention') {
      setStatusFilter('At Risk');
    } else if (filterParam === 'needs-followup') {
      setStatusFilter('On Hold');
    } else if (filterParam === 'overdue') {
      setStatusFilter('Inactive');
    }
  }, [searchParams]);

  // Fetch students with filters
  const { data: studentsData, isLoading: isLoadingStudents } = trpc.students.getListWithFilters.useQuery({
    page: currentPage,
    limit: 20,
    search: searchQuery || undefined,
    status: statusFilter || undefined,
    program: programFilter || undefined,
  });

  // Fetch analytics
  const { data: analyticsData, isLoading: isLoadingAnalytics } = trpc.students.getAnalytics.useQuery();

  // Fetch student detail when selected
  const { data: studentDetail } = trpc.students.getDetail.useQuery(
    { id: selectedStudent?.id || 0 },
    { enabled: !!selectedStudent }
  );

  // KPI Metrics
  const kpiMetrics: KPIMetric[] = useMemo(() => [
    {
      label: 'Total Students',
      value: analyticsData?.total || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Active',
      value: analyticsData?.active || 0,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'At Risk',
      value: analyticsData?.atRisk || 0,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Inactive',
      value: analyticsData?.inactive || 0,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-gray-600 dark:text-gray-400',
    },
  ], [analyticsData]);

  const students = studentsData?.students || [];
  const totalStudents = studentsData?.total || 0;
  const totalPages = Math.ceil(totalStudents / 20);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setTimeout(() => setSelectedStudent(null), 300);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Apple-style Hero Header */}
      <div className="sticky top-0 z-40 bg-background/50 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">Students</h1>
              <p className="text-muted-foreground mt-2">Manage your dojo's student roster and track progress</p>
            </div>
            {/* Command Center - Core Signals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {kpiMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 font-medium">{metric.label}</p>
                      <p className="text-3xl font-bold text-foreground group-hover:text-white transition-colors">{metric.value}</p>
                    </div>
                    <div className={cn('p-2.5 rounded-lg transition-all duration-300', metric.color)}>
                      {metric.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
          {/* View Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-white/[0.03] border border-white/10 backdrop-blur-sm">
              <TabsTrigger value="list" className="gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-foreground">
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-foreground">
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
              </TabsTrigger>
              <TabsTrigger value="segments" className="gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-foreground">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Segments</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-foreground">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            <Button className="gap-2 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="w-4 h-4" />
              Add Student
            </Button>
          </div>

          {/* List View */}
          <TabsContent value="list" className="space-y-4">
            {/* Search and Filters */}
            {/* Floating Search & Filter Bar */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 bg-transparent border-0 focus:ring-0 text-foreground placeholder-muted-foreground"
                />
              </div>

              <Select value={statusFilter} onValueChange={(v) => {
                setStatusFilter(v === 'all' ? '' : v);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full md:w-40 bg-transparent border-0 focus:ring-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="At Risk">At Risk</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="ghost" size="sm" className="gap-2 w-full md:w-auto text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all duration-200">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">More Filters</span>
              </Button>
            </div>

            {/* Students Card Grid - Premium Roster */}
            {isLoadingStudents ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <Users className="w-12 h-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No students found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <StudentCard
                    key={student.id}
                    id={student.id}
                    firstName={student.firstName}
                    lastName={student.lastName}
                    email={student.email}
                    phone={student.phone}
                    beltRank={student.beltRank || 'White Belt'}
                    status={student.status as 'Active' | 'Inactive' | 'On Hold'}
                    program={student.program}
                    photoUrl={student.photoUrl}
                    lastCheckIn={student.createdAt ? `Joined ${new Date(student.createdAt).toLocaleDateString()}` : undefined}
                    attendanceStreak={0}
                    progressToNextBelt={Math.floor(Math.random() * 100)}
                    indicators={{
                      atRisk: student.status === 'At Risk',
                    }}
                    onCall={() => console.log('Call', student.id)}
                    onText={() => console.log('Text', student.id)}
                    onEmail={() => console.log('Email', student.id)}
                    onNotes={() => console.log('Notes', student.id)}
                    onAssignProgram={() => console.log('Assign Program', student.id)}
                    onPromoteBelt={() => console.log('Promote Belt', student.id)}
                    onProfileClick={() => handleSelectStudent(student)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalStudents)} of {totalStudents}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

            {/* Map View */}
          <TabsContent value="map" className="space-y-4">
            <Card className="border-white/10 bg-white/[0.03] backdrop-blur-md h-96 flex items-center justify-center">
              <div className="text-center">
                <Map className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Map view coming soon</p>
              </div>
            </Card>
          </TabsContent>

          {/* Segments View */}
          <TabsContent value="segments" className="space-y-4">
            <Card className="border-white/10 bg-white/[0.03] backdrop-blur-md h-96 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Segments view coming soon</p>
              </div>
            </Card>
          </TabsContent>

          {/* Analytics View */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-white/10 bg-white/[0.03] backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-base">Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData?.statusBreakdown?.map((item: any) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <span className="text-sm">{item.status}</span>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.03] backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-base">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cancellation Requests</span>
                      <span className="font-semibold">{analyticsData?.cancellations || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Delinquent Tuition</span>
                      <span className="font-semibold">{analyticsData?.delinquent || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Student Detail Drawer */}
      {showDrawer && selectedStudent && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 transition-opacity"
            onClick={handleCloseDrawer}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-full md:w-96 bg-background border-l border-border/50 shadow-lg overflow-y-auto animate-in slide-in-from-right">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={selectedStudent.photoUrl} />
                    <AvatarFallback>
                      {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold truncate">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </h2>
                    <p className="text-xs text-muted-foreground truncate">{selectedStudent.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={handleCloseDrawer}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</p>
                <Badge
                  variant="outline"
                  className={cn(
                    'border',
                    STATUS_COLORS[selectedStudent.status as keyof typeof STATUS_COLORS] ||
                      'bg-gray-500/20 text-gray-700 dark:text-gray-400'
                  )}
                >
                  {selectedStudent.status}
                </Badge>
              </div>

              {/* Program & Belt Rank */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Program</p>
                  <p className="font-medium">{selectedStudent.program || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Belt Rank</p>
                  <p className="font-medium">{selectedStudent.beltRank || '—'}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</p>
                {selectedStudent.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm break-all">{selectedStudent.email}</p>
                  </div>
                )}
                {selectedStudent.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm">{selectedStudent.phone}</p>
                  </div>
                )}
              </div>

              {/* Attendance */}
              {studentDetail?.attendance && studentDetail.attendance.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Attendance</p>
                  <div className="space-y-2">
                    {studentDetail.attendance.slice(0, 5).map((att: any) => (
                      <div key={att.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{att.className}</span>
                        <Badge variant="outline" className="text-xs">
                          {att.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 space-y-2 border-t border-border/50">
                <Button className="w-full gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Send Message
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Phone className="w-4 h-4" />
                  Call
                </Button>
                <Button variant="outline" className="w-full">
                  Edit Student
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
