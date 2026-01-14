/**
 * SendGrid Email Service
 * Sends emails via SendGrid API
 */

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@dojoflow.com";
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "DojoFlow";

/**
 * Send email via SendGrid
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.warn("SendGrid API key not configured - Email not sent");
    console.log(`[Email Preview] To: ${to}, Subject: ${subject}`);
    console.log(`Content: ${textContent || htmlContent}`);
    return;
  }

  try {
    // SendGrid API endpoint
    const url = "https://api.sendgrid.com/v3/mail/send";

    // Prepare email data
    const emailData = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: subject,
        },
      ],
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      content: [
        {
          type: "text/html",
          value: htmlContent,
        },
      ],
    };

    // Add plain text version if provided
    if (textContent) {
      emailData.content.unshift({
        type: "text/plain",
        value: textContent,
      } as any);
    }

    // Send request
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${error}`);
    }

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Convert plain text to HTML
 */
export function textToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")
    .replace(/  /g, "&nbsp;&nbsp;");
}
