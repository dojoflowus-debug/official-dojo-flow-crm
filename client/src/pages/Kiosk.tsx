import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, UserPlus, Settings } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function Kiosk() {
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);

  // Fetch school branding
  const { data: brandData } = trpc.setupWizard.getBrand.useQuery();
  const displayName = brandData?.businessName || 'DojoFlow';
  const displayLogo = brandData?.logoSquare || '/logo-icon.png';

  // Fade in animation on mount
  useEffect(() => {
    setFadeIn(true);
  }, []);

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
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Warm Dojo Background Image with Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/kiosk-welcome-bg.jpg)',
          filter: 'blur(3px)',
          transform: 'scale(1.05)',
        }}
      />

      {/* Vignette Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Content Container with Fade-in Animation */}
      <div 
        className={`relative z-10 w-full max-w-4xl px-8 transition-all duration-1000 ${
          fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Header: DojoFlow Logo + School Name */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="/logo-icon.png" 
              alt="DojoFlow" 
              className="h-10 w-10 object-contain"
            />
            <span className="text-white text-xl font-semibold tracking-wide">
              DojoFlow
            </span>
          </div>
          <h2 className="text-white text-3xl font-bold tracking-wide">
            {displayName}
          </h2>
          <div className="h-px w-32 mx-auto mt-3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>

        {/* Main Headline */}
        <div className="text-center mb-12">
          <h1 className="text-white text-5xl md:text-6xl font-bold mb-3 tracking-tight">
            Welcome to Training
          </h1>
          <p className="text-white/80 text-xl">
            Sign in or get started below
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Member Login Card */}
          <div
            onClick={() => navigate('/kiosk/member-login')}
            className="group relative bg-gradient-to-br from-slate-900/70 to-slate-800/70 backdrop-blur-md rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-white/10"
          >
            {/* Icon Circle */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/30 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative p-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="text-center">
              <h3 className="text-white text-3xl font-bold mb-2">
                Member Login
              </h3>
              <p className="text-white/70 text-lg">
                I already train here
              </p>
            </div>

            {/* Bottom Button */}
            <div className="mt-6">
              <div className="w-full py-3 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 text-white text-center font-semibold shadow-lg group-hover:from-green-500 group-hover:to-green-600 transition-all">
                Member Login
              </div>
              <p className="text-center text-white/50 text-sm mt-2">
                I already train here
              </p>
            </div>
          </div>

          {/* New Student Card */}
          <div
            onClick={() => navigate('/enrollment')}
            className="group relative bg-gradient-to-br from-slate-900/70 to-slate-800/70 backdrop-blur-md rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-white/10"
          >
            {/* Icon Circle */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative p-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                  <UserPlus className="h-12 w-12 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="text-center">
              <h3 className="text-white text-3xl font-bold mb-2">
                New Student
              </h3>
              <p className="text-white/70 text-lg">
                I'm new and want to get started
              </p>
            </div>

            {/* Bottom Button */}
            <div className="mt-6">
              <div className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white text-center font-semibold shadow-lg group-hover:from-red-500 group-hover:to-red-600 transition-all">
                New Student
              </div>
              <p className="text-center text-white/50 text-sm mt-2">
                I'm new and want to get started
              </p>
            </div>
          </div>
        </div>

        {/* Footer: Staff Login */}
        <div className="text-center">
          <Button
            variant="ghost"
            className="text-white/60 hover:text-white text-base transition-colors"
            onClick={() => navigate('/login')}
          >
            Staff Login
          </Button>
        </div>
      </div>

      {/* Kiosk Mode Indicator */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 text-white/40 text-sm">
        <Settings className="h-4 w-4" />
        <span>Kiosk Mode</span>
      </div>
    </div>
  );
}
