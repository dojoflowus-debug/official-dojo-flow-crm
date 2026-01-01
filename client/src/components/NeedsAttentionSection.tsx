import { useState } from 'react'
import { 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Phone,
  MessageSquare,
  Mail,
  User,
  Calendar,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  days_since_last_class?: number
  days_since_contact?: number
  intro_scheduled?: string
  missed_classes?: number
  is_at_risk?: boolean
}

interface NeedsAttentionSectionProps {
  students: Student[]
  isDarkMode?: boolean
  onStudentClick: (student: Student) => void
  onCall?: (student: Student) => void
  onSMS?: (student: Student) => void
  onEmail?: (student: Student) => void
}

// Get urgency reason
function getUrgencyReason(student: Student): { text: string; icon: any; action: string; severity: 'critical' | 'warning' | 'info' } {
  if (student.missed_classes && student.missed_classes >= 4) {
    return {
      text: `Missed ${student.missed_classes} classes`,
      icon: AlertTriangle,
      action: 'Call to re-engage',
      severity: 'critical'
    }
  }
  if (student.days_since_contact && student.days_since_contact >= 3) {
    return {
      text: `No contact in ${student.days_since_contact} days`,
      icon: Phone,
      action: 'Call to follow-up',
      severity: 'warning'
    }
  }
  if (student.days_since_last_class && student.days_since_last_class >= 4) {
    return {
      text: `No class in ${student.days_since_last_class}+ days`,
      icon: Calendar,
      action: 'Recommend SMS follow-up',
      severity: 'warning'
    }
  }
  if (student.intro_scheduled) {
    const introDate = new Date(student.intro_scheduled)
    const today = new Date()
    const isToday = introDate.toDateString() === today.toDateString()
    if (isToday) {
      const time = introDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      return {
        text: `Intro scheduled for ${time} today`,
        icon: Calendar,
        action: 'Reminder!',
        severity: 'info'
      }
    }
  }
  return {
    text: 'Needs attention',
    icon: AlertTriangle,
    action: 'Review',
    severity: 'warning'
  }
}

// Belt color helper
function getBeltColor(belt: string): string {
  const colors: Record<string, string> = {
    'White Belt': 'bg-white text-gray-800 border-gray-300',
    'White': 'bg-white text-gray-800 border-gray-300',
    'Yellow Belt': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Yellow': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Orange Belt': 'bg-orange-100 text-orange-800 border-orange-300',
    'Orange': 'bg-orange-100 text-orange-800 border-orange-300',
    'Green Belt': 'bg-green-100 text-green-800 border-green-300',
    'Green': 'bg-green-100 text-green-800 border-green-300',
    'Blue Belt': 'bg-blue-100 text-blue-800 border-blue-300',
    'Blue': 'bg-blue-100 text-blue-800 border-blue-300',
    'Purple Belt': 'bg-purple-100 text-purple-800 border-purple-300',
    'Purple': 'bg-purple-100 text-purple-800 border-purple-300',
    'Brown Belt': 'bg-amber-100 text-amber-800 border-amber-300',
    'Brown': 'bg-amber-100 text-amber-800 border-amber-300',
    'Black Belt': 'bg-gray-900 text-white border-gray-700',
    'Black': 'bg-gray-900 text-white border-gray-700',
  }
  return colors[belt] || 'bg-gray-100 text-gray-800 border-gray-300'
}

