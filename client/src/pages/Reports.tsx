import React, { useState, useEffect } from 'react';
import ManagementLayout from '@/components/ManagementLayout';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, TrendingUp, Users, DollarSign, Calendar, FileText } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { trpc } from '@/lib/trpc';

export default function Reports({ onLogout, theme, toggleTheme }) {
  const isDark = useDarkMode();
  const [stats, setStats] = useState({
    ytd_revenue: 0,
    student_growth: 0,
    attendance_rate: 0
  });

  // Fetch actual data from database
  const { data: allClasses = [] } = trpc.classes.getAll.useQuery();
  const { data: allStudents = [] } = trpc.students.getAll.useQuery({ limit: 1000 });
  const { data: allPayments = [] } = trpc.payments.getAll.useQuery();

  // Calculate stats from real data
  useEffect(() => {
    if (allClasses.length > 0 || allStudents.length > 0 || allPayments.length > 0) {
      const totalRevenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      // Only count ACTIVE students - exclude inactive, on-hold, and test accounts
      const totalStudents = allStudents.filter((s: any) => s.status === 'Active').length;
      
      // Calculate attendance rate from classes
      let totalAttendance = 0;
      let classCount = 0;
      allClasses.forEach(c => {
        if (c.attendance_rate !== undefined) {
          totalAttendance += c.attendance_rate;
          classCount++;
        }
      });
      const avgAttendance = classCount > 0 ? Math.round(totalAttendance / classCount) : 0;

      setStats({
        ytd_revenue: totalRevenue,
        student_growth: totalStudents,
        attendance_rate: avgAttendance
      });
    }
  }, [allClasses, allStudents, allPayments]);

  const cardBgClass = isDark ? 'bg-[#27272A] border-white/10' : 'bg-white border-gray-200';
  const cardTextClass = isDark ? 'text-white' : 'text-gray-900';
  const cardSubtextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const tableBgClass = isDark ? 'bg-[#27272A] border-white/10' : 'bg-white border-gray-200';
  const tableHeaderClass = isDark ? 'bg-[#1F1F23]' : 'bg-gray-50';
  const tableTextClass = isDark ? 'text-gray-300' : 'text-gray-700';
  const containerBgClass = isDark ? 'bg-[#0F1115]' : 'bg-gray-50';

  return (
    <ManagementLayout>
      <div className={`p-6 max-w-7xl mx-auto min-h-[calc(100vh-120px)] ${containerBgClass}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${cardTextClass} mb-2`}>Reports & Analytics</h1>
            <p className={cardSubtextClass}>Insights and performance metrics for your dojo</p>
          </div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Download className="h-4 w-4" />
            Export All Reports
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`${cardBgClass} p-6 rounded-lg border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${cardSubtextClass} text-sm`}>Total Revenue (YTD)</p>
                <p className={`text-3xl font-bold ${cardTextClass} mt-1`}>
                  ${stats.ytd_revenue.toLocaleString()}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Year to date</p>
              </div>
              <div className={`p-3 ${isDark ? 'bg-green-500/10' : 'bg-green-100'} rounded-lg`}>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>

          <div className={`${cardBgClass} p-6 rounded-lg border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${cardSubtextClass} text-sm`}>Total Students</p>
                <p className={`text-3xl font-bold ${cardTextClass} mt-1`}>{stats.student_growth}</p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Currently enrolled</p>
              </div>
              <div className={`p-3 ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'} rounded-lg`}>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          <div className={`${cardBgClass} p-6 rounded-lg border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${cardSubtextClass} text-sm`}>Avg. Attendance</p>
                <p className={`text-3xl font-bold ${cardTextClass} mt-1`}>{stats.attendance_rate}%</p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Based on records</p>
              </div>
              <div className={`p-3 ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'} rounded-lg`}>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <button className={`${cardBgClass} hover:opacity-80 p-6 rounded-lg border text-left transition-colors group`}>
            <div className="flex items-center justify-between mb-3">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              <TrendingUp className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className={`text-lg font-semibold ${cardTextClass} mb-1`}>Revenue Report</h3>
            <p className={`text-sm ${cardSubtextClass}`}>Monthly and annual revenue breakdown</p>
          </button>

          <button className={`${cardBgClass} hover:opacity-80 p-6 rounded-lg border text-left transition-colors group`}>
            <div className="flex items-center justify-between mb-3">
              <Users className="h-8 w-8 text-purple-500" />
              <TrendingUp className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className={`text-lg font-semibold ${cardTextClass} mb-1`}>Student Growth</h3>
            <p className={`text-sm ${cardSubtextClass}`}>Enrollment trends and retention rates</p>
          </button>

          <button className={`${cardBgClass} hover:opacity-80 p-6 rounded-lg border text-left transition-colors group`}>
            <div className="flex items-center justify-between mb-3">
              <Calendar className="h-8 w-8 text-green-500" />
              <TrendingUp className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className={`text-lg font-semibold ${cardTextClass} mb-1`}>Attendance Report</h3>
            <p className={`text-sm ${cardSubtextClass}`}>Class attendance patterns and statistics</p>
          </button>

          <button className={`${cardBgClass} hover:opacity-80 p-6 rounded-lg border text-left transition-colors group`}>
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <TrendingUp className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className={`text-lg font-semibold ${cardTextClass} mb-1`}>Payment Report</h3>
            <p className={`text-sm ${cardSubtextClass}`}>Payment history and outstanding balances</p>
          </button>

          <button className={`${cardBgClass} hover:opacity-80 p-6 rounded-lg border text-left transition-colors group`}>
            <div className="flex items-center justify-between mb-3">
              <FileText className="h-8 w-8 text-red-500" />
              <TrendingUp className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className={`text-lg font-semibold ${cardTextClass} mb-1`}>Belt Testing</h3>
            <p className={`text-sm ${cardSubtextClass}`}>Testing schedules and promotion rates</p>
          </button>

          <button className={`${cardBgClass} hover:opacity-80 p-6 rounded-lg border text-left transition-colors group`}>
            <div className="flex items-center justify-between mb-3">
              <BarChart3 className="h-8 w-8 text-cyan-500" />
              <TrendingUp className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className={`text-lg font-semibold ${cardTextClass} mb-1`}>Custom Report</h3>
            <p className={`text-sm ${cardSubtextClass}`}>Build your own custom reports</p>
          </button>
        </div>

        {/* Quick Stats Table */}
        <div className={`${tableBgClass} rounded-lg border overflow-hidden`}>
          <div className={`p-6 ${isDark ? 'border-white/10' : 'border-gray-200'} border-b`}>
            <h2 className={`text-xl font-semibold ${cardTextClass}`}>Quick Statistics</h2>
            <p className={`${cardSubtextClass} text-sm mt-1`}>Overview of key metrics</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${cardSubtextClass} uppercase tracking-wider`}>Metric</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${cardSubtextClass} uppercase tracking-wider`}>This Month</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${cardSubtextClass} uppercase tracking-wider`}>Last Month</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${cardSubtextClass} uppercase tracking-wider`}>Change</th>
                </tr>
              </thead>
              <tbody className={`${isDark ? 'divide-gray-700' : 'divide-gray-200'} divide-y`}>
                <tr className={`${isDark ? 'hover:bg-[#1F1F23]' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className={`px-6 py-4 whitespace-nowrap ${cardTextClass} font-medium`}>New Students</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${tableTextClass}`}>12</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${tableTextClass}`}>8</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">+50%</span>
                  </td>
                </tr>
                <tr className={`${isDark ? 'hover:bg-[#1F1F23]' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className={`px-6 py-4 whitespace-nowrap ${cardTextClass} font-medium`}>Revenue</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${tableTextClass}`}>$15,200</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${tableTextClass}`}>$14,800</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">+2.7%</span>
                  </td>
                </tr>
                <tr className={`${isDark ? 'hover:bg-[#1F1F23]' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className={`px-6 py-4 whitespace-nowrap ${cardTextClass} font-medium`}>Attendance Rate</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${tableTextClass}`}>92%</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${tableTextClass}`}>89%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">+3.4%</span>
                  </td>
                </tr>
                <tr className={`${isDark ? 'hover:bg-[#1F1F23]' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className={`px-6 py-4 whitespace-nowrap ${cardTextClass} font-medium`}>Active Classes</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${tableTextClass}`}>{allClasses.length}</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${tableTextClass}`}>{allClasses.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">0%</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ManagementLayout>
  );
}
