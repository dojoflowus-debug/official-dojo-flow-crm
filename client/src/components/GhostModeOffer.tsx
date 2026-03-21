/**
 * GhostModeOffer — Kai's proactive help banner
 *
 * Appears after the user has been idle on a module page for 8+ seconds
 * without having completed that module's tutorial. Slides up from the
 * bottom with a warm, non-intrusive offer.
 */

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";

interface GhostModeOfferProps {
  message: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export function GhostModeOffer({ message, onAccept, onDismiss }: GhostModeOfferProps) {
  const [visible, setVisible] = useState(false);

  // Slide in after a brief delay
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  const handleAccept = () => {
    setVisible(false);
    setTimeout(onAccept, 200);
  };

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 transition-all duration-300 ease-out"
      style={{
        bottom: visible ? "88px" : "-120px",
        zIndex: 9980,
        opacity: visible ? 1 : 0,
        width: "min(360px, calc(100vw - 32px))",
      }}
    >
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          border: "1px solid rgba(255,76,76,0.25)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,76,76,0.1)",
        }}
      >
        {/* Subtle top glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,76,76,0.5), transparent)",
          }}
        />

        <div className="flex items-start gap-3 p-4">
          {/* Kai icon */}
          <div
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,76,76,0.15)",
              border: "1px solid rgba(255,76,76,0.3)",
            }}
          >
            <Sparkles className="w-4 h-4 text-[#FF4C4C]" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white mb-0.5">Kai</p>
            <p className="text-sm text-white/75 leading-relaxed">{message}</p>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleAccept}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-white transition-all duration-150"
                style={{
                  background: "linear-gradient(135deg, #FF4C4C, #E53935)",
                  boxShadow: "0 2px 8px rgba(255,76,76,0.3)",
                }}
              >
                Show me
              </button>
              <button
                onClick={handleDismiss}
                className="py-1.5 px-3 rounded-lg text-xs font-semibold text-white/50 hover:text-white/80 transition-colors"
                style={{
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                Not now
              </button>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/30 hover:text-white/60 transition-colors mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
