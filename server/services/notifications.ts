/**
 * Notification Service
 * Handles SMS (Twilio) and Email (SendGrid/SMTP) notifications for leads and staff
 */

import { getDb } from "../db";
import { dojoSettings } from "../../drizzle/schema";
import { triggerAutomation } from "./automationEngine";
import { wrapInEmailTemplate, getSchoolLogo, getSchoolName } from "./emailTemplate";

// Industry-specific templates
const SMS_TEMPLATES = {
  martial_arts: (firstName: string, businessName: string, bookingLink: string) =>
    `Hey ${firstName}! This is Kai from ${businessName}.\nThanks for reaching out about our martial arts programs. 👊\nTap here to schedule your free intro class: ${bookingLink}\nI can answer any questions you have.\n(Reply STOP to opt out.)`,
  
  fitness: (firstName: string, businessName: string, bookingLink: string) =>
    `Hey ${firstName}! Kai here from ${businessName}.\nReady to jump into your fitness journey? 💪\nBook your free intro workout here: ${bookingLink}\nText me if you want help choosing a program.`,
  
  yoga: (firstName: string, businessName: string, bookingLink: string) =>
    `Hi ${firstName} 🌿 This is Kai from ${businessName}.\nThank you for your interest in our yoga classes.\nYou can schedule your first class here: ${bookingLink}\nLet me know if you'd like recommendations for class types.`,
  
  pilates: (firstName: string, businessName: string, bookingLink: string) =>
    `Hey ${firstName}! This is Kai from ${businessName}.\nThanks for checking out our Pilates/Barre programs.\nBook your intro session here: ${bookingLink}\nNeed help picking a reformer/level? Just ask!`,
  
  other: (firstName: string, businessName: string, bookingLink: string) =>
    `Hey ${firstName}! This is Kai from ${businessName}.\nThanks for reaching out about our programs.\nTap here to book your free intro session: ${bookingLink}\nI can answer any questions you have.\n(Reply STOP to opt out.)`,
};

const EMAIL_TEMPLATES = {
  martial_arts: {
    subject: (businessName: string) => `Welcome to ${businessName} – Let's schedule your intro lesson!`,
    body: (firstName: string, businessName: string, bookingLink: string, phone: string, website: string) => `
Hi ${firstName},

Thanks for your interest in our martial arts program at ${businessName}. I'm Kai, your virtual assistant, and I'll help you get started.

**Book your intro class:**
👉 ${bookingLink}

During your visit, you'll get:
• A friendly introductory lesson
• A tour of the school
• A breakdown of our belt progression
• Answers to all your questions

Reply to this email anytime, I'm here to help.

– Kai
On behalf of ${businessName}
${phone}${website ? ` | ${website}` : ''}

If you received this by mistake, you can ignore it or reply "REMOVE" and we'll stop contacting you.
    `.trim(),
  },
  
  fitness: {
    subject: () => `Your fitness journey starts here!`,
    body: (firstName: string, businessName: string, bookingLink: string, phone: string, website: string) => `
Hi ${firstName},

Thanks for reaching out to ${businessName}! I'll help you get set up with your first workout.

**Schedule your intro session:**
👉 ${bookingLink}

What to expect:
• Goal consultation
• Training recommendations
• A beginner-friendly workout

Reply anytime if you need help choosing the right program.

– Kai
On behalf of ${businessName}
${phone}${website ? ` | ${website}` : ''}
    `.trim(),
  },
  
  yoga: {
    subject: (businessName: string) => `Welcome to ${businessName} – Your first yoga class awaits 🌱`,
    body: (firstName: string, businessName: string, bookingLink: string, phone: string, website: string) => `
Hi ${firstName},

Thanks for your interest in our yoga studio. I'm Kai, and I'll help you get started.

**Book your first class:**
👉 ${bookingLink}

What to expect:
• A relaxing, welcoming environment
• Options for beginners
• Guidance from mindful instructors

Reply anytime if you want class recommendations.

– Kai
On behalf of ${businessName}
${phone}${website ? ` | ${website}` : ''}
    `.trim(),
  },
  
  pilates: {
    subject: (businessName: string) => `Your first class at ${businessName} is ready to book!`,
    body: (firstName: string, businessName: string, bookingLink: string, phone: string, website: string) => `
Hi ${firstName},

Thank you for your interest in our Pilates/Barre programs at ${businessName}. I'm here to help guide you.

**Schedule your intro session:**
👉 ${bookingLink}

What you can expect:
• A full-body, low-impact workout
• Reformer or mat options
• Guidance tailored to your level

Reply to this email anytime.

– Kai
On behalf of ${businessName}
${phone}${website ? ` | ${website}` : ''}
    `.trim(),
  },
  
  other: {
    subject: (businessName: string) => `Welcome to ${businessName}! Let's get your first class scheduled.`,
    body: (firstName: string, businessName: string, bookingLink: string, phone: string, website: string) => `
Hi ${firstName},

Thanks for reaching out to ${businessName}. I'm Kai, your virtual assistant, and I'll help you get started.

**Next step: schedule your intro session**
Click here to pick a time that works for you:
${bookingLink}

What to expect:
• A quick tour of the studio
• Time to ask questions about pricing, schedule & level
• A friendly, beginner-friendly first class or consultation

If you prefer, you can just reply to this email with your availability, and we'll take care of the rest.

Talk soon,
Kai
On behalf of ${businessName}
${phone}${website ? ` | ${website}` : ''}

If you received this by mistake, you can ignore it or reply "REMOVE" and we'll stop contacting you.
    `.trim(),
  },
};

