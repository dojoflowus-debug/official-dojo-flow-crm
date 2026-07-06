/**
 * DojoFlow Mailer Service
 * Sends emails via Gmail SMTP (Nodemailer) with Twilio SMS as an optional channel.
 * Falls back to SendGrid if Gmail credentials are not set.
 */

import nodemailer from "nodemailer";

const GMAIL_FROM_EMAIL = process.env.GMAIL_FROM_EMAIL || "dojoflowus@gmail.com";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Build Gmail transporter once
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_FROM_EMAIL,
        pass: GMAIL_APP_PASSWORD,
      },
    });
  }
  return _transporter;
}

/**
 * Send email via Gmail SMTP (Nodemailer).
 * Falls back to SendGrid if Gmail credentials are absent.
 */
export async function sendMailGmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<void> {
  if (!GMAIL_APP_PASSWORD) {
    // Fallback to SendGrid
    const { sendEmail } = await import("./sendgrid.js");
    return sendEmail(to, subject, htmlContent, textContent);
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"DojoFlow" <${GMAIL_FROM_EMAIL}>`,
    to,
    subject,
    text: textContent,
    html: htmlContent,
  });

  console.log(`[Mailer] Email sent via Gmail SMTP to ${to}`);
}

/**
 * Send SMS via Twilio.
 */
export async function sendSms(to: string, body: string): Promise<void> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("[Mailer] Twilio credentials not configured — SMS not sent");
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  const params = new URLSearchParams({
    From: TWILIO_PHONE_NUMBER,
    To: to,
    Body: body,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Twilio SMS error: ${err}`);
  }

  console.log(`[Mailer] SMS sent via Twilio to ${to}`);
}

/**
 * Send a 6-digit verification code to a user.
 * Prefers SMS if a phone number is provided, otherwise sends email.
 */
export async function sendVerificationCode(
  code: string,
  opts: { email?: string; phone?: string; name?: string }
): Promise<void> {
  const { email, phone, name } = opts;
  const displayName = name || "there";

  if (phone && TWILIO_ACCOUNT_SID) {
    await sendSms(
      phone,
      `Hi ${displayName}, your DojoFlow verification code is: ${code}. It expires in 15 minutes.`
    );
    return;
  }

  if (email) {
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a12;color:#fff;border-radius:12px;">
        <h2 style="color:#e63946;margin-bottom:8px;">DojoFlow Email Verification</h2>
        <p style="color:#ccc;">Hi ${displayName},</p>
        <p style="color:#ccc;">Use the code below to verify your email address. It expires in <strong>15 minutes</strong>.</p>
        <div style="font-size:40px;font-weight:bold;letter-spacing:12px;text-align:center;padding:24px;background:#1a1a2e;border-radius:8px;margin:24px 0;color:#e63946;">${code}</div>
        <p style="color:#888;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#888;font-size:13px;">— The DojoFlow Team</p>
      </div>
    `;
    await sendMailGmail(email, "Your DojoFlow Verification Code", html, `Your verification code is: ${code}`);
    return;
  }

  throw new Error("sendVerificationCode: must provide either email or phone");
}
