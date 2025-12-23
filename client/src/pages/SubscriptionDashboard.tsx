import React, { useState } from 'react';
import {
  Zap,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  CreditCard,
  BarChart3,
  Clock,
  AlertCircle,
  ShoppingCart,
} from 'lucide-react';
import { trpc } from '../lib/trpc';
import BottomNavLayout from '../components/BottomNavLayout';
import { Link } from 'react-router-dom';

/**
 * Subscription Dashboard
 * Overview of subscription status, credit usage, and analytics
 */
const SubscriptionDashboard = () => {
  const [showCreditModal, setShowCreditModal] = useState(false);

  // Fetch subscription data using tRPC
  const { data: subscription, isLoading: subLoading } = trpc.subscription.getCurrentSubscription.useQuery();
  const { data: creditBalance, isLoading: creditLoading } = trpc.subscription.getCreditBalance.useQuery();
  const { data: transactions, isLoading: txLoading } = trpc.subscription.getCreditTransactions.useQuery({
    limit: 10,
  });

  const loading = subLoading || creditLoading || txLoading;

  if (loading) {
    return (
      <BottomNavLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-white text-xl">Loading subscription data...</div>
        </div>
      </BottomNavLayout>
    );
  }

  if (!subscription) {
    return (
      <BottomNavLayout>
        <div className="flex items-center justify-center min-h-[80vh] flex-col gap-4">
          <AlertCircle className="w-16 h-16 text-red-400" />
          <div className="text-red-400 text-xl">No active subscription found</div>
          <Link
            to="/pricing"
            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold"
          >
            View Pricing Plans
          </Link>
        </div>
      </BottomNavLayout>
    );
  }

  // Calculate usage percentage
  const usagePercentage = creditBalance
    ? Math.round((creditBalance.creditsUsed / (creditBalance.creditsUsed + creditBalance.creditsRemaining)) * 100)
    : 0;

  // Calculate days until renewal
  const daysUntilRenewal = subscription.currentPeriodEnd
    ? Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <BottomNavLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Subscription & Credits</h1>
            <p className="text-slate-400">Manage your subscription and monitor credit usage</p>
          </div>

          {/* Low Credit Warning */}
          {creditBalance && creditBalance.creditsRemaining < 50 && (
            <div
              className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
                creditBalance.creditsRemaining === 0
                  ? 'bg-red-500/10 border-red-500 text-red-400'
                  : creditBalance.creditsRemaining < 10
                  ? 'bg-red-500/10 border-red-500 text-red-400'
                  : 'bg-amber-500/10 border-amber-500 text-amber-400'
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                {creditBalance.creditsRemaining === 0 ? (
                  <div>
                    <div className="font-semibold">Out of Credits</div>
                    <div className="text-sm opacity-90">
                      AI features are currently disabled. Purchase credits or upgrade your plan to continue.
                    </div>
                  </div>
                ) : creditBalance.creditsRemaining < 10 ? (
                  <div>
                    <div className="font-semibold">Critical: Low Credits</div>
                    <div className="text-sm opacity-90">
                      Only {creditBalance.creditsRemaining} credits remaining. Top up now to avoid service interruption.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-semibold">Low Credits Warning</div>
                    <div className="text-sm opacity-90">
                      You have {creditBalance.creditsRemaining} credits remaining. Consider purchasing more credits.
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  to="/pricing"
                  className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                >
                  Upgrade Plan
                </Link>
                <button
                  onClick={() => setShowCreditModal(true)}
                  className="bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold text-sm text-white transition-all"
                >
                  Buy Credits
                </button>
              </div>
            </div>
          )}

          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Current Plan */}
            <div className="bg-slate-800 rounded-xl border border-primary p-6">
              <div className="flex items-center justify-between mb-4">
                <CreditCard className="w-8 h-8 text-primary" />
                <span className="text-xs bg-primary text-white px-2 py-1 rounded-full font-bold">
                  {subscription.status.toUpperCase()}
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{subscription.planName}</div>
              <div className="text-sm text-slate-400">${(subscription.priceMonthly / 100).toFixed(2)}/month</div>
            </div>

            {/* Credit Balance */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <Zap className="w-8 h-8 text-yellow-400" fill="currentColor" />
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {creditBalance?.creditsRemaining.toLocaleString() || 0}
              </div>
              <div className="text-sm text-slate-400">Credits remaining</div>
              <div className="mt-3 w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePercentage > 80 ? 'bg-red-500' : usagePercentage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${100 - usagePercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Monthly Allowance */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {subscription.creditsMonthly.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">Monthly allowance</div>
              <div className="text-xs text-slate-500 mt-2">Renews in {daysUntilRenewal} days</div>
            </div>

            {/* Credits Used */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {creditBalance?.creditsUsed.toLocaleString() || 0}
              </div>
              <div className="text-sm text-slate-400">Credits used this period</div>
              <div className="text-xs text-slate-500 mt-2">{usagePercentage}% of allowance</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Recent Credit Activity
                </h2>
                <Link to="/billing/credits" className="text-sm text-primary hover:underline">
                  View All →
                </Link>
              </div>

              {transactions && transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Task Type</th>
                        <th className="pb-3">Description</th>
                        <th className="pb-3 text-right">Credits</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                          <td className="py-3 text-slate-300">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                              {tx.taskType}
                            </span>
                          </td>
                          <td className="py-3 text-slate-300">{tx.description || '-'}</td>
                          <td className="py-3 text-right">
                            <span
                              className={`font-semibold ${
                                tx.changeAmount > 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {tx.changeAmount > 0 ? '+' : ''}
                              {tx.changeAmount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <div>No credit activity yet</div>
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
                  <div className="text-white font-semibold">{subscription.planName}</div>
                </div>

                <div>
                  <div className="text-sm text-slate-400 mb-1">Monthly Cost</div>
                  <div className="text-white font-semibold">
                    ${(subscription.priceMonthly / 100).toFixed(2)}/month
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-400 mb-1">Monthly Credits</div>
                  <div className="text-white font-semibold">
                    {subscription.creditsMonthly.toLocaleString()} credits
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-400 mb-1">Current Period</div>
                  <div className="text-white font-semibold text-sm">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-400 mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        subscription.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    ></span>
                    <span
                      className={`font-semibold capitalize ${
                        subscription.status === 'active' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {subscription.status}
                    </span>
                  </div>
                </div>

                <Link
                  to="/pricing"
                  className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-all block text-center"
                >
                  Manage Subscription
                </Link>

                <button
                  onClick={() => setShowCreditModal(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Purchase Credits
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Purchase Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Purchase Credits</h3>
            <p className="text-slate-400 mb-6">
              Credit top-ups are coming soon. For now, please upgrade your plan to get more monthly credits.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreditModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg font-semibold transition-all"
              >
                Close
              </button>
              <Link
                to="/pricing"
                className="flex-1 bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg font-semibold transition-all text-center"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      )}
    </BottomNavLayout>
  );
};

export default SubscriptionDashboard;
