import React, { ReactNode, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import KioskScreensaver from './KioskScreensaver';

interface KioskLayoutProps {
  children: ReactNode;
  backgroundImage?: string;
  backgroundPreset?: string;
}

/**
 * KioskLayout - Isolated container for kiosk routes
 * 
 * Features:
 * - Kiosk-only background system (not shared with website)
 * - Idle detection with screensaver mode
 * - Touch-first, full-screen experience
 * - No website styles or navigation leakage
 */
export default function KioskLayout({
  children,
  backgroundImage,
  backgroundPreset = 'default',
}: KioskLayoutProps) {
  const { locationSlug } = useParams<{ locationSlug: string }>();
  const [isIdle, setIsIdle] = useState(false);

  // Idle detection - 60 seconds
  const IDLE_TIMEOUT = 60000; // 60 seconds

  useEffect(() => {
    let currentTimer: NodeJS.Timeout | null = null;

    const resetIdleTimer = () => {
      // Clear existing timer
      if (currentTimer) {
        clearTimeout(currentTimer);
      }

      // Set new timer
      currentTimer = setTimeout(() => {
        setIsIdle(true);
      }, IDLE_TIMEOUT);
    };

    const handleUserInteraction = () => {
      setIsIdle(false);
      resetIdleTimer();
    };

    // Listen for user interactions
    window.addEventListener('click', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    window.addEventListener('keypress', handleUserInteraction, { passive: true });
    window.addEventListener('mousemove', handleUserInteraction, { passive: true });

    // Initialize timer
    resetIdleTimer();

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('keypress', handleUserInteraction);
      window.removeEventListener('mousemove', handleUserInteraction);

      if (currentTimer) {
        clearTimeout(currentTimer);
      }
    };
  }, []);

  // Get background image URL based on priority:
  // 1. Custom upload (backgroundImage)
  // 2. Preset (backgroundPreset)
  // 3. System default
  const getBackgroundUrl = (): string => {
    if (backgroundImage) {
      return backgroundImage;
    }

    // Map preset keys to URLs
    const presets: Record<string, string> = {
      'dojo-warm-lights': '/kiosk-welcome-bg.jpg',
      'dojo-dark': '/kiosk-dark-bg.jpg',
      'dojo-minimal': '/kiosk-minimal-bg.jpg',
      'default': '/kiosk-welcome-bg.jpg',
    };

    return presets[backgroundPreset] || presets['default'];
  };

  // If idle, show screensaver
  if (isIdle) {
    return <KioskScreensaver onReturn={() => setIsIdle(false)} />;
  }

  // Background image with blur and vignette
  const backgroundUrl = getBackgroundUrl();
  const backgroundStyle = {
    backgroundImage: `url(${backgroundUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={backgroundStyle}>
      {/* Blur overlay for background */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/20" />

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/30" />

      {/* Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>

      {/* Kiosk mode indicator (bottom right, subtle) */}
      <div className="absolute bottom-4 right-4 z-20 text-white/30 text-xs font-medium tracking-wide">
        Kiosk Mode • {locationSlug || 'main'}
      </div>
    </div>
  );
}
