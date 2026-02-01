/**
 * SendGrid Email Helper Functions
 * 
 * This module provides helper functions for sending emails
 * using the SendGrid API with integrated template system support.
 */

import { getDb } from '../db';
import { emailTemplates } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { defaultEmailTemplates, replaceVariables } from '../lib/defaultEmailTemplates';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME;

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject?: string;
  text?: string;
  html?: string;
  from?: EmailRecipient;
  replyTo?: EmailRecipient;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: Array<{
    content: string; // Base64 encoded content
    filename: string;
    type?: string;
    disposition?: 'attachment' | 'inline';
  }>;
  // Template system integration
  templateType?: string; // e.g., 'welcome', 'payment_confirmation'
  templateData?: Record<string, any>; // Variables to substitute
  organizationId?: number; // For fetching org-specific templates
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Fetch and render email template
 * 
 * @param templateType - Type of template to fetch
 * @param organizationId - Organization ID for custom templates
 * @param templateData - Data to substitute in template
 * @returns Rendered subject and HTML
 */
async function fetchAndRenderTemplate(
  templateType: string,
  organizationId: number,
  templateData: Record<string, any>
): Promise<{ subject: string; html: string } | null> {
  try {
    const db = await getDb();
    
    // Try to fetch custom template first
    const customTemplate = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.orgId, organizationId),
        eq(emailTemplates.templateType, templateType)
      ))
      .limit(1);
    
    let template;
    
    if (customTemplate.length > 0) {
      template = customTemplate[0];
      console.log(`[SendGrid] Using custom template: ${templateType} for org ${organizationId}`);
    } else {
      // Fall back to default template
      const defaultTemplate = defaultEmailTemplates.find(t => t.templateType === templateType);
      
      if (!defaultTemplate) {
        console.error(`[SendGrid] Template not found: ${templateType}`);
        return null;
      }
      
      template = defaultTemplate;
      console.log(`[SendGrid] Using default template: ${templateType}`);
    }
    
    // Render template with data
    const renderedSubject = replaceVariables(template.subject, templateData);
    const renderedHtml = replaceVariables(template.bodyHtml, templateData);
    
    console.log(`[SendGrid] Template rendered: ${templateType}`);
    
    return {
      subject: renderedSubject,
      html: renderedHtml
    };
  } catch (error) {
    console.error(`[SendGrid] Error fetching template: ${templateType}`, error);
    return null;
  }
}

/**
 * Send an email using SendGrid (internal - no credit deduction)
 * 
 * @param options - Email options including recipients, subject, and content
 * @returns Promise with success status
 */
