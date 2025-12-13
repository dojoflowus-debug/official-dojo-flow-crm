import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE } from "@/const";
import { 
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Filter,
  List,
  Grid3X3
} from "lucide-react";
import { useLocation } from "wouter";

// Belt color mapping
const beltColors: Record<string, { primary: string; glow: string }> = {
  'White Belt': { primary: '#E5E7EB', glow: 'rgba(229, 231, 235, 0.4)' },
  'Yellow Belt': { primary: '#FCD34D', glow: 'rgba(252, 211, 77, 0.4)' },
  'Orange Belt': { primary: '#FB923C', glow: 'rgba(251, 146, 60, 0.4)' },
  'Green Belt': { primary: '#4ADE80', glow: 'rgba(74, 222, 128, 0.4)' },
  'Blue Belt': { primary: '#60A5FA', glow: 'rgba(96, 165, 250, 0.4)' },
  'Purple Belt': { primary: '#A78BFA', glow: 'rgba(167, 139, 250, 0.4)' },
  'Brown Belt': { primary: '#A16207', glow: 'rgba(161, 98, 7, 0.4)' },
  'Red Belt': { primary: '#EF4444', glow: 'rgba(239, 68, 68, 0.4)' },
  'Black Belt': { primary: '#1F2937', glow: 'rgba(31, 41, 55, 0.6)' },
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

// Class status types
type ClassStatus = 'attended' | 'missed' | 'upcoming' | 'cancelled';

interface ScheduledClass {
  id: number;
  name: string;
  instructor: string;
  date: Date;
  time: string;
  duration: string;
  location: string;
  belt_requirement: string;
  status: ClassStatus;
}

// Status badge component
function StatusBadge({ status }: { status: ClassStatus }) {
  const styles: Record<ClassStatus, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    attended: { 
      bg: 'bg-green-500/20', 
      text: 'text-green-400', 
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: 'Attended'
    },
    missed: { 
      bg: 'bg-red-500/20', 
      text: 'text-red-400', 
      icon: <XCircle className="h-3 w-3" />,
      label: 'Missed'
    },
    upcoming: { 
      bg: 'bg-blue-500/20', 
      text: 'text-blue-400', 
      icon: <Clock className="h-3 w-3" />,
      label: 'Upcoming'
    },
    cancelled: { 
      bg: 'bg-gray-500/20', 
      text: 'text-gray-400', 
      icon: <XCircle className="h-3 w-3" />,
      label: 'Cancelled'
    },
  };

  const style = styles[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${style.bg} ${style.text}`}>
      {style.icon}
      {style.label}
    </span>
  );
}

// Calendar Day Component
function CalendarDay({ 
  date, 
  isCurrentMonth, 
  isToday, 
  isSelected,
  classes,
  onClick,
  beltColor
}: { 
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  classes: ScheduledClass[];
  onClick: () => void;
  beltColor: string;
}) {
  const hasClasses = classes.length > 0;
  const hasAttended = classes.some(c => c.status === 'attended');
  const hasUpcoming = classes.some(c => c.status === 'upcoming');

  return (
    <button
      onClick={onClick}
      className={`
        relative aspect-square p-1 rounded-xl transition-all duration-300
        ${isCurrentMonth ? 'text-white' : 'text-white/30'}
        ${isSelected ? 'bg-white/10 ring-2' : 'hover:bg-white/5'}
        ${isToday ? 'ring-1 ring-white/30' : ''}
      `}
      style={isSelected ? { ringColor: beltColor } : {}}
    >
      <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>
        {date.getDate()}
      </span>
      
      {/* Class indicators */}
      {hasClasses && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {hasAttended && (
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          )}
          {hasUpcoming && (
            <div 
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: beltColor }}
            />
          )}
          {classes.some(c => c.status === 'missed') && (
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          )}
        </div>
      )}
    </button>
  );
}

/**
 * Student Schedule - Calendar View for Classes
 */
export default function StudentSchedule() {
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filterStatus, setFilterStatus] = useState<ClassStatus | 'all'>('all');
  const [mounted, setMounted] = useState(false);

  // Student data
  const studentBelt = 'Yellow Belt';
  const beltStyle = beltColors[studentBelt] || beltColors['White Belt'];

  // Mock class data - would be fetched from backend
  const [classes] = useState<ScheduledClass[]>(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    return [
      // Past classes (attended)
      {
        id: 1,
        name: "Kids Karate - Intermediate",
        instructor: "Sensei John Smith",
        date: new Date(currentYear, currentMonth, now.getDate() - 7),
        time: "4:00 PM",
        duration: "1 hour",
        location: "Main Dojo",
        belt_requirement: "Yellow Belt",
        status: 'attended' as ClassStatus
      },
      {
        id: 2,
        name: "Sparring Practice",
        instructor: "Sensei Sarah Lee",
        date: new Date(currentYear, currentMonth, now.getDate() - 5),
        time: "5:30 PM",
        duration: "1.5 hours",
        location: "Training Hall B",
        belt_requirement: "Yellow Belt",
        status: 'attended' as ClassStatus
      },
      {
        id: 3,
        name: "Kids Karate - Intermediate",
        instructor: "Sensei John Smith",
        date: new Date(currentYear, currentMonth, now.getDate() - 4),
        time: "4:00 PM",
        duration: "1 hour",
        location: "Main Dojo",
        belt_requirement: "Yellow Belt",
        status: 'missed' as ClassStatus
      },
      {
        id: 4,
        name: "Kata Training",
        instructor: "Sensei Mike Chen",
        date: new Date(currentYear, currentMonth, now.getDate() - 2),
        time: "3:00 PM",
        duration: "1 hour",
        location: "Main Dojo",
        belt_requirement: "Yellow Belt",
        status: 'attended' as ClassStatus
      },
      // Today's class
      {
        id: 5,
        name: "Kids Karate - Intermediate",
        instructor: "Sensei John Smith",
        date: new Date(currentYear, currentMonth, now.getDate()),
        time: "4:00 PM",
        duration: "1 hour",
        location: "Main Dojo",
        belt_requirement: "Yellow Belt",
        status: 'upcoming' as ClassStatus
      },
      // Future classes
      {
        id: 6,
        name: "Sparring Practice",
        instructor: "Sensei Sarah Lee",
        date: new Date(currentYear, currentMonth, now.getDate() + 2),
        time: "5:30 PM",
        duration: "1.5 hours",
        location: "Training Hall B",
        belt_requirement: "Yellow Belt",
        status: 'upcoming' as ClassStatus
      },
      {
        id: 7,
        name: "Kids Karate - Intermediate",
        instructor: "Sensei John Smith",
        date: new Date(currentYear, currentMonth, now.getDate() + 4),
        time: "4:00 PM",
        duration: "1 hour",
        location: "Main Dojo",
        belt_requirement: "Yellow Belt",
        status: 'upcoming' as ClassStatus
      },
      {
        id: 8,
        name: "Belt Testing Prep",
        instructor: "Sensei John Smith",
        date: new Date(currentYear, currentMonth, now.getDate() + 6),
        time: "3:00 PM",
        duration: "2 hours",
        location: "Main Dojo",
        belt_requirement: "Yellow Belt",
        status: 'upcoming' as ClassStatus
      },
      {
        id: 9,
        name: "Kids Karate - Intermediate",
        instructor: "Sensei John Smith",
        date: new Date(currentYear, currentMonth, now.getDate() + 7),
        time: "4:00 PM",
        duration: "1 hour",
        location: "Main Dojo",
        belt_requirement: "Yellow Belt",
        status: 'upcoming' as ClassStatus
      },
      {
        id: 10,
        name: "Sparring Practice",
        instructor: "Sensei Sarah Lee",
        date: new Date(currentYear, currentMonth, now.getDate() + 9),
        time: "5:30 PM",
        duration: "1.5 hours",
        location: "Training Hall B",
        belt_requirement: "Yellow Belt",
        status: 'upcoming' as ClassStatus
      },
    ];
  });

  useEffect(() => {
    // Check if student is logged in
    const isLoggedIn = localStorage.getItem("student_logged_in");
    if (!isLoggedIn) {
      setLocation("/student-login");
      return;
    }
    setTimeout(() => setMounted(true), 100);
  }, [setLocation]);

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  // Get classes for a specific date
  const getClassesForDate = (date: Date) => {
    return classes.filter(c => 
      c.date.getFullYear() === date.getFullYear() &&
      c.date.getMonth() === date.getMonth() &&
      c.date.getDate() === date.getDate()
    );
  };

  // Get classes for selected date
  const selectedDateClasses = selectedDate ? getClassesForDate(selectedDate) : [];

  // Filter classes for list view
  const filteredClasses = useMemo(() => {
    let filtered = [...classes];
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus);
    }
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [classes, filterStatus]);

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSameDate = (date1: Date | null, date2: Date) => {
    if (!date1) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDate(date, today)) return 'Today';
    if (isSameDate(date, tomorrow)) return 'Tomorrow';
    if (isSameDate(date, yesterday)) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-[#0A0E1A] overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E1A] via-[#111827] to-[#0A0E1A]" />
        <div 
          className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-[120px] animate-pulse"
          style={{ background: `radial-gradient(circle, ${beltStyle.glow}, transparent)` }}
        />
        <div 
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px] animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(96, 165, 250, 0.4), transparent)', animationDelay: '1s' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/[0.05] bg-white/[0.02] backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocation("/student-dashboard")}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </button>
              <div className="flex items-center gap-3">
                {APP_LOGO && (
                  <img 
                    src={APP_LOGO} 
                    alt={APP_TITLE} 
                    className="h-8 w-auto"
                  />
                )}
                <div>
                  <h1 className="text-lg font-semibold text-white">My Schedule</h1>
                  <p className="text-xs text-white/40">View your training calendar</p>
                </div>
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <GlassPanel className="p-1 flex gap-1" hover={false}>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </GlassPanel>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8 max-w-7xl">
          {viewMode === 'calendar' ? (
            /* Calendar View */
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {/* Calendar */}
              <div className="lg:col-span-2">
                <GlassPanel className="p-6" hover={false}>
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">{monthYear}</h2>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToToday}
                        className="text-white/60 hover:text-white hover:bg-white/10 text-sm"
                      >
                        Today
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPreviousMonth}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNextMonth}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-xs text-white/40 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((date, index) => (
                      <CalendarDay
                        key={index}
                        date={date}
                        isCurrentMonth={date.getMonth() === currentDate.getMonth()}
                        isToday={isToday(date)}
                        isSelected={isSameDate(selectedDate, date)}
                        classes={getClassesForDate(date)}
                        onClick={() => setSelectedDate(date)}
                        beltColor={beltStyle.primary}
                      />
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-xs text-white/40">Attended</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: beltStyle.primary }} />
                      <span className="text-xs text-white/40">Upcoming</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-xs text-white/40">Missed</span>
                    </div>
                  </div>
                </GlassPanel>
              </div>

              {/* Selected Day Details */}
              <div className="lg:col-span-1">
                <GlassPanel className="p-6" hover={false}>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {selectedDate ? formatDate(selectedDate) : 'Select a date'}
                  </h3>

                  {selectedDateClasses.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateClasses.map(classItem => (
                        <div 
                          key={classItem.id}
                          className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] transition-all hover:bg-white/[0.05]"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-white text-sm">{classItem.name}</h4>
                            <StatusBadge status={classItem.status} />
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-white/50">
                              <User className="h-3 w-3" />
                              {classItem.instructor}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/50">
                              <Clock className="h-3 w-3" />
                              {classItem.time} ({classItem.duration})
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/50">
                              <MapPin className="h-3 w-3" />
                              {classItem.location}
                            </div>
                          </div>
                          <div className="mt-3">
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
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-white/20 mx-auto mb-3" />
                      <p className="text-white/40 text-sm">No classes scheduled</p>
                      <p className="text-white/30 text-xs mt-1">Select another date to view classes</p>
                    </div>
                  )}
                </GlassPanel>

                {/* Quick Stats */}
                <GlassPanel className="p-6 mt-4" hover={false}>
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">This Month</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">
                        {classes.filter(c => c.status === 'attended').length}
                      </p>
                      <p className="text-xs text-white/40">Attended</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">
                        {classes.filter(c => c.status === 'upcoming').length}
                      </p>
                      <p className="text-xs text-white/40">Upcoming</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-400">
                        {classes.filter(c => c.status === 'missed').length}
                      </p>
                      <p className="text-xs text-white/40">Missed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold" style={{ color: beltStyle.primary }}>
                        {Math.round((classes.filter(c => c.status === 'attended').length / 
                          (classes.filter(c => c.status === 'attended').length + classes.filter(c => c.status === 'missed').length)) * 100) || 0}%
                      </p>
                      <p className="text-xs text-white/40">Attendance</p>
                    </div>
                  </div>
                </GlassPanel>
              </div>
            </div>
          ) : (
            /* List View */
            <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {/* Filter Bar */}
              <GlassPanel className="p-4 mb-6" hover={false}>
                <div className="flex items-center gap-4">
                  <Filter className="h-4 w-4 text-white/40" />
                  <div className="flex gap-2">
                    {(['all', 'upcoming', 'attended', 'missed'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1.5 rounded-xl text-sm transition-all ${
                          filterStatus === status 
                            ? 'bg-white/10 text-white' 
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </GlassPanel>

              {/* Class List */}
              <div className="space-y-3">
                {filteredClasses.map(classItem => (
                  <GlassPanel key={classItem.id} className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${beltStyle.primary}22, ${beltStyle.primary}11)` }}
                        >
                          <Calendar className="h-6 w-6" style={{ color: beltStyle.primary }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-white">{classItem.name}</h4>
                            <StatusBadge status={classItem.status} />
                          </div>
                          <p className="text-sm text-white/50 mb-2">{classItem.instructor}</p>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-xs text-white/40">
                              <Clock className="h-3 w-3" />
                              {classItem.time} ({classItem.duration})
                            </span>
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
                        <p className="font-semibold text-white">{formatDate(classItem.date)}</p>
                        <p className="text-xs text-white/40">
                          {classItem.date.toLocaleDateString('en-US', { weekday: 'long' })}
                        </p>
                      </div>
                    </div>
                  </GlassPanel>
                ))}
              </div>

              {filteredClasses.length === 0 && (
                <div className="text-center py-16">
                  <Calendar className="h-16 w-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">No classes found</p>
                  <p className="text-white/30 text-sm mt-1">Try adjusting your filter</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
