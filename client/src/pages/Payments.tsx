import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { useTheme } from '@/contexts/ThemeContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Zap,
  Play,
  Users,
  BadgeCheck,
  Ban,
  SkipForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(dollars: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dollars);
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function statusConfig(status: string) {
  switch (status?.toLowerCase()) {
    case 'settled':
      return { label: 'Settled', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle };
    case 'pending_settlement':
    case 'pending':
      return { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: Clock };
    case 'voided':
      return { label: 'Voided', color: 'text-gray-400', bg: 'bg-gray-400/10', icon: XCircle };
    case 'declined':
      return { label: 'Declined', color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle };
    case 'refunded':
    case 'partially_refunded':
      return { label: status === 'partially_refunded' ? 'Part. Refunded' : 'Refunded', color: 'text-orange-400', bg: 'bg-orange-400/10', icon: ArrowDownRight };
    default:
      return { label: status || 'Unknown', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: AlertCircle };
  }
}

function typeConfig(type: string) {
  switch (type?.toLowerCase()) {
    case 'sale': return { label: 'Sale', color: 'text-emerald-400' };
    case 'refund': return { label: 'Refund', color: 'text-orange-400' };
    case 'void': return { label: 'Void', color: 'text-gray-400' };
    default: return { label: type || '—', color: 'text-gray-300' };
  }
}

// ─── custom tooltip ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl text-sm">
      <p className="text-zinc-300 font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-1">
          <span className="font-medium">{p.name}:</span>
          <span>{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

// ─── date range helpers ───────────────────────────────────────────────────────

function getDateRange(preset: string): { start: string; end: string; label: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  // Always use YYYY-MM-DD format (no milliseconds) for FluidPay API compatibility
  const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

  switch (preset) {
    case 'this_month': {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
      return { start: `${iso(start)}T00:00:00Z`, end: `${iso(end)}T23:59:59Z`, label: 'This Month' };
    }
    case 'last_month': {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
      return { start: `${iso(start)}T00:00:00Z`, end: `${iso(end)}T23:59:59Z`, label: 'Last Month' };
    }
    case 'last_30': {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30));
      return { start: `${iso(start)}T00:00:00Z`, end: `${iso(now)}T23:59:59Z`, label: 'Last 30 Days' };
    }
    case 'last_90': {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 90));
      return { start: `${iso(start)}T00:00:00Z`, end: `${iso(now)}T23:59:59Z`, label: 'Last 90 Days' };
    }
    case 'ytd': {
      const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      return { start: `${iso(start)}T00:00:00Z`, end: `${iso(now)}T23:59:59Z`, label: 'Year to Date' };
    }
    default:
      return getDateRange('this_month');
  }
}

// ─── main component ───────────────────────────────────────────────────────────

