import React, { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Bot,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Settings,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import BottomNavLayout from '../components/BottomNavLayout';
import ManagementLayout from '../components/ManagementLayout';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// Type icons mapping
const TYPE_ICONS: Record<string, React.ReactNode> = {
  kai_chat: <Bot className="w-4 h-4" />,
  ai_sms: <MessageSquare className="w-4 h-4" />,
  ai_email: <Mail className="w-4 h-4" />,
  ai_phone_call: <Phone className="w-4 h-4" />,
  automation: <Sparkles className="w-4 h-4" />,
  data_analysis: <TrendingUp className="w-4 h-4" />,
  other: <Zap className="w-4 h-4" />,
};

// Type colors mapping
const TYPE_COLORS: Record<string, string> = {
  kai_chat: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ai_sms: 'bg-green-500/20 text-green-400 border-green-500/30',
  ai_email: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ai_phone_call: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  automation: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  data_analysis: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

// Type labels mapping
const TYPE_LABELS: Record<string, string> = {
  kai_chat: 'AI Chat',
  ai_sms: 'SMS',
  ai_email: 'Emails',
  ai_phone_call: 'Voice Calls',
  automation: 'Automations',
  data_analysis: 'Data Analysis',
  other: 'Other',
};

// Status badge colors
const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-500/20 text-emerald-400',
  delivered: 'bg-emerald-500/20 text-emerald-400',
  pending: 'bg-amber-500/20 text-amber-400',
  failed: 'bg-red-500/20 text-red-400',
};

/**
 * Credits & Billing Dashboard
 * Comprehensive credit management with usage tracking, plan info, and billing controls
 */
const CreditTransactions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [lowCreditAlert, setLowCreditAlert] = useState<number>(100);
  const [autoTopUp, setAutoTopUp] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedCredits, setSelectedCredits] = useState(100);
  const itemsPerPage = 10;

  // Credit top-up mutation
  const createTopUpCheckout = trpc.subscription.createCreditTopUpCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create checkout session');
    },
  })

  // Trial checkout mutation
  const createTrialCheckoutMutation = trpc.subscription.createTrialCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
        toast.success('Redirecting to Stripe checkout...');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to start trial checkout');
    },
  });
