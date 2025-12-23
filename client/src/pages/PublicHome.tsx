import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Users, Calendar, BarChart3, Sparkles, Zap, Shield, TrendingUp, Check } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Public Marketing Landing Page - Redesigned with Real Product Screenshots
 * Features: Hero with Kai Command screenshot, product showcase with 4 feature images
 */
export default function PublicHome() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src="/kai-avatar.png" alt="DojoFlow" className="w-8 h-8" />
            <span className="font-bold text-xl">DojoFlow</span>
          </div>
          
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              How It Works
            </a>
            <Link to="/owner">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10">
                Owner Login
              </Button>
            </Link>
            <Link to="/owner">
              <Button size="sm" className="bg-gradient-to-r from-[#ED393D] to-[#FF6B6B] hover:from-[#D9292D] hover:to-[#FF5555] shadow-lg shadow-red-500/30">
                Start Free Trial
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section - With Kai Command Screenshot */}
      <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden py-20">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at ${50 + scrollY * 0.05}% ${50 + scrollY * 0.03}%, #ED393D 0%, transparent 50%)`,
              transform: `translateY(${scrollY * 0.3}px)`
            }}
          />
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at ${30 - scrollY * 0.03}% ${70 - scrollY * 0.05}%, #FFD700 0%, transparent 50%)`,
              transform: `translateY(${scrollY * 0.5}px)`
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container max-w-7xl mx-auto px-6">
          {/* Headline */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-[#ED393D]/20 to-[#FFD700]/20 border border-[#ED393D]/30 rounded-full">
              <span className="text-sm font-semibold text-[#FFD700]">✨ AI-Powered Dojo Management</span>
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-6">
              <span className="block bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Your Dojo's
              </span>
              <span className="block bg-gradient-to-r from-[#ED393D] via-[#FF6B6B] to-[#FFD700] bg-clip-text text-transparent">
                Command Center
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              AI-powered decisions for growth, retention, and operations. Run your martial arts school in minutes, not hours.
            </p>

            {/* CTA */}
            <div className="flex flex-col items-center gap-4 mb-16">
              <Link to="/owner">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-[#ED393D] to-[#FF6B6B] hover:from-[#D9292D] hover:to-[#FF5555] h-14 px-10 text-lg font-semibold shadow-2xl shadow-red-500/40 hover:shadow-red-500/60 transition-all duration-300 hover:scale-105"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <p className="text-sm text-slate-400">
                14-day free trial • No credit card required
              </p>
            </div>
          </div>

          {/* Hero Image - Kai Command Screenshot */}
          <div className="relative max-w-6xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-red-500/20 border border-white/10">
              <img 
                src="/01-kai-command-hero.png" 
                alt="DojoFlow Kai Command Center" 
                className="w-full h-auto"
              />
              {/* Overlay glow effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
            </div>
            {/* Floating stats cards */}
            <div className="absolute -bottom-8 left-8 bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">98%</div>
                  <div className="text-xs text-slate-400">Accuracy</div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 right-8 bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ED393D] to-[#FF6B6B] rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-xs text-slate-400">AI Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - With Real Product Screenshots */}
      <section id="features" className="container py-32 max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything you need to run a professional dojo
          </h2>
          <p className="text-xl text-slate-400">
            Real software. Real results. See DojoFlow in action.
          </p>
        </div>

        {/* Feature 1: Student Intelligence */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
          <div className="order-2 md:order-1">
            <div className="inline-block mb-4 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full">
              <span className="text-sm font-semibold text-blue-400">Student Management</span>
            </div>
            <h3 className="text-4xl font-bold mb-6">
              Every student, visible in real time
            </h3>
            <p className="text-xl text-slate-400 mb-6 leading-relaxed">
              Attendance, status, and risk — without spreadsheets. Interactive map shows where your students live, color-coded status indicators, and instant access to complete profiles.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Live attendance tracking",
                "Geographic student distribution",
                "Risk indicators and alerts",
                "Complete family profiles"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-blue-400" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 md:order-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/10 border border-white/10">
              <img 
                src="/02-students-map-list.png" 
                alt="Student Management with Map View" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Feature 2: Student Details */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
          <div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10 border border-white/10">
              <img 
                src="/03-student-detail-drawer.png" 
                alt="Student Detail View" 
                className="w-full h-auto"
              />
            </div>
          </div>
          <div>
            <div className="inline-block mb-4 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full">
              <span className="text-sm font-semibold text-purple-400">Data at Your Fingertips</span>
            </div>
            <h3 className="text-4xl font-bold mb-6">
              Details when you need them
            </h3>
            <p className="text-xl text-slate-400 mb-6 leading-relaxed">
              Every student record, one click away. Complete profiles with contact information, belt progression, attendance history, and parent/guardian details — all in one clean interface.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Comprehensive student profiles",
                "Belt rank progression tracking",
                "Parent/guardian information",
                "Attendance and payment history"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-purple-400" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Feature 3: Class Schedule */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
          <div className="order-2 md:order-1">
            <div className="inline-block mb-4 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
              <span className="text-sm font-semibold text-green-400">Operations</span>
            </div>
            <h3 className="text-4xl font-bold mb-6">
              Your entire schedule. One screen.
            </h3>
            <p className="text-xl text-slate-400 mb-6 leading-relaxed">
              Classes, instructors, and capacity at a glance. Weekly grid view with color-coded class blocks, instructor assignments, and real-time capacity tracking.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Visual weekly schedule grid",
                "Instructor assignments",
                "Capacity management",
                "Conflict detection"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 md:order-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10 border border-white/10">
              <img 
                src="/04-classes-schedule.png" 
                alt="Class Schedule Grid" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Feature 4: Kai in Action */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-red-500/10 border border-white/10">
              <img 
                src="/05-kai-in-action.png" 
                alt="Kai AI Taking Action" 
                className="w-full h-auto"
              />
            </div>
          </div>
          <div>
            <div className="inline-block mb-4 px-3 py-1 bg-[#ED393D]/10 border border-[#ED393D]/30 rounded-full">
              <span className="text-sm font-semibold text-[#ED393D]">AI Automation</span>
            </div>
            <h3 className="text-4xl font-bold mb-6">
              Kai doesn't just answer questions
            </h3>
            <p className="text-xl text-slate-400 mb-6 leading-relaxed">
              She takes action. Automated follow-ups, task completion tracking, and intelligent suggestions — all powered by AI that understands your dojo.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Automated student outreach",
                "Task completion tracking",
                "Intelligent recommendations",
                "24/7 availability"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 bg-[#ED393D]/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-[#ED393D]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="container py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            We understand your pain
          </h2>
          <p className="text-xl text-slate-400">
            Running a martial arts school shouldn't feel like a full-time job
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Users,
              title: "Drowning in Spreadsheets",
              description: "Student data scattered across Excel, paper forms, and your memory. Finding information takes forever."
            },
            {
              icon: Calendar,
              title: "Scheduling Chaos",
              description: "Double bookings, missed classes, and confused parents. Your calendar is a mess and you're always apologizing."
            },
            {
              icon: BarChart3,
              title: "Lost Revenue",
              description: "Late payments slip through the cracks. You're teaching martial arts, not chasing down invoices."
            }
          ].map((pain, i) => (
            <div 
              key={i}
              className="group relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-[#ED393D]/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#ED393D]/20 to-[#FFD700]/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <pain.icon className="w-7 h-7 text-[#ED393D]" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{pain.title}</h3>
              <p className="text-slate-400 leading-relaxed">{pain.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Additional Features Grid */}
      <section id="how-it-works" className="container py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            And so much more
          </h2>
          <p className="text-xl text-slate-400">
            Everything you need in one powerful platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: "Kiosk Check-In",
              description: "Touchless QR codes and PIN entry for fast, contactless arrival"
            },
            {
              icon: Shield,
              title: "Automated Billing",
              description: "Recurring payments, late fee tracking, and revenue reports"
            },
            {
              icon: TrendingUp,
              title: "Growth Analytics",
              description: "Retention insights, revenue forecasts, and performance metrics"
            },
            {
              icon: Users,
              title: "Lead Management",
              description: "Track prospects from inquiry to enrollment with automated follow-ups"
            },
            {
              icon: Calendar,
              title: "Belt Testing",
              description: "Schedule tests, track requirements, and manage promotions"
            },
            {
              icon: BarChart3,
              title: "Financial Reports",
              description: "Revenue tracking, expense management, and profit analysis"
            }
          ].map((feature, i) => (
            <div 
              key={i}
              className="relative group bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-[#ED393D]/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container py-24 max-w-4xl mx-auto text-center">
        <div className="relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-3xl p-12 md:p-16 overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#ED393D]/10 via-transparent to-[#FFD700]/10 opacity-50" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to transform your dojo?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join hundreds of martial arts schools using DojoFlow to save time, increase revenue, and focus on what matters: teaching.
            </p>
            <Link to="/owner">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-[#ED393D] to-[#FF6B6B] hover:from-[#D9292D] hover:to-[#FF5555] h-14 px-10 text-lg font-semibold shadow-2xl shadow-red-500/40 hover:shadow-red-500/60 transition-all duration-300 hover:scale-105"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-sm text-slate-400 mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm py-12">
        <div className="container text-center text-slate-400 text-sm">
          <p>&copy; 2025 DojoFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
