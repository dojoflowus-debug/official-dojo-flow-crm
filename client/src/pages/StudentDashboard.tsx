import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE } from "@/const";
import { 
  LogOut, 
  Calendar, 
  CreditCard,
  Settings,
  MessageSquare,
  MapPin,
  Clock,
  TrendingUp,
  Flame,
  ChevronRight
} from "lucide-react";
import { useLocation } from "wouter";

// Belt color mapping
const beltColors: Record<string, { primary: string; glow: string; gradient: string }> = {
  'White Belt': { primary: '#E5E7EB', glow: 'rgba(229, 231, 235, 0.4)', gradient: 'from-gray-200 to-gray-400' },
  'Yellow Belt': { primary: '#FCD34D', glow: 'rgba(252, 211, 77, 0.4)', gradient: 'from-yellow-300 to-yellow-500' },
  'Orange Belt': { primary: '#FB923C', glow: 'rgba(251, 146, 60, 0.4)', gradient: 'from-orange-400 to-orange-600' },
  'Green Belt': { primary: '#4ADE80', glow: 'rgba(74, 222, 128, 0.4)', gradient: 'from-green-400 to-green-600' },
  'Blue Belt': { primary: '#60A5FA', glow: 'rgba(96, 165, 250, 0.4)', gradient: 'from-blue-400 to-blue-600' },
  'Purple Belt': { primary: '#A78BFA', glow: 'rgba(167, 139, 250, 0.4)', gradient: 'from-purple-400 to-purple-600' },
  'Brown Belt': { primary: '#A16207', glow: 'rgba(161, 98, 7, 0.4)', gradient: 'from-amber-700 to-amber-900' },
  'Red Belt': { primary: '#EF4444', glow: 'rgba(239, 68, 68, 0.4)', gradient: 'from-red-500 to-red-700' },
  'Black Belt': { primary: '#1F2937', glow: 'rgba(31, 41, 55, 0.6)', gradient: 'from-gray-800 to-black' },
};

// Glass Panel Component
function GlassPanel({ 
  children, 
  className = "", 
  hover = true,
  glow = false,
  glowColor = "rgba(255,255,255,0.1)"
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
  glow?: boolean;
  glowColor?: string;
}) {
  return (
    <div 
      className={`
        relative rounded-3xl 
        bg-gradient-to-br from-white/[0.08] to-white/[0.02]
        backdrop-blur-xl
        border border-white/[0.08]
        ${hover ? 'transition-all duration-500 hover:translate-y-[-2px] hover:shadow-2xl hover:border-white/[0.15]' : ''}
        ${className}
      `}
      style={glow ? { boxShadow: `0 0 40px ${glowColor}, 0 0 80px ${glowColor}` } : {}}
    >
      {children}
    </div>
  );
}

// Circular Progress Ring Component
function ProgressRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  color = "#FCD34D",
  glowColor = "rgba(252, 211, 77, 0.4)"
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  color?: string;
  glowColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{progress}%</span>
      </div>
    </div>
  );
}

// Weekly Activity Bar Chart
function WeeklyActivityChart({ data, beltColor }: { data: number[]; beltColor: string }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const maxValue = Math.max(...data, 1);

  return (
    <div className="flex items-end justify-between gap-2 h-32">
      {data.map((value, index) => (
        <div key={index} className="flex flex-col items-center gap-2 flex-1">
          <div 
            className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
            style={{ 
              height: `${(value / maxValue) * 100}%`,
              minHeight: value > 0 ? '8px' : '4px',
              background: value > 0 
                ? `linear-gradient(to top, ${beltColor}, ${beltColor}88)`
                : 'rgba(255,255,255,0.1)',
              boxShadow: value > 0 ? `0 0 12px ${beltColor}40` : 'none'
            }}
          />
          <span className={`text-xs ${value > 0 ? 'text-white' : 'text-white/40'}`}>{days[index]}</span>
        </div>
      ))}
    </div>
  );
}

