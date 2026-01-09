import { useMemo } from 'react'
import { Users, Zap, Trophy, Heart, Sword } from 'lucide-react'

interface ProgramBadgeProps {
  program: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'filled' | 'outline' | 'subtle'
}

const PROGRAM_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; text: string; description: string }> = {
  'Little Ninjas': {
    icon: <Users className="w-4 h-4" />,
    color: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-500/20',
    text: 'text-pink-300',
    description: 'Young students program',
  },
  'Kickboxing': {
    icon: <Zap className="w-4 h-4" />,
    color: 'from-orange-500 to-red-500',
    bg: 'bg-orange-500/20',
    text: 'text-orange-300',
    description: 'Kickboxing training',
  },
  'Leadership': {
    icon: <Trophy className="w-4 h-4" />,
    color: 'from-amber-500 to-yellow-500',
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    description: 'Leadership development',
  },
  'Martial Arts': {
    icon: <Sword className="w-4 h-4" />,
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/20',
    text: 'text-blue-300',
    description: 'Traditional martial arts',
  },
  'Fitness': {
    icon: <Heart className="w-4 h-4" />,
    color: 'from-green-500 to-emerald-500',
    bg: 'bg-green-500/20',
    text: 'text-green-300',
    description: 'Fitness and wellness',
  },
}

export default function ProgramBadge({
  program,
  size = 'md',
  variant = 'subtle',
}: ProgramBadgeProps) {
  const config = useMemo(() => {
    return PROGRAM_CONFIG[program] || {
      icon: <Users className="w-4 h-4" />,
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/20',
      text: 'text-blue-300',
      description: program,
    }
  }, [program])

  const sizeConfig = {
    sm: { padding: 'px-2 py-1', fontSize: 'text-xs', gap: 'gap-1' },
    md: { padding: 'px-3 py-1.5', fontSize: 'text-sm', gap: 'gap-1.5' },
    lg: { padding: 'px-4 py-2', fontSize: 'text-base', gap: 'gap-2' },
  }

  const size_config = sizeConfig[size]

  const variantClasses = {
    filled: `bg-gradient-to-r ${config.color} text-white font-semibold shadow-lg shadow-${config.color.split(' ')[1].split('-')[1]}-500/30`,
    outline: `border border-${config.text.split('-')[1]}-500/50 ${config.text} bg-transparent`,
    subtle: `${config.bg} ${config.text} font-medium`,
  }

  return (
    <div
      className={`inline-flex items-center ${size_config.gap} ${size_config.padding} rounded-full ${variantClasses[variant]} transition-all duration-300 hover:shadow-lg`}
      title={config.description}
    >
      {config.icon}
      <span>{program}</span>
    </div>
  )
}
