import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, TrendingUp, Activity, CreditCard, Users, ArrowRight } from "lucide-react";

type Category = "growth" | "health" | "billing" | "retention";

interface CategoryConfig {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
  steps: string[];
}

const categoryConfigs: Record<Category, CategoryConfig> = {
  growth: {
    title: "Growth Command Center is ready",
    subtitle: "Let's help you reach 150 students and beyond",
    icon: TrendingUp,
    color: "text-emerald-500",
    gradient: "from-emerald-500/20 to-green-500/20",
    steps: [
      "Review your current student pipeline",
      "Set up automated lead follow-ups",
      "Create a referral program",
      "Launch your first marketing campaign",
    ],
  },
  health: {
    title: "School Health Command Center is ready",
    subtitle: "Monitor attendance, engagement, and performance in real-time",
    icon: Activity,
    color: "text-blue-500",
    gradient: "from-blue-500/20 to-cyan-500/20",
    steps: [
      "Review this week's attendance patterns",
      "Identify students with missed classes",
      "Set up automated attendance reminders",
      "Create engagement reports",
    ],
  },
  billing: {
    title: "Billing Command Center is ready",
    subtitle: "Get paid on time, every time",
    icon: CreditCard,
    color: "text-amber-500",
    gradient: "from-amber-500/20 to-orange-500/20",
    steps: [
      "Review outstanding payments",
      "Set up automated payment reminders",
      "Configure failed payment recovery",
      "Create billing reports",
    ],
  },
  retention: {
    title: "Retention Command Center is ready",
    subtitle: "Keep your students engaged and committed",
    icon: Users,
    color: "text-purple-500",
    gradient: "from-purple-500/20 to-pink-500/20",
    steps: [
      "Identify at-risk students",
      "Set up engagement tracking",
      "Create retention campaigns",
      "Monitor student satisfaction",
    ],
  },
};

export default function WelcomeDashboard() {
  const [, setLocation] = useLocation();

  // Get category from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const category = (urlParams.get("category") as Category) || "growth";
  const config = categoryConfigs[category];

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  const handleGetStarted = () => {
    // Route to main dashboard
    setLocation("/owner/dashboard");
  };

  const handleTalkToKai = () => {
    // Route to Kai Command
    setLocation("/kai");
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-background flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 animate-pulse">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">{config.title}</h1>
          <p className="text-2xl text-slate-300">{config.subtitle}</p>
        </div>

        {/* Category Card */}
        <div className={`bg-gradient-to-br ${config.gradient} border border-white/10 rounded-2xl p-8 mb-8`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <config.icon className={`w-8 h-8 ${config.color}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Your Next Steps</h2>
              <p className="text-slate-300">Here's how to get started</p>
            </div>
          </div>

          <div className="space-y-4">
            {config.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <p className="text-lg text-white pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={handleTalkToKai}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 h-14 shadow-soft-lg hover-lift font-semibold"
          >
            <Sparkles className="mr-2 w-5 h-5" />
            Talk to Kai
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleGetStarted}
            className="text-lg px-8 h-14 border-2 border-white/20 text-white hover:bg-white/10 font-semibold"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-12 text-center">
          <p className="text-slate-400">
            Need help getting started?{" "}
            <button
              onClick={handleTalkToKai}
              className="text-primary hover:underline font-medium"
            >
              Ask Kai anything
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
