/**
 * FluidPay API Service
 * Handles all communication with the FluidPay payment gateway.
 * Authentication: Authorization header with the API key (api_***).
 * Production: https://app.fluidpay.com
 * Sandbox:    https://sandbox.fluidpay.com
 *
 * NOTE: Uses axios instead of fetch — Node.js fetch is blocked in this environment.
 */

import axios from 'axios';

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
  const urls = [FLUIDPAY_PROD_URL, FLUIDPAY_SANDBOX_URL];
  for (const baseUrl of urls) {
    try {
      const response = await axios.post(
        `${baseUrl}/api/transaction/search`,
        { limit: 1 },
        { headers: { Authorization: apiKey, 'Content-Type': 'application/json' } }
      );
      if (response.status >= 200 && response.status < 300) {
        return { valid: true, baseUrl };
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        continue; // Wrong environment — try the other one
      }
      if (status) {
        return { valid: false, error: `FluidPay returned status ${status}` };
      }
      // Network error — try next URL
    }
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
  const response = await axios.post(
    `${baseUrl}/api/transaction/search`,
    {
      limit,
      date_range: {
        start_date: startDate,
        end_date: endDate,
      },
    },
    {
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
    }
  );
  return response.data as FluidPaySearchResponse;
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
  const startDate = thirtyDaysAgo.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const endDate = now.toISOString().replace(/\.\d{3}Z$/, 'Z');

  const result = await searchTransactions(apiKey, startDate, endDate, limit, baseUrl);
  return result.data || [];
}

/**
 * Get revenue history for the last N months (for chart display)
 */
export async function getRevenueHistory(
  apiKey: string,
  months = 6,
  baseUrl = FLUIDPAY_PROD_URL
): Promise<Array<{
  month: string;
  monthShort: string;
  year: number;
  monthNum: number;
  totalDollars: number;
  settledDollars: number;
  refundDollars: number;
  transactionCount: number;
}>> {
  const now = new Date();
  const results = [];
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthShortNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const targetYear = d.getUTCFullYear();
    const targetMonth = d.getUTCMonth() + 1;
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01T00:00:00Z`;
    const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59Z`;

    try {
      const result = await searchTransactions(apiKey, startDate, endDate, 500, baseUrl);
      const transactions = result.data || [];
      const sales = transactions.filter(t => t.type === 'sale' && t.status !== 'voided' && t.status !== 'declined');
      const refunds = transactions.filter(t => t.type === 'refund');
      const totalCents = sales.reduce((sum, t) => sum + (t.amount || 0), 0);
      const settledCents = sales.filter(t => t.status === 'settled' || t.status === 'partially_refunded').reduce((sum, t) => sum + (t.amount_settled || t.amount || 0), 0);
      const refundCents = refunds.reduce((sum, t) => sum + (t.amount || 0), 0);
      results.push({
        month: monthNames[targetMonth - 1],
        monthShort: monthShortNames[targetMonth - 1],
        year: targetYear,
        monthNum: targetMonth,
        totalDollars: totalCents / 100,
        settledDollars: settledCents / 100,
        refundDollars: refundCents / 100,
        transactionCount: transactions.length,
      });
    } catch (_e) {
      results.push({
        month: monthNames[targetMonth - 1],
        monthShort: monthShortNames[targetMonth - 1],
        year: targetYear,
        monthNum: targetMonth,
        totalDollars: 0,
        settledDollars: 0,
        refundDollars: 0,
        transactionCount: 0,
      });
    }
  }
  return results;
}

/**
 * Get all transactions for a date range (for full transaction history table)
 */
export async function getAllTransactions(
  apiKey: string,
  startDate: string,
  endDate: string,
  limit = 100,
  baseUrl = FLUIDPAY_PROD_URL
): Promise<{ transactions: FluidPayTransaction[]; totalCount: number }> {
  const result = await searchTransactions(apiKey, startDate, endDate, limit, baseUrl);
  return {
    transactions: result.data || [],
    totalCount: result.total_count || 0,
  };
}

// ─── Customer Vault & Charging ────────────────────────────────────────────────

export interface FluidPayCustomer {
  id: string;
  description: string;
}

export interface FluidPayChargeResult {
  success: boolean;
  transactionId?: string;
  status?: string;
  amount?: number;
  error?: string;
  rawResponse?: any;
}

/**
 * Create a FluidPay customer vault entry for a student.
 */
