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

// Get age status based on days (0-2: green, 3-5: yellow, 6+: red)
function getAgeStatus(days: number): 'green' | 'yellow' | 'red' {
  if (days <= 2) return 'green';
  if (days <= 5) return 'yellow';
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
}: SignatureLeadCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const fullName = `${lead.first_name} ${lead.last_name}`;
  const source = lead.source || 'Unknown';
  const SourceIcon = sourceIcons[source] || Globe;
  
  // Calculate age and status
  const ageDays = useMemo(() => getAgeDays(lead.created_at || lead.updated_at), [lead.created_at, lead.updated_at]);
  const ageStatus = useMemo(() => getAgeStatus(ageDays), [ageDays]);
  
  // Card hierarchy: newer leads lighter, older leads denser
  const cardWeight = {
    green: {
      bg: isDarkMode ? 'bg-slate-800/70' : 'bg-white',
      border: isDarkMode ? 'border-white/5' : 'border-slate-100',
      shadow: 'shadow-sm',
    },
    yellow: {
      bg: isDarkMode ? 'bg-slate-800/85' : 'bg-slate-50/80',
      border: isDarkMode ? 'border-amber-500/20' : 'border-amber-200/50',
      shadow: 'shadow-md',
    },
    red: {
      bg: isDarkMode ? 'bg-slate-800' : 'bg-slate-100/60',
      border: isDarkMode ? 'border-red-500/30' : 'border-red-200/60',
      shadow: 'shadow-lg',
    },
  };

  const weight = cardWeight[ageStatus];
  
  // Connector line colors (subtle, semi-transparent)
  const connectorColors = {
    green: 'bg-green-400/30',
    yellow: 'bg-amber-400/40',
    red: 'bg-red-400/50',
  };
  
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

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative cursor-pointer rounded-[14px] p-4
        transition-all duration-[180ms] ease-out
        border ${weight.border} ${weight.bg} ${weight.shadow}
        ${isHovered && !isDimmed
          ? 'shadow-lg -translate-y-0.5' 
          : ''
        }
        ${isDimmed ? 'opacity-30' : ''}
      `}
    >
      {/* Subtle connector line (left edge) - curved SVG style */}
      <div className={`
        absolute left-0 top-3 bottom-3 w-0.5 rounded-full
        ${connectorColors[ageStatus]}
        ${isResolveMode && ageStatus !== 'green' ? 'opacity-80' : 'opacity-50'}
      `} />

      {/* Kai AI Suggestion Badge */}
      {hasKaiSuggestion && !isDimmed && (
        <div className="absolute -top-1.5 -right-1.5 flex items-center gap-1 px-2 py-0.5 bg-[#E53935] text-white text-[10px] font-medium rounded-full shadow-sm z-10">
          <Sparkles className="w-2.5 h-2.5" />
          <span>Kai</span>
        </div>
      )}

      {/* Header: Name + Age */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            {fullName}
          </h3>
          <div className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>
            {ageDays === 0 ? 'New today' : `${ageDays} day${ageDays !== 1 ? 's' : ''} old`}
          </div>
        </div>
      </div>

      {/* Source Badge */}
      <div className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mb-2.5
        ${isDarkMode 
          ? 'bg-white/5 text-white/60' 
          : 'bg-slate-100 text-slate-500'
        }
      `}>
        <SourceIcon className="w-2.5 h-2.5" />
        <span>{source}</span>
      </div>

      {/* Contact Info */}
      <div className="space-y-1.5 mb-3">
        <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
          <Phone className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`} />
          <span>{lead.phone || 'No phone'}</span>
        </div>
        <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
          <Mail className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`} />
          <span className="truncate">{lead.email || 'No email'}</span>
        </div>
      </div>

      {/* Last Activity */}
      <div className={`flex items-center gap-1 text-[10px] mb-3 ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>
        <Clock className="w-3 h-3" />
        <span>{formatLastActivity(lead.updated_at)}</span>
      </div>

      {/* Action Buttons - Visible on hover with 180ms fade */}
      <div className={`
        flex gap-1.5 transition-all duration-[180ms] ease-out
        ${isHovered && !isDimmed ? 'opacity-100' : 'opacity-0'}
      `}>
        <Button 
          size="sm" 
          variant="outline"
          onClick={(e) => { e.stopPropagation(); onCall?.(); }}
          className={`flex-1 h-8 text-[11px] font-medium ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
        >
          <Phone className="w-3 h-3 mr-1" />
          Call
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={(e) => { e.stopPropagation(); onText?.(); }}
          className={`flex-1 h-8 text-[11px] font-medium ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          Text
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={(e) => { e.stopPropagation(); onSchedule?.(); }}
          className={`flex-1 h-8 text-[11px] font-medium ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
        >
          <Calendar className="w-3 h-3 mr-1" />
          Book
        </Button>
      </div>

      {/* Move to Stage - Visible on hover */}
      <div className={`
        mt-2 transition-all duration-[180ms] ease-out
        ${isHovered && !isDimmed ? 'opacity-100' : 'opacity-0'}
      `}>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveToStage?.(); }}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-[#E53935] hover:text-[#C62828] transition-colors duration-[180ms] ease-out"
        >
          Move to Stage
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
