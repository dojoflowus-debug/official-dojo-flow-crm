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
}

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 1000) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;
    
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * target));
      
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

export default function LeadStatTiles({
  newLeadsToday,
  agingLeads,
  pipelineValue,
  kaiAlerts,
  onFilterClick,
  activeFilter,
  isDarkMode
}: LeadStatTilesProps) {
  const animatedNewLeads = useAnimatedCounter(newLeadsToday, 800);
  const animatedAgingLeads = useAnimatedCounter(agingLeads, 800);
  const animatedPipelineValue = useAnimatedCounter(pipelineValue, 1200);
  const animatedKaiAlerts = useAnimatedCounter(kaiAlerts, 800);

  const tiles = [
    {
      id: 'new' as const,
      icon: Flame,
      label: 'New Leads (Today)',
      value: animatedNewLeads,
      rawValue: newLeadsToday,
      format: (v: number) => v.toString(),
      dotColor: newLeadsToday > 0 ? 'bg-green-500' : 'bg-slate-400',
      showBlink: newLeadsToday > 0,
      gradient: isDarkMode 
        ? 'from-green-900/20 to-green-800/10' 
        : 'from-green-50 to-green-100/50',
      iconColor: 'text-green-500',
    },
    {
      id: 'aging' as const,
      icon: AlertTriangle,
      label: 'Aging Leads',
      value: animatedAgingLeads,
      rawValue: agingLeads,
      format: (v: number) => v.toString(),
      dotColor: agingLeads > 0 ? 'bg-amber-500' : 'bg-slate-400',
      showBlink: false,
      gradient: isDarkMode 
        ? 'from-amber-900/20 to-amber-800/10' 
        : 'from-amber-50 to-amber-100/50',
      iconColor: 'text-amber-500',
    },
    {
      id: 'value' as const,
      icon: DollarSign,
      label: 'Est. Pipeline Value',
      value: animatedPipelineValue,
      rawValue: pipelineValue,
      format: (v: number) => `$${v.toLocaleString()}`,
      dotColor: 'bg-emerald-500',
      showBlink: false,
      gradient: isDarkMode 
        ? 'from-emerald-900/20 to-emerald-800/10' 
        : 'from-emerald-50 to-emerald-100/50',
      iconColor: 'text-emerald-500',
    },
    {
      id: 'kai' as const,
      icon: Sparkles,
      label: 'Kai Alerts',
      value: animatedKaiAlerts,
      rawValue: kaiAlerts,
      format: (v: number) => v.toString(),
      dotColor: kaiAlerts > 0 ? 'bg-[#E53935]' : 'bg-slate-400',
      showBlink: kaiAlerts > 0,
      gradient: isDarkMode 
        ? 'from-red-900/20 to-red-800/10' 
        : 'from-red-50 to-red-100/50',
      iconColor: 'text-[#E53935]',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-4 md:px-6 py-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        const isActive = activeFilter === tile.id;
        
        return (
          <button
            key={tile.id}
            onClick={() => onFilterClick(isActive ? null : tile.id)}
            className={`
              relative group p-4 md:p-5 rounded-2xl transition-all duration-300
              ${isDarkMode 
                ? `bg-gradient-to-br ${tile.gradient} border border-white/10` 
                : `bg-gradient-to-br ${tile.gradient} border border-slate-200/50`
              }
              ${isActive 
                ? 'ring-2 ring-[#E53935] ring-offset-2 ring-offset-transparent scale-[1.02]' 
                : 'hover:scale-[1.02]'
              }
              shadow-sm hover:shadow-md
            `}
          >
            {/* Status dot with optional blink */}
            <div className="absolute top-3 right-3">
              <div className={`w-2.5 h-2.5 rounded-full ${tile.dotColor} ${tile.showBlink ? 'animate-pulse' : ''}`} />
            </div>

            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isDarkMode ? 'bg-white/10' : 'bg-white/80'}`}>
              <Icon className={`w-5 h-5 ${tile.iconColor}`} />
            </div>

            {/* Value */}
            <div className={`text-2xl md:text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {tile.format(tile.value)}
            </div>

            {/* Label */}
            <div className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
              {tile.label}
            </div>

            {/* Active indicator */}
            {isActive && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#E53935]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
