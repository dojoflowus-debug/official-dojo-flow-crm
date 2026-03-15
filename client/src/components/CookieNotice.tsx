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
        top: 0,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-6px)',
        transition: 'opacity 700ms ease, transform 700ms ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      role="dialog"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-description"
    >
      <div className="bg-white border-b border-gray-200 shadow-lg">
        <div className="container mx-auto px-6 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p id="cookie-notice-description" className="text-sm text-gray-700 leading-relaxed flex-1">
              <span id="cookie-notice-title" className="font-semibold text-black">We use cookies</span>
              {' '}to enhance your experience, analyze traffic, and personalize content.{' '}
              <a
                href="/cookies"
                className="text-black underline hover:text-gray-600 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more
              </a>
            </p>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => dismiss('declined')}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={() => dismiss('accepted')}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-black rounded hover:bg-gray-800 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => dismiss('declined')}
                className="p-1 text-gray-400 hover:text-black transition-colors"
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
