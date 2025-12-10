import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Clock, Mail, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type Step = {
  id: string;
  stepType: "wait" | "send_sms" | "send_email";
  name: string;
  waitMinutes?: number;
  subject?: string;
  message?: string;
};

export default function AutomationCreate() {
  const [, setLocation] = useLocation();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<string>("new_lead");
  const [steps, setSteps] = useState<Step[]>([]);
  
  const createSequenceMutation = trpc.automation.create.useMutation({
    onSuccess: async (data) => {
      // Create steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await addStepMutation.mutateAsync({
          sequenceId: data.id,
          stepOrder: i + 1,
          stepType: step.stepType,
          name: step.name,
          waitMinutes: step.waitMinutes,
          subject: step.subject,
          message: step.message,
        });
      }
      
      toast.success("Automation sequence created!");
      setLocation("/automation");
    },
    onError: (error) => {
      toast.error(`Failed to create sequence: ${error.message}`);
    },
  });

  const addStepMutation = trpc.automation.addStep.useMutation();

  const handleAddStep = (stepType: "wait" | "send_sms" | "send_email") => {
    const newStep: Step = {
      id: Math.random().toString(36).substr(2, 9),
      stepType,
      name: stepType === "wait" ? "Wait" : stepType === "send_sms" ? "Send SMS" : "Send Email",
      waitMinutes: stepType === "wait" ? 1440 : undefined, // Default 1 day
      message: stepType !== "wait" ? "" : undefined,
    };
    setSteps([...steps, newStep]);
  };

  const handleUpdateStep = (id: string, updates: Partial<Step>) => {
    setSteps(steps.map(step => step.id === id ? { ...step, ...updates } : step));
  };

  const handleRemoveStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const handleCreate = () => {
    if (!name || steps.length === 0) {
      toast.error("Please provide a name and at least one step");
      return;
    }

    createSequenceMutation.mutate({
      name,
      description,
      trigger: trigger as any,
      isActive: true,
    });
  };

  const getTriggerLabel = (value: string) => {
    const labels: Record<string, string> = {
      new_lead: "New Lead",
      trial_scheduled: "Trial Scheduled",
      trial_completed: "Trial Completed",
      trial_no_show: "Trial No-Show",
      enrollment: "Enrollment",
      missed_class: "Missed Class",
      inactive_student: "Inactive Student",
      renewal_due: "Renewal Due",
    };
    return labels[value] || value;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/automation")}
            className="text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Automation
          </Button>
          <h1 className="text-4xl font-bold mb-2">Create Automation Sequence</h1>
          <p className="text-gray-400">Build a multi-step workflow that runs automatically</p>
        </div>

        {/* Basic Info */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Sequence Details</CardTitle>
            <CardDescription className="text-gray-400">
              Name your sequence and choose what triggers it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-white">Sequence Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., New Lead Follow-up"
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this sequence does..."
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
              />
            </div>

            <div>
              <Label htmlFor="trigger" className="text-white">Trigger Event *</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_lead">New Lead</SelectItem>
                  <SelectItem value="trial_scheduled">Trial Scheduled</SelectItem>
                  <SelectItem value="trial_completed">Trial Completed</SelectItem>
                  <SelectItem value="trial_no_show">Trial No-Show</SelectItem>
                  <SelectItem value="enrollment">Enrollment</SelectItem>
                  <SelectItem value="missed_class">Missed Class</SelectItem>
                  <SelectItem value="inactive_student">Inactive Student</SelectItem>
                  <SelectItem value="renewal_due">Renewal Due</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-400 mt-2">
                This sequence will start when: <span className="text-white font-medium">{getTriggerLabel(trigger)}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Sequence Steps</CardTitle>
            <CardDescription className="text-gray-400">
              Add steps to define what happens and when
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No steps yet. Add your first step below.
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <Card key={step.id} className="bg-zinc-800 border-zinc-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <CardTitle className="text-white text-lg">
                            {step.stepType === "wait" && <Clock className="w-5 h-5 inline mr-2" />}
                            {step.stepType === "send_sms" && <MessageSquare className="w-5 h-5 inline mr-2" />}
                            {step.stepType === "send_email" && <Mail className="w-5 h-5 inline mr-2" />}
                            {step.name}
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStep(step.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {step.stepType === "wait" && (
                        <div>
                          <Label className="text-white">Wait Duration</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              type="number"
                              value={Math.floor((step.waitMinutes || 0) / 1440)}
                              onChange={(e) => handleUpdateStep(step.id, { waitMinutes: parseInt(e.target.value) * 1440 })}
                              className="bg-zinc-900 border-zinc-700 text-white"
                              min="0"
                            />
                            <span className="text-gray-400">days</span>
                          </div>
                        </div>
                      )}

                      {step.stepType === "send_email" && (
                        <div>
                          <Label className="text-white">Email Subject</Label>
                          <Input
                            value={step.subject || ""}
                            onChange={(e) => handleUpdateStep(step.id, { subject: e.target.value })}
                            placeholder="e.g., Welcome to our dojo!"
                            className="bg-zinc-900 border-zinc-700 text-white mt-2"
                          />
                        </div>
                      )}

                      {(step.stepType === "send_sms" || step.stepType === "send_email") && (
                        <div>
                          <Label className="text-white">Message</Label>
                          <Textarea
                            value={step.message || ""}
                            onChange={(e) => handleUpdateStep(step.id, { message: e.target.value })}
                            placeholder={step.stepType === "send_sms" 
                              ? "Hi {{firstName}}, thanks for your interest! Let me know if you have any questions."
                              : "Write your email message here..."
                            }
                            className="bg-zinc-900 border-zinc-700 text-white mt-2 min-h-[100px]"
                          />
                          <p className="text-sm text-gray-400 mt-2">
                            Use {"{"}{"{"} firstName {"}"}{"}"}  and {"{"}{"{"} lastName {"}"}{"}"}  to personalize
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => handleAddStep("wait")}
                className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                <Clock className="w-4 h-4 mr-2" />
                Add Wait
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAddStep("send_sms")}
                className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Add SMS
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAddStep("send_email")}
                className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                Add Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation("/automation")}
            className="text-gray-400"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createSequenceMutation.isPending || !name || steps.length === 0}
            className="bg-red-600 hover:bg-red-700"
          >
            {createSequenceMutation.isPending ? "Creating..." : "Create Sequence"}
          </Button>
        </div>
      </div>
    </div>
  );
}
