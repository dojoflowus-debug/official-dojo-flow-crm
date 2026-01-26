/**
 * KioskHome - Premium Location Experience
 * 
 * Full-screen, cinematic, touch-first kiosk home screen
 * Designed to look like a luxury gym lobby digital display
 * 
 * Layout:
 * - Hero section (top): Location name, live clock, next class countdown, temperature
 * - Action cards (middle): Large touch targets (Check In, Book Class, Schedule, Programs, About)
 * - Schedule preview (below): Today's classes at a glance
 * - Navigation dock (persistent): Bottom navigation for other sections
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Flame, MapPin, Calendar, Users, Info, HelpCircle } from 'lucide-react';

interface ActionCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'accent' | 'muted';
  action: () => void;
}

interface ScheduleItem {
  id: string;
  time: string;
  className: string;
  instructor: string;
  spots: number;
}

export default function KioskHome() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState(72);
  const [nextClassTime, setNextClassTime] = useState('2:30 PM');
  const [nextClassName, setNextClassName] = useState('Advanced Kickboxing');
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([
    {
      id: '1',
      time: '10:00 AM',
      className: 'Beginner Karate',
      instructor: 'Sensei Mike',
      spots: 8,
    },
    {
      id: '2',
      time: '11:30 AM',
      className: 'Youth Taekwondo',
      instructor: 'Sensei Sarah',
      spots: 5,
    },
    {
      id: '3',
      time: '2:30 PM',
      className: 'Advanced Kickboxing',
      instructor: 'Coach James',
      spots: 3,
    },
    {
      id: '4',
      time: '4:00 PM',
      className: 'Family Fitness',
      instructor: 'Sensei Alex',
      spots: 12,
    },
  ]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const actionCards: ActionCard[] = [
    {
      id: 'checkin',
      title: 'Check In',
      subtitle: 'Start your session',
      icon: <Users className="w-12 h-12" />,
      color: 'primary',
      action: () => navigate('/kiosk/checkin'),
    },
    {
      id: 'book',
      title: 'Book a Class',
      subtitle: 'Reserve your spot',
      icon: <Calendar className="w-12 h-12" />,
      color: 'accent',
      action: () => navigate('/kiosk/book'),
    },
    {
      id: 'schedule',
      title: "Today's Schedule",
      subtitle: 'View all classes',
      icon: <Clock className="w-12 h-12" />,
      color: 'secondary',
      action: () => navigate('/kiosk/schedule'),
    },
    {
      id: 'programs',
      title: 'Programs',
      subtitle: 'Our offerings',
      icon: <Flame className="w-12 h-12" />,
      color: 'muted',
      action: () => navigate('/kiosk/programs'),
    },
    {
      id: 'about',
      title: 'About Us',
      subtitle: 'Learn more',
      icon: <Info className="w-12 h-12" />,
      color: 'muted',
      action: () => navigate('/kiosk/about'),
    },
  ];

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen max-h-[600px] flex flex-col justify-between p-8 md:p-12 bg-cover bg-center" style={{
        backgroundImage: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.7) 100%), url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 600%22%3E%3Cdefs%3E%3ClinearGradient id=%22grad%22 x1=%220%25%22 y1=%220%25%22 x2=%22100%25%22 y2=%22100%25%22%3E%3Cstop offset=%220%25%22 style=%22stop-color:%23dc2626;stop-opacity:0.1%22 /%3E%3Cstop offset=%22100%25%22 style=%22stop-color:%23ea580c;stop-opacity:0.05%22 /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%221200%22 height=%22600%22 fill=%22url(%23grad)%22/%3E%3C/svg%3E")',
      }}>
        {/* Top: Location name and clock */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-2 text-white drop-shadow-lg">
              Dojo 1
            </h1>
            <p className="text-xl text-slate-300 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              Downtown Location
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg mb-2">
              {formattedTime}
            </div>
            <div className="text-2xl text-slate-300 flex items-center justify-end gap-2">
              <Flame className="w-6 h-6 text-red-500" />
              {temperature}°F
            </div>
          </div>
        </div>

        {/* Bottom: Next class countdown */}
        <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
          <p className="text-sm text-slate-300 mb-2">NEXT CLASS STARTS IN</p>
          <div className="flex items-baseline gap-3">
            <h2 className="text-4xl md:text-5xl font-bold text-red-400">
              {nextClassTime}
            </h2>
            <p className="text-2xl text-slate-300">
              {nextClassName}
            </p>
          </div>
        </div>
      </section>

      {/* Action Cards Section */}
      <section className="px-8 md:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {actionCards.map((card) => (
            <button
              key={card.id}
              onClick={card.action}
              className={`group relative h-48 rounded-2xl overflow-hidden transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                card.color === 'primary'
                  ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-600/50'
                  : card.color === 'accent'
                  ? 'bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-600/50'
                  : card.color === 'secondary'
                  ? 'bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 shadow-lg shadow-slate-600/50'
                  : 'bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 shadow-lg shadow-slate-600/30'
              }`}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="text-white/80 group-hover:text-white transition-colors">
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-1">
                    {card.title}
                  </h3>
                  <p className="text-sm text-white/70 group-hover:text-white/90">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Today's Schedule Preview */}
      <section className="px-8 md:px-12 py-12 bg-slate-900/50">
        <h2 className="text-3xl font-bold mb-8">Today's Classes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {todaySchedule.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800 transition-colors cursor-pointer group"
            >
              <div className="text-red-400 font-bold text-2xl mb-2">
                {item.time}
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-red-400 transition-colors">
                {item.className}
              </h3>
              <p className="text-slate-400 mb-3">
                with {item.instructor}
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Users className="w-4 h-4" />
                {item.spots} spots available
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Persistent Navigation Dock */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-slate-900/80 border-t border-slate-700 backdrop-blur-sm">
        <div className="flex justify-around items-center h-20 px-4 max-w-7xl mx-auto">
          <button className="flex flex-col items-center gap-1 text-slate-300 hover:text-red-400 transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-red-600/20 flex items-center justify-center transition-colors">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-300 hover:text-red-400 transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-red-600/20 flex items-center justify-center transition-colors">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Schedule</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-300 hover:text-red-400 transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-red-600/20 flex items-center justify-center transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Check In</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-300 hover:text-red-400 transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-red-600/20 flex items-center justify-center transition-colors">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Programs</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-300 hover:text-red-400 transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-red-600/20 flex items-center justify-center transition-colors">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Help</span>
          </button>
        </div>
      </nav>

      {/* Bottom padding for nav dock */}
      <div className="h-20" />
    </div>
  );
}
