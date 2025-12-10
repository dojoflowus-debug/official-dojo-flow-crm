import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Clock, 
  MessageSquare, 
  Mail, 
  ArrowRight, 
  Save,
  ArrowLeft,
  Play
} from "lucide-react";
import { toast } from "sonner";

interface AutomationStep {
  id?: number;
  stepOrder: number;
  stepType: "wait" | "send_sms" | "send_email" | "end";
  name?: string;
  waitMinutes?: number;
  subject?: string;
  message?: string;
}

export default function AutomationBuilder() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<string>("new_lead");
  const [steps, setSteps] = useState<AutomationStep[]>([
    { stepOrder: 1, stepType: "wait", waitMinutes: 60 }
  ]);

  // Load existing sequence if editing
  const { data: sequence, isLoading } = trpc.automation.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: isEditMode }
  );

  // Mutations
  const createMutation = trpc.automation.create.useMutation({
    onSuccess: async (data) => {
      toast.success("Automation sequence created!");
      // Create steps
      for (const step of steps) {
        await addStepMutation.mutateAsync({
          sequenceId: data.id,
          ...step,
        });
      }
      navigate("/automation");
    },
    onError: (error) => {
      toast.error(`Failed to create sequence: ${error.message}`);
    },
  });

  const addStepMutation = trpc.automation.addStep.useMutation();

  const updateMutation = trpc.automation.update.useMutation({
    onSuccess: async () => {
      toast.success("Automation sequence updated!");
      // Update steps - delete existing and recreate
      const existingSteps = sequence?.steps || [];
      
      // Delete removed steps
      for (const existingStep of existingSteps) {
        const stillExists = steps.find(s => s.id === existingStep.id);
        if (!stillExists && existingStep.id) {
          await deleteStepMutation.mutateAsync({ id: existingStep.id });
        }
      }
      
      // Update or create steps
      for (const step of steps) {
        if (step.id) {
          // Update existing step
          await updateStepMutation.mutateAsync({
            id: step.id,
            stepOrder: step.stepOrder,
            name: step.name,
            waitMinutes: step.waitMinutes,
            subject: step.subject,
            message: step.message,
          });
        } else {
          // Create new step
          await addStepMutation.mutateAsync({
            sequenceId: parseInt(id || "0"),
            ...step,
          });
        }
      }
      navigate("/automation");
    },
    onError: (error) => {
      toast.error(`Failed to update sequence: ${error.message}`);
    },
  });

  const updateStepMutation = trpc.automation.updateStep.useMutation();
  const deleteStepMutation = trpc.automation.deleteStep.useMutation();

  // Load sequence data when editing
  useEffect(() => {
    if (isEditMode && sequence && steps.length === 1 && !steps[0].id) {
      setName(sequence.name);
      setDescription(sequence.description || "");
      setTrigger(sequence.trigger);
      if (sequence.steps && sequence.steps.length > 0) {
        setSteps(sequence.steps as AutomationStep[]);
      }
    }
  }, [isEditMode, sequence]);

  const handleAddStep = () => {
    const newStep: AutomationStep = {
      stepOrder: steps.length + 1,
      stepType: "wait",
      waitMinutes: 60,
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Reorder steps
    newSteps.forEach((step, i) => {
      step.stepOrder = i + 1;
    });
    setSteps(newSteps);
  };

  const handleStepChange = (index: number, field: keyof AutomationStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a sequence name");
      return;
    }

    if (steps.length === 0) {
      toast.error("Please add at least one step");
      return;
    }

    if (isEditMode) {
      // Update existing sequence
      updateMutation.mutate({
        id: parseInt(id || "0"),
        name,
        description,
      });
    } else {
      // Create new sequence
      createMutation.mutate({
        name,
        description,
        trigger: trigger as any,
        isActive: false, // Start as inactive
      });
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case "wait":
        return <Clock className="w-5 h-5" />;
      case "send_sms":
        return <MessageSquare className="w-5 h-5" />;
      case "send_email":
        return <Mail className="w-5 h-5" />;
      default:
        return <Play className="w-5 h-5" />;
    }
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case "wait":
        return "bg-blue-500";
      case "send_sms":
        return "bg-green-500";
      case "send_email":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isEditMode && isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/automation")}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold">
                {isEditMode ? "Edit" : "Create"} Automation
              </h1>
              <p className="text-gray-400 mt-1">
                Build automated workflows to follow up with leads and students
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Sequence"}
          </Button>
        </div>

        {/* Basic Info */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle>Sequence Details</CardTitle>
            <CardDescription>Name your sequence and choose what triggers it</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Sequence Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., New Lead Welcome Sequence"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this automation does..."
                className="bg-zinc-800 border-zinc-700 text-white"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="trigger">Trigger Event</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_lead">New Lead</SelectItem>
                  <SelectItem value="trial_scheduled">Trial Scheduled</SelectItem>
                  <SelectItem value="trial_completed">Trial Completed</SelectItem>
                  <SelectItem value="trial_no_show">Trial No-Show</SelectItem>
                  <SelectItem value="enrollment">New Enrollment</SelectItem>
                  <SelectItem value="missed_class">Missed Class</SelectItem>
                  <SelectItem value="inactive_student">Inactive Student</SelectItem>
                  <SelectItem value="renewal_due">Renewal Due</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Workflow Steps</CardTitle>
                <CardDescription>Add steps to define what happens in this sequence</CardDescription>
              </div>
              <Button
                onClick={handleAddStep}
                variant="outline"
                className="border-zinc-700 hover:bg-zinc-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index}>
                  <div className="flex items-start gap-4">
                    {/* Step Number & Icon */}
                    <div className="flex flex-col items-center">
                      <div className={`${getStepColor(step.stepType)} rounded-full p-3 text-white`}>
                        {getStepIcon(step.stepType)}
                      </div>
                      {index < steps.length - 1 && (
                        <div className="w-0.5 h-16 bg-zinc-700 my-2" />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      <Card className="bg-zinc-800 border-zinc-700">
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs">
                                Step {step.stepOrder}
                              </Badge>
                              <Select
                                value={step.stepType}
                                onValueChange={(value) =>
                                  handleStepChange(index, "stepType", value)
                                }
                              >
                                <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-600">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="wait">Wait</SelectItem>
                                  <SelectItem value="send_sms">Send SMS</SelectItem>
                                  <SelectItem value="send_email">Send Email</SelectItem>
                                  <SelectItem value="end">End Sequence</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStep(index)}
                              className="text-red-500 hover:text-red-400 hover:bg-red-950"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Step-specific fields */}
                          {step.stepType === "wait" && (
                            <div>
                              <Label>Wait Duration (minutes)</Label>
                              <Input
                                type="number"
                                value={step.waitMinutes || 60}
                                onChange={(e) =>
                                  handleStepChange(
                                    index,
                                    "waitMinutes",
                                    parseInt(e.target.value)
                                  )
                                }
                                className="bg-zinc-900 border-zinc-600 text-white"
                                min="1"
                              />
                              <p className="text-xs text-gray-400 mt-1">
                                {step.waitMinutes && step.waitMinutes >= 1440
                                  ? `${Math.floor(step.waitMinutes / 1440)} days`
                                  : step.waitMinutes && step.waitMinutes >= 60
                                  ? `${Math.floor(step.waitMinutes / 60)} hours`
                                  : `${step.waitMinutes || 60} minutes`}
                              </p>
                            </div>
                          )}

                          {step.stepType === "send_sms" && (
                            <div>
                              <Label>SMS Message</Label>
                              <Textarea
                                value={step.message || ""}
                                onChange={(e) =>
                                  handleStepChange(index, "message", e.target.value)
                                }
                                placeholder="Hi {{firstName}}, thanks for your interest..."
                                className="bg-zinc-900 border-zinc-600 text-white"
                                rows={4}
                              />
                              <p className="text-xs text-gray-400 mt-1">
                                Use variables: {"{"}{"{"} firstName {"}"}{"}"}, {"{"}{"{"}lastName{"}"}{"}"}, {"{"}{"{"}email{"}"}{"}"}, {"{"}{"{"}phone{"}"}{"}"}
                              </p>
                            </div>
                          )}

                          {step.stepType === "send_email" && (
                            <div className="space-y-3">
                              <div>
                                <Label>Email Subject</Label>
                                <Input
                                  value={step.subject || ""}
                                  onChange={(e) =>
                                    handleStepChange(index, "subject", e.target.value)
                                  }
                                  placeholder="Welcome to our dojo!"
                                  className="bg-zinc-900 border-zinc-600 text-white"
                                />
                              </div>
                              <div>
                                <Label>Email Message</Label>
                                <Textarea
                                  value={step.message || ""}
                                  onChange={(e) =>
                                    handleStepChange(index, "message", e.target.value)
                                  }
                                  placeholder="Hi {{firstName}}, we're excited to have you..."
                                  className="bg-zinc-900 border-zinc-600 text-white"
                                  rows={6}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                  Use variables: {"{"}{"{"} firstName {"}"}{"}"}, {"{"}{"{"}lastName{"}"}{"}"}, {"{"}{"{"}email{"}"}{"}"}, {"{"}{"{"}phone{"}"}{"}"}
                                </p>
                              </div>
                            </div>
                          )}

                          {step.stepType === "end" && (
                            <p className="text-sm text-gray-400">
                              This step marks the end of the automation sequence.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              ))}

              {steps.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No steps yet. Click "Add Step" to start building your automation.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
