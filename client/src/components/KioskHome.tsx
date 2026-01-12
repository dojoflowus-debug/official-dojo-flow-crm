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
  const config = propConfig || DEFAULT_KIOSK_CONFIG;

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
  const idleTimeout = (config?.screensaver?.idleSeconds || 60) * 1000;

  const resetIdleTimer = () => {
    // Clear existing timers
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);

    setIsIdle(false);
    setShowScreensaver(false);

    // Set new idle timer
    idleTimeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      if (config?.screensaver?.enabled !== false) {
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
  }, [idleTimeout, config?.screensaver?.enabled]);

  // Show screensaver if idle
  if (showScreensaver) {
    return (
      <KioskScreensaver
        message={config?.screensaver?.message || 'Tap the screen to check-in'}
        showLogo={config?.screensaver?.showLogo !== false}
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8 bg-white">
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
              <p className="text-gray-500 text-xs font-medium tracking-wide uppercase">DojoFlow</p>
              <p className="text-black text-xl font-bold tracking-tight">
                {displayName}
              </p>
            </div>
          </div>

          {/* Live Clock */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-6 py-3 border border-gray-300">
            <Clock className="h-5 w-5 text-gray-700" />
            <span className="text-black font-mono text-lg font-semibold">
              {currentTime || '--:--:--'}
            </span>
          </div>
        </div>

        {/* Info Bar */}
        {config?.layout?.showInfoBar !== false && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {/* Next Class */}
            <div className="bg-gray-100 rounded-2xl px-6 py-4 border border-gray-300">
              <p className="text-gray-600 text-sm font-medium mb-1">
                {config?.content?.infoLeftLabel || 'Next Class'}
              </p>
              <p className="text-black text-lg font-semibold">
                {nextClass?.name} at {nextClass?.time}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                in {nextClass?.minutesUntil} minutes
              </p>
            </div>

            {/* Today's Focus */}
            <div className="bg-gray-100 rounded-2xl px-6 py-4 border border-gray-300">
              <p className="text-gray-600 text-sm font-medium mb-1">
                {config?.content?.infoRightLabel || "Today's Focus"}
              </p>
              <p className="text-black text-lg font-semibold">
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
              <div className="relative p-8 rounded-full bg-blue-500 shadow-2xl">
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
              <h2 className="text-black text-4xl font-bold">
                {config?.content?.tileLeft?.title || 'Check In'}
              </h2>
              <p className="text-gray-600 text-lg">
                {config?.content?.tileLeft?.subtitle || 'Tap here to check into class'}
              </p>
            </div>

            {/* Bottom Button */}
            <div className="relative mt-8 pt-8 border-t border-gray-300">
              <div className="w-full py-4 rounded-2xl bg-blue-500 text-white text-center font-bold text-lg shadow-lg hover:bg-blue-600 transition-all">
                {config?.content?.tileLeft?.button || 'Check In'}
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
              <div className="relative p-8 rounded-full bg-red-500 shadow-2xl">
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
              <h2 className="text-black text-4xl font-bold">
                {config?.content?.tileRight?.title || 'Start Training'}
              </h2>
              <p className="text-gray-600 text-lg">
                {config?.content?.tileRight?.subtitle || 'New students start here'}
              </p>
            </div>

            {/* Bottom Button */}
            <div className="relative mt-8 pt-8 border-t border-gray-300">
              <div className="w-full py-4 rounded-2xl bg-red-500 text-white text-center font-bold text-lg shadow-lg hover:bg-red-600 transition-all">
                {config?.content?.tileRight?.button || 'Start Training'}
              </div>
            </div>
          </button>
        </div>

        {/* Footer: Staff Login */}
        <div className="text-center">
          <button
            onClick={() => navigate(`/kiosk/${slug}/staff-login`)}
            className="flex items-center gap-2 mx-auto text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
          >
            <Settings className="h-4 w-4" />
            Staff Login
          </button>
        </div>
      </div>
    </div>
  );
}
