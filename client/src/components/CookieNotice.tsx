import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function CookieNotice() {
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const cookieConsent = localStorage.getItem('dojoflow-cookie-consent');
    if (!cookieConsent) {
      // Wait 3 seconds then fade in
      const timer = setTimeout(() => {
        setShow(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setVisible(true));
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = (value: 'accepted' | 'declined') => {
    setVisible(false);
    setTimeout(() => setShow(false), 500);
    localStorage.setItem('dojoflow-cookie-consent', value);
  };

  if (!show) return null;

  return (
    <div
      className="fixed left-0 right-0 z-[9999]"
      style={{
        top: '64px', // sits directly below the 64px (h-16) toolbar
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'opacity 600ms ease, transform 600ms ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      role="dialog"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-description"
    >
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="container mx-auto px-6 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p id="cookie-notice-description" className="text-sm text-white/80 leading-relaxed flex-1">
              <span id="cookie-notice-title" className="font-semibold text-white">We use cookies</span>
              {' '}to enhance your experience, analyze traffic, and personalize content.{' '}
              <a
                href="/cookies"
                className="text-white/60 underline hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more
              </a>
            </p>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => dismiss('declined')}
                className="px-3 py-1.5 text-xs font-medium text-white/60 border border-white/20 rounded hover:bg-white/10 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={() => dismiss('accepted')}
                className="px-4 py-1.5 text-xs font-semibold text-black bg-white rounded hover:bg-white/90 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => dismiss('declined')}
                className="p-1 text-white/40 hover:text-white transition-colors"
                aria-label="Close cookie notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
