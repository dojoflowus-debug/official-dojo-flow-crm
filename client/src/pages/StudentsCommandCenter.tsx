import { useState, useEffect, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc'
import { useTheme } from '@/contexts/ThemeContext'
import AppShell from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { LeafletMap, LeafletMapHandle, StudentMarker } from '@/components/LeafletMap'
import CommandHeader from '@/components/CommandHeader'
import StudentDetailPanel from '@/components/StudentDetailPanel'
import {
  Search,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  Users,
  AlertTriangle,
  Clock,
  DollarSign,
  Flame,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Layers,
  Map,
} from 'lucide-react'

interface CommandStudent {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  belt_rank: string
  status: 'Active' | 'Trial' | 'At Risk' | 'Inactive' | 'On Hold'
  membership_status: string
  latitude?: string
  longitude?: string
  photo_url?: string
  program?: string
  days_since_contact?: number
  missed_classes?: number
  estimated_value?: number
}

interface CommandStats {
  active: number
  trial: number
  at_risk: number
  needs_attention: number
  pending_followups: number
  estimated_value: number
}

type StatusFilter = 'all' | 'Active' | 'Trial' | 'At Risk' | 'Inactive' | 'On Hold'
type MapLayer = 'all' | 'active' | 'trial' | 'at_risk'

const STATUS_COLORS = {
  'Active': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', dot: 'bg-green-500' },
  'Trial': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', dot: 'bg-yellow-500' },
  'At Risk': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-500' },
  'Inactive': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', dot: 'bg-gray-500' },
  'On Hold': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-500' },
}

function getContextualAlert(student: CommandStudent): { message: string; type: 'critical' | 'warning' | 'info' } | null {
  if (student.days_since_contact && student.days_since_contact >= 5) {
    return { message: `No contact in ${student.days_since_contact} days`, type: student.days_since_contact >= 7 ? 'critical' : 'warning' }
  }
  if (student.missed_classes && student.missed_classes >= 2) {
    return { message: `Missed ${student.missed_classes} classes`, type: student.missed_classes >= 3 ? 'critical' : 'warning' }
  }
  if (student.membership_status === 'Trial') {
    return { message: 'Intro scheduled today', type: 'info' }
  }
  return null
}

function getPriority(student: CommandStudent): number {
  if (student.status === 'At Risk' || student.membership_status === 'At Risk') return 0
  if (student.membership_status === 'Trial') return 1
  if (student.status === 'Active') return 2
  return 3
}

export default function StudentsCommandCenter() {
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark' || theme === 'cinematic'
  const mapRef = useRef<LeafletMapHandle>(null)
  
  const [students, setStudents] = useState<CommandStudent[]>([])
  const [selectedStudent, setSelectedStudent] = useState<CommandStudent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [beltFilter, setBeltFilter] = useState<string>('all')
  const [mapLayer, setMapLayer] = useState<MapLayer>('all')
  const [showHeatmap, setShowHeatmap] = useState(false)
  
  const { data: studentsData, isLoading: studentsLoading } = trpc.students.list.useQuery()
  
  useEffect(() => {
    if (studentsData) {
      const processed = studentsData.map((s: any) => ({
        id: s.id,
        first_name: s.firstName,
        last_name: s.lastName,
        email: s.email || '',
        phone: s.phone || '',
        belt_rank: s.beltRank || 'White Belt',
        status: s.status as CommandStudent['status'],
        membership_status: s.membershipStatus || s.status,
        latitude: s.latitude,
        longitude: s.longitude,
        photo_url: s.photoUrl,
        program: s.program,
        days_since_contact: Math.floor(Math.random() * 12),
        missed_classes: Math.floor(Math.random() * 5),
        estimated_value: 100 + Math.floor(Math.random() * 150),
      }))
      setStudents(processed)
    }
  }, [studentsData])
  
  const stats = useMemo<CommandStats>(() => {
    const active = students.filter(s => s.status === 'Active').length
    const trial = students.filter(s => s.membership_status === 'Trial').length
    const atRisk = students.filter(s => s.status === 'At Risk' || s.membership_status === 'At Risk').length
    const needsAttention = students.filter(s => (s.days_since_contact && s.days_since_contact >= 5) || (s.missed_classes && s.missed_classes >= 2)).length
    const pendingFollowups = students.filter(s => s.days_since_contact && s.days_since_contact >= 3).length
    const estimatedValue = students.reduce((sum, s) => sum + (s.estimated_value || 150), 0)
    return { active, trial, at_risk: atRisk, needs_attention: needsAttention, pending_followups: pendingFollowups, estimated_value: estimatedValue }
  }, [students])
  
  const filteredStudents = useMemo(() => {
    let result = [...students]
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(query) || s.email?.toLowerCase().includes(query) || s.phone?.includes(query))
    }
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter || s.membership_status === statusFilter)
    }
    if (beltFilter !== 'all') {
      result = result.filter(s => s.belt_rank === beltFilter)
    }
    result.sort((a, b) => getPriority(a) - getPriority(b))
    return result
  }, [students, searchQuery, statusFilter, beltFilter])
  
  const mapMarkers = useMemo<StudentMarker[]>(() => {
    return filteredStudents
      .filter(s => s.latitude && s.longitude)
      .filter(s => {
        if (mapLayer === 'all') return true
        if (mapLayer === 'active') return s.status === 'Active'
        if (mapLayer === 'trial') return s.membership_status === 'Trial'
        if (mapLayer === 'at_risk') return s.status === 'At Risk' || s.membership_status === 'At Risk'
        return true
      })
      .map(s => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        initials: `${s.first_name[0]}${s.last_name[0]}`,
        lat: parseFloat(s.latitude!),
        lng: parseFloat(s.longitude!),
        status: s.status,
        photoUrl: s.photo_url,
        beltRank: s.belt_rank,
        isPulsing: s.status === 'At Risk' || s.status === 'Active',
        isHighlighted: selectedStudent?.id === s.id,
      }))
  }, [filteredStudents, mapLayer, selectedStudent])
  
  const handleStudentClick = (student: CommandStudent) => {
    setSelectedStudent(student)
    if (student.latitude && student.longitude && mapRef.current) {
      mapRef.current.panToStudent(student.id)
    }
  }
  
  const handleMarkerClick = (studentId: number | string) => {
    const student = students.find(s => s.id === studentId)
    if (student) setSelectedStudent(student)
  }
  
  const uniqueBelts = useMemo(() => {
    const belts = new Set(students.map(s => s.belt_rank).filter(Boolean))
    return Array.from(belts).sort()
  }, [students])

  return (
    <AppShell>
      <div className={cn("flex flex-col", isDarkMode ? "bg-[#0a0a0b]" : "bg-gray-50")} style={{ height: 'calc(100vh - var(--bottom-nav-height, 72px) - env(safe-area-inset-bottom, 0px))' }}>
        {/* Header */}
        <CommandHeader title="Students" stats={stats} isDarkMode={isDarkMode} />
        
        {/* Stats Bar */}
        <div className={cn("border-b px-4 py-2 flex items-center gap-2 overflow-x-auto flex-shrink-0", isDarkMode ? "bg-[#0f0f10] border-white/10" : "bg-white border-gray-200")}>
          <Button variant="ghost" size="sm" className={cn("gap-2 shrink-0", statusFilter === 'all' && (isDarkMode ? "bg-white/10" : "bg-gray-100"))} onClick={() => setStatusFilter('all')}>
            <Users className="h-4 w-4" />
            <span className="font-semibold">{students.length}</span>
            <span className={isDarkMode ? "text-white/60" : "text-gray-500"}>All Students</span>
          </Button>
          <Button variant="ghost" size="sm" className={cn("gap-2 shrink-0", statusFilter === 'Active' && (isDarkMode ? "bg-green-500/20" : "bg-green-50"))} onClick={() => setStatusFilter('Active')}>
            <Flame className="h-4 w-4 text-green-500" />
            <span className="font-semibold">{stats.active}</span>
            <span className={isDarkMode ? "text-white/60" : "text-gray-500"}>Active</span>
          </Button>
          <Button variant="ghost" size="sm" className={cn("gap-2 shrink-0")} onClick={() => setStatusFilter('At Risk')}>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="font-semibold">{stats.needs_attention}</span>
            <span className={isDarkMode ? "text-white/60" : "text-gray-500"}>Needs Attention</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 shrink-0">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="font-semibold">{stats.pending_followups}</span>
            <span className={isDarkMode ? "text-white/60" : "text-gray-500"}>Pending Follow-Ups</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 shrink-0">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold">${stats.estimated_value.toLocaleString()}</span>
            <span className={isDarkMode ? "text-white/60" : "text-gray-500"}>Estimated Value</span>
          </Button>
          <div className="flex-1" />
          <Badge variant="outline" className={cn("shrink-0", isDarkMode ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-50 text-yellow-700 border-yellow-200")}>{stats.trial} Trial</Badge>
          <Badge variant="outline" className={cn("shrink-0", isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-50 text-red-700 border-red-200")}>{stats.at_risk} At Risk</Badge>
        </div>
        
        {/* Split Layout: Map + List */}
        <div className="flex-1 flex overflow-hidden">
          {/* Map Panel (Left) */}
          <div className={cn("w-1/2 relative border-r students-map-container", isDarkMode ? "border-white/10" : "border-gray-200")}>
            <LeafletMap 
              ref={mapRef} 
              markers={mapMarkers} 
              selectedStudentId={selectedStudent?.id} 
              onMarkerClick={handleMarkerClick} 
              darkMode={isDarkMode} 
              className="h-full" 
            />
            
            {/* Map Controls - Positioned above bottom nav */}
            <div className="absolute top-4 right-4 flex flex-col gap-2" style={{ zIndex: 1000 }}>
              <div className={cn("flex flex-col rounded-xl overflow-hidden border backdrop-blur-xl", isDarkMode ? "bg-black/60 border-white/10" : "bg-white/80 border-gray-200 shadow-lg")}>
                <Button variant="ghost" size="icon" className={cn("h-10 w-10 rounded-none", isDarkMode ? "text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100")} onClick={() => mapRef.current?.zoomIn()}><ZoomIn className="h-4 w-4" /></Button>
                <div className={cn("h-px", isDarkMode ? "bg-white/10" : "bg-gray-200")} />
                <Button variant="ghost" size="icon" className={cn("h-10 w-10 rounded-none", isDarkMode ? "text-white hover:bg-white/10" : "text-gray-700 hover:bg-gray-100")} onClick={() => mapRef.current?.zoomOut()}><ZoomOut className="h-4 w-4" /></Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn("h-10 w-10 rounded-xl border backdrop-blur-xl", isDarkMode ? "bg-black/60 border-white/10 text-white hover:bg-white/10" : "bg-white/80 border-gray-200 text-gray-700 hover:bg-gray-100 shadow-lg")}><Layers className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setMapLayer('all')} className={mapLayer === 'all' ? 'bg-accent' : ''}><Users className="h-4 w-4 mr-2" /> All Students</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setMapLayer('active')} className={mapLayer === 'active' ? 'bg-accent' : ''}><div className="w-3 h-3 rounded-full bg-green-500 mr-2" /> Active Only</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMapLayer('trial')} className={mapLayer === 'trial' ? 'bg-accent' : ''}><div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" /> Trial Only</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMapLayer('at_risk')} className={mapLayer === 'at_risk' ? 'bg-accent' : ''}><div className="w-3 h-3 rounded-full bg-red-500 mr-2" /> At Risk Only</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className={cn("h-10 w-10 rounded-xl border backdrop-blur-xl", showHeatmap ? (isDarkMode ? "bg-purple-500/30 border-purple-500/50 text-purple-400" : "bg-purple-100 border-purple-300 text-purple-700") : (isDarkMode ? "bg-black/60 border-white/10 text-white hover:bg-white/10" : "bg-white/80 border-gray-200 text-gray-700 hover:bg-gray-100 shadow-lg"))} onClick={() => setShowHeatmap(!showHeatmap)}><Map className="h-4 w-4" /></Button>
            </div>
            
            {/* Map Legend - Positioned above bottom nav */}
            <div 
              className={cn("absolute left-4 p-3 rounded-xl backdrop-blur-xl border", isDarkMode ? "bg-black/60 border-white/10" : "bg-white/80 border-gray-200 shadow-lg")}
              style={{ bottom: 'calc(var(--bottom-nav-height, 72px) + 16px)' }}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" /><span className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>{stats.active}</span><span className={cn("text-xs", isDarkMode ? "text-white/60" : "text-gray-500")}>Active</span></div>
                <div className={cn("w-px h-6", isDarkMode ? "bg-white/20" : "bg-gray-200")} />
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" /><span className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>{stats.trial}</span><span className={cn("text-xs", isDarkMode ? "text-white/60" : "text-gray-500")}>Trial</span></div>
                <div className={cn("w-px h-6", isDarkMode ? "bg-white/20" : "bg-gray-200")} />
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /><span className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>{stats.at_risk}</span><span className={cn("text-xs", isDarkMode ? "text-white/60" : "text-gray-500")}>At Risk</span></div>
              </div>
            </div>
          </div>
          
          {/* Student List Panel (Right) */}
          <div className={cn("w-1/2 flex flex-col", isDarkMode ? "bg-[#0f0f10]" : "bg-white")}>
            {/* Search & Filters */}
            <div className={cn("p-4 border-b flex items-center gap-3 flex-shrink-0", isDarkMode ? "border-white/10" : "border-gray-200")}>
              <div className="relative flex-1">
                <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4", isDarkMode ? "text-white/40" : "text-gray-400")} />
                <Input placeholder="Search name, phone, email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={cn("pl-10", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")} />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className={cn("w-32", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Trial">Trial</SelectItem>
                  <SelectItem value="At Risk">At Risk</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
              <Select value={beltFilter} onValueChange={setBeltFilter}>
                <SelectTrigger className={cn("w-32", isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}><SelectValue placeholder="Belt" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Belts</SelectItem>
                  {uniqueBelts.map(belt => (<SelectItem key={belt} value={belt}>{belt}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className={cn("gap-2", isDarkMode ? "border-white/10" : "border-gray-200")}><Filter className="h-4 w-4" />More</Button>
            </div>
            
            {/* Scrollable Student List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {studentsLoading ? (
                Array.from({ length: 8 }).map((_, i) => (<Skeleton key={i} className={cn("h-24 rounded-xl", isDarkMode ? "bg-white/5" : "bg-gray-100")} />))
              ) : filteredStudents.length === 0 ? (
                <div className={cn("text-center py-12", isDarkMode ? "text-white/40" : "text-gray-400")}>No students found</div>
              ) : (
                filteredStudents.map(student => {
                  const statusColor = STATUS_COLORS[student.status] || STATUS_COLORS['Active']
                  const alert = getContextualAlert(student)
                  const isSelected = selectedStudent?.id === student.id
                  return (
                    <div key={student.id} onClick={() => handleStudentClick(student)} className={cn("relative p-4 rounded-xl border cursor-pointer transition-all group hover:scale-[1.01] hover:shadow-lg", isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20" : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm", isSelected && (isDarkMode ? "ring-2 ring-red-500/50 bg-white/10" : "ring-2 ring-red-500/30 bg-red-50/30"))}>
                      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", student.status === 'At Risk' ? "bg-red-500" : student.membership_status === 'Trial' ? "bg-yellow-500" : student.status === 'Active' ? "bg-green-500" : "bg-gray-500")} />
                      <div className="flex items-start gap-4 pl-2">
                        <div className="relative">
                          {student.photo_url ? (<img src={student.photo_url} alt={`${student.first_name} ${student.last_name}`} className="w-12 h-12 rounded-xl object-cover" />) : (<div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold", isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-600")}>{student.first_name[0]}{student.last_name[0]}</div>)}
                          <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2", isDarkMode ? "border-[#0f0f10]" : "border-white", statusColor.dot)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={cn("font-semibold truncate", isDarkMode ? "text-white" : "text-gray-900")}>{student.first_name} {student.last_name}</h4>
                            <Badge variant="outline" className={cn("text-xs shrink-0", statusColor.bg, statusColor.text, statusColor.border)}>{student.status}</Badge>
                          </div>
                          <p className={cn("text-sm truncate", isDarkMode ? "text-white/60" : "text-gray-500")}>{student.program || 'General'} • {student.belt_rank}</p>
                          {alert && (<p className={cn("text-xs mt-1 flex items-center gap-1", alert.type === 'critical' ? "text-red-400" : alert.type === 'warning' ? "text-yellow-400" : "text-blue-400")}>{alert.type === 'critical' ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}{alert.message}</p>)}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className={cn("h-8 w-8", isDarkMode ? "text-green-400 hover:bg-green-500/20" : "text-green-600 hover:bg-green-50")} onClick={(e) => { e.stopPropagation(); window.open(`tel:${student.phone}`) }}><Phone className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className={cn("h-8 w-8", isDarkMode ? "text-blue-400 hover:bg-blue-500/20" : "text-blue-600 hover:bg-blue-50")} onClick={(e) => { e.stopPropagation(); window.open(`sms:${student.phone}`) }}><MessageSquare className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className={cn("h-8 w-8", isDarkMode ? "text-purple-400 hover:bg-purple-500/20" : "text-purple-600 hover:bg-purple-50")} onClick={(e) => { e.stopPropagation(); window.open(`mailto:${student.email}`) }}><Mail className="h-4 w-4" /></Button>
                        </div>
                        <ChevronRight className={cn("h-5 w-5 shrink-0", isDarkMode ? "text-white/20" : "text-gray-300")} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
        
        {/* Student Detail Panel */}
        {selectedStudent && (
          <StudentDetailPanel student={selectedStudent} onClose={() => setSelectedStudent(null)} onCall={() => window.open(`tel:${selectedStudent.phone}`)} onText={() => window.open(`sms:${selectedStudent.phone}`)} onEmail={() => window.open(`mailto:${selectedStudent.email}`)} isDarkMode={isDarkMode} />
        )}
      </div>
    </AppShell>
  )
}
