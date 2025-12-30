import { useEffect, useState, useRef, useCallback } from "react";

interface ScrollIndicatorProps {
  /** Whether the indicator should be hidden (e.g., when Kai chat is open) */
  hidden?: boolean;
}

/**
 * Custom floating scroll indicator that replaces the default browser scrollbar.
 * Features:
 * - DojoFlow brand gradient (red to orange)
 * - Soft glow effect
 * - Fades in/out based on scroll activity (1.5s timeout)
 * - Hides when Kai chat is open
 */
export function ScrollIndicator({ hidden = false }: ScrollIndicatorProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculateScrollProgress = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    ) - window.innerHeight;
    
    if (docHeight > 0) {
      const progress = (scrollTop / docHeight) * 100;
      return Math.min(100, Math.max(0, progress));
    }
    return 0;
  }, []);

  const handleScroll = useCallback(() => {
    // Calculate and update progress
    setScrollProgress(calculateScrollProgress());

    // Show indicator
    setIsVisible(true);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Hide indicator after 1.5s of inactivity
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 1500);
  }, [calculateScrollProgress]);

  useEffect(() => {
    // Initial calculation
    setScrollProgress(calculateScrollProgress());

    // Add scroll listener with passive option for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleScroll, calculateScrollProgress]);

  // Don't render if hidden or no scrollable content
  if (hidden) {
    return null;
  }

  return (
    <div
      className="fixed z-[9999] pointer-events-none transition-opacity duration-300 ease-in-out"
      style={{
        right: "12px",
        top: "15%",
        width: "4px",
        height: "70%",
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "8px",
        opacity: isVisible ? 1 : 0,
      }}
      aria-hidden="true"
    >
      {/* Progress bar with gradient and glow */}
      <div
        className="w-full rounded-full"
        style={{
          height: `${scrollProgress}%`,
          background: "linear-gradient(180deg, #ff3b3b, #ff8a00)",
          boxShadow: "0 0 8px rgba(255, 90, 90, 0.7)",
          borderRadius: "8px",
          transition: "height 0.15s ease-out",
        }}
      />
    </div>
  );
}

export default ScrollIndicator;
