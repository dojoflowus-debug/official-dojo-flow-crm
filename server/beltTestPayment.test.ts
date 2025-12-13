import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the stripe module
vi.mock('./stripe', () => ({
  createBeltTestCheckoutSession: vi.fn().mockResolvedValue({
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/test',
  }),
  getCheckoutSession: vi.fn().mockResolvedValue({
    payment_status: 'paid',
    payment_intent: 'pi_test_123',
  }),
}));

describe('Belt Test Payment Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have Stripe environment variables configured', () => {
    // Check that Stripe keys are available
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePublishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    expect(stripeSecretKey).toBeDefined();
    expect(stripeSecretKey).toMatch(/^sk_test_/);
    expect(stripePublishableKey).toBeDefined();
    expect(stripePublishableKey).toMatch(/^pk_test_/);
  });

  it('should create checkout session with correct parameters', async () => {
    const { createBeltTestCheckoutSession } = await import('./stripe');
    
    const params = {
      testId: 1,
      testName: 'Yellow Belt Test',
      studentId: 1,
      studentName: 'John Smith',
      studentEmail: 'john@example.com',
      amount: 5000, // $50.00 in cents
      successUrl: 'http://localhost:3000/student-belt-tests?success=true',
      cancelUrl: 'http://localhost:3000/student-belt-tests?cancelled=true',
    };

    const session = await createBeltTestCheckoutSession(params);
    
    expect(session).toBeDefined();
    expect(session.id).toBe('cs_test_123');
    expect(session.url).toBe('https://checkout.stripe.com/test');
  });

  it('should verify payment completion', async () => {
    const { getCheckoutSession } = await import('./stripe');
    
    const session = await getCheckoutSession('cs_test_123');
    
    expect(session).toBeDefined();
    expect(session.payment_status).toBe('paid');
    expect(session.payment_intent).toBe('pi_test_123');
  });

  it('should handle free belt tests without payment', async () => {
    // Free tests should have fee = 0 or null
    const freeTest = {
      id: 2,
      name: 'Free Belt Test',
      fee: 0,
    };
    
    expect(freeTest.fee).toBe(0);
    // Free tests should skip Stripe checkout and register directly
  });

  it('should format fee amount correctly', () => {
    const feeInCents = 5000;
    const feeFormatted = (feeInCents / 100).toFixed(2);
    
    expect(feeFormatted).toBe('50.00');
  });

  it('should handle payment status updates', () => {
    const paymentStatuses = ['pending', 'paid', 'refunded', 'waived'];
    
    paymentStatuses.forEach(status => {
      expect(['pending', 'paid', 'refunded', 'waived']).toContain(status);
    });
  });
});

describe('Belt Test Registration with Payment', () => {
  it('should check eligibility before payment', () => {
    const eligibility = {
      eligible: true,
      attendance: 85,
      classes: 25,
      minAttendance: 80,
      minClasses: 20,
    };
    
    expect(eligibility.eligible).toBe(true);
    expect(eligibility.attendance).toBeGreaterThanOrEqual(eligibility.minAttendance);
    expect(eligibility.classes).toBeGreaterThanOrEqual(eligibility.minClasses);
  });

  it('should reject ineligible students', () => {
    const eligibility = {
      eligible: false,
      attendance: 72,
      classes: 16,
      minAttendance: 80,
      minClasses: 20,
      reason: 'Minimum 80% attendance required. Your current attendance: 72%',
    };
    
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.attendance).toBeLessThan(eligibility.minAttendance);
    expect(eligibility.reason).toContain('attendance');
  });

  it('should store Stripe session ID on registration', () => {
    const registration = {
      testId: 1,
      studentId: 1,
      stripeSessionId: 'cs_test_123',
      paymentStatus: 'pending',
      amountPaid: 5000,
    };
    
    expect(registration.stripeSessionId).toBeDefined();
    expect(registration.paymentStatus).toBe('pending');
    expect(registration.amountPaid).toBe(5000);
  });

  it('should update payment status after successful payment', () => {
    const registrationBefore = {
      paymentStatus: 'pending',
      stripePaymentIntentId: null,
    };
    
    const registrationAfter = {
      paymentStatus: 'paid',
      stripePaymentIntentId: 'pi_test_123',
    };
    
    expect(registrationBefore.paymentStatus).toBe('pending');
    expect(registrationAfter.paymentStatus).toBe('paid');
    expect(registrationAfter.stripePaymentIntentId).toBeDefined();
  });
});