export async function createFluidPayCustomer(
  apiKey: string,
  studentData: { firstName: string; lastName: string; email?: string; phone?: string },
  baseUrl = FLUIDPAY_PROD_URL
): Promise<{ customerId: string; error?: string }> {
  try {
    const response = await axios.post(
      `${baseUrl}/api/customer`,
      {
        description: `${studentData.firstName} ${studentData.lastName}`,
        payment_method: {},
        billing_address: {
          first_name: studentData.firstName,
          last_name: studentData.lastName,
          email: studentData.email || '',
          phone: studentData.phone || '',
        },
      },
      { headers: { Authorization: apiKey, 'Content-Type': 'application/json' } }
    );
    const data = response.data as any;
    if (data.status === 'success' && data.data?.id) {
      return { customerId: data.data.id };
    }
    return { customerId: '', error: data.msg || 'Failed to create customer' };
  } catch (err: any) {
    return { customerId: '', error: err.message };
  }
}

/**
 * Add a card to a FluidPay customer vault using a tokenized card number.
 */
export async function addCardToFluidPayCustomer(
  apiKey: string,
  customerId: string,
  cardToken: string,
  baseUrl = FLUIDPAY_PROD_URL
): Promise<{ paymentMethodId: string; last4?: string; cardBrand?: string; error?: string }> {
  try {
    const response = await axios.post(
      `${baseUrl}/api/customer/${customerId}/payment-method/card`,
      { card_number: cardToken },
      { headers: { Authorization: apiKey, 'Content-Type': 'application/json' } }
    );
    const data = response.data as any;
    if (data.status === 'success' && data.data?.id) {
      return {
        paymentMethodId: data.data.id,
        last4: data.data.last_four,
        cardBrand: data.data.card_type,
      };
    }
    return { paymentMethodId: '', error: data.msg || 'Failed to add card' };
  } catch (err: any) {
    return { paymentMethodId: '', error: err.message };
  }
}

/**
 * Charge a stored card in the FluidPay customer vault.
 * amountCents: amount in cents (e.g., 9900 = $99.00)
 */
export async function chargeFluidPayCustomer(
  apiKey: string,
  customerId: string,
  paymentMethodId: string,
  amountCents: number,
  description: string,
  baseUrl = FLUIDPAY_PROD_URL
): Promise<FluidPayChargeResult> {
  try {
    const response = await axios.post(
      `${baseUrl}/api/transaction`,
      {
        type: 'sale',
        amount: amountCents,
        currency: 'usd',
        description,
        payment_method: {
          customer: {
            id: customerId,
            payment_method_type: 'card',
            payment_method_id: paymentMethodId,
          },
        },
        email_receipt: false,
      },
      { headers: { Authorization: apiKey, 'Content-Type': 'application/json' } }
    );
    const data = response.data as any;
    if (data.status === 'success' && data.data?.id) {
      return {
        success: true,
        transactionId: data.data.id,
        status: data.data.status,
        amount: data.data.amount,
        rawResponse: data.data,
      };
    }
    return { success: false, error: data.msg || data.data?.response || 'Charge failed', rawResponse: data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get a FluidPay customer's stored payment methods.
 */
export async function getFluidPayCustomerPaymentMethods(
  apiKey: string,
  customerId: string,
  baseUrl = FLUIDPAY_PROD_URL
): Promise<{ methods: any[]; error?: string }> {
  try {
    const response = await axios.get(
      `${baseUrl}/api/customer/${customerId}`,
      { headers: { Authorization: apiKey } }
    );
    const data = response.data as any;
    if (data.status === 'success') {
      const methods: any[] = [];
      if (data.data?.payment_method?.card) {
        methods.push({ type: 'card', ...data.data.payment_method.card });
      }
      return { methods };
    }
    return { methods: [], error: data.msg };
  } catch (err: any) {
    return { methods: [], error: err.message };
  }
}

/**
 * Generate a FluidPay tokenizer key for hosted payment fields (secure card collection).
 */
export async function getFluidPayTokenizerKey(
  apiKey: string,
  baseUrl = FLUIDPAY_PROD_URL
): Promise<{ tokenizerKey?: string; error?: string }> {
  try {
    const response = await axios.post(
      `${baseUrl}/api/transaction/tokenize`,
      { type: 'tokenize' },
      { headers: { Authorization: apiKey, 'Content-Type': 'application/json' } }
    );
    const data = response.data as any;
    if (data.status === 'success' && data.data?.token_id) {
      return { tokenizerKey: data.data.token_id };
    }
    return { error: data.msg || 'Failed to get tokenizer key' };
  } catch (err: any) {
    return { error: err.message };
  }
}
