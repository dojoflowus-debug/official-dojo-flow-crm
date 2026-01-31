import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('[SendGrid] Initialized with API key');
} else {
  console.warn('[SendGrid] API key not found in environment variables');
}

export interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured');
  }

  const { to, from = 'noreply@dojoflow.com', subject, html, text } = options;

  const msg = {
    to: Array.isArray(to) ? to : [to],
    from,
    subject,
    html,
    text: text || stripHtml(html),
  };

  try {
    await sgMail.send(msg);
    console.log(`[SendGrid] Email sent successfully to ${Array.isArray(to) ? to.join(', ') : to}`);
  } catch (error: any) {
    console.error('[SendGrid] Error sending email:', error.response?.body || error.message);
    throw new Error(`Failed to send email: ${error.response?.body?.errors?.[0]?.message || error.message}`);
  }
}

/**
 * Send emails to multiple recipients (batch)
 */
export async function sendBatchEmails(emails: SendEmailOptions[]): Promise<void> {
  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured');
  }

  const messages = emails.map(({ to, from = 'noreply@dojoflow.com', subject, html, text }) => ({
    to: Array.isArray(to) ? to : [to],
    from,
    subject,
    html,
    text: text || stripHtml(html),
  }));

  try {
    await sgMail.send(messages);
    console.log(`[SendGrid] Batch emails sent successfully (${messages.length} emails)`);
  } catch (error: any) {
    console.error('[SendGrid] Error sending batch emails:', error.response?.body || error.message);
    throw new Error(`Failed to send batch emails: ${error.response?.body?.errors?.[0]?.message || error.message}`);
  }
}

/**
 * Verify SendGrid API key is valid
 */
export async function verifySendGridKey(): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    return false;
  }

  try {
    // Send a test request to verify the API key
    await sgMail.send({
      to: 'test@example.com',
      from: 'noreply@dojoflow.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });
    return true;
  } catch (error: any) {
    // If we get a 400 error about the email address, the API key is valid
    if (error.code === 400 || error.response?.status === 400) {
      return true;
    }
    console.error('[SendGrid] API key verification failed:', error.message);
    return false;
  }
}

/**
 * Strip HTML tags from string (simple implementation)
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Replace template variables in content
 * Example: "Hello {{name}}" with {name: "John"} becomes "Hello John"
 */
export function replaceTemplateVariables(content: string, variables: Record<string, any>): string {
  let result = content;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value));
  }
  
  return result;
}
