import { ReactNode, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import KioskScreensaver from './KioskScreensaver';
import { KioskConfig } from '../../../shared/kioskConfig';
import { getPresetById } from '../../../shared/kioskBackgroundPresets';

interface KioskLayoutProps {
  children: ReactNode;
  config?: KioskConfig;
  isStudioPreview?: boolean;
}

/**
 * KioskLayout - Isolated container for kiosk routes with proper background layering
 * 
 * Layer Structure (from back to front):
 * 1. Background Layer - Image/color with blur applied ONLY to this layer
 * 2. Dim Overlay Layer - Semi-transparent overlay (no blur)
 * 3. Content Layer - Sharp UI, cards, buttons, text (z-10, no blur)
 * 
 * This ensures:
 * - Blur only affects the background image
 * - Dim only darkens the background
 * - UI content remains crisp and sharp
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

  // Get background image and settings
  const getBackgroundImage = (): { url: string | null; blur: number; dim: number; fit: string } => {
    const settings = config?.background || {};
    const type = settings.type || 'color';
    const blur = settings.blur || 0;
    const dim = settings.dim || 0;
    const fit = settings.fit || 'cover';

    // Priority 1: Preset from new presets system
    if (type === 'preset' && settings.presetKey) {
      const preset = getPresetById(settings.presetKey);
      if (preset && preset.imageUrl) {
        const presetBlur = blur || preset.blur || 0;
        const presetDim = dim || preset.dim || 0;
        return {
          url: preset.imageUrl,
          blur: presetBlur,
          dim: presetDim,
          fit: fit,
        };
      }
    }

    // Priority 2: Custom image
    if (type === 'custom' && settings.customUrl && typeof settings.customUrl === 'string' && settings.customUrl.trim()) {
      return {
        url: settings.customUrl,
        blur: blur,
        dim: dim,
        fit: fit,
      };
    }

    // No image (solid color or default)
    return {
      url: null,
      blur: 0,
      dim: 0,
      fit: fit,
    };
  };

  // Get background color
  const getBackgroundColor = (): string => {
    const settings = config?.background || {};
    const type = settings.type || 'color';

    if (type === 'color') {
      return settings.color || '#ffffff';
    }

    // Default white for image backgrounds
    return '#ffffff';
  };

  // If idle, show screensaver (disabled in studio preview mode)
  if (isIdle && !isStudioPreview && config?.screensaver?.enabled) {
    return <KioskScreensaver onReturn={() => setIsIdle(false)} message={config?.screensaver?.message} showLogo={config?.screensaver?.showLogo} />;
  }

  const backgroundInfo = getBackgroundImage();
  const backgroundColor = getBackgroundColor();
  const hasImage = backgroundInfo.url !== null;

  return (
    <div className="kiosk-root relative min-h-screen w-full overflow-hidden" style={{ backgroundColor }}>
      {/* LAYER 1: Background Image with Blur (z-0) */}
      {hasImage && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${backgroundInfo.url})`,
            backgroundSize: backgroundInfo.fit,
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            filter: `blur(${backgroundInfo.blur}px)`,
          }}
        />
      )}

      {/* LAYER 2: Dim Overlay (z-1) - Semi-transparent, no blur */}
      {hasImage && backgroundInfo.dim > 0 && (
        <div
          className="absolute inset-0 z-1"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${backgroundInfo.dim / 100})`,
          }}
        />
      )}

      {/* Optional: Vignette effect for better text readability (z-2) */}
      {hasImage && (
        <div className="absolute inset-0 z-2 bg-gradient-to-br from-black/5 via-transparent to-black/10 pointer-events-none" />
      )}

      {/* LAYER 3: Content (z-10) - Sharp, no blur, interactive */}
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
