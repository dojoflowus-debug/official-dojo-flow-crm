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
      subtitle: "",
      description: "Help me grow my kids program to 150 students",
      gradient: "from-red-500/20 via-pink-500/20 to-red-500/20",
      borderGradient: "from-red-500 via-pink-500 to-red-500",
      hoverGlow: "hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]"
    },
    {
      id: 2,
      title: "CHECK SCHOOL HEALTH",
      subtitle: "",
      description: "Show me attendance and missed classes this week",
      gradient: "from-orange-500/20 via-red-500/20 to-orange-500/20",
      borderGradient: "from-orange-500 via-red-500 to-orange-500",
      hoverGlow: "hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
    },
    {
      id: 3,
      title: "FIX BILLING",
      subtitle: "",
      description: "Who's behind on payments and how do we fix it?",
      gradient: "from-yellow-500/20 via-amber-500/20 to-yellow-500/20",
      borderGradient: "from-yellow-500 via-amber-500 to-yellow-500",
      hoverGlow: "hover:shadow-[0_0_30px_rgba(234,179,8,0.5)]"
    },
    {
      id: 4,
      title: "INCREASE RETENTION",
      subtitle: "",
      description: "Tell me which students are at risk of quitting",
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
      {/* Dim overlay when card is selected */}
      {selectedCard && !showOnboarding && (
        <div className="absolute inset-0 bg-black/40 z-5 transition-opacity duration-300" />
      )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12 max-w-7xl w-full px-4">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`group relative p-6 rounded-2xl backdrop-blur-sm bg-gradient-to-br ${card.gradient} 
                         border-2 transition-all duration-300 ease-out
                         hover:-translate-y-3 hover:scale-[1.02] ${card.hoverGlow} 
                         cursor-pointer text-left h-56 flex flex-col
                         ${selectedCard === card.id ? 'ring-4 ring-white/50 scale-[1.02] -translate-y-3' : ''}`}
              style={{
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
                  <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-wide">
                    {card.title}
                  </h3>
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

      {/* Conversational Overlay */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 
                                   backdrop-blur-xl border-2 border-white/20 text-white 
                                   shadow-[0_0_50px_rgba(255,255,255,0.1)] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-light mb-2" style={{
              textShadow: '0 0 20px rgba(255, 255, 255, 0.2)'
            }}>
              Got it. Let's get your dojo set up.
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-lg text-gray-200 mb-2">
                <span className="text-blue-400 font-semibold">Your goal:</span>
              </p>
              <p className="text-white text-base italic">
                {selectedCard && `"${cards[selectedCard - 1].description}"`}
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-300 text-base">
                I'll guide you through a quick 3-step setup to help you achieve this:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-400 flex items-start gap-2">
                  <span className="text-blue-400 mt-1">1.</span>
                  <span>Tell me about your school</span>
                </li>
                <li className="text-gray-400 flex items-start gap-2">
                  <span className="text-purple-400 mt-1">2.</span>
                  <span>Connect your current systems</span>
                </li>
                <li className="text-gray-400 flex items-start gap-2">
                  <span className="text-pink-400 mt-1">3.</span>
                  <span>Set your optimization targets</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3 mt-8">
              <Button 
                onClick={() => setShowOnboarding(false)}
                variant="outline"
                className="flex-1 border-white/20 hover:bg-white/10 text-white"
              >
                Not Now
              </Button>
              <Button 
                onClick={() => {
                  setShowOnboarding(false);
                  // Navigate to Kai Command for onboarding
                  window.location.href = '/kai';
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 
                          hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 
                          shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:shadow-[0_0_30px_rgba(147,51,234,0.7)]
                          transition-all duration-300"
              >
                Let's Go →
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