export default function Payments() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark' || theme === 'cinematic';

  const [datePreset, setDatePreset] = useState('this_month');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  // ── Run Billing state ──────────────────────────────────────────────────────
  const [showRunBillingConfirm, setShowRunBillingConfirm] = useState(false);
  const [showRunBillingResults, setShowRunBillingResults] = useState(false);
  const [billingResults, setBillingResults] = useState<any>(null);
  const { toast } = useToast();

  const runBillingMutation = trpc.tuitionBilling.runBillingForAll.useMutation({
    onSuccess: (data) => {
      setBillingResults(data);
      setShowRunBillingConfirm(false);
      setShowRunBillingResults(true);
      refetchAll();
    },
    onError: (err) => {
      toast({ title: 'Billing Run Failed', description: err.message, variant: 'destructive' });
      setShowRunBillingConfirm(false);
    },
  });

  const dateRange = useMemo(() => getDateRange(datePreset), [datePreset]);

  // ── data fetching ──────────────────────────────────────────────────────────

  const { data: revenueData, isLoading: revLoading, refetch: refetchRevenue } =
    trpc.kaiData.getFluidPayRevenue.useQuery({});

  const { data: historyData, isLoading: histLoading, refetch: refetchHistory } =
    trpc.kaiData.getFluidPayRevenueHistory.useQuery({ months: 6 });

  const { data: txData, isLoading: txLoading, refetch: refetchTx } =
    trpc.kaiData.getFluidPayAllTransactions.useQuery({
      startDate: dateRange.start,
      endDate: dateRange.end,
      limit: 200,
    });

  const isLoading = revLoading || histLoading || txLoading;

  function refetchAll() {
    refetchRevenue();
    refetchHistory();
    refetchTx();
  }

  // ── derived data ───────────────────────────────────────────────────────────

  const allTransactions = txData?.transactions || [];

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(tx => {
      const name = `${tx.billing?.first_name || ''} ${tx.billing?.last_name || ''}`.toLowerCase();
      const matchSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) ||
        tx.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === 'all' || tx.type === typeFilter;
      const matchStatus = statusFilter === 'all' || tx.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [allTransactions, searchQuery, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const pagedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Summary stats from current month
  const thisMonthRevenue = revenueData?.connected ? revenueData : null;
  const chartData = historyData?.connected ? (historyData.history || []) : [];

  // Compute totals from filtered transactions
  const filteredSales = filteredTransactions.filter(t => t.type === 'sale' && t.status !== 'voided' && t.status !== 'declined');
  const filteredRefunds = filteredTransactions.filter(t => t.type === 'refund');
  const filteredTotal = filteredSales.reduce((s, t) => s + (t.amount || 0), 0) / 100;
  const filteredRefundTotal = filteredRefunds.reduce((s, t) => s + (t.amount || 0), 0) / 100;
  const filteredNet = filteredTotal - filteredRefundTotal;

  const notConnected = revenueData && !revenueData.connected;

  // ── render ─────────────────────────────────────────────────────────────────

  const cardBase = isDark
    ? 'bg-zinc-900/80 border border-zinc-800 rounded-2xl'
    : 'bg-white border border-gray-200 rounded-2xl shadow-sm';

  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-500';
  const inputBg = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500' : 'bg-white border-gray-300 text-gray-900';
  const tableBorder = isDark ? 'border-zinc-800' : 'border-gray-200';
  const tableRowHover = isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50';
  const tableHeader = isDark ? 'text-zinc-500 bg-zinc-900/50' : 'text-gray-500 bg-gray-50';

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <h1 className={`text-2xl font-bold ${textPrimary}`}>Payments</h1>
          </div>
          <p className={`text-sm ${textSecondary}`}>Live FluidPay transaction data for your dojo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowRunBillingConfirm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-md"
          >
            <Play className="w-4 h-4 mr-1.5" />
            Run Billing
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/payments/dashboard')}
            className={isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 border-violet-500/50' : 'border-violet-300 text-violet-700 hover:bg-violet-50'}
          >
            <Zap className="w-4 h-4 mr-1.5" />
            Command Center
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refetchAll}
            disabled={isLoading}
            className={isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Not Connected Banner ── */}
      {notConnected && (
        <div className={`${cardBase} p-5 mb-6 flex items-center gap-4`}>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className={`font-semibold ${textPrimary}`}>FluidPay not connected</p>
            <p className={`text-sm ${textSecondary}`}>
              Ask Kai to connect your FluidPay account — just say "connect my FluidPay" and provide your API key.
            </p>
          </div>
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard
          label="This Month"
          value={thisMonthRevenue ? fmt(thisMonthRevenue.totalDollars || 0) : '—'}
          sub={thisMonthRevenue ? `${thisMonthRevenue.transactionCount || 0} transactions` : 'Loading…'}
          icon={DollarSign}
          iconColor="text-violet-400"
          iconBg="bg-violet-400/10"
          trend={null}
          isDark={isDark}
        />
        <SummaryCard
          label="Settled"
          value={thisMonthRevenue ? fmt(thisMonthRevenue.settledDollars || 0) : '—'}
          sub="Cleared funds"
          icon={CheckCircle}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-400/10"
          trend={null}
          isDark={isDark}
        />
        <SummaryCard
          label="Pending"
          value={thisMonthRevenue ? fmt(thisMonthRevenue.pendingDollars || 0) : '—'}
          sub="Awaiting settlement"
          icon={Clock}
          iconColor="text-amber-400"
          iconBg="bg-amber-400/10"
          trend={null}
          isDark={isDark}
        />
        <SummaryCard
          label="Refunds"
          value={thisMonthRevenue ? fmt(thisMonthRevenue.refundDollars || 0) : '—'}
          sub="This month"
          icon={ArrowDownRight}
          iconColor="text-orange-400"
          iconBg="bg-orange-400/10"
          trend={null}
          isDark={isDark}
        />
      </div>

      {/* ── Revenue Chart ── */}
      <div className={`${cardBase} p-5 mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-base font-semibold ${textPrimary}`}>Revenue — Last 6 Months</h2>
            <p className={`text-xs ${textSecondary} mt-0.5`}>Total collected vs. refunds by month</p>
          </div>
          {histLoading && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading…
            </div>
          )}
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e5e7eb'} vertical={false} />
              <XAxis
                dataKey="monthShort"
                tick={{ fill: isDark ? '#71717a' : '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                tick={{ fill: isDark ? '#71717a' : '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: isDark ? '#a1a1aa' : '#6b7280' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="totalDollars" name="Revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={48} />
              <Bar dataKey="settledDollars" name="Settled" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={48} />
              <Bar dataKey="refundDollars" name="Refunds" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className={`h-[260px] flex items-center justify-center ${textSecondary} text-sm`}>
            {histLoading ? 'Loading chart data…' : 'No revenue data available yet.'}
          </div>
        )}
      </div>

      {/* ── Transaction History Table ── */}
      <div className={`${cardBase} overflow-hidden`}>
        {/* Table header / filters */}
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h2 className={`text-base font-semibold ${textPrimary}`}>Transaction History</h2>
            <p className={`text-xs ${textSecondary} mt-0.5`}>
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} · {dateRange.label}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Date range */}
            <Select value={datePreset} onValueChange={v => { setDatePreset(v); setCurrentPage(1); }}>
              <SelectTrigger className={`w-36 h-8 text-xs ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : ''}>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="last_30">Last 30 Days</SelectItem>
                <SelectItem value="last_90">Last 90 Days</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>

            {/* Type filter */}
            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className={`w-28 h-8 text-xs ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : ''}`}>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className={isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : ''}>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sale">Sales</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className={`w-32 h-8 text-xs ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : ''}`}>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className={isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : ''}>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
                <SelectItem value="pending_settlement">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="voided">Voided</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <Input
                placeholder="Search…"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className={`pl-8 h-8 w-40 text-xs ${inputBg}`}
              />
            </div>
          </div>
        </div>

        {/* Filtered summary row */}
        {(typeFilter !== 'all' || statusFilter !== 'all' || searchQuery || datePreset !== 'this_month') && (
          <div className={`px-4 py-2 text-xs flex gap-4 ${isDark ? 'bg-zinc-900/40 text-zinc-400 border-b border-zinc-800' : 'bg-gray-50 text-gray-500 border-b border-gray-200'}`}>
            <span>Total: <strong className={isDark ? 'text-white' : 'text-gray-900'}>{fmt(filteredTotal)}</strong></span>
            {filteredRefundTotal > 0 && <span>Refunds: <strong className="text-orange-400">−{fmt(filteredRefundTotal)}</strong></span>}
            <span>Net: <strong className="text-emerald-400">{fmt(filteredNet)}</strong></span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs uppercase tracking-wider ${tableHeader} border-b ${tableBorder}`}>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Card</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${tableBorder}`}>
              {txLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className={tableRowHover}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className={`h-4 rounded ${isDark ? 'bg-zinc-800' : 'bg-gray-200'} animate-pulse`} style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pagedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`px-4 py-12 text-center ${textSecondary}`}>
                    {allTransactions.length === 0
                      ? 'No transactions found for this period.'
                      : 'No transactions match your filters.'}
                  </td>
                </tr>
              ) : (
                pagedTransactions.map(tx => {
                  const sc = statusConfig(tx.status);
                  const tc = typeConfig(tx.type);
                  const StatusIcon = sc.icon;
                  const isRefund = tx.type === 'refund';
                  const amountDollars = (tx.amount || 0) / 100;

                  return (
                    <tr key={tx.id} className={`${tableRowHover} transition-colors`}>
                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className={`font-medium ${textPrimary}`}>{fmtDate(tx.created_at)}</p>
                        <p className={`text-xs ${textSecondary}`}>{fmtTime(tx.created_at)}</p>
                      </td>
                      {/* Customer */}
                      <td className="px-4 py-3">
                        <p className={`font-medium ${textPrimary}`}>
                          {tx.billing?.first_name || tx.billing?.last_name
                            ? `${tx.billing?.first_name || ''} ${tx.billing?.last_name || ''}`.trim()
                            : '—'}
                        </p>
                        {tx.billing?.email && (
                          <p className={`text-xs ${textSecondary} truncate max-w-[160px]`}>{tx.billing.email}</p>
                        )}
                      </td>
                      {/* Description */}
                      <td className="px-4 py-3">
                        <p className={`text-xs ${textSecondary} truncate max-w-[180px]`}>
                          {tx.description || tx.order_id || '—'}
                        </p>
                      </td>
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${tc.color}`}>{tc.label}</span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sc.color} ${sc.bg}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      {/* Card */}
                      <td className="px-4 py-3">
                        {tx.card?.masked_card ? (
                          <p className={`text-xs font-mono ${textSecondary}`}>
                            ···· {tx.card.masked_card.slice(-4)}
                            {tx.card.card_type && <span className="ml-1 text-zinc-600">{tx.card.card_type}</span>}
                          </p>
                        ) : (
                          <span className={`text-xs ${textSecondary}`}>—</span>
                        )}
                      </td>
                      {/* Amount */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className={`font-semibold ${isRefund ? 'text-orange-400' : 'text-emerald-400'}`}>
                          {isRefund ? '−' : ''}{fmt(amountDollars)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-4 py-3 border-t ${tableBorder} flex items-center justify-between`}>
            <p className={`text-xs ${textSecondary}`}>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredTransactions.length)} of {filteredTransactions.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`h-7 w-7 p-0 ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : ''}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`h-7 w-7 p-0 text-xs ${page === currentPage
                      ? 'bg-violet-600 hover:bg-violet-700 text-white'
                      : isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : ''}`}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`h-7 w-7 p-0 ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : ''}`}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Transaction ID footer note ── */}
      <p className={`text-xs ${textSecondary} mt-4 text-center`}>
        Data sourced live from FluidPay · Amounts in USD
      </p>

      {/* ── Run Billing Confirmation Dialog ── */}
      <Dialog open={showRunBillingConfirm} onOpenChange={setShowRunBillingConfirm}>
        <DialogContent className={isDark ? 'bg-zinc-900 border-zinc-700 text-white' : ''}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Play className="w-4 h-4 text-emerald-500" />
              </div>
              Run Billing for All Students
            </DialogTitle>
            <DialogDescription className={isDark ? 'text-zinc-400' : ''}>
              This will charge all active enrollments that have a card on file. Students without a card will be skipped.
            </DialogDescription>
          </DialogHeader>

          <div className={`rounded-xl p-4 my-2 ${isDark ? 'bg-zinc-800/60' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>What happens when you click Confirm:</p>
                <ul className={`text-sm mt-1.5 space-y-1 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                  <li>• All active enrollments with a card on file will be charged</li>
                  <li>• Failed charges will be marked as <span className="text-amber-500 font-medium">past_due</span></li>
                  <li>• Next billing dates will be updated for successful charges</li>
                  <li>• A full results report will be shown after</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRunBillingConfirm(false)}
              className={isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : ''}
            >
              Cancel
            </Button>
            <Button
              onClick={() => runBillingMutation.mutate({ dryRun: false })}
              disabled={runBillingMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {runBillingMutation.isPending ? (
                <><RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Charging... </>
              ) : (
                <><Play className="w-4 h-4 mr-1.5" /> Confirm & Charge All</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Run Billing Results Modal ── */}
      <Dialog open={showRunBillingResults} onOpenChange={setShowRunBillingResults}>
        <DialogContent className={`max-w-2xl max-h-[80vh] overflow-hidden flex flex-col ${isDark ? 'bg-zinc-900 border-zinc-700 text-white' : ''}`}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <BadgeCheck className="w-4 h-4 text-emerald-500" />
              </div>
              Billing Run Complete
            </DialogTitle>
          </DialogHeader>

          {billingResults && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3 my-2">
                <div className={`rounded-xl p-3 text-center ${isDark ? 'bg-zinc-800' : 'bg-emerald-50 border border-emerald-100'}`}>
                  <p className="text-2xl font-bold text-emerald-500">{billingResults.summary.succeeded}</p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Charged</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${isDark ? 'bg-zinc-800' : 'bg-red-50 border border-red-100'}`}>
                  <p className="text-2xl font-bold text-red-500">{billingResults.summary.failed}</p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Failed</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${isDark ? 'bg-zinc-800' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {fmt(billingResults.summary.totalCollected)}
                  </p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Total Collected</p>
                </div>
              </div>

              {/* Per-student results */}
              <div className="overflow-y-auto flex-1 rounded-xl border ${isDark ? 'border-zinc-800' : 'border-gray-200'}">
                {billingResults.results.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-zinc-600' : 'text-gray-300'}`} />
                    <p className={`font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>No active enrollments with cards on file</p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>Enroll students and add cards to run billing.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-gray-200 bg-gray-50'}`}>
                        <th className={`px-4 py-2.5 text-left text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Student</th>
                        <th className={`px-4 py-2.5 text-left text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Plan</th>
                        <th className={`px-4 py-2.5 text-left text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Card</th>
                        <th className={`px-4 py-2.5 text-right text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Amount</th>
                        <th className={`px-4 py-2.5 text-center text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y ${isDark ? 'divide-zinc-800' : 'divide-gray-100'}">
                      {billingResults.results.map((r: any, i: number) => (
                        <tr key={i} className={isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-gray-50'}>
                          <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{r.studentName}</td>
                          <td className={`px-4 py-3 text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{r.planName}</td>
                          <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                            {r.cardLast4 ? `···· ${r.cardLast4}` : '—'}
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold ${r.chargeStatus === 'success' ? 'text-emerald-500' : isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                            {fmt(r.amountDollars)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {r.chargeStatus === 'success' && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-400/10">
                                <CheckCircle className="w-3 h-3" /> Charged
                              </span>
                            )}
                            {r.chargeStatus === 'failed' && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-400/10" title={r.chargeError}>
                                <Ban className="w-3 h-3" /> Failed
                              </span>
                            )}
                            {r.chargeStatus === 'skipped' && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-gray-500 bg-gray-100 dark:text-zinc-400 dark:bg-zinc-800">
                                <SkipForward className="w-3 h-3" /> Skipped
                              </span>
                            )}
                            {r.chargeStatus === 'dry_run' && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-400/10">
                                <Zap className="w-3 h-3" /> Preview
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              onClick={() => setShowRunBillingResults(false)}
              className={isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : ''}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Summary Card sub-component ──────────────────────────────────────────────

function SummaryCard({
  label, value, sub, icon: Icon, iconColor, iconBg, trend, isDark
}: {
  label: string;
  value: string;
  sub: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  trend: { value: number; label: string } | null;
  isDark: boolean;
}) {
  const cardBase = isDark
    ? 'bg-zinc-900/80 border border-zinc-800 rounded-2xl'
    : 'bg-white border border-gray-200 rounded-2xl shadow-sm';

  return (
    <div className={`${cardBase} p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
        </div>
        {trend && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.value >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-tight`}>{value}</p>
      <p className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'} mt-0.5`}>{label}</p>
      <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-gray-400'} mt-0.5`}>{sub}</p>
    </div>
  );
}
