import { useState } from 'react';
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
  ai_summary?: string;
  parent_of?: string;
}

interface LeadCardProps {
  lead: Lead;
  onCall?: () => void;
  onText?: () => void;
  onSchedule?: () => void;
  onMoveToStage?: () => void;
  onClick?: () => void;
  hasKaiSuggestion?: boolean;
}

// Source icon mapping
const sourceIcons: Record<string, React.ElementType> = {
  'Google': Globe,
  'Website': Globe,
  'Walk-In': Users,
  'Referral': Users,
  'Facebook': Megaphone,
  'Instagram': Megaphone,
};

// Source color mapping
const sourceColors: Record<string, string> = {
  'Google': 'bg-blue-50 text-blue-600 border-blue-100',
  'Website': 'bg-purple-50 text-purple-600 border-purple-100',
  'Walk-In': 'bg-green-50 text-green-600 border-green-100',
  'Referral': 'bg-amber-50 text-amber-600 border-amber-100',
  'Facebook': 'bg-indigo-50 text-indigo-600 border-indigo-100',
  'Instagram': 'bg-pink-50 text-pink-600 border-pink-100',
};

// Status dot colors based on lead score
const getStatusColor = (score: number) => {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-400';
};

export default function LeadCard({ 
  lead, 
  onCall, 
  onText, 
  onSchedule, 
  onMoveToStage,
  onClick,
  hasKaiSuggestion = false
}: LeadCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const fullName = `${lead.first_name} ${lead.last_name}`;
  const source = lead.source || 'Unknown';
  const SourceIcon = sourceIcons[source] || Globe;
  const sourceStyle = sourceColors[source] || 'bg-slate-50 text-slate-600 border-slate-100';
  const leadScore = lead.lead_score || 50;
  const statusColor = getStatusColor(leadScore);
  
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
        relative bg-white rounded-2xl p-5 cursor-pointer
        transition-all duration-200 ease-out
        border border-slate-100
        ${isHovered 
          ? 'shadow-xl shadow-slate-200/50 -translate-y-1 border-slate-200' 
          : 'shadow-md shadow-slate-100/50'
        }
      `}
    >
      {/* Kai AI Suggestion Badge */}
      {hasKaiSuggestion && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-[#E53935] to-[#FF6B6B] text-white text-xs font-medium rounded-full shadow-lg">
          <Sparkles className="w-3 h-3" />
          <span>Follow up today</span>
        </div>
      )}

      {/* Header: Name + Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-800">{fullName}</h3>
          <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
        </div>
      </div>

      {/* Source Badge */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sourceStyle} mb-3`}>
        <SourceIcon className="w-3 h-3" />
        <span>{source}</span>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2.5 text-sm text-slate-500">
          <Phone className="w-4 h-4 text-slate-400" />
          <span>{lead.phone || 'No phone'}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-slate-500">
          <Mail className="w-4 h-4 text-slate-400" />
          <span className="truncate">{lead.email || 'No email'}</span>
        </div>
      </div>

      {/* Last Activity */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
        <Clock className="w-3.5 h-3.5" />
        <span>{formatLastActivity(lead.updated_at)}</span>
      </div>

      {/* Action Buttons - Visible on hover */}
      <div className={`
        flex gap-2 transition-all duration-200
        ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}>
        <Button 
          size="sm" 
          variant="outline"
          onClick={(e) => { e.stopPropagation(); onCall?.(); }}
          className="flex-1 h-9 text-xs font-medium bg-white hover:bg-slate-50 border-slate-200"
        >
          <Phone className="w-3.5 h-3.5 mr-1.5" />
          Call
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={(e) => { e.stopPropagation(); onText?.(); }}
          className="flex-1 h-9 text-xs font-medium bg-white hover:bg-slate-50 border-slate-200"
        >
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
          Text
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={(e) => { e.stopPropagation(); onSchedule?.(); }}
          className="flex-1 h-9 text-xs font-medium bg-white hover:bg-slate-50 border-slate-200"
        >
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          Schedule
        </Button>
      </div>

      {/* Move to Stage - Visible on hover */}
      <div className={`
        mt-3 transition-all duration-200
        ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
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
