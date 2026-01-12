import { ReactNode, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import KioskScreensaver from './KioskScreensaver';
import { KioskConfig } from '../../../shared/kioskConfig';

interface KioskLayoutProps {
  children: ReactNode;
  config?: KioskConfig;
  isStudioPreview?: boolean;
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
  config,
  isStudioPreview = false,
}: KioskLayoutProps) {
  const { locationSlug } = useParams<{ locationSlug: string }>();
  const [isIdle, setIsIdle] = useState(false);

  // Idle detection - configurable timeout
  const IDLE_TIMEOUT = (config?.screensaver?.idleSeconds || 60) * 1000; // Convert to milliseconds

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
  }, [IDLE_TIMEOUT]);

  // Get background configuration with priority:
  // 1. Custom image (type=custom and customUrl)
  // 2. Preset (type=preset and presetKey)
  // 3. Solid color (type=solid and color)
  // 4. Default white
  const getBackgroundStyle = (): React.CSSProperties => {
    const settings = config?.background || {};
    const type = settings.type || 'solid';
    const blur = settings.blur || 0;
    const dim = settings.dim || 0;
    const fit = settings.fit || 'cover';

    // Priority 1: Custom image
    if (type === 'custom' && settings.customUrl && typeof settings.customUrl === 'string' && settings.customUrl.trim()) {
      return {
        backgroundImage: `url(${settings.customUrl})`,
        backgroundSize: fit,
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        filter: `blur(${blur}px) brightness(${1 - dim / 100})`,
      };
    }

    // Priority 2: Preset
    if (type === 'preset' && settings.presetKey) {
      const presets: Record<string, string> = {
        'dojo-warm-lights': '/kiosk-welcome-bg.jpg',
        'dojo-dark': '/kiosk-dark-bg.jpg',
        'dojo-minimal': '/kiosk-minimal-bg.jpg',
      };
      const presetUrl = presets[settings.presetKey];
      if (presetUrl) {
        return {
          backgroundImage: `url(${presetUrl})`,
          backgroundSize: fit,
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          filter: `blur(${blur}px) brightness(${1 - dim / 100})`,
        };
      }
    }

    // Priority 3: Solid color
    if (type === 'solid') {
      return {
        backgroundColor: settings.color || '#ffffff',
        backgroundImage: 'none',
      };
    }

    // Fallback: white
    return {
      backgroundColor: '#ffffff',
      backgroundImage: 'none',
    };
  };

  // If idle, show screensaver (disabled in studio preview mode)
  if (isIdle && !isStudioPreview && config?.screensaver?.enabled) {
    return <KioskScreensaver onReturn={() => setIsIdle(false)} message={config?.screensaver?.message} showLogo={config?.screensaver?.showLogo} />;
  }

  const backgroundStyle = getBackgroundStyle();
  const hasImage = backgroundStyle.backgroundImage && backgroundStyle.backgroundImage !== 'none';

  return (
    <div className="kiosk-root relative min-h-screen w-full overflow-hidden" style={backgroundStyle}>
      {/* Blur overlay for background - only when image exists */}
      {hasImage && (
        <div className="absolute inset-0 backdrop-blur-sm bg-black/20" />
      )}

      {/* Vignette overlay - only when image exists */}
      {hasImage && (
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
