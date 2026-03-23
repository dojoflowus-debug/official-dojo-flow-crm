/**
 * KioskHome — DojoFlow Kiosk Live Screen
 *
 * Full-screen kiosk display modelled after the MyDojo check-in experience.
 * Layout:
 *   - Dark fiery background (CSS gradient + animated particles)
 *   - Dojo logo + "READY TO TRAIN 👊" hero
 *   - New Students welcome panel (leads from last 7 days)
 *   - 🔥 TAP TO CHECK IN 🔥  (primary CTA)
 *   - Secondary action buttons: Buy a Day Pass, Enroll Now, Play Arcade Games
 *   - Bottom 2-col: Today's Classes (left) + Perfect Attendance / Runner Up (right)
 *   - Lock button (bottom-right)
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Flame, Users, Clock, MapPin, Trophy, Star, Gamepad2, Ticket, UserPlus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(t: string): string {
  if (!t) return '';
  // already formatted like "10:00 AM"
  if (t.includes(' ')) return t;
  // HH:MM 24h
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
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-purple-600', 'bg-blue-600', 'bg-green-600', 'bg-orange-600',
  'bg-pink-600', 'bg-teal-600', 'bg-indigo-600', 'bg-rose-600',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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
      setTimeout(onClose, 2500);
    } catch {
      // ignore
    }
  }

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="text-center">
          <div className="text-8xl mb-6">🥋</div>
          <h2 className="text-5xl font-black text-white mb-3">CHECKED IN!</h2>
          <p className="text-3xl text-red-400 font-bold">{confirmed}</p>
          <p className="text-xl text-white/60 mt-4">Train hard. See you on the mat!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gray-900 border border-red-800/50 rounded-3xl p-8 w-full max-w-lg mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-3xl font-black text-white text-center mb-6">WHO'S CHECKING IN?</h2>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type your name..."
          className="w-full bg-gray-800 border border-gray-600 rounded-2xl px-5 py-4 text-white text-xl placeholder-gray-500 focus:outline-none focus:border-red-500 mb-4"
        />
        {searchQuery.isLoading && (
          <p className="text-gray-400 text-center py-4">Searching...</p>
        )}
        {searchQuery.data && searchQuery.data.length === 0 && query.length >= 2 && (
          <p className="text-gray-400 text-center py-4">No students found</p>
        )}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {(searchQuery.data || []).map((s: any) => (
            <button
              key={s.id}
              onClick={() => handleCheckIn(s.id, `${s.firstName} ${s.lastName || ''}`.trim())}
              className="w-full flex items-center gap-4 bg-gray-800 hover:bg-red-900/40 border border-gray-700 hover:border-red-600 rounded-2xl px-5 py-3 transition-all"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${avatarColor(`${s.firstName} ${s.lastName}`)}`}>
                {initials(`${s.firstName} ${s.lastName || ''}`)}
              </div>
              <div className="text-left">
                <p className="text-white font-bold">{s.firstName} {s.lastName}</p>
                {s.program && <p className="text-gray-400 text-sm">{s.program}</p>}
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-2xl border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-all"
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
  const orgId = user?.activeOrgId || 1;
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [now, setNow] = useState(new Date());

  // Refresh clock every minute
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const liveData = trpc.kiosk.getLiveKioskData.useQuery(
    { orgId },
    { refetchInterval: 60_000 }
  );

  const { todayClasses = [], newStudents = [], leaderboard = [], logoUrl, schoolName } = liveData.data || {};

  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen w-full overflow-y-auto text-white relative select-none"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, #3d0000 0%, #1a0000 40%, #0a0000 100%)',
      }}
    >
      {/* Animated fire particles overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-pulse"
            style={{
              width: `${60 + i * 20}px`,
              height: `${60 + i * 20}px`,
              background: `radial-gradient(circle, rgba(220,38,38,0.6) 0%, transparent 70%)`,
              left: `${(i * 8.3) % 100}%`,
              top: `${(i * 13.7) % 100}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 pb-24">

        {/* ── Hero ── */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-black border-2 border-red-700 flex items-center justify-center shadow-lg shadow-red-900/50 overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={schoolName || 'Dojo Logo'}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
                }}
              />
            ) : null}
            <div
              className="w-full h-full items-center justify-center"
              style={{ display: logoUrl ? 'none' : 'flex' }}
            >
              <Flame className="w-10 h-10 text-red-500" />
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight uppercase drop-shadow-lg">
            READY TO TRAIN 👊
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Tap or Scan to Begin</p>
          <p className="text-gray-500 text-sm mt-1">{dateStr} · {timeStr}</p>
        </div>

        {/* ── New Students panel ── */}
        {newStudents.length > 0 && (
          <div className="mb-4 rounded-2xl border border-purple-700/40 bg-purple-900/20 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-black text-white text-sm tracking-widest uppercase">Welcome New Students!</span>
            </div>
            <p className="text-gray-400 text-xs mb-3">We're excited to have you here for your first lesson</p>
            <div className="space-y-2">
              {newStudents.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between bg-black/30 rounded-xl px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${avatarColor(s.name)}`}>
                      {initials(s.name)}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{s.name}</p>
                      <p className="text-gray-400 text-xs">{s.program}{s.time ? ` · ${s.time}` : ''}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-yellow-400 text-black px-2 py-0.5 rounded-full">NEW STUDENT</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Primary CTA ── */}
        <button
          onClick={() => setShowCheckIn(true)}
          className="w-full mb-3 py-6 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 active:scale-95 transition-all shadow-xl shadow-red-900/60 text-white font-black text-3xl tracking-widest uppercase"
        >
          🔥 TAP TO CHECK IN 🔥
        </button>

        {/* ── Secondary action buttons ── */}
        <div className="space-y-2 mb-4">
          <button className="w-full flex items-center justify-between bg-gray-900/70 hover:bg-gray-800/80 border border-gray-700 rounded-2xl px-5 py-4 transition-all active:scale-95">
            <div className="flex items-center gap-3">
              <Ticket className="w-5 h-5 text-gray-300" />
              <span className="font-black text-white uppercase tracking-wider text-sm">Buy a Day Pass</span>
            </div>
            <span className="text-xs font-bold bg-gray-700 text-gray-200 px-3 py-1 rounded-full">Walk-ins Welcome</span>
          </button>

          <button
            onClick={() => navigate('/login?tab=signup')}
            className="w-full flex items-center justify-between bg-gray-900/70 hover:bg-gray-800/80 border border-gray-700 rounded-2xl px-5 py-4 transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-gray-300" />
              <span className="font-black text-white uppercase tracking-wider text-sm">Enroll Now</span>
            </div>
            <span className="text-xs font-bold bg-green-700 text-green-100 px-3 py-1 rounded-full">Start Today</span>
          </button>

          <button
            onClick={() => navigate('/arcade')}
            className="w-full flex items-center justify-between bg-gray-900/70 hover:bg-gray-800/80 border border-purple-800/50 rounded-2xl px-5 py-4 transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-5 h-5 text-purple-400" />
              <span className="font-black text-white uppercase tracking-wider text-sm">Play Arcade Games</span>
            </div>
            <span className="text-xs font-bold bg-purple-700 text-purple-100 px-3 py-1 rounded-full">4 Games</span>
          </button>
        </div>

        <p className="text-center text-gray-500 text-xs mb-6">Check-in opens 15 minutes before class.</p>

        {/* ── Bottom 2-col ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Today's Classes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-red-500" />
              <span className="font-black text-white text-sm tracking-widest uppercase">Top Warriors</span>
              <span className="text-gray-500 text-xs ml-1">Current Begin</span>
            </div>
            <div className="space-y-2">
              {todayClasses.length === 0 && (
                <div className="bg-black/40 rounded-xl px-4 py-3 text-gray-500 text-sm">No classes scheduled today</div>
              )}
              {todayClasses.map((c: any) => {
                const mins = minutesUntil(c.startTime);
                return (
                  <div key={c.id} className="bg-black/50 border border-gray-800 rounded-xl px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-black text-white text-sm uppercase truncate">{c.name}</p>
                        <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 flex-shrink-0" /> {c.instructor}
                        </p>
                        <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {formatTime(c.startTime)}{c.endTime ? ` - ${formatTime(c.endTime)}` : ''}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${mins === 0 ? 'bg-red-700 text-white' : 'bg-gray-700 text-gray-200'}`}>
                        Opens in {mins}m
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaderboard + Runner Up */}
          <div className="space-y-4">
            {/* Perfect Attendance */}
            <div className="bg-black/50 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-red-500" />
                <span className="font-black text-white text-sm tracking-widest uppercase">Perfect Attendance</span>
              </div>
              {leaderboard.length === 0 && (
                <p className="text-gray-500 text-sm">No attendance data yet</p>
              )}
              {leaderboard.slice(0, 3).map((s: any, i: number) => (
                <div key={s.studentId} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{s.name}</p>
                    <p className="text-gray-400 text-xs">{s.streak} Classes Straight</p>
                  </div>
                  {i === 0 && <Flame className="w-4 h-4 text-red-500 flex-shrink-0" />}
                </div>
              ))}
            </div>

            {/* Runner Up for Next Belt */}
            <div className="bg-black/50 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-black text-white text-sm tracking-widest uppercase">Runner Up for Next Belt</span>
              </div>
              <p className="text-gray-500 text-sm">No students close to promotion yet</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lock button ── */}
      <button
        onClick={() => navigate('/kiosk-studio')}
        className="fixed bottom-6 right-6 z-20 flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors"
        title="Lock kiosk"
      >
        <Lock className="w-5 h-5" />
        <span className="text-xs">LOCK</span>
      </button>

      {/* ── Check-in modal ── */}
      {showCheckIn && (
        <CheckInModal orgId={orgId} onClose={() => setShowCheckIn(false)} />
      )}
    </div>
  );
}
