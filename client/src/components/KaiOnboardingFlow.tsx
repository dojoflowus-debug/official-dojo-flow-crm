import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowRight, 
  Check, 
  Sparkles, 
  Users, 
  Calendar, 
  Bell, 
  Zap,
  Building2,
  Dumbbell,
  Heart,
  User,
  MoreHorizontal,
  ChevronRight,
  Eye,
  PartyPopper,
  X
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Types
type BusinessType = "martial_arts" | "fitness" | "yoga_dance" | "personal_trainer" | "other";
type LocationCount = "1" | "2-5" | "6+";
type StudentCount = "under_100" | "100-300" | "300+";
type Focus = "leads" | "retention" | "automation" | "scaling";
type Intent = "grow" | "automate" | "manage" | "fitness" | "exploring";

interface OnboardingState {
  intent: Intent | null;
  businessType: BusinessType | null;
  locationCount: LocationCount | null;
  studentCount: StudentCount | null;
  focus: Focus | null;
}

interface KaiOnboardingFlowProps {
  isActive: boolean;
  onClose: () => void;
  onComplete: (data: OnboardingState) => void;
}

// Kai's conversation steps
type ConversationStep = 
  | "initial" 
  | "intent_selected" 
  | "business_type" 
  | "question_1" 
  | "question_2" 
  | "question_3" 
  | "preview" 
  | "conversion" 
  | "signup" 
  | "success";

// Quick action chips
const INTENT_CHIPS = [
  { id: "grow" as Intent, label: "Grow my school", icon: Sparkles },
  { id: "automate" as Intent, label: "Automate operations", icon: Zap },
  { id: "manage" as Intent, label: "Manage students", icon: Users },
  { id: "fitness" as Intent, label: "Run a fitness studio", icon: Dumbbell },
  { id: "exploring" as Intent, label: "Just exploring", icon: Eye },
];

// Business type cards
const BUSINESS_TYPES = [
  { id: "martial_arts" as BusinessType, label: "Martial Arts School", icon: Building2, color: "from-red-500/20 to-red-600/10" },
  { id: "fitness" as BusinessType, label: "Fitness Facility", icon: Dumbbell, color: "from-blue-500/20 to-blue-600/10" },
  { id: "yoga_dance" as BusinessType, label: "Yoga / Dance Studio", icon: Heart, color: "from-purple-500/20 to-purple-600/10" },
  { id: "personal_trainer" as BusinessType, label: "Personal Trainer", icon: User, color: "from-green-500/20 to-green-600/10" },
  { id: "other" as BusinessType, label: "Other", icon: MoreHorizontal, color: "from-gray-500/20 to-gray-600/10" },
];

// Question options
const LOCATION_OPTIONS = [
  { id: "1" as LocationCount, label: "1" },
  { id: "2-5" as LocationCount, label: "2–5" },
  { id: "6+" as LocationCount, label: "6+" },
];

const STUDENT_OPTIONS = [
  { id: "under_100" as StudentCount, label: "Under 100" },
  { id: "100-300" as StudentCount, label: "100–300" },
  { id: "300+" as StudentCount, label: "300+" },
];

const FOCUS_OPTIONS = [
  { id: "leads" as Focus, label: "Getting more leads", icon: Sparkles },
  { id: "retention" as Focus, label: "Retaining members", icon: Users },
  { id: "automation" as Focus, label: "Automating admin work", icon: Zap },
  { id: "scaling" as Focus, label: "Scaling to multiple locations", icon: Building2 },
];

// Post-signup steps
const SETUP_STEPS = [
  { id: 1, title: "Add school info", icon: Building2 },
  { id: 2, title: "Set class schedule", icon: Calendar },
  { id: 3, title: "Invite staff", icon: Users },
  { id: 4, title: "Activate automations", icon: Zap },
];

