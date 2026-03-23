import { useState, useEffect, useRef } from "react";
import { ArrowRight, Play, Zap, Users, Calendar, BarChart3, Shield, Smartphone, Brain, ChevronDown, Star, Check, Menu, X } from "lucide-react";

// ─── Animated Counter Hook ───────────────────────────────────────────────────
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ─── Intersection Observer Hook ──────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Stats Counter Component ─────────────────────────────────────────────────
function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, inView } = useInView();
  const count = useCounter(value, 2200, inView);
  return (
    <div ref={ref} className="text-center">
      <div className="text-5xl md:text-6xl font-black text-white mb-2">
        {count.toLocaleString()}<span className="text-red-500">{suffix}</span>
      </div>
      <div className="text-gray-400 text-sm uppercase tracking-widest font-medium">{label}</div>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, delay }: {
  icon: React.ElementType; title: string; description: string; delay: number;
}) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className="group relative bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 hover:bg-white/[0.06] hover:border-red-500/30 transition-all duration-500 cursor-default"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, background 0.3s, border 0.3s`,
      }}
    >
      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 group-hover:bg-red-500/20 group-hover:border-red-500/40 transition-all duration-300">
        <Icon className="w-6 h-6 text-red-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">{description}</p>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/0 to-transparent group-hover:via-red-500/40 transition-all duration-500 rounded-b-2xl" />
    </div>
  );
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────
function TestimonialCard({ quote, author, role, school, rating }: {
  quote: string; author: string; role: string; school: string; rating: number;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 flex flex-col gap-6 hover:border-red-500/20 transition-all duration-300">
      <div className="flex gap-1">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-red-500 text-red-500" />
        ))}
      </div>
      <p className="text-gray-300 leading-relaxed text-base italic flex-1">"{quote}"</p>
      <div className="flex items-center gap-4 pt-2 border-t border-white/[0.06]">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {author.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <div className="text-white font-semibold text-sm">{author}</div>
          <div className="text-gray-500 text-xs">{role} · {school}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => { clearTimeout(timer); window.removeEventListener('scroll', handleScroll); };
  }, []);

  const features = [
    {
      icon: Brain,
      title: "Kai — Your AI Command Center",
      description: "Kai learns your dojo's unique patterns and proactively surfaces insights, automates follow-ups, and keeps your operation running at peak performance — 24/7.",
      delay: 0,
    },
    {
      icon: Users,
      title: "Student & Member Management",
      description: "Complete student profiles, belt progression tracking, attendance history, family accounts, and automated renewal reminders — all in one place.",
      delay: 100,
    },
    {
      icon: Calendar,
      title: "Class Scheduling & Booking",
      description: "Drag-and-drop class builder, online booking for members, waitlist management, and automated class reminders via SMS and email.",
      delay: 200,
    },
    {
      icon: BarChart3,
      title: "Lead Pipeline & Sales Funnel",
      description: "Kanban-style lead board with AI-powered follow-up sequences, lead scoring, intro scheduling, and conversion analytics to maximize enrollment.",
      delay: 300,
    },
    {
      icon: Shield,
      title: "Integrated Billing & Payments",
      description: "Automated recurring billing, failed payment recovery, point-of-sale, invoicing, and real-time revenue dashboards — get paid without the stress.",
      delay: 400,
    },
    {
      icon: Smartphone,
      title: "Multi-Location & Kiosk Mode",
      description: "Manage multiple school locations from a single dashboard. Deploy self-check-in kiosks, track attendance across locations, and unify your reporting.",
      delay: 500,
    },
  ];

  const testimonials = [
    {
      quote: "DojoFlow's ability to translate concepts into high-fidelity solutions is impressive. Kai handles our follow-ups automatically — our enrollment rate jumped 40% in 3 months.",
      author: "Kevin Alvarez",
      role: "Head Instructor",
      school: "Elite Martial Arts Academy",
      rating: 5,
    },
    {
      quote: "The team is extremely communicative and their work is exceptional. We replaced 4 different tools with DojoFlow and cut our admin time in half.",
      author: "George Fry",
      role: "Owner",
      school: "Fry's Karate Center",
      rating: 5,
    },
    {
      quote: "Top-notch outcomes with exceptional design. The lead pipeline alone paid for the entire subscription in the first week. I can't imagine running our dojo without it.",
      author: "Andre Guerra",
      role: "Co-Owner",
      school: "Guerra BJJ & MMA",
      rating: 5,
    },
    {
      quote: "Kai is like having a full-time admin who never sleeps. It follows up with leads, sends reminders, and flags students at risk of dropping — all automatically.",
      author: "Sarah Mitchell",
      role: "Studio Director",
      school: "Mitchell's Taekwondo",
      rating: 5,
    },
    {
      quote: "Switching to DojoFlow was the best business decision we made this year. The dashboard gives us a real-time view of everything — revenue, attendance, leads, all of it.",
      author: "Marcus Chen",
      role: "Founder",
      school: "Chen's Kung Fu Institute",
      rating: 5,
    },
    {
      quote: "We run 3 locations and DojoFlow makes it feel like one. The multi-location reporting is incredible — we finally have visibility across the whole business.",
      author: "Lisa Torres",
      role: "Operations Manager",
      school: "Torres Martial Arts Group",
      rating: 5,
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: 99,
      description: "Perfect for single-location dojos just getting started.",
      features: ["Up to 150 students", "Kai AI Assistant (Basic)", "Class scheduling & booking", "Integrated billing", "Email & SMS reminders", "Mobile app access"],
      cta: "Start Free Trial",
      highlighted: false,
    },
    {
      name: "Growth",
      price: 199,
      description: "The complete system for growing martial arts schools.",
      features: ["Up to 500 students", "Kai AI Assistant (Full)", "Lead pipeline & CRM", "Advanced analytics", "Kiosk check-in mode", "Priority support", "Everything in Starter"],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: 399,
      description: "Built for multi-location groups and franchise operations.",
      features: ["Unlimited students", "Multi-location dashboard", "Custom AI training for Kai", "White-label options", "Dedicated account manager", "Custom integrations", "Everything in Growth"],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  const dashboardTabs = [
    { label: "Dashboard", emoji: "📊" },
    { label: "Lead Pipeline", emoji: "🎯" },
    { label: "Students", emoji: "🥋" },
    { label: "Billing", emoji: "💳" },
  ];

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* ── NAVIGATION ─────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/40">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">
              Dojo<span className="text-red-500">Flow</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing', 'Testimonials', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-gray-400 hover:text-white transition-colors text-sm font-medium tracking-wide"
              >
                {item}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/login" className="text-gray-400 hover:text-white transition-colors text-sm font-medium px-4 py-2">
              Sign In
            </a>
            <a
              href="/login"
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-red-900/30 hover:shadow-red-900/50"
            >
              Get Started Free
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0d0d0d] border-t border-white/[0.06] px-6 py-6 space-y-4">
            {['Features', 'Pricing', 'Testimonials', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="block text-gray-300 hover:text-white py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {item}
              </a>
            ))}
            <div className="pt-4 border-t border-white/[0.06] flex flex-col gap-3">
              <a href="/login" className="text-center text-gray-400 py-2 text-sm">Sign In</a>
              <a href="/login" className="bg-red-600 text-white text-center font-bold py-3 rounded-lg text-sm">Get Started Free</a>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO SECTION ───────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {/* Gradient base */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0d0a0a] to-[#0a0a0a]" />
          {/* Red glow orb top-right */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-900/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
          {/* Subtle red glow bottom-left */}
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-900/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3" />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div className="space-y-8">
            {/* Eyebrow */}
            <div
              className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
              }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-semibold uppercase tracking-widest">The #1 Martial Arts CRM</span>
            </div>

            {/* Headline */}
            <div
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.7s ease 0.25s, transform 0.7s ease 0.25s',
              }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                Run Your Dojo<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600">
                  Like a Champion.
                </span>
              </h1>
            </div>

            {/* Subheadline */}
            <p
              className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-lg"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s',
              }}
            >
              DojoFlow is the all-in-one management platform built exclusively for martial arts schools. Powered by <strong className="text-white">Kai</strong>, your AI command center — automate operations, grow enrollment, and keep students for life.
            </p>

            {/* Award badges */}
            <div
              className="flex flex-wrap gap-4"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.7s ease 0.5s, transform 0.7s ease 0.5s',
              }}
            >
              {[
                { label: "Best Martial Arts CRM", sub: "Software Advice" },
                { label: "Top Rated 2025", sub: "G2 Reviews" },
                { label: "Best Ease of Use", sub: "Capterra" },
              ].map((badge) => (
                <div key={badge.label} className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-red-500 text-red-500" />)}
                  </div>
                  <div>
                    <div className="text-white text-xs font-semibold">{badge.label}</div>
                    <div className="text-gray-500 text-xs">{badge.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row gap-4"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.7s ease 0.6s, transform 0.7s ease 0.6s',
              }}
            >
              <a
                href="/login?tab=signup"
                className="group flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-4 rounded-xl text-base transition-all duration-200 shadow-xl shadow-red-900/40 hover:shadow-red-900/60 hover:-translate-y-0.5"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <button className="group flex items-center justify-center gap-3 border border-white/[0.12] hover:border-white/25 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all duration-200 hover:bg-white/[0.04]">
                <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center group-hover:bg-red-600/30 transition-colors">
                  <Play className="w-3 h-3 text-red-400 ml-0.5" />
                </div>
                Watch Demo
              </button>
            </div>

            {/* Trust line */}
            <p
              className="text-gray-600 text-sm"
              style={{
                opacity: heroVisible ? 1 : 0,
                transition: 'opacity 0.7s ease 0.75s',
              }}
            >
              No credit card required · 7-day free trial · Cancel anytime
            </p>
          </div>

          {/* Right: Dashboard Mockup */}
          <div
            className="relative hidden lg:block"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateX(0) translateY(0)' : 'translateX(40px) translateY(20px)',
              transition: 'opacity 0.9s ease 0.5s, transform 0.9s ease 0.5s',
            }}
          >
            {/* Glow behind mockup */}
            <div className="absolute inset-0 bg-red-600/10 rounded-3xl blur-3xl scale-110" />

            {/* Browser chrome */}
            <div className="relative bg-[#111] rounded-2xl border border-white/[0.1] overflow-hidden shadow-2xl shadow-black/60">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-4 bg-[#0d0d0d] rounded-md px-3 py-1 text-xs text-gray-600 font-mono">
                  app.dojoflow.com/dashboard
                </div>
              </div>

              {/* Dashboard Preview */}
              <div className="p-4 bg-[#0d0d0d]">
                {/* Tab bar */}
                <div className="flex gap-1 mb-4 bg-[#111] rounded-lg p-1">
                  {dashboardTabs.map((tab, i) => (
                    <button
                      key={tab.label}
                      onClick={() => setActiveTab(i)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        activeTab === i ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <span>{tab.emoji}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: "Active Students", value: "247", change: "+12", up: true },
                    { label: "Monthly Revenue", value: "$18.4K", change: "+8%", up: true },
                    { label: "New Leads", value: "34", change: "+5", up: true },
                    { label: "Retention Rate", value: "94%", change: "+2%", up: true },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#111] rounded-xl p-3 border border-white/[0.06]">
                      <div className="text-gray-500 text-[10px] mb-1">{stat.label}</div>
                      <div className="text-white font-bold text-base">{stat.value}</div>
                      <div className="text-green-400 text-[10px] font-medium">{stat.change}</div>
                    </div>
                  ))}
                </div>

                {/* Chart placeholder */}
                <div className="bg-[#111] rounded-xl p-4 border border-white/[0.06] mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white text-xs font-semibold">Enrollment Growth</span>
                    <span className="text-gray-500 text-[10px]">Last 6 months</span>
                  </div>
                  <div className="flex items-end gap-1 h-16">
                    {[40, 55, 48, 70, 65, 88].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-red-700 to-red-500 transition-all duration-500" style={{ height: `${h}%`, opacity: 0.7 + i * 0.05 }} />
                    ))}
                  </div>
                </div>

                {/* Recent activity */}
                <div className="bg-[#111] rounded-xl p-3 border border-white/[0.06]">
                  <div className="text-white text-xs font-semibold mb-2">Kai's Recent Actions</div>
                  {[
                    { action: "Sent follow-up to 3 new leads", time: "2m ago", color: "bg-blue-500" },
                    { action: "Flagged 2 students at dropout risk", time: "15m ago", color: "bg-yellow-500" },
                    { action: "Processed 12 billing renewals", time: "1h ago", color: "bg-green-500" },
                  ].map((item) => (
                    <div key={item.action} className="flex items-center gap-2 py-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.color} flex-shrink-0`} />
                      <span className="text-gray-400 text-[10px] flex-1">{item.action}</span>
                      <span className="text-gray-600 text-[10px]">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -left-8 top-1/4 bg-[#111] border border-white/[0.1] rounded-xl px-4 py-3 shadow-xl">
              <div className="text-green-400 text-xs font-bold">↑ 40%</div>
              <div className="text-gray-400 text-[10px]">Enrollment</div>
            </div>
            <div className="absolute -right-6 bottom-1/4 bg-[#111] border border-white/[0.1] rounded-xl px-4 py-3 shadow-xl">
              <div className="text-red-400 text-xs font-bold">Kai Active</div>
              <div className="text-gray-400 text-[10px]">AI Running 24/7</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-gray-600 text-xs uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </div>
      </section>

      {/* ── STATS SECTION ──────────────────────────────────────────────────── */}
      <section className="relative py-20 border-y border-white/[0.06] bg-[#0d0d0d]">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/5 via-transparent to-red-900/5" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <StatCounter value={1200} suffix="+" label="Dojos Powered" />
            <StatCounter value={94} suffix="%" label="Avg Retention Rate" />
            <StatCounter value={40} suffix="%" label="Enrollment Increase" />
            <StatCounter value={500000} suffix="+" label="Students Managed" />
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ───────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-red-400 text-xs font-semibold uppercase tracking-widest">Everything You Need</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              One Platform.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">Infinite Power.</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              DojoFlow replaces every tool you're juggling — spreadsheets, scheduling apps, billing software, and CRMs — with a single, beautifully unified system.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* ── KAI SPOTLIGHT SECTION ──────────────────────────────────────────── */}
      <section className="relative py-28 px-6 overflow-hidden bg-[#0d0d0d]">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/10 rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          {/* Left: Kai visual */}
          <div className="relative flex items-center justify-center order-2 lg:order-1">
            {/* Outer rings */}
            <div className="absolute w-80 h-80 rounded-full border border-red-500/10 animate-spin" style={{ animationDuration: '20s' }} />
            <div className="absolute w-64 h-64 rounded-full border border-red-500/15 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
            <div className="absolute w-48 h-48 rounded-full border border-red-500/20 animate-spin" style={{ animationDuration: '10s' }} />
            {/* Connection dots */}
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <div
                key={deg}
                className="absolute w-2 h-2 rounded-full bg-red-500/60"
                style={{
                  transform: `rotate(${deg}deg) translateX(128px)`,
                  boxShadow: '0 0 8px rgba(239,68,68,0.8)',
                }}
              />
            ))}
            {/* Center orb */}
            <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/20 border border-red-500/30 flex items-center justify-center shadow-2xl shadow-red-900/40 backdrop-blur-sm">
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-red-500/20 to-transparent animate-pulse" />
              <div className="relative text-center">
                <div className="text-3xl font-black text-white">Kai</div>
                <div className="text-red-400 text-xs font-medium">AI Active</div>
              </div>
            </div>
            {/* Floating action cards */}
            {[
              { label: "Lead followed up", icon: "✉️", pos: "top-4 right-4" },
              { label: "Class reminder sent", icon: "📅", pos: "bottom-4 left-4" },
              { label: "Payment processed", icon: "💳", pos: "bottom-4 right-4" },
            ].map((card) => (
              <div key={card.label} className={`absolute ${card.pos} bg-[#111] border border-white/[0.1] rounded-xl px-3 py-2 shadow-xl flex items-center gap-2`}>
                <span className="text-sm">{card.icon}</span>
                <span className="text-white text-xs font-medium">{card.label}</span>
              </div>
            ))}
          </div>

          {/* Right: Text */}
          <div className="space-y-8 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2">
              <span className="text-red-400 text-xs font-semibold uppercase tracking-widest">Meet Kai</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight">
              Your AI That Never<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">Clocks Out.</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Kai is DojoFlow's built-in AI command center. It monitors your entire operation in real time — following up with leads, flagging at-risk students, processing renewals, and surfacing insights you'd never find manually.
            </p>
            <div className="space-y-4">
              {[
                "Automatically follows up with new leads within minutes",
                "Identifies students at risk of dropping before they leave",
                "Generates custom email & SMS campaigns with AI",
                "Answers student questions 24/7 via your website",
                "Learns your dojo's patterns and gets smarter over time",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-red-400" />
                  </div>
                  <span className="text-gray-300 text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
            <a
              href="/login?tab=signup"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-4 rounded-xl text-base transition-all duration-200 shadow-xl shadow-red-900/40 hover:-translate-y-0.5"
            >
              Talk to Kai <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-red-400 text-xs font-semibold uppercase tracking-widest">Real Results</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Trusted by Champions<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">Across the Country.</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Over 1,200 martial arts schools use DojoFlow to grow enrollment, retain students, and run a tighter operation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <TestimonialCard key={t.author} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 px-6 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-red-400 text-xs font-semibold uppercase tracking-widest">Simple Pricing</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Invest in Your Dojo's<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">Future Growth.</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              All plans include a 7-day free trial. No credit card required. Cancel anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 border transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-red-950/60 to-[#0d0d0d] border-red-500/40 shadow-2xl shadow-red-900/20 scale-105'
                    : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-red-900/40">
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                </div>
                <div className="mb-8">
                  <span className="text-5xl font-black text-white">${plan.price}</span>
                  <span className="text-gray-500 text-sm ml-2">/month</span>
                </div>
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.highlighted ? 'bg-red-600/30 border border-red-500/50' : 'bg-white/[0.06] border border-white/[0.12]'
                      }`}>
                        <Check className={`w-3 h-3 ${plan.highlighted ? 'text-red-400' : 'text-gray-400'}`} />
                      </div>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <a
                  href="/login?tab=signup"
                  className={`block text-center font-bold py-3.5 rounded-xl text-sm transition-all duration-200 ${
                    plan.highlighted
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40 hover:-translate-y-0.5'
                      : 'border border-white/[0.12] hover:border-white/25 text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
      <section id="contact" className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-900/20 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/5 to-transparent" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-semibold uppercase tracking-widest">Ready to Dominate?</span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
            Your Dojo Deserves<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600">
              the Best Tools.
            </span>
          </h2>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
            Join over 1,200 martial arts schools that have transformed their operations with DojoFlow. Start your free trial today — no credit card, no commitment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/login?tab=signup"
              className="group flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-10 py-5 rounded-xl text-lg transition-all duration-200 shadow-2xl shadow-red-900/40 hover:shadow-red-900/60 hover:-translate-y-1"
            >
              Start Free Trial — 7 Days
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <button className="flex items-center justify-center gap-3 border border-white/[0.12] hover:border-white/25 text-white font-semibold px-10 py-5 rounded-xl text-lg transition-all duration-200 hover:bg-white/[0.04]">
              <Play className="w-4 h-4 text-red-400" />
              Book a Live Demo
            </button>
          </div>
          <p className="text-gray-600 text-sm">No credit card required · Setup in under 10 minutes · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-[#0d0d0d] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black">Dojo<span className="text-red-500">Flow</span></span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                The all-in-one martial arts management platform. Powered by Kai AI. Built for champions.
              </p>
              <p className="text-gray-600 text-xs">sales@dojoflow.com</p>
            </div>

            {/* Links */}
            {[
              { title: "Product", links: ["Features", "Pricing", "Kai AI", "Integrations", "Changelog"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Press", "Contact"] },
              { title: "Support", links: ["Help Center", "Documentation", "Status", "Security", "Privacy"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">© 2026 DojoFlow. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">Terms</a>
              <a href="#" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
