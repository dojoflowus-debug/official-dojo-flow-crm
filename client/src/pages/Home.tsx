import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ArrowRight, Play, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RealResults } from "@/components/RealResults";

export default function Home() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setAnimationStage(1), 300),
      setTimeout(() => setAnimationStage(2), 600),
      setTimeout(() => setAnimationStage(3), 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const industries = [
    { name: "SaaS", challenges: ["High churn", "Scaling features", "Freemium conversion"] },
    { name: "Education", challenges: ["Low engagement", "Accessibility", "Performance"] },
    { name: "FinTech", challenges: ["Compliance", "Onboarding friction", "Real-time integrations"] },
    { name: "Fitness", challenges: ["Member retention", "Class management", "Billing"] },
  ];

  const stats = [
    { number: "60+", label: "Expert Designers & Developers" },
    { number: "500M+", label: "Investments Raised by Clients" },
  ];

  const testimonials = [
    {
      quote: "DojoFlow's ability to translate concepts into high-fidelity solutions is impressive.",
      author: "Kevin Alvarez",
      role: "Founder & General Partner",
    },
    {
      quote: "The team is extremely communicative and their work is exceptional.",
      author: "George Fry",
      role: "Founder at Neap",
    },
    {
      quote: "Top-notch outcomes with exceptional design and punctual delivery.",
      author: "Andre Guerra",
      role: "Co-Owner at RADCAT Design",
    },
  ];

  const handleCardClick = (cardId: number) => {
    setSelectedCard(cardId);
    setShowOnboarding(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-accent">DojoFlow</div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-foreground hover:text-accent transition-colors text-sm uppercase tracking-wider">Services</a>
            <a href="#" className="text-foreground hover:text-accent transition-colors text-sm uppercase tracking-wider">Industries</a>
            <a href="#" className="text-foreground hover:text-accent transition-colors text-sm uppercase tracking-wider">Cases</a>
            <a href="#" className="text-foreground hover:text-accent transition-colors text-sm uppercase tracking-wider">Company</a>
          </div>
          <Button className="bg-accent text-background hover:bg-accent/90 font-semibold">
            Sign In
          </Button>
        </div>
      </nav>

      {/* ===== HERO SECTION: Gate Into the Kingdom ===== */}
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-background pt-20">
        {/* Cinematic Background Layer */}
        <div className="absolute inset-0 z-0">
          {/* Dark gradient base */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background opacity-100" />
          
          {/* Subtle atmospheric effect - dojo/training environment */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/40" />
          
          {/* Fog effect - breathing motion */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
          </div>

          {/* Subtle light sweep - cinematic feel */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent animate-pulse" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-20 text-center space-y-12">
          {/* Kai Emblem/Orb - Central Focus */}
          <div className={`flex justify-center transition-all duration-700 ${
            animationStage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-spin" style={{ animationDuration: "8s" }} />
              
              {/* Middle ring */}
              <div className="absolute inset-2 rounded-full border border-accent/20" />
              
              {/* Inner orb with breathing effect */}
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-accent/40 to-accent/20 flex items-center justify-center shadow-lg shadow-accent/20 animate-pulse-slow">
                <Zap className="w-8 h-8 text-accent" />
              </div>
            </div>
          </div>

          {/* Primary Headline - Authoritative & Powerful */}
          <div className={`space-y-4 transition-all duration-700 ${
            animationStage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight text-foreground">
              Meet Kai
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light tracking-wide">
              Your intelligent command center for dojo operations
            </p>
          </div>

          {/* Secondary Message - System-like Authority */}
          <p className={`text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed transition-all duration-700 ${
            animationStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Kai is an AI system designed to understand your dojo's unique challenges. From student management to instructor coordination, Kai learns your environment and delivers intelligent solutions in real time.
          </p>

          {/* CTA Buttons - Clear Actions */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-700 ${
            animationStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Primary CTA */}
            <Button 
              onClick={() => handleCardClick(1)}
              className="bg-accent hover:bg-accent/90 text-background font-bold px-10 py-7 text-lg uppercase tracking-wider shadow-lg shadow-accent/30 transition-all hover:shadow-accent/50"
            >
              Talk to Kai
            </Button>
            
            {/* Secondary CTA */}
            <Button 
              variant="outline"
              className="border-2 border-accent text-accent hover:bg-accent/10 font-semibold px-10 py-7 text-lg uppercase tracking-wider transition-all"
            >
              Watch Demo <Play className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {/* Subtle Scroll Hint */}
          <div className={`pt-8 transition-all duration-700 ${
            animationStage >= 3 ? 'opacity-100' : 'opacity-0'
          }`}>
            <p className="text-xs text-muted-foreground/50 uppercase tracking-widest animate-bounce">
              Scroll to explore
            </p>
          </div>
        </div>

        {/* Bottom gradient fade - ensures content below is hidden on load */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20" />
      </section>

      {/* Wave Divider */}
      <div className="relative h-24 overflow-hidden">
        <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z" fill="currentColor" className="text-card" />
        </svg>
      </div>

      {/* Industries Section */}
      <section className="bg-card py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-16">Our areas of expertise</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {industries.map((industry, idx) => (
              <div key={idx} className="space-y-4">
                <h3 className="text-2xl font-bold text-accent">{industry.name}</h3>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Challenges:</p>
                  <ul className="space-y-1">
                    {industry.challenges.map((challenge, cidx) => (
                      <li key={cidx} className="text-foreground text-sm">• {challenge}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave Divider */}
      <div className="relative h-24 overflow-hidden bg-card">
        <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 Q300,100 600,50 T1200,50 L1200,0 L0,0 Z" fill="currentColor" className="text-background" />
        </svg>
      </div>

      {/* Statistics Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 label-uppercase">Wins that inspire us forward</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-4">
                <div className="text-6xl md:text-7xl font-bold text-accent">{stat.number}</div>
                <p className="text-xl text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Results Section */}
      <RealResults />

      {/* Testimonials Section */}
      <section className="bg-card py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-16">What clients say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="p-8 border border-border rounded-lg space-y-4">
                <p className="text-foreground text-lg italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">Have a project in mind?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Let's chat about how we can help your startup succeed</p>
          <Button 
            className="bg-accent text-background hover:bg-accent/90 font-semibold px-10 py-6 text-base uppercase tracking-wider"
          >
            Get In Touch
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 bg-card">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground text-sm">
          <p>&copy; 2026 DojoFlow. All rights reserved.</p>
        </div>
      </footer>

      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="bg-card border-2 border-border text-foreground max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold mb-2">
              Let's get started
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <p className="text-lg text-muted-foreground">
              Tell us more about your project and we'll guide you through the next steps.
            </p>
            
            <div className="flex gap-3 mt-8">
              <Button 
                onClick={() => setShowOnboarding(false)}
                variant="outline"
                className="flex-1 border-border hover:bg-accent/10 text-foreground"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowOnboarding(false);
                  window.location.href = '/kai';
                }}
                className="flex-1 bg-accent hover:bg-accent/90 text-background font-semibold"
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
