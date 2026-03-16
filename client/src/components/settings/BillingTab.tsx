import React, { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import {
  CreditCard,
  Calendar,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Package,
} from 'lucide-react';
import { AddCreditsModal } from './CreditsCard';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatCredits(n: number): string {
  return n.toLocaleString();
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    active: { label: 'Active', color: '#22c55e', icon: <CheckCircle size={13} /> },
    trial: { label: 'Trial', color: '#f59e0b', icon: <Clock size={13} /> },
    trialing: { label: 'Trial', color: '#f59e0b', icon: <Clock size={13} /> },
    past_due: { label: 'Past Due', color: '#ef4444', icon: <AlertCircle size={13} /> },
    canceled: { label: 'Canceled', color: '#6b7280', icon: <AlertCircle size={13} /> },
    incomplete: { label: 'Incomplete', color: '#f59e0b', icon: <AlertCircle size={13} /> },
  };
  const s = map[status?.toLowerCase()] ?? { label: status ?? 'Unknown', color: '#6b7280', icon: null };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        color: s.color,
        backgroundColor: s.color + '22',
        border: `1px solid ${s.color}44`,
      }}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

// ─── card shell ─────────────────────────────────────────────────────────────

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      padding: '20px 24px',
      borderRadius: '12px',
      backgroundColor: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      ...style,
    }}
  >
    {children}
  </div>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{label}</span>
    <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{value}</span>
  </div>
);

// ─── main component ──────────────────────────────────────────────────────────

