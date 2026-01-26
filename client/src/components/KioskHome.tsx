import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, LogIn, UserPlus, Settings, Calendar, Users, Info, Home, HelpCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import KioskScreensaver from './KioskScreensaver';
import { DEFAULT_KIOSK_CONFIG, KioskConfig } from '../../../shared/kioskConfig';

interface KioskHomeProps {
  locationName?: string;
  locationSlug?: string;
  config?: KioskConfig;
}

/**
 * KioskHome - Premium Location Experience
 * 
 * Redesigned as a cinematic, full-screen kiosk display optimized for:
 * - Touch interaction from 5-10 feet away
 * - Luxury gym lobby aesthetic
 * - Large, obvious action cards
 * - Real-time location information
 * - Persistent navigation dock
 * 
 * Features:
 * - Cinematic hero section with location name, live clock, temperature, next class countdown
 * - Five primary action cards (Check In, Book Class, Schedule, Programs, About)
 * - Today's schedule preview with class times and instructors
 * - Persistent bottom navigation dock
 * - Warm dark tones, red/ember accents, glass morphism effects
 * - Auto screensaver on idle
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
  const [temperature, setTemperature] = useState<number | null>(null);
  const [activeNav, setActiveNav] = useState<'home' | 'schedule' | 'checkin' | 'programs' | 'help'>('home');
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

  // Simulate temperature (in production, fetch from weather API)
  useEffect(() => {
    setTemperature(72);
  }, []);

  // Idle detection and screensaver
  const idleTimeout = (cfg?.screensaver?.idleSeconds || 60) * 1000;

  const resetIdleTimer = () => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);

    setIsIdle(false);
    setShowScreensaver(false);

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
  const todaysClasses = kioskData?.todaysClasses || [
    { name: 'Kids Karate', time: '4:00 PM', instructor: 'Sensei Mike', capacity: '8/12' },
    { name: 'Adult Kickboxing', time: '5:30 PM', instructor: 'Sensei Sarah', capacity: '6/10' },
    { name: 'Advanced Forms', time: '7:00 PM', instructor: 'Sensei James', capacity: '5/8' },
  ];

  const accentColor = cfg?.theme?.accentColor || '#ef4444';
  const fontFamily = cfg?.theme?.fontFamily || 'Inter';

  return (
    <div 
      className="min-h-screen w-full flex flex-col overflow-hidden"
      style={{ 
        fontFamily,
        background: 'linear-gradient(135deg, #1a1410 0%, #2a2420 50%, #1f1b16 100%)',
      }}
    >
      {/* HERO SECTION - Full width cinematic header */}
      <div className={`relative w-full px-8 pt-8 pb-12 transition-all duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        {/* Background gradient overlay */}
        <div className="absolute inset-0 opacity-30" style={{
          background: `radial-gradient(circle at 50% 0%, ${accentColor}40, transparent 70%)`
        }} />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Top Row: Location Name + Live Clock + Temperature */}
          <div className="flex items-center justify-between mb-8">
            {/* Location Name - Large, Premium Typography */}
            <div className="flex-1">
              <h1 style={{
                fontSize: '56px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-1px',
                marginBottom: '4px',
              }}>
                {displayName}
              </h1>
              <p style={{
                fontSize: '14px',
                color: '#999',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                Premium Training Experience
              </p>
            </div>

            {/* Live Clock + Temperature - Glass Panel */}
            <div className="flex gap-4">
              {/* Clock */}
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-6 py-4 flex items-center gap-3 hover:bg-white/15 transition-all">
                <Clock className="h-6 w-6" style={{ color: accentColor }} />
                <div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>Time</p>
                  <p style={{ 
                    fontSize: '24px', 
                    fontWeight: 600, 
                    color: '#fff',
                    fontFamily: 'monospace'
                  }}>
                    {currentTime || '--:--'}
                  </p>
                </div>
              </div>

              {/* Temperature */}
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-6 py-4 flex items-center gap-3 hover:bg-white/15 transition-all">
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: '#fff',
                  fontWeight: 600,
                }}>
                  °
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>Temperature</p>
                  <p style={{ fontSize: '24px', fontWeight: 600, color: '#fff' }}>
                    {temperature}°F
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Class Countdown - Prominent */}
          <div className="backdrop-blur-md bg-gradient-to-r from-white/15 to-white/5 border border-white/20 rounded-3xl p-8 hover:border-white/30 transition-all">
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Next Class
            </p>
            <div className="flex items-baseline justify-between">
              <div>
                <h2 style={{ fontSize: '48px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                  {nextClass?.name}
                </h2>
                <p style={{ fontSize: '18px', color: '#ccc' }}>
                  {nextClass?.time} • in {nextClass?.minutesUntil} minutes
                </p>
              </div>
              <div style={{
                fontSize: '64px',
                fontWeight: 700,
                color: accentColor,
                opacity: 0.8,
              }}>
                {String(nextClass?.minutesUntil).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA - Scrollable */}
      <div className="flex-1 overflow-y-auto px-8 pb-32">
        <div className="max-w-7xl mx-auto">
          {/* PRIMARY ACTION CARDS - 5 Large Touch-First Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
            {/* Check In Card */}
            <button
              onClick={() => {
                setActiveNav('checkin');
                navigate(`/kiosk/${slug}/checkin`);
              }}
              className="group relative rounded-3xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
                border: `2px solid ${accentColor}40`,
                minHeight: '280px',
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                background: `radial-gradient(circle at 50% 50%, ${accentColor}20, transparent 70%)`
              }} />
              
              <div className="relative p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="mb-6 p-4 rounded-full" style={{ background: `${accentColor}30` }}>
                  <LogIn className="h-10 w-10" style={{ color: accentColor }} />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  Check In
                </h3>
                <p style={{ fontSize: '13px', color: '#aaa' }}>
                  Start your session
                </p>
              </div>
            </button>

            {/* Book Class Card */}
            <button
              onClick={() => navigate(`/kiosk/${slug}/book-class`)}
              className="group relative rounded-3xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
                border: `2px solid ${accentColor}40`,
                minHeight: '280px',
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                background: `radial-gradient(circle at 50% 50%, ${accentColor}20, transparent 70%)`
              }} />
              
              <div className="relative p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="mb-6 p-4 rounded-full" style={{ background: `${accentColor}30` }}>
                  <Calendar className="h-10 w-10" style={{ color: accentColor }} />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  Book Class
                </h3>
                <p style={{ fontSize: '13px', color: '#aaa' }}>
                  Reserve your spot
                </p>
              </div>
            </button>

            {/* Schedule Card */}
            <button
              onClick={() => {
                setActiveNav('schedule');
                navigate(`/kiosk/${slug}/schedule`);
              }}
              className="group relative rounded-3xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
                border: `2px solid ${accentColor}40`,
                minHeight: '280px',
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                background: `radial-gradient(circle at 50% 50%, ${accentColor}20, transparent 70%)`
              }} />
              
              <div className="relative p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="mb-6 p-4 rounded-full" style={{ background: `${accentColor}30` }}>
                  <Calendar className="h-10 w-10" style={{ color: accentColor }} />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  Schedule
                </h3>
                <p style={{ fontSize: '13px', color: '#aaa' }}>
                  View all classes
                </p>
              </div>
            </button>

            {/* Programs Card */}
            <button
              onClick={() => {
                setActiveNav('programs');
                navigate(`/kiosk/${slug}/programs`);
              }}
              className="group relative rounded-3xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
                border: `2px solid ${accentColor}40`,
                minHeight: '280px',
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                background: `radial-gradient(circle at 50% 50%, ${accentColor}20, transparent 70%)`
              }} />
              
              <div className="relative p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="mb-6 p-4 rounded-full" style={{ background: `${accentColor}30` }}>
                  <Users className="h-10 w-10" style={{ color: accentColor }} />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  Programs
                </h3>
                <p style={{ fontSize: '13px', color: '#aaa' }}>
                  Our offerings
                </p>
              </div>
            </button>

            {/* About Card */}
            <button
              onClick={() => navigate(`/kiosk/${slug}/about`)}
              className="group relative rounded-3xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
                border: `2px solid ${accentColor}40`,
                minHeight: '280px',
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                background: `radial-gradient(circle at 50% 50%, ${accentColor}20, transparent 70%)`
              }} />
              
              <div className="relative p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="mb-6 p-4 rounded-full" style={{ background: `${accentColor}30` }}>
                  <Info className="h-10 w-10" style={{ color: accentColor }} />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  About
                </h3>
                <p style={{ fontSize: '13px', color: '#aaa' }}>
                  Learn more
                </p>
              </div>
            </button>
          </div>

          {/* TODAY'S SCHEDULE SECTION */}
          <div className="mb-16">
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
              Today's Schedule
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {todaysClasses.map((cls, idx) => (
                <div
                  key={idx}
                  className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                        {cls.name}
                      </h3>
                      <p style={{ fontSize: '14px', color: accentColor, fontWeight: 600 }}>
                        {cls.time}
                      </p>
                    </div>
                    <div style={{
                      background: `${accentColor}20`,
                      color: accentColor,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}>
                      {cls.capacity}
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#999' }}>
                    with {cls.instructor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PERSISTENT BOTTOM NAVIGATION DOCK */}
      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-md bg-black/40 border-t border-white/10 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          {/* Home */}
          <button
            onClick={() => setActiveNav('home')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
              activeNav === 'home'
                ? 'bg-white/20 border border-white/40'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
            style={{ color: activeNav === 'home' ? accentColor : '#999' }}
          >
            <Home className="h-5 w-5" />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Home</span>
          </button>

          {/* Schedule */}
          <button
            onClick={() => setActiveNav('schedule')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
              activeNav === 'schedule'
                ? 'bg-white/20 border border-white/40'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
            style={{ color: activeNav === 'schedule' ? accentColor : '#999' }}
          >
            <Calendar className="h-5 w-5" />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Schedule</span>
          </button>

          {/* Check In */}
          <button
            onClick={() => setActiveNav('checkin')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
              activeNav === 'checkin'
                ? 'bg-white/20 border border-white/40'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
            style={{ color: activeNav === 'checkin' ? accentColor : '#999' }}
          >
            <LogIn className="h-5 w-5" />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Check In</span>
          </button>

          {/* Programs */}
          <button
            onClick={() => setActiveNav('programs')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
              activeNav === 'programs'
                ? 'bg-white/20 border border-white/40'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
            style={{ color: activeNav === 'programs' ? accentColor : '#999' }}
          >
            <Users className="h-5 w-5" />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Programs</span>
          </button>

          {/* Help */}
          <button
            onClick={() => setActiveNav('help')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
              activeNav === 'help'
                ? 'bg-white/20 border border-white/40'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
            style={{ color: activeNav === 'help' ? accentColor : '#999' }}
          >
            <HelpCircle className="h-5 w-5" />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Help</span>
          </button>
        </div>
      </div>
    </div>
  );
}
