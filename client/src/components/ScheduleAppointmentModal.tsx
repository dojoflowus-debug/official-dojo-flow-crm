import { useState, useMemo, useRef, useEffect } from 'react';
import {
  X, Calendar, Clock, ChevronLeft, ChevronRight, Check,
  Search, User, BookOpen, Zap,
  ChevronDown, UserCheck,
  ArrowRight, CheckCircle2
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';

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

// Class color accent dots (used for capacity bar + top stripe)
const CLASS_ACCENT: Record<string, string> = {
  'Kickboxing':          '#f97316',
  'After School':        '#0ea5e9',
  'Dragon Kids':         '#8b5cf6',
  'Dragon Kids & Teens': '#d946ef',
  'Little Ninjas':       '#10b981',
  'Little Ninjas & Me':  '#14b8a6',
  'Summer Camp':         '#eab308',
  'Teens & Adults':      '#f43f5e',
  'Teens':               '#6366f1',
  'default':             '#64748b',
};

const PROGRAM_ICONS: Record<string, string> = {
  'Kids Karate': '🥋', 'Kickboxing': '🥊', 'After School': '🏫',
  'Little Ninjas': '🥷', 'Dragon Kids': '🐉', 'BJJ': '🤼',
  'Jiu Jitsu': '🤼', 'Summer Camp': '⛺', 'Teens': '🎯',
  'default': '🏋️',
};

function getAccent(name?: string | null): string {
  if (!name) return CLASS_ACCENT.default;
  const key = Object.keys(CLASS_ACCENT).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return key ? CLASS_ACCENT[key] : CLASS_ACCENT.default;
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

// ── Theme-aware style tokens ──────────────────────────────────────────────────
function useModalTheme(isDark: boolean) {
  return {
    // Overlay
    overlay: isDark ? 'bg-black/75 backdrop-blur-md' : 'bg-black/50 backdrop-blur-sm',
    // Modal shell
    modalBg: isDark
      ? 'linear-gradient(160deg, #0d0f1a 0%, #111320 60%, #0a0c14 100%)'
      : 'linear-gradient(160deg, #ffffff 0%, #f8fafc 60%, #f1f5f9 100%)',
    modalBorder: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    // Header
    headerBg: isDark ? 'rgba(229,57,53,0.05)' : 'rgba(229,57,53,0.03)',
    // Text
    titleText: isDark ? 'text-white' : 'text-gray-900',
    subText: isDark ? 'text-slate-400' : 'text-gray-500',
    mutedText: isDark ? 'text-slate-500' : 'text-gray-400',
    labelText: isDark ? 'text-slate-500' : 'text-gray-400',
    // Input / card backgrounds
    inputBg: isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#E53935]/40' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#E53935]/50',
    cardBg: isDark ? 'bg-white/4 border-white/8' : 'bg-white border-gray-200',
    cardHover: isDark ? 'hover:border-white/20 hover:bg-white/6' : 'hover:border-gray-300 hover:bg-gray-50',
    cardSelected: isDark ? 'border-[#E53935]/60' : 'border-[#E53935]/70 bg-red-50',
    // Day pill
    dayPill: isDark ? 'bg-white/8 text-slate-400' : 'bg-gray-100 text-gray-500',
    // Scrollbar
    scrollbar: isDark ? 'rgba(255,255,255,0.1) transparent' : 'rgba(0,0,0,0.1) transparent',
    // Footer
    footerBg: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
    footerBorder: isDark ? 'border-white/8' : 'border-gray-200',
    // Back button
    backBtn: isDark ? 'text-slate-400 hover:text-white hover:bg-white/8 hover:border-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 hover:border-gray-200',
    // Step indicator
    stepDone: isDark ? 'text-emerald-400' : 'text-emerald-600',
    stepInactive: isDark ? 'text-slate-600' : 'text-gray-400',
    stepConnector: isDark ? 'bg-white/10' : 'bg-gray-200',
    stepConnectorDone: isDark ? 'bg-emerald-500/50' : 'bg-emerald-400/60',
    // Calendar
    calMonthText: isDark ? 'text-white' : 'text-gray-800',
    calNavBtn: isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
    calDayHeader: isDark ? 'text-slate-500' : 'text-gray-400',
    calDayDisabled: isDark ? 'text-slate-700' : 'text-gray-300',
    calDayAvail: isDark ? 'text-white' : 'text-gray-800',
    calLegend: isDark ? 'text-slate-500' : 'text-gray-400',
    // Slot button
    slotDefault: isDark ? 'border-white/8 bg-white/4 hover:border-white/15 hover:bg-white/7' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
    slotSelected: isDark ? 'border-[#E53935]/50 bg-[#E53935]/10' : 'border-[#E53935]/50 bg-red-50',
    slotText: isDark ? 'text-slate-300' : 'text-gray-700',
    slotTextSelected: isDark ? 'text-white' : 'text-gray-900',
    slotSub: isDark ? 'text-slate-500' : 'text-gray-400',
    slotChevron: isDark ? 'text-slate-700' : 'text-gray-300',
    // Textarea
    textareaBg: isDark ? 'bg-white/4 border-white/8 text-white placeholder:text-slate-600 focus:border-[#E53935]/40' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#E53935]/50',
    // Confirm card
    confirmCardBg: isDark
      ? 'linear-gradient(135deg, rgba(229,57,53,0.08) 0%, rgba(13,15,26,0.95) 50%, rgba(229,57,53,0.04) 100%)'
      : 'linear-gradient(135deg, rgba(229,57,53,0.04) 0%, #ffffff 50%, rgba(229,57,53,0.02) 100%)',
    confirmCardBorder: isDark ? 'border-white/10' : 'border-gray-200',
    confirmRowBg: isDark ? 'bg-white/5 border-white/8' : 'bg-gray-50 border-gray-200',
    confirmRowLabel: isDark ? 'text-slate-500' : 'text-gray-400',
    confirmRowValue: isDark ? 'text-white' : 'text-gray-900',
    // Booked by
    bookedByBtn: isDark ? 'border-white/10 bg-white/5 hover:border-white/18 hover:bg-white/8' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
    bookedByBtnSel: isDark ? 'border-amber-500/40 bg-amber-500/8 hover:bg-amber-500/12' : 'border-amber-400/50 bg-amber-50 hover:bg-amber-100/60',
    bookedByDropBg: isDark
      ? 'linear-gradient(160deg, #131520 0%, #0d0f1a 100%)'
      : '#ffffff',
    bookedByDropBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
    bookedByItemHover: isDark ? 'hover:bg-white/8' : 'hover:bg-gray-50',
    bookedByItemSel: isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200',
    bookedByName: isDark ? 'text-white' : 'text-gray-900',
    bookedByRole: isDark ? 'text-amber-400/70' : 'text-amber-600',
    bookedByPlaceholder: isDark ? 'text-slate-400' : 'text-gray-500',
    bookedByPlaceholderSub: isDark ? 'text-slate-600' : 'text-gray-400',
    bookedByIcon: isDark ? 'bg-white/8 border-dashed border-white/20' : 'bg-gray-100 border-dashed border-gray-300',
    bookedByIconColor: isDark ? 'text-slate-500' : 'text-gray-400',
    bookedByChevron: isDark ? 'text-slate-500' : 'text-gray-400',
    // Status notice
    statusBg: isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200',
    statusIcon: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100',
    statusIconColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
    statusText: isDark ? 'text-emerald-300' : 'text-emerald-700',
    statusBold: isDark ? 'text-emerald-200' : 'text-emerald-800',
    // Close button
    closeBtn: isDark ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
    // Search icon
    searchIcon: isDark ? 'text-slate-500' : 'text-gray-400',
    // Day filter container
    dayFilterBg: isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200',
    dayFilterBtn: isDark ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
    // Class banner (step 2)
    bannerBg: isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200',
    bannerIcon: isDark ? 'bg-white/10' : 'bg-white border border-gray-200',
    bannerTitle: isDark ? 'text-white' : 'text-gray-900',
    bannerSub: isDark ? 'text-slate-400' : 'text-gray-500',
    bannerChangeBtn: isDark ? 'text-slate-500 hover:text-white border-white/10 hover:border-white/20' : 'text-gray-400 hover:text-gray-700 border-gray-200 hover:border-gray-300',
    // Calendar container
    calContainerBg: isDark ? 'bg-white/4 border-white/8' : 'bg-white border-gray-200',
    // Capacity label
    capacityLabel: isDark ? 'text-slate-600' : 'text-gray-400',
    capacityBarBg: isDark ? 'bg-white/8' : 'bg-gray-200',
    // Top accent line
    topAccent: isDark ? 'via-[#E53935]/60' : 'via-[#E53935]/40',
  };
}

// ── Compact Calendar ──────────────────────────────────────────────────────────
function CompactCalendar({
  selectedDate,
  onSelectDate,
  highlightedDays,
  isDark,
}: {
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  highlightedDays: number[];
  isDark: boolean;
}) {
  const t = useModalTheme(isDark);
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
    const t2 = new Date(); t2.setHours(0,0,0,0);
    return d < t2;
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
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${t.calNavBtn}`}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className={`font-bold text-sm tracking-wide ${t.calMonthText}`}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${t.calNavBtn}`}>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className={`text-center text-xs font-semibold uppercase tracking-wider py-0.5 ${t.calDayHeader}`}>{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-8" />;
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
                  relative w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-150
                  ${sel
                    ? 'bg-[#E53935] text-white shadow-md shadow-red-500/30 scale-110 ring-2 ring-[#E53935]/30'
                    : hi && !past
                      ? tod
                        ? `${t.calDayAvail} ring-1 ring-[#E53935]/50 ${isDark ? 'bg-white/10' : 'bg-red-50'} hover:bg-[#E53935]/20 cursor-pointer`
                        : `${t.calDayAvail} ${isDark ? 'hover:bg-white/12' : 'hover:bg-gray-100'} cursor-pointer`
                      : `${t.calDayDisabled} cursor-not-allowed`}
                `}
              >
                {day}
                {hi && !past && !sel && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#E53935]" />
                )}
              </button>
            </div>
          );
        })}
      </div>
      <div className={`mt-3 flex items-center gap-1.5 text-xs ${t.calLegend}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#E53935] inline-block" />
        Class days available
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
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'cinematic';
  const t = useModalTheme(isDark);

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
  const accent = selectedClass ? getAccent(selectedClass.name) : '#E53935';

  return (
    <div
      className="fixed inset-0 flex items-start justify-center"
      style={{ zIndex: 1000, padding: '12px 12px calc(72px + 12px) 12px', paddingTop: '12px' }}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 ${t.overlay}`} onClick={handleClose} />

      {/* Modal shell */}
      <div
        className="relative w-full max-w-4xl flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: t.modalBg,
          boxShadow: `0 0 0 1px ${t.modalBorder}, 0 32px 64px rgba(0,0,0,0.35)`,
          maxHeight: 'calc(100vh - 96px)',
        }}
      >
        {/* Top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${t.topAccent} to-transparent`} />

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div
          className="relative flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: t.headerBg }}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E53935] to-[#FF6B6B] flex items-center justify-center text-white text-sm font-black shadow-md shadow-red-500/25">
                {initials}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 ${isDark ? 'border-[#0d0f1a]' : 'border-white'}`} />
            </div>
            <div>
              <p className="text-[10px] text-[#E53935] font-bold uppercase tracking-widest leading-none mb-0.5">Scheduling Intro Class</p>
              <h2 className={`font-black text-base leading-tight ${t.titleText}`}>{fullName}</h2>
              {lead.phone && <p className={`text-xs mt-0.5 ${t.mutedText}`}>{lead.phone}</p>}
            </div>
          </div>

          {/* Step indicator */}
          <div className={`hidden md:flex items-center gap-1 rounded-xl px-3 py-1.5 border ${isDark ? 'bg-white/5 border-white/8' : 'bg-gray-50 border-gray-200'}`}>
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
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    active ? 'bg-[#E53935] text-white shadow-sm shadow-red-500/25'
                    : done ? t.stepDone : t.stepInactive
                  }`}>
                    {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                    {s.label}
                  </div>
                  {i < 2 && <div className={`w-3 h-px mx-0.5 ${done ? t.stepConnectorDone : t.stepConnector}`} />}
                </div>
              );
            })}
          </div>

          <button onClick={handleClose}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${t.closeBtn}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── BODY ───────────────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: t.scrollbar }}
        >

          {/* ═══ STEP 1: SELECT CLASS ═══════════════════════════════════ */}
          {step === 'class' && (
            <div className="px-6 pb-6 pt-3">
              {/* Search + Day Filter */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${t.searchIcon}`} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search classes or instructors..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none transition-all ${t.inputBg}`}
                  />
                </div>
                <div className={`flex gap-1 items-center rounded-xl px-2 border ${t.dayFilterBg}`}>
                  {DAYS_OF_WEEK.slice(0, 6).map((day, i) => (
                    <button
                      key={day}
                      onClick={() => setFilterDay(filterDay === day ? null : day)}
                      className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                        filterDay === day
                          ? 'bg-[#E53935] text-white shadow-sm shadow-red-500/25'
                          : t.dayFilterBtn
                      }`}
                    >
                      {DAY_ABBREV[i]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Grid */}
              {classesLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`h-28 rounded-xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
                  ))}
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="text-center py-12">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <BookOpen className={`w-6 h-6 ${t.mutedText}`} />
                  </div>
                  <p className={`font-medium ${t.subText}`}>No classes found</p>
                  <p className={`text-sm mt-1 ${t.mutedText}`}>Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredClasses.map(cls => {
                    const days = classes.filter(c => c.name === cls.name && c.instructor === cls.instructor).map(c => c.dayOfWeek);
                    const icon = getProgramIcon(cls.program, cls.name);
                    const spotsLeft = cls.capacity - cls.enrolled;
                    const isSelected = selectedClass?.id === cls.id;
                    const clsAccent = getAccent(cls.name);
                    const fillPct = Math.min(100, (cls.enrolled / cls.capacity) * 100);
                    const isFull = spotsLeft <= 0;
                    const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0;

                    return (
                      <button
                        key={`${cls.name}-${cls.instructor}`}
                        onClick={() => setSelectedClass(cls)}
                        className={`
                          relative text-left rounded-xl border transition-all duration-150 overflow-hidden
                          ${isSelected ? t.cardSelected : `${t.cardBg} ${t.cardHover}`}
                        `}
                        style={isSelected ? {
                          boxShadow: `0 0 0 1.5px ${clsAccent}50, 0 4px 16px ${clsAccent}20`,
                        } : undefined}
                      >
                        {/* Selected check */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#E53935] flex items-center justify-center shadow-md shadow-red-500/30 z-10">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}

                        {/* Top accent stripe */}
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: isSelected ? `linear-gradient(90deg, ${clsAccent}, transparent)` : `linear-gradient(90deg, ${clsAccent}60, transparent)` }} />

                        <div className="p-3.5">
                          {/* Icon + name */}
                          <div className="flex items-start gap-2.5 mb-2.5">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                              style={{ background: `${clsAccent}18` }}>
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <h3 className={`font-bold text-xs leading-tight ${t.titleText}`}>{cls.name}</h3>
                              {cls.instructor && (
                                <p className={`text-xs mt-0.5 truncate flex items-center gap-1 ${t.mutedText}`}>
                                  <User className="w-2.5 h-2.5 flex-shrink-0" />
                                  {cls.instructor}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Day pills */}
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {days.slice(0, 4).map(d => (
                              <span key={d} className={`text-xs px-1.5 py-0.5 rounded font-medium ${t.dayPill}`}>
                                {d.slice(0, 3)}
                              </span>
                            ))}
                            {days.length > 4 && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${t.dayPill}`}>+{days.length - 4}</span>
                            )}
                          </div>

                          {/* Capacity bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${t.capacityLabel}`}>Capacity</span>
                              <span className={`text-xs font-bold ${
                                isFull ? 'text-red-500' : isAlmostFull ? 'text-amber-500' : 'text-emerald-500'
                              }`}>
                                {isFull ? 'Full' : isAlmostFull ? `${spotsLeft} left!` : `${spotsLeft} spots`}
                              </span>
                            </div>
                            <div className={`h-1 rounded-full overflow-hidden ${t.capacityBarBg}`}>
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
            <div className="px-6 pb-6 pt-3">
              {/* Selected class banner */}
              <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 border ${t.bannerBg}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${t.bannerIcon}`}>
                  {getProgramIcon(selectedClass.program, selectedClass.name)}
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${t.bannerTitle}`}>{selectedClass.name}</p>
                  {selectedClass.instructor && <p className={`text-xs ${t.bannerSub}`}>{selectedClass.instructor}</p>}
                </div>
                <button onClick={() => setStep('class')}
                  className={`text-xs border px-2.5 py-1 rounded-lg transition-all ${t.bannerChangeBtn}`}>
                  Change
                </button>
              </div>

              <div className="grid grid-cols-5 gap-4">
                {/* Left: Calendar (3 cols) */}
                <div className="col-span-3">
                  <div className={`rounded-xl p-4 border ${t.calContainerBg}`}>
                    <CompactCalendar
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                      highlightedDays={highlightedDayIndices}
                      isDark={isDark}
                    />
                  </div>
                </div>

                {/* Right: Quick slots + Notes (2 cols) */}
                <div className="col-span-2 flex flex-col gap-3">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${t.labelText}`}>
                      <Zap className="w-3 h-3 text-amber-500" />
                      Upcoming Sessions
                    </p>
                    <div className="space-y-1.5">
                      {upcomingSlots.map((slot, i) => {
                        const isSel = selectedDate && formatDateISO(selectedDate) === formatDateISO(slot.date);
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedDate(slot.date)}
                            className={`
                              w-full text-left px-3 py-2 rounded-xl border transition-all duration-150
                              ${isSel ? t.slotSelected : t.slotDefault}
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-xs font-bold ${isSel ? t.slotTextSelected : t.slotText}`}>
                                  {formatDateShort(slot.date)}
                                </p>
                                <p className={`text-xs mt-0.5 ${t.slotSub}`}>
                                  {slot.dayOfWeek}
                                  {slot.classRow?.startTime && ` · ${formatTime(slot.classRow.startTime)}`}
                                </p>
                              </div>
                              {isSel ? (
                                <div className="w-5 h-5 rounded-full bg-[#E53935] flex items-center justify-center flex-shrink-0">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              ) : (
                                <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${t.slotChevron}`} />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${t.labelText}`}>Notes</p>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Add notes for this appointment..."
                      rows={3}
                      className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none resize-none transition-all ${t.textareaBg}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: CONFIRM ════════════════════════════════════════ */}
          {step === 'confirm' && selectedClass && selectedDate && (
            <div className="px-6 pb-6 pt-3">
              <div className="max-w-xl mx-auto">

                {/* Summary card */}
                <div
                  className={`relative rounded-2xl overflow-hidden mb-4 border ${t.confirmCardBorder}`}
                  style={{ background: t.confirmCardBg }}
                >
                  <div className="p-5">
                    {/* Class header */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border"
                        style={{ background: `${accent}18`, borderColor: `${accent}30` }}>
                        {getProgramIcon(selectedClass.program, selectedClass.name)}
                      </div>
                      <div>
                        <p className="text-xs text-[#E53935] font-bold uppercase tracking-widest mb-0.5">Appointment Summary</p>
                        <h3 className={`font-black text-lg ${t.titleText}`}>{selectedClass.name}</h3>
                        {selectedClass.instructor && (
                          <p className={`text-xs mt-0.5 flex items-center gap-1 ${t.subText}`}>
                            <User className="w-3 h-3" />
                            {selectedClass.instructor}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Detail rows */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {/* Lead */}
                      <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${t.confirmRowBg}`}>
                        <div className="w-7 h-7 rounded-lg bg-[#E53935]/15 flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-[#E53935]" />
                        </div>
                        <div>
                          <p className={`text-xs font-medium uppercase tracking-wide ${t.confirmRowLabel}`}>Lead</p>
                          <p className={`font-bold text-xs mt-0.5 ${t.confirmRowValue}`}>{fullName}</p>
                        </div>
                      </div>

                      {/* Date */}
                      <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${t.confirmRowBg}`}>
                        <div className="w-7 h-7 rounded-lg bg-[#E53935]/15 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-[#E53935]" />
                        </div>
                        <div>
                          <p className={`text-xs font-medium uppercase tracking-wide ${t.confirmRowLabel}`}>Date</p>
                          <p className={`font-bold text-xs mt-0.5 ${t.confirmRowValue}`}>
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Time */}
                      {selectedClass.startTime && (
                        <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${t.confirmRowBg}`}>
                          <div className="w-7 h-7 rounded-lg bg-[#E53935]/15 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-3.5 h-3.5 text-[#E53935]" />
                          </div>
                          <div>
                            <p className={`text-xs font-medium uppercase tracking-wide ${t.confirmRowLabel}`}>Time</p>
                            <p className={`font-bold text-xs mt-0.5 ${t.confirmRowValue}`}>{formatTime(selectedClass.startTime)}</p>
                          </div>
                        </div>
                      )}

                      {/* Capacity */}
                      <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${t.confirmRowBg}`}>
                        <div className="w-7 h-7 rounded-lg bg-[#E53935]/15 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#E53935]" />
                        </div>
                        <div>
                          <p className={`text-xs font-medium uppercase tracking-wide ${t.confirmRowLabel}`}>Capacity</p>
                          <p className={`font-bold text-xs mt-0.5 ${t.confirmRowValue}`}>{selectedClass.enrolled}/{selectedClass.capacity} enrolled</p>
                        </div>
                      </div>
                    </div>

                    {/* Booked by dropdown */}
                    <div className="mb-4">
                      <p className={`text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${t.labelText}`}>
                        <UserCheck className="w-3 h-3" />
                        Booked by (Staff Credit)
                      </p>
                      <div className="relative" ref={bookedByRef}>
                        <button
                          type="button"
                          onClick={() => setBookedByDropdownOpen(o => !o)}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                            ${selectedBookedBy ? t.bookedByBtnSel : t.bookedByBtn}
                          `}
                        >
                          {selectedBookedBy ? (
                            <>
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm shadow-amber-500/25">
                                {selectedBookedBy.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <p className={`font-bold text-sm ${t.bookedByName}`}>{selectedBookedBy.name}</p>
                                <p className={`text-xs capitalize ${t.bookedByRole}`}>{selectedBookedBy.role}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${t.bookedByIcon}`}>
                                <UserCheck className={`w-4 h-4 ${t.bookedByIconColor}`} />
                              </div>
                              <div className="flex-1">
                                <p className={`font-medium text-sm ${t.bookedByPlaceholder}`}>Select staff member</p>
                                <p className={`text-xs ${t.bookedByPlaceholderSub}`}>Who booked this appointment?</p>
                              </div>
                            </>
                          )}
                          <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${bookedByDropdownOpen ? 'rotate-180' : ''} ${t.bookedByChevron}`} />
                        </button>

                        {/* Dropdown */}
                        {bookedByDropdownOpen && (
                          <div
                            className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl overflow-hidden shadow-xl"
                            style={{
                              background: t.bookedByDropBg,
                              boxShadow: `0 12px 40px rgba(0,0,0,0.2), 0 0 0 1px ${t.bookedByDropBorder}`,
                            }}
                          >
                            {staffMembers.length === 0 ? (
                              <div className={`px-4 py-5 text-sm text-center ${t.mutedText}`}>
                                <UserCheck className="w-7 h-7 mx-auto mb-2 opacity-30" />
                                No staff members found
                              </div>
                            ) : (
                              <div className="max-h-48 overflow-y-auto p-1.5">
                                {staffMembers.map((staff: any) => (
                                  <button
                                    key={staff.id}
                                    type="button"
                                    onClick={() => { setSelectedBookedBy(staff); setBookedByDropdownOpen(false); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                                      selectedBookedBy?.id === staff.id ? t.bookedByItemSel : t.bookedByItemHover
                                    }`}
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                                      {staff.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-bold truncate ${t.bookedByName}`}>{staff.name}</p>
                                      <p className={`text-xs capitalize ${t.subText}`}>{staff.role}</p>
                                    </div>
                                    {selectedBookedBy?.id === staff.id && (
                                      <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-2.5 h-2.5 text-white" />
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
                      <div className={`flex items-start gap-2.5 p-3 rounded-xl border mb-3 ${t.confirmRowBg}`}>
                        <BookOpen className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${t.subText}`} />
                        <div>
                          <p className={`text-xs font-medium uppercase tracking-wide mb-0.5 ${t.confirmRowLabel}`}>Notes</p>
                          <p className={`text-xs ${t.subText}`}>{notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Status notice */}
                    <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${t.statusBg}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${t.statusIcon}`}>
                        <Zap className={`w-3.5 h-3.5 ${t.statusIconColor}`} />
                      </div>
                      <p className={`text-xs ${t.statusText}`}>
                        Lead status will advance to <strong className={t.statusBold}>Intro Scheduled</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-t flex-shrink-0 ${t.footerBorder}`}
          style={{ background: t.footerBg }}
        >
          <button
            onClick={() => {
              if (step === 'datetime') setStep('class');
              else if (step === 'confirm') setStep('datetime');
              else handleClose();
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-transparent transition-all ${t.backBtn}`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {step === 'class' ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-2">
            {/* Mobile step dots */}
            <div className="flex gap-1 md:hidden">
              {[0,1,2].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${
                  i === currentStepIdx ? 'w-5 bg-[#E53935]' : i < currentStepIdx ? 'w-2.5 bg-emerald-500' : `w-2.5 ${isDark ? 'bg-white/15' : 'bg-gray-200'}`
                }`} />
              ))}
            </div>

            {step === 'class' && (
              <button
                disabled={!selectedClass}
                onClick={() => setStep('datetime')}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#E53935] hover:bg-[#C62828] text-white font-bold text-sm shadow-md shadow-red-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Pick a Date
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 'datetime' && (
              <button
                disabled={!selectedDate}
                onClick={() => setStep('confirm')}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#E53935] hover:bg-[#C62828] text-white font-bold text-sm shadow-md shadow-red-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Review & Confirm
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 'confirm' && (
              <button
                disabled={scheduleAppointment.isPending}
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E53935] to-[#C62828] hover:from-[#C62828] hover:to-[#B71C1C] text-white font-black text-sm shadow-lg shadow-red-500/30 disabled:opacity-60 transition-all"
              >
                {scheduleAppointment.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
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
