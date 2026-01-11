import { ReactNode, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import KioskScreensaver from './KioskScreensaver';

interface KioskLayoutProps {
  children: ReactNode;
  backgroundImage?: string;
  backgroundPreset?: string;
  isStudioPreview?: boolean;
  idleSeconds?: number;
}

/**
 * KioskLayout - Isolated container for kiosk routes
 * 
 * Features:
 * - Kiosk-only background system (not shared with website)
 * - Conditional background: white default, image only when configured
 * - Idle detection with screensaver mode
 * - Touch-first, full-screen experience
 * - No website styles or navigation leakage
 */
export default function KioskLayout({
  children,
  backgroundImage,
  backgroundPreset = 'default',
  isStudioPreview = false,
  idleSeconds = 60,
}: KioskLayoutProps) {
  const { locationSlug } = useParams<{ locationSlug: string }>();
  const [isIdle, setIsIdle] = useState(false);

  // Idle detection - configurable timeout
  const IDLE_TIMEOUT = (idleSeconds || 60) * 1000; // Convert to milliseconds

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
  // 1. Custom upload (backgroundImage) - only if not empty
  // 2. Preset (backgroundPreset) - only if valid and not none/default
  // 3. No background (white default) - pure white, no ghost text
  const getBackgroundUrl = (): string | null => {
    // Only use custom image if it's a non-empty string
    if (backgroundImage && typeof backgroundImage === 'string' && backgroundImage.trim()) {
      return backgroundImage;
    }

    // Only use preset if it's not none, not default, and is a valid preset key
    if (backgroundPreset && backgroundPreset !== 'none' && backgroundPreset !== 'default' && backgroundPreset.trim()) {
      // Map preset keys to URLs
      const presets: Record<string, string> = {
        'dojo-warm-lights': '/kiosk-welcome-bg.jpg',
        'dojo-dark': '/kiosk-dark-bg.jpg',
        'dojo-minimal': '/kiosk-minimal-bg.jpg',
      };

      return presets[backgroundPreset] || null;
    }

    // No background configured - return null for pure white default
    return null;
  };

  // If idle, show screensaver (disabled in studio preview mode)
  if (isIdle && !isStudioPreview) {
    return <KioskScreensaver onReturn={() => setIsIdle(false)} />;
  }

  const backgroundUrl = getBackgroundUrl();
  const hasBackground = !!backgroundUrl;

  // Background style - only apply if image exists
  const backgroundStyle = hasBackground ? {
    backgroundImage: `url(${backgroundUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  } : {
    backgroundColor: '#ffffff',
    backgroundImage: 'none',
  };

  return (
    <div className="kiosk-root relative min-h-screen w-full overflow-hidden" style={backgroundStyle}>
      {/* Blur overlay for background - only when image exists */}
      {hasBackground && (
        <div className="absolute inset-0 backdrop-blur-sm bg-black/20" />
      )}

      {/* Vignette overlay - only when image exists */}
      {hasBackground && (
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/30" />
      )}

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
