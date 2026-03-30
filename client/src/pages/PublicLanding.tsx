import { Link, useNavigate } from "react-router-dom";
import MainLayout from "@/components/MainLayout";
import {
  ArrowRight, Sparkles, Users, Calendar, CreditCard,
  MessageSquare, BarChart3, Star, Shield, Clock, Check, Brain, Award
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FloatingVideoIcon } from "@/components/FloatingVideoIcon";
import { KaiOnboardingFlow } from "@/components/KaiOnboardingFlow";
import { FloatingKaiButton } from "@/components/FloatingKaiButton";
import { trpc } from "@/lib/trpc";
import { useNavigate } from "react-router-dom";

const MOSAIC_TILES = [
  { src: "/industry-martial-arts.jpg", label: "Martial Arts" },
  { src: "/industry-gymnastics.jpg", label: "Gymnastics" },
  { src: "/industry-dance.jpg", label: "Dance", wide: true },
  { src: "/industry-karate.jpg", label: "Karate" },
  { src: "/industry-yoga.jpg", label: "Yoga & Pilates" },
  { src: "/industry-fitness.jpg", label: "Fitness & HIIT", wide: true },
  { src: "/industry-boxing.jpg", label: "Boxing & MMA" },
  { src: "/industry-dance2.jpg", label: "Performing Arts" },
  { src: "/martial-arts-class.jpg", label: "Group Classes" },
];

const INDUSTRIES = [
  {
    id: "martial-arts", name: "Martial Arts", icon: "🥋",
    image: "/industry-martial-arts.jpg",
    headline: "Built for the dojo. Designed for growth.",
    description: "From belt promotions to parent communications, DojoFlow handles every aspect of running a martial arts school — so you can focus on what you love: teaching.",
    features: ["Belt & rank progression tracking", "Automated tuition billing", "Parent portal & communications", "Class scheduling & attendance"],
    accent: "#e11d48",
  },
  {
    id: "gymnastics", name: "Gymnastics", icon: "🤸",
    image: "/industry-gymnastics.jpg",
    headline: "Precision management for precision athletes.",
    description: "Track skill progressions, manage team rosters, handle competition schedules, and keep parents in the loop — all from one platform built for gymnastics schools.",
    features: ["Skill progression tracking", "Competition scheduling", "Team & recreational programs", "Automated billing & contracts"],
    accent: "#7c3aed",
  },
  {
    id: "dance", name: "Dance", icon: "💃",
    image: "/industry-dance.jpg",
    headline: "Where artistry meets effortless management.",
    description: "Recital registrations, costume tracking, class rosters, and parent communications — DojoFlow keeps your studio running smoothly so you can focus on the performance.",
    features: ["Recital & event management", "Costume & fee tracking", "Multi-style class scheduling", "Waitlist & enrollment management"],
    accent: "#ec4899",
  },
  {
    id: "fitness", name: "Fitness & HIIT", icon: "🏋️",
    image: "/industry-fitness.jpg",
    headline: "Power your studio. Fuel your members.",
    description: "Membership management, class packs, drop-ins, and automated billing — DojoFlow gives boutique fitness studios the infrastructure to scale without the overhead.",
    features: ["Membership & class pack management", "Drop-in & punch card billing", "Trainer scheduling & payroll", "Member retention analytics"],
    accent: "#f97316",
  },
  {
    id: "yoga", name: "Yoga & Pilates", icon: "🧘",
    image: "/industry-yoga.jpg",
    headline: "Find balance in your business.",
    description: "Serene studios deserve seamless management. DojoFlow handles memberships, workshops, teacher scheduling, and client communications with calm intentionality.",
    features: ["Workshop & retreat registration", "Teacher scheduling & substitutions", "Membership & drop-in billing", "Client wellness tracking"],
    accent: "#14b8a6",
  },
  {
    id: "boxing", name: "Boxing & MMA", icon: "🥊",
    image: "/industry-boxing.jpg",
    headline: "Train hard. Run smart.",
    description: "From amateur fighters to recreational members, DojoFlow manages your gym's billing, scheduling, and communications so you can stay focused on what happens inside the ring.",
    features: ["Fighter & member management", "Sparring & class scheduling", "Automated monthly billing", "Waiver & contract management"],
    accent: "#eab308",
  },
];

