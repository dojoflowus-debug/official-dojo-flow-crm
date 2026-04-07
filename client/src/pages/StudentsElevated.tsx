import { useNavigate, useSearchParams } from 'react-router-dom'
import { trpc } from '@/lib/trpc'
import ManagementLayout from '@/components/ManagementLayout';
import { useState, useMemo, useEffect } from 'react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Components
import StudentMap from '@/components/StudentMap'
import { StudentNotesDrawer } from '@/components/StudentNotesDrawer'

// Icons
import {
  Search,
  Map,
  Users,
  UserPlus,
  Phone,
  MessageSquare,
  Flag,
  Trophy,
  Flame,
  Zap,
  AlertTriangle,
  CreditCard,
  Star,
  ChevronRight,
  LayoutGrid,
  List,
  MoreVertical,
  Award,
} from 'lucide-react'

interface Student {
  id: number
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  status: string
  beltRank?: string | null
  program?: string | null
  photoUrl?: string | null
  latitude?: string | number | null
  longitude?: string | number | null
  createdAt?: string
  address?: string
  membershipStatus?: string | null
}

// Belt color config
const BELT_CONFIG: Record<string, { color: string; bg: string; text: string; ring: string; gradient: string }> = {
  'White Belt':  { color: '#e2e8f0', bg: 'bg-slate-200',   text: 'text-slate-800', ring: 'ring-slate-300',  gradient: 'from-slate-300 to-slate-200' },
  'White':       { color: '#e2e8f0', bg: 'bg-slate-200',   text: 'text-slate-800', ring: 'ring-slate-300',  gradient: 'from-slate-300 to-slate-200' },
  'Yellow Belt': { color: '#facc15', bg: 'bg-yellow-400',  text: 'text-yellow-900', ring: 'ring-yellow-400', gradient: 'from-yellow-400 to-yellow-300' },
  'Yellow':      { color: '#facc15', bg: 'bg-yellow-400',  text: 'text-yellow-900', ring: 'ring-yellow-400', gradient: 'from-yellow-400 to-yellow-300' },
  'Orange Belt': { color: '#fb923c', bg: 'bg-orange-400',  text: 'text-orange-900', ring: 'ring-orange-400', gradient: 'from-orange-400 to-orange-300' },
  'Orange':      { color: '#fb923c', bg: 'bg-orange-400',  text: 'text-orange-900', ring: 'ring-orange-400', gradient: 'from-orange-400 to-orange-300' },
  'Green Belt':  { color: '#4ade80', bg: 'bg-green-400',   text: 'text-green-900', ring: 'ring-green-400',  gradient: 'from-green-400 to-green-300' },
  'Green':       { color: '#4ade80', bg: 'bg-green-400',   text: 'text-green-900', ring: 'ring-green-400',  gradient: 'from-green-400 to-green-300' },
  'Blue Belt':   { color: '#60a5fa', bg: 'bg-blue-400',    text: 'text-blue-900',  ring: 'ring-blue-400',   gradient: 'from-blue-400 to-blue-300' },
  'Blue':        { color: '#60a5fa', bg: 'bg-blue-400',    text: 'text-blue-900',  ring: 'ring-blue-400',   gradient: 'from-blue-400 to-blue-300' },
  'Purple Belt': { color: '#c084fc', bg: 'bg-purple-400',  text: 'text-purple-900', ring: 'ring-purple-400', gradient: 'from-purple-400 to-purple-300' },
  'Purple':      { color: '#c084fc', bg: 'bg-purple-400',  text: 'text-purple-900', ring: 'ring-purple-400', gradient: 'from-purple-400 to-purple-300' },
  'Brown Belt':  { color: '#a16207', bg: 'bg-amber-700',   text: 'text-white',     ring: 'ring-amber-700',  gradient: 'from-amber-700 to-amber-600' },
  'Brown':       { color: '#a16207', bg: 'bg-amber-700',   text: 'text-white',     ring: 'ring-amber-700',  gradient: 'from-amber-700 to-amber-600' },
  'Black Belt':  { color: '#1e293b', bg: 'bg-slate-900',   text: 'text-white',     ring: 'ring-slate-700',  gradient: 'from-slate-800 to-slate-700' },
  'Black':       { color: '#1e293b', bg: 'bg-slate-900',   text: 'text-white',     ring: 'ring-slate-700',  gradient: 'from-slate-800 to-slate-700' },
  'Red Belt':    { color: '#f87171', bg: 'bg-red-400',     text: 'text-red-900',   ring: 'ring-red-400',    gradient: 'from-red-400 to-red-300' },
  'Red':         { color: '#f87171', bg: 'bg-red-400',     text: 'text-red-900',   ring: 'ring-red-400',    gradient: 'from-red-400 to-red-300' },
}

