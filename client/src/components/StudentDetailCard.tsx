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
  ChevronUp,
  User,
  Bell,
  CheckCircle2,
  XCircle
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
  type: 'class' | 'call' | 'sms' | 'email' | 'note' | 'intro'
  title: string
  description?: string
  timestamp: Date
  icon?: any
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
function generateAttendanceData(): { day: string; attended: boolean; value: number }[] {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const data: { day: string; attended: boolean; value: number }[] = []
  
  for (let i = 0; i < 7; i++) {
    const attended = Math.random() > 0.3
    data.push({
      day: days[i],
      attended,
      value: attended ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 20)
    })
  }
  return data
}

// Generate mock timeline entries
function generateTimelineEntries(student: Student): TimelineEntry[] {
  const entries: TimelineEntry[] = []
  const now = new Date()
  
  // Add intro scheduled if exists
  if (student.intro_scheduled) {
    entries.push({
      id: 'intro-1',
      type: 'intro',
      title: 'Intro class scheduled for today',
      description: `Distributed Class, Rem: Jose S.`,
      timestamp: new Date(student.intro_scheduled),
      icon: Calendar
    })
  }
  
  // Add some mock entries
  entries.push({
    id: 'note-1',
    type: 'note',
    title: 'Today',
    description: `Specified refers in to call two today`,
    timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    icon: Sparkles
  })
  
  entries.push({
    id: 'call-1',
    type: 'call',
    title: 'Recommend/Suggest follow-up',
    description: `RecommendAgent follow-up`,
    timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    icon: Phone
  })
  
  return entries
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Determine status color
  const statusKey = student.is_at_risk ? 'At Risk' : student.is_trial ? 'Trial' : student.status
  const statusColor = STATUS_COLORS[statusKey] || STATUS_COLORS['Active']
  
  // Generate attendance data
  const attendanceData = useMemo(() => generateAttendanceData(), [student.id])
  const attendanceDays = attendanceData.filter(d => d.attended).length
  
  // Generate timeline entries
  const timelineEntries = useMemo(() => generateTimelineEntries(student), [student])
  
  // Smart recommendation based on student data
  const recommendation = useMemo(() => {
    if (student.is_at_risk || (student.missed_classes && student.missed_classes >= 4)) {
      return {
        text: `Suggested: refer in to call two today`,
        subtext: 'RecommendAgent follow-up',
        type: 'warning'
      }
    }
    if (student.days_since_contact && student.days_since_contact >= 3) {
      return {
        text: `No contact in ${student.days_since_contact} days`,
        subtext: 'Call to follow-up',
        type: 'info'
      }
    }
    return null
  }, [student])
  
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
        "flex flex-col h-full rounded-2xl overflow-hidden",
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
        // Subtle noise texture via CSS
        backgroundImage: isDarkMode 
          ? `radial-gradient(ellipse at top right, rgba(231,60,60,0.05) 0%, transparent 50%),
             radial-gradient(ellipse at bottom left, rgba(59,130,246,0.03) 0%, transparent 50%)`
          : undefined
      }}
    >
      {/* ===== HEADER SECTION - Photo + Name Fade ===== */}
      <div className="relative flex-shrink-0">
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
            {/* Left side - Name and program */}
            <div className="flex-1 min-w-0 pt-2">
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
                {student.program || 'youth program'}
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
                      // Fade mask for photo
                      maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
                    }}
                  />
                  {/* Gradient overlay for smooth blend */}
                  <div 
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: isDarkMode 
                        ? 'linear-gradient(135deg, transparent 40%, rgba(26,26,28,0.8) 100%)'
                        : 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.8) 100%)'
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
            
            {/* Close button - positioned top right */}
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
      
      {/* ===== ACTION BUTTONS ROW ===== */}
      <div className={cn(
        "flex-shrink-0 px-4 py-3 flex items-center gap-2",
        "border-b",
        isDarkMode ? "border-white/10" : "border-gray-100"
      )}>
        <Button 
          size="sm" 
          onClick={onCall}
          className={cn(
            "flex-1 gap-2 h-9 rounded-xl font-medium text-sm",
            "bg-white/10 hover:bg-white/15 text-white border border-white/10",
            "transition-all hover:shadow-lg hover:shadow-white/5"
          )}
        >
          <Phone className="h-4 w-4" />
          Call
        </Button>
        <Button 
          size="sm" 
          onClick={onSMS}
          className={cn(
            "flex-1 gap-2 h-9 rounded-xl font-medium text-sm",
            "bg-white/10 hover:bg-white/15 text-white border border-white/10",
            "transition-all hover:shadow-lg hover:shadow-white/5"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          SMS
        </Button>
        <Button 
          size="sm" 
          onClick={onEmail}
          className={cn(
            "flex-1 gap-2 h-9 rounded-xl font-medium text-sm",
            "bg-white/10 hover:bg-white/15 text-white border border-white/10",
            "transition-all hover:shadow-lg hover:shadow-white/5"
          )}
        >
          <Mail className="h-4 w-4" />
          Email
        </Button>
      </div>
      
      {/* ===== SCROLLABLE CONTENT AREA ===== */}
      <div 
        className={cn(
          "flex-1 overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        )}
        style={{ minHeight: 0 }}
      >
        <div className="p-4 space-y-5">
          
          {/* ===== ATTENDANCE SECTION ===== */}
          <div>
            <h3 className={cn(
              "text-sm font-semibold mb-3 flex items-center gap-2",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              Attendance
              <ChevronUp className={cn(
                "h-4 w-4 transition-transform",
                isDarkMode ? "text-white/40" : "text-gray-400"
              )} />
            </h3>
            
            {/* Spark Bar Chart */}
            <div className="flex items-end gap-1 h-16 mb-2">
              {attendanceData.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className={cn(
                      "w-full rounded-t transition-all",
                      day.attended 
                        ? "bg-gradient-to-t from-red-500 to-red-400" 
                        : isDarkMode ? "bg-white/10" : "bg-gray-200"
                    )}
                    style={{ height: `${day.value}%` }}
                  />
                  <span className={cn(
                    "text-[10px] font-medium",
                    isDarkMode ? "text-white/40" : "text-gray-400"
                  )}>
                    {day.day}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Attendance stat line */}
            <div className={cn(
              "flex items-center gap-2 text-sm",
              isDarkMode ? "text-white/60" : "text-gray-500"
            )}>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Attendance in Healing
              </span>
              <span className={cn(
                "ml-auto font-medium",
                isDarkMode ? "text-white/80" : "text-gray-700"
              )}>
                {attendanceDays}.53 hrs
              </span>
            </div>
          </div>
          
          {/* ===== RECOMMENDATION CARD ===== */}
          {recommendation && (
            <div className={cn(
              "p-3 rounded-xl border",
              isDarkMode 
                ? "bg-amber-500/10 border-amber-500/20" 
                : "bg-amber-50 border-amber-200"
            )}>
              <div className="flex items-start gap-2">
                <Sparkles className={cn(
                  "h-4 w-4 mt-0.5 flex-shrink-0",
                  isDarkMode ? "text-amber-400" : "text-amber-600"
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium",
                    isDarkMode ? "text-amber-300" : "text-amber-800"
                  )}>
                    {recommendation.text}
                  </p>
                  <p className={cn(
                    "text-xs mt-0.5",
                    isDarkMode ? "text-amber-400/60" : "text-amber-600"
                  )}>
                    {recommendation.subtext}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* ===== INTRO / SCHEDULED SECTION ===== */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className={cn(
                "text-sm font-semibold",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                Intro
              </h3>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  isDarkMode 
                    ? "bg-white/5 border-white/10 text-white/60" 
                    : "bg-gray-50 border-gray-200 text-gray-500"
                )}
              >
                Scheduled
              </Badge>
            </div>
            
            {/* Timeline entries */}
            <div className="space-y-3">
              {timelineEntries.map((entry) => (
                <div 
                  key={entry.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl transition-all",
                    isDarkMode 
                      ? "bg-white/5 hover:bg-white/8" 
                      : "bg-gray-50 hover:bg-gray-100"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "p-2 rounded-lg flex-shrink-0",
                    entry.type === 'intro' 
                      ? "bg-blue-500/20 text-blue-400"
                      : entry.type === 'note'
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-white/10 text-white/60"
                  )}>
                    {entry.icon ? <entry.icon className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
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
                        "text-xs mt-0.5",
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
                    {entry.timestamp.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* ===== BOTTOM ACTION AREA (PINNED) ===== */}
      <div className={cn(
        "flex-shrink-0 p-4 border-t",
        "backdrop-blur-sm",
        isDarkMode 
          ? "bg-[#1a1a1c]/80 border-white/10" 
          : "bg-white/80 border-gray-100"
      )}>
        <div className="flex items-center gap-2">
          <Button 
            onClick={onCall}
            className={cn(
              "flex-1 gap-2 h-10 rounded-xl font-medium",
              "bg-green-600 hover:bg-green-500 text-white",
              "shadow-lg shadow-green-600/25 hover:shadow-green-500/30",
              "transition-all"
            )}
          >
            <Phone className="h-4 w-4" />
            Call
          </Button>
          <Button 
            onClick={onSMS}
            variant="outline"
            className={cn(
              "gap-2 h-10 px-4 rounded-xl font-medium",
              isDarkMode 
                ? "border-white/20 text-white hover:bg-white/10" 
                : "border-gray-200"
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