export const BillingTab: React.FC = () => {
  const { user } = useAuth();
  const orgId = user?.activeOrgId;
  const [showAddCredits, setShowAddCredits] = useState(false);

  // ── data queries ────────────────────────────────────────────────────────
  const { data: snapshot, isLoading: snapshotLoading, refetch: refetchSnapshot } =
    trpc.subscription.getBillingSnapshot.useQuery(
      { organizationId: orgId! },
      { enabled: !!orgId, staleTime: 30_000 }
    );

  const { data: paymentMethod, isLoading: pmLoading } =
    trpc.subscription.getDefaultPaymentMethod.useQuery(
      { organizationId: orgId! },
      { enabled: !!orgId, staleTime: 60_000 }
    );

  const { data: creditBalance, refetch: refetchBalance } =
    trpc.credits.getBalance.useQuery(
      undefined,
      { enabled: !!orgId, staleTime: 30_000 }
    );

  // ── mutations ───────────────────────────────────────────────────────────
  const billingPortalMutation = trpc.subscription.createBillingPortalSession.useMutation({
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (err) => {
      toast.error(err.message || 'Could not open billing portal. Please try again.');
    },
  });

  const trialMutation = trpc.subscription.createTrialCheckout.useMutation({
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to start trial checkout.');
    },
  });

  // ── derived state ────────────────────────────────────────────────────────
  const isLoading = snapshotLoading || pmLoading;
  const isOnTrial = snapshot?.status === 'trial' || snapshot?.status === 'trialing';
  const isActive = snapshot?.status === 'active';
  const isCanceled = snapshot?.status === 'canceled';
  const hasStripe = !!snapshot?.stripeCustomerId;

  const creditsRemaining = creditBalance?.creditsRemaining ?? snapshot?.currentCreditBalance ?? 0;
  const totalUsed = creditBalance?.usedCredits ?? snapshot?.totalUsed ?? 0;
  const totalPurchased = (creditBalance?.totalCredits ?? 0) + (snapshot?.totalPurchased ?? 0);

  // ── render ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'rgba(255,255,255,0.4)', gap: '10px' }}>
        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading billing info…</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Plan & Status ─────────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={16} style={{ color: '#e11d48' }} />
          Current Plan
        </div>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>
                {snapshot?.planName || 'Free Plan'}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                {snapshot?.billingCycle === 'annual' ? 'Annual billing' : 'Monthly billing'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              {statusBadge(snapshot?.status || 'trial')}
              {isOnTrial && snapshot?.renewalDate && (
                <span style={{ fontSize: '11px', color: '#f59e0b' }}>
                  Trial ends {formatDate(snapshot.renewalDate)}
                </span>
              )}
            </div>
          </div>

          {/* divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '0' }}>
            {snapshot?.renewalDate && !isOnTrial && (
              <Row
                label="Next billing date"
                value={
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    {formatDate(snapshot.renewalDate)}
                  </span>
                }
              />
            )}
            <Row label="Billing cycle" value={snapshot?.billingCycle === 'annual' ? 'Annual' : 'Monthly'} />
            {snapshot?.monthlyCreditsIncluded > 0 && (
              <Row label="Credits included / month" value={formatCredits(snapshot.monthlyCreditsIncluded)} />
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
            {isOnTrial && (
              <button
                onClick={() => {
                  if (!orgId) return;
                  trialMutation.mutate({ organizationId: orgId, customerEmail: user?.email ?? undefined });
                }}
                disabled={trialMutation.isPending}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#e11d48',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: trialMutation.isPending ? 0.7 : 1,
                }}
              >
                <ShieldCheck size={14} />
                {trialMutation.isPending ? 'Redirecting…' : 'Activate Subscription — $49.99/mo'}
              </button>
            )}
            {(isActive || hasStripe) && (
              <button
                onClick={() => {
                  if (!orgId) return;
                  billingPortalMutation.mutate({ organizationId: orgId });
                }}
                disabled={billingPortalMutation.isPending}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: billingPortalMutation.isPending ? 0.7 : 1,
                }}
              >
                <ExternalLink size={13} />
                {billingPortalMutation.isPending ? 'Opening…' : 'Manage Billing'}
              </button>
            )}
          </div>
        </Card>
      </div>

      {/* ── Credits Summary ───────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} style={{ color: '#e11d48' }} />
          Credits
        </div>
        <Card>
          {/* big balance number */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: creditsRemaining > 100 ? '#22c55e' : creditsRemaining > 20 ? '#f59e0b' : '#ef4444' }}>
                {formatCredits(creditsRemaining)}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>credits remaining</div>
            </div>
            <button
              onClick={() => setShowAddCredits(true)}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                backgroundColor: '#e11d48',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <TrendingUp size={14} />
              Add Credits
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '0' }}>
            <Row label="Total credits purchased" value={formatCredits(totalPurchased)} />
            <Row label="Total credits used" value={formatCredits(totalUsed)} />
          </div>

          {/* credit cost reference */}
          <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Credit costs</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                ['Kai AI message', '1 credit'],
                ['SMS message', '1 credit'],
                ['Email', '2 credits'],
                ['AI phone call', '10 credits/min'],
              ].map(([action, cost]) => (
                <div key={action} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{action}</span>
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{cost}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Payment Method ────────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={16} style={{ color: '#e11d48' }} />
          Payment Method
        </div>
        <Card>
          {paymentMethod ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '28px', borderRadius: '4px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700, color: 'white', textTransform: 'uppercase',
                }}>
                  {paymentMethod.brand}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
                    •••• •••• •••• {paymentMethod.last4}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                    Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                  </div>
                </div>
              </div>
              {hasStripe && (
                <button
                  onClick={() => orgId && billingPortalMutation.mutate({ organizationId: orgId })}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '7px',
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                  }}
                >
                  Update
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>
                <CreditCard size={16} />
                No payment method on file
              </div>
              {isOnTrial && (
                <button
                  onClick={() => orgId && trialMutation.mutate({ organizationId: orgId, customerEmail: user?.email ?? undefined })}
                  disabled={trialMutation.isPending}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '7px',
                    backgroundColor: '#e11d48',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Add Card
                </button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* ── Add Credits Modal ─────────────────────────────────────────── */}
      {showAddCredits && (
        <AddCreditsModal
          onClose={() => {
            setShowAddCredits(false);
            refetchSnapshot();
            refetchBalance();
          }}
          onSuccess={() => {
            setShowAddCredits(false);
            refetchSnapshot();
            refetchBalance();
          }}
        />
      )}
    </div>
  );
};

export default BillingTab;
