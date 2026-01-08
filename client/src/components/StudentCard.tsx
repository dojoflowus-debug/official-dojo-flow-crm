import React, { useState } from 'react'
import { Phone, MessageSquare, Mail, FileText, Award, Zap, ChevronRight, MoreVertical } from 'lucide-react'

interface StudentCardProps {
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

const BELT_COLORS: Record<string, { ring: string; bg: string; text: string }> = {
  'White Belt': { ring: 'ring-slate-400', bg: 'bg-slate-100', text: 'text-slate-900' },
  'Yellow Belt': { ring: 'ring-yellow-400', bg: 'bg-yellow-100', text: 'text-yellow-900' },
  'Green Belt': { ring: 'ring-green-400', bg: 'bg-green-100', text: 'text-green-900' },
  'Blue Belt': { ring: 'ring-blue-400', bg: 'bg-blue-100', text: 'text-blue-900' },
  'Brown Belt': { ring: 'ring-amber-700', bg: 'bg-amber-100', text: 'text-amber-900' },
  'Black Belt': { ring: 'ring-slate-900', bg: 'bg-slate-900', text: 'text-white' },
  'Red Belt': { ring: 'ring-red-500', bg: 'bg-red-100', text: 'text-red-900' },
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Active': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  'Inactive': { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-400' },
  'On Hold': { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
}

export default function StudentCard({
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
}: StudentCardProps) {
  const [showActions, setShowActions] = useState(false)
  const beltColors = BELT_COLORS[beltRank] || BELT_COLORS['White Belt']
  const statusColors = STATUS_COLORS[status]

  const getInitials = () => {
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return `${first}${last}`.toUpperCase() || '?'
  }

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:bg-white/[0.06]"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/3 group-hover:to-purple-500/3 transition-all duration-300" />

      {/* Content wrapper */}
      <div className="relative z-10 flex items-center gap-4">
        {/* Left Section: Avatar & Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Avatar with belt ring */}
          <div className={`relative flex-shrink-0 h-16 w-16 rounded-full ${beltColors.ring} ring-2 overflow-hidden flex items-center justify-center ${beltColors.bg}`}>
            {photoUrl ? (
              <img src={photoUrl} alt={`${firstName} ${lastName}`} className="w-full h-full object-cover" />
            ) : (
              <span className={`text-lg font-bold ${beltColors.text}`}>{getInitials()}</span>
            )}
          </div>

          {/* Student info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-white truncate">{firstName} {lastName}</h3>
              {program && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 whitespace-nowrap">
                  {program}
                </span>
              )}
            </div>

            {/* Status and belt rank */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`} />
                {status}
              </div>
              <div className={`text-xs font-medium px-2 py-1 rounded-full ${beltColors.bg} ${beltColors.text}`}>
                {beltRank}
              </div>
            </div>

            {/* Last check-in and attendance */}
            <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
              {lastCheckIn && (
                <span>{lastCheckIn}</span>
              )}
              {attendanceStreak > 0 && (
                <span className="flex items-center gap-1">
                  <span>🔥</span>
                  <span>{attendanceStreak} classes</span>
                </span>
              )}
            </div>

            {/* Progress to next belt */}
            {progressToNextBelt > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Progress</span>
                  <span className="font-medium text-slate-300">{progressToNextBelt}% to next rank</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${progressToNextBelt}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Section: Operational Indicators */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {indicators.atRisk && (
            <div title="At Risk" className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <AlertTriangleIcon className="w-4 h-4" />
            </div>
          )}
          {indicators.birthday && (
            <div title="Birthday Soon" className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 text-lg">
              🎂
            </div>
          )}
          {indicators.overdue && (
            <div title="Overdue" className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
              <ClockIcon className="w-4 h-4" />
            </div>
          )}
          {indicators.rankUpEligible && (
            <div title="Rank-up Eligible" className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <TrophyIcon className="w-4 h-4" />
            </div>
          )}
          {indicators.attendanceDrop && (
            <div title="Attendance Drop" className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
              <TrendDownIcon className="w-4 h-4" />
            </div>
          )}
          {indicators.starStudent && (
            <div title="Star Student" className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-lg">
              ⭐
            </div>
          )}
        </div>

        {/* Right Section: Quick Actions */}
        <div className={`flex items-center gap-1.5 flex-shrink-0 transition-all duration-200 ${showActions ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}>
          {/* Quick action buttons - visible on hover */}
          <div className={`flex items-center gap-1.5 overflow-hidden transition-all duration-300 ${showActions ? 'max-w-xs' : 'max-w-0'}`}>
            {onCall && (
              <button
                onClick={() => onCall(id)}
                className="p-2 rounded-lg hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-all duration-200"
                title="Call"
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
            {onText && (
              <button
                onClick={() => onText(id)}
                className="p-2 rounded-lg hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-all duration-200"
                title="Text"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}
            {onEmail && (
              <button
                onClick={() => onEmail(id)}
                className="p-2 rounded-lg hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-all duration-200"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </button>
            )}
            {onNotes && (
              <button
                onClick={() => onNotes(id)}
                className="p-2 rounded-lg hover:bg-yellow-500/20 text-slate-400 hover:text-yellow-400 transition-all duration-200"
                title="Notes"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* More actions menu */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-all duration-200"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                {onAssignProgram && (
                  <button
                    onClick={() => {
                      onAssignProgram(id)
                      setShowActions(false)
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-blue-500/20 hover:text-blue-300 transition-all duration-150 flex items-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    Assign Program
                  </button>
                )}
                {onPromoteBelt && (
                  <button
                    onClick={() => {
                      onPromoteBelt(id)
                      setShowActions(false)
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-150 flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Promote Belt
                  </button>
                )}
                {onProfileClick && (
                  <button
                    onClick={() => {
                      onProfileClick(id)
                      setShowActions(false)
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-150 flex items-center gap-2 border-t border-white/10"
                  >
                    <ChevronRight className="w-4 h-4" />
                    View Profile
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Profile chevron */}
          {onProfileClick && (
            <button
              onClick={() => onProfileClick(id)}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-all duration-200"
              title="View profile"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Simple icon components for indicators
function AlertTriangleIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 6v2M7.08 6.47L5.6 4.99m2.39 9.11l-1.48 1.48m9.58-9.58l1.48-1.48m-1.48 9.11l1.48 1.48" />
    </svg>
  )
}

function ClockIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function TrophyIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function TrendDownIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17H3v-2h10V9H5v2h8V5h2v12z" />
    </svg>
  )
}
