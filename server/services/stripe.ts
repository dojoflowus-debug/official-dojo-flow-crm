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
 * Get all-time Stripe revenue total (paginate through all succeeded charges).
 */
export async function getStripeAllTimeRevenue(): Promise<number> {
  const stripe = getStripeClient();
  if (!stripe) return 0;
  try {
    let total = 0;
    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    while (hasMore) {
      const params: Stripe.ChargeListParams = { limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;
      const charges = await stripe.charges.list(params);
      for (const c of charges.data) {
        if (c.status === 'succeeded') total += c.amount;
      }
      hasMore = charges.has_more;
      if (charges.data.length > 0) startingAfter = charges.data[charges.data.length - 1].id;
    }
    return total / 100;
  } catch (_e) {
    return 0;
  }
}

/**
 * Get recent Stripe charges (last N days) for the dashboard.
 * Returns normalized transaction objects compatible with the FluidPay transaction shape.
 */
export async function getStripeRecentCharges(days: number = 30): Promise<Array<{
  id: string;
  studentName: string;
  amountDollars: number;
  status: string;
  paidAt: string;
  createdAt: string;
  failureReason: string | null;
  description: string;
  transactionId: string;
  photoUrl: null;
  latitude: null;
  longitude: null;
  phone: string | null;
  source: 'Stripe';
}>> {
  const stripe = getStripeClient();
  if (!stripe) return [];

  try {
    const sinceTs = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
    // Paginate up to 100 charges
    const charges = await stripe.charges.list({
      created: { gte: sinceTs },
      limit: 100,
      expand: ['data.customer'],
    });

    return charges.data.map(charge => {
      const customer = charge.customer as Stripe.Customer | null;
      const name = customer?.name ||
        charge.billing_details?.name ||
        (charge.metadata?.student_name as string | undefined) ||
        'Stripe Member';
      const status = charge.status === 'succeeded' ? 'success' :
                     charge.status === 'pending' ? 'pending' : charge.status;
      return {
        id: charge.id,
        studentName: name,
        amountDollars: charge.amount / 100,
        status,
        paidAt: new Date(charge.created * 1000).toISOString(),
        createdAt: new Date(charge.created * 1000).toISOString(),
        failureReason: charge.failure_message || null,
        description: charge.description || 'Tuition',
        transactionId: charge.id,
        photoUrl: null,
        latitude: null,
        longitude: null,
        phone: null,
        source: 'Stripe' as const,
      };
    });
  } catch (err: any) {
    console.error('[Stripe] Error fetching recent charges:', err.message);
    return [];
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
