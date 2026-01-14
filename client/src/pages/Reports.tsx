import React, { useState, useEffect } from 'react';
import BottomNavLayout from '@/components/BottomNavLayout';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, TrendingUp, Users, DollarSign, Calendar, FileText } from 'lucide-react';

export default function Reports({ onLogout, theme, toggleTheme }) {
  const [stats, setStats] = useState({
    ytd_revenue: 125000,
    student_growth: 85,
    attendance_rate: 92
  });

  return (
    <BottomNavLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
            <p className="text-gray-400">Insights and performance metrics for your dojo</p>
          </div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Download className="h-4 w-4" />
            Export All Reports
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue (YTD)</p>
                <p className="text-3xl font-bold text-white mt-1">
                  ${stats.ytd_revenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Year to date</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.student_growth}</p>
                <p className="text-xs text-gray-500 mt-1">Currently enrolled</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg. Attendance</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.attendance_rate}%</p>
                <p className="text-xs text-gray-500 mt-1">Based on records</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <button className="bg-gray-800 hover:bg-gray-750 p-6 rounded-lg border border-gray-700 text-left transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              <TrendingUp className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Revenue Report</h3>
            <p className="text-sm text-gray-400">Monthly and annual revenue breakdown</p>
          </button>

          <button className="bg-gray-800 hover:bg-gray-750 p-6 rounded-lg border border-gray-700 text-left transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <Users className="h-8 w-8 text-purple-500" />
              <TrendingUp className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Student Growth</h3>
            <p className="text-sm text-gray-400">Enrollment trends and retention rates</p>
          </button>

          <button className="bg-gray-800 hover:bg-gray-750 p-6 rounded-lg border border-gray-700 text-left transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="h-8 w-8 text-green-500" />
              <TrendingUp className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Attendance Report</h3>
            <p className="text-sm text-gray-400">Class attendance patterns and statistics</p>
          </button>

          <button className="bg-gray-800 hover:bg-gray-750 p-6 rounded-lg border border-gray-700 text-left transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <TrendingUp className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Payment Report</h3>
            <p className="text-sm text-gray-400">Payment history and outstanding balances</p>
          </button>

          <button className="bg-gray-800 hover:bg-gray-750 p-6 rounded-lg border border-gray-700 text-left transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <FileText className="h-8 w-8 text-red-500" />
              <TrendingUp className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Belt Testing</h3>
            <p className="text-sm text-gray-400">Testing schedules and promotion rates</p>
          </button>

          <button className="bg-gray-800 hover:bg-gray-750 p-6 rounded-lg border border-gray-700 text-left transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <BarChart3 className="h-8 w-8 text-cyan-500" />
              <TrendingUp className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Custom Report</h3>
            <p className="text-sm text-gray-400">Build your own custom reports</p>
          </button>
        </div>

        {/* Quick Stats Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Quick Statistics</h2>
            <p className="text-gray-400 text-sm mt-1">Overview of key metrics</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Metric</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">This Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">New Students</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">12</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">8</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">+50%</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">Revenue</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">$15,200</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">$14,800</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">+2.7%</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">Attendance Rate</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">92%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">89%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">+3.4%</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">Active Classes</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">18</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">18</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">0%</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BottomNavLayout>
  );
}

