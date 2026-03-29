/**
 * Call Cost Trend Chart Component
 * 
 * Displays call costs and trends over time using line and bar charts.
 * Shows daily trends, hourly distribution, and cost breakdown.
 */

import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, Clock, Zap } from 'lucide-react';

interface DailyTrend {
  date: string;
  calls: number;
  creditsSpent: number;
  durationSeconds: number;
  durationMinutes: number;
  averageCreditsPerCall: number;
}

interface HourlyData {
  hour: number;
  calls: number;
  creditsSpent: number;
  averageCreditsPerCall: number;
}

interface CallCostTrendChartProps {
  dailyTrends: DailyTrend[];
  hourlyData?: HourlyData[];
  setupCosts?: number;
  durationCosts?: number;
  isLoading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const CallCostTrendChart: React.FC<CallCostTrendChartProps> = ({
  dailyTrends,
  hourlyData = [],
  setupCosts = 0,
  durationCosts = 0,
  isLoading = false,
}) => {
  const chartData = useMemo(() => dailyTrends, [dailyTrends]);

  const hourlyChartData = useMemo(() => {
    return hourlyData.map(h => ({
      ...h,
      hour: `${h.hour}:00`,
    }));
  }, [hourlyData]);

  const costBreakdown = useMemo(() => {
    const total = setupCosts + durationCosts;
    return [
      {
        name: 'Setup Costs',
        value: setupCosts,
        percentage: total > 0 ? Math.round((setupCosts / total) * 100) : 0,
      },
      {
        name: 'Duration Costs',
        value: durationCosts,
        percentage: total > 0 ? Math.round((durationCosts / total) * 100) : 0,
      },
    ];
  }, [setupCosts, durationCosts]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-80 animate-pulse" />
        ))}
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No trend data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Trends */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Call Trends</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
              formatter={(value) => value}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="calls" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              name="Calls"
            />
            <Line 
              type="monotone" 
              dataKey="creditsSpent" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              name="Credits Spent"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Credits Spent */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Credits Spent</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
              formatter={(value) => value}
            />
            <Legend />
            <Bar 
              dataKey="creditsSpent" 
              fill="#f59e0b" 
              name="Credits Spent"
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              dataKey="averageCreditsPerCall" 
              fill="#3b82f6" 
              name="Avg Credits/Call"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly Distribution */}
      {hourlyChartData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hourly Distribution (Last 7 Days)</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="hour" 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                }}
                formatter={(value) => value}
              />
              <Legend />
              <Bar 
                dataKey="calls" 
                fill="#8b5cf6" 
                name="Calls"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="creditsSpent" 
                fill="#ec4899" 
                name="Credits"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cost Breakdown */}
      {(setupCosts > 0 || durationCosts > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cost Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                  formatter={(value) => `${value} credits`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Cost Details */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cost Details</h3>
            <div className="space-y-4">
              {/* Setup Costs */}
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Setup Costs</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">5 credits per call</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{setupCosts}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {costBreakdown[0]?.percentage}%
                  </p>
                </div>
              </div>

              {/* Duration Costs */}
              <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Duration Costs</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">10 credits per minute</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{durationCosts}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {costBreakdown[1]?.percentage}%
                  </p>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Total Credits</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {setupCosts + durationCosts}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Days</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{chartData.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Calls</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {chartData.reduce((sum, d) => sum + d.calls, 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Credits/Day</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(chartData.reduce((sum, d) => sum + d.creditsSpent, 0) / chartData.length)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Peak Day</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.max(...chartData.map(d => d.calls))} calls
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallCostTrendChart;