;

  // Credit pricing tiers
  const { data: pricingData } = trpc.subscription.getCreditTopUpPricing.useQuery();

  // Calculate date range - memoized to prevent infinite query loops
  const startDate = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return undefined;
    }
  }, [dateRange]);

  // Fetch credit balance - use staleTime for instant subsequent loads
  const { data: creditBalance, isLoading: balanceLoading, isError: balanceError } = trpc.credits.getBalance.useQuery(undefined, {
    refetchInterval: 60000,
    retry: false,
    staleTime: 30000, // Cache for 30 seconds - prevents loading state on navigation
  });

  // Fetch subscription data
  const { data: subscription, isLoading: subLoading } = trpc.subscription.getCurrentSubscription.useQuery(
    { organizationId: user?.activeOrgId || 1 }, // Get from user context
    { 
      enabled: !!user && !!user.activeOrgId,
      staleTime: 60000, // Cache for 1 minute
    }
  );

  // Fetch all plans for upgrade options
  const { data: allPlans } = trpc.subscription.getPlans.useQuery(undefined, {
    staleTime: 300000, // Cache for 5 minutes - plans rarely change
  });

  // Memoize taskType to prevent query re-runs
  const taskType = useMemo(() => 
    taskTypeFilter === 'all' ? undefined : taskTypeFilter as any,
    [taskTypeFilter]
  );

  // Fetch transactions with filters - reduced initial limit for faster load
  const { data: transactions, isLoading: txLoading } = trpc.subscription.getCreditTransactions.useQuery({
    organizationId: user?.activeOrgId || 1, // Get from user context
    taskType,
    startDate,
    limit: 100, // Reduced from 500 for faster initial load
  }, {
    enabled: !!user && !!user.activeOrgId,
    staleTime: 30000, // Cache for 30 seconds to prevent unnecessary refetches
  });

  // Calculate usage summary by type
  const usageSummary = useMemo(() => {
    if (!transactions) return {};
    const summary: Record<string, { count: number; credits: number }> = {};
    transactions.forEach((tx) => {
      if (tx.type === 'deduction' && tx.taskType) {
        if (!summary[tx.taskType]) {
          summary[tx.taskType] = { count: 0, credits: 0 };
        }
        summary[tx.taskType].count++;
        summary[tx.taskType].credits += Math.abs(tx.amount);
      }
    });
    return summary;
  }, [transactions]);

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    if (!transactions) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return transactions.slice(start, start + itemsPerPage);
  }, [transactions, currentPage]);

  const totalPages = transactions ? Math.ceil(transactions.length / itemsPerPage) : 0;

  // Calculate days remaining at current usage rate
  const daysRemaining = useMemo(() => {
    if (!creditBalance || !transactions) return null;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDeductions = transactions.filter(
      (tx) => tx.type === 'deduction' && new Date(tx.createdAt) > thirtyDaysAgo
    );
    const totalUsed = recentDeductions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const avgDaily = totalUsed / 30;
    if (avgDaily === 0) return null;
    return Math.floor(creditBalance.creditsRemaining / avgDaily);
  }, [creditBalance, transactions]);

  // Calculate average daily usage
  const avgDailyUsage = useMemo(() => {
    if (!transactions) return 0;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDeductions = transactions.filter(
      (tx) => tx.type === 'deduction' && new Date(tx.createdAt) > thirtyDaysAgo
    );
    const totalUsed = recentDeductions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    return Math.round(totalUsed / 30);
  }, [transactions]);

  // Credits used this month
  const creditsUsedThisMonth = useMemo(() => {
    if (!transactions) return 0;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthDeductions = transactions.filter(
      (tx) => tx.type === 'deduction' && new Date(tx.createdAt) >= startOfMonth
    );
    return monthDeductions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  }, [transactions]);

  // Progress bar percentage
  const usagePercentage = useMemo(() => {
    if (!creditBalance) return 0;
    const total = creditBalance.creditsRemaining + creditBalance.creditsUsed;
    if (total === 0) return 0;
    return Math.round((creditBalance.creditsUsed / total) * 100);
  }, [creditBalance]);

  // Progress bar color based on remaining credits
  const getProgressColor = () => {
    if (!creditBalance) return 'bg-emerald-500';
    const remaining = creditBalance.creditsRemaining;
    if (remaining <= 10) return 'bg-red-500';
    if (remaining <= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // Export to CSV
  const handleExport = () => {
    if (!transactions || transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Date', 'Type', 'Task Type', 'Description', 'Credits', 'Balance After'];
    const rows = transactions.map((tx) => [
      new Date(tx.createdAt).toLocaleString(),
      tx.type,
      tx.taskType || '-',
      tx.description || '-',
      tx.amount.toString(),
      tx.balanceAfter.toString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-usage-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Usage report exported successfully');
  };

  // Get upgrade plans (plans with more credits than current)
  const upgradePlans = useMemo(() => {
    if (!allPlans || !subscription) return [];
    return allPlans.filter((plan) => plan.monthlyCredits > (subscription.plan?.monthlyCredits || 0));
  }, [allPlans, subscription]);

  // Show skeleton only very briefly - don't block on any query
  // Use staleTime and caching to make subsequent loads instant
  const isInitialLoad = balanceLoading && !creditBalance && !balanceError;

  // Loading skeleton
  if (isInitialLoad) {
    return (
      <ManagementLayout>
        <div className="p-6">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex gap-6">
              {/* Main content skeleton */}
              <div className="flex-1 space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-96 w-full rounded-xl" />
              </div>
              {/* Sidebar skeleton */}
              <div className="w-80 space-y-4">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div className="p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex gap-6">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Credits & Billing</h1>
                  <p className="text-slate-400 mt-1">Manage your credits, track usage, and adjust your plan.</p>
                </div>
              </div>

              {/* Credit Status Card */}
              <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-slate-300">Credits Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Main stats row */}
                  <div className="grid grid-cols-4 gap-6">
                    {/* Credits Remaining */}
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-white">
                          {creditBalance?.creditsRemaining.toLocaleString() || 0}
                        </span>
                        <span className="text-slate-400 text-sm">Credits Remaining</span>
                      </div>
                    </div>

                    {/* Used This Month */}
                    <div className="space-y-1 border-l border-slate-700 pl-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">{creditsUsedThisMonth.toLocaleString()}</span>
                        <span className="text-slate-400 text-sm">Used This Month</span>
                      </div>
                    </div>

                    {/* Avg Daily Usage */}
                    <div className="space-y-1 border-l border-slate-700 pl-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">{avgDailyUsage}</span>
                        <span className="text-slate-400 text-sm">Avg Daily Usage</span>
                      </div>
                    </div>

                    {/* Days Remaining */}
                    <div className="space-y-1 border-l border-slate-700 pl-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">{daysRemaining ?? '∞'}</span>
                        <span className="text-slate-400 text-sm">Days Remaining</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar and plan info */}
                  <div className="flex items-center gap-4">
                    {/* Progress bar */}
                    <div className="flex-1">
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor()} transition-all duration-500`}
                          style={{ width: `${100 - usagePercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-slate-500">
                        <span>0</span>
                        <span>{creditBalance?.planAllowance || 800}</span>
                        <span className="text-slate-400">or 100X</span>
                      </div>
                    </div>

                    {/* Current Plan Badge */}
                    <Link
                      to="/pricing"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group"
                    >
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-white font-medium">{subscription?.plan?.name || 'DojoFlow Standard'}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  {/* Low credits warning */}
                  {creditBalance && daysRemaining !== null && daysRemaining <= 5 && (
                    <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <span className="text-amber-300 text-sm">
                        <strong>Low credits!</strong> Only {daysRemaining} days left at this usage rate.
                      </span>
                    </div>
                  )}

                  {/* Controls row */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                    <div className="flex items-center gap-6">
                      {/* Low Credit Alert */}
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-400">Low-credit alert at:</span>
                        <Select value={lowCreditAlert.toString()} onValueChange={(v) => setLowCreditAlert(Number(v))}>
                          <SelectTrigger className="w-24 h-8 bg-slate-900 border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="250">250</SelectItem>
                            <SelectItem value="500">500</SelectItem>
                          </SelectContent>
                        </Select>
                        <Settings className="w-4 h-4 text-slate-500 cursor-pointer hover:text-slate-300" />
                      </div>

                      {/* Auto Top-Up */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Auto top-up:</span>
                        <span className="text-sm text-slate-500">Off</span>
                        <Switch
                          checked={autoTopUp}
                          onCheckedChange={(checked) => {
                            setAutoTopUp(checked);
                            toast.info(checked ? 'Auto top-up enabled' : 'Auto top-up disabled');
                          }}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 hover:bg-slate-700"
                        onClick={() => toast.info('Invoice download coming soon')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Invoice
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 hover:bg-slate-700"
                        onClick={handleExport}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Export Usage (CSV)
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>


              {/* Trial CTA Section - Show if no active subscription */}
              {(!subscription || subscription.status !== 'active') && (
                <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-red-600 to-red-700 p-8 border border-red-500/30">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:40px_40px]" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-white mb-2">Start Your Free Trial</h2>
                      <p className="text-red-100 text-lg mb-4">
                        Get 7 days of full access. Just $1 today to verify your card — then $49.99/month after your trial.
                      </p>
                      <ul className="space-y-2 text-red-50 text-sm mb-6">
                        <li className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-red-200 flex-shrink-0" />
                          <span>Unlimited AI chat messages</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-red-200 flex-shrink-0" />
                          <span>SMS and email automation</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-red-200 flex-shrink-0" />
                          <span>AI phone calls</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-red-200 flex-shrink-0" />
                          <span>Full feature access</span>
                        </li>
                      </ul>
                      <p className="text-xs text-red-100">$1 card verification today. $49.99/month after your 7-day trial. Cancel anytime.</p>
                    </div>
                    
                    {/* CTA Button */}
                    <div className="flex-shrink-0 ml-8">
                      <Button
                        onClick={async () => {
                          if (!user?.id) {
                            toast.error('Please log in to start a trial');
                            return;
                          }
                          // Get organizationId from user context
                          const organizationId = user?.activeOrgId;
                          if (!organizationId) {
                            toast.error('Organization not found. Please contact support.');
                            return;
                          }
                          try {
                            console.log('[Trial Checkout] Starting trial checkout for org:', organizationId);
                            const result = await createTrialCheckoutMutation.mutateAsync({
                              organizationId,
                              customerEmail: user.email,
                            });
                            console.log('[Trial Checkout] Result:', result);
                            if (result?.url) {
                              console.log('[Trial Checkout] Redirecting to Stripe:', result.url);
                              window.open(result.url, '_blank');
                              toast.success('Redirecting to Stripe checkout...');
                            } else {
                              console.error('[Trial Checkout] No URL in response:', result);
                              toast.error('Failed to create checkout session - no URL returned');
                            }
                          } catch (error) {
                            console.error('[Trial Checkout] Error:', error);
                            const errorMsg = error?.message || error?.data?.message || 'Failed to start trial checkout';
                            console.error('[Trial Checkout] Error message:', errorMsg);
                            toast.error(errorMsg);
                          }
                        }}
                        disabled={createTrialCheckoutMutation.isPending}
                        className="bg-white hover:bg-red-50 text-red-600 font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap"
                      >
                        {createTrialCheckoutMutation.isPending ? 'Starting Trial...' : 'Start 7-Day Free Trial →'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Usage Breakdown Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Usage Breakdown</h2>

                  {/* Action Tabs */}
                  <div className="flex items-center gap-2">
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setShowPurchaseModal(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Buy Credits
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-600 hover:bg-slate-700"
                      onClick={() => navigate('/pricing')}
                    >
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-600 hover:bg-slate-700"
                      onClick={() => toast.info('Add Payment Method coming soon')}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Add Payment Method
                    </Button>
                    <Button variant="outline" className="border-slate-600 hover:bg-slate-700" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      Export to CSV
                    </Button>
                  </div>
                </div>

                {/* Usage Summary Cards */}
                <div className="grid grid-cols-6 gap-3">
                  {Object.entries(TYPE_LABELS).map(([key, label]) => {
                    const usage = usageSummary[key] || { count: 0, credits: 0 };
                    return (
                      <Tooltip key={key}>
                        <TooltipTrigger asChild>
                          <div
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${TYPE_COLORS[key]}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {TYPE_ICONS[key]}
                              <span className="text-sm font-medium">{label}</span>
                            </div>
                            <div className="text-2xl font-bold">{usage.credits}</div>
                            <div className="text-xs opacity-70">{usage.count} operations</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {usage.count} {label.toLowerCase()} operations used {usage.credits} credits
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Transactions Table */}
                <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                  {/* Table Header with Filters */}
                  <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Type Filter */}
                      <Select value={taskTypeFilter} onValueChange={setTaskTypeFilter}>
                        <SelectTrigger className="w-40 bg-slate-900 border-slate-700">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {Object.entries(TYPE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Date Range Filter */}
                      <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
                        <SelectTrigger className="w-36 bg-slate-900 border-slate-700">
                          <Calendar className="w-4 h-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7d">Last 7 days</SelectItem>
                          <SelectItem value="30d">Last 30 days</SelectItem>
                          <SelectItem value="90d">Last 90 days</SelectItem>
                          <SelectItem value="all">All time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-sm text-slate-400">
                      {transactions?.length || 0} transactions
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-900/50">
                        <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                          <th className="px-4 py-3 font-medium">Type</th>
                          <th className="px-4 py-3 font-medium">Direction</th>
                          <th className="px-4 py-3 font-medium">Units</th>
                          <th className="px-4 py-3 font-medium">Credits</th>
                          <th className="px-4 py-3 font-medium">Related Object</th>
                          <th className="px-4 py-3 font-medium">Time</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {paginatedTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center">
                              <Zap className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                              <p className="text-slate-400">No usage yet — your activity will appear here.</p>
                            </td>
                          </tr>
                        ) : (
                          paginatedTransactions.map((tx) => {
                            const isExpanded = expandedRow === tx.id;
                            const metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
                            return (
                              <React.Fragment key={tx.id}>
                                <tr
                                  className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                                  onClick={() => setExpandedRow(isExpanded ? null : tx.id)}
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`p-1.5 rounded-lg border ${TYPE_COLORS[tx.taskType || 'other']}`}
                                      >
                                        {TYPE_ICONS[tx.taskType || 'other']}
                                      </div>
                                      <span className="text-white font-medium">
                                        {TYPE_LABELS[tx.taskType || 'other']}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                                      {tx.type === 'deduction' ? 'Outbound' : 'Inbound'}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-slate-300">
                                    {Math.abs(tx.amount)} {tx.taskType === 'ai_sms' ? 'messages' : tx.taskType === 'ai_phone_call' ? 'minutes' : 'units'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`font-semibold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}
                                    >
                                      {tx.amount > 0 ? '+' : ''}
                                      {tx.amount}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-300">
                                    {tx.description?.substring(0, 30) || '-'}
                                    {tx.description && tx.description.length > 30 && '...'}
                                  </td>
                                  <td className="px-4 py-3 text-slate-400 text-sm">
                                    {new Date(tx.createdAt).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true,
                                    })}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge className={STATUS_COLORS['completed']}>
                                      <Check className="w-3 h-3 mr-1" />
                                      Completed
                                    </Badge>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr className="bg-slate-900/50">
                                    <td colSpan={7} className="px-4 py-4">
                                      <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                          <span className="text-slate-500">Full Description:</span>
                                          <p className="text-slate-300 mt-1">{tx.description || 'No description'}</p>
                                        </div>
                                        <div>
                                          <span className="text-slate-500">Balance After:</span>
                                          <p className="text-white font-medium mt-1">{tx.balanceAfter} credits</p>
                                        </div>
                                        <div>
                                          <span className="text-slate-500">Transaction ID:</span>
                                          <p className="text-slate-300 mt-1 font-mono text-xs">#{tx.id}</p>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-600"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              className={currentPage === page ? '' : 'border-slate-600'}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          );
                        })}
                        {totalPages > 5 && <span className="text-slate-400">...</span>}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-600"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-slate-400">
                        {(currentPage - 1) * itemsPerPage + 1}-
                        {Math.min(currentPage * itemsPerPage, transactions?.length || 0)} of {transactions?.length || 0}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {/* Right Sidebar - Plan & Billing */}
            <div className="w-80 space-y-4 flex-shrink-0">
              {/* Manage Plan Card */}
              <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-white">Manage Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Plan */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">Current Plan</span>
                      <Badge variant="outline" className="border-primary/50 text-primary text-xs">
                        {subscription?.status || 'Active'}
                      </Badge>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-white">{subscription?.plan?.name || 'DojoFlow Standard'}</span>
                      <span className="text-xl font-bold text-white">
                        ${((subscription?.plan?.monthlyPrice || 4900) / 100).toFixed(0)}
                        <span className="text-sm text-slate-400 font-normal">/mo</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Resets each {subscription?.billingCycle || 'monthly'} billing cycle
                    </p>
                  </div>

                  {/* Plan Features */}
                  <div className="space-y-2 pt-2 border-t border-slate-700">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      <span>{subscription?.plan?.monthlyCredits || 300} Monthly Credits</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      <span>500 Monthly SMS</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      <span>220 Monthly Voice Call Minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      <span>AI Assistant & Insights</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      <span>Attendance Tracking</span>
                    </div>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => navigate('/pricing')}>
                    Upgrade Plan
                  </Button>

                  {/* Billing Info */}
                  <div className="pt-2 border-t border-slate-700 space-y-1 text-xs text-slate-500">
                    <p>Billing by Stripe</p>
                    <p>• $0.10/credit as 10.08 / credits</p>
                    <p>• Using your plan will reset your billing cycle daily</p>
                  </div>
                </CardContent>
              </Card>

              {/* Top Up Options */}
              <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    Top Up Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upgradePlans.slice(0, 2).map((plan) => (
                    <div
                      key={plan.id}
                      className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer group"
                      onClick={() => navigate('/pricing')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="font-medium text-white">{plan.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-xs text-slate-400">— {plan.monthlyCredits.toLocaleString()} Monthly Credits</p>
                    </div>
                  ))}

                  {/* Billing notes */}
                  <div className="pt-2 border-t border-slate-700 space-y-1 text-xs text-slate-500">
                    <p>Billing by Stripe. Overage billed at 16 Overage.</p>
                    <p>Your plan will reset your billing cycle :56</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      {/* Credit Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Buy AI Credits</h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Pricing Tiers */}
            <div className="space-y-3 mb-6">
              {pricingData?.tiers.map((tier) => (
                <div
                  key={tier.credits}
                  onClick={() => setSelectedCredits(tier.credits)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedCredits === tier.credits
                      ? 'border-primary bg-primary/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">{tier.label}</span>
                        {tier.savings > 0 && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            Save {tier.savings}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {tier.credits.toLocaleString()} credits at ${(tier.pricePerCredit / 100).toFixed(2)}/credit
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">${(tier.price / 100).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Summary */}
            <div className="p-4 bg-slate-900 rounded-lg mb-6">
              <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                <span>Selected:</span>
                <span>{selectedCredits.toLocaleString()} credits</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Total:</span>
                <span className="text-2xl font-bold text-white">
                  ${((pricingData?.tiers.find(t => t.credits === selectedCredits)?.price || selectedCredits * 10) / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-slate-600"
                onClick={() => setShowPurchaseModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={createTopUpCheckout.isPending}
                onClick={() => {
                  createTopUpCheckout.mutate({
                    organizationId: user?.activeOrgId || 1, // Get from context
                    credits: selectedCredits,
                  });
                }}
              >
                {createTopUpCheckout.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Proceed to Checkout
                  </span>
                )}
              </Button>
            </div>

            <p className="text-xs text-slate-500 text-center mt-4">
              Secure payment powered by Stripe. Credits are added instantly after payment.
            </p>
          </div>
        </div>
      )}
    </ManagementLayout>
  );
};

export default CreditTransactions;
