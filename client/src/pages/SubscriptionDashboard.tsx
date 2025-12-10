import React, { useState, useEffect } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Calendar,
  CreditCard,
  BarChart3,
  Clock,
  AlertCircle,
} from 'lucide-react';
import CreditPurchaseModal from '../components/CreditPurchaseModal';
import SimpleLayout from '../components/SimpleLayout';

/**
 * Subscription Dashboard
 * Overview of subscription status, credit usage, and analytics
 */
const SubscriptionDashboard = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [creditSummary, setCreditSummary] = useState(null);
  const [creditHistory, setCreditHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreditModal, setShowCreditModal] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      // Fetch subscription status
      const statusResponse = await fetch('/api/subscription/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSubscriptionStatus(statusData);
      }

      // Fetch credit summary
      const summaryResponse = await fetch('/api/subscription/credits/summary?days=30');
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setCreditSummary(summaryData);
      }

      // Fetch credit history
      const historyResponse = await fetch('/api/subscription/credits/history?limit=10');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setCreditHistory(historyData.history);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SimpleLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-white text-xl">Loading subscription data...</div>
        </div>
      </SimpleLayout>
    );
  }

  if (!subscriptionStatus) {
    return (
      <SimpleLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-red-400 text-xl">No active subscription found</div>
        </div>
      </SimpleLayout>
    );
  }

  const { subscription, credit_balance, user_limit_status, location_limit_status } = subscriptionStatus;

  return (
    <SimpleLayout>
      <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Subscription & Credits
          </h1>
          <p className="text-slate-400">
            Manage your subscription and monitor credit usage
          </p>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Plan */}
          <div className="bg-slate-800 rounded-xl border border-emerald-500 p-6">
            <div className="flex items-center justify-between mb-4">
              <CreditCard className="w-8 h-8 text-emerald-400" />
              <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full font-bold">
                ACTIVE
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {subscription.plan_display_name}
            </div>
            <div className="text-sm text-slate-400">
              ${subscription.price_monthly}/month
            </div>
          </div>

          {/* Credit Balance */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8 text-yellow-400" fill="currentColor" />
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {credit_balance.toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">
              Credits remaining
            </div>
          </div>

          {/* Users */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {user_limit_status.current_count} / {user_limit_status.max_allowed || '∞'}
            </div>
            <div className="text-sm text-slate-400">
              Active users
            </div>
          </div>

          {/* Locations */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <MapPin className="w-8 h-8 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {location_limit_status.current_count} / {location_limit_status.max_allowed}
            </div>
            <div className="text-sm text-slate-400">
              Locations
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Credit Usage Analytics */}
          <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Credit Usage (Last 30 Days)
              </h2>
              <span className="text-sm text-slate-400">
                {creditSummary?.total_used.toLocaleString() || 0} credits used
              </span>
            </div>

            {/* Usage by Category */}
            {creditSummary && creditSummary.by_category && (
              <div className="space-y-4">
                {Object.entries(creditSummary.by_category).map(([category, amount]) => {
                  const percentage = (amount / creditSummary.total_used) * 100;
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300 capitalize">
                          {category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-white font-semibold">
                          {amount.toLocaleString()} credits
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {(!creditSummary || Object.keys(creditSummary.by_category || {}).length === 0) && (
              <div className="text-center py-12 text-slate-400">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <div>No credit usage in the last 30 days</div>
              </div>
            )}
          </div>

          {/* Subscription Details */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Subscription Details
            </h2>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-400 mb-1">Plan</div>
                <div className="text-white font-semibold">
                  {subscription.plan_display_name}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-400 mb-1">Monthly Cost</div>
                <div className="text-white font-semibold">
                  ${subscription.price_monthly}/month
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-400 mb-1">Monthly Credits</div>
                <div className="text-white font-semibold">
                  {subscription.credits_monthly.toLocaleString()} credits
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-400 mb-1">Current Period</div>
                <div className="text-white font-semibold text-sm">
                  {new Date(subscription.current_period_start).toLocaleDateString()} -{' '}
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-400 mb-1">Status</div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-emerald-400 font-semibold capitalize">
                    {subscription.status}
                  </span>
                </div>
              </div>

              <button className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-all">
                Manage Subscription
              </button>

              <button
                onClick={() => setShowCreditModal(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg font-semibold transition-all"
              >
                Purchase Credits
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Recent Credit Activity
          </h2>

          {creditHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3 text-right">Credits</th>
                    <th className="pb-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {creditHistory.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 text-slate-300">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span className="text-slate-300 capitalize">
                          {tx.category ? tx.category.replace(/_/g, ' ') : tx.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">
                        {tx.description}
                      </td>
                      <td className={`py-3 text-right font-semibold ${
                        tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </td>
                      <td className="py-3 text-right text-white font-semibold">
                        {tx.balance_after.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <div>No recent activity</div>
            </div>
          )}
        </div>

        {/* Low Credit Warning */}
        {credit_balance < subscription.credits_monthly * 0.2 && (
          <div className="mt-6 bg-yellow-900/20 border border-yellow-500 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <div className="text-lg font-bold text-yellow-300 mb-2">
                  Low Credit Balance
                </div>
                <div className="text-yellow-200 mb-4">
                  You have {credit_balance.toLocaleString()} credits remaining. Consider purchasing
                  add-on credits to avoid service interruptions.
                </div>
                <button
                  onClick={() => setShowCreditModal(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 py-2 px-6 rounded-lg font-semibold transition-all"
                >
                  Purchase Credits Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        organizationId={1}
      />
      </div>
    </SimpleLayout>
  );
};

export default SubscriptionDashboard;

