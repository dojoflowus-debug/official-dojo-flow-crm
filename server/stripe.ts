import Stripe from 'stripe';

// Prefer DojoFlow's own Stripe key; fall back to platform-provided key
const stripeSecretKey = process.env.DOJO_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('No Stripe secret key found in environment variables (DOJO_STRIPE_SECRET_KEY or STRIPE_SECRET_KEY)');
}

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2024-11-20.acacia',
}) : null;

/**
 * Create a Stripe Checkout Session for belt test registration
 */
export async function createBeltTestCheckoutSession(params: {
  testId: number;
  testName: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  amount: number; // in cents
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Belt Test Registration: ${params.testName}`,
            description: `Registration fee for ${params.studentName}`,
          },
          unit_amount: params.amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.studentEmail,
    metadata: {
      type: 'belt_test_registration',
      testId: params.testId.toString(),
      studentId: params.studentId.toString(),
      studentName: params.studentName,
    },
    payment_intent_data: {
      metadata: {
        type: 'belt_test_registration',
        testId: params.testId.toString(),
        studentId: params.studentId.toString(),
      },
    },
  });

  return session;
}

/**
 * Verify a Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Retrieve a checkout session by ID
 */
export async function getCheckoutSession(sessionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  return await stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Create a refund for a payment
 */
export async function createRefund(paymentIntentId: string, amount?: number) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount, // If not provided, refunds the full amount
  });
}
