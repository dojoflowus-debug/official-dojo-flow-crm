import { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Phone, 
  MessageSquare, 
  Mail, 
  Calendar,
  Clock,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
  Bell,
  CheckCircle2,
  XCircle,
  FileText,
  ListTodo,
  TrendingDown,
  TrendingUp,
  Activity
} from 'lucide-react'

interface Student {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  belt_rank: string
  status: string
  membership_status: string
  photo_url?: string
  program?: string
  estimated_value?: number
  days_since_last_class?: number
  days_since_contact?: number
  intro_scheduled?: string
  missed_classes?: number
  is_at_risk?: boolean
  is_trial?: boolean
}

interface TimelineEntry {
  id: string
  type: 'class' | 'call' | 'sms' | 'email' | 'note' | 'intro' | 'payment'
  title: string
  description?: string
  timestamp: Date
  icon?: any
  group: 'today' | 'this_week' | 'earlier'
}

interface StudentDetailCardProps {
  student: Student
  onClose: () => void
  onCall: () => void
  onSMS: () => void
  onEmail: () => void
  isDarkMode?: boolean
  className?: string
}

// Status colors mapping
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  'Active': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', glow: 'shadow-green-500/20' },
  'Trial': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
  'At Risk': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', glow: 'shadow-red-500/20' },
  'Inactive': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', glow: 'shadow-gray-500/20' },
  'On Hold': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', glow: 'shadow-orange-500/20' },
}

// Generate mock attendance data for the last 30 days
function generateAttendanceData(): { day: number; attended: boolean; value: number }[] {
  const data: { day: number; attended: boolean; value: number }[] = []
  
  for (let i = 0; i < 30; i++) {
    const attended = Math.random() > 0.35
    data.push({
      day: i + 1,
      attended,
      value: attended ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 20)
    })
  }
  return data
}

// Generate mock timeline entries grouped by time
function generateTimelineEntries(student: Student): TimelineEntry[] {
  const entries: TimelineEntry[] = []
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  // Today entries
  if (student.intro_scheduled) {
    entries.push({
      id: 'intro-1',
      type: 'intro',
      title: 'Intro class scheduled',
      description: `Youth Program • Instructor: Jose S.`,
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      icon: Calendar,
      group: 'today'
    })
  }
  
  entries.push({
    id: 'note-1',
    type: 'note',
    title: 'AI recommendation generated',
    description: `Schedule follow-up call to discuss progress`,
    timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    icon: Sparkles,
    group: 'today'
  })
  
  // This week entries
  entries.push({
    id: 'class-1',
    type: 'class',
    title: 'Attended class',
    description: `Youth BJJ • 45 min session`,
    timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    icon: CheckCircle2,
    group: 'this_week'
  })
  
  entries.push({
    id: 'call-1',
    type: 'call',
    title: 'Outbound call',
    description: `Discussed belt promotion timeline`,
    timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    icon: Phone,
    group: 'this_week'
  })
  
  // Earlier entries
  entries.push({
    id: 'payment-1',
    type: 'payment',
    title: 'Payment received',
    description: `Monthly membership • $149`,
    timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    icon: CheckCircle2,
    group: 'earlier'
  })
  
  entries.push({
    id: 'sms-1',
    type: 'sms',
    title: 'SMS sent',
    description: `Reminder for upcoming class`,
    timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    icon: MessageSquare,
    group: 'earlier'
  })
  
  return entries
}

// Get next best action based on student data
function getNextBestAction(student: Student): { action: string; urgency: 'high' | 'medium' | 'low' } {
  if (student.is_at_risk || (student.missed_classes && student.missed_classes >= 4)) {
    return { action: 'Call to re-engage before churn', urgency: 'high' }
  }
  if (student.days_since_contact && student.days_since_contact >= 5) {
    return { action: `Follow up - no contact in ${student.days_since_contact} days`, urgency: 'medium' }
  }
  if (student.is_trial) {
    return { action: 'Convert trial to membership', urgency: 'medium' }
  }
  return { action: 'Schedule progress check-in', urgency: 'low' }
}

