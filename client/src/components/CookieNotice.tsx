import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CookieNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted/declined cookies
    const cookieConsent = localStorage.getItem('dojoflow-cookie-consent');
    
    if (!cookieConsent) {
      // Show notice after a short delay for better UX
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
      className="fixed bottom-0 left-0 right-0 z-[100] animate-in slide-in-from-bottom duration-500"
      role="dialog"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-description"
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 shadow-2xl">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 id="cookie-notice-title" className="text-lg font-semibold text-white mb-2">
                🍪 We use cookies
              </h3>
              <p id="cookie-notice-description" className="text-sm text-slate-300 leading-relaxed">
                We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                By clicking "Accept", you consent to our use of cookies.{' '}
                <a 
                  href="/cookies" 
                  className="text-red-400 hover:text-red-300 underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                </a>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDecline}
                variant="outline"
                className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                className="bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg shadow-red-600/20 transition-all"
              >
                Accept Cookies
              </Button>
              <button
                onClick={handleDecline}
                className="ml-2 p-2 text-slate-400 hover:text-white transition-colors"
                aria-label="Close cookie notice"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
