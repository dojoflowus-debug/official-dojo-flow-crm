import { useState } from 'react';
import { 
  Flame, 
  Phone, 
  Calendar, 
  Gift, 
  Star, 
  Heart, 
  XCircle,
  Sparkles
} from 'lucide-react';

interface PipelineStage {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  glowColor: string;
  bgGradient: string;
}

interface HeroPipelineStripProps {
  selectedStage: string | null;
  onStageSelect: (stageId: string) => void;
  stageCounts: Record<string, number>;
  stageValues: Record<string, number>;
  isDarkMode: boolean;
}

const stages: PipelineStage[] = [
  { 
    id: 'new_lead', 
    label: 'New Leads', 
    icon: Flame, 
    color: '#22C55E',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    bgGradient: 'from-green-600/90 to-green-700/90'
  },
  { 
    id: 'contacted', 
    label: 'Contacted', 
    icon: Phone, 
    color: '#84CC16',
    glowColor: 'rgba(132, 204, 22, 0.4)',
    bgGradient: 'from-lime-600/90 to-lime-700/90'
  },
  { 
    id: 'intro_scheduled', 
    label: 'Intro Scheduled', 
    icon: Calendar, 
    color: '#EAB308',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    bgGradient: 'from-yellow-600/90 to-yellow-700/90'
  },
  { 
    id: 'trial_presented', 
    label: 'Trial Presented', 
    icon: Gift, 
    color: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    bgGradient: 'from-orange-600/90 to-orange-700/90'
  },
  { 
    id: 'lost_winback', 
    label: 'Lost / Winback', 
    icon: XCircle, 
    color: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    bgGradient: 'from-red-600/90 to-red-700/90'
  },
];

export default function HeroPipelineStrip({ 
  selectedStage, 
  onStageSelect,
  stageCounts,
  stageValues,
  isDarkMode
}: HeroPipelineStripProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="w-full px-4 md:px-6 py-6">
      {/* Pipeline Container */}
      <div className="relative flex items-stretch overflow-x-auto scrollbar-hide">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isSelected = selectedStage === stage.id;
          const isHovered = hoveredStage === stage.id;
          const count = stageCounts[stage.id] || 0;
          const value = stageValues[stage.id] || 0;
          const isFirst = index === 0;
          const isLast = index === stages.length - 1;

          return (
            <button
              key={stage.id}
              onClick={() => onStageSelect(stage.id)}
              onMouseEnter={() => setHoveredStage(stage.id)}
              onMouseLeave={() => setHoveredStage(null)}
              className={`
                relative flex-1 min-w-[180px] group
                transition-all duration-300 ease-out
                ${isSelected ? 'z-20' : isHovered ? 'z-10' : 'z-0'}
              `}
              style={{
                marginLeft: isFirst ? 0 : '-20px',
              }}
            >
              {/* Chevron Shape with SVG */}
              <div className="relative h-[120px]">
                <svg 
                  viewBox="0 0 200 120" 
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full"
                  style={{
                    filter: isSelected || isHovered 
                      ? `drop-shadow(0 0 20px ${stage.glowColor})` 
                      : 'none',
                  }}
                >
                  <defs>
                    <linearGradient id={`gradient-${stage.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={stage.color} stopOpacity={isSelected ? 1 : 0.85} />
                      <stop offset="100%" stopColor={stage.color} stopOpacity={isSelected ? 0.9 : 0.7} />
                    </linearGradient>
                  </defs>
                  {/* Chevron path */}
                  <path
                    d={isFirst 
                      ? "M0,0 L170,0 L200,60 L170,120 L0,120 Z"
                      : isLast
                        ? "M0,0 L200,0 L200,120 L0,120 L30,60 Z"
                        : "M0,0 L170,0 L200,60 L170,120 L0,120 L30,60 Z"
                    }
                    fill={`url(#gradient-${stage.id})`}
                    className={`
                      transition-all duration-300
                      ${isSelected ? 'opacity-100' : isHovered ? 'opacity-95' : 'opacity-80'}
                    `}
                  />
                  {/* Inner highlight */}
                  <path
                    d={isFirst 
                      ? "M0,0 L170,0 L200,60 L170,120 L0,120 Z"
                      : isLast
                        ? "M0,0 L200,0 L200,120 L0,120 L30,60 Z"
                        : "M0,0 L170,0 L200,60 L170,120 L0,120 L30,60 Z"
                    }
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                  />
                </svg>

                {/* Content */}
                <div className={`
                  absolute inset-0 flex flex-col items-center justify-center
                  px-6 text-center
                  ${isFirst ? 'pl-4' : 'pl-8'}
                  ${isLast ? 'pr-4' : 'pr-6'}
                `}>
                  {/* Icon + Label Row */}
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`
                      w-4 h-4 text-white/90
                      transition-transform duration-300
                      ${isSelected || isHovered ? 'scale-110' : ''}
                    `} />
                    <span className={`
                      text-sm font-semibold text-white
                      transition-all duration-300
                      ${isSelected ? 'text-white' : 'text-white/90'}
                    `}>
                      {stage.label}
                    </span>
                    {/* Count Badge */}
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs font-bold
                      bg-white/20 text-white backdrop-blur-sm
                      transition-all duration-300
                      ${isSelected || isHovered ? 'bg-white/30' : ''}
                    `}>
                      {count}
                    </span>
                  </div>

                  {/* Value */}
                  <div className={`
                    text-2xl font-bold text-white
                    transition-all duration-300
                    ${isSelected || isHovered ? 'scale-105' : ''}
                  `}>
                    {formatCurrency(value)}
                  </div>

                  {/* Subtitle */}
                  <span className="text-[10px] text-white/60 uppercase tracking-wider mt-1">
                    {count === 1 ? 'LEAD' : 'LEADS'}
                  </span>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 
                    border-l-[8px] border-l-transparent 
                    border-r-[8px] border-r-transparent 
                    border-t-[8px]"
                    style={{ borderTopColor: stage.color }}
                  />
                )}

                {/* Pulse animation for active stage */}
                {isSelected && (
                  <div 
                    className="absolute inset-0 rounded-sm pointer-events-none"
                    style={{
                      animation: 'pulseBorder 2s ease-in-out infinite',
                      boxShadow: `inset 0 0 0 2px ${stage.color}`,
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulseBorder {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
