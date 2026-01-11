import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import BottomNavLayout from '@/components/BottomNavLayout';

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
import { AddStudentModal } from '@/components/AddStudentModalContent';
import StudentMap from '@/components/StudentMap';
import { StudentNotesDrawer } from '@/components/StudentNotesDrawer';
import { StudentEditDrawer } from '@/components/StudentEditDrawer';

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
  AlertTriangle,
  CreditCard,
  Calendar,
} from 'lucide-react';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  status: 'Active' | 'Inactive' | 'On Hold' | 'At Risk' | string;
  beltRank?: string | null;
  program?: string;
  photoUrl?: string | null;
  latitude?: string | number;
  longitude?: string | number;
  createdAt?: string;
  address?: string;
  dateOfBirth?: string | null;
  age?: number | null;
  organizationId?: number | null;
}

interface KPIMetric {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

const STATUS_COLORS: Record<string, string> = {
  'Active': 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  'At Risk': 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
  'Inactive': 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30',
  'On Hold': 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
  'Trial': 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
};

type ViewMode = 'list' | 'map' | 'segments' | 'analytics';

// Reason badges for "needs-attention" filter
const AT_RISK_REASONS = [
  { icon: <TrendingDown className="w-3 h-3" />, label: 'Attendance Drop', color: 'bg-red-500/20 text-red-700' },
  { icon: <CreditCard className="w-3 h-3" />, label: 'Overdue Payment', color: 'bg-orange-500/20 text-orange-700' },
  { icon: <AlertTriangle className="w-3 h-3" />, label: 'Cancellation Pending', color: 'bg-yellow-500/20 text-yellow-700' },
];

function StudentsDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
  
