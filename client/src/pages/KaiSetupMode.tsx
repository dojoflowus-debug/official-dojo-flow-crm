import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

// Step components
const Step1SchoolIdentity = ({ data, onSave }: any) => {
  const [formData, setFormData] = useState(data || {});

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">School Identity</h2>
      <p className="text-gray-600">Tell us about your school</p>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">School Name</label>
          <Input 
            placeholder="e.g., Kai Martial Arts Academy" 
            value={formData.name || ""}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <Input 
            type="tel" 
            placeholder="(555) 123-4567" 
            value={formData.phone || ""}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input 
            type="email" 
            placeholder="contact@school.com" 
            value={formData.email || ""}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <Textarea 
            placeholder="123 Main St, City, State ZIP" 
            value={formData.address || ""}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Timezone</label>
          <Select value={formData.timezone || "America/New_York"} onValueChange={(val) => setFormData({...formData, timezone: val})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/New_York">Eastern</SelectItem>
              <SelectItem value="America/Chicago">Central</SelectItem>
              <SelectItem value="America/Denver">Mountain</SelectItem>
              <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
              <SelectItem value="America/Anchorage">Alaska</SelectItem>
              <SelectItem value="Pacific/Honolulu">Hawaii</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={() => onSave(formData)} className="w-full">Save & Continue</Button>
    </div>
  );
};

const Step2Programs = ({ data, onSave }: any) => {
  const [formData, setFormData] = useState(data || {});

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Programs</h2>
      <p className="text-gray-600">Select the programs you offer</p>
      
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <Checkbox 
              checked={formData.programs?.includes("karate")}
              onCheckedChange={(checked) => {
                const programs = formData.programs || [];
                if (checked) {
                  setFormData({...formData, programs: [...programs, "karate"]});
                } else {
                  setFormData({...formData, programs: programs.filter((p: string) => p !== "karate")});
                }
              }}
            />
            <span>Karate / TKD</span>
          </label>
          <label className="flex items-center space-x-2">
            <Checkbox 
              checked={formData.programs?.includes("kickboxing")}
              onCheckedChange={(checked) => {
                const programs = formData.programs || [];
                if (checked) {
                  setFormData({...formData, programs: [...programs, "kickboxing"]});
                } else {
                  setFormData({...formData, programs: programs.filter((p: string) => p !== "kickboxing")});
                }
              }}
            />
            <span>Kickboxing</span>
          </label>
          <label className="flex items-center space-x-2">
            <Checkbox 
              checked={formData.programs?.includes("after_school")}
              onCheckedChange={(checked) => {
                const programs = formData.programs || [];
                if (checked) {
                  setFormData({...formData, programs: [...programs, "after_school"]});
                } else {
                  setFormData({...formData, programs: programs.filter((p: string) => p !== "after_school")});
                }
              }}
            />
            <span>After-School Programs</span>
          </label>
          <label className="flex items-center space-x-2">
            <Checkbox 
              checked={formData.programs?.includes("camps")}
              onCheckedChange={(checked) => {
                const programs = formData.programs || [];
                if (checked) {
                  setFormData({...formData, programs: [...programs, "camps"]});
                } else {
                  setFormData({...formData, programs: programs.filter((p: string) => p !== "camps")});
                }
              }}
            />
            <span>Camps & Workshops</span>
          </label>
          <label className="flex items-center space-x-2">
            <Checkbox 
              checked={formData.programs?.includes("private_lessons")}
              onCheckedChange={(checked) => {
                const programs = formData.programs || [];
                if (checked) {
                  setFormData({...formData, programs: [...programs, "private_lessons"]});
                } else {
                  setFormData({...formData, programs: programs.filter((p: string) => p !== "private_lessons")});
                }
              }}
            />
            <span>Private Lessons</span>
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Age Groups Served</label>
          <Input 
            placeholder="e.g., 4-6, 7-12, 13-17, Adults" 
            value={formData.ageGroups || ""}
            onChange={(e) => setFormData({...formData, ageGroups: e.target.value})}
          />
        </div>
      </div>

      <Button onClick={() => onSave(formData)} className="w-full">Save & Continue</Button>
    </div>
  );
};

