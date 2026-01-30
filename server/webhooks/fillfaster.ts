import { Request, Response } from 'express';
import { getDb } from '../db';
import { paymentProcessorApplication } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * FillFaster Webhook Handler
 * Receives status updates from FillFaster when applications are reviewed/approved
 * 
 * Webhook URL: https://dojoflow-2awpr243.manus.space/api/webhooks/fillfaster
 * 
 * Expected payload:
 * {
 *   "submission_id": "abc123",
 *   "status": "submitted" | "opened" | "saved" | "completed",
 *   "submitted_at": "2024-01-30T12:00:00Z",
 *   "user_data": {
 *     "dojoflow_org_id": 123,
 *     "dojoflow_user_id": 456,
 *     "dojoflow_app_id": 789
 *   }
 * }
 */

interface FillFasterWebhookPayload {
  submission_id: string;
  status: 'pending' | 'opened' | 'saved' | 'submitted' | 'completed';
  submitted_at?: string;
  user_data?: {
    dojoflow_org_id?: number;
    dojoflow_user_id?: number;
    dojoflow_app_id?: number;
  };
}

export async function handleFillFasterWebhook(req: Request, res: Response) {
  try {
    console.log('[FillFaster Webhook] Received webhook:', JSON.stringify(req.body, null, 2));
    
    const payload = req.body as FillFasterWebhookPayload;
    
    // Validate payload
    if (!payload.submission_id || !payload.status) {
      console.error('[FillFaster Webhook] Invalid payload:', payload);
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: submission_id and status'
      });
    }
    
    const db = await getDb();
    if (!db) {
      console.error('[FillFaster Webhook] Database not available');
      return res.status(500).json({
        success: false,
        error: 'Database not available'
      });
    }
    
    // Find application by submission ID
    const [application] = await db
      .select()
      .from(paymentProcessorApplication)
      .where(eq(paymentProcessorApplication.submissionId, payload.submission_id))
      .limit(1);
    
    if (!application) {
      console.warn('[FillFaster Webhook] Application not found for submission_id:', payload.submission_id);
      // Still return 200 to prevent FillFaster from retrying
      return res.status(200).json({
        success: true,
        message: 'Application not found, but webhook acknowledged'
      });
    }
    
    console.log('[FillFaster Webhook] Found application:', {
      id: application.id,
      orgId: application.organizationId,
      currentStatus: application.status
    });
    
    // Map FillFaster status to our status
    const statusMap: Record<string, string> = {
      'pending': 'SUBMITTED',
      'opened': 'UNDER_REVIEW',
      'saved': 'UNDER_REVIEW',
      'submitted': 'SUBMITTED',
      'completed': 'APPROVED'
    };
    
    const newStatus = statusMap[payload.status] || 'SUBMITTED';
    
    // Update application status
    await db
      .update(paymentProcessorApplication)
      .set({
        status: newStatus,
        reviewNotes: `FillFaster status: ${payload.status}`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(paymentProcessorApplication.id, application.id));
    
    console.log('[FillFaster Webhook] Updated application status:', {
      applicationId: application.id,
      oldStatus: application.status,
      newStatus,
      fillFasterStatus: payload.status
    });
    
    // TODO: Send notification to user about status change
    // TODO: Log to application history table
    
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      application_id: application.id,
      old_status: application.status,
      new_status: newStatus
    });
    
  } catch (error: any) {
    console.error('[FillFaster Webhook] Error processing webhook:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
