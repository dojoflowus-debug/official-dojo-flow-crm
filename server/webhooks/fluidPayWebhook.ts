import { Request, Response } from 'express';
import { getDb } from '../db';
import { organizationCredits, paymentProviderConnections } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Fluid Pay Webhook Handler
 * Processes payment events from Fluid Pay (charges, subscriptions, refunds)
 */

export async function handleFluidPayWebhook(req: Request, res: Response) {
  try {
    const { event, data, signature } = req.body;

    if (!event || !data || !signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify webhook signature
    // In production, retrieve the webhook secret from the payment provider configuration
    const isValid = verifyWebhookSignature(event, data, signature);
    if (!isValid) {
      console.warn('[Fluid Pay Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log(`[Fluid Pay Webhook] Processing event: ${event}`, {
      transactionId: data.transactionId,
      organizationId: data.organizationId,
      amount: data.amount,
    });

    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // Handle different webhook events
    switch (event) {
      case 'charge.completed':
        await handleChargeCompleted(db, data);
        break;

      case 'charge.failed':
        await handleChargeFailed(db, data);
        break;

      case 'subscription.created':
        await handleSubscriptionCreated(db, data);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(db, data);
        break;

      case 'subscription.payment_failed':
        await handleSubscriptionPaymentFailed(db, data);
        break;

      default:
        console.log(`[Fluid Pay Webhook] Unknown event type: ${event}`);
    }

    // Return success response
    res.json({ success: true, event });
  } catch (error) {
    console.error('[Fluid Pay Webhook] Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Verify webhook signature using HMAC
 */
function verifyWebhookSignature(event: string, data: any, signature: string): boolean {
  try {
    // In production, retrieve the webhook secret from environment or database
    const webhookSecret = process.env.FLUID_PAY_WEBHOOK_SECRET || 'default-secret';

    // Create the payload string
    const payload = JSON.stringify({ event, data });

    // Generate HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[Fluid Pay Webhook] Error verifying signature:', error);
    return false;
  }
}

/**
 * Handle successful charge completion
 */
async function handleChargeCompleted(db: any, data: any) {
  try {
    const { organizationId, credits, amount, transactionId } = data;

    if (!organizationId || !credits) {
      throw new Error('Missing organizationId or credits in webhook data');
    }

    // Update organization credits
    const existing = await db
      .select()
      .from(organizationCredits)
      .where(eq(organizationCredits.organizationId, organizationId))
      .limit(1);

    if (existing.length > 0) {
      // Add credits to existing balance
      await db
        .update(organizationCredits)
        .set({
          balance: existing[0].balance + credits,
          lastPurchaseAt: new Date().toISOString(),
        })
        .where(eq(organizationCredits.organizationId, organizationId));
    } else {
      // Create new credit record
      await db.insert(organizationCredits).values({
        organizationId,
        balance: credits,
        lastPurchaseAt: new Date().toISOString(),
      });
    }

    console.log(`[Fluid Pay Webhook] Charge completed: +${credits} credits for org ${organizationId}`);
  } catch (error) {
    console.error('[Fluid Pay Webhook] Error handling charge.completed:', error);
    throw error;
  }
}

/**
 * Handle failed charge
 */
async function handleChargeFailed(db: any, data: any) {
  try {
    const { organizationId, transactionId, reason } = data;

    console.log(`[Fluid Pay Webhook] Charge failed for org ${organizationId}:`, reason);

    // In production, you might want to:
    // - Send notification to user
    // - Log the failure for support
    // - Retry the charge
  } catch (error) {
    console.error('[Fluid Pay Webhook] Error handling charge.failed:', error);
    throw error;
  }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(db: any, data: any) {
  try {
    const { organizationId, subscriptionId, planId, credits } = data;

    console.log(`[Fluid Pay Webhook] Subscription created for org ${organizationId}:`, {
      subscriptionId,
      planId,
      credits,
    });

    // In production, you might want to:
    // - Store subscription record in database
    // - Send confirmation email
    // - Update user's subscription status
  } catch (error) {
    console.error('[Fluid Pay Webhook] Error handling subscription.created:', error);
    throw error;
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(db: any, data: any) {
  try {
    const { organizationId, subscriptionId } = data;

    console.log(`[Fluid Pay Webhook] Subscription cancelled for org ${organizationId}:`, {
      subscriptionId,
    });

    // In production, you might want to:
    // - Update subscription status in database
    // - Send cancellation confirmation
    // - Notify support team
  } catch (error) {
    console.error('[Fluid Pay Webhook] Error handling subscription.cancelled:', error);
    throw error;
  }
}

/**
 * Handle subscription payment failure
 */
async function handleSubscriptionPaymentFailed(db: any, data: any) {
  try {
    const { organizationId, subscriptionId, reason } = data;

    console.log(`[Fluid Pay Webhook] Subscription payment failed for org ${organizationId}:`, reason);

    // In production, you might want to:
    // - Send retry notification
    // - Update payment method request
    // - Suspend service if multiple failures
  } catch (error) {
    console.error('[Fluid Pay Webhook] Error handling subscription.payment_failed:', error);
    throw error;
  }
}

export default handleFluidPayWebhook;
