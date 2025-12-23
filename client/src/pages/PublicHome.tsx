import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Users, Calendar, BarChart3, Sparkles, Zap, Shield, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Public Marketing Landing Page - Pandawa-Inspired Design
 * Premium hero with split headline, centered layout, and minimal distractions
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

      {/* Hero Section - Pandawa Style */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
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
          {/* Grain texture */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container max-w-5xl mx-auto text-center px-6">
          {/* Split Headline - Pandawa Style */}
          <div className="space-y-4 mb-8">
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-none">
              <span className="block bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Run Your Dojo
              </span>
            </h1>
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-none">
              <span className="block bg-gradient-to-r from-[#ED393D] via-[#FF6B6B] to-[#FFD700] bg-clip-text text-transparent animate-gradient">
                Like a Sensei
              </span>
            </h1>
          </div>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            Whether it's student management, class scheduling, or billing, DojoFlow helps you run your martial arts school in minutes, not hours.
          </p>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4 mb-8">
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

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section id="features" className="container py-24 max-w-6xl mx-auto">
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

      {/* Solution Section */}
      <section id="how-it-works" className="container py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            From chaos to clarity
          </h2>
          <p className="text-xl text-slate-400">
            Everything you need to run a professional martial arts school
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Sparkles,
              title: "Kai AI Assistant",
              description: "Your 24/7 AI sensei handles questions, schedules, and insights",
              badge: "Most Popular",
              highlight: true
            },
            {
              icon: Users,
              title: "Student CRM",
              description: "Complete profiles, belt tracking, attendance, and family management"
            },
            {
              icon: Calendar,
              title: "Smart Scheduling",
              description: "Automatic class assignments, conflict detection, and reminders"
            },
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
            }
          ].map((feature, i) => (
            <div 
              key={i}
              className={`relative group bg-gradient-to-b ${
                feature.highlight 
                  ? 'from-[#ED393D]/20 to-[#FFD700]/10 border-[#ED393D]/50' 
                  : 'from-slate-800/50 to-slate-900/50 border-white/10'
              } backdrop-blur-sm border rounded-2xl p-8 hover:border-[#ED393D]/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1`}
            >
              {feature.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#ED393D] to-[#FF6B6B] rounded-full text-xs font-semibold">
                  {feature.badge}
                </div>
              )}
              <div className={`w-12 h-12 ${
                feature.highlight 
                  ? 'bg-gradient-to-br from-[#ED393D] to-[#FFD700]' 
                  : 'bg-gradient-to-br from-slate-700 to-slate-800'
              } rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
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
