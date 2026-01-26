/**
 * Webhook Service - Handle webhook payload building, signing, and delivery
 * Sends lead capture data to external CRM systems via webhooks
 */

import crypto from 'crypto';
import { getDb } from '../db';
import { webhookLogs, webhooks } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export interface WebhookPayload {
  eventType: string;
  timestamp: string;
  leadId: number;
  organizationId: number;
  lead: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    interestedProgram?: string;
    ageGroup?: string;
    locationId?: number | null;
    source: string;
    status: string;
    stage: string;
    leadScore: number;
    message?: string;
  };
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  duration: number;
}

/**
 * Generate HMAC-SHA256 signature for webhook request
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Build webhook payload for lead capture event
 */
export function buildLeadCapturePayload(leadData: any, organizationId: number): WebhookPayload {
  return {
    eventType: 'lead.captured',
    timestamp: new Date().toISOString(),
    leadId: leadData.id,
    organizationId,
    lead: {
      id: leadData.id,
      firstName: leadData.firstName,
      lastName: leadData.lastName,
      email: leadData.email,
      phone: leadData.phone,
      interestedProgram: leadData.interestedProgram,
      ageGroup: leadData.ageGroup,
      locationId: leadData.locationId,
      source: leadData.source || 'website_chat',
      status: leadData.status,
      stage: leadData.stage,
      leadScore: leadData.leadScore,
      message: leadData.message,
    },
  };
}

/**
 * Send webhook to external endpoint with retry logic
 */
export async function sendWebhook(
  webhookUrl: string,
  payload: WebhookPayload,
  secret: string,
  customHeaders?: Record<string, string>,
  timeout: number = 30000
): Promise<WebhookDeliveryResult> {
  const payloadString = JSON.stringify(payload);
  const signature = generateWebhookSignature(payloadString, secret);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature,
    'X-Webhook-Timestamp': payload.timestamp,
    'X-Webhook-Event': payload.eventType,
    ...customHeaders,
  };

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    const responseBody = await response.text();

    if (response.ok) {
      return {
        success: true,
        statusCode: response.status,
        responseBody,
        duration,
      };
    } else {
      return {
        success: false,
        statusCode: response.status,
        responseBody,
        errorMessage: `HTTP ${response.status}: ${responseBody}`,
        duration,
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      errorMessage: `Webhook delivery failed: ${errorMessage}`,
      duration,
    };
  }
}

/**
 * Trigger webhook for lead capture event
 */
export async function triggerLeadCaptureWebhook(leadData: any, organizationId: number): Promise<void> {
  try {
    const db = await getDb();

    // Get all active webhooks for this organization
    const activeWebhooks = await db
      .select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.organizationId, organizationId),
          eq(webhooks.isActive, 1)
        )
      );

    if (activeWebhooks.length === 0) {
      console.log(`[Webhook] No active webhooks for organization ${organizationId}`);
      return;
    }

    const payload = buildLeadCapturePayload(leadData, organizationId);

    // Send webhook to each configured endpoint
    for (const webhook of activeWebhooks) {
      // Check if this webhook is configured for lead.captured events
      const events = webhook.events?.split(',').map(e => e.trim()) || [];
      if (!events.includes('lead.captured')) {
        continue;
      }

      // Parse custom headers if provided
      let customHeaders: Record<string, string> = {};
      if (webhook.headers) {
        try {
          customHeaders = JSON.parse(webhook.headers);
        } catch (e) {
          console.error(`[Webhook] Failed to parse custom headers for webhook ${webhook.id}:`, e);
        }
      }

      // Send webhook asynchronously (fire and forget with logging)
      sendWebhookWithRetry(webhook, payload, customHeaders).catch(error => {
        console.error(`[Webhook] Error sending webhook ${webhook.id}:`, error);
      });
    }
  } catch (error) {
    console.error('[Webhook] Error triggering lead capture webhooks:', error);
  }
}

/**
 * Send webhook with retry logic
 */
