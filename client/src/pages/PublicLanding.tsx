import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles, Users, Calendar, CreditCard, MessageSquare, BarChart3, Shield, Zap } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background landing-scrollbar overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-premium border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold text-gradient-red-gold">DojoFlow</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
              <Link href="/auth">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth">
                <Button size="sm" className="btn-premium bg-primary hover:bg-primary/90">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            <div className="md:hidden">
              <Link href="/auth">
                <Button size="sm" className="btn-premium bg-primary hover:bg-primary/90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden grain"
        style={{
          paddingTop: "64px",
        }}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 gradient-animated opacity-10" />
        
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium text-sm font-medium">
                <Sparkles className="w-4 h-4 text-secondary" />
                <span>AI-Powered Dojo Management</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                Run Your Dojo{" "}
                <span className="text-gradient-red-gold">Like a Sensei</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl text-balance">
                The all-in-one platform for martial arts schools. Manage students, track progress, automate billing, and let Kai AI handle the rest. Focus on teaching, we'll handle the operations.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/auth">
                  <Button size="lg" className="btn-premium bg-primary hover:bg-primary/90 text-lg px-8 h-14 glow-red">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 glass-premium hover:glass-premium-strong">
                  Watch Demo
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right: Dashboard Preview */}
            <div 
              className="relative"
              style={{
                transform: `translateY(${scrollY * 0.1}px)`,
              }}
            >
              <div className="relative">
                {/* Glow behind dashboard */}
                <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-3xl" />
                
                {/* Dashboard image */}
                <div className="relative rounded-2xl overflow-hidden shadow-depth-strong border border-border/50 glass-premium-strong">
                  <img 
                    src="/hero-dashboard.png" 
                    alt="DojoFlow Dashboard" 
                    className="w-full h-auto"
                  />
                </div>

                {/* Floating stats cards */}
                <div className="absolute -top-4 -left-4 glass-premium rounded-xl p-4 shadow-depth hover-lift">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">1,247</div>
                      <div className="text-xs text-muted-foreground">Active Students</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 glass-premium rounded-xl p-4 shadow-depth hover-lift">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">98%</div>
                      <div className="text-xs text-muted-foreground">Retention Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-muted-foreground/30 rounded-full" />
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 scroll-reveal">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              We Understand Your Pain
            </h2>
            <p className="text-lg text-muted-foreground">
              Running a martial arts school shouldn't feel like a full-time administrative job. You became a sensei to teach, not to wrestle with spreadsheets and billing software.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: "Scheduling Chaos",
                description: "Managing class schedules, private lessons, and belt testing dates across multiple locations is overwhelming."
              },
              {
                icon: CreditCard,
                title: "Billing Headaches",
                description: "Chasing late payments, managing memberships, and handling refunds takes hours every week."
              },
              {
                icon: MessageSquare,
                title: "Communication Overload",
                description: "Answering the same questions repeatedly via phone, email, and text eats into your teaching time."
              }
            ].map((problem, index) => (
              <div 
                key={index}
                className="scroll-reveal glass-premium rounded-2xl p-8 hover-lift"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <problem.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 scroll-reveal">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium text-sm font-medium mb-6">
              <Zap className="w-4 h-4 text-secondary" />
              <span>The DojoFlow Solution</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              From Chaos to{" "}
              <span className="text-gradient-red-gold">Clarity</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              DojoFlow brings everything together in one powerful platform, powered by Kai AI—your intelligent assistant that handles operations so you can focus on what matters: teaching martial arts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Sparkles,
                title: "Kai AI Assistant",
                description: "Your 24/7 AI sensei that answers student questions, schedules classes, and handles routine tasks automatically.",
                badge: "Most Popular"
              },
              {
                icon: Users,
                title: "Student Management",
                description: "Track attendance, belt progression, and performance with detailed profiles and progress reports."
              },
              {
                icon: Calendar,
                title: "Smart Scheduling",
                description: "Automated class scheduling, waitlists, and reminders that sync with your calendar."
              },
              {
                icon: CreditCard,
                title: "Automated Billing",
                description: "Recurring payments, invoicing, and payment tracking that runs on autopilot."
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                description: "Real-time insights into revenue, retention, and growth metrics to make data-driven decisions."
              },
              {
                icon: Shield,
                title: "Kiosk Mode",
                description: "Self-service check-in stations for students with facial recognition and attendance tracking."
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="scroll-reveal glass-premium rounded-2xl p-8 hover-lift relative overflow-hidden"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {feature.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-medium">
                      {feature.badge}
                    </span>
                  </div>
                )}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 glow-red">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-animated opacity-10" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center glass-premium rounded-3xl p-12 shadow-depth-strong scroll-reveal">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Ready to Transform Your Dojo?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of martial arts schools already using DojoFlow to streamline operations and grow their business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="btn-premium bg-primary hover:bg-primary/90 text-lg px-8 h-14 glow-red-strong">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 h-14 glass-premium hover:glass-premium-strong">
                Schedule a Demo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <span className="text-xl font-bold text-gradient-red-gold">DojoFlow</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The all-in-one platform for martial arts school management.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 DojoFlow. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
