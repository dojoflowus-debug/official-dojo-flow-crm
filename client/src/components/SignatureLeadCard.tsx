import { useState, useMemo } from 'react';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Sparkles,
  ChevronRight,
  Globe,
  Users,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  source?: string;
  lead_score?: number;
  updated_at?: string;
  created_at?: string;
  ai_summary?: string;
  parent_of?: string;
}

interface SignatureLeadCardProps {
  lead: Lead;
  onCall?: () => void;
  onText?: () => void;
  onSchedule?: () => void;
  onMoveToStage?: () => void;
  onClick?: () => void;
  hasKaiSuggestion?: boolean;
  isDarkMode: boolean;
  isResolveMode?: boolean;
  index?: number;
}

// Source icon mapping
const sourceIcons: Record<string, React.ElementType> = {
  'Google': Globe,
  'Website': Globe,
  'Walk-In': Users,
  'Walk-in': Users,
  'Referral': Users,
  'Facebook': Megaphone,
  'Instagram': Megaphone,
};

// Calculate age in days from a date string
function getAgeDays(dateStr?: string): number {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Get age status based on days
function getAgeStatus(days: number): 'green' | 'yellow' | 'red' {
  if (days <= 5) return 'green';
  if (days <= 10) return 'yellow';
  return 'red';
}

export default function SignatureLeadCard({ 
  lead, 
  onCall, 
  onText, 
  onSchedule, 
  onMoveToStage,
  onClick,
  hasKaiSuggestion = false,
  isDarkMode,
  isResolveMode = false,
  index = 0
}: SignatureLeadCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const fullName = `${lead.first_name} ${lead.last_name}`;
  const source = lead.source || 'Unknown';
  const SourceIcon = sourceIcons[source] || Globe;
  
  // Calculate age and status
  const ageDays = useMemo(() => getAgeDays(lead.created_at || lead.updated_at), [lead.created_at, lead.updated_at]);
  const ageStatus = useMemo(() => getAgeStatus(ageDays), [ageDays]);
  
  // Status colors and animations
  const statusConfig = {
    green: {
      borderColor: isDarkMode ? 'border-green-500/30' : 'border-green-400/40',
      glowColor: 'shadow-green-500/20',
      dotColor: 'bg-green-500',
      pulseSpeed: 'animate-[pulse_6s_ease-in-out_infinite]',
      lineColor: 'bg-green-500',
    },
    yellow: {
      borderColor: isDarkMode ? 'border-amber-500/40' : 'border-amber-400/50',
      glowColor: 'shadow-amber-500/30',
      dotColor: 'bg-amber-500',
      pulseSpeed: 'animate-[pulse_4s_ease-in-out_infinite]',
      lineColor: 'bg-amber-500',
    },
    red: {
      borderColor: isDarkMode ? 'border-red-500/50' : 'border-red-400/60',
      glowColor: 'shadow-red-500/40',
      dotColor: 'bg-red-500',
      pulseSpeed: 'animate-[pulse_2s_ease-in-out_infinite]',
      lineColor: 'bg-red-500',
    },
  };

  const config = statusConfig[ageStatus];
  
  // Determine if card should be dimmed in resolve mode
  const isDimmed = isResolveMode && ageStatus === 'green';
  
  // Format last activity
  const formatLastActivity = (dateStr?: string) => {
    if (!dateStr) return 'No activity';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Vertical offset based on age (newer leads higher)
  const verticalOffset = Math.min(ageDays * 2, 20);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ marginTop: `${verticalOffset}px` }}
      className={`
        relative cursor-pointer rounded-2xl p-5
        transition-all duration-300 ease-out
        border-2 ${config.borderColor}
        ${isDarkMode 
          ? 'bg-slate-800/90 backdrop-blur-sm' 
          : 'bg-white/95 backdrop-blur-sm'
        }
        ${isHovered && !isDimmed
          ? `shadow-xl ${config.glowColor} -translate-y-1 scale-[1.02]` 
          : 'shadow-md'
        }
        ${isDimmed ? 'opacity-30 pointer-events-none' : ''}
      `}
    >
      {/* Status indicator line (left edge) */}
      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${config.lineColor} ${config.pulseSpeed}`} />

      {/* Kai AI Suggestion Badge */}
      {hasKaiSuggestion && !isDimmed && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-[#E53935] to-[#FF6B6B] text-white text-xs font-medium rounded-full shadow-lg z-10">
          <Sparkles className="w-3 h-3" />
          <span>Kai</span>
        </div>
      )}

      {/* Status dot with pulse */}
      <div className="absolute top-4 right-4">
        <div className={`relative w-3 h-3 rounded-full ${config.dotColor}`}>
          <div className={`absolute inset-0 rounded-full ${config.dotColor} ${config.pulseSpeed} opacity-50`} />
        </div>
      </div>

      {/* Header: Name + Age */}
      <div className="flex items-start justify-between mb-3 pr-6">
        <div>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            {fullName}
          </h3>
          <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-white/50' : 'text-slate-400'}`}>
            {ageDays === 0 ? 'New today' : `${ageDays} day${ageDays !== 1 ? 's' : ''} old`}
          </div>
        </div>
      </div>

      {/* Source Badge */}
      <div className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3
        ${isDarkMode 
          ? 'bg-white/10 text-white/70 border border-white/10' 
          : 'bg-slate-100 text-slate-600 border border-slate-200'
        }
      `}>
        <SourceIcon className="w-3 h-3" />
        <span>{source}</span>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className={`flex items-center gap-2.5 text-sm ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
          <Phone className={`w-4 h-4 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
          <span>{lead.phone || 'No phone'}</span>
        </div>
        <div className={`flex items-center gap-2.5 text-sm ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
          <Mail className={`w-4 h-4 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
          <span className="truncate">{lead.email || 'No email'}</span>
        </div>
      </div>

      {/* Last Activity */}
      <div className={`flex items-center gap-1.5 text-xs mb-4 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>
        <Clock className="w-3.5 h-3.5" />
        <span>{formatLastActivity(lead.updated_at)}</span>
      </div>

      {/* Action Buttons - Visible on hover */}
      <div className={`
        flex gap-2 transition-all duration-200
        ${isHovered && !isDimmed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}>
        <Button 
          size="sm" 
          variant="outline"
          onClick={(e) => { e.stopPropagation(); onCall?.(); }}
          className={`flex-1 h-9 text-xs font-medium ${isDarkMode ? 'bg-white/5 border-white/20 text-white hover:bg-white/10' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
        >
          <Phone className="w-3.5 h-3.5 mr-1.5" />
          Call
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={(e) => { e.stopPropagation(); onText?.(); }}
          className={`flex-1 h-9 text-xs font-medium ${isDarkMode ? 'bg-white/5 border-white/20 text-white hover:bg-white/10' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
        >
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
          Text
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={(e) => { e.stopPropagation(); onSchedule?.(); }}
          className={`flex-1 h-9 text-xs font-medium ${isDarkMode ? 'bg-white/5 border-white/20 text-white hover:bg-white/10' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
        >
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          Book
        </Button>
      </div>

      {/* Move to Stage - Visible on hover */}
      <div className={`
        mt-3 transition-all duration-200
        ${isHovered && !isDimmed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveToStage?.(); }}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-[#E53935] hover:text-[#C62828] transition-colors"
        >
          Move to Stage
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
