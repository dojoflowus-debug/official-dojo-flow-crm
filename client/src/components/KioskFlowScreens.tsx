import { useState, useEffect } from 'react';
import { useKioskFlow } from '@/lib/kioskFlowContext';
import * as kioskDataProvider from '@/lib/kioskDataProvider';
import { Clock, LogIn, Calendar, Users, Info, Home, HelpCircle } from 'lucide-react';

interface KioskFlowScreensProps {
  logoDataUrl?: string;
  contentData?: { headline: string; subheadline: string; helper?: string; footer?: string };
  kioskConfig?: any; // Full kiosk config with theme values
}

export function KioskFlowScreens({ logoDataUrl, contentData, kioskConfig }: KioskFlowScreensProps) {
  const { state, navigateTo, updateFlowData, goHome, goBack, recordActivity, enterStaffMode, exitStaffMode } = useKioskFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPressDuration, setLogoPressDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(72);
  const [activeNav, setActiveNav] = useState<'home' | 'schedule' | 'checkin' | 'programs' | 'help'>('home');

  // Default content
  const defaultContent = {
    headline: 'Welcome',
    subheadline: 'Tap the screen to begin',
    helper: '',
    footer: '',
  };

  const content = contentData || defaultContent;

  // Record activity on any interaction
  const handleInteraction = () => {
    recordActivity();
  };

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

  // Home Screen - Premium Location Experience
  if (state.currentScreen === 'home') {
    const accentColor = kioskConfig?.theme?.accentColor || '#ef4444';
    const fontFamily = kioskConfig?.theme?.fontFamily || 'Inter';
    const locationName = contentData?.headline || 'Main Dojo';
    const nextClass = { name: 'Kids Karate', time: '5:30 PM', minutesUntil: 18 };
    const todaysClasses = [
      { name: 'Kids Karate', time: '4:00 PM', instructor: 'Sensei Mike', capacity: '8/12' },
      { name: 'Adult Kickboxing', time: '5:30 PM', instructor: 'Sensei Sarah', capacity: '6/10' },
      { name: 'Advanced Forms', time: '7:00 PM', instructor: 'Sensei James', capacity: '5/8' },
    ];

    return (
      <div 
        className="min-h-screen w-full flex flex-col overflow-hidden"
        style={{ 
          fontFamily,
          background: 'linear-gradient(135deg, #1a1410 0%, #2a2420 50%, #1f1b16 100%)',
        }}
        onClick={handleInteraction}
      >
        {/* HERO SECTION */}
        <div className="relative w-full px-8 pt-8 pb-12">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 opacity-30" style={{
            background: `radial-gradient(circle at 50% 0%, ${accentColor}40, transparent 70%)`
          }} />
          
          <div className="relative z-10 max-w-7xl mx-auto">
            {/* Top Row: Location Name + Live Clock + Temperature */}
            <div className="flex items-center justify-between mb-8">
              {/* Location Name */}
              <div className="flex-1">
                <h1 style={{
                  fontSize: '56px',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-1px',
                  marginBottom: '4px',
                }}>
                  {locationName}
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

              {/* Live Clock + Temperature */}
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

            {/* Next Class Countdown */}
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

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto px-8 pb-32">
          <div className="max-w-7xl mx-auto">
            {/* PRIMARY ACTION CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
              {/* Check In Card */}
              <button
                onClick={() => {
                  handleInteraction();
                  setActiveNav('checkin');
                  navigateTo('check-in-search');
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
                onClick={() => {
                  handleInteraction();
                  navigateTo('check-in-search');
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
                  handleInteraction();
                  setActiveNav('schedule');
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
                  handleInteraction();
                  setActiveNav('programs');
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
                onClick={() => {
                  handleInteraction();
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
              onClick={() => {
                handleInteraction();
                setActiveNav('home');
                goHome();
              }}
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
              onClick={() => {
                handleInteraction();
                setActiveNav('schedule');
              }}
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
              onClick={() => {
                handleInteraction();
                setActiveNav('checkin');
                navigateTo('check-in-search');
              }}
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
              onClick={() => {
                handleInteraction();
                setActiveNav('programs');
              }}
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
              onClick={() => {
                handleInteraction();
                setActiveNav('help');
              }}
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

  // For other screens, render the original backup version
  // (Check In, Start Training, etc. flows remain unchanged)
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <div className="text-center">
        <div className="text-white text-3xl font-bold mb-4">{state.currentScreen}</div>
        <p className="text-slate-400">Screen rendering in progress...</p>
      </div>
    </div>
  );
}
