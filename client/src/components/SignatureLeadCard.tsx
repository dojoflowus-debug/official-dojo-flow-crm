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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

// Get age status based on days (0-5: green, 6-10: yellow, 10+: red)
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
}: SignatureLeadCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const fullName = `${lead.first_name} ${lead.last_name}`;
  const source = lead.source || 'Unknown';
  const SourceIcon = sourceIcons[source] || Globe;
  
  // Calculate age and status
  const ageDays = useMemo(() => getAgeDays(lead.created_at || lead.updated_at), [lead.created_at, lead.updated_at]);
  const ageStatus = useMemo(() => getAgeStatus(ageDays), [ageDays]);
  
  // Status strip colors (left edge 3-4px)
  const statusStripColors = {
    green: 'bg-green-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500',
  };
  
  // Connector line colors (10-15% opacity as specified)
  const connectorColors = {
    green: isDarkMode ? 'bg-green-400/15' : 'bg-green-500/12',
    yellow: isDarkMode ? 'bg-amber-400/15' : 'bg-amber-500/12',
    red: isDarkMode ? 'bg-red-400/15' : 'bg-red-500/12',
  };
  
  // Resolve Mode effects
  const isGreen = ageStatus === 'green';
  const isDimmed = isResolveMode && isGreen;
  const isElevated = isResolveMode && !isGreen;
  
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
        relative cursor-pointer rounded-[16px] overflow-hidden
        transition-all duration-[180ms] ease-out
        ${isDarkMode 
          ? 'bg-slate-800/90 border border-white/5' 
          : 'bg-white border border-slate-200/60'
        }
        ${isHovered && !isDimmed ? 'shadow-lg -translate-y-0.5' : 'shadow-sm'}
        ${isDimmed ? 'opacity-40 scale-[0.98]' : ''}
        ${isElevated ? 'z-10 scale-[1.01] shadow-xl' : ''}
      `}
    >
      {/* Left Edge Status Strip (3-4px wide) */}
      <div className={`
        absolute left-0 top-0 bottom-0 w-1 
        ${statusStripColors[ageStatus]}
        ${isResolveMode && !isGreen ? 'opacity-100' : 'opacity-80'}
      `} />
      
      {/* Subtle connector line (horizontal, below card) */}
      <div className={`
        absolute -bottom-px left-4 right-4 h-px
        ${connectorColors[ageStatus]}
        ${isResolveMode && !isGreen ? 'opacity-100 h-0.5' : ''}
      `} />

      {/* Card Content with left padding for status strip */}
      <div className="pl-4 pr-4 py-4">
        {/* Kai AI Suggestion Badge with Tooltip */}
        {hasKaiSuggestion && !isDimmed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-full bg-[#E53935] text-white shadow-sm cursor-help z-10">
                  <Sparkles className="w-3 h-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                className={`
                  px-3 py-2 text-xs font-medium rounded-lg
                  ${isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-slate-700 border-slate-200'}
                `}
              >
                Kai recommends action
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Header: Name + Age */}
        <div className="flex items-start justify-between mb-2 pr-8">
          <div>
            <h3 className={`text-base font-semibold leading-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
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
            <Phone className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`} />
            <span className="truncate">{lead.phone || 'No phone'}</span>
          </div>
          <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
            <Mail className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`} />
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
            className={`flex-1 h-8 text-[11px] font-medium rounded-lg ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
          >
            <Phone className="w-3 h-3 mr-1" />
            Call
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onText?.(); }}
            className={`flex-1 h-8 text-[11px] font-medium rounded-lg ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Text
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onSchedule?.(); }}
            className={`flex-1 h-8 text-[11px] font-medium rounded-lg ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
          >
            <Calendar className="w-3 h-3 mr-1" />
            Book
          </Button>
        </div>

        {/* Move to Stage - Visible on hover with hint animation */}
        <div className={`
          mt-2 transition-all duration-[180ms] ease-out
          ${isHovered && !isDimmed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'}
        `}>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveToStage?.(); }}
            className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-[#E53935] hover:text-[#C62828] transition-all duration-[180ms] ease-out group"
          >
            Move to Stage
            <ChevronRight className="w-3.5 h-3.5 transition-transform duration-[180ms] ease-out group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
