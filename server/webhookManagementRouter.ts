/**
 * Webhook Management Router - API endpoints for webhook configuration
 * Allows organizations to configure webhooks for CRM integration
 */

import { Router, Request, Response } from 'express';
import { getDb } from './db';
import { webhooks, webhookLogs } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

/**
 * Generate a secure random secret for webhook signing
 */
function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate webhook URL
 */
function isValidWebhookUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Require HTTPS for production webhooks
    if (process.env.NODE_ENV === 'production') {
      return urlObj.protocol === 'https:';
    }
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * GET /api/webhook-management/webhooks - List webhooks for organization
 */
router.get('/webhooks', async (req: Request, res: Response) => {
  try {
    const organizationId = req.query.organizationId as string;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const orgWebhooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.organizationId, parseInt(organizationId)));

    // Don't expose secrets in the response
    const safeWebhooks = orgWebhooks.map(webhook => ({
      ...webhook,
      secret: webhook.secret ? '***' : undefined,
    }));

    res.json(safeWebhooks);
  } catch (error) {
    console.error('[Webhook Management] Error listing webhooks:', error);
    res.status(500).json({ error: 'Failed to list webhooks' });
  }
});

/**
 * POST /api/webhook-management/webhooks - Create a new webhook
 */
router.post('/webhooks', async (req: Request, res: Response) => {
  try {
    const { organizationId, url, events, headers } = req.body;

    if (!organizationId || !url) {
      return res.status(400).json({ error: 'organizationId and url are required' });
    }

    if (!isValidWebhookUrl(url)) {
      return res.status(400).json({ error: 'Invalid webhook URL (must be HTTPS in production)' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Validate events format
    const eventList = events ? events.split(',').map((e: string) => e.trim()) : ['lead.captured'];
    const validEvents = ['lead.captured'];
    const hasValidEvents = eventList.some((e: string) => validEvents.includes(e));

    if (!hasValidEvents) {
      return res.status(400).json({ error: 'Invalid event type. Valid events: lead.captured' });
    }

    const secret = generateWebhookSecret();

    const result = await db.insert(webhooks).values({
      organizationId: parseInt(organizationId),
      url,
      events: eventList.join(','),
      secret,
      headers: headers ? JSON.stringify(headers) : null,
      isActive: 1,
      retryAttempts: 3,
      retryDelaySeconds: 300,
      maxTimeout: 30,
      successCount: 0,
      failureCount: 0,
    });

    const webhookId = (result as any)[0]?.insertId || (result as any)[0]?.id;

    res.status(201).json({
      id: webhookId,
      organizationId,
      url,
      events: eventList.join(','),
      isActive: 1,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Webhook Management] Error creating webhook:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

/**
 * PUT /api/webhook-management/webhooks/:id - Update webhook
 */
router.put('/webhooks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { url, events, isActive, headers } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Webhook ID is required' });
    }

    if (url && !isValidWebhookUrl(url)) {
      return res.status(400).json({ error: 'Invalid webhook URL' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const updateData: any = {};
    if (url) updateData.url = url;
    if (events) updateData.events = events;
    if (typeof isActive === 'number') updateData.isActive = isActive;
    if (headers) updateData.headers = JSON.stringify(headers);
    updateData.updatedAt = new Date().toISOString();

    await db
      .update(webhooks)
      .set(updateData)
      .where(eq(webhooks.id, parseInt(id)));

    res.json({ success: true, message: 'Webhook updated' });
  } catch (error) {
    console.error('[Webhook Management] Error updating webhook:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

/**
 * DELETE /api/webhook-management/webhooks/:id - Delete webhook
 */
router.delete('/webhooks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Webhook ID is required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    await db.delete(webhooks).where(eq(webhooks.id, parseInt(id)));

    res.json({ success: true, message: 'Webhook deleted' });
  } catch (error) {
    console.error('[Webhook Management] Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

/**
 * GET /api/webhook-management/webhooks/:id/logs - Get delivery logs for webhook
 */
router.get('/webhooks/:id/logs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!id) {
      return res.status(400).json({ error: 'Webhook ID is required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const logs = await db
      .select()
      .from(webhookLogs)
      .where(eq(webhookLogs.webhookId, parseInt(id)))
      .orderBy(webhookLogs.createdAt)
      .limit(limit)
      .offset(offset);

    res.json(logs);
  } catch (error) {
    console.error('[Webhook Management] Error fetching webhook logs:', error);
    res.status(500).json({ error: 'Failed to fetch webhook logs' });
  }
});

/**
 * POST /api/webhook-management/webhooks/:id/test - Send test webhook
 */
router.post('/webhooks/:id/test', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Webhook ID is required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const webhook = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.id, parseInt(id)))
      .then(results => results[0]);

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Create a test payload
    const testPayload = {
      eventType: 'lead.captured',
      timestamp: new Date().toISOString(),
      leadId: 0,
      organizationId: webhook.organizationId,
      lead: {
        id: 0,
        firstName: 'Test',
        lastName: 'Lead',
        email: 'test@example.com',
        phone: '555-0123',
        interestedProgram: 'Dragon Kids',
        ageGroup: 'child',
        locationId: undefined,
        source: 'test',
        status: 'New Lead',
        stage: 'new',
        leadScore: 75,
        message: 'This is a test webhook delivery',
      },
    }

    // Import webhook service
    const { sendWebhook } = await import('./services/webhookService');

    let customHeaders: Record<string, string> = {};
    if (webhook.headers) {
      try {
        customHeaders = JSON.parse(webhook.headers);
      } catch (e) {
        // Ignore parse errors
      }
    }

    const result = await sendWebhook(
      webhook.url,
      testPayload,
      webhook.secret,
      customHeaders,
      webhook.maxTimeout * 1000
    );

    res.json({
      success: result.success,
      statusCode: result.statusCode,
      duration: result.duration,
      errorMessage: result.errorMessage,
      responseBody: result.responseBody?.substring(0, 500), // Truncate long responses
    });
  } catch (error) {
    console.error('[Webhook Management] Error sending test webhook:', error);
    res.status(500).json({ error: 'Failed to send test webhook' });
  }
});

/**
 * POST /api/webhook-management/webhooks/:id/retry - Manually retry failed deliveries
 */
router.post('/webhooks/:id/retry', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Webhook ID is required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Get failed logs for this webhook
    const failedLogs = await db
      .select()
      .from(webhookLogs)
      .where(
        and(
          eq(webhookLogs.webhookId, parseInt(id)),
          eq(webhookLogs.deliveryStatus, 'failed')
        )
      );

    let retryCount = 0;
    for (const log of failedLogs) {
      // Mark as retrying for manual retry
      await db
        .update(webhookLogs)
        .set({
          deliveryStatus: 'retrying',
          nextRetryAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(webhookLogs.id, log.id));

      retryCount++;
    }

    res.json({
      success: true,
      message: `Queued ${retryCount} failed deliveries for retry`,
      retryCount,
    });
  } catch (error) {
    console.error('[Webhook Management] Error retrying webhooks:', error);
    res.status(500).json({ error: 'Failed to retry webhooks' });
  }
});

/**
 * GET /api/webhook-management/webhooks/:id/stats - Get webhook delivery statistics
 */
router.get('/webhooks/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Webhook ID is required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const webhook = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.id, parseInt(id)))
      .then(results => results[0]);

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Get delivery stats
    const logs = await db
      .select()
      .from(webhookLogs)
      .where(eq(webhookLogs.webhookId, parseInt(id)));

    const stats = {
      totalDeliveries: logs.length,
      successCount: logs.filter(l => l.deliveryStatus === 'success').length,
      failureCount: logs.filter(l => l.deliveryStatus === 'failed').length,
      retryingCount: logs.filter(l => l.deliveryStatus === 'retrying').length,
      successRate: logs.length > 0 
        ? Math.round((logs.filter(l => l.deliveryStatus === 'success').length / logs.length) * 100)
        : 0,
      averageResponseTime: logs.length > 0
        ? Math.round(logs.reduce((sum, l) => sum + (l.duration || 0), 0) / logs.length)
        : 0,
      lastDeliveryAt: webhook.lastDeliveryAt,
      lastDeliveryStatus: webhook.lastDeliveryStatus,
    };

    res.json(stats);
  } catch (error) {
    console.error('[Webhook Management] Error fetching webhook stats:', error);
    res.status(500).json({ error: 'Failed to fetch webhook stats' });
  }
});

export default router;
