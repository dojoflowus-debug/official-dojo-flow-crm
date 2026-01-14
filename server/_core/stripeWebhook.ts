/**
 * Stripe Webhook Handler
 * 
 * Handles incoming webhook events from Stripe for subscription lifecycle
 */

import { Request, Response } from 'express';
import Stripe from 'stripe';
import {
  handleCheckoutComplete,
  handleSubscriptionRenewed,
  handleSubscriptionCanceled,
  handlePaymentFailed,
  stripe
} from '../stripeSubscription';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('[Stripe Webhook] Missing stripe-signature header');
    return res.status(400).send('Missing signature');
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('[Stripe Webhook] Received event:', event.type);

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          await handleCheckoutComplete(session);
          console.log('[Stripe Webhook] Checkout completed for session:', session.id);
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          // Fetch full subscription object
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionRenewed(subscription);
          console.log('[Stripe Webhook] Subscription renewed:', subscription.id);
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(failedInvoice);
        console.log('[Stripe Webhook] Payment failed for invoice:', failedInvoice.id);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(deletedSubscription);
        console.log('[Stripe Webhook] Subscription canceled:', deletedSubscription.id);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        // Handle subscription updates (plan changes, etc.)
        console.log('[Stripe Webhook] Subscription updated:', updatedSubscription.id);
        break;

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    // Return success response
    res.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error processing event:', error);
    res.status(500).send(`Webhook processing error: ${error.message}`);
  }
}
