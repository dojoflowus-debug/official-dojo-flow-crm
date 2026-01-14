import { useState, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc'
import { useTheme } from '@/contexts/ThemeContext'
import { toast } from 'sonner'
import ManagementLayout from '@/components/ManagementLayout'
import AddStudentWizard from '@/components/AddStudentWizard'
import StudentModal from '@/components/StudentModal'
import { LeafletMap, LeafletMapHandle, StudentMarker } from '@/components/LeafletMap'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  Users,
  UserPlus,
  Map,
  List,
  MoreHorizontal,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'

interface Student {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  beltRank: string
  status: 'Active' | 'Trial' | 'At Risk' | 'Inactive' | 'On Hold'
  membershipStatus: string
  latitude?: string
  longitude?: string
  photoUrl?: string
  program?: string
  createdAt?: string
}

type ViewMode = 'list' | 'map'
type StatusFilter = 'all' | 'Active' | 'Trial' | 'At Risk' | 'Inactive' | 'On Hold'

const STATUS_STYLES = {
  'Active': { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400' },
  'Trial': { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400' },
  'At Risk': { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400' },
  'Inactive': { bg: 'bg-gray-100 dark:bg-gray-500/20', text: 'text-gray-700 dark:text-gray-400' },
  'On Hold': { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-400' },
}

export default function StudentsManagement() {
  const { theme } = useTheme()
  const isDark = theme === 'dark' || theme === 'cinematic'
  const mapRef = useRef<LeafletMapHandle>(null)
  
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [beltFilter, setBeltFilter] = useState<string>('all')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showAddWizard, setShowAddWizard] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  
  const utils = trpc.useUtils()
  const { data: studentsData, isLoading } = trpc.students.list.useQuery()
  
  // Process students data
  const students = useMemo(() => {
    if (!studentsData) return []
    return studentsData.map((s: any) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email || '',
      phone: s.phone || '',
      beltRank: s.beltRank || 'White Belt',
      status: s.status as Student['status'],
      membershipStatus: s.membershipStatus || s.status,
      latitude: s.latitude,
      longitude: s.longitude,
      photoUrl: s.photoUrl,
      program: s.program,
      createdAt: s.createdAt,
    }))
  }, [studentsData])
  
  // Calculate stats
  const stats = useMemo(() => {
    const active = students.filter(s => s.status === 'Active').length
    const trial = students.filter(s => s.membershipStatus === 'Trial').length
    const atRisk = students.filter(s => s.status === 'At Risk').length
    const inactive = students.filter(s => s.status === 'Inactive').length
    return { total: students.length, active, trial, atRisk, inactive }
  }, [students])
  
  // Filter students
  const filteredStudents = useMemo(() => {
    let result = [...students]
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(s => 
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.phone?.includes(query)
      )
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter || s.membershipStatus === statusFilter)
    }
    
    if (beltFilter !== 'all') {
      result = result.filter(s => s.beltRank === beltFilter)
    }
    
    return result
  }, [students, searchQuery, statusFilter, beltFilter])
  
  // Map markers
  const mapMarkers = useMemo<StudentMarker[]>(() => {
    return filteredStudents
      .filter(s => s.latitude && s.longitude)
      .map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        initials: `${s.firstName[0]}${s.lastName[0]}`,
        lat: parseFloat(s.latitude!),
        lng: parseFloat(s.longitude!),
        status: s.status,
        photoUrl: s.photoUrl,
        beltRank: s.beltRank,
        isPulsing: s.status === 'At Risk',
        isHighlighted: selectedStudent?.id === s.id,
      }))
  }, [filteredStudents, selectedStudent])
  
  // Get unique belt ranks
  const uniqueBelts = useMemo(() => {
    const belts = new Set(students.map(s => s.beltRank).filter(Boolean))
    return Array.from(belts).sort()
  }, [students])
  
  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student)
    if (viewMode === 'map' && student.latitude && student.longitude && mapRef.current) {
      mapRef.current.panToStudent(student.id)
    }
  }
  
  const handleMarkerClick = (studentId: number | string) => {
    const student = students.find(s => s.id === studentId)
    if (student) setSelectedStudent(student)
  }
  
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setEditModalOpen(true)
  }

  return (
    <ManagementLayout title="Students">
      <div className="container py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={cn(
              "text-2xl font-bold tracking-tight",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Students
            </h1>
            <p className={cn(
              "text-sm mt-1",
              isDark ? "text-white/60" : "text-gray-500"
            )}>
              Manage your dojo's student roster
            </p>
          </div>
          
          <Button onClick={() => setShowAddWizard(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className={cn(isDark && "bg-white/5 border-white/10")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  isDark ? "bg-white/10" : "bg-gray-100"
                )}>
                  <Users className={cn("h-5 w-5", isDark ? "text-white" : "text-gray-600")} />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                    {stats.total}
                  </p>
                  <p className={cn("text-xs", isDark ? "text-white/60" : "text-gray-500")}>
                    Total Students
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(isDark && "bg-white/5 border-white/10")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                    {stats.active}
                  </p>
                  <p className={cn("text-xs", isDark ? "text-white/60" : "text-gray-500")}>
                    Active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(isDark && "bg-white/5 border-white/10")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-500/20">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                    {stats.trial}
                  </p>
                  <p className={cn("text-xs", isDark ? "text-white/60" : "text-gray-500")}>
                    Trial
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(isDark && "bg-white/5 border-white/10")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-500/20">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                    {stats.atRisk}
                  </p>
                  <p className={cn("text-xs", isDark ? "text-white/60" : "text-gray-500")}>
                    At Risk
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(isDark && "bg-white/5 border-white/10")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  isDark ? "bg-white/10" : "bg-gray-100"
                )}>
                  <Users className={cn("h-5 w-5", isDark ? "text-white/60" : "text-gray-400")} />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                    {stats.inactive}
                  </p>
                  <p className={cn("text-xs", isDark ? "text-white/60" : "text-gray-500")}>
                    Inactive
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters & View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                isDark ? "text-white/40" : "text-gray-400"
              )} />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-9",
                  isDark && "bg-white/5 border-white/10"
                )}
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className={cn(
                "w-[140px]",
                isDark && "bg-white/5 border-white/10"
              )}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Trial">Trial</SelectItem>
                <SelectItem value="At Risk">At Risk</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Belt Filter */}
            <Select value={beltFilter} onValueChange={setBeltFilter}>
              <SelectTrigger className={cn(
                "w-[140px]",
                isDark && "bg-white/5 border-white/10"
              )}>
                <SelectValue placeholder="Belt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Belts</SelectItem>
                {uniqueBelts.map(belt => (
                  <SelectItem key={belt} value={belt}>{belt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* View Toggle */}
          <div className={cn(
            "flex items-center rounded-lg border p-1",
            isDark ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"
          )}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3",
                viewMode === 'list' && (isDark ? "bg-white/10 text-white" : "bg-white shadow-sm")
              )}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3",
                viewMode === 'map' && (isDark ? "bg-white/10 text-white" : "bg-white shadow-sm")
              )}
              onClick={() => setViewMode('map')}
            >
              <Map className="h-4 w-4 mr-2" />
              Map
            </Button>
          </div>
        </div>
        
        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <Card className={cn(isDark && "bg-white/5 border-white/10")}>
            <Table>
              <TableHeader>
                <TableRow className={isDark ? "border-white/10" : ""}>
                  <TableHead className={isDark ? "text-white/60" : ""}>Student</TableHead>
                  <TableHead className={isDark ? "text-white/60" : ""}>Contact</TableHead>
                  <TableHead className={isDark ? "text-white/60" : ""}>Belt</TableHead>
                  <TableHead className={isDark ? "text-white/60" : ""}>Status</TableHead>
                  <TableHead className={isDark ? "text-white/60" : ""}>Program</TableHead>
                  <TableHead className={cn("text-right", isDark ? "text-white/60" : "")}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className={isDark ? "text-white/60" : "text-gray-500"}>
                        No students found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow 
                      key={student.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isDark 
                          ? "border-white/10 hover:bg-white/5" 
                          : "hover:bg-gray-50",
                        selectedStudent?.id === student.id && (isDark ? "bg-white/10" : "bg-gray-100")
                      )}
                      onClick={() => handleStudentClick(student)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={student.photoUrl} />
                            <AvatarFallback className={cn(
                              "text-xs font-medium",
                              isDark ? "bg-white/10 text-white" : "bg-gray-100"
                            )}>
                              {student.firstName[0]}{student.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className={cn(
                              "font-medium",
                              isDark ? "text-white" : "text-gray-900"
                            )}>
                              {student.firstName} {student.lastName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {student.email && (
                            <p className={cn(
                              "text-sm flex items-center gap-1",
                              isDark ? "text-white/60" : "text-gray-500"
                            )}>
                              <Mail className="h-3 w-3" />
                              {student.email}
                            </p>
                          )}
                          {student.phone && (
                            <p className={cn(
                              "text-sm flex items-center gap-1",
                              isDark ? "text-white/60" : "text-gray-500"
                            )}>
                              <Phone className="h-3 w-3" />
                              {student.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-sm",
                          isDark ? "text-white/80" : "text-gray-700"
                        )}>
                          {student.beltRank}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={cn(
                            STATUS_STYLES[student.status]?.bg,
                            STATUS_STYLES[student.status]?.text
                          )}
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-sm",
                          isDark ? "text-white/60" : "text-gray-500"
                        )}>
                          {student.program || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              handleEditStudent(student)
                            }}>
                              Edit Student
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              toast.info('Feature coming soon')
                            }}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              toast.info('Feature coming soon')
                            }}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send SMS
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              handleStudentClick(student)
                            }}>
                              View Profile
                              <ChevronRight className="h-4 w-4 ml-auto" />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        ) : (
          /* Map View */
          <Card className={cn(
            "overflow-hidden",
            isDark && "bg-white/5 border-white/10"
          )}>
            <div className="h-[600px] relative">
              <LeafletMap
                ref={mapRef}
                markers={mapMarkers}
                onMarkerClick={handleMarkerClick}
                selectedMarkerId={selectedStudent?.id}
                className="h-full w-full"
              />
              
              {/* Selected Student Overlay */}
              {selectedStudent && (
                <div className={cn(
                  "absolute bottom-4 left-4 right-4 md:right-auto md:w-80 p-4 rounded-lg border shadow-lg",
                  isDark 
                    ? "bg-[#1a1a1c]/95 border-white/10 backdrop-blur-sm" 
                    : "bg-white/95 border-gray-200 backdrop-blur-sm"
                )}>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedStudent.photoUrl} />
                      <AvatarFallback className={isDark ? "bg-white/10 text-white" : ""}>
                        {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-semibold truncate",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </p>
                      <p className={cn(
                        "text-sm",
                        isDark ? "text-white/60" : "text-gray-500"
                      )}>
                        {selectedStudent.beltRank}
                      </p>
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "mt-1",
                          STATUS_STYLES[selectedStudent.status]?.bg,
                          STATUS_STYLES[selectedStudent.status]?.text
                        )}
                      >
                        {selectedStudent.status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStudent(null)}
                    >
                      ×
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1 gap-1">
                      <Phone className="h-3 w-3" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1">
                      <MessageSquare className="h-3 w-3" />
                      SMS
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => handleEditStudent(selectedStudent)}>
                      View
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
      
      {/* Add Student Wizard */}
      <AddStudentWizard
        isOpen={showAddWizard}
        onClose={() => setShowAddWizard(false)}
        onSuccess={() => {
          setShowAddWizard(false)
          utils.students.list.invalidate()
          toast.success('Student added successfully')
        }}
      />
      
      {/* Edit Student Modal */}
      {editingStudent && (
        <StudentModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setEditingStudent(null)
          }}
          student={{
            id: editingStudent.id,
            first_name: editingStudent.firstName,
            last_name: editingStudent.lastName,
            email: editingStudent.email,
            phone: editingStudent.phone,
            belt_rank: editingStudent.beltRank,
            status: editingStudent.status,
            membership_status: editingStudent.membershipStatus,
            photo_url: editingStudent.photoUrl,
            program: editingStudent.program,
          }}
          onSave={() => {
            utils.students.list.invalidate()
            setEditModalOpen(false)
            setEditingStudent(null)
          }}
        />
      )}
    </ManagementLayout>
  )
}
