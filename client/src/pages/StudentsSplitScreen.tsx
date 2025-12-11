import { useState, useEffect, useRef, useCallback } from 'react'
import { trpc } from '../lib/trpc'
import { MapView } from '../components/Map'
import AddressAutocomplete from '../components/AddressAutocomplete'
import PhoneInput from '../components/PhoneInput'
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
  ChevronDown
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
  onEdit, 
  onPayment, 
  onDelete,
  isHighlighted 
}: { 
  student: Student
  onEdit: () => void
  onPayment: () => void
  onDelete: () => void
  isHighlighted?: boolean
}) {
  return (
    <div 
      className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
        isHighlighted ? 'ring-2 ring-primary shadow-lg' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {student.photo_url ? (
          <img 
            src={student.photo_url} 
            alt={`${student.first_name} ${student.last_name}`}
            className="w-12 h-12 rounded-full object-cover border border-slate-200 flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 flex-shrink-0">
            <User className="h-6 w-6 text-slate-400" />
          </div>
        )}
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-slate-900 truncate">
              {student.first_name} {student.last_name}
            </h4>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getBeltColor(student.belt_rank)}`}>
              {student.belt_rank}
            </span>
          </div>
          
          <div className="mt-1 space-y-0.5">
            <div className="flex items-center text-sm text-slate-500">
              <Mail className="h-3 w-3 mr-1.5 flex-shrink-0" />
              <span className="truncate">{student.email}</span>
            </div>
            <div className="flex items-center text-sm text-slate-500">
              <Phone className="h-3 w-3 mr-1.5 flex-shrink-0" />
              <span>{student.phone}</span>
            </div>
          </div>
          
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
              {student.status}
            </span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getMembershipColor(student.membership_status)}`}>
              {student.membership_status}
            </span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
        <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={onEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={onPayment}>
          <CreditCard className="h-3 w-3 mr-1" />
          Payment
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

// Stats Strip Component
function StatsStrip({ stats }: { stats: Stats }) {
  const statItems = [
    { label: 'Active Students', value: stats.active_students, icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Pending Cancel', value: 0, icon: Calendar, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Cancelled', value: 0, icon: X, color: 'text-red-600 bg-red-50' },
    { label: 'Retention Rate', value: '94%', icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: 'New Enrollments', value: stats.new_this_month, icon: Plus, color: 'text-purple-600 bg-purple-50' },
    { label: 'Attendance Rate', value: '87%', icon: Activity, color: 'text-teal-600 bg-teal-50' },
    { label: 'Average Distance', value: '3.2 mi', icon: MapPin, color: 'text-orange-600 bg-orange-50' },
    { label: 'Belt Progress', value: '12', icon: Target, color: 'text-indigo-600 bg-indigo-50' },
  ]

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-thin scrollbar-thumb-slate-300">
      {statItems.map((item, index) => (
        <div 
          key={index}
          className="flex-shrink-0 bg-white rounded-lg border border-slate-200 p-3 min-w-[140px] hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className={`p-1.5 rounded-md ${item.color}`}>
              <item.icon className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900">{item.value}</p>
          <p className="text-xs text-slate-500">{item.label}</p>
        </div>
      ))}
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
  
  // Split pane state
  const [mapWidth, setMapWidth] = useState(40) // percentage
  const [isDragging, setIsDragging] = useState(false)
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  const [isMapHidden, setIsMapHidden] = useState(false) // For mobile toggle
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
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

  // Fetch students using tRPC
  const { data: studentsData, isLoading: studentsLoading } = trpc.students.list.useQuery()
  const { data: statsData } = trpc.students.stats.useQuery()

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
        program: s.program
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
    
    return matchesSearch && matchesStatus
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

  // Map ready handler
  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    
    // Add markers for students with coordinates
    // For demo, we'll add some sample markers around San Francisco
    const sampleLocations = [
      { lat: 37.7749, lng: -122.4194 },
      { lat: 37.7849, lng: -122.4094 },
      { lat: 37.7649, lng: -122.4294 },
      { lat: 37.7799, lng: -122.4144 },
      { lat: 37.7699, lng: -122.4244 },
    ]
    
    students.slice(0, 5).forEach((student, index) => {
      if (sampleLocations[index]) {
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: sampleLocations[index],
          title: `${student.first_name} ${student.last_name}`,
        })
        markersRef.current.push(marker)
      }
    })
  }, [students])

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
    <div className="h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500">Manage your dojo's student roster</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
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
            isMobile ? 'h-[350px] flex-shrink-0' : 'h-[calc(100vh-140px)]'
          }`}
          style={isMobile ? {} : { 
            flexBasis: isMapExpanded ? '100%' : isTablet ? '35%' : `${mapWidth}%`,
            minWidth: isMapExpanded ? '100%' : isTablet ? '35%' : '25%',
            maxWidth: isMapExpanded ? '100%' : isTablet ? '35%' : '70%'
          }}
        >
          {/* Map Card Container */}
          <div className="flex flex-col bg-white border border-slate-200 rounded-[18px] shadow-[0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden flex-1">
          {/* Map Header */}
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[160px] h-8 text-sm">
                  <SelectValue placeholder="Saved Views" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="nearby">Nearby (5 mi)</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="main">
                <SelectTrigger className="w-[140px] h-8 text-sm">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Dojo</SelectItem>
                  <SelectItem value="branch">Branch Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8"
              onClick={() => setIsMapExpanded(!isMapExpanded)}
            >
              {isMapExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative min-h-[300px]">
            <MapView 
              className="w-full h-full absolute inset-0"
              initialCenter={{ lat: 37.7749, lng: -122.4194 }}
              initialZoom={12}
              onMapReady={handleMapReady}
            />
          </div>

          {/* Stats Strip - inside card */}
          <div className="bg-white border-t border-slate-200 p-4">
            <StatsStrip stats={stats} />
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

        {/* Draggable Divider - Desktop only */}
        {!isMapExpanded && !isMobile && !isTablet && (
          <div 
            className="w-1.5 bg-transparent cursor-col-resize relative hover:bg-slate-300 transition-colors group"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-16 bg-slate-300 rounded-full group-hover:bg-slate-400 transition-colors" />
          </div>
        )}

        {/* Right Pane - Search + Cards */}
        {!isMapExpanded && (
          <div 
            className={`flex flex-col bg-white ${
              isMobile ? 'flex-1' : 'h-[calc(100vh-140px)]'
            }`}
            style={isMobile ? {} : { flex: 1, paddingTop: '16px', paddingRight: '16px', paddingBottom: '16px', paddingLeft: '8px' }}
          >
            {/* Students List Header */}
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, belt, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 rounded-full border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Filters Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[120px] h-8 text-sm">
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="kids">Kids BJJ</SelectItem>
                    <SelectItem value="adult">Adult BJJ</SelectItem>
                    <SelectItem value="mma">MMA</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[120px] h-8 text-sm">
                    <SelectValue placeholder="Belt Rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Belts</SelectItem>
                    <SelectItem value="white">White Belt</SelectItem>
                    <SelectItem value="blue">Blue Belt</SelectItem>
                    <SelectItem value="purple">Purple Belt</SelectItem>
                    <SelectItem value="brown">Brown Belt</SelectItem>
                    <SelectItem value="black">Black Belt</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px] h-8 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pending Cancel">Pending Cancel</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="h-3 w-3 mr-1" />
                  More
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
                    onEdit={() => console.log('Edit', student.id)}
                    onPayment={() => console.log('Payment', student.id)}
                    onDelete={() => console.log('Delete', student.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
