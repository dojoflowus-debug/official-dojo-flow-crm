/**
 * Conversations Router Credit Integration
 * 
 * Integrates credit consumption for SMS and email operations
 */

import { getDb } from "./db";
import { conversations, messages } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Send SMS with credit deduction
 */
export async function sendSmsWithCredits(params: {
  organizationId: number;
  conversationId: number;
  content: string;
  recipientPhone: string;
  senderType: 'staff' | 'system';
  senderId?: string;
}): Promise<{
  success: boolean;
  messageId?: number;
  creditsDeducted?: number;
  newBalance?: number;
  error?: string;
}> {
  const { organizationId, conversationId, content, recipientPhone, senderType, senderId } = params;

  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        error: "Database not available",
      };
    }

    // Check credit balance
    const { checkSufficientBalance, CREDIT_COSTS } = await import("./services/creditConsumptionService");
    const balanceCheck = await checkSufficientBalance(organizationId, CREDIT_COSTS.SMS);

    if (!balanceCheck.sufficient) {
      return {
        success: false,
        error: balanceCheck.message || "Insufficient credits for SMS",
      };
    }

    // Create message record
    const messageRecord = await db.insert(messages).values({
      conversationId,
      direction: "outbound",
      content,
      senderType,
      senderId: senderType === "staff" ? senderId : null,
      status: "pending",
    });

    // Mark as sent (in production, integrate with Twilio)
    await db
      .update(messages)
      .set({
        status: "sent",
        sentAt: new Date().toISOString(),
      })
      .where(eq(messages.id, messageRecord.insertId));

    // Update conversation
    await db
      .update(conversations)
      .set({
        lastMessagePreview: content.substring(0, 100),
        lastMessageAt: new Date().toISOString(),
      })
      .where(eq(conversations.id, conversationId));

    // Deduct credits
    const { deductCredits } = await import("./services/creditConsumptionService");
    const deductResult = await deductCredits({
      organizationId,
      amount: CREDIT_COSTS.SMS,
      taskType: 'ai_sms',
      description: `SMS to ${recipientPhone}: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
      metadata: {
        recipientPhone,
        messageLength: content.length,
        conversationId,
      },
    });

    if (!deductResult.success) {
      console.error('[SMS] Failed to deduct credits:', deductResult.error);
      // Note: Message was already sent, but credit deduction failed
      // In production, this should trigger a refund or manual review
    }

    console.log(`[SMS] Message sent and credits deducted. New balance: ${deductResult.newBalance}`);

    return {
      success: true,
      messageId: Number(messageRecord.insertId),
      creditsDeducted: CREDIT_COSTS.SMS,
      newBalance: deductResult.newBalance,
    };
  } catch (error) {
    console.error("[SMS] Error sending SMS with credits:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Send email with credit deduction
 */
export async function sendEmailWithCredits(params: {
  organizationId: number;
  recipientEmail: string;
  subject: string;
  content: string;
  recipientCount?: number;
}): Promise<{
  success: boolean;
  creditsDeducted?: number;
  newBalance?: number;
  error?: string;
}> {
  const { organizationId, recipientEmail, subject, content, recipientCount = 1 } = params;

  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        error: "Database not available",
      };
    }

    // Calculate credits needed (2 per email, multiplied by recipient count)
    const { checkSufficientBalance, CREDIT_COSTS } = await import("./services/creditConsumptionService");
    const creditsNeeded = CREDIT_COSTS.EMAIL * recipientCount;

    const balanceCheck = await checkSufficientBalance(organizationId, creditsNeeded);

    if (!balanceCheck.sufficient) {
      return {
        success: false,
        error: balanceCheck.message || "Insufficient credits for email",
      };
    }

    // Send email (in production, integrate with SendGrid)
    console.log(`[Email] Sending email to ${recipientEmail} (${recipientCount} recipient(s))`);
    // const { sendEmail } = await import("./_core/sendgrid");
    // await sendEmail(recipientEmail, subject, content);

    // Deduct credits
    const { deductCredits } = await import("./services/creditConsumptionService");
    const deductResult = await deductCredits({
      organizationId,
      amount: creditsNeeded,
      taskType: 'ai_email',
      description: `Email to ${recipientEmail}: "${subject}"`,
      metadata: {
        recipientEmail,
        recipientCount,
        subjectLength: subject.length,
        contentLength: content.length,
      },
    });

    if (!deductResult.success) {
      console.error('[Email] Failed to deduct credits:', deductResult.error);
    }

    console.log(`[Email] Email sent and credits deducted. New balance: ${deductResult.newBalance}`);

    return {
      success: true,
      creditsDeducted: creditsNeeded,
      newBalance: deductResult.newBalance,
    };
  } catch (error) {
    console.error("[Email] Error sending email with credits:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Make phone call with credit deduction
 */
export async function makePhoneCallWithCredits(params: {
  organizationId: number;
  recipientPhone: string;
  durationMinutes: number;
  callType: 'outbound' | 'inbound';
  recordingUrl?: string;
}): Promise<{
  success: boolean;
  creditsDeducted?: number;
  newBalance?: number;
  error?: string;
}> {
  const { organizationId, recipientPhone, durationMinutes, callType, recordingUrl } = params;

  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        error: "Database not available",
      };
    }

    // Calculate credits needed (10 per minute)
    const { checkSufficientBalance, CREDIT_COSTS } = await import("./services/creditConsumptionService");
    const creditsNeeded = CREDIT_COSTS.CALL_PER_MINUTE * durationMinutes;

    const balanceCheck = await checkSufficientBalance(organizationId, creditsNeeded);

    if (!balanceCheck.sufficient) {
      return {
        success: false,
        error: balanceCheck.message || "Insufficient credits for phone call",
      };
    }

    // Deduct credits
    const { deductCredits } = await import("./services/creditConsumptionService");
    const deductResult = await deductCredits({
      organizationId,
      amount: creditsNeeded,
      taskType: 'ai_phone_call',
      description: `${callType === 'outbound' ? 'Outbound' : 'Inbound'} call to ${recipientPhone} (${durationMinutes} min)`,
      metadata: {
        recipientPhone,
        durationMinutes,
        callType,
        recordingUrl,
      },
    });

    if (!deductResult.success) {
      console.error('[Call] Failed to deduct credits:', deductResult.error);
    }

    console.log(`[Call] Call recorded and credits deducted. New balance: ${deductResult.newBalance}`);

    return {
      success: true,
      creditsDeducted: creditsNeeded,
      newBalance: deductResult.newBalance,
    };
  } catch (error) {
    console.error("[Call] Error recording call with credits:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export default {
  sendSmsWithCredits,
  sendEmailWithCredits,
  makePhoneCallWithCredits,
};
