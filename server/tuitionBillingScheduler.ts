/**
 * Tuition Billing Scheduler
 *
 * Runs daily to automatically charge all active student billing enrollments
 * whose next_billing_date is today or overdue.
 *
 * For each due enrollment:
 *  1. Looks up the FluidPay API key for the org
 *  2. Charges the stored card via FluidPay vault
 *  3. Records the payment in student_tuition_payments
 *  4. Advances next_billing_date by the plan frequency
 *  5. Marks enrollment as past_due on failure (after 3 retries)
 */

import { getDb } from "./db";
import { chargeFluidPayCustomer } from "./services/fluidpay";
import { dojoSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface BillingRunResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: string[];
}

function calcNextBillingDate(frequency: string, from: Date = new Date()): Date {
  const next = new Date(from);
  switch (frequency) {
    case "weekly":    next.setDate(next.getDate() + 7);        break;
    case "biweekly":  next.setDate(next.getDate() + 14);       break;
    case "monthly":   next.setMonth(next.getMonth() + 1);      break;
    case "quarterly": next.setMonth(next.getMonth() + 3);      break;
    case "annual":    next.setFullYear(next.getFullYear() + 1); break;
    default:          next.setMonth(next.getMonth() + 1);      break;
  }
  return next;
}

async function rawQuery(db: any, sql: string, params: any[] = []): Promise<any[]> {
  // Use the underlying mysql2 pool ($client) for raw SQL execution
  // Drizzle's db.execute() expects a prepared statement object, not raw SQL
  const client = db.$client || db;
  const result = await client.execute(sql, params);
  return Array.isArray(result[0]) ? result[0] : (Array.isArray(result) ? result : []);
}

/**
 * Main billing run — called once per day by the scheduler.
 */
