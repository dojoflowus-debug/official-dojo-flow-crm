import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trpc } from '@/lib/trpc'
import { useTheme } from '@/contexts/ThemeContext'
import {
  DollarSign, TrendingUp, BarChart3, AlertCircle, CheckCircle2, Clock,
  Phone, MessageSquare, CreditCard, ChevronRight, X, Sparkles,
  MapPin, RefreshCw, Zap, ArrowUpRight,
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default icons
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

type StatusFilter = 'all' | 'overdue' | 'pending' | 'collected'

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

// Student bottom sheet
function StudentPaymentSheet({ student, onClose }: { student: OverdueAccount | null, onClose: () => void }) {
  const { data: billingStatus } = trpc.tuitionBilling.getStudentBillingStatus.useQuery(
    { studentId: student?.studentId ?? 0 },
    { enabled: !!student }
  )
  const chargeStudent = trpc.tuitionBilling.chargeStudentTuition.useMutation()

  if (!student) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white shadow-2xl"
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-6 pb-8 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg overflow-hidden">
                {student.photoUrl
                  ? <img src={student.photoUrl} alt={student.studentName} className="w-full h-full object-cover" />
                  : initials(student.studentName)
                }
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{student.studentName}</h2>
                <p className="text-sm text-red-500 font-medium">{student.daysLate} days overdue · {fmtFull(student.amountDollars)}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => chargeStudent.mutate({ enrollmentId: student.enrollmentId })}
              disabled={chargeStudent.isPending}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-black text-white text-xs font-medium"
            >
              <CreditCard className="w-5 h-5" />
              {chargeStudent.isPending ? 'Charging…' : 'Collect Now'}
            </button>
            {student.phone ? (
              <a
                href={`sms:${student.phone}`}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-blue-50 text-blue-600 text-xs font-medium"
              >
                <MessageSquare className="w-5 h-5" />
                Text
              </a>
            ) : <div />}
            {student.phone ? (
              <a
                href={`tel:${student.phone}`}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-green-50 text-green-600 text-xs font-medium"
              >
                <Phone className="w-5 h-5" />
                Call
              </a>
            ) : <div />}
          </div>

          {/* Billing history */}
          {billingStatus && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment History</h3>
              <div className="space-y-2">
                {(billingStatus.payments as any[]).slice(0, 8).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        p.status === 'success' ? 'bg-green-50' : p.status === 'failed' ? 'bg-red-50' : 'bg-yellow-50'
                      }`}>
                        {p.status === 'success'
                          ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                          : p.status === 'failed'
                          ? <AlertCircle className="w-4 h-4 text-red-500" />
                          : <Clock className="w-4 h-4 text-yellow-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{fmtFull(p.amountDollars)}</p>
                        <p className="text-xs text-gray-400">{p.status === 'success' ? timeAgo(p.paidAt) : p.failureReason || timeAgo(p.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.status === 'success' ? 'bg-green-100 text-green-700'
                      : p.status === 'failed' ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                    }`}>{p.status}</span>
                  </div>
                ))}
                {(billingStatus.payments as any[]).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No payment history</p>
                )}
              </div>
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [mapMode, setMapMode] = useState<'students' | 'payments'>('students')
  const [selectedStudent, setSelectedStudent] = useState<OverdueAccount | null>(null)
  const [kaiDismissed, setKaiDismissed] = useState(false)

  const { data, isLoading, refetch } = trpc.tuitionBilling.getPaymentsDashboard.useQuery(undefined, {
    refetchInterval: 60_000,
  })

  const chargeStudent = trpc.tuitionBilling.chargeStudentTuition.useMutation({
    onSuccess: () => refetch(),
  })

  const bg = isDark ? '#0f0f0f' : '#f5f5f7'
  const cardBg = isDark ? '#1c1c1e' : '#ffffff'
  const textPrimary = isDark ? '#f5f5f7' : '#1d1d1f'
  const textSecondary = isDark ? '#98989d' : '#6e6e73'
  const border = isDark ? '#2c2c2e' : '#e5e5ea'

  const overdueAccounts: OverdueAccount[] = data?.overdueAccounts ?? []
  const transactions: Transaction[] = data?.transactions ?? []

  const filteredTransactions = statusFilter === 'all'
    ? transactions
    : statusFilter === 'overdue'
    ? transactions.filter(t => t.status === 'failed')
    : statusFilter === 'pending'
    ? transactions.filter(t => t.status === 'pending')
    : transactions.filter(t => t.status === 'success')

  const paidMapStudents: any[] = data?.paidMapStudents ?? []

  const allMapStudents = [
    ...overdueAccounts.filter(s => s.latitude && s.longitude).map(s => ({
      id: s.studentId, name: s.studentName,
      lat: parseFloat(s.latitude!), lng: parseFloat(s.longitude!), isPaid: false,
    })),
    ...paidMapStudents.filter((s: any) => s.latitude && s.longitude).map((s: any) => ({
      id: s.id, name: s.name,
      lat: parseFloat(s.latitude), lng: parseFloat(s.longitude), isPaid: true,
    })),
  ]

  const mapCenter: [number, number] = allMapStudents.length > 0
    ? [allMapStudents[0].lat, allMapStudents[0].lng]
    : [30.0933, -95.4611]

  if (isLoading) {
    return (
      <div style={{ background: bg, minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          <p style={{ color: textSecondary }} className="text-sm">Loading payments…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: bg, minHeight: '100vh', color: textPrimary }} className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ background: bg, borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: textPrimary }}>Payments</h1>
            <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Revenue command center</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/payments')}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{ background: isDark ? '#2c2c2e' : '#f2f2f7', color: textSecondary, border: `1px solid ${border}` }}
            >
              Transactions
            </button>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-full transition-colors"
              style={{ background: cardBg, border: `1px solid ${border}` }}
            >
              <RefreshCw className="w-4 h-4" style={{ color: textSecondary }} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-5">

        {/* Collection Efficiency Banner */}
        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #1d1d1f 0%, #3a3a3c 100%)' }}
        >
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Collection Efficiency</p>
            <p className="text-4xl font-bold text-white mt-1">{data?.collectionEfficiency ?? 100}%</p>
            <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
          </div>
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3a3a3c" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none" stroke="#34c759" strokeWidth="3"
                strokeDasharray={`${(data?.collectionEfficiency ?? 100) * 0.999} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        {/* 3 Key Metrics */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Today', value: fmt(data?.todayCollected ?? 0), icon: DollarSign, color: '#34c759', lightBg: '#f0fdf4' },
            { label: 'This Week', value: fmt(data?.weeklyRevenue ?? 0), icon: TrendingUp, color: '#007aff', lightBg: '#eff6ff' },
            { label: 'MRR', value: fmt(data?.mrr ?? 0), icon: ArrowUpRight, color: '#af52de', lightBg: '#faf5ff' },
          ].map(m => (
            <div
              key={m.label}
              className="rounded-2xl p-4 flex flex-col gap-2"
              style={{
                background: isDark ? cardBg : m.lightBg,
                border: `1px solid ${border}`,
                boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: isDark ? '#2c2c2e' : 'white' }}
              >
                <m.icon className="w-4 h-4" style={{ color: m.color }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: textSecondary }}>{m.label}</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: textPrimary }}>{m.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Status Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'overdue', label: `Overdue${data?.overdueCount ? ` · ${data.overdueCount}` : ''}`, activeColor: '#ff3b30' },
            { key: 'pending', label: 'Pending', activeColor: '#ff9500' },
            { key: 'collected', label: 'Collected', activeColor: '#34c759' },
          ].map(chip => {
            const isActive = statusFilter === chip.key
            const activeColor = (chip as any).activeColor || (isDark ? '#48484a' : '#1d1d1f')
            return (
              <button
                key={chip.key}
                onClick={() => setStatusFilter(chip.key as StatusFilter)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: isActive ? activeColor : isDark ? '#2c2c2e' : '#f2f2f7',
                  color: isActive ? 'white' : textSecondary,
                  border: `1px solid ${isActive ? activeColor : border}`,
                }}
              >
                {chip.label}
              </button>
            )
          })}
        </div>

        {/* Kai AI Panel */}
        {!kaiDismissed && data && data.overdueCount > 0 && (statusFilter === 'all' || statusFilter === 'overdue') && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: isDark ? '#1c1c1e' : 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)',
              border: `1px solid ${isDark ? '#3a3a3c' : '#c4b5fd'}`,
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                  {data.overdueCount} account{data.overdueCount !== 1 ? 's' : ''} overdue totaling {fmt(data.overdueTotal)}.
                </p>
                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Want me to follow up with all of them?</p>
                <div className="flex gap-2 mt-3">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-blue-500">
                    <Zap className="w-3.5 h-3.5" />
                    Handle All
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: isDark ? '#2c2c2e' : 'white', color: textPrimary, border: `1px solid ${border}` }}
                    onClick={() => setStatusFilter('overdue')}
                  >
                    Review
                  </button>
                </div>
              </div>
              <button onClick={() => setKaiDismissed(true)} className="p-1 rounded-full hover:bg-black/10">
                <X className="w-4 h-4" style={{ color: textSecondary }} />
              </button>
            </div>
          </div>
        )}

        {/* Overdue Accounts */}
        {(statusFilter === 'all' || statusFilter === 'overdue') && overdueAccounts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold" style={{ color: textPrimary }}>Overdue Accounts</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                {overdueAccounts.length} accounts
              </span>
            </div>
            <div className="space-y-2.5">
              {overdueAccounts.map(account => (
                <div
                  key={account.enrollmentId}
                  className="rounded-2xl p-4 cursor-pointer"
                  style={{
                    background: cardBg,
                    border: `1px solid ${border}`,
                    boxShadow: isDark ? 'none' : '0 1px 6px rgba(0,0,0,0.06)',
                  }}
                  onClick={() => setSelectedStudent(account)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {account.photoUrl
                        ? <img src={account.photoUrl} alt={account.studentName} className="w-full h-full object-cover" />
                        : <span className="text-red-600 font-bold text-sm">{initials(account.studentName)}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm truncate" style={{ color: textPrimary }}>{account.studentName}</p>
                        <p className="text-base font-bold text-red-500 ml-2 flex-shrink-0">{fmtFull(account.amountDollars)}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 font-medium">
                          {account.daysLate}d late
                        </span>
                        {account.retryCount > 0 && (
                          <span className="text-xs" style={{ color: textSecondary }}>
                            {account.retryCount} attempt{account.retryCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="text-xs truncate" style={{ color: textSecondary }}>{account.planName}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: textSecondary }} />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => chargeStudent.mutate({ enrollmentId: account.enrollmentId })}
                      disabled={chargeStudent.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white"
                      style={{ background: '#1d1d1f' }}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Collect Now
                    </button>
                    {account.phone && (
                      <a
                        href={`sms:${account.phone}`}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: isDark ? '#2c2c2e' : '#f2f2f7', color: '#007aff', border: `1px solid ${border}` }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Text
                      </a>
                    )}
                    {account.phone && (
                      <a
                        href={`tel:${account.phone}`}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: isDark ? '#2c2c2e' : '#f2f2f7', color: '#34c759', border: `1px solid ${border}` }}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold" style={{ color: textPrimary }}>Transactions</h2>
            <span className="text-xs" style={{ color: textSecondary }}>{filteredTransactions.length} records</span>
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: cardBg,
              border: `1px solid ${border}`,
              boxShadow: isDark ? 'none' : '0 1px 6px rgba(0,0,0,0.06)',
            }}
          >
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <CreditCard className="w-8 h-8" style={{ color: textSecondary }} />
                <p className="text-sm" style={{ color: textSecondary }}>No transactions found</p>
              </div>
            ) : (
              filteredTransactions.map((tx, i) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderBottom: i < filteredTransactions.length - 1 ? `1px solid ${border}` : 'none' }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    tx.status === 'success' ? 'bg-green-50' : tx.status === 'failed' ? 'bg-red-50' : 'bg-yellow-50'
                  }`}>
                    {tx.status === 'success'
                      ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                      : tx.status === 'failed'
                      ? <AlertCircle className="w-5 h-5 text-red-500" />
                      : <Clock className="w-5 h-5 text-yellow-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: textPrimary }}>{tx.studentName}</p>
                    <p className="text-xs truncate" style={{ color: textSecondary }}>
                      {tx.status === 'success' ? timeAgo(tx.paidAt) : tx.failureReason || timeAgo(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${
                      tx.status === 'success' ? 'text-green-600' : tx.status === 'failed' ? 'text-red-500' : 'text-yellow-600'
                    }`}>
                      {tx.status === 'success' ? '+' : tx.status === 'failed' ? '−' : ''}{fmtFull(tx.amountDollars)}
                    </p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
                      tx.status === 'success' ? 'bg-green-100 text-green-700'
                      : tx.status === 'failed' ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                    }`}>{tx.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold" style={{ color: textPrimary }}>Map</h2>
            <div
              className="flex rounded-xl overflow-hidden"
              style={{ background: isDark ? '#2c2c2e' : '#f2f2f7', border: `1px solid ${border}` }}
            >
              {(['students', 'payments'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setMapMode(mode)}
                  className="px-3 py-1.5 text-xs font-medium capitalize transition-all"
                  style={{
                    background: mapMode === mode ? (isDark ? '#48484a' : 'white') : 'transparent',
                    color: mapMode === mode ? textPrimary : textSecondary,
                    boxShadow: mapMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {mode === 'payments' ? 'Payment Map' : 'Student Map'}
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{
              height: 280,
              border: `1px solid ${border}`,
              boxShadow: isDark ? 'none' : '0 1px 6px rgba(0,0,0,0.06)',
            }}
          >
            {allMapStudents.length > 0 ? (
              <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer
                  url={isDark
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}
                  attribution='&copy; OpenStreetMap contributors'
                />
                {allMapStudents.map(s => (
                  <Marker
                    key={`${s.isPaid ? 'p' : 'u'}-${s.id}`}
                    position={[s.lat, s.lng]}
                    icon={mapMode === 'payments' ? (s.isPaid ? greenIcon : redIcon) : new L.Icon.Default()}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{s.name}</p>
                        {mapMode === 'payments' && (
                          <p className={s.isPaid ? 'text-green-600' : 'text-red-500'}>
                            {s.isPaid ? '✓ Paid' : '⚠ Overdue'}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div
                className="h-full flex flex-col items-center justify-center gap-2"
                style={{ background: isDark ? '#1c1c1e' : '#f5f5f7' }}
              >
                <MapPin className="w-8 h-8" style={{ color: textSecondary }} />
                <p className="text-sm" style={{ color: textSecondary }}>No location data available</p>
                <p className="text-xs text-center px-6" style={{ color: textSecondary }}>
                  Add addresses to student profiles to see them here
                </p>
              </div>
            )}
          </div>

          {mapMode === 'payments' && allMapStudents.length > 0 && (
            <div className="flex items-center gap-4 mt-2 px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs" style={{ color: textSecondary }}>Paid ({paidMapStudents.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs" style={{ color: textSecondary }}>
                  Overdue ({overdueAccounts.filter(a => a.latitude).length})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Empty state */}
        {!isLoading && overdueAccounts.length === 0 && transactions.length === 0 && (
          <div
            className="rounded-2xl p-8 flex flex-col items-center gap-3 text-center"
            style={{ background: cardBg, border: `1px solid ${border}` }}
          >
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <div>
              <p className="font-semibold" style={{ color: textPrimary }}>All caught up!</p>
              <p className="text-sm mt-1" style={{ color: textSecondary }}>No overdue accounts. Payments are on track.</p>
            </div>
          </div>
        )}

      </div>

      {/* Student Bottom Sheet */}
      {selectedStudent && (
        <StudentPaymentSheet
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  )
}
