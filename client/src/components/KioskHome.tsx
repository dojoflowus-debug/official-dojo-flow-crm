import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, LogIn, UserPlus, Settings } from 'lucide-react';

interface KioskHomeProps {
  locationName?: string;
  locationSlug?: string;
}

/**
 * KioskHome - New kiosk home screen
 * 
 * Features:
 * - Large touch-friendly tiles (Check In, Start Training)
 * - Live clock display
 * - Info bar (next class, today's focus)
 * - Discreet staff login button
 * - Responsive for various screen sizes
 */
export default function KioskHome({ locationName, locationSlug: propSlug }: KioskHomeProps) {
  const navigate = useNavigate();
  const { locationSlug: routeSlug } = useParams<{ locationSlug: string }>();
  const slug = propSlug || routeSlug;

  const [currentTime, setCurrentTime] = useState<string>('');
  const [fadeIn, setFadeIn] = useState(false);

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

    // Set initial time immediately
    updateClock();
    
    // Update every second
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once on mount

  // Fade in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Mock data - will be replaced with real data later
  const nextClass = {
    name: 'Kids Karate',
    time: '5:30 PM',
    minutesUntil: 18,
  };

  const todaysFocus = ['Discipline', 'Confidence', 'Fitness'];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
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
              <p className="text-white/60 text-xs font-medium tracking-wide uppercase">DojoFlow</p>
              <p className="text-white text-xl font-bold tracking-tight">
                {locationName || 'Main Dojo'}
              </p>
            </div>
          </div>

          {/* Live Clock */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
            <Clock className="h-5 w-5 text-white/80" />
            <span className="text-white font-mono text-lg font-semibold">
              {currentTime || '--:--:--'}
            </span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-3 tracking-tight">
            Welcome to Training
          </h1>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-red-500 via-red-400 to-transparent rounded-full" />
        </div>

        {/* Info Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {/* Next Class */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
            <p className="text-white/60 text-sm font-medium mb-1">Next Class</p>
            <p className="text-white text-lg font-semibold">
              {nextClass.name} at {nextClass.time}
            </p>
            <p className="text-white/50 text-xs mt-1">
              in {nextClass.minutesUntil} minutes
            </p>
          </div>

          {/* Today's Focus */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
            <p className="text-white/60 text-sm font-medium mb-1">Today's Focus</p>
            <p className="text-white text-lg font-semibold">
              {todaysFocus.join(' • ')}
            </p>
          </div>
        </div>

        {/* Main Action Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Check In Tile */}
          <button
            onClick={() => navigate(`/kiosk/${slug}/checkin`)}
            className="group relative bg-gradient-to-br from-blue-600/40 to-blue-700/40 backdrop-blur-md rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-blue-400/30 hover:border-blue-300/60 overflow-hidden"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Icon Circle */}
            <div className="relative flex justify-center mb-8">
              <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl group-hover:blur-3xl transition-all" />
              <div className="relative p-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-2xl">
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
              <h2 className="text-white text-4xl font-bold">Check In</h2>
              <p className="text-white/70 text-lg">Tap here to check into class</p>
            </div>

            {/* Bottom Button */}
            <div className="relative mt-8 pt-8 border-t border-white/10">
              <div className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center font-bold text-lg shadow-lg group-hover:from-blue-400 group-hover:to-blue-500 transition-all">
                Check In
              </div>
            </div>
          </button>

          {/* Start Training Tile */}
          <button
            onClick={() => navigate(`/kiosk/${slug}/new-student`)}
            className="group relative bg-gradient-to-br from-red-600/40 to-red-700/40 backdrop-blur-md rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-red-400/30 hover:border-red-300/60 overflow-hidden"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Icon Circle */}
            <div className="relative flex justify-center mb-8">
              <div className="absolute inset-0 bg-red-500/30 rounded-full blur-2xl group-hover:blur-3xl transition-all" />
              <div className="relative p-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-2xl">
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
              <h2 className="text-white text-4xl font-bold">Start Training</h2>
              <p className="text-white/70 text-lg">New students start here</p>
            </div>

            {/* Bottom Button */}
            <div className="relative mt-8 pt-8 border-t border-white/10">
              <div className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white text-center font-bold text-lg shadow-lg group-hover:from-red-400 group-hover:to-red-500 transition-all">
                Start Training
              </div>
            </div>
          </button>
        </div>

        {/* Footer: Staff Login */}
        <div className="text-center">
          <button
            onClick={() => navigate(`/kiosk/${slug}/staff-login`)}
            className="flex items-center gap-2 mx-auto text-white/50 hover:text-white/80 transition-colors text-sm font-medium"
          >
            <Settings className="h-4 w-4" />
            Staff Login
          </button>
        </div>
      </div>
    </div>
  );
}
