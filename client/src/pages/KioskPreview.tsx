import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { trpc } from '@/lib/trpc';

interface KioskAppearance {
  background: {
    type: 'color' | 'image' | 'preset';
    color: string;
    presetKey: string | null;
    customUrl: string | null;
    blur: number;
    dim: number;
    fit: 'cover' | 'contain' | 'stretch';
  };
  typography: {
    fontFamily: string;
    titleSize: number;
    titleWeight: number;
    subtitleSize: number;
    letterSpacing: number;
    buttonFontSize: number;
  };
  layout: {
    spacing: 'compact' | 'comfortable' | 'spacious';
    alignment: 'left' | 'center' | 'right';
    maxWidth: number;
  };
  content: {
    headline: string;
    subtext: string;
    logoUrl: string | null;
    accentColor: string;
  };
  behavior: {
    showMemberLogin: boolean;
    showNewStudent: boolean;
    idleSeconds: number;
    autoReturn: boolean;
    screensaverEnabled: boolean;
    screensaverMessage: string;
    screensaverLogoUrl: string | null;
  };
}

export default function KioskPreview() {
  const { locationId } = useParams<{ locationId: string }>();
  const [searchParams] = useSearchParams();
  const isStudioPreview = searchParams.get('studioPreview') === '1';
  const version = searchParams.get('v') || '1';

  const [appearance, setAppearance] = useState<KioskAppearance | null>(null);
  const [idleTime, setIdleTime] = useState(0);
  const [showScreensaver, setShowScreensaver] = useState(false);

  const locId = locationId ? parseInt(locationId) : 0;

  // Fetch published settings
  const { data: settingsData } = trpc.kioskStudio.getPublishedSettings.useQuery(
    { locationId: locId },
    { enabled: !!locId && !isStudioPreview }
  );

  // Initialize appearance from published settings
  useEffect(() => {
    if (settingsData?.appearance) {
      setAppearance(settingsData.appearance);
    }
  }, [settingsData]);

  // Listen for postMessage from studio
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'KIOSK_STUDIO_UPDATE') {
        setAppearance(event.data.appearance);
        setShowScreensaver(false);
        setIdleTime(0);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Idle detection (only in preview mode or if screensaver enabled)
  useEffect(() => {
    if (!appearance?.behavior.screensaverEnabled || isStudioPreview) {
      return;
    }

    const handleActivity = () => {
      setIdleTime(0);
      setShowScreensaver(false);
    };

    const timer = setInterval(() => {
      setIdleTime(prev => prev + 1);
      if (prev >= appearance.behavior.idleSeconds) {
        setShowScreensaver(true);
      }
    }, 1000);

    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keypress', handleActivity);

    return () => {
      clearInterval(timer);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keypress', handleActivity);
    };
  }, [appearance, isStudioPreview]);

  if (!appearance) {
    return <div className="flex items-center justify-center h-screen bg-white">Loading...</div>;
  }

  // Resolve background
  const getBackgroundStyle = () => {
    const bg = appearance.background;
    const baseStyle: React.CSSProperties = {
      backgroundSize: bg.fit,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };

    if (bg.type === 'color') {
      baseStyle.backgroundColor = bg.color;
    } else if (bg.type === 'image' && bg.customUrl) {
      baseStyle.backgroundImage = `url(${bg.customUrl})`;
    } else if (bg.type === 'preset' && bg.presetKey) {
      const presetMap: Record<string, string> = {
        'dojo-warm': '/public/presets/dojo-warm.jpg',
        'minimal-white': '/public/presets/minimal-white.jpg',
        'night-mode': '/public/presets/night-mode.jpg',
        'high-contrast': '/public/presets/high-contrast.jpg',
      };
      baseStyle.backgroundImage = `url(${presetMap[bg.presetKey] || '/public/presets/minimal-white.jpg'})`;
    }

    return baseStyle;
  };

  // Get spacing values
  const spacingMap = {
    compact: '1rem',
    comfortable: '2rem',
    spacious: '3rem',
  };

  const spacing = spacingMap[appearance.layout.spacing];

  return (
    <div
      className="kiosk-root w-full h-screen flex items-center justify-center overflow-hidden"
      style={{
        ...getBackgroundStyle(),
        filter: `blur(${appearance.background.blur}px) brightness(${100 - appearance.background.dim}%)`,
      }}
    >
      {/* Screensaver Overlay */}
      {showScreensaver && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 cursor-pointer"
          onClick={() => {
            setShowScreensaver(false);
            setIdleTime(0);
          }}
        >
          {appearance.behavior.screensaverLogoUrl && (
            <img
              src={appearance.behavior.screensaverLogoUrl}
              alt="Logo"
              className="w-24 h-24 mb-8 opacity-75"
            />
          )}
          <p
            className="text-white text-center"
            style={{
              fontSize: `${appearance.typography.titleSize * 0.5}px`,
              opacity: 0.7,
            }}
          >
            {appearance.behavior.screensaverMessage}
          </p>
        </div>
      )}

      {/* Main Content */}
      <div
        className="text-center px-8"
        style={{
          maxWidth: `${appearance.layout.maxWidth}px`,
          textAlign: appearance.layout.alignment as any,
          fontFamily: appearance.typography.fontFamily,
          letterSpacing: `${appearance.typography.letterSpacing}px`,
        }}
      >
        {appearance.content.logoUrl && (
          <img
            src={appearance.content.logoUrl}
            alt="Logo"
            className="mx-auto mb-8 max-w-xs"
            style={{
              marginBottom: spacing,
            }}
          />
        )}

        <h1
          className="font-bold mb-4"
          style={{
            fontSize: `${appearance.typography.titleSize}px`,
            fontWeight: appearance.typography.titleWeight,
            color: appearance.content.accentColor,
            marginBottom: spacing,
          }}
        >
          {appearance.content.headline}
        </h1>

        <p
          className="mb-8"
          style={{
            fontSize: `${appearance.typography.subtitleSize}px`,
            marginBottom: spacing,
            color: '#666',
          }}
        >
          {appearance.content.subtext}
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          {appearance.behavior.showMemberLogin && (
            <button
              className="px-6 py-3 rounded font-semibold transition-all hover:opacity-90"
              style={{
                fontSize: `${appearance.typography.buttonFontSize}px`,
                backgroundColor: appearance.content.accentColor,
                color: 'white',
              }}
            >
              Member Login
            </button>
          )}
          {appearance.behavior.showNewStudent && (
            <button
              className="px-6 py-3 rounded font-semibold border-2 transition-all hover:opacity-90"
              style={{
                fontSize: `${appearance.typography.buttonFontSize}px`,
                borderColor: appearance.content.accentColor,
                color: appearance.content.accentColor,
              }}
            >
              New Student
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
