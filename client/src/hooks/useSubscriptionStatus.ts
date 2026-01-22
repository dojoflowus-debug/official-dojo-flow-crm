import { useEffect, useState } from 'react';
import { trpc } from '../lib/trpc';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'no_subscription';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  creditBalance: number;
  isExempt: boolean;
}

/**
 * Hook to check user's subscription status
 * Returns subscription info and whether user can access paid features
 */
export const useSubscriptionStatus = (organizationId?: number) => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription status
  const { data: subscription } = trpc.subscription.getCurrentSubscription.useQuery(
    { organizationId: organizationId || 0 },
    { enabled: !!organizationId }
  );

  // Fetch credit balance
  const { data: creditData } = trpc.credits.getBalance.useQuery(
    { organizationId: organizationId || 0 },
    { enabled: !!organizationId }
  );

  useEffect(() => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    if (subscription && creditData) {
      const status: SubscriptionStatus = subscription?.billingStatus || 'no_subscription';
      
      setSubscriptionInfo({
        status: status as SubscriptionStatus,
        trialEndsAt: subscription?.trialEndsAt,
        currentPeriodEnd: subscription?.currentPeriodEnd,
        creditBalance: creditData.balance || 0,
        isExempt: subscription?.billingExempt || false,
      });
      setIsLoading(false);
    }
  }, [subscription, creditData, organizationId]);

  /**
   * Check if user can access a paid feature
   * Returns true if user has active subscription or is in trial
   */
  const canAccessFeature = (): boolean => {
    if (!subscriptionInfo) return false;
    if (subscriptionInfo.isExempt) return true;
    return subscriptionInfo.status === 'trialing' || subscriptionInfo.status === 'active';
  };

  /**
   * Check if user needs to see paywall
   */
  const shouldShowPaywall = (): boolean => {
    if (!subscriptionInfo) return true;
    if (subscriptionInfo.isExempt) return false;
    return !canAccessFeature();
  };

  /**
   * Get days remaining in trial
   */
  const getTrialDaysRemaining = (): number | null => {
    if (!subscriptionInfo?.trialEndsAt) return null;
    
    const now = new Date();
    const trialEnd = new Date(subscriptionInfo.trialEndsAt);
    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysRemaining > 0 ? daysRemaining : 0;
  };

  return {
    subscriptionInfo,
    isLoading,
    error,
    canAccessFeature,
    shouldShowPaywall,
    getTrialDaysRemaining,
  };
};

export default useSubscriptionStatus;
