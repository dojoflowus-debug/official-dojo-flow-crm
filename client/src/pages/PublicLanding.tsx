import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/MainLayout";
import {
  ArrowRight, CheckCircle2, Sparkles, Users, Calendar, CreditCard,
  MessageSquare, BarChart3, Zap, Star, TrendingUp, Play, MessageCircle,
  Shield, Clock, Bell, ChevronRight, ChevronLeft, Quote
} from "lucide-react";
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
  const [showKaiOnboarding, setShowKaiOnboarding] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeAudience, setActiveAudience] = useState(0);
  const [countersStarted, setCountersStarted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Onboarding form state
  const [schoolName, setSchoolName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [locationCount, setLocationCount] = useState("");
  const [programs, setPrograms] = useState<string[]>([]);
  const [studentCount, setStudentCount] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection observer for scroll reveals
  useEffect(() => {
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
    document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Stats counter trigger
  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !countersStarted) {
          setCountersStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [countersStarted]);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
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
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const navigate = useNavigate();
  const quickSignupMutation = trpc.kaiOnboarding.quickSignup.useMutation();

  const handleCreateWorkspace = async () => {
    if (!selectedCategory) return;
    setIsCreating(true);
    try {
      const result = await quickSignupMutation.mutateAsync({
        schoolName, ownerName, ownerEmail,
        locationCount: locationCount as "1" | "2-5" | "6+",
        programs,
        studentCount: studentCount as "0-50" | "51-100" | "101-200" | "201-500" | "500+",
        category: selectedCategory,
      });
      if (result.success) {
        toast.success(`Welcome to DojoFlow, ${ownerName}! Your workspace is ready.`);
        window.location.href = `/welcome?category=${selectedCategory}`;
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
      setIsCreating(false);
    }
  };

  const getCategoryName = (category: PromptCategory): string => {
    const names: Record<PromptCategory, string> = {
      growth: "Growth", health: "School Health", billing: "Billing",
      retention: "Retention", enrollments: "Enrollments", "at-risk": "At-Risk",
      "class-quality": "Class Quality", "parent-comms": "Parent Comms",
      "staff-perf": "Staff Performance", financial: "Financial"
    };
    return names[category] || category;
  };

  const handleProgramToggle = (program: string) => {
    setPrograms(prev => prev.includes(program) ? prev.filter(p => p !== program) : [...prev, program]);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return schoolName.trim() !== "";
      case 2: return ownerName.trim() !== "" && ownerEmail.trim() !== "";
      case 3: return locationCount !== "" && programs.length > 0;
      case 4: return studentCount !== "";
      default: return false;
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: "Kai AI Assistant",
      description: "Your 24/7 AI sensei handles student inquiries, schedules classes, and answers questions instantly via chat, SMS, or voice.",
      highlight: "Responds in seconds",
      color: "from-red-500/20 to-orange-500/10",
      border: "border-red-500/30",
      iconBg: "bg-red-500/15",
      iconColor: "text-red-400"
    },
    {
      icon: Users,
      title: "Student Management",
      description: "Track progress, belt ranks, attendance, and achievements. Complete profiles with photos, emergency contacts, and custom notes.",
      highlight: "All-in-one profiles",
      color: "from-blue-500/20 to-cyan-500/10",
      border: "border-blue-500/30",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Automated class scheduling, private lesson booking, and belt testing coordination. Sync with Google Calendar seamlessly.",
      highlight: "Zero conflicts",
      color: "from-emerald-500/20 to-teal-500/10",
      border: "border-emerald-500/30",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400"
    },
    {
      icon: CreditCard,
      title: "Automated Billing",
      description: "Recurring payments, failed payment recovery, and instant invoicing. Stripe integration handles everything securely.",
      highlight: "Get paid on time",
      color: "from-violet-500/20 to-purple-500/10",
      border: "border-violet-500/30",
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-400"
    },
    {
      icon: MessageSquare,
      title: "Multi-Channel Communication",
      description: "Send announcements via SMS, email, or in-app notifications. Kai handles routine questions automatically.",
      highlight: "Reach everyone instantly",
      color: "from-amber-500/20 to-yellow-500/10",
      border: "border-amber-500/30",
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-400"
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track retention rates, revenue trends, attendance patterns, and student progress. Make data-driven decisions.",
      highlight: "Know your numbers",
      color: "from-pink-500/20 to-rose-500/10",
      border: "border-pink-500/30",
      iconBg: "bg-pink-500/15",
      iconColor: "text-pink-400"
    }
  ];

  const testimonials = [
    {
      quote: "DojoFlow transformed my school. Kai handles 80% of parent questions, and I finally have time to focus on teaching. Revenue is up 40% since we started.",
      author: "Master Chen",
      role: "Owner, Dragon Martial Arts",
      avatar: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/rZjQsPKJqBelAEmG.jpg",
      rating: 5
    },
    {
      quote: "The billing automation alone saved me 10 hours per week. No more chasing payments or manual invoicing. It just works.",
      author: "Sensei Rodriguez",
      role: "Head Instructor, Elite Karate Academy",
      avatar: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/nnvbmwPstsbqiBUN.jpg",
      rating: 5
    },
    {
      quote: "I was skeptical about AI, but Kai is incredible. Parents love getting instant answers at 11 PM. My phone finally stopped ringing during dinner.",
      author: "Coach Williams",
      role: "Founder, Williams BJJ",
      avatar: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/uDlxAPOIqFElRVKD.jpg",
      rating: 5
    }
  ];

  const stats = [
    { value: "10,000+", label: "Students Managed", icon: Users },
    { value: "98%", label: "Retention Rate", icon: TrendingUp },
    { value: "24/7", label: "AI Support", icon: Sparkles },
    { value: "40%", label: "Revenue Growth", icon: BarChart3 }
  ];

  const audiences = [
    {
      tag: "SCHOOL",
      headline: "Run classes smoother. Enroll faster.",
      body: "DojoFlow gives martial arts schools the tools to manage student enrollment, track attendance, automate onboarding, boost retention, and empower staff — all in one platform. Stop juggling spreadsheets and start growing.",
      href: "/schools",
      accent: "from-red-600 to-orange-500",
      bg: "bg-gradient-to-br from-[#0f0f0f] to-[#1a0a0a]",
      tagBg: "bg-red-500/10 border-red-500/30 text-red-400"
    },
    {
      tag: "FITNESS FACILITY",
      headline: "A kiosk + automation layer for busy gyms.",
      body: "Built for high-volume fitness facilities, DojoFlow streamlines check-in flows, manages capacity, schedules classes, automates lead follow-up, and delivers real-time reporting. Keep your members moving and your operations efficient.",
      href: "/fitness",
      accent: "from-blue-600 to-cyan-500",
      bg: "bg-gradient-to-br from-[#0a0f1a] to-[#0a1020]",
      tagBg: "bg-blue-500/10 border-blue-500/30 text-blue-400"
    },
    {
      tag: "STUDIO",
      headline: "Modern operations for boutique training.",
      body: "DojoFlow helps boutique studios manage memberships, class packs, staff scheduling, and client communication with elegant automation and a clean UX. Focus on your craft while we handle the operations.",
      href: "/studios",
      accent: "from-violet-600 to-purple-500",
      bg: "bg-gradient-to-br from-[#0f0a1a] to-[#120a1f]",
      tagBg: "bg-violet-500/10 border-violet-500/30 text-violet-400"
    }
  ];

  const pricingPlans = [
    { name: "Starter", price: "$49", credits: "500 credits", featured: false, badge: null, color: "border-white/10 hover:border-white/20" },
    { name: "Growth", price: "$99", credits: "1,500 credits", featured: true, badge: "Most Popular", color: "border-red-500 bg-gradient-to-b from-red-500/10 to-transparent" },
    { name: "Pro", price: "$199", credits: "4,000 credits", featured: false, badge: null, color: "border-white/10 hover:border-white/20" },
    { name: "Elite", price: "$499", credits: "10,000 credits", featured: false, badge: "Most Powerful", color: "border-amber-500/50 hover:border-amber-500 bg-gradient-to-b from-amber-500/5 to-transparent" }
  ];

  const howItWorks = [
    { step: "01", title: "Connect", desc: "Connect your school, staff, and schedule in minutes.", icon: Users, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
    { step: "02", title: "Activate", desc: "Turn on automations — calls, SMS, follow-ups, enrollment.", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { step: "03", title: "Run", desc: "Manage check-ins, attendance, leads, and retention daily.", icon: Calendar, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { step: "04", title: "Grow", desc: "Track KPIs and revenue with dashboards and insights.", icon: TrendingUp, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" }
  ];

  return (
    <MainLayout transparentHeader>
      <div className="min-h-full bg-[#080808] overflow-x-hidden">

        {/* ─── HERO ─────────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
        >
          {/* Video Background */}
          <video
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover scale-105"
            poster="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/UKNGrFtBGFrYYUrA.jpg"
          >
            <source src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/xlPpAInqwgOsOCeY.mp4" type="video/mp4" />
          </video>

          {/* Multi-layer overlay for cinematic depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-black/40" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(220,38,38,0.08) 0%, transparent 60%)' }} />

          {/* Animated grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-32">
            <div className="max-w-5xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 backdrop-blur-sm mb-8 animate-[fadeSlideUp_0.6s_ease-out_0.1s_both]">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-sm font-semibold tracking-widest uppercase">AI-Powered Dojo Management</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] text-white mb-6 tracking-tight animate-[fadeSlideUp_0.7s_ease-out_0.2s_both]">
                This is your<br />
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-red-500 via-orange-400 to-red-500 bg-clip-text text-transparent">command center.</span>
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 to-orange-400 rounded-full opacity-60" />
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl sm:text-2xl md:text-3xl text-white/80 font-light mb-4 max-w-3xl animate-[fadeSlideUp_0.7s_ease-out_0.35s_both]">
                Kai is your AI operations assistant for martial arts schools.
              </p>
              <p className="text-base sm:text-lg text-white/55 max-w-2xl leading-relaxed mb-12 animate-[fadeSlideUp_0.7s_ease-out_0.5s_both]">
                From student management to instructor coordination, Kai learns your environment and delivers intelligent solutions in real time.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 animate-[fadeSlideUp_0.7s_ease-out_0.65s_both]">
                <button
                  onClick={() => setShowKaiOnboarding(true)}
                  className="group inline-flex items-center justify-center gap-3 px-10 py-5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 text-white text-base font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:shadow-[0_0_60px_rgba(220,38,38,0.6)] hover:scale-[1.03]"
                >
                  <MessageCircle className="w-5 h-5" />
                  Talk to Kai
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="group inline-flex items-center justify-center gap-3 px-10 py-5 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm text-white text-base font-bold uppercase tracking-wider transition-all duration-300 hover:bg-white/10 hover:border-white/40">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Play className="w-3 h-3 ml-0.5" />
                  </div>
                  Watch Demo
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-6 mt-12 animate-[fadeSlideUp_0.7s_ease-out_0.8s_both]">
                {["14-day free trial", "No credit card required", "Cancel anytime"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-white/50 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
            <span className="text-white/30 text-xs uppercase tracking-widest">Scroll</span>
            <div className="w-[1px] h-8 bg-gradient-to-b from-white/30 to-transparent" />
          </div>
        </section>

        {/* ─── STATS BAR ───────────────────────────────────────────── */}
        <section ref={statsRef} className="relative z-10 -mt-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-1 tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-white/80 text-sm font-medium uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── BRAND STATEMENT ─────────────────────────────────────── */}
        <section className="py-24 sm:py-32 relative overflow-hidden scroll-reveal">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.04) 0%, transparent 70%)' }} />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
              Your brand. Their training.
            </h2>
            <p className="text-3xl sm:text-4xl md:text-5xl font-black mb-8"
              style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Everyone wins.
            </p>
            <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              DojoFlow unifies enrollment, retention, and operations with AI-assisted automation built for schools and fitness studios.
            </p>
          </div>
        </section>

        {/* ─── HOW IT WORKS ────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 relative scroll-reveal">
          <div className="absolute inset-0 bg-[#0d0d0d]" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/60 text-sm font-medium mb-6">
                <Zap className="w-4 h-4 text-red-400" />
                Simple Process
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
                How DojoFlow Works
              </h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                Four simple steps to transform your school operations
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {howItWorks.map((step, i) => (
                <div key={i} className={`relative group p-8 rounded-2xl border ${step.border} ${step.bg} hover:scale-[1.03] transition-all duration-300`}>
                  {/* Connector line */}
                  {i < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-[1px] bg-white/10 z-10" />
                  )}
                  <div className="text-5xl font-black text-white/5 mb-4 leading-none">{step.step}</div>
                  <div className={`w-12 h-12 rounded-xl ${step.bg} border ${step.border} flex items-center justify-center mb-5`}>
                    <step.icon className={`w-6 h-6 ${step.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES GRID ───────────────────────────────────────── */}
        <section id="features" className="py-20 sm:py-28 scroll-reveal">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/60 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4 text-red-400" />
                Everything You Need
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
                Built for martial arts schools
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                Stop juggling spreadsheets, payment apps, and messaging tools. DojoFlow brings everything together in one powerful platform.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className={`group relative p-7 rounded-2xl border ${feature.border} bg-gradient-to-br ${feature.color} hover:scale-[1.02] transition-all duration-400 overflow-hidden cursor-default`}
                >
                  {/* Glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                    style={{ boxShadow: 'inset 0 0 40px rgba(255,255,255,0.03)' }} />

                  <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">{feature.description}</p>
                  <div className={`inline-flex items-center gap-2 text-xs font-semibold ${feature.iconColor} uppercase tracking-wider`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    {feature.highlight}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── AUDIENCE TABS ───────────────────────────────────────── */}
        <section className="py-20 sm:py-28 bg-[#0d0d0d] scroll-reveal">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
                Built for every type of facility
              </h2>
              <p className="text-white/50 text-lg">Select your facility type to see how DojoFlow fits your needs.</p>
            </div>

            {/* Tab switcher */}
            <div className="flex justify-center gap-2 mb-12 flex-wrap">
              {audiences.map((aud, i) => (
                <button
                  key={i}
                  onClick={() => setActiveAudience(i)}
                  className={`px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 border ${
                    activeAudience === i
                      ? 'bg-red-500 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                      : 'border-white/10 text-white/50 hover:text-white hover:border-white/30'
                  }`}
                >
                  {aud.tag}
                </button>
              ))}
            </div>

            {/* Active audience panel */}
            <div className="max-w-5xl mx-auto">
              {audiences.map((aud, i) => (
                <div
                  key={i}
                  className={`transition-all duration-500 ${activeAudience === i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'}`}
                >
                  <div className={`rounded-3xl border border-white/10 ${aud.bg} p-10 sm:p-14 grid md:grid-cols-2 gap-10 items-center`}>
                    <div className="space-y-6">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest ${aud.tagBg}`}>
                        FOR THE {aud.tag}
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight">{aud.headline}</h3>
                      <p className="text-white/55 leading-relaxed">{aud.body}</p>
                      <Link
                        to={aud.href}
                        className="inline-flex items-center gap-2 text-white font-semibold hover:gap-4 transition-all duration-300 group"
                      >
                        Learn more
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                    {/* Visual placeholder — dashboard mockup */}
                    <div className="relative">
                      <div className={`rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm`}>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-3 h-3 rounded-full bg-red-500/60" />
                          <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                          <div className="flex-1 h-[1px] bg-white/10 ml-2" />
                        </div>
                        <div className="space-y-3">
                          {[...Array(4)].map((_, j) => (
                            <div key={j} className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${aud.accent} opacity-60 flex-shrink-0`} />
                              <div className="flex-1 space-y-1.5">
                                <div className="h-2 bg-white/10 rounded-full" style={{ width: `${60 + j * 10}%` }} />
                                <div className="h-1.5 bg-white/5 rounded-full" style={{ width: `${40 + j * 8}%` }} />
                              </div>
                              <div className={`text-xs font-bold bg-gradient-to-r ${aud.accent} bg-clip-text text-transparent`}>
                                +{12 + j * 7}%
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className={`mt-5 h-1.5 rounded-full bg-gradient-to-r ${aud.accent} opacity-60`} />
                      </div>
                      {/* Floating badge */}
                      <div className="absolute -top-4 -right-4 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2 shadow-xl">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-0.5">This month</div>
                        <div className={`text-lg font-black bg-gradient-to-r ${aud.accent} bg-clip-text text-transparent`}>↑ 40%</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ────────────────────────────────────────── */}
        <section id="testimonials" className="py-20 sm:py-28 scroll-reveal relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center bottom, rgba(220,38,38,0.05) 0%, transparent 60%)' }} />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-medium mb-6">
                <Star className="w-4 h-4 fill-amber-400" />
                Loved by Martial Arts Schools
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
                Real results from real schools
              </h2>
            </div>

            {/* Main testimonial carousel */}
            <div className="max-w-4xl mx-auto">
              <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-10 sm:p-14 overflow-hidden">
                <div className="absolute top-8 left-10 opacity-10">
                  <Quote className="w-20 h-20 text-red-500" />
                </div>
                <div className="relative z-10">
                  <div className="flex gap-1 mb-8">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl text-white/85 font-light leading-relaxed mb-10">
                    "{testimonials[activeTestimonial].quote}"
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonials[activeTestimonial].avatar}
                      alt={testimonials[activeTestimonial].author}
                      className="w-14 h-14 rounded-full border-2 border-red-500/30 object-cover"
                    />
                    <div>
                      <div className="font-bold text-white text-lg">{testimonials[activeTestimonial].author}</div>
                      <div className="text-white/45 text-sm">{testimonials[activeTestimonial].role}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation dots */}
              <div className="flex justify-center gap-3 mt-8">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`transition-all duration-300 rounded-full ${
                      i === activeTestimonial ? 'w-8 h-2 bg-red-500' : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>

              {/* All 3 cards below */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10">
                {testimonials.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`text-left p-6 rounded-2xl border transition-all duration-300 ${
                      i === activeTestimonial
                        ? 'border-red-500/40 bg-red-500/5'
                        : 'border-white/8 bg-white/[0.02] hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img src={t.avatar} alt={t.author} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <div className="text-white text-sm font-semibold">{t.author}</div>
                        <div className="text-white/35 text-xs">{t.role}</div>
                      </div>
                    </div>
                    <p className="text-white/45 text-xs leading-relaxed line-clamp-3">"{t.quote}"</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── PRICING ─────────────────────────────────────────────── */}
        <section id="pricing" className="py-20 sm:py-28 bg-[#0d0d0d] scroll-reveal">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-white/50 text-lg mb-2">All plans include monthly AI credits. Upgrade anytime.</p>
              <p className="text-white/30 text-sm max-w-lg mx-auto">
                Credits are used when Kai performs actions like sending messages, analyzing data, or running workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto mb-10">
              {pricingPlans.map((plan, i) => (
                <div
                  key={i}
                  className={`relative rounded-2xl border p-7 transition-all duration-300 hover:scale-[1.03] ${plan.color} ${plan.featured ? 'shadow-[0_0_40px_rgba(220,38,38,0.2)]' : ''}`}
                >
                  {plan.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                      plan.featured ? 'bg-red-500 text-white' : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                    }`}>
                      {plan.badge}
                    </div>
                  )}
                  <div className="text-white/50 text-sm font-semibold mb-3">{plan.name}</div>
                  <div className="text-4xl font-black text-white mb-1">{plan.price}</div>
                  <div className="text-white/30 text-xs mb-5">per month</div>
                  <div className={`text-sm font-semibold ${plan.featured ? 'text-red-400' : 'text-white/50'}`}>{plan.credits}</div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 text-base px-10 h-13 rounded-xl">
                  View Full Pricing
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── CONTACT ─────────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 scroll-reveal">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/60 text-sm font-medium">
                  <MessageSquare className="w-4 h-4 text-red-400" />
                  Get in Touch
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
                  Ready to transform your school operations?
                </h2>
                <p className="text-white/50 leading-relaxed">
                  Send us a message and our team will get back to you within 24 hours. Or talk to Kai right now for an instant demo.
                </p>
                <div className="space-y-4 pt-4">
                  {[
                    { icon: Clock, label: "Response time", value: "Under 24 hours" },
                    { icon: Shield, label: "Data security", value: "SOC 2 compliant" },
                    { icon: Bell, label: "Onboarding", value: "White-glove setup" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <div className="text-white/35 text-xs uppercase tracking-wider">{item.label}</div>
                        <div className="text-white font-semibold text-sm">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); toast.success("Message sent! We'll be in touch soon."); }}>
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-2">Full Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="John Smith"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-red-500/50 focus:bg-white/8 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-2">Email Address</label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-red-500/50 focus:bg-white/8 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-2">Message</label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      placeholder="Tell us about your school..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-red-500/50 focus:bg-white/8 transition-all resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA ───────────────────────────────────────────── */}
        <section className="relative py-28 sm:py-36 overflow-hidden scroll-reveal">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-[#080808] to-[#080808]" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.15) 0%, transparent 60%)' }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-semibold mb-8">
                <Sparkles className="w-4 h-4" />
                Start Today — Free for 14 Days
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
                Ready to transform<br />your dojo?
              </h2>
              <p className="text-lg sm:text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
                Join hundreds of martial arts schools using DojoFlow to grow their business and focus on what matters: teaching.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <Link to="/auth">
                  <button className="group inline-flex items-center justify-center gap-3 px-12 py-5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 text-white text-base font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:shadow-[0_0_60px_rgba(220,38,38,0.6)] hover:scale-[1.03]">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <button className="inline-flex items-center justify-center gap-3 px-12 py-5 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm text-white text-base font-bold uppercase tracking-wider transition-all duration-300 hover:bg-white/10 hover:border-white/40">
                  Schedule Demo
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-8 text-sm text-white/35">
                {["14-day free trial", "No credit card required", "Cancel anytime"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500/70" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── MODALS & OVERLAYS ───────────────────────────────────── */}

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
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Step {currentStep} of {ONBOARDING_STEPS.length}</span>
                    <span className="text-sm font-medium text-primary">{Math.round((currentStep / ONBOARDING_STEPS.length) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${(currentStep / ONBOARDING_STEPS.length) * 100}%` }} />
                  </div>
                </div>
                <div className="space-y-6 min-h-[300px]">
                  {currentStep === 1 && (
                    <div><Label htmlFor="schoolName">School/Facility Name *</Label>
                      <Input id="schoolName" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="e.g., Dragon Martial Arts Academy" className="mt-2" /></div>
                  )}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div><Label htmlFor="ownerName">Your Name *</Label>
                        <Input id="ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="e.g., John Smith" className="mt-2" /></div>
                      <div><Label htmlFor="ownerEmail">Email Address *</Label>
                        <Input id="ownerEmail" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="e.g., john@dragonma.com" className="mt-2" /></div>
                    </div>
                  )}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div><Label htmlFor="locationCount">Number of Locations *</Label>
                        <Select value={locationCount} onValueChange={setLocationCount}>
                          <SelectTrigger id="locationCount" className="mt-2"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 location</SelectItem>
                            <SelectItem value="2-5">2-5 locations</SelectItem>
                            <SelectItem value="6+">6+ locations</SelectItem>
                          </SelectContent>
                        </Select></div>
                      <div><Label>Programs Offered *</Label>
                        <div className="mt-3 space-y-3">
                          {["Karate", "Kickboxing", "After-school", "Yoga", "Other"].map((program) => (
                            <div key={program} className="flex items-center gap-2">
                              <Checkbox id={program} checked={programs.includes(program)} onCheckedChange={() => handleProgramToggle(program)} />
                              <Label htmlFor={program} className="cursor-pointer font-normal">{program}</Label>
                            </div>
                          ))}
                        </div></div>
                    </div>
                  )}
                  {currentStep === 4 && (
                    <div><Label htmlFor="studentCount">Current Student Count *</Label>
                      <Select value={studentCount} onValueChange={setStudentCount}>
                        <SelectTrigger id="studentCount" className="mt-2"><SelectValue placeholder="Select range..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-50">0-50 students</SelectItem>
                          <SelectItem value="51-100">51-100 students</SelectItem>
                          <SelectItem value="101-200">101-200 students</SelectItem>
                          <SelectItem value="201-500">201-500 students</SelectItem>
                          <SelectItem value="500+">500+ students</SelectItem>
                        </SelectContent>
                      </Select></div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-6 border-t">
                  <Button variant="ghost" onClick={handlePrevStep} disabled={currentStep === 1}>Back</Button>
                  <Button onClick={handleNextStep} disabled={!canProceed()} className="min-w-[120px]">
                    {currentStep === ONBOARDING_STEPS.length ? "Create Workspace" : "Next"}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Cookie Notice */}
        <CookieNotice />

        {/* Floating Video Icon */}
        <FloatingVideoIcon
          videoSrc="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/xlPpAInqwgOsOCeY.mp4"
          posterSrc="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/UKNGrFtBGFrYYUrA.jpg"
          heroRef={heroRef as React.RefObject<HTMLElement>}
        />

        {/* Floating Kai Button */}
        <FloatingKaiButton onClick={() => setShowKaiOnboarding(true)} />

        {/* Kai Interactive Onboarding Flow */}
        <KaiOnboardingFlow
          isActive={showKaiOnboarding}
          onClose={() => setShowKaiOnboarding(false)}
          onComplete={(data) => { setShowKaiOnboarding(false); }}
        />

        {/* Scroll Indicator */}
        <ScrollIndicator hidden={showKaiOnboarding} />
      </div>
    </MainLayout>
  );
}
