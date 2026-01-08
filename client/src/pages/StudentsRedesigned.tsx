import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import BottomNavLayout from '../components/BottomNavLayout'
import StudentCommandBar from '../components/StudentCommandBar'
import StudentCard from '../components/StudentCard'
import StudentFilters from '../components/StudentFilters'
import AddStudentWizard from '../components/AddStudentWizard'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Plus, Users, UserPlus, ArrowRight } from 'lucide-react'

interface Student {
  id: number
  firstName: string
  lastName: string
  email?: string
  phone?: string
  beltRank?: string
  status: 'Active' | 'Inactive' | 'On Hold'
  program?: string
  photoUrl?: string
  membershipStatus?: string
  dateOfBirth?: string
  createdAt?: string
}

interface CommandBarStats {
  totalStudents: number
  activeToday: number
  atRisk: number
  inactive: number
  newThisMonth: number
  birthdaysThisWeek: number
  averageAttendance: number
}

export default function StudentsRedesigned({ onLogout, theme, toggleTheme }) {
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  
  // State management
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddWizard, setShowAddWizard] = useState(false)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [programFilter, setProgramFilter] = useState('')
  const [beltFilter, setBeltFilter] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [sortBy, setSortBy] = useState('last-seen')
  
  // Stats state
  const [stats, setStats] = useState<CommandBarStats>({
    totalStudents: 0,
    activeToday: 0,
    atRisk: 0,
    inactive: 0,
    newThisMonth: 0,
    birthdaysThisWeek: 0,
    averageAttendance: 0
  })

  // Fetch students and stats
  useEffect(() => {
    fetchStudents()
    fetchStats()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/students/stats')
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalStudents: data.total_students || 0,
          activeToday: data.active_students || 0,
          atRisk: data.overdue_payments || 0,
          inactive: data.inactive_students || 0,
          newThisMonth: data.new_this_month || 0,
          birthdaysThisWeek: 0,
          averageAttendance: 85
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Filter and sort students
  const filteredStudents = useCallback(() => {
    let filtered = [...students]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.firstName.toLowerCase().includes(query) ||
        s.lastName.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.phone?.includes(query)
      )
    }

    // Program filter
    if (programFilter) {
      filtered = filtered.filter(s => s.program === programFilter)
    }

    // Belt filter
    if (beltFilter) {
      filtered = filtered.filter(s => s.beltRank === beltFilter)
    }

    // Risk filter
    if (riskFilter) {
      if (riskFilter === 'At Risk') {
        filtered = filtered.filter(s => s.status === 'On Hold')
      } else if (riskFilter === 'Active' || riskFilter === 'Inactive') {
        filtered = filtered.filter(s => s.status === riskFilter)
      }
    }

    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
        break
      case 'belt-rank':
        const beltOrder = ['White Belt', 'Yellow Belt', 'Green Belt', 'Blue Belt', 'Brown Belt', 'Black Belt']
        filtered.sort((a, b) => {
          const indexA = beltOrder.indexOf(a.beltRank || 'White Belt')
          const indexB = beltOrder.indexOf(b.beltRank || 'White Belt')
          return indexA - indexB
        })
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        break
      case 'last-seen':
      default:
        // Keep original order or implement last-seen logic
        break
    }

    return filtered
  }, [students, searchQuery, programFilter, beltFilter, riskFilter, sortBy])

  const handleStudentCreated = useCallback(async (newStudent) => {
    await fetchStudents()
    await fetchStats()
    toast({
      title: 'Student Added',
      description: `${newStudent.firstName} ${newStudent.lastName} has been added to your roster.`,
    })
  }, [toast])

  const handleTileClick = (tileType: string) => {
    // Handle tile click - could filter or navigate
    console.log('Tile clicked:', tileType)
  }

  const handleCall = (studentId: number) => {
    toast({
      title: 'Call',
      description: `Calling student ${studentId}...`,
    })
  }

  const handleText = (studentId: number) => {
    toast({
      title: 'Text',
      description: `Texting student ${studentId}...`,
    })
  }

  const handleEmail = (studentId: number) => {
    toast({
      title: 'Email',
      description: `Emailing student ${studentId}...`,
    })
  }

  const handleNotes = (studentId: number) => {
    toast({
      title: 'Notes',
      description: `Opening notes for student ${studentId}...`,
    })
  }

  const handleAssignProgram = (studentId: number) => {
    toast({
      title: 'Assign Program',
      description: `Assigning program to student ${studentId}...`,
    })
  }

  const handlePromoteBelt = (studentId: number) => {
    toast({
      title: 'Promote Belt',
      description: `Promoting belt for student ${studentId}...`,
    })
  }

  const handleProfileClick = (studentId: number) => {
    // Navigate to student profile
    console.log('Profile clicked:', studentId)
  }

  const activeFilters = [programFilter, beltFilter, riskFilter, attendanceFilter].filter(Boolean).length

  const handleClearFilters = () => {
    setProgramFilter('')
    setBeltFilter('')
    setAttendanceFilter('')
    setRiskFilter('')
    setSearchQuery('')
  }

  const filtered = filteredStudents()

  return (
    <BottomNavLayout>
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Student Roster</h1>
            <p className="text-slate-400 mt-1">Manage and monitor your dojo students</p>
          </div>
          <Button
            onClick={() => setShowAddWizard(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>

        {/* Command Bar */}
        <StudentCommandBar
          stats={stats}
          onTileClick={handleTileClick}
          loading={loading}
        />

        {/* Filters */}
        <StudentFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          programFilter={programFilter}
          onProgramChange={setProgramFilter}
          beltFilter={beltFilter}
          onBeltChange={setBeltFilter}
          attendanceFilter={attendanceFilter}
          onAttendanceChange={setAttendanceFilter}
          riskFilter={riskFilter}
          onRiskChange={setRiskFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          activeFilters={activeFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Student List */}
        {filtered.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-lg border border-white/10 bg-slate-900/50">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-12 w-12 text-blue-500/60" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                <Plus className="h-5 w-5 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Your dojo roster will appear here</h3>
            <p className="text-slate-400 text-center max-w-md mb-6">
              {students.length === 0
                ? 'Add your first student to start tracking attendance, engagement, and progress.'
                : 'No students match your current filters. Try adjusting your search criteria.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setShowAddWizard(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Student
              </Button>
              {students.length === 0 && (
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/leads'}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Import from Leads
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              filtered.map(student => (
                <StudentCard
                  key={student.id}
                  id={student.id}
                  firstName={student.firstName}
                  lastName={student.lastName}
                  email={student.email}
                  phone={student.phone}
                  beltRank={student.beltRank}
                  status={student.status}
                  program={student.program}
                  photoUrl={student.photoUrl}
                  membershipStatus={student.membershipStatus}
                  lastCheckIn="2 days ago"
                  attendanceStreak={6}
                  indicators={{
                    atRisk: student.status === 'On Hold',
                    birthday: false,
                    overdue: false,
                    rankUpEligible: false,
                    attendanceDrop: false,
                    starStudent: false
                  }}
                  onCall={handleCall}
                  onText={handleText}
                  onEmail={handleEmail}
                  onNotes={handleNotes}
                  onAssignProgram={handleAssignProgram}
                  onPromoteBelt={handlePromoteBelt}
                  onProfileClick={handleProfileClick}
                />
              ))
            )}
          </div>
        )}

        {/* Add Student Wizard */}
        <AddStudentWizard
          open={showAddWizard}
          onOpenChange={setShowAddWizard}
          onStudentCreated={handleStudentCreated}
        />
      </div>
    </BottomNavLayout>
  )
}
