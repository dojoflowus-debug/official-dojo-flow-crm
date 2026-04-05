import React, { useState } from 'react';
import ManagementLayout from '@/components/ManagementLayout';
import { Download, TrendingUp, TrendingDown, Users, DollarSign, Calendar, AlertTriangle, Award, BarChart3, Activity, CheckCircle, XCircle, Minus } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { trpc } from '@/lib/trpc';

function StatCard({ icon, label, value, sub, iconBg, iconColor, isDark }: any) {
  const cardBg = isDark ? 'bg-[#27272A] border-white/10' : 'bg-white border-gray-200';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subClass = isDark ? 'text-gray-400' : 'text-gray-500';
  return (
    <div className={`${cardBg} border rounded-xl p-5 flex items-start gap-4`}>
      <div className={`${iconBg} p-3 rounded-lg flex-shrink-0`}>
        {React.cloneElement(icon, { className: `h-6 w-6 ${iconColor}` })}
      </div>
      <div>
        <p className={`text-xs font-medium uppercase tracking-wide ${subClass}`}>{label}</p>
        <p className={`text-2xl font-bold ${textClass} mt-0.5`}>{value}</p>
        {sub && <p className={`text-xs ${subClass} mt-0.5`}>{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, isDark }: any) {
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subClass = isDark ? 'text-gray-400' : 'text-gray-500';
  return (
    <div className="mb-4">
      <h2 className={`text-lg font-semibold ${textClass}`}>{title}</h2>
      {subtitle && <p className={`text-sm ${subClass}`}>{subtitle}</p>}
    </div>
  );
}

function ChangeChip({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">—</span>;
  if (previous === 0) return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">New</span>;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-0.5 w-fit"><TrendingUp className="h-3 w-3" />+{pct}%</span>;
  if (pct < 0) return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-0.5 w-fit"><TrendingDown className="h-3 w-3" />{pct}%</span>;
  return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 flex items-center gap-0.5 w-fit"><Minus className="h-3 w-3" />0%</span>;
}

function AttendanceBar({ data, isDark }: { data: any[]; isDark: boolean }) {
  if (!data || data.length === 0) {
    return <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center py-8`}>No attendance data yet</div>;
  }
  const maxVal = Math.max(...data.map(d => Number(d.attended || 0) + Number(d.missed || 0)), 1);
  return (
    <div className="flex items-end gap-1 h-32 w-full">
      {data.map((d, i) => {
        const total = Number(d.attended || 0) + Number(d.missed || 0);
        const attendedH = Math.round((Number(d.attended || 0) / maxVal) * 120);
        const missedH = Math.round((Number(d.missed || 0) / maxVal) * 120);
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
              <div className={`text-xs rounded px-2 py-1 whitespace-nowrap ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white'}`}>
                {d.date}: {d.attended} attended, {d.missed} missed
              </div>
            </div>
            {missedH > 0 && <div style={{ height: missedH }} className="w-full bg-red-300 rounded-t-sm opacity-60" />}
            {attendedH > 0 && <div style={{ height: attendedH }} className="w-full bg-[#C8102E] rounded-t-sm" />}
          </div>
        );
      })}
    </div>
  );
}

