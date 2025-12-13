import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE } from "@/const";
import { 
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { useLocation } from "wouter";

// Belt data with colors
const belts = [
  { name: 'White', color: '#F5F5F5', borderColor: '#E0E0E0' },
  { name: 'Yellow', color: '#FCD34D', borderColor: '#F59E0B' },
  { name: 'Orange', color: '#FB923C', borderColor: '#EA580C' },
  { name: 'Green', color: '#4ADE80', borderColor: '#16A34A' },
  { name: 'Brown', color: '#A16207', borderColor: '#78350F' },
  { name: 'Blue', color: '#60A5FA', borderColor: '#2563EB' },
  { name: 'Purple', color: '#A78BFA', borderColor: '#7C3AED' },
];

// Soft Card Component
function SoftCard({ 
  children, 
  className = "",
  hover = false
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}) {
  return (
    <div 
      className={`
        bg-white rounded-3xl 
        shadow-[0_2px_20px_rgba(0,0,0,0.06)]
        border border-gray-100/50
        ${hover ? 'transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Circular Progress Ring
function ProgressRing({ 
  progress, 
  size = 140, 
  strokeWidth = 10,
  color = '#EF4444',
  bgColor = '#FEE2E2'
}: { 
  progress: number; 
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

// Belt Badge Component
function BeltBadge({ 
  name, 
  color, 
  borderColor,
  isActive,
  isNext,
  isPast
}: { 
  name: string;
  color: string;
  borderColor: string;
  isActive: boolean;
  isNext: boolean;
  isPast: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className={`
          px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300
          ${isActive ? 'ring-2 ring-offset-2 shadow-lg scale-110' : ''}
          ${isNext ? 'opacity-60' : ''}
          ${!isActive && !isNext && !isPast ? 'opacity-30' : ''}
        `}
        style={{ 
          backgroundColor: color,
          borderColor: borderColor,
          border: `2px solid ${borderColor}`,
          ringColor: isActive ? borderColor : 'transparent',
          color: name === 'White' ? '#374151' : (name === 'Yellow' ? '#78350F' : '#FFF')
        }}
      >
        {name}
      </div>
      {isActive && (
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1" />
      )}
    </div>
  );
}

// Weekly Training Bar
function WeeklyTrainingBar({ day, attended, isToday }: { day: string; attended: boolean; isToday: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`
          w-8 h-16 rounded-full transition-all duration-300
          ${attended ? 'bg-gradient-to-t from-orange-400 to-orange-300' : 'bg-gray-100'}
          ${isToday ? 'ring-2 ring-orange-400 ring-offset-2' : ''}
        `}
      />
      <span className={`text-xs font-medium ${isToday ? 'text-orange-500' : 'text-gray-400'}`}>
        {day}
      </span>
    </div>
  );
}

/**
 * Student Dashboard - WOW Version
 * Apple-inspired light theme with emotional engagement
 */
export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(false);
  const [studentName] = useState("Miike");
  const [currentBelt] = useState("Yellow");
  const [nextBelt] = useState("Orange");
  const [beltProgress] = useState(67);
  const [qualifiedAttendance] = useState(78);
  const [classesNeeded] = useState(3);
  const [nextEvaluation] = useState(12);

  // Weekly training data
  const weeklyTraining = [
    { day: 'M', attended: false },
    { day: 'T', attended: false },
    { day: 'W', attended: false },
    { day: 'T', attended: true },
    { day: 'F', attended: true },
    { day: 'S', attended: true },
    { day: 'S', attended: true },
  ];

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("student_logged_in");
    if (!isLoggedIn) {
      setLocation("/student-login");
      return;
    }
    setTimeout(() => setMounted(true), 100);
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("student_logged_in");
    localStorage.removeItem("student_email");
    setLocation("/student-login");
  };

  // Get attendance status color
  const getAttendanceColor = () => {
    if (qualifiedAttendance >= 80) return { color: '#22C55E', bg: '#DCFCE7', status: 'Eligible' };
    if (qualifiedAttendance >= 70) return { color: '#EAB308', bg: '#FEF9C3', status: 'At Risk' };
    return { color: '#EF4444', bg: '#FEE2E2', status: 'Ineligible' };
  };

  const attendanceStatus = getAttendanceColor();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && (
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-auto" />
            )}
            <span className="text-lg font-semibold text-gray-900">Student Portal</span>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Hero Welcome Section */}
        <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Welcome back, {studentName}
          </h1>
          <p className="text-xl text-gray-500 italic">My Martial Path</p>
        </div>

        {/* Main Grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          {/* Left Column - Student Portrait */}
          <div className="lg:col-span-4">
            <SoftCard className="p-6 relative overflow-hidden">
              {/* Student Image */}
              <div className="relative">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
                  <img 
                    src="https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&h=533&fit=crop&crop=face"
                    alt="Student in gi"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Belt Badge Overlay */}
                <div 
                  className="absolute bottom-4 left-4 px-4 py-2 rounded-xl font-semibold text-sm shadow-lg"
                  style={{ 
                    backgroundColor: '#FCD34D',
                    color: '#78350F'
                  }}
                >
                  {currentBelt} Belt
                </div>
              </div>

              {/* Attendance Ring */}
              <div className="mt-8 flex flex-col items-center">
                <div className="relative">
                  <ProgressRing 
                    progress={qualifiedAttendance} 
                    size={160}
                    strokeWidth={12}
                    color={attendanceStatus.color}
                    bgColor={attendanceStatus.bg}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">{qualifiedAttendance}%</span>
                    <span className="text-sm text-gray-500">Attendance</span>
                    <span className="text-xs text-gray-400">for belt</span>
                  </div>
                </div>
                
                <p className="mt-4 text-center text-gray-600 font-medium">
                  <span className="text-orange-500">Attendance</span> beats intensity
                </p>
                
                {qualifiedAttendance < 80 && (
                  <p className="mt-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                    Maintain 80%+ to stay belt-eligible
                  </p>
                )}
              </div>
            </SoftCard>
          </div>

          {/* Right Column - Progress & Actions */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Belt Progression */}
            <SoftCard className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Belt Progression</h2>
              
              {/* Belt Timeline */}
              <div className="flex items-center justify-between gap-2 mb-6 overflow-x-auto pb-2">
                {belts.map((belt, index) => {
                  const currentIndex = belts.findIndex(b => b.name === currentBelt);
                  return (
                    <BeltBadge
                      key={belt.name}
                      name={belt.name}
                      color={belt.color}
                      borderColor={belt.borderColor}
                      isActive={belt.name === currentBelt}
                      isNext={belt.name === nextBelt}
                      isPast={index < currentIndex}
                    />
                  );
                })}
              </div>

              {/* Progress Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    Qualified Attendance: {qualifiedAttendance}%
                  </p>
                  <p className="text-gray-500">
                    Next evaluation: In {nextEvaluation} days
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Progress to {nextBelt} Belt</p>
                  <p className="text-2xl font-bold text-orange-500">{beltProgress}%</p>
                </div>
              </div>

              {/* Microcopy */}
              <div className="mt-4 flex items-center gap-2 text-gray-600">
                <Sparkles className="h-4 w-4 text-orange-400" />
                <span>{classesNeeded} more qualified classes to reach next belt</span>
              </div>
            </SoftCard>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                className="h-auto py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl flex flex-col items-center gap-2 shadow-lg"
                onClick={() => setLocation("/kiosk")}
              >
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-semibold">Check In</span>
              </Button>
              
              <Button 
                variant="outline"
                className="h-auto py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-2xl flex flex-col items-center gap-2 border-gray-200 shadow-sm"
                onClick={() => setLocation("/student-schedule")}
              >
                <Calendar className="h-6 w-6" />
                <span className="font-semibold">View Schedule</span>
              </Button>
              
              <Button 
                variant="outline"
                className="h-auto py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-2xl flex flex-col items-center gap-2 border-gray-200 shadow-sm"
              >
                <MessageSquare className="h-6 w-6" />
                <span className="font-semibold">Messages</span>
              </Button>
              
              <Button 
                variant="outline"
                className="h-auto py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-2xl flex flex-col items-center gap-2 border-gray-200 shadow-sm"
              >
                <CreditCard className="h-6 w-6" />
                <span className="font-semibold">Payments</span>
              </Button>
            </div>

            {/* Weekly Training */}
            <SoftCard className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Training</h2>
              <div className="flex items-end justify-between gap-4">
                {weeklyTraining.map((day, index) => (
                  <WeeklyTrainingBar 
                    key={index}
                    day={day.day}
                    attended={day.attended}
                    isToday={index === 4} // Friday is today in mock
                  />
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Consistency improving compared to last month
              </p>
            </SoftCard>

            {/* Upcoming Class */}
            <SoftCard className="p-6" hover>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Next Class</h2>
                <Button 
                  variant="ghost" 
                  className="text-gray-500 hover:text-gray-900"
                  onClick={() => setLocation("/student-schedule")}
                >
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
                {/* Instructor Photo */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-200 flex-shrink-0">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                    alt="Instructor"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">Kids Karate - Intermediate</h3>
                  <p className="text-gray-600">Samuel Silva</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Tue, May 7 · 5:00 PM
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      Main Dojo
                    </span>
                  </div>
                </div>
                
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 shadow-lg shadow-orange-500/30"
                >
                  Check in
                </Button>
              </div>
            </SoftCard>
          </div>
        </div>

        {/* Settings Link */}
        <div className={`mt-8 flex justify-center transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Button 
            variant="ghost" 
            className="text-gray-400 hover:text-gray-600"
          >
            <Settings className="h-4 w-4 mr-2" />
            Account Settings
          </Button>
        </div>
      </main>
    </div>
  );
}
