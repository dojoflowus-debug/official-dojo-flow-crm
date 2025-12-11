/**
 * Email Template Service
 * Provides branded HTML email templates with school logo
 */

import { getDb } from "../db";
import { dojoSettings } from "../../drizzle/schema";

// Default fallback logo (DojoFlow logo as base64 or URL)
const DEFAULT_LOGO = "https://dojoflow.com/logo.png";

/**
 * Get the school logo URL from database settings
 */
export async function getSchoolLogo(): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return DEFAULT_LOGO;

    const [settings] = await db.select().from(dojoSettings).limit(1);
    return settings?.logoSquare || DEFAULT_LOGO;
  } catch (error) {
    console.error("Error fetching school logo:", error);
    return DEFAULT_LOGO;
  }
}

/**
 * Get school name from database settings
 */
export async function getSchoolName(): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return "DojoFlow";

    const [settings] = await db.select().from(dojoSettings).limit(1);
    return settings?.businessName || "DojoFlow";
  } catch (error) {
    console.error("Error fetching school name:", error);
    return "DojoFlow";
  }
}

/**
 * Wrap content in branded email template with school logo
 */
export async function wrapInEmailTemplate(
  content: string,
  options?: {
    showLogo?: boolean;
    showFooter?: boolean;
    backgroundColor?: string;
  }
): Promise<string> {
  const { showLogo = true, showFooter = true, backgroundColor = "#f5f5f5" } = options || {};
  
  const logoUrl = showLogo ? await getSchoolLogo() : null;
  const schoolName = await getSchoolName();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${schoolName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${backgroundColor};
      color: #333333;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .email-header {
      background-color: #ffffff;
      padding: 24px 32px;
      text-align: center;
      border-bottom: 1px solid #f0f0f0;
    }
    .email-logo {
      max-width: 120px;
      max-height: 60px;
      object-fit: contain;
    }
    .email-body {
      padding: 32px;
    }
    .email-footer {
      background-color: #fafafa;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #888888;
      border-top: 1px solid #f0f0f0;
    }
    .email-footer a {
      color: #dc2626;
      text-decoration: none;
    }
    h1, h2, h3 {
      color: #1a1a1a;
      margin-top: 0;
    }
    p {
      margin: 0 0 16px 0;
    }
    .button {
      display: inline-block;
      background-color: #dc2626;
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 16px 0;
    }
    .button:hover {
      background-color: #b91c1c;
    }
  </style>
</head>
<body>
  <div style="padding: 24px;">
    <div class="email-container">
      ${showLogo && logoUrl ? `
      <div class="email-header">
        <img src="${logoUrl}" alt="${schoolName}" class="email-logo" />
      </div>
      ` : ''}
      
      <div class="email-body">
        ${content}
      </div>
      
      ${showFooter ? `
      <div class="email-footer">
        <p>&copy; ${new Date().getFullYear()} ${schoolName}. All rights reserved.</p>
        <p>Powered by <a href="https://dojoflow.com">DojoFlow</a></p>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Create a simple notification email
 */
export async function createNotificationEmail(
  title: string,
  message: string,
  ctaText?: string,
  ctaUrl?: string
): Promise<string> {
  const content = `
    <h2 style="margin-bottom: 24px;">${title}</h2>
    <p>${message.replace(/\n/g, '<br>')}</p>
    ${ctaText && ctaUrl ? `
    <p style="text-align: center; margin-top: 24px;">
      <a href="${ctaUrl}" class="button">${ctaText}</a>
    </p>
    ` : ''}
  `;
  
  return wrapInEmailTemplate(content);
}

/**
 * Create a welcome email for new leads
 */
export async function createWelcomeEmail(
  firstName: string,
  businessName: string,
  bookingLink?: string
): Promise<string> {
  const content = `
    <h2 style="margin-bottom: 8px;">Welcome, ${firstName}! 👋</h2>
    <p style="color: #666; margin-bottom: 24px;">Thank you for your interest in ${businessName}</p>
    
    <p>We're excited to have you join our community! Our team is ready to help you get started on your journey.</p>
    
    <p>Here's what you can expect:</p>
    <ul style="padding-left: 20px; margin: 16px 0;">
      <li>A personalized introduction to our programs</li>
      <li>A tour of our facilities</li>
      <li>Answers to all your questions</li>
    </ul>
    
    ${bookingLink ? `
    <p style="text-align: center; margin-top: 24px;">
      <a href="${bookingLink}" class="button">Book Your Free Trial</a>
    </p>
    ` : ''}
    
    <p style="margin-top: 24px;">We look forward to meeting you!</p>
    <p style="color: #666;">– The ${businessName} Team</p>
  `;
  
  return wrapInEmailTemplate(content);
}

/**
 * Create a receipt/invoice email
 */
export async function createReceiptEmail(
  customerName: string,
  amount: string,
  description: string,
  date: string,
  invoiceNumber?: string
): Promise<string> {
  const content = `
    <h2 style="margin-bottom: 24px;">Payment Receipt</h2>
    
    <p>Hi ${customerName},</p>
    <p>Thank you for your payment. Here are the details:</p>
    
    <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
      ${invoiceNumber ? `<p style="margin: 0 0 8px 0;"><strong>Invoice #:</strong> ${invoiceNumber}</p>` : ''}
      <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${date}</p>
      <p style="margin: 0 0 8px 0;"><strong>Description:</strong> ${description}</p>
      <p style="margin: 0; font-size: 24px; color: #16a34a;"><strong>Amount Paid:</strong> ${amount}</p>
    </div>
    
    <p>If you have any questions about this payment, please don't hesitate to contact us.</p>
  `;
  
  return wrapInEmailTemplate(content);
}

/**
 * Create a reminder email
 */
export async function createReminderEmail(
  firstName: string,
  reminderTitle: string,
  reminderDetails: string,
  actionText?: string,
  actionUrl?: string
): Promise<string> {
  const content = `
    <h2 style="margin-bottom: 24px;">⏰ Reminder: ${reminderTitle}</h2>
    
    <p>Hi ${firstName},</p>
    <p>${reminderDetails.replace(/\n/g, '<br>')}</p>
    
    ${actionText && actionUrl ? `
    <p style="text-align: center; margin-top: 24px;">
      <a href="${actionUrl}" class="button">${actionText}</a>
    </p>
    ` : ''}
  `;
  
  return wrapInEmailTemplate(content);
}