    if (filterParam === 'needs-attention') {
      setStatusFilter('At Risk');
    } else if (filterParam === 'needs-followup') {
      setStatusFilter('On Hold');
    } else if (filterParam === 'overdue') {
      setStatusFilter('Inactive');
    } else {
      setStatusFilter('all');
    }
  }, [searchParams]);

  // Fetch students with filters
  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: 20,
    search: searchQuery || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter || undefined,
    program: programFilter || undefined,
  }), [currentPage, searchQuery, statusFilter, programFilter]);
  
  console.log('[Students] Query params:', queryParams, 'statusFilter:', statusFilter);
  const { data: studentsData, isLoading: isLoadingStudents, error: studentsError } = trpc.students.getListWithFilters.useQuery(queryParams);

  // Fetch analytics
  const { data: analyticsData, isLoading: isLoadingAnalytics, error: analyticsError } = trpc.students.getAnalytics.useQuery(undefined);
  
  useEffect(() => {
    if (studentsError) console.error('Students error:', studentsError);
    if (analyticsError) console.error('Analytics error:', analyticsError);
  }, [studentsError, analyticsError]);

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
      label: 'Retention Rate',
      value: analyticsData?.total ? Math.round((analyticsData.active / analyticsData.total) * 100) : 0,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-purple-600 dark:text-purple-400',
    },
  ], [analyticsData]);

  const students = studentsData?.students || [];
  const totalStudents = Number(studentsData?.total || 0);
  const totalPages = Math.ceil(totalStudents / 20);

  const handleSelectStudent = (student: Student) => {
    navigate(`/students/${student.id}`);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setTimeout(() => setSelectedStudent(null), 300);
  };

  const pageContent = (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Section */}
      <div className="sticky top-0 z-30 bg-background/50 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Students</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your dojo's student roster and track progress</p>
            </div>

            {/* KPI Metrics Strip - Horizontal */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {kpiMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-lg p-3 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 group cursor-pointer"
                  onClick={() => {
                    if (metric.label === 'At Risk') {
                      setStatusFilter('At Risk');
                      setCurrentPage(1);
                    } else if (metric.label === 'Active') {
                      setStatusFilter('Active');
                      setCurrentPage(1);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-medium">{metric.label}</p>
                      <p className="text-2xl font-bold text-foreground group-hover:text-white transition-colors">{metric.value}{metric.label === 'Retention Rate' ? '%' : ''}</p>
                    </div>
                    <div className={cn('p-2 rounded-lg transition-all duration-300', metric.color)}>
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
        {/* View Mode Switcher & Add Button */}
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

            <Button 
              className="gap-2 w-full md:w-auto bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setShowAddStudentModal(true)}
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </Button>
          </div>

          {/* List View */}
          <TabsContent value="list" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-lg p-4 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300">
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
                console.log('[Students] Status filter changed to:', v);
                setStatusFilter(v);
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

            {/* Students Table/Cards */}
            {isLoadingStudents ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading students...</p>
              </div>
            ) : studentsError ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <AlertCircle className="w-12 h-12 text-red-500/50" />
                <p className="text-muted-foreground">Error loading students: {studentsError?.message || 'Unknown error'}</p>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                {statusFilter === 'At Risk' ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-green-500/50" />
                    <p className="text-muted-foreground">No students currently need attention. Great job.</p>
                  </>
                ) : (
                  <>
                    <Users className="w-12 h-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No students found</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Table Header */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-lg text-xs font-semibold text-muted-foreground">
                  <div className="col-span-3">Student</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Attendance</div>
                  <div className="col-span-2">Last Attended</div>
                  <div className="col-span-1">Tuition</div>
                  <div className="col-span-2">Actions</div>
                </div>

                {/* Table Rows */}
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-4 bg-white/[0.03] border border-white/10 rounded-lg hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200 items-center group cursor-pointer"
                    onClick={() => handleSelectStudent(student)}
                  >
                    {/* Student Name & Avatar */}
                    <div className="col-span-3 flex items-center gap-3">
                      <Avatar className="w-10 h-10 ring-2 ring-white/10">
                        <AvatarImage src={student.photoUrl} />
                        <AvatarFallback>{`${student.firstName?.charAt(0) || ''}${student.lastName?.charAt(0) || ''}`}</AvatarFallback>
                      </Avatar>
                    <div>
                      <p className="font-medium text-sm">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-muted-foreground">{student.beltRank ?? 'White Belt'}</p>
                    </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <Badge className={cn('text-xs', STATUS_COLORS[student.status] || STATUS_COLORS['Active'])}>
                        {student.status}
                      </Badge>
                      {statusFilter === 'At Risk' && student.status === 'At Risk' && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {AT_RISK_REASONS.slice(0, 2).map((reason, idx) => (
                            <Badge key={idx} variant="outline" className={cn('text-xs', reason.color)}>
                              {reason.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Attendance */}
                    <div className="col-span-2">
                      <p className="text-sm font-medium">92%</p>
                      <p className="text-xs text-muted-foreground">4% above avg</p>
                    </div>

                    {/* Last Attended */}
                    <div className="col-span-2">
                      <p className="text-sm">04/23/2024</p>
                      <p className="text-xs text-muted-foreground">2 days ago</p>
                    </div>

                    {/* Tuition Indicator */}
                    <div className="col-span-1 flex justify-center">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CreditCard className="w-3 h-3 text-green-500" />
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="col-span-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-8 h-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student);
                          setShowEditDrawer(true);
                        }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {students.map((student) => (
                    <StudentCard
                      key={student.id}
                      id={student.id}
                      firstName={student.firstName}
                      lastName={student.lastName}
                      email={student.email || undefined}
                      phone={student.phone || undefined}
                      beltRank={student.beltRank || 'White Belt'}
                      status={(student.status as any) || 'Active' as 'Active' | 'Inactive' | 'On Hold'}
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
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                                <div className="flex items-center justify-between gap-4 mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalStudents)} of {totalStudents || 0}
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
            {students.length === 0 ? (
              <Card className="border-white/10 bg-white/[0.03] backdrop-blur-md">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center space-y-4">
                    <Map className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Map view needs student addresses or geocoded locations</h3>
                      <p className="text-sm text-muted-foreground mt-2">Add student addresses to visualize their geographic distribution and identify high-potential areas for advertising.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4">
                      <Button variant="outline" className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Add Address Field
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Import CSV
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <StudentMap students={students} />
            )}
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
                      <span className="text-sm">Pending Students</span>
                      <span className="font-semibold">{analyticsData?.pending || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Inactive Students</span>
                      <span className="font-semibold">{analyticsData?.inactive || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Student Detail Drawer */}
      {/* Add Student Modal */}
      <AddStudentModal 
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSuccess={() => {
          // Refetch students list after creating new student
          window.location.reload();
        }}
      />

      <StudentNotesDrawer
        studentId={selectedStudent?.id || 0}
        studentName={`${selectedStudent?.firstName} ${selectedStudent?.lastName}`}
        studentData={{
          firstName: selectedStudent?.firstName || undefined,
          lastName: selectedStudent?.lastName || undefined,
          beltRank: selectedStudent?.beltRank || undefined,
          program: selectedStudent?.program || undefined,
          status: selectedStudent?.status || undefined,
          photoUrl: selectedStudent?.photoUrl || undefined,
          attendancePercentage: 0,
          lastAttended: 'Never',
        }}
        isOpen={showDrawer && !!selectedStudent}
        onClose={handleCloseDrawer}
      />

      <StudentEditDrawer
        studentId={selectedStudent?.id || 0}
        studentData={{
          firstName: selectedStudent?.firstName,
          lastName: selectedStudent?.lastName,
          email: selectedStudent?.email || undefined,
          phone: selectedStudent?.phone || undefined,
          beltRank: selectedStudent?.beltRank || undefined,
          program: selectedStudent?.program || undefined,
          status: selectedStudent?.status || undefined,
          photoUrl: selectedStudent?.photoUrl || undefined,
        }}
        isOpen={showEditDrawer && !!selectedStudent}
        onClose={() => setShowEditDrawer(false)}
        onSave={() => {
          setShowEditDrawer(false);
          window.location.reload();
        }}
      />
    </div>
  );

  return <BottomNavLayout>{pageContent}</BottomNavLayout>;
}

export default StudentsDashboard;