async function sendEmailInternal(options: SendEmailOptions): Promise<SendEmailResult> {
  // If templateType is provided, fetch and render template
  if (options.templateType && options.organizationId && options.templateData) {
    const rendered = await fetchAndRenderTemplate(
      options.templateType,
      options.organizationId,
      options.templateData
    );
    
    if (rendered) {
      options.subject = rendered.subject;
      options.html = rendered.html;
    } else {
      console.warn(`[SendGrid] Failed to render template ${options.templateType}, falling back to provided content`);
    }
  }
  if (!SENDGRID_API_KEY) {
    console.error('[SendGrid] Missing SendGrid API key');
    return {
      success: false,
      error: 'SendGrid API key not configured'
    };
  }

  if (!SENDGRID_FROM_EMAIL) {
    console.error('[SendGrid] Missing sender email');
    return {
      success: false,
      error: 'SendGrid sender email not configured'
    };
  }

  const from = options.from || {
    email: SENDGRID_FROM_EMAIL,
    name: SENDGRID_FROM_NAME || 'DojoFlow'
  };

  // Normalize recipients to array
  const toRecipients = Array.isArray(options.to) ? options.to : [options.to];

  try {
    if (!options.subject) {
      return {
        success: false,
        error: 'Subject is required'
      };
    }
    
    const payload: Record<string, any> = {
      personalizations: [{
        to: toRecipients.map(r => ({ email: r.email, name: r.name })),
        subject: options.subject
      }],
      from: { email: from.email, name: from.name }
    };

    // Add CC recipients
    if (options.cc && options.cc.length > 0) {
      payload.personalizations[0].cc = options.cc.map(r => ({ email: r.email, name: r.name }));
    }

    // Add BCC recipients
    if (options.bcc && options.bcc.length > 0) {
      payload.personalizations[0].bcc = options.bcc.map(r => ({ email: r.email, name: r.name }));
    }

    // Add reply-to
    if (options.replyTo) {
      payload.reply_to = { email: options.replyTo.email, name: options.replyTo.name };
    }

    // Use template or content
    if (options.templateId) {
      payload.template_id = options.templateId;
      if (options.dynamicTemplateData) {
        payload.personalizations[0].dynamic_template_data = options.dynamicTemplateData;
      }
    } else {
      payload.content = [];
      if (options.text) {
        payload.content.push({ type: 'text/plain', value: options.text });
      }
      if (options.html) {
        payload.content.push({ type: 'text/html', value: options.html });
      }
      if (payload.content.length === 0) {
        return {
          success: false,
          error: 'Either text, html, or templateId must be provided'
        };
      }
    }

    // Add attachments
    if (options.attachments && options.attachments.length > 0) {
      payload.attachments = options.attachments.map(a => ({
        content: a.content,
        filename: a.filename,
        type: a.type,
        disposition: a.disposition || 'attachment'
      }));
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SendGrid] Email send failed:', response.status, errorText);
      return {
        success: false,
        error: `Failed to send email: ${response.status}`
      };
    }

    const messageId = response.headers.get('x-message-id');
    console.log('[SendGrid] Email sent successfully:', messageId);
    
    return {
      success: true,
      messageId: messageId || undefined
    };
  } catch (error) {
    console.error('[SendGrid] Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send a welcome email to a new student using template system
 */
export async function sendWelcomeEmail(
  to: EmailRecipient,
  studentData: {
    studentName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    beltRank?: string;
  },
  dojoData: {
    dojoName: string;
    dojoAddress?: string;
    dojoPhone?: string;
    dojoEmail?: string;
    dojoWebsite?: string;
  },
  organizationId: number
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    templateType: 'welcome_student',
    templateData: {
      studentName: studentData.studentName,
      firstName: studentData.firstName || studentData.studentName.split(' ')[0],
      lastName: studentData.lastName || studentData.studentName.split(' ').slice(1).join(' '),
      email: studentData.email || to.email,
      phone: studentData.phone || '',
      beltRank: studentData.beltRank || 'White Belt',
      dojoName: dojoData.dojoName,
      schoolName: dojoData.dojoName,
      dojoAddress: dojoData.dojoAddress || '',
      dojoPhone: dojoData.dojoPhone || '',
      dojoEmail: dojoData.dojoEmail || '',
      dojoWebsite: dojoData.dojoWebsite || '',
      currentDate: new Date().toLocaleDateString(),
      currentYear: new Date().getFullYear().toString(),
    },
    organizationId
  });
}

/**
 * Send a class reminder email using template system
 */
export async function sendClassReminder(
  to: EmailRecipient,
  classData: {
    studentName: string;
    className: string;
    classTime: string;
    classDate: string;
    classLocation?: string;
    instructorName?: string;
  },
  dojoData: {
    dojoName: string;
    dojoPhone?: string;
  },
  organizationId: number
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    templateType: 'class_reminder',
    templateData: {
      studentName: classData.studentName,
      firstName: classData.studentName.split(' ')[0],
      className: classData.className,
      classTime: classData.classTime,
      classDate: classData.classDate,
      classLocation: classData.classLocation || 'Main Dojo',
      instructorName: classData.instructorName || 'Your Instructor',
      dojoName: dojoData.dojoName,
      schoolName: dojoData.dojoName,
      dojoPhone: dojoData.dojoPhone || '',
      currentDate: new Date().toLocaleDateString(),
      currentYear: new Date().getFullYear().toString(),
    },
    organizationId
  });
}

