/**
 * Credit Alert Service
 * 
 * Sends email notifications to org owners when their credit balance
 * falls below the configured low-credit threshold.
 * 
 * Uses a cooldown flag (lowCreditAlertSent) to prevent email spam:
 *   - 0 = alert not yet sent for current low-credit period
 *   - 1 = alert already sent; won't resend until balance is topped up and drops again
 */

import { getDb } from '../db';
import { aiCreditBalance, organizationUsers, users, organizations } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export type AlertLevel = 'warning' | 'critical';

/**
 * Check if a low-credit alert should fire and send it if so.
 * Called after every credit deduction.
 */
export async function checkAndSendCreditAlert(
  organizationId: number,
  newBalance: number
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Get the balance record with threshold and cooldown flag
    const [balanceRow] = await db
      .select({
        lowCreditThreshold: aiCreditBalance.lowCreditThreshold,
        lowCreditAlertSent: aiCreditBalance.lowCreditAlertSent,
      })
      .from(aiCreditBalance)
      .where(eq(aiCreditBalance.organizationId, organizationId))
      .limit(1);

    if (!balanceRow) return;

    const { lowCreditThreshold, lowCreditAlertSent } = balanceRow;

    // If balance is above threshold, reset the cooldown flag so future drops trigger alerts
    if (newBalance > lowCreditThreshold) {
      if (lowCreditAlertSent === 1) {
        await db
          .update(aiCreditBalance)
          .set({ lowCreditAlertSent: 0 })
          .where(eq(aiCreditBalance.organizationId, organizationId));
      }
      return;
    }

    // Balance is at or below threshold — check cooldown
    if (lowCreditAlertSent === 1) {
      // Already sent an alert for this low-credit period; skip
      return;
    }

    // Determine severity
    const alertLevel: AlertLevel = newBalance <= 10 ? 'critical' : 'warning';

    // Get org owner email
    const ownerEmail = await getOrgOwnerEmail(organizationId);
    if (!ownerEmail) {
      console.warn(`[CreditAlert] No owner email found for org ${organizationId}`);
      return;
    }

    // Get org name
    const [orgRow] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);
    const orgName = orgRow?.name || 'Your Organization';

    // Send the email
    await sendLowCreditEmail({
      to: ownerEmail,
      orgName,
      currentBalance: newBalance,
      threshold: lowCreditThreshold,
      alertLevel,
    });

    // Mark alert as sent (cooldown)
    await db
      .update(aiCreditBalance)
      .set({ lowCreditAlertSent: 1 })
      .where(eq(aiCreditBalance.organizationId, organizationId));

    console.log(`[CreditAlert] ${alertLevel} alert sent to ${ownerEmail.email} for org ${organizationId}. Balance: ${newBalance}/${lowCreditThreshold}`);
  } catch (error) {
    console.error('[CreditAlert] Error checking/sending credit alert:', error);
  }
}

/**
 * Get the primary owner's email for an organization
 */
async function getOrgOwnerEmail(organizationId: number): Promise<{ email: string; name: string } | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const rows = await db
      .select({
        email: users.email,
        name: users.name,
        displayName: users.displayName,
      })
      .from(organizationUsers)
      .innerJoin(users, eq(organizationUsers.userId, users.id))
      .where(
        and(
          eq(organizationUsers.organizationId, organizationId),
          eq(organizationUsers.isPrimary, 1)
        )
      )
      .limit(1);

    if (!rows.length || !rows[0].email) return null;

    return {
      email: rows[0].email,
      name: rows[0].displayName || rows[0].name || 'School Owner',
    };
  } catch (error) {
    console.error('[CreditAlert] Error fetching owner email:', error);
    return null;
  }
}

/**
 * Send the low-credit alert email via SendGrid
 */
