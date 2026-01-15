import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import BottomNavLayout from '../components/BottomNavLayout'
import AddStudentWizard from '../components/AddStudentWizard'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Plus,
  Filter,
  Download,
  Mail,
  Phone,
  Award,
  Calendar,
  DollarSign,
  Loader2,
  Edit,
  Trash2,
  CreditCard,
  User,
  Users,
  UserPlus,
  ArrowRight,
  ChevronDown,
  Heart,
  TrendingUp,
  AlertCircle,
  MapPin,
} from 'lucide-react'

export default function StudentsRedesign({ onLogout, theme, toggleTheme }) {
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(() => {
    const filter = searchParams.get('filter')
    return filter === 'needs-attention' ? 'on_hold' : 'all'
  })
  const [membershipFilter, setMembershipFilter] = useState('all')
  const [showAddWizard, setShowAddWizard] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [students, setStudents] = useState([])
  const [stats, setStats] = useState({
    total_students: 0,
    active_students: 0,
    overdue_payments: 0,
    new_this_month: 0,
    birthdays_this_month: 0,
    at_risk_students: 0,
  })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    belt_rank: 'White Belt',
    membership_status: 'Paid',
    status: 'Active'
  })
  const [paymentData, setPaymentData] = useState({
    card_number: '',
    card_holder: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    billing_cycle: 'Monthly',
    billing_amount: '',
    pass_fees_to_customer: false
  })
  const [viewMode, setViewMode] = useState('list') // 'list', 'map', 'segments', 'analytics'

  // Fetch students and stats
  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/students/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchStudents()
      await fetchStats()
      setLoading(false)
    }
    loadData()
  }, [])

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchQuery || 
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.belt_rank.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter
    const matchesMembership = membershipFilter === 'all' || student.membership_status === membershipFilter
    
    return matchesSearch && matchesStatus && matchesMembership
  })

  // Color utilities
  const getBeltColor = (belt) => {
    const colors = {
      'White Belt': 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
      'Yellow Belt': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      'Orange Belt': 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
      'Green Belt': 'bg-green-500/20 text-green-300 border border-green-500/30',
      'Blue Belt': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      'Brown Belt': 'bg-amber-700/20 text-amber-300 border border-amber-700/30',
      'Black Belt': 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    }
    return colors[belt] || colors['White Belt']
  }

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-green-500/20 text-green-300 border border-green-500/30',
      'Inactive': 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
      'On Hold': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    }
    return colors[status] || colors['Inactive']
  }

  const getMembershipColor = (membership) => {
    const colors = {
      'Paid': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      'Free Trial': 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      'Overdue': 'bg-red-500/20 text-red-300 border border-red-500/30',
      'Paid Trial': 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    }
    return colors[membership] || colors['Paid']
  }

  // Modal handlers
  const openEditModal = (student) => {
    setSelectedStudent(student)
    setFormData({
      name: `${student.first_name} ${student.last_name}`,
      email: student.email,
      phone: student.phone,
      date_of_birth: student.date_of_birth,
      street_address: student.street_address,
      city: student.city,
      state: student.state,
      zip_code: student.zip_code,
      belt_rank: student.belt_rank,
      membership_status: student.membership_status,
      status: student.status
    })
    setShowEditModal(true)
  }

  const openPaymentModal = (student) => {
    setSelectedStudent(student)
    setShowPaymentModal(true)
  }

  const openDeleteDialog = (student) => {
    setSelectedStudent(student)
    setShowDeleteDialog(true)
  }

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        alert('Student deleted successfully!')
        window.location.reload(true)
      } else {
        const error = await response.json()
        alert(`Error deleting student: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Failed to delete student. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Belt Rank', 'Status', 'Membership', 'Last Attendance']
    const rows = filteredStudents.map(student => [
      `${student.first_name} ${student.last_name}`,
      student.email,
      student.phone,
      student.belt_rank,
      student.status,
      student.membership_status,
      student.last_attendance ? new Date(student.last_attendance).toLocaleDateString() : 'N/A'
    ])
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <ManagementLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ManagementLayout>
    )
  }

  return (
    <ManagementLayout>
      <div className="space-y-6 pb-8">
        {/* Hero Header */}
        <div className="space-y-2">
          <h1 className="text-hero text-foreground">Students</h1>
          <p className="text-caption">Manage your dojo's student roster and track progress</p>
        </div>

        {/* Floating Search Bar */}
        <div className="floating-search">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search students, email, or belt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="floating-search-input w-full"
            />
          </div>
        </div>

        {/* Command Center - Core Signals */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Active Today */}
          <div className="soft-card glass-lift">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-caption mb-2">Active Today</p>
                <p className="text-2xl font-bold text-foreground">{stats.active_students}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <Calendar className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </div>

          {/* At Risk */}
          <div className="soft-card glass-lift">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-caption mb-2">At Risk</p>
                <p className="text-2xl font-bold text-foreground">{stats.at_risk_students}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </div>

          {/* Birthdays */}
          <div className="soft-card glass-lift">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-caption mb-2">Birthdays</p>
                <p className="text-2xl font-bold text-foreground">{stats.birthdays_this_month}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Heart className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Attendance */}
          <div className="soft-card glass-lift">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-caption mb-2">Attendance</p>
                <p className="text-2xl font-bold text-foreground">{Math.round((stats.active_students / Math.max(stats.total_students, 1)) * 100)}%</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Insights Panel */}
        <div className="soft-card">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="w-full flex items-center justify-between motion-snappy"
          >
            <h3 className="text-subtitle text-foreground">Insights & Metrics</h3>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                showInsights ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showInsights && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-caption">Total Students</p>
                  <p className="text-lg font-semibold text-foreground">{stats.total_students}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-caption">New This Month</p>
                  <p className="text-lg font-semibold text-foreground">{stats.new_this_month}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-caption">Overdue Payments</p>
                  <p className="text-lg font-semibold text-red-400">{stats.overdue_payments}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-caption">Membership Rate</p>
                  <p className="text-lg font-semibold text-foreground">
                    {Math.round((stats.active_students / Math.max(stats.total_students, 1)) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="blur-filter-bar">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-transparent border-0 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={membershipFilter} onValueChange={setMembershipFilter}>
            <SelectTrigger className="w-32 bg-transparent border-0 text-sm">
              <SelectValue placeholder="Membership" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Memberships</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Free Trial">Free Trial</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={exportToCSV}
            className="ml-auto text-xs"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 border-b border-white/5 pb-3">
          {['list', 'map', 'segments', 'analytics'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 text-sm font-medium transition-all duration-200 capitalize ${
                viewMode === mode
                  ? 'text-primary border-b-2 border-primary -mb-3'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Student Roster - Visual Hero */}
        <div className="space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="soft-card flex flex-col items-center justify-center py-16 px-4">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-12 w-12 text-primary/60" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Plus className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-title text-foreground mb-2">No students yet</h3>
              <p className="text-caption text-center max-w-md mb-6">
                Add your first student to start tracking attendance, engagement, and progress.
              </p>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => setShowAddWizard(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Student
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-caption">
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                </p>
                <Button
                  className="bg-primary hover:bg-primary/90 h-9"
                  onClick={() => setShowAddWizard(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Roster Cards */}
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="soft-card glass-lift group cursor-pointer"
                >
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {student.photo_url ? (
                        <img
                          src={student.photo_url}
                          alt={`${student.first_name} ${student.last_name}`}
                          className="w-14 h-14 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border border-white/10">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="text-subtitle text-foreground truncate">
                            {student.first_name} {student.last_name}
                          </h4>
                          <p className="text-caption">
                            {student.age} years old
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBeltColor(student.belt_rank)}`}>
                            {student.belt_rank}
                          </span>
                        </div>
                      </div>

                      {/* Contact & Status */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{student.phone}</span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                          {student.status}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMembershipColor(student.membership_status)}`}>
                          {student.membership_status}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(student)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPaymentModal(student)}
                        className="h-8 w-8 p-0"
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(student)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Add Student Wizard */}
      {showAddWizard && (
        <AddStudentWizard
          onClose={() => setShowAddWizard(false)}
          onSuccess={() => {
            fetchStudents()
            fetchStats()
            setShowAddWizard(false)
          }}
        />
      )}

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedStudent?.first_name} {selectedStudent?.last_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStudent}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagementLayout>
  )
}
