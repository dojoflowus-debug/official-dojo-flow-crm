import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Components
import { AddStudentModal } from '@/components/AddStudentModalContent';
import { StudentNotesDrawer } from '@/components/StudentNotesDrawer';
import { StudentEditDrawer } from '@/components/StudentEditDrawer';
import { DeleteStudentModal } from '@/components/DeleteStudentModal';

// Icons
import {
  Search,
  UserPlus,
  MoreVertical,
  Users,
  CheckCircle2,
  Clock,
  UserX,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Eye,
} from 'lucide-react';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  beltRank?: string | null;
  program?: string | null;
  photoUrl?: string | null;
  createdAt?: string;
  dateOfBirth?: string | null;
  age?: number | null;
  guardianName?: string | null;
  guardianEmail?: string | null;
  guardianPhone?: string | null;
  organizationId?: number | null;
}

// Belt dot colors
const BELT_DOT_COLORS: Record<string, string> = {
  'White Belt': 'bg-slate-300 border border-slate-400',
  'No Belt': 'bg-slate-200 border border-slate-300',
  'Yellow Belt': 'bg-yellow-400',
  'Orange Belt': 'bg-orange-400',
  'Green Belt': 'bg-green-500',
  'Blue Belt': 'bg-blue-500',
  'Purple Belt': 'bg-purple-500',
  'Brown Belt': 'bg-amber-700',
  'Red Belt': 'bg-red-500',
  'Probationary Black': 'bg-slate-700',
  'Black Belt': 'bg-slate-900',
};

const STATUS_STYLES: Record<string, string> = {
  'Active': 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  'Inactive': 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400',
  'On Hold': 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  'At Risk': 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  'Trial': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  'Cancelled': 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
};

function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function formatJoinDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

function getInitials(first: string, last: string): string {
  return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase() || '?';
}

function StudentsDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'needs-attention') setStatusFilter('At Risk');
    else if (filterParam === 'needs-followup') setStatusFilter('On Hold');
    else if (filterParam === 'overdue') setStatusFilter('Inactive');
    else setStatusFilter('all');
  }, [searchParams]);

  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: 25,
    search: searchQuery || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    program: programFilter === 'all' ? undefined : programFilter,
  }), [currentPage, searchQuery, statusFilter, programFilter]);

  const { data: studentsData, isLoading, refetch } = trpc.students.getListWithFilters.useQuery(queryParams);
  const { data: analyticsData } = trpc.students.getAnalytics.useQuery(undefined);
  const { data: programsList = [] } = trpc.programs.list.useQuery();

  const students: Student[] = studentsData?.students || [];
  const totalStudents = Number(studentsData?.total || 0);
  const totalPages = Math.ceil(totalStudents / 25);

  const handleRefresh = () => {
    utils.students.getListWithFilters.invalidate();
    utils.students.getAnalytics.invalidate();
  };

  const handleViewProfile = (student: Student) => {
    navigate(`/students/${student.id}`);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setTimeout(() => setSelectedStudent(null), 300);
  };

  // Stat cards data
  const stats = [
    {
      label: 'Total',
      value: analyticsData?.total ?? 0,
      icon: <Users className="w-5 h-5 text-blue-500" />,
    },
    {
      label: 'Active',
      value: analyticsData?.active ?? 0,
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    },
    {
      label: 'Pending',
      value: analyticsData?.pending ?? 0,
      icon: <Clock className="w-5 h-5 text-yellow-500" />,
    },
    {
      label: 'Inactive',
      value: analyticsData?.inactive ?? 0,
      icon: <UserX className="w-5 h-5 text-gray-400" />,
    },
  ];

  return (
    <div className="min-h-full bg-background pb-24">
      {/* Page Header */}
      <div className="px-4 md:px-8 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Members &amp; Students</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Active paying members — each entry is a parent enrolled on behalf of their student</p>
          </div>
          <Button
            className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            onClick={() => setShowAddStudentModal(true)}
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3"
            >
              <div className="shrink-0">{stat.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-2xl font-bold leading-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-4 md:px-8 py-4 flex flex-col md:flex-row gap-3 items-start md:items-center border-b border-border/30">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by parent, student name, or email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-9 w-full"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={programFilter} onValueChange={(v) => { setProgramFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {(programsList as any[]).map((p: any) => (
                <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full md:w-36">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
              <SelectItem value="At Risk">At Risk</SelectItem>
              <SelectItem value="Trial">Trial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="px-4 md:px-8 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3 text-muted-foreground">
            <Users className="w-12 h-12 opacity-30" />
            <p>No students found</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[2fr_2fr_2.5fr_1.5fr_1.5fr_0.7fr_1fr_1.2fr_40px] gap-0 bg-muted/40 border-b border-border px-4 py-2.5">
              {['Member (Parent)', 'Student', 'Contact', 'Program', 'Belt', 'Age', 'Status', 'Joined', ''].map((col, i) => (
                <div key={i} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{col}</div>
              ))}
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border/50">
              {students.map((student) => {
                const age = student.age ?? calculateAge(student.dateOfBirth);
                const beltDot = BELT_DOT_COLORS[student.beltRank || 'White Belt'] || BELT_DOT_COLORS['White Belt'];
                const memberName = student.guardianName || `${student.firstName} ${student.lastName}`;
                const memberInitials = student.guardianName
                  ? student.guardianName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  : getInitials(student.firstName, student.lastName);

                return (
                  <div
                    key={student.id}
                    className="hidden md:grid grid-cols-[2fr_2fr_2.5fr_1.5fr_1.5fr_0.7fr_1fr_1.2fr_40px] gap-0 px-4 py-3 hover:bg-muted/30 transition-colors items-center cursor-pointer"
                    onClick={() => handleViewProfile(student)}
                  >
                    {/* Member (Parent) */}
                    <div className="flex items-center gap-2.5 min-w-0 pr-3">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={student.photoUrl || undefined} />
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                          {memberInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">{memberName}</span>
                    </div>

                    {/* Student */}
                    <div className="text-sm truncate pr-3">
                      {student.firstName} {student.lastName}
                    </div>

                    {/* Contact */}
                    <div className="pr-3 min-w-0">
                      {student.email && (
                        <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                      )}
                      {student.phone && (
                        <p className="text-xs text-muted-foreground">{student.phone}</p>
                      )}
                      {!student.email && !student.phone && (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </div>

                    {/* Program */}
                    <div className="text-sm text-muted-foreground truncate pr-3">
                      {student.program || '—'}
                    </div>

                    {/* Belt */}
                    <div className="flex items-center gap-2 pr-3">
                      <span className={cn('w-3 h-3 rounded-full shrink-0', beltDot)} />
                      <span className="text-sm truncate">{student.beltRank || 'No Belt'}</span>
                    </div>

                    {/* Age */}
                    <div className="text-sm text-muted-foreground">
                      {age !== null ? `${age} yrs` : '—'}
                    </div>

                    {/* Status */}
                    <div>
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        STATUS_STYLES[student.status] || STATUS_STYLES['Active']
                      )}>
                        {student.status}
                      </span>
                    </div>

                    {/* Joined */}
                    <div className="text-sm text-muted-foreground">
                      {formatJoinDate(student.createdAt)}
                    </div>

                    {/* Actions */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewProfile(student)}>
                            <Eye className="w-4 h-4 mr-2" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedStudent(student);
                            setShowEditDrawer(true);
                          }}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedStudent(student);
                            setShowDrawer(true);
                          }}>
                            <Users className="w-4 h-4 mr-2" /> Notes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => {
                              setStudentToDelete(student);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}

              {/* Mobile Card View */}
              {students.map((student) => {
                const age = student.age ?? calculateAge(student.dateOfBirth);
                return (
                  <div
                    key={`mob-${student.id}`}
                    className="md:hidden flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer"
                    onClick={() => handleViewProfile(student)}
                  >
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={student.photoUrl || undefined} />
                      <AvatarFallback className="text-sm font-semibold">
                        {getInitials(student.firstName, student.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.email || student.phone || '—'}</p>
                    </div>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                      STATUS_STYLES[student.status] || STATUS_STYLES['Active']
                    )}>
                      {student.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * 25 + 1}–{Math.min(currentPage * 25, totalStudents)} of {totalStudents}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSuccess={() => {
          setShowAddStudentModal(false);
          handleRefresh();
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
          handleRefresh();
        }}
      />
      {/* Secure Delete Modal */}
      {studentToDelete && (
        <DeleteStudentModal
          open={showDeleteModal}
          onOpenChange={(open) => {
            setShowDeleteModal(open);
            if (!open) setStudentToDelete(null);
          }}
          studentId={studentToDelete.id}
          studentName={`${studentToDelete.firstName} ${studentToDelete.lastName}`}
          onDeleted={() => {
            setStudentToDelete(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}

export default StudentsDashboard;
