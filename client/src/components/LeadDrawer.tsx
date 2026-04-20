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
  Star,
  ChevronRight,
  Trash2,
  Globe,
  Users,
  Megaphone,
  History,
  Info,
  Check,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import LeadActivityTimeline from './LeadActivityTimeline';
import KaiSalesCoach from './KaiSalesCoach';


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
  onOpenScheduler?: () => void;
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

type TabType = 'details' | 'activity' | 'appointments' | 'kai_coach';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  showed: { label: 'Showed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  no_show: { label: 'No Show', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
};

function formatTime(t?: string | null): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function LeadDrawer({ 
  lead, 
  isOpen, 
  onClose, 
  onMoveToStage,
  onDelete,
  stages,
  currentStage,
  onOpenScheduler
}: LeadDrawerProps) {
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('details');

  // Appointments query
  const { data: appointments = [], refetch: refetchAppointments } = trpc.leads.getAppointments.useQuery(
    { leadId: lead?.id ?? 0 },
    { enabled: !!lead?.id && isOpen }
  );
  const updateApptStatus = trpc.leads.updateAppointmentStatus.useMutation({
    onSuccess: () => refetchAppointments(),
  });

  // Add activity mutation for logging actions
  const addActivityMutation = trpc.leads.addActivity.useMutation();

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

  // Log call action
  const handleCall = () => {
    if (lead.phone) {
      addActivityMutation.mutate({
        leadId: lead.id,
        type: 'call',
        title: 'Outbound call initiated',
        content: `Called ${lead.phone}`,
        createdByName: 'You',
      });
      window.open(`tel:${lead.phone}`, '_self');
    }
  };

  // Log text action
  const handleText = () => {
    if (lead.phone) {
      addActivityMutation.mutate({
        leadId: lead.id,
        type: 'sms',
        title: 'SMS initiated',
        content: `Texted ${lead.phone}`,
        createdByName: 'You',
      });
      window.open(`sms:${lead.phone}`, '_self');
    }
  };

  // Log email action
  const handleEmail = () => {
    if (lead.email) {
      addActivityMutation.mutate({
        leadId: lead.id,
        type: 'email',
        title: 'Email initiated',
        content: `Emailed ${lead.email}`,
        createdByName: 'You',
      });
      window.open(`mailto:${lead.email}`, '_self');
    }
  };

  // Handle stage change with activity logging
  const handleMoveToStage = (stageId: string) => {
    const newStage = stages.find(s => s.id === stageId);
    const oldStage = stages.find(s => s.id === currentStage);
    
    if (newStage && oldStage) {
      addActivityMutation.mutate({
        leadId: lead.id,
        type: 'status_change',
        title: 'Stage changed',
        previousStatus: oldStage.label,
        newStatus: newStage.label,
        createdByName: 'You',
      });
    }
    
    onMoveToStage?.(stageId);
    setShowStageMenu(false);
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
          fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl z-50
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Lead Details</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-[#E53935] text-[#E53935]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Info className="w-4 h-4" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-[#E53935] text-[#E53935]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            Activity
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'appointments'
                ? 'border-[#E53935] text-[#E53935]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Appts
            {appointments.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E53935] text-white text-[10px] font-bold flex items-center justify-center">
                {appointments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('kai_coach')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'kai_coach'
                ? 'border-[#E53935] text-[#E53935]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Kai Coach
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100vh-140px)] p-6">
          {activeTab === 'details' ? (
            <>
              {/* Lead Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E53935] to-[#FF6B6B] flex items-center justify-center text-white text-xl font-bold">
                  {lead.first_name[0]}{lead.last_name[0]}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{fullName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <SourceIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">{source}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-full">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{leadScore}</span>
                </div>
              </div>

              {/* Kai AI Suggestion */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-4 mb-6 border border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#E53935]" />
                  <span className="text-sm font-semibold text-[#E53935]">Kai Suggestion</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {lead.ai_summary || 'This lead showed interest in kids karate classes. Consider scheduling an intro class.'}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <Button 
                  variant="outline" 
                  className="h-12 flex-col gap-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
                  onClick={handleCall}
                  disabled={!lead.phone}
                >
                  <Phone className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Call</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 flex-col gap-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
                  onClick={handleText}
                  disabled={!lead.phone}
                >
                  <MessageSquare className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Text</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 flex-col gap-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
                  onClick={handleEmail}
                  disabled={!lead.email}
                >
                  <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Email</span>
                </Button>
              </div>

              {/* Contact Info */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{lead.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{lead.email || 'No email'}</span>
                  </div>
                  {lead.parent_of && (
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Parent of: {lead.parent_of}</span>
                    </div>
                  )}
                  {lead.assigned_to && (
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Assigned to: {lead.assigned_to}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm rounded-full"
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
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-10">
                    {stages.map((stage) => {
                      const isCurrent = stage.id === currentStage;
                      return (
                        <button
                          key={stage.id}
                          onClick={() => {
                            if (!isCurrent) {
                              handleMoveToStage(stage.id);
                            }
                          }}
                          disabled={isCurrent}
                          className={`
                            w-full px-4 py-3 text-left text-sm transition-colors
                            ${isCurrent 
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
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
                className="w-full h-12 text-red-500 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Lead
              </Button>
            </>
          ) : activeTab === 'activity' ? (
            /* Activity Tab */
            <LeadActivityTimeline leadId={lead.id} leadName={fullName} />
          ) : activeTab === 'appointments' ? (
            /* Appointments Tab */
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Appointments</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{appointments.length} total</p>
                </div>
                <button
                  onClick={() => onOpenScheduler?.()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E53935] hover:bg-[#C62828] text-white text-xs font-bold transition-all shadow-md shadow-red-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Schedule
                </button>
              </div>
              {appointments.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-7 h-7 text-slate-400 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold">No appointments yet</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 mb-5">Schedule an intro class to get started</p>
                  <button
                    onClick={() => onOpenScheduler?.()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E53935] hover:bg-[#C62828] text-white text-sm font-bold transition-all shadow-lg shadow-red-500/20"
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule Intro Class
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appt: any) => {
                    const badge = STATUS_BADGE[appt.status] || STATUS_BADGE.scheduled;
                    // Safely parse the date — handle both string 'YYYY-MM-DD' and Date objects
                    let apptDate: Date;
                    if (appt.scheduled_date instanceof Date) {
                      apptDate = appt.scheduled_date;
                    } else if (typeof appt.scheduled_date === 'string') {
                      // Force local timezone by appending T00:00:00
                      const dateStr = appt.scheduled_date.includes('T') ? appt.scheduled_date : appt.scheduled_date + 'T00:00:00';
                      apptDate = new Date(dateStr);
                    } else {
                      apptDate = new Date();
                    }
                    const isValidDate = !isNaN(apptDate.getTime());
                    const dateDisplay = isValidDate
                      ? apptDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Date TBD';
                    // Only show booked_by_name if it's not the generic 'Staff' fallback
                    const showBookedBy = appt.booked_by_name && appt.booked_by_name !== 'Staff';
                    return (
                      <div key={appt.id} className="rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden bg-white dark:bg-slate-800/40">
                        {/* Color accent top bar based on status */}
                        <div className={`h-1 w-full ${
                          appt.status === 'showed' ? 'bg-gradient-to-r from-emerald-400 to-teal-400' :
                          appt.status === 'no_show' ? 'bg-gradient-to-r from-red-400 to-rose-400' :
                          appt.status === 'cancelled' ? 'bg-slate-300 dark:bg-slate-600' :
                          'bg-gradient-to-r from-blue-400 to-indigo-400'
                        }`} />
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${badge.color}`}>
                                  {badge.label}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                {appt.class_name || 'Class'}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                  <Calendar className="w-3 h-3" />
                                  {dateDisplay}
                                </span>
                                {appt.startTime && (
                                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(appt.startTime)}
                                  </span>
                                )}
                              </div>
                              {showBookedBy && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  Booked by <span className="font-semibold text-slate-600 dark:text-slate-300 ml-0.5">{appt.booked_by_name}</span>
                                </p>
                              )}
                            </div>
                            {/* Status actions */}
                            {(appt.status === 'scheduled' || appt.status === 'confirmed') ? (
                              <div className="flex gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => updateApptStatus.mutate({ appointmentId: appt.id, status: 'showed' })}
                                  title="Mark as Showed"
                                  className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-200 dark:border-emerald-800/40"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => updateApptStatus.mutate({ appointmentId: appt.id, status: 'no_show' })}
                                  title="Mark as No Show"
                                  className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-800/40"
                                >
                                  <AlertCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : null}
                          </div>
                          {appt.notes && (
                            <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-700/30 rounded-lg px-3 py-2">{appt.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ) : (
            /* Kai Coach Tab */
            <KaiSalesCoach
              leadFirstName={lead.first_name}
              leadLastName={lead.last_name}
              currentStage={currentStage}
            />
          )}
        </div>
      </div>
    </>
  );
}
