import { 
  Users, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  TrendingUp,
  Activity
} from 'lucide-react'

interface StatusBarProps {
  activeStudents: number
  atRiskCount: number
  pendingFollowUps: number
  revenueImpact?: number
  isDarkMode?: boolean
}

interface StatItemProps {
  icon: any
  label: string
  value: string | number
  color: string
  glowing?: boolean
  isDarkMode?: boolean
}

function StatItem({ icon: Icon, label, value, color, glowing, isDarkMode }: StatItemProps) {
  return (
    <div className={`
      flex items-center gap-3 px-4 py-2 rounded-xl transition-all
      ${glowing ? `animate-pulse ${isDarkMode ? 'bg-red-500/10' : 'bg-red-50'}` : ''}
    `}>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>{label}</p>
        <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} ${glowing ? 'text-red-500' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

export default function CommandStatusBar({ 
  activeStudents, 
  atRiskCount, 
  pendingFollowUps,
  revenueImpact = 0,
  isDarkMode 
}: StatusBarProps) {
  return (
    <div className={`
      flex items-center gap-2 overflow-x-auto pb-2 px-1
      scrollbar-hide
    `}>
      <StatItem
        icon={Users}
        label="Active Students"
        value={activeStudents}
        color={isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}
        isDarkMode={isDarkMode}
      />
      
      <StatItem
        icon={AlertTriangle}
        label="At Risk"
        value={atRiskCount}
        color={isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}
        glowing={atRiskCount > 0}
        isDarkMode={isDarkMode}
      />
      
      <StatItem
        icon={Clock}
        label="Pending Follow-ups"
        value={pendingFollowUps}
        color={isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}
        glowing={pendingFollowUps > 0}
        isDarkMode={isDarkMode}
      />
      
      {revenueImpact > 0 && (
        <StatItem
          icon={DollarSign}
          label="Revenue Impact"
          value={`$${revenueImpact.toLocaleString()}`}
          color={isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  )
}
