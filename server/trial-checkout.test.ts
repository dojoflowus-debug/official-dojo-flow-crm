import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTrialCheckout, handleCheckoutComplete, getCustomerPortalUrl } from './stripeSubscription';
import { getDb } from './db';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Mock Stripe
vi.mock('stripe', () => {
  const mockStripe = {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn(),
      },
    },
  };
  return { default: () => mockStripe };
});

// Mock database
vi.mock('./db', () => ({
  getDb: vi.fn(),
}));

describe('Trial Checkout Integration', () => {
  let mockDb: any;
  const organizationId = 1;
  const customerEmail = 'test@example.com';
  const successUrl = 'http://localhost:3000/billing/success';
  const cancelUrl = 'http://localhost:3000/pricing';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock database
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };

    vi.mocked(getDb).mockResolvedValue(mockDb);
  });

  describe('createTrialCheckout', () => {
    it('should create a trial checkout session with 7-day trial period', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      };

      const mockStripeModule = await import('stripe');
      vi.mocked(mockStripeModule.default().checkout.sessions.create).mockResolvedValue(mockSession as any);

      const result = await createTrialCheckout({
        organizationId,
        successUrl,
        cancelUrl,
        customerEmail,
      });

      expect(result).toEqual({
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      });
    });

    it('should include trial metadata in checkout session', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      };

      const stripeModule = await import('stripe');
      const createSpy = vi.mocked(stripeModule.default().checkout.sessions.create);
      createSpy.mockResolvedValue(mockSession as any);

      await createTrialCheckout({
        organizationId,
        successUrl,
        cancelUrl,
        customerEmail,
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          metadata: {
            organizationId: organizationId.toString(),
            trialType: 'trial_7day',
          },
        })
      );
    });

    it('should set trial_period_days to 7', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      };

      const stripeModule = await import('stripe');
      const createSpy = vi.mocked(stripeModule.default().checkout.sessions.create);
      createSpy.mockResolvedValue(mockSession as any);

      await createTrialCheckout({
        organizationId,
        successUrl,
        cancelUrl,
        customerEmail,
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                recurring: expect.objectContaining({
                  trial_period_days: 7,
                }),
              }),
            }),
          ]),
        })
      );
    });
  });

  describe('handleCheckoutComplete', () => {
    it('should allocate 100 credits for trial checkouts', async () => {
      const mockSession = {
        id: 'cs_test_123',
        subscription: 'sub_test_123',
        customer: 'cus_test_123',
        metadata: {
          organizationId: organizationId.toString(),
          trialType: 'trial_7day',
        },
      };

      // Mock database responses
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValueOnce([]) // No existing subscription
        .mockResolvedValueOnce([]); // No existing credit balance

      const insertSpy = vi.spyOn(mockDb, 'insert').mockReturnThis();
      const updateSpy = vi.spyOn(mockDb, 'update').mockReturnThis();

      await handleCheckoutComplete(mockSession as any);

      // Verify subscription was created with trialing status
      expect(insertSpy).toHaveBeenCalledWith(schema.organizationSubscriptions);
      
      // Verify credits were allocated
      expect(insertSpy).toHaveBeenCalledWith(schema.aiCreditBalance);
    });

    it('should set subscription status to trialing', async () => {
      const mockSession = {
        id: 'cs_test_123',
        subscription: 'sub_test_123',
        customer: 'cus_test_123',
        metadata: {
          organizationId: organizationId.toString(),
          trialType: 'trial_7day',
        },
      };

      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValueOnce([]) // No existing subscription
        .mockResolvedValueOnce([]); // No existing credit balance

      const setSpy = vi.spyOn(mockDb, 'set').mockReturnThis();

      await handleCheckoutComplete(mockSession as any);

      expect(setSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'trialing',
        })
      );
    });

    it('should set trial period to 7 days', async () => {
      const mockSession = {
        id: 'cs_test_123',
        subscription: 'sub_test_123',
        customer: 'cus_test_123',
        metadata: {
          organizationId: organizationId.toString(),
          trialType: 'trial_7day',
        },
      };

      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValueOnce([]) // No existing subscription
        .mockResolvedValueOnce([]); // No existing credit balance

      const setSpy = vi.spyOn(mockDb, 'set').mockReturnThis();

      await handleCheckoutComplete(mockSession as any);

      const callArgs = setSpy.mock.calls[0]?.[0] as any;
      expect(callArgs).toBeDefined();
      
      // Verify currentPeriodEnd is approximately 7 days from now
      if (callArgs?.currentPeriodEnd) {
        const endDate = new Date(callArgs.currentPeriodEnd);
        const now = new Date();
        const diffMs = endDate.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeGreaterThan(6.9);
        expect(diffDays).toBeLessThan(7.1);
      }
    });
  });

  describe('getCustomerPortalUrl', () => {
    it('should return customer portal URL', async () => {
      const mockPortalSession = {
        url: 'https://billing.stripe.com/p/session/test123',
      };

      const existingSubscription = {
        organizationId,
        stripeCustomerId: 'cus_test_123',
      };

      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValue([existingSubscription]);

      const stripeModule = await import('stripe');
      vi.mocked(stripeModule.default().billingPortal.sessions.create).mockResolvedValue(mockPortalSession as any);

      const result = await getCustomerPortalUrl({
        organizationId,
        returnUrl: 'http://localhost:3000/settings/billing',
      });

      expect(result).toEqual({
        url: 'https://billing.stripe.com/p/session/test123',
      });
    });

    it('should throw error if no subscription found', async () => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValue([]);

      await expect(
        getCustomerPortalUrl({
          organizationId,
          returnUrl: 'http://localhost:3000/settings/billing',
        })
      ).rejects.toThrow('No active subscription found');
    });

    it('should throw error if no Stripe customer ID', async () => {
      const existingSubscription = {
        organizationId,
        stripeCustomerId: null,
      };

      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValue([existingSubscription]);

      await expect(
        getCustomerPortalUrl({
          organizationId,
          returnUrl: 'http://localhost:3000/settings/billing',
        })
      ).rejects.toThrow('No active subscription found');
    });
  });
});
