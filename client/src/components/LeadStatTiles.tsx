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
      const timer = setTimeout(() => setHasPulsed(false), 500);
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-4 md:px-6 py-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        const isActive = activeFilter === tile.id;
        const health = tile.health;
        
        // Resolve Mode visual effects per health status
        const isGreen = health === 'green';
        const isYellow = health === 'yellow';
        const isRed = health === 'red';
        const isKaiTile = tile.id === 'kai';
        
        // In Resolve Mode: green softens, yellow pulses once, red glows, Kai prioritized
        const resolveModeClass = isResolveMode ? (
          isGreen ? 'opacity-60' :
          isYellow ? (hasPulsed ? 'scale-[1.02]' : '') :
          isRed ? 'shadow-lg shadow-red-500/30' :
          ''
        ) : '';
        
        // Kai Alerts gets strongest priority in Resolve Mode
        const kaiPriorityClass = isResolveMode && isKaiTile 
          ? 'ring-2 ring-[#E53935]/60 shadow-xl shadow-[#E53935]/20 scale-[1.02]' 
          : '';
        
        // Health-based styling
        const healthStyles = {
          green: {
            dot: 'bg-green-500',
            gradient: isDarkMode ? 'from-green-900/10 to-transparent' : 'from-green-50/60 to-white',
            icon: 'text-green-500',
            border: isDarkMode ? 'border-green-500/20' : 'border-green-200/50',
          },
          yellow: {
            dot: 'bg-amber-500',
            gradient: isDarkMode ? 'from-amber-900/15 to-transparent' : 'from-amber-50/70 to-white',
            icon: 'text-amber-500',
            border: isDarkMode ? 'border-amber-500/25' : 'border-amber-200/60',
          },
          red: {
            dot: 'bg-red-500',
            gradient: isDarkMode ? 'from-red-900/20 to-transparent' : 'from-red-50/80 to-white',
            icon: 'text-red-500',
            border: isDarkMode ? 'border-red-500/30' : 'border-red-200/70',
          },
        };
        
        const styles = healthStyles[health];
        
        return (
          <button
            key={tile.id}
            onClick={() => onFilterClick(isActive ? null : tile.id)}
            className={`
              relative group p-4 md:p-5 rounded-[16px]
              transition-all duration-[180ms] ease-out
              bg-gradient-to-br ${styles.gradient}
              border ${styles.border}
              ${isDarkMode ? 'backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm'}
              ${isActive ? 'ring-2 ring-[#E53935] ring-offset-2 ring-offset-transparent' : ''}
              ${resolveModeClass}
              ${kaiPriorityClass}
              hover:shadow-md hover:-translate-y-0.5
            `}
          >
            {/* Status indicator dot (top-right) */}
            <div className="absolute top-3 right-3">
              <div className={`
                relative w-2.5 h-2.5 rounded-full ${styles.dot}
                transition-all duration-[180ms] ease-out
              `}>
                {/* Glow ring for red in Resolve Mode */}
                {isResolveMode && isRed && (
                  <div className={`absolute inset-0 rounded-full ${styles.dot} animate-ping opacity-40`} />
                )}
              </div>
            </div>

            {/* Icon */}
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center mb-3
              transition-all duration-[180ms] ease-out
              ${isDarkMode ? 'bg-white/5' : 'bg-white/70 shadow-sm'}
            `}>
              <Icon className={`w-5 h-5 ${styles.icon}`} />
            </div>

            {/* Value */}
            <div className={`
              text-2xl md:text-3xl font-semibold mb-1 tabular-nums
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
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#E53935] transition-all duration-[180ms] ease-out" />
            )}
          </button>
        );
      })}
    </div>
  );
}