function AttentionStudentRow({ 
  student, 
  isDarkMode,
  onClick,
  onCall,
  onSMS,
  onEmail
}: { 
  student: Student
  isDarkMode?: boolean
  onClick: () => void
  onCall?: (student: Student) => void
  onSMS?: (student: Student) => void
  onEmail?: (student: Student) => void
}) {
  const urgency = getUrgencyReason(student)
  const Icon = urgency.icon
  
  const getSeverityStyles = () => {
    switch (urgency.severity) {
      case 'critical':
        return isDarkMode 
          ? 'bg-gradient-to-r from-red-950/50 via-red-950/30 to-transparent border-l-4 border-l-red-500'
          : 'bg-gradient-to-r from-red-50 via-red-25 to-transparent border-l-4 border-l-red-500'
      case 'warning':
        return isDarkMode
          ? 'bg-gradient-to-r from-yellow-950/40 via-yellow-950/20 to-transparent border-l-4 border-l-yellow-500'
          : 'bg-gradient-to-r from-yellow-50 via-yellow-25 to-transparent border-l-4 border-l-yellow-500'
      case 'info':
        return isDarkMode
          ? 'bg-gradient-to-r from-blue-950/40 via-blue-950/20 to-transparent border-l-4 border-l-blue-500'
          : 'bg-gradient-to-r from-blue-50 via-blue-25 to-transparent border-l-4 border-l-blue-500'
    }
  }
  
  const getIconColor = () => {
    switch (urgency.severity) {
      case 'critical': return 'text-red-500'
      case 'warning': return 'text-yellow-500'
      case 'info': return 'text-blue-500'
    }
  }

  return (
    <div 
      onClick={onClick}
      className={`
        rounded-xl p-3 cursor-pointer transition-all duration-200
        hover:shadow-lg hover:-translate-y-0.5
        ${getSeverityStyles()}
        ${isDarkMode ? 'border border-white/5' : 'border border-slate-100'}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {student.photo_url ? (
            <img 
              src={student.photo_url} 
              alt={`${student.first_name} ${student.last_name}`}
              className="w-10 h-10 rounded-full object-cover border border-white/20"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-white/10' : 'bg-slate-100'
            }`}>
              <User className={`h-5 w-5 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
            </div>
          )}
        </div>
        
        {/* Name & Program */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium text-sm truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {student.first_name} {student.last_name}
            </h4>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              student.status?.toLowerCase() === 'active' ? 'bg-green-500' :
              student.status?.toLowerCase() === 'on hold' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
          </div>
          <p className={`text-xs truncate ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
            {student.program || 'youth program'}
          </p>
        </div>
        
        {/* Belt */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0 ${getBeltColor(student.belt_rank)}`}>
          {student.belt_rank?.replace(' Belt', '') || 'White'}
        </span>
      </div>
      
      {/* Urgency Alert */}
      <div className={`mt-2 p-2 rounded-lg flex items-center gap-2 ${
        urgency.severity === 'critical' ? (isDarkMode ? 'bg-red-500/20' : 'bg-red-100') :
        urgency.severity === 'warning' ? (isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100') :
        (isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100')
      }`}>
        <Icon className={`h-4 w-4 flex-shrink-0 ${getIconColor()}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium ${
            urgency.severity === 'critical' ? 'text-red-600' :
            urgency.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
          }`}>
            {urgency.text}
          </p>
          <p className={`text-[10px] ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>
            {urgency.action}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function NeedsAttentionSection({ 
  students,
  isDarkMode,
  onStudentClick,
  onCall,
  onSMS,
  onEmail
}: NeedsAttentionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  // Filter students that need attention
  const attentionStudents = students.filter(s => 
    s.is_at_risk || 
    (s.missed_classes && s.missed_classes >= 2) ||
    (s.days_since_contact && s.days_since_contact >= 3) ||
    (s.days_since_last_class && s.days_since_last_class >= 4) ||
    s.intro_scheduled
  )
  
  if (attentionStudents.length === 0) return null

  return (
    <div className={`rounded-2xl border overflow-hidden ${
      isDarkMode 
        ? 'bg-gradient-to-b from-red-950/20 to-transparent border-red-500/20' 
        : 'bg-gradient-to-b from-red-50 to-transparent border-red-200'
    }`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
          isDarkMode ? 'hover:bg-white/5' : 'hover:bg-red-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <span className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Needs Attention
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
          }`}>
            {attentionStudents.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className={`h-4 w-4 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
        ) : (
          <ChevronDown className={`h-4 w-4 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
        )}
      </button>
      
      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {attentionStudents.map((student) => (
            <AttentionStudentRow
              key={student.id}
              student={student}
              isDarkMode={isDarkMode}
              onClick={() => onStudentClick(student)}
              onCall={onCall}
              onSMS={onSMS}
              onEmail={onEmail}
            />
          ))}
        </div>
      )}
    </div>
  )
}
