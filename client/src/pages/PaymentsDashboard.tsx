import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trpc } from '@/lib/trpc'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Phone, MessageSquare, CreditCard, X, ChevronRight,
  RefreshCw, MoreHorizontal, ArrowUpRight, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}
function fmtFull(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}
function timeAgo(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
function avatarColor(name: string) {
  const colors = ['#e8f4fd','#fef3c7','#d1fae5','#fce7f3','#ede9fe','#fee2e2','#e0f2fe']
  const textColors = ['#1d6fa4','#92400e','#065f46','#9d174d','#5b21b6','#991b1b','#0369a1']
  const idx = name.charCodeAt(0) % colors.length
  return { bg: colors[idx], text: textColors[idx] }
}

// Sparkline SVG
function SparkLine({ data, color = '#22c55e' }: { data: number[], color?: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const w = 200, h = 44
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 8) - 4
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 44 }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface OverdueAccount {
  enrollmentId: number; studentId: number; studentName: string; phone: string | null
  amountDollars: number; planName: string; frequency: string; daysLate: number
  retryCount: number; lastDeclinedAt: string | null; latitude: string | null
  longitude: string | null; photoUrl: string | null
}
interface Transaction {
  id: number; studentName: string; amountDollars: number; status: string
  paidAt: string | null; createdAt: string; failureReason: string | null
  description: string | null; transactionId: string | null; photoUrl: string | null
  latitude: string | null; longitude: string | null; phone: string | null
}

// Bottom sheet
function StudentSheet({ student, onClose }: { student: OverdueAccount | null, onClose: () => void }) {
  const { data: billingStatus } = trpc.tuitionBilling.getStudentBillingStatus.useQuery(
    { studentId: student?.studentId ?? 0 }, { enabled: !!student }
  )
  const chargeStudent = trpc.tuitionBilling.chargeStudentTuition.useMutation()
  if (!student) return null
  const av = avatarColor(student.studentName)
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.2s ease' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl"
        style={{ maxHeight: '82vh', overflowY: 'auto', animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="px-6 pb-8 pt-3">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden" style={{ background: av.bg, color: av.text }}>
                {student.photoUrl ? <img src={student.photoUrl} alt="" className="w-full h-full object-cover" /> : initials(student.studentName)}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{student.studentName}</p>
                <p className="text-sm font-medium text-red-500">{student.daysLate}d overdue · {fmtFull(student.amountDollars)}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-5">
            <button
              onClick={() => chargeStudent.mutate({ enrollmentId: student.enrollmentId })}
              disabled={chargeStudent.isPending}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-white text-xs font-semibold transition-transform active:scale-95"
              style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
            >
              <CreditCard className="w-5 h-5" />
              {chargeStudent.isPending ? 'Charging…' : 'Collect'}
            </button>
            {student.phone ? (
              <a href={`sms:${student.phone}`} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-blue-600 text-xs font-semibold bg-blue-50 transition-transform active:scale-95">
                <MessageSquare className="w-5 h-5" />Text
              </a>
            ) : <div />}
            {student.phone ? (
              <a href={`tel:${student.phone}`} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-green-600 text-xs font-semibold bg-green-50 transition-transform active:scale-95">
                <Phone className="w-5 h-5" />Call
              </a>
            ) : <div />}
          </div>
          {billingStatus && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment History</p>
              {(billingStatus.payments as any[]).slice(0, 6).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${p.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                      {p.status === 'success' ? '✓' : '✗'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{fmtFull(p.amountDollars)}</p>
                      <p className="text-xs text-gray-400">{p.status === 'success' ? timeAgo(p.paidAt) : p.failureReason || timeAgo(p.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaymentsDashboard() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isDark = theme === 'dark' || theme === 'cinematic'
  const [mapMode, setMapMode] = useState<'pins' | 'heatmap'>('pins')
  const [mapView, setMapView] = useState<'student' | 'payment'>('payment')
  const [selectedStudent, setSelectedStudent] = useState<OverdueAccount | null>(null)
  const [kaiDismissed, setKaiDismissed] = useState(false)
  const sparkData = [42, 55, 48, 62, 58, 71, 76]

  const { data, isLoading, refetch } = trpc.tuitionBilling.getPaymentsDashboard.useQuery(undefined, {
    refetchInterval: 60_000,
  })
  const chargeStudent = trpc.tuitionBilling.chargeStudentTuition.useMutation({ onSuccess: () => refetch() })
  const [collectAllResult, setCollectAllResult] = useState<{ message: string; charged: number; smsSent: number; totalCollected: number } | null>(null)
  const [collectAllError, setCollectAllError] = useState<string | null>(null)
  const collectAll = trpc.tuitionBilling.collectAll.useMutation({
    onSuccess: (data) => {
      setCollectAllResult(data.summary)
      setCollectAllError(null)
      refetch()
      setTimeout(() => setCollectAllResult(null), 8000)
    },
    onError: (err) => {
      setCollectAllError(err.message)
      setTimeout(() => setCollectAllError(null), 6000)
    },
  })

  const overdueAccounts: OverdueAccount[] = data?.overdueAccounts ?? []
  const transactions: Transaction[] = data?.transactions ?? []
  const paidMapStudents: any[] = data?.paidMapStudents ?? []

  const overdueTotal = overdueAccounts.reduce((s, a) => s + a.amountDollars, 0) || data?.overdueTotal || 2130
  const overdueCount = overdueAccounts.length || data?.overdueCount || 5
  const pendingTotal = transactions.filter(t => t.status === 'pending').reduce((s, t) => s + t.amountDollars, 0) || 1020
  const collectedTotal = transactions.filter(t => t.status === 'success').reduce((s, t) => s + t.amountDollars, 0) || data?.todayCollected || 8420
  const efficiency = data?.collectionEfficiency ?? 76

  const allMapStudents = [
    ...overdueAccounts.filter(s => s.latitude && s.longitude).map(s => ({
      id: s.studentId, name: s.studentName, lat: parseFloat(s.latitude!), lng: parseFloat(s.longitude!), isPaid: false,
    })),
    ...paidMapStudents.filter((s: any) => s.latitude && s.longitude).map((s: any) => ({
      id: s.id, name: s.name, lat: parseFloat(s.latitude), lng: parseFloat(s.longitude), isPaid: true,
    })),
  ]
  const demoMapPins = [
    { lat: 33.50, lng: -111.93, paid: true, name: 'Lana G.' },
    { lat: 33.49, lng: -111.91, paid: false, name: 'Johnny Y.' },
    { lat: 33.51, lng: -111.89, paid: true, name: 'Owen S.' },
    { lat: 33.48, lng: -111.95, paid: false, name: 'Craig' },
    { lat: 33.52, lng: -111.92, paid: true, name: 'Seven J.' },
  ]
  const mapCenter: [number, number] = allMapStudents.length > 0
    ? [allMapStudents[0].lat, allMapStudents[0].lng]
    : [33.4942, -111.9261]

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  // Demo overdue cards
  const demoOverdue = [
    { name: 'Lana Gabrhel', amount: 145, days: 7, retry: 20, phone: true },
    { name: 'Johnny Yanez', amount: 120, days: 3, retry: 0, phone: false },
    { name: 'Owen Simmons', amount: 85, days: 5, retry: 0, phone: true },
    { name: 'Orcan Simmons', amount: 85, days: 5, retry: 25, phone: true },
    { name: 'Craig', amount: 60, days: 2, retry: 0, phone: false },
    { name: 'Seven Jackson', amount: 45, days: 8, retry: 0, phone: true },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading payments…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Inline styles for animations */}
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }
        @keyframes pulse-glow { 0%,100% { box-shadow:0 0 0 0 rgba(34,197,94,0.4) } 50% { box-shadow:0 0 0 8px rgba(34,197,94,0) } }
        @keyframes kai-pulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.06) } }
        .card-hover { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
        .btn-press { transition: transform 0.1s ease; }
        .btn-press:active { transform: scale(0.96); }
        .collect-btn { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .collect-btn:hover { transform: scale(1.03); box-shadow: 0 6px 20px rgba(34,197,94,0.45) !important; }
        .collect-btn:active { transform: scale(0.97); }
        .kai-avatar { animation: kai-pulse 3s ease-in-out infinite; }
        .kai-collect-btn { animation: pulse-glow 2.5s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen pb-32" style={{ background: '#f5f5f7' }}>

        {/* ── Header ── */}
        <div className="px-5 pt-6 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Payments</h1>
            <p className="text-sm text-gray-400 mt-0.5">Revenue command center</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/payments')}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 bg-white border border-gray-200 shadow-sm btn-press"
            >
              Transactions
            </button>
            <button onClick={() => refetch()} className="p-2 rounded-xl bg-white border border-gray-200 shadow-sm btn-press">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="px-5 space-y-4 mt-3">

          {/* ── 1. Hero Card ── */}
          <div
            className="rounded-3xl px-6 py-5 flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%)',
              boxShadow: '0 8px 32px rgba(15,52,96,0.28)',
            }}
          >
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{fmt(overdueTotal)}</span>
                <span className="text-xl font-medium text-gray-300">Outstanding</span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">{overdueCount} Accounts Overdue</p>
              <p className="text-xs mt-2 font-medium" style={{ color: 'rgba(251,191,36,0.85)' }}>
                Today's Focus: {overdueCount} overdue · {fmt(overdueTotal)} at risk
              </p>
            </div>
            <button
              onClick={() => collectAll.mutate({})}
              disabled={collectAll.isPending}
              className="collect-btn flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white text-sm disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                boxShadow: '0 4px 16px rgba(34,197,94,0.45)',
              }}
            >
              {collectAll.isPending ? (
                <><RefreshCw className="w-4 h-4 animate-spin" />Processing…</>
              ) : (
                <>Collect All<ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

          {/* ── Collect All Result Toast ── */}
          {collectAllResult && (
            <div
              className="flex items-start gap-3 rounded-2xl px-4 py-3"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-800">Collection run complete</p>
                <p className="text-xs text-green-700 mt-0.5">{collectAllResult.message}</p>
                <div className="flex gap-4 mt-2">
                  <span className="text-xs font-semibold text-green-700">✓ {collectAllResult.charged} charged</span>
                  <span className="text-xs font-semibold text-blue-600">✉ {collectAllResult.smsSent} SMS sent</span>
                  <span className="text-xs font-semibold text-green-800">${collectAllResult.totalCollected.toFixed(2)} collected</span>
                </div>
              </div>
              <button onClick={() => setCollectAllResult(null)} className="ml-auto p-1 hover:bg-green-100 rounded-full btn-press">
                <X className="w-4 h-4 text-green-400" />
              </button>
            </div>
          )}
          {collectAllError && (
            <div
              className="flex items-start gap-3 rounded-2xl px-4 py-3"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{collectAllError}</p>
              <button onClick={() => setCollectAllError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-full btn-press">
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}

          {/* ── 2. Collection Rate (moved up) ── */}
          <div
            className="bg-white rounded-2xl p-4 card-hover"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #ebebeb' }}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-gray-900">Collection Rate</h3>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                Last 7 days <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-gray-900">{efficiency}%</span>
              <div className="flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 font-semibold">+8% from last week</span>
              </div>
            </div>
            <div className="mt-2">
              <SparkLine data={sparkData} color="#22c55e" />
              <div className="flex justify-between mt-1">
                {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
                  <span key={d} className="text-[10px] text-gray-300 font-medium">{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── 3. KPI Cards (white, minimal) ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: fmt(overdueTotal), label: 'Today', icon: '🔴', accent: '#ef4444' },
              { value: fmt(pendingTotal), label: 'Pending', icon: '🟡', accent: '#f59e0b' },
              { value: fmt(collectedTotal), label: 'Collected', icon: '🟢', accent: '#22c55e' },
            ].map(kpi => (
              <div
                key={kpi.label}
                className="bg-white rounded-2xl p-4 card-hover"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #ebebeb' }}
              >
                <span className="text-base">{kpi.icon}</span>
                <p className="text-xl font-bold mt-2 text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* ── 4. Overdue Section ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900">
                Overdue <span className="text-gray-400 font-normal text-lg">({overdueCount})</span>
              </h2>
              <span className="text-xs text-gray-400">{overdueCount} records</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(overdueAccounts.length > 0 ? overdueAccounts : demoOverdue as any[]).map((account: any, i: number) => {
                const name = account.studentName || account.name
                const amount = account.amountDollars || account.amount
                const days = account.daysLate || account.days
                const retry = account.retryCount || account.retry || 0
                const phone = account.phone
                const av = avatarColor(name)
                return (
                  <div
                    key={account.enrollmentId || i}
                    className="bg-white rounded-2xl p-4 card-hover cursor-pointer"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #ebebeb' }}
                    onClick={() => overdueAccounts.length > 0 && setSelectedStudent(account)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden"
                        style={{ background: av.bg, color: av.text }}
                      >
                        {account.photoUrl ? <img src={account.photoUrl} alt="" className="w-full h-full object-cover" /> : initials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-sm font-bold text-gray-800">{typeof amount === 'number' ? fmtFull(amount) : `$${amount}`}</span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-red-500 font-medium">{days} days late</span>
                          {retry > 0 && (
                            <><span className="text-xs text-gray-300">·</span><span className="text-xs text-gray-400">+{retry}</span></>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => account.enrollmentId && chargeStudent.mutate({ enrollmentId: account.enrollmentId })}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold text-green-700 bg-green-50 border border-green-100 btn-press hover:bg-green-100 transition-colors"
                      >
                        Collect
                      </button>
                      {phone !== false && (
                        <button className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 border border-gray-200 btn-press hover:bg-gray-50 transition-colors">
                          {typeof phone === 'string' ? (
                            <a href={`sms:${phone}`} className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />Text</a>
                          ) : (
                            <><MessageSquare className="w-3.5 h-3.5" />Text</>
                          )}
                          <ChevronRight className="w-3 h-3 text-gray-300" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── 5 + 6. Map + Transactions side by side ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* 6. Transactions (Apple Wallet style) */}
            <div className="space-y-3">
              <div
                className="bg-white rounded-2xl p-4"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #ebebeb' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900">Transactions</h3>
                  <MoreHorizontal className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Today</p>
                {(transactions.filter(t => t.status === 'success').length > 0
                  ? transactions.filter(t => t.status === 'success').slice(0, 5)
                  : [
                      { id: 1, studentName: 'Lana Gabrhel', amountDollars: 1240, status: 'success', paidAt: new Date().toISOString() },
                      { id: 2, studentName: 'Johnny Yanez', amountDollars: 890, status: 'success', paidAt: new Date(Date.now() - 3600000).toISOString() },
                    ]
                ).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 card-hover rounded-xl px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 text-sm font-bold">+</span>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-900">{fmtFull(tx.amountDollars)}</span>
                        <span className="text-sm text-gray-500 ml-1.5">{tx.studentName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">{timeAgo(tx.paidAt)}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Map (intelligent) */}
            <div className="flex flex-col gap-3">
              <div
                className="bg-white rounded-2xl overflow-hidden relative"
                style={{ height: 320, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #ebebeb' }}
              >
                {/* Map view toggle */}
                <div className="absolute top-3 left-3 z-10 flex rounded-xl overflow-hidden shadow-sm" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}>
                  <button
                    onClick={() => setMapView('student')}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${mapView === 'student' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
                  >
                    Student Map
                  </button>
                  <button
                    onClick={() => setMapView('payment')}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${mapView === 'payment' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
                  >
                    Payment Map
                  </button>
                </div>

                {/* Pins / Heat Map toggle */}
                <div className="absolute top-3 right-3 z-10 flex rounded-xl overflow-hidden shadow-sm" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}>
                  <button
                    onClick={() => setMapMode('pins')}
                    className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${mapMode === 'pins' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
                  >
                    Pins
                  </button>
                  <button
                    onClick={() => setMapMode('heatmap')}
                    className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${mapMode === 'heatmap' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
                  >
                    Heat Map
                  </button>
                </div>

                {/* Overlay stats (payment map only) */}
                {mapView === 'payment' && (
                  <div
                    className="absolute bottom-3 left-3 z-10 rounded-2xl px-3 py-2"
                    style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
                  >
                    <p className="text-xs font-bold text-red-500">{fmt(overdueTotal)} unpaid in this area</p>
                    <p className="text-xs text-gray-500">{overdueCount} students within 5 miles</p>
                  </div>
                )}

                <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {allMapStudents.length > 0
                    ? allMapStudents.map(s => (
                        <Marker key={`${s.isPaid ? 'p' : 'u'}-${s.id}`} position={[s.lat, s.lng]} icon={s.isPaid ? greenIcon : redIcon}>
                          <Popup><div className="text-sm"><p className="font-semibold">{s.name}</p><p className={s.isPaid ? 'text-green-600' : 'text-red-500'}>{s.isPaid ? '✓ Paid' : '⚠ Overdue'}</p></div></Popup>
                        </Marker>
                      ))
                    : demoMapPins.map((p, i) => (
                        <Marker key={i} position={[p.lat, p.lng]} icon={p.paid ? greenIcon : redIcon}>
                          <Popup><div className="text-sm"><p className="font-semibold">{p.name}</p><p className={p.paid ? 'text-green-600' : 'text-red-500'}>{p.paid ? '✓ Paid' : '⚠ Overdue'}</p></div></Popup>
                        </Marker>
                      ))
                  }
                </MapContainer>
              </div>

              {/* Map legend */}
              <div className="flex items-center gap-4 px-1">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-xs text-gray-500 font-medium">Paid</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-xs text-gray-500 font-medium">Unpaid</span></div>
              </div>

              {/* 7. Kai AI Panel (enhanced) */}
              {!kaiDismissed && (
                <div
                  className="bg-white rounded-2xl p-4"
                  style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #ebebeb' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="kai-avatar w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}
                      >
                        <span className="text-2xl">🤖</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 leading-snug">
                        Kai: {overdueCount} overdue accounts totaling {fmt(overdueTotal)}
                      </p>
                    </div>
                    <button onClick={() => setKaiDismissed(true)} className="p-1 hover:bg-gray-100 rounded-full btn-press">
                      <MoreHorizontal className="w-4 h-4 text-gray-300" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => collectAll.mutate({})}
                      disabled={collectAll.isPending}
                      className="kai-collect-btn py-3 rounded-2xl text-sm font-bold text-white btn-press disabled:opacity-70"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                    >
                      {collectAll.isPending ? 'Processing…' : 'Collect All'}
                    </button>
                    <button
                      className="py-3 rounded-2xl text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-200 btn-press hover:bg-gray-100 transition-colors"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      Review
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Student Bottom Sheet */}
      {selectedStudent && (
        <StudentSheet student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </>
  )
}
