import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Users, CheckCircle2, Sparkles, Plus, RotateCcw, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AutomationTemplateLibrary from "@/components/AutomationTemplateLibrary";

export default function AutomationTabContent() {
  const navigate = useNavigate();
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showSendNowDialog, setShowSendNowDialog] = useState(false);
  const [selectedSequenceId, setSelectedSequenceId] = useState<number | null>(null);
  const [recipientType, setRecipientType] = useState<"lead" | "student">("lead");
  const [recipientId, setRecipientId] = useState<string>("");
  
  const { data: sequences, isLoading, refetch } = trpc.automation.getAll.useQuery();
  const { data: stats } = trpc.automation.getStats.useQuery();
  
  const updateMutation = trpc.automation.update.useMutation({
    onSuccess: () => {
      // Refetch sequences after update
      refetch();
    },
  });

  const resetMutation = trpc.automation.resetToDefault.useMutation({
    onSuccess: (data) => {
      alert(data.message);
      refetch();
    },
    onError: (error) => {
      alert(`Failed to reset: ${error.message}`);
    },
  });

  const sendNowMutation = trpc.automation.sendNow.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowSendNowDialog(false);
      setRecipientId("");
    },
    onError: (error) => {
      toast.error(`Failed to send: ${error.message}`);
    },
  });

  const { data: leads } = trpc.leads.getAll.useQuery();
  const { data: students } = trpc.students.getAll.useQuery();

  const handleSendNow = (sequenceId: number) => {
    setSelectedSequenceId(sequenceId);
    setShowSendNowDialog(true);
  };

  const handleConfirmSend = () => {
    if (!selectedSequenceId || !recipientId) {
      toast.error("Please select a recipient");
      return;
    }

    sendNowMutation.mutate({
      sequenceId: selectedSequenceId,
      enrolledType: recipientType,
      enrolledId: parseInt(recipientId),
    });
  };

  const handleToggleActive = (id: number, currentStatus: number) => {
    updateMutation.mutate({
      id,
      isActive: currentStatus === 1 ? false : true,
    });
  };

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      new_lead: "New Lead",
      trial_scheduled: "Trial Scheduled",
      trial_completed: "Trial Completed",
      trial_no_show: "Trial No-Show",
      enrollment: "Enrollment",
      missed_class: "Missed Class",
      inactive_student: "Inactive Student",
      renewal_due: "Renewal Due",
      custom: "Custom",
    };
    return labels[trigger] || trigger;
  };

  return (
    <>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sequences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalSequences}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.activeSequences}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalEnrollments}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.completedEnrollments}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Button
          onClick={() => setShowTemplateLibrary(true)}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Template Library
        </Button>
        <Button
          onClick={() => navigate("/automation/create")}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Custom Sequence
        </Button>
        <Button
          onClick={() => {
            if (confirm('⚠️ This will delete ALL current automation sequences and restore the default templates for your industry. This cannot be undone. Continue?')) {
              resetMutation.mutate();
            }
          }}
          variant="destructive"
          className="w-full sm:w-auto"
          disabled={resetMutation.isLoading}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {resetMutation.isLoading ? 'Resetting...' : 'Reset to Default'}
        </Button>
      </div>

      {/* Sequences List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">Loading automation sequences...</div>
          </CardContent>
        </Card>
      ) : sequences && sequences.length > 0 ? (
        <div className="space-y-4">
          {sequences.map((sequence) => (
            <Card key={sequence.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <CardTitle className="text-xl">{sequence.name}</CardTitle>
                      {sequence.isActive === 1 ? (
                        <Badge variant="default" className="bg-green-600">
                          <Play className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Pause className="w-3 h-3 mr-1" />
                          Paused
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {getTriggerLabel(sequence.trigger)}
                      </Badge>
                    </div>
                    {sequence.description && (
                      <CardDescription>{sequence.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendNow(sequence.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Send Now
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(sequence.id, sequence.isActive)}
                    >
                      {sequence.isActive === 1 ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/automation/${sequence.id}`)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{sequence.enrolledCount || 0} enrolled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{sequence.completedCount || 0} completed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                No automation sequences yet. Get started by creating a new sequence or choosing from our template library.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => setShowTemplateLibrary(true)}
                  variant="outline"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Browse Templates
                </Button>
                <Button onClick={() => navigate("/automation/create")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Library Modal */}
      {showTemplateLibrary && (
        <AutomationTemplateLibrary
          onClose={() => setShowTemplateLibrary(false)}
          onInstall={() => {
            setShowTemplateLibrary(false);
            // Sequences will auto-refresh via tRPC
          }}
        />
      )}

      {/* Send Now Dialog */}
      <Dialog open={showSendNowDialog} onOpenChange={setShowSendNowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Automation Immediately</DialogTitle>
            <DialogDescription>
              Send all messages in this automation sequence immediately to a specific lead or student (skips wait times).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recipient Type</Label>
              <Select value={recipientType} onValueChange={(value: "lead" | "student") => setRecipientType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Select {recipientType === "lead" ? "Lead" : "Student"}</Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Choose a ${recipientType}...`} />
                </SelectTrigger>
                <SelectContent>
                  {recipientType === "lead" ? (
                    leads?.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id.toString()}>
                        {lead.firstName} {lead.lastName} - {lead.phone}
                      </SelectItem>
                    ))
                  ) : (
                    students?.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.firstName} {student.lastName} - {student.phone}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendNowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSend}
              disabled={sendNowMutation.isLoading || !recipientId}
            >
              {sendNowMutation.isLoading ? "Sending..." : "Send Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
