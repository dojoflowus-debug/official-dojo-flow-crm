import { useMemo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Users, Flame, AlertCircle, Activity } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sub: string
  icon: React.ElementType
  variant: 'default' | 'success' | 'warning' | 'danger'
  isDark: boolean
  pulse?: boolean
}

function StatCard({ label, value, sub, icon: Icon, variant, isDark, pulse }: StatCardProps) {
  const styles = {
    default: {
      card: isDark ? 'bg-[oklch(0.155_0.006_25)] border-[oklch(0.24_0.006_25)]' : 'bg-white border-gray-200/80',
      iconWrap: isDark ? 'bg-white/8 text-white/50' : 'bg-gray-100 text-gray-500',
      val: isDark ? 'text-white' : 'text-gray-900',
      lbl: isDark ? 'text-white/45' : 'text-gray-500',
      sub: isDark ? 'text-white/30' : 'text-gray-400',
    },
    success: {
      card: isDark ? 'bg-[oklch(0.155_0.006_25)] border-emerald-500/20' : 'bg-white border-emerald-200/70',
      iconWrap: isDark ? 'bg-emerald-500/12 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
      val: isDark ? 'text-emerald-400' : 'text-emerald-700',
      lbl: isDark ? 'text-white/45' : 'text-gray-500',
      sub: isDark ? 'text-emerald-500/55' : 'text-emerald-600/60',
    },
    warning: {
      card: isDark ? 'bg-[oklch(0.155_0.006_25)] border-amber-500/20' : 'bg-white border-amber-200/70',
      iconWrap: isDark ? 'bg-amber-500/12 text-amber-400' : 'bg-amber-50 text-amber-600',
      val: isDark ? 'text-amber-400' : 'text-amber-700',
      lbl: isDark ? 'text-white/45' : 'text-gray-500',
      sub: isDark ? 'text-amber-500/55' : 'text-amber-600/60',
    },
    danger: {
      card: isDark ? 'bg-[oklch(0.155_0.006_25)] border-red-500/20' : 'bg-white border-red-200/70',
      iconWrap: isDark ? 'bg-red-500/12 text-red-400' : 'bg-red-50 text-red-600',
      val: isDark ? 'text-red-400' : 'text-red-700',
      lbl: isDark ? 'text-white/45' : 'text-gray-500',
      sub: isDark ? 'text-red-500/55' : 'text-red-600/60',
    },
  }
  const s = styles[variant]
  return (
    <div className={cn(
      'relative flex items-center gap-3 rounded-xl border px-4 py-3.5',
      'transition-all duration-200 hover:scale-[1.01] cursor-default',
      isDark ? 'shadow-[0_1px_3px_oklch(0_0_0/0.4)]' : 'shadow-[0_1px_3px_oklch(0_0_0/0.06),0_1px_2px_oklch(0_0_0/0.04)]',
      s.card
    )}>
      <div className={cn('flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg', s.iconWrap)}>
        <Icon className={cn('w-4 h-4', pulse && 'animate-pulse')} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-[10px] font-semibold uppercase tracking-widest mb-0.5', s.lbl)}>{label}</p>
        <p className={cn('text-2xl font-bold leading-none tracking-tight', s.val)}>{value}</p>
        <p className={cn('text-[11px] mt-1', s.sub)}>{sub}</p>
      </div>
    </div>
  )
}

interface DojoStatusStripProps {
  totalStudents: number
  activeStudents: number
  atRiskStudents: number
  retentionRate: number
  averageAttendanceStreak?: number
}

export default function DojoStatusStrip({
  totalStudents,
  activeStudents,
  atRiskStudents,
  retentionRate,
}: DojoStatusStripProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark' || theme === 'cinematic'

  const healthScore = useMemo(() => {
    if (totalStudents === 0) return 0
    const activeRatio = (activeStudents / totalStudents) * 100
    const riskRatio = (atRiskStudents / totalStudents) * 100
    return Math.round(activeRatio - riskRatio * 0.5)
  }, [totalStudents, activeStudents, atRiskStudents])

  const healthVariant = healthScore >= 80 ? 'success' : healthScore >= 60 ? 'warning' : 'danger'
  const riskVariant = atRiskStudents === 0 ? 'success' : atRiskStudents <= 3 ? 'warning' : 'danger'
  const retentionVariant = retentionRate >= 80 ? 'success' : retentionRate >= 60 ? 'warning' : 'danger'

  return (
    <div className={cn(
      'rounded-2xl border p-4 mb-6',
      isDark
        ? 'bg-[oklch(0.10_0.006_25)] border-[oklch(0.22_0.006_25)]'
        : 'bg-[oklch(0.985_0.002_60)] border-[oklch(0.91_0.003_60)]'
    )}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Dojo Health" value={`${healthScore}%`} sub="Overall vitality"
          icon={healthScore >= 60 ? TrendingUp : TrendingDown} variant={healthVariant} isDark={isDark} />
        <StatCard label="Roster" value={totalStudents} sub="Total enrolled"
          icon={Users} variant="default" isDark={isDark} />
        <StatCard label="Active" value={activeStudents} sub="In program"
          icon={Flame} variant="success" isDark={isDark} pulse={activeStudents > 0} />
        <StatCard label="At Risk" value={atRiskStudents} sub="Need attention"
          icon={AlertCircle} variant={riskVariant} isDark={isDark} />
        <StatCard label="Retention" value={`${retentionRate}%`} sub="Staying strong"
          icon={Activity} variant={retentionVariant} isDark={isDark} />
      </div>
      <div className={cn('mt-4 h-[3px] rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-black/5')}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 ease-out',
            healthScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-400'
            : healthScore >= 60 ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
            : 'bg-gradient-to-r from-red-600 to-orange-500'
          )}
          style={{ width: `${Math.max(healthScore, 2)}%` }}
        />
      </div>
    </div>
  )
}
