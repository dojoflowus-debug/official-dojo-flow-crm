import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  Mail,
  MessageSquare,
  FileText,
  ArrowRight,
  Calendar,
  CheckSquare,
  Plus,
  Clock,
  User,
  Loader2,
  Sparkles,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  X,
} from "lucide-react";

// ── Call outcome config ───────────────────────────────────────────────────────
const CALL_OUTCOMES = [
  { value: "answered", label: "Spoke", Icon: PhoneCall, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
  { value: "no_answer", label: "No Answer", Icon: PhoneMissed, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
  { value: "voicemail", label: "Voicemail", Icon: PhoneOff, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-700" },
  { value: "busy", label: "Busy", Icon: PhoneOff, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
] as const;

function getCallOutcome(outcome: string) {
  return CALL_OUTCOMES.find(o => o.value === outcome) ?? null;
}

function getApptBadge(title: string) {
  if (title?.includes("showed up")) return { label: "Showed", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
  if (title?.includes("no-show")) return { label: "No Show", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  if (title?.includes("booked")) return { label: "Booked", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" };
  if (title?.includes("confirmed")) return { label: "Confirmed", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
  if (title?.includes("cancelled")) return { label: "Cancelled", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };
  return null;
}

// ── Log Call Modal ────────────────────────────────────────────────────────────
function LogCallModal({ leadId, leadName, phone, onClose, onSuccess }: {
  leadId: number; leadName: string; phone?: string; onClose: () => void; onSuccess: () => void;
}) {
  const [outcome, setOutcome] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [durationMins, setDurationMins] = useState("");

  const addActivity = trpc.leads.addActivity.useMutation({
    onSuccess: () => { onSuccess(); onClose(); },
  });

  const handleLog = () => {
    if (!outcome) return;
    const outcomeObj = getCallOutcome(outcome);
    addActivity.mutate({
      leadId,
      type: "call",
      title: outcome === "answered" ? `Call with ${leadName}` : `Call attempt — ${outcomeObj?.label}`,
      content: notes || (phone ? `Called ${phone}` : undefined),
      callOutcome: outcome as any,
      callDuration: durationMins ? parseInt(durationMins) * 60 : undefined,
      createdByName: "You",
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Log Call</h3>
            <p className="text-xs text-muted-foreground">{leadName}{phone ? ` · ${phone}` : ""}</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Call Outcome</p>
          <div className="grid grid-cols-2 gap-2">
            {CALL_OUTCOMES.map(({ value, label, Icon, color, bg }) => {
              const sel = outcome === value;
              return (
                <button key={value} onClick={() => setOutcome(value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    sel ? `${bg} ${color} border-current ring-1 ring-current` : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}>
                  <Icon className={`h-4 w-4 ${sel ? color : ""}`} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {outcome === "answered" && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Duration (minutes)</p>
            <input type="number" min="0" placeholder="e.g. 5" value={durationMins}
              onChange={e => setDurationMins(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Notes (optional)</p>
          <Textarea placeholder="What was discussed..." value={notes} onChange={e => setNotes(e.target.value)}
            className="min-h-[70px] resize-none bg-background/50 text-sm" />
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
          <Button size="sm" onClick={handleLog} disabled={!outcome || addActivity.isPending} className="flex-1 bg-primary hover:bg-primary/90">
            {addActivity.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Phone className="h-4 w-4 mr-1" />}
            Log Call
          </Button>
        </div>
      </div>
    </div>
  );
}

interface LeadActivityTimelineProps {
  leadId: number;
  leadName: string;
}

// Activity type configuration
const activityConfig = {
  call: {
    icon: Phone,
    color: "bg-blue-500",
    lightColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-600 dark:text-blue-400",
    label: "Call",
  },
  email: {
    icon: Mail,
    color: "bg-purple-500",
    lightColor: "bg-purple-100 dark:bg-purple-900/30",
    textColor: "text-purple-600 dark:text-purple-400",
    label: "Email",
  },
  sms: {
    icon: MessageSquare,
    color: "bg-green-500",
    lightColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-600 dark:text-green-400",
    label: "SMS",
  },
  note: {
    icon: FileText,
    color: "bg-amber-500",
    lightColor: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-600 dark:text-amber-400",
    label: "Note",
  },
  status_change: {
    icon: ArrowRight,
    color: "bg-slate-500",
    lightColor: "bg-slate-100 dark:bg-slate-800/50",
    textColor: "text-slate-600 dark:text-slate-400",
    label: "Status Change",
  },
  meeting: {
    icon: Calendar,
    color: "bg-indigo-500",
    lightColor: "bg-indigo-100 dark:bg-indigo-900/30",
    textColor: "text-indigo-600 dark:text-indigo-400",
    label: "Meeting",
  },
  task: {
    icon: CheckSquare,
    color: "bg-teal-500",
    lightColor: "bg-teal-100 dark:bg-teal-900/30",
    textColor: "text-teal-600 dark:text-teal-400",
    label: "Task",
  },
};

// Format relative time
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const activityDate = new Date(date);
  const diffMs = now.getTime() - activityDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return activityDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: activityDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// Format call duration
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function LeadActivityTimeline({ leadId, leadName }: LeadActivityTimelineProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [showLogCall, setShowLogCall] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());

  const { data: activities, isLoading, refetch } = trpc.leads.getActivities.useQuery({ leadId });
  const addActivityMutation = trpc.leads.addActivity.useMutation({
    onSuccess: () => {
      setNoteContent("");
      setIsAddingNote(false);
      refetch();
    },
  });

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    addActivityMutation.mutate({
      leadId,
      type: "note",
      title: "Note added",
      content: noteContent,
      createdByName: "You",
    });
  };

  const toggleExpand = (id: number) => {
    setExpandedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showLogCall && (
        <LogCallModal
          leadId={leadId}
          leadName={leadName}
          onClose={() => setShowLogCall(false)}
          onSuccess={() => refetch()}
        />
      )}
      {/* Quick Action Bar */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setShowLogCall(true)}
          className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20">
          <Phone className="h-3.5 w-3.5" />
          Log Call
        </Button>
        <Button size="sm" variant="outline" onClick={() => setIsAddingNote(true)}
          className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20">
          <FileText className="h-3.5 w-3.5" />
          Add Note
        </Button>
      </div>

      {/* Add Note Section */}
      {isAddingNote && <div className="rounded-xl bg-card border border-border/50 p-4">
        {true ? (
          <div className="space-y-3">
            <Textarea
              placeholder={`Add a note about ${leadName}...`}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[80px] resize-none bg-background/50"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingNote(false);
                  setNoteContent("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!noteContent.trim() || addActivityMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {addActivityMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Add Note
              </Button>
            </div>
          </div>
        ) : null}
      </div>}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        {activities && activities.length > 0 && (
          <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-border via-border/50 to-transparent" />
        )}

        {/* Activities */}
        <div className="space-y-1">
          {activities && activities.length > 0 ? (
            activities.map((activity, index) => {
              const config = activityConfig[activity.type as keyof typeof activityConfig] ?? activityConfig.note;
              const callOutcomeDisplay = activity.type === "call" && activity.callOutcome ? getCallOutcome(activity.callOutcome) : null;
              const apptBadge = activity.type === "meeting" ? getApptBadge(activity.title ?? "") : null;
              const Icon = config.icon;
              const isExpanded = expandedActivities.has(activity.id);
              const hasLongContent = activity.content && activity.content.length > 120;

              return (
                <div
                  key={activity.id}
                  className="relative flex gap-3 py-3 px-2 rounded-lg hover:bg-muted/30 transition-colors duration-150 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Icon */}
                  <div
                    className={`relative z-10 h-10 w-10 rounded-full ${config.lightColor} flex items-center justify-center flex-shrink-0 shadow-sm`}
                  >
                    <Icon className={`h-4 w-4 ${config.textColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Type label and title */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium ${config.textColor}`}>
                            {config.label}
                          </span>
                          {activity.title && (
                            <span className="text-sm font-medium text-foreground truncate">
                              {activity.title}
                            </span>
                          )}
                        </div>

                        {/* Status change specific */}
                        {activity.type === "status_change" && activity.previousStatus && activity.newStatus && (
                          <div className="flex items-center gap-2 mt-1 text-sm">
                            <span className="text-muted-foreground">{activity.previousStatus}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium text-foreground">{activity.newStatus}</span>
                          </div>
                        )}

                        {/* Appointment badge */}
                        {apptBadge && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-1 ${apptBadge.cls}`}>
                            {apptBadge.label}
                          </span>
                        )}
                        {/* Call outcome pill */}
                        {callOutcomeDisplay && (
                          <div className="mt-1.5">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${callOutcomeDisplay.bg} ${callOutcomeDisplay.color}`}>
                              <callOutcomeDisplay.Icon className="h-3 w-3" />
                              {callOutcomeDisplay.label}
                              {activity.callDuration && activity.callDuration > 0 && (
                                <span className="ml-1 opacity-70">· {formatDuration(activity.callDuration)}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Content */}
                        {activity.content && (
                          <div className="mt-1.5">
                            <p
                              className={`text-sm text-muted-foreground leading-relaxed ${
                                !isExpanded && hasLongContent ? "line-clamp-2" : ""
                              }`}
                            >
                              {activity.content}
                            </p>
                            {hasLongContent && (
                              <button
                                onClick={() => toggleExpand(activity.id)}
                                className="text-xs text-primary hover:underline mt-1"
                              >
                                {isExpanded ? "Show less" : "Show more"}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(activity.createdAt)}
                          </span>
                          {activity.createdByName && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {activity.createdByName}
                            </span>
                          )}
                          {activity.isAutomated === 1 && (
                            <span className="flex items-center gap-1 text-primary">
                              <Sparkles className="h-3 w-3" />
                              Automated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">No activity yet</h3>
              <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                Start tracking interactions by adding a note or making a call.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeadActivityTimeline;
