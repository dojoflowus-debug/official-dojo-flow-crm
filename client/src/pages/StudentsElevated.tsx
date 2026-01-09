import { useSearchParams } from 'react-router-dom'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import BottomNavLayout from '@/components/BottomNavLayout'
import { useState, useMemo, useEffect } from 'react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

// Components
import StudentCardElevated from '@/components/StudentCardElevated'
import StudentMap from '@/components/StudentMap'
import DojoStatusStrip from '@/components/DojoStatusStrip'

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
  UserPlus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CreditCard,
  Flame,
} from 'lucide-react'

interface Student {
  id: number
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  status: string
  beltRank?: string | null
  program?: string
  photoUrl?: string | null
  latitude?: string | number
  longitude?: string | number
  createdAt?: string
  address?: string
}

interface KPIMetric {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}

type ViewMode = 'list' | 'map' | 'segments' | 'analytics'

function StudentsElevatedContent() {
  const [searchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [programFilter, setProgramFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)

  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam === 'needs-attention') {
      setStatusFilter('At Risk')
    } else if (filterParam === 'needs-followup') {
      setStatusFilter('On Hold')
    } else if (filterParam === 'overdue') {
      setStatusFilter('Inactive')
    } else {
      setStatusFilter('all')
    }
  }, [searchParams])

  // Fetch students with filters
  const { data: studentsData, isLoading: isLoadingStudents, error: studentsError } = trpc.students.getListWithFilters.useQuery({
    page: currentPage,
    limit: 20,
    search: searchQuery || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter || undefined,
    program: programFilter || undefined,
  })

  // Fetch analytics
  const { data: analyticsData, isLoading: isLoadingAnalytics, error: analyticsError } = trpc.students.getAnalytics.useQuery()
  
  useEffect(() => {
    if (studentsError) console.error('Students error:', studentsError)
    if (analyticsError) console.error('Analytics error:', analyticsError)
  }, [studentsError, analyticsError])

  // Fetch student detail when selected
  const { data: studentDetail } = trpc.students.getDetail.useQuery(
    { id: selectedStudent?.id || 0 },
    { enabled: !!selectedStudent }
  )

  const students = studentsData?.students || []
  const totalStudents = (studentsData?.total || 0) as number
  const totalPages = Math.ceil((totalStudents as number) / 20)

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student)
    setShowDrawer(true)
  }

  const handleCloseDrawer = () => {
    setShowDrawer(false)
    setTimeout(() => setSelectedStudent(null), 300)
  }

  const pageContent = (
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      {/* Dojo Atmosphere Layer - Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient - warm dojo tones */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        
        {/* Cinematic lighting - subtle light rays */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-30 blur-3xl" />
        
        {/* Warm accent glow - bottom right */}
        <div className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl opacity-30" />
        
        {/* Cool accent glow - top left */}
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl opacity-20" />
        
        {/* Subtle vignette effect */}
        <div className="absolute inset-0 bg-gradient-to-edges from-transparent via-transparent to-black/20 pointer-events-none" />
        
        {/* Breathing animation background - very subtle */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent opacity-0 animate-breathing" />
      </div>

      {/* Header Section - Enhanced */}
      <div className="sticky top-0 z-30 bg-background/30 backdrop-blur-2xl border-b border-white/5">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Title with atmospheric feel */}
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">Students</h1>
              <p className="text-sm text-muted-foreground">Your dojo's living roster. Growth, progression, and presence.</p>
            </div>

            {/* Dojo Status Strip - Visual hierarchy hero */}
            <DojoStatusStrip
              totalStudents={analyticsData?.total || 0}
              activeStudents={analyticsData?.active || 0}
              atRiskStudents={analyticsData?.atRisk || 0}
              retentionRate={analyticsData?.total ? Math.round((analyticsData.active / analyticsData.total) * 100) : 0}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* View Tabs and Controls */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <TabsList className="grid w-full md:w-auto grid-cols-4 bg-white/[0.04] border border-white/10">
              <TabsTrigger value="list" className="gap-2">
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
              </TabsTrigger>
              <TabsTrigger value="segments" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Segments</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            <Button 
              className="gap-2 w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-600/50 hover:shadow-red-600/70 transition-all duration-300"
              onClick={() => setShowAddStudentModal(true)}
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </Button>
          </div>

          {/* List View */}
          <TabsContent value="list" className="space-y-6">
            {/* Search and Filters - Floating toolbar style */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 shadow-lg shadow-black/20">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10 bg-transparent border-0 focus:ring-0 text-foreground placeholder-muted-foreground"
                />
              </div>

              <Select value={statusFilter || 'all'} onValueChange={(v) => {
                setStatusFilter(v === 'all' ? '' : v)
                setCurrentPage(1)
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

            {/* Students Grid - Hero section */}
            {isLoadingStudents ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading students...</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
                {students.map((student) => (
                  <StudentCardElevated
                    key={student.id}
                    id={student.id}
                    firstName={student.firstName}
                    lastName={student.lastName}
                    email={student.email || undefined}
                    phone={student.phone || undefined}
                    beltRank={student.beltRank || 'White Belt'}
                    status={student.status as any}
                    program={student.program || undefined}
                    photoUrl={student.photoUrl || undefined}
                    lastCheckIn={student.createdAt ? `Joined ${new Date(student.createdAt).toLocaleDateString()}` : undefined}
                    attendanceStreak={Math.floor(Math.random() * 15)}
                    progressToNextBelt={Math.floor(Math.random() * 100)}
                    indicators={{
                      atRisk: (student.status as any) === 'At Risk',
                      rankUpEligible: Math.random() > 0.7,
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
              <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-white/5">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalStudents as number)} of {(totalStudents as number) || 0}
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
            <StudentMap students={students as any} />
          </TabsContent>

          {/* Segments View */}
          <TabsContent value="segments" className="space-y-4">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Segments view coming soon</p>
            </div>
          </TabsContent>

          {/* Analytics View */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Analytics view coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )

  return pageContent
}

export default function StudentsElevated() {
  return (
    <BottomNavLayout>
      <StudentsElevatedContent />
    </BottomNavLayout>
  )
}