async function sendWebhookWithRetry(
  webhook: any,
  payload: WebhookPayload,
  customHeaders: Record<string, string>
): Promise<void> {
  const db = await getDb();
  let lastError: string | null = null;
  let lastStatusCode: number | null = null;

  for (let attempt = 1; attempt <= webhook.retryAttempts; attempt++) {
    const result = await sendWebhook(
      webhook.url,
      payload,
      webhook.secret,
      customHeaders,
      webhook.maxTimeout * 1000
    );

    // Log the delivery attempt
    const logData = {
      webhookId: webhook.id,
      organizationId: webhook.organizationId,
      eventType: payload.eventType,
      leadId: payload.leadId,
      payload: JSON.stringify(payload),
      statusCode: result.statusCode,
      responseBody: result.responseBody,
      errorMessage: result.errorMessage,
      attemptNumber: attempt,
      duration: result.duration,
      deliveryStatus: result.success ? 'success' : attempt < webhook.retryAttempts ? 'retrying' : 'failed',
      nextRetryAt: !result.success && attempt < webhook.retryAttempts
        ? new Date(Date.now() + webhook.retryDelaySeconds * 1000 * attempt).toISOString()
        : null,
      deliveredAt: result.success ? new Date().toISOString() : null,
    };

    await db.insert(webhookLogs).values(logData);

    if (result.success) {
      // Update webhook success count and last delivery time
      await db
        .update(webhooks)
        .set({
          lastDeliveryAt: new Date().toISOString(),
          lastDeliveryStatus: 'success',
          successCount: webhook.successCount + 1,
        })
        .where(eq(webhooks.id, webhook.id));

      console.log(`[Webhook] Successfully delivered webhook ${webhook.id} (attempt ${attempt}/${webhook.retryAttempts})`);
      return;
    }

    lastError = result.errorMessage || 'Unknown error';
    lastStatusCode = result.statusCode || null;

    // Wait before retrying (exponential backoff)
    if (attempt < webhook.retryAttempts) {
      const delayMs = webhook.retryDelaySeconds * 1000 * attempt;
      console.log(`[Webhook] Retrying webhook ${webhook.id} in ${delayMs}ms (attempt ${attempt}/${webhook.retryAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // All retries exhausted
  await db
    .update(webhooks)
    .set({
      lastDeliveryAt: new Date().toISOString(),
      lastDeliveryStatus: 'failed',
      failureCount: webhook.failureCount + 1,
    })
    .where(eq(webhooks.id, webhook.id));

  console.error(
    `[Webhook] Failed to deliver webhook ${webhook.id} after ${webhook.retryAttempts} attempts. Last error: ${lastError}`
  );
}

/**
 * Retry failed webhook deliveries
 */
export async function retryFailedWebhooks(): Promise<void> {
  try {
    const db = await getDb();

    // Get all pending/retrying webhook logs that are ready for retry
    const failedLogs = await db
      .select()
      .from(webhookLogs)
      .where(
        and(
          eq(webhookLogs.deliveryStatus, 'retrying'),
          // nextRetryAt is in the past or null
          // This is a simplified check - in production you'd use a more sophisticated query
        )
      );

    console.log(`[Webhook] Found ${failedLogs.length} failed webhooks to retry`);

    for (const log of failedLogs) {
      const webhook = await db
        .select()
        .from(webhooks)
        .where(eq(webhooks.id, log.webhookId))
        .then(results => results[0]);

      if (!webhook) continue;

      // Retry the webhook
      const payload = JSON.parse(log.payload);
      let customHeaders: Record<string, string> = {};
      if (webhook.headers) {
        try {
          customHeaders = JSON.parse(webhook.headers);
        } catch (e) {
          // Ignore parse errors
        }
      }

      await sendWebhookWithRetry(webhook, payload, customHeaders);
    }
  } catch (error) {
    console.error('[Webhook] Error retrying failed webhooks:', error);
  }
}
