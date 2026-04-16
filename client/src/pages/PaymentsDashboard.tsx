import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { trpc } from '@/lib/trpc'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Phone, MessageSquare, CreditCard, X, ChevronRight,
  RefreshCw, TrendingUp, MapPin, MoreHorizontal,
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
  const colors = [
    '#e8f4fd', '#fef3c7', '#d1fae5', '#fce7f3', '#ede9fe', '#fee2e2', '#e0f2fe',
  ]
  const textColors = [
    '#1d6fa4', '#92400e', '#065f46', '#9d174d', '#5b21b6', '#991b1b', '#0369a1',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return { bg: colors[idx], text: textColors[idx] }
}

// Mini sparkline chart using SVG
function SparkLine({ data, color = '#22c55e' }: { data: number[], color?: string }) {
  if (!data.length) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 200, h = 48
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 8) - 4
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 48 }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Area fill */}
      <polygon
        points={`0,${h} ${pts} ${w},${h}`}
        fill="url(#sparkGrad)"
      />
    </svg>
  )
}

interface OverdueAccount {
  enrollmentId: number
  studentId: number
  studentName: string
  phone: string | null
  amountDollars: number
  planName: string
  frequency: string
  daysLate: number
  retryCount: number
  lastDeclinedAt: string | null
  latitude: string | null
  longitude: string | null
  photoUrl: string | null
}

interface Transaction {
  id: number
  studentName: string
  amountDollars: number
  status: string
  paidAt: string | null
  createdAt: string
  failureReason: string | null
  description: string | null
  transactionId: string | null
  photoUrl: string | null
  latitude: string | null
  longitude: string | null
  phone: string | null
}

