/**
 * SendGrid Email Helper Functions
 * 
 * This module provides helper functions for sending emails
 * using the SendGrid API.
 */

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME;

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
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
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using SendGrid
 * 
 * @param options - Email options including recipients, subject, and content
 * @returns Promise with success status
 * 
 * @example
 * // Simple text email
 * const result = await sendEmail({
 *   to: { email: 'user@example.com', name: 'John Doe' },
 *   subject: 'Welcome to DojoFlow!',
 *   text: 'Thank you for joining our dojo management platform.'
 * });
 * 
 * // HTML email with template
 * const result = await sendEmail({
 *   to: { email: 'user@example.com' },
 *   subject: 'Class Reminder',
 *   html: '<h1>Your class starts in 1 hour!</h1><p>See you soon.</p>'
 * });
 * 
 * // Using SendGrid dynamic template
 * const result = await sendEmail({
 *   to: { email: 'user@example.com' },
 *   subject: 'Payment Confirmation',
 *   templateId: 'd-xxxxxxxxxxxxx',
 *   dynamicTemplateData: {
 *     name: 'John',
 *     amount: '$99.00',
 *     date: 'January 15, 2025'
 *   }
 * });
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
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
 * Send a welcome email to a new student
 */
export async function sendWelcomeEmail(
  to: EmailRecipient,
  studentName: string,
  dojoName: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: `Welcome to ${dojoName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #E53935;">Welcome to ${dojoName}!</h1>
        <p>Hi ${studentName},</p>
        <p>We're excited to have you join our martial arts family!</p>
        <p>Your journey begins now. Here's what you can expect:</p>
        <ul>
          <li>World-class instruction from experienced instructors</li>
          <li>A supportive community of fellow martial artists</li>
          <li>Progress tracking and belt advancement</li>
        </ul>
        <p>If you have any questions, don't hesitate to reach out.</p>
        <p>See you on the mat!</p>
        <p style="color: #666;">- The ${dojoName} Team</p>
      </div>
    `
  });
}

/**
 * Send a class reminder email
 */
export async function sendClassReminder(
  to: EmailRecipient,
  studentName: string,
  className: string,
  classTime: string,
  classDate: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: `Class Reminder: ${className}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #E53935;">Class Reminder</h1>
        <p>Hi ${studentName},</p>
        <p>This is a friendly reminder about your upcoming class:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Class:</strong> ${className}</p>
          <p style="margin: 10px 0 0;"><strong>Date:</strong> ${classDate}</p>
          <p style="margin: 10px 0 0;"><strong>Time:</strong> ${classTime}</p>
        </div>
        <p>Don't forget to bring your gear and arrive a few minutes early!</p>
        <p>See you there!</p>
      </div>
    `
  });
}

/**
 * Send a payment confirmation email
 */
export async function sendPaymentConfirmation(
  to: EmailRecipient,
  studentName: string,
  amount: string,
  description: string,
  receiptUrl?: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: 'Payment Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #E53935;">Payment Confirmed</h1>
        <p>Hi ${studentName},</p>
        <p>Thank you for your payment! Here are the details:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Amount:</strong> ${amount}</p>
          <p style="margin: 10px 0 0;"><strong>Description:</strong> ${description}</p>
        </div>
        ${receiptUrl ? `<p><a href="${receiptUrl}" style="color: #E53935;">View Receipt</a></p>` : ''}
        <p>If you have any questions about this payment, please contact us.</p>
      </div>
    `
  });
}

/**
 * Send bulk emails to multiple recipients
 */
export async function sendBulkEmail(
  recipients: EmailRecipient[],
  subject: string,
  html: string
): Promise<{ sent: number; failed: number; results: SendEmailResult[] }> {
  const results: SendEmailResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const to of recipients) {
    const result = await sendEmail({ to, subject, html });
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
