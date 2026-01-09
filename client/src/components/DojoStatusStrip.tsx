import { useMemo } from 'react'
import { Users, Flame, AlertCircle, TrendingUp, Clock } from 'lucide-react'

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
  averageAttendanceStreak = 0,
}: DojoStatusStripProps) {
  const healthScore = useMemo(() => {
    if (totalStudents === 0) return 0
    const activeRatio = (activeStudents / totalStudents) * 100
    const riskRatio = (atRiskStudents / totalStudents) * 100
    return Math.round(activeRatio - (riskRatio * 0.5))
  }, [totalStudents, activeStudents, atRiskStudents])

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'from-green-500/30 to-emerald-500/20 border-green-500/30'
    if (score >= 60) return 'from-yellow-500/30 to-amber-500/20 border-yellow-500/30'
    return 'from-red-500/30 to-orange-500/20 border-red-500/30'
  }

  const getHealthText = (score: number) => {
    if (score >= 80) return 'text-green-300'
    if (score >= 60) return 'text-yellow-300'
    return 'text-red-300'
  }

  return (
    <div className="bg-gradient-to-r from-white/[0.02] to-white/[0.01] backdrop-blur-lg border border-white/5 rounded-xl p-4 mb-6">
      {/* Status indicators grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Dojo Health Score */}
        <div className={`bg-gradient-to-br ${getHealthColor(healthScore)} border rounded-lg p-3 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Dojo Health</span>
            <TrendingUp className="w-3 h-3 text-slate-400" />
          </div>
          <div className={`text-2xl font-bold ${getHealthText(healthScore)}`}>{healthScore}%</div>
          <div className="text-xs text-slate-500 mt-1">Overall vitality</div>
        </div>

        {/* Total Students */}
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-400/10 border border-blue-500/20 rounded-lg p-3 transition-all duration-300 hover:border-blue-500/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Roster</span>
            <Users className="w-3 h-3 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-300">{totalStudents}</div>
          <div className="text-xs text-slate-500 mt-1">Total enrolled</div>
        </div>

        {/* Active Students */}
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-400/10 border border-green-500/20 rounded-lg p-3 transition-all duration-300 hover:border-green-500/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Active</span>
            <Flame className="w-3 h-3 text-green-400 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-green-300">{activeStudents}</div>
          <div className="text-xs text-slate-500 mt-1">In program</div>
        </div>

        {/* At Risk Students */}
        <div className={`bg-gradient-to-br ${atRiskStudents > 0 ? 'from-red-500/20 to-orange-400/10 border-red-500/20' : 'from-green-500/20 to-emerald-400/10 border-green-500/20'} border rounded-lg p-3 transition-all duration-300 ${atRiskStudents > 0 ? 'hover:border-red-500/40' : 'hover:border-green-500/40'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">At Risk</span>
            <AlertCircle className={`w-3 h-3 ${atRiskStudents > 0 ? 'text-red-400' : 'text-green-400'}`} />
          </div>
          <div className={`text-2xl font-bold ${atRiskStudents > 0 ? 'text-red-300' : 'text-green-300'}`}>{atRiskStudents}</div>
          <div className="text-xs text-slate-500 mt-1">Need attention</div>
        </div>

        {/* Retention Rate */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-400/10 border border-purple-500/20 rounded-lg p-3 transition-all duration-300 hover:border-purple-500/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Retention</span>
            <Clock className="w-3 h-3 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300">{retentionRate}%</div>
          <div className="text-xs text-slate-500 mt-1">Staying strong</div>
        </div>
      </div>

      {/* Pulse indicator line */}
      <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 animate-pulse"
          style={{ width: `${healthScore}%` }}
        />
      </div>
    </div>
  )
}
