import { useState } from 'react'
import { Phone, MessageSquare, Mail, FileText, Award, Zap, ChevronRight, MoreVertical, Flame, Clock, AlertTriangle, TrendingDown } from 'lucide-react'

interface StudentCardElevatedProps {
  id: number
  firstName: string
  lastName: string
  email?: string
  phone?: string
  beltRank?: string
  status: 'Active' | 'Inactive' | 'On Hold'
  program?: string
  photoUrl?: string
  membershipStatus?: string
  lastCheckIn?: string
  attendanceStreak?: number
  progressToNextBelt?: number
  indicators?: {
    atRisk?: boolean
    birthday?: boolean
    overdue?: boolean
    rankUpEligible?: boolean
    attendanceDrop?: boolean
    starStudent?: boolean
  }
  onCall?: (studentId: number) => void
  onText?: (studentId: number) => void
  onEmail?: (studentId: number) => void
  onNotes?: (studentId: number) => void
  onAssignProgram?: (studentId: number) => void
  onPromoteBelt?: (studentId: number) => void
  onProfileClick?: (studentId: number) => void
}

const BELT_COLORS: Record<string, { ring: string; halo: string; bg: string; text: string; accent: string }> = {
  'White Belt': { ring: 'ring-slate-300', halo: 'from-slate-400/30 to-slate-300/10', bg: 'bg-slate-100', text: 'text-slate-900', accent: 'bg-slate-400' },
  'Yellow Belt': { ring: 'ring-yellow-400', halo: 'from-yellow-400/40 to-yellow-300/10', bg: 'bg-yellow-100', text: 'text-yellow-900', accent: 'bg-yellow-400' },
  'Orange Belt': { ring: 'ring-orange-400', halo: 'from-orange-400/40 to-orange-300/10', bg: 'bg-orange-100', text: 'text-orange-900', accent: 'bg-orange-400' },
  'Green Belt': { ring: 'ring-green-400', halo: 'from-green-400/40 to-green-300/10', bg: 'bg-green-100', text: 'text-green-900', accent: 'bg-green-400' },
  'Blue Belt': { ring: 'ring-blue-400', halo: 'from-blue-400/40 to-blue-300/10', bg: 'bg-blue-100', text: 'text-blue-900', accent: 'bg-blue-400' },
  'Brown Belt': { ring: 'ring-amber-700', halo: 'from-amber-600/40 to-amber-500/10', bg: 'bg-amber-100', text: 'text-amber-900', accent: 'bg-amber-600' },
  'Black Belt': { ring: 'ring-slate-900', halo: 'from-slate-700/40 to-slate-600/10', bg: 'bg-slate-900', text: 'text-white', accent: 'bg-slate-700' },
  'Red Belt': { ring: 'ring-red-500', halo: 'from-red-500/40 to-red-400/10', bg: 'bg-red-100', text: 'text-red-900', accent: 'bg-red-500' },
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; glow: string }> = {
  'Active': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/20' },
  'Inactive': { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-400', glow: 'shadow-slate-500/20' },
  'On Hold': { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400', glow: 'shadow-amber-500/20' },
}

export default function StudentCardElevated({
  id,
  firstName,
  lastName,
  email,
  phone,
  beltRank = 'White Belt',
  status,
  program,
  photoUrl,
  membershipStatus,
  lastCheckIn,
  attendanceStreak = 0,
  progressToNextBelt = 0,
  indicators = {},
  onCall,
  onText,
  onEmail,
  onNotes,
  onAssignProgram,
  onPromoteBelt,
  onProfileClick
}: StudentCardElevatedProps) {
  const [showActions, setShowActions] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isHoveredChevron, setIsHoveredChevron] = useState(false)
  const beltColors = BELT_COLORS[beltRank] || BELT_COLORS['White Belt']
  const statusColors = STATUS_COLORS[status]

  const getInitials = () => {
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return `${first}${last}`.toUpperCase() || '?'
  }

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl p-6 transition-all duration-500 hover:border-white/30 hover:shadow-2xl hover:shadow-blue-500/15 hover:-translate-y-2 hover:bg-gradient-to-br hover:from-white/[0.12] hover:to-white/[0.05]"
      onMouseEnter={() => {
        setIsHovered(true)
        setShowActions(true)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        setShowActions(false)
      }}
      onClick={() => onProfileClick?.(id)}
    >
      {/* Animated background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500" />
      
      {/* Subtle cinematic light rays */}
      <div className="absolute -inset-32 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl" />

      {/* Content wrapper */}
      <div className="relative z-10 space-y-4">
        {/* Top Row: Avatar, Info, Status */}
        <div className="flex items-start gap-4">
          {/* Avatar with enhanced belt halo */}
          <div className="relative flex-shrink-0">
            {/* Halo glow effect */}
            <div className={`absolute -inset-2 rounded-full bg-gradient-to-br ${beltColors.halo} blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`} />
            
            {/* Main avatar ring */}
            <div className={`relative h-20 w-20 rounded-full ${beltColors.ring} ring-3 overflow-hidden flex items-center justify-center ${beltColors.bg} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
              {photoUrl ? (
                <img src={photoUrl} alt={`${firstName} ${lastName}`} className="w-full h-full object-cover" />
              ) : (
                <span className={`text-2xl font-bold ${beltColors.text}`}>{getInitials()}</span>
              )}
            </div>

            {/* Activity pulse indicator */}
            {status === 'Active' && (
              <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-emerald-400 ring-2 ring-white/20 animate-pulse shadow-lg shadow-emerald-500/50" />
            )}
          </div>

          {/* Student Info */}
          <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-lg font-bold text-white truncate">{firstName} {lastName}</h3>
                  <p className="text-sm text-slate-400 font-medium">{beltRank}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Status badge with glow */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusColors.bg} ${statusColors.text} whitespace-nowrap shadow-lg ${statusColors.glow}`}>
                    <div className={`w-2 h-2 rounded-full ${statusColors.dot} animate-pulse`} />
                    {status}
                  </div>
                  
                  {/* Open Profile Chevron */}
                  <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white transition-all duration-200">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

            {/* Program badge */}
            {program && (
              <div className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 mb-2">
                {program}
              </div>
            )}

            {/* Attendance and activity info */}
            <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
              {attendanceStreak > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span className="font-semibold text-orange-300">{attendanceStreak}</span>
                </div>
              )}
              {lastCheckIn && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-500/10">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{lastCheckIn}</span>
                </div>
              )}
            </div>

            {/* Progress to next belt - Enhanced */}
            {progressToNextBelt > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Progress to Next Rank</span>
                  <span className="font-bold text-slate-200">{progressToNextBelt}%</span>
                </div>
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full bg-gradient-to-r ${beltColors.halo} transition-all duration-700 ease-out rounded-full shadow-lg`}
                    style={{ width: `${progressToNextBelt}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Row: Indicators */}
        {Object.values(indicators).some(v => v) && (
          <div className="flex items-center gap-2 flex-wrap">
            {indicators.rankUpEligible && (
              <div title="Eligible for Promotion" className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/20">
                <Award className="w-4 h-4" />
              </div>
            )}
            {indicators.atRisk && (
              <div title="At Risk" className="p-2 rounded-lg bg-red-500/20 text-red-400 shadow-lg shadow-red-500/20">
                <AlertTriangleIcon className="w-4 h-4" />
              </div>
            )}
            {indicators.attendanceDrop && (
              <div title="Attendance Drop" className="p-2 rounded-lg bg-orange-500/20 text-orange-400 shadow-lg shadow-orange-500/20">
                <TrendDownIcon className="w-4 h-4" />
              </div>
            )}
            {indicators.overdue && (
              <div title="Overdue Payment" className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/20">
                <ClockIcon className="w-4 h-4" />
              </div>
            )}
            {indicators.starStudent && (
              <div title="Star Student" className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 text-lg shadow-lg shadow-yellow-500/20">
                ⭐
              </div>
            )}
            {indicators.birthday && (
              <div title="Birthday Soon" className="p-2 rounded-lg bg-pink-500/20 text-pink-400 text-lg shadow-lg shadow-pink-500/20">
                🎂
              </div>
            )}
          </div>
        )}

        {/* Bottom Row: Quick Actions */}
        <div className={`flex items-center gap-2 pt-2 border-t border-white/5 transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-60'}`}>
          {onCall && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCall(id)
              }}
              className="flex-1 p-2 rounded-lg hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-all duration-200 text-sm font-medium hover:shadow-lg hover:shadow-blue-500/20"
              title="Call"
            >
              <Phone className="w-4 h-4 inline mr-1" />
              <span className="hidden sm:inline">Call</span>
            </button>
          )}
          {onText && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onText(id)
              }}
              className="flex-1 p-2 rounded-lg hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-all duration-200 text-sm font-medium hover:shadow-lg hover:shadow-green-500/20"
              title="Text"
            >
              <MessageSquare className="w-4 h-4 inline mr-1" />
              <span className="hidden sm:inline">Text</span>
            </button>
          )}
          {onEmail && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEmail(id)
              }}
              className="flex-1 p-2 rounded-lg hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-all duration-200 text-sm font-medium hover:shadow-lg hover:shadow-purple-500/20"
              title="Email"
            >
              <Mail className="w-4 h-4 inline mr-1" />
              <span className="hidden sm:inline">Email</span>
            </button>
          )}
          {onNotes && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNotes(id)
              }}
              className="flex-1 p-2 rounded-lg hover:bg-yellow-500/20 text-slate-400 hover:text-yellow-400 transition-all duration-200 text-sm font-medium hover:shadow-lg hover:shadow-yellow-500/20"
              title="Notes"
            >
              <FileText className="w-4 h-4 inline mr-1" />
              <span className="hidden sm:inline">Notes</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Icon components
function AlertTriangleIcon(props: any) {
  return <AlertTriangle {...props} />
}

function ClockIcon(props: any) {
  return <Clock {...props} />
}

function TrendDownIcon(props: any) {
  return <TrendingDown {...props} />
}