/**
 * Send SMS via Twilio
 */
async function sendSMS(to: string, body: string, twilioConfig: { accountSid: string; authToken: string; phoneNumber: string }) {
  try {
    const { accountSid, authToken, phoneNumber } = twilioConfig;
    
    // Twilio API endpoint
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Basic auth
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: phoneNumber,
        Body: body,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[Twilio] SMS send failed:', error);
      throw new Error(`Twilio API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[Twilio] SMS sent successfully:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('[Twilio] Error sending SMS:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send Email via SendGrid with branded HTML template
 */
async function sendEmailSendGrid(to: string, subject: string, body: string, from: string, apiKey: string, useHtmlTemplate: boolean = true) {
  try {
    // Wrap plain text in branded HTML template with school logo
    let htmlContent = body;
    if (useHtmlTemplate) {
      htmlContent = await wrapInEmailTemplate(
        body.replace(/\n/g, '<br>'),
        { showLogo: true, showFooter: true }
      );
    }
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from },
        subject,
        content: [
          { type: 'text/plain', value: body },
          { type: 'text/html', value: htmlContent }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[SendGrid] Email send failed:', error);
      throw new Error(`SendGrid API error: ${response.status}`);
    }
    
    console.log('[SendGrid] Email sent successfully to:', to);
    return { success: true };
  } catch (error) {
    console.error('[SendGrid] Error sending email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get dojo settings for notifications
 */
async function getDojoSettings() {
  const db = await getDb();
  const [settings] = await db.select().from(dojoSettings).limit(1);
  return settings;
}

/**
 * Send welcome SMS to new lead
 */
export async function sendLeadWelcomeSMS(leadData: {
  firstName: string;
  phone: string;
}) {
  const settings = await getDojoSettings();
  
  if (!settings) {
    console.log('[Notifications] No dojo settings found');
    return { success: false, error: 'No settings configured' };
  }
  
  // Check if SMS is enabled
  if (!settings.enableSmsForLeads || !settings.twilioAccountSid || !settings.twilioAuthToken || !settings.twilioPhoneNumber) {
    console.log('[Notifications] SMS not configured or disabled');
    return { success: false, error: 'SMS not configured' };
  }
  
  // Get industry-specific template
  const industry = settings.industry || 'other';
  const bookingLink = settings.bookingLink || 'https://example.com/book';
  const businessName = settings.businessName || 'Our Studio';
  
  const smsBody = SMS_TEMPLATES[industry](leadData.firstName, businessName, bookingLink);
  
  return await sendSMS(leadData.phone, smsBody, {
    accountSid: settings.twilioAccountSid,
    authToken: settings.twilioAuthToken,
    phoneNumber: settings.twilioPhoneNumber,
  });
}

/**
 * Send welcome email to new lead
 */
export async function sendLeadWelcomeEmail(leadData: {
  firstName: string;
  email: string;
}) {
  const settings = await getDojoSettings();
  
  if (!settings) {
    return { success: false, error: 'No settings configured' };
  }
  
  // Check if email is enabled
  if (!settings.enableEmailForLeads || !settings.senderEmail) {
    console.log('[Notifications] Email not configured or disabled');
    return { success: false, error: 'Email not configured' };
  }
  
  // Get industry-specific template
  const industry = settings.industry || 'other';
  const bookingLink = settings.bookingLink || 'https://example.com/book';
  const businessName = settings.businessName || 'Our Studio';
  const phone = settings.contactPhone || '';
  const website = settings.website || '';
  
  const template = EMAIL_TEMPLATES[industry];
  const subject = template.subject(businessName);
  const body = template.body(leadData.firstName, businessName, bookingLink, phone, website);
  
  // SendGrid
  if (settings.emailProvider === 'sendgrid' && settings.sendgridApiKey) {
    return await sendEmailSendGrid(leadData.email, subject, body, settings.senderEmail, settings.sendgridApiKey);
  }
  
  // SMTP not implemented yet
  console.log('[Notifications] SMTP not implemented');
  return { success: false, error: 'SMTP not implemented' };
}

/**
 * Send staff notification about new lead
 */
export async function sendStaffNotification(leadData: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source?: string;
  leadId: number;
}) {
  const settings = await getDojoSettings();
  
  if (!settings || !settings.notifyStaffOnNewLead) {
    console.log('[Notifications] Staff notifications disabled');
    return { success: false, error: 'Staff notifications disabled' };
  }
  
  const businessName = settings.businessName || 'DojoFlow';
  const method = settings.staffNotificationMethod || 'both';
  
  // Staff SMS
  if ((method === 'sms' || method === 'both') && settings.staffNotificationPhone && settings.twilioAccountSid) {
    const smsBody = `New lead for ${businessName}!
Name: ${leadData.firstName} ${leadData.lastName}
Phone: ${leadData.phone || 'N/A'}
Source: ${leadData.source || 'Unknown'}
Status: New Lead
View: https://app.dojoflow.com/leads/${leadData.leadId}`;
    
    await sendSMS(settings.staffNotificationPhone, smsBody, {
      accountSid: settings.twilioAccountSid,
      authToken: settings.twilioAuthToken!,
      phoneNumber: settings.twilioPhoneNumber!,
    });
  }
  
  // Staff Email
  if ((method === 'email' || method === 'both') && settings.staffNotificationEmail && settings.senderEmail) {
    const subject = `New Lead – ${leadData.firstName} ${leadData.lastName} from ${leadData.source || 'Unknown'}`;
    const body = `A new lead just entered your pipeline in DojoFlow.

Name: ${leadData.firstName} ${leadData.lastName}
Phone: ${leadData.phone || 'N/A'}
Email: ${leadData.email || 'N/A'}
Source: ${leadData.source || 'Unknown'}

You can view and update this lead here:
https://app.dojoflow.com/leads/${leadData.leadId}

Kai has already sent a confirmation message to the lead and will handle initial follow-ups based on your automation rules.`;
    
    if (settings.emailProvider === 'sendgrid' && settings.sendgridApiKey) {
      await sendEmailSendGrid(settings.staffNotificationEmail, subject, body, settings.senderEmail, settings.sendgridApiKey);
    }
  }
  
  return { success: true };
}

/**
 * Main function to handle all notifications for a new lead
 */
export async function notifyNewLead(leadData: {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source?: string;
}) {
  const results = {
    leadSms: { success: false },
    leadEmail: { success: false },
    staffNotification: { success: false },
  };
  
  // Send SMS to lead
  if (leadData.phone) {
    results.leadSms = await sendLeadWelcomeSMS({
      firstName: leadData.firstName,
      phone: leadData.phone,
    });
  }
  
  // Send email to lead
  if (leadData.email) {
    results.leadEmail = await sendLeadWelcomeEmail({
      firstName: leadData.firstName,
      email: leadData.email,
    });
  }
  
  // Notify staff
  results.staffNotification = await sendStaffNotification({
    firstName: leadData.firstName,
    lastName: leadData.lastName,
    email: leadData.email,
    phone: leadData.phone,
    source: leadData.source,
    leadId: leadData.id,
  });
  
  // Trigger automation for new lead
  try {
    await triggerAutomation("new_lead", "lead", leadData.id);
  } catch (error) {
    console.error("[Notifications] Error triggering automation:", error);
  }
  
  return results;
}
