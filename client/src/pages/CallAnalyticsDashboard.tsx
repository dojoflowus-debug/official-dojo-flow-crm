/**
 * Call Analytics Dashboard Page
 * 
 * Main dashboard page for viewing call history, statistics, and trends.
 * Provides comprehensive analytics and reporting for call operations.
 */

import React, { useState } from 'react';
import { Phone, RefreshCw, Download, Filter } from 'lucide-react';
import { CallHistoryTable } from '../components/CallHistoryTable';
import { CallStatisticsCards } from '../components/CallStatisticsCards';
import { CallCostTrendChart } from '../components/CallCostTrendChart';
import { trpc } from '@/lib/trpc';

interface FilterState {
  dateFrom?: string;
  dateTo?: string;
  sortBy: 'date' | 'duration' | 'cost';
  sortOrder: 'asc' | 'desc';
  limit: number;
}

export const CallAnalyticsDashboard: React.FC = () => {
  const { data: user } = trpc.auth.me.useQuery();
  const organizationId = (user as any)?.activeOrgId || (user as any)?.organizationId;
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'date',
    sortOrder: 'desc',
    limit: 50,
  });
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [isExporting, setIsExporting] = useState(false);

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    let from: Date | undefined;

    switch (period) {
      case '7d':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        from = undefined;
        break;
    }

    return {
      dateFrom: from?.toISOString() || '',
      dateTo: now.toISOString(),
    };
  };

  // Fetch call history using TRPC
  const dateRange = getDateRange();
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = trpc.callAnalytics.getCallHistory.useQuery(
    organizationId
      ? {
          organizationId: String(organizationId),
          ...dateRange,
          ...filters,
        }
      : { organizationId: '', dateFrom: '', dateTo: '', sortBy: 'date', sortOrder: 'desc', limit: 50 },
    {
      enabled: !!organizationId,
    }
  );

  // Fetch statistics using TRPC
  const { data: statsData, isLoading: statsLoading } = trpc.callAnalytics.getCallStatistics.useQuery(
    organizationId
      ? {
          organizationId: String(organizationId),
          ...dateRange,
        }
      : { organizationId: '', dateFrom: '', dateTo: '' },
    {
      enabled: !!organizationId,
    }
  );

  // Fetch daily trends using TRPC
  const { data: trendsData, isLoading: trendsLoading } = trpc.callAnalytics.getDailyCallTrends.useQuery(
    organizationId
      ? {
          organizationId: String(organizationId),
          days: period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365,
        }
      : { organizationId: '', days: 30 },
    {
      enabled: !!organizationId,
    }
  );

  // Fetch hourly distribution using TRPC
  const { data: hourlyData, isLoading: hourlyLoading } = trpc.callAnalytics.getHourlyDistribution.useQuery(
    organizationId
      ? {
          organizationId: String(organizationId),
          days: 7,
        }
      : { organizationId: '', days: 7 },
    {
      enabled: !!organizationId,
    }
  );

  // Fetch cost breakdown using TRPC
  const { data: costBreakdown, isLoading: costLoading } = trpc.callAnalytics.getCostBreakdown.useQuery(
    organizationId
      ? {
          organizationId: String(organizationId),
          period: period === 'all' ? 'month' : period === '7d' ? 'day' : 'month',
        }
      : { organizationId: '', period: 'month' },
    {
      enabled: !!organizationId,
    }
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csv = generateCSV();
      downloadCSV(csv, `call-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (): string => {
    const headers = ['Date', 'Recipient', 'Duration (min)', 'Credits', 'Description'];
    const rows = (historyData?.calls || []).map(call => [
      new Date(call.createdAt).toLocaleDateString(),
      call.recipientPhone,
      call.roundedMinutes,
      call.creditsDeducted,
      call.description,
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const isLoading = historyLoading || statsLoading || trendsLoading || hourlyLoading || costLoading;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Call Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400">Track calls, duration, and credit usage</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetchHistory()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || !historyData?.calls?.length}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Period Filter */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Time Period</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['7d', '30d', '90d', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : p === '90d' ? 'Last 90 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Statistics Cards */}
        <CallStatisticsCards
          stats={statsData || {
            totalCalls: 0,
            totalCreditsSpent: 0,
            totalDurationSeconds: 0,
            totalDurationMinutes: 0,
            averageCallDuration: 0,
            averageCreditsPerCall: 0,
            longestCall: 0,
            shortestCall: 0,
            uniqueRecipients: 0,
          }}
          isLoading={statsLoading}
          period={period === 'all' ? 'All Time' : period === '7d' ? 'Last 7 Days' : period === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
        />

        {/* Charts */}
        <CallCostTrendChart
          dailyTrends={trendsData || []}
          hourlyData={hourlyData || []}
          setupCosts={costBreakdown?.setupCosts || 0}
          durationCosts={costBreakdown?.durationCosts || 0}
          isLoading={trendsLoading || hourlyLoading || costLoading}
        />

        {/* Call History Table */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Call History</h3>
          <CallHistoryTable
            calls={historyData?.calls || []}
            isLoading={historyLoading}
            onRefresh={() => refetchHistory()}
          />
        </div>
      </div>
    </div>
  );
};

export default CallAnalyticsDashboard;
