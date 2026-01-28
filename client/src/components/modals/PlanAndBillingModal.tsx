import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useModal } from '@/contexts/ModalContext';
import { toast } from 'sonner';
import { X, CreditCard, TrendingUp, Calendar, Zap, AlertCircle, Loader } from 'lucide-react';
import AddCreditModal from './AddCreditModal';

interface BillingSnapshot {
  planName: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'paused';
  renewalDate: string | null;
  monthlyCreditsIncluded: number;
  currentCreditBalance: number;
  orgId: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  billingCycle: 'monthly' | 'annual';
  totalPurchased: number;
  totalUsed: number;
}

interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface CreditTransaction {
  id: number;
  type: 'deduction' | 'refund' | 'allocation' | 'purchase' | 'bonus';
  amount: number;
  description: string;
  createdAt: string;
  balanceAfter: number;
  taskType?: string;
}

export function PlanAndBillingModal() {
  const { user, organizationId } = useAuth();
  const { closeModal } = useModal();
  const [showAddCredit, setShowAddCredit] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  // Queries
  const billingSnapshotQuery = trpc.subscription.getBillingSnapshot.useQuery(
    { organizationId: organizationId || 0 },
    { enabled: !!organizationId }
  );

  const paymentMethodQuery = trpc.subscription.getDefaultPaymentMethod.useQuery(
    { organizationId: organizationId || 0 },
    { enabled: !!organizationId }
  );

  const recentTransactionsQuery = trpc.credits.getRecentTransactions.useQuery(
    { limit: 10, offset: 0 },
    { enabled: !!organizationId }
  );

  // Mutations
  const createPortalSession = trpc.subscription.createBillingPortalSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error('Failed to open billing portal');
      console.error('Portal error:', error);
    },
  });

  const billing = billingSnapshotQuery.data;
  const paymentMethod = paymentMethodQuery.data;
  const transactions = recentTransactionsQuery.data || [];

  const handleOpenPortal = async () => {
    setIsLoadingPortal(true);
    try {
      await createPortalSession.mutateAsync({
        organizationId: organizationId || 0,
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-500/10';
      case 'trial':
        return 'text-blue-500 bg-blue-500/10';
      case 'past_due':
        return 'text-red-500 bg-red-500/10';
      case 'cancelled':
        return 'text-gray-500 bg-gray-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return '💳';
      case 'allocation':
        return '📦';
      case 'bonus':
        return '🎁';
      case 'refund':
        return '↩️';
      default:
        return '📊';
    }
  };

  if (showAddCredit) {
    return <AddCreditModal isOpen={true} onClose={() => setShowAddCredit(false)} />
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Plan & Billing</h2>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Section A: Current Plan */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard size={20} />
              Current Plan
            </h3>

            {billingSnapshotQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader size={24} className="animate-spin text-blue-500" />
              </div>
            ) : billing ? (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Plan Name</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{billing.planName}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(billing.status)}`}>
                    {billing.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Renewal Date</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{formatDate(billing.renewalDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Billing Cycle</p>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">{billing.billingCycle}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-200 dark:border-slate-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Credits Included</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <Zap size={20} />
                    {billing.monthlyCreditsIncluded.toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleOpenPortal}
                    disabled={isLoadingPortal || createPortalSession.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoadingPortal ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Opening...
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} />
                        Open Stripe Portal
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowAddCredit(true)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <TrendingUp size={16} />
                    Change Plan
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Section B: Billing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard size={20} />
              Billing
            </h3>

            {paymentMethodQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader size={24} className="animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-6 space-y-4">
                {paymentMethod ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Default Payment Method</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="w-12 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded flex items-center justify-center text-white text-xs font-bold">
                          {paymentMethod.brand.toUpperCase().substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white capitalize">{paymentMethod.brand}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            •••• {paymentMethod.last4} · Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                          </p>
                        </div>
                      </div>
                    </div>

                    {billing && (
                      <div className="pt-4 border-t border-gray-200 dark:border-slate-700 space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Billing Email</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{user?.email}</p>
                      </div>
                    )}

                    <button
                      onClick={handleOpenPortal}
                      disabled={isLoadingPortal || createPortalSession.isPending}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      View All Invoices
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-yellow-900 dark:text-yellow-100">No payment method on file</p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">Open Stripe Portal to add a payment method</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section C: Credits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap size={20} />
              Credits
            </h3>

            {billingSnapshotQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader size={24} className="animate-spin text-blue-500" />
              </div>
            ) : billing ? (
              <div className="space-y-4">
                {/* Credit Balance Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">Current Balance</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                      {billing.currentCreditBalance.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase">Monthly</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                      {billing.monthlyCreditsIncluded.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase">Purchased</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                      {billing.totalPurchased.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Buy Credits Button */}
                <button
                  onClick={() => setShowAddCredit(true)}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <TrendingUp size={18} />
                  Buy More Credits
                </button>

                {/* Recent Transactions */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Transactions</h4>
                  {recentTransactionsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader size={20} className="animate-spin text-blue-500" />
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {transactions.map((tx: CreditTransaction) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-xl">{getTransactionIcon(tx.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {tx.description || tx.type}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(tx.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <p className={`font-semibold text-sm ${tx.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No transactions yet</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
