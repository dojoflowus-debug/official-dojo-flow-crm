import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { trpc } from '../lib/trpc'
import BottomNavLayout from '@/components/BottomNavLayout'
import { MapView } from '../components/Map'
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
  schoolLogo
}: { 
  student: Student
  onClick: () => void
  isHighlighted?: boolean
  schoolLogo?: string | null
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
      className={`bg-white rounded-xl border px-4 py-3 cursor-pointer transition-all duration-200 ease-out hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99] active:shadow-md ${
        isHighlighted ? 'ring-2 ring-primary shadow-lg border-primary' : 'border-slate-200 shadow-sm'
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
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 flex-shrink-0">
            <User className="h-5 w-5 text-slate-400" />
          </div>
        )}
        
        {/* Name & Program */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm text-slate-900 truncate">
              {student.first_name} {student.last_name}
            </h4>
            {/* Status Dot */}
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(student.status)}`} />
          </div>
          <p className="text-xs text-slate-500 truncate">
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
  onStatSelect 
}: { 
  stats: Stats
  selectedStat: StatFilter
  onStatSelect: (stat: StatFilter) => void
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
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 border border-slate-200/80 shadow-sm flex items-center justify-center transition-all duration-200 hover:bg-slate-50 hover:shadow-md ${
          canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll left"
      >
        <ChevronDown className="h-4 w-4 text-slate-600 rotate-90" />
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
            className={`flex-shrink-0 bg-white rounded-lg border p-3 min-w-[140px] transition-all ${
              isSelected 
                ? 'border-primary ring-2 ring-primary/20 shadow-md bg-primary/5' 
                : 'border-slate-200 hover:shadow-sm'
            } ${isClickable ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-md ${item.color}`}>
                <item.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-lg font-bold text-slate-900">{item.value}</p>
            <p className="text-xs text-slate-500">{item.label}</p>
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
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 border border-slate-200/80 shadow-sm flex items-center justify-center transition-all duration-200 hover:bg-slate-50 hover:shadow-md ${
          canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll right"
      >
        <ChevronDown className="h-4 w-4 text-slate-600 -rotate-90" />
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
  const [isFullMapMode, setIsFullMapMode] = useState(false)
  const [highlightedMapStudent, setHighlightedMapStudent] = useState<Student | null>(null)
  
  // Fetch school logo for brand consistency
  const { data: brandData } = trpc.setupWizard.getBrand.useQuery(undefined, {
    staleTime: 0,
  })
  const schoolLogo = brandData?.logoSquare || null
  
  // Split pane state
  const [mapWidth, setMapWidth] = useState(40) // percentage
  const [isDragging, setIsDragging] = useState(false)
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  const [isMapHidden, setIsMapHidden] = useState(false) // For mobile toggle
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isHeaderHidden, setIsHeaderHidden] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])

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

  // tRPC utils for cache invalidation
  const utils = trpc.useUtils()
  
  // Fetch students using tRPC
  const { data: studentsData, isLoading: studentsLoading } = trpc.students.list.useQuery()
  const { data: statsData } = trpc.students.stats.useQuery()
  
  // Callback when student is updated - refresh data
  const handleStudentUpdated = useCallback(() => {
    utils.students.list.invalidate()
    utils.students.stats.invalidate()
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
    }
    setLoading(studentsLoading)
  }, [studentsData, studentsLoading])

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

  // Draggable divider handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
    
    // Constrain between 25% and 70%
    const clampedWidth = Math.min(70, Math.max(25, newWidth))
    setMapWidth(clampedWidth)
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Student locations from database or fallback to sample locations
  const studentLocationsRef = useRef<Map<number, { lat: number; lng: number }>>(new Map())
  
  // Update locations when students change - use actual lat/lng from database if available
  useEffect(() => {
    // Base locations for students without geocoded addresses (spread around San Francisco)
    const baseLocations = [
      { lat: 37.7749, lng: -122.4194 },
      { lat: 37.7849, lng: -122.4094 },
      { lat: 37.7649, lng: -122.4294 },
      { lat: 37.7799, lng: -122.4144 },
      { lat: 37.7699, lng: -122.4244 },
      { lat: 37.7899, lng: -122.3994 },
      { lat: 37.7549, lng: -122.4394 },
      { lat: 37.7949, lng: -122.4044 },
      { lat: 37.7599, lng: -122.4344 },
      { lat: 37.7849, lng: -122.4244 },
    ]
    
    // Clear and rebuild locations map
    studentLocationsRef.current.clear()
    
    students.forEach((student, index) => {
      // Use actual lat/lng from database if available
      if (student.lat && student.lng && !isNaN(student.lat) && !isNaN(student.lng)) {
        studentLocationsRef.current.set(student.id, {
          lat: student.lat,
          lng: student.lng,
        })
      } else {
        // Fallback to sample location
        const baseIdx = index % baseLocations.length
        const offset = Math.floor(index / baseLocations.length) * 0.005
        studentLocationsRef.current.set(student.id, {
          lat: baseLocations[baseIdx].lat + offset + (Math.random() - 0.5) * 0.01,
          lng: baseLocations[baseIdx].lng + offset + (Math.random() - 0.5) * 0.01,
        })
      }
    })
    
    // If map is ready, refresh markers
    if (mapRef.current && students.length > 0) {
      handleMapReady(mapRef.current)
    }
  }, [students])

  // Map ready handler - centers on all students
  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.map = null)
    markersRef.current = []
    
    // Create bounds to fit all students
    const bounds = new google.maps.LatLngBounds()
    let hasMarkers = false
    
    // Add markers for all students
    students.forEach((student) => {
      const location = studentLocationsRef.current.get(student.id)
      if (location) {
        hasMarkers = true
        bounds.extend(location)
        
        // Create custom marker element
        const markerContent = document.createElement('div')
        markerContent.className = 'student-marker'
        markerContent.innerHTML = `
          <div style="
            width: 32px;
            height: 32px;
            background: ${student.status === 'Active' ? '#22c55e' : '#ef4444'};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            color: white;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          " data-student-id="${student.id}">
            ${student.first_name[0]}${student.last_name[0]}
          </div>
        `
        
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: location,
          title: `${student.first_name} ${student.last_name}`,
          content: markerContent,
        })
        
        // Click handler to open student modal
        marker.addListener('click', () => {
          setSelectedStudent(student)
          setIsModalOpen(true)
        })
        
        markersRef.current.push(marker)
      }
    })
    
    // Fit map to show all student markers
    if (hasMarkers) {
      map.fitBounds(bounds, { padding: 50 })
      // Set a max zoom level so we don't zoom in too close
      const listener = google.maps.event.addListener(map, 'idle', () => {
        const currentZoom = map.getZoom()
        if (currentZoom && currentZoom > 15) {
          map.setZoom(15)
        }
        google.maps.event.removeListener(listener)
      })
    }
  }, [students])
  
  // Pan to selected student when modal opens
  useEffect(() => {
    if (selectedStudent && mapRef.current) {
      const location = studentLocationsRef.current.get(selectedStudent.id)
      if (location) {
        // Pan to the student's location
        mapRef.current.panTo(location)
        mapRef.current.setZoom(15)
        
        // Highlight the marker briefly
        const markerIndex = students.findIndex(s => s.id === selectedStudent.id)
        if (markerIndex >= 0 && markersRef.current[markerIndex]) {
          const marker = markersRef.current[markerIndex]
          const content = marker.content as HTMLElement
          if (content) {
            const innerDiv = content.querySelector('div') as HTMLElement
            if (innerDiv) {
              // Add highlight animation
              innerDiv.style.transform = 'scale(1.3)'
              innerDiv.style.boxShadow = '0 0 0 4px rgba(231, 60, 60, 0.4), 0 4px 12px rgba(0,0,0,0.4)'
              
              // Remove highlight after 1.5 seconds
              setTimeout(() => {
                innerDiv.style.transform = 'scale(1)'
                innerDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
              }, 1500)
            }
          }
        }
      }
    }
  }, [selectedStudent, students])
  
  // Update map markers visibility based on stat filter
  useEffect(() => {
    if (!mapRef.current) return
    
    markersRef.current.forEach((marker, index) => {
      const student = students[index]
      if (!student) return
      
      // Check if student matches the stat filter
      let shouldShow = true
      if (selectedStatFilter) {
        switch (selectedStatFilter) {
          case 'active':
            shouldShow = student.status?.toLowerCase() === 'active'
            break
          case 'pending':
            shouldShow = student.membership_status?.toLowerCase() === 'pending cancel' || 
                        student.status?.toLowerCase() === 'on hold'
            break
          case 'cancelled':
            shouldShow = student.status?.toLowerCase() === 'inactive' || 
                        student.membership_status?.toLowerCase() === 'expired'
            break
          case 'new':
            shouldShow = student.membership_status?.toLowerCase() === 'trial'
            break
        }
      }
      
      // Show/hide marker
      marker.map = shouldShow ? mapRef.current : null
    })
  }, [selectedStatFilter, students])

  // Status counts
  const activeCount = students.filter(s => s.status === 'Active').length
  const pendingCancelCount = students.filter(s => s.status === 'Pending Cancel').length
  const cancelledCount = students.filter(s => s.status === 'Cancelled').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <BottomNavLayout>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/80 flex flex-col relative">
      {/* Breadcrumb Navigation */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/40 px-6 py-2">
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
        className={`bg-white/95 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 flex items-center justify-between transition-all duration-300 z-10 ${
          isHeaderHidden ? '-translate-y-full opacity-0 h-0 py-0 overflow-hidden' : 'translate-y-0 opacity-100'
        }`}
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500">Manage your dojo's student roster</p>
        </div>
        <Button className="bg-[#E73C3C] hover:bg-[#E73C3C]/90 rounded-xl shadow-[0_2px_8px_rgba(231,60,60,0.25)] hover:shadow-[0_4px_12px_rgba(231,60,60,0.35)] transition-all">
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Split Screen Container */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-hidden ${
          isMobile ? 'flex flex-col' : 'flex'
        }`}
        style={{ cursor: isDragging && !isMobile && !isTablet ? 'col-resize' : 'default' }}
      >
        {/* Left Pane - Map + Stats */}
        {(!isMobile || !isMapHidden) && (
          <div 
          className={`flex flex-col bg-white transition-all duration-300 p-4 ${
            isMapExpanded ? 'w-full' : ''
          } ${
            isMobile ? 'h-[350px] flex-shrink-0' : 'h-[calc(100vh-200px)]'
          }`}
          style={isMobile ? {} : { 
            flexBasis: isMapExpanded ? '100%' : isTablet ? '35%' : `${mapWidth}%`,
            minWidth: isMapExpanded ? '100%' : isTablet ? '35%' : '25%',
            maxWidth: isMapExpanded ? '100%' : isTablet ? '35%' : '70%'
          }}
        >
          {/* Map Card Container - Apple-style minimal grey design */}
          <div className="flex flex-col bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200/80 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden flex-1">
            {/* Map Header - Expand/Collapse only */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-4 py-2 flex items-center justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-0 rounded-xl hover:bg-slate-100"
                onClick={() => setIsMapExpanded(!isMapExpanded)}
              >
                {isMapExpanded ? (
                  <Minimize2 className="h-4 w-4 text-slate-600" />
                ) : (
                  <Maximize2 className="h-4 w-4 text-slate-600" />
                )}
              </Button>
            </div>

            {/* Map Container with Vertical Filters */}
            <div className="flex-1 relative min-h-[300px] flex">
              {/* Vertical Filter Buttons */}
              <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
                {[
                  { label: 'Active', icon: Users, active: true },
                  { label: 'Missing', icon: X, active: false },
                  { label: 'Nearby', icon: MapPin, active: false },
                  { label: 'New', icon: Plus, active: false },
                ].map((filter, idx) => (
                  <button
                    key={idx}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all shadow-sm ${
                      filter.active 
                        ? 'bg-[#E73C3C] text-white shadow-[0_2px_8px_rgba(231,60,60,0.3)]' 
                        : 'bg-white/95 text-slate-600 hover:bg-white hover:shadow-md border border-slate-200/60'
                    }`}
                  >
                    <filter.icon className="h-3.5 w-3.5" />
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Map View */}
              <MapView 
                className="w-full h-full absolute inset-0"
                initialCenter={{ lat: 37.7749, lng: -122.4194 }}
                initialZoom={12}
                onMapReady={handleMapReady}
              />
            </div>

            {/* Stats Strip - inside card with gradient */}
            <div className="bg-gradient-to-r from-white to-slate-50 border-t border-slate-200/60 p-4">
              <StatsStrip 
                stats={stats} 
                selectedStat={selectedStatFilter}
                onStatSelect={setSelectedStatFilter}
              />
            </div>
          </div>{/* End Map Card Container */}
          
          {/* Mobile Map Toggle */}
          {isMobile && (
            <button
              onClick={() => setIsMapHidden(true)}
              className="bg-white border border-slate-200 rounded-lg mt-2 py-2 text-center text-sm text-slate-600 hover:bg-slate-50"
            >
              Hide Map
            </button>
          )}
          </div>
        )}

        {/* Mobile: Show Map Button */}
        {isMobile && isMapHidden && (
          <button
            onClick={() => setIsMapHidden(false)}
            className="bg-white border-b border-slate-200 py-3 text-center text-sm text-primary font-medium hover:bg-slate-50"
          >
            <MapPin className="h-4 w-4 inline mr-2" />
            Show Map
          </button>
        )}

        {/* Draggable Divider - Desktop only - Polished Apple-style */}
        {!isMapExpanded && !isMobile && !isTablet && (
          <div 
            className="w-3 cursor-col-resize relative group flex items-center justify-center"
            onMouseDown={handleMouseDown}
          >
            {/* Divider Track */}
            <div className="absolute inset-y-4 w-[3px] rounded-full bg-white/40 shadow-[0_0_8px_rgba(0,0,0,0.08)] group-hover:bg-white/60 group-hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] transition-all duration-200" />
            {/* Grab Handle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full bg-white/50 shadow-[0_2px_8px_rgba(0,0,0,0.1)] group-hover:bg-white/70 group-hover:h-16 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200" />
          </div>
        )}

        {/* Right Pane - Search + Cards */}
        {!isMapExpanded && (
          <div 
            className={`flex flex-col bg-gradient-to-b from-white to-slate-50/50 ${
              isMobile ? 'flex-1' : 'h-[calc(100vh-140px)]'
            }`}
            style={isMobile ? {} : { flex: 1, paddingTop: '16px', paddingRight: '16px', paddingBottom: '16px', paddingLeft: '16px' }}
          >
            {/* Students List Header */}
            <div className="space-y-4">
              {/* Search Bar - Apple-style */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 rounded-2xl border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.08)] focus:border-[#E73C3C]/30 focus:ring-2 focus:ring-[#E73C3C]/10 transition-all"
                />
              </div>

              {/* Filters Row - Clean DojoFlow style */}
              <div className="flex items-center gap-3 flex-wrap">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[130px] h-9 text-sm rounded-xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
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
                  <SelectTrigger className="w-[130px] h-9 text-sm rounded-xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
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
                  <SelectTrigger className="w-[140px] h-9 text-sm rounded-xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <SelectValue placeholder="Membership" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200/80 shadow-sm hover:shadow-md transition-all">
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
                  <p className="text-slate-500">No students found</p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    isHighlighted={highlightedStudentId === student.id}
                    schoolLogo={schoolLogo}
                    onClick={() => {
                      setSelectedStudent(student)
                      setIsModalOpen(true)
                    }}
                  />
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
          setSelectedStudent(null)
          if (isFullMapMode) {
            setIsFullMapMode(false)
            setHighlightedMapStudent(null)
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
          setHighlightedMapStudent(student)
          setIsFullMapMode(true)
          // Center map on student and highlight marker
          const location = studentLocationsRef.current.get(student.id)
          if (location && mapRef.current) {
            mapRef.current.panTo(location)
            mapRef.current.setZoom(15)
          }
        }}
        isFullMapMode={isFullMapMode}
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

      {/* Full Map Mode Overlay - No blur, clean map view */}
      {isFullMapMode && (
        <div className="fixed inset-0 z-40 pt-[88px]">
          {/* Full Screen Map - Edge to edge, no backdrop */}
          <div className="absolute inset-0 top-0">
            <MapView 
              className="w-full h-full"
              initialCenter={{ lat: 37.7749, lng: -122.4194 }}
              initialZoom={12}
              onMapReady={(map) => {
                mapRef.current = map
                
                // Clear existing markers
                markersRef.current.forEach(marker => marker.map = null)
                markersRef.current = []
                
                // Create bounds to fit all students
                const bounds = new google.maps.LatLngBounds()
                let hasMarkers = false
                
                // Add markers for all students
                students.forEach((student) => {
                  const location = studentLocationsRef.current.get(student.id)
                  if (location) {
                    hasMarkers = true
                    bounds.extend(location)
                    
                    const isHighlighted = highlightedMapStudent?.id === student.id
                    
                    // Create custom marker element with mini label for highlighted student
                    const markerContent = document.createElement('div')
                    markerContent.className = 'student-marker cursor-pointer'
                    markerContent.innerHTML = `
                      <div class="flex flex-col items-center">
                        <div class="${isHighlighted ? 'w-16 h-16' : 'w-10 h-10'} rounded-full bg-white shadow-lg flex items-center justify-center border-2 ${isHighlighted ? 'border-[#E73C3C] ring-4 ring-[#E73C3C]/20' : 'border-slate-200 hover:border-slate-300'} transition-all duration-300 overflow-hidden">
                          ${student.photo_url 
                            ? `<img src="${student.photo_url}" class="w-full h-full object-cover" />`
                            : `<span class="${isHighlighted ? 'text-lg' : 'text-xs'} font-bold text-slate-600">${student.first_name[0]}${student.last_name[0]}</span>`
                          }
                        </div>
                        ${isHighlighted ? `
                          <div class="mt-2 bg-white rounded-lg shadow-lg px-3 py-2 min-w-[140px] text-center border border-slate-100">
                            <div class="flex items-center justify-center gap-2 mb-1">
                              ${student.photo_url 
                                ? `<img src="${student.photo_url}" class="w-6 h-6 rounded-full object-cover" />`
                                : `<div class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center"><span class="text-[10px] font-bold text-slate-600">${student.first_name[0]}${student.last_name[0]}</span></div>`
                              }
                              <span class="font-semibold text-slate-800 text-sm">${student.first_name} ${student.last_name}</span>
                            </div>
                            <div class="flex items-center justify-center gap-2">
                              <span class="text-xs text-slate-500">${student.belt_rank || 'White Belt'}</span>
                              <span class="w-2 h-2 rounded-full ${student.status === 'Active' ? 'bg-green-500' : student.status === 'Inactive' ? 'bg-gray-400' : 'bg-yellow-500'}"></span>
                            </div>
                          </div>
                        ` : ''}
                      </div>
                    `
                    
                    const marker = new google.maps.marker.AdvancedMarkerElement({
                      map,
                      position: location,
                      content: markerContent,
                      zIndex: isHighlighted ? 1000 : 1,
                    })
                    
                    // Add click listener to open student card
                    marker.addListener('click', () => {
                      setSelectedStudent(student)
                      setHighlightedMapStudent(student)
                      setIsModalOpen(true)
                      // Center on clicked student
                      map.panTo(location)
                    })
                    
                    markersRef.current.push(marker)
                  }
                })
                
                // If we have a highlighted student, center on them
                if (highlightedMapStudent) {
                  const location = studentLocationsRef.current.get(highlightedMapStudent.id)
                  if (location) {
                    map.setCenter(location)
                    map.setZoom(15)
                  }
                } else if (hasMarkers) {
                  map.fitBounds(bounds, { padding: 50 })
                }
              }}
            />
          </div>
          
          {/* Exit Full Map Mode Button - Upper Left with Arrow */}
          <button
            onClick={() => {
              setIsFullMapMode(false)
              setHighlightedMapStudent(null)
              setIsModalOpen(false)
              setSelectedStudent(null)
            }}
            className="absolute top-4 left-4 z-20 bg-white px-4 py-2.5 rounded-lg shadow-lg border border-slate-200 flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="h-4 w-4 text-slate-700" />
            <span className="text-sm font-medium text-slate-700">Exit Full Map</span>
          </button>
          
          {/* Docked Student Card on Right Side - Clean shadow, no blur */}
          {isModalOpen && selectedStudent && (
            <div className="absolute right-4 top-4 bottom-4 w-[400px] z-10 pointer-events-auto">
              <StudentModal
                student={selectedStudent}
                isOpen={true}
                onClose={() => {
                  // Close card but stay in full map mode
                  setIsModalOpen(false)
                  // Keep highlighted student so mini label shows
                }}
                onEditProfile={(student) => {
                  console.log('Edit profile:', student.id)
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
                isFullMapMode={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
    </BottomNavLayout>
  )
}
