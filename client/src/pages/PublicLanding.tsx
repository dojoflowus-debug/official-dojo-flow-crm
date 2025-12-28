import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles, Users, Calendar, CreditCard, MessageSquare, BarChart3, Shield, Zap, Star, TrendingUp, Clock, Bell, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function PublicLanding() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

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
            <div className="flex items-center">
              <img src="/logo-dark.png" alt="DojoFlow" className="h-8 dark:hidden" />
              <img src="/logo-light.png" alt="DojoFlow" className="h-8 hidden dark:block" />
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
              <Link href="/auth">
                <Button variant="ghost" size="sm" className="font-medium">Sign In</Button>
              </Link>
              <Link href="/auth">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-soft">
                  Start Free Trial
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

      {/* Hero Section - Large, Asymmetric Layout */}
      <section 
        ref={heroRef}
        className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden"
      >
        {/* Gradient background blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl -z-10" />

        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Hero Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-sm font-medium border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-foreground">AI-Powered Dojo Management</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                Run your dojo like a{" "}
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  sensei
                </span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                The all-in-one platform for martial arts schools. <strong className="text-foreground">Manage students, automate billing, and let Kai AI handle the rest.</strong> Focus on teaching—we'll handle operations.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 h-14 shadow-soft-lg hover-lift font-semibold">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-2 hover:bg-secondary font-semibold">
                  Watch Demo
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span><strong className="text-foreground">14-day</strong> free trial</span>
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

            {/* Right: Dashboard Preview with Floating Cards */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-soft-xl border border-border bg-card">
                <img 
                  src="/01-kai-command-hero.png" 
                  alt="DojoFlow Kai Command Center" 
                  className="w-full h-auto"
                />
              </div>

              {/* Floating stat cards */}
              <div className="absolute -top-6 -left-6 bg-card rounded-2xl p-6 shadow-soft-lg border border-border hover-lift">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">1,247</div>
                    <div className="text-sm text-muted-foreground">Active Students</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-card rounded-2xl p-6 shadow-soft-lg border border-border hover-lift">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">+40%</div>
                    <div className="text-sm text-muted-foreground">Revenue Growth</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid - Card-Based Layout */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-sm font-medium border border-primary/20 mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span>Everything you need</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Create the perfect experience for your students
            </h2>
            <p className="text-lg text-muted-foreground">
              Launch your dojo management system in minutes. <strong className="text-foreground">No technical skills required</strong>—just focus on teaching while DojoFlow handles everything else.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-8 shadow-soft hover-lift border border-border group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">{feature.description}</p>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{feature.highlight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alternating Content Section - Kai AI Showcase */}
      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            {/* Left: Image */}
            <div className="order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden shadow-soft-xl border border-border">
                <img 
                  src="/05-kai-in-action.png" 
                  alt="Kai AI Assistant in action" 
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Right: Content */}
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-sm font-medium border border-accent/20">
                <Phone className="w-4 h-4 text-accent" />
                <span>24/7 AI Support</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold">
                Meet Kai, your AI sensei
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Kai handles <strong className="text-foreground">student inquiries, class scheduling, and routine questions</strong> automatically via chat, SMS, or voice. Parents get instant answers at midnight. You get your time back.
              </p>
              <ul className="space-y-4">
                {[
                  "Answers questions about class schedules, belt requirements, and pricing",
                  "Books private lessons and handles rescheduling requests",
                  "Sends automated reminders for upcoming classes and payments",
                  "Learns your dojo's policies and responds in your voice"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-soft">
                  Try Kai for Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Second alternating section - Billing */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-sm font-medium border border-primary/20">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Automated Payments</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold">
                Get paid on time, every time
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                <strong className="text-foreground">No more chasing payments.</strong> Automated billing, failed payment recovery, and instant invoicing. Stripe handles security, we handle everything else.
              </p>
              <ul className="space-y-4">
                {[
                  "Recurring monthly memberships with automatic billing",
                  "Failed payment recovery with smart retry logic",
                  "Instant digital receipts and invoices",
                  "Support for payment plans and custom pricing"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Image */}
            <div>
              <div className="relative rounded-2xl overflow-hidden shadow-soft-xl border border-border">
                <img 
                  src="/04-classes-schedule.png" 
                  alt="Class schedule and management" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              You're in good company
            </h2>
            <p className="text-lg text-muted-foreground">
              Join hundreds of successful martial arts schools using DojoFlow. <strong className="text-foreground">Become part of a growing community</strong> of innovative instructors and school owners.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-8 shadow-soft hover-lift border border-border"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-accent to-primary p-12 md:p-16 text-center shadow-soft-xl">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
            
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl sm:text-5xl font-bold text-primary-foreground">
                Ready to transform your dojo?
              </h2>
              <p className="text-xl text-primary-foreground/90">
                Start your 14-day free trial today. No credit card required, cancel anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth">
                  <Button size="lg" variant="secondary" className="text-lg px-8 h-14 font-semibold shadow-soft-lg hover-lift">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-2 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 font-semibold">
                  Schedule a Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">D</span>
              </div>
              <span className="text-xl font-bold">DojoFlow</span>
            </div>
            
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © 2025 DojoFlow. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .scroll-reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .scroll-reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
