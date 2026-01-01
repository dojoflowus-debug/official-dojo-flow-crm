import { Flame, Clock, DollarSign, AlertTriangle, Sparkles } from 'lucide-react';

interface PipelineCommandBarProps {
  newLeads: number;
  agingLeads: number;
  pipelineValue: number;
  alerts: number;
  isDarkMode: boolean;
  onFilterClick?: (filter: 'new' | 'aging' | 'value' | 'alerts' | null) => void;
  activeFilter?: 'new' | 'aging' | 'value' | 'alerts' | null;
}

export default function PipelineCommandBar({
  newLeads,
  agingLeads,
  pipelineValue,
  alerts,
  isDarkMode,
  onFilterClick,
  activeFilter
}: PipelineCommandBarProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value.toLocaleString()}`;
  };

  const metrics = [
    {
      id: 'new',
      icon: Flame,
      label: 'New Leads',
      value: newLeads,
      color: '#22C55E',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500',
      borderColor: 'border-green-500/30',
    },
    {
      id: 'aging',
      icon: Clock,
      label: 'Aging',
      value: agingLeads,
      color: '#EAB308',
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-500',
      borderColor: 'border-yellow-500/30',
    },
    {
      id: 'value',
      icon: DollarSign,
      label: 'Pipeline',
      value: formatCurrency(pipelineValue),
      isFormatted: true,
      color: '#3B82F6',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500',
      borderColor: 'border-blue-500/30',
    },
    {
      id: 'alerts',
      icon: AlertTriangle,
      label: 'Alerts',
      value: alerts,
      color: '#EF4444',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-500',
      borderColor: 'border-red-500/30',
    },
  ];

  return (
    <div className="w-full px-4 md:px-6 py-3">
      <div className={`
        flex items-center justify-center gap-2 md:gap-4 flex-wrap
        px-4 py-3 rounded-xl
        ${isDarkMode 
          ? 'bg-white/5 backdrop-blur-sm border border-white/10' 
          : 'bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-sm'
        }
      `}>
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isActive = activeFilter === metric.id;

          return (
            <button
              key={metric.id}
              onClick={() => onFilterClick?.(isActive ? null : metric.id as any)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg
                transition-all duration-200 ease-out
                ${isActive 
                  ? `${metric.bgColor} ${metric.borderColor} border` 
                  : isDarkMode 
                    ? 'hover:bg-white/5' 
                    : 'hover:bg-slate-100'
                }
              `}
            >
              <Icon 
                className={`w-4 h-4 ${metric.textColor}`} 
                style={{ color: metric.color }}
              />
              <span className={`
                text-sm font-medium
                ${isDarkMode ? 'text-white/70' : 'text-slate-600'}
              `}>
                {metric.label}:
              </span>
              <span className={`
                text-sm font-bold
                ${metric.textColor}
              `}
              style={{ color: metric.color }}
              >
                {metric.value}
              </span>

              {/* Separator */}
              {index < metrics.length - 1 && (
                <div className={`
                  hidden md:block w-px h-4 ml-2
                  ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}
                `} />
              )}
            </button>
          );
        })}

        {/* Kai Insight Button */}
        <button className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg ml-2
          transition-all duration-200 ease-out
          ${isDarkMode 
            ? 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30' 
            : 'bg-purple-50 hover:bg-purple-100 border border-purple-200'
          }
        `}>
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-purple-500">
            Ask Kai
          </span>
        </button>
      </div>
    </div>
  );
}
