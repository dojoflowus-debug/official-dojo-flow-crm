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
  const [staffPin, setStaffPin] = useState('');

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
    // Use real schedule from kioskConfig if available, otherwise show live-data placeholder
    const configClasses: Array<{ name: string; time: string; instructor?: string; capacity?: string }> =
      kioskConfig?.schedule?.classes || kioskConfig?.classes || [];
    const todaysClasses = configClasses.length > 0
      ? configClasses
      : [] as Array<{ name: string; time: string; instructor?: string; capacity?: string }>;
    const nextClass = todaysClasses.length > 0 ? { name: todaysClasses[0].name, time: todaysClasses[0].time, minutesUntil: 0 } : null;

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
              {nextClass ? (
                <div className="flex items-baseline justify-between">
                  <div>
                    <h2 style={{ fontSize: '48px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                      {nextClass.name}
                    </h2>
                    <p style={{ fontSize: '18px', color: '#ccc' }}>
                      {nextClass.time}
                    </p>
                  </div>
                  <div style={{ fontSize: '64px', fontWeight: 700, color: accentColor, opacity: 0.8 }}>
                    {String(nextClass.minutesUntil).padStart(2, '0')}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                  Live schedule will appear here
                </p>
              )}
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
              
              {todaysClasses.length > 0 ? (
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
                        {cls.capacity && (
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
                        )}
                      </div>
                      {cls.instructor && (
                        <p style={{ fontSize: '13px', color: '#999' }}>
                          with {cls.instructor}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                    Live class schedule will appear here
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', marginTop: '8px' }}>
                    Add classes in your DojoFlow dashboard
                  </p>
                </div>
              )}
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

  // Attract / idle screen
  if (state.currentScreen === 'attract') {
    const accentColor = kioskConfig?.theme?.accentColor || '#ef4444';
    const fontFamily = kioskConfig?.theme?.fontFamily || 'Inter';
    const locationName = contentData?.headline || 'Welcome';
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"
        style={{ fontFamily, background: 'linear-gradient(135deg, #1a1410 0%, #2a2420 50%, #1f1b16 100%)' }}
        onClick={handleInteraction}
      >
        {/* Pulsing ring */}
        <div className="relative flex items-center justify-center mb-8">
          <div
            className="absolute rounded-full animate-ping"
            style={{ width: 160, height: 160, background: accentColor, opacity: 0.15 }}
          />
          <div
            className="absolute rounded-full"
            style={{ width: 120, height: 120, background: accentColor, opacity: 0.1 }}
          />
          <div
            className="relative rounded-full flex items-center justify-center"
            style={{ width: 80, height: 80, background: accentColor }}
          >
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-white text-4xl font-bold mb-3 text-center px-8">{locationName}</h1>
        <p className="text-white/60 text-xl text-center px-8">Tap anywhere to check in</p>
        <p className="text-white/30 text-sm mt-6">{currentTime}</p>
      </div>
    );
  }

  // Check-in search screen
  if (state.currentScreen === 'check-in-search') {
    const accentColor = kioskConfig?.theme?.accentColor || '#ef4444';
    const fontFamily = kioskConfig?.theme?.fontFamily || 'Inter';
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center p-8"
        style={{ fontFamily, background: 'linear-gradient(135deg, #1a1410 0%, #2a2420 50%, #1f1b16 100%)' }}
        onClick={handleInteraction}
      >
        <button onClick={goHome} className="absolute top-6 left-6 text-white/50 hover:text-white text-sm flex items-center gap-2">
          <Home className="w-4 h-4" /> Home
        </button>
        <h2 className="text-white text-3xl font-bold mb-8 text-center">Check In</h2>
        <div className="w-full max-w-md">
          <input
            type="text"
            placeholder="Enter your name or phone number"
            className="w-full px-5 py-4 rounded-xl text-white text-lg bg-white/10 border border-white/20 placeholder-white/40 outline-none focus:border-white/50"
            autoFocus
            onChange={(e) => {
              if (e.target.value.length > 1) {
                kioskDataProvider.searchStudents(e.target.value).then(results => {
                  if (results.length > 0) {
                    updateFlowData({ searchResults: results, searchQuery: e.target.value });
                    navigateTo('check-in-select');
                  }
                });
              }
            }}
          />
          <p className="text-white/40 text-sm text-center mt-4">Type at least 2 characters to search</p>
        </div>
      </div>
    );
  }

  // Start training lead capture screen
  if (state.currentScreen === 'start-training-lead') {
    const accentColor = kioskConfig?.theme?.accentColor || '#ef4444';
    const fontFamily = kioskConfig?.theme?.fontFamily || 'Inter';
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center p-8"
        style={{ fontFamily, background: 'linear-gradient(135deg, #1a1410 0%, #2a2420 50%, #1f1b16 100%)' }}
        onClick={handleInteraction}
      >
        <button onClick={goHome} className="absolute top-6 left-6 text-white/50 hover:text-white text-sm flex items-center gap-2">
          <Home className="w-4 h-4" /> Home
        </button>
        <h2 className="text-white text-3xl font-bold mb-4 text-center">Start Your Journey</h2>
        <p className="text-white/60 text-center mb-8">Tell us a bit about yourself to get started</p>
        <div className="w-full max-w-md space-y-4">
          <input type="text" placeholder="Your name" className="w-full px-5 py-4 rounded-xl text-white text-lg bg-white/10 border border-white/20 placeholder-white/40 outline-none" />
          <input type="tel" placeholder="Phone number" className="w-full px-5 py-4 rounded-xl text-white text-lg bg-white/10 border border-white/20 placeholder-white/40 outline-none" />
          <input type="email" placeholder="Email address" className="w-full px-5 py-4 rounded-xl text-white text-lg bg-white/10 border border-white/20 placeholder-white/40 outline-none" />
          <button
            onClick={() => navigateTo('start-training-program')}
            className="w-full py-4 rounded-xl text-white font-bold text-lg"
            style={{ background: accentColor }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Staff login PIN screen
  if (state.currentScreen === 'staff-login-pin') {
    const accentColor = kioskConfig?.theme?.accentColor || '#ef4444';
    const fontFamily = kioskConfig?.theme?.fontFamily || 'Inter';
    const pin = staffPin;
    const setPin = setStaffPin;
    const handlePin = (digit: string) => {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        kioskDataProvider.verifyStaffPin(newPin).then(valid => {
          if (valid) { setPin(''); navigateTo('staff-tools'); }
          else setPin('');
        });
      }
    };
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center p-8"
        style={{ fontFamily, background: 'linear-gradient(135deg, #1a1410 0%, #2a2420 50%, #1f1b16 100%)' }}
      >
        <button onClick={goHome} className="absolute top-6 left-6 text-white/50 hover:text-white text-sm flex items-center gap-2">
          <Home className="w-4 h-4" /> Home
        </button>
        <h2 className="text-white text-3xl font-bold mb-8">Staff Login</h2>
        <div className="flex gap-4 mb-8">
          {[0,1,2,3].map(i => (
            <div key={i} className="w-4 h-4 rounded-full" style={{ background: i < pin.length ? accentColor : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 w-64">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button
              key={i}
              onClick={() => d === '⌫' ? setPin(p => p.slice(0,-1)) : d ? handlePin(d) : undefined}
              disabled={!d}
              className="h-16 rounded-xl text-white text-2xl font-bold transition-all"
              style={{ background: d ? 'rgba(255,255,255,0.1)' : 'transparent', border: d ? '1px solid rgba(255,255,255,0.1)' : 'none' }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Generic fallback for any unimplemented screens — shows home-style screen
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #1a1410 0%, #2a2420 50%, #1f1b16 100%)' }}
      onClick={handleInteraction}
    >
      <div className="text-center">
        <p className="text-white/40 text-sm mb-6 uppercase tracking-widest">Kiosk</p>
        <h2 className="text-white text-3xl font-bold mb-4 capitalize">{state.currentScreen.replace(/-/g, ' ')}</h2>
        <p className="text-white/50 mb-8">This screen is coming soon.</p>
        <button
          onClick={goHome}
          className="px-6 py-3 rounded-xl text-white font-medium"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <Home className="w-4 h-4 inline mr-2" />
          Return Home
        </button>
      </div>
    </div>
  );
}