const Step3ClassSchedule = ({ data, onSave }: any) => {
  const [formData, setFormData] = useState(data || {});

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Class Schedule</h2>
      <p className="text-gray-600">Add your classes or import from a file</p>
      
      <div className="space-y-3">
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Upload CSV, Excel, or photos of handwritten schedules</p>
          <Input type="file" accept=".csv,.xlsx,.jpg,.png" className="mb-2" />
        </div>
        
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Or add classes manually</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input 
                placeholder="Class name" 
                value={formData.className || ""}
                onChange={(e) => setFormData({...formData, className: e.target.value})}
              />
              <Select value={formData.day || "Monday"} onValueChange={(val) => setFormData({...formData, day: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                  <SelectItem value="Saturday">Saturday</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input 
                type="time" 
                value={formData.startTime || ""}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              />
              <Input 
                type="time" 
                value={formData.endTime || ""}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              />
            </div>
            <Input 
              type="number" 
              placeholder="Max class size" 
              value={formData.maxSize || ""}
              onChange={(e) => setFormData({...formData, maxSize: e.target.value})}
            />
          </div>
        </div>
      </div>

      <Button onClick={() => onSave(formData)} className="w-full">Save & Continue</Button>
    </div>
  );
};

const Step4PricingBilling = ({ data, onSave }: any) => {
  const [formData, setFormData] = useState(data || {});

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Pricing & Billing</h2>
      <p className="text-gray-600">Configure your pricing structure</p>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Membership Plan Name</label>
          <Input 
            placeholder="e.g., Monthly Unlimited" 
            value={formData.planName || ""}
            onChange={(e) => setFormData({...formData, planName: e.target.value})}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Monthly Price ($)</label>
            <Input 
              type="number" 
              placeholder="99.99" 
              value={formData.monthlyPrice || ""}
              onChange={(e) => setFormData({...formData, monthlyPrice: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Enrollment Fee ($)</label>
            <Input 
              type="number" 
              placeholder="0" 
              value={formData.enrollmentFee || ""}
              onChange={(e) => setFormData({...formData, enrollmentFee: e.target.value})}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Trial Offer (days)</label>
          <Input 
            type="number" 
            placeholder="14" 
            value={formData.trialDays || ""}
            onChange={(e) => setFormData({...formData, trialDays: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Billing Rules</label>
          <Textarea 
            placeholder="e.g., Auto-renew monthly, cancel anytime" 
            value={formData.billingRules || ""}
            onChange={(e) => setFormData({...formData, billingRules: e.target.value})}
          />
        </div>
      </div>

      <Button onClick={() => onSave(formData)} className="w-full">Save & Continue</Button>
    </div>
  );
};

const Step5Staff = ({ data, onSave }: any) => {
  const [formData, setFormData] = useState(data || {});

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Staff Members</h2>
      <p className="text-gray-600">Add your instructors and staff</p>
      
      <div className="space-y-3">
        <div className="border rounded-lg p-4 space-y-2">
          <Input 
            placeholder="Staff name" 
            value={formData.staffName || ""}
            onChange={(e) => setFormData({...formData, staffName: e.target.value})}
          />
          <Input 
            type="email" 
            placeholder="Email" 
            value={formData.staffEmail || ""}
            onChange={(e) => setFormData({...formData, staffEmail: e.target.value})}
          />
          <Select value={formData.staffRole || "instructor"} onValueChange={(val) => setFormData({...formData, staffRole: val})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instructor">Instructor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" className="w-full">+ Add Another Staff Member</Button>
      </div>

      <Button onClick={() => onSave(formData)} className="w-full">Save & Continue</Button>
    </div>
  );
};

const Step6StudentsImport = ({ data, onSave }: any) => {
  const [formData, setFormData] = useState(data || {});

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Import Students (Optional)</h2>
      <p className="text-gray-600">Import existing student data from CSV</p>
      
      <div className="space-y-3">
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Upload a CSV file with student data</p>
          <Input type="file" accept=".csv" className="mb-2" />
          <p className="text-xs text-gray-500">Required columns: First Name, Last Name, Email, Phone</p>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => onSave(formData)}
        >
          Skip for Now
        </Button>
      </div>

      <Button onClick={() => onSave(formData)} className="w-full">Save & Continue</Button>
    </div>
  );
};

const Step7Communication = ({ data, onSave }: any) => {
  const [formData, setFormData] = useState(data || {});

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Communication</h2>
      <p className="text-gray-600">Set up messaging defaults</p>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Sender Phone Number</label>
          <Input 
            type="tel" 
            placeholder="(555) 123-4567" 
            value={formData.senderPhone || ""}
            onChange={(e) => setFormData({...formData, senderPhone: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Sender Email</label>
          <Input 
            type="email" 
            placeholder="noreply@school.com" 
            value={formData.senderEmail || ""}
            onChange={(e) => setFormData({...formData, senderEmail: e.target.value})}
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Messaging Preferences</label>
          <label className="flex items-center space-x-2">
            <Checkbox 
              checked={formData.enableSMS}
              onCheckedChange={(checked) => setFormData({...formData, enableSMS: checked})}
            />
            <span>Enable SMS notifications</span>
          </label>
          <label className="flex items-center space-x-2">
            <Checkbox 
              checked={formData.enableEmail}
              onCheckedChange={(checked) => setFormData({...formData, enableEmail: checked})}
            />
            <span>Enable Email notifications</span>
          </label>
        </div>
      </div>

      <Button onClick={() => onSave(formData)} className="w-full">Save & Continue</Button>
    </div>
  );
};

const Step8ReviewLaunch = ({ data, onSave, onComplete }: any) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Review & Launch</h2>
      <p className="text-gray-600">Confirm your setup details</p>
      
      <div className="space-y-3 bg-gray-50 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
          <div>
            <p className="font-medium">School Identity</p>
            <p className="text-sm text-gray-600">{data?.name}</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2">
          <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
          <div>
            <p className="font-medium">Programs</p>
            <p className="text-sm text-gray-600">{data?.programs?.join(", ") || "Configured"}</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2">
          <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
          <div>
            <p className="font-medium">Classes & Schedule</p>
            <p className="text-sm text-gray-600">Configured</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2">
          <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
          <div>
            <p className="font-medium">Pricing & Billing</p>
            <p className="text-sm text-gray-600">Ready</p>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600">You can edit these settings anytime from your dashboard.</p>

      <Button onClick={onComplete} className="w-full bg-green-600 hover:bg-green-700">
        <Check className="w-4 h-4 mr-2" />
        Activate School
      </Button>
    </div>
  );
};

const steps = [
  { number: 1, title: "School Identity", component: Step1SchoolIdentity },
  { number: 2, title: "Programs", component: Step2Programs },
  { number: 3, title: "Class Schedule", component: Step3ClassSchedule },
  { number: 4, title: "Pricing & Billing", component: Step4PricingBilling },
  { number: 5, title: "Staff", component: Step5Staff },
  { number: 6, title: "Students Import", component: Step6StudentsImport },
  { number: 7, title: "Communication", component: Step7Communication },
  { number: 8, title: "Review & Launch", component: Step8ReviewLaunch },
];

export function KaiSetupMode() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<Record<number, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState<number | null>(null);

  // Get organization ID from context
  const { data: authData } = trpc.auth.me.useQuery();

  const saveStepMutation = trpc.setupMode.saveStep.useMutation();
  const completeSetupMutation = trpc.setupMode.completeSetup.useMutation();
  const skipSetupMutation = trpc.setupMode.skipSetup.useMutation();

  // Initialize organization ID from auth
  useEffect(() => {
    if (authData?.organizationId) {
      setOrganizationId(authData.organizationId);
    }
  }, [authData]);

  const handleSaveStep = async (data: any) => {
    if (!organizationId) return;

    setIsLoading(true);
    try {
      await saveStepMutation.mutateAsync({
        organizationId,
        step: currentStep,
        data,
      });

      // Store locally for resume functionality
      setStepData({...stepData, [currentStep]: data});

      // Move to next step
      if (currentStep < 8) {
        setCurrentStep(currentStep + 1);
      }

      toast.success("Step saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save step");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!organizationId) return;

    setIsLoading(true);
    try {
      await completeSetupMutation.mutateAsync({ organizationId });
      toast.success("Setup completed! Welcome to Kai Command");
      navigate?.("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!organizationId) return;

    setIsLoading(true);
    try {
      await skipSetupMutation.mutateAsync({ organizationId });
      toast.info("Setup skipped. You can resume anytime.");
      navigate?.("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to skip setup");
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Kai Setup Mode</h1>
          <p className="text-gray-600">Get your school ready in 8 simple steps</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex-1 h-2 mx-1 rounded-full transition-colors ${
                  step.number <= currentStep ? "bg-indigo-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-600">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
          </p>
        </div>

        {/* Step Content */}
        <Card className="p-8 mb-8">
          {currentStep === 8 ? (
            <Step8ReviewLaunch 
              data={stepData[currentStep]} 
              onSave={handleSaveStep}
              onComplete={handleComplete}
            />
          ) : (
            <CurrentStepComponent data={stepData[currentStep]} onSave={handleSaveStep} />
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-3 justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || isLoading}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isLoading}
          >
            Skip for Now
          </Button>
        </div>
      </div>
    </div>
  );
}
