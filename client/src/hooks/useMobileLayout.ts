import { useState, useEffect } from 'react'

/**
 * useMobileLayout — detects whether the current viewport is mobile-sized.
 * Breakpoints:
 *   mobile  < 768px
 *   tablet  768px – 1023px
 *   desktop >= 1024px
 */
export function useMobileLayout() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const [isTablet, setIsTablet] = useState(() => window.innerWidth >= 768 && window.innerWidth < 1024)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const mqTablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)')

    const update = () => {
      const w = window.innerWidth
      setIsMobile(w < 768)
      setIsTablet(w >= 768 && w < 1024)
      setIsDesktop(w >= 1024)
    }

    // Use ResizeObserver for accuracy (handles virtual keyboard resize too)
    const ro = new ResizeObserver(update)
    ro.observe(document.documentElement)

    update()
    return () => ro.disconnect()
  }, [])

  return { isMobile, isTablet, isDesktop }
}

/**
 * Trigger haptic feedback on supported devices (iOS + Android)
 */
export function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  // iOS Haptic Engine via webkit
  if ((navigator as any).vibrate) {
    const durations = { light: 10, medium: 20, heavy: 40 }
    navigator.vibrate(durations[style])
  }
}
