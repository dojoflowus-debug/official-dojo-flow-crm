import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Map,
  List,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
} from 'lucide-react'

// Types
interface StudentMetric {
  label: string
  value: number
  trend?: number
  trendDirection?: 'up' | 'down'
  icon: React.ReactNode
  color: string
}

interface Student {
  id: number
  name: string
  email: string
  status: 'active' | 'at_risk' | 'inactive' | 'on_hold'
  program: string
  enrollmentDate: string
  lastContact?: string
  attendance?: number
  beltRank?: string
  location?: { lat: number; lng: number }
}

interface AnalyticsData {
  enrollments: Array<{ month: string; count: number }>
  retention: Array<{ month: string; retention: number; dropout: number }>
}

export default function StudentsDashboard() {
  const [view, setView] = useState<'list' | 'map'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const [metrics, setMetrics] = useState<StudentMetric[]>([
    {
      label: 'Total Students',
      value: 245,
      trend: 12,
      trendDirection: 'up',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-500',
    },
    {
      label: 'Active',
      value: 185,
      trend: 8,
      trendDirection: 'up',
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'bg-green-500',
    },
    {
      label: 'At Risk',
      value: 25,
      trend: 3,
      trendDirection: 'up',
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'bg-yellow-500',
    },
    {
      label: 'Inactive',
      value: 25,
      trend: 2,
      trendDirection: 'down',
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-red-500',
    },
    {
      label: 'Inactive',
      value: 15,
      trend: 1,
      trendDirection: 'down',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-gray-500',
    },
    {
      label: 'AI Idle',
      value: 88,
      trend: 5,
      trendDirection: 'up',
      icon: <Zap className="w-5 h-5" />,
      color: 'bg-purple-500',
    },
    {
      label: 'Mod Granny',
      value: 10,
      trend: 0,
      trendDirection: 'up',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-indigo-500',
    },
  ])

  const [students, setStudents] = useState<Student[]>([
    {
      id: 1,
      name: 'Vincent Holmes',
      email: 'vincent@example.com',
      status: 'active',
      program: 'Youth Program',
      enrollmentDate: '2023-06-13',
      lastContact: '1 day ago',
      attendance: 85,
      beltRank: 'White Belt',
      location: { lat: 40.7128, lng: -74.006 },
    },
    // Add more mock students as needed
  ])

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    enrollments: [
      { month: 'May', count: 20 },
      { month: 'Jun', count: 25 },
      { month: 'Jul', count: 18 },
      { month: 'Aug', count: 30 },
      { month: 'Sep', count: 28 },
      { month: 'Oct', count: 35 },
    ],
    retention: [
      { month: 'May', retention: 92, dropout: 8 },
      { month: 'Jun', retention: 90, dropout: 10 },
      { month: 'Jul', retention: 88, dropout: 12 },
      { month: 'Aug', retention: 91, dropout: 9 },
      { month: 'Sep', retention: 89, dropout: 11 },
      { month: 'Oct', retention: 93, dropout: 7 },
    ],
  })

  // Filter students based on search and filters
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || student.status === statusFilter

      const matchesSegment = segmentFilter === 'all' // Add segment logic as needed

      return matchesSearch && matchesStatus && matchesSegment
    })
  }, [students, searchQuery, statusFilter, segmentFilter])

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      at_risk: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
      on_hold: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Students</h1>
            <p className="text-slate-400">Manage your dojo's student roster</p>
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, idx) => (
            <Card key={idx} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                    {metric.trend !== undefined && (
                      <div className="flex items-center mt-2">
                        {metric.trendDirection === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span
                          className={
                            metric.trendDirection === 'up'
                              ? 'text-green-500 text-xs'
                              : 'text-red-500 text-xs'
                          }
                        >
                          {metric.trend}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`${metric.color} p-3 rounded-lg text-white`}>
                    {metric.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search students..."
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="at_risk">At Risk</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Segments" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Segments</SelectItem>
              <SelectItem value="youth">Youth Program</SelectItem>
              <SelectItem value="adult">Adult Program</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
            className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
          >
            <List className="w-4 h-4 mr-2" />
            List
          </Button>

          <Button
            variant={view === 'map' ? 'default' : 'outline'}
            onClick={() => setView('map')}
            className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
          >
            <Map className="w-4 h-4 mr-2" />
            Map
          </Button>

          <Button
            variant={showAnalytics ? 'default' : 'outline'}
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
          >
            Analytics
          </Button>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Student List or Map */}
          <div className="lg:col-span-2">
            {view === 'list' ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Student Roster</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className="p-4 bg-slate-700 rounded-lg hover:bg-slate-600 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">
                              {student.name}
                            </h3>
                            <p className="text-sm text-slate-400">
                              {student.email}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {student.program}
                            </p>
                          </div>
                          <Badge className={getStatusBadgeColor(student.status)}>
                            {student.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800 border-slate-700 h-[500px]">
                <CardContent className="p-6 h-full flex items-center justify-center">
                  <p className="text-slate-400">Map view coming soon</p>
                </CardContent>
              </Card>
            )}

            {/* Analytics Section */}
            {showAnalytics && (
              <Card className="bg-slate-800 border-slate-700 mt-6">
                <CardHeader>
                  <CardTitle className="text-white">Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-700 rounded-lg">
                      <h4 className="text-sm text-slate-400 mb-2">
                        Enrollments & Cancellations
                      </h4>
                      <p className="text-slate-500 text-xs">
                        Chart visualization coming soon
                      </p>
                    </div>
                    <div className="p-4 bg-slate-700 rounded-lg">
                      <h4 className="text-sm text-slate-400 mb-2">
                        Retention vs. Dropout Rate
                      </h4>
                      <p className="text-slate-500 text-xs">
                        Chart visualization coming soon
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Student Detail Panel */}
          {selectedStudent && (
            <Card className="bg-slate-800 border-slate-700 h-fit sticky top-6">
              <CardHeader className="border-b border-slate-700">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white">
                    {selectedStudent.name}
                  </CardTitle>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Status
                  </p>
                  <Badge className={getStatusBadgeColor(selectedStudent.status)}>
                    {selectedStudent.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                    Program
                  </p>
                  <p className="text-white">{selectedStudent.program}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                    Email
                  </p>
                  <p className="text-white text-sm">{selectedStudent.email}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                    Enrollment Date
                  </p>
                  <p className="text-white text-sm">
                    {selectedStudent.enrollmentDate}
                  </p>
                </div>

                {selectedStudent.attendance !== undefined && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                      Attendance
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${selectedStudent.attendance}%`,
                          }}
                        />
                      </div>
                      <span className="text-white text-sm">
                        {selectedStudent.attendance}%
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                    Message
                  </Button>
                  <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
