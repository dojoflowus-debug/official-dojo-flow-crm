import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trpc } from '@/lib/trpc'
import {
  AlertTriangle, CheckCircle2, Clock, ChevronRight,
  MoreHorizontal, ArrowUpRight, Bot, X,
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts'

// ── Leaflet icon fix ──────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 33], iconAnchor: [10, 33], popupAnchor: [1, -28],
})
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 33], iconAnchor: [10, 33], popupAnchor: [1, -28],
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}
function fmtFull(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
const AVATAR_COLORS = ['#e8f4fd','#fef3c7','#d1fae5','#fce7f3','#ede9fe','#fee2e2','#e0f2fe']
function avatarColor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[h]
}
function fmtTime(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// ── Chart data (last 7 days labels) ──────────────────────────────────────────
const DAYS = ['7','6','5','4','3','2','1','Today']

export default function PaymentsDashboard() {
  const navigate = useNavigate()
  const [showKai, setShowKai] = useState(true)
  const [collectingAll, setCollectingAll] = useState(false)
  const [collectResult, setCollectResult] = useState<string | null>(null)

  // ── tRPC queries ─────────────────────────────────────────────────────────
  const { data: dash, isLoading: dashLoading } = trpc.tuitionBilling.getPaymentsDashboard.useQuery(undefined, { refetchInterval: 60_000 })
  const collectAllMut = trpc.tuitionBilling.collectAll.useMutation({
    onSuccess: (res: any) => {
      setCollectResult(`Charged ${res.charged}/${res.total} · ${res.smsSent} SMS sent · ${fmt(res.totalCollected)} collected`)
      setCollectingAll(false)
    },
    onError: () => {
      setCollectResult('Something went wrong. Please try again.')
      setCollectingAll(false)
    },
  })

  // ── Derived values ────────────────────────────────────────────────────────
  const overdue = dash?.overdueAccounts ?? []
  const transactions = dash?.transactions ?? []
  const overdueTotal = dash?.overdueTotal ?? 0
  const collectedTotal = dash?.mrr ?? 0   // 30-day combined FluidPay + Stripe
  const pendingTotal = dash?.pendingTotal ?? 0
  const mapStudents = [
    ...(dash?.paidMapStudents ?? []).map((s: any) => ({ ...s, isPaid: true })),
    ...(dash?.unpaidMapStudents ?? []).map((s: any) => ({ ...s, isPaid: false })),
  ]
  // Build trend from collectionTrend array (day + total) or fall back to zeros
  const trendData = (() => {
    const trend = dash?.collectionTrend ?? []
    return DAYS.map((d, i) => {
      const entry = trend[trend.length - 7 + i]
      return { day: d, value: entry ? Number(entry.total) : 0 }
    })
  })()

  function handleCollectAll() {
    setCollectingAll(true)
    setCollectResult(null)
    collectAllMut.mutate()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── Top Nav ──────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        {/* Logo + divider + page label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>Dojo Flow</span>
          </button>
          <span style={{ color: '#d1d5db', fontSize: 18, fontWeight: 200 }}>|</span>
          <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>Dashboard</span>
        </div>

        {/* Right: Kai badge + user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: overdue.length > 0 ? '#fef3c7' : '#f3f4f6',
            border: `1px solid ${overdue.length > 0 ? '#fde68a' : '#e5e7eb'}`,
            borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
          }}>
            <span style={{ fontSize: 10, color: overdue.length > 0 ? '#d97706' : '#6b7280' }}>●</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: overdue.length > 0 ? '#92400e' : '#374151' }}>
              Kai • {overdue.length} overdue
            </span>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>S</span>
          </div>
        </div>
      </div>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={{ padding: '32px 24px 0' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', letterSpacing: '-0.5px', margin: 0 }}>Payments</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 2, fontWeight: 500 }}>Revenue Command</p>
      </div>

      {/* ── KPI Strip ────────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 24px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: '#e5e7eb', border: '1px solid #e5e7eb', borderRadius: 12, margin: '20px 24px 0', overflow: 'hidden' }}>
        {/* Outstanding */}
        <div style={{ background: '#fff', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertTriangle style={{ width: 14, height: 14, color: '#ef4444' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding</span>
          </div>
          {dashLoading ? (
            <div style={{ height: 36, width: 80, background: '#f3f4f6', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ) : (
            <div style={{ fontSize: 30, fontWeight: 700, color: '#ef4444', letterSpacing: '-0.5px' }}>{fmt(overdueTotal)}</div>
          )}
        </div>
        {/* Collected */}
        <div style={{ background: '#fff', padding: '20px 24px', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collected</span>
          </div>
          {dashLoading ? (
            <div style={{ height: 36, width: 80, background: '#f3f4f6', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ) : (
            <div style={{ fontSize: 30, fontWeight: 700, color: '#111827', letterSpacing: '-0.5px' }}>{fmt(collectedTotal)}</div>
          )}
        </div>
        {/* Pending */}
        <div style={{ background: '#fff', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Clock style={{ width: 14, height: 14, color: '#f59e0b' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending</span>
          </div>
          {dashLoading ? (
            <div style={{ height: 36, width: 80, background: '#f3f4f6', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ) : (
            <div style={{ fontSize: 30, fontWeight: 700, color: '#111827', letterSpacing: '-0.5px' }}>{fmt(pendingTotal)}</div>
          )}
        </div>
      </div>

      {/* ── Collections Analytics ─────────────────────────────────────────── */}
      {dashLoading && (
        <div style={{ margin: '16px 24px 0', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{ height: 12, width: '60%', background: '#f3f4f6', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: 24, width: '80%', background: '#f3f4f6', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        </div>
      )}
      {!dashLoading && dash?.analytics && (() => {
        const a = dash.analytics
        const growthPositive = a.monthlyGrowthPct >= 0
        return (
          <div style={{ margin: '16px 24px 0', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px' }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Collections Analytics</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>Live · {a.lastMonthName}</span>
            </div>
            {/* Metric rows */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 1px', background: '#f3f4f6', borderRadius: 8, overflow: 'hidden' }}>
              {/* Last Month Revenue */}
              <div style={{ background: '#fff', padding: '12px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Last Month</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>{fmt(a.lastMonthRevenue)}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{a.lastMonthName}</div>
              </div>
              {/* Previous Month Revenue */}
              <div style={{ background: '#fff', padding: '12px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Prev Month</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>{fmt(a.prevMonthRevenue)}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{a.prevMonthName}</div>
              </div>
              {/* All-Time Revenue */}
              <div style={{ background: '#fff', padding: '12px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>All-Time</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>{fmt(a.allTimeRevenue)}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Lifetime collected</div>
              </div>
              {/* Monthly Growth */}
              <div style={{ background: '#fff', padding: '12px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>MoM Growth</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: growthPositive ? '#10b981' : '#ef4444', letterSpacing: '-0.3px' }}>
                  {growthPositive ? '+' : ''}{a.monthlyGrowthPct}%
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>vs prev month</div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#f3f4f6', margin: '12px 0' }} />

            {/* Operational metrics row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 1px', background: '#f3f4f6', borderRadius: 8, overflow: 'hidden' }}>
              {/* Avg Tuition */}
              <div style={{ background: '#fff', padding: '12px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Avg Tuition</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>{fmt(a.avgTuition)}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{a.payingStudentCount} paying students</div>
              </div>
              {/* Payment Compliance */}
              <div style={{ background: '#fff', padding: '12px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Compliance</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: a.paymentCompliancePct >= 80 ? '#10b981' : a.paymentCompliancePct >= 60 ? '#f59e0b' : '#ef4444', letterSpacing: '-0.3px' }}>
                  {a.paymentCompliancePct}%
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>paying / active</div>
              </div>
              {/* Retention Rate */}
              <div style={{ background: '#fff', padding: '12px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Retention</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: a.retentionRate >= 90 ? '#10b981' : a.retentionRate >= 75 ? '#f59e0b' : '#ef4444', letterSpacing: '-0.3px' }}>
                  {a.retentionRate}%
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>active this month</div>
              </div>
              {/* Quit Rate */}
              <div style={{ background: '#fff', padding: '12px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Quit Rate</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: a.quitRate === 0 ? '#10b981' : a.quitRate <= 5 ? '#f59e0b' : '#ef4444', letterSpacing: '-0.3px' }}>
                  {a.quitRate}%
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>overdue / active</div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Collect result banner ─────────────────────────────────────────── */}
      {collectResult && (
        <div style={{ margin: '12px 24px 0', padding: '10px 16px', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#065f46', fontWeight: 500 }}>{collectResult}</span>
          <button onClick={() => setCollectResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}><X style={{ width: 14, height: 14 }} /></button>
        </div>
      )}

      {/* ── Main 2-column grid ────────────────────────────────────────────── */}
      <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* ── LEFT: Accounts Receivable ─────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Accounts Receivable</span>
            <MoreHorizontal style={{ width: 16, height: 16, color: '#9ca3af', cursor: 'pointer' }} />
          </div>
          {/* Filter chips */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 20, padding: '3px 10px' }}>
              <X style={{ width: 10, height: 10, color: '#ef4444' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#dc2626' }}>Overdue {overdue.length}</span>
            </div>
            <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>● Pending {dash?.pendingCount ?? 0}</span>
            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Collected {dash?.collectedCount ?? 0}</span>
          </div>
          {/* Student rows */}
          <div>
            {overdue.length === 0 && (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                No overdue accounts
              </div>
            )}
            {overdue.map((s: any, i: number) => (
              <div
                key={s.studentId}
                style={{
                  padding: '12px 20px',
                  borderBottom: i < overdue.length - 1 ? '1px solid #f9fafb' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: avatarColor(s.studentName),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, position: 'relative',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{initials(s.studentName)}</span>
                  <span style={{
                    position: 'absolute', bottom: 1, right: 1,
                    width: 8, height: 8, borderRadius: '50%',
                    background: s.daysLate > 7 ? '#ef4444' : s.daysLate > 3 ? '#f59e0b' : '#10b981',
                    border: '1.5px solid #fff',
                  }} />
                </div>
                {/* Name + days */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.studentName}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{s.daysLate} days late</div>
                </div>
                {/* Amount */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{fmt(s.amountDollars)} overdue</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{s.daysLate} days late</div>
                </div>
                {/* Collect button */}
                <button
                  style={{
                    flexShrink: 0,
                    padding: '5px 14px',
                    background: '#fff',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'border-color 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#111827')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#d1d5db')}
                >
                  Collect
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Collection Trend + Payment Map ─────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Collection Trend */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Collection Trend</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Last 7 Days</span>
                <ChevronRight style={{ width: 14, height: 14, color: '#9ca3af' }} />
              </div>
            </div>
            <div style={{ padding: '16px 8px 12px' }}>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(v: any) => [fmt(v), 'Collected']}
                    labelStyle={{ color: '#6b7280', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#trendGrad)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Map */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', flex: 1 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Payment Map</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Paid</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Unpaid</span>
                </div>
              </div>
            </div>
            <div style={{ height: 220 }}>
              <MapContainer
                center={[33.4942, -111.9261]}
                zoom={11}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution=""
                />
                {mapStudents.map((s: any) => (
                  s.latitude && s.longitude ? (
                    <Marker
                      key={s.id}
                      position={[parseFloat(s.latitude), parseFloat(s.longitude)]}
                      icon={s.hasBillingIssue ? redIcon : greenIcon}
                    >
                      <Popup>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name ?? s.studentName}</div>
                        <div style={{ fontSize: 11, color: s.hasBillingIssue ? '#ef4444' : '#10b981' }}>
                          {s.hasBillingIssue ? 'Overdue' : 'Paid'}
                        </div>
                      </Popup>
                    </Marker>
                  ) : null
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom row: Transactions ──────────────────────────────────────── */}
      <div style={{ padding: '0 24px 100px' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Recent Transactions</span>
            <button
              onClick={() => navigate('/payments')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#6b7280', fontWeight: 500 }}
            >
              View All <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
          {/* Date group */}
          <div style={{ padding: '10px 20px 4px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today</div>
          {transactions.length === 0 && (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No transactions yet</div>
          )}
          {transactions.map((t: any, i: number) => (
            <div
              key={t.id ?? i}
              style={{
                padding: '10px 20px',
                borderBottom: i < transactions.length - 1 ? '1px solid #f9fafb' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: avatarColor(t.studentName ?? '?'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, position: 'relative',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{initials(t.studentName ?? '?')}</span>
                <span style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 8, height: 8, borderRadius: '50%',
                  background: (t.status === 'paid' || t.status === 'success') ? '#10b981' : '#ef4444',
                  border: '1.5px solid #fff',
                }} />
              </div>
              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.studentName}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{fmtTime(t.paidAt ?? t.createdAt)}</div>
              </div>
              {/* Source badge */}
              {(t as any).source && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                  background: (t as any).source === 'Stripe' ? '#ede9fe' : '#dbeafe',
                  color: (t as any).source === 'Stripe' ? '#7c3aed' : '#1d4ed8',
                  flexShrink: 0, letterSpacing: '0.02em',
                }}>{(t as any).source}</span>
              )}
              {/* Amount */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: (t.status === 'paid' || t.status === 'success') ? '#10b981' : '#ef4444' }}>
                  {t.status === 'success' || t.status === 'paid' ? '+' : ''}{fmtFull(t.amountDollars)}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{fmtTime(t.paidAt ?? t.createdAt)}</div>
              </div>
              <ChevronRight style={{ width: 14, height: 14, color: '#d1d5db', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Kai floating panel ────────────────────────────────────────────── */}
      {showKai && (
        <div style={{
          position: 'fixed',
          bottom: 88,
          right: 20,
          width: 280,
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: '16px',
          zIndex: 50,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Bot style={{ width: 18, height: 18, color: '#fff' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Kai:</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1, lineHeight: 1.4 }}>
                  {overdue.length} overdue accounts totaling {fmt(overdueTotal)}
                </div>
              </div>
            </div>
            <button onClick={() => setShowKai(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
          {/* Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              onClick={handleCollectAll}
              disabled={collectingAll}
              style={{
                padding: '9px 0',
                background: collectingAll ? '#6ee7b7' : '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: collectingAll ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {collectingAll ? 'Processing…' : 'Collect All'}
            </button>
            <button
              onClick={() => navigate('/payments')}
              style={{
                padding: '9px 0',
                background: '#fff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Review
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
