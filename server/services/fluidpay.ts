/**
 * FluidPay API Service
 * Handles all communication with the FluidPay payment gateway.
 * Authentication: Authorization header with the API key (api_***).
 * Production: https://app.fluidpay.com
 * Sandbox:    https://sandbox.fluidpay.com
 */

const FLUIDPAY_PROD_URL = 'https://app.fluidpay.com';
const FLUIDPAY_SANDBOX_URL = 'https://sandbox.fluidpay.com';

export interface FluidPayTransaction {
  id: string;
  type: string;
  amount: number;
  base_amount: number;
  amount_authorized: number;
  amount_captured: number;
  amount_settled: number;
  amount_refunded: number;
  status: string;
  currency: string;
  description: string;
  order_id: string;
  customer_id: string;
  created_at: string;
  settled_at: string;
  payment_method: string;
  payment_type: string;
  processor_name: string;
  merchant_name: string;
  billing?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  card?: {
    masked_card: string;
    card_type: string;
  };
}

export interface FluidPaySearchResponse {
  status: string;
  msg: string;
  total_count: number;
  data: FluidPayTransaction[] | null;
}

/**
 * Validate a FluidPay API key by making a lightweight API call.
 * Auto-detects whether it's a production or sandbox key.
 */
export async function validateFluidPayKey(apiKey: string): Promise<{ valid: boolean; error?: string; baseUrl?: string }> {
  // Try production first, then sandbox
  const urls = [FLUIDPAY_PROD_URL, FLUIDPAY_SANDBOX_URL];
  for (let i = 0; i < urls.length; i++) {
    const baseUrl = urls[i];
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/api/transaction/search`, {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 1 }),
      });
    } catch {
      continue; // Network error — try next URL
    }
    if (response.ok) {
      return { valid: true, baseUrl };
    }
    if (response.status !== 401 && response.status !== 403) {
      const text = await response.text();
      return { valid: false, error: `FluidPay returned status ${response.status}: ${text.slice(0, 200)}` };
    }
    // 401/403 means wrong environment — try the other one
  }
  return { valid: false, error: 'Invalid API key — authentication failed on both production and sandbox.' };
}

/**
 * Search transactions within a date range
 */
export async function searchTransactions(
  apiKey: string,
  startDate: string,
  endDate: string,
  limit = 100,
  baseUrl = FLUIDPAY_PROD_URL
): Promise<FluidPaySearchResponse> {
  const response = await fetch(`${baseUrl}/api/transaction/search`, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      limit,
      created_at: {
        start_date: startDate,
        end_date: endDate,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`FluidPay API error ${response.status}: ${text.slice(0, 300)}`);
  }

  return response.json();
}

/**
 * Get monthly revenue totals from FluidPay
 */
export async function getMonthlyRevenue(
  apiKey: string,
  year?: number,
  month?: number,
  baseUrl = FLUIDPAY_PROD_URL
): Promise<{
  totalCents: number;
  totalDollars: number;
  transactionCount: number;
  settledCents: number;
  settledDollars: number;
  pendingCents: number;
  pendingDollars: number;
  refundCents: number;
  refundDollars: number;
  month: string;
  year: number;
}> {
  const now = new Date();
  const targetYear = year ?? now.getUTCFullYear();
  const targetMonth = month ?? (now.getUTCMonth() + 1);

  const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01T00:00:00Z`;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59Z`;

  const result = await searchTransactions(apiKey, startDate, endDate, 500, baseUrl);

  const transactions = result.data || [];
  const sales = transactions.filter(t => t.type === 'sale' && t.status !== 'voided' && t.status !== 'declined');
  const refunds = transactions.filter(t => t.type === 'refund');

  const totalCents = sales.reduce((sum, t) => sum + (t.amount || 0), 0);
  const settledCents = sales.filter(t => t.status === 'settled' || t.status === 'partially_refunded').reduce((sum, t) => sum + (t.amount_settled || t.amount || 0), 0);
  const pendingCents = sales.filter(t => t.status === 'pending_settlement').reduce((sum, t) => sum + (t.amount || 0), 0);
  const refundCents = refunds.reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return {
    totalCents,
    totalDollars: totalCents / 100,
    transactionCount: transactions.length,
    settledCents,
    settledDollars: settledCents / 100,
    pendingCents,
    pendingDollars: pendingCents / 100,
    refundCents,
    refundDollars: refundCents / 100,
    month: monthNames[targetMonth - 1],
    year: targetYear,
  };
}

/**
 * Get recent transactions (last N transactions, up to 30 days back)
 */
export async function getRecentTransactions(
  apiKey: string,
  limit = 10,
  baseUrl = FLUIDPAY_PROD_URL
): Promise<FluidPayTransaction[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startDate = thirtyDaysAgo.toISOString().replace('.000Z', 'Z');
  const endDate = now.toISOString().replace('.000Z', 'Z');

  const result = await searchTransactions(apiKey, startDate, endDate, limit, baseUrl);
  return result.data || [];
}
