/**
 * Validates that the DojoFlow Stripe secret key is configured and valid
 * by making a lightweight API call (retrieve account balance).
 */
import { describe, it, expect } from 'vitest';
import Stripe from 'stripe';

describe('DojoFlow Stripe Key Validation', () => {
  it('should have DOJO_STRIPE_SECRET_KEY configured', () => {
    const key = process.env.DOJO_STRIPE_SECRET_KEY;
    expect(key, 'DOJO_STRIPE_SECRET_KEY must be set').toBeTruthy();
    expect(key).toMatch(/^sk_live_|^sk_test_/);
  });

  it('should successfully connect to Stripe with DOJO_STRIPE_SECRET_KEY', async () => {
    const key = process.env.DOJO_STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('DOJO_STRIPE_SECRET_KEY is not set');
    }
    const stripe = new Stripe(key, { apiVersion: '2024-11-20.acacia' });
    // Lightweight call — just retrieves account balance metadata
    const balance = await stripe.balance.retrieve();
    expect(balance.object).toBe('balance');
  });
});
