import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sparkles, Check, Loader2, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/**
 * Owner Onboarding Wizard
 * Multi-step flow: Verification → School Profile → Plan Selection → Workspace Creation
 */
export default function OwnerOnboarding() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    // Get userId from localStorage (set during signup)
    const pendingUserId = localStorage.getItem("pendingUserId");
    if (!pendingUserId) {
      toast.error("No pending signup found");
      navigate("/owner");
      return;
    }
    setUserId(parseInt(pendingUserId));
  }, [navigate]);

  // Fetch onboarding progress
  const { data: progress, refetch } = trpc.onboarding.getProgress.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );

  useEffect(() => {
    if (progress) {
      setCurrentStep(progress.currentStep);
      if (progress.isCompleted) {
        navigate("/owner/dashboard");
      }
    }
  }, [progress, navigate]);

  const steps = [
    { number: 1, title: "Verify Email", completed: progress?.isVerified },
    { number: 2, title: "School Profile", completed: !!progress?.schoolData },
    { number: 3, title: "Choose Plan", completed: !!progress?.selectedPlanId },
    { number: 4, title: "Create Workspace", completed: progress?.isCompleted },
  ];

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl">DojoFlow</span>
        </div>

        {/* Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 -z-10">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step.completed
                      ? "bg-green-600 text-white"
                      : currentStep === step.number
                      ? "bg-blue-600 text-white"
                      : "bg-white border-2 border-slate-200 text-slate-400"
                  }`}
                >
                  {step.completed ? <Check className="w-5 h-5" /> : step.number}
                </div>
                <span className="text-xs mt-2 text-slate-600 text-center">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && <VerificationStep userId={userId} onNext={() => { setCurrentStep(2); refetch(); }} />}
        {currentStep === 2 && <SchoolProfileStep userId={userId} onNext={() => { setCurrentStep(3); refetch(); }} />}
        {currentStep === 3 && <PlanSelectionStep userId={userId} onNext={() => { setCurrentStep(4); refetch(); }} />}
        {currentStep === 4 && <WorkspaceCreationStep userId={userId} />}
      </div>
    </div>
  );
}

/**
 * Step 1: Email Verification
 */
interface StepProps {
  userId: number;
  onNext: () => void;
}

function VerificationStep({ userId, onNext }: StepProps) {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");

  // Get email from progress
  const { data: progress } = trpc.onboarding.getProgress.useQuery({ userId });

  useEffect(() => {
    if (progress?.accountData) {
      setEmail(progress.accountData.email);
    }
  }, [progress]);

  const verifyMutation = trpc.ownerAuth.verifyCode.useMutation({
    onSuccess: () => {
      toast.success("Email verified!");
      onNext();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleVerify = () => {
    if (!code || code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    verifyMutation.mutate({ identifier: email, code });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          We sent a 6-digit verification code to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verify-code">Verification Code</Label>
          <Input
            id="verify-code"
            type="text"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            disabled={verifyMutation.isPending}
            className="text-center text-2xl tracking-widest"
          />
        </div>

        <Button
          className="w-full"
          onClick={handleVerify}
          disabled={verifyMutation.isPending}
        >
          {verifyMutation.isPending ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Verify Email
              <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>

        <p className="text-sm text-slate-500 text-center">
          Didn't receive the code?{" "}
          <button className="text-blue-600 hover:underline">
            Resend code
          </button>
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Step 2: School Profile
 */
function SchoolProfileStep({ userId, onNext }: StepProps) {
  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [programs, setPrograms] = useState<string[]>([]);
  const [estimatedStudents, setEstimatedStudents] = useState<number>();
  const [launchDate, setLaunchDate] = useState("");

  const saveProfileMutation = trpc.onboarding.saveSchoolProfile.useMutation({
    onSuccess: () => {
      toast.success("School profile saved!");
      onNext();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    if (!schoolName) {
      toast.error("School name is required");
      return;
    }

    saveProfileMutation.mutate({
      userId,
      schoolName,
      address,
      city,
      state,
      zipCode,
      timezone,
      programs,
      estimatedStudents,
      launchDate,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create School Profile</CardTitle>
        <CardDescription>Tell us about your martial arts school</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="school-name">School Name *</Label>
          <Input
            id="school-name"
            placeholder="Dragon Martial Arts Academy"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            disabled={saveProfileMutation.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Primary Location Address</Label>
          <Input
            id="address"
            placeholder="123 Main Street"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={saveProfileMutation.isPending}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="New York"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={saveProfileMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              placeholder="NY"
              value={state}
              onChange={(e) => setState(e.target.value)}
              disabled={saveProfileMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">Zip Code</Label>
            <Input
              id="zip"
              placeholder="10001"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              disabled={saveProfileMutation.isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="timezone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/New_York">Eastern Time</SelectItem>
              <SelectItem value="America/Chicago">Central Time</SelectItem>
              <SelectItem value="America/Denver">Mountain Time</SelectItem>
              <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="programs">Programs Offered</Label>
          <Textarea
            id="programs"
            placeholder="Kids Karate, Adults Kickboxing, Yoga, etc."
            value={programs.join(", ")}
            onChange={(e) => setPrograms(e.target.value.split(",").map(p => p.trim()))}
            disabled={saveProfileMutation.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="students">Estimated Active Students</Label>
          <Select value={estimatedStudents?.toString()} onValueChange={(v) => setEstimatedStudents(parseInt(v))}>
            <SelectTrigger id="students">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">1-50</SelectItem>
              <SelectItem value="75">51-100</SelectItem>
              <SelectItem value="150">101-200</SelectItem>
              <SelectItem value="300">201+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="launch">Desired Launch Date</Label>
          <Select value={launchDate} onValueChange={setLaunchDate}>
            <SelectTrigger id="launch">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={new Date().toISOString()}>This week</SelectItem>
              <SelectItem value={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}>This month</SelectItem>
              <SelectItem value={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}>Later</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          onClick={handleSave}
          disabled={saveProfileMutation.isPending}
        >
          {saveProfileMutation.isPending ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Step 3: Plan Selection
 */
function PlanSelectionStep({ userId, onNext }: StepProps) {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  const { data: plans } = trpc.onboarding.getPlans.useQuery();

  const selectPlanMutation = trpc.onboarding.selectPlan.useMutation({
    onSuccess: () => {
      toast.success("Plan selected!");
      onNext();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSelectPlan = () => {
    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }
    selectPlanMutation.mutate({ userId, planId: selectedPlan });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-slate-600">Start with a 14-day free trial, cancel anytime</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans?.map((plan) => (
          <Card
            key={plan.id}
            className={`cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? "border-blue-600 ring-2 ring-blue-600"
                : "hover:border-blue-300"
            } ${plan.isPopular ? "border-blue-400" : ""}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.isPopular && (
              <div className="bg-blue-600 text-white text-xs font-semibold py-1 px-3 rounded-t-lg text-center">
                MOST POPULAR
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="text-3xl font-bold">
                ${plan.price}
                <span className="text-base font-normal text-slate-500">/{plan.interval}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={handleSelectPlan}
        disabled={selectPlanMutation.isPending || !selectedPlan}
      >
        {selectPlanMutation.isPending ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Start Free Trial
            <ArrowRight className="ml-2 w-4 h-4" />
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * Step 4: Workspace Creation
 */
function WorkspaceCreationStep({ userId }: { userId: number }) {
  const navigate = useNavigate();

  const createWorkspaceMutation = trpc.onboarding.createWorkspace.useMutation({
    onSuccess: () => {
      toast.success("Workspace created successfully!");
      localStorage.removeItem("pendingUserId");
      navigate("/owner/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    // Auto-create workspace when reaching this step
    createWorkspaceMutation.mutate({ userId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            {createWorkspaceMutation.isPending ? (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            ) : (
              <Check className="w-8 h-8 text-green-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold">
            {createWorkspaceMutation.isPending ? "Creating Your Workspace..." : "All Set!"}
          </h2>
          <p className="text-slate-600">
            {createWorkspaceMutation.isPending
              ? "Setting up your organization, default settings, and starter data"
              : "Your DojoFlow workspace is ready. Redirecting to dashboard..."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
