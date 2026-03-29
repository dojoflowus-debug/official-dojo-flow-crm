/**
 * Call Statistics Cards Component
 * 
 * Displays key call metrics in card format including total calls, duration, credits spent, and averages.
 */

import React from 'react';
import { Phone, Clock, Zap, TrendingUp, Users, AlertCircle } from 'lucide-react';

interface CallStats {
  totalCalls: number;
  totalCreditsSpent: number;
  totalDurationSeconds: number;
  totalDurationMinutes: number;
  averageCallDuration: number;
  averageCreditsPerCall: number;
  longestCall: number;
  shortestCall: number;
  uniqueRecipients: number;
}

interface CallStatisticsCardsProps {
  stats: CallStats;
  isLoading?: boolean;
  period?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: number;
  color: 'blue' | 'yellow' | 'green' | 'purple' | 'red';
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  color,
  description,
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
  };

  return (
    <div className={`border rounded-lg p-6 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            {unit && <p className="text-sm text-gray-600 dark:text-gray-400">{unit}</p>}
          </div>
          {description && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{description}</p>
          )}
        </div>
        <div className="flex-shrink-0">{icon}</div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-semibold">
            {trend > 0 ? '+' : ''}{trend}% vs last period
          </span>
        </div>
      )}
    </div>
  );
};

export const CallStatisticsCards: React.FC<CallStatisticsCardsProps> = ({
  stats,
  isLoading = false,
  period = 'All Time',
}) => {
  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Call Statistics - {period}
        </h3>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Calls */}
        <StatCard
          title="Total Calls"
          value={stats.totalCalls}
          icon={<Phone className="w-8 h-8" />}
          color="blue"
          description={`${stats.uniqueRecipients} unique recipients`}
        />

        {/* Total Duration */}
        <StatCard
          title="Total Duration"
          value={formatDuration(stats.totalDurationSeconds)}
          icon={<Clock className="w-8 h-8" />}
          color="green"
          description={`${stats.totalDurationMinutes.toFixed(1)} minutes`}
        />

        {/* Total Credits Spent */}
        <StatCard
          title="Total Credits Spent"
          value={stats.totalCreditsSpent}
          unit="credits"
          icon={<Zap className="w-8 h-8" />}
          color="yellow"
          description="All call operations"
        />

        {/* Average Call Duration */}
        <StatCard
          title="Average Call Duration"
          value={formatDuration(stats.averageCallDuration)}
          icon={<Clock className="w-8 h-8" />}
          color="purple"
          description={`${Math.round(stats.averageCallDuration / 60)} minutes avg`}
        />

        {/* Average Credits Per Call */}
        <StatCard
          title="Average Cost Per Call"
          value={stats.averageCreditsPerCall}
          unit="credits"
          icon={<TrendingUp className="w-8 h-8" />}
          color="red"
          description="Setup + duration"
        />

        {/* Unique Recipients */}
        <StatCard
          title="Unique Recipients"
          value={stats.uniqueRecipients}
          icon={<Users className="w-8 h-8" />}
          color="blue"
          description={`${stats.totalCalls > 0 ? Math.round(stats.totalCalls / stats.uniqueRecipients) : 0} calls per recipient`}
        />
      </div>

      {/* Extended Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Longest Call */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Longest Call</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatDuration(stats.longestCall)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {Math.ceil(stats.longestCall / 60)} minutes billed
              </p>
            </div>
          </div>
        </div>

        {/* Shortest Call */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Shortest Call</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatDuration(stats.shortestCall)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                1 minute minimum charge
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-semibold">Call Billing Summary</p>
          <p className="mt-1">
            Each call includes a {5} credit setup fee plus {10} credits per minute. Calls are billed in 1-minute increments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CallStatisticsCards;
