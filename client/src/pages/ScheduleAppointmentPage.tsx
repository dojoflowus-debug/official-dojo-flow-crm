import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Check, Clock, Calendar,
  User, MapPin, Phone, Users, ChevronDown,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Appointment type definitions (used when class list is empty or as fallback)
const APPT_TYPES = [
  {
    key: 'intro',
    title: 'Intro Class',
    desc: "Try a class and see if we're the right fit for you.",
    icon: <Calendar className="w-5 h-5" />,
    duration: null,
  },
  {
    key: 'tour',
    title: 'Tour & Consultation',
    desc: 'Take a tour and learn more about our programs.',
    icon: <Users className="w-5 h-5" />,
    duration: '30 min',
  },
  {
    key: 'phone',
    title: 'Phone Consultation',
    desc: 'Schedule a quick call with our team.',
    icon: <Phone className="w-5 h-5" />,
    duration: '15 min',
  },
];

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
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
  availableDayIndices,
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

  const navColor = isDark ? '#9ca3af' : '#6b7280';
  const headerColor = isDark ? '#111827' : '#111827';
  const dayHeaderColor = isDark ? '#9ca3af' : '#9ca3af';
  const disabledColor = '#d1d5db';
  const availColor = isDark ? '#111827' : '#111827';
  const selectedBg = '#E53935';
  const todayOutline = '#E53935';
  const availDotColor = '#E53935';

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          style={{ color: navColor }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-base" style={{ color: headerColor }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          style={{ color: navColor }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: dayHeaderColor }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const cellDate = new Date(viewYear, viewMonth, day);
          const dayOfWeek = cellDate.getDay();
          const isAvail = availableDayIndices.length === 0 || availableDayIndices.includes(dayOfWeek);
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
                outline: isToday && !isSel ? `2px solid ${todayOutline}` : 'none',
                outlineOffset: '-2px',
                cursor: disabled ? 'default' : 'pointer',
              }}
            >
              {day}
              {isAvail && !isPast && !isSel && (
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: availDotColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ScheduleAppointmentPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'cinematic';

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
  const { data: lead } = trpc.getLead.useQuery(
    { id: Number(leadId) },
    { enabled: !!leadId }
  );
  const { data: classesRaw = [], isLoading: classesLoading } = trpc.getClasses.useQuery();
  const { data: staffList = [] } = trpc.getStaff.useQuery();
  const scheduleMutation = trpc.scheduleAppointment.useMutation();

  // Deduplicate classes by name
  const classes = useMemo(() => {
    const seen = new Set<string>();
    return (classesRaw as any[]).filter(c => {
      if (seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    });
  }, [classesRaw]);

  // Available day indices for selected class
  const availableDayIndices = useMemo(() => {
    if (!selectedClass) return [];
    return (classesRaw as any[])
      .filter(c => c.name === selectedClass.name)
      .map((c: any) => DAYS_OF_WEEK.indexOf(c.dayOfWeek))
      .filter(i => i >= 0);
  }, [selectedClass, classesRaw]);

  // Time slots for selected class + date
  const timeSlots = useMemo(() => {
    if (!selectedClass || !selectedDate) return [];
    const dayName = DAYS_OF_WEEK[selectedDate.getDay()];
    const rows = (classesRaw as any[]).filter(c =>
      c.name === selectedClass.name && c.dayOfWeek === dayName
    );
    if (rows.length > 0 && rows[0].startTime) {
      return rows.map((r: any) => ({ time: r.startTime, label: formatTime(r.startTime) }));
    }
    return [
      { time: '09:00', label: '9:00 AM' },
      { time: '10:00', label: '10:00 AM' },
      { time: '11:00', label: '11:00 AM' },
      { time: '16:00', label: '4:00 PM' },
      { time: '17:00', label: '5:00 PM' },
      { time: '18:00', label: '6:00 PM' },
      { time: '19:00', label: '7:00 PM' },
      { time: '20:00', label: '8:00 PM' },
    ];
  }, [selectedClass, selectedDate, classesRaw]);

  const leadName = lead ? `${(lead as any).first_name || ''} ${(lead as any).last_name || ''}`.trim() : '...';

  // Step logic
  const currentStep = !selectedClass ? 1 : !selectedDate ? 2 : 3;

  async function handleConfirm() {
    if (!lead || !selectedClass || !selectedDate) return;
    setIsSubmitting(true);
    try {
      await scheduleMutation.mutateAsync({
        leadId: Number(leadId),
        classId: selectedClass.id,
        scheduledDate: formatDateISO(selectedDate),
        scheduledTime: selectedTime || undefined,
        notes: notes || undefined,
        bookedByName: bookedByName || undefined,
        bookedByStaffId: bookedByStaffId || undefined,
      });
      toast({
        title: 'Appointment scheduled!',
        description: `${selectedClass.name} on ${formatDateLong(selectedDate)}`,
      });
      navigate(`/leads`);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to schedule', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Theme tokens ───────────────────────────────────────────────────────────
  const pageBg = isDark ? '#0f1117' : '#f9fafb';
  const cardBg = isDark ? '#1a1d2e' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const titleColor = isDark ? '#f9fafb' : '#111827';
  const subtitleColor = isDark ? '#9ca3af' : '#6b7280';
  const labelColor = isDark ? '#9ca3af' : '#6b7280';
  const valueColor = isDark ? '#f9fafb' : '#111827';
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const rowHoverBg = isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb';
  const rowSelBg = isDark ? 'rgba(229,57,53,0.06)' : '#fff5f5';
  const rowSelBorder = '#E53935';
  const rowBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const iconBg = isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
  const iconSelBg = isDark ? 'rgba(229,57,53,0.12)' : '#fee2e2';
  const slotBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const slotBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const slotSelBg = isDark ? 'rgba(229,57,53,0.1)' : '#fff5f5';
  const slotSelBorder = '#E53935';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const dropdownBg = isDark ? '#1e2030' : '#ffffff';
  const dropdownBorder = isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb';
  const infoBg = isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff';
  const infoBorder = isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe';
  const infoText = isDark ? '#93c5fd' : '#1d4ed8';
  const infoSubText = isDark ? '#60a5fa' : '#3b82f6';
  const stepActiveBg = '#E53935';
  const stepInactiveBg = isDark ? '#374151' : '#e5e7eb';
  const stepActiveText = '#ffffff';
  const stepInactiveText = isDark ? '#6b7280' : '#9ca3af';
  const stepLineActive = '#E53935';
  const stepLineInactive = isDark ? '#374151' : '#e5e7eb';

  const steps = [
    { num: 1, label: 'Select Type' },
    { num: 2, label: 'Choose Date & Time' },
    { num: 3, label: 'Your Information' },
    { num: 4, label: 'Confirm Appointment' },
  ];

  // Use real classes or fallback to APPT_TYPES
  const appointmentItems = classesLoading
    ? []
    : classes.length > 0
    ? classes.map((c: any) => ({
        key: String(c.id),
        title: c.name,
        desc: c.instructor ? `Instructor: ${c.instructor}` : 'Martial arts class',
        icon: <Calendar className="w-5 h-5" />,
        duration: null,
        raw: c,
      }))
    : APPT_TYPES.map(t => ({ ...t, raw: null }));

  return (
    <div
      className="min-h-screen"
      style={{ background: pageBg, padding: '24px 24px 80px' }}
    >
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="w-full max-w-none">
        {/* Back button */}
        <button
          onClick={() => navigate('/leads')}
          className="flex items-center gap-1.5 text-xs mb-4 hover:opacity-70 transition-opacity"
          style={{ color: labelColor }}
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Leads
        </button>

        <h1 className="font-bold mb-1" style={{ color: titleColor, fontSize: '22px', lineHeight: '1.2' }}>
          Schedule an Appointment
        </h1>
        <p className="text-sm mb-8" style={{ color: subtitleColor }}>
          Book a time to connect with{' '}
          <span className="font-medium" style={{ color: titleColor }}>{leadName}</span>.
        </p>

        {/* ── Step Breadcrumb ──────────────────────────────────────────── */}
        <div className="flex items-center mb-8">
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
                  <span
                    className="text-xs font-medium whitespace-nowrap mt-0.5"
                    style={{
                      color: active ? '#E53935' : done ? labelColor : stepInactiveText,
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="flex-1 h-px mx-3 mb-5"
                    style={{ background: done ? stepLineActive : stepLineInactive, opacity: done ? 0.4 : 1 }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── 3-Panel Card ────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.07)',
          }}
        >
          <div className="grid grid-cols-3" style={{ minHeight: 580 }}>

            {/* ── LEFT: Select Appointment Type ─────────────────────── */}
          <div
            className="p-5"
            style={{ borderRight: `1px solid ${dividerColor}` }}
          >
              <h2 className="font-semibold mb-1" style={{ color: titleColor, fontSize: '14px' }}>
                1. Select Appointment Type
              </h2>
              <p className="text-xs mb-5" style={{ color: subtitleColor }}>
                Choose the type of appointment you'd like to schedule.
              </p>

              {classesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 rounded-xl animate-pulse"
                      style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {appointmentItems.map(item => {
                    const isSelected = selectedClass
                      ? (item.raw ? selectedClass.id === item.raw.id : selectedClass.key === item.key)
                      : false;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setSelectedClass(item.raw || { id: item.key, name: item.title });
                          setSelectedDate(null);
                          setSelectedTime(null);
                        }}
                        className="w-full text-left rounded-xl border p-4 flex items-center gap-4 transition-all"
                        style={{
                          background: isSelected ? rowSelBg : 'transparent',
                          borderColor: isSelected ? rowSelBorder : rowBorder,
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = rowHoverBg;
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        {/* Icon circle */}
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isSelected ? iconSelBg : iconBg,
                            color: isSelected ? '#E53935' : labelColor,
                          }}
                        >
                          {item.icon}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm" style={{ color: titleColor }}>
                            {item.title}
                          </p>
                          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: subtitleColor }}>
                            {item.desc}
                          </p>
                        </div>

                        {/* Duration badge or check */}
                        {isSelected ? (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: '#E53935' }}
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        ) : item.duration ? (
                          <span
                            className="text-xs px-2.5 py-1 rounded-full flex-shrink-0"
                            style={{ background: iconBg, color: labelColor }}
                          >
                            {item.duration}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* What to Expect */}
              <div
                className="mt-6 rounded-xl p-4 flex gap-3"
                style={{ background: infoBg, border: `1px solid ${infoBorder}` }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: '#3b82f6' }}
                >
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: infoText }}>
                    What to Expect
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: infoSubText }}>
                    We'll reach out to confirm your appointment and provide any additional details you need.
                  </p>
                </div>
              </div>
            </div>

            {/* ── CENTER: Calendar + Time Slots ─────────────────────── */}
          <div
            className="p-5"
            style={{ borderRight: `1px solid ${dividerColor}` }}
          >
              <h2 className="font-semibold mb-1" style={{ color: titleColor, fontSize: '14px' }}>
                2. Choose Date &amp; Time
              </h2>
              <p className="text-xs mb-5" style={{ color: subtitleColor }}>
                Select a date and time that works for you.
              </p>

              {!selectedClass ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: iconBg }}
                  >
                    <Calendar className="w-7 h-7" style={{ color: labelColor }} />
                  </div>
                  <p className="text-sm text-center max-w-xs" style={{ color: subtitleColor }}>
                    Select an appointment type first to see available dates.
                  </p>
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
                    <div className="mt-6">
                      <p className="text-sm font-semibold mb-3" style={{ color: titleColor }}>
                        {formatDateLong(selectedDate)}
                      </p>
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
                      <p className="text-xs mt-4 flex items-center gap-1.5" style={{ color: labelColor }}>
                        <span>🌐</span> All times are in Central Time (CT)
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── RIGHT: Appointment Details ────────────────────────── */}
            <div className="p-5 flex flex-col">
              <h2 className="font-semibold mb-1" style={{ color: titleColor, fontSize: '14px' }}>
                3. Appointment Details
              </h2>
              <p className="text-xs mb-5" style={{ color: subtitleColor }}>
                Review your selection.
              </p>

              {/* Summary card */}
              <div
                className="rounded-xl border p-5 space-y-4 mb-5"
                style={{ borderColor: cardBorder, background: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa' }}
              >
                {/* Appointment Type */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: iconBg }}
                  >
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
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: iconBg }}
                  >
                    <Calendar className="w-4 h-4" style={{ color: '#E53935' }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: labelColor }}>Date</p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: selectedDate ? valueColor : labelColor }}>
                      {selectedDate ? formatDateLong(selectedDate) : '—'}
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: iconBg }}
                  >
                    <Clock className="w-4 h-4" style={{ color: '#E53935' }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: labelColor }}>Time</p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: selectedTime ? valueColor : labelColor }}>
                      {selectedTime ? formatTime(selectedTime) : '—'}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: iconBg }}
                  >
                    <MapPin className="w-4 h-4" style={{ color: '#E53935' }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: labelColor }}>Location</p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: valueColor }}>
                      {leadName ? `${leadName}'s Dojo` : 'Main Location'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Booked by dropdown */}
              <div className="mb-4 relative">
                <label className="text-xs font-medium block mb-1.5" style={{ color: labelColor }}>
                  Booked by (Staff Credit)
                </label>
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
                      <div className="px-4 py-3 text-sm" style={{ color: labelColor }}>
                        No staff members found
                      </div>
                    ) : (
                      (staffList as any[]).map((s: any) => {
                        const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email || 'Staff';
                        const isSel = bookedByStaffId === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              setBookedByStaffId(s.id);
                              setBookedByName(name);
                              setShowStaffDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors"
                            style={{
                              background: isSel ? 'rgba(229,57,53,0.08)' : 'transparent',
                              color: valueColor,
                            }}
                            onMouseEnter={e => {
                              if (!isSel) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.06)' : '#f9fafb';
                            }}
                            onMouseLeave={e => {
                              if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: isSel ? '#E53935' : (isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'),
                                color: isSel ? '#fff' : valueColor,
                              }}
                            >
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{name}</p>
                              {s.role && <p className="text-xs truncate" style={{ color: labelColor }}>{s.role}</p>}
                            </div>
                            {isSel && <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#E53935' }} />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="text-xs font-medium block mb-1.5" style={{ color: labelColor }}>
                  Notes (optional)
                </label>
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
                disabled={!selectedClass || !selectedDate || isSubmitting}
                className="w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all"
                style={{
                  background: selectedClass && selectedDate ? '#E53935' : (isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'),
                  color: selectedClass && selectedDate ? '#ffffff' : labelColor,
                  cursor: selectedClass && selectedDate ? 'pointer' : 'not-allowed',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Scheduling...' : 'Continue'}
                {!isSubmitting && selectedClass && selectedDate && (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
