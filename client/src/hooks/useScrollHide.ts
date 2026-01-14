import { useState, useEffect, useRef, useCallback } from 'react';

interface UseScrollHideOptions {
  threshold?: number; // Pixels scrolled before triggering hide/show (default: 10)
  scrollElement?: HTMLElement | null; // Element to track scroll on (default: window)
}

/**
 * Custom hook for tracking scroll direction and managing UI visibility
 * Returns whether UI should be hidden based on scroll direction
 */
export function useScrollHide(options: UseScrollHideOptions = {}) {
  const { threshold = 10, scrollElement = null } = options;
  
  const [isUIHidden, setIsUIHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback(() => {
    // Get current scroll position
    const currentScrollY = scrollElement 
      ? scrollElement.scrollTop 
      : window.scrollY;

    const lastScrollY = lastScrollYRef.current;
    const scrollDelta = Math.abs(currentScrollY - lastScrollY);

    // Only trigger if scroll delta exceeds threshold
    if (scrollDelta >= threshold) {
      // Scrolling down - hide UI
      if (currentScrollY > lastScrollY) {
        setIsUIHidden(true);
      }
      // Scrolling up - show UI
      else if (currentScrollY < lastScrollY) {
        setIsUIHidden(false);
      }

      lastScrollYRef.current = currentScrollY;
    }

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Show UI if user stops scrolling for 1.5 seconds
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUIHidden(false);
    }, 1500);
  }, [threshold, scrollElement]);

  useEffect(() => {
    const target = scrollElement || window;
    
    target.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      target.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll, scrollElement]);

  return isUIHidden;
}