async function sendLowCreditEmail(params: {
  to: { email: string; name: string };
  orgName: string;
  currentBalance: number;
  threshold: number;
  alertLevel: AlertLevel;
}): Promise<void> {
  const { to, orgName, currentBalance, threshold, alertLevel } = params;

  const isCritical = alertLevel === 'critical';
  const subject = isCritical
    ? `🚨 Critical: Your DojoFlow credits are almost gone (${currentBalance} left)`
    : `⚠️ Low Credits Alert: ${currentBalance} credits remaining in DojoFlow`;

  const accentColor = isCritical ? '#ef4444' : '#f59e0b';
  const badgeText = isCritical ? 'CRITICAL' : 'WARNING';
  const headerText = isCritical
    ? 'Your credits are critically low!'
    : 'Your credit balance is running low';
  const bodyText = isCritical
    ? `Your <strong>${orgName}</strong> account has only <strong>${currentBalance} credits</strong> remaining. AI features (Kai chat, SMS, email) will stop working when your balance reaches zero.`
    : `Your <strong>${orgName}</strong> account has <strong>${currentBalance} credits</strong> remaining — below your alert threshold of ${threshold}. Consider topping up soon to keep AI features running smoothly.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a1a 0%,#2a1a1a 100%);padding:32px 40px;border-bottom:1px solid #2a2a2a;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:white;letter-spacing:-0.5px;">⚡ DojoFlow</span>
                  </td>
                  <td align="right">
                    <span style="background-color:${accentColor};color:white;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;letter-spacing:1px;">${badgeText}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px 0;font-size:24px;font-weight:700;color:white;line-height:1.3;">${headerText}</h1>
              <p style="margin:0 0 28px 0;font-size:15px;color:#a0a0a0;line-height:1.6;">${bodyText}</p>
              
              <!-- Balance Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;border-radius:12px;border:1px solid ${accentColor}33;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;" align="center">
                    <p style="margin:0 0 8px 0;font-size:12px;color:#666;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Current Balance</p>
                    <p style="margin:0;font-size:48px;font-weight:800;color:${accentColor};line-height:1;">${currentBalance}</p>
                    <p style="margin:4px 0 0 0;font-size:13px;color:#666;">credits remaining</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="https://dojo-flow.ai" style="display:inline-block;background-color:#ef4444;color:white;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
                      Top Up Credits Now →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Credit Costs Reference -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;border-radius:10px;border:1px solid #2a2a2a;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 14px 0;font-size:12px;color:#666;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Credit Costs</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#a0a0a0;">💬 Kai Chat Message</td>
                        <td align="right" style="font-size:13px;color:white;font-weight:600;">1 credit</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#a0a0a0;">📱 SMS Message</td>
                        <td align="right" style="font-size:13px;color:white;font-weight:600;">5 credits</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#a0a0a0;">📧 Email</td>
                        <td align="right" style="font-size:13px;color:white;font-weight:600;">3 credits</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#a0a0a0;">📞 Voice Call (per min)</td>
                        <td align="right" style="font-size:13px;color:white;font-weight:600;">10 credits</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
                You're receiving this because your credit balance dropped below your alert threshold of <strong style="color:#888;">${threshold} credits</strong>. 
                You can adjust this threshold in your <a href="https://dojo-flow.ai" style="color:#ef4444;text-decoration:none;">Billing Settings</a>.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #2a2a2a;">
              <p style="margin:0;font-size:12px;color:#444;text-align:center;">
                DojoFlow · The operating system for every studio, gym, and school.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@dojo-flow.ai';
  const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'DojoFlow';

  if (!SENDGRID_API_KEY) {
    console.warn('[CreditAlert] SENDGRID_API_KEY not set — skipping email');
    return;
  }

  const payload = {
    personalizations: [{ to: [{ email: to.email, name: to.name }], subject }],
    from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
    content: [
      { type: 'text/plain', value: `${headerText}\n\nCurrent balance: ${currentBalance} credits\nThreshold: ${threshold} credits\n\nTop up at https://dojo-flow.ai` },
      { type: 'text/html', value: html },
    ],
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[CreditAlert] SendGrid error ${response.status}:`, errText);
  }
}
