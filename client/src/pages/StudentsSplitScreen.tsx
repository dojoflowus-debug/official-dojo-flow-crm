import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { trpc } from '../lib/trpc'
import { useTheme } from '@/contexts/ThemeContext'
import BottomNavLayout from '@/components/BottomNavLayout'
import LeafletMap, { StudentMarker, LeafletMapHandle } from '../components/LeafletMap'
import MapOverlay from '../components/MapOverlay'
import StudentCardOverlay from '../components/StudentCardOverlay'
import ResizableDivider from '../components/ResizableDivider'
import ViewModeToggle, { ViewMode } from '../components/ViewModeToggle'
import AddressAutocomplete from '../components/AddressAutocomplete'
import PhoneInput from '../components/PhoneInput'
import StudentModal from '../components/StudentModal'
import NotesDrawer from '../components/NotesDrawer'
import Breadcrumb, { BreadcrumbItem } from '../components/Breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
  Check,
  X,
  User,
  Camera,
  Upload,
  Users,
  TrendingUp,
  MapPin,
  Activity,
  Target,
  Maximize2,
  Minimize2,
  ChevronDown,
  ArrowLeft
} from 'lucide-react'

// Types
interface Student {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  belt_rank: string
  status: string
  membership_status: string
  street_address?: string
  city?: string
  state?: string
  zip_code?: string
  photo_url?: string
  age?: number
  last_attendance?: string
  lat?: number
  lng?: number
  program?: string
  guardian_name?: string
  guardian_relationship?: string
  guardian_phone?: string
  guardian_email?: string
}

interface Stats {
  total_students: number
  active_students: number
  overdue_payments: number
  new_this_month: number
}

// Belt color helper
function getBeltColor(belt: string): string {
  const colors: Record<string, string> = {
    'White Belt': 'bg-white text-gray-800 border-gray-300',
    'Yellow Belt': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Orange Belt': 'bg-orange-100 text-orange-800 border-orange-300',
    'Green Belt': 'bg-green-100 text-green-800 border-green-300',
    'Blue Belt': 'bg-blue-100 text-blue-800 border-blue-300',
    'Purple Belt': 'bg-purple-100 text-purple-800 border-purple-300',
    'Brown Belt': 'bg-amber-100 text-amber-800 border-amber-300',
    'Black Belt': 'bg-gray-900 text-white border-gray-700',
  }
  return colors[belt] || 'bg-gray-100 text-gray-800 border-gray-300'
}

// Status color helper
function getStatusColor(status: string): string {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800'
    case 'Inactive':
      return 'bg-gray-100 text-gray-800'
    case 'Pending Cancel':
      return 'bg-yellow-100 text-yellow-800'
    case 'Cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Membership color helper
function getMembershipColor(status: string): string {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-800'
    case 'Overdue':
      return 'bg-red-100 text-red-800'
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Student Card Component
function StudentCard({ 
  student, 
  onClick,
  isHighlighted,
  schoolLogo,
  isDarkMode
}: { 
  student: Student
  onClick: () => void
  isHighlighted?: boolean
  schoolLogo?: string | null
  isDarkMode?: boolean
}) {
  // Calculate last attendance (mock for now)
  const getLastAttendance = () => {
    const days = Math.floor(Math.random() * 7)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  // Status dot color
  const getStatusDot = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-500'
      case 'on hold': return 'bg-yellow-500'
      case 'inactive': return 'bg-red-500'
      default: return 'bg-slate-400'
    }
  }

  return (
    <div 
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 cursor-pointer transition-all duration-200 ease-out hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99] active:shadow-md ${isDarkMode ? 'bg-[#18181A] hover:border-white/20' : 'bg-white hover:border-slate-300'} ${
        isHighlighted ? 'ring-2 ring-primary shadow-lg border-primary' : isDarkMode ? 'border-white/10 shadow-sm' : 'border-slate-200 shadow-sm'
      }`}
      style={{ borderRadius: '12px' }}
    >
      <div className="flex items-center gap-3">
        {/* School Logo - Small badge */}
        {schoolLogo && (
          <img 
            src={schoolLogo} 
            alt="School Logo"
            className="w-6 h-6 object-contain flex-shrink-0 opacity-60"
          />
        )}
        
        {/* Circle Photo */}
        {student.photo_url ? (
          <img 
            src={student.photo_url} 
            alt={`${student.first_name} ${student.last_name}`}
            className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
          />
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border flex-shrink-0 ${isDarkMode ? 'bg-white/10 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
            <User className={`h-5 w-5 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
          </div>
        )}
        
        {/* Name & Program */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium text-sm truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {student.first_name} {student.last_name}
            </h4>
            {/* Status Dot */}
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(student.status)}`} />
          </div>
          <p className={`text-xs truncate ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
            {student.program || 'General'}
          </p>
        </div>
        
        {/* Belt Rank */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${getBeltColor(student.belt_rank)}`}>
          {student.belt_rank?.replace(' Belt', '') || 'White'}
        </span>
        
        {/* Membership Tag */}
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getMembershipColor(student.membership_status)}`}>
          {student.membership_status || 'Standard'}
        </span>
        
        {/* Last Attendance */}
        <span className="text-xs text-slate-400 flex-shrink-0 hidden sm:block">
          {getLastAttendance()}
        </span>
      </div>
    </div>
  )
}

