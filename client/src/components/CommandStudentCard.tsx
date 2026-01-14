import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  User,
  AlertTriangle,
  Calendar,
  Clock,
  ChevronRight,
  Sparkles,
  Star
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
  program?: string
  days_since_last_class?: number
  days_since_contact?: number
  intro_scheduled?: string
  missed_classes?: number
  is_at_risk?: boolean
  is_trial?: boolean
}

interface CommandStudentCardProps {
  student: Student
  onClick: () => void
  onCall?: (student: Student) => void
  onSMS?: (student: Student) => void
  onEmail?: (student: Student) => void
  isHighlighted?: boolean
  isDarkMode?: boolean
  showActions?: boolean
  isFavorite?: boolean
  onToggleFavorite?: (student: Student) => void
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

// Get urgency level based on student data
function getUrgencyLevel(student: Student): 'critical' | 'warning' | 'info' | 'none' {
  if (student.is_at_risk || (student.missed_classes && student.missed_classes >= 4)) {
    return 'critical'
  }
  if (student.days_since_contact && student.days_since_contact >= 3) {
    return 'warning'
  }
  if (student.days_since_last_class && student.days_since_last_class >= 4) {
    return 'warning'
  }
  if (student.intro_scheduled) {
    return 'info'
  }
  return 'none'
}

// Get smart recommendation based on student data
function getSmartRecommendation(student: Student): { text: string; icon: any; action: string } | null {
  if (student.missed_classes && student.missed_classes >= 4) {
    return {
      text: `Missed ${student.missed_classes} classes`,
      icon: AlertTriangle,
      action: 'Call to re-engage'
    }
  }
  if (student.days_since_contact && student.days_since_contact >= 3) {
    return {
      text: `No contact in ${student.days_since_contact} days`,
      icon: Phone,
      action: 'Call to follow-up'
    }
  }
  if (student.days_since_last_class && student.days_since_last_class >= 4) {
    return {
      text: `No class in ${student.days_since_last_class}+ days`,
      icon: Calendar,
      action: 'Recommend SMS follow-up'
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
        action: 'Reminder!'
      }
    }
  }
  return null
}

