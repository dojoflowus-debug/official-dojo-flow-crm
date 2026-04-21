/**
 * KioskHome — DojoFlow Kiosk Home Screen
 *
 * Layout matches the design mockup:
 * ┌─────────────────────────────────────────────────────┐
 * │  LOGO + SCHOOL NAME              CLOCK (top-right)  │
 * ├──────────────────────────────┬──────────────────────┤
 * │  WELCOME / READY TO TRAIN    │  TODAY'S SCHEDULE    │
 * │  [TAP TO CHECK IN button]    │  DOJO LEADERBOARD    │
 * │  🔥 STREAK BAR               │                      │
 * │  [4 action icon cards]       │                      │
 * ├──────────────────────────────┴──────────────────────┤
 * │  TAP YOUR NAME TO CHECK IN (horizontal avatar row)  │
 * ├─────────────────────────────────────────────────────┤
 * │  Benefits strip (4 items)                           │
 * ├─────────────────────────────────────────────────────┤
 * │  ESPAÑOL  |  NEED HELP?  |  KIOSK MODE              │
 * └─────────────────────────────────────────────────────┘
 *
 * Modes: idle → active → confirmation (auto-return)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Gamepad2, ShoppingBag, Star, Lock, Settings,
  Globe, HelpCircle, Trophy, Calendar, Flame, ChevronRight,
  CheckCircle2, Clock, Users,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import KioskCheckInCelebration from '@/components/KioskCheckInCelebration';
import KioskTrialBooking from '@/components/KioskTrialBooking';
import { type KioskLang, t as kt, LANG_LABELS } from '@/lib/kioskI18n';

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
  black:  '#111111',
};

function getBeltColor(rank?: string | null): string {
  if (!rank) return BELT_RING.white;
  const key = rank.toLowerCase().replace(/\s+belt$/i, '').trim();
  return BELT_RING[key] || BELT_RING.white;
}

// ─── Class status helper ─────────────────────────────────────────────────────
function getClassStatus(startTime: string): 'in-progress' | 'up-next' | 'upcoming' {
  if (!startTime) return 'upcoming';
  const now = new Date();
  const [h, m] = startTime.replace(/[ap]m/i, '').split(':').map(Number);
  const isPM = /pm/i.test(startTime) && h !== 12;
  const isAM = /am/i.test(startTime) && h === 12;
  const hour = isPM ? h + 12 : isAM ? 0 : h;
  const classMinutes = hour * 60 + (m || 0);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const diff = classMinutes - nowMinutes;
  if (diff < 0 && diff > -60) return 'in-progress';
  if (diff >= 0 && diff <= 30) return 'up-next';
  return 'upcoming';
}

// ─── Particle background (fire/energy) ───────────────────────────────────────
function FireParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const particles: Array<{x:number;y:number;vx:number;vy:number;life:number;maxLife:number;size:number}> = [];
    function spawn() {
      particles.push({
        x: Math.random() * canvas!.width,
        y: canvas!.height + 10,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(Math.random() * 1.2 + 0.4),
        life: 0,
        maxLife: Math.random() * 120 + 60,
        size: Math.random() * 2 + 0.5,
      });
    }
    let frame = 0;
    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      if (frame % 3 === 0) spawn();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life > p.maxLife) { particles.splice(i, 1); continue; }
        const alpha = (1 - p.life / p.maxLife) * 0.35;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(239,68,68,${alpha})`;
        ctx!.fill();
      }
      frame++;
      requestAnimationFrame(animate);
    }
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ─── Main component ──────────────────────────────────────────────────────────
type KioskMode = 'idle' | 'active' | 'confirmation' | 'checkin-search';

export default function KioskHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const orgId = (user as any)?.activeOrgId || 1;

  // Mode
  const [mode, setMode] = useState<KioskMode>('active');
  const [lang, setLang] = useState<KioskLang>('en');
  const [now, setNow] = useState(new Date());
  const [showTrialBooking, setShowTrialBooking] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [celebStudent, setCelebStudent] = useState<{ name: string; beltRank?: string | null } | null>(null);
  const [confirmedStudent, setConfirmedStudent] = useState<{ name: string; program: string; beltRank?: string | null } | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Data
  const liveData = trpc.kiosk.getLiveKioskData.useQuery({ orgId }, { refetchInterval: 60_000 });
  const studentsQuery = trpc.kiosk.getStudentsForKiosk.useQuery({ orgId }, { refetchInterval: 120_000 });
  const searchResults = trpc.kiosk.searchStudentsByOrg.useQuery(
    { orgId, query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );
  const checkIn = trpc.kiosk.checkInStudentByOrg.useMutation();

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Idle reset
  const resetIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (mode === 'idle') setMode('active');
    idleTimer.current = setTimeout(() => setMode('idle'), 90_000);
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
      setConfirmedStudent({ name, program, beltRank });
      setMode('confirmation');
      setSearchQuery('');
    } catch (e) {
      console.error('Check-in failed', e);
    }
  }

  const school = liveData.data;
  const students = studentsQuery.data || [];
  const todayClasses = school?.todayClasses || [];
  const leaderboard = school?.leaderboard || [];

  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // ── IDLE MODE ──────────────────────────────────────────────────────────────
  if (mode === 'idle') {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer select-none"
        style={{ background: 'radial-gradient(ellipse at center, #1a0000 0%, #000 70%)' }}
        onClick={() => setMode('active')}
      >
        <FireParticles />
        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          {school?.logoUrl && (
            <img src={school.logoUrl} alt="logo" className="h-20 object-contain mb-2" />
          )}
          <div className="text-7xl font-black text-white tracking-tight" style={{ textShadow: '0 0 40px rgba(239,68,68,0.6)' }}>
            READY TO TRAIN?
          </div>
          <div className="text-2xl text-red-400 font-semibold tracking-widest uppercase animate-pulse">
            Tap anywhere to begin
          </div>
          <div className="text-white/40 text-xl mt-4">{timeStr}</div>
        </div>
      </div>
    );
  }

  // ── CONFIRMATION MODE ──────────────────────────────────────────────────────
  if (mode === 'confirmation' && confirmedStudent) {
    const beltColor = getBeltColor(confirmedStudent.beltRank);
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center select-none"
        style={{ background: 'radial-gradient(ellipse at center, #0a0a0a 0%, #000 100%)' }}
      >
        <FireParticles />
        {celebStudent && (
          <KioskCheckInCelebration
            studentName={celebStudent.name}
            beltRank={celebStudent.beltRank}
            onDismiss={() => { setMode('active'); setCelebStudent(null); setConfirmedStudent(null); }}
          />
        )}
      </div>
    );
  }

  // ── ACTIVE MODE ────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden select-none"
      style={{ background: '#0a0a0a', fontFamily: "'Inter', 'SF Pro Display', sans-serif" }}
    >
      <FireParticles />

      {/* ── TOP HEADER ── */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-4 pb-2 flex-shrink-0">
        {/* Logo + School Name */}
        <div className="flex items-center gap-3">
          {school?.logoUrl ? (
            <img src={school.logoUrl} alt="logo" className="h-12 object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}>
                <span className="text-white font-black text-lg">M</span>
              </div>
              <div>
                <div className="text-white font-black text-lg leading-none">MY<span className="text-red-500">DOJO</span></div>
                <div className="text-white/50 text-xs tracking-widest uppercase">Martial Arts</div>
              </div>
            </div>
          )}
          {school?.schoolName && school.logoUrl && (
            <div className="text-white font-bold text-lg ml-1">{school.schoolName}</div>
          )}
        </div>

        {/* Clock */}
        <div className="text-right">
          <div className="flex items-center gap-2 text-white/80">
            <Clock className="w-4 h-4 text-white/40" />
            <span className="text-2xl font-bold text-white">{timeStr}</span>
          </div>
          <div className="text-white/40 text-sm">{dateStr}</div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="relative z-10 flex flex-1 gap-4 px-6 pb-2 min-h-0">

        {/* ── LEFT PANEL ── */}
        <div className="flex flex-col flex-1 gap-3 min-w-0">

          {/* Welcome headline */}
          <div className="text-center">
            <div className="text-5xl font-black text-white tracking-tight leading-none" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
              WELCOME!
            </div>
            <div className="text-red-400 font-bold text-xl tracking-widest uppercase mt-1">READY TO TRAIN?</div>
            <div className="text-white/50 text-sm mt-0.5">Let's have a great class today!</div>
          </div>

          {/* TAP TO CHECK IN button */}
          <button
            onClick={() => setMode('checkin-search')}
            className="relative w-full rounded-2xl flex items-center justify-center gap-4 py-5 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              boxShadow: '0 0 40px rgba(220,38,38,0.5), 0 4px 20px rgba(0,0,0,0.5)',
              border: '2px solid rgba(239,68,68,0.4)',
            }}
          >
            <div className="w-12 h-12 rounded-full border-2 border-white/80 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-black text-white tracking-wider uppercase">
              TAP TO CHECK IN
            </span>
            <ChevronRight className="w-6 h-6 text-white/60" />
            {/* Animated chevrons */}
            <div className="absolute left-4 flex gap-1 opacity-40">
              <ChevronRight className="w-5 h-5 text-white" />
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
            <div className="absolute right-16 flex gap-1 opacity-40">
              <ChevronRight className="w-5 h-5 text-white" />
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Streak bar */}
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Flame className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <span className="text-orange-400 font-black text-sm">5 DAY STREAK</span>
            <span className="text-white/40 text-sm flex-1">Keep it up!</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <span key={i} className="text-lg">🔥</span>
              ))}
            </div>
          </div>

          {/* 4 Action icon cards */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'BOOK A\nFREE TRIAL', icon: <Users className="w-7 h-7" />, color: '#7c3aed', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.3)', action: () => setShowTrialBooking(true) },
              { label: 'ENROLL\nNOW', icon: <UserPlus className="w-7 h-7" />, color: '#16a34a', bg: 'rgba(22,163,74,0.15)', border: 'rgba(22,163,74,0.3)', action: () => navigate(`/kiosk/${orgId}/new-student`) },
              { label: 'PRO\nSHOP', icon: <ShoppingBag className="w-7 h-7" />, color: '#b45309', bg: 'rgba(180,83,9,0.15)', border: 'rgba(180,83,9,0.3)', action: () => {} },
              { label: 'ARCADE\nGAMES', icon: <Gamepad2 className="w-7 h-7" />, color: '#0284c7', bg: 'rgba(2,132,199,0.15)', border: 'rgba(2,132,199,0.3)', action: () => navigate('/kiosk-arcade') },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl"
                style={{ background: item.bg, border: `1px solid ${item.border}`, color: item.color }}
              >
                {item.icon}
                <span className="text-xs font-black text-white text-center leading-tight whitespace-pre-line tracking-wide uppercase">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex flex-col gap-3 w-72 flex-shrink-0">

          {/* Today's Schedule */}
          <div
            className="rounded-2xl p-4 flex-1"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-400" />
                <span className="text-white font-black text-sm uppercase tracking-wider">Today's Schedule</span>
              </div>
              <span className="text-white/40 text-xs">View All</span>
            </div>
            <div className="flex flex-col gap-2">
              {todayClasses.length === 0 ? (
                <div className="text-white/30 text-sm text-center py-4">No classes today</div>
              ) : (
                todayClasses.slice(0, 5).map((cls: { startTime: string; name: string; instructor: string }, i: number) => {
                  const status = getClassStatus(cls.startTime);
                  return (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex-shrink-0 text-white/50 text-xs w-14">{cls.startTime || '—'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{cls.name}</div>
                        <div className="text-white/40 text-xs truncate">{cls.instructor}</div>
                      </div>
                      {status === 'in-progress' && (
                        <span className="text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#16a34a', color: '#fff' }}>IN PROGRESS</span>
                      )}
                      {status === 'up-next' && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>UP NEXT</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Dojo Leaderboard */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-black text-sm uppercase tracking-wider">Dojo Leaderboard</span>
            </div>
            <div className="text-white/30 text-xs mb-2">This Month</div>
            <div className="flex flex-col gap-2">
              {leaderboard.length === 0 ? (
                <div className="text-white/30 text-sm text-center py-2">No data yet</div>
              ) : (
                leaderboard.slice(0, 4).map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                    style={{
                      background: i === 0 ? 'rgba(234,179,8,0.1)' : i === 1 ? 'rgba(156,163,175,0.08)' : i === 2 ? 'rgba(180,83,9,0.08)' : 'rgba(239,68,68,0.08)',
                      border: i === 0 ? '1px solid rgba(234,179,8,0.2)' : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{ background: i === 0 ? '#ca8a04' : i === 1 ? '#6b7280' : i === 2 ? '#b45309' : '#dc2626', color: '#fff' }}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-white text-sm font-semibold truncate">{entry.name}</span>
                    <span className="text-white/50 text-xs flex-shrink-0">{entry.streak} Classes</span>
                    <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
            {leaderboard.length > 0 && (
              <div className="text-white/30 text-xs text-center mt-2">Keep training. Keep climbing!</div>
            )}
          </div>
        </div>
      </div>

      {/* ── STUDENT AVATAR ROW ── */}
      <div
        className="relative z-10 mx-6 mb-2 rounded-2xl px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-red-400" />
          <span className="text-white font-black text-sm uppercase tracking-wider">Tap Your Name to Check In</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {students.slice(0, 10).map((s: { id: number; firstName: string; lastName: string | null; program: string; beltRank: string | null; photoUrl: string | null; attendanceCount: number }) => {
            const beltColor = getBeltColor(s.beltRank);
            const initials = `${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`.toUpperCase();
            return (
              <button
                key={s.id}
                onClick={() => handleCheckIn(s.id, `${s.firstName} ${s.lastName || ''}`.trim(), s.program, s.beltRank)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
                style={{ minWidth: 72 }}
              >
                <div
                  className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ border: `3px solid ${beltColor}`, boxShadow: `0 0 12px ${beltColor}55` }}
                >
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt={s.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-black text-xl"
                      style={{ background: `linear-gradient(135deg, ${beltColor}33, ${beltColor}11)` }}>
                      {initials}
                    </div>
                  )}
                </div>
                <span className="text-white text-xs font-bold text-center leading-tight max-w-[72px] truncate">{s.firstName}</span>
                <span className="text-white/40 text-xs text-center leading-tight max-w-[72px] truncate">{s.program}</span>
                {/* Belt icon placeholder */}
                <div className="flex gap-0.5">
                  {[0,1,2].map(j => (
                    <div key={j} className="w-3 h-1 rounded-full" style={{ background: j === 1 ? beltColor : `${beltColor}44` }} />
                  ))}
                </div>
              </button>
            );
          })}

          {/* Not Listed? */}
          <button
            onClick={() => setMode('checkin-search')}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
            style={{ minWidth: 80 }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)' }}
            >
              <Users className="w-7 h-7 text-white/30" />
            </div>
            <span className="text-white/50 text-xs font-bold text-center leading-tight">NOT LISTED?</span>
            <span className="text-red-400 text-xs font-bold text-center leading-tight">TAP HERE</span>
            <span className="text-white/30 text-xs text-center leading-tight">to check in</span>
          </button>
        </div>
      </div>

      {/* ── BENEFITS STRIP ── */}
      <div
        className="relative z-10 mx-6 mb-2 rounded-2xl px-4 py-2.5 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <Star className="w-5 h-5" />, color: '#dc2626', title: 'EARN REWARDS', desc: 'Check in, earn points, get rewards!' },
            { icon: <Trophy className="w-5 h-5" />, color: '#b45309', title: 'TRACK PROGRESS', desc: 'See your growth and achievements.' },
            { icon: <Calendar className="w-5 h-5" />, color: '#16a34a', title: 'STAY CONSISTENT', desc: 'Build habits that build champions.' },
            { icon: <Users className="w-5 h-5" />, color: '#0284c7', title: 'WE ARE FAMILY', desc: 'Train together. Grow together.' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}22`, color: item.color }}>
                {item.icon}
              </div>
              <div>
                <div className="text-white text-xs font-black leading-tight">{item.title}</div>
                <div className="text-white/40 text-xs leading-tight">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM FOOTER ── */}
      <div
        className="relative z-10 mx-6 mb-4 rounded-2xl px-4 py-2 flex items-center justify-between flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Language toggle */}
        <button
          onClick={() => setLang(l => l === 'en' ? 'es' : 'en')}
          className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm font-semibold uppercase tracking-wider">
            {lang === 'en' ? 'ESPAÑOL' : 'ENGLISH'}
          </span>
        </button>

        {/* Need Help */}
        <button
          onClick={() => setShowHelpPanel(true)}
          className="flex flex-col items-center gap-0.5"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}>
            <HelpCircle className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-white font-black text-xs">NEED HELP?</span>
          <span className="text-white/40 text-xs">See an instructor.</span>
        </button>

        {/* Kiosk Mode */}
        <button
          onClick={() => navigate('/kiosk-settings')}
          className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors"
        >
          <span className="text-sm font-semibold uppercase tracking-wider">KIOSK MODE</span>
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* ── CHECK-IN SEARCH MODAL ── */}
      {mode === 'checkin-search' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div
            className="w-full max-w-lg mx-4 rounded-3xl p-6"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="text-white font-black text-2xl text-center mb-4">Search Your Name</div>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Start typing your name..."
              className="w-full px-4 py-3 rounded-xl text-white text-lg bg-white/10 border border-white/20 outline-none focus:border-red-500 mb-4"
            />
            {searchQuery.length >= 2 && (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {(searchResults.data || []).map((s: { id: number; firstName: string; lastName: string | null; program: string | null; beltRank: string | null }) => (
                  <button
                    key={s.id}
                    onClick={() => handleCheckIn(s.id, `${s.firstName} ${s.lastName || ''}`.trim(), s.program || 'General', s.beltRank)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black flex-shrink-0"
                      style={{ background: `${getBeltColor(s.beltRank)}33`, border: `2px solid ${getBeltColor(s.beltRank)}` }}
                    >
                      {`${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{s.firstName} {s.lastName}</div>
                      <div className="text-white/40 text-sm">{s.program || 'General'}</div>
                    </div>
                  </button>
                ))}
                {searchResults.data?.length === 0 && (
                  <div className="text-white/40 text-center py-4">No students found</div>
                )}
              </div>
            )}
            <button
              onClick={() => { setMode('active'); setSearchQuery(''); }}
              className="w-full mt-4 py-3 rounded-xl text-white/60 font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── HELP PANEL ── */}
      {showHelpPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
          <div
            className="w-full max-w-sm mx-4 rounded-3xl p-6"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="text-white font-black text-2xl text-center mb-2">Need Help?</div>
            <div className="text-white/50 text-center text-sm mb-6">What can we help you with?</div>
            <div className="flex flex-col gap-3">
              {[
                { label: "I'm new here", action: () => { setShowHelpPanel(false); navigate(`/kiosk/${orgId}/new-student`); } },
                { label: 'Book a free trial', action: () => { setShowHelpPanel(false); setShowTrialBooking(true); } },
                { label: 'What class should I take?', action: () => setShowHelpPanel(false) },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="w-full py-4 rounded-xl text-white font-bold text-lg"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowHelpPanel(false)}
              className="w-full mt-4 py-3 rounded-xl text-white/50 font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── TRIAL BOOKING MODAL ── */}
      {showTrialBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md overflow-y-auto py-8">
          <KioskTrialBooking onBack={() => setShowTrialBooking(false)} onDone={() => setShowTrialBooking(false)} />
        </div>
      )}
    </div>
  );
}
