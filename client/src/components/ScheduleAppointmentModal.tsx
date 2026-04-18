import { useState, useMemo } from 'react';
import {
  X, Calendar, Clock, ChevronLeft, ChevronRight, Check,
  Users, MapPin, Zap, Search, User, BookOpen, Dumbbell,
  Star, AlertCircle, ChevronDown, Sparkles
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  interestedProgram?: string;
}

interface ScheduleAppointmentModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduled?: () => void;
  bookedByName?: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBREV = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const PROGRAM_ICONS: Record<string, string> = {
  'Kids Karate': '🥋',
  'Kickboxing': '🥊',
  'After School': '🏫',
  'Little Ninjas': '🥷',
  'Dragon Kids': '🐉',
  'BJJ': '🤼',
  'Jiu Jitsu': '🤼',
  'default': '🏋️',
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  showed: 'bg-green-500/20 text-green-400 border-green-500/30',
  no_show: 'bg-red-500/20 text-red-400 border-red-500/30',
  cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

function getProgramIcon(program?: string | null, name?: string): string {
  if (!program && !name) return PROGRAM_ICONS.default;
  const key = Object.keys(PROGRAM_ICONS).find(k =>
    (program || '').toLowerCase().includes(k.toLowerCase()) ||
    (name || '').toLowerCase().includes(k.toLowerCase())
  );
  return key ? PROGRAM_ICONS[key] : PROGRAM_ICONS.default;
}

function getNextOccurrence(dayOfWeek: string, fromDate: Date): Date {
  const dayIndex = DAYS_OF_WEEK.indexOf(dayOfWeek);
  if (dayIndex === -1) return fromDate;
  const today = fromDate.getDay(); // 0=Sun
  // Convert to Mon=0 index
  const todayMon = (today + 6) % 7;
  let diff = dayIndex - todayMon;
  if (diff <= 0) diff += 7;
  const next = new Date(fromDate);
  next.setDate(fromDate.getDate() + diff);
  return next;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTime(t?: string | null): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getCapacityColor(enrolled: number, capacity: number): string {
  const pct = enrolled / capacity;
  if (pct >= 0.9) return 'text-red-400';
  if (pct >= 0.7) return 'text-amber-400';
  return 'text-emerald-400';
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({
  selectedDate,
  onSelectDate,
  highlightedDays,
}: {
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  highlightedDays: number[]; // 0=Sun..6=Sat
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); }
    else setViewMonth(m => m + 1);
  };

  const isHighlighted = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    return highlightedDays.includes(d.getDay());
  };
  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t;
  };
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day;
  };
  const isToday = (day: number) => {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  };

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
        <span className="text-sm font-semibold text-white">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-slate-500 py-1">{d}</div>
        ))}
      </div>
      {/* Days */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const past = isPast(day);
          const hi = isHighlighted(day);
          const sel = isSelected(day);
          const tod = isToday(day);
          return (
            <button
              key={i}
              disabled={past || !hi}
              onClick={() => !past && hi && onSelectDate(new Date(viewYear, viewMonth, day))}
              className={`
                relative w-8 h-8 mx-auto rounded-full text-xs font-medium transition-all
                ${sel ? 'bg-[#E53935] text-white shadow-lg shadow-red-500/30 scale-110' :
                  tod && hi ? 'bg-white/10 text-white ring-1 ring-[#E53935]' :
                  hi && !past ? 'text-white hover:bg-white/15 cursor-pointer' :
                  'text-slate-600 cursor-not-allowed'}
              `}
            >
              {day}
              {hi && !past && !sel && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#E53935]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function ScheduleAppointmentModal({
  lead,
  isOpen,
  onClose,
  onScheduled,
  bookedByName,
}: ScheduleAppointmentModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'class' | 'datetime' | 'confirm'>('class');
  const [search, setSearch] = useState('');
  const [filterDay, setFilterDay] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');

  // Fetch classes
  const { data: classes = [], isLoading: classesLoading } = trpc.leads.getSchedulableClasses.useQuery(
    undefined,
    { enabled: isOpen }
  );

  // Group classes by unique name+instructor combo (pick one row per class)
  const uniqueClasses = useMemo(() => {
    const seen = new Set<string>();
    return classes.filter(c => {
      const key = `${c.name}|${c.instructor || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [classes]);

  // All days this class runs
  const classDays = useMemo(() => {
    if (!selectedClass) return [];
    return classes
      .filter(c => c.name === selectedClass.name && c.instructor === selectedClass.instructor)
      .map(c => c.dayOfWeek)
      .filter(Boolean);
  }, [classes, selectedClass]);

  // Day indices (0=Sun..6=Sat) for calendar highlighting
  const highlightedDayIndices = useMemo(() => {
    return classDays.map(d => {
      const idx = DAYS_OF_WEEK.indexOf(d);
      return idx === -1 ? -1 : (idx + 1) % 7; // Mon=1..Sun=0
    }).filter(i => i !== -1);
  }, [classDays]);

  // Upcoming occurrences (next 4 weeks)
  const upcomingSlots = useMemo(() => {
    if (!selectedClass) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const slots: { date: Date; dayOfWeek: string; classRow: any }[] = [];
    classDays.forEach(day => {
      const classRow = classes.find(c => c.name === selectedClass.name && c.instructor === selectedClass.instructor && c.dayOfWeek === day);
      for (let week = 0; week < 4; week++) {
        const base = new Date(today);
        base.setDate(today.getDate() + week * 7);
        const occ = getNextOccurrence(day, week === 0 ? today : base);
        if (occ > today || (occ.getTime() === today.getTime())) {
          slots.push({ date: occ, dayOfWeek: day, classRow });
        }
      }
    });
    slots.sort((a, b) => a.date.getTime() - b.date.getTime());
    // Deduplicate by date string
    const seen = new Set<string>();
    return slots.filter(s => {
      const k = formatDateISO(s.date);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 8);
  }, [selectedClass, classDays, classes]);

  // Filtered classes for step 1
  const filteredClasses = useMemo(() => {
    let list = uniqueClasses;
    if (filterDay) list = list.filter(c => {
      const days = classes.filter(x => x.name === c.name && x.instructor === c.instructor).map(x => x.dayOfWeek);
      return days.includes(filterDay);
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.instructor || '').toLowerCase().includes(q) ||
        (c.program || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [uniqueClasses, classes, filterDay, search]);

  const scheduleAppointment = trpc.leads.scheduleAppointment.useMutation({
    onSuccess: () => {
      toast({ title: '✅ Appointment Scheduled!', description: `${lead?.first_name} is booked for ${selectedClass?.name} on ${selectedDate ? formatDate(selectedDate) : ''}` });
      onScheduled?.();
      handleClose();
    },
    onError: (e) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  const handleClose = () => {
    setStep('class');
    setSearch('');
    setFilterDay(null);
    setSelectedClass(null);
    setSelectedDate(null);
    setNotes('');
    onClose();
  };

  const handleConfirm = () => {
    if (!lead || !selectedClass || !selectedDate) return;
    scheduleAppointment.mutate({
      leadId: lead.id,
      classId: selectedClass.id,
      scheduledDate: formatDateISO(selectedDate),
      scheduledTime: selectedClass.startTime || undefined,
      bookedByName: bookedByName,
      notes: notes || undefined,
    });
  };

  if (!isOpen || !lead) return null;

  const fullName = `${lead.first_name} ${lead.last_name}`;
  const initials = `${lead.first_name[0]}${lead.last_name[0]}`.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #0f1117 0%, #1a1d2e 50%, #0f1117 100%)' }}>

        {/* Glowing border */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(229,57,53,0.3), 0 0 60px rgba(229,57,53,0.1)' }} />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Lead avatar */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E53935] to-[#FF6B6B] flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-red-500/20">
              {initials}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Scheduling Intro Class</p>
              <h2 className="text-white font-bold text-lg leading-tight">{fullName}</h2>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-white/5">
          {[
            { id: 'class', label: 'Select Class', icon: BookOpen },
            { id: 'datetime', label: 'Pick Date', icon: Calendar },
            { id: 'confirm', label: 'Confirm', icon: Check },
          ].map((s, i) => {
            const stepOrder = ['class', 'datetime', 'confirm'];
            const currentIdx = stepOrder.indexOf(step);
            const thisIdx = stepOrder.indexOf(s.id);
            const done = thisIdx < currentIdx;
            const active = thisIdx === currentIdx;
            return (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                  active ? 'bg-[#E53935]/20 text-[#E53935]' :
                  done ? 'text-emerald-400' : 'text-slate-600'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                    active ? 'border-[#E53935] bg-[#E53935] text-white' :
                    done ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' :
                    'border-slate-700 text-slate-600'
                  }`}>
                    {done ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="text-xs font-medium">{s.label}</span>
                </div>
                {i < 2 && <ChevronRight className="w-3 h-3 text-slate-700 mx-1" />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── STEP 1: Select Class ── */}
          {step === 'class' && (
            <div className="p-6">
              {/* Search + Day Filter */}
              <div className="flex gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search classes, instructors..."
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-[#E53935]/50 focus:ring-[#E53935]/20"
                  />
                </div>
                <div className="flex gap-1.5">
                  {DAYS_OF_WEEK.slice(0, 6).map((day, i) => (
                    <button
                      key={day}
                      onClick={() => setFilterDay(filterDay === day ? null : day)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        filterDay === day
                          ? 'bg-[#E53935] text-white shadow-lg shadow-red-500/30'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {DAY_ABBREV[i]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Grid */}
              {classesLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No classes found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredClasses.map(cls => {
                    const days = classes.filter(c => c.name === cls.name && c.instructor === cls.instructor).map(c => c.dayOfWeek);
                    const icon = getProgramIcon(cls.program, cls.name);
                    const spotsLeft = cls.capacity - cls.enrolled;
                    const isSelected = selectedClass?.id === cls.id;
                    return (
                      <button
                        key={`${cls.name}-${cls.instructor}`}
                        onClick={() => setSelectedClass(cls)}
                        className={`
                          relative text-left p-4 rounded-xl border transition-all group
                          ${isSelected
                            ? 'border-[#E53935] bg-[#E53935]/10 shadow-lg shadow-red-500/20'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'}
                        `}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#E53935] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                            isSelected ? 'bg-[#E53935]/20' : 'bg-white/10'
                          }`}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-sm leading-tight truncate">{cls.name}</h3>
                            {cls.instructor && (
                              <p className="text-slate-400 text-xs mt-0.5 truncate">
                                <User className="w-3 h-3 inline mr-1" />{cls.instructor}
                              </p>
                            )}
                            {cls.program && (
                              <span className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300">
                                {cls.program}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex gap-1 flex-wrap">
                            {days.slice(0, 4).map(d => (
                              <span key={d} className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
                                {d.slice(0, 3)}
                              </span>
                            ))}
                            {days.length > 4 && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
                                +{days.length - 4}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-medium ${getCapacityColor(cls.enrolled, cls.capacity)}`}>
                            {spotsLeft > 0 ? `${spotsLeft} spots` : 'Full'}
                          </span>
                        </div>
                        {/* Capacity bar */}
                        <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              cls.enrolled / cls.capacity >= 0.9 ? 'bg-red-500' :
                              cls.enrolled / cls.capacity >= 0.7 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, (cls.enrolled / cls.capacity) * 100)}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Pick Date ── */}
          {step === 'datetime' && selectedClass && (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Left: Calendar */}
                <div>
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#E53935]" />
                    Select Date
                  </h3>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <MiniCalendar
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                      highlightedDays={highlightedDayIndices}
                    />
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-[#E53935] inline-block" />
                      Class days highlighted
                    </div>
                  </div>
                </div>

                {/* Right: Quick slots + details */}
                <div>
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Upcoming Sessions
                  </h3>
                  <div className="space-y-2 mb-4">
                    {upcomingSlots.map((slot, i) => {
                      const isSel = selectedDate && formatDateISO(selectedDate) === formatDateISO(slot.date);
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedDate(slot.date)}
                          className={`
                            w-full text-left px-4 py-3 rounded-xl border transition-all
                            ${isSel
                              ? 'border-[#E53935] bg-[#E53935]/10 shadow-md shadow-red-500/20'
                              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'}
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white text-sm font-medium">
                                {slot.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </p>
                              <p className="text-slate-400 text-xs mt-0.5">
                                {slot.dayOfWeek}
                                {slot.classRow?.startTime && ` · ${formatTime(slot.classRow.startTime)}`}
                                {slot.classRow?.endTime && ` – ${formatTime(slot.classRow.endTime)}`}
                              </p>
                            </div>
                            {isSel && (
                              <div className="w-5 h-5 rounded-full bg-[#E53935] flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Class details card */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#E53935]/20 flex items-center justify-center text-lg">
                        {getProgramIcon(selectedClass.program, selectedClass.name)}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{selectedClass.name}</p>
                        {selectedClass.instructor && (
                          <p className="text-slate-400 text-xs">{selectedClass.instructor}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Users className="w-3 h-3" />
                        {selectedClass.enrolled}/{selectedClass.capacity} enrolled
                      </div>
                      {selectedClass.room && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {selectedClass.room}
                        </div>
                      )}
                      {selectedClass.duration && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3 h-3" />
                          {selectedClass.duration} min
                        </div>
                      )}
                      {selectedClass.level && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Star className="w-3 h-3" />
                          {selectedClass.level}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add any notes for this appointment..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#E53935]/50 resize-none"
                />
              </div>
            </div>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === 'confirm' && selectedClass && selectedDate && (
            <div className="p-6">
              <div className="max-w-md mx-auto">
                {/* Confirmation card */}
                <div className="rounded-2xl border border-[#E53935]/30 bg-[#E53935]/5 p-6 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#E53935]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-xl bg-[#E53935]/20 flex items-center justify-center text-2xl">
                        {getProgramIcon(selectedClass.program, selectedClass.name)}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{selectedClass.name}</h3>
                        {selectedClass.instructor && (
                          <p className="text-slate-400 text-sm">{selectedClass.instructor}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <User className="w-4 h-4 text-[#E53935] flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400">Lead</p>
                          <p className="text-white font-medium text-sm">{fullName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <Calendar className="w-4 h-4 text-[#E53935] flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400">Date</p>
                          <p className="text-white font-medium text-sm">{formatDate(selectedDate)}</p>
                        </div>
                      </div>
                      {selectedClass.startTime && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                          <Clock className="w-4 h-4 text-[#E53935] flex-shrink-0" />
                          <div>
                            <p className="text-xs text-slate-400">Time</p>
                            <p className="text-white font-medium text-sm">
                              {formatTime(selectedClass.startTime)}
                              {selectedClass.endTime && ` – ${formatTime(selectedClass.endTime)}`}
                            </p>
                          </div>
                        </div>
                      )}
                      {bookedByName && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-slate-400">Booked by</p>
                            <p className="text-white font-medium text-sm">{bookedByName}</p>
                          </div>
                        </div>
                      )}
                      {notes && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                          <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-400">Notes</p>
                            <p className="text-white text-sm">{notes}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-amber-300 text-xs">
                        Lead status will be updated to <strong>Intro Scheduled</strong> automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/20">
          <button
            onClick={() => {
              if (step === 'datetime') setStep('class');
              else if (step === 'confirm') setStep('datetime');
              else handleClose();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 'class' ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-3">
            {step === 'class' && (
              <Button
                disabled={!selectedClass}
                onClick={() => setStep('datetime')}
                className="bg-[#E53935] hover:bg-[#C62828] text-white px-6 py-2 rounded-xl font-semibold shadow-lg shadow-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next: Pick Date
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {step === 'datetime' && (
              <Button
                disabled={!selectedDate}
                onClick={() => setStep('confirm')}
                className="bg-[#E53935] hover:bg-[#C62828] text-white px-6 py-2 rounded-xl font-semibold shadow-lg shadow-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Review & Confirm
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {step === 'confirm' && (
              <Button
                disabled={scheduleAppointment.isPending}
                onClick={handleConfirm}
                className="bg-[#E53935] hover:bg-[#C62828] text-white px-8 py-2 rounded-xl font-semibold shadow-lg shadow-red-500/30 disabled:opacity-60 transition-all"
              >
                {scheduleAppointment.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scheduling...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Confirm Appointment
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
