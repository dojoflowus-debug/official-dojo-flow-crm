/**
 * KioskHome — DojoFlow Kiosk Home Screen
 *
 * Grid layout (matches mockup exactly):
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  HEADER: Logo (left)                        Clock (right)       │  ~72px
 * ├──────────────────────────────────┬──────────────────────────────┤
 * │  LEFT COLUMN (flex-1)            │  RIGHT COLUMN (320px)        │
 * │  - WELCOME / READY TO TRAIN      │  - TODAY'S SCHEDULE          │
 * │  - [TAP TO CHECK IN button]      │  - DOJO LEADERBOARD          │
 * │  - 🔥 STREAK BAR                 │                              │
 * │  - 4 action icon cards           │                              │
 * ├──────────────────────────────────┴──────────────────────────────┤
 * │  STUDENT AVATAR ROW (full width, horizontal scroll)             │  ~160px
 * ├─────────────────────────────────────────────────────────────────┤
 * │  BENEFITS STRIP (4 items)                                       │  ~56px
 * ├─────────────────────────────────────────────────────────────────┤
 * │  FOOTER: Español | NEED HELP? | KIOSK MODE                      │  ~52px
 * └─────────────────────────────────────────────────────────────────┘
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Gamepad2, ShoppingBag, Users,
  Globe, HelpCircle, Trophy, Calendar, Flame, ChevronRight,
  CheckCircle2, Clock, Settings, Star,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import KioskCheckInCelebration from '@/components/KioskCheckInCelebration';
import KioskTrialBooking from '@/components/KioskTrialBooking';

// ─── Belt color ring map ─────────────────────────────────────────────────────
const BELT_RING: Record<string, string> = {
  white:  '#e5e7eb',
  yellow: '#fbbf24',
  orange: '#f97316',
  green:  '#22c55e',
  blue:   '#3b82f6',
  purple: '#a855f7',
  brown:  '#92400e',
  red:    '#ef4444',
  black:  '#374151',
};

function getBeltColor(rank?: string | null): string {
  if (!rank) return BELT_RING.white;
  const key = rank.toLowerCase().replace(/\s+belt$/i, '').trim();
  return BELT_RING[key] || BELT_RING.white;
}

// ─── Class status helper ─────────────────────────────────────────────────────
function getClassStatus(startTime: string): 'in-progress' | 'up-next' | 'upcoming' {
  if (!startTime) return 'upcoming';
  try {
    const now = new Date();
    const clean = startTime.trim();
    const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return 'upcoming';
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const meridiem = (match[3] || '').toUpperCase();
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    const classMin = h * 60 + m;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const diff = classMin - nowMin;
    if (diff < 0 && diff > -60) return 'in-progress';
    if (diff >= 0 && diff <= 45) return 'up-next';
  } catch { /* ignore */ }
  return 'upcoming';
}

