import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Star, Plus, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Home() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const cards = [
    {
      id: 1,
      title: "START WITH GROWTH",
      subtitle: "WAET GOALS",
      description: "Help me grow my kids program to 150 students",
      gradient: "from-red-500/20 via-pink-500/20 to-red-500/20",
      borderGradient: "from-red-500 via-pink-500 to-red-500",
      hoverGlow: "hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]"
    },
    {
      id: 2,
      title: "CHECK HEALTH",
      subtitle: "OF FORT DOJO",
      description: "Show me attendance and missed classes this week",
      gradient: "from-orange-500/20 via-red-500/20 to-orange-500/20",
      borderGradient: "from-orange-500 via-red-500 to-orange-500",
      hoverGlow: "hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
    },
    {
      id: 3,
      title: "PIC BELING",
      subtitle: "Students 6",
      description: "Who's late on payments and how can we fix it?",
      gradient: "from-yellow-500/20 via-amber-500/20 to-yellow-500/20",
      borderGradient: "from-yellow-500 via-amber-500 to-yellow-500",
      hoverGlow: "hover:shadow-[0_0_30px_rgba(234,179,8,0.5)]"
    },
    {
      id: 4,
      title: "INCREAST",
      subtitle: "RETENTION",
      description: "Tell me which students are a high risk of quitting",
      gradient: "from-purple-500/20 via-pink-500/20 to-purple-500/20",
      borderGradient: "from-purple-500 via-pink-500 to-purple-500",
      hoverGlow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
    }
  ];

  const handleCardClick = (cardId: number) => {
    setSelectedCard(cardId);
    setShowOnboarding(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Atmospheric Storm Cloud Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#1a2332] to-[#2a3442]">
        {/* Cloud texture overlay */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `radial-gradient(ellipse at 20% 30%, rgba(71, 85, 105, 0.4) 0%, transparent 50%),
                           radial-gradient(ellipse at 80% 60%, rgba(51, 65, 85, 0.3) 0%, transparent 50%),
                           radial-gradient(ellipse at 40% 80%, rgba(30, 41, 59, 0.5) 0%, transparent 50%)`
        }} />
        
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/60" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        {/* Hero Heading */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight" style={{
            textShadow: '0 0 40px rgba(255, 255, 255, 0.3)'
          }}>
            Hi, I'm Kai.
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 font-light">
            What would you like to optimize today?
          </p>
        </div>

        {/* Command Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-7xl w-full">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`group relative p-6 rounded-2xl backdrop-blur-sm bg-gradient-to-br ${card.gradient} 
                         border-2 border-transparent transition-all duration-300 
                         hover:-translate-y-2 ${card.hoverGlow} cursor-pointer text-left h-48`}
              style={{
                backgroundClip: 'padding-box',
                borderImage: `linear-gradient(135deg, ${card.borderGradient}) 1`,
              }}
            >
              {/* Gradient border effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.borderGradient} opacity-50 -z-10`} 
                   style={{ padding: '2px' }} />
              
              {/* Star icon */}
              <div className="absolute top-4 right-4">
                <Star className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
              </div>

              {/* Card content */}
              <div className="flex flex-col h-full">
                <div className="mb-auto">
                  <h3 className="text-lg font-bold text-red-400 mb-1 uppercase tracking-wide">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-400 uppercase tracking-wide">
                    {card.subtitle}
                  </p>
                </div>
                <p className="text-white text-base leading-relaxed mt-4">
                  "{card.description}"
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="w-full max-w-3xl">
          <div className="relative backdrop-blur-md bg-white/5 rounded-full border border-white/10 
                         shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-white/20 transition-all">
            <div className="flex items-center px-6 py-4">
              <MessageCircle className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Message Kai .. Type @ to mention"
                className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none text-base"
              />
              <button className="ml-3 p-2 rounded-full hover:bg-white/10 transition-colors">
                <Plus className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Got it. Let's get your dojo set up.</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-300">
              {selectedCard && `You selected: ${cards[selectedCard - 1].description}`}
            </p>
            <p className="text-sm text-gray-400">
              This will begin a step-based onboarding process to help you achieve your goal.
            </p>
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={() => setShowOnboarding(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowOnboarding(false);
                  // Navigate to onboarding or Kai Command
                  window.location.href = '/kai';
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Let's Go
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
