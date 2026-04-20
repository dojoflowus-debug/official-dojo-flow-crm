import { useState, useMemo, useRef, useEffect } from 'react';
import {
  X, Calendar, Clock, ChevronLeft, ChevronRight, Check,
  Users, MapPin, Zap, Search, User, BookOpen, Dumbbell,
  Star, AlertCircle, ChevronDown, Sparkles, UserCheck, Shield,
  ArrowRight, CheckCircle2, Flame
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';

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

// Class color themes — each class gets a distinct accent
const CLASS_THEMES: Record<string, { gradient: string; glow: string; badge: string; dot: string }> = {
  'Kickboxing':        { gradient: 'from-orange-500/20 to-red-600/10',   glow: 'rgba(249,115,22,0.25)', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',  dot: 'bg-orange-400' },
  'After School':      { gradient: 'from-sky-500/20 to-blue-600/10',     glow: 'rgba(14,165,233,0.25)',  badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',           dot: 'bg-sky-400' },
  'Dragon Kids':       { gradient: 'from-violet-500/20 to-purple-600/10',glow: 'rgba(139,92,246,0.25)', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',  dot: 'bg-violet-400' },
  'Dragon Kids & Teens':{ gradient: 'from-fuchsia-500/20 to-pink-600/10',glow: 'rgba(217,70,239,0.25)', badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',dot: 'bg-fuchsia-400' },
  'Little Ninjas':     { gradient: 'from-emerald-500/20 to-teal-600/10', glow: 'rgba(16,185,129,0.25)', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',dot: 'bg-emerald-400' },
  'Little Ninjas & Me':{ gradient: 'from-teal-500/20 to-cyan-600/10',   glow: 'rgba(20,184,166,0.25)', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',         dot: 'bg-teal-400' },
  'Summer Camp':       { gradient: 'from-yellow-500/20 to-amber-600/10', glow: 'rgba(234,179,8,0.25)',  badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',  dot: 'bg-yellow-400' },
  'Teens & Adults':    { gradient: 'from-rose-500/20 to-red-600/10',     glow: 'rgba(244,63,94,0.25)',  badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',         dot: 'bg-rose-400' },
  'Teens':             { gradient: 'from-indigo-500/20 to-blue-600/10',  glow: 'rgba(99,102,241,0.25)', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',  dot: 'bg-indigo-400' },
  'default':           { gradient: 'from-slate-500/20 to-slate-600/10',  glow: 'rgba(100,116,139,0.25)',badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',     dot: 'bg-slate-400' },
};

const PROGRAM_ICONS: Record<string, string> = {
  'Kids Karate': '🥋', 'Kickboxing': '🥊', 'After School': '🏫',
  'Little Ninjas': '🥷', 'Dragon Kids': '🐉', 'BJJ': '🤼',
  'Jiu Jitsu': '🤼', 'Summer Camp': '⛺', 'Teens': '🎯',
  'default': '🏋️',
};

function getClassTheme(name?: string | null) {
  if (!name) return CLASS_THEMES.default;
  const key = Object.keys(CLASS_THEMES).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return key ? CLASS_THEMES[key] : CLASS_THEMES.default;
}

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
  const today = fromDate.getDay();
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

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

// ── Premium Calendar ──────────────────────────────────────────────────────────
function PremiumCalendar({
  selectedDate,
  onSelectDate,
  highlightedDays,
}: {
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  highlightedDays: number[];
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

  const isHighlighted = (day: number) => highlightedDays.includes(new Date(viewYear, viewMonth, day).getDay());
  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day); d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return d < t;
  };
  const isSelected = (day: number) =>
    selectedDate?.getFullYear() === viewYear &&
    selectedDate?.getMonth() === viewMonth &&
    selectedDate?.getDate() === day;
  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  return (
    <div className="select-none w-full">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-white font-bold text-base tracking-wide">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-1">{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-9" />;
          const past = isPast(day);
          const hi = isHighlighted(day);
          const sel = isSelected(day);
          const tod = isToday(day);
          return (
            <div key={i} className="flex items-center justify-center">
              <button
                disabled={past || !hi}
                onClick={() => !past && hi && onSelectDate(new Date(viewYear, viewMonth, day))}
                className={`
                  relative w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-150
                  ${sel
                    ? 'bg-[#E53935] text-white shadow-lg shadow-red-500/40 scale-110 ring-2 ring-[#E53935]/30'
                    : hi && !past
                      ? tod
                        ? 'bg-white/15 text-white ring-1 ring-[#E53935]/60 hover:bg-[#E53935]/30 cursor-pointer'
                        : 'text-white hover:bg-white/15 cursor-pointer'
                      : 'text-slate-700 cursor-not-allowed'}
                `}
              >
                {day}
                {hi && !past && !sel && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#E53935]" />
                )}
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <span className="w-2 h-2 rounded-full bg-[#E53935] inline-block" />
        Highlighted days = class days
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
  const [selectedBookedBy, setSelectedBookedBy] = useState<{ id: number; name: string; role: string } | null>(null);
  const [bookedByDropdownOpen, setBookedByDropdownOpen] = useState(false);
  const bookedByRef = useRef<HTMLDivElement>(null);

  const { data: classes = [], isLoading: classesLoading } = trpc.leads.getSchedulableClasses.useQuery(
    undefined, { enabled: isOpen }
  );
  const { data: staffMembers = [] } = trpc.leads.getStaffMembers.useQuery(
    undefined, { enabled: isOpen }
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bookedByRef.current && !bookedByRef.current.contains(e.target as Node)) {
        setBookedByDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const uniqueClasses = useMemo(() => {
    const seen = new Set<string>();
    return classes.filter(c => {
      const key = `${c.name}|${c.instructor || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [classes]);

  const classDays = useMemo(() => {
    if (!selectedClass) return [];
    return classes
      .filter(c => c.name === selectedClass.name && c.instructor === selectedClass.instructor)
      .map(c => c.dayOfWeek).filter(Boolean);
  }, [classes, selectedClass]);

  const highlightedDayIndices = useMemo(() =>
    classDays.map(d => {
      const idx = DAYS_OF_WEEK.indexOf(d);
      return idx === -1 ? -1 : (idx + 1) % 7;
    }).filter(i => i !== -1),
  [classDays]);

  const upcomingSlots = useMemo(() => {
    if (!selectedClass) return [];
    const today = new Date(); today.setHours(0,0,0,0);
    const slots: { date: Date; dayOfWeek: string; classRow: any }[] = [];
    classDays.forEach(day => {
      const classRow = classes.find(c => c.name === selectedClass.name && c.instructor === selectedClass.instructor && c.dayOfWeek === day);
      for (let week = 0; week < 4; week++) {
        const base = new Date(today);
        base.setDate(today.getDate() + week * 7);
        const occ = getNextOccurrence(day, week === 0 ? today : base);
        if (occ >= today) slots.push({ date: occ, dayOfWeek: day, classRow });
      }
    });
    slots.sort((a, b) => a.date.getTime() - b.date.getTime());
    const seen = new Set<string>();
    return slots.filter(s => {
      const k = formatDateISO(s.date);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 6);
  }, [selectedClass, classDays, classes]);

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
    setStep('class'); setSearch(''); setFilterDay(null);
    setSelectedClass(null); setSelectedDate(null); setNotes('');
    setSelectedBookedBy(null); setBookedByDropdownOpen(false);
    onClose();
  };

  const handleConfirm = () => {
    if (!lead || !selectedClass || !selectedDate) return;
    scheduleAppointment.mutate({
      leadId: lead.id,
      classId: selectedClass.id,
      scheduledDate: formatDateISO(selectedDate),
      scheduledTime: selectedClass.startTime || undefined,
      bookedByName: selectedBookedBy?.name || bookedByName,
      notes: notes || undefined,
    });
  };

  if (!isOpen || !lead) return null;

  const fullName = `${lead.first_name} ${lead.last_name}`;
  const initials = `${lead.first_name[0]}${lead.last_name[0]}`.toUpperCase();
  const stepOrder = ['class', 'datetime', 'confirm'] as const;
  const currentStepIdx = stepOrder.indexOf(step);
  const selectedTheme = selectedClass ? getClassTheme(selectedClass.name) : CLASS_THEMES.default;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 1000, padding: '16px 16px calc(72px + 16px) 16px' }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleClose} />

      {/* Modal shell */}
      <div
        className="relative w-full max-w-5xl flex flex-col rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #0d0f1a 0%, #111320 60%, #0a0c14 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(229,57,53,0.08)',
          maxHeight: '92vh',
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E53935]/60 to-transparent" />

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="relative flex items-center justify-between px-8 py-5"
          style={{ background: 'linear-gradient(180deg, rgba(229,57,53,0.06) 0%, transparent 100%)' }}>
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E53935] to-[#FF6B6B] flex items-center justify-center text-white text-base font-black shadow-lg shadow-red-500/30">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0d0f1a] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>
            <div>
              <p className="text-xs text-[#E53935] font-bold uppercase tracking-widest mb-0.5">Scheduling Intro Class</p>
              <h2 className="text-white font-black text-xl leading-tight">{fullName}</h2>
              {lead.phone && <p className="text-slate-500 text-xs mt-0.5">{lead.phone}</p>}
            </div>
          </div>

          {/* Step indicator — pill style */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-2xl px-4 py-2 border border-white/8">
            {[
              { label: 'Class', icon: BookOpen },
              { label: 'Date', icon: Calendar },
              { label: 'Confirm', icon: CheckCircle2 },
            ].map((s, i) => {
              const done = i < currentStepIdx;
              const active = i === currentStepIdx;
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active ? 'bg-[#E53935] text-white shadow-md shadow-red-500/30'
                    : done ? 'text-emerald-400' : 'text-slate-600'
                  }`}>
                    {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                    {s.label}
                  </div>
                  {i < 2 && <div className={`w-4 h-px mx-1 ${done ? 'bg-emerald-500/50' : 'bg-white/10'}`} />}
                </div>
              );
            })}
          </div>

          <button onClick={handleClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── BODY ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

          {/* ═══ STEP 1: SELECT CLASS ═══════════════════════════════════ */}
          {step === 'class' && (
            <div className="px-8 pb-8 pt-2">
              {/* Search + Day Filter */}
              <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search classes or instructors..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#E53935]/40 focus:bg-white/8 transition-all"
                  />
                </div>
                <div className="flex gap-1.5 items-center bg-white/5 rounded-xl px-3 border border-white/10">
                  {DAYS_OF_WEEK.slice(0, 6).map((day, i) => (
                    <button
                      key={day}
                      onClick={() => setFilterDay(filterDay === day ? null : day)}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                        filterDay === day
                          ? 'bg-[#E53935] text-white shadow-md shadow-red-500/30'
                          : 'text-slate-500 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {DAY_ABBREV[i]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Grid */}
              {classesLoading ? (
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-36 rounded-2xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-500 font-medium">No classes found</p>
                  <p className="text-slate-700 text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {filteredClasses.map(cls => {
                    const days = classes.filter(c => c.name === cls.name && c.instructor === cls.instructor).map(c => c.dayOfWeek);
                    const icon = getProgramIcon(cls.program, cls.name);
                    const spotsLeft = cls.capacity - cls.enrolled;
                    const isSelected = selectedClass?.id === cls.id;
                    const theme = getClassTheme(cls.name);
                    const fillPct = Math.min(100, (cls.enrolled / cls.capacity) * 100);
                    const isFull = spotsLeft <= 0;
                    const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0;

                    return (
                      <button
                        key={`${cls.name}-${cls.instructor}`}
                        onClick={() => setSelectedClass(cls)}
                        className={`
                          relative text-left rounded-2xl border transition-all duration-200 overflow-hidden group
                          ${isSelected
                            ? 'border-[#E53935]/60 shadow-xl'
                            : 'border-white/8 hover:border-white/20'}
                        `}
                        style={isSelected ? {
                          boxShadow: `0 0 0 1px rgba(229,57,53,0.4), 0 8px 32px ${theme.glow}`,
                          background: `linear-gradient(135deg, rgba(229,57,53,0.12) 0%, rgba(13,15,26,0.95) 100%)`
                        } : {
                          background: 'rgba(255,255,255,0.03)',
                        }}
                      >
                        {/* Selected check badge */}
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#E53935] flex items-center justify-center shadow-lg shadow-red-500/40 z-10">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}

                        {/* Gradient top accent */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                          isSelected ? 'from-[#E53935] to-[#FF6B6B]' : `${theme.dot.replace('bg-', 'from-')} to-transparent opacity-60`
                        }`} />

                        <div className="p-5">
                          {/* Icon + name */}
                          <div className="flex items-start gap-3 mb-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-gradient-to-br ${theme.gradient}`}>
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <h3 className="text-white font-bold text-sm leading-tight">{cls.name}</h3>
                              {cls.instructor && (
                                <p className="text-slate-500 text-xs mt-1 truncate flex items-center gap-1">
                                  <User className="w-3 h-3 flex-shrink-0" />
                                  {cls.instructor}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Day pills */}
                          <div className="flex flex-wrap gap-1 mb-4">
                            {days.slice(0, 4).map(d => (
                              <span key={d} className="text-xs px-2 py-0.5 rounded-md bg-white/8 text-slate-400 font-medium">
                                {d.slice(0, 3)}
                              </span>
                            ))}
                            {days.length > 4 && (
                              <span className="text-xs px-2 py-0.5 rounded-md bg-white/8 text-slate-500">+{days.length - 4}</span>
                            )}
                          </div>

                          {/* Capacity bar */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-600">Capacity</span>
                              <span className={`text-xs font-bold ${
                                isFull ? 'text-red-400' : isAlmostFull ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                                {isFull ? 'Full' : isAlmostFull ? `${spotsLeft} left!` : `${spotsLeft} spots`}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  fillPct >= 90 ? 'bg-gradient-to-r from-red-500 to-red-400' :
                                  fillPct >= 70 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                                  'bg-gradient-to-r from-emerald-500 to-teal-400'
                                }`}
                                style={{ width: `${fillPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 2: PICK DATE ══════════════════════════════════════ */}
          {step === 'datetime' && selectedClass && (
            <div className="px-8 pb-8 pt-2">
              {/* Selected class banner */}
              <div className={`flex items-center gap-4 p-4 rounded-2xl mb-6 border bg-gradient-to-r ${selectedTheme.gradient} border-white/10`}>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl flex-shrink-0">
                  {getProgramIcon(selectedClass.program, selectedClass.name)}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold">{selectedClass.name}</p>
                  {selectedClass.instructor && <p className="text-slate-400 text-sm">{selectedClass.instructor}</p>}
                </div>
                <button onClick={() => setStep('class')}
                  className="text-xs text-slate-500 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all">
                  Change
                </button>
              </div>

              <div className="grid grid-cols-5 gap-6">
                {/* Left: Calendar (3 cols) */}
                <div className="col-span-3">
                  <div className="bg-white/4 rounded-2xl p-6 border border-white/8">
                    <PremiumCalendar
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                      highlightedDays={highlightedDayIndices}
                    />
                  </div>
                </div>

                {/* Right: Quick slots (2 cols) */}
                <div className="col-span-2 flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Zap className="w-3 h-3 text-amber-400" />
                      Upcoming Sessions
                    </p>
                    <div className="space-y-2">
                      {upcomingSlots.map((slot, i) => {
                        const isSel = selectedDate && formatDateISO(selectedDate) === formatDateISO(slot.date);
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedDate(slot.date)}
                            className={`
                              w-full text-left px-4 py-3 rounded-xl border transition-all duration-150
                              ${isSel
                                ? 'border-[#E53935]/50 bg-[#E53935]/10 shadow-md shadow-red-500/15'
                                : 'border-white/8 bg-white/4 hover:border-white/15 hover:bg-white/7'}
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm font-bold ${isSel ? 'text-white' : 'text-slate-300'}`}>
                                  {formatDateShort(slot.date)}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {slot.dayOfWeek}
                                  {slot.classRow?.startTime && ` · ${formatTime(slot.classRow.startTime)}`}
                                  {slot.classRow?.endTime && ` – ${formatTime(slot.classRow.endTime)}`}
                                </p>
                              </div>
                              {isSel ? (
                                <div className="w-6 h-6 rounded-full bg-[#E53935] flex items-center justify-center flex-shrink-0">
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </div>
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-700 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Notes</p>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Add notes for this appointment..."
                      rows={3}
                      className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#E53935]/40 resize-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: CONFIRM ════════════════════════════════════════ */}
          {step === 'confirm' && selectedClass && selectedDate && (
            <div className="px-8 pb-8 pt-2">
              <div className="max-w-2xl mx-auto">

                {/* Hero confirmation card */}
                <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/10"
                  style={{ background: 'linear-gradient(135deg, rgba(229,57,53,0.08) 0%, rgba(13,15,26,0.95) 50%, rgba(229,57,53,0.04) 100%)' }}>
                  {/* Decorative orb */}
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #E53935 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                  <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #E53935 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

                  <div className="relative p-8">
                    {/* Class header */}
                    <div className="flex items-center gap-5 mb-8">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br ${selectedTheme.gradient} border border-white/10 shadow-xl`}>
                        {getProgramIcon(selectedClass.program, selectedClass.name)}
                      </div>
                      <div>
                        <p className="text-xs text-[#E53935] font-bold uppercase tracking-widest mb-1">Appointment Summary</p>
                        <h3 className="text-white font-black text-2xl">{selectedClass.name}</h3>
                        {selectedClass.instructor && (
                          <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            {selectedClass.instructor}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Detail rows */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {/* Lead */}
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/8">
                        <div className="w-9 h-9 rounded-xl bg-[#E53935]/15 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-[#E53935]" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Lead</p>
                          <p className="text-white font-bold text-sm mt-0.5">{fullName}</p>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/8">
                        <div className="w-9 h-9 rounded-xl bg-[#E53935]/15 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-[#E53935]" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Date</p>
                          <p className="text-white font-bold text-sm mt-0.5">
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Time */}
                      {selectedClass.startTime && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/8">
                          <div className="w-9 h-9 rounded-xl bg-[#E53935]/15 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-[#E53935]" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Time</p>
                            <p className="text-white font-bold text-sm mt-0.5">
                              {formatTime(selectedClass.startTime)}
                              {selectedClass.endTime && ` – ${formatTime(selectedClass.endTime)}`}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Capacity */}
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/8">
                        <div className="w-9 h-9 rounded-xl bg-[#E53935]/15 flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-[#E53935]" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Capacity</p>
                          <p className="text-white font-bold text-sm mt-0.5">
                            {selectedClass.enrolled}/{selectedClass.capacity} enrolled
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Booked By — full width, prominent */}
                    <div className="mb-4" ref={bookedByRef}>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                        Booked By (Staff Credit)
                      </p>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setBookedByDropdownOpen(o => !o)}
                          className={`
                            w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left
                            ${selectedBookedBy
                              ? 'border-amber-500/40 bg-amber-500/8 hover:bg-amber-500/12'
                              : 'border-white/10 bg-white/5 hover:border-white/18 hover:bg-white/8'}
                          `}
                        >
                          {selectedBookedBy ? (
                            <>
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-lg shadow-amber-500/30">
                                {selectedBookedBy.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-bold">{selectedBookedBy.name}</p>
                                <p className="text-amber-400/70 text-xs capitalize">{selectedBookedBy.role}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center flex-shrink-0 border border-dashed border-white/20">
                                <UserCheck className="w-5 h-5 text-slate-500" />
                              </div>
                              <div className="flex-1">
                                <p className="text-slate-400 font-medium">Select staff member</p>
                                <p className="text-slate-600 text-xs">Who booked this appointment?</p>
                              </div>
                            </>
                          )}
                          <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform flex-shrink-0 ${bookedByDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown */}
                        {bookedByDropdownOpen && (
                          <div className="absolute z-50 left-0 right-0 mt-2 rounded-2xl border border-white/12 shadow-2xl overflow-hidden"
                            style={{ background: 'linear-gradient(160deg, #131520 0%, #0d0f1a 100%)', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)' }}>
                            {staffMembers.length === 0 ? (
                              <div className="px-4 py-6 text-sm text-slate-500 text-center">
                                <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                No staff members found
                              </div>
                            ) : (
                              <div className="max-h-52 overflow-y-auto p-2">
                                {staffMembers.map((staff: any) => (
                                  <button
                                    key={staff.id}
                                    type="button"
                                    onClick={() => { setSelectedBookedBy(staff); setBookedByDropdownOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:bg-white/8 ${
                                      selectedBookedBy?.id === staff.id ? 'bg-amber-500/10 border border-amber-500/20' : ''
                                    }`}
                                  >
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                                      {staff.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-sm font-bold truncate">{staff.name}</p>
                                      <p className="text-slate-500 text-xs capitalize">{staff.role}</p>
                                    </div>
                                    {selectedBookedBy?.id === staff.id && (
                                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-white" />
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes preview */}
                    {notes && (
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/8 mb-4">
                        <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Notes</p>
                          <p className="text-slate-300 text-sm">{notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Status update notice */}
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/20">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-emerald-300 text-sm">
                        Lead status will automatically advance to <strong className="text-emerald-200">Intro Scheduled</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-white/8"
          style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.3) 0%, transparent 100%)' }}>
          <button
            onClick={() => {
              if (step === 'datetime') setStep('class');
              else if (step === 'confirm') setStep('datetime');
              else handleClose();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all text-sm font-semibold border border-transparent hover:border-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 'class' ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-3">
            {/* Step indicator dots on mobile */}
            <div className="flex gap-1.5 md:hidden">
              {[0,1,2].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${
                  i === currentStepIdx ? 'w-6 bg-[#E53935]' : i < currentStepIdx ? 'w-3 bg-emerald-500' : 'w-3 bg-white/15'
                }`} />
              ))}
            </div>

            {step === 'class' && (
              <button
                disabled={!selectedClass}
                onClick={() => setStep('datetime')}
                className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#E53935] hover:bg-[#C62828] text-white font-bold text-sm shadow-lg shadow-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Pick a Date
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {step === 'datetime' && (
              <button
                disabled={!selectedDate}
                onClick={() => setStep('confirm')}
                className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#E53935] hover:bg-[#C62828] text-white font-bold text-sm shadow-lg shadow-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Review & Confirm
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {step === 'confirm' && (
              <button
                disabled={scheduleAppointment.isPending}
                onClick={handleConfirm}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#E53935] to-[#C62828] hover:from-[#C62828] hover:to-[#B71C1C] text-white font-black text-sm shadow-xl shadow-red-500/40 disabled:opacity-60 transition-all"
                style={{ boxShadow: '0 4px 20px rgba(229,57,53,0.4), 0 0 0 1px rgba(229,57,53,0.3)' }}
              >
                {scheduleAppointment.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Appointment
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
