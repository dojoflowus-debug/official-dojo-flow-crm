import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  X,
  Clock,
  SkipForward,
  CheckCircle2,
  TrendingUp,
  Mail,
  CreditCard,
  ArrowLeft,
  MessageCircle
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

// Flow Gate State Machine
enum OnboardingState {
  HERO_IDLE = "HERO_IDLE",
  INTENT_CAPTURED = "INTENT_CAPTURED",
  QUALIFIED = "QUALIFIED",
  PREVIEW_MODE = "PREVIEW_MODE",
  SIGNUP = "SIGNUP",
  ONBOARDING = "ONBOARDING"
}

interface OnboardingData {
  intent: Intent | null;
  businessType: BusinessType | null;
  locationCount: LocationCount | null;
  studentCount: StudentCount | null;
  focus: Focus | null;
}

interface KaiOnboardingFlowProps {
  isActive: boolean;
  onClose: () => void;
  onComplete: (data: OnboardingData) => void;
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

// Get current step number for progress indicator
const getStepNumber = (step: ConversationStep): number => {
  switch (step) {
    case "initial": return 1;
    case "intent_selected": return 1;
    case "business_type": return 2;
    case "question_1": return 3;
    case "question_2": return 4;
    case "question_3": return 5;
    case "preview": return 6;
    case "conversion": return 6;
    case "signup": return 6;
    case "success": return 6;
    default: return 1;
  }
};

const TOTAL_STEPS = 6;

// Animated Dashboard Preview Component
function AnimatedDashboardPreview({ businessType }: { businessType: BusinessType | null }) {
  const type = businessType || "martial_arts";
  
  // Sample data for different business types
  const getPreviewData = () => {
    switch (type) {
      case "martial_arts":
        return {
          title: "Dojo Dashboard",
          students: [
            { name: "Alex Chen", rank: "Blue Belt", status: "active" },
            { name: "Sarah Kim", rank: "Green Belt", status: "active" },
            { name: "Mike Johnson", rank: "White Belt", status: "new" },
          ],
          classes: [
            { name: "Kids Karate", time: "4:00 PM", enrolled: 12 },
            { name: "Adult BJJ", time: "6:30 PM", enrolled: 8 },
            { name: "Sparring", time: "7:30 PM", enrolled: 6 },
          ],
          automations: [
            { name: "Welcome email sent", status: "completed" },
            { name: "Belt test reminder", status: "scheduled" },
            { name: "Payment reminder", status: "running" },
          ],
          notifications: [
            { text: "New enrollment: Mike Johnson", type: "success" },
            { text: "Class starting in 30 min", type: "info" },
          ],
        };
      case "fitness":
        return {
          title: "Fitness Command Center",
          students: [
            { name: "Emma Wilson", rank: "Premium", status: "active" },
            { name: "James Brown", rank: "Basic", status: "active" },
            { name: "Lisa Davis", rank: "Trial", status: "new" },
          ],
          classes: [
            { name: "HIIT Training", time: "6:00 AM", enrolled: 15 },
            { name: "Yoga Flow", time: "9:00 AM", enrolled: 10 },
            { name: "Spin Class", time: "5:30 PM", enrolled: 20 },
          ],
          automations: [
            { name: "Check-in confirmed", status: "completed" },
            { name: "Membership renewal", status: "scheduled" },
            { name: "Workout reminder", status: "running" },
          ],
          notifications: [
            { text: "New member: Lisa Davis", type: "success" },
            { text: "Equipment maintenance due", type: "info" },
          ],
        };
      case "yoga_dance":
        return {
          title: "Studio Manager",
          students: [
            { name: "Maya Patel", rank: "Advanced", status: "active" },
            { name: "Chris Lee", rank: "Intermediate", status: "active" },
            { name: "Anna Smith", rank: "Beginner", status: "new" },
          ],
          classes: [
            { name: "Morning Vinyasa", time: "7:00 AM", enrolled: 12 },
            { name: "Hip Hop Dance", time: "4:00 PM", enrolled: 8 },
            { name: "Meditation", time: "8:00 PM", enrolled: 6 },
          ],
          automations: [
            { name: "Class reminder sent", status: "completed" },
            { name: "Package expiry notice", status: "scheduled" },
            { name: "Feedback request", status: "running" },
          ],
          notifications: [
            { text: "New booking: Anna Smith", type: "success" },
            { text: "Instructor schedule updated", type: "info" },
          ],
        };
      default:
        return {
          title: "Your Dashboard",
          students: [
            { name: "John Doe", rank: "Member", status: "active" },
            { name: "Jane Smith", rank: "Member", status: "active" },
            { name: "Bob Wilson", rank: "Trial", status: "new" },
          ],
          classes: [
            { name: "Session 1", time: "10:00 AM", enrolled: 5 },
            { name: "Session 2", time: "2:00 PM", enrolled: 8 },
            { name: "Session 3", time: "6:00 PM", enrolled: 4 },
          ],
          automations: [
            { name: "Welcome message", status: "completed" },
            { name: "Follow-up scheduled", status: "scheduled" },
            { name: "Invoice generated", status: "running" },
          ],
          notifications: [
            { text: "New signup received", type: "success" },
            { text: "Task completed", type: "info" },
          ],
        };
    }
  };

  const data = getPreviewData();

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-white/10 p-6 backdrop-blur-xl">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-purple-500/5 to-blue-500/5 animate-pulse" />
      
      <div className="relative space-y-5">
        {/* Dashboard header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">{data.title}</h3>
          <div className="flex items-center gap-2 text-xs text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live Preview
          </div>
        </div>
        
        {/* Main dashboard grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Student List Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white/80">Students</span>
            </div>
            <div className="space-y-2">
              {data.students.map((student, i) => (
                <motion.div
                  key={student.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                      {student.name.charAt(0)}
                    </div>
                    <span className="text-xs text-white/70">{student.name}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    student.status === 'new' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {student.rank}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Class Schedule Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white/80">Today's Classes</span>
            </div>
            <div className="space-y-2">
              {data.classes.map((cls, i) => (
                <motion.div
                  key={cls.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                >
                  <div>
                    <div className="text-xs text-white/70">{cls.name}</div>
                    <div className="text-[10px] text-white/40">{cls.time}</div>
                  </div>
                  <span className="text-[10px] text-white/50">{cls.enrolled} enrolled</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Automations Running */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/5 rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-white/80">Automations</span>
          </div>
          <div className="flex gap-3">
            {data.automations.map((auto, i) => (
              <motion.div
                key={auto.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.15 }}
                className={`flex-1 p-3 rounded-lg border ${
                  auto.status === 'completed' 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : auto.status === 'running'
                    ? 'bg-blue-500/10 border-blue-500/20'
                    : 'bg-yellow-500/10 border-yellow-500/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {auto.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                  {auto.status === 'running' && <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
                  {auto.status === 'scheduled' && <Clock className="w-3 h-3 text-yellow-400" />}
                  <span className={`text-[10px] font-medium ${
                    auto.status === 'completed' ? 'text-green-300' : 
                    auto.status === 'running' ? 'text-blue-300' : 'text-yellow-300'
                  }`}>
                    {auto.status}
                  </span>
                </div>
                <div className="text-xs text-white/60">{auto.name}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Live Notifications */}
        <div className="space-y-2">
          {data.notifications.map((notif, i) => (
            <motion.div
              key={notif.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + i * 0.3 }}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                notif.type === 'success' 
                  ? 'bg-green-500/10 border-green-500/20' 
                  : 'bg-blue-500/10 border-blue-500/20'
              }`}
            >
              <Bell className={`w-4 h-4 ${notif.type === 'success' ? 'text-green-400' : 'text-blue-400'}`} />
              <span className={`text-sm ${notif.type === 'success' ? 'text-green-300' : 'text-blue-300'}`}>
                {notif.text}
              </span>
              <span className="text-xs text-white/30 ml-auto">Just now</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function KaiOnboardingFlow({ isActive, onClose, onComplete }: KaiOnboardingFlowProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ConversationStep>("initial");
  const [isTyping, setIsTyping] = useState(false);
  const [kaiMessage, setKaiMessage] = useState("Hi, I'm Kai. What would you like to improve today?");
  const [userInput, setUserInput] = useState("");
  
  // Flow Gate State
  const [flowState, setFlowState] = useState<OnboardingState>(OnboardingState.HERO_IDLE);
  
  // Onboarding state
  const [state, setState] = useState<OnboardingData>({
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
  
  // Keep exploring hint state
  const [showKaiHint, setShowKaiHint] = useState(false);

  // Save progress to localStorage
  useEffect(() => {
    if (isActive) {
      localStorage.setItem("kai_onboarding_progress", JSON.stringify({ step, state, flowState }));
    }
  }, [step, state, flowState, isActive]);

  // Restore progress from localStorage
  useEffect(() => {
    if (isActive) {
      const saved = localStorage.getItem("kai_onboarding_progress");
      if (saved) {
        try {
          const { step: savedStep, state: savedState, flowState: savedFlowState } = JSON.parse(saved);
          if (savedStep && savedState) {
            setStep(savedStep);
            setState(savedState);
            if (savedFlowState) {
              setFlowState(savedFlowState);
            }
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
  
  // Lock body scroll when preview is active
  useEffect(() => {
    if (isActive && step === "preview") {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isActive, step]);

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
    setFlowState(OnboardingState.INTENT_CAPTURED);
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
    setFlowState(OnboardingState.QUALIFIED);
    showKaiMessage("Here's what DojoFlow would look like for you.");
    setTimeout(() => {
      setStep("preview");
      setFlowState(OnboardingState.PREVIEW_MODE);
    }, 1000);
  };

  // Handle skip to preview
  const handleSkipToPreview = () => {
    // Set default values for skipped questions
    setState(prev => ({
      ...prev,
      businessType: prev.businessType || "martial_arts",
      locationCount: prev.locationCount || "1",
      studentCount: prev.studentCount || "under_100",
      focus: prev.focus || "leads",
    }));
    setFlowState(OnboardingState.QUALIFIED);
    showKaiMessage("Here's what DojoFlow would look like for you.");
    setTimeout(() => {
      setStep("preview");
      setFlowState(OnboardingState.PREVIEW_MODE);
    }, 800);
  };

  // Handle conversion decision - Create Account
  const handleCreateAccount = () => {
    setFlowState(OnboardingState.SIGNUP);
    setStep("signup");
    showKaiMessage("Let's save your setup and get you started.");
  };

  // Handle Keep Exploring - Return to homepage with Kai hint
  const handleKeepExploring = () => {
    // Save state for later
    localStorage.setItem("kai_onboarding_progress", JSON.stringify({ step: "preview", state, flowState: OnboardingState.PREVIEW_MODE }));
    
    // Close the overlay
    onComplete(state);
    onClose();
    
    // Show hint that Kai is available
    setShowKaiHint(true);
    setTimeout(() => setShowKaiHint(false), 5000);
    
    // Toast notification
    toast.info("When you're ready, click Kai to continue.", {
      duration: 4000,
      icon: <MessageCircle className="w-4 h-4 text-red-400" />,
    });
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
        setFlowState(OnboardingState.ONBOARDING);
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

  // Check if we can show skip button
  const canSkip = step === "business_type" || step === "question_1" || step === "question_2" || step === "question_3";

  if (!isActive) return null;

  const currentStepNum = getStepNumber(step);

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Dimmed background overlay - prevents scroll */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
            onClick={step !== "preview" ? onClose : undefined}
          />

          {/* Persistent Kai icon in corner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.3 }}
            className="fixed top-4 left-4 z-50 flex items-center gap-3"
          >
            <div className="relative">
              <div 
                className="absolute inset-0 blur-xl opacity-60"
                style={{
                  background: 'radial-gradient(circle, rgba(239, 68, 68, 0.5) 0%, transparent 70%)',
                }}
              />
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/nDbbiINIuNulnQxs.png" 
                alt="Kai" 
                className="w-12 h-12 relative z-10 drop-shadow-lg"
              />
            </div>
            <div className="text-white/80 text-sm font-medium">
              Kai is helping you set up
            </div>
          </motion.div>

          {/* Onboarding container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-hidden"
          >
            <div className="w-full max-w-3xl pointer-events-auto max-h-[90vh] overflow-y-auto">
              {/* Close button */}
              {step !== "preview" && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              )}

              {/* Progress indicator */}
              {step !== "success" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60">Step {currentStepNum} of {TOTAL_STEPS}</span>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Clock className="w-3 h-3" />
                      Most finish in under 3 minutes
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentStepNum / TOTAL_STEPS) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              )}

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
                    src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/nDbbiINIuNulnQxs.png" 
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
                        className="group flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                      >
                        <chip.icon className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                        <span className="text-white/80 group-hover:text-white">{chip.label}</span>
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
                    className="grid grid-cols-2 md:grid-cols-3 gap-4"
                  >
                    {BUSINESS_TYPES.map((type, index) => (
                      <motion.button
                        key={type.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleBusinessTypeSelect(type.id)}
                        className={`group p-6 rounded-2xl bg-gradient-to-br ${type.color} border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105`}
                      >
                        <type.icon className="w-8 h-8 text-white/60 group-hover:text-white mb-3" />
                        <span className="text-white/80 group-hover:text-white font-medium">{type.label}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* Question 1: Location count */}
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
                        className="group w-24 h-24 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/50 transition-all duration-300 flex items-center justify-center"
                      >
                        <span className="text-2xl font-bold text-white/80 group-hover:text-white">{option.label}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* Question 2: Student count */}
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
                        className="group px-6 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/50 transition-all duration-300"
                      >
                        <span className="text-lg font-medium text-white/80 group-hover:text-white">{option.label}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* Question 3: Focus area */}
                {step === "question_3" && (
                  <motion.div
                    key="question_3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-2 gap-4 max-w-lg mx-auto"
                  >
                    {FOCUS_OPTIONS.map((option, index) => (
                      <motion.button
                        key={option.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleFocusSelect(option.id)}
                        className="group flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/50 transition-all duration-300"
                      >
                        <option.icon className="w-5 h-5 text-red-400" />
                        <span className="text-white/80 group-hover:text-white text-left">{option.label}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* Preview mode - Flow Gate Decision Point */}
                {step === "preview" && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6 relative"
                  >
                    {/* Enhanced Dashboard preview */}
                    <AnimatedDashboardPreview businessType={state.businessType} />

                    {/* Sticky CTA Bar - Flow Gate Decision */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                      className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/80 to-transparent pt-8 pb-4 -mx-4 px-4"
                    >
                      <div className="text-center space-y-4">
                        <p className="text-white/70 text-lg">Want me to save this setup and turn it on for you?</p>
                        
                        {/* Microcopy */}
                        <p className="text-sm text-white/50">
                          Takes under 60 seconds · No credit card required
                        </p>
                        
                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                          {/* Primary CTA - Create Account */}
                          <Button
                            onClick={handleCreateAccount}
                            className="relative bg-red-500 hover:bg-red-600 text-white px-8 py-6 text-lg rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.6)] transition-all group overflow-hidden"
                          >
                            {/* Glow animation */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <Check className="w-5 h-5 mr-2" />
                            Create my account
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                          
                          {/* Secondary CTA - Keep Exploring */}
                          <Button
                            variant="outline"
                            onClick={handleKeepExploring}
                            className="border-white/20 hover:border-white/40 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-2xl transition-all"
                          >
                            <Eye className="w-5 h-5 mr-2" />
                            Keep exploring
                          </Button>
                        </div>
                        
                        {/* Visual direction arrow */}
                        <motion.div
                          animate={{ y: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="flex justify-center pt-2"
                        >
                          <ChevronRight className="w-6 h-6 text-red-400/60 rotate-90" />
                        </motion.div>
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
                      {/* Back button */}
                      <button
                        onClick={() => setStep("preview")}
                        className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to preview
                      </button>
                      
                      <h3 className="text-2xl font-semibold text-white mb-2 text-center">Create your account</h3>
                      <p className="text-white/50 text-sm text-center mb-6">Let's save your setup and get you started.</p>
                      
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
                          className="w-full bg-red-500 hover:bg-red-600 text-white py-6 text-lg rounded-xl mt-4 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                        >
                          {isCreating ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Creating...
                            </span>
                          ) : (
                            <>
                              Create Account
                              <ArrowRight className="w-5 h-5 ml-2" />
                            </>
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

              {/* Skip button for qualification steps */}
              {canSkip && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-8 text-center"
                >
                  <button
                    onClick={handleSkipToPreview}
                    className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                    Skip to preview
                  </button>
                </motion.div>
              )}

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
