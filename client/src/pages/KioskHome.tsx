/**
 * KioskHome — DojoFlow Kiosk Live Screen (CINEMATIC EDITION)
 *
 * Full-screen kiosk with:
 *   - Canvas-based fire/ember particle system
 *   - Pulsing animated TAP TO CHECK IN CTA
 *   - Glassmorphism cards with glow borders
 *   - Dramatic typography with text glow
 *   - Intense crimson/ember color palette
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Flame, Users, Clock, Star, Gamepad2, Ticket, UserPlus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(t: string): string {
  if (!t) return '';
  if (t.includes(' ')) return t;
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h)) return t;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function minutesUntil(startTime: string): number {
  if (!startTime) return 0;
  const now = new Date();
  const [h, m] = startTime.split(':').map(Number);
  if (isNaN(h)) return 0;
  const classMinutes = h * 60 + (m || 0);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return Math.max(0, classMinutes - nowMinutes);
}

function initials(name: string): string {
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706',
  '#db2777', '#0891b2', '#4f46e5', '#e11d48',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Fire Canvas ─────────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  type: 'ember' | 'spark' | 'smoke';
}

function FireCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function spawnParticle() {
      if (!canvas) return;
      const rand = Math.random();
      const type: Particle['type'] = rand < 0.6 ? 'ember' : rand < 0.8 ? 'spark' : 'smoke';
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 2.5 + 1.5),
        life: 0,
        maxLife: type === 'smoke' ? 120 + Math.random() * 80 : 60 + Math.random() * 60,
        size: type === 'smoke' ? 40 + Math.random() * 60 : 2 + Math.random() * 4,
        type,
      });
    }

    let frame = 0;
    function animate() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      frame++;
      if (frame % 2 === 0) spawnParticle();
      if (frame % 8 === 0) spawnParticle();

      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);

      for (const p of particlesRef.current) {
        p.life++;
        p.x += p.vx + Math.sin(p.life * 0.05) * 0.3;
        p.y += p.vy;
        p.vy *= 0.99;

        const progress = p.life / p.maxLife;
        const alpha = Math.sin(progress * Math.PI) * (p.type === 'smoke' ? 0.06 : 0.7);

        if (p.type === 'ember') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - progress * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,${Math.round(100 * (1 - progress))},0,${alpha})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = `rgba(255,80,0,${alpha * 0.8})`;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (p.type === 'spark') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,200,50,${alpha * 1.2})`;
          ctx.shadowBlur = 6;
          ctx.shadowColor = `rgba(255,200,0,${alpha})`;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `rgba(80,0,0,${alpha})`);
          grad.addColorStop(1, `rgba(0,0,0,0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    animate();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
}

// ─── Check-in modal ──────────────────────────────────────────────────────────

interface CheckInModalProps {
  orgId: number;
  onClose: () => void;
}

function CheckInModal({ orgId, onClose }: CheckInModalProps) {
  const [query, setQuery] = useState('');
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchQuery = trpc.kiosk.searchStudentsByOrg.useQuery(
    { orgId, query },
    { enabled: query.length >= 2 }
  );
  const checkIn = trpc.kiosk.checkInStudentByOrg.useMutation();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleCheckIn(studentId: number, name: string) {
    try {
      await checkIn.mutateAsync({ orgId, studentId });
      setConfirmed(name);
      setTimeout(onClose, 3000);
    } catch {
      // ignore
    }
  }

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
        <div className="text-center">
          <div className="text-9xl mb-6">🥋</div>
          <h2
            className="text-7xl font-black text-white mb-4 uppercase tracking-widest"
            style={{ textShadow: '0 0 40px rgba(220,38,38,0.8), 0 0 80px rgba(220,38,38,0.4)' }}
          >
            CHECKED IN!
          </h2>
          <p className="text-4xl text-red-400 font-black mb-3">{confirmed}</p>
          <p className="text-xl text-white/50 mt-4 tracking-wider">Train hard. See you on the mat! 🔥</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-3xl p-8 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(30,0,0,0.95) 0%, rgba(10,0,0,0.98) 100%)',
          border: '1px solid rgba(220,38,38,0.4)',
          boxShadow: '0 0 60px rgba(220,38,38,0.2), 0 25px 50px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2
          className="text-4xl font-black text-white text-center mb-6 uppercase tracking-widest"
          style={{ textShadow: '0 0 20px rgba(220,38,38,0.6)' }}
        >
          WHO'S CHECKING IN?
        </h2>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type your name..."
          className="w-full rounded-2xl px-5 py-4 text-white text-xl placeholder-gray-600 focus:outline-none mb-4"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(220,38,38,0.3)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
          }}
        />
        {searchQuery.isLoading && (
          <p className="text-gray-500 text-center py-4 tracking-wider">Searching...</p>
        )}
        {searchQuery.data && searchQuery.data.length === 0 && query.length >= 2 && (
          <p className="text-gray-500 text-center py-4">No students found</p>
        )}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {((searchQuery.data as any[]) || []).map((s: any) => (
            <button
              key={s.id}
              onClick={() => handleCheckIn(s.id, `${s.firstName} ${s.lastName || ''}`.trim())}
              className="w-full flex items-center gap-4 rounded-2xl px-5 py-3 transition-all active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                style={{ background: avatarColor(`${s.firstName} ${s.lastName}`) }}
              >
                {initials(`${s.firstName} ${s.lastName || ''}`)}
              </div>
              <div className="text-left">
                <p className="text-white font-bold">{s.firstName} {s.lastName}</p>
                {s.program && <p className="text-gray-500 text-sm">{s.program}</p>}
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-2xl text-gray-500 hover:text-gray-300 transition-all tracking-widest text-sm uppercase font-bold"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function KioskHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const orgId = (user as any)?.activeOrgId || 1;
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [now, setNow] = useState(new Date());
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const liveData = trpc.kiosk.getLiveKioskData.useQuery(
    { orgId },
    { refetchInterval: 60_000 }
  );

  const featureFlagsQuery = trpc.kiosk.getKioskFeatureFlags.useQuery(
    { orgId },
    { refetchInterval: 30_000 }
  );

  const flags = featureFlagsQuery.data ?? {
    showLockButton: true,
    showArcadeGames: true,
    showDayPass: true,
    showEnrollNow: true,
    showNewStudents: true,
    showClassSchedule: true,
    showAttendanceLeaderboard: true,
    showBeltPromotion: true,
  };

  const data = liveData.data as any;
  const todayClasses: any[] = data?.todayClasses || [];
  const newStudents: any[] = data?.newStudents || [];
  const leaderboard: any[] = data?.leaderboard || [];
  const logoUrl: string | undefined = data?.logoUrl;
  const schoolName: string | undefined = data?.schoolName;

  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div
      className="min-h-screen w-full overflow-y-auto text-white relative select-none"
      style={{
        background: 'radial-gradient(ellipse at 50% -10%, #4a0000 0%, #1f0000 30%, #0d0000 60%, #000000 100%)',
      }}
    >
      <FireCanvas />

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)' }}
      />

      {/* Top glow */}
      <div
        className="fixed top-0 left-0 right-0 h-64 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(180,0,0,0.25) 0%, transparent 70%)' }}
      />

      {/* ── 2-column layout wrapper ── */}
      <div className="relative z-10 flex min-h-screen">

      {/* ── LEFT COLUMN: main content ── */}
      <div className="flex-1 px-6 py-8 pb-24 overflow-y-auto" style={{ minWidth: 0 }}>

        {/* ── Hero ── */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-5">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #dc2626, #f97316, #dc2626, #7f1d1d, #dc2626)',
                animation: 'spin 8s linear infinite',
                filter: 'blur(2px)',
              }}
            />
            <div
              className="absolute inset-1 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: 'radial-gradient(circle, #1a0000 0%, #000000 100%)',
                border: '1px solid rgba(220,38,38,0.3)',
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={schoolName || 'Dojo Logo'}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Flame
                  className="w-10 h-10 text-red-500"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(220,38,38,0.8))' }}
                />
              )}
            </div>
          </div>

          <h1
            className="text-6xl sm:text-7xl font-black tracking-tight uppercase mb-2"
            style={{
              textShadow: '0 0 30px rgba(220,38,38,0.7), 0 0 60px rgba(220,38,38,0.3), 0 4px 20px rgba(0,0,0,0.8)',
              letterSpacing: '-0.02em',
            }}
          >
            READY TO TRAIN 👊
          </h1>
          <p
            className="text-gray-300 mt-2 text-lg tracking-widest uppercase font-semibold"
            style={{ textShadow: '0 0 10px rgba(220,38,38,0.3)' }}
          >
            Tap or Scan to Begin
          </p>
          <p className="text-gray-600 text-sm mt-1 tracking-wider">{dateStr} · {timeStr}</p>
        </div>

        {/* ── New Students ── */}
        {flags.showNewStudents && newStudents.length > 0 && (
          <div
            className="mb-5 rounded-3xl p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(88,28,135,0.25) 0%, rgba(30,0,60,0.3) 100%)',
              border: '1px solid rgba(147,51,234,0.3)',
              boxShadow: '0 0 30px rgba(147,51,234,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" style={{ filter: 'drop-shadow(0 0 6px rgba(250,204,21,0.6))' }} />
              <span className="font-black text-white text-sm tracking-widest uppercase">Welcome New Students!</span>
            </div>
            <p className="text-gray-500 text-xs mb-3 tracking-wide">We're excited to have you here for your first lesson</p>
            <div className="space-y-2">
              {newStudents.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl px-4 py-3"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs"
                      style={{ background: avatarColor(s.name), boxShadow: `0 0 12px ${avatarColor(s.name)}60` }}
                    >
                      {initials(s.name)}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{s.name}</p>
                      <p className="text-gray-500 text-xs">{s.program}{s.time ? ` · ${s.time}` : ''}</p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', boxShadow: '0 0 12px rgba(245,158,11,0.4)' }}
                  >
                    NEW
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Primary CTA ── */}
        <button
          onClick={() => setShowCheckIn(true)}
          className="w-full mb-4 rounded-2xl font-black text-3xl tracking-widest uppercase transition-all active:scale-95"
          style={{
            padding: '28px 20px',
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
            boxShadow: pulse
              ? '0 0 80px rgba(220,38,38,0.9), 0 0 40px rgba(220,38,38,0.7), 0 20px 40px rgba(0,0,0,0.6)'
              : '0 0 40px rgba(220,38,38,0.5), 0 0 20px rgba(220,38,38,0.3), 0 15px 30px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,100,100,0.3)',
            transform: pulse ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            letterSpacing: '0.1em',
          }}
        >
          🔥 TAP TO CHECK IN 🔥
        </button>

        {/* ── Action buttons ── */}
        {(flags.showDayPass || flags.showEnrollNow || flags.showArcadeGames) && (
          <div className="space-y-2 mb-5">
            {flags.showDayPass && (
              <button
                className="w-full flex items-center justify-between rounded-2xl px-5 py-4 transition-all active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.2)' }}>
                    <Ticket className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="font-black text-white uppercase tracking-wider text-sm">Buy a Day Pass</span>
                </div>
                <span className="text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Walk-ins Welcome
                </span>
              </button>
            )}

            {flags.showEnrollNow && (
              <button
                onClick={() => navigate('/login?tab=signup')}
                className="w-full flex items-center justify-between rounded-2xl px-5 py-4 transition-all active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.2)' }}>
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="font-black text-white uppercase tracking-wider text-sm">Enroll Now</span>
                </div>
                <span className="text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', boxShadow: '0 0 12px rgba(5,150,105,0.4)' }}>
                  Start Today
                </span>
              </button>
            )}

            {flags.showArcadeGames && (
              <button
                onClick={() => navigate('/arcade')}
                className="w-full flex items-center justify-between rounded-2xl px-5 py-4 transition-all active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(147,51,234,0.2)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.2)' }}>
                    <Gamepad2 className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="font-black text-white uppercase tracking-wider text-sm">Play Arcade Games</span>
                </div>
                <span className="text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', boxShadow: '0 0 12px rgba(124,58,237,0.4)' }}>
                  4 Games
                </span>
              </button>
            )}
          </div>
        )}

        <p className="text-center text-xs mb-6 tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Check-in opens 15 minutes before class
        </p>

      </div>{/* end LEFT COLUMN */}

      {/* ── RIGHT COLUMN: schedule + leaderboard ── */}
      <div
        className="flex-shrink-0 overflow-y-auto py-8 px-4"
        style={{
          width: '320px',
          borderLeft: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Today's Schedule */}
        {flags.showClassSchedule && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-red-500" style={{ filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.8))' }} />
              <span className="font-black text-white text-sm tracking-widest uppercase" style={{ textShadow: '0 0 10px rgba(220,38,38,0.4)' }}>Today's Schedule</span>
            </div>
            <div className="space-y-2">
              {todayClasses.length === 0 && (
                <div className="rounded-2xl px-4 py-4 text-sm" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }}>
                  No classes scheduled today
                </div>
              )}
              {todayClasses.map((c: any) => {
                const mins = minutesUntil(c.startTime);
                const isNow = mins === 0;
                const isNext = !isNow && mins <= 60;
                return (
                  <div key={c.id} className="rounded-2xl px-4 py-3" style={{
                    background: isNow ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.03)',
                    border: isNow ? '1px solid rgba(220,38,38,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(10px)',
                  }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-black text-white text-sm uppercase truncate">{c.name}</p>
                        <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 flex-shrink-0" /> {c.instructor}
                        </p>
                        <p className="text-gray-600 text-xs flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {formatTime(c.startTime)}{c.endTime ? ` – ${formatTime(c.endTime)}` : ''}
                        </p>
                      </div>
                      <span
                        className="flex-shrink-0 text-xs font-black px-2 py-1 rounded-full whitespace-nowrap uppercase tracking-wider"
                        style={isNow
                          ? { background: 'rgba(220,38,38,0.9)', color: '#fff', boxShadow: '0 0 10px rgba(220,38,38,0.5)' }
                          : isNext
                          ? { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }
                          : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }
                        }
                      >
                        {isNow ? 'IN PROGRESS' : isNext ? 'UP NEXT' : formatTime(c.startTime)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {flags.showAttendanceLeaderboard && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-yellow-400" style={{ filter: 'drop-shadow(0 0 6px rgba(250,204,21,0.8))' }} />
              <span className="font-black text-white text-sm tracking-widest uppercase" style={{ textShadow: '0 0 10px rgba(250,204,21,0.3)' }}>Dojo Leaderboard</span>
              <span className="text-gray-600 text-xs ml-auto tracking-wider">This Month</span>
            </div>
            <div className="space-y-1">
              {leaderboard.length === 0 && (
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>No attendance data yet</p>
              )}
              {leaderboard.slice(0, 5).map((s: any, i: number) => (
                <div
                  key={s.studentId}
                  className="flex items-center gap-3 rounded-xl px-3 py-2"
                  style={{
                    background: i === 0 ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.02)',
                    border: i === 0 ? '1px solid rgba(220,38,38,0.25)' : '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={i === 0
                      ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', boxShadow: '0 0 10px rgba(245,158,11,0.4)' }
                      : i === 1
                      ? { background: 'rgba(156,163,175,0.3)', color: '#d1d5db' }
                      : i === 2
                      ? { background: 'rgba(180,120,60,0.3)', color: '#d97706' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
                    }
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{s.name}</p>
                  </div>
                  <span className="text-xs font-black flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {s.streak} Classes <Flame className="w-3 h-3 text-red-400" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>{/* end RIGHT COLUMN */}

      </div>{/* end 2-column wrapper */}

      {/* Lock */}
      {flags.showLockButton && (
        <button
          onClick={() => navigate('/kiosk-studio')}
          className="fixed bottom-6 right-6 z-20 flex flex-col items-center gap-1 transition-all"
          style={{ color: 'rgba(255,255,255,0.15)' }}
          title="Lock kiosk"
        >
          <Lock className="w-5 h-5" />
          <span className="text-xs tracking-widest uppercase">LOCK</span>
        </button>
      )}

      {showCheckIn && (
        <CheckInModal orgId={orgId} onClose={() => setShowCheckIn(false)} />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
