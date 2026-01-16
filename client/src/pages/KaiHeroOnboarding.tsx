import { useState } from "react";
import { Sparkles, TrendingUp, Activity, DollarSign, Users } from "lucide-react";
import OnboardingFlow from "@/components/OnboardingFlow";
import { useNavigate } from "react-router-dom";

export default function KaiHeroOnboarding() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showConversation, setShowConversation] = useState(false);
  const navigate = useNavigate();

  const promptCards = [
    {
      id: "growth",
      title: "START WITH GROWTH",
      prompt: "Help me grow my kids program to 150 students",
      icon: TrendingUp,
      gradient: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
      hoverGlow: "hover:shadow-green-500/50",
    },
    {
      id: "health",
      title: "CHECK SCHOOL HEALTH",
      prompt: "Show me attendance and missed classes this week",
      icon: Activity,
      gradient: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
      hoverGlow: "hover:shadow-blue-500/50",
    },
    {
      id: "billing",
      title: "FIX BILLING",
      prompt: "Who's behind on payments and how do we fix it?",
      icon: DollarSign,
      gradient: "from-amber-500/20 to-orange-500/20",
      borderColor: "border-amber-500/30",
      hoverGlow: "hover:shadow-amber-500/50",
    },
    {
      id: "retention",
      title: "INCREASE RETENTION",
      prompt: "Tell me which students are at risk of quitting",
      icon: Users,
      gradient: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      hoverGlow: "hover:shadow-purple-500/50",
    },
  ];

  const handleCardClick = (cardId: string) => {
    setSelectedCard(cardId);
    setShowConversation(true);
  };

  const handleComplete = () => {
    // Redirect to dashboard after completion
    navigate("/dashboard");
  };

  const handleClose = () => {
    setShowConversation(false);
    setSelectedCard(null);
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated background with storm clouds effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700/30 via-slate-800/50 to-slate-900/80 animate-pulse-slow" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
      
      {/* Center glow behind text */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-full blur-3xl" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-full px-4 py-12">
        {/* Kai Avatar with pulse animation */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Main heading */}
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 text-center tracking-tight">
          Hi, I'm Kai.
        </h1>

        {/* Subheading */}
        <p className="text-2xl md:text-3xl text-slate-300 mb-16 text-center font-light">
          What would you like to optimize today?
        </p>

        {/* Prompt cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full mb-12">
          {promptCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`
                  relative group p-6 rounded-2xl border backdrop-blur-xl
                  bg-gradient-to-br ${card.gradient}
                  ${card.borderColor}
                  ${card.hoverGlow}
                  transition-all duration-300
                  hover:scale-105 hover:shadow-2xl
                  ${selectedCard === card.id ? "ring-2 ring-white scale-105 shadow-2xl" : ""}
                `}
              >
                {/* Star/favorite icon */}
                <div className="absolute top-3 right-3 w-6 h-6 text-slate-400 hover:text-yellow-400 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                  {card.title}
                </h3>

                {/* Prompt text */}
                <p className="text-white text-left leading-relaxed">
                  "{card.prompt}"
                </p>

                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-white/10 transition-all duration-300" />
              </button>
            );
          })}
        </div>

        {/* Chat input bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4">
          <div className="relative">
            {/* Glassmorphism container */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-full shadow-2xl p-2">
              <div className="flex items-center gap-3 px-4">
                {/* Input */}
                <input
                  type="text"
                  placeholder="Message Kai… Type @ to mention"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-400 text-lg py-3"
                />

                {/* Plus icon */}
                <button className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center hover:scale-110 transition-transform">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Glow effect under input bar */}
            <div className="absolute -inset-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full blur-xl -z-10" />
          </div>
        </div>
      </div>

      {/* Conversational overlay (shown when card is selected) */}
      {showConversation && selectedCard && (
        <OnboardingFlow
          flowType={selectedCard as "growth" | "health" | "billing" | "retention"}
          onComplete={handleComplete}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
