import { describe, it, expect } from 'vitest';
import { validateStripeKey } from '../server/services/stripe';

describe('Stripe Key Validation', () => {
  it('should connect to Stripe with MYDOJO_STRIPE_SECRET_KEY', async () => {
    const result = await validateStripeKey();
    expect(result.valid).toBe(true);
    if (!result.valid) {
      console.error('Stripe key validation failed:', result.error);
    }
  }, 15000);
});
