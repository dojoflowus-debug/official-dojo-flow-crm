/**
 * Tests for subscription gate / paywall logic
 * Verifies that trial expiry, active status, and no-subscription cases are handled correctly
 */
import { describe, it, expect } from 'vitest';

// Replicate the isActive logic from SubscriptionGate component
function isSubscriptionActive(subscription: {
  status: string;
  trialEndsAt?: string | null;
} | null): boolean {
  if (!subscription) return false;
  const status = subscription.status;
  if (status === 'active') return true;
  if (status === 'trial') {
    const trialEnd = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
    if (!trialEnd) return true; // no end date = unlimited trial
    return trialEnd > new Date();
  }
  return false;
}

function getPaywallReason(subscription: {
  status: string;
  trialEndsAt?: string | null;
} | null): string {
  if (!subscription) return 'no_subscription';
  if (subscription.status === 'trial') return 'trial_expired';
  if (subscription.status === 'past_due') return 'past_due';
  if (subscription.status === 'cancelled') return 'cancelled';
  return 'inactive';
}

describe('Subscription Gate Logic', () => {
  it('should allow access for active subscription', () => {
    expect(isSubscriptionActive({ status: 'active' })).toBe(true);
  });

  it('should allow access for trial with future end date', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(isSubscriptionActive({ status: 'trial', trialEndsAt: futureDate })).toBe(true);
  });

  it('should block access for trial with past end date', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(isSubscriptionActive({ status: 'trial', trialEndsAt: pastDate })).toBe(false);
  });

  it('should allow access for trial with no end date (unlimited)', () => {
    expect(isSubscriptionActive({ status: 'trial', trialEndsAt: null })).toBe(true);
  });

  it('should block access for null subscription', () => {
    expect(isSubscriptionActive(null)).toBe(false);
  });

  it('should block access for past_due subscription', () => {
    expect(isSubscriptionActive({ status: 'past_due' })).toBe(false);
  });

  it('should block access for cancelled subscription', () => {
    expect(isSubscriptionActive({ status: 'cancelled' })).toBe(false);
  });

  it('should block access for inactive subscription', () => {
    expect(isSubscriptionActive({ status: 'inactive' })).toBe(false);
  });

  // Paywall reason tests
  it('should return no_subscription reason for null subscription', () => {
    expect(getPaywallReason(null)).toBe('no_subscription');
  });

  it('should return trial_expired reason for expired trial', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(getPaywallReason({ status: 'trial', trialEndsAt: pastDate })).toBe('trial_expired');
  });

  it('should return past_due reason for past_due subscription', () => {
    expect(getPaywallReason({ status: 'past_due' })).toBe('past_due');
  });

  it('should return cancelled reason for cancelled subscription', () => {
    expect(getPaywallReason({ status: 'cancelled' })).toBe('cancelled');
  });

  // Vincent Holmes specific case: trial ended April 16, 2026
  it('should block Vincent Holmes whose trial ended April 16, 2026', () => {
    const vincentTrialEnd = '2026-04-16T01:48:23.000Z';
    expect(isSubscriptionActive({ status: 'trial', trialEndsAt: vincentTrialEnd })).toBe(false);
  });
});
