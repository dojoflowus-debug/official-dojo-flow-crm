/**
 * Stripe Service
 * Fetches subscription, customer, and payment data from the MyDojo Stripe account.
 * Uses MYDOJO_STRIPE_SECRET_KEY env variable.
 */

import Stripe from 'stripe';

function getStripeClient(): Stripe | null {
  const key = process.env.MYDOJO_STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

export interface StripeCustomerBilling {
  customerId: string;
  email: string | null;
  name: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  amountCents: number | null;
  interval: string | null;
  nextBillingDate: string | null;
  lastPaymentDate: string | null;
  lastPaymentAmountCents: number | null;
  lastPaymentStatus: string | null;
  paymentSource: 'Stripe';
}

/**
 * Get all active Stripe customers with their subscription data.
 * Returns a map of email -> billing info for matching against CRM students.
 */
export async function getStripeCustomerBillingMap(): Promise<Map<string, StripeCustomerBilling>> {
  const stripe = getStripeClient();
  if (!stripe) return new Map();

  const map = new Map<string, StripeCustomerBilling>();

  try {
    // Fetch all customers (paginate up to 1000)
    const customers = await stripe.customers.list({ limit: 100, expand: ['data.subscriptions'] });

    for (const customer of customers.data) {
      const email = customer.email?.toLowerCase() || null;
      const name = typeof customer.name === 'string' ? customer.name : null;

      // Get active subscription
      const subs = (customer as any).subscriptions?.data || [];
      const activeSub = subs.find((s: any) => s.status === 'active' || s.status === 'trialing') || subs[0] || null;

      let amountCents: number | null = null;
      let interval: string | null = null;
      let nextBillingDate: string | null = null;
      let subscriptionStatus: string | null = null;
      let subscriptionId: string | null = null;

      if (activeSub) {
        subscriptionId = activeSub.id;
        subscriptionStatus = activeSub.status;
        const item = activeSub.items?.data?.[0];
        if (item?.price) {
          amountCents = item.price.unit_amount;
          interval = item.price.recurring?.interval || null;
        }
        if (activeSub.current_period_end) {
          nextBillingDate = new Date(activeSub.current_period_end * 1000).toISOString();
        }
      }

      // Get most recent payment intent / charge
      let lastPaymentDate: string | null = null;
      let lastPaymentAmountCents: number | null = null;
      let lastPaymentStatus: string | null = null;

      try {
        const charges = await stripe.charges.list({ customer: customer.id, limit: 1 });
        if (charges.data.length > 0) {
          const charge = charges.data[0];
          lastPaymentDate = new Date(charge.created * 1000).toISOString();
          lastPaymentAmountCents = charge.amount;
          lastPaymentStatus = charge.status;
        }
      } catch (_e) { /* skip */ }

      const billing: StripeCustomerBilling = {
        customerId: customer.id,
        email,
        name,
        subscriptionId,
        subscriptionStatus,
        amountCents,
        interval,
        nextBillingDate,
        lastPaymentDate,
        lastPaymentAmountCents,
        lastPaymentStatus,
        paymentSource: 'Stripe',
      };

      if (email) map.set(email, billing);
      // Also index by name (lowercase) for fallback matching
      if (name) map.set(`name:${name.toLowerCase()}`, billing);
    }
  } catch (err: any) {
    console.error('[Stripe] Error fetching customer billing map:', err.message);
  }

  return map;
}

/**
 * Get Stripe revenue totals for a given month.
 */
export async function getStripeMonthlyRevenue(year: number, month: number): Promise<{
  totalCents: number;
  totalDollars: number;
  transactionCount: number;
}> {
  const stripe = getStripeClient();
  if (!stripe) return { totalCents: 0, totalDollars: 0, transactionCount: 0 };

  try {
    const startTs = Math.floor(new Date(Date.UTC(year, month - 1, 1)).getTime() / 1000);
    const endTs = Math.floor(new Date(Date.UTC(year, month, 0, 23, 59, 59)).getTime() / 1000);

    const charges = await stripe.charges.list({
      created: { gte: startTs, lte: endTs },
      limit: 100,
    });

    const succeeded = charges.data.filter(c => c.status === 'succeeded');
    const totalCents = succeeded.reduce((s, c) => s + c.amount, 0);

    return {
      totalCents,
      totalDollars: totalCents / 100,
      transactionCount: succeeded.length,
    };
  } catch (_e) {
    return { totalCents: 0, totalDollars: 0, transactionCount: 0 };
  }
}

/**
 * Validate that the Stripe key works by making a lightweight API call.
 */
export async function validateStripeKey(): Promise<{ valid: boolean; error?: string }> {
  const stripe = getStripeClient();
  if (!stripe) return { valid: false, error: 'MYDOJO_STRIPE_SECRET_KEY not set' };
  try {
    await stripe.customers.list({ limit: 1 });
    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err.message };
  }
}
