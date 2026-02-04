import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

interface FloatingKaiButtonProps {
  onClick: () => void;
  showHint?: boolean;
}

export function FloatingKaiButton({ onClick, showHint = false }: FloatingKaiButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Check if user has saved onboarding progress (came from "Keep exploring")
  useEffect(() => {
    const checkProgress = () => {
      const saved = localStorage.getItem("kai_onboarding_progress");
      if (saved) {
        try {
          const { step, flowState } = JSON.parse(saved);
          // Show button if user was in preview mode and chose to explore
          if (step === "preview" || flowState === "PREVIEW_MODE") {
            setIsVisible(true);
            // Show tooltip after a delay if they haven't interacted
            if (!hasInteracted) {
              setTimeout(() => setShowTooltip(true), 3000);
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    };

    checkProgress();
    
    // Listen for storage changes
    window.addEventListener("storage", checkProgress);
    return () => window.removeEventListener("storage", checkProgress);
  }, [hasInteracted]);

  // Show hint when prop changes
  useEffect(() => {
    if (showHint) {
      setIsVisible(true);
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 5000);
    }
  }, [showHint]);

  const handleClick = () => {
    setHasInteracted(true);
    setShowTooltip(false);
    onClick();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-6 right-6 z-50"
      >
        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute bottom-full right-0 mb-3 whitespace-nowrap"
            >
              <div className="relative bg-slate-900 text-white px-4 py-2 rounded-xl shadow-xl border border-white/10">
                <button
                  onClick={() => setShowTooltip(false)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-sm font-medium">When you're ready, click Kai to continue.</p>
                {/* Arrow */}
                <div className="absolute -bottom-2 right-6 w-4 h-4 bg-slate-900 border-r border-b border-white/10 transform rotate-45" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kai Button */}
        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative group"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-red-500/30 blur-xl group-hover:bg-red-500/50 transition-all" />
          
          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
          
          {/* Button */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.6)] flex items-center justify-center transition-all">
            <img 
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/nDbbiINIuNulnQxs.png" 
              alt="Kai" 
              className="w-10 h-10 drop-shadow-lg"
              onError={(e) => {
                // Fallback to icon if image fails
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <MessageCircle className="w-8 h-8 text-white hidden" />
          </div>
          
          {/* Status indicator */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg">
            <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
          </div>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}

export default FloatingKaiButton;
