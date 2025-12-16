import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Program color mapping (muted, accessible colors)
const PROGRAM_COLORS: Record<string, { bg: string; border: string; text: string; darkBg: string; darkBorder: string; darkText: string }> = {
  'Kids Karate': { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', darkBg: 'bg-blue-900/40', darkBorder: 'border-blue-700/50', darkText: 'text-blue-200' },
  'Little Dragons': { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', darkBg: 'bg-purple-900/40', darkBorder: 'border-purple-700/50', darkText: 'text-purple-200' },
  'Teen Kickboxing': { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', darkBg: 'bg-orange-900/40', darkBorder: 'border-orange-700/50', darkText: 'text-orange-200' },
  'Adult Karate': { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', darkBg: 'bg-green-900/40', darkBorder: 'border-green-700/50', darkText: 'text-green-200' },
  'Adult Jiu-Jitsu': { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', darkBg: 'bg-red-900/40', darkBorder: 'border-red-700/50', darkText: 'text-red-200' },
  'Adult Muay Thai': { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', darkBg: 'bg-amber-900/40', darkBorder: 'border-amber-700/50', darkText: 'text-amber-200' },
  'Kickboxing': { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800', darkBg: 'bg-rose-900/40', darkBorder: 'border-rose-700/50', darkText: 'text-rose-200' },
  'default': { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-800', darkBg: 'bg-gray-800/40', darkBorder: 'border-gray-600/50', darkText: 'text-gray-200' },
};

// Days of the week
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Time slots configuration
const WEEKDAY_START = 15; // 3:00 PM
const WEEKDAY_END = 21;   // 9:00 PM
const WEEKEND_START = 8;  // 8:00 AM
const WEEKEND_END = 14;   // 2:00 PM

interface ClassItem {
  id: number;
  name: string;
  type?: string;
  level?: string;
  instructor?: string;
  instructorId?: number;
  day_of_week?: string;
  schedule?: string;
  start_time?: string;
  end_time?: string;
  time?: string; // Formatted time like "4:30 PM - 5:00 PM"
  room?: string;
  capacity?: number;
  enrolled?: number;
  program?: string;
}

interface OverallScheduleProps {
  classes: ClassItem[];
  isDark: boolean;
  onClassClick: (classItem: ClassItem) => void;
  dojoName?: string;
  dojoLocation?: string;
}

// Helper to convert time string to minutes from midnight
const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper to parse formatted time like "4:30 PM" to 24h format "16:30"
const parseFormattedTime = (timeStr: string): string => {
  if (!timeStr) return '';
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return '';
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

// Helper to extract start and end times from formatted time string
const parseTimeRange = (timeStr: string): { start: string; end: string } => {
  if (!timeStr) return { start: '', end: '' };
  const parts = timeStr.split(/\s*-\s*/);
  if (parts.length !== 2) return { start: '', end: '' };
  return {
    start: parseFormattedTime(parts[0].trim()),
    end: parseFormattedTime(parts[1].trim())
  };
};

// Helper to format time for display
const formatTime = (hour: number): string => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:00 ${ampm}`;
};

// Helper to format time string
const formatTimeStr = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function OverallSchedule({ 
  classes, 
  isDark, 
  onClassClick,
  dojoName = 'DojoFlow',
  dojoLocation = ''
}: OverallScheduleProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [hoveredClass, setHoveredClass] = useState<number | null>(null);

  // Generate time slots for a given day
  const getTimeSlots = (dayIndex: number): number[] => {
    const isWeekend = dayIndex >= 5; // Sat = 5, Sun = 6
    const start = isWeekend ? WEEKEND_START : WEEKDAY_START;
    const end = isWeekend ? WEEKEND_END : WEEKDAY_END;
    const slots: number[] = [];
    for (let hour = start; hour < end; hour++) {
      slots.push(hour);
    }
    return slots;
  };

  // Get all unique time slots across all days
  const allTimeSlots = useMemo(() => {
    const slots = new Set<number>();
    for (let i = 0; i < 7; i++) {
      getTimeSlots(i).forEach(s => slots.add(s));
    }
    return Array.from(slots).sort((a, b) => a - b);
  }, []);

  // Group classes by day
  const classesByDay = useMemo(() => {
    const grouped: Record<string, ClassItem[]> = {};
    DAYS.forEach(day => {
      grouped[day] = [];
    });
    
    classes.forEach(cls => {
      const day = cls.day_of_week || cls.schedule;
      if (day && grouped[day]) {
        grouped[day].push(cls);
      }
    });
    
    return grouped;
  }, [classes]);

  // Get classes for a specific day and time slot
  const getClassesForSlot = (day: string, hour: number): ClassItem[] => {
    return classesByDay[day]?.filter(cls => {
      // Try start_time first, then parse from time field
      let startTime = cls.start_time;
      if (!startTime && cls.time) {
        const parsed = parseTimeRange(cls.time);
        startTime = parsed.start;
      }
      const startMinutes = timeToMinutes(startTime || '');
      const startHour = Math.floor(startMinutes / 60);
      return startHour === hour;
    }) || [];
  };

  // Calculate class block height based on duration
  const getClassHeight = (cls: ClassItem): number => {
    let startTime = cls.start_time;
    let endTime = cls.end_time;
    
    // Parse from time field if not available
    if ((!startTime || !endTime) && cls.time) {
      const parsed = parseTimeRange(cls.time);
      startTime = startTime || parsed.start;
      endTime = endTime || parsed.end;
    }
    
    const startMinutes = timeToMinutes(startTime || '');
    const endMinutes = timeToMinutes(endTime || '');
    const durationMinutes = endMinutes - startMinutes;
    // Each hour slot is 60px, so each minute is 1px
    return Math.max(durationMinutes, 30); // Minimum 30px height
  };

  // Get color for a program
  const getColor = (program: string | undefined) => {
    const key = program || 'default';
    return PROGRAM_COLORS[key] || PROGRAM_COLORS['default'];
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Get current week date range
  const getWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${formatDate(monday)} - ${formatDate(sunday)}, ${now.getFullYear()}`;
  };

  return (
    <TooltipProvider>
      <div className={`rounded-2xl border mb-6 overflow-hidden ${isDark ? 'bg-[#18181A] border-white/10' : 'bg-card border-border'}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'border-white/10' : 'border-border'}`}>
          <div>
            <h2 className="text-xl font-semibold">Overall Schedule</h2>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-muted-foreground'}`}>
              Click a class to edit. Print-friendly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Schedule
            </Button>
          </div>
        </div>

        {/* Schedule Grid - Printable Area */}
        <div ref={printRef} className="print-schedule">
          {/* Print Header (hidden on screen, shown on print) */}
          <div className="hidden print:block print:mb-4 print:pb-4 print:border-b print:border-gray-300">
            <h1 className="text-2xl font-bold text-black">{dojoName}</h1>
            {dojoLocation && <p className="text-gray-600">{dojoLocation}</p>}
            <p className="text-sm text-gray-500 mt-1">Week of {getWeekRange()}</p>
          </div>

          {/* Grid Container */}
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Day Headers */}
              <div className={`grid grid-cols-8 border-b ${isDark ? 'border-white/10' : 'border-border'}`}>
                <div className={`p-3 text-center text-sm font-medium ${isDark ? 'text-white/40 bg-white/5' : 'text-muted-foreground bg-muted/30'}`}>
                  Time
                </div>
                {DAYS.map((day, idx) => (
                  <div 
                    key={day} 
                    className={`p-3 text-center text-sm font-semibold ${isDark ? 'text-white border-l border-white/10' : 'text-foreground border-l border-border'}`}
                  >
                    <span className="hidden sm:inline">{FULL_DAYS[idx]}</span>
                    <span className="sm:hidden">{day}</span>
                  </div>
                ))}
              </div>

              {/* Time Rows */}
              {allTimeSlots.map((hour) => (
                <div 
                  key={hour} 
                  className={`grid grid-cols-8 border-b ${isDark ? 'border-white/5' : 'border-border/50'}`}
                  style={{ minHeight: '60px' }}
                >
                  {/* Time Label */}
                  <div className={`p-2 text-xs font-medium flex items-start justify-center ${isDark ? 'text-white/40 bg-white/[0.02]' : 'text-muted-foreground bg-muted/20'}`}>
                    {formatTime(hour)}
                  </div>
                  
                  {/* Day Columns */}
                  {DAYS.map((day, dayIdx) => {
                    const daySlots = getTimeSlots(dayIdx);
                    const isActiveSlot = daySlots.includes(hour);
                    const slotClasses = getClassesForSlot(day, hour);
                    
                    return (
                      <div 
                        key={`${day}-${hour}`} 
                        className={`relative border-l p-1 ${
                          isDark 
                            ? 'border-white/5' 
                            : 'border-border/30'
                        } ${!isActiveSlot ? (isDark ? 'bg-white/[0.01]' : 'bg-muted/10') : ''}`}
                      >
                        {slotClasses.map((cls, idx) => {
                          const colors = getColor(cls.type || cls.program);
                          const height = getClassHeight(cls);
                          
                          return (
                            <Tooltip key={cls.id}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => onClassClick(cls)}
                                  onMouseEnter={() => setHoveredClass(cls.id)}
                                  onMouseLeave={() => setHoveredClass(null)}
                                  className={`
                                    w-full text-left rounded-lg p-2 mb-1 border transition-all duration-150
                                    ${isDark 
                                      ? `${colors.darkBg} ${colors.darkBorder} ${colors.darkText}` 
                                      : `${colors.bg} ${colors.border} ${colors.text}`
                                    }
                                    ${hoveredClass === cls.id ? 'ring-2 ring-primary ring-offset-1 scale-[1.02]' : ''}
                                    print:bg-white print:border-gray-300 print:text-black
                                  `}
                                  style={{ 
                                    height: `${Math.min(height, 58)}px`,
                                    marginLeft: idx > 0 ? `${idx * 4}px` : 0,
                                    zIndex: idx + 1
                                  }}
                                >
                                  <div className="text-xs font-semibold truncate leading-tight">
                                    {cls.name}
                                  </div>
                                  <div className="text-[10px] opacity-80 truncate">
                                    {cls.instructor || 'Not assigned'}
                                  </div>
                                  {cls.room && (
                                    <div className="text-[9px] opacity-60 truncate">
                                      {cls.room}
                                    </div>
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent 
                                side="right" 
                                className={`max-w-xs ${isDark ? 'bg-[#1a1a1c] border-white/10' : ''}`}
                              >
                                <div className="space-y-1">
                                  <p className="font-semibold">{cls.name}</p>
                                <p className="text-xs opacity-80">
                                  {cls.time || `${formatTimeStr(cls.start_time || '')} - ${formatTimeStr(cls.end_time || '')}`}
                                </p>
                                  <p className="text-xs">
                                    <span className="opacity-60">Instructor:</span> {cls.instructor || 'Not assigned'}
                                  </p>
                                  {cls.room && (
                                    <p className="text-xs">
                                      <span className="opacity-60">Room:</span> {cls.room}
                                    </p>
                                  )}
                                  {cls.capacity && (
                                    <p className="text-xs">
                                      <span className="opacity-60">Capacity:</span> {cls.enrolled || 0}/{cls.capacity}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-primary mt-2">Click to edit</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                        
                        {/* Show "+N more" if too many classes */}
                        {slotClasses.length > 2 && (
                          <div className={`text-[10px] text-center ${isDark ? 'text-white/40' : 'text-muted-foreground'}`}>
                            +{slotClasses.length - 2} more
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className={`px-6 py-3 border-t flex flex-wrap gap-3 ${isDark ? 'border-white/10' : 'border-border'}`}>
          <span className={`text-xs font-medium ${isDark ? 'text-white/40' : 'text-muted-foreground'}`}>Programs:</span>
          {Object.entries(PROGRAM_COLORS).filter(([key]) => key !== 'default').slice(0, 6).map(([program, colors]) => (
            <div key={program} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${isDark ? colors.darkBg : colors.bg} ${isDark ? colors.darkBorder : colors.border} border`} />
              <span className={`text-xs ${isDark ? 'text-white/60' : 'text-muted-foreground'}`}>{program}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Print styles are in index.css */}
    </TooltipProvider>
  );
}
