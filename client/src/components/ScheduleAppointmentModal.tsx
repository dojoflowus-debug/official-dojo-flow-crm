import { useState, useMemo } from 'react';
import {
  X, ChevronLeft, ChevronRight, Check, MapPin,
  Clock, Calendar, User, ChevronDown, Phone,
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

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const DAY_HEADERS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const DAYS_OF_WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Map class name → description + icon
const CLASS_META: Record<string, { desc: string; icon: string; duration?: string }> = {
  'Kickboxing':          { desc: 'High-energy cardio kickboxing for all levels.', icon: '🥊', duration: '60 min' },
  'After School':        { desc: 'Fun martial arts program for school-age kids.', icon: '🏫', duration: '45 min' },
  'Dragon Kids':         { desc: 'Foundational martial arts for young children.', icon: '🐉', duration: '45 min' },
  'Dragon Kids & Teens': { desc: 'Combined class for kids and teens.', icon: '🐉', duration: '45 min' },
  'Little Ninjas':       { desc: 'Intro martial arts for ages 3–5.', icon: '🥷', duration: '30 min' },
  'Little Ninjas & Me':  { desc: 'Parent & child martial arts class.', icon: '🥷', duration: '30 min' },
  'Summer Camp':         { desc: 'Week-long martial arts summer camp.', icon: '⛺', duration: 'Full day' },
  'Teens & Adults':      { desc: 'Martial arts training for teens and adults.', icon: '🎯', duration: '60 min' },
  'Teens':               { desc: 'Teen-focused martial arts program.', icon: '🎯', duration: '60 min' },
  "Women's Self-Defense":{ desc: 'Practical self-defense skills for women.', icon: '💪', duration: '60 min' },
  'default':             { desc: 'Martial arts training class.', icon: '🥋', duration: '60 min' },
};

function getClassMeta(name?: string | null) {
  if (!name) return CLASS_META.default;
  const key = Object.keys(CLASS_META).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return key ? CLASS_META[key] : CLASS_META.default;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(t?: string | null): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ── Inline Calendar ───────────────────────────────────────────────────────────
function InlineCalendar({
  selectedDate,
  onSelectDate,
  availableDayIndices, // 0=Sun..6=Sat
  isDark,
}: {
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  availableDayIndices: number[];
  isDark: boolean;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const bg = isDark ? '#1a1d2e' : '#ffffff';
  const headerColor = isDark ? '#ffffff' : '#111827';
  const navColor = isDark ? '#6b7280' : '#9ca3af';
  const dayHeaderColor = isDark ? '#6b7280' : '#9ca3af';
  const disabledColor = isDark ? '#374151' : '#d1d5db';
  const availColor = isDark ? '#f9fafb' : '#111827';
  const todayRing = '#E53935';
  const selectedBg = '#E53935';
  const availDotColor = '#E53935';

  return (
    <div style={{ background: bg }}>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-black/5 transition-colors" style={{ color: navColor }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-base" style={{ color: headerColor }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-black/5 transition-colors" style={{ color: navColor }}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: dayHeaderColor }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const cellDate = new Date(viewYear, viewMonth, day);
          const dayOfWeek = cellDate.getDay();
          const isAvail = availableDayIndices.includes(dayOfWeek);
          const isPast = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isToday = cellDate.toDateString() === today.toDateString();
          const isSel = selectedDate?.toDateString() === cellDate.toDateString();
          const disabled = !isAvail || isPast;

          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => onSelectDate(cellDate)}
              className="relative flex flex-col items-center justify-center h-9 w-full rounded-full transition-all text-sm font-medium"
              style={{
                background: isSel ? selectedBg : 'transparent',
                color: isSel ? '#ffffff' : disabled ? disabledColor : availColor,
                outline: isToday && !isSel ? `2px solid ${todayRing}` : 'none',
                outlineOffset: '-2px',
                cursor: disabled ? 'default' : 'pointer',
              }}
            >
              {day}
              {/* Availability dot */}
              {isAvail && !isPast && !isSel && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: availDotColor }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ScheduleAppointmentModal({
  lead,
  isOpen,
  onClose,
  onScheduled,
}: ScheduleAppointmentModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'cinematic';
  const { toast } = useToast();

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [bookedByStaffId, setBookedByStaffId] = useState<number | null>(null);
  const [bookedByName, setBookedByName] = useState<string>('');
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: classesRaw = [], isLoading: classesLoading } = trpc.getClasses.useQuery(undefined, { enabled: isOpen });
  const { data: staffList = [] } = trpc.getStaff.useQuery(undefined, { enabled: isOpen });
  const scheduleMutation = trpc.scheduleAppointment.useMutation();

  // Deduplicate classes by name+instructor
  const classes = useMemo(() => {
    const seen = new Set<string>();
    return (classesRaw as any[]).filter(c => {
      const key = `${c.name}|${c.instructor}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [classesRaw]);

  // All day indices for selected class
  const availableDayIndices = useMemo(() => {
    if (!selectedClass) return [];
    const allRows = (classesRaw as any[]).filter(c => c.name === selectedClass.name && c.instructor === selectedClass.instructor);
    return allRows.map((c: any) => DAYS_OF_WEEK.indexOf(c.dayOfWeek)).filter(i => i >= 0);
  }, [selectedClass, classesRaw]);

  // Time slots: use class start/end or generate sensible defaults
  const timeSlots = useMemo(() => {
    if (!selectedClass || !selectedDate) return [];
    const dayName = DAYS_OF_WEEK[selectedDate.getDay()];
    const rows = (classesRaw as any[]).filter(c =>
      c.name === selectedClass.name &&
      c.instructor === selectedClass.instructor &&
      c.dayOfWeek === dayName
    );
    if (rows.length > 0 && rows[0].startTime) {
      return rows.map((r: any) => ({ time: r.startTime, label: formatTime(r.startTime) }));
    }
    // Fallback slots
    return [
      { time: '09:00', label: '9:00 AM' },
      { time: '10:00', label: '10:00 AM' },
      { time: '11:00', label: '11:00 AM' },
      { time: '16:00', label: '4:00 PM' },
      { time: '17:00', label: '5:00 PM' },
      { time: '18:00', label: '6:00 PM' },
    ];
  }, [selectedClass, selectedDate, classesRaw]);

  function handleClose() {
    setSelectedClass(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setNotes('');
    setBookedByStaffId(null);
    setBookedByName('');
    setShowStaffDropdown(false);
    onClose();
  }

  async function handleConfirm() {
    if (!lead || !selectedClass || !selectedDate) return;
    setIsSubmitting(true);
    try {
      await scheduleMutation.mutateAsync({
        leadId: lead.id,
        classId: selectedClass.id,
        scheduledDate: formatDateISO(selectedDate),
        scheduledTime: selectedTime || undefined,
        notes: notes || undefined,
        bookedByName: bookedByName || undefined,
        bookedByStaffId: bookedByStaffId || undefined,
      });
      toast({ title: 'Appointment scheduled!', description: `${selectedClass.name} on ${formatDateLong(selectedDate)}` });
      onScheduled?.();
      handleClose();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to schedule', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen || !lead) return null;

  const leadName = `${lead.first_name} ${lead.last_name}`.trim();
  const meta = getClassMeta(selectedClass?.name);
  const canConfirm = !!selectedClass && !!selectedDate;

  // ── Theme tokens ───────────────────────────────────────────────────────────
  const bg = isDark ? '#0f1117' : '#ffffff';
  const panelBg = isDark ? '#161822' : '#ffffff';
  const panelBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const titleColor = isDark ? '#f9fafb' : '#111827';
  const subtitleColor = isDark ? '#9ca3af' : '#6b7280';
  const stepActiveBg = '#E53935';
  const stepDoneBg = '#E53935';
  const stepInactiveBg = isDark ? '#374151' : '#e5e7eb';
  const stepActiveText = '#ffffff';
  const stepInactiveText = isDark ? '#6b7280' : '#9ca3af';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
  const cardHoverBg = isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb';
  const cardSelectedBg = isDark ? 'rgba(229,57,53,0.08)' : '#fff5f5';
  const cardSelectedBorder = '#E53935';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const labelColor = isDark ? '#9ca3af' : '#6b7280';
  const valueColor = isDark ? '#f9fafb' : '#111827';
  const slotBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const slotBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const slotSelBg = isDark ? 'rgba(229,57,53,0.12)' : '#fff5f5';
  const slotSelBorder = '#E53935';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const dropdownBg = isDark ? '#1e2030' : '#ffffff';
  const dropdownBorder = isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb';
  const dropdownItemHover = isDark ? 'rgba(255,255,255,0.06)' : '#f9fafb';

  const steps = [
    { label: 'Select Type', num: 1 },
    { label: 'Choose Date & Time', num: 2 },
    { label: 'Your Information', num: 3 },
    { label: 'Confirm Appointment', num: 4 },
  ];
  const currentStep = !selectedClass ? 1 : !selectedDate ? 2 : 3;

  return (
    <div
      className="fixed inset-0 flex items-start justify-center overflow-y-auto"
      style={{ zIndex: 1000, background: 'rgba(0,0,0,0.45)', padding: '24px 16px 80px' }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: bg, border: `1px solid ${panelBorder}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-6" style={{ borderBottom: `1px solid ${dividerColor}` }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: titleColor }}>Schedule an Appointment</h2>
              <p className="text-sm mt-1" style={{ color: subtitleColor }}>
                Book a time to connect with <span className="font-medium" style={{ color: titleColor }}>{leadName}</span>.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ color: labelColor, background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0">
            {steps.map((s, i) => {
              const done = s.num < currentStep;
              const active = s.num === currentStep;
              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                      style={{
                        background: done || active ? stepActiveBg : stepInactiveBg,
                        color: done || active ? stepActiveText : stepInactiveText,
                      }}
                    >
                      {done ? <Check className="w-4 h-4" /> : s.num}
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap" style={{
                      color: active ? '#E53935' : done ? (isDark ? '#9ca3af' : '#6b7280') : stepInactiveText,
                    }}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-px mx-2 mb-5" style={{ background: done ? stepDoneBg : stepInactiveBg, opacity: done ? 0.5 : 1 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3-Panel Body ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 divide-x" style={{ borderColor: panelBorder, minHeight: 480 }}>

          {/* ── LEFT: Select Class ─────────────────────────────────────── */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 560, borderRight: `1px solid ${panelBorder}` }}>
            <h3 className="text-base font-semibold mb-1" style={{ color: titleColor }}>1. Select Appointment Type</h3>
            <p className="text-sm mb-4" style={{ color: subtitleColor }}>Choose the type of appointment you'd like to schedule.</p>

            {classesLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {classes.map(cls => {
                  const m = getClassMeta(cls.name);
                  const isSelected = selectedClass?.id === cls.id;
                  return (
                    <button
                      key={`${cls.name}-${cls.instructor}`}
                      onClick={() => { setSelectedClass(cls); setSelectedDate(null); setSelectedTime(null); }}
                      className="w-full text-left rounded-xl border p-4 transition-all flex items-center gap-3"
                      style={{
                        background: isSelected ? cardSelectedBg : 'transparent',
                        borderColor: isSelected ? cardSelectedBorder : cardBorder,
                        boxShadow: isSelected ? '0 0 0 1px #E5393520' : 'none',
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = cardHoverBg; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      {/* Icon */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: isSelected ? 'rgba(229,57,53,0.12)' : (isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6') }}
                      >
                        {m.icon}
                      </div>
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: titleColor }}>{cls.name}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: subtitleColor }}>{m.desc}</p>
                      </div>
                      {/* Duration badge or check */}
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#E53935' }}>
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      ) : m.duration ? (
                        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', color: labelColor }}>
                          {m.duration}
                        </span>
                      ) : null}
                    </button>
                  );
                })}

                {/* What to Expect info box */}
                <div className="mt-4 rounded-xl p-4 flex gap-3" style={{ background: isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff', border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}` }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#3b82f6' }}>
                    <span className="text-white text-xs font-bold">i</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>What to Expect</p>
                    <p className="text-xs mt-0.5" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}>
                      We'll reach out to confirm your appointment and provide any additional details you need.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── CENTER: Calendar + Time Slots ─────────────────────────── */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 560, borderRight: `1px solid ${panelBorder}` }}>
            <h3 className="text-base font-semibold mb-1" style={{ color: titleColor }}>2. Choose Date & Time</h3>
            <p className="text-sm mb-4" style={{ color: subtitleColor }}>Select a date and time that works for you.</p>

            {!selectedClass ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }}>
                  <Calendar className="w-6 h-6" style={{ color: labelColor }} />
                </div>
                <p className="text-sm text-center" style={{ color: subtitleColor }}>Select an appointment type first to see available dates.</p>
              </div>
            ) : (
              <>
                <InlineCalendar
                  selectedDate={selectedDate}
                  onSelectDate={d => { setSelectedDate(d); setSelectedTime(null); }}
                  availableDayIndices={availableDayIndices}
                  isDark={isDark}
                />

                {selectedDate && (
                  <div className="mt-5">
                    <p className="text-sm font-medium mb-3" style={{ color: titleColor }}>
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    {timeSlots.length === 0 ? (
                      <p className="text-sm" style={{ color: subtitleColor }}>No time slots available for this day.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map(slot => {
                          const isSel = selectedTime === slot.time;
                          return (
                            <button
                              key={slot.time}
                              onClick={() => setSelectedTime(slot.time)}
                              className="py-2.5 rounded-xl text-sm font-medium border transition-all"
                              style={{
                                background: isSel ? slotSelBg : slotBg,
                                borderColor: isSel ? slotSelBorder : slotBorder,
                                color: isSel ? '#E53935' : valueColor,
                                fontWeight: isSel ? 700 : 500,
                              }}
                            >
                              {slot.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: labelColor }}>
                      <span>🌐</span> All times are in Central Time (CT)
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── RIGHT: Summary + Confirm ──────────────────────────────── */}
          <div className="p-6 flex flex-col" style={{ maxHeight: 560 }}>
            <h3 className="text-base font-semibold mb-1" style={{ color: titleColor }}>3. Appointment Details</h3>
            <p className="text-sm mb-4" style={{ color: subtitleColor }}>Review your selection.</p>

            {/* Summary card */}
            <div className="rounded-xl border p-4 space-y-3 mb-4" style={{ borderColor: cardBorder, background: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa' }}>
              {/* Appointment Type */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}>
                  <Calendar className="w-4 h-4" style={{ color: '#E53935' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: labelColor }}>Appointment Type</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: selectedClass ? valueColor : labelColor }}>
                    {selectedClass?.name || '—'}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}>
                  <Calendar className="w-4 h-4" style={{ color: '#E53935' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: labelColor }}>Date</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: selectedDate ? valueColor : labelColor }}>
                    {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}>
                  <Clock className="w-4 h-4" style={{ color: '#E53935' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: labelColor }}>Time</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: selectedTime ? valueColor : labelColor }}>
                    {selectedTime ? `${formatTime(selectedTime)}${meta.duration ? ` (${meta.duration})` : ''}` : '—'}
                  </p>
                </div>
              </div>

              {/* Lead */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}>
                  <User className="w-4 h-4" style={{ color: '#E53935' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: labelColor }}>Lead</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: valueColor }}>{leadName}</p>
                  {lead.phone && <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: labelColor }}><Phone className="w-3 h-3" />{lead.phone}</p>}
                </div>
              </div>
            </div>

            {/* Booked by dropdown */}
            <div className="mb-4 relative">
              <label className="text-xs font-medium block mb-1.5" style={{ color: labelColor }}>Booked by (Staff Credit)</label>
              <button
                onClick={() => setShowStaffDropdown(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all"
                style={{
                  background: inputBg,
                  borderColor: bookedByName ? '#E53935' : inputBorder,
                  color: bookedByName ? valueColor : labelColor,
                }}
              >
                <User className="w-4 h-4 flex-shrink-0" style={{ color: bookedByName ? '#E53935' : labelColor }} />
                <span className="flex-1 text-left">{bookedByName || 'Select staff member...'}</span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: labelColor }} />
              </button>

              {showStaffDropdown && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-xl overflow-hidden z-50"
                  style={{ background: dropdownBg, borderColor: dropdownBorder }}
                >
                  {(staffList as any[]).length === 0 ? (
                    <div className="px-4 py-3 text-sm" style={{ color: labelColor }}>No staff members found</div>
                  ) : (
                    (staffList as any[]).map((s: any) => {
                      const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email || 'Staff';
                      const isSelected = bookedByStaffId === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => { setBookedByStaffId(s.id); setBookedByName(name); setShowStaffDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors"
                          style={{
                            background: isSelected ? 'rgba(229,57,53,0.08)' : 'transparent',
                            color: valueColor,
                          }}
                          onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = dropdownItemHover; }}
                          onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: isSelected ? '#E53935' : (isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'), color: isSelected ? '#fff' : valueColor }}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{name}</p>
                            {s.role && <p className="text-xs truncate" style={{ color: labelColor }}>{s.role}</p>}
                          </div>
                          {isSelected && <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#E53935' }} />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="text-xs font-medium block mb-1.5" style={{ color: labelColor }}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any special notes or requests..."
                rows={2}
                className="w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none transition-all"
                style={{ background: inputBg, borderColor: inputBorder, color: valueColor }}
              />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Continue button */}
            <button
              onClick={handleConfirm}
              disabled={!canConfirm || isSubmitting}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: canConfirm ? '#E53935' : (isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'),
                color: canConfirm ? '#ffffff' : labelColor,
                cursor: canConfirm ? 'pointer' : 'not-allowed',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Scheduling...' : 'Continue'}
              {!isSubmitting && canConfirm && <span style={{ fontSize: 16 }}>→</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
