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
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-12">
              <Link href="/" className="flex items-center cursor-pointer">
                <img src="/logo-dark.png" alt="DojoFlow" className="h-8 dark:hidden" />
                <img src="/logo-light.png" alt="DojoFlow" className="h-8 hidden dark:block" />
              </Link>
              
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <Link href="/auth" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Login
              </Link>
              <Link href="/auth">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg px-6">
                  Sign up
                </Button>
              </Link>
            </div>

            <div className="md:hidden">
              <Link href="/auth">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  Get Started
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
        style={{
          background: 'radial-gradient(ellipse at center, #1a1f2e 0%, #0f1419 50%, #000000 100%)'
        }}
      >
        {/* Anima-inspired Animated Background */}
        <AnimatedBackground />
        
        {/* Dark vignette overlay for depth */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/20 to-black/60 pointer-events-none" />

        <div className="container mx-auto px-6 lg:px-8 relative z-10 py-20">
          {/* Kai Command Center */}
          <div className="max-w-6xl mx-auto">
            {/* Headline */}
            <div className="text-center mb-14 space-y-5">
              <h1 className="text-8xl md:text-9xl font-bold text-white tracking-tight drop-shadow-2xl flex items-center justify-center gap-4">
                <img src="/kai-icon-hero.png" alt="Kai" className="w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl" />
                Hi, I'm Kai.
              </h1>
              <p className="text-3xl md:text-4xl text-slate-200 font-light tracking-wide">
                What would you like to optimize today?
              </p>
            </div>

            {/* Prompt Cards Grid - Larger with stronger glow */}
            <div className="grid md:grid-cols-2 gap-8 mb-14">
              {promptCards.map((card) => (
                <button
                  key={card.category}
                  onClick={() => handleCardClick(card.category)}
                  className={`group relative p-5 rounded-2xl bg-gradient-to-br ${card.gradient} backdrop-blur-xl border-[3px] border-red-500 hover:border-red-400 transition-all duration-500 hover:scale-[1.03] text-left shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]`}
                  style={{
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
                  }}
                >
                  {/* Stronger glow border effect */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                    background: `linear-gradient(135deg, ${card.borderColor.replace('border-', 'rgba(')}30, transparent)`,
                    filter: 'blur(20px)'
                  }} />
                  
                  {/* Star icon top-right */}
                  <div className="absolute top-3 right-3 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                    <Star className="w-4 h-4 text-white drop-shadow-lg" />
                  </div>

                  {/* Card content */}
                  <div className="relative space-y-4">
                    <div className={`text-xs font-bold uppercase tracking-widest ${card.titleColor} drop-shadow-md`}>
                      {card.title}
                    </div>
                    <div className="text-base font-medium text-white leading-relaxed drop-shadow-lg">
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
                className="relative backdrop-blur-2xl border-2 border-white/30 rounded-3xl p-5 shadow-2xl hover:border-white/40 transition-all duration-300"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 20px rgba(255,255,255,0.1)'
                }}
              >
                {/* Subtle top highlight */}
                <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    placeholder="Message Kai… Type @ to mention"
                    className="flex-1 bg-transparent text-white placeholder:text-slate-300 outline-none text-xl font-light tracking-wide"
                    readOnly
                  />
                  <button className="w-12 h-12 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                    <Plus className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-2xl">
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
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(currentStep / ONBOARDING_STEPS.length) * 100}%` }}
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

      {/* Stats Bar */}
      <section className="py-16 bg-card border-y border-border scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-soft-lg transition-all duration-300 hover-lift"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">{feature.description}</p>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="w-4 h-4" />
                  {feature.highlight}
                </div>
              </div>
            ))}
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
            <p className="text-xl text-muted-foreground mb-12">
              Start free for 14 days. No credit card required. Cancel anytime.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="p-8 rounded-2xl bg-card border border-border">
                <div className="text-3xl font-bold mb-2">$49</div>
                <div className="text-muted-foreground mb-4">per month</div>
                <div className="text-sm font-semibold">Starter</div>
              </div>
              <div className="p-8 rounded-2xl bg-primary text-primary-foreground border-2 border-primary shadow-soft-lg scale-105">
                <div className="text-3xl font-bold mb-2">$99</div>
                <div className="opacity-90 mb-4">per month</div>
                <div className="text-sm font-semibold">Growth</div>
              </div>
              <div className="p-8 rounded-2xl bg-card border border-border">
                <div className="text-3xl font-bold mb-2">$199</div>
                <div className="text-muted-foreground mb-4">per month</div>
                <div className="text-sm font-semibold">Pro</div>
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

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo-dark.png" alt="DojoFlow" className="h-6 dark:hidden" />
              <img src="/logo-light.png" alt="DojoFlow" className="h-6 hidden dark:block" />
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              <a href="#" className="hover:text-foreground transition-colors">Help</a>
            </div>

            <div className="text-sm text-muted-foreground">
              © 2024 DojoFlow. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
      
      {/* Cookie Notice */}
      <CookieNotice />
    </div>
  );
}
