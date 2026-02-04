import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/MainLayout";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ArrowRight, CheckCircle2, Sparkles, Users, Calendar, CreditCard, MessageSquare, BarChart3, Shield, Zap, Star, TrendingUp, Clock, Bell, Phone, Plus, Menu, X, MessageCircle, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CookieNotice } from "@/components/CookieNotice";
import { FloatingVideoIcon } from "@/components/FloatingVideoIcon";
import { KaiOnboardingFlow } from "@/components/KaiOnboardingFlow";
import { FloatingKaiButton } from "@/components/FloatingKaiButton";
import { ScrollIndicator } from "@/components/ScrollIndicator";

type PromptCategory = "growth" | "health" | "billing" | "retention" | "enrollments" | "at-risk" | "class-quality" | "parent-comms" | "staff-perf" | "financial";

interface OnboardingStep {
  id: number;
  title: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 1, title: "School Information" },
  { id: 2, title: "Owner Details" },
  { id: 3, title: "School Profile" },
  { id: 4, title: "Current Status" },
];

export default function PublicLanding() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showKaiOnboarding, setShowKaiOnboarding] = useState(false);

  // Onboarding form state
  const [schoolName, setSchoolName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [locationCount, setLocationCount] = useState("");
  const [programs, setPrograms] = useState<string[]>([]);
  const [studentCount, setStudentCount] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    // Reveal animations on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".scroll-reveal").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleCardClick = (category: PromptCategory) => {
    setSelectedCategory(category);
    setShowOnboarding(true);
    setCurrentStep(1);
  };

  const handleNextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCreateWorkspace();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const navigate = useNavigate();
  const quickSignupMutation = trpc.kaiOnboarding.quickSignup.useMutation();

  const handleCreateWorkspace = async () => {
    if (!selectedCategory) return;
    
    setIsCreating(true);
    
    try {
      const result = await quickSignupMutation.mutateAsync({
        schoolName,
        ownerName,
        ownerEmail,
        locationCount: locationCount as "1" | "2-5" | "6+",
        programs,
        studentCount: studentCount as "0-50" | "51-100" | "101-200" | "201-500" | "500+",
        category: selectedCategory,
      });

      if (result.success) {
        // Show success message
        toast({
          title: "Workspace Created!",
          description: `Welcome to DojoFlow, ${ownerName}! Your ${getCategoryName(selectedCategory)} Command Center is ready.`,
        });

        // Redirect to welcome page with category tag
        window.location.href = `/welcome?category=${selectedCategory}`;
      }
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsCreating(false);
    }
  };

  const getCategoryName = (category: PromptCategory): string => {
    switch (category) {
      case "growth":
        return "Growth";
      case "health":
        return "School Health";
      case "billing":
        return "Billing";
      case "retention":
        return "Retention";
    }
  };

  const getCardPlaceholder = (category: PromptCategory): string => {
    switch (category) {
      case "growth":
        return "Ask Kai how to grow your kids program...";
      case "health":
        return "Ask Kai about your school's health metrics...";
      case "billing":
        return "Ask Kai about billing and payments...";
      case "retention":
        return "Ask Kai about student retention strategies...";
    }
  };

  const handleProgramToggle = (program: string) => {
    setPrograms(prev => 
      prev.includes(program) 
        ? prev.filter(p => p !== program)
        : [...prev, program]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return schoolName.trim() !== "";
      case 2:
        return ownerName.trim() !== "" && ownerEmail.trim() !== "";
      case 3:
        return locationCount !== "" && programs.length > 0;
      case 4:
        return studentCount !== "";
      default:
        return false;
    }
  };



  const features = [
    {
      icon: Sparkles,
      title: "Kai AI Assistant",
      description: "Your 24/7 AI sensei handles student inquiries, schedules classes, and answers questions instantly via chat, SMS, or voice.",
      highlight: "Responds in seconds"
    },
    {
      icon: Users,
      title: "Student Management",
      description: "Track progress, belt ranks, attendance, and achievements. Complete profiles with photos, emergency contacts, and custom notes.",
      highlight: "All-in-one profiles"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Automated class scheduling, private lesson booking, and belt testing coordination. Sync with Google Calendar seamlessly.",
      highlight: "Zero conflicts"
    },
    {
      icon: CreditCard,
      title: "Automated Billing",
      description: "Recurring payments, failed payment recovery, and instant invoicing. Stripe integration handles everything securely.",
      highlight: "Get paid on time"
    },
    {
      icon: MessageSquare,
      title: "Multi-Channel Communication",
      description: "Send announcements via SMS, email, or in-app notifications. Kai handles routine questions automatically.",
      highlight: "Reach everyone instantly"
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track retention rates, revenue trends, attendance patterns, and student progress. Make data-driven decisions.",
      highlight: "Know your numbers"
    }
  ];

  const testimonials = [
    {
      quote: "DojoFlow transformed my school. Kai handles 80% of parent questions, and I finally have time to focus on teaching. Revenue is up 40% since we started.",
      author: "Master Chen",
      role: "Owner, Dragon Martial Arts",
      avatar: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/rZjQsPKJqBelAEmG.jpg"
    },
    {
      quote: "The billing automation alone saved me 10 hours per week. No more chasing payments or manual invoicing. It just works.",
      author: "Sensei Rodriguez",
      role: "Head Instructor, Elite Karate Academy",
      avatar: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/nnvbmwPstsbqiBUN.jpg"
    },
    {
      quote: "I was skeptical about AI, but Kai is incredible. Parents love getting instant answers at 11 PM. My phone finally stopped ringing during dinner.",
      author: "Coach Williams",
      role: "Founder, Williams BJJ",
      avatar: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/uDlxAPOIqFElRVKD.jpg"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Students Managed" },
    { value: "98%", label: "Retention Rate" },
    { value: "24/7", label: "AI Support" },
    { value: "40%", label: "Revenue Growth" }
  ];

  return (
    <MainLayout transparentHeader>
      <div className="min-h-full bg-background overflow-x-hidden">
      {/* Hero Section - Cinematic Kai Command Module */}
      <section 
        ref={heroRef}
        className="relative h-full flex items-center justify-center overflow-hidden"
      >
        {/* Cinematic Hero Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/UKNGrFtBGFrYYUrA.jpg"
        >
          <source src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/xlPpAInqwgOsOCeY.mp4" type="video/mp4" />
          {/* Fallback to image if video doesn't load */}
        </video>
        
        {/* Fallback background image for browsers that don't support video */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center -z-10"
          style={{ backgroundImage: 'url(/images/hero/hero-background.jpg)' }}
        />
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/85" />
        
        {/* Additional vignette for depth */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/30 to-black/70 pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-0 h-full flex items-center justify-center">
          {/* Kai Command Center */}
          <div className="max-w-6xl mx-auto w-full">
            {/* Kai Emblem/Orb - Central Focus */}
            <div className="flex justify-center mb-8 sm:mb-12 md:mb-16 animate-[fadeSlideUp_0.7s_ease-out_0.2s_forwards]">
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 flex items-center justify-center">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full border-2 border-red-500/40 animate-spin" style={{ animationDuration: "8s" }} />
                
                {/* Middle ring */}
                <div className="absolute inset-2 rounded-full border border-red-500/30" />
                
                {/* Inner orb with breathing effect */}
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-red-500/40 to-red-600/20 flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse-slow">
                  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/nDbbiINIuNulnQxs.png" alt="Kai" className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 drop-shadow-lg" />
                </div>
              </div>
            </div>

            {/* Primary Headline - Authoritative & Powerful */}
            <div className="text-center mb-6 sm:mb-8 md:mb-10 space-y-3 sm:space-y-4 md:space-y-5 animate-[fadeSlideUp_0.7s_ease-out_0.4s_forwards]">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight text-white tracking-tight drop-shadow-2xl">
                This is your command center.
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-slate-200 font-light tracking-wide px-4 sm:px-0">
                Kai is your AI operations assistant for martial arts schools.
              </p>
            </div>

            {/* Secondary Message - System-like Authority */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10 sm:mb-12 md:mb-14 px-4 sm:px-0 animate-[fadeSlideUp_0.7s_ease-out_0.6s_forwards]">
              From student management to instructor coordination, Kai learns your environment and delivers intelligent solutions in real time.
            </p>

            {/* CTA Buttons - Clear Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-[fadeSlideUp_0.7s_ease-out_0.8s_forwards]">
              {/* Primary CTA */}
              <button 
                onClick={() => setShowKaiOnboarding(true)}
                className="group inline-flex items-center gap-2 sm:gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-base sm:text-lg font-bold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-red-500/40 hover:shadow-red-500/60 hover:scale-105"
              >
                <MessageCircle className="w-5 h-5" />
                Talk to Kai
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              {/* Secondary CTA */}
              <button 
                className="group inline-flex items-center gap-2 sm:gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-lg border-2 border-red-500 text-red-400 hover:text-red-300 hover:border-red-400 text-base sm:text-lg font-bold uppercase tracking-wider transition-all duration-300 hover:bg-red-500/10"
              >
                Watch Demo
                <Play className="w-5 h-5" />
              </button>
            </div>

            {/* Subtle Scroll Hint */}
            <div className="pt-12 sm:pt-16 md:pt-20 animate-[fadeSlideUp_0.7s_ease-out_1s_forwards]">
              <p className="text-xs text-slate-400/70 uppercase tracking-widest animate-bounce text-center">
                Scroll to explore
              </p>
            </div>


          </div>
        </div>
      </section>

      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-2xl transition-all duration-500">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {isCreating ? "Creating your DojoFlow workspace…" : "Kai Setup: Let's get a little more information"}
            </DialogTitle>
          </DialogHeader>

          {isCreating ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <p className="text-lg text-muted-foreground">Setting up your workspace...</p>
            </div>
          ) : (
            <>
              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Step {currentStep} of {ONBOARDING_STEPS.length}
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {Math.round((currentStep / ONBOARDING_STEPS.length) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ 
                      width: `${(currentStep / ONBOARDING_STEPS.length) * 100}%`,
                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                    }}
                  />
                </div>
              </div>

              {/* Step Content */}
              <div className="space-y-6 min-h-[300px]">
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="schoolName">School/Facility Name *</Label>
                      <Input
                        id="schoolName"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g., Dragon Martial Arts Academy"
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ownerName">Your Name *</Label>
                      <Input
                        id="ownerName"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="e.g., John Smith"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerEmail">Email Address *</Label>
                      <Input
                        id="ownerEmail"
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="e.g., john@dragonma.com"
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="locationCount">Number of Locations *</Label>
                      <Select value={locationCount} onValueChange={setLocationCount}>
                        <SelectTrigger id="locationCount" className="mt-2">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 location</SelectItem>
                          <SelectItem value="2-5">2-5 locations</SelectItem>
                          <SelectItem value="6+">6+ locations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Programs Offered *</Label>
                      <div className="mt-3 space-y-3">
                        {["Karate", "Kickboxing", "After-school", "Yoga", "Other"].map((program) => (
                          <div key={program} className="flex items-center gap-2">
                            <Checkbox
                              id={program}
                              checked={programs.includes(program)}
                              onCheckedChange={() => handleProgramToggle(program)}
                            />
                            <Label htmlFor={program} className="cursor-pointer font-normal">
                              {program}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="studentCount">Current Student Count *</Label>
                      <Select value={studentCount} onValueChange={setStudentCount}>
                        <SelectTrigger id="studentCount" className="mt-2">
                          <SelectValue placeholder="Select range..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-50">0-50 students</SelectItem>
                          <SelectItem value="51-100">51-100 students</SelectItem>
                          <SelectItem value="101-200">101-200 students</SelectItem>
                          <SelectItem value="201-500">201-500 students</SelectItem>
                          <SelectItem value="500+">500+ students</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button
                  variant="ghost"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                >
                  Back
                </Button>
                <Button
                  onClick={handleNextStep}
                  disabled={!canProceed()}
                  className="min-w-[120px]"
                >
                  {currentStep === ONBOARDING_STEPS.length ? "Create Workspace" : "Next"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* TesoroXP-Style Slogan Section */}
      <section className="py-12 sm:py-16 md:py-20 scroll-reveal relative">
        <div 
          className="absolute inset-0 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3))'
          }}
        />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Headline - staggered animation */}
            <h2 
              className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight opacity-0 translate-y-8 animate-[fadeSlideUp_0.7s_ease-out_0.3s_forwards]"
              style={{
                textShadow: '0 0 30px rgba(255, 255, 255, 0.2)'
              }}
            >
              Your brand. Their training.
            </h2>
            
            {/* Punchline with gradient highlight - staggered animation */}
            <p 
              className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight opacity-0 translate-y-8 animate-[fadeSlideUp_0.7s_ease-out_0.6s_forwards]"
              style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 20px rgba(147, 51, 234, 0.4))'
              }}
            >
              Everyone wins.
            </p>
            
            {/* Support line - staggered animation */}
            <p 
              className="text-base sm:text-lg md:text-xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed opacity-0 translate-y-8 animate-[fadeSlideUp_0.7s_ease-out_0.9s_forwards] px-4 sm:px-0"
            >
              DojoFlow unifies enrollment, retention, and operations with AI-assisted automation built for schools and fitness studios.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section - TesoroXP Style */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-[#d4f4dd] to-[#c8eed5] scroll-reveal">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              How DojoFlow Works
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-2xl mx-auto px-4 sm:px-0">
              Four simple steps to transform your school operations
            </p>
          </div>

          {/* 4-Step Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto">
            {/* Step 1: Connect */}
            <div className="group">
              <div className="bg-gradient-to-br from-[#ff6b6b] to-[#ff5252] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 min-h-[200px] sm:min-h-[280px] md:min-h-[320px] flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-black/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-black" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-1 sm:mb-2 md:mb-3">
                    Connect
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-black/80 leading-relaxed">
                    Connect your school, staff, and schedule.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Activate */}
            <div className="group">
              <div className="bg-gradient-to-br from-[#ffb800] to-[#ffa500] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 min-h-[200px] sm:min-h-[280px] md:min-h-[320px] flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-black/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-black" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-1 sm:mb-2 md:mb-3">
                    Activate
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-black/80 leading-relaxed">
                    Turn on automations (calls, SMS, follow-ups, enrollment).
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Run */}
            <div className="group">
              <div className="bg-gradient-to-br from-[#00d084] to-[#00b872] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 min-h-[200px] sm:min-h-[280px] md:min-h-[320px] flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-black/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-black" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-1 sm:mb-2 md:mb-3">
                    Run
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-black/80 leading-relaxed">
                    Manage check-ins, attendance, leads, and retention daily.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4: Grow */}
            <div className="group">
              <div className="bg-gradient-to-br from-[#00c9db] to-[#00b3c4] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 min-h-[200px] sm:min-h-[280px] md:min-h-[320px] flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-black/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-black" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-1 sm:mb-2 md:mb-3">
                    Grow
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-black/80 leading-relaxed">
                    Track KPIs and revenue with dashboards and insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 md:py-24 scroll-reveal">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-xs sm:text-sm font-medium border border-primary/20 mb-4 sm:mb-6">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span>Everything You Need</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Built for martial arts schools
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
              Stop juggling spreadsheets, payment apps, and messaging tools. DojoFlow brings everything together in one powerful platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-500 relative overflow-hidden"
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}
              >
                {/* Soft glow on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.05) 0%, transparent 70%)',
                    filter: 'blur(20px)'
                  }}
                />
                
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-5 md:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4">{feature.description}</p>
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-primary">
                    <Sparkles className="w-4 h-4" />
                    {feature.highlight}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three Audience Sections - TesoroXP Style */}
      
      {/* For Schools */}
      <section id="schools" className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-[#c8eed5] to-[#bce8cc] scroll-reveal">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center max-w-6xl mx-auto">
            {/* Text Content */}
            <div className="space-y-6">
              <div className="inline-block">
                <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">FOR THE</span>
                <div className="mt-2 inline-block px-4 py-2 border-2 border-gray-800 rounded-lg">
                  <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">SCHOOL</span>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Run classes smoother. Enroll faster.
              </h2>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                DojoFlow gives martial arts schools the tools to manage student enrollment, track attendance, automate onboarding, boost retention, and empower staff—all in one platform. Stop juggling spreadsheets and start growing.
              </p>
              <div className="pt-4">
                <Link 
                  to="/schools" 
                  className="inline-flex items-center gap-2 text-gray-900 font-semibold hover:gap-4 transition-all duration-300 group"
                >
                  Learn more
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            {/* Image */}
            <div className="relative">
              <div className="aspect-square rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl overflow-hidden">
                <img 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/XoEPWBnrzCNQjIBM.jpg" 
                  alt="Children practicing martial arts in dojo" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Fitness Facilities */}
      <section id="facilities" className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-[#bce8cc] to-[#b0e2c2] scroll-reveal">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center max-w-6xl mx-auto">
            {/* Image */}
            <div className="relative order-2 md:order-1">
              <div className="aspect-square rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl overflow-hidden">
                <img 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/tcbVKpLefGBpxqma.jpg" 
                  alt="Personal training session with battle ropes" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            {/* Text Content */}
            <div className="space-y-6 order-1 md:order-2">
              <div className="inline-block">
                <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">FOR THE</span>
                <div className="mt-2 inline-block px-4 py-2 border-2 border-gray-800 rounded-lg">
                  <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">FITNESS FACILITY</span>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                A kiosk + automation layer for busy gyms.
              </h2>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                Built for high-volume fitness facilities, DojoFlow streamlines check-in flows, manages capacity, schedules classes, automates lead follow-up, and delivers real-time reporting. Keep your members moving and your operations efficient.
              </p>
              <div className="pt-4">
                <Link 
                  to="/fitness" 
                  className="inline-flex items-center gap-2 text-gray-900 font-semibold hover:gap-4 transition-all duration-300 group"
                >
                  Learn more
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Studios */}
      <section id="studios" className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-[#b0e2c2] to-[#a4dcb8] scroll-reveal">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center max-w-6xl mx-auto">
            {/* Text Content */}
            <div className="space-y-6">
              <div className="inline-block">
                <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">FOR THE</span>
                <div className="mt-2 inline-block px-4 py-2 border-2 border-gray-800 rounded-lg">
                  <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">STUDIO</span>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Modern operations for yoga, dance, and boutique training.
              </h2>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                DojoFlow helps boutique studios manage memberships, class packs, staff scheduling, and client communication with elegant automation and a clean UX. Focus on your craft while we handle the operations.
              </p>
              <div className="pt-4">
                <Link 
                  to="/studios" 
                  className="inline-flex items-center gap-2 text-gray-900 font-semibold hover:gap-4 transition-all duration-300 group"
                >
                  Learn more
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            {/* Image */}
            <div className="relative">
              <div className="aspect-square rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl overflow-hidden">
                <img 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/wKVIbJBkIZnJgylk.jpg" 
                  alt="Yoga class in serene studio" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section - TesoroXP Style */}
      <section id="contact" className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-[#a4dcb8] to-[#98d6ae] scroll-reveal">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Get in touch
              </h2>
              <p className="text-base sm:text-lg text-gray-700">
                Ready to transform your school operations? Send us a message.
              </p>
            </div>
            
            {/* Contact Form */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 md:p-12">
              <form className="space-y-6">
                <div>
                  <Label htmlFor="contact-name" className="text-gray-900 font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="contact-name"
                    type="text"
                    placeholder="John Smith"
                    className="mt-2 bg-gray-50 border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-email" className="text-gray-900 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="john@example.com"
                    className="mt-2 bg-gray-50 border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-message" className="text-gray-900 font-medium">
                    Message
                  </Label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    placeholder="Tell us about your school..."
                    className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold py-6 text-lg uppercase tracking-wide rounded-xl"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.success("Message sent! We'll be in touch soon.");
                  }}
                >
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 sm:py-20 md:py-24 bg-card scroll-reveal">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-accent/10 text-xs sm:text-sm font-medium border border-accent/20 mb-4 sm:mb-6">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-accent fill-accent" />
              <span>Loved by Martial Arts Schools</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Real results from real schools
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-background border border-border hover:border-primary/50 hover:shadow-soft-lg transition-all duration-300 hover-lift"
              >
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-base sm:text-lg leading-relaxed mb-4 sm:mb-6 text-foreground">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section id="pricing" className="py-16 sm:py-20 md:py-24 scroll-reveal">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4">
              All plans include monthly AI credits. Upgrade anytime.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-8 sm:mb-10 md:mb-12 px-4 sm:px-0">
              Credits are used when Kai performs actions like sending messages, analyzing data, or running workflows.
            </p>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-10 md:mb-12">
              <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/50 transition-all">
                <div className="text-sm font-semibold text-muted-foreground mb-2">Starter</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">$49</div>
                <div className="text-xs text-muted-foreground mb-3">per month</div>
                <div className="text-sm font-medium text-purple-600 dark:text-purple-400">500 credits</div>
              </div>
              <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-primary text-primary-foreground border-2 border-primary shadow-lg scale-[1.02] hover:scale-105 transition-all">
                <div className="text-xs font-semibold opacity-90 mb-2">Most Popular</div>
                <div className="text-sm font-semibold mb-2">Growth</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">$99</div>
                <div className="text-xs opacity-90 mb-3">per month</div>
                <div className="text-sm font-medium">1,500 credits</div>
              </div>
              <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/50 transition-all">
                <div className="text-sm font-semibold text-muted-foreground mb-2">Pro</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">$199</div>
                <div className="text-xs text-muted-foreground mb-3">per month</div>
                <div className="text-sm font-medium text-purple-600 dark:text-purple-400">4,000 credits</div>
              </div>
              <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-2 border-amber-500/50 hover:border-amber-500 shadow-lg scale-[1.02] hover:scale-105 transition-all">
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">Most Powerful</div>
                <div className="text-sm font-semibold mb-2">Elite</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">$499</div>
                <div className="text-xs text-muted-foreground mb-3">per month</div>
                <div className="text-sm font-medium text-amber-600 dark:text-amber-400">10,000 credits</div>
              </div>
            </div>

            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-2">
                View Full Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 scroll-reveal">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Ready to transform your dojo?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 md:mb-12 px-4 sm:px-0">
              Join hundreds of martial arts schools using DojoFlow to grow their business and focus on what matters: teaching.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 h-14 shadow-soft-lg hover-lift font-semibold">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-2 hover:bg-secondary font-semibold">
                Schedule Demo
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      
      {/* Cookie Notice */}
      <CookieNotice />
      
      {/* Floating Video Icon - appears when scrolling past hero */}
      <FloatingVideoIcon 
        videoSrc="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/xlPpAInqwgOsOCeY.mp4"
        posterSrc="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/UKNGrFtBGFrYYUrA.jpg"
        heroRef={heroRef as React.RefObject<HTMLElement>}
      />
      
      {/* Floating Kai Button - appears after user chooses "Keep exploring" */}
      <FloatingKaiButton 
        onClick={() => setShowKaiOnboarding(true)}
      />
      
      {/* Kai Interactive Onboarding Flow */}
      <KaiOnboardingFlow
        isActive={showKaiOnboarding}
        onClose={() => setShowKaiOnboarding(false)}
        onComplete={(data) => {
          console.log('Onboarding completed:', data);
          setShowKaiOnboarding(false);
        }}
      />
      
      {/* Custom Floating Scroll Indicator - hides when Kai is open */}
      <ScrollIndicator hidden={showKaiOnboarding} />
      </div>
    </MainLayout>
  );
}
