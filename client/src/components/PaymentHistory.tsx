import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { trpc } from '../utils/trpc';

interface PaymentRecord {
  id: string;
  type: 'charge' | 'subscription' | 'refund';
  amount: number;
  credits: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description: string;
  transactionId: string;
}

export default function PaymentHistory() {
  const { isDark } = useTheme();
  const [filter, setFilter] = useState<'all' | 'charge' | 'subscription' | 'refund'>('all');

  // Fetch payment history
  const { data: history, isLoading } = trpc.fluidPay.getPaymentHistory.useQuery();

  const payments: PaymentRecord[] = history?.payments || [];

  const filteredPayments = payments.filter(
    (p) => filter === 'all' || p.type === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return isDark ? 'bg-green-900/20 text-green-200' : 'bg-green-50 text-green-900';
      case 'pending':
        return isDark ? 'bg-yellow-900/20 text-yellow-200' : 'bg-yellow-50 text-yellow-900';
      case 'failed':
        return isDark ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-900';
      default:
        return isDark ? 'bg-gray-900/20 text-gray-200' : 'bg-gray-50 text-gray-900';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'charge':
        return 'One-time Purchase';
      case 'subscription':
        return 'Subscription';
      case 'refund':
        return 'Refund';
      default:
        return type;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`px-6 py-8 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Payment History
        </h1>
        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          View all your transactions and invoices
        </p>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8 max-w-4xl">
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'charge', 'subscription', 'refund'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === f
                  ? 'bg-red-600 text-white'
                  : isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {f === 'all' ? 'All Transactions' : getTypeLabel(f)}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading payment history...
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredPayments.length === 0 && (
          <div
            className={`text-center py-12 rounded-lg border-2 border-dashed ${
              isDark
                ? 'border-gray-700 bg-gray-800/50'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <p className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              No transactions found
            </p>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              {filter === 'all'
                ? 'You haven\'t made any purchases yet.'
                : `No ${getTypeLabel(filter).toLowerCase()} transactions found.`}
            </p>
          </div>
        )}

        {/* Transactions Table */}
        {!isLoading && filteredPayments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`border-b ${
                    isDark ? 'border-white/10' : 'border-gray-200'
                  }`}
                >
                  <th
                    className={`text-left px-4 py-3 font-semibold ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Date
                  </th>
                  <th
                    className={`text-left px-4 py-3 font-semibold ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Type
                  </th>
                  <th
                    className={`text-left px-4 py-3 font-semibold ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Description
                  </th>
                  <th
                    className={`text-right px-4 py-3 font-semibold ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Amount
                  </th>
                  <th
                    className={`text-right px-4 py-3 font-semibold ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Credits
                  </th>
                  <th
                    className={`text-center px-4 py-3 font-semibold ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className={`border-b transition-colors hover:${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                    } ${isDark ? 'border-white/5' : 'border-gray-100'}`}
                  >
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {getTypeLabel(payment.type)}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {payment.description}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      +{payment.credits.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Card */}
        {!isLoading && filteredPayments.length > 0 && (
          <div
            className={`mt-8 p-6 rounded-lg border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Spent
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  ${filteredPayments
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toFixed(2)}
                </p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Credits
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {filteredPayments
                    .reduce((sum, p) => sum + p.credits, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Avg. Cost per Credit
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  ${(
                    filteredPayments.reduce((sum, p) => sum + p.amount, 0) /
                    filteredPayments.reduce((sum, p) => sum + p.credits, 0)
                  ).toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
