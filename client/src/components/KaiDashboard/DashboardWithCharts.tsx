/**
 * Kai Dashboard with Charts
 * Enhanced dashboard with visualizations and metric cards
 */

import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCurrency, formatDate } from '@/lib/dashboard-utils';
import { RevenueChart } from './RevenueChart';
import { AttendanceChart } from './AttendanceChart';
import styles from './DashboardLayout.module.css';

interface DateRange {
  startDate: string;
  endDate: string;
}

export const DashboardWithCharts: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    };
  });

  const [locationId, setLocationId] = useState<number>(1);
  const [chartData, setChartData] = useState<any>({});

  // Fetch metrics
  const revenueSummary = trpc.kaiData.getRevenueSummary.useQuery(
    {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      locationId,
    },
    { staleTime: 5 * 60 * 1000 }
  );

  const overdueAccounts = trpc.kaiData.getOverdueAccounts.useQuery(
    {
      daysPastDue: 30,
      locationId,
    },
    { staleTime: 5 * 60 * 1000 }
  );

  const classesList = trpc.kaiData.listClasses.useQuery(
    {
      limit: 50,
    },
    { staleTime: 5 * 60 * 1000 }
  );

  const kioskToday = trpc.kaiData.getKioskToday.useQuery(
    {
      locationId,
    },
    { staleTime: 1 * 60 * 1000 }
  );

  // Generate mock chart data for demo
  useEffect(() => {
    const days = 30;
    const revenueData = [];
    const today = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      revenueData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.floor(Math.random() * 5000) + 1000,
      });
    }

    setChartData({ revenue: revenueData });
  }, []);

  const handleDateRangeChange = (newStart: string, newEnd: string) => {
    setDateRange({
      startDate: newStart,
      endDate: newEnd,
    });
  };

  const handleRefresh = () => {
    revenueSummary.refetch();
    overdueAccounts.refetch();
    classesList.refetch();
    kioskToday.refetch();
  };

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Kai Dashboard</h1>
          <p className={styles.subtitle}>Real-time metrics and analytics</p>
        </div>

        <div className={styles.controls}>
          <div className={styles.dateFilter}>
            <label htmlFor="startDate">From:</label>
            <input
              id="startDate"
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                handleDateRangeChange(e.target.value, dateRange.endDate)
              }
              className={styles.dateInput}
            />

            <label htmlFor="endDate">To:</label>
            <input
              id="endDate"
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                handleDateRangeChange(dateRange.startDate, e.target.value)
              }
              className={styles.dateInput}
            />
          </div>

          <button
            onClick={handleRefresh}
            className={styles.refreshBtn}
            disabled={
              revenueSummary.isLoading ||
              overdueAccounts.isLoading ||
              kioskToday.isLoading
            }
          >
            {revenueSummary.isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.metricsGrid}>
        {/* Revenue Summary Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Revenue Summary</h2>
            <span className={styles.period}>
              {dateRange.startDate} to {dateRange.endDate}
            </span>
          </div>
          {revenueSummary.isLoading ? (
            <div className={styles.loading}>Loading...</div>
          ) : revenueSummary.data ? (
            <div className={styles.cardContent}>
              <div className={styles.metricRow}>
                <span className={styles.label}>Total Revenue</span>
                <span className={styles.value}>
                  {formatCurrency(revenueSummary.data.totalRevenue)}
                </span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.label}>Transactions</span>
                <span className={styles.value}>
                  {revenueSummary.data.totalTransactions}
                </span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.label}>Avg Transaction</span>
                <span className={styles.value}>
                  {formatCurrency(revenueSummary.data.averageTransactionValue)}
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.error}>Failed to load revenue data</div>
          )}
        </div>

        {/* Revenue Chart */}
        <div className={styles.card}>
          <RevenueChart
            data={chartData.revenue || []}
            title="Revenue Trend (30 Days)"
            height={280}
          />
        </div>

        {/* Overdue Accounts Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Overdue Accounts</h2>
            <span className={styles.badge}>
              {overdueAccounts.data?.totalCount || 0}
            </span>
          </div>
          {overdueAccounts.isLoading ? (
            <div className={styles.loading}>Loading...</div>
          ) : overdueAccounts.data && overdueAccounts.data.totalCount > 0 ? (
            <div className={styles.cardContent}>
              <div className={styles.accountsList}>
                {overdueAccounts.data.accounts.slice(0, 5).map((account) => (
                  <div key={account.studentId} className={styles.accountItem}>
                    <div className={styles.accountName}>
                      {account.studentName}
                    </div>
                    <div className={styles.accountAmount}>
                      {formatCurrency(account.totalOverdue)}
                    </div>
                    <div className={styles.accountDays}>
                      {account.daysPastDue} days past due
                    </div>
                  </div>
                ))}
              </div>
              {overdueAccounts.data.totalCount > 5 && (
                <div className={styles.moreItems}>
                  +{overdueAccounts.data.totalCount - 5} more
                </div>
              )}
            </div>
          ) : (
            <div className={styles.empty}>No overdue accounts</div>
          )}
        </div>

        {/* Class Capacity Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Class Capacity</h2>
            <span className={styles.period}>
              {classesList.data?.totalCount || 0} classes
            </span>
          </div>
          {classesList.isLoading ? (
            <div className={styles.loading}>Loading...</div>
          ) : classesList.data && classesList.data.classes.length > 0 ? (
            <div className={styles.cardContent}>
              <div className={styles.classesList}>
                {classesList.data.classes.slice(0, 5).map((cls) => (
                  <div key={cls.classId} className={styles.classItem}>
                    <div className={styles.className}>{cls.name}</div>
                    <div className={styles.capacityBar}>
                      <div
                        className={styles.capacityFill}
                        style={{
                          width: `${(cls.enrolled / cls.capacity) * 100}%`,
                        }}
                      />
                    </div>
                    <div className={styles.capacityText}>
                      {cls.enrolled}/{cls.capacity} students
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.empty}>No classes available</div>
          )}
        </div>

        {/* Attendance Chart */}
        <div className={styles.card}>
          <AttendanceChart
            attended={45}
            missed={8}
            excused={12}
            upcoming={35}
            title="Attendance Overview"
            height={280}
          />
        </div>

        {/* Kiosk Activity Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Today's Check-ins</h2>
            <span className={styles.badge}>
              {kioskToday.data?.totalCount || 0}
            </span>
          </div>
          {kioskToday.isLoading ? (
            <div className={styles.loading}>Loading...</div>
          ) : kioskToday.data && kioskToday.data.totalCount > 0 ? (
            <div className={styles.cardContent}>
              <div className={styles.checkinsList}>
                {kioskToday.data.checkins.slice(0, 5).map((checkin) => (
                  <div key={checkin.id} className={styles.checkinItem}>
                    <div className={styles.checkinName}>
                      {checkin.studentName}
                    </div>
                    <div className={styles.checkinTime}>
                      {formatDate(checkin.checkInTime, 'HH:mm')}
                    </div>
                    <div
                      className={`${styles.checkinStatus} ${styles[checkin.status]}`}
                    >
                      {checkin.status}
                    </div>
                  </div>
                ))}
              </div>
              {kioskToday.data.totalCount > 5 && (
                <div className={styles.moreItems}>
                  +{kioskToday.data.totalCount - 5} more
                </div>
              )}
            </div>
          ) : (
            <div className={styles.empty}>No check-ins today</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardWithCharts;
