/**
 * SpotlightOverlay — Kai Tutorial Visual Guidance System
 *
 * Renders a full-screen backdrop with a "cutout" hole over the target element,
 * a pulsing ring highlight, and a positioned tooltip with Kai's message.
 *
 * Usage: mount once at app root; driven by KaiTutorialContext.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { X, ChevronRight } from "lucide-react";

export interface SpotlightTarget {
  selector: string | null;
  message: string;
  stepLabel: string;
  stepIndex: number;
  totalSteps: number;
  tooltipPosition?: "top" | "bottom" | "left" | "right";
  showNext?: boolean;
  showSkip?: boolean;
  onNext?: () => void;
  onSkip?: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 10; // px around the target element

function getTargetRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
  };
}

function TooltipArrow({ position }: { position: string }) {
  const base = "absolute w-3 h-3 bg-[#1a1a2e] rotate-45";
  const pos = {
    bottom: "-top-1.5 left-1/2 -translate-x-1/2",
    top: "-bottom-1.5 left-1/2 -translate-x-1/2",
    left: "-right-1.5 top-1/2 -translate-y-1/2",
    right: "-left-1.5 top-1/2 -translate-y-1/2",
  }[position] ?? "-top-1.5 left-1/2 -translate-x-1/2";
  return <div className={`${base} ${pos}`} />;
}

export function SpotlightOverlay({
  target,
}: {
  target: SpotlightTarget | null;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const updateRect = useCallback(() => {
    if (!target?.selector) {
      setRect(null);
      return;
    }
    const r = getTargetRect(target.selector);
    setRect(r);
  }, [target?.selector]);

  // Track target element position (handles scroll/resize)
  useEffect(() => {
    updateRect();
    const tick = () => {
      updateRect();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [updateRect]);

  // Position tooltip relative to target
  useEffect(() => {
    if (!rect || !tooltipRef.current) return;
    const tip = tooltipRef.current;
    const tipH = tip.offsetHeight || 120;
    const tipW = tip.offsetWidth || 280;
    const pos = target?.tooltipPosition ?? "bottom";
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = 0;
    let left = 0;

    switch (pos) {
      case "bottom":
        top = rect.top + rect.height + 16;
        left = rect.left + rect.width / 2 - tipW / 2;
        break;
      case "top":
        top = rect.top - tipH - 16;
        left = rect.left + rect.width / 2 - tipW / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tipH / 2;
        left = rect.left - tipW - 16;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tipH / 2;
        left = rect.left + rect.width + 16;
        break;
    }

    // Clamp to viewport
    left = Math.max(12, Math.min(left, vw - tipW - 12));
    top = Math.max(12, Math.min(top, vh - tipH - 12));

    setTooltipStyle({ top, left, width: tipW });
  }, [rect, target?.tooltipPosition]);

  if (!target) return null;

  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;

  // SVG clip path: full screen minus the spotlight hole
  const clipPath = rect
    ? `M0,0 H${vw} V${vh} H0 Z M${rect.left},${rect.top} H${rect.left + rect.width} V${rect.top + rect.height} H${rect.left} Z`
    : `M0,0 H${vw} V${vh} H0 Z`;

  const pct = Math.round(((target.stepIndex + 1) / target.totalSteps) * 100);

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9990 }}
      aria-live="polite"
      aria-label={`Tutorial step ${target.stepIndex + 1} of ${target.totalSteps}`}
    >
      {/* Backdrop with cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <clipPath id="spotlight-clip" clipRule="evenodd">
            <path d={clipPath} fillRule="evenodd" />
          </clipPath>
        </defs>
        <rect
          x={0}
          y={0}
          width={vw}
          height={vh}
          fill="rgba(0,0,0,0.65)"
          clipPath="url(#spotlight-clip)"
        />
      </svg>

      {/* Pulsing ring around target */}
      {rect && (
        <div
          className="absolute rounded-xl pointer-events-none"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        >
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 rounded-xl border-2 border-[#FF4C4C] animate-pulse"
            style={{ boxShadow: "0 0 0 4px rgba(255,76,76,0.25), 0 0 20px rgba(255,76,76,0.4)" }}
          />
          {/* Inner highlight */}
          <div className="absolute inset-0 rounded-xl border border-white/30" />
        </div>
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute pointer-events-auto"
        style={{ ...tooltipStyle, zIndex: 9999, width: 300 }}
      >
        <div
          className="relative rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            border: "1px solid rgba(255,76,76,0.3)",
          }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FF4C4C] animate-pulse" />
              <span className="text-xs font-semibold text-[#FF4C4C] tracking-wide uppercase">
                {target.stepLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 font-mono">
                {target.stepIndex + 1}/{target.totalSteps}
              </span>
              {target.onSkip && (
                <button
                  onClick={target.onSkip}
                  className="text-white/30 hover:text-white/70 transition-colors"
                  aria-label="Skip tutorial"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-2">
            <div className="h-0.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#FF4C4C] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Kai message */}
          <div className="px-4 pb-3">
            <p className="text-sm text-white/90 leading-relaxed">{target.message}</p>
          </div>

          {/* Actions */}
          {target.showNext && target.onNext && (
            <div className="px-4 pb-3 flex justify-end">
              <button
                onClick={target.onNext}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white text-xs font-semibold transition-colors"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Arrow */}
          <TooltipArrow position={target.tooltipPosition ?? "bottom"} />
        </div>
      </div>
    </div>
  );
}
