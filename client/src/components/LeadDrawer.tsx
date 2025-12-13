import { useState } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Sparkles,
  User,
  MapPin,
  Star,
  ChevronRight,
  Edit3,
  Trash2,
  Globe,
  Users,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  assigned_to?: string;
  tags?: string | string[];
}

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onMoveToStage?: (stage: string) => void;
  onDelete?: () => void;
  stages: { id: string; label: string }[];
  currentStage: string;
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

export default function LeadDrawer({ 
  lead, 
  isOpen, 
  onClose, 
  onMoveToStage,
  onDelete,
  stages,
  currentStage
}: LeadDrawerProps) {
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (!lead) return null;

  const fullName = `${lead.first_name} ${lead.last_name}`;
  const source = lead.source || 'Unknown';
  const SourceIcon = sourceIcons[source] || Globe;
  const leadScore = lead.lead_score || 50;
  const tags = typeof lead.tags === 'string' ? lead.tags.split(',').filter(t => t.trim()) : (lead.tags || []);

  // Format last activity
  const formatLastActivity = (dateStr?: string) => {
    if (!dateStr) return 'No activity';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`
          fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">Lead Details</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100vh-80px)] p-6">
          {/* Lead Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E53935] to-[#FF6B6B] flex items-center justify-center text-white text-xl font-bold">
              {lead.first_name[0]}{lead.last_name[0]}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-800">{fullName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <SourceIcon className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">{source}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 rounded-full">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-amber-700">{leadScore}</span>
            </div>
          </div>

          {/* Kai AI Suggestion */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 mb-6 border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#E53935]" />
              <span className="text-sm font-semibold text-[#E53935]">Kai Suggestion</span>
            </div>
            <p className="text-sm text-slate-600">
              {lead.ai_summary || 'This lead showed interest in kids karate classes. Consider scheduling an intro class.'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Button variant="outline" className="h-12 flex-col gap-1 bg-white hover:bg-slate-50 border-slate-200">
              <Phone className="w-5 h-5 text-slate-600" />
              <span className="text-xs text-slate-600">Call</span>
            </Button>
            <Button variant="outline" className="h-12 flex-col gap-1 bg-white hover:bg-slate-50 border-slate-200">
              <MessageSquare className="w-5 h-5 text-slate-600" />
              <span className="text-xs text-slate-600">Text</span>
            </Button>
            <Button variant="outline" className="h-12 flex-col gap-1 bg-white hover:bg-slate-50 border-slate-200">
              <Calendar className="w-5 h-5 text-slate-600" />
              <span className="text-xs text-slate-600">Schedule</span>
            </Button>
          </div>

          {/* Contact Info */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{lead.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{lead.email || 'No email'}</span>
              </div>
              {lead.parent_of && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Parent of: {lead.parent_of}</span>
                </div>
              )}
              {lead.assigned_to && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Assigned to: {lead.assigned_to}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Last Activity */}
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Clock className="w-4 h-4" />
            <span>Last updated: {formatLastActivity(lead.updated_at)}</span>
          </div>

          {/* Move to Stage */}
          <div className="relative mb-6">
            <Button
              onClick={() => setShowStageMenu(!showStageMenu)}
              className="w-full h-12 bg-[#E53935] hover:bg-[#C62828] text-white font-medium"
            >
              Move to Stage
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>

            {showStageMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-10">
                {stages.map((stage) => {
                  const isCurrent = stage.id === currentStage;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => {
                        if (!isCurrent) {
                          onMoveToStage?.(stage.id);
                          setShowStageMenu(false);
                        }
                      }}
                      disabled={isCurrent}
                      className={`
                        w-full px-4 py-3 text-left text-sm transition-colors
                        ${isCurrent 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'hover:bg-slate-50 text-slate-700'
                        }
                      `}
                    >
                      {stage.label}
                      {isCurrent && ' (Current)'}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Delete Button */}
          <Button
            onClick={onDelete}
            variant="outline"
            className="w-full h-12 text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Lead
          </Button>
        </div>
      </div>
    </>
  );
}
