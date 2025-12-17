import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, UserPlus } from 'lucide-react';

export default function Kiosk() {
  const navigate = useNavigate();

  // Use hardcoded values from database (temporary workaround for Drizzle connection issues)
  const displayName = 'DojoFlow';
  const displayLogo = 'https://test-logo-url.com/logo.png';

  // Idle timeout - return to welcome screen after 30 seconds of inactivity
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    const resetIdleTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }
      
      timer = setTimeout(() => {
        // Return to welcome screen (reload page)
        window.location.reload();
      }, 30000); // 30 seconds
    };

    // Reset timer on any user interaction
    const handleInteraction = () => {
      resetIdleTimer();
    };

    window.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('keypress', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });

    // Start initial timer
    resetIdleTimer();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keypress', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle background image - optional dojo image */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: 'url(/dojo-background.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl w-full space-y-12">
        {/* School Logo and Name */}
        <div className="text-center space-y-6">
          {displayLogo && (
            <div className="flex justify-center">
              <img 
                src={displayLogo} 
                alt={displayName} 
                className="h-32 w-32 object-contain rounded-2xl shadow-2xl"
              />
            </div>
          )}
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-3">
              Welcome to
            </h1>
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
              {displayName}
            </h2>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Member Login Button */}
          <Card 
            className="border-slate-700 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-800/50 transition-all cursor-pointer group p-8"
            onClick={() => navigate('/kiosk/member-login')}
          >
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-6 rounded-full bg-gradient-to-br from-green-600 to-green-700 group-hover:from-green-500 group-hover:to-green-600 transition-all shadow-lg">
                  <CheckCircle2 className="h-16 w-16 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  Member Login
                </h3>
                <p className="text-lg text-slate-300">
                  Returning members
                </p>
              </div>
            </div>
          </Card>

          {/* New Student Button */}
          <Card 
            className="border-slate-700 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-800/50 transition-all cursor-pointer group p-8"
            onClick={() => navigate('/enrollment')}
          >
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-6 rounded-full bg-gradient-to-br from-red-600 to-red-700 group-hover:from-red-500 group-hover:to-red-600 transition-all shadow-lg">
                  <UserPlus className="h-16 w-16 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  New Student
                </h3>
                <p className="text-lg text-slate-300">
                  Start your journey
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Staff Login Link */}
        <div className="text-center">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white text-sm"
            onClick={() => navigate('/login')}
          >
            Staff Login
          </Button>
        </div>
      </div>

      {/* Kiosk Mode Indicator */}
      <div className="absolute bottom-4 right-4 text-xs text-slate-600">
        Kiosk Mode
      </div>
    </div>
  );
}
