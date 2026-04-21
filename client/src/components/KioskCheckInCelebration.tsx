/**
 * KioskCheckInCelebration
 * Full-screen animated celebration shown after a successful kiosk check-in.
 * Shows confetti burst, student name, belt rank badge, and auto-dismisses.
 */
import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const BELT_COLORS: Record<string, { bg: string; text: string; glow: string; label: string }> = {
  white:  { bg: '#ffffff', text: '#111', glow: 'rgba(255,255,255,0.6)', label: 'White Belt' },
  yellow: { bg: '#fbbf24', text: '#111', glow: 'rgba(251,191,36,0.7)',  label: 'Yellow Belt' },
  orange: { bg: '#f97316', text: '#fff', glow: 'rgba(249,115,22,0.7)',  label: 'Orange Belt' },
  green:  { bg: '#22c55e', text: '#fff', glow: 'rgba(34,197,94,0.7)',   label: 'Green Belt' },
  blue:   { bg: '#3b82f6', text: '#fff', glow: 'rgba(59,130,246,0.7)',  label: 'Blue Belt' },
  purple: { bg: '#a855f7', text: '#fff', glow: 'rgba(168,85,247,0.7)',  label: 'Purple Belt' },
  brown:  { bg: '#92400e', text: '#fff', glow: 'rgba(146,64,14,0.7)',   label: 'Brown Belt' },
  red:    { bg: '#ef4444', text: '#fff', glow: 'rgba(239,68,68,0.7)',   label: 'Red Belt' },
  black:  { bg: '#111111', text: '#fff', glow: 'rgba(255,255,255,0.3)', label: 'Black Belt' },
};

function getBeltStyle(rank?: string | null) {
  if (!rank) return BELT_COLORS.white;
  const key = rank.toLowerCase().replace(/\s+belt$/i, '').trim();
  return BELT_COLORS[key] || BELT_COLORS.white;
}

interface Props {
  studentName: string;
  beltRank?: string | null;
  onDismiss: () => void;
  /** Auto-dismiss after ms (default 4000) */
  duration?: number;
}

export default function KioskCheckInCelebration({ studentName, beltRank, onDismiss, duration = 4000 }: Props) {
  const belt = getBeltStyle(beltRank);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Fire confetti burst
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.6 },
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
      });
    };

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2,  { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1,  { spread: 120, startVelocity: 45 });

    timerRef.current = setTimeout(onDismiss, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss, duration]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
      onClick={onDismiss}
    >
      {/* Glow ring */}
      <div
        className="w-40 h-40 rounded-full flex items-center justify-center mb-8"
        style={{
          background: `radial-gradient(circle, ${belt.bg}22 0%, transparent 70%)`,
          boxShadow: `0 0 80px ${belt.glow}, 0 0 160px ${belt.glow}44`,
          border: `3px solid ${belt.bg}`,
        }}
      >
        {/* Checkmark */}
        <svg viewBox="0 0 24 24" fill="none" className="w-20 h-20" style={{ filter: `drop-shadow(0 0 12px ${belt.glow})` }}>
          <circle cx="12" cy="12" r="11" stroke={belt.bg} strokeWidth="2" />
          <path d="M7 12.5l3.5 3.5 6.5-7" stroke={belt.bg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Name */}
      <h1
        className="text-6xl md:text-7xl font-black text-white text-center px-6 mb-4 leading-tight"
        style={{ textShadow: '0 0 40px rgba(255,255,255,0.3)' }}
      >
        {studentName}
      </h1>

      {/* Checked in label */}
      <p className="text-2xl font-bold tracking-widest uppercase mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Checked In ✓
      </p>

      {/* Belt badge */}
      {beltRank && (
        <div
          className="flex items-center gap-3 px-6 py-3 rounded-full text-lg font-black uppercase tracking-widest"
          style={{
            background: belt.bg,
            color: belt.text,
            boxShadow: `0 0 30px ${belt.glow}`,
          }}
        >
          {/* Belt icon */}
          <svg viewBox="0 0 32 12" className="w-8 h-3" fill={belt.text === '#fff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)'}>
            <rect x="0" y="0" width="32" height="12" rx="6" />
            <rect x="13" y="3" width="6" height="6" rx="1" fill={belt.text === '#fff' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)'} />
          </svg>
          {belt.label}
        </div>
      )}

      {/* Tap to dismiss hint */}
      <p className="absolute bottom-10 text-sm tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
        Tap anywhere to continue
      </p>
    </div>
  );
}
