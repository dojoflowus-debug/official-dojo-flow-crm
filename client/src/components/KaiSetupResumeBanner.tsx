/**
 * KaiSetupResumeBanner
 *
 * Persistent chip shown when the user chose "Explore First".
 * Floats at the bottom-center of the KAI Dashboard.
 * Shows setup progress and a "Resume Setup" action.
 */

import React from "react";
import { motion } from "framer-motion";
import { Zap, X } from "lucide-react";

interface KaiSetupResumeBannerProps {
  completedSteps: number;
  totalSteps: number;
  onResume: () => void;
  onDismiss: () => void;
}

export function KaiSetupResumeBanner({
  completedSteps,
  totalSteps,
  onResume,
  onDismiss,
}: KaiSetupResumeBannerProps) {
  const pct = Math.min(Math.round((completedSteps / totalSteps) * 100), 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-2xl"
      style={{
        background: "linear-gradient(135deg, rgba(15,10,10,0.96) 0%, rgba(20,12,12,0.96) 100%)",
        border: "1px solid rgba(239,68,68,0.25)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(239,68,68,0.08)",
        backdropFilter: "blur(12px)",
        whiteSpace: "nowrap",
      }}
    >
      {/* Pulse dot */}
      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-none" />

      {/* Progress ring / text */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/50">Setup</span>
        <div className="w-20 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #EF4444, #FF6B6B)",
            }}
          />
        </div>
        <span className="text-xs font-mono text-white/30">{pct}%</span>
      </div>

      {/* Resume button */}
      <button
        onClick={onResume}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all"
        style={{
          background: "linear-gradient(135deg, #EF4444, #DC2626)",
          boxShadow: "0 2px 10px rgba(239,68,68,0.3)",
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(239,68,68,0.45)")}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 10px rgba(239,68,68,0.3)")}
      >
        <Zap className="w-3 h-3" />
        Resume Setup
      </button>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="w-5 h-5 flex items-center justify-center rounded-md text-white/25 hover:text-white/60 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}