const FEATURES = [
  { icon: Brain, title: "Kai AI — Your 24/7 Assistant", description: "Kai answers parent questions, sends reminders, handles enrollment inquiries, and surfaces insights — all without you lifting a finger.", accent: "#e11d48" },
  { icon: CreditCard, title: "Automated Billing", description: "Set it and forget it. Recurring tuition, class packs, drop-ins, and late fees — all collected automatically with zero manual effort.", accent: "#7c3aed" },
  { icon: Calendar, title: "Smart Scheduling", description: "Conflict-free class scheduling with room management, instructor assignments, and real-time capacity tracking across all your locations.", accent: "#14b8a6" },
  { icon: BarChart3, title: "Revenue Analytics", description: "Know exactly where your revenue comes from, which classes are most profitable, and which students are at risk of churning — before it happens.", accent: "#f97316" },
  { icon: MessageSquare, title: "Multi-Channel Communications", description: "SMS, email, and in-app messaging to students and parents — all from one place, with templates, automation, and delivery tracking.", accent: "#ec4899" },
  { icon: Award, title: "Progress & Achievement Tracking", description: "Belt ranks, skill milestones, attendance streaks, and achievement badges — keep students motivated and parents proud.", accent: "#eab308" },
];

const TESTIMONIALS = [
  { quote: "DojoFlow transformed how we run our school. Kai handles 80% of parent questions, billing is fully automated, and our revenue is up 40%. It's the best investment we've made.", name: "Master James Chen", title: "Owner, Dragon Martial Arts Academy", industry: "Martial Arts", avatar: "JC" },
  { quote: "We switched from three different tools to DojoFlow and cut our admin time in half. The gymnastics skill tracking alone is worth it — parents love seeing their kids' progress.", name: "Coach Sarah Williams", title: "Director, Elite Gymnastics Center", industry: "Gymnastics", avatar: "SW" },
  { quote: "Recital season used to be a nightmare. With DojoFlow, registration, costume fees, and parent communications are all handled automatically. I actually enjoy it now.", name: "Maria Santos", title: "Owner, Santos Dance Academy", industry: "Dance", avatar: "MS" },
  { quote: "Our membership retention went from 72% to 94% in six months. Kai identifies at-risk members before they cancel and sends personalized re-engagement messages. It's incredible.", name: "Tyler Brooks", title: "Founder, Apex Fitness Studio", industry: "Fitness", avatar: "TB" },
];

const PRICING = [
  { name: "Starter", price: "$99", period: "/mo", description: "Perfect for studios just getting started", features: ["Up to 100 students", "Kai AI (basic)", "Automated billing", "Class scheduling", "Email communications", "Standard support"], cta: "Start Free Trial", highlight: false },
  { name: "Growth", price: "$199", period: "/mo", description: "For growing studios ready to scale", features: ["Up to 500 students", "Kai AI (advanced)", "All billing features", "Multi-location support", "SMS + email comms", "Analytics dashboard", "Priority support"], cta: "Start Free Trial", highlight: true, badge: "Most Popular" },
  { name: "Scale", price: "$349", period: "/mo", description: "For established multi-location operations", features: ["Unlimited students", "Kai AI (enterprise)", "Advanced analytics", "Unlimited locations", "White-label options", "API access", "Dedicated success manager"], cta: "Start Free Trial", highlight: false, badge: "Most Powerful" },
  { name: "Enterprise", price: "Custom", period: "", description: "For franchises and large organizations", features: ["Custom student limits", "Custom AI training", "Custom integrations", "SLA guarantees", "On-site onboarding", "Legal & compliance support"], cta: "Contact Sales", highlight: false },
];

