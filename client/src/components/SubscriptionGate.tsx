/**
 * SubscriptionGate
 *
 * Wraps all authenticated CRM pages. If the organization's subscription
 * has expired (trial ended, cancelled, past_due, or no subscription at all),
 * it renders a full-screen paywall instead of the page content.
 *
 * Exempt: demo org (id=1), loading state, public routes.
 */
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { Check, Zap, Shield, Crown, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  slug: string;
  monthlyPrice: number;
  features: string; // JSON string
  displayOrder: number;
  stripePriceId?: string | null;
}

interface SubscriptionGateProps {
  children: React.ReactNode;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  foundation: <Shield className="w-7 h-7" />,
  'black-belt': <Zap className="w-7 h-7" />,
  leadership: <Crown className="w-7 h-7" />,
};

const PLAN_COLORS: Record<string, string> = {
  foundation: 'from-blue-500 to-blue-700',
  'black-belt': 'from-red-500 to-red-700',
  leadership: 'from-yellow-500 to-yellow-700',
};

export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orgId = user?.activeOrgId ?? 0;

  // Fetch subscription status
  const { data: subscription, isLoading: subLoading } = trpc.subscription.getCurrentSubscription.useQuery(
    { organizationId: orgId },
    { enabled: !!orgId && orgId !== 1 } // skip for demo org
  );

  // Fetch available plans
  const { data: plans, isLoading: plansLoading } = trpc.subscription.getPlans.useQuery(
    undefined,
    { enabled: !!orgId && orgId !== 1 }
  );

  // Checkout mutation
  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err) => {
      setError(err.message || 'Failed to start checkout. Please try again.');
      setCheckoutLoading(null);
    },
  });

  const handleSubscribe = async (planId: number) => {
    if (!orgId || !user?.email) return;
    setCheckoutLoading(planId);
    setError(null);
    try {
      await createCheckout.mutateAsync({
        organizationId: orgId,
        planId,
        customerEmail: user.email,
      });
    } catch {
      // handled by onError
    }
  };

  // --- Loading state ---
  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  // --- Not logged in or demo org — pass through ---
  if (!user || !orgId || orgId === 1) {
    return <>{children}</>;
  }

  // --- Determine if subscription is active ---
  const isActive = (() => {
    if (!subscription) return false;
    const status = subscription.status;
    if (status === 'active') return true;
    if (status === 'trial') {
      // Check if trial has expired
      const trialEnd = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
      if (!trialEnd) return true; // no end date = unlimited trial
      return trialEnd > new Date();
    }
    return false;
  })();

  // --- Active subscription — show content ---
  if (isActive) {
    return <>{children}</>;
  }

  // --- Determine paywall reason ---
  const reason = (() => {
    if (!subscription) return 'no_subscription';
    if (subscription.status === 'trial') return 'trial_expired';
    if (subscription.status === 'past_due') return 'past_due';
    if (subscription.status === 'cancelled') return 'cancelled';
    return 'inactive';
  })();

  const reasonMessages: Record<string, { title: string; subtitle: string }> = {
    no_subscription: {
      title: 'Start Your DojoFlow Subscription',
      subtitle: 'Choose a plan to unlock your full CRM, leads, students, and AI tools.',
    },
    trial_expired: {
      title: 'Your Free Trial Has Ended',
      subtitle: 'Subscribe now to keep access to all your leads, students, and AI features.',
    },
    past_due: {
      title: 'Payment Required',
      subtitle: 'Your last payment failed. Please update your billing to restore access.',
    },
    cancelled: {
      title: 'Your Subscription Was Cancelled',
      subtitle: 'Resubscribe to regain access to your DojoFlow CRM.',
    },
    inactive: {
      title: 'Subscription Inactive',
      subtitle: 'Please subscribe to access the DojoFlow CRM.',
    },
  };

  const { title, subtitle } = reasonMessages[reason] || reasonMessages.no_subscription;

  const sortedPlans: Plan[] = (plans || []).slice().sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/IjqOFvsLMkrXFIaF.png"
            alt="DojoFlow"
            className="h-8 w-8"
          />
          <span className="text-xl font-bold text-white">DojoFlow</span>
        </div>
        <div className="text-sm text-gray-400">
          Signed in as <span className="text-white font-medium">{user.email}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Alert banner for past_due */}
        {reason === 'past_due' && (
          <div className="mb-8 flex items-center gap-3 bg-yellow-900/40 border border-yellow-600 rounded-xl px-5 py-3 text-yellow-300 max-w-lg w-full">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Your last payment failed. Update your billing to restore access.</span>
          </div>
        )}

        <div className="text-center mb-10 max-w-2xl">
          <h1 className="text-4xl font-bold text-white mb-3">{title}</h1>
          <p className="text-lg text-gray-400">{subtitle}</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/40 border border-red-600 rounded-xl px-5 py-3 text-red-300 max-w-lg w-full text-sm text-center">
            {error}
          </div>
        )}

        {/* Plans */}
        {plansLoading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading plans...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
            {sortedPlans.map((plan, idx) => {
              const features: string[] = (() => {
                try { return JSON.parse(plan.features); } catch { return []; }
              })();
              const isPopular = idx === 1;
              const colorClass = PLAN_COLORS[plan.slug] || 'from-gray-500 to-gray-700';
              const icon = PLAN_ICONS[plan.slug] || <Shield className="w-7 h-7" />;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border ${isPopular ? 'border-red-500 bg-gray-900' : 'border-gray-700 bg-gray-900/60'} p-6 flex flex-col`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
                      Most Popular
                    </div>
                  )}

                  {/* Plan header */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${colorClass} mb-4 text-white`}>
                    {icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-4xl font-extrabold text-white">${Math.round(plan.monthlyPrice / 100)}</span>
                    <span className="text-gray-400 text-sm">/month</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={checkoutLoading !== null}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      isPopular
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {checkoutLoading === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirecting to checkout...
                      </>
                    ) : (
                      <>
                        Subscribe to {plan.name}
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-sm text-gray-500">
          Secure payment via Stripe · Cancel anytime · No hidden fees
        </p>
      </div>
    </div>
  );
}

export default SubscriptionGate;
