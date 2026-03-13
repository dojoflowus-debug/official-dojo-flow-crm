import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/MainLayout";
import {
  ArrowRight, CheckCircle2, Sparkles, Users, Calendar, CreditCard,
  MessageSquare, BarChart3, Zap, Star, TrendingUp, Play, MessageCircle,
  Shield, Clock, Bell, ChevronRight, ChevronLeft, Quote, Check, Flame
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

  const [schoolName, setSchoolName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [locationCount, setLocationCount] = useState("");
  const [programs, setPrograms] = useState<string[]>([]);
  const [studentCount, setStudentCount] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !countersStarted) setCountersStarted(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [countersStarted]);

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
    if (currentStep < ONBOARDING_STEPS.length) setCurrentStep(currentStep + 1);
    else handleCreateWorkspace();
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
    },
    {
      icon: Users,
      title: "Student Management",
      description: "Track progress, belt ranks, attendance, and achievements. Complete profiles with photos, emergency contacts, and custom notes.",
      highlight: "All-in-one profiles",
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Automated class scheduling, private lesson booking, and belt testing coordination. Sync with Google Calendar seamlessly.",
      highlight: "Zero conflicts",
    },
    {
      icon: CreditCard,
      title: "Automated Billing",
      description: "Recurring payments, failed payment recovery, and instant invoicing. Stripe integration handles everything securely.",
      highlight: "Get paid on time",
    },
    {
      icon: MessageSquare,
      title: "Multi-Channel Comms",
      description: "Send announcements via SMS, email, or in-app notifications. Kai handles routine questions automatically.",
      highlight: "Reach everyone instantly",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track retention rates, revenue trends, attendance patterns, and student progress. Make data-driven decisions.",
      highlight: "Know your numbers",
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

  const pricingPlans = [
    {
      name: "Starter",
      price: "$49",
      period: "/mo",
      credits: "500 credits / month",
      features: ["Kai AI Assistant", "Up to 100 students", "Basic scheduling", "Email support"],
      featured: false,
      badge: null,
    },
    {
      name: "Growth",
      price: "$99",
      period: "/mo",
      credits: "1,500 credits / month",
      features: ["Everything in Starter", "Up to 300 students", "Automated billing", "SMS + email comms", "Priority support"],
      featured: true,
      badge: "Most Popular",
    },
    {
      name: "Pro",
      price: "$199",
      period: "/mo",
      credits: "4,000 credits / month",
      features: ["Everything in Growth", "Unlimited students", "Advanced analytics", "Multi-location", "White-glove onboarding"],
      featured: false,
      badge: null,
    },
    {
      name: "Elite",
      price: "$499",
      period: "/mo",
      credits: "10,000 credits / month",
      features: ["Everything in Pro", "Dedicated AI model", "Custom integrations", "SLA guarantee", "Dedicated success manager"],
      featured: false,
      badge: "Most Powerful",
    }
  ];

  const audiences = [
    {
      tag: "Martial Arts Schools",
      headline: "Run classes smoother.\nEnroll faster.",
      body: "DojoFlow gives martial arts schools the tools to manage student enrollment, track attendance, automate onboarding, boost retention, and empower staff — all in one platform.",
      href: "/schools",
      color: "#e11d48",
    },
    {
      tag: "Fitness Facilities",
      headline: "A kiosk + automation\nlayer for busy gyms.",
      body: "Built for high-volume fitness facilities, DojoFlow streamlines check-in flows, manages capacity, schedules classes, and automates lead follow-up with real-time reporting.",
      href: "/fitness",
      color: "#2563eb",
    },
    {
      tag: "Studios",
      headline: "Modern operations for\nboutique training.",
      body: "DojoFlow helps boutique studios manage memberships, class packs, staff scheduling, and client communication with elegant automation and a clean UX.",
      href: "/studios",
      color: "#7c3aed",
    }
  ];

  return (
    <MainLayout transparentHeader hideFooter>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(32px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.94); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(225,29,72,0.3); }
          50% { box-shadow: 0 0 80px rgba(225,29,72,0.6); }
        }
        @keyframes borderFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes dashboardFloat {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-12px) rotate(-1deg); }
        }
        .scroll-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scroll-reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        .hero-animate-1 { animation: floatUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .hero-animate-2 { animation: floatUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both; }
        .hero-animate-3 { animation: floatUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both; }
        .hero-animate-4 { animation: floatUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both; }
        .hero-animate-5 { animation: floatUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s both; }
        .hero-animate-6 { animation: scaleIn 1s cubic-bezier(0.16, 1, 0.3, 1) 0.9s both; }
        .dashboard-float { animation: dashboardFloat 6s ease-in-out infinite; }
        .glow-cta { animation: glowPulse 3s ease-in-out infinite; }
        .feature-card:hover .feature-icon { transform: scale(1.15) rotate(-5deg); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .feature-icon { transition: transform 0.3s ease; }
        .noise-overlay {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 200px 200px;
        }
      `}</style>

      <div className="min-h-full bg-[#050505] overflow-x-hidden text-white">

        {/* ═══════════════════════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════════════════════ */}
        <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/hero-martial-arts.jpg')" }}
          />

          {/* Layered overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/70 via-[#050505]/50 to-[#050505]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-[#050505]/60" />

          {/* Subtle red radial glow */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(225,29,72,0.12) 0%, transparent 70%)'
          }} />

          {/* Fine grid */}
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '80px 80px'
          }} />

          {/* Noise texture */}
          <div className="absolute inset-0 noise-overlay opacity-30 pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-8 pt-32 pb-20 flex flex-col items-center text-center">

            {/* Eyebrow badge */}
            <div className="hero-animate-1 inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-white/70 text-xs font-semibold tracking-[0.2em] uppercase">AI-Powered Dojo Management</span>
            </div>

            {/* Main headline */}
            <h1 className="hero-animate-2 text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-black leading-[0.92] tracking-tight mb-6 max-w-5xl">
              <span className="text-white">The operating system</span>
              <br />
              <span className="text-white">for your </span>
              <span style={{
                background: 'linear-gradient(135deg, #e11d48 0%, #f97316 50%, #e11d48 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 4s linear infinite'
              }}>dojo.</span>
            </h1>

            {/* Subheadline */}
            <p className="hero-animate-3 text-lg sm:text-xl md:text-2xl text-white/55 font-light max-w-2xl leading-relaxed mb-10">
              Kai is your AI operations assistant — handling student management, billing, scheduling, and parent communications so you can focus on teaching.
            </p>

            {/* CTA row */}
            <div className="hero-animate-4 flex flex-col sm:flex-row items-center gap-4 mb-12">
              <button
                onClick={() => setShowKaiOnboarding(true)}
                className="glow-cta group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-[1.03]"
              >
                <MessageCircle className="w-4 h-4" />
                Talk to Kai
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm text-white/80 text-sm font-semibold uppercase tracking-widest transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:text-white">
                <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors">
                  <Play className="w-2.5 h-2.5 ml-0.5 fill-current" />
                </div>
                Watch Demo
              </button>
            </div>

            {/* Trust row */}
            <div className="hero-animate-5 flex flex-wrap items-center justify-center gap-6 text-white/40 text-xs font-medium tracking-wide">
              {["14-day free trial", "No credit card required", "Cancel anytime"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-500/70" />
                  {t}
                </span>
              ))}
            </div>

            {/* Dashboard mockup */}
            <div className="hero-animate-6 relative mt-20 w-full max-w-4xl mx-auto">
              {/* Glow behind dashboard */}
              <div className="absolute -inset-8 rounded-3xl opacity-30 blur-3xl" style={{
                background: 'radial-gradient(ellipse at center, rgba(225,29,72,0.4) 0%, transparent 70%)'
              }} />

              {/* Dashboard image */}
              <div className="dashboard-float relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.8)]">
                {/* Browser chrome */}
                <div className="bg-[#111111] border-b border-white/8 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-[#1a1a1a] rounded-md px-3 py-1 text-[11px] text-white/30 font-mono text-center max-w-xs mx-auto">
                      app.dojoflow.com/dashboard
                    </div>
                  </div>
                </div>
                <img
                  src="/hero-dashboard.png"
                  alt="DojoFlow Dashboard"
                  className="w-full block"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            LOGO BAR / SOCIAL PROOF
        ═══════════════════════════════════════════════════════════ */}
        <section className="border-y border-white/[0.06] bg-[#080808] py-10">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-center text-white/25 text-xs font-semibold tracking-[0.25em] uppercase mb-8">
              Trusted by martial arts schools across the country
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {["Dragon Martial Arts", "Elite Karate Academy", "Williams BJJ", "Zen Dojo", "Iron Fist MMA", "Bushido Academy"].map((name) => (
                <span key={name} className="text-white/20 text-sm font-semibold tracking-wide hover:text-white/40 transition-colors cursor-default">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            STATS
        ═══════════════════════════════════════════════════════════ */}
        <section ref={statsRef} className="py-24 bg-[#050505]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
              {[
                { value: "10,000+", label: "Students Managed", icon: Users },
                { value: "98%", label: "Retention Rate", icon: TrendingUp },
                { value: "24/7", label: "AI Support", icon: Sparkles },
                { value: "40%", label: "Revenue Growth", icon: BarChart3 },
              ].map(({ value, label, icon: Icon }, i) => (
                <div key={i} className="scroll-reveal bg-[#050505] p-8 md:p-10 flex flex-col items-center text-center group hover:bg-[#0d0d0d] transition-colors" style={{ transitionDelay: `${i * 80}ms` }}>
                  <Icon className="w-5 h-5 text-rose-500/60 mb-4 group-hover:text-rose-500 transition-colors" />
                  <div className="text-4xl md:text-5xl font-black text-white mb-2 tabular-nums">{value}</div>
                  <div className="text-white/40 text-sm font-medium tracking-wide">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            INTRO / VALUE PROP
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-32 bg-[#080808]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: text */}
              <div className="scroll-reveal">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-semibold tracking-widest uppercase mb-6">
                  <Flame className="w-3 h-3" />
                  Why DojoFlow
                </div>
                <h2 className="text-4xl md:text-5xl font-black leading-[1.05] tracking-tight text-white mb-6">
                  Your school deserves<br />
                  <span className="text-rose-500">better tools.</span>
                </h2>
                <p className="text-white/50 text-lg leading-relaxed mb-8">
                  Most martial arts schools run on spreadsheets, group texts, and manual invoicing. DojoFlow replaces all of it with a single AI-powered platform that works while you teach.
                </p>
                <div className="space-y-4">
                  {[
                    "Kai answers parent questions at 2 AM so you don't have to",
                    "Automated billing collects tuition without awkward conversations",
                    "One dashboard for every student, class, and payment",
                    "Built specifically for martial arts — not a generic gym app",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-rose-400" />
                      </div>
                      <span className="text-white/65 text-sm leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: visual */}
              <div className="scroll-reveal relative" style={{ transitionDelay: '150ms' }}>
                <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-[#0d0d0d]">
                  <img
                    src="/dojo-background.jpg"
                    alt="Traditional Dojo"
                    className="w-full h-72 object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-white text-sm font-semibold">Kai AI</div>
                        <div className="text-white/40 text-xs">Online now</div>
                      </div>
                      <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white/70 text-sm leading-relaxed">
                      "Hi! I'm Kai, your AI assistant. I can answer questions about class schedules, billing, and enrollment — 24/7. How can I help you today?"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            HOW IT WORKS
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-32 bg-[#050505]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-20 scroll-reveal">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-semibold tracking-widest uppercase mb-5">
                Simple Process
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                Up and running in minutes.
              </h2>
            </div>

            <div className="relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <div className="grid md:grid-cols-4 gap-8">
                {[
                  { step: "01", title: "Connect", desc: "Connect your school, staff, and schedule in minutes.", icon: Users, color: "rose" },
                  { step: "02", title: "Activate", desc: "Turn on automations — calls, SMS, follow-ups, enrollment.", icon: Zap, color: "amber" },
                  { step: "03", title: "Run", desc: "Manage check-ins, attendance, leads, and retention daily.", icon: Calendar, color: "emerald" },
                  { step: "04", title: "Grow", desc: "Track KPIs and revenue with dashboards and insights.", icon: TrendingUp, color: "cyan" },
                ].map(({ step, title, desc, icon: Icon, color }, i) => (
                  <div key={i} className="scroll-reveal flex flex-col items-center text-center group" style={{ transitionDelay: `${i * 100}ms` }}>
                    <div className={`relative w-20 h-20 rounded-2xl border mb-6 flex items-center justify-center transition-all duration-300 group-hover:scale-110
                      ${color === 'rose' ? 'border-rose-500/20 bg-rose-500/5 group-hover:bg-rose-500/10 group-hover:border-rose-500/40' : ''}
                      ${color === 'amber' ? 'border-amber-500/20 bg-amber-500/5 group-hover:bg-amber-500/10 group-hover:border-amber-500/40' : ''}
                      ${color === 'emerald' ? 'border-emerald-500/20 bg-emerald-500/5 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/40' : ''}
                      ${color === 'cyan' ? 'border-cyan-500/20 bg-cyan-500/5 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/40' : ''}
                    `}>
                      <Icon className={`w-7 h-7
                        ${color === 'rose' ? 'text-rose-400' : ''}
                        ${color === 'amber' ? 'text-amber-400' : ''}
                        ${color === 'emerald' ? 'text-emerald-400' : ''}
                        ${color === 'cyan' ? 'text-cyan-400' : ''}
                      `} />
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#050505] border border-white/10 text-white/30 text-[10px] font-bold flex items-center justify-center">
                        {step}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            FEATURES GRID
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-32 bg-[#080808]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-20 scroll-reveal">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-semibold tracking-widest uppercase mb-5">
                Everything You Need
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                Built for martial arts schools.
              </h2>
              <p className="text-white/40 text-lg max-w-xl mx-auto">
                Stop juggling spreadsheets, payment apps, and messaging tools. DojoFlow brings everything together.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map(({ icon: Icon, title, description, highlight }, i) => (
                <div
                  key={i}
                  className="feature-card scroll-reveal group relative rounded-2xl border border-white/[0.07] bg-[#0d0d0d] p-7 hover:border-white/15 hover:bg-[#111111] transition-all duration-300 cursor-default overflow-hidden"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  {/* Subtle top gradient line */}
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="feature-icon w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-rose-400" />
                  </div>
                  <h3 className="text-white font-bold text-base mb-2">{title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-4">{description}</p>
                  <div className="inline-flex items-center gap-1.5 text-rose-400/70 text-xs font-semibold tracking-wide">
                    <Sparkles className="w-3 h-3" />
                    {highlight}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            AUDIENCE TABS
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-32 bg-[#050505]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 scroll-reveal">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                Built for every type of facility.
              </h2>
              <p className="text-white/40 text-lg">Select your facility type to see how DojoFlow fits your needs.</p>
            </div>

            {/* Tab buttons */}
            <div className="flex justify-center gap-2 mb-12 scroll-reveal">
              {audiences.map(({ tag }, i) => (
                <button
                  key={i}
                  onClick={() => setActiveAudience(i)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeAudience === i
                      ? "bg-rose-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)]"
                      : "border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="scroll-reveal">
              {audiences.map(({ tag, headline, body, href }, i) => (
                <div
                  key={i}
                  className={`transition-all duration-500 ${activeAudience === i ? 'block' : 'hidden'}`}
                >
                  <div className="grid lg:grid-cols-2 gap-12 items-center rounded-3xl border border-white/[0.07] bg-[#0d0d0d] p-10 md:p-14">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-semibold tracking-widest uppercase mb-6">
                        {tag}
                      </div>
                      <h3 className="text-3xl md:text-4xl font-black text-white leading-tight mb-5 whitespace-pre-line">
                        {headline}
                      </h3>
                      <p className="text-white/50 text-base leading-relaxed mb-8">{body}</p>
                      <Link to={href} className="inline-flex items-center gap-2 text-rose-400 font-semibold text-sm hover:text-rose-300 transition-colors group">
                        Learn more
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden border border-white/8">
                      <img
                        src={i === 0 ? "/kids-martial-arts.jpeg" : i === 1 ? "/fitness-class.webp" : "/barre-studio.jpg"}
                        alt={tag}
                        className="w-full h-72 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d]/60 to-transparent" />
                      {/* Floating stat */}
                      <div className="absolute bottom-4 left-4 right-4 bg-[#0d0d0d]/90 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <div className="text-white/40 text-xs mb-0.5">This month</div>
                          <div className="text-white font-bold text-sm">Revenue Growth</div>
                        </div>
                        <div className="text-emerald-400 font-black text-2xl">↑ 40%</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            TESTIMONIALS
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-32 bg-[#080808]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 scroll-reveal">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs font-semibold tracking-widest uppercase mb-5">
                <Star className="w-3 h-3 fill-current" />
                Loved by Martial Arts Schools
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                Real results from real schools.
              </h2>
            </div>

            <div className="scroll-reveal">
              {/* Main testimonial */}
              <div className="relative rounded-3xl border border-white/[0.07] bg-[#0d0d0d] p-10 md:p-14 mb-6 overflow-hidden">
                <div className="absolute top-8 right-8 opacity-5">
                  <Quote className="w-24 h-24 text-white" />
                </div>
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: testimonials[activeTestimonial].rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-white text-xl md:text-2xl font-light leading-relaxed mb-8 max-w-3xl">
                  "{testimonials[activeTestimonial].quote}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonials[activeTestimonial].avatar}
                    alt={testimonials[activeTestimonial].author}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                  />
                  <div>
                    <div className="text-white font-semibold">{testimonials[activeTestimonial].author}</div>
                    <div className="text-white/40 text-sm">{testimonials[activeTestimonial].role}</div>
                  </div>
                </div>
              </div>

              {/* Testimonial navigation */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTestimonial(i)}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        activeTestimonial === i ? 'w-8 bg-rose-500' : 'w-4 bg-white/15 hover:bg-white/30'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                    className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
                    className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            PRICING
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-32 bg-[#050505]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 scroll-reveal">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-semibold tracking-widest uppercase mb-5">
                Simple Pricing
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                Transparent. No surprises.
              </h2>
              <p className="text-white/40 text-lg max-w-lg mx-auto">
                All plans include monthly AI credits. Credits are used when Kai performs actions.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {pricingPlans.map(({ name, price, period, credits, features: planFeatures, featured, badge }, i) => (
                <div
                  key={i}
                  className={`scroll-reveal relative rounded-2xl border p-7 flex flex-col transition-all duration-300 hover:scale-[1.02] ${
                    featured
                      ? "border-rose-500 bg-gradient-to-b from-rose-500/10 to-[#0d0d0d] shadow-[0_0_40px_rgba(225,29,72,0.15)]"
                      : badge === "Most Powerful"
                      ? "border-amber-500/30 bg-[#0d0d0d] hover:border-amber-500/50"
                      : "border-white/[0.07] bg-[#0d0d0d] hover:border-white/15"
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  {badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                      featured ? "bg-rose-500 text-white" : "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                    }`}>
                      {badge}
                    </div>
                  )}
                  <div className="mb-6">
                    <div className="text-white/50 text-sm font-semibold mb-3">{name}</div>
                    <div className="flex items-end gap-1 mb-1">
                      <span className="text-4xl font-black text-white">{price}</span>
                      <span className="text-white/30 text-sm mb-1.5">{period}</span>
                    </div>
                    <div className="text-white/30 text-xs">{credits}</div>
                  </div>
                  <div className="space-y-3 flex-1 mb-8">
                    {planFeatures.map((f, j) => (
                      <div key={j} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${featured ? 'text-rose-400' : 'text-white/30'}`} />
                        <span className="text-white/50 text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowKaiOnboarding(true)}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                      featured
                        ? "bg-rose-600 hover:bg-rose-500 text-white"
                        : "border border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              ))}
            </div>

            <div className="text-center mt-8 scroll-reveal">
              <Link to="/pricing" className="inline-flex items-center gap-2 text-white/30 text-sm hover:text-white/60 transition-colors">
                View full pricing details
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            CONTACT
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-32 bg-[#080808]">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div className="scroll-reveal">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-semibold tracking-widest uppercase mb-6">
                  Get in Touch
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-5">
                  Ready to transform your school?
                </h2>
                <p className="text-white/40 text-lg leading-relaxed mb-10">
                  Send us a message and our team will get back to you within 24 hours. Or talk to Kai right now for an instant demo.
                </p>
                <div className="space-y-5">
                  {[
                    { icon: Clock, label: "Response time", value: "Under 24 hours" },
                    { icon: Shield, label: "Data security", value: "SOC 2 compliant" },
                    { icon: Star, label: "Onboarding", value: "White-glove setup" },
                  ].map(({ icon: Icon, label, value }, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl border border-white/8 bg-white/3 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-white/30" />
                      </div>
                      <div>
                        <div className="text-white/30 text-xs mb-0.5">{label}</div>
                        <div className="text-white text-sm font-semibold">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="scroll-reveal" style={{ transitionDelay: '150ms' }}>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            FINAL CTA
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative py-40 overflow-hidden bg-[#050505]">
          {/* Radial glow */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(225,29,72,0.12) 0%, transparent 70%)'
          }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />

          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center scroll-reveal">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-semibold tracking-widest uppercase mb-8">
              Start Today — Free for 14 Days
            </div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-[0.95]">
              Ready to transform<br />
              <span className="text-rose-500">your dojo?</span>
            </h2>
            <p className="text-white/40 text-xl leading-relaxed mb-12 max-w-xl mx-auto">
              Join hundreds of martial arts schools using DojoFlow to grow their business and focus on what matters: teaching.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <button
                onClick={() => setShowKaiOnboarding(true)}
                className="glow-cta group inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-[1.03]"
              >
                <MessageCircle className="w-4 h-4" />
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="inline-flex items-center gap-2 px-10 py-5 rounded-xl border border-white/10 text-white/60 text-sm font-semibold uppercase tracking-widest hover:border-white/25 hover:text-white transition-all duration-300">
                Schedule Demo
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/25 text-xs font-medium tracking-wide">
              {["14-day free trial", "No credit card required", "Cancel anytime"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-500/40" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════════════════════ */}
        <footer className="border-t border-white/[0.06] bg-[#050505] py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-10 mb-12">
              <div className="md:col-span-1">
                <img src="/Darkdojoflow.png" alt="DojoFlow" className="h-8 mb-4" />
                <p className="text-white/30 text-sm leading-relaxed">
                  The AI-powered operating system for martial arts schools.
                </p>
              </div>
              {[
                { heading: "Product", links: ["Schools", "Fitness Facilities", "Studios", "Pricing"] },
                { heading: "Company", links: ["About", "Blog", "Careers", "Contact"] },
                { heading: "Legal", links: ["Terms", "Privacy", "Cookies", "Security"] },
              ].map(({ heading, links }) => (
                <div key={heading}>
                  <div className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-4">{heading}</div>
                  <ul className="space-y-2.5">
                    {links.map((link) => (
                      <li key={link}>
                        <a href="#" className="text-white/25 text-sm hover:text-white/60 transition-colors">{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-white/20 text-xs">© 2025 DojoFlow. All rights reserved.</div>
              <div className="flex items-center gap-4">
                {/* Newsletter */}
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="Email address"
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-rose-500/50 w-44"
                  />
                  <button className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </footer>

      </div>

      {/* ── Overlays & Modals ── */}
      <CookieNotice />
      <FloatingVideoIcon 
        videoSrc="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/xlPpAInqwgOsOCeY.mp4"
        posterSrc="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/UKNGrFtBGFrYYUrA.jpg"
        heroRef={heroRef as React.RefObject<HTMLElement>}
      />
      <FloatingKaiButton onOpen={() => setShowKaiOnboarding(true)} />
      <ScrollIndicator />

      {showKaiOnboarding && (
        <KaiOnboardingFlow onClose={() => setShowKaiOnboarding(false)} />
      )}

      {showOnboarding && selectedCategory && (
        <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
          <DialogContent className="bg-[#111] border-white/10 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">
                Set up your {getCategoryName(selectedCategory)} workspace
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Step indicator */}
              <div className="flex gap-2 mb-4">
                {ONBOARDING_STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      step.id <= currentStep ? "bg-rose-500" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <p className="text-white/50 text-sm">{ONBOARDING_STEPS[currentStep - 1].title}</p>

              {currentStep === 1 && (
                <div className="space-y-3">
                  <Label className="text-white/70">School Name</Label>
                  <Input
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Dragon Martial Arts"
                    className="bg-white/5 border-white/10 text-white placeholder-white/20"
                  />
                </div>
              )}
              {currentStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-white/70">Your Name</Label>
                    <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Master Chen" className="bg-white/5 border-white/10 text-white placeholder-white/20 mt-1" />
                  </div>
                  <div>
                    <Label className="text-white/70">Email Address</Label>
                    <Input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="master@dragonma.com" className="bg-white/5 border-white/10 text-white placeholder-white/20 mt-1" />
                  </div>
                </div>
              )}
              {currentStep === 3 && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-white/70">Number of Locations</Label>
                    <Select onValueChange={setLocationCount}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 location</SelectItem>
                        <SelectItem value="2-5">2–5 locations</SelectItem>
                        <SelectItem value="6+">6+ locations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white/70 mb-2 block">Programs Offered</Label>
                    {["Karate", "BJJ", "Taekwondo", "MMA", "Kickboxing", "Judo"].map((p) => (
                      <div key={p} className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={programs.includes(p)}
                          onCheckedChange={() => handleProgramToggle(p)}
                          className="border-white/20"
                        />
                        <span className="text-white/60 text-sm">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {currentStep === 4 && (
                <div className="space-y-3">
                  <Label className="text-white/70">Current Student Count</Label>
                  <Select onValueChange={setStudentCount}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-50">0–50 students</SelectItem>
                      <SelectItem value="51-100">51–100 students</SelectItem>
                      <SelectItem value="101-200">101–200 students</SelectItem>
                      <SelectItem value="201-500">201–500 students</SelectItem>
                      <SelectItem value="500+">500+ students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={handlePrevStep} className="flex-1 border-white/10 text-white/60 hover:text-white">
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleNextStep}
                  disabled={!canProceed() || isCreating}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white"
                >
                  {isCreating ? "Creating..." : currentStep === ONBOARDING_STEPS.length ? "Create Workspace" : "Continue"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
}

// ── Contact Form Component ──────────────────────────────────────────────────
function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const contactMutation = trpc.contact?.sendMessage?.useMutation?.() ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setName(""); setEmail(""); setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.07] bg-[#0d0d0d] p-8 space-y-5">
      <div>
        <label className="block text-white/50 text-xs font-semibold tracking-wide uppercase mb-2">Full Name</label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Smith"
          className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-rose-500/40 focus:bg-white/8 transition-all"
          required
        />
      </div>
      <div>
        <label className="block text-white/50 text-xs font-semibold tracking-wide uppercase mb-2">Email Address</label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
          className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-rose-500/40 focus:bg-white/8 transition-all"
          required
        />
      </div>
      <div>
        <label className="block text-white/50 text-xs font-semibold tracking-wide uppercase mb-2">Message</label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your school..."
          rows={4}
          className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-rose-500/40 focus:bg-white/8 transition-all resize-none"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold uppercase tracking-widest transition-all duration-200 hover:scale-[1.01]"
      >
        Send Message
      </button>
    </form>
  );
}
