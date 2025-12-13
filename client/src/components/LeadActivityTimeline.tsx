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
} from "lucide-react";

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
      {/* Add Note Section */}
      <div className="rounded-xl bg-card border border-border/50 p-4">
        {isAddingNote ? (
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
        ) : (
          <button
            onClick={() => setIsAddingNote(true)}
            className="w-full flex items-center gap-3 text-left text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Plus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm">Add a note...</span>
          </button>
        )}
      </div>

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
              const config = activityConfig[activity.type as keyof typeof activityConfig] || activityConfig.note;
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

                        {/* Call specific */}
                        {activity.type === "call" && (
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {activity.callOutcome && (
                              <span className="capitalize">{activity.callOutcome.replace("_", " ")}</span>
                            )}
                            {activity.callDuration && activity.callDuration > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(activity.callDuration)}
                              </span>
                            )}
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
