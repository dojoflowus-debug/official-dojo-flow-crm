import React from 'react'
import { useEffect, useRef } from 'react'
import { Users, TrendingUp, AlertTriangle, Clock, Sparkles, Cake, BarChart3 } from 'lucide-react'

interface CommandBarStats {
  totalStudents: number
  activeToday: number
  atRisk: number
  inactive: number
  newThisMonth: number
  birthdaysThisWeek: number
  averageAttendance: number
}

interface StudentCommandBarProps {
  stats: CommandBarStats
  onTileClick?: (tileType: string) => void
  loading?: boolean
}

export default function StudentCommandBar({ stats, onTileClick, loading = false }: StudentCommandBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hasSeenRef = useRef(false)

  useEffect(() => {
    const hasSeen = localStorage.getItem('kai-command-bar-seen')
    if (!hasSeen && containerRef.current) {
      containerRef.current.classList.add('kai-command-bar-first-time')
      localStorage.setItem('kai-command-bar-seen', 'true')
      hasSeenRef.current = true
    }
  }, [])

  const tiles = [
    {
      id: 'total',
      label: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      accentColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: 'active',
      label: 'Active Today',
      value: stats.activeToday,
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      accentColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      hasLiveIndicator: true
    },
    {
      id: 'at-risk',
      label: 'At Risk',
      value: stats.atRisk,
      icon: AlertTriangle,
      color: 'from-amber-500 to-orange-600',
      accentColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      hasGlow: true
    },
    {
      id: 'inactive',
      label: 'Inactive',
      value: stats.inactive,
      icon: Clock,
      color: 'from-slate-500 to-slate-600',
      accentColor: 'text-slate-400',
      bgColor: 'bg-slate-500/10'
    },
    {
      id: 'new',
      label: 'New This Month',
      value: stats.newThisMonth,
      icon: Sparkles,
      color: 'from-purple-500 to-purple-600',
      accentColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      id: 'birthdays',
      label: 'Birthdays This Week',
      value: stats.birthdaysThisWeek,
      icon: Cake,
      color: 'from-pink-500 to-rose-600',
      accentColor: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      hasCelebration: true
    },
    {
      id: 'attendance',
      label: 'Avg Attendance',
      value: `${Math.round(stats.averageAttendance)}%`,
      icon: BarChart3,
      color: 'from-cyan-500 to-blue-600',
      accentColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10'
    }
  ]

  return (
    <div className="w-full" ref={containerRef}>
      {/* Command Bar Title */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Command Center</h2>
          <p className="text-sm text-slate-400 mt-1">Live operational overview of your dojo</p>
        </div>
      </div>

      {/* Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-300">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <button
              key={tile.id}
              onClick={() => onTileClick?.(tile.id)}
              disabled={loading}
              className="group relative overflow-hidden rounded-xl p-5 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tile.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
              
              {/* Glow effect for at-risk */}
              {tile.hasGlow && (
                <div className="absolute inset-0 bg-amber-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              )}

              {/* Glass effect border */}
              <div className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-white/20 transition-colors" />

              {/* Live indicator for active today */}
              {tile.hasLiveIndicator && (
                <div className="absolute top-3 right-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-emerald-400">Live</span>
                  </div>
                </div>
              )}

              {/* Celebration sparkles for birthdays */}
              {tile.hasCelebration && (
                <div className="absolute top-3 right-3 text-lg animate-bounce">✨</div>
              )}

              {/* Content */}
              <div className="relative z-10 flex flex-col items-start">
                {/* Icon and label */}
                <div className="flex items-center gap-3 mb-3 w-full">
                  <div className={`p-2.5 rounded-lg ${tile.bgColor}`}>
                    <Icon className={`w-5 h-5 ${tile.accentColor}`} />
                  </div>
                  <span className="text-xs font-medium text-slate-300 uppercase tracking-wide">{tile.label}</span>
                </div>

                {/* Value */}
                <div className="text-3xl font-bold text-white">
                  {loading ? '—' : tile.value}
                </div>

                {/* Chevron indicator */}
                <div className="mt-3 text-slate-400 group-hover:text-slate-300 transition-colors">
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Hover shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 -skew-x-12 group-hover:translate-x-full transition-all duration-500" />
            </button>
          )
        })}
      </div>

      {/* Responsive note for mobile */}
      <div className="mt-4 text-xs text-slate-500 text-center lg:hidden">
        Scroll horizontally to see all metrics
      </div>
    </div>
  )
}
