import { useMemo } from 'react'
import { Award } from 'lucide-react'

interface BeltProgressIndicatorProps {
  currentBelt: string
  progressToNextBelt: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const BELT_SEQUENCE = [
  { name: 'White Belt', color: 'from-slate-300 to-slate-200', accent: 'bg-slate-400', order: 0 },
  { name: 'Yellow Belt', color: 'from-yellow-400 to-yellow-300', accent: 'bg-yellow-500', order: 1 },
  { name: 'Orange Belt', color: 'from-orange-400 to-orange-300', accent: 'bg-orange-500', order: 2 },
  { name: 'Green Belt', color: 'from-green-400 to-green-300', accent: 'bg-green-500', order: 3 },
  { name: 'Blue Belt', color: 'from-blue-400 to-blue-300', accent: 'bg-blue-500', order: 4 },
  { name: 'Brown Belt', color: 'from-amber-700 to-amber-600', accent: 'bg-amber-700', order: 5 },
  { name: 'Black Belt', color: 'from-slate-900 to-slate-800', accent: 'bg-slate-900', order: 6 },
]

export default function BeltProgressIndicator({
  currentBelt,
  progressToNextBelt,
  showLabel = true,
  size = 'md',
}: BeltProgressIndicatorProps) {
  const currentBeltIndex = useMemo(() => {
    return BELT_SEQUENCE.findIndex(b => b.name === currentBelt)
  }, [currentBelt])

  const nextBeltIndex = currentBeltIndex + 1
  const isBlackBelt = currentBeltIndex === BELT_SEQUENCE.length - 1

  const sizeConfig = {
    sm: { containerHeight: 'h-1', dotSize: 'w-3 h-3', fontSize: 'text-xs' },
    md: { containerHeight: 'h-2', dotSize: 'w-4 h-4', fontSize: 'text-sm' },
    lg: { containerHeight: 'h-3', dotSize: 'w-5 h-5', fontSize: 'text-base' },
  }

  const config = sizeConfig[size]

  return (
    <div className="space-y-2">
      {/* Belt progression line */}
      <div className="flex items-center gap-2">
        {BELT_SEQUENCE.map((belt, idx) => {
          const isCompleted = idx < currentBeltIndex
          const isCurrent = idx === currentBeltIndex
          const isNext = idx === nextBeltIndex

          return (
            <div key={belt.name} className="flex-1 flex flex-col items-center gap-1">
              {/* Belt dot */}
              <div
                className={`${config.dotSize} rounded-full transition-all duration-300 ${
                  isCompleted || isCurrent
                    ? `${belt.accent} shadow-lg shadow-${belt.accent.split('-')[1]}-500/50`
                    : 'bg-white/10 border border-white/20'
                } ${isCurrent ? 'ring-2 ring-white/50 scale-125' : ''}`}
              />

              {/* Progress bar between dots */}
              {idx < BELT_SEQUENCE.length - 1 && (
                <div className={`flex-1 w-full ${config.containerHeight} bg-white/5 rounded-full overflow-hidden`}>
                  {isCompleted && (
                    <div className={`w-full h-full bg-gradient-to-r ${BELT_SEQUENCE[idx].color}`} />
                  )}
                  {isCurrent && (
                    <div
                      className={`h-full bg-gradient-to-r ${belt.color} transition-all duration-700`}
                      style={{ width: `${progressToNextBelt}%` }}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Label and progress info */}
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">{currentBelt}</span>
          {!isBlackBelt && (
            <span className="text-slate-300 font-semibold">
              {progressToNextBelt}% to {BELT_SEQUENCE[nextBeltIndex]?.name}
            </span>
          )}
          {isBlackBelt && (
            <div className="flex items-center gap-1 text-amber-400 font-semibold">
              <Award className="w-3 h-3" />
              <span>Master</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