export function KaiOnboardingFlow({ isActive, onClose, onComplete }: KaiOnboardingFlowProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ConversationStep>("initial");
  const [isTyping, setIsTyping] = useState(false);
  const [kaiMessage, setKaiMessage] = useState("Hi, I'm Kai. What would you like to improve today?");
  const [userInput, setUserInput] = useState("");
  
  // Onboarding state
  const [state, setState] = useState<OnboardingState>({
    intent: null,
    businessType: null,
    locationCount: null,
    studentCount: null,
    focus: null,
  });

  // Signup form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [startTrial, setStartTrial] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Save progress to localStorage
  useEffect(() => {
    if (isActive) {
      localStorage.setItem("kai_onboarding_progress", JSON.stringify({ step, state }));
    }
  }, [step, state, isActive]);

  // Restore progress from localStorage
  useEffect(() => {
    if (isActive) {
      const saved = localStorage.getItem("kai_onboarding_progress");
      if (saved) {
        try {
          const { step: savedStep, state: savedState } = JSON.parse(saved);
          if (savedStep && savedState) {
            setStep(savedStep);
            setState(savedState);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [isActive]);

  // Auto-focus input when active
  useEffect(() => {
    if (isActive && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isActive]);

  // Simulate Kai typing
  const showKaiMessage = useCallback((message: string, delay = 500) => {
    setIsTyping(true);
    setTimeout(() => {
      setKaiMessage(message);
      setIsTyping(false);
    }, delay);
  }, []);

  // Handle intent selection
  const handleIntentSelect = (intent: Intent) => {
    setState(prev => ({ ...prev, intent }));
    setStep("intent_selected");
    showKaiMessage("Got it. Let's personalize this a bit so I can show you the right setup.");
    setTimeout(() => setStep("business_type"), 1200);
  };

  // Handle business type selection
  const handleBusinessTypeSelect = (businessType: BusinessType) => {
    setState(prev => ({ ...prev, businessType }));
    showKaiMessage("How many locations do you manage?");
    setTimeout(() => setStep("question_1"), 800);
  };

  // Handle location count selection
  const handleLocationSelect = (locationCount: LocationCount) => {
    setState(prev => ({ ...prev, locationCount }));
    showKaiMessage("About how many students or members?");
    setTimeout(() => setStep("question_2"), 800);
  };

  // Handle student count selection
  const handleStudentSelect = (studentCount: StudentCount) => {
    setState(prev => ({ ...prev, studentCount }));
    showKaiMessage("What's your biggest focus right now?");
    setTimeout(() => setStep("question_3"), 800);
  };

  // Handle focus selection
  const handleFocusSelect = (focus: Focus) => {
    setState(prev => ({ ...prev, focus }));
    showKaiMessage("Here's what DojoFlow would look like for you.");
    setTimeout(() => setStep("preview"), 1000);
  };

  // Handle conversion decision
  const handleCreateAccount = () => {
    setStep("signup");
  };

  const handleKeepExploring = () => {
    onComplete(state);
    onClose();
  };

  // Signup mutation
  const quickSignupMutation = trpc.kaiOnboarding.quickSignup.useMutation();

  // Handle account creation
  const handleSubmitSignup = async () => {
    if (!email || !password) {
      toast.error("Please fill in email and password");
      return;
    }

    setIsCreating(true);
    try {
      const result = await quickSignupMutation.mutateAsync({
        email,
        password,
        schoolName: schoolName || undefined,
        businessType: state.businessType || "martial_arts",
        locationCount: state.locationCount || "1",
        studentCount: state.studentCount || "under_100",
        focus: state.focus || "leads",
      });

      if (result.success) {
        localStorage.removeItem("kai_onboarding_progress");
        setStep("success");
      }
    } catch (error: any) {
      toast.error(error.message || "Signup failed. Please try again.");
      setIsCreating(false);
    }
  };

  // Handle continue setup
  const handleContinueSetup = () => {
    onComplete(state);
    navigate("/owner/onboarding");
  };

  // Get preview content based on business type
  const getPreviewContent = () => {
    const type = state.businessType || "martial_arts";
    switch (type) {
      case "martial_arts":
        return {
          title: "Dojo Dashboard",
          items: ["Student roster with belt ranks", "Class schedule by program", "Attendance tracking", "Belt testing automation"],
        };
      case "fitness":
        return {
          title: "Fitness Command Center",
          items: ["Member check-in kiosk", "Class capacity management", "Equipment booking", "Membership renewals"],
        };
      case "yoga_dance":
        return {
          title: "Studio Manager",
          items: ["Class scheduling", "Instructor assignments", "Attendance tracking", "Package management"],
        };
      case "personal_trainer":
        return {
          title: "Training Hub",
          items: ["Client profiles", "Session scheduling", "Progress tracking", "Payment management"],
        };
      default:
        return {
          title: "Your Dashboard",
          items: ["Member management", "Scheduling", "Automations", "Analytics"],
        };
    }
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Dimmed background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Onboarding container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-3xl pointer-events-auto">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Kai avatar with glow */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex justify-center mb-8"
              >
                <div className="relative">
                  <div 
                    className="absolute inset-0 blur-3xl opacity-60"
                    style={{
                      background: 'radial-gradient(circle, rgba(239, 68, 68, 0.5) 0%, transparent 70%)',
                    }}
                  />
                  <img 
                    src="/kai-icon-hero.png" 
                    alt="Kai" 
                    className="w-24 h-24 md:w-32 md:h-32 relative z-10 drop-shadow-2xl"
                  />
                </div>
              </motion.div>

              {/* Kai message bubble */}
              <motion.div
                key={kaiMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center mb-8"
              >
                {isTyping ? (
                  <div className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                ) : (
                  <p className="text-2xl md:text-3xl text-white font-light tracking-wide">
                    {kaiMessage}
                  </p>
                )}
              </motion.div>

              {/* Step content */}
              <AnimatePresence mode="wait">
                {/* Initial step - Quick action chips */}
                {step === "initial" && (
                  <motion.div
                    key="initial"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-wrap justify-center gap-3"
                  >
                    {INTENT_CHIPS.map((chip, index) => (
                      <motion.button
                        key={chip.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleIntentSelect(chip.id)}
                        className="group flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white transition-all duration-300 hover:scale-105"
                      >
                        <chip.icon className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                        <span className="text-sm font-medium">{chip.label}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* Business type selection */}
                {step === "business_type" && (
                  <motion.div
                    key="business_type"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4"
                  >
                    <p className="text-center text-white/70 text-sm mb-6">What best describes you?</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {BUSINESS_TYPES.map((type, index) => (
                        <motion.button
                          key={type.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleBusinessTypeSelect(type.id)}
                          className={`group relative p-6 rounded-2xl bg-gradient-to-br ${type.color} border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]`}
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <type.icon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-white text-sm font-medium text-center">{type.label}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Question 1: Locations */}
                {step === "question_1" && (
                  <motion.div
                    key="question_1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="flex justify-center gap-4"
                  >
                    {LOCATION_OPTIONS.map((option, index) => (
                      <motion.button
                        key={option.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleLocationSelect(option.id)}
                        className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-red-400/50 text-white text-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* Question 2: Students */}
                {step === "question_2" && (
                  <motion.div
                    key="question_2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="flex justify-center gap-4"
                  >
                    {STUDENT_OPTIONS.map((option, index) => (
                      <motion.button
                        key={option.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleStudentSelect(option.id)}
                        className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-red-400/50 text-white text-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* Question 3: Focus */}
                {step === "question_3" && (
                  <motion.div
                    key="question_3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-2 gap-4 max-w-xl mx-auto"
                  >
                    {FOCUS_OPTIONS.map((option, index) => (
                      <motion.button
                        key={option.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleFocusSelect(option.id)}
                        className="group flex items-center gap-3 p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-red-400/50 text-white transition-all duration-300 hover:scale-105"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                          <option.icon className="w-5 h-5 text-red-400" />
                        </div>
                        <span className="text-sm font-medium">{option.label}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* Preview mode */}
                {step === "preview" && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    {/* Dashboard preview */}
                    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-purple-500/5" />
                      
                      <div className="relative space-y-4">
                        <h3 className="text-xl font-semibold text-white">{getPreviewContent().title}</h3>
                        
                        {/* Animated preview items */}
                        <div className="grid grid-cols-2 gap-3">
                          {getPreviewContent().items.map((item, index) => (
                            <motion.div
                              key={item}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + index * 0.15 }}
                              className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10"
                            >
                              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                              <span className="text-sm text-white/80">{item}</span>
                            </motion.div>
                          ))}
                        </div>

                        {/* Animated notifications */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20"
                        >
                          <Bell className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-300">Automation running: Welcome email sent to new member</span>
                        </motion.div>
                      </div>
                    </div>

                    {/* Conversion buttons */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                      className="text-center space-y-4"
                    >
                      <p className="text-white/70 text-lg">Want me to save this setup and turn it on for you?</p>
                      <div className="flex justify-center gap-4">
                        <Button
                          onClick={handleCreateAccount}
                          className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 text-lg rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.4)] transition-all"
                        >
                          <Check className="w-5 h-5 mr-2" />
                          Yes, create my account
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleKeepExploring}
                          className="border-white/20 hover:border-white/40 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-2xl"
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          Keep exploring
                        </Button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Signup modal */}
                {step === "signup" && (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-md mx-auto"
                  >
                    <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                      <h3 className="text-2xl font-semibold text-white mb-6 text-center">Create your account</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email" className="text-white/70">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="password" className="text-white/70">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="schoolName" className="text-white/70">School name (optional)</Label>
                          <Input
                            id="schoolName"
                            type="text"
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            placeholder="My Dojo"
                            className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Checkbox
                            id="startTrial"
                            checked={startTrial}
                            onCheckedChange={(checked) => setStartTrial(checked as boolean)}
                            className="border-white/20 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                          />
                          <Label htmlFor="startTrial" className="text-white/70 text-sm cursor-pointer">
                            Start free trial
                          </Label>
                        </div>

                        <p className="text-xs text-white/50 text-center">No credit card required</p>

                        <Button
                          onClick={handleSubmitSignup}
                          disabled={isCreating || !email || !password}
                          className="w-full bg-red-500 hover:bg-red-600 text-white py-6 text-lg rounded-xl mt-4"
                        >
                          {isCreating ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Creating...
                            </span>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Success state */}
                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="flex justify-center"
                    >
                      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                        <PartyPopper className="w-10 h-10 text-green-400" />
                      </div>
                    </motion.div>

                    <div>
                      <h3 className="text-3xl font-bold text-white mb-2">You're in!</h3>
                      <p className="text-xl text-white/70">Let's build your dojo.</p>
                    </div>

                    {/* Progress steps */}
                    <div className="max-w-md mx-auto space-y-3">
                      {SETUP_STEPS.map((setupStep, index) => (
                        <motion.div
                          key={setupStep.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.15 }}
                          className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 text-sm font-medium">
                            {setupStep.id}
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <setupStep.icon className="w-4 h-4 text-white/40" />
                            <span className="text-white/80">{setupStep.title}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30" />
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                    >
                      <Button
                        onClick={handleContinueSetup}
                        className="bg-red-500 hover:bg-red-600 text-white px-10 py-6 text-lg rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                      >
                        Continue Setup
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </motion.div>

                    <p className="text-sm text-white/40">Most schools finish in under 3 minutes</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input bar (visible in initial step) */}
              {step === "initial" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8"
                >
                  <div className="relative max-w-xl mx-auto">
                    <Input
                      ref={inputRef}
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && userInput.trim()) {
                          handleIntentSelect("exploring");
                        }
                      }}
                      placeholder="Or type your question..."
                      className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/40 py-6 px-6 rounded-2xl text-lg"
                    />
                    <Button
                      onClick={() => userInput.trim() && handleIntentSelect("exploring")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 hover:bg-red-600 rounded-xl"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default KaiOnboardingFlow;
