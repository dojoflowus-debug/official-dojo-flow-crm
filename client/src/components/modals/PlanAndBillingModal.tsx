import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { X, CreditCard, TrendingUp, Calendar, Zap, AlertCircle, Loader, Bell } from 'lucide-react';
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

interface PlanAndBillingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function PlanAndBillingModal({ isOpen: propIsOpen = true, onClose: propOnClose }: PlanAndBillingModalProps) {
  const { user, organizationId } = useAuth();
  const [isOpen, setIsOpen] = useState(propIsOpen);
  const [showAddCredit, setShowAddCredit] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [thresholdInput, setThresholdInput] = useState<string>('');
  const [isSavingThreshold, setIsSavingThreshold] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    propOnClose?.();
  }, [propOnClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      setTimeout(() => modalRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Handle backdrop click (overlay)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Queries
  const billingSnapshotQuery = trpc.subscription.getBillingSnapshot.useQuery(
    { organizationId: organizationId || 0 },
    { enabled: !!organizationId && isOpen }
  );

  const paymentMethodQuery = trpc.subscription.getDefaultPaymentMethod.useQuery(
    { organizationId: organizationId || 0 },
    { enabled: !!organizationId && isOpen }
  );

  const alertSettingsQuery = trpc.credits.getAlertSettings.useQuery(undefined, {
    enabled: !!organizationId,
    onSuccess: (data: any) => {
      if (thresholdInput === '') setThresholdInput(String(data.threshold));
    },
  });
  const updateThresholdMutation = trpc.credits.updateAlertThreshold.useMutation({
    onSuccess: () => {
      toast.success('Alert threshold updated');
      alertSettingsQuery.refetch();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update threshold'),
  });

  const handleSaveThreshold = async () => {
    const val = parseInt(thresholdInput, 10);
    if (isNaN(val) || val < 0) { toast.error('Enter a valid number (0 or more)'); return; }
    setIsSavingThreshold(true);
    try { await updateThresholdMutation.mutateAsync({ threshold: val }); }
    finally { setIsSavingThreshold(false); }
  };

  const recentTransactionsQuery = trpc.credits.getRecentTransactions.useQuery(
    { limit: 10, offset: 0 },
    { enabled: !!organizationId && isOpen }
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
        return 'text-emerald-400';
      case 'trial':
        return 'text-blue-400';
      case 'past_due':
        return 'text-red-400';
      case 'cancelled':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
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
    return <AddCreditModal isOpen={true} onClose={() => setShowAddCredit(false)} />;
  }

  if (!isOpen) return null;

  const modalContent = (
    <div
      onMouseDown={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        pointerEvents: 'auto',
      }}
    >
      {/* Modal Window */}
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-billing-title"
        style={{
          position: 'relative',
          width: 'min(960px, 92vw)',
          maxHeight: '80vh',
          backgroundColor: 'rgba(15, 15, 15, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          outline: 'none',
          pointerEvents: 'auto',
        }}
      >
        {/* Header - Fixed */}
        <div
          style={{
            padding: '24px 32px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            position: 'relative',
            zIndex: 10,
          }}
        >
          <h2
            id="plan-billing-title"
            style={{
              fontSize: '20px',
              fontWeight: '600',
              color: 'white',
              margin: 0,
            }}
          >
            Plan & Billing
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 200ms ease',
              pointerEvents: 'auto',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.6)';
            }}
            aria-label="Close plan and billing"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
          }}
        >
          {/* Section A: Current Plan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CreditCard size={18} />
              Current Plan
            </h3>

            {billingSnapshotQuery.isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : billing ? (
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', margin: '0 0 4px 0' }}>
                      Plan Name
                    </p>
                    <p style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>
                      {billing.planName}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: getStatusColor(billing.status),
                      textTransform: 'capitalize',
                    }}
                  >
                    {billing.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', margin: '0 0 4px 0' }}>
                      Renewal Date
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'white', margin: 0 }}>
                      {formatDate(billing.renewalDate)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', margin: '0 0 4px 0' }}>
                      Billing Cycle
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'white', margin: 0, textTransform: 'capitalize' }}>
                      {billing.billingCycle}
                    </p>
                  </div>
                </div>

                <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', margin: '0 0 8px 0' }}>
                    Monthly Credits Included
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#fbbf24', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={20} />
                    {billing.monthlyCreditsIncluded.toLocaleString()}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                  <button
                    onClick={handleOpenPortal}
                    disabled={isLoadingPortal || createPortalSession.isPending}
                    style={{
                      flex: 1,
                      backgroundColor: isLoadingPortal ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#fca5a5',
                      fontWeight: '500',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      cursor: isLoadingPortal ? 'not-allowed' : 'pointer',
                      transition: 'all 200ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      pointerEvents: 'auto',
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoadingPortal) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoadingPortal) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                      }
                    }}
                  >
                    {isLoadingPortal ? (
                      <>
                        <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        Opening...
                      </>
                    ) : (
                      <>
                        <CreditCard size={14} />
                        Open Stripe Portal
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Section B: Billing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CreditCard size={18} />
              Billing
            </h3>

            {paymentMethodQuery.isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                {paymentMethod ? (
                  <>
                    <div>
                      <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', margin: '0 0 12px 0' }}>
                        Default Payment Method
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '32px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: '700',
                            color: 'rgba(255, 255, 255, 0.7)',
                          }}
                        >
                          {paymentMethod.brand.toUpperCase().substring(0, 2)}
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: 'white', margin: '0 0 2px 0', textTransform: 'capitalize' }}>
                            {paymentMethod.brand}
                          </p>
                          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
                            •••• {paymentMethod.last4} · Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                          </p>
                        </div>
                      </div>
                    </div>

                    {billing && (
                      <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', margin: '0 0 4px 0' }}>
                          Billing Email
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: 'white', margin: 0 }}>
                          {user?.email}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleOpenPortal}
                      disabled={isLoadingPortal || createPortalSession.isPending}
                      style={{
                        width: '100%',
                        marginTop: '8px',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#93c5fd',
                        fontWeight: '500',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        cursor: isLoadingPortal ? 'not-allowed' : 'pointer',
                        transition: 'all 200ms ease',
                        fontSize: '14px',
                        pointerEvents: 'auto',
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoadingPortal) {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoadingPortal) {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                        }
                      }}
                    >
                      View All Invoices
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', backgroundColor: 'rgba(217, 119, 6, 0.1)', borderRadius: '12px', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                    <AlertCircle size={18} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#fcd34d', margin: '0 0 4px 0' }}>
                        No payment method on file
                      </p>
                      <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                        Open Stripe Portal to add a payment method
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section C: Credits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Zap size={18} />
              Credits
            </h3>

            {billingSnapshotQuery.isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : billing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Credit Balance Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '16px',
                    }}
                  >
                    <p style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '600', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                      Current Balance
                    </p>
                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#fbbf24', margin: 0 }}>
                      {billing.currentCreditBalance.toLocaleString()}
                    </p>
                  </div>
                  <div
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '16px',
                    }}
                  >
                    <p style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '600', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                      Monthly
                    </p>
                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#a78bfa', margin: 0 }}>
                      {billing.monthlyCreditsIncluded.toLocaleString()}
                    </p>
                  </div>
                  <div
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '16px',
                    }}
                  >
                    <p style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '600', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                      Purchased
                    </p>
                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#86efac', margin: 0 }}>
                      {billing.totalPurchased.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Buy Credits Button */}
                <button
                  onClick={() => setShowAddCredit(true)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#86efac',
                    fontWeight: '600',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    pointerEvents: 'auto',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                  }}
                >
                  <TrendingUp size={16} />
                  Buy More Credits
                </button>

                {/* Recent Transactions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'white', margin: 0 }}>
                    Recent Transactions
                  </h4>
                  {recentTransactionsQuery.isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : transactions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                      {transactions.map((tx: CreditTransaction) => (
                        <div
                          key={tx.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'all 200ms ease',
                            cursor: 'default',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '16px' }}>{getTransactionIcon(tx.type)}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '13px', fontWeight: '500', color: 'white', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {tx.description || tx.type}
                              </p>
                              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', margin: 0 }}>
                                {formatDate(tx.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                            <p
                              style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: tx.amount >= 0 ? '#86efac' : '#fca5a5',
                                margin: 0,
                              }}
                            >
                              {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', padding: '16px', textAlign: 'center', margin: 0 }}>
                      No transactions yet
                    </p>
                  )}
                </div>
              </div>

              {/* Low-Credit Alert Threshold Setting */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginTop: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Bell size={15} style={{ color: '#f59e0b' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'white', margin: 0 }}>Low-Credit Email Alert</h4>
                </div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: '0 0 14px 0', lineHeight: '1.5' }}>
                  Get an email when your balance drops below this number. Set to 0 to disable.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={thresholdInput !== '' ? thresholdInput : (alertSettingsQuery.data?.threshold ?? 50)}
                    onChange={(e) => setThresholdInput(e.target.value)}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      padding: '10px 14px',
                      outline: 'none',
                    }}
                    placeholder="e.g. 50"
                  />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>credits</span>
                  <button
                    onClick={handleSaveThreshold}
                    disabled={isSavingThreshold}
                    style={{
                      backgroundColor: '#f59e0b',
                      color: '#000',
                      fontWeight: '600',
                      fontSize: '13px',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: isSavingThreshold ? 'not-allowed' : 'pointer',
                      opacity: isSavingThreshold ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isSavingThreshold ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>

            </div>
            ) : null}
          </div>
        </div>

        {/* Footer - Close Button Escape Hatch */}
        <div
          style={{
            padding: '16px 32px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleClose}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '500',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              fontSize: '13px',
              pointerEvents: 'auto',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.9)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.7)';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