// Performance Line Chart
function PerformanceChart({ data }: { data: number[] }) {
  const maxValue = Math.max(...data, 1);
  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: 100 - (value / maxValue) * 100
  }));

  const pathD = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = points[index - 1];
    const cpX1 = prev.x + (point.x - prev.x) / 3;
    const cpX2 = prev.x + (point.x - prev.x) * 2 / 3;
    return `${acc} C ${cpX1} ${prev.y}, ${cpX2} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  return (
    <div className="relative h-32 w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(96, 165, 250, 0.3)" />
            <stop offset="100%" stopColor="rgba(96, 165, 250, 0)" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path
          d={`${pathD} L 100 100 L 0 100 Z`}
          fill="url(#areaGradient)"
        />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          className="drop-shadow-lg"
        />
        {/* Dots */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="2"
            fill="#60A5FA"
            className="drop-shadow-lg"
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * Student Dashboard - Elite Martial Arts Command Cockpit
 */
export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const [studentData, setStudentData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check if student is logged in
    const isLoggedIn = localStorage.getItem("student_logged_in");
    const email = localStorage.getItem("student_email");
    
    if (!isLoggedIn) {
      setLocation("/student-login");
      return;
    }

    // Mock data - would be fetched from backend
    setStudentData({
      name: "Mike Johnson",
      email: email || "mike.j@example.com",
      photo: "https://i.pravatar.cc/150?img=1",
      belt_rank: "Yellow Belt",
      belt_progress: 67,
      membership_status: "Active",
      plan_type: "Kids Karate",
      account_balance: 0,
      next_payment_due: "Nov 1, 2025",
      classes_this_month: 12,
      streak_days: 3,
      weekly_activity: [2, 1, 2, 0, 1, 2, 0], // Classes per day this week
      performance_trend: [45, 52, 48, 61, 58, 72, 67, 75], // Last 8 weeks
      upcoming_classes: [
        {
          id: 1,
          name: "Kids Karate - Intermediate",
          instructor: "Sensei John Smith",
          date: "Today",
          time: "4:00 PM",
          location: "Main Dojo",
          belt_requirement: "Yellow Belt"
        },
        {
          id: 2,
          name: "Sparring Practice",
          instructor: "Sensei Sarah Lee",
          date: "Tomorrow",
          time: "5:30 PM",
          location: "Training Hall B",
          belt_requirement: "Yellow Belt"
        },
        {
          id: 3,
          name: "Kids Karate - Intermediate",
          instructor: "Sensei John Smith",
          date: "Wed, Oct 30",
          time: "4:00 PM",
          location: "Main Dojo",
          belt_requirement: "Yellow Belt"
        }
      ]
    });

    // Trigger mount animation
    setTimeout(() => setMounted(true), 100);
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("student_logged_in");
    localStorage.removeItem("student_email");
    setLocation("/");
  };

  if (!studentData) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  const beltStyle = beltColors[studentData.belt_rank] || beltColors['White Belt'];

  return (
    <div className="min-h-screen bg-[#0A0E1A] overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E1A] via-[#111827] to-[#0A0E1A]" />
        <div 
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] animate-pulse"
          style={{ background: `radial-gradient(circle, ${beltStyle.glow}, transparent)` }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px] animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(96, 165, 250, 0.4), transparent)', animationDelay: '1s' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/[0.05] bg-white/[0.02] backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {APP_LOGO && (
                <img 
                  src={APP_LOGO} 
                  alt={APP_TITLE} 
                  className="h-10 w-auto"
                />
              )}
              <div>
                <h1 className="text-lg font-semibold text-white">{APP_TITLE}</h1>
                <p className="text-xs text-white/40">Student Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Profile with belt ring */}
              <div className="relative">
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{ 
                    padding: '3px',
                    background: `linear-gradient(135deg, ${beltStyle.primary}, ${beltStyle.primary}88)`,
                    boxShadow: `0 0 20px ${beltStyle.glow}`
                  }}
                >
                  <div className="w-full h-full rounded-full bg-[#0A0E1A]" />
                </div>
                <img 
                  src={studentData.photo} 
                  alt={studentData.name} 
                  className="relative h-11 w-11 rounded-full object-cover"
                  style={{ border: `3px solid ${beltStyle.primary}` }}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-white/40 hover:text-white hover:bg-white/10"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Hero Header */}
          <div className={`mb-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Welcome back, <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{studentData.name.split(' ')[0]}</span>
            </h2>
            <p className="text-lg text-white/40 tracking-wide">Train. Progress. Advance.</p>
          </div>

          {/* Top Metric Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Training Balance */}
            <GlassPanel className="p-6" glow glowColor="rgba(74, 222, 128, 0.1)">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10">
                  <CreditCard className="h-6 w-6 text-green-400" />
                </div>
                <span className="text-xs text-white/40 uppercase tracking-wider">Balance</span>
              </div>
              <p className="text-4xl font-bold text-white mb-1">
                ${studentData.account_balance}
              </p>
              <p className="text-sm text-white/40">
                {studentData.account_balance === 0 ? 'All caught up!' : `Due: ${studentData.next_payment_due}`}
              </p>
            </GlassPanel>

            {/* Classes This Month */}
            <GlassPanel className="p-6" glow glowColor={beltStyle.glow}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl" style={{ background: `linear-gradient(135deg, ${beltStyle.primary}33, ${beltStyle.primary}11)` }}>
                  <Calendar className="h-6 w-6" style={{ color: beltStyle.primary }} />
                </div>
                <span className="text-xs text-white/40 uppercase tracking-wider">This Month</span>
              </div>
              <p className="text-4xl font-bold text-white mb-1">
                {studentData.classes_this_month}
              </p>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-orange-400">{studentData.streak_days}-day streak</span>
              </div>
            </GlassPanel>

            {/* Belt Progress */}
            <GlassPanel className="p-6" glow glowColor={beltStyle.glow}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-white/40 uppercase tracking-wider">Belt Progress</span>
              </div>
              <div className="flex items-center gap-4">
                <ProgressRing 
                  progress={studentData.belt_progress} 
                  size={80} 
                  strokeWidth={6}
                  color={beltStyle.primary}
                  glowColor={beltStyle.glow}
                />
                <div>
                  <p className="text-lg font-semibold text-white">{studentData.belt_rank}</p>
                  <p className="text-sm text-white/40">Next: Orange Belt</p>
                </div>
              </div>
            </GlassPanel>

            {/* Membership Status */}
            <GlassPanel className="p-6" glow glowColor="rgba(167, 139, 250, 0.1)">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                <span className="text-xs text-white/40 uppercase tracking-wider">Membership</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-lg font-semibold text-white">{studentData.membership_status}</span>
              </div>
              <p className="text-sm text-white/40">{studentData.plan_type}</p>
            </GlassPanel>
          </div>

          {/* Quick Action Strip */}
          <div className={`mb-8 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <GlassPanel className="p-2" hover={false}>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: Calendar, label: 'My Schedule', route: '/student-schedule' },
                  { icon: MessageSquare, label: 'Messages', route: '/student-messages' },
                  { icon: CreditCard, label: 'Payments', route: '/student-payments' },
                  { icon: Settings, label: 'Settings', route: '/student-profile' },
                ].map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setLocation(action.route)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 hover:bg-white/[0.05] group"
                  >
                    <div 
                      className="p-3 rounded-xl transition-all duration-300 group-hover:scale-110"
                      style={{ 
                        background: `linear-gradient(135deg, ${beltStyle.primary}22, transparent)`,
                      }}
                    >
                      <action.icon 
                        className="h-5 w-5 transition-all duration-300" 
                        style={{ color: beltStyle.primary }}
                      />
                    </div>
                    <span className="text-sm text-white/60 group-hover:text-white transition-colors">{action.label}</span>
                  </button>
                ))}
              </div>
            </GlassPanel>
          </div>

          {/* Training Intelligence Panel */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Weekly Training Activity */}
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Weekly Training</h3>
                <span className="text-xs text-white/40">This Week</span>
              </div>
              <WeeklyActivityChart data={studentData.weekly_activity} beltColor={beltStyle.primary} />
            </GlassPanel>

            {/* Performance Curve */}
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Performance Curve</h3>
                <span className="text-xs text-white/40">Last 8 Weeks</span>
              </div>
              <PerformanceChart data={studentData.performance_trend} />
              <p className="text-sm text-white/40 mt-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                Your consistency is improving compared to last month
              </p>
            </GlassPanel>
          </div>

          {/* Upcoming Classes - Focus Zone */}
          <div className={`transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-semibold text-white">Upcoming Classes</h3>
              <button className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {studentData.upcoming_classes.map((classItem: any, index: number) => (
                <GlassPanel 
                  key={classItem.id} 
                  className="p-5 cursor-pointer"
                  glow={index === 0}
                  glowColor={index === 0 ? beltStyle.glow : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${beltStyle.primary}22, ${beltStyle.primary}11)` }}
                      >
                        <Calendar className="h-6 w-6" style={{ color: beltStyle.primary }} />
                      </div>
                      <div>
                        <p className="font-semibold text-white mb-1">{classItem.name}</p>
                        <p className="text-sm text-white/50">{classItem.instructor}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-white/40">
                            <MapPin className="h-3 w-3" />
                            {classItem.location}
                          </span>
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ 
                              background: `${beltStyle.primary}22`,
                              color: beltStyle.primary
                            }}
                          >
                            {classItem.belt_requirement}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{classItem.date}</p>
                      <p className="text-sm text-white/40 flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" />
                        {classItem.time}
                      </p>
                    </div>
                  </div>
                </GlassPanel>
              ))}
            </div>
          </div>

          {/* Bottom Spacing */}
          <div className="h-8" />
        </main>
      </div>
    </div>
  );
}
