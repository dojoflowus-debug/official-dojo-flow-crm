/**
 * KioskAnalytics — Kiosk Analytics Dashboard
 * Shows check-ins per day, kiosk leads, peak hours, and conversion metrics.
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, TrendingUp, Clock, Star } from 'lucide-react';

const HOUR_LABELS: Record<number, string> = {
  0: '12am', 1: '1am', 2: '2am', 3: '3am', 4: '4am', 5: '5am',
  6: '6am', 7: '7am', 8: '8am', 9: '9am', 10: '10am', 11: '11am',
  12: '12pm', 13: '1pm', 14: '2pm', 15: '3pm', 16: '4pm', 17: '5pm',
  18: '6pm', 19: '7pm', 20: '8pm', 21: '9pm', 22: '10pm', 23: '11pm',
};

export default function KioskAnalytics() {
  const { user } = useAuth();
  const orgId = (user as any)?.activeOrgId || 1;
  const [days, setDays] = useState(30);

  const { data, isLoading } = trpc.kiosk.getKioskAnalytics.useQuery(
    { orgId, days },
    { refetchInterval: 60_000 }
  );

  const stats = [
    {
      label: 'Total Check-ins',
      value: data?.totalCheckIns ?? 0,
      icon: Users,
      color: '#ef4444',
      glow: 'rgba(239,68,68,0.3)',
    },
    {
      label: 'Kiosk Leads',
      value: data?.totalKioskLeads ?? 0,
      icon: Star,
      color: '#f59e0b',
      glow: 'rgba(245,158,11,0.3)',
    },
    {
      label: 'Peak Hour',
      value: data?.topHour != null ? HOUR_LABELS[data.topHour] : '—',
      icon: Clock,
      color: '#8b5cf6',
      glow: 'rgba(139,92,246,0.3)',
    },
    {
      label: 'Avg/Day',
      value: data?.totalCheckIns != null ? (data.totalCheckIns / days).toFixed(1) : '—',
      icon: TrendingUp,
      color: '#22c55e',
      glow: 'rgba(34,197,94,0.3)',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kiosk Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Check-ins, leads, and activity from your kiosk</p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                days === d
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="rounded-2xl p-5 space-y-3"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: `0 0 20px ${stat.glow}`,
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}22` }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-3xl font-black" style={{ color: stat.color }}>
              {isLoading ? '...' : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Check-ins per day chart */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h2 className="text-lg font-bold mb-4">Daily Check-ins</h2>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">Loading...</div>
        ) : (data?.checkInsPerDay?.length ?? 0) === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">No check-in data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.checkInsPerDay ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                tickFormatter={d => d?.slice(5) ?? ''}
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a0000', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8 }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                itemStyle={{ color: '#ef4444' }}
              />
              <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} name="Check-ins" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Kiosk leads per day */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h2 className="text-lg font-bold mb-4">New Leads from Kiosk</h2>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">Loading...</div>
        ) : (data?.kioskLeadsPerDay?.length ?? 0) === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">No kiosk leads yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.kioskLeadsPerDay ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                tickFormatter={d => d?.slice(5) ?? ''}
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a0a00', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8 }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                itemStyle={{ color: '#f59e0b' }}
              />
              <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} name="Leads" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Peak hours */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h2 className="text-lg font-bold mb-4">Peak Check-in Hours</h2>
        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground">Loading...</div>
        ) : (data?.peakHours?.length ?? 0) === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground">No data yet</div>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {(data?.peakHours ?? []).map((h, i) => (
              <div
                key={h.hour}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl"
                style={{
                  background: i === 0 ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i === 0 ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <span className="text-lg font-black" style={{ color: i === 0 ? '#a78bfa' : 'rgba(255,255,255,0.7)' }}>
                  {HOUR_LABELS[h.hour]}
                </span>
                <span className="text-xs text-muted-foreground">{h.count} check-ins</span>
                {i === 0 && <span className="text-xs text-purple-400 font-bold">Peak</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
