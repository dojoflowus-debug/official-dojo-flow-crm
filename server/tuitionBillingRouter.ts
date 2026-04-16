/**
 * Tuition Billing Router
 * Handles tuition plans, student billing enrollments, and FluidPay payment collection.
 * Supports both UI-driven and Kai-driven enrollment and charging.
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { dojoSettings, students } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  createFluidPayCustomer,
  addCardToFluidPayCustomer,
  chargeFluidPayCustomer,
  getFluidPayTokenizerKey,
} from "./services/fluidpay";
import type { TrpcContext } from "./_core/context";
import type { Database } from "./db";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resolveOrgId(ctx: TrpcContext, db: Database): Promise<number | null> {
  if (ctx.currentOrganizationId) return ctx.currentOrganizationId;
  if (!ctx.user) return null;
  try {
    const { organizationUsers } = await import('../drizzle/schema');
    const memberships = await db
      .select({ organizationId: organizationUsers.organizationId })
      .from(organizationUsers)
      .where(eq(organizationUsers.userId, ctx.user.id))
      .limit(1);
    return memberships.length > 0 ? memberships[0].organizationId : null;
  } catch {
    return null;
  }
}

async function getFluidPayKey(db: Database, orgId: number): Promise<string | null> {
  const settings = await db.select().from(dojoSettings).where(eq(dojoSettings.organizationId, orgId)).limit(1);
  return (settings[0] as any)?.fluidpayApiKey || null;
}

async function rawQuery(db: Database, sql: string, params: any[] = []): Promise<any[]> {
  const result = await (db as any).execute(sql, params);
  return Array.isArray(result[0]) ? result[0] : (Array.isArray(result) ? result : []);
}

function calcNextBillingDate(frequency: string, from: Date = new Date()): Date {
  const next = new Date(from);
  switch (frequency) {
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'biweekly': next.setDate(next.getDate() + 14); break;
    case 'monthly': next.setMonth(next.getMonth() + 1); break;
    case 'quarterly': next.setMonth(next.getMonth() + 3); break;
    case 'annual': next.setFullYear(next.getFullYear() + 1); break;
  }
  return next;
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const tuitionBillingRouter = router({

  // ── Tuition Plans ──────────────────────────────────────────────────────────

  listTuitionPlans: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) return [];
      const plans = await rawQuery(db,
        `SELECT * FROM tuition_plans WHERE organization_id = ? AND is_active = 1 ORDER BY amount_cents ASC`,
        [orgId]
      );
      return plans.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        amountCents: p.amount_cents,
        amountDollars: p.amount_cents / 100,
        frequency: p.frequency,
        isActive: p.is_active === 1,
        createdAt: p.created_at,
      }));
    }),

  createTuitionPlan: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      amountDollars: z.number().positive(),
      frequency: z.enum(["monthly", "weekly", "biweekly", "quarterly", "annual", "one_time"]).default("monthly"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) throw new Error("No organization found");
      const amountCents = Math.round(input.amountDollars * 100);
      await rawQuery(db,
        `INSERT INTO tuition_plans (organization_id, name, description, amount_cents, frequency) VALUES (?, ?, ?, ?, ?)`,
        [orgId, input.name, input.description || null, amountCents, input.frequency]
      );
      const plans = await rawQuery(db,
        `SELECT * FROM tuition_plans WHERE organization_id = ? ORDER BY id DESC LIMIT 1`,
        [orgId]
      );
      const plan = plans[0];
      return { success: true, plan: { ...plan, amountDollars: plan.amount_cents / 100 } };
    }),

  updateTuitionPlan: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      amountDollars: z.number().positive().optional(),
      frequency: z.enum(["monthly", "weekly", "biweekly", "quarterly", "annual", "one_time"]).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) throw new Error("No organization found");
      const updates: string[] = [];
      const params: any[] = [];
      if (input.name) { updates.push("name = ?"); params.push(input.name); }
      if (input.description !== undefined) { updates.push("description = ?"); params.push(input.description); }
      if (input.amountDollars) { updates.push("amount_cents = ?"); params.push(Math.round(input.amountDollars * 100)); }
      if (input.frequency) { updates.push("frequency = ?"); params.push(input.frequency); }
      if (input.isActive !== undefined) { updates.push("is_active = ?"); params.push(input.isActive ? 1 : 0); }
      if (updates.length === 0) return { success: true };
      params.push(input.id, orgId);
      await rawQuery(db, `UPDATE tuition_plans SET ${updates.join(", ")} WHERE id = ? AND organization_id = ?`, params);
      return { success: true };
    }),

  deleteTuitionPlan: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) throw new Error("No organization found");
      await rawQuery(db,
        `UPDATE tuition_plans SET is_active = 0 WHERE id = ? AND organization_id = ?`,
        [input.id, orgId]
      );
      return { success: true };
    }),

  // ── Student Billing Enrollment ─────────────────────────────────────────────

  enrollStudentInPlan: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      planId: z.number(),
      startDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) throw new Error("No organization found");

      const studentRows = await db.select().from(students)
        .where(and(eq(students.id, input.studentId), eq(students.organizationId as any, orgId)))
        .limit(1);
      if (!studentRows.length) throw new Error("Student not found");

      const plans = await rawQuery(db,
        `SELECT * FROM tuition_plans WHERE id = ? AND organization_id = ? AND is_active = 1`,
        [input.planId, orgId]
      );
      if (!plans.length) throw new Error("Tuition plan not found");
      const plan = plans[0];

      const startDate = input.startDate ? new Date(input.startDate) : new Date();
      const nextBillingDate = calcNextBillingDate(plan.frequency, startDate);

      const existing = await rawQuery(db,
        `SELECT id FROM student_billing_enrollments WHERE student_id = ? AND plan_id = ? AND status = 'active'`,
        [input.studentId, input.planId]
      );
      if (existing.length > 0) {
        return { success: false, error: "Student is already enrolled in this plan" };
      }

      await rawQuery(db,
        `INSERT INTO student_billing_enrollments (student_id, organization_id, plan_id, status, start_date, next_billing_date, notes)
         VALUES (?, ?, ?, 'active', ?, ?, ?)`,
        [input.studentId, orgId, input.planId,
          startDate.toISOString().slice(0, 19),
          nextBillingDate.toISOString().slice(0, 19),
          input.notes || null]
      );

      const student = studentRows[0];
      return {
        success: true,
        message: `${student.firstName} ${student.lastName} enrolled in "${plan.name}" ($${(plan.amount_cents / 100).toFixed(2)}/${plan.frequency})`,
        planName: plan.name,
        amountDollars: plan.amount_cents / 100,
        frequency: plan.frequency,
        nextBillingDate: nextBillingDate.toISOString().slice(0, 10),
      };
    }),

  getStudentBillingStatus: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) return { enrollments: [], payments: [] };

      const enrollments = await rawQuery(db,
        `SELECT e.*, p.name as plan_name, p.amount_cents, p.frequency
         FROM student_billing_enrollments e
         JOIN tuition_plans p ON e.plan_id = p.id
         WHERE e.student_id = ? AND e.organization_id = ?
         ORDER BY e.created_at DESC`,
        [input.studentId, orgId]
      );

      const payments = await rawQuery(db,
        `SELECT * FROM student_tuition_payments
         WHERE student_id = ? AND organization_id = ?
         ORDER BY created_at DESC LIMIT 100`,
        [input.studentId, orgId]
      );

      // Compute retry counts per enrollment: count consecutive failed attempts before each success or current state
      const retryCounts: Record<number, number> = {};
      const lastDeclinedAt: Record<number, string | null> = {};
      for (const p of payments as any[]) {
        const eid = p.enrollment_id;
        if (p.status === 'failed' || p.status === 'declined') {
          retryCounts[eid] = (retryCounts[eid] || 0) + 1;
          if (!lastDeclinedAt[eid]) lastDeclinedAt[eid] = p.created_at;
        }
      }

      return {
        enrollments: enrollments.map((e: any) => ({
          id: e.id,
          planId: e.plan_id,
          planName: e.plan_name,
          amountDollars: e.amount_cents / 100,
          frequency: e.frequency,
          status: e.status,
          startDate: e.start_date,
          nextBillingDate: e.next_billing_date,
          hasCard: !!(e.fluidpay_customer_id && e.fluidpay_payment_method_id),
          cardLast4: e.card_last4,
          cardBrand: e.card_brand,
          fluidpayCustomerId: e.fluidpay_customer_id,
          fluidpayPaymentMethodId: e.fluidpay_payment_method_id,
          retryCount: retryCounts[e.id] || 0,
          lastDeclinedAt: lastDeclinedAt[e.id] || null,
        })),
        payments: payments.map((p: any) => ({
          id: p.id,
          enrollmentId: p.enrollment_id,
          amountDollars: p.amount_cents / 100,
          status: p.status,
          description: p.description,
          paidAt: p.paid_at,
          createdAt: p.created_at,
          declinedAt: (p.status === 'failed' || p.status === 'declined') ? p.created_at : null,
          fluidpayTransactionId: p.fluidpay_transaction_id,
          failureReason: p.failure_reason,
        })),
      };
    }),

  // ── Card Collection ────────────────────────────────────────────────────────

  getTokenizerKey: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) throw new Error("No organization found");
      const fpKey = await getFluidPayKey(db, orgId);
      if (!fpKey) return { error: "FluidPay not connected for this organization" };
      const result = await getFluidPayTokenizerKey(fpKey);
      return result;
    }),

  saveStudentCard: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      enrollmentId: z.number().optional(),
      cardToken: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) throw new Error("No organization found");
      const fpKey = await getFluidPayKey(db, orgId);
      if (!fpKey) throw new Error("FluidPay not connected");

      const studentRows = await db.select().from(students)
        .where(and(eq(students.id, input.studentId), eq(students.organizationId as any, orgId)))
        .limit(1);
      if (!studentRows.length) throw new Error("Student not found");
      const student = studentRows[0];

      const customerResult = await createFluidPayCustomer(fpKey, {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email || undefined,
        phone: student.phone || undefined,
      });
      if (!customerResult.customerId) {
        throw new Error(customerResult.error || "Failed to create customer vault");
      }

      const cardResult = await addCardToFluidPayCustomer(fpKey, customerResult.customerId, input.cardToken);
      if (!cardResult.paymentMethodId) {
        throw new Error(cardResult.error || "Failed to save card");
      }

      if (input.enrollmentId) {
        await rawQuery(db,
          `UPDATE student_billing_enrollments
           SET fluidpay_customer_id = ?, fluidpay_payment_method_id = ?, card_last4 = ?, card_brand = ?
           WHERE id = ? AND organization_id = ?`,
          [customerResult.customerId, cardResult.paymentMethodId, cardResult.last4 || null, cardResult.cardBrand || null, input.enrollmentId, orgId]
        );
      } else {
        await rawQuery(db,
          `UPDATE student_billing_enrollments
           SET fluidpay_customer_id = ?, fluidpay_payment_method_id = ?, card_last4 = ?, card_brand = ?
           WHERE student_id = ? AND organization_id = ? AND status = 'active'`,
          [customerResult.customerId, cardResult.paymentMethodId, cardResult.last4 || null, cardResult.cardBrand || null, input.studentId, orgId]
        );
      }

      return {
        success: true,
        customerId: customerResult.customerId,
        paymentMethodId: cardResult.paymentMethodId,
        last4: cardResult.last4,
        cardBrand: cardResult.cardBrand,
        message: `Card ending in ${cardResult.last4} saved successfully`,
      };
    }),

  // ── Charging ───────────────────────────────────────────────────────────────

  chargeStudentTuition: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      enrollmentId: z.number().optional(),
      amountDollars: z.number().positive().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) throw new Error("No organization found");
      const fpKey = await getFluidPayKey(db, orgId);
      if (!fpKey) throw new Error("FluidPay not connected. Please connect FluidPay in Settings first.");

      const studentRows = await db.select().from(students)
        .where(and(eq(students.id, input.studentId), eq(students.organizationId as any, orgId)))
        .limit(1);
      if (!studentRows.length) throw new Error("Student not found");
      const student = studentRows[0];

      let enrollmentQuery = `
        SELECT e.*, p.name as plan_name, p.amount_cents, p.frequency
        FROM student_billing_enrollments e
        JOIN tuition_plans p ON e.plan_id = p.id
        WHERE e.student_id = ? AND e.organization_id = ? AND e.status = 'active'
      `;
      const enrollmentParams: any[] = [input.studentId, orgId];
      if (input.enrollmentId) {
        enrollmentQuery += ' AND e.id = ?';
        enrollmentParams.push(input.enrollmentId);
      }
      enrollmentQuery += ' ORDER BY e.created_at DESC LIMIT 1';

      const enrollments = await rawQuery(db, enrollmentQuery, enrollmentParams);
      if (!enrollments.length) {
        throw new Error(`${student.firstName} ${student.lastName} has no active billing enrollment. Please enroll them in a tuition plan first.`);
      }
      const enrollment = enrollments[0];

      if (!enrollment.fluidpay_customer_id || !enrollment.fluidpay_payment_method_id) {
        throw new Error(`No card on file for ${student.firstName} ${student.lastName}. Please add a payment method first.`);
      }

      const amountCents = input.amountDollars
        ? Math.round(input.amountDollars * 100)
        : enrollment.amount_cents;
      const description = input.description || `Tuition - ${enrollment.plan_name} - ${student.firstName} ${student.lastName}`;

      // Create pending payment record
      await rawQuery(db,
        `INSERT INTO student_tuition_payments (enrollment_id, student_id, organization_id, amount_cents, status, description)
         VALUES (?, ?, ?, ?, 'pending', ?)`,
        [enrollment.id, input.studentId, orgId, amountCents, description]
      );
      const paymentRecords = await rawQuery(db,
        `SELECT id FROM student_tuition_payments WHERE student_id = ? AND organization_id = ? ORDER BY id DESC LIMIT 1`,
        [input.studentId, orgId]
      );
      const paymentId = paymentRecords[0]?.id;

      // Charge via FluidPay
      const chargeResult = await chargeFluidPayCustomer(
        fpKey,
        enrollment.fluidpay_customer_id,
        enrollment.fluidpay_payment_method_id,
        amountCents,
        description
      );

      if (chargeResult.success) {
        const now = new Date().toISOString().slice(0, 19);
        await rawQuery(db,
          `UPDATE student_tuition_payments
           SET status = 'success', fluidpay_transaction_id = ?, fluidpay_customer_id = ?, paid_at = ?
           WHERE id = ?`,
          [chargeResult.transactionId, enrollment.fluidpay_customer_id, now, paymentId]
        );
        const nextBilling = calcNextBillingDate(enrollment.frequency);
        await rawQuery(db,
          `UPDATE student_billing_enrollments SET next_billing_date = ? WHERE id = ?`,
          [nextBilling.toISOString().slice(0, 19), enrollment.id]
        );
        return {
          success: true,
          transactionId: chargeResult.transactionId,
          amountDollars: amountCents / 100,
          studentName: `${student.firstName} ${student.lastName}`,
          planName: enrollment.plan_name,
          message: `✅ $${(amountCents / 100).toFixed(2)} charged successfully to ${student.firstName} ${student.lastName}'s card ending in ${enrollment.card_last4}. Transaction ID: ${chargeResult.transactionId}`,
        };
      } else {
        if (paymentId) {
          await rawQuery(db,
            `UPDATE student_tuition_payments SET status = 'failed', failure_reason = ? WHERE id = ?`,
            [chargeResult.error, paymentId]
          );
          await rawQuery(db,
            `UPDATE student_billing_enrollments SET status = 'past_due' WHERE id = ?`,
            [enrollment.id]
          );
        }
        throw new Error(`Payment failed for ${student.firstName} ${student.lastName}: ${chargeResult.error}`);
      }
    }),

  // ── Org-wide billing overview ──────────────────────────────────────────────

  getBillingOverview: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) return { totalEnrolled: 0, totalPlans: 0, monthlyRevenueDollars: 0, recentPayments: [] };

      const statsRows = await rawQuery(db,
        `SELECT
           COUNT(DISTINCT e.student_id) as total_enrolled,
           SUM(CASE WHEN e.status = 'active' THEN p.amount_cents ELSE 0 END) as monthly_revenue_cents
         FROM student_billing_enrollments e
         JOIN tuition_plans p ON e.plan_id = p.id
         WHERE e.organization_id = ?`,
        [orgId]
      );
      const stats = statsRows[0] || {};

      const planCountRows = await rawQuery(db,
        `SELECT COUNT(*) as count FROM tuition_plans WHERE organization_id = ? AND is_active = 1`,
        [orgId]
      );

      const recentPayments = await rawQuery(db,
        `SELECT stp.*, s.first_name, s.last_name
         FROM student_tuition_payments stp
         JOIN students s ON stp.student_id = s.id
         WHERE stp.organization_id = ? AND stp.status = 'success'
         ORDER BY stp.paid_at DESC LIMIT 10`,
        [orgId]
      );

      return {
        totalEnrolled: Number(stats.total_enrolled) || 0,
        totalPlans: Number(planCountRows[0]?.count) || 0,
        monthlyRevenueDollars: (Number(stats.monthly_revenue_cents) || 0) / 100,
        recentPayments: recentPayments.map((p: any) => ({
          id: p.id,
          studentName: `${p.first_name} ${p.last_name}`,
          amountDollars: p.amount_cents / 100,
          description: p.description,
          paidAt: p.paid_at,
          transactionId: p.fluidpay_transaction_id,
        })),
      };
    }),

  cancelEnrollment: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) throw new Error("No organization found");
      await rawQuery(db,
        `UPDATE student_billing_enrollments SET status = 'cancelled', end_date = NOW() WHERE id = ? AND organization_id = ?`,
        [input.enrollmentId, orgId]
      );
      return { success: true };
    }),

  // Payments command center dashboard
  getPaymentsDashboard: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) return null;

      const todayRows = await rawQuery(db,
        `SELECT COALESCE(SUM(amount_cents),0) as total FROM student_tuition_payments
         WHERE organization_id = ? AND status = 'success' AND DATE(paid_at) = CURDATE()`,
        [orgId]);
      const todayCollected = (Number(todayRows[0]?.total) || 0) / 100;

      const weekRows = await rawQuery(db,
        `SELECT COALESCE(SUM(amount_cents),0) as total FROM student_tuition_payments
         WHERE organization_id = ? AND status = 'success' AND paid_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [orgId]);
      const weeklyRevenue = (Number(weekRows[0]?.total) || 0) / 100;

      const mrrRows = await rawQuery(db,
        `SELECT COALESCE(SUM(p.amount_cents),0) as total
         FROM student_billing_enrollments e JOIN tuition_plans p ON e.plan_id = p.id
         WHERE e.organization_id = ? AND e.status = 'active'`,
        [orgId]);
      const mrr = (Number(mrrRows[0]?.total) || 0) / 100;

      const effRows = await rawQuery(db,
        `SELECT COUNT(CASE WHEN status='success' THEN 1 END) as s, COUNT(CASE WHEN status='failed' THEN 1 END) as f
         FROM student_tuition_payments WHERE organization_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [orgId]);
      const sc = Number(effRows[0]?.s) || 0;
      const fc = Number(effRows[0]?.f) || 0;
      const collectionEfficiency = (sc + fc) > 0 ? Math.round((sc / (sc + fc)) * 100) : 100;

      const overdueRows = await rawQuery(db,
        `SELECT e.id as eid, e.student_id, e.retry_count, e.last_declined_at, e.next_billing_date,
                p.amount_cents, p.name as plan_name, p.frequency,
                s.first_name, s.last_name, s.phone, s.latitude, s.longitude, s.photo_url,
                DATEDIFF(NOW(), COALESCE(e.last_declined_at, e.next_billing_date)) as days_late
         FROM student_billing_enrollments e
         JOIN tuition_plans p ON e.plan_id = p.id
         JOIN students s ON e.student_id = s.id
         WHERE e.organization_id = ? AND e.status = 'past_due'
         ORDER BY days_late DESC LIMIT 50`,
        [orgId]);
      const overdueAccounts = overdueRows.map((r: any) => ({
        enrollmentId: r.eid,
        studentId: r.student_id,
        studentName: `${r.first_name} ${r.last_name}`,
        phone: r.phone,
        amountDollars: (Number(r.amount_cents) || 0) / 100,
        planName: r.plan_name,
        frequency: r.frequency,
        daysLate: Math.max(0, Number(r.days_late) || 0),
        retryCount: Number(r.retry_count) || 0,
        lastDeclinedAt: r.last_declined_at,
        latitude: r.latitude,
        longitude: r.longitude,
        photoUrl: r.photo_url,
      }));

      const txRows = await rawQuery(db,
        `SELECT stp.id, stp.amount_cents, stp.status, stp.paid_at, stp.created_at,
                stp.failure_reason, stp.description, stp.fluidpay_transaction_id,
                s.first_name, s.last_name, s.photo_url, s.latitude, s.longitude, s.phone
         FROM student_tuition_payments stp
         JOIN students s ON stp.student_id = s.id
         WHERE stp.organization_id = ? ORDER BY stp.created_at DESC LIMIT 30`,
        [orgId]);
      const transactions = txRows.map((r: any) => ({
        id: r.id,
        studentName: `${r.first_name} ${r.last_name}`,
        amountDollars: (Number(r.amount_cents) || 0) / 100,
        status: r.status,
        paidAt: r.paid_at,
        createdAt: r.created_at,
        failureReason: r.failure_reason,
        description: r.description,
        transactionId: r.fluidpay_transaction_id,
        photoUrl: r.photo_url,
        latitude: r.latitude,
        longitude: r.longitude,
        phone: r.phone,
      }));

      const paidMapRows = await rawQuery(db,
        `SELECT DISTINCT s.id, s.first_name, s.last_name, s.latitude, s.longitude
         FROM student_tuition_payments stp JOIN students s ON stp.student_id = s.id
         WHERE stp.organization_id = ? AND stp.status = 'success'
           AND s.latitude IS NOT NULL AND s.longitude IS NOT NULL
           AND stp.paid_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [orgId]);

      return {
        todayCollected,
        weeklyRevenue,
        mrr,
        collectionEfficiency,
        overdueAccounts,
        overdueCount: overdueAccounts.length,
        overdueTotal: overdueAccounts.reduce((sum: number, a: any) => sum + a.amountDollars, 0),
        transactions,
        paidMapStudents: paidMapRows.map((r: any) => ({
          id: r.id,
          name: `${r.first_name} ${r.last_name}`,
          latitude: r.latitude,
          longitude: r.longitude,
          isPaid: true,
        })),
      };
    }),
});

export type TuitionBillingRouter = typeof tuitionBillingRouter;
