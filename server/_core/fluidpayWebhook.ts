import { Request, Response } from 'express';
import { logWebhookEvent, updateWebhookEventStatus } from '../paymentProviderDb';
import { getDb } from '../db';
import { paymentProviderConnections } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

// FluidPay webhook event types
type FluidPayEventType = 
  | 'transaction.created'
  | 'transaction.updated'
  | 'transaction.voided'
  | 'transaction.refunded'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'customer.created'
  | 'customer.updated'
  | 'test.event';

interface FluidPayWebhookPayload {
  event: FluidPayEventType;
  data: {
    id?: string;
    type?: string;
    status?: string;
    amount?: number;
    customer_id?: string;
    subscription_id?: string;
    merchant_id?: string;
    [key: string]: any;
  };
  created_at?: string;
  merchant_id?: string;
}

// Find organization by merchant ID or from webhook headers
async function findOrganizationId(merchantId: string | undefined, headers: Record<string, any>): Promise<number | null> {
  if (!merchantId) {
    // Try to get from custom header if FluidPay supports it
    merchantId = headers['x-fluidpay-merchant-id'] || headers['x-merchant-id'];
  }
  
  if (!merchantId) {
    console.warn('[FluidPay Webhook] No merchant ID found in payload or headers');
    return null;
  }
  
  const db = getDb();
  const [connection] = await db
    .select({ organizationId: paymentProviderConnections.organizationId })
    .from(paymentProviderConnections)
    .where(eq(paymentProviderConnections.merchantId, merchantId))
    .limit(1);
  
  return connection?.organizationId || null;
}

// Verify webhook signature (if FluidPay provides one)
function verifySignature(payload: string, signature: string | undefined, secret: string | undefined): boolean {
  if (!signature || !secret) {
    // FluidPay may not have signature verification yet
    console.log('[FluidPay Webhook] No signature provided, marking as unverified');
    return false;
  }
  
  // FluidPay signature verification would go here
  // For now, return false to mark as unverified
  return false;
}

export async function handleFluidPayWebhook(req: Request, res: Response) {
  console.log('[FluidPay Webhook] Received webhook event');
  
  try {
    // Parse the raw body
    const rawBody = req.body.toString();
    let payload: FluidPayWebhookPayload;
    
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error('[FluidPay Webhook] Invalid JSON payload');
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    
    const eventType = payload.event || 'unknown';
    const merchantId = payload.merchant_id || payload.data?.merchant_id;
    
    console.log(`[FluidPay Webhook] Event type: ${eventType}, Merchant ID: ${merchantId || 'unknown'}`);
    
    // Find the organization this webhook belongs to
    const organizationId = await findOrganizationId(merchantId, req.headers);
    
    if (!organizationId) {
      console.warn('[FluidPay Webhook] Could not find organization for webhook');
      // Still return 200 to prevent retries, but log the issue
      return res.status(200).json({ 
        received: true, 
        warning: 'Organization not found',
        verified: false 
      });
    }
    
    // Check signature (if available)
    const signature = req.headers['x-fluidpay-signature'] as string | undefined;
    const isVerified = verifySignature(rawBody, signature, process.env.FLUIDPAY_WEBHOOK_SECRET);
    
    // Log the webhook event
    await logWebhookEvent({
      organizationId,
      eventType,
      payload: rawBody,
    });
    
    console.log(`[FluidPay Webhook] Logged event for org ${organizationId}, verified: ${isVerified}`);
    
    // Process specific event types
    switch (eventType) {
      case 'transaction.created':
      case 'transaction.updated':
        // Handle transaction events
        console.log(`[FluidPay Webhook] Processing transaction event: ${payload.data?.id}`);
        break;
        
      case 'transaction.voided':
      case 'transaction.refunded':
        // Handle void/refund events
        console.log(`[FluidPay Webhook] Processing ${eventType}: ${payload.data?.id}`);
        break;
        
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.cancelled':
        // Handle subscription events
        console.log(`[FluidPay Webhook] Processing subscription event: ${payload.data?.subscription_id}`);
        break;
        
      case 'test.event':
        // Test event - just acknowledge
        console.log('[FluidPay Webhook] Test event received');
        break;
        
      default:
        console.log(`[FluidPay Webhook] Unhandled event type: ${eventType}`);
    }
    
    return res.status(200).json({ 
      received: true,
      verified: isVerified,
      eventType,
      organizationId 
    });
    
  } catch (error: any) {
    console.error('[FluidPay Webhook] Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