export async function processDueTuitionBilling(): Promise<BillingRunResult> {
  const result: BillingRunResult = { processed: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] };

  const db = await getDb();
  if (!db) {
    result.errors.push("Database not initialized");
    return result;
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999); // include anything due up to end of today
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  console.log(`[TuitionBilling] Starting daily billing run for ${todayStr}...`);

  // Fetch all active enrollments that are due today or overdue
  // Try with retry_count first; fall back to query without it if column doesn't exist yet
  let dueEnrollments: any[] = [];
  const baseQuery = `
      SELECT
        e.id            AS enrollment_id,
        e.student_id,
        e.organization_id,
        e.plan_id,
        e.fluidpay_customer_id,
        e.fluidpay_payment_method_id,
        e.card_last4,
        e.next_billing_date,
        p.name          AS plan_name,
        p.amount_cents,
        p.frequency,
        s.firstName AS first_name,
        s.lastName AS last_name
      FROM student_billing_enrollments e
      JOIN tuition_plans p ON e.plan_id = p.id
      JOIN students s ON e.student_id = s.id
      WHERE e.status = 'active'
        AND e.next_billing_date IS NOT NULL
        AND DATE(e.next_billing_date) <= ?
        AND e.fluidpay_customer_id IS NOT NULL
        AND e.fluidpay_payment_method_id IS NOT NULL
  `;
  try {
    // Try with retry_count column
    dueEnrollments = await rawQuery(db, baseQuery.replace(
      'e.next_billing_date,',
      'e.next_billing_date,\n        COALESCE(e.retry_count, 0) AS retry_count,'
    ), [todayStr]);
  } catch {
    try {
      // Fallback: query without retry_count (column may not exist yet)
      dueEnrollments = (await rawQuery(db, baseQuery, [todayStr])).map((r: any) => ({ ...r, retry_count: 0 }));
    } catch (err: any) {
      result.errors.push(`Failed to fetch due enrollments: ${err.message}`);
      return result;
    }
  }

  console.log(`[TuitionBilling] Found ${dueEnrollments.length} enrollment(s) due for billing`);

  // Cache FluidPay keys per org to avoid repeated DB lookups
  const fpKeyCache: Record<number, string | null> = {};

  for (const enrollment of dueEnrollments) {
    result.processed++;
    const studentName = `${enrollment.first_name} ${enrollment.last_name}`;
    const orgId: number = enrollment.organization_id;

    // Resolve FluidPay key for this org
    if (!(orgId in fpKeyCache)) {
      try {
        const settings = await db.select().from(dojoSettings).where(eq(dojoSettings.organizationId, orgId)).limit(1);
        fpKeyCache[orgId] = (settings[0] as any)?.fluidpayApiKey || null;
      } catch {
        fpKeyCache[orgId] = null;
      }
    }

    const fpKey = fpKeyCache[orgId];
    if (!fpKey) {
      console.warn(`[TuitionBilling] No FluidPay key for org ${orgId} — skipping ${studentName}`);
      result.skipped++;
      continue;
    }

    const amountCents: number = enrollment.amount_cents;
    const description = `Tuition - ${enrollment.plan_name} - ${studentName}`;

    // Insert pending payment record
    let paymentId: number | null = null;
    try {
      await rawQuery(db, `
        INSERT INTO student_tuition_payments
          (enrollment_id, student_id, organization_id, amount_cents, status, description)
        VALUES (?, ?, ?, ?, 'pending', ?)
      `, [enrollment.enrollment_id, enrollment.student_id, orgId, amountCents, description]);

      const rows = await rawQuery(db, `
        SELECT id FROM student_tuition_payments
        WHERE student_id = ? AND organization_id = ? AND status = 'pending'
        ORDER BY id DESC LIMIT 1
      `, [enrollment.student_id, orgId]);
      paymentId = rows[0]?.id || null;
    } catch (err: any) {
      console.error(`[TuitionBilling] Failed to create payment record for ${studentName}:`, err.message);
      result.errors.push(`Payment record error for ${studentName}: ${err.message}`);
      result.failed++;
      continue;
    }

    // Charge via FluidPay
    try {
      const chargeResult = await chargeFluidPayCustomer(
        fpKey,
        enrollment.fluidpay_customer_id,
        enrollment.fluidpay_payment_method_id,
        amountCents,
        description
      );

      if (chargeResult.success) {
        const now = new Date().toISOString().slice(0, 19);
        await rawQuery(db, `
          UPDATE student_tuition_payments
          SET status = 'success', fluidpay_transaction_id = ?, fluidpay_customer_id = ?, paid_at = ?
          WHERE id = ?
        `, [chargeResult.transactionId, enrollment.fluidpay_customer_id, now, paymentId]);

        const nextDate = calcNextBillingDate(enrollment.frequency);
        await rawQuery(db, `
          UPDATE student_billing_enrollments
          SET next_billing_date = ?, retry_count = 0
          WHERE id = ?
        `, [nextDate.toISOString().slice(0, 19), enrollment.enrollment_id]);

        console.log(`[TuitionBilling] ✅ Charged $${(amountCents / 100).toFixed(2)} for ${studentName} (txn: ${chargeResult.transactionId})`);
        result.succeeded++;
      } else {
        const retryCount = (enrollment.retry_count || 0) + 1;
        const newStatus = retryCount >= 3 ? 'past_due' : 'active';

        if (paymentId) {
          await rawQuery(db, `
            UPDATE student_tuition_payments
            SET status = 'failed', failure_reason = ?
            WHERE id = ?
          `, [chargeResult.error, paymentId]);
        }
        await rawQuery(db, `
          UPDATE student_billing_enrollments
          SET status = ?, retry_count = ?
          WHERE id = ?
        `, [newStatus, retryCount, enrollment.enrollment_id]);

        console.warn(`[TuitionBilling] ❌ Charge failed for ${studentName}: ${chargeResult.error} (retry ${retryCount}/3)`);
        result.errors.push(`${studentName}: ${chargeResult.error}`);
        result.failed++;
      }
    } catch (err: any) {
      console.error(`[TuitionBilling] Exception charging ${studentName}:`, err.message);
      result.errors.push(`Exception for ${studentName}: ${err.message}`);
      result.failed++;
    }
  }

  console.log(`[TuitionBilling] Daily run complete — processed: ${result.processed}, succeeded: ${result.succeeded}, failed: ${result.failed}, skipped: ${result.skipped}`);
  return result;
}