export default function PublicLanding() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [showKaiOnboarding, setShowKaiOnboarding] = useState(false);
  const createTrialMutation = trpc.trial.createTrialAccount.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Trial account created! Redirecting to dashboard...');
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        toast.error(result.message || 'Failed to create trial account');
      }
    },
    onError: (error) => {
      toast.error('Error creating trial account: ' + error.message);
    },
  });
  const [activeIndustry, setActiveIndustry] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [hoveredTile, setHoveredTile] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", school: "", industry: "", message: "" });
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("revealed"); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setActiveIndustry((p) => (p + 1) % INDUSTRIES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Message received! We'll be in touch within 24 hours.");
    setContactForm({ name: "", email: "", school: "", industry: "", message: "" });
    setContactLoading(false);
  };

  const navOpaque = scrollY > 60;

  return (
    <MainLayout transparentHeader hideFooter>
      <style>{`
        .df-landing { background: #050505; color: #fff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        .scroll-reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1); }
        .scroll-reveal.revealed { opacity: 1; transform: translateY(0); }
        .sr-d1 { transition-delay: 0.1s; } .sr-d2 { transition-delay: 0.2s; } .sr-d3 { transition-delay: 0.3s; } .sr-d4 { transition-delay: 0.4s; }
        .mosaic-tile { overflow: hidden; transition: filter 0.4s ease; }
        .pill { display:inline-flex;align-items:center;gap:8px;padding:13px 26px;border-radius:999px;font-size:15px;font-weight:600;letter-spacing:-0.01em;transition:all 0.25s cubic-bezier(0.16,1,0.3,1);cursor:pointer;border:none;text-decoration:none; }
        .pill-white { background:#fff;color:#050505; } .pill-white:hover { background:#e8e8e8;transform:translateY(-1px);box-shadow:0 8px 32px rgba(255,255,255,0.15); }
        .pill-ghost { background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.22); } .pill-ghost:hover { background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.45); }
        .pill-red { background:#e11d48;color:#fff; } .pill-red:hover { background:#be123c;transform:translateY(-1px);box-shadow:0 8px 32px rgba(225,29,72,0.35); }
        .ind-tab { transition:all 0.2s;border-bottom:2px solid transparent;padding:12px 20px;font-size:14px;font-weight:500;white-space:nowrap;cursor:pointer;background:none;border-top:none;border-left:none;border-right:none;color:rgba(255,255,255,0.4); }
        .ind-tab.active { border-bottom-color:#e11d48;color:#fff; } .ind-tab:not(.active):hover { color:rgba(255,255,255,0.75); }
        .feat-card { background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:32px;transition:all 0.3s cubic-bezier(0.16,1,0.3,1); }
        .feat-card:hover { background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.14);transform:translateY(-4px); }
        .price-card { background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;transition:border-color 0.3s; }
        .price-card:hover { border-color:rgba(255,255,255,0.18); }
        .price-card.featured { background:rgba(225,29,72,0.07);border-color:rgba(225,29,72,0.4); }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .marquee-track { animation:marquee 30s linear infinite;display:flex;width:max-content; }
        .marquee-track:hover { animation-play-state:paused; }
        @keyframes scrollBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
        .scroll-bounce { animation:scrollBounce 2s ease-in-out infinite; }
        @keyframes kaiPulse { 0%,100%{box-shadow:0 0 0 0 rgba(225,29,72,0.4)} 50%{box-shadow:0 0 0 12px rgba(225,29,72,0)} }
        .kai-pulse { animation:kaiPulse 2.5s ease-in-out infinite; }
        .hero-wordmark { font-size:clamp(4rem,12vw,11rem);font-weight:900;letter-spacing:-0.05em;line-height:0.9; }
        .stat-num { font-size:clamp(2.5rem,5vw,4rem);font-weight:800;letter-spacing:-0.04em;line-height:1; }
        .section-label { font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#e11d48;display:block; }
        .section-title { font-weight:800;letter-spacing:-0.04em;line-height:1.05;font-size:clamp(2rem,5vw,3.5rem); }
      `}</style>

      <div className="df-landing min-h-screen">

        {/* ── HERO ── */}
        <section ref={heroRef} className="relative flex flex-col items-center justify-center overflow-hidden" style={{ background: "#050505", height: "100vh", minHeight: "100vh" }}>
          {/* Mosaic grid */}
          <div className="absolute inset-0" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: "2px" }}>
            {MOSAIC_TILES.map((tile, i) => (
              <div key={i} className="mosaic-tile relative" style={{ gridColumn: tile.wide ? "span 2" : "span 1", filter: `brightness(${hoveredTile === i ? 0.65 : 0.32})` }} onMouseEnter={() => setHoveredTile(i)} onMouseLeave={() => setHoveredTile(null)}>
                <img src={tile.src} alt={tile.label} className="w-full h-full object-cover" loading="lazy" />
                {hoveredTile === i && (
                  <div className="absolute inset-0 flex items-end p-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.65)", color: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)" }}>{tile.label}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Vignette */}
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(5,5,5,0.9) 0%, rgba(5,5,5,0.5) 60%, rgba(5,5,5,0.78) 100%)" }} />

          {/* Content */}
          <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8 tracking-widest uppercase" style={{ background: "rgba(225,29,72,0.15)", border: "1px solid rgba(225,29,72,0.35)", color: "#fb7185" }}>
              <Sparkles size={11} /> Powered by Kai AI
            </div>
            <h1 className="hero-wordmark text-white mb-6">DojoFlow</h1>
            <p className="text-xl md:text-2xl font-light mb-3 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.72)", letterSpacing: "-0.01em" }}>The operating system for every studio, gym, and school.</p>
            <p className="text-sm md:text-base font-light mb-12" style={{ color: "rgba(255,255,255,0.36)" }}>Martial Arts · Gymnastics · Dance · Fitness · Yoga · Boxing</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => setShowKaiOnboarding(true)} className="pill pill-white">Start Free 7-Day Trial <ArrowRight size={16} /></button>
              <a href="#industries" className="pill pill-ghost">See All Industries</a>
            </div>
            <p className="mt-8 text-xs" style={{ color: "rgba(255,255,255,0.26)" }}>No credit card required · Cancel anytime · Full platform access from day one</p>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 scroll-bounce">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.26)" }}>Scroll</span>
            <div className="w-px h-8" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.26), transparent)" }} />
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <section className="py-5 overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="overflow-hidden">
            <div className="marquee-track">
              {[...Array(2)].flatMap(() => ["10,000+ Students Managed", "98% Retention Rate", "40% Revenue Growth", "6 Industries Served", "24/7 Kai AI Support", "7-Day Free Trial", "No Contracts", "White-Glove Onboarding"]).map((item, i) => (
                <span key={i} className="flex items-center gap-6 px-8 text-sm font-medium whitespace-nowrap" style={{ color: "rgba(255,255,255,0.32)" }}>
                  {item} <span className="w-1 h-1 rounded-full inline-block" style={{ background: "rgba(225,29,72,0.6)", flexShrink: 0 }} />
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── BRAND STATEMENT ── */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto text-center scroll-reveal">
            <h2 className="section-title font-bold mb-6">Every studio is different.<br /><span style={{ color: "rgba(255,255,255,0.3)" }}>The chaos is the same.</span></h2>
            <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.75 }}>Whether you teach karate, ballet, gymnastics, or HIIT — you're spending too much time on billing, scheduling, and parent emails. DojoFlow eliminates that overhead entirely, so you can focus on what you actually love.</p>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="py-20 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
            {[{ n: "10,000+", l: "Students managed" }, { n: "98%", l: "Average retention rate" }, { n: "40%", l: "Average revenue increase" }, { n: "6+", l: "Industries supported" }].map((s, i) => (
              <div key={i} className={`text-center scroll-reveal sr-d${i + 1}`}>
                <div className="stat-num text-white mb-2">{s.n}</div>
                <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.38)" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── INDUSTRIES ── */}
        <section id="industries" className="py-32 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 scroll-reveal">
              <span className="section-label mb-4">Industries</span>
              <h2 className="section-title">Built for your world.</h2>
            </div>
            <div className="flex gap-0 mb-12 overflow-x-auto pb-1 scroll-reveal sr-d1" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {INDUSTRIES.map((ind, i) => (
                <button key={ind.id} onClick={() => setActiveIndustry(i)} className={`ind-tab ${activeIndustry === i ? "active" : ""}`}>{ind.icon} {ind.name}</button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-10 items-center scroll-reveal sr-d2">
              <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <img src={INDUSTRIES[activeIndustry].image} alt={INDUSTRIES[activeIndustry].name} className="w-full h-full object-cover transition-all duration-700" style={{ filter: "brightness(0.72)" }} />
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${INDUSTRIES[activeIndustry].accent}22 0%, transparent 60%)` }} />
                <div className="absolute bottom-6 left-6 text-5xl">{INDUSTRIES[activeIndustry].icon}</div>
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-4" style={{ letterSpacing: "-0.03em", lineHeight: 1.2 }}>{INDUSTRIES[activeIndustry].headline}</h3>
                <p className="text-base font-light mb-8" style={{ color: "rgba(255,255,255,0.52)", lineHeight: 1.75 }}>{INDUSTRIES[activeIndustry].description}</p>
                <ul className="space-y-3 mb-8">
                  {INDUSTRIES[activeIndustry].features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-3 text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
                      <Check size={15} style={{ color: INDUSTRIES[activeIndustry].accent, flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setShowKaiOnboarding(true)} className="pill pill-red">Get Started for {INDUSTRIES[activeIndustry].name} <ArrowRight size={16} /></button>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-32 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 scroll-reveal">
              <span className="section-label mb-4">Features</span>
              <h2 className="section-title max-w-xl">Everything you need.<br /><span style={{ color: "rgba(255,255,255,0.3)" }}>Nothing you don't.</span></h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div key={i} className={`feat-card scroll-reveal sr-d${(i % 3) + 1}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: `${feat.accent}18`, border: `1px solid ${feat.accent}30` }}>
                      <Icon size={20} style={{ color: feat.accent }} />
                    </div>
                    <h3 className="text-base font-semibold mb-2" style={{ letterSpacing: "-0.02em" }}>{feat.title}</h3>
                    <p className="text-sm font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.48)" }}>{feat.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── KAI SPOTLIGHT ── */}
        <section className="py-32 px-6 relative overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(225,29,72,0.06) 0%, transparent 70%)" }} />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="scroll-reveal">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8 kai-pulse" style={{ background: "rgba(225,29,72,0.15)", border: "1px solid rgba(225,29,72,0.3)" }}>
                <Brain size={28} style={{ color: "#e11d48" }} />
              </div>
              <h2 className="section-title mb-6">Meet Kai.<br /><span style={{ color: "rgba(255,255,255,0.35)" }}>Your AI studio manager.</span></h2>
              <p className="text-lg font-light mb-12 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.48)", lineHeight: 1.75 }}>Kai is always on. It answers parent questions at 2am, sends automated reminders, identifies students at risk of churning, and surfaces revenue opportunities — all without you being involved.</p>
            </div>
            <div className="rounded-2xl p-6 text-left max-w-lg mx-auto scroll-reveal sr-d1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center kai-pulse" style={{ background: "rgba(225,29,72,0.2)", border: "1px solid rgba(225,29,72,0.4)" }}><Brain size={14} style={{ color: "#e11d48" }} /></div>
                <div><div className="text-sm font-semibold">Kai AI</div><div className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>Always available</div></div>
                <div className="ml-auto flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: "#34d399" }} /><span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>Online</span></div>
              </div>
              {[
                { from: "parent", text: "Hi, what time is the Thursday 6pm class?" },
                { from: "kai", text: "Hi Sarah! Thursday's 6pm Intermediate Karate runs until 7:15pm in Studio A. Jake is enrolled and his attendance has been great — 12 of the last 14 classes! 🥋" },
                { from: "parent", text: "Perfect! Can I add him to Saturday's class too?" },
                { from: "kai", text: "Done! Jake is now enrolled in Saturday 10am Karate. You'll receive a confirmation email shortly. Anything else I can help with?" },
              ].map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "parent" ? "justify-end" : "justify-start"} mb-3`}>
                  <div className="max-w-xs text-sm px-4 py-2.5 rounded-2xl" style={{ background: msg.from === "parent" ? "rgba(255,255,255,0.1)" : "rgba(225,29,72,0.15)", border: msg.from === "kai" ? "1px solid rgba(225,29,72,0.2)" : "none", color: "rgba(255,255,255,0.85)", lineHeight: 1.55 }}>{msg.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="py-32 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 scroll-reveal">
              <span className="section-label mb-4">Testimonials</span>
              <h2 className="section-title">Trusted by studios<br /><span style={{ color: "rgba(255,255,255,0.3)" }}>across every discipline.</span></h2>
            </div>
            <div className="rounded-2xl p-10 mb-6 scroll-reveal sr-d1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: "rgba(225,29,72,0.2)", color: "#fb7185" }}>{TESTIMONIALS[activeTestimonial].avatar}</div>
                <div>
                  <div className="font-semibold text-sm">{TESTIMONIALS[activeTestimonial].name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.42)" }}>{TESTIMONIALS[activeTestimonial].title}</div>
                  <div className="flex gap-0.5 mt-1.5">{Array.from({ length: 5 }).map((_, si) => <Star key={si} size={12} fill="#e11d48" style={{ color: "#e11d48" }} />)}</div>
                </div>
                <div className="ml-auto px-3 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>{TESTIMONIALS[activeTestimonial].industry}</div>
              </div>
              <p className="text-lg font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.8)", letterSpacing: "-0.01em" }}>"{TESTIMONIALS[activeTestimonial].quote}"</p>
            </div>
            <div className="flex items-center gap-3">
              {TESTIMONIALS.map((_, ti) => (
                <button key={ti} onClick={() => setActiveTestimonial(ti)} className="rounded-full transition-all duration-300" style={{ width: ti === activeTestimonial ? "24px" : "8px", height: "8px", background: ti === activeTestimonial ? "#e11d48" : "rgba(255,255,255,0.2)" }} />
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="py-32 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center scroll-reveal">
              <span className="section-label mb-4">Pricing</span>
              <h2 className="section-title mb-4">Simple, transparent pricing.</h2>
              <p className="text-base font-light" style={{ color: "rgba(255,255,255,0.42)" }}>Start free for 7 days. No credit card required.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PRICING.map((plan, i) => (
                <div key={i} className={`price-card ${plan.highlight ? "featured" : ""} scroll-reveal sr-d${i + 1} relative`}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap" style={{ background: plan.highlight ? "#e11d48" : "rgba(255,255,255,0.1)", color: "#fff" }}>{plan.badge}</div>
                  )}
                  <div className="mb-6">
                    <div className="text-sm font-semibold mb-1">{plan.name}</div>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-4xl font-black" style={{ letterSpacing: "-0.04em" }}>{plan.price}</span>
                      <span className="text-sm pb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>{plan.period}</span>
                    </div>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{plan.description}</p>
                  </div>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2.5 text-xs" style={{ color: "rgba(255,255,255,0.68)" }}>
                        <Check size={13} className="mt-0.5 flex-shrink-0" style={{ color: plan.highlight ? "#fb7185" : "rgba(255,255,255,0.38)" }} />{f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => setShowKaiOnboarding(true)} className={`w-full pill ${plan.highlight ? "pill-red" : "pill-ghost"} justify-center text-sm`}>{plan.cta}</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section id="contact" className="py-32 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-start">
            <div className="scroll-reveal">
              <span className="section-label mb-4">Get in Touch</span>
              <h2 className="font-bold mb-6" style={{ fontSize: "clamp(1.8rem,4vw,3rem)", letterSpacing: "-0.04em", lineHeight: 1.1 }}>Ready to transform your studio?</h2>
              <p className="text-base font-light mb-10" style={{ color: "rgba(255,255,255,0.48)", lineHeight: 1.75 }}>Our team will personally walk you through the platform, answer every question, and make sure DojoFlow is the right fit for your business.</p>
              <div className="space-y-4">
                {[{ icon: Clock, label: "Response within 24 hours", sub: "We reply to every inquiry personally" }, { icon: Shield, label: "Enterprise-grade security", sub: "SOC 2 compliant, data encrypted at rest" }, { icon: Users, label: "White-glove onboarding", sub: "We migrate your data and train your team" }].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(225,29,72,0.12)", border: "1px solid rgba(225,29,72,0.2)" }}><Icon size={16} style={{ color: "#e11d48" }} /></div>
                      <div><div className="text-sm font-semibold">{item.label}</div><div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>{item.sub}</div></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-2xl p-8 scroll-reveal sr-d1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                {[{ key: "name", label: "Your Name", placeholder: "Master John Smith", type: "text" }, { key: "email", label: "Email Address", placeholder: "john@yourstudio.com", type: "email" }, { key: "school", label: "Studio / School Name", placeholder: "Dragon Martial Arts Academy", type: "text" }].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>{field.label}</label>
                    <input type={field.type} placeholder={field.placeholder} value={contactForm[field.key as keyof typeof contactForm]} onChange={e => setContactForm(p => ({ ...p, [field.key]: e.target.value }))} required className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>Industry</label>
                  <select value={contactForm.industry} onChange={e => setContactForm(p => ({ ...p, industry: e.target.value }))} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }}>
                    <option value="" style={{ background: "#111" }}>Select your industry</option>
                    {INDUSTRIES.map(ind => <option key={ind.id} value={ind.id} style={{ background: "#111" }}>{ind.icon} {ind.name}</option>)}
                    <option value="other" style={{ background: "#111" }}>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>Message</label>
                  <textarea placeholder="Tell us about your studio..." value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} rows={4} className="w-full px-4 py-3 rounded-xl text-sm resize-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }} />
                </div>
                <button type="submit" disabled={contactLoading} className="w-full pill pill-red justify-center">{contactLoading ? "Sending..." : "Send Message"}{!contactLoading && <ArrowRight size={16} />}</button>
              </form>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-40 px-6 relative overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 80% at 50% 50%, rgba(225,29,72,0.07) 0%, transparent 70%)" }} />
          <div className="max-w-3xl mx-auto text-center relative z-10 scroll-reveal">
            <h2 className="font-bold mb-6" style={{ fontSize: "clamp(2.5rem,7vw,5rem)", letterSpacing: "-0.05em", lineHeight: 0.95 }}>Your studio.<br /><span style={{ color: "rgba(255,255,255,0.28)" }}>Fully automated.</span></h2>
            <p className="text-lg font-light mb-12" style={{ color: "rgba(255,255,255,0.38)" }}>Join thousands of studio owners who've reclaimed their time with DojoFlow.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => setShowKaiOnboarding(true)} className="pill pill-white" style={{ padding: "16px 32px", fontSize: "16px" }}>Start Free 7-Day Trial <ArrowRight size={18} /></button>
              <a href="#contact" className="pill pill-ghost" style={{ padding: "16px 32px", fontSize: "16px" }}>Talk to Sales</a>
            </div>
            <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>No credit card · No contracts · Full access from day one</p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="py-16 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-5 gap-10 mb-12">
              <div className="md:col-span-2">
                <img src="/Lightdojoflow.png" alt="DojoFlow" className="h-7 w-auto mb-4" />
                <p className="text-sm font-light mb-6" style={{ color: "rgba(255,255,255,0.38)", lineHeight: 1.75 }}>The AI-powered operating system for martial arts schools, gymnastics studios, dance academies, fitness centers, and more.</p>
                <div className="flex gap-3">
                  {["Twitter", "Instagram", "LinkedIn"].map(s => (
                    <a key={s} href="#" className="text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>{s}</a>
                  ))}
                </div>
              </div>
              {[
                { title: "Product", links: ["Features", "Pricing", "Integrations", "Changelog"] },
                { title: "Industries", links: ["Martial Arts", "Gymnastics", "Dance", "Fitness", "Yoga & Pilates", "Boxing & MMA"] },
                { title: "Company", links: ["About", "Blog", "Careers", "Privacy", "Terms"] },
              ].map(col => (
                <div key={col.title}>
                  <div className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "rgba(255,255,255,0.28)" }}>{col.title}</div>
                  <ul className="space-y-2.5">
                    {col.links.map(link => (
                      <li key={link}><a href="#" className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>{link}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>© {new Date().getFullYear()} DojoFlow. All rights reserved.</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>dojo-flow.ai</p>
            </div>
          </div>
        </footer>

      </div>

      <FloatingKaiButton onClick={() => setShowKaiOnboarding(true)} />
      <FloatingVideoIcon videoSrc="/dojo-promo.mp4" posterSrc="/hero-martial-arts.jpg" heroRef={heroRef as React.RefObject<HTMLElement>} />
      {showKaiOnboarding && (
        <KaiOnboardingFlow
          isActive={showKaiOnboarding}
          onClose={() => setShowKaiOnboarding(false)}
          onComplete={(data) => {
            console.log('Onboarding completed:', data);
            setShowKaiOnboarding(false);
            
            // Create trial account with onboarding data
            createTrialMutation.mutate({
              organizationName: data.organizationName,
              ownerEmail: data.ownerEmail,
              ownerName: data.ownerName,
              businessType: data.businessType,
              studentCount: data.studentCount,
              locationCount: data.locationCount,
              timezone: data.timezone,
            });
          }}
        />
      )}
    </MainLayout>
  );
}