// Stat filter type
type StatFilter = 'active' | 'pending' | 'cancelled' | 'new' | null

// Stats Strip Component with Apple-style Arrow Navigation
function StatsStrip({ 
  stats, 
  selectedStat, 
  onStatSelect,
  isDarkMode 
}: { 
  stats: Stats
  selectedStat: StatFilter
  onStatSelect: (stat: StatFilter) => void
  isDarkMode?: boolean
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  
  const statItems: { label: string; value: number | string; icon: any; color: string; filterKey: StatFilter }[] = [
    { label: 'Active Students', value: stats.active_students, icon: Users, color: 'text-green-600 bg-green-50', filterKey: 'active' },
    { label: 'Pending Cancel', value: 0, icon: Calendar, color: 'text-yellow-600 bg-yellow-50', filterKey: 'pending' },
    { label: 'Cancelled', value: 0, icon: X, color: 'text-red-600 bg-red-50', filterKey: 'cancelled' },
    { label: 'Retention Rate', value: '94%', icon: TrendingUp, color: 'text-blue-600 bg-blue-50', filterKey: null },
    { label: 'New Enrollments', value: stats.new_this_month, icon: Plus, color: 'text-purple-600 bg-purple-50', filterKey: 'new' },
    { label: 'Attendance Rate', value: '87%', icon: Activity, color: 'text-teal-600 bg-teal-50', filterKey: null },
    { label: 'Average Distance', value: '3.2 mi', icon: MapPin, color: 'text-orange-600 bg-orange-50', filterKey: null },
    { label: 'Belt Progress', value: '12', icon: Target, color: 'text-indigo-600 bg-indigo-50', filterKey: null },
  ]
  
  // Check scroll position to show/hide arrows
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 5)
    }
  }, [])
  
  // Scroll by one page (width of visible tiles)
  const scrollByPage = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (container) {
      const pageWidth = container.clientWidth * 0.8 // Scroll 80% of visible width
      const scrollAmount = direction === 'left' ? -pageWidth : pageWidth
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }
  
  // Update scroll position on mount and scroll
  useEffect(() => {
    checkScrollPosition()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollPosition)
      return () => container.removeEventListener('scroll', checkScrollPosition)
    }
  }, [checkScrollPosition])

  return (
    <div className="relative">
      {/* Left Arrow */}
      <button
        onClick={() => scrollByPage('left')}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border shadow-sm flex items-center justify-center transition-all duration-200 hover:shadow-md ${isDarkMode ? 'bg-[#18181A]/95 border-white/10 hover:bg-[#202022]' : 'bg-white/95 border-slate-200/80 hover:bg-slate-50'} ${
          canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll left"
      >
        <ChevronDown className={`h-4 w-4 rotate-90 ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`} />
      </button>
      
      {/* Stats Container - Hidden scrollbar */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto px-10 py-1 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {statItems.map((item, index) => {
          const isSelected = item.filterKey && selectedStat === item.filterKey
          const isClickable = item.filterKey !== null
          return (
          <div 
            key={index}
            onClick={() => isClickable && onStatSelect(selectedStat === item.filterKey ? null : item.filterKey)}
            className={`flex-shrink-0 rounded-lg border p-3 min-w-[140px] transition-all ${isDarkMode ? 'bg-[#18181A]' : 'bg-white'} ${
              isSelected 
                ? 'border-primary ring-2 ring-primary/20 shadow-md bg-primary/5' 
                : isDarkMode ? 'border-white/10 hover:shadow-sm' : 'border-slate-200 hover:shadow-sm'
            } ${isClickable ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-md ${item.color}`}>
                <item.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.value}</p>
            <p className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>{item.label}</p>
            {isClickable && (
              <div className={`mt-1 text-[10px] font-medium ${isSelected ? 'text-primary' : 'text-slate-400'}`}>
                {isSelected ? 'Click to clear' : 'Click to filter'}
              </div>
            )}
          </div>
        )})}
      </div>
      
      {/* Right Arrow */}
      <button
        onClick={() => scrollByPage('right')}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border shadow-sm flex items-center justify-center transition-all duration-200 hover:shadow-md ${isDarkMode ? 'bg-[#18181A]/95 border-white/10 hover:bg-[#202022]' : 'bg-white/95 border-slate-200/80 hover:bg-slate-50'} ${
          canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll right"
      >
        <ChevronDown className={`h-4 w-4 -rotate-90 ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`} />
      </button>
      
      {/* CSS to hide scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default function StudentsSplitScreen() {
  // Theme
  const { theme } = useTheme()
  // Both 'dark' and 'cinematic' themes should use dark map styling
  const isDarkMode = theme === 'dark' || theme === 'cinematic'
  
  // State
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<Stats>({
    total_students: 0,
    active_students: 0,
    overdue_payments: 0,
    new_this_month: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [highlightedStudentId, setHighlightedStudentId] = useState<number | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false)
  const [notesStudent, setNotesStudent] = useState<Student | null>(null)
  const [selectedStatFilter, setSelectedStatFilter] = useState<StatFilter>(null)
  // View mode is now controlled by viewMode state ('split' | 'fullMap' | 'list')
  
  // Fetch school logo for brand consistency
  const { data: brandData } = trpc.setupWizard.getBrand.useQuery(undefined, {
    staleTime: 0,
  })
  const schoolLogo = brandData?.logoSquare || null
  
  // Split pane state
  const [mapWidth, setMapWidth] = useState(50) // percentage - default 50/50
  const [viewMode, setViewMode] = useState<ViewMode>('split') // Default to split view
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isHeaderHidden, setIsHeaderHidden] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isCardOverlayOpen, setIsCardOverlayOpen] = useState(false) // Track if bottom card is open
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMapHandle>(null) // Ref to access map imperative methods

  // Responsive breakpoint detection
  useEffect(() => {
    const checkBreakpoints = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1100)
    }
    checkBreakpoints()
    window.addEventListener('resize', checkBreakpoints)
    return () => window.removeEventListener('resize', checkBreakpoints)
  }, [])

  // Invalidate map size when view mode changes or on window resize
  useEffect(() => {
    if (viewMode === 'split' || viewMode === 'fullMap') {
      // Use requestAnimationFrame + setTimeout to ensure DOM has updated
      const invalidateMap = () => {
        if (mapRef.current) {
          mapRef.current.invalidateSize()
        }
      }
      
      // Immediate invalidate
      requestAnimationFrame(() => {
        invalidateMap()
        // Also invalidate after CSS transitions complete (300ms)
        setTimeout(invalidateMap, 150)
        setTimeout(invalidateMap, 350)
      })
    }
  }, [viewMode])

  // Handle window resize for map
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current && (viewMode === 'split' || viewMode === 'fullMap')) {
        requestAnimationFrame(() => {
          mapRef.current?.invalidateSize()
        })
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [viewMode])

  // tRPC utils for cache invalidation
  const utils = trpc.useUtils()
  
  // Fetch students using tRPC
  const { data: studentsData, isLoading: studentsLoading } = trpc.students.list.useQuery()
  const { data: statsData } = trpc.students.stats.useQuery()
  
  // Callback when student is updated - refresh data and update selected student
  const handleStudentUpdated = useCallback(() => {
    utils.students.list.invalidate()
    utils.students.stats.invalidate()
    // If we have a selected student, we need to refresh it from the updated data
    // The useEffect below will handle updating selectedStudent when studentsData changes
  }, [utils])

  // Update local state when data changes
  useEffect(() => {
    if (studentsData) {
      // Transform data to match expected format
      const transformedStudents = studentsData.map((s: any) => ({
        id: s.id,
        first_name: s.firstName,
        last_name: s.lastName,
        email: s.email || '',
        phone: s.phone || '',
        date_of_birth: s.dateOfBirth,
        belt_rank: s.beltRank || 'White Belt',
        status: s.status || 'Active',
        membership_status: s.membershipStatus || 'Standard',
        street_address: s.streetAddress,
        city: s.city,
        state: s.state,
        zip_code: s.zipCode,
        photo_url: s.photoUrl,
        program: s.program,
        lat: s.latitude ? parseFloat(s.latitude) : undefined,
        lng: s.longitude ? parseFloat(s.longitude) : undefined,
        guardian_name: s.guardianName,
        guardian_relationship: s.guardianRelationship,
        guardian_phone: s.guardianPhone,
        guardian_email: s.guardianEmail,
      }))
      setStudents(transformedStudents)
      
      // If we have a selected student, update it with fresh data
      if (selectedStudent) {
        const updatedStudent = transformedStudents.find((s: any) => s.id === selectedStudent.id)
        if (updatedStudent) {
          setSelectedStudent(updatedStudent)
        }
      }
    }
    setLoading(studentsLoading)
  }, [studentsData, studentsLoading, selectedStudent?.id])

  useEffect(() => {
    if (statsData) {
      setStats({
        total_students: statsData.total || 0,
        active_students: statsData.active || 0,
        overdue_payments: statsData.overdue || 0,
        new_this_month: statsData.newThisMonth || 0
      })
    }
  }, [statsData])

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.belt_rank.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter
    
    // Apply stat filter as a subset
    let matchesStatFilter = true
    if (selectedStatFilter) {
      switch (selectedStatFilter) {
        case 'active':
          matchesStatFilter = student.status?.toLowerCase() === 'active'
          break
        case 'pending':
          matchesStatFilter = student.membership_status?.toLowerCase() === 'pending cancel' || 
                             student.status?.toLowerCase() === 'on hold'
          break
        case 'cancelled':
          matchesStatFilter = student.status?.toLowerCase() === 'inactive' || 
                             student.membership_status?.toLowerCase() === 'expired'
          break
        case 'new':
          // For demo, consider students with Trial membership as new
          matchesStatFilter = student.membership_status?.toLowerCase() === 'trial'
          break
      }
    }
    
    return matchesSearch && matchesStatus && matchesStatFilter
  })

  // Base locations for students without geocoded addresses (Tomball, TX area)
  const baseLocations = useMemo(() => [
    { lat: 30.0974, lng: -95.6163 },
    { lat: 30.1074, lng: -95.6063 },
    { lat: 30.0874, lng: -95.6263 },
    { lat: 30.1024, lng: -95.6113 },
    { lat: 30.0924, lng: -95.6213 },
    { lat: 30.1124, lng: -95.5963 },
    { lat: 30.0774, lng: -95.6363 },
    { lat: 30.1174, lng: -95.6013 },
    { lat: 30.0824, lng: -95.6313 },
    { lat: 30.1074, lng: -95.6213 },
  ], [])

  // Convert students to Leaflet markers format
  const leafletMarkers: StudentMarker[] = useMemo(() => {
    return filteredStudents.map((student, index) => {
      // Use actual lat/lng from database if available
      let lat = student.lat
      let lng = student.lng
      
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        // Fallback to sample location
        const baseIdx = index % baseLocations.length
        const offset = Math.floor(index / baseLocations.length) * 0.005
        lat = baseLocations[baseIdx].lat + offset
        lng = baseLocations[baseIdx].lng + offset
      }
      
      return {
        id: String(student.id),
        name: `${student.first_name} ${student.last_name}`,
        initials: `${student.first_name[0]}${student.last_name[0]}`,
        lat,
        lng,
        status: student.status?.toLowerCase() === 'active' ? 'active' 
          : student.status?.toLowerCase() === 'on hold' ? 'on-hold' 
          : 'inactive',
        photoUrl: student.photo_url,
        beltRank: student.belt_rank,
      }
    })
  }, [filteredStudents, baseLocations])

  // Handle marker click from Leaflet map
  const handleMarkerClick = useCallback((studentId: string) => {
    const student = students.find(s => String(s.id) === studentId)
    if (student) {
      setSelectedStudent(student)
      setIsModalOpen(true)
    }
  }, [students])

  // Status counts
  const activeCount = students.filter(s => s.status === 'Active').length
  const pendingCancelCount = students.filter(s => s.status === 'Pending Cancel').length
  const cancelledCount = students.filter(s => s.status === 'Cancelled').length

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${isDarkMode ? 'bg-[#0F0F11]' : 'bg-slate-50'}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <BottomNavLayout>
    <div className={`min-h-screen flex flex-col relative ${isDarkMode ? 'bg-[#0F0F11]' : 'bg-gradient-to-br from-slate-50 to-slate-100/80'}`}>
      {/* Breadcrumb Navigation */}
      <div className={`backdrop-blur-sm border-b px-6 py-2 ${isDarkMode ? 'bg-[#18181A]/80 border-white/5' : 'bg-white/80 border-slate-200/40'}`}>
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Students', href: '/students' },
            ...(selectedStudent ? [{ label: selectedStudent.name }] : [])
          ] as BreadcrumbItem[]}
        />
      </div>

      {/* Page Sub-Header - with scroll hide/show behavior */}
      <div 
        className={`backdrop-blur-sm border-b px-6 py-4 flex items-center justify-between transition-all duration-300 z-10 ${isDarkMode ? 'bg-[#18181A]/95 border-white/5' : 'bg-white/95 border-slate-200/60'} ${
          isHeaderHidden ? '-translate-y-full opacity-0 h-0 py-0 overflow-hidden' : 'translate-y-0 opacity-100'
        }`}
      >
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Students</h1>
          <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>Manage your dojo's student roster</p>
        </div>
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <ViewModeToggle
            mode={viewMode}
            onChange={setViewMode}
            isDarkMode={isDarkMode}
          />
          <Button className="bg-[#E73C3C] hover:bg-[#E73C3C]/90 rounded-xl shadow-[0_2px_8px_rgba(231,60,60,0.25)] hover:shadow-[0_4px_12px_rgba(231,60,60,0.35)] transition-all">
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Split Screen Container */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-hidden ${
          isMobile ? 'flex flex-col' : 'flex'
        }`}
        style={{
          minHeight: 0,
          height: viewMode === 'fullMap' ? 'calc(100vh - 180px)' : undefined
        }}
      >
        {/* Left Pane - Map (visible in split and fullMap modes) */}
        {(viewMode === 'split' || viewMode === 'fullMap') && (
          <div 
            className={`flex flex-col transition-all duration-300 ${isDarkMode ? 'bg-[#0F0F11]' : 'bg-white'} ${
              viewMode === 'fullMap' ? 'w-full h-full flex-1' : ''
            } ${
              isMobile ? 'h-[350px] flex-shrink-0' : viewMode === 'fullMap' ? '' : 'h-[calc(100vh-200px)]'
            }`}
            style={isMobile ? {} : viewMode === 'fullMap' ? { height: '100%', minHeight: 0 } : { 
              flexBasis: `${mapWidth}%`,
              minWidth: '25%',
              maxWidth: '75%'
            }}
          >
            {/* Map Container - Full height, no card wrapper */}
            <div 
              className="flex-1 relative" 
              style={{ 
                position: 'relative', 
                zIndex: 0, 
                minHeight: viewMode === 'fullMap' ? 'calc(100vh - 180px)' : '300px',
                height: viewMode === 'fullMap' ? '100%' : undefined
              }}
            >
              {/* Map View - Leaflet/OpenStreetMap */}
              <LeafletMap
                ref={mapRef}
                markers={leafletMarkers}
                selectedStudentId={selectedStudent ? String(selectedStudent.id) : null}
                paddingBottom={isCardOverlayOpen && viewMode === 'fullMap' ? 280 : 0}
                onMarkerClick={(studentId) => {
                  const student = students.find(s => String(s.id) === studentId)
                  if (student) {
                    setSelectedStudent(student)
                    setHighlightedStudentId(student.id)
                    
                    if (viewMode === 'fullMap') {
                      // In full map mode, open the bottom card overlay
                      setIsCardOverlayOpen(true)
                    } else if (viewMode === 'split') {
                      // In split mode, scroll to student in list and open modal
                      const studentCard = document.getElementById(`student-card-${student.id}`)
                      studentCard?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      setIsModalOpen(true)
                    }
                  }
                }}
                isDarkMode={isDarkMode}
                className="w-full h-full absolute inset-0"
              />
              
              {/* Floating Search/Filters - Full Map Mode Only */}
              {viewMode === 'fullMap' && (
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg backdrop-blur-sm ${
                    isDarkMode ? 'bg-[#1C1C1E]/90 border border-white/10' : 'bg-white/90 border border-slate-200'
                  }`}>
                    <Search className={`h-4 w-4 ${isDarkMode ? 'text-white/50' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`bg-transparent border-none outline-none text-sm w-48 ${
                        isDarkMode ? 'text-white placeholder:text-white/40' : 'text-slate-700 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Draggable Divider - Split mode only, Desktop */}
        {viewMode === 'split' && !isMobile && !isTablet && (
          <ResizableDivider
            onResize={(width) => setMapWidth(width)}
            onDragEnd={() => mapRef.current?.invalidateSize()}
            onDoubleClick={() => setMapWidth(50)}
            containerRef={containerRef as React.RefObject<HTMLDivElement>}
            isDarkMode={isDarkMode}
            initialWidth={mapWidth}
          />
        )}

        {/* Right Pane - Search + Cards (visible in split and list modes) */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div 
            className={`flex flex-col ${isDarkMode ? 'bg-[#0F0F11]' : 'bg-gradient-to-b from-white to-slate-50/50'} ${
              isMobile ? 'flex-1' : 'h-[calc(100vh-200px)]'
            }`}
            style={isMobile || viewMode === 'list' ? { flex: 1, padding: '16px' } : { flex: 1, padding: '16px' }}
          >
            {/* Students List Header */}
            <div className="space-y-4">
              {/* Search Bar - Apple-style */}
              <div className="relative">
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-11 h-12 rounded-2xl transition-all ${isDarkMode ? 'border-white/10 bg-[#18181A] text-white placeholder:text-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.2)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.3)] focus:border-[#E73C3C]/30 focus:ring-2 focus:ring-[#E73C3C]/10' : 'border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.08)] focus:border-[#E73C3C]/30 focus:ring-2 focus:ring-[#E73C3C]/10'}`}
                />
              </div>

              {/* Filters Row - Clean DojoFlow style */}
              <div className="flex items-center gap-3 flex-wrap">
                <Select defaultValue="all">
                  <SelectTrigger className={`w-[130px] h-9 text-sm rounded-xl shadow-sm hover:shadow-md transition-shadow ${isDarkMode ? 'border-white/10 bg-[#18181A] text-white' : 'border-slate-200/80 bg-white'}`}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pending Cancel">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className={`w-[130px] h-9 text-sm rounded-xl shadow-sm hover:shadow-md transition-shadow ${isDarkMode ? 'border-white/10 bg-[#18181A] text-white' : 'border-slate-200/80 bg-white'}`}>
                    <SelectValue placeholder="Belt Rank" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Belts</SelectItem>
                    <SelectItem value="white">White Belt</SelectItem>
                    <SelectItem value="blue">Blue Belt</SelectItem>
                    <SelectItem value="purple">Purple Belt</SelectItem>
                    <SelectItem value="brown">Brown Belt</SelectItem>
                    <SelectItem value="black">Black Belt</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className={`w-[140px] h-9 text-sm rounded-xl shadow-sm hover:shadow-md transition-shadow ${isDarkMode ? 'border-white/10 bg-[#18181A] text-white' : 'border-slate-200/80 bg-white'}`}>
                    <SelectValue placeholder="Membership" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className={`h-9 rounded-xl shadow-sm hover:shadow-md transition-all ${isDarkMode ? 'border-white/10 bg-[#18181A] text-white hover:bg-[#202022]' : 'border-slate-200/80'}`}>
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  More Filters
                </Button>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 border-b border-slate-100 -mb-4 pb-0">
                <button 
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    statusFilter === 'all' || statusFilter === 'Active' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                  onClick={() => setStatusFilter('Active')}
                >
                  Active ({activeCount})
                </button>
                <button 
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    statusFilter === 'Pending Cancel' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                  onClick={() => setStatusFilter('Pending Cancel')}
                >
                  Pending Cancel ({pendingCancelCount})
                </button>
                <button 
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    statusFilter === 'Cancelled' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                  onClick={() => setStatusFilter('Cancelled')}
                >
                  Cancelled ({cancelledCount})
                </button>
              </div>
            </div>

            {/* Student Cards Scroll Area */}
            <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className={`${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>No students found</p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div key={student.id} id={`student-card-${student.id}`}>
                    <StudentCard
                      student={student}
                      isHighlighted={highlightedStudentId === student.id}
                      schoolLogo={schoolLogo}
                      isDarkMode={isDarkMode}
                      onClick={() => {
                        setSelectedStudent(student)
                        setHighlightedStudentId(student.id)
                        setIsModalOpen(true)
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Student Modal */}
      <StudentModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          // In map mode, keep the student selected for the card overlay
          if (viewMode !== 'fullMap') {
            setSelectedStudent(null)
            setHighlightedStudentId(null)
          }
        }}
        onEditProfile={(student) => {
          console.log('Edit profile:', student.id)
          // TODO: Open edit form
        }}
        onViewNotes={(student) => {
          setNotesStudent(student)
          setIsNotesDrawerOpen(true)
        }}
        onCloseNotesDrawer={() => {
          setIsNotesDrawerOpen(false)
          setNotesStudent(null)
        }}
        onStudentUpdated={handleStudentUpdated}
        onViewOnMap={(student) => {
          // Switch to full map mode, select student, and open card overlay
          setSelectedStudent(student)
          setHighlightedStudentId(student.id)
          setViewMode('fullMap')
          setIsCardOverlayOpen(true)
          setIsModalOpen(false)
          // Pan map to student after mode switch
          setTimeout(() => {
            mapRef.current?.panToStudent(String(student.id), 280)
          }, 100)
        }}
        isFullMapMode={viewMode === 'fullMap'}
      />

      {/* Notes Drawer */}
      <NotesDrawer
        student={notesStudent}
        isOpen={isNotesDrawerOpen}
        onClose={() => {
          setIsNotesDrawerOpen(false)
          setNotesStudent(null)
        }}
        onAddNote={(studentId, content, category) => {
          console.log('Add note:', studentId, content, category)
          // TODO: Save note to database
        }}
      />

      {/* Student Card Overlay - Portal for Full Map mode */}
      <MapOverlay isVisible={viewMode === 'fullMap' && isCardOverlayOpen && !!selectedStudent}>
        {selectedStudent && (
          <StudentCardOverlay
            student={selectedStudent}
            onClose={() => {
              // Close card but stay in map mode
              setIsCardOverlayOpen(false)
              setSelectedStudent(null)
              setHighlightedStudentId(null)
            }}
            onViewNotes={() => {
              setNotesStudent(selectedStudent)
              setIsNotesDrawerOpen(true)
            }}
            onEditProfile={() => {
              // Open the student modal for editing
              // Keep the card overlay open so user can see the context
              setIsModalOpen(true)
            }}
            isDarkMode={isDarkMode}
          />
        )}
      </MapOverlay>
    </div>
    </BottomNavLayout>
  )
}