export default function StudentDetailCard({ 
  student, 
  onClose, 
  onCall, 
  onSMS, 
  onEmail, 
  isDarkMode = true,
  className 
}: StudentDetailCardProps) {
  const [insightsExpanded, setInsightsExpanded] = useState(true)
  const [timelineExpanded, setTimelineExpanded] = useState(true)
  
  // Determine status color
  const statusKey = student.is_at_risk ? 'At Risk' : student.is_trial ? 'Trial' : student.status
  const statusColor = STATUS_COLORS[statusKey] || STATUS_COLORS['Active']
  
  // Generate attendance data
  const attendanceData = useMemo(() => generateAttendanceData(), [student.id])
  const attendanceDays = attendanceData.filter(d => d.attended).length
  const attendanceRate = Math.round((attendanceDays / 30) * 100)
  
  // Generate timeline entries
  const timelineEntries = useMemo(() => generateTimelineEntries(student), [student])
  const todayEntries = timelineEntries.filter(e => e.group === 'today')
  const weekEntries = timelineEntries.filter(e => e.group === 'this_week')
  const earlierEntries = timelineEntries.filter(e => e.group === 'earlier')
  
  // Get next best action
  const nextAction = useMemo(() => getNextBestAction(student), [student])
  
  // Calculate risk drivers
  const riskDrivers = useMemo(() => {
    const drivers: { label: string; value: string; severity: 'high' | 'medium' | 'low' }[] = []
    
    if (student.missed_classes && student.missed_classes >= 2) {
      drivers.push({
        label: 'Missed Classes',
        value: `${student.missed_classes} in 30 days`,
        severity: student.missed_classes >= 4 ? 'high' : 'medium'
      })
    }
    
    if (student.days_since_contact && student.days_since_contact >= 3) {
      drivers.push({
        label: 'Days Since Contact',
        value: `${student.days_since_contact} days`,
        severity: student.days_since_contact >= 7 ? 'high' : 'medium'
      })
    }
    
    if (attendanceRate < 50) {
      drivers.push({
        label: 'Attendance Rate',
        value: `${attendanceRate}%`,
        severity: attendanceRate < 30 ? 'high' : 'medium'
      })
    }
    
    return drivers
  }, [student, attendanceRate])
  
  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') onClose() 
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div 
      className={cn(
        "flex flex-col rounded-2xl overflow-hidden",
        "border backdrop-blur-xl",
        "shadow-2xl",
        isDarkMode 
          ? "bg-[#1a1a1c]/95 border-white/10" 
          : "bg-white/95 border-gray-200",
        // Glassmorphism glow effect
        isDarkMode && "shadow-[0_0_60px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]",
        className
      )}
      style={{
        height: '100%',
        maxHeight: '100%',
        // Subtle noise texture via CSS
        backgroundImage: isDarkMode 
          ? `radial-gradient(ellipse at top right, rgba(231,60,60,0.05) 0%, transparent 50%),
             radial-gradient(ellipse at bottom left, rgba(59,130,246,0.03) 0%, transparent 50%)`
          : undefined
      }}
    >
      {/* ===== SECTION A: HERO HEADER (PINNED) ===== */}
      <div className="flex-shrink-0 relative">
        {/* Background gradient for fade effect */}
        <div 
          className={cn(
            "absolute inset-0 z-0",
            isDarkMode 
              ? "bg-gradient-to-b from-black/40 via-transparent to-transparent"
              : "bg-gradient-to-b from-gray-100 via-transparent to-transparent"
          )}
        />
        
        {/* Header content */}
        <div className="relative z-10 p-4 pb-3">
          <div className="flex items-start gap-4">
            {/* Left side - Name, program, status */}
            <div className="flex-1 min-w-0 pt-1">
              <h2 className={cn(
                "text-xl font-bold truncate",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                {student.first_name} {student.last_name}
              </h2>
              <p className={cn(
                "text-sm mt-0.5",
                isDarkMode ? "text-white/60" : "text-gray-500"
              )}>
                {student.program || 'Youth Program'} • {student.belt_rank}
              </p>
              
              {/* Status pill */}
              <Badge 
                variant="outline" 
                className={cn(
                  "mt-2 text-xs font-medium px-2.5 py-0.5",
                  statusColor.bg, 
                  statusColor.text, 
                  statusColor.border,
                  "shadow-sm",
                  statusColor.glow
                )}
              >
                {student.is_at_risk ? 'At Risk' : student.is_trial ? 'Trial' : student.status}
              </Badge>
              
              {/* Next best action one-liner */}
              <div className={cn(
                "mt-3 flex items-center gap-2 text-sm",
                nextAction.urgency === 'high' ? "text-red-400" : 
                nextAction.urgency === 'medium' ? "text-amber-400" : 
                isDarkMode ? "text-white/60" : "text-gray-500"
              )}>
                <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{nextAction.action}</span>
              </div>
            </div>
            
            {/* Right side - Photo with fade */}
            <div className="relative flex-shrink-0">
              {student.photo_url ? (
                <div className="relative">
                  <img 
                    src={student.photo_url} 
                    alt={`${student.first_name} ${student.last_name}`}
                    className={cn(
                      "w-20 h-20 rounded-2xl object-cover",
                      "ring-2 ring-white/10"
                    )}
                    style={{
                      maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
                    }}
                  />
                  <div 
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: isDarkMode 
                        ? 'linear-gradient(135deg, transparent 50%, rgba(26,26,28,0.8) 100%)'
                        : 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.8) 100%)'
                    }}
                  />
                </div>
              ) : (
                <div className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center",
                  "text-2xl font-bold",
                  isDarkMode 
                    ? "bg-gradient-to-br from-white/10 to-white/5 text-white/60" 
                    : "bg-gradient-to-br from-gray-100 to-gray-50 text-gray-400"
                )}>
                  {student.first_name[0]}{student.last_name[0]}
                </div>
              )}
            </div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className={cn(
                "absolute top-3 right-3 p-1.5 rounded-full transition-all",
                isDarkMode 
                  ? "text-white/40 hover:text-white hover:bg-white/10" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* ===== SECTION B: QUICK ACTIONS ROW (PINNED) ===== */}
      <div className={cn(
        "flex-shrink-0 px-4 py-3 flex items-center gap-2",
        "border-y",
        isDarkMode ? "border-white/10 bg-white/[0.02]" : "border-gray-100 bg-gray-50/50"
      )}>
        <Button 
          size="sm" 
          onClick={onCall}
          className={cn(
            "flex-1 gap-1.5 h-9 rounded-xl font-medium text-sm",
            "bg-green-600/90 hover:bg-green-500 text-white",
            "shadow-lg shadow-green-600/20 hover:shadow-green-500/30",
            "transition-all"
          )}
        >
          <Phone className="h-4 w-4" />
          Call
        </Button>
        <Button 
          size="sm" 
          onClick={onSMS}
          className={cn(
            "flex-1 gap-1.5 h-9 rounded-xl font-medium text-sm",
            "bg-blue-600/90 hover:bg-blue-500 text-white",
            "shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30",
            "transition-all"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          SMS
        </Button>
        <Button 
          size="sm" 
          onClick={onEmail}
          className={cn(
            "flex-1 gap-1.5 h-9 rounded-xl font-medium text-sm",
            isDarkMode 
              ? "bg-white/10 hover:bg-white/15 text-white border border-white/10" 
              : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200",
            "transition-all"
          )}
        >
          <Mail className="h-4 w-4" />
          Email
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          className={cn(
            "gap-1.5 h-9 px-3 rounded-xl font-medium text-sm",
            isDarkMode 
              ? "border-white/10 text-white/70 hover:bg-white/10 hover:text-white" 
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          <FileText className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          className={cn(
            "gap-1.5 h-9 px-3 rounded-xl font-medium text-sm",
            isDarkMode 
              ? "border-white/10 text-white/70 hover:bg-white/10 hover:text-white" 
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          <ListTodo className="h-4 w-4" />
        </Button>
      </div>
      
      {/* ===== SCROLLABLE CONTENT AREA ===== */}
      <div 
        className={cn(
          "flex-1 overflow-y-auto min-h-0",
          // Custom scrollbar styling
          "scrollbar-thin",
          isDarkMode 
            ? "scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20" 
            : "scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
        )}
      >
        <div className="p-4 space-y-4">
          
          {/* ===== SECTION C: INSIGHTS ===== */}
          <div className={cn(
            "rounded-xl border overflow-hidden",
            isDarkMode ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50/50"
          )}>
            {/* Insights Header */}
            <button
              onClick={() => setInsightsExpanded(!insightsExpanded)}
              className={cn(
                "w-full px-4 py-3 flex items-center justify-between",
                "transition-colors",
                isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-100"
              )}
            >
              <div className="flex items-center gap-2">
                <Activity className={cn("h-4 w-4", isDarkMode ? "text-white/60" : "text-gray-500")} />
                <span className={cn("font-semibold text-sm", isDarkMode ? "text-white" : "text-gray-900")}>
                  Insights
                </span>
              </div>
              {insightsExpanded ? (
                <ChevronUp className={cn("h-4 w-4", isDarkMode ? "text-white/40" : "text-gray-400")} />
              ) : (
                <ChevronDown className={cn("h-4 w-4", isDarkMode ? "text-white/40" : "text-gray-400")} />
              )}
            </button>
            
            {insightsExpanded && (
              <div className={cn("px-4 pb-4 space-y-4", "border-t", isDarkMode ? "border-white/5" : "border-gray-100")}>
                
                {/* Attendance Chart */}
                <div className="pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-xs font-medium", isDarkMode ? "text-white/60" : "text-gray-500")}>
                      30-Day Attendance
                    </span>
                    <span className={cn(
                      "text-sm font-semibold",
                      attendanceRate >= 70 ? "text-green-400" : 
                      attendanceRate >= 50 ? "text-amber-400" : "text-red-400"
                    )}>
                      {attendanceRate}%
                    </span>
                  </div>
                  
                  {/* Spark Bar Chart */}
                  <div className="flex items-end gap-[2px] h-10">
                    {attendanceData.map((day, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "flex-1 rounded-t transition-all",
                          day.attended 
                            ? "bg-gradient-to-t from-red-500/80 to-red-400" 
                            : isDarkMode ? "bg-white/10" : "bg-gray-200"
                        )}
                        style={{ height: `${Math.max(day.value, 10)}%` }}
                      />
                    ))}
                  </div>
                  
                  {/* Attendance Stats Row */}
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className={isDarkMode ? "text-white/40" : "text-gray-400"}>
                      {attendanceDays} classes attended
                    </span>
                    <span className={isDarkMode ? "text-white/40" : "text-gray-400"}>
                      {30 - attendanceDays} missed
                    </span>
                  </div>
                </div>
                
                {/* Risk Drivers (if any) */}
                {riskDrivers.length > 0 && (
                  <div className="space-y-2">
                    <span className={cn("text-xs font-medium", isDarkMode ? "text-white/60" : "text-gray-500")}>
                      Risk Drivers
                    </span>
                    <div className="space-y-1.5">
                      {riskDrivers.map((driver, i) => (
                        <div 
                          key={i}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-lg",
                            driver.severity === 'high' 
                              ? isDarkMode ? "bg-red-500/10 border border-red-500/20" : "bg-red-50 border border-red-200"
                              : isDarkMode ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-200"
                          )}
                        >
                          <span className={cn(
                            "text-sm",
                            driver.severity === 'high' ? "text-red-400" : "text-amber-400"
                          )}>
                            {driver.label}
                          </span>
                          <span className={cn(
                            "text-sm font-medium",
                            driver.severity === 'high' ? "text-red-400" : "text-amber-400"
                          )}>
                            {driver.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Engagement Score */}
                <div className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg",
                  isDarkMode ? "bg-white/5" : "bg-gray-100"
                )}>
                  <div className="flex items-center gap-2">
                    {attendanceRate >= 60 ? (
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                    <span className={cn("text-sm", isDarkMode ? "text-white/70" : "text-gray-600")}>
                      Engagement Score
                    </span>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold",
                    attendanceRate >= 70 ? "text-green-400" : 
                    attendanceRate >= 50 ? "text-amber-400" : "text-red-400"
                  )}>
                    {attendanceRate >= 70 ? 'High' : attendanceRate >= 50 ? 'Medium' : 'Low'}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* ===== SECTION D: TIMELINE FEED ===== */}
          <div className={cn(
            "rounded-xl border overflow-hidden",
            isDarkMode ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50/50"
          )}>
            {/* Timeline Header */}
            <button
              onClick={() => setTimelineExpanded(!timelineExpanded)}
              className={cn(
                "w-full px-4 py-3 flex items-center justify-between",
                "transition-colors",
                isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-100"
              )}
            >
              <div className="flex items-center gap-2">
                <Clock className={cn("h-4 w-4", isDarkMode ? "text-white/60" : "text-gray-500")} />
                <span className={cn("font-semibold text-sm", isDarkMode ? "text-white" : "text-gray-900")}>
                  Timeline
                </span>
              </div>
              {timelineExpanded ? (
                <ChevronUp className={cn("h-4 w-4", isDarkMode ? "text-white/40" : "text-gray-400")} />
              ) : (
                <ChevronDown className={cn("h-4 w-4", isDarkMode ? "text-white/40" : "text-gray-400")} />
              )}
            </button>
            
            {timelineExpanded && (
              <div className={cn("px-4 pb-4 space-y-4", "border-t", isDarkMode ? "border-white/5" : "border-gray-100")}>
                
                {/* Today */}
                {todayEntries.length > 0 && (
                  <div className="pt-3">
                    <span className={cn("text-xs font-medium uppercase tracking-wider", isDarkMode ? "text-white/40" : "text-gray-400")}>
                      Today
                    </span>
                    <div className="mt-2 space-y-2">
                      {todayEntries.map((entry) => (
                        <TimelineItem key={entry.id} entry={entry} isDarkMode={isDarkMode} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* This Week */}
                {weekEntries.length > 0 && (
                  <div>
                    <span className={cn("text-xs font-medium uppercase tracking-wider", isDarkMode ? "text-white/40" : "text-gray-400")}>
                      This Week
                    </span>
                    <div className="mt-2 space-y-2">
                      {weekEntries.map((entry) => (
                        <TimelineItem key={entry.id} entry={entry} isDarkMode={isDarkMode} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Earlier */}
                {earlierEntries.length > 0 && (
                  <div>
                    <span className={cn("text-xs font-medium uppercase tracking-wider", isDarkMode ? "text-white/40" : "text-gray-400")}>
                      Earlier
                    </span>
                    <div className="mt-2 space-y-2">
                      {earlierEntries.map((entry) => (
                        <TimelineItem key={entry.id} entry={entry} isDarkMode={isDarkMode} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* ===== BOTTOM CTA BAR (PINNED) ===== */}
      <div className={cn(
        "flex-shrink-0 p-4 border-t",
        "backdrop-blur-sm",
        isDarkMode 
          ? "bg-[#1a1a1c]/90 border-white/10" 
          : "bg-white/90 border-gray-100"
      )}>
        <div className="flex items-center gap-2">
          <Button 
            onClick={onCall}
            className={cn(
              "flex-1 gap-2 h-11 rounded-xl font-medium",
              "bg-green-600 hover:bg-green-500 text-white",
              "shadow-lg shadow-green-600/25 hover:shadow-green-500/30",
              "transition-all"
            )}
          >
            <Phone className="h-4 w-4" />
            Call Now
          </Button>
          <Button 
            onClick={onSMS}
            variant="outline"
            className={cn(
              "gap-2 h-11 px-5 rounded-xl font-medium",
              isDarkMode 
                ? "border-white/20 text-white hover:bg-white/10" 
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            SMS
          </Button>
        </div>
        
        {/* ESC hint */}
        <p className={cn(
          "text-center text-xs mt-3",
          isDarkMode ? "text-white/30" : "text-gray-400"
        )}>
          Press ESC to close
        </p>
      </div>
    </div>
  )
}

// Timeline Item Component
function TimelineItem({ entry, isDarkMode }: { entry: TimelineEntry; isDarkMode: boolean }) {
  const Icon = entry.icon || Calendar
  
  const getIconColors = () => {
    switch (entry.type) {
      case 'intro':
      case 'class':
        return isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"
      case 'call':
        return isDarkMode ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-600"
      case 'sms':
        return isDarkMode ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600"
      case 'email':
        return isDarkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"
      case 'note':
        return isDarkMode ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600"
      case 'payment':
        return isDarkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"
      default:
        return isDarkMode ? "bg-white/10 text-white/60" : "bg-gray-100 text-gray-500"
    }
  }
  
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return `${days}d ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }
  
  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl transition-all",
        isDarkMode 
          ? "bg-white/[0.03] hover:bg-white/[0.06]" 
          : "bg-white hover:bg-gray-50"
      )}
    >
      {/* Icon */}
      <div className={cn("p-2 rounded-lg flex-shrink-0", getIconColors())}>
        <Icon className="h-4 w-4" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          {entry.title}
        </p>
        {entry.description && (
          <p className={cn(
            "text-xs mt-0.5 truncate",
            isDarkMode ? "text-white/50" : "text-gray-500"
          )}>
            {entry.description}
          </p>
        )}
      </div>
      
      {/* Time */}
      <span className={cn(
        "text-xs flex-shrink-0",
        isDarkMode ? "text-white/40" : "text-gray-400"
      )}>
        {formatTime(entry.timestamp)}
      </span>
    </div>
  )
}
