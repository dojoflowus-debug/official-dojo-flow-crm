import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ArrowRight, CheckCircle2, Sparkles, Users, Calendar, CreditCard, MessageSquare, BarChart3, Shield, Zap, Star, TrendingUp, Clock, Bell, Phone, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CookieNotice } from "@/components/CookieNotice";

type PromptCategory = "growth" | "health" | "billing" | "retention";

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
  const [hoveredCard, setHoveredCard] = useState<PromptCategory | null>(null);
  const [focusedCard, setFocusedCard] = useState<PromptCategory | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [inputValue, setInputValue] = useState("");

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
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const [, setLocation] = useLocation();
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

  const promptCards = [
    {
      category: "growth" as PromptCategory,
      title: "CLASS MANAGEMENT",
      prompt: "Help me grow my kids program to 150 students",
      gradient: "from-transparent to-transparent",
      hoverGradient: "hover:from-transparent hover:to-transparent",
      borderColor: "border-red-500",
      titleColor: "text-red-400"
    },
    {
      category: "health" as PromptCategory,
      title: "TRACK SCHOOL HEALTH",
      prompt: "Show me attendance and missed classes this week",
      gradient: "from-transparent to-transparent",
      hoverGradient: "hover:from-transparent hover:to-transparent",
      borderColor: "border-red-500",
      titleColor: "text-red-400"
    },
    {
      category: "billing" as PromptCategory,
      title: "FIX BILLING",
      prompt: "Who's behind on payments and how do we fix it?",
      gradient: "from-transparent to-transparent",
      hoverGradient: "hover:from-transparent hover:to-transparent",
      borderColor: "border-red-500",
      titleColor: "text-red-400"
    },
    {
      category: "retention" as PromptCategory,
      title: "INCREASE RETENTION",
      prompt: "Tell me which students are at risk of quitting",
      gradient: "from-transparent to-transparent",
      hoverGradient: "hover:from-transparent hover:to-transparent",
      borderColor: "border-red-500",
      titleColor: "text-red-400"
    }
  ];

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
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chen"
    },
    {
      quote: "The billing automation alone saved me 10 hours per week. No more chasing payments or manual invoicing. It just works.",
      author: "Sensei Rodriguez",
      role: "Head Instructor, Elite Karate Academy",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rodriguez"
    },
    {
      quote: "I was skeptical about AI, but Kai is incredible. Parents love getting instant answers at 11 PM. My phone finally stopped ringing during dinner.",
      author: "Coach Williams",
      role: "Founder, Williams BJJ",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Williams"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Students Managed" },
    { value: "98%", label: "Retention Rate" },
    { value: "24/7", label: "AI Support" },
    { value: "40%", label: "Revenue Growth" }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation - TesoroXP Style */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center cursor-pointer">
              <img src="/logo-light.png" alt="DojoFlow" className="h-8" />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#schools" className="text-sm font-medium text-white/80 hover:text-white transition-colors uppercase tracking-wide">Schools</a>
              <a href="#facilities" className="text-sm font-medium text-white/80 hover:text-white transition-colors uppercase tracking-wide">Fitness Facilities</a>
              <a href="#studios" className="text-sm font-medium text-white/80 hover:text-white transition-colors uppercase tracking-wide">Studios</a>
            </div>
            
            {/* CTA Button */}
            <div className="hidden md:flex items-center">
              <Link href="/auth">
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold shadow-lg px-6 uppercase tracking-wide rounded-full"
                >
                  Book a Demo
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Link href="/auth">
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold uppercase tracking-wide rounded-full"
                >
                  Book a Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Cinematic Kai Command Module */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Cinematic Hero Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center' }}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        
        {/* Additional vignette for depth */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/30 to-black/70 pointer-events-none" />

        <div className="container mx-auto px-6 lg:px-8 relative z-10 py-20">
          {/* Kai Command Center */}
          <div className="max-w-6xl mx-auto">
            {/* Headline */}
            <div className="text-center mb-14 space-y-5">
              <h1 className="text-8xl md:text-9xl font-bold text-white tracking-tight drop-shadow-2xl flex items-center justify-center gap-4 relative">
                <img src="/kai-icon-hero.png" alt="Kai" className="w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl" />
                <span className="relative">
                  Hi, I'm Kai.
                  {/* Soft ambient light pulse behind text */}
                  <div 
                    className="absolute inset-0 -z-10 blur-3xl opacity-40"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.6) 0%, transparent 70%)',
                      animation: 'ambientPulse 4s ease-in-out infinite'
                    }}
                  />
                </span>
              </h1>
              <p className="text-3xl md:text-4xl text-slate-200 font-light tracking-wide">
                What would you like to optimize today?
              </p>
            </div>

            {/* Prompt Cards Grid - Larger with stronger glow */}
            <div className="grid md:grid-cols-2 gap-8 mb-14">
              {promptCards.map((card, index) => (
                <button
                  key={card.category}
                  onClick={() => handleCardClick(card.category)}
                  onMouseEnter={() => setHoveredCard(card.category)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onFocus={() => setFocusedCard(card.category)}
                  onBlur={() => setFocusedCard(null)}
                  className={`group relative p-5 rounded-2xl bg-gradient-to-br ${card.gradient} backdrop-blur-xl border-[3px] transition-all duration-500 text-left shadow-2xl ${
                    index === 0 && !hoveredCard && !focusedCard ? 'border-red-400' : 'border-red-500'
                  } ${
                    hoveredCard === card.category || focusedCard === card.category
                      ? 'border-red-400 scale-[1.03] translate-y-[-4px] shadow-[0_0_60px_rgba(239,68,68,0.4)]'
                      : hoveredCard || focusedCard
                      ? 'opacity-40 scale-[0.98]'
                      : 'hover:border-red-400 hover:scale-[1.03] hover:translate-y-[-4px] hover:shadow-[0_0_60px_rgba(239,68,68,0.4)]'
                  }`}
                  style={{
                    boxShadow: hoveredCard === card.category || focusedCard === card.category
                      ? '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 60px rgba(239,68,68,0.4)'
                      : '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
                  }}
                >
                  {/* Stronger glow border effect */}
                  <div 
                    className="absolute inset-0 rounded-3xl transition-opacity duration-500" 
                    style={{
                      background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.3) 0%, transparent 70%)',
                      filter: 'blur(20px)',
                      opacity: hoveredCard === card.category || focusedCard === card.category ? 1 : 0
                    }} 
                  />
                  
                  {/* Animated outline pulse on focus */}
                  {focusedCard === card.category && (
                    <div 
                      className="absolute inset-0 rounded-2xl border-2 border-red-400"
                      style={{
                        animation: 'outlinePulse 2s ease-in-out infinite'
                      }}
                    />
                  )}
                  
                  {/* Star icon top-right OR Recommended badge */}
                  {index === 0 && !hoveredCard && !focusedCard ? (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 border border-red-400/50 text-xs font-semibold text-red-300 backdrop-blur-sm">
                        <Star className="w-3 h-3 fill-red-400 text-red-400" />
                        Recommended
                      </span>
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                      <Star className="w-4 h-4 text-white drop-shadow-lg" />
                    </div>
                  )}

                  {/* Card content */}
                  <div className="relative space-y-4">
                    <div 
                      className={`text-xs font-bold uppercase tracking-widest ${card.titleColor} drop-shadow-md transition-all duration-300`}
                      style={{
                        filter: hoveredCard === card.category || focusedCard === card.category ? 'brightness(1.3)' : 'brightness(1)'
                      }}
                    >
                      {card.title}
                    </div>
                    <div 
                      className="text-base font-medium text-white leading-relaxed drop-shadow-lg transition-all duration-300"
                      style={{
                        filter: hoveredCard === card.category || focusedCard === card.category ? 'brightness(1.2)' : 'brightness(1)'
                      }}
                    >
                      {card.prompt}
                    </div>
                  </div>

                  {/* Enhanced glassmorphism overlay on hover */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/10 group-hover:to-white/5 transition-all duration-500 pointer-events-none" />
                </button>
              ))}
            </div>

            {/* Chat Input Bar - Enhanced glassmorphism with glow */}
            <div className="max-w-4xl mx-auto">
              <div 
                className="relative backdrop-blur-2xl border-2 rounded-3xl p-5 shadow-2xl transition-all duration-300"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderColor: inputFocused ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                  boxShadow: inputFocused || inputValue
                    ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 30px rgba(239,68,68,0.3)'
                    : '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 20px rgba(255,255,255,0.1)',
                  transform: inputFocused ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                {/* Subtle top highlight */}
                <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                
                {/* Reactive glow when typing */}
                {(inputFocused || inputValue) && (
                  <div 
                    className="absolute inset-0 rounded-3xl -z-10"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
                      filter: 'blur(20px)',
                      animation: 'inputGlow 2s ease-in-out infinite'
                    }}
                  />
                )}
                
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    placeholder={hoveredCard ? getCardPlaceholder(hoveredCard) : "Message Kai… Type @ to mention"}
                    className="flex-1 bg-transparent text-white placeholder:text-slate-300 outline-none text-xl font-light tracking-wide transition-all duration-300"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    readOnly
                  />
                  <button className="w-12 h-12 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                    <Plus className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
              
              {/* Text hint below input */}
              <p className="text-center text-sm text-slate-400 mt-3 font-light">
                Ask Kai anything or choose a path above
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

      {/* Stats Bar - Dark glass strip with glowing icons */}
      <section className="py-12 scroll-reveal relative">
        <div 
          className="absolute inset-0 backdrop-blur-xl border-y"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}
        />
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center relative">
                {/* Faint separator */}
                {index > 0 && (
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-px hidden md:block"
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  />
                )}
                {/* Subtle glowing icon */}
                <div className="flex items-center justify-center mb-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center relative"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    {index === 0 && <Users className="w-5 h-5 text-red-400" />}
                    {index === 1 && <TrendingUp className="w-5 h-5 text-red-400" />}
                    {index === 2 && <Clock className="w-5 h-5 text-red-400" />}
                    {index === 3 && <BarChart3 className="w-5 h-5 text-red-400" />}
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">{stat.value}</div>
                <div className="text-sm text-slate-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - TesoroXP Style */}
      <section className="py-24 bg-gradient-to-b from-[#d4f4dd] to-[#c8eed5] scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              How DojoFlow Works
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Four simple steps to transform your school operations
            </p>
          </div>

          {/* 4-Step Grid */}
          <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {/* Step 1: Connect */}
            <div className="group">
              <div className="bg-gradient-to-br from-[#ff6b6b] to-[#ff5252] rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 min-h-[320px] flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="w-16 h-16 bg-black/20 rounded-2xl flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-3">
                    Connect
                  </h3>
                  <p className="text-base text-black/80 leading-relaxed">
                    Connect your school, staff, and schedule.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Activate */}
            <div className="group">
              <div className="bg-gradient-to-br from-[#ffb800] to-[#ffa500] rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 min-h-[320px] flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="w-16 h-16 bg-black/20 rounded-2xl flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-3">
                    Activate
                  </h3>
                  <p className="text-base text-black/80 leading-relaxed">
                    Turn on automations (calls, SMS, follow-ups, enrollment).
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Run */}
            <div className="group">
              <div className="bg-gradient-to-br from-[#00d084] to-[#00b872] rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 min-h-[320px] flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="w-16 h-16 bg-black/20 rounded-2xl flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-3">
                    Run
                  </h3>
                  <p className="text-base text-black/80 leading-relaxed">
                    Manage check-ins, attendance, leads, and retention daily.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4: Grow */}
            <div className="group">
              <div className="bg-gradient-to-br from-[#00c9db] to-[#00b3c4] rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 min-h-[320px] flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="w-16 h-16 bg-black/20 rounded-2xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-3">
                    Grow
                  </h3>
                  <p className="text-base text-black/80 leading-relaxed">
                    Track KPIs and revenue with dashboards and insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-sm font-medium border border-primary/20 mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span>Everything You Need</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for martial arts schools
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stop juggling spreadsheets, payment apps, and messaging tools. DojoFlow brings everything together in one powerful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-500 relative overflow-hidden"
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
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">{feature.description}</p>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
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
      <section id="schools" className="py-24 bg-gradient-to-b from-[#c8eed5] to-[#bce8cc] scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            {/* Text Content */}
            <div className="space-y-6">
              <div className="inline-block">
                <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">FOR THE</span>
                <div className="mt-2 inline-block px-4 py-2 border-2 border-gray-800 rounded-lg">
                  <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">SCHOOL</span>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Run classes smoother. Enroll faster.
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                DojoFlow gives martial arts schools the tools to manage student enrollment, track attendance, automate onboarding, boost retention, and empower staff—all in one platform. Stop juggling spreadsheets and start growing.
              </p>
              <div className="pt-4">
                <a 
                  href="#contact" 
                  className="inline-flex items-center gap-2 text-gray-900 font-semibold hover:gap-4 transition-all duration-300 group"
                >
                  Learn more
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
            {/* Image Placeholder */}
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl flex items-center justify-center">
                <Users className="w-24 h-24 text-white/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Fitness Facilities */}
      <section id="facilities" className="py-24 bg-gradient-to-b from-[#bce8cc] to-[#b0e2c2] scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            {/* Image Placeholder */}
            <div className="relative order-2 md:order-1">
              <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl flex items-center justify-center">
                <BarChart3 className="w-24 h-24 text-white/20" />
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
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                A kiosk + automation layer for busy gyms.
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Built for high-volume fitness facilities, DojoFlow streamlines check-in flows, manages capacity, schedules classes, automates lead follow-up, and delivers real-time reporting. Keep your members moving and your operations efficient.
              </p>
              <div className="pt-4">
                <a 
                  href="#contact" 
                  className="inline-flex items-center gap-2 text-gray-900 font-semibold hover:gap-4 transition-all duration-300 group"
                >
                  Learn more
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Studios */}
      <section id="studios" className="py-24 bg-gradient-to-b from-[#b0e2c2] to-[#a4dcb8] scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            {/* Text Content */}
            <div className="space-y-6">
              <div className="inline-block">
                <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">FOR THE</span>
                <div className="mt-2 inline-block px-4 py-2 border-2 border-gray-800 rounded-lg">
                  <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">STUDIO</span>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Modern operations for yoga, dance, and boutique training.
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                DojoFlow helps boutique studios manage memberships, class packs, staff scheduling, and client communication with elegant automation and a clean UX. Focus on your craft while we handle the operations.
              </p>
              <div className="pt-4">
                <a 
                  href="#contact" 
                  className="inline-flex items-center gap-2 text-gray-900 font-semibold hover:gap-4 transition-all duration-300 group"
                >
                  Learn more
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
            {/* Image Placeholder */}
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl flex items-center justify-center">
                <Sparkles className="w-24 h-24 text-white/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section - TesoroXP Style */}
      <section id="contact" className="py-24 bg-gradient-to-b from-[#a4dcb8] to-[#98d6ae] scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Get in touch
              </h2>
              <p className="text-lg text-gray-700">
                Ready to transform your school operations? Send us a message.
              </p>
            </div>
            
            {/* Contact Form */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
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
      <section id="testimonials" className="py-24 bg-card scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-sm font-medium border border-accent/20 mb-6">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span>Loved by Martial Arts Schools</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Real results from real schools
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 hover:shadow-soft-lg transition-all duration-300 hover-lift"
              >
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-lg leading-relaxed mb-6 text-foreground">
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
      <section id="pricing" className="py-24 scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground mb-4">
              All plans include monthly AI credits. Upgrade anytime.
            </p>
            <p className="text-sm text-muted-foreground mb-12">
              Credits are used when Kai performs actions like sending messages, analyzing data, or running workflows.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all">
                <div className="text-sm font-semibold text-muted-foreground mb-2">Starter</div>
                <div className="text-3xl font-bold mb-1">$49</div>
                <div className="text-xs text-muted-foreground mb-3">per month</div>
                <div className="text-sm font-medium text-purple-600 dark:text-purple-400">500 credits</div>
              </div>
              <div className="p-6 rounded-2xl bg-primary text-primary-foreground border-2 border-primary shadow-lg scale-[1.02] hover:scale-105 transition-all">
                <div className="text-xs font-semibold opacity-90 mb-2">Most Popular</div>
                <div className="text-sm font-semibold mb-2">Growth</div>
                <div className="text-3xl font-bold mb-1">$99</div>
                <div className="text-xs opacity-90 mb-3">per month</div>
                <div className="text-sm font-medium">1,500 credits</div>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all">
                <div className="text-sm font-semibold text-muted-foreground mb-2">Pro</div>
                <div className="text-3xl font-bold mb-1">$199</div>
                <div className="text-xs text-muted-foreground mb-3">per month</div>
                <div className="text-sm font-medium text-purple-600 dark:text-purple-400">4,000 credits</div>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-2 border-amber-500/50 hover:border-amber-500 shadow-lg scale-[1.02] hover:scale-105 transition-all">
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">Most Powerful</div>
                <div className="text-sm font-semibold mb-2">Elite</div>
                <div className="text-3xl font-bold mb-1">$499</div>
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
      <section className="py-24 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to transform your dojo?
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
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

      {/* Footer - TesoroXP Style */}
      <footer className="py-20 bg-[#1a1a1a] relative overflow-hidden">
        {/* Animated geometric shapes background */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-20 left-10 w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-1/3 w-28 h-28 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-40 right-1/4 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 mb-16">
            {/* Left Column - Navigation Links */}
            <div className="space-y-6">
              <a href="#schools" className="block text-4xl md:text-5xl font-bold text-white hover:text-white/80 transition-colors">
                Schools
              </a>
              <a href="#facilities" className="block text-4xl md:text-5xl font-bold text-white hover:text-white/80 transition-colors">
                Fitness Facilities
              </a>
              <a href="#studios" className="block text-4xl md:text-5xl font-bold text-white hover:text-white/80 transition-colors">
                Studios
              </a>
              <a href="#contact" className="block text-4xl md:text-5xl font-bold text-white hover:text-white/80 transition-colors">
                About
              </a>
            </div>

            {/* Right Column - Newsletter */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">
                Sign up to our newsletter for all the latest news and updates.
              </h3>
              <form className="flex gap-3">
                <Input
                  type="email"
                  placeholder="Email address"
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
                />
                <Button
                  type="submit"
                  className="bg-white text-gray-900 hover:bg-white/90 font-bold px-8"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.success("Thanks for subscribing!");
                  }}
                >
                  Submit
                </Button>
              </form>
              
              {/* Social Icons */}
              <div className="flex gap-4 pt-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Logo */}
              <div className="flex items-center">
                <img src="/logo-light.png" alt="DojoFlow" className="h-8" />
              </div>
              
              {/* Legal Links */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
                <a href="/terms" className="hover:text-white transition-colors uppercase tracking-wide">Terms</a>
                <a href="/privacy" className="hover:text-white transition-colors uppercase tracking-wide">Privacy</a>
              </div>

              {/* Copyright */}
              <div className="text-sm text-white/60">
                © 2025 DojoFlow, Inc.
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Cookie Notice */}
      <CookieNotice />
    </div>
  );
}