export default function CommandStudentCard({ 
  student, 
  onClick,
  onCall,
  onSMS,
  onEmail,
  isHighlighted,
  isDarkMode,
  showActions = true,
  isFavorite,
  onToggleFavorite
}: CommandStudentCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const urgencyLevel = useMemo(() => getUrgencyLevel(student), [student])
  const recommendation = useMemo(() => getSmartRecommendation(student), [student])
  
  // Status dot color
  const getStatusDot = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-500'
      case 'on hold': return 'bg-yellow-500'
      case 'inactive': return 'bg-red-500'
      case 'trial': return 'bg-blue-500'
      default: return 'bg-slate-400'
    }
  }
  
  // Urgency glow styles
  const getUrgencyStyles = () => {
    switch (urgencyLevel) {
      case 'critical':
        return isDarkMode 
          ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)] bg-gradient-to-r from-red-950/30 to-transparent'
          : 'border-red-300 shadow-[0_0_20px_rgba(239,68,68,0.1)] bg-gradient-to-r from-red-50 to-transparent'
      case 'warning':
        return isDarkMode
          ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)] bg-gradient-to-r from-yellow-950/20 to-transparent'
          : 'border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.08)] bg-gradient-to-r from-yellow-50 to-transparent'
      case 'info':
        return isDarkMode
          ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)] bg-gradient-to-r from-blue-950/20 to-transparent'
          : 'border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.08)] bg-gradient-to-r from-blue-50 to-transparent'
      default:
        return isDarkMode ? 'border-border' : 'border-border'
    }
  }
  
  // Recommendation badge color
  const getRecommendationColor = () => {
    switch (urgencyLevel) {
      case 'critical': return isDarkMode ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-700 border-red-200'
      case 'warning': return isDarkMode ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'info': return isDarkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-200'
      default: return isDarkMode ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative rounded-2xl border p-4 cursor-pointer 
        transition-all duration-300 ease-out
        hover:shadow-xl hover:-translate-y-1 
        active:scale-[0.99] active:shadow-lg
        ${isDarkMode ? 'bg-[#18181A]' : 'bg-white'}
        ${getUrgencyStyles()}
        ${isHighlighted ? 'ring-2 ring-primary shadow-xl border-primary' : ''}
      `}
    >
      {/* Favorite Star */}
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(student)
          }}
          className={`absolute top-3 right-3 p-1 rounded-full transition-all ${
            isFavorite 
              ? 'text-yellow-500' 
              : isDarkMode ? 'text-muted-foreground hover:text-muted-foreground/80' : 'text-muted-foreground hover:text-muted-foreground/80'
          }`}
        >
          <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      )}
      
      {/* Top Row - Avatar, Name, Status, Belt */}
      <div className="flex items-start gap-3">
        {/* Avatar with status ring */}
        <div className="relative flex-shrink-0">
          {student.photo_url ? (
            <img 
              src={student.photo_url} 
              alt={`${student.first_name} ${student.last_name}`}
              className={`w-12 h-12 rounded-full object-cover border-2 ${
                urgencyLevel === 'critical' ? 'border-red-500' :
                urgencyLevel === 'warning' ? 'border-yellow-500' :
                urgencyLevel === 'info' ? 'border-blue-500' :
                isDarkMode ? 'border-border' : 'border-border'
              }`}
            />
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
              urgencyLevel === 'critical' ? 'border-red-500 bg-red-500/10' :
              urgencyLevel === 'warning' ? 'border-yellow-500 bg-yellow-500/10' :
              urgencyLevel === 'info' ? 'border-blue-500 bg-blue-500/10' :
              isDarkMode ? 'border-border bg-muted' : 'border-border bg-muted'
            }`}>
              <User className={`h-6 w-6 ${isDarkMode ? 'text-muted-foreground' : 'text-muted-foreground'}`} />
            </div>
          )}
          {/* Status dot */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
            isDarkMode ? 'border-[#18181A]' : 'border-white'
          } ${getStatusDot(student.status)}`} />
        </div>
        
        {/* Name & Program */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-semibold text-base truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {student.first_name} {student.last_name}
            </h4>
            {/* Status pill */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${
              student.status?.toLowerCase() === 'active' ? 'bg-green-500/20 text-green-500' :
              student.status?.toLowerCase() === 'trial' || student.is_trial ? 'bg-blue-500/20 text-blue-500' :
              student.status?.toLowerCase() === 'on hold' ? 'bg-yellow-500/20 text-yellow-500' :
              'bg-red-500/20 text-red-500'
            }`}>
              {student.is_trial ? 'Trial' : student.status}
            </span>
          </div>
          <p className={`text-sm truncate ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
            {student.program || 'youth program'}
          </p>
        </div>
        
        {/* Belt Rank Badge */}
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border flex-shrink-0 ${getBeltColor(student.belt_rank)}`}>
          {student.belt_rank?.replace(' Belt', '') || 'White'}
        </span>
      </div>
      
      {/* Middle - Smart Recommendation */}
      {recommendation && (
        <div className={`mt-3 p-3 rounded-xl border ${getRecommendationColor()}`}>
          <div className="flex items-start gap-2">
            <recommendation.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{recommendation.text}</p>
              <p className={`text-xs mt-0.5 flex items-center gap-1 ${
                isDarkMode ? 'text-white/40' : 'text-slate-500'
              }`}>
                <Sparkles className="h-3 w-3" />
                {recommendation.action}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Bottom Actions */}
      {showActions && (
        <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onCall?.(student)
              }}
              className={`h-8 px-3 rounded-lg text-xs font-medium ${
                isDarkMode 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20' 
                  : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
              }`}
            >
              <Phone className="h-3.5 w-3.5 mr-1.5" />
              Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onSMS?.(student)
              }}
              className={`h-8 px-3 rounded-lg text-xs font-medium ${
                isDarkMode 
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' 
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              SMS
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEmail?.(student)
              }}
              className={`h-8 px-3 rounded-lg text-xs font-medium ${
                isDarkMode 
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20' 
                  : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              Email
            </Button>
          </div>
          
          {/* View Profile Arrow */}
          <ChevronRight className={`h-5 w-5 transition-transform ${
            isHovered ? 'translate-x-1' : ''
          } ${isDarkMode ? 'text-white/30' : 'text-slate-300'}`} />
        </div>
      )}
    </div>
  )
}
