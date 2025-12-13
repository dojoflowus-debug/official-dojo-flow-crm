import { useState, useEffect, useRef } from 'react';
import { Flame, AlertTriangle, DollarSign, Sparkles } from 'lucide-react';

interface LeadStatTilesProps {
  newLeadsToday: number;
  agingLeads: number;
  pipelineValue: number;
  kaiAlerts: number;
  onFilterClick: (filter: 'new' | 'aging' | 'value' | 'kai' | null) => void;
  activeFilter: 'new' | 'aging' | 'value' | 'kai' | null;
  isDarkMode: boolean;
  isResolveMode?: boolean;
}

// Animated counter hook with 180ms max duration
function useAnimatedCounter(target: number, duration: number = 180) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;
    
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      
      // Ease-out only
      const easeOut = 1 - Math.pow(1 - progress, 2);
      setCount(Math.floor(easeOut * target));
      
      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };
    
    animationFrame.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [target, duration]);

  return count;
}

// Determine health status based on tile type and value
function getHealthStatus(tileId: string, value: number): 'green' | 'yellow' | 'red' {
  if (tileId === 'new') {
    return value > 0 ? 'green' : 'green';
  }
  if (tileId === 'aging') {
    if (value === 0) return 'green';
    if (value <= 3) return 'yellow';
    return 'red';
  }
  if (tileId === 'value') {
    return 'green';
  }
  if (tileId === 'kai') {
    if (value === 0) return 'green';
    if (value <= 2) return 'yellow';
    return 'red';
  }
  return 'green';
}

export default function LeadStatTiles({
  newLeadsToday,
  agingLeads,
  pipelineValue,
  kaiAlerts,
  onFilterClick,
  activeFilter,
  isDarkMode,
  isResolveMode = false
}: LeadStatTilesProps) {
  const [hasPulsed, setHasPulsed] = useState(false);
  
  // Pulse once when Resolve Mode turns ON
  useEffect(() => {
    if (isResolveMode && !hasPulsed) {
      setHasPulsed(true);
      // Reset after animation completes
      const timer = setTimeout(() => setHasPulsed(false), 180);
      return () => clearTimeout(timer);
    }
    if (!isResolveMode) {
      setHasPulsed(false);
    }
  }, [isResolveMode]);

  const animatedNewLeads = useAnimatedCounter(newLeadsToday, 180);
  const animatedAgingLeads = useAnimatedCounter(agingLeads, 180);
  const animatedPipelineValue = useAnimatedCounter(pipelineValue, 180);
  const animatedKaiAlerts = useAnimatedCounter(kaiAlerts, 180);

  const tiles = [
    {
      id: 'new' as const,
      icon: Flame,
      label: 'New Leads (Today)',
      value: animatedNewLeads,
      rawValue: newLeadsToday,
      format: (v: number) => v.toString(),
      health: getHealthStatus('new', newLeadsToday),
    },
    {
      id: 'aging' as const,
      icon: AlertTriangle,
      label: 'Aging Leads',
      value: animatedAgingLeads,
      rawValue: agingLeads,
      format: (v: number) => v.toString(),
      health: getHealthStatus('aging', agingLeads),
    },
    {
      id: 'value' as const,
      icon: DollarSign,
      label: 'Est. Pipeline Value',
      value: animatedPipelineValue,
      rawValue: pipelineValue,
      format: (v: number) => `$${v.toLocaleString()}`,
      health: getHealthStatus('value', pipelineValue),
    },
    {
      id: 'kai' as const,
      icon: Sparkles,
      label: 'Kai Alerts',
      value: animatedKaiAlerts,
      rawValue: kaiAlerts,
      format: (v: number) => v.toString(),
      health: getHealthStatus('kai', kaiAlerts),
    },
  ];

  // Health color mapping
  const healthColors = {
    green: {
      dot: 'bg-green-500',
      glow: 'shadow-green-500/20',
      gradient: isDarkMode ? 'from-green-900/15 to-green-800/5' : 'from-green-50/80 to-green-100/40',
      icon: 'text-green-500',
    },
    yellow: {
      dot: 'bg-amber-500',
      glow: 'shadow-amber-500/20',
      gradient: isDarkMode ? 'from-amber-900/15 to-amber-800/5' : 'from-amber-50/80 to-amber-100/40',
      icon: 'text-amber-500',
    },
    red: {
      dot: 'bg-red-500',
      glow: 'shadow-red-500/20',
      gradient: isDarkMode ? 'from-red-900/15 to-red-800/5' : 'from-red-50/80 to-red-100/40',
      icon: 'text-red-500',
    },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-4 md:px-6 py-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        const isActive = activeFilter === tile.id;
        const colors = healthColors[tile.health];
        const shouldPulse = isResolveMode && hasPulsed;
        
        // In Resolve Mode, prioritize Kai Alerts tile
        const isKaiPrioritized = isResolveMode && tile.id === 'kai';
        
        return (
          <button
            key={tile.id}
            onClick={() => onFilterClick(isActive ? null : tile.id)}
            className={`
              relative group p-4 md:p-5 rounded-[14px]
              transition-all duration-[180ms] ease-out
              ${isDarkMode 
                ? `bg-gradient-to-br ${colors.gradient} border border-white/10` 
                : `bg-gradient-to-br ${colors.gradient} border border-slate-200/30`
              }
              ${isActive 
                ? 'ring-2 ring-[#E53935] ring-offset-2 ring-offset-transparent' 
                : ''
              }
              ${isKaiPrioritized ? 'ring-2 ring-[#E53935]/50' : ''}
              hover:shadow-md hover:${colors.glow}
              ${shouldPulse ? 'scale-[1.02]' : ''}
            `}
          >
            {/* Status indicator light (top-right) */}
            <div className="absolute top-3 right-3">
              <div className={`
                w-2 h-2 rounded-full ${colors.dot}
                transition-all duration-[180ms] ease-out
                ${isResolveMode ? 'animate-[pulse_2s_ease-out_1]' : ''}
              `} />
            </div>

            {/* Icon */}
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center mb-3
              transition-all duration-[180ms] ease-out
              ${isDarkMode ? 'bg-white/5' : 'bg-white/60'}
            `}>
              <Icon className={`w-5 h-5 ${colors.icon}`} />
            </div>

            {/* Value */}
            <div className={`
              text-2xl md:text-3xl font-semibold mb-1
              transition-all duration-[180ms] ease-out
              ${isDarkMode ? 'text-white' : 'text-slate-800'}
            `}>
              {tile.format(tile.value)}
            </div>

            {/* Label - minimal micro-copy */}
            <div className={`
              text-xs font-medium
              ${isDarkMode ? 'text-white/50' : 'text-slate-500'}
            `}>
              {tile.label}
            </div>

            {/* Active indicator bar */}
            {isActive && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#E53935] transition-all duration-[180ms] ease-out" />
            )}
          </button>
        );
      })}
    </div>
  );
}
