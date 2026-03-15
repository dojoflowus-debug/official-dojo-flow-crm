import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function CookieNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const cookieConsent = localStorage.getItem('dojoflow-cookie-consent');
    if (!cookieConsent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('dojoflow-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('dojoflow-cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] animate-in slide-in-from-top duration-500"
      role="dialog"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-description"
    >
      <div className="bg-white border-b border-gray-200 shadow-md">
        <div className="container mx-auto px-6 py-2.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p id="cookie-notice-description" className="text-sm text-gray-700 leading-relaxed flex-1">
              <span id="cookie-notice-title" className="font-semibold text-black">We use cookies</span>
              {' '}to enhance your browsing experience, analyze site traffic, and personalize content.{' '}
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
                onClick={handleDecline}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-black rounded hover:bg-gray-800 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={handleDecline}
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
