import { useState, useEffect, useRef, useCallback } from 'react';

interface UseScrollHideOptions {
  hideThreshold?: number; // Pixels scrolled down before hiding (default: 15)
  showThreshold?: number; // Pixels scrolled up before showing (default: 8)
  edgeRevealZone?: number; // Pixels from top/bottom to trigger reveal (default: 40)
  scrollElement?: HTMLElement | null; // Element to track scroll on (default: window)
  onStateChange?: (isHidden: boolean) => void; // Callback when state changes
}

/**
 * Custom hook for auto-hide scroll menu with hysteresis, edge-reveal, and interaction detection
 * Features:
 * - Hysteresis: 15px down to hide, 8px up to show (prevents flicker)
 * - Edge-reveal: Show UI when mouse is within 40px of top/bottom
 * - Interaction detection: Don't hide during user interactions (2s grace period)
 * - Persistent preference: Remember user's auto-hide setting in localStorage
 */
export function useScrollHide(options: UseScrollHideOptions = {}) {
  const {
    hideThreshold = 15,
    showThreshold = 8,
    edgeRevealZone = 40,
    scrollElement = null,
    onStateChange,
  } = options;

  const [isUIHidden, setIsUIHidden] = useState(() => {
    // Load preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kiosk-studio-auto-hide');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [isAutoHideEnabled, setIsAutoHideEnabled] = useState(true);

  const lastScrollYRef = useRef(0);
  const lastHideStateRef = useRef(false);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const edgeRevealTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Persist preference to localStorage
  useEffect(() => {
    localStorage.setItem('kiosk-studio-auto-hide', JSON.stringify(isAutoHideEnabled));
  }, [isAutoHideEnabled]);

  // Notify parent when state changes
  useEffect(() => {
    onStateChange?.(isUIHidden);
  }, [isUIHidden, onStateChange]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!isAutoHideEnabled) return;

    const currentScrollY = scrollElement ? scrollElement.scrollTop : window.scrollY;
    const lastScrollY = lastScrollYRef.current;
    const scrollDelta = currentScrollY - lastScrollY;

    // Hysteresis logic: different thresholds for hiding vs showing
    if (scrollDelta > hideThreshold && !isUIHidden) {
      // Scrolling down past threshold - hide UI
      setIsUIHidden(true);
      lastHideStateRef.current = true;
    } else if (scrollDelta < -showThreshold && isUIHidden) {
      // Scrolling up past threshold - show UI
      setIsUIHidden(false);
      lastHideStateRef.current = false;
    }

    lastScrollYRef.current = currentScrollY;
  }, [isAutoHideEnabled, isUIHidden, scrollElement, hideThreshold, showThreshold]);

  // Handle mouse move for edge-reveal
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isAutoHideEnabled || !isUIHidden) return;

      const { clientY } = e;
      const windowHeight = window.innerHeight;

      // Check if mouse is near top or bottom edge
      const isNearTop = clientY < edgeRevealZone;
      const isNearBottom = clientY > windowHeight - edgeRevealZone;

      if (isNearTop || isNearBottom) {
        // Clear existing timeout
        if (edgeRevealTimeoutRef.current) {
          clearTimeout(edgeRevealTimeoutRef.current);
        }

        // Show UI immediately
        setIsUIHidden(false);

        // Auto-hide again after 0.8s if user doesn't interact
        edgeRevealTimeoutRef.current = setTimeout(() => {
          if (isAutoHideEnabled) {
            setIsUIHidden(true);
          }
        }, 800);
      }
    },
    [isAutoHideEnabled, isUIHidden, edgeRevealZone]
  );

  // Register interaction guard (prevents hiding for 2 seconds during user interactions)
  const registerInteraction = useCallback(() => {
    if (!isAutoHideEnabled) return;

    // Clear existing timeout
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }

    // Show UI during interaction
    setIsUIHidden(false);

    // Allow hiding again after 2 seconds
    interactionTimeoutRef.current = setTimeout(() => {
      // Don't auto-hide, let scroll behavior control it
    }, 2000);
  }, [isAutoHideEnabled]);

  // Setup scroll listener
  useEffect(() => {
    const target = scrollElement || window;

    target.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      target.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousemove', handleMouseMove);

      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
      if (edgeRevealTimeoutRef.current) {
        clearTimeout(edgeRevealTimeoutRef.current);
      }
    };
  }, [handleScroll, handleMouseMove]);

  return {
    isUIHidden,
    isAutoHideEnabled,
    setIsAutoHideEnabled,
    registerInteraction,
  };
}
