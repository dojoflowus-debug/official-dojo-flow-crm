import { useEffect, useState } from 'react';
import { trpc } from '../lib/trpc';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'no_subscription';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  creditBalance: number;
  isExempt: boolean;
  // Manus platform credits (real)
  manusCredits?: {
    freeCredits: number;
    monthlyCredits: number;
    monthlyCreditsUsed: number;
    monthlyCreditsTotal: number;
    dailyRefreshCredits: number;
    dailyRefreshLimit: number;
    totalAvailable: number;
    addCreditsUrl: string;
    available: boolean;
  };
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

  // Fetch credit balance (internal DojoFlow credits)
  const { data: creditData } = trpc.credits.getBalance.useQuery(
    undefined,
    { enabled: !!organizationId }
  );

  // Fetch real Manus platform credits
  const { data: manusCreditsData } = trpc.credits.getManusBalance.useQuery(
    undefined,
    { enabled: !!organizationId, refetchInterval: 60000 }
  );

  useEffect(() => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    if (subscription || creditData || manusCreditsData) {
      const status: SubscriptionStatus = subscription?.billingStatus || 'no_subscription';
      
      setSubscriptionInfo({
        status: status as SubscriptionStatus,
        trialEndsAt: subscription?.trialEndsAt,
        currentPeriodEnd: subscription?.currentPeriodEnd,
        creditBalance: manusCreditsData?.totalAvailable ?? creditData?.creditsRemaining ?? 0,
        isExempt: subscription?.billingExempt || false,
        manusCredits: manusCreditsData ?? undefined,
      });
      setIsLoading(false);
    }
  }, [subscription, creditData, manusCreditsData, organizationId]);

  /**
   * Check if user can access a paid feature
   * Returns true if user has active subscription, is in trial, or has credits
   */
  const canAccessFeature = (): boolean => {
    if (!subscriptionInfo) return false;
    if (subscriptionInfo.isExempt) return true;
    // Allow access if user has credits
    if (subscriptionInfo.creditBalance > 0) return true;
    return subscriptionInfo.status === 'trialing' || subscriptionInfo.status === 'active';
  };

  /**
   * Check if user needs to see paywall
   * Don't show paywall if user has credits available
   */
  const shouldShowPaywall = (): boolean => {
    if (!subscriptionInfo) return true;
    if (subscriptionInfo.isExempt) return false;
    // Don't show paywall if user has credits
    if (subscriptionInfo.creditBalance > 0) return false;
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