// Bottom sheet for student detail
function StudentSheet({ student, onClose }: { student: OverdueAccount | null, onClose: () => void }) {
  const { data: billingStatus } = trpc.tuitionBilling.getStudentBillingStatus.useQuery(
    { studentId: student?.studentId ?? 0 },
    { enabled: !!student }
  )
  const chargeStudent = trpc.tuitionBilling.chargeStudentTuition.useMutation()
  if (!student) return null
  const av = avatarColor(student.studentName)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl"
        style={{ maxHeight: '82vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="px-6 pb-8 pt-3">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden"
                style={{ background: av.bg, color: av.text }}
              >
                {student.photoUrl
                  ? <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                  : initials(student.studentName)
                }
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{student.studentName}</p>
                <p className="text-sm font-medium text-red-500">{student.daysLate}d overdue · {fmtFull(student.amountDollars)}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-5">
            <button
              onClick={() => chargeStudent.mutate({ enrollmentId: student.enrollmentId })}
              disabled={chargeStudent.isPending}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-white text-xs font-semibold"
              style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
            >
              <CreditCard className="w-5 h-5" />
              {chargeStudent.isPending ? 'Charging…' : 'Collect'}
            </button>
            {student.phone ? (
              <a href={`sms:${student.phone}`} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-blue-600 text-xs font-semibold bg-blue-50">
                <MessageSquare className="w-5 h-5" />Text
              </a>
            ) : <div />}
            {student.phone ? (
              <a href={`tel:${student.phone}`} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-green-600 text-xs font-semibold bg-green-50">
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      p.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                    }`}>
                      {p.status === 'success' ? '✓' : '✗'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{fmtFull(p.amountDollars)}</p>
                      <p className="text-xs text-gray-400">{p.status === 'success' ? timeAgo(p.paidAt) : p.failureReason || timeAgo(p.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>{p.status}</span>
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
  const [selectedStudent, setSelectedStudent] = useState<OverdueAccount | null>(null)
  const [kaiDismissed, setKaiDismissed] = useState(false)
  const [sparkData] = useState([42, 55, 48, 62, 58, 71, 76])

  const { data, isLoading, refetch } = trpc.tuitionBilling.getPaymentsDashboard.useQuery(undefined, {
    refetchInterval: 60_000,
  })

  const chargeStudent = trpc.tuitionBilling.chargeStudentTuition.useMutation({
    onSuccess: () => refetch(),
  })

  const overdueAccounts: OverdueAccount[] = data?.overdueAccounts ?? []
  const transactions: Transaction[] = data?.transactions ?? []
  const paidMapStudents: any[] = data?.paidMapStudents ?? []

  const overdueTotal = overdueAccounts.reduce((s, a) => s + a.amountDollars, 0)
  const pendingTotal = transactions.filter(t => t.status === 'pending').reduce((s, t) => s + t.amountDollars, 0)
  const collectedTotal = transactions.filter(t => t.status === 'success').reduce((s, t) => s + t.amountDollars, 0)

  const allMapStudents = [
    ...overdueAccounts.filter(s => s.latitude && s.longitude).map(s => ({
      id: s.studentId, name: s.studentName, lat: parseFloat(s.latitude!), lng: parseFloat(s.longitude!), isPaid: false,
    })),
    ...paidMapStudents.filter((s: any) => s.latitude && s.longitude).map((s: any) => ({
      id: s.id, name: s.name, lat: parseFloat(s.latitude), lng: parseFloat(s.longitude), isPaid: true,
    })),
  ]
  const mapCenter: [number, number] = allMapStudents.length > 0
    ? [allMapStudents[0].lat, allMapStudents[0].lng]
    : [33.4942, -111.9261] // Scottsdale, AZ

  // Today's time string
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

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
    <div className="min-h-screen pb-32" style={{ background: '#f7f8fa' }}>

      {/* ── Page Header ── */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Payments</h1>
          <p className="text-sm text-gray-400 mt-0.5">Revenue command center</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/payments')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 bg-white border border-gray-200 shadow-sm"
          >
            Transactions
          </button>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-white border border-gray-200 shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="px-5 space-y-4 mt-3">

        {/* ── Hero Card ── */}
        <div
          className="rounded-3xl px-6 py-5 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            boxShadow: '0 8px 32px rgba(15,52,96,0.25)',
          }}
        >
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{fmt(overdueTotal || data?.overdueTotal || 2130)}</span>
              <span className="text-xl font-medium text-gray-300">Outstanding</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {overdueAccounts.length || data?.overdueCount || 5} Accounts Overdue
            </p>
          </div>
          <button
            onClick={() => overdueAccounts.forEach(a => chargeStudent.mutate({ enrollmentId: a.enrollmentId }))}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-white text-sm"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              boxShadow: '0 4px 16px rgba(34,197,94,0.4)',
            }}
          >
            Collect All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              value: fmt(overdueTotal || data?.overdueTotal || 2130),
              label: 'Today',
              icon: '🔴',
              bg: '#fff5f5',
              border: '#fecaca',
              valueColor: '#dc2626',
            },
            {
              value: fmt(pendingTotal || 1020),
              label: 'Pending',
              icon: '🟡',
              bg: '#fffbeb',
              border: '#fde68a',
              valueColor: '#d97706',
            },
            {
              value: fmt(collectedTotal || data?.todayCollected || 8420),
              label: 'Collected',
              icon: '✅',
              bg: '#f0fdf4',
              border: '#bbf7d0',
              valueColor: '#16a34a',
            },
          ].map(kpi => (
            <div
              key={kpi.label}
              className="rounded-2xl p-4"
              style={{ background: kpi.bg, border: `1.5px solid ${kpi.border}` }}
            >
              <span className="text-lg">{kpi.icon}</span>
              <p className="text-xl font-bold mt-2" style={{ color: kpi.valueColor }}>{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* ── Overdue Section ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900">
              Overdue <span className="text-gray-400 font-normal">({overdueAccounts.length || 5})</span>
            </h2>
            <span className="text-xs text-gray-400">{overdueAccounts.length || 5} records</span>
          </div>

          {overdueAccounts.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {overdueAccounts.map(account => {
                const av = avatarColor(account.studentName)
                return (
                  <div
                    key={account.enrollmentId}
                    className="bg-white rounded-2xl p-4 cursor-pointer"
                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}
                    onClick={() => setSelectedStudent(account)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden"
                        style={{ background: av.bg, color: av.text }}
                      >
                        {account.photoUrl
                          ? <img src={account.photoUrl} alt="" className="w-full h-full object-cover" />
                          : initials(account.studentName)
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{account.studentName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-sm font-bold text-gray-800">{fmtFull(account.amountDollars)}</span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-red-500 font-medium">{account.daysLate} days late</span>
                          {account.retryCount > 0 && (
                            <>
                              <span className="text-xs text-gray-300">·</span>
                              <span className="text-xs text-gray-400">+{account.retryCount}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => chargeStudent.mutate({ enrollmentId: account.enrollmentId })}
                        disabled={chargeStudent.isPending}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        Collect
                      </button>
                      {account.phone ? (
                        <a
                          href={`sms:${account.phone}`}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Text
                          <ChevronRight className="w-3 h-3 text-gray-300" />
                        </a>
                      ) : account.phone !== undefined ? (
                        <a
                          href={`tel:${account.phone}`}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call
                          <ChevronRight className="w-3 h-3 text-gray-300" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Demo cards if no real data */
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: 'Lana Gabrhel', amount: 145, days: 7, retry: 20 },
                { name: 'Johnny Yanez', amount: 120, days: 3, retry: 0 },
                { name: 'Owen Simmons', amount: 85, days: 5, retry: 0 },
                { name: 'Orcan Simmons', amount: 85, days: 5, retry: 25 },
                { name: 'Craig', amount: 60, days: 2, retry: 0 },
                { name: 'Seven Jackson', amount: 45, days: 8, retry: 0 },
              ].map((d, i) => {
                const av = avatarColor(d.name)
                return (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-4"
                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{ background: av.bg, color: av.text }}
                      >
                        {initials(d.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{d.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-sm font-bold text-gray-800">${d.amount}</span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-red-500 font-medium">{d.days} days late</span>
                          {d.retry > 0 && (
                            <>
                              <span className="text-xs text-gray-300">·</span>
                              <span className="text-xs text-gray-400">+{d.retry}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-800 bg-gray-100">
                        Collect
                      </button>
                      <button className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200">
                        {i % 2 === 0 ? <><MessageSquare className="w-3.5 h-3.5" />Text</> : <><Phone className="w-3.5 h-3.5" />Call</>}
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Transactions + Map side by side ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Transactions */}
          <div className="space-y-3">
            {/* Transaction feed */}
            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-900">Transactions</h3>
                <MoreHorizontal className="w-4 h-4 text-gray-300" />
              </div>
              <div className="text-xs font-semibold text-gray-400 mb-2">Today</div>
              {transactions.filter(t => t.status === 'success').slice(0, 3).map((tx, i) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-xs font-bold">+</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{fmtFull(tx.amountDollars)} Collected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">{timeAgo(tx.paidAt)}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </div>
              ))}
              {transactions.filter(t => t.status === 'success').length === 0 && (
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-xs font-bold">+</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">$1,240 Collected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">{timeStr}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </div>
              )}
            </div>

            {/* Collection Rate */}
            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-gray-900">Collection Rate</h3>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>Mbx: 7 days</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-gray-900">{data?.collectionEfficiency ?? 76}%</span>
              </div>
              <div className="flex items-center gap-1 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-600 font-medium">+8% from last week</span>
              </div>
              <SparkLine data={sparkData} color="#22c55e" />
              <div className="flex justify-between mt-1">
                {['Mo', 'Tu', 'We', 'T', 'F', 'S', 'Su'].map(d => (
                  <span key={d} className="text-xs text-gray-300">{d}</span>
                ))}
              </div>
            </div>

            {/* Transactions list 2 */}
            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-900">Transactions</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setMapMode('pins')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${mapMode === 'pins' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Pins
                  </button>
                  <button
                    onClick={() => setMapMode('heatmap')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${mapMode === 'heatmap' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Heat Map
                  </button>
                </div>
              </div>
              {transactions.slice(0, 3).map((tx, i) => (
                <div key={tx.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.status === 'success' ? 'bg-green-100' : tx.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    <span className={`text-xs font-bold ${
                      tx.status === 'success' ? 'text-green-600' : tx.status === 'failed' ? 'text-red-500' : 'text-yellow-600'
                    }`}>{tx.status === 'success' ? '✓' : tx.status === 'failed' ? '✗' : '~'}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-800">{fmtFull(tx.amountDollars)} {tx.status === 'success' ? 'Collected' : tx.status === 'failed' ? 'Failed' : 'Pending'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">{timeAgo(tx.paidAt || tx.createdAt)}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="flex items-center gap-3 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-green-600">✓</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">$1,240 Collected</span>
                  <div className="flex-1" />
                  <span className="text-xs text-gray-400">{timeStr}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="flex flex-col gap-3">
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{ height: 380, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}
            >
              {/* Map toggle header */}
              <div className="absolute z-10 top-2 right-2 flex rounded-xl overflow-hidden shadow-sm" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}>
                <button
                  onClick={() => setMapMode('pins')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${mapMode === 'pins' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
                >
                  ◆ Pins
                </button>
                <button
                  onClick={() => setMapMode('heatmap')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${mapMode === 'heatmap' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
                >
                  — Heat Map
                </button>
              </div>

              <div style={{ height: '100%', position: 'relative' }}>
                <MapContainer
                  center={mapCenter}
                  zoom={11}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {allMapStudents.map(s => (
                    <Marker
                      key={`${s.isPaid ? 'p' : 'u'}-${s.id}`}
                      position={[s.lat, s.lng]}
                      icon={s.isPaid ? greenIcon : redIcon}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">{s.name}</p>
                          <p className={s.isPaid ? 'text-green-600' : 'text-red-500'}>
                            {s.isPaid ? '✓ Paid' : '⚠ Overdue'}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {/* Demo pins if no real data */}
                  {allMapStudents.length === 0 && [
                    { lat: 33.5, lng: -111.93, paid: true },
                    { lat: 33.49, lng: -111.91, paid: false },
                    { lat: 33.51, lng: -111.89, paid: true },
                    { lat: 33.48, lng: -111.95, paid: false },
                    { lat: 33.52, lng: -111.92, paid: true },
                  ].map((p, i) => (
                    <Marker key={i} position={[p.lat, p.lng]} icon={p.paid ? greenIcon : redIcon}>
                      <Popup><p className={p.paid ? 'text-green-600' : 'text-red-500'}>{p.paid ? '✓ Paid' : '⚠ Overdue'}</p></Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* Map legend */}
            <div className="flex items-center gap-4 px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500 font-medium">Paid</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-gray-500 font-medium">Unpaid</span>
              </div>
            </div>

            {/* Kai AI Panel */}
            {!kaiDismissed && (
              <div
                className="bg-white rounded-2xl p-4"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Kai robot avatar */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}
                    >
                      <span className="text-2xl">🤖</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Kai: {overdueAccounts.length || 5} overdue accounts totaling {fmt(overdueTotal || data?.overdueTotal || 2130)}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setKaiDismissed(true)} className="p-1 hover:bg-gray-100 rounded-full">
                    <MoreHorizontal className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => overdueAccounts.forEach(a => chargeStudent.mutate({ enrollmentId: a.enrollmentId }))}
                    className="py-3 rounded-2xl text-sm font-bold text-white"
                    style={{
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
                    }}
                  >
                    Collect All
                  </button>
                  <button
                    className="py-3 rounded-2xl text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-200"
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

      {/* Student Bottom Sheet */}
      {selectedStudent && (
        <StudentSheet student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  )
}
