import React, { useState } from 'react';
import { Clock, Download, Filter, Search, Zap } from 'lucide-react';
import { trpc } from '../lib/trpc';
import BottomNavLayout from '../components/BottomNavLayout';
import { Link } from 'react-router-dom';

/**
 * CreditTransactions
 * Detailed credit transaction history with filtering and export
 */
const CreditTransactions = () => {
  const [taskTypeFilter, setTaskTypeFilter] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Calculate date range
  const getStartDate = () => {
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
  };

  // Fetch transactions with filters
  const { data: transactions, isLoading } = trpc.subscription.getCreditTransactions.useQuery({
    taskType: taskTypeFilter,
    startDate: getStartDate(),
    limit: 100,
  });

  // Filter by search term (client-side)
  const filteredTransactions = transactions?.filter((tx) =>
    tx.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Export to CSV
  const handleExport = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) return;

    const headers = ['Date', 'Task Type', 'Description', 'Credits', 'Balance After'];
    const rows = filteredTransactions.map((tx) => [
      new Date(tx.createdAt).toLocaleString(),
      tx.taskType,
      tx.description || '-',
      tx.changeAmount.toString(),
      tx.balanceAfter.toString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get unique task types for filter
  const taskTypes = transactions
    ? Array.from(new Set(transactions.map((tx) => tx.taskType))).filter(Boolean)
    : [];

  return (
    <BottomNavLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-4xl font-bold text-white">Credit Transaction History</h1>
              <Link to="/subscription" className="text-primary hover:underline text-sm">
                ← Back to Dashboard
              </Link>
            </div>
            <p className="text-slate-400">View and export your complete credit usage history</p>
          </div>

          {/* Filters */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Search Description</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search transactions..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Task Type Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Task Type</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={taskTypeFilter || ''}
                    onChange={(e) => setTaskTypeFilter(e.target.value || undefined)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary appearance-none"
                  >
                    <option value="">All Types</option>
                    {taskTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date Range</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as any)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary appearance-none"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="all">All time</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleExport}
                disabled={!filteredTransactions || filteredTransactions.length === 0}
                className="bg-primary hover:bg-primary/90 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export to CSV
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">Loading transactions...</div>
            ) : !filteredTransactions || filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <div>No transactions found</div>
                <div className="text-sm mt-2">Try adjusting your filters</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900">
                    <tr className="text-left text-sm text-slate-400">
                      <th className="px-6 py-4 font-medium">Date & Time</th>
                      <th className="px-6 py-4 font-medium">Task Type</th>
                      <th className="px-6 py-4 font-medium">Description</th>
                      <th className="px-6 py-4 font-medium text-right">Credits</th>
                      <th className="px-6 py-4 font-medium text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 text-slate-300 text-sm">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                            {tx.taskType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 text-sm">{tx.description || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`font-semibold ${
                              tx.changeAmount > 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {tx.changeAmount > 0 ? '+' : ''}
                            {tx.changeAmount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-white font-medium">
                          {tx.balanceAfter.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {filteredTransactions && filteredTransactions.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <div className="text-sm text-slate-400 mb-1">Total Transactions</div>
                <div className="text-2xl font-bold text-white">{filteredTransactions.length}</div>
              </div>
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <div className="text-sm text-slate-400 mb-1">Credits Used</div>
                <div className="text-2xl font-bold text-red-400">
                  {filteredTransactions
                    .filter((tx) => tx.changeAmount < 0)
                    .reduce((sum, tx) => sum + Math.abs(tx.changeAmount), 0)
                    .toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <div className="text-sm text-slate-400 mb-1">Credits Added</div>
                <div className="text-2xl font-bold text-emerald-400">
                  +
                  {filteredTransactions
                    .filter((tx) => tx.changeAmount > 0)
                    .reduce((sum, tx) => sum + tx.changeAmount, 0)
                    .toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </BottomNavLayout>
  );
};

export default CreditTransactions;
