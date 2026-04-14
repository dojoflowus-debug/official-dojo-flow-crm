import { Phone, MessageSquare, Calendar, Globe, MapPin, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  source?: string;
  status: string;
  pipeline_value?: number;
  lead_score?: number;
  created_at?: string;
  updated_at?: string;
}

interface KanbanLeadCardProps {
  lead: Lead;
  stageColor: string;
  isDarkMode: boolean;
  onClick?: () => void;
  onCall?: () => void;
  onText?: () => void;
  onSchedule?: () => void;
  isDragging?: boolean;
}

export default function KanbanLeadCard({
  lead,
  stageColor,
  isDarkMode,
  onClick,
  onCall,
  onText,
  onSchedule,
  isDragging = false
}: KanbanLeadCardProps) {
  const fullName = `${lead.first_name} ${lead.last_name}`.trim();
  const score = lead.lead_score || Math.floor(Math.random() * 50) + 50;
  const value = lead.pipeline_value || 500;

  // Calculate age
  const getAge = () => {
    if (!lead.created_at) return 'Today';
    const created = new Date(lead.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  // Get formatted date added
  const getDateAdded = () => {
    if (!lead.created_at) return null;
    const created = new Date(lead.created_at);
    return created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get score color
  const getScoreColor = () => {
    if (score >= 70) return { bg: 'bg-green-500', text: 'text-green-500' };
    if (score >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-500' };
    return { bg: 'bg-red-500', text: 'text-red-500' };
  };

  const scoreColors = getScoreColor();

  // Get source icon
  const getSourceIcon = () => {
    const source = (lead.source || '').toLowerCase();
    if (source.includes('web')) return Globe;
    if (source.includes('referral')) return MapPin;
    return Globe;
  };

  const SourceIcon = getSourceIcon();

  return (
    <div
      onClick={onClick}
      className={`
        relative group cursor-pointer
        rounded-xl overflow-hidden
        transition-all duration-200 ease-out
        hover:scale-[1.02] hover:shadow-lg
        ${isDarkMode 
          ? 'bg-[#1A1A1C] border border-white/10 hover:border-white/20' 
          : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm'
        }
      `}
    >
      {/* Stage Color Edge */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: stageColor }}
      />

      <div className="p-4 pl-5">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className={`
              font-semibold text-sm truncate
              ${isDarkMode ? 'text-white' : 'text-slate-800'}
            `}>
              {fullName}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <SourceIcon className={`w-3 h-3 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
              <span className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                {lead.source || 'Website'}
              </span>
            </div>
          </div>

          {/* Score Badge */}
          <div className={`
            relative w-10 h-10 rounded-full flex items-center justify-center
            ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}
          `}>
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                strokeWidth="3"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke={scoreColors.bg.replace('bg-', '#').replace('-500', '')}
                strokeWidth="3"
                strokeDasharray={`${(score / 100) * 100} 100`}
                strokeLinecap="round"
                className={scoreColors.text}
                style={{ 
                  stroke: score >= 70 ? '#22C55E' : score >= 50 ? '#EAB308' : '#EF4444'
                }}
              />
            </svg>
            <span className={`
              text-xs font-bold
              ${scoreColors.text}
            `}
            style={{ 
              color: score >= 70 ? '#22C55E' : score >= 50 ? '#EAB308' : '#EF4444'
            }}
            >
              {score}
            </span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1.5 mb-3">
          {lead.phone && (
            <div className="flex items-center gap-2">
              <Phone className={`w-3 h-3 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
              <span className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
                {lead.phone}
              </span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2">
              <Mail className={`w-3 h-3 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
              <span className={`text-xs truncate ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
                {lead.email}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className={`w-3 h-3 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
            <span className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
              {getDateAdded() ? (
                <span title={`Added ${getAge()}`}>{getDateAdded()}</span>
              ) : getAge()}
            </span>
          </div>
        </div>

        {/* Value & Action Row */}
        <div className="flex items-center justify-between pt-3 border-t border-dashed"
          style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
        >
          <div className="flex items-center gap-1">
            <span className={`text-xs ${isDarkMode ? 'text-yellow-400/80' : 'text-yellow-600'}`}>💰</span>
            <span className={`text-sm font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
              ${value.toLocaleString()}
            </span>
          </div>

          {/* Quick Action Button */}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCall?.();
            }}
            className={`
              h-7 px-3 text-xs font-medium rounded-lg
              ${isDarkMode 
                ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30' 
                : 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-200'
              }
            `}
          >
            <Phone className="w-3 h-3 mr-1" />
            Call
          </Button>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
        style={{
          boxShadow: `inset 0 0 0 1px ${stageColor}40`,
        }}
      />
    </div>
  );
}