/**
 * Send a payment confirmation email using template system
 */
export async function sendPaymentConfirmation(
  to: EmailRecipient,
  paymentData: {
    studentName: string;
    amount: string;
    currency?: string;
    description?: string;
    membershipType?: string;
    paymentMethod?: string;
    transactionId?: string;
    invoiceUrl?: string;
    receiptUrl?: string;
  },
  dojoData: {
    dojoName: string;
    dojoEmail?: string;
    dojoPhone?: string;
  },
  organizationId: number
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    templateType: 'payment_confirmation',
    templateData: {
      studentName: paymentData.studentName,
      firstName: paymentData.studentName.split(' ')[0],
      amount: paymentData.amount,
      currency: paymentData.currency || 'USD',
      membershipType: paymentData.description || paymentData.membershipType || 'Monthly Membership',
      paymentMethod: paymentData.paymentMethod || 'Card',
      transactionId: paymentData.transactionId || '',
      invoiceUrl: paymentData.invoiceUrl || '',
      receiptUrl: paymentData.receiptUrl || '',
      dojoName: dojoData.dojoName,
      schoolName: dojoData.dojoName,
      dojoEmail: dojoData.dojoEmail || '',
      dojoPhone: dojoData.dojoPhone || '',
      currentDate: new Date().toLocaleDateString(),
      currentYear: new Date().getFullYear().toString(),
    },
    organizationId
  });
}

/**
 * Send an email using SendGrid with credit consumption
 * 
 * @param options - Email options including recipients, subject, content, and organizationId for credit tracking
 * @returns Promise with success status
 * 
 * @example
 * // Simple text email
 * const result = await sendEmail({
 *   to: { email: 'user@example.com', name: 'John Doe' },
 *   subject: 'Welcome to DojoFlow!',
 *   text: 'Thank you for joining our dojo management platform.',
 *   organizationId: 1
 * });
 */
export async function sendEmail(
  options: SendEmailOptions & { organizationId?: number }
): Promise<SendEmailResult> {
  // Check credit balance if organizationId provided
  if (options.organizationId) {
    const { checkSufficientBalance, CREDIT_COSTS } = await import("../creditConsumption");
    const balanceCheck = await checkSufficientBalance(options.organizationId, CREDIT_COSTS.EMAIL);
    
    if (!balanceCheck.sufficient) {
      return {
        success: false,
        error: balanceCheck.message || "Insufficient credits for email"
      };
    }
  }

  // Send email
  const result = await sendEmailInternal(options);

  // Deduct credits if successful and organizationId provided
  if (result.success && options.organizationId) {
    const { deductCredits, CREDIT_COSTS } = await import("../creditConsumption");
    const toEmails = Array.isArray(options.to) 
      ? options.to.map(r => r.email).join(', ')
      : options.to.email;
    
    const deductResult = await deductCredits({
      organizationId: options.organizationId,
      amount: CREDIT_COSTS.EMAIL,
      taskType: 'ai_email' as const,
      description: `Email to ${toEmails}: "${options.subject}"`,
      metadata: {
        to: toEmails,
        subject: options.subject,
        messageId: result.messageId,
        hasTemplate: !!options.templateId,
      },
    });

    if (!deductResult.success) {
      console.error('[SendGrid] Failed to deduct credits for email:', deductResult.error);
    } else {
      console.log('[SendGrid] Credits deducted for email. New balance:', deductResult.newBalance);
    }
  }

  return result;
}

/**
 * Send bulk emails to multiple recipients
 */
export async function sendBulkEmail(
  recipients: EmailRecipient[],
  subject: string,
  html: string,
  organizationId?: number
): Promise<{ sent: number; failed: number; results: SendEmailResult[] }> {
  const results: SendEmailResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const to of recipients) {
    const result = await sendEmail({ to, subject, html, organizationId });
    results.push(result);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return { sent, failed, results };
}