// ─── Subtle fire particle canvas ─────────────────────────────────────────────
function FireParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    type Particle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number };
    const particles: Particle[] = [];
    let frame = 0;
    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      if (frame % 4 === 0 && particles.length < 80) {
        particles.push({
          x: Math.random() * canvas!.width,
          y: canvas!.height + 5,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -(Math.random() * 1.0 + 0.3),
          life: 0,
          maxLife: Math.random() * 100 + 60,
          size: Math.random() * 1.8 + 0.4,
        });
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life++;
        if (p.life > p.maxLife) { particles.splice(i, 1); continue; }
        const alpha = (1 - p.life / p.maxLife) * 0.3;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(220,38,38,${alpha})`;
        ctx!.fill();
      }
      frame++;
      animId = requestAnimationFrame(animate);
    }
    animId = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────
type KioskMode = 'active' | 'idle' | 'checkin-search' | 'confirmation';

interface StudentRow {
  id: number;
  firstName: string;
  lastName: string | null;
  program: string;
  beltRank: string | null;
  photoUrl: string | null;
  attendanceCount: number;
}

interface ClassRow {
  id: number;
  name: string;
  instructor: string;
  startTime: string;
}

interface LeaderEntry {
  studentId: number;
  name: string;
  streak: number;
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function KioskHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const orgId = (user as any)?.activeOrgId || 1;

  const [mode, setMode] = useState<KioskMode>('active');
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [now, setNow] = useState(new Date());
  const [showTrialBooking, setShowTrialBooking] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [celebStudent, setCelebStudent] = useState<{ name: string; beltRank?: string | null } | null>(null);
  const [confirmedStudent, setConfirmedStudent] = useState<{ name: string; program: string } | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Data queries
  const liveData = trpc.kiosk.getLiveKioskData.useQuery({ orgId }, { refetchInterval: 60_000 });
  const studentsQuery = trpc.kiosk.getStudentsForKiosk.useQuery({ orgId }, { refetchInterval: 120_000 });
  const searchResults = trpc.kiosk.searchStudentsByOrg.useQuery(
    { orgId, query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );
  const checkIn = trpc.kiosk.checkInStudentByOrg.useMutation();

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Idle detection
  const resetIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (mode === 'idle') setMode('active');
    idleTimer.current = setTimeout(() => setMode('idle'), 120_000);
  }, [mode]);

  useEffect(() => {
    window.addEventListener('touchstart', resetIdle);
    window.addEventListener('mousemove', resetIdle);
    resetIdle();
    return () => {
      window.removeEventListener('touchstart', resetIdle);
      window.removeEventListener('mousemove', resetIdle);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [resetIdle]);

  // Auto-return from confirmation
  useEffect(() => {
    if (mode === 'confirmation') {
      const t = setTimeout(() => {
        setMode('active');
        setConfirmedStudent(null);
        setCelebStudent(null);
      }, 8_000);
      return () => clearTimeout(t);
    }
  }, [mode]);

  async function handleCheckIn(studentId: number, name: string, program: string, beltRank?: string | null) {
    try {
      await checkIn.mutateAsync({ orgId, studentId });
      setCelebStudent({ name, beltRank });
      setConfirmedStudent({ name, program });
      setMode('confirmation');
      setSearchQuery('');
    } catch (e) {
      console.error('Check-in failed', e);
    }
  }

  const school = liveData.data;
  const students: StudentRow[] = (studentsQuery.data || []) as StudentRow[];
  const todayClasses: ClassRow[] = (school?.todayClasses || []) as ClassRow[];
  const leaderboard: LeaderEntry[] = (school?.leaderboard || []) as LeaderEntry[];

  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // ── IDLE MODE ──────────────────────────────────────────────────────────────
  if (mode === 'idle') {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer"
        style={{ background: 'radial-gradient(ellipse at center, #1a0000 0%, #000 70%)' }}
        onClick={() => setMode('active')}
      >
        <FireParticles />
        <div className="relative z-10 text-center">
          <div className="text-8xl font-black text-white mb-4" style={{ textShadow: '0 0 60px rgba(220,38,38,0.7)' }}>
            READY TO TRAIN?
          </div>
          <div className="text-3xl text-red-400 font-semibold tracking-widest uppercase animate-pulse">
            Tap anywhere to begin
          </div>
          <div className="text-white/30 text-2xl mt-8">{timeStr}</div>
        </div>
      </div>
    );
  }

  // ── CONFIRMATION MODE ──────────────────────────────────────────────────────
  if (mode === 'confirmation' && celebStudent) {
    return (
      <div className="fixed inset-0" style={{ background: '#000' }}>
        <KioskCheckInCelebration
          studentName={celebStudent.name}
          beltRank={celebStudent.beltRank}
          onDismiss={() => { setMode('active'); setCelebStudent(null); setConfirmedStudent(null); }}
        />
      </div>
    );
  }

  // ── ACTIVE MODE ────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background: '#0d0d0d',
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto auto auto',
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
      }}
    >
      <FireParticles />

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 1 — HEADER
      ══════════════════════════════════════════════════════════════════════ */}
      <header
        className="relative z-10 flex items-center justify-between px-6 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo + school name */}
        <div className="flex items-center gap-3">
          {school?.logoUrl ? (
            <img src={school.logoUrl} alt="logo" style={{ height: 44, objectFit: 'contain' }} />
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #dc2626, #7f1d1d)', boxShadow: '0 0 16px rgba(220,38,38,0.4)' }}
              >
                <span className="text-white font-black text-lg">M</span>
              </div>
              <div>
                <div className="font-black text-lg leading-none">
                  <span className="text-white">MY</span><span className="text-red-500">DOJO</span>
                </div>
                <div className="text-white/40 text-xs tracking-widest uppercase">Martial Arts</div>
              </div>
            </div>
          )}
        </div>

        {/* Clock */}
        <div className="flex items-center gap-2 text-right">
          <Clock className="w-4 h-4 text-white/30" />
          <div>
            <div className="text-white font-bold text-xl leading-none">{timeStr}</div>
            <div className="text-white/40 text-xs">{dateStr}</div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 2 — MAIN CONTENT: LEFT + RIGHT COLUMNS
      ══════════════════════════════════════════════════════════════════════ */}
      <main
        className="relative z-10 overflow-hidden"
        style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, padding: '12px 20px 8px' }}
      >
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>

          {/* Welcome text */}
          <div className="text-center" style={{ paddingTop: 4 }}>
            <div
              className="font-black text-white"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1, textShadow: '0 2px 20px rgba(0,0,0,0.8)', letterSpacing: '-0.02em' }}
            >
              WELCOME!
            </div>
            <div className="text-red-400 font-bold tracking-widest uppercase" style={{ fontSize: 'clamp(0.75rem, 1.5vw, 1rem)', marginTop: 4 }}>
              READY TO TRAIN?
            </div>
            <div className="text-white/40 text-sm" style={{ marginTop: 2 }}>Let's have a great class today!</div>
          </div>

          {/* TAP TO CHECK IN */}
          <button
            onClick={() => setMode('checkin-search')}
            className="relative w-full flex items-center justify-center gap-4 rounded-2xl overflow-hidden"
            style={{
              padding: '18px 24px',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)',
              boxShadow: '0 0 50px rgba(220,38,38,0.45), 0 4px 24px rgba(0,0,0,0.6)',
              border: '1px solid rgba(239,68,68,0.35)',
              cursor: 'pointer',
            }}
          >
            {/* Left chevrons */}
            <div className="absolute left-5 flex gap-0.5 opacity-50">
              <ChevronRight className="w-5 h-5 text-white" />
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
            <div
              className="w-12 h-12 rounded-full border-2 border-white/70 flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: '0 0 12px rgba(255,255,255,0.2)' }}
            >
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <span
              className="font-black text-white uppercase tracking-wider"
              style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)' }}
            >
              TAP TO CHECK IN
            </span>
            <ChevronRight className="w-6 h-6 text-white/70 flex-shrink-0" />
            {/* Right chevrons */}
            <div className="absolute right-5 flex gap-0.5 opacity-50">
              <ChevronRight className="w-5 h-5 text-white" />
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Streak bar */}
          <div
            className="flex items-center gap-3 px-4 rounded-xl"
            style={{
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <Flame className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <span className="text-orange-400 font-black text-sm tracking-wide">5 DAY STREAK</span>
            <span className="text-white/40 text-sm flex-1">Keep it up!</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 18 }}>🔥</span>)}
            </div>
          </div>

          {/* 4 Action cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, flex: 1 }}>
            {[
              {
                label: 'BOOK A\nFREE TRIAL',
                icon: <Users style={{ width: 32, height: 32 }} />,
                color: '#a78bfa',
                bg: 'rgba(109,40,217,0.18)',
                border: 'rgba(139,92,246,0.35)',
                action: () => setShowTrialBooking(true),
              },
              {
                label: 'ENROLL\nNOW',
                icon: <UserPlus style={{ width: 32, height: 32 }} />,
                color: '#4ade80',
                bg: 'rgba(22,163,74,0.18)',
                border: 'rgba(34,197,94,0.35)',
                action: () => navigate(`/kiosk/${orgId}/new-student`),
              },
              {
                label: 'PRO\nSHOP',
                icon: <ShoppingBag style={{ width: 32, height: 32 }} />,
                color: '#fb923c',
                bg: 'rgba(180,83,9,0.18)',
                border: 'rgba(249,115,22,0.35)',
                action: () => {},
              },
              {
                label: 'ARCADE\nGAMES',
                icon: <Gamepad2 style={{ width: 32, height: 32 }} />,
                color: '#60a5fa',
                bg: 'rgba(29,78,216,0.18)',
                border: 'rgba(96,165,250,0.35)',
                action: () => navigate('/kiosk-arcade'),
              },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '20px 12px',
                  borderRadius: 20,
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                  color: item.color,
                  cursor: 'pointer',
                  minHeight: 120,
                }}
              >
                {item.icon}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: '#fff',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    whiteSpace: 'pre-line',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>

          {/* Today's Schedule */}
          <div
            style={{
              flex: 1,
              borderRadius: 20,
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar style={{ width: 16, height: 16, color: '#f87171' }} />
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Today's Schedule
                </span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>View All</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayClasses.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                  No classes today
                </div>
              ) : (
                todayClasses.slice(0, 6).map((cls: ClassRow, i: number) => {
                  const status = getClassStatus(cls.startTime);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, width: 52, flexShrink: 0 }}>
                        {cls.startTime || '—'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cls.name}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cls.instructor}
                        </div>
                      </div>
                      {status === 'in-progress' && (
                        <span style={{ background: '#16a34a', color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 999, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          IN PROGRESS
                        </span>
                      )}
                      {status === 'up-next' && (
                        <span style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, flexShrink: 0, textTransform: 'uppercase' }}>
                          UP NEXT
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Dojo Leaderboard */}
          <div
            style={{
              borderRadius: 20,
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Trophy style={{ width: 16, height: 16, color: '#fbbf24' }} />
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Dojo Leaderboard
              </span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 8 }}>This Month</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {leaderboard.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>
                  No data yet
                </div>
              ) : (
                leaderboard.slice(0, 4).map((entry: LeaderEntry, i: number) => {
                  const rankColors = ['#ca8a04', '#9ca3af', '#b45309', '#dc2626'];
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 10px',
                        borderRadius: 12,
                        background: i === 0 ? 'rgba(234,179,8,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${i === 0 ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: rankColors[i] || '#374151',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ flex: 1, color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.name}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, flexShrink: 0 }}>
                        {entry.streak} Classes
                      </span>
                      <Flame style={{ width: 12, height: 12, color: '#fb923c', flexShrink: 0 }} />
                    </div>
                  );
                })
              )}
            </div>
            {leaderboard.length > 0 && (
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
                Keep training. Keep climbing!
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 3 — STUDENT AVATAR ROW
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative z-10"
        style={{
          margin: '0 20px',
          borderRadius: 20,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Users style={{ width: 15, height: 15, color: '#f87171' }} />
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Tap Your Name to Check In
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 20,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'none',
          }}
        >
          {/* Student avatars */}
          {students.slice(0, 12).map((s: StudentRow) => {
            const beltColor = getBeltColor(s.beltRank);
            const initials = `${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`.toUpperCase();
            return (
              <button
                key={s.id}
                onClick={() => handleCheckIn(s.id, `${s.firstName} ${s.lastName || ''}`.trim(), s.program, s.beltRank)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0,
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  minWidth: 72,
                }}
              >
                {/* Avatar circle with belt ring */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: `3px solid ${beltColor}`,
                    boxShadow: `0 0 14px ${beltColor}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${beltColor}22, #1a1a1a)`,
                    flexShrink: 0,
                  }}
                >
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt={s.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>{initials}</span>
                  )}
                </div>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'center', maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.firstName}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.program}
                </span>
                {/* Belt stripe */}
                <div style={{ display: 'flex', gap: 2 }}>
                  {[0,1,2].map(j => (
                    <div key={j} style={{ width: 14, height: 3, borderRadius: 2, background: j === 1 ? beltColor : `${beltColor}44` }} />
                  ))}
                </div>
              </button>
            );
          })}

          {/* Not Listed? */}
          <button
            onClick={() => setMode('checkin-search')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
              minWidth: 80,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                border: '2px dashed rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users style={{ width: 28, height: 28, color: 'rgba(255,255,255,0.25)' }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>NOT LISTED?</span>
            <span style={{ color: '#f87171', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>TAP HERE</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textAlign: 'center' }}>to check in</span>
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 4 — BENEFITS STRIP
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="relative z-10"
        style={{
          margin: '8px 20px 0',
          borderRadius: 16,
          padding: '10px 20px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}
      >
        {[
          { icon: <Star style={{ width: 18, height: 18 }} />, color: '#dc2626', title: 'EARN REWARDS', desc: 'Check in, earn points, get rewards!' },
          { icon: <Trophy style={{ width: 18, height: 18 }} />, color: '#b45309', title: 'TRACK PROGRESS', desc: 'See your growth and achievements.' },
          { icon: <Calendar style={{ width: 18, height: 18 }} />, color: '#16a34a', title: 'STAY CONSISTENT', desc: 'Build habits that build champions.' },
          { icon: <Users style={{ width: 18, height: 18 }} />, color: '#0284c7', title: 'WE ARE FAMILY', desc: 'Train together. Grow together.' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: `${item.color}22`,
                color: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {item.icon}
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 11, fontWeight: 900, letterSpacing: '0.04em' }}>{item.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, lineHeight: 1.3 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 5 — FOOTER
      ══════════════════════════════════════════════════════════════════════ */}
      <footer
        className="relative z-10"
        style={{
          margin: '6px 20px 16px',
          borderRadius: 16,
          padding: '10px 20px',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Language */}
        <button
          onClick={() => setLang(l => l === 'en' ? 'es' : 'en')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', padding: 0 }}
        >
          <Globe style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {lang === 'en' ? 'ESPAÑOL' : 'ENGLISH'}
          </span>
        </button>

        {/* Need Help */}
        <button
          onClick={() => setShowHelpPanel(true)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HelpCircle style={{ width: 16, height: 16, color: '#f87171' }} />
          </div>
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>NEED HELP?</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>See an instructor.</span>
        </button>

        {/* Kiosk Mode */}
        <button
          onClick={() => navigate('/settings/kiosk')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', padding: 0 }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>KIOSK MODE</span>
          <Settings style={{ width: 16, height: 16 }} />
        </button>
      </footer>

      {/* ══════════════════════════════════════════════════════════════════════
          OVERLAYS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Check-in search modal */}
      {mode === 'checkin-search' && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 100, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              margin: '0 16px',
              borderRadius: 28,
              padding: 28,
              background: '#111',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 24, textAlign: 'center', marginBottom: 16 }}>
              Search Your Name
            </div>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Start typing your name..."
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: 18,
                outline: 'none',
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
            />
            {searchQuery.length >= 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', marginBottom: 12 }}>
                {(searchResults.data || []).map((s: { id: number; firstName: string; lastName: string | null; program: string | null; beltRank: string | null }) => (
                  <button
                    key={s.id}
                    onClick={() => handleCheckIn(s.id, `${s.firstName} ${s.lastName || ''}`.trim(), s.program || 'General', s.beltRank)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: `${getBeltColor(s.beltRank)}33`,
                        border: `2px solid ${getBeltColor(s.beltRank)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {`${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>{s.firstName} {s.lastName}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{s.program || 'General'}</div>
                    </div>
                  </button>
                ))}
                {searchResults.data?.length === 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '16px 0', fontSize: 14 }}>
                    No students found
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => { setMode('active'); setSearchQuery(''); }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Help panel */}
      {showHelpPanel && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 100, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 400,
              margin: '0 16px',
              borderRadius: 28,
              padding: 28,
              background: '#111',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 24, textAlign: 'center', marginBottom: 6 }}>Need Help?</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 14, marginBottom: 20 }}>What can we help you with?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: "I'm new here", action: () => { setShowHelpPanel(false); navigate(`/kiosk/${orgId}/new-student`); } },
                { label: 'Book a free trial', action: () => { setShowHelpPanel(false); setShowTrialBooking(true); } },
                { label: 'What class should I take?', action: () => setShowHelpPanel(false) },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: 14,
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowHelpPanel(false)}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '12px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Trial booking modal */}
      {showTrialBooking && (
        <div
          className="fixed inset-0 flex items-center justify-center overflow-y-auto py-8"
          style={{ zIndex: 100, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
        >
          <KioskTrialBooking
            onBack={() => setShowTrialBooking(false)}
            onDone={() => setShowTrialBooking(false)}
          />
        </div>
      )}
    </div>
  );
}