function RevenueBar({ data, isDark }: { data: any[]; isDark: boolean }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-2 h-32 w-full">
      {data.map((d, i) => {
        const h = Math.round((d.revenue / maxVal) * 120);
        const isLast = i === data.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
              <div className={`text-xs rounded px-2 py-1 whitespace-nowrap ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white'}`}>
                {d.month}: ${(d.revenue / 100).toLocaleString()}
              </div>
            </div>
            <div style={{ height: Math.max(h, 2) }} className={`w-full rounded-t-sm ${isLast ? 'bg-[#C8102E]' : isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate w-full text-center`}>{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Reports({ onLogout, theme, toggleTheme }: any) {
  const isDark = useDarkMode();
  const [activeTab, setActiveTab] = useState<'overview' | 'delinquent' | 'programs' | 'attendance'>('overview');

  const { data: report, isLoading } = trpc.reports.getDashboard.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const cardBg = isDark ? 'bg-[#27272A] border-white/10' : 'bg-white border-gray-200';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const containerBg = isDark ? 'bg-[#0F1115]' : 'bg-gray-50';
  const tableHeader = isDark ? 'bg-[#1F1F23]' : 'bg-gray-50';
  const tableRow = isDark ? 'hover:bg-[#1F1F23] border-white/5' : 'hover:bg-gray-50 border-gray-100';
  const tabActive = isDark ? 'bg-[#27272A] text-white border-white/10' : 'bg-white text-gray-900 border-gray-200';
  const tabInactive = isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900';

  const fmt$ = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className={`p-6 ${containerBg} min-h-screen flex items-center justify-center`}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin" />
            <p className={subClass}>Loading reports...</p>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  const r = report;
  const revenueChange = r?.moneyCollectedLastMonth && r.moneyCollectedLastMonth > 0
    ? Math.round(((r.moneyCollectedThisMonth - r.moneyCollectedLastMonth) / r.moneyCollectedLastMonth) * 100)
    : 0;

  return (
    <ManagementLayout>
      <div className={`p-6 max-w-7xl mx-auto min-h-screen ${containerBg}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${textClass}`}>Reports & Analytics</h1>
            <p className={`text-sm ${subClass} mt-0.5`}>Real-time insights for your dojo</p>
          </div>
          <button className="bg-[#C8102E] hover:bg-[#a50d26] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<DollarSign />}
            label="Collected This Month"
            value={fmt$(r?.moneyCollectedThisMonth || 0)}
            sub={`Last month: ${fmt$(r?.moneyCollectedLastMonth || 0)}`}
            iconBg={isDark ? 'bg-green-500/10' : 'bg-green-50'}
            iconColor="text-green-500"
            isDark={isDark}
          />
          <StatCard
            icon={<DollarSign />}
            label="Total Collected (All Time)"
            value={fmt$(r?.moneyCollectedTotal || 0)}
            sub="Since beginning of use"
            iconBg={isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}
            iconColor="text-emerald-500"
            isDark={isDark}
          />
          <StatCard
            icon={<AlertTriangle />}
            label="Delinquent Accounts"
            value={r?.delinquentCount || 0}
            sub={`${fmt$(r?.delinquentTotalOwed || 0)} total owed`}
            iconBg={isDark ? 'bg-red-500/10' : 'bg-red-50'}
            iconColor="text-red-500"
            isDark={isDark}
          />
          <StatCard
            icon={<Users />}
            label="Active Students"
            value={r?.activeStudents || 0}
            sub={`+${r?.newStudentsCount || 0} new this month`}
            iconBg={isDark ? 'bg-blue-500/10' : 'bg-blue-50'}
            iconColor="text-blue-500"
            isDark={isDark}
          />
        </div>

        {/* Second row KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Activity />}
            label="Attendance Rate (30d)"
            value={`${r?.attendanceRate30 || 0}%`}
            sub={`${r?.totalAttended30 || 0} attended / ${r?.totalMissed30 || 0} missed`}
            iconBg={isDark ? 'bg-purple-500/10' : 'bg-purple-50'}
            iconColor="text-purple-500"
            isDark={isDark}
          />
          <StatCard
            icon={<Activity />}
            label="Attendance Rate (All Time)"
            value={`${r?.attendanceRateAllTime || 0}%`}
            sub="Since beginning of use"
            iconBg={isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}
            iconColor="text-indigo-500"
            isDark={isDark}
          />
          <StatCard
            icon={<Award />}
            label="Most Popular Class"
            value={r?.mostPopularClass?.className || '—'}
            sub={r?.mostPopularClass ? `${r.mostPopularClass.attendanceCount} check-ins` : 'No data yet'}
            iconBg={isDark ? 'bg-yellow-500/10' : 'bg-yellow-50'}
            iconColor="text-yellow-500"
            isDark={isDark}
          />
          <StatCard
            icon={<Award />}
            label="Most Popular Program"
            value={r?.mostPopularProgram?.name || '—'}
            sub={r?.mostPopularProgram ? `${r.mostPopularProgram.enrollmentCount} enrolled (${r.mostPopularProgram.fillRate}% full)` : 'No data yet'}
            iconBg={isDark ? 'bg-orange-500/10' : 'bg-orange-50'}
            iconColor="text-orange-500"
            isDark={isDark}
          />
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 mb-6 p-1 rounded-lg ${isDark ? 'bg-[#1a1a1f]' : 'bg-gray-100'} w-fit`}>
          {(['overview', 'delinquent', 'programs', 'attendance'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? tabActive + ' border shadow-sm' : tabInactive}`}
            >
              {tab === 'delinquent' ? 'Delinquent Accounts' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <div className={`${cardBg} border rounded-xl p-5`}>
              <SectionHeader title="Revenue Trend (Last 6 Months)" subtitle="Monthly collected payments" isDark={isDark} />
              <RevenueBar data={r?.monthlyRevenueTrend || []} isDark={isDark} />
            </div>

            {/* Attendance Trend */}
            <div className={`${cardBg} border rounded-xl p-5`}>
              <SectionHeader title="Attendance (Last 30 Days)" subtitle="Daily attended vs missed" isDark={isDark} />
              <AttendanceBar data={r?.attendanceLast30Days || []} isDark={isDark} />
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#C8102E]" /><span className={`text-xs ${subClass}`}>Attended</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-300 opacity-60" /><span className={`text-xs ${subClass}`}>Missed</span></div>
              </div>
            </div>

            {/* Quick Stats Table */}
            <div className={`${cardBg} border rounded-xl overflow-hidden lg:col-span-2`}>
              <div className={`px-5 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <h2 className={`text-base font-semibold ${textClass}`}>Month-over-Month Comparison</h2>
              </div>
              <table className="w-full">
                <thead className={tableHeader}>
                  <tr>
                    {['Metric', 'This Month', 'Last Month', 'Change'].map(h => (
                      <th key={h} className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wide ${subClass}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className={`border-t ${tableRow} transition-colors`}>
                    <td className={`px-5 py-3 text-sm font-medium ${textClass}`}>Revenue Collected</td>
                    <td className={`px-5 py-3 text-sm ${subClass}`}>{fmt$(r?.moneyCollectedThisMonth || 0)}</td>
                    <td className={`px-5 py-3 text-sm ${subClass}`}>{fmt$(r?.moneyCollectedLastMonth || 0)}</td>
                    <td className="px-5 py-3"><ChangeChip current={r?.moneyCollectedThisMonth || 0} previous={r?.moneyCollectedLastMonth || 0} /></td>
                  </tr>
                  <tr className={`border-t ${tableRow} transition-colors`}>
                    <td className={`px-5 py-3 text-sm font-medium ${textClass}`}>New Students</td>
                    <td className={`px-5 py-3 text-sm ${subClass}`}>{r?.newStudentsCount || 0}</td>
                    <td className={`px-5 py-3 text-sm ${subClass}`}>—</td>
                    <td className="px-5 py-3"><span className={`text-xs ${subClass}`}>—</span></td>
                  </tr>
                  <tr className={`border-t ${tableRow} transition-colors`}>
                    <td className={`px-5 py-3 text-sm font-medium ${textClass}`}>Attendance Rate (30d)</td>
                    <td className={`px-5 py-3 text-sm ${subClass}`}>{r?.attendanceRate30 || 0}%</td>
                    <td className={`px-5 py-3 text-sm ${subClass}`}>{r?.attendanceRateAllTime || 0}% (all time)</td>
                    <td className="px-5 py-3"><ChangeChip current={r?.attendanceRate30 || 0} previous={r?.attendanceRateAllTime || 0} /></td>
                  </tr>
                  <tr className={`border-t ${tableRow} transition-colors`}>
                    <td className={`px-5 py-3 text-sm font-medium ${textClass}`}>Delinquent Accounts</td>
                    <td className={`px-5 py-3 text-sm ${subClass}`}>{r?.delinquentCount || 0} accounts</td>
                    <td className={`px-5 py-3 text-sm ${subClass}`}>{fmt$(r?.delinquentTotalOwed || 0)} owed</td>
                    <td className="px-5 py-3">
                      {(r?.delinquentCount || 0) === 0
                        ? <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-0.5 w-fit"><CheckCircle className="h-3 w-3" />Clear</span>
                        : <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-0.5 w-fit"><XCircle className="h-3 w-3" />Action needed</span>
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Delinquent Accounts */}
        {activeTab === 'delinquent' && (
          <div className={`${cardBg} border rounded-xl overflow-hidden`}>
            <div className={`px-5 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-100'} flex items-center justify-between`}>
              <div>
                <h2 className={`text-base font-semibold ${textClass}`}>Delinquent / Zero Accounts</h2>
                <p className={`text-xs ${subClass} mt-0.5`}>Students with overdue or past-due pending payments</p>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">{r?.delinquentCount || 0} accounts · {fmt$(r?.delinquentTotalOwed || 0)} owed</span>
            </div>
            {(!r?.delinquentAccounts || r.delinquentAccounts.length === 0) ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <CheckCircle className="h-12 w-12 text-green-400" />
                <p className={`text-base font-medium ${textClass}`}>All accounts are current</p>
                <p className={`text-sm ${subClass}`}>No overdue or delinquent payments found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className={tableHeader}>
                  <tr>
                    {['Student', 'Email', 'Amount Owed', 'Action'].map(h => (
                      <th key={h} className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wide ${subClass}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.delinquentAccounts.map((acct: any) => (
                    <tr key={acct.studentId} className={`border-t ${tableRow} transition-colors`}>
                      <td className={`px-5 py-3 text-sm font-medium ${textClass}`}>{acct.name}</td>
                      <td className={`px-5 py-3 text-sm ${subClass}`}>{acct.email || '—'}</td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-semibold text-red-500">{fmt$(acct.amountOwed)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <button className="text-xs text-[#C8102E] hover:underline font-medium">Send Reminder</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Programs */}
        {activeTab === 'programs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* All Programs Enrollment */}
            <div className={`${cardBg} border rounded-xl overflow-hidden`}>
              <div className={`px-5 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <h2 className={`text-base font-semibold ${textClass}`}>Program Enrollment</h2>
                <p className={`text-xs ${subClass} mt-0.5`}>Active enrollments by program</p>
              </div>
              {(!r?.programEnrollments || r.programEnrollments.length === 0) ? (
                <div className={`text-center py-12 text-sm ${subClass}`}>No program enrollment data yet</div>
              ) : (
                <div className="p-5 space-y-3">
                  {r.programEnrollments.map((prog: any) => (
                    <div key={prog.programId}>
                      <div className="flex justify-between mb-1">
                        <span className={`text-sm font-medium ${textClass}`}>{prog.name}</span>
                        <span className={`text-xs ${subClass}`}>{prog.enrollmentCount} / {prog.maxSize}</span>
                      </div>
                      <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} overflow-hidden`}>
                        <div
                          className={`h-full rounded-full ${prog.fillRate >= 80 ? 'bg-green-500' : prog.fillRate >= 40 ? 'bg-[#C8102E]' : 'bg-red-300'}`}
                          style={{ width: `${Math.min(prog.fillRate, 100)}%` }}
                        />
                      </div>
                      <p className={`text-xs ${subClass} mt-0.5`}>{prog.fillRate}% full</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Underperforming Programs */}
            <div className={`${cardBg} border rounded-xl overflow-hidden`}>
              <div className={`px-5 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <h2 className={`text-base font-semibold ${textClass}`}>Underperforming Programs</h2>
                <p className={`text-xs ${subClass} mt-0.5`}>Programs with less than 30% fill rate</p>
              </div>
              {(!r?.underperformingPrograms || r.underperformingPrograms.length === 0) ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <CheckCircle className="h-10 w-10 text-green-400" />
                  <p className={`text-sm font-medium ${textClass}`}>All programs performing well</p>
                  <p className={`text-xs ${subClass}`}>No programs below 30% fill rate</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className={tableHeader}>
                    <tr>
                      {['Program', 'Enrolled', 'Fill Rate'].map(h => (
                        <th key={h} className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wide ${subClass}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.underperformingPrograms.map((prog: any) => (
                      <tr key={prog.programId} className={`border-t ${tableRow} transition-colors`}>
                        <td className={`px-5 py-3 text-sm font-medium ${textClass}`}>{prog.name}</td>
                        <td className={`px-5 py-3 text-sm ${subClass}`}>{prog.enrollmentCount} / {prog.maxSize}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">{prog.fillRate}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Class Attendance Rankings */}
            <div className={`${cardBg} border rounded-xl overflow-hidden lg:col-span-2`}>
              <div className={`px-5 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <h2 className={`text-base font-semibold ${textClass}`}>Class Attendance Rankings</h2>
                <p className={`text-xs ${subClass} mt-0.5`}>Top 10 classes by total attendance</p>
              </div>
              {(!r?.classAttendanceCounts || r.classAttendanceCounts.length === 0) ? (
                <div className={`text-center py-12 text-sm ${subClass}`}>No class attendance data yet</div>
              ) : (
                <table className="w-full">
                  <thead className={tableHeader}>
                    <tr>
                      {['Rank', 'Class', 'Total Check-ins'].map(h => (
                        <th key={h} className={`px-5 py-3 text-left text-xs font-medium uppercase tracking-wide ${subClass}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.classAttendanceCounts.map((cls: any, i: number) => (
                      <tr key={cls.classId || i} className={`border-t ${tableRow} transition-colors`}>
                        <td className={`px-5 py-3 text-sm ${subClass}`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </td>
                        <td className={`px-5 py-3 text-sm font-medium ${textClass}`}>{cls.className || `Class #${cls.classId}`}</td>
                        <td className={`px-5 py-3 text-sm ${subClass}`}>{cls.attendanceCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab: Attendance */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${cardBg} border rounded-xl p-5`}>
              <SectionHeader title="Daily Attendance (Last 30 Days)" subtitle="Attended vs missed per day" isDark={isDark} />
              <AttendanceBar data={r?.attendanceLast30Days || []} isDark={isDark} />
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#C8102E]" /><span className={`text-xs ${subClass}`}>Attended</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-300 opacity-60" /><span className={`text-xs ${subClass}`}>Missed</span></div>
              </div>
            </div>

            <div className={`${cardBg} border rounded-xl p-5`}>
              <SectionHeader title="Attendance Summary" isDark={isDark} />
              <div className="space-y-4 mt-2">
                <div className={`flex justify-between items-center py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                  <span className={`text-sm ${subClass}`}>Last 30 Days — Attended</span>
                  <span className={`text-sm font-semibold ${textClass}`}>{r?.totalAttended30 || 0}</span>
                </div>
                <div className={`flex justify-between items-center py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                  <span className={`text-sm ${subClass}`}>Last 30 Days — Missed</span>
                  <span className={`text-sm font-semibold ${textClass}`}>{r?.totalMissed30 || 0}</span>
                </div>
                <div className={`flex justify-between items-center py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                  <span className={`text-sm ${subClass}`}>Last 30 Days — Rate</span>
                  <span className={`text-sm font-semibold ${r?.attendanceRate30 >= 80 ? 'text-green-500' : r?.attendanceRate30 >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>{r?.attendanceRate30 || 0}%</span>
                </div>
                <div className={`flex justify-between items-center py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                  <span className={`text-sm ${subClass}`}>All Time — Rate</span>
                  <span className={`text-sm font-semibold ${textClass}`}>{r?.attendanceRateAllTime || 0}%</span>
                </div>
                <div className={`flex justify-between items-center py-3`}>
                  <span className={`text-sm ${subClass}`}>Most Popular Class</span>
                  <span className={`text-sm font-semibold ${textClass}`}>{r?.mostPopularClass?.className || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagementLayout>
  );
}
