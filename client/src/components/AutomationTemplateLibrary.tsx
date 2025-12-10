import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Mail, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AutomationTemplate {
  name: string;
  description: string;
  trigger: string;
  steps: {
    stepOrder: number;
    stepType: string;
    name: string;
    waitMinutes?: number;
    subject?: string;
    message?: string;
  }[];
}

interface AutomationTemplateLibraryProps {
  open: boolean;
  onClose: () => void;
  onInstalled?: () => void;
}

export default function AutomationTemplateLibrary({ open, onClose, onInstalled }: AutomationTemplateLibraryProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: templates, isLoading } = trpc.automation.getTemplates.useQuery();
  const installMutation = trpc.automation.installTemplate.useMutation({
    onSuccess: (data) => {
      toast.success("Automation installed!", {
        description: `"${selectedTemplate?.name}" is now active and ready to use.`,
      });
      setShowPreview(false);
      setSelectedTemplate(null);
      onInstalled?.();
      onClose();
    },
    onError: (error) => {
      toast.error("Installation failed", {
        description: error.message,
      });
    },
  });

  const handleInstall = (template: AutomationTemplate) => {
    installMutation.mutate({ templateName: template.name });
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

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case "wait":
        return <Clock className="w-4 h-4" />;
      case "send_email":
        return <Mail className="w-4 h-4" />;
      case "send_sms":
        return <MessageSquare className="w-4 h-4" />;
      case "end":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatWaitTime = (minutes?: number) => {
    if (!minutes) return "";
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours`;
    return `${Math.floor(minutes / 1440)} days`;
  };

  return (
    <>
      {/* Main Template Library Dialog */}
      <Dialog open={open && !showPreview} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              Automation Template Library
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Pre-built automation sequences that work for any dojo. Install with one click!
            </DialogDescription>
          </DialogHeader>

          {isLoading && (
            <div className="text-center py-12 text-gray-400">Loading templates...</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {templates?.map((template) => (
              <Card key={template.name} className="bg-black border-zinc-800 hover:border-zinc-700 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-white">{template.name}</CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="border-blue-500 text-blue-400">
                      {getTriggerLabel(template.trigger)}
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-400">
                      {template.steps.length} steps
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {template.steps.slice(0, 3).map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                        {getStepIcon(step.stepType)}
                        <span className="truncate">{step.name}</span>
                      </div>
                    ))}
                    {template.steps.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{template.steps.length - 3} more steps
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-zinc-700 hover:bg-zinc-800"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowPreview(true);
                      }}
                    >
                      Preview
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={() => handleInstall(template)}
                      disabled={installMutation.isPending}
                    >
                      {installMutation.isPending ? "Installing..." : "Install"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={(isOpen) => !isOpen && setShowPreview(false)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedTemplate?.name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedTemplate?.description}
            </DialogDescription>
            <Badge variant="outline" className="border-blue-500 text-blue-400 w-fit mt-2">
              Trigger: {selectedTemplate && getTriggerLabel(selectedTemplate.trigger)}
            </Badge>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <h3 className="text-lg font-semibold">Automation Flow</h3>
            {selectedTemplate?.steps.map((step, idx) => (
              <Card key={idx} className="bg-black border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        {getStepIcon(step.stepType)}
                        {step.name}
                      </CardTitle>
                      {step.waitMinutes && (
                        <CardDescription className="text-gray-400 mt-1">
                          Wait {formatWaitTime(step.waitMinutes)}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="outline" className="border-gray-600 text-gray-400">
                      {step.stepType.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                {(step.subject || step.message) && (
                  <CardContent className="space-y-2">
                    {step.subject && (
                      <div>
                        <div className="text-xs font-semibold text-gray-400 mb-1">SUBJECT:</div>
                        <div className="text-sm text-white bg-zinc-900 p-2 rounded border border-zinc-800">
                          {step.subject}
                        </div>
                      </div>
                    )}
                    {step.message && (
                      <div>
                        <div className="text-xs font-semibold text-gray-400 mb-1">MESSAGE:</div>
                        <div className="text-sm text-white bg-zinc-900 p-3 rounded border border-zinc-800 whitespace-pre-wrap">
                          {step.message}
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      💡 Variables like {"{"}
                      {"{"}firstName{"}"}, {"{"}
                      {"{"}businessName{"}"} will be automatically replaced with your dojo's information
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1 border-zinc-700 hover:bg-zinc-800"
              onClick={() => setShowPreview(false)}
            >
              Back to Library
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={() => selectedTemplate && handleInstall(selectedTemplate)}
              disabled={installMutation.isPending}
            >
              {installMutation.isPending ? "Installing..." : "Install This Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
