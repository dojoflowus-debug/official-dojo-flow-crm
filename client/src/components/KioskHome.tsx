import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, LogIn, UserPlus, Settings } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import KioskScreensaver from './KioskScreensaver';
import { DEFAULT_KIOSK_CONFIG, KioskConfig } from '../../../shared/kioskConfig';

interface KioskHomeProps {
  locationName?: string;
  locationSlug?: string;
  config?: KioskConfig;
}

/**
 * KioskHome - Production kiosk home screen
 * 
 * Features:
 * - Large touch-friendly tiles (Check In, Start Training)
 * - Live clock display
 * - Real-time class schedule and focus areas
 * - Auto screensaver on idle
 * - Discreet staff login button
 * - iPad optimized
 */
export default function KioskHome({ locationName, locationSlug: propSlug, config: propConfig }: KioskHomeProps) {
  const navigate = useNavigate();
  const { locationSlug: routeSlug } = useParams<{ locationSlug: string }>();
  const slug = propSlug || routeSlug;
  
  // Use provided config or fallback to default
  const cfg = propConfig || DEFAULT_KIOSK_CONFIG;

  const [currentTime, setCurrentTime] = useState<string>('');
  const [fadeIn, setFadeIn] = useState(false);
  const [showScreensaver, setShowScreensaver] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch real kiosk data
  const { data: kioskData, isLoading: kioskDataLoading } = trpc.kiosk.getKioskData.useQuery(
    { slug: slug || '' },
    { enabled: !!slug }
  );

  // Define config shorthand for easier access
  const config = cfg;

  // Update clock every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setCurrentTime(timeString);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fade in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Idle detection and screensaver
  const idleTimeout = (cfg?.screensaver?.idleSeconds || 60) * 1000;

  const resetIdleTimer = () => {
    // Clear existing timers
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);

    setIsIdle(false);
    setShowScreensaver(false);

    // Set new idle timer
    idleTimeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      if (cfg?.screensaver?.enabled !== false) {
        setShowScreensaver(true);
      }
    }, idleTimeout);
  };

  // Setup idle detection
  useEffect(() => {
    resetIdleTimer();

    const handleActivity = () => {
      resetIdleTimer();
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    };
  }, [idleTimeout, cfg?.screensaver?.enabled]);

  // Show screensaver if idle
  if (showScreensaver) {
    return (
      <KioskScreensaver
        message={cfg?.screensaver?.message || 'Tap the screen to check-in'}
        showLogo={cfg?.screensaver?.showLogo !== false}
        onActivity={() => {
          setShowScreensaver(false);
          resetIdleTimer();
        }}
      />
    );
  }

  // Get display data
  const displayName = locationName || kioskData?.locationName || 'Main Dojo';
  const nextClass = kioskData?.nextClass || {
    name: 'Kids Karate',
    time: '5:30 PM',
    minutesUntil: 18,
  };
  const todaysFocus = kioskData?.todaysFocus || ['Discipline', 'Confidence', 'Fitness'];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8" style={{ fontFamily: cfg?.theme?.fontFamily || 'Inter', backgroundColor: '#f5f5f5' }}>
      {/* Header Section */}
      <div
        className={`w-full max-w-6xl transition-all duration-1000 ${
          fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Top Bar: Logo + Time */}
        <div className="flex items-center justify-between mb-8">
          {/* Logo + Dojo Name */}
          <div className="flex items-center gap-3">
            <img
              src="/logo-icon.png"
              alt="DojoFlow"
              className="h-10 w-10 object-contain drop-shadow-lg"
            />
            <div>
              <p style={{ color: '#999', fontSize: '12px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>DojoFlow</p>
              <p style={{ color: cfg?.theme?.accentColor || '#111', fontSize: '20px', fontWeight: 700, letterSpacing: '0px' }}>
                {displayName}
              </p>
            </div>
          </div>

          {/* Live Clock */}
          <div className="flex items-center gap-2 rounded-full px-6 py-3 border border-gray-300" style={{ backgroundColor: '#f0f0f0' }}>
            <Clock className="h-5 w-5" style={{ color: '#666' }} />
            <span style={{ color: '#111', fontFamily: 'monospace', fontSize: '18px', fontWeight: 600 }}>
              {currentTime || '--:--:--'}
            </span>
          </div>
        </div>

        {/* Info Bar */}
        {cfg?.layout?.showInfoBar !== false && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {/* Next Class */}
            <div className="rounded-2xl px-6 py-4 border border-gray-300" style={{ backgroundColor: '#f0f0f0' }}>
              <p style={{ color: '#666', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                {cfg?.content?.infoLeftLabel || 'Next Class'}
              </p>
              <p style={{ color: '#111', fontSize: '18px', fontWeight: 600 }}>
                {nextClass?.name} at {nextClass?.time}
              </p>
              <p style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                in {nextClass?.minutesUntil} minutes
              </p>
            </div>

            {/* Today's Focus */}
            <div className="rounded-2xl px-6 py-4 border border-gray-300" style={{ backgroundColor: '#f0f0f0' }}>
              <p style={{ color: '#666', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                {cfg?.content?.infoRightLabel || "Today's Focus"}
              </p>
              <p style={{ color: '#111', fontSize: '18px', fontWeight: 600 }}>
                {todaysFocus.join(' • ')}
              </p>
            </div>
          </div>
        )}

        {/* Main Action Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Check In Tile */}
          <button
            onClick={() => navigate(`/kiosk/${slug}/checkin`)}
            className="group relative bg-white border-2 border-gray-300 rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
          >
            {/* Icon Circle */}
            <div className="relative flex justify-center mb-8">
              <div className="relative p-8 rounded-full shadow-2xl" style={{ backgroundColor: cfg?.theme?.accentColor || '#ef4444' }}>
                <svg
                  className="h-16 w-16 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Text Content */}
            <div className="relative text-center space-y-2">
              <h2 style={{
                color: cfg?.theme?.accentColor || '#111',
                fontSize: (cfg?.typography?.titleSize || 48) + 'px',
                fontWeight: cfg?.typography?.titleWeight || 700,
                letterSpacing: (cfg?.typography?.letterSpacing || 0) + 'px',
              }}>
                {cfg?.content?.tileLeft?.title || 'Check In'}
              </h2>
              <p style={{
                color: '#666',
                fontSize: (cfg?.typography?.subtitleSize || 24) + 'px',
              }}>
                {cfg?.content?.tileLeft?.subtitle || 'Tap here to check into class'}
              </p>
            </div>

            {/* Bottom Button */}
            <div className="relative mt-8 pt-8 border-t border-gray-300">
              <div className="w-full py-4 rounded-2xl text-white text-center font-bold shadow-lg hover:opacity-90 transition-all" style={{ backgroundColor: cfg?.theme?.accentColor || '#ef4444', fontSize: (cfg?.typography?.buttonFontSize || 16) + 'px' }}>
                {cfg?.content?.tileLeft?.button || 'Check In'}
              </div>
            </div>
          </button>

          {/* Start Training Tile */}
          <button
            onClick={() => navigate(`/kiosk/${slug}/new-student`)}
            className="group relative bg-white border-2 border-gray-300 rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
          >
            {/* Icon Circle */}
            <div className="relative flex justify-center mb-8">
              <div className="relative p-8 rounded-full shadow-2xl" style={{ backgroundColor: cfg?.theme?.accentColor || '#ef4444' }}>
                <svg
                  className="h-16 w-16 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
            </div>

            {/* Text Content */}
            <div className="relative text-center space-y-2">
              <h2 style={{
                color: cfg?.theme?.accentColor || '#111',
                fontSize: (cfg?.typography?.titleSize || 48) + 'px',
                fontWeight: cfg?.typography?.titleWeight || 700,
                letterSpacing: (cfg?.typography?.letterSpacing || 0) + 'px',
              }}>
                {cfg?.content?.tileRight?.title || 'Start Training'}
              </h2>
              <p style={{
                color: '#666',
                fontSize: (cfg?.typography?.subtitleSize || 24) + 'px',
              }}>
                {cfg?.content?.tileRight?.subtitle || 'New students start here'}
              </p>
            </div>

            {/* Bottom Button */}
            <div className="relative mt-8 pt-8 border-t border-gray-300">
              <div className="w-full py-4 rounded-2xl text-white text-center font-bold shadow-lg hover:opacity-90 transition-all" style={{ backgroundColor: cfg?.theme?.accentColor || '#ef4444', fontSize: (cfg?.typography?.buttonFontSize || 16) + 'px' }}>
                {cfg?.content?.tileRight?.button || 'Start Training'}
              </div>
            </div>
          </button>
        </div>

        {/* Footer: Staff Login */}
        <div className="text-center">
          <button
            onClick={() => navigate(`/kiosk/${slug}/staff-login`)}
            className="flex items-center gap-2 mx-auto transition-colors text-sm font-medium"
            style={{ color: '#999' }}
          >
            <Settings className="h-4 w-4" />
            Staff Login
          </button>
        </div>
      </div>
    </div>
  );
}
