import { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandaloneMode =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  useEffect(() => {
    // Already installed — don't show
    if (isInStandaloneMode) return;

    // Check if user previously dismissed
    const dismissedAt = localStorage.getItem('pwa_install_dismissed');
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 14) return; // Don't show again for 14 days
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroidBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari: show guide after 3 seconds if on mobile
    if (isIOS) {
      const timer = setTimeout(() => setShowIOSGuide(true), 3000);
      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        clearTimeout(timer);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowAndroidBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowAndroidBanner(false);
    setShowIOSGuide(false);
    setDismissed(true);
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  if (dismissed || isInStandaloneMode) return null;

  // Android install banner
  if (showAndroidBanner) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(var(--bottom-nav-height, 72px) + env(safe-area-inset-bottom, 0px) + 8px)',
          left: '12px',
          right: '12px',
          zIndex: 9999,
          backgroundColor: '#1a1a1a',
          border: '1px solid rgba(229, 57, 53, 0.4)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <img src="/icon-96.png" alt="DojoFlow" style={{ width: 48, height: 48, borderRadius: 12 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>Install DojoFlow</p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, margin: '2px 0 0 0' }}>
            Add to home screen for the best experience
          </p>
        </div>
        <button
          onClick={handleAndroidInstall}
          style={{
            backgroundColor: '#E53935',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
          }}
        >
          <Download size={14} />
          Install
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  // iOS install guide
  if (showIOSGuide && isIOS) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(var(--bottom-nav-height, 72px) + env(safe-area-inset-bottom, 0px) + 8px)',
          left: '12px',
          right: '12px',
          zIndex: 9999,
          backgroundColor: '#1a1a1a',
          border: '1px solid rgba(229, 57, 53, 0.4)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <img src="/icon-96.png" alt="DojoFlow" style={{ width: 44, height: 44, borderRadius: 10 }} />
          <div style={{ flex: 1 }}>
            <p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>Install DojoFlow on iPhone</p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, margin: '2px 0 0 0' }}>
              Get the full app experience
            </p>
          </div>
          <button
            onClick={handleDismiss}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>1</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: 0 }}>
              Tap the <Share size={13} style={{ display: 'inline', verticalAlign: 'middle', color: '#60a5fa' }} /> <strong style={{ color: 'white' }}>Share</strong> button in Safari
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>2</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: 0 }}>
              Scroll down and tap <strong style={{ color: 'white' }}>"Add to Home Screen"</strong>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>3</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: 0 }}>
              Tap <strong style={{ color: 'white' }}>"Add"</strong> — DojoFlow opens like a native app!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