function normalizeBelt(belt: string | null | undefined): string {
  if (!belt) return 'White Belt'
  // Normalize short names to full names
  const map: Record<string, string> = {
    'White': 'White Belt', 'Yellow': 'Yellow Belt', 'Orange': 'Orange Belt',
    'Green': 'Green Belt', 'Blue': 'Blue Belt', 'Purple': 'Purple Belt',
    'Brown': 'Brown Belt', 'Black': 'Black Belt', 'Red': 'Red Belt',
  }
  return map[belt] || belt
}

function getBeltConfig(belt: string | null | undefined) {
  const normalized = normalizeBelt(belt)
  return BELT_CONFIG[normalized] || BELT_CONFIG['White Belt']
}

function getBeltLabel(belt: string | null | undefined): string {
  return normalizeBelt(belt)
}

// Deterministic pseudo-random from student id
function seededRandom(seed: number, max: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return Math.floor((x - Math.floor(x)) * max)
}

// Dojo Energy bar
function DojoEnergyBar({ active, total }: { active: number; total: number }) {
  const pct = total > 0 ? Math.round((active / total) * 100) : 0
  const level = pct >= 80 ? 'STRONG' : pct >= 60 ? 'GOOD' : pct >= 40 ? 'MODERATE' : 'LOW'
  const levelColor = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : pct >= 40 ? 'text-orange-500' : 'text-red-500'

  return (
    <div className="relative w-full overflow-hidden rounded-none" style={{ background: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
      {/* Rainbow gradient bar */}
      <div className="h-2 w-full" style={{
        background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6)',
        opacity: 0.85,
      }} />
      <div className="px-4 py-2 flex items-center gap-3">
        <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">Dojo Energy:</span>
        <span className={`text-xs font-black tracking-widest uppercase ${levelColor}`}>{level}</span>
        <span className="ml-auto text-xs text-gray-400">{active} active  -  {total} total</span>
      </div>
    </div>
  )
}

// Student of the Day hero card
function StudentOfTheDayCard({ student, onView, onPromote }: {
  student: Student
  onView: () => void
  onPromote: () => void
}) {
  const belt = getBeltConfig(student.beltRank)
  const beltLabel = getBeltLabel(student.beltRank)
  const xp = seededRandom(student.id, 200) + 50
  const initials = `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase()

  return (
    <div className="relative mx-4 mt-4 mb-2 rounded-2xl overflow-hidden shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${belt.color}18 0%, white 60%)`,
        border: `1.5px solid ${belt.color}40`,
      }}
    >
      {/* Glowing background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 30% 50%, ${belt.color}15 0%, transparent 70%)`,
      }} />

      <div className="relative z-10 flex items-center gap-4 p-4">
        {/* Trophy + label */}
        <div className="absolute top-3 left-4 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-black tracking-widest text-yellow-600 uppercase">Student of the Day</span>
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 ml-1" />
        </div>

        {/* Avatar */}
        <div className="mt-5 relative flex-shrink-0">
          <div className="absolute -inset-1 rounded-full opacity-40 blur-sm" style={{ background: `radial-gradient(circle, ${belt.color}88, transparent)` }} />
          <div className={`relative w-20 h-20 rounded-full ring-4 ${belt.ring} overflow-hidden flex items-center justify-center`}
            style={{ background: belt.color + '33' }}>
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-gray-700">{initials}</span>
            )}
          </div>
          {/* Green go arrow */}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/50">
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Info */}
        <div className="mt-5 flex-1 min-w-0">
          <h2 className="text-xl font-black text-gray-900 truncate">{student.firstName} {student.lastName}</h2>
          <div className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold mt-0.5 ${belt.bg} ${belt.text}`}>
            {beltLabel}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-black text-gray-800">{xp} XP</span>
            <span className="text-xs text-gray-400">this week</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2 flex-shrink-0">
          <button onClick={onPromote}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors">
            Promote
          </button>
          <button onClick={onView}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors">
            View Profile
          </button>
        </div>
      </div>
    </div>
  )
}

// Filter tabs
const FILTER_TABS = [
  { key: 'all',           label: 'Active',           icon: <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />,   statusValue: 'Active',  activeClass: 'bg-green-500 text-white border-green-500',         activeIcon: <span className="w-2 h-2 rounded-full bg-white inline-block" /> },
  { key: 'at-risk',       label: 'At Risk',          icon: <AlertTriangle className="w-3 h-3 text-yellow-500" />,                 statusValue: 'At Risk', activeClass: 'bg-yellow-400 text-yellow-900 border-yellow-400',  activeIcon: <AlertTriangle className="w-3 h-3 text-yellow-900" /> },
  { key: 'inactive',      label: 'Inactive',         icon: <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />,     statusValue: 'Inactive',activeClass: 'bg-red-500 text-white border-red-500',             activeIcon: <span className="w-2 h-2 rounded-full bg-white inline-block" /> },
  { key: 'billing',       label: 'Billing Issues',   icon: <CreditCard className="w-3 h-3 text-orange-400" />,                   statusValue: 'billing', activeClass: 'bg-orange-500 text-white border-orange-500',       activeIcon: <CreditCard className="w-3 h-3 text-white" /> },
  { key: 'ready-promote', label: 'Ready to Promote', icon: <Award className="w-3 h-3 text-blue-400" />,                          statusValue: 'promote', activeClass: 'bg-blue-500 text-white border-blue-500',           activeIcon: <Award className="w-3 h-3 text-white" /> },
]

// New student card matching the mockup
function StudentCardNew({
  student,
  onCall,
  onText,
  onFlag,
  onPromote,
  onProfileClick,
  onDelete,
}: {
  student: Student
  onCall: () => void
  onText: () => void
  onFlag: () => void
  onPromote: () => void
  onProfileClick: () => void
  onDelete: () => void
}) {
  const belt = getBeltConfig(student.beltRank)
  const beltLabel = getBeltLabel(student.beltRank)
  const streak = seededRandom(student.id, 15) + 1
  const xpProgress = seededRandom(student.id + 1, 85) + 15
  const missedClasses = seededRandom(student.id + 2, 8)
  const daysApart = seededRandom(student.id + 3, 14) + 1
  const isAtRisk = student.status === 'At Risk'
  const isInactive = student.status === 'Inactive'
  const hasBillingIssue = student.membershipStatus === 'Overdue' || student.membershipStatus === 'Suspended'
  const isReadyToPromote = xpProgress >= 80
  const initials = `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase()

  // Determine card border/accent color
  let borderColor = 'rgba(0,0,0,0.08)'
  let accentGlow = 'transparent'
  if (hasBillingIssue) { borderColor = 'rgba(239,68,68,0.4)'; accentGlow = 'rgba(239,68,68,0.08)' }
  else if (isAtRisk) { borderColor = 'rgba(234,179,8,0.4)'; accentGlow = 'rgba(234,179,8,0.06)' }
  else if (isReadyToPromote) { borderColor = 'rgba(96,165,250,0.4)'; accentGlow = 'rgba(96,165,250,0.06)' }

  // Last contact text
  const lastContactText = daysApart === 1 ? '1 day apart' : daysApart < 7 ? `${daysApart} Days apart` : daysApart < 14 ? '1 Week apart' : daysApart < 21 ? '2 Weeks apart' : '1 month ago'

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        background: 'rgba(255,255,255,0.95)',
        border: `1.5px solid ${borderColor}`,
        backdropFilter: 'blur(12px)',
        boxShadow: `0 0 0 0 ${accentGlow}`,
      }}
      onClick={onProfileClick}
    >
      {/* Belt color accent bar at top */}
      <div className="h-1 w-full" style={{ background: belt.color }} />

      <div className="p-4">
        {/* Top row: avatar + name + belt + menu */}
        <div className="flex items-start gap-3">
          {/* Avatar with belt ring */}
          <div className="relative flex-shrink-0">
            <div className={`w-14 h-14 rounded-full ring-2 ${belt.ring} overflow-hidden flex items-center justify-center`}
              style={{ background: belt.color + '22' }}>
              {student.photoUrl ? (
                <img src={student.photoUrl} alt={initials} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-black text-gray-700">{initials}</span>
              )}
            </div>
            {/* Status dot */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${
              student.status === 'Active' ? 'bg-green-400' :
              isAtRisk ? 'bg-yellow-400' :
              hasBillingIssue ? 'bg-red-500' : 'bg-slate-500'
            }`} />
          </div>

          {/* Name + belt */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 truncate leading-tight">{student.firstName} {student.lastName}</h3>
                <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${belt.bg} ${belt.text}`}>
                  {getBeltLabel(student.beltRank)}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="p-1 rounded text-gray-300 hover:text-gray-600 transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Billing issue badge */}
        {hasBillingIssue && (
          <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
            <span className="text-[10px] font-semibold text-red-600">Billing issue detected</span>
          </div>
        )}

        {/* Streak / missed classes row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {missedClasses > 3 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-semibold text-gray-600">{missedClasses} Missed classes</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-semibold text-gray-600">{streak} Day Streak</span>
              </>
            )}
          </div>
          <span className="text-xs font-bold text-gray-500">{xpProgress}%</span>
        </div>

        {/* XP progress bar */}
        <div className="mt-1.5 w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${xpProgress}%`,
              background: `linear-gradient(to right, ${belt.color}cc, ${belt.color})`,
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[9px] text-gray-400 font-medium">XP</span>
        </div>

        {/* Last contact / status note */}
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-[8px] text-gray-400">*</span>
          </div>
          {isReadyToPromote && !hasBillingIssue ? (
            <span className="text-[10px] text-blue-600 font-semibold">Ready for promotion  -  {beltLabel}</span>
          ) : hasBillingIssue ? (
            <span className="text-[10px] text-gray-400">{missedClasses} Missed classes  -  {lastContactText}</span>
          ) : (
            <span className="text-[10px] text-gray-400">{lastContactText}</span>
          )}
        </div>

        {/* Level up ready banner */}
        {isReadyToPromote && (
          <div className="mt-2 px-3 py-1 rounded-lg text-center text-[10px] font-black tracking-widest text-yellow-700 uppercase"
            style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(251,146,60,0.15))', border: '1px solid rgba(234,179,8,0.4)' }}>
            [ LEVEL UP READY ]
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {hasBillingIssue ? (
            <>
              <button onClick={onCall}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-green-400 transition-colors hover:bg-green-500/10"
                style={{ border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)' }}>
                <Phone className="w-3 h-3" /> Call
              </button>
              <button onClick={onFlag}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                <Flag className="w-3 h-3" /> Flag
              </button>
            </>
          ) : isReadyToPromote ? (
            <>
              <button onClick={onPromote}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold text-white transition-colors"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 2px 8px rgba(34,197,94,0.3)' }}>
                <Award className="w-3 h-3" /> Promote
              </button>
              <button onClick={onFlag}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold text-white transition-colors"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>
                <Flag className="w-3 h-3" /> Promote
              </button>
            </>
          ) : (
            <>
              <button onClick={onCall}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-green-400 transition-colors hover:bg-green-500/10"
                style={{ border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)' }}>
                <Phone className="w-3 h-3" /> Call
              </button>
              <button onClick={onText}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500/10"
                style={{ border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.05)' }}>
                <MessageSquare className="w-3 h-3" /> Text
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StudentsElevatedContent() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [selectedStudentForNotes, setSelectedStudentForNotes] = useState<Student | null>(null)
  const [showNotesDrawer, setShowNotesDrawer] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [newStudentForm, setNewStudentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    beltRank: 'White Belt',
    status: 'Active',
  })

  // Force light mode on this page regardless of global theme setting
  useEffect(() => {
    const root = document.documentElement
    const prevClasses = Array.from(root.classList).filter(c =>
      ['dark', 'light', 'cinematic', 'dark-mode', 'light-mode', 'cinematic-mode'].includes(c)
    )
    const prevDataTheme = root.getAttribute('data-theme')
    root.classList.remove('dark', 'cinematic', 'dark-mode', 'cinematic-mode')
    root.classList.add('light', 'light-mode')
    root.setAttribute('data-theme', 'light')
    return () => {
      root.classList.remove('light', 'light-mode')
      prevClasses.forEach(c => root.classList.add(c))
      if (prevDataTheme) root.setAttribute('data-theme', prevDataTheme)
    }
  }, [])

  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam === 'needs-attention') setActiveTab('at-risk')
    else if (filterParam === 'needs-followup') setActiveTab('at-risk')
    else if (filterParam === 'overdue') setActiveTab('inactive')
    else setActiveTab('all')
  }, [searchParams])

  // Map tab to status filter
  const statusFilter = useMemo(() => {
    if (activeTab === 'at-risk') return 'At Risk'
    if (activeTab === 'inactive') return 'Inactive'
    return undefined
  }, [activeTab])

  // Fetch students
  const { data: studentsData, isLoading } = trpc.students.getListWithFilters.useQuery({
    page: currentPage,
    limit: 21,
    search: searchQuery || undefined,
    status: statusFilter,
  })

  // Fetch analytics
  const { data: analyticsData } = trpc.students.getAnalytics.useQuery(undefined)

  // Mutations
  const deleteStudentMutation = trpc.students.delete.useMutation({
    onSuccess: () => { setShowDeleteConfirm(false); setStudentToDelete(null) },
  })
  const createStudentMutation = trpc.students.create.useMutation({
    onSuccess: () => {
      setShowAddStudentModal(false)
      setNewStudentForm({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', beltRank: 'White Belt', status: 'Active' })
    },
  })

  const students = (studentsData?.students || []) as Student[]
  const totalStudents = (studentsData?.total || 0) as number
  const totalPages = Math.ceil(totalStudents / 21)

  // Student of the day: pick the active student with highest id (deterministic)
  const studentOfTheDay = useMemo(() => {
    const active = students.filter(s => s.status === 'Active')
    if (active.length === 0) return students[0] || null
    return active.reduce((best, s) => seededRandom(s.id, 1000) > seededRandom(best.id, 1000) ? s : best, active[0])
  }, [students])

  // Filter students for billing/promote tabs client-side
  const displayedStudents = useMemo(() => {
    if (activeTab === 'billing') {
      return students.filter(s => s.membershipStatus === 'Overdue' || s.membershipStatus === 'Suspended')
    }
    if (activeTab === 'ready-promote') {
      return students.filter(s => seededRandom(s.id + 1, 85) + 15 >= 80)
    }
    return students
  }, [students, activeTab])

  const active = analyticsData?.active || 0
  const total = analyticsData?.total || 0

  return (
    <div className="min-h-full pb-24" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 40%, #f8fafc 100%)' }}>
      {/* Background atmosphere */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #bfdbfe, transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #ddd6fe, transparent)' }} />
      </div>

      {/* Dojo Energy Bar */}
      <DojoEnergyBar active={active} total={total} />

      {/* Student of the Day */}
      {studentOfTheDay && (
        <StudentOfTheDayCard
          student={studentOfTheDay}
          onView={() => navigate(`/students/${studentOfTheDay.id}`)}
          onPromote={() => navigate(`/students/${studentOfTheDay.id}`)}
        />
      )}

      {/* Filter Tabs */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setCurrentPage(1) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                activeTab === tab.key
                  ? tab.activeClass
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {activeTab === tab.key ? tab.activeIcon : tab.icon}
              {tab.label}
            </button>
          ))}
          {/* View toggle */}
          <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-full p-1 border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 mt-3 flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-200 focus:outline-none focus:border-gray-400 transition-all shadow-sm"
          />
        </div>
        <button
          onClick={() => setViewMode('map')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            viewMode === 'map' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          Map
        </button>
        <button
          onClick={() => setShowAddStudentModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 2px 12px rgba(239,68,68,0.4)' }}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Student
        </button>
        <button
          className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 2px 12px rgba(124,58,237,0.4)' }}
        >
          <Zap className="w-3.5 h-3.5" />
          Start Focus Mode
        </button>
      </div>

      {/* Main content */}
      <div className="px-4 mt-4">
        {viewMode === 'map' ? (
          <StudentMap students={students as any} />
        ) : isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayedStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Users className="w-10 h-10 text-gray-300" />
            <p className="text-gray-400 text-sm">No students found</p>
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'flex flex-col gap-3'
          }>
            {displayedStudents.map(student => (
              <StudentCardNew
                key={student.id}
                student={student}
                onCall={() => {
                  if (student.phone) window.location.href = `tel:${student.phone}`
                }}
                onText={() => {
                  if (student.phone) window.location.href = `sms:${student.phone}`
                }}
                onFlag={() => navigate(`/students/${student.id}`)}
                onPromote={() => navigate(`/students/${student.id}`)}
                onProfileClick={() => navigate(`/students/${student.id}`)}
                onDelete={() => { setStudentToDelete(student); setShowDeleteConfirm(true) }}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              Showing {(currentPage - 1) * 21 + 1}–{Math.min(currentPage * 21, totalStudents)} of {totalStudents}
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notes Drawer */}
      {selectedStudentForNotes && (
        <StudentNotesDrawer
          studentId={selectedStudentForNotes.id}
          studentName={`${selectedStudentForNotes.firstName} ${selectedStudentForNotes.lastName}`}
          isOpen={showNotesDrawer}
          onClose={() => { setShowNotesDrawer(false); setSelectedStudentForNotes(null) }}
        />
      )}

      {/* Add Student Modal */}
      <Dialog open={showAddStudentModal} onOpenChange={setShowAddStudentModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>Fill in the student information below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input value={newStudentForm.firstName} onChange={(e) => setNewStudentForm({...newStudentForm, firstName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input value={newStudentForm.lastName} onChange={(e) => setNewStudentForm({...newStudentForm, lastName: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={newStudentForm.email} onChange={(e) => setNewStudentForm({...newStudentForm, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input value={newStudentForm.phone} onChange={(e) => setNewStudentForm({...newStudentForm, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date of Birth</label>
              <Input type="date" value={newStudentForm.dateOfBirth} onChange={(e) => setNewStudentForm({...newStudentForm, dateOfBirth: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStudentModal(false)}>Cancel</Button>
            <Button onClick={() => createStudentMutation.mutate(newStudentForm as any)}>Add Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => studentToDelete && deleteStudentMutation.mutate({ id: studentToDelete.id })}
              className="bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function StudentsElevated() {
  return (
    <ManagementLayout>
      <StudentsElevatedContent />
    </ManagementLayout>
  )
}
