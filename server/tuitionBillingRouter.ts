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

      // ── student_tuition: camelCase cols, amount in dollars (not cents) ──
      // status values: 'paid', 'pending', 'overdue'
      // Org filter: join students table to get organizationId

      const todayRows = await rawQuery(db,
        `SELECT COALESCE(SUM(st.amount),0) as total
         FROM student_tuition st
         JOIN students s ON st.studentId = s.id
         WHERE s.organizationId = ? AND st.status = 'paid' AND DATE(st.paidDate) = CURDATE()`,
        [orgId]);
      const todayCollected = Number(todayRows[0]?.total) || 0;

      const weekRows = await rawQuery(db,
        `SELECT COALESCE(SUM(st.amount),0) as total
         FROM student_tuition st
         JOIN students s ON st.studentId = s.id
         WHERE s.organizationId = ? AND st.status = 'paid'
           AND st.paidDate >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [orgId]);
      const weeklyRevenue = Number(weekRows[0]?.total) || 0;

      // MRR: sum of all active tuition plan amounts for this org (amount_cents, snake_case)
      const mrrRows = await rawQuery(db,
        `SELECT COALESCE(SUM(tp.amount_cents),0) as total
         FROM tuition_plans tp
         WHERE tp.organization_id = ? AND tp.is_active = 1`,
        [orgId]);
      const mrr = (Number(mrrRows[0]?.total) || 0) / 100;

      // Collection efficiency: paid / (paid + overdue) in last 30 days
      const effRows = await rawQuery(db,
        `SELECT
           COUNT(CASE WHEN st.status='paid' THEN 1 END) as s,
           COUNT(CASE WHEN st.status='overdue' THEN 1 END) as f
         FROM student_tuition st
         JOIN students s ON st.studentId = s.id
         WHERE s.organizationId = ? AND st.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [orgId]);
      const sc = Number(effRows[0]?.s) || 0;
      const fc = Number(effRows[0]?.f) || 0;
      const collectionEfficiency = (sc + fc) > 0 ? Math.round((sc / (sc + fc)) * 100) : 100;

      // Overdue accounts: overdue status OR pending past due date
      const overdueRows = await rawQuery(db,
        `SELECT st.id as tid, st.studentId, st.amount, st.dueDate, st.status,
                s.firstName, s.lastName, s.phone, s.latitude, s.longitude, s.photoUrl,
                DATEDIFF(NOW(), st.dueDate) as days_late
         FROM student_tuition st
         JOIN students s ON st.studentId = s.id
         WHERE s.organizationId = ?
           AND (st.status = 'overdue' OR (st.status = 'pending' AND st.dueDate < NOW()))
         ORDER BY days_late DESC LIMIT 50`,
        [orgId]);
      const overdueAccounts = overdueRows.map((r: any) => ({
        enrollmentId: r.tid,
        studentId: r.studentId,
        studentName: `${r.firstName} ${r.lastName}`,
        phone: r.phone,
        amountDollars: Number(r.amount) || 0,
        planName: 'Tuition',
        frequency: 'monthly',
        daysLate: Math.max(0, Number(r.days_late) || 0),
        retryCount: 0,
        lastDeclinedAt: null,
        latitude: r.latitude,
        longitude: r.longitude,
        photoUrl: r.photoUrl,
      }));

      // Pending amount (pending not yet overdue)
      const pendingRows = await rawQuery(db,
        `SELECT COALESCE(SUM(st.amount),0) as total
         FROM student_tuition st
         JOIN students s ON st.studentId = s.id
         WHERE s.organizationId = ? AND st.status = 'pending' AND st.dueDate >= NOW()`,
        [orgId]);
      const pendingTotal = Number(pendingRows[0]?.total) || 0;

      // Recent transactions
      const txRows = await rawQuery(db,
        `SELECT st.id, st.amount, st.status, st.paidDate, st.createdAt,
                st.notes, st.paymentMethod,
                s.firstName, s.lastName, s.photoUrl, s.latitude, s.longitude, s.phone
         FROM student_tuition st
         JOIN students s ON st.studentId = s.id
         WHERE s.organizationId = ? ORDER BY st.updatedAt DESC LIMIT 30`,
        [orgId]);
      const transactions = txRows.map((r: any) => ({
        id: r.id,
        studentName: `${r.firstName} ${r.lastName}`,
        amountDollars: Number(r.amount) || 0,
        status: r.status === 'paid' ? 'success' : r.status,
        paidAt: r.paidDate,
        createdAt: r.createdAt,
        failureReason: null,
        description: r.notes || r.paymentMethod || 'Tuition',
        transactionId: null,
        photoUrl: r.photoUrl,
        latitude: r.latitude,
        longitude: r.longitude,
        phone: r.phone,
      }));

      // Collection trend: last 7 days
      const trendRows = await rawQuery(db,
        `SELECT DATE(st.paidDate) as day, COALESCE(SUM(st.amount),0) as total
         FROM student_tuition st
         JOIN students s ON st.studentId = s.id
         WHERE s.organizationId = ? AND st.status = 'paid'
           AND st.paidDate >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY DATE(st.paidDate) ORDER BY day`,
        [orgId]);

      // Map: paid students with location
      const paidMapRows = await rawQuery(db,
        `SELECT DISTINCT s.id, s.firstName as first_name, s.lastName as last_name, s.latitude, s.longitude
         FROM student_tuition st JOIN students s ON st.studentId = s.id
         WHERE s.organizationId = ? AND st.status = 'paid'
           AND s.latitude IS NOT NULL AND s.longitude IS NOT NULL
           AND st.paidDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [orgId]);

      return {
        todayCollected,
        weeklyRevenue,
        mrr,
        pendingTotal,
        collectionEfficiency,
        overdueAccounts,
        overdueCount: overdueAccounts.length,
        overdueTotal: overdueAccounts.reduce((sum: number, a: any) => sum + a.amountDollars, 0),
        transactions,
        collectionTrend: trendRows.map((r: any) => ({ day: r.day, total: Number(r.total) || 0 })),
        paidMapStudents: paidMapRows.map((r: any) => ({
          id: r.id,
          name: `${r.first_name} ${r.last_name}`,
          latitude: r.latitude,
          longitude: r.longitude,
          isPaid: true,
        })),
      };
    }),

  // ── Collect All: charge + SMS all overdue students ─────────────────────────

  collectAll: protectedProcedure
    .input(z.object({
      message: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not initialized');
      const orgId = await resolveOrgId(ctx, db);
      if (!orgId) throw new Error('No organization found');
      const fpKey = await getFluidPayKey(db, orgId);

      // Fetch all past_due enrollments with student info
      const overdueRows = await rawQuery(db, `
        SELECT e.id as enrollment_id, e.student_id, e.fluidpay_customer_id, e.fluidpay_payment_method_id,
               e.retry_count, p.amount_cents, p.name as plan_name,
               s.first_name, s.last_name, s.phone
        FROM student_billing_enrollments e
        JOIN tuition_plans p ON e.plan_id = p.id
        JOIN students s ON e.student_id = s.id
        WHERE e.organization_id = ? AND e.status = 'past_due'
      `, [orgId]);

      const results: Array<{
        studentId: number;
        studentName: string;
        chargeStatus: 'success' | 'failed' | 'skipped';
        chargeError?: string;
        smsStatus: 'sent' | 'failed' | 'no_phone' | 'skipped';
        smsError?: string;
        amountDollars: number;
      }> = [];

      const smsMessage = input.message ||
        `Hi, this is a reminder that your tuition payment is overdue. Please update your payment method or contact us. Thank you!`;

      for (const row of overdueRows) {
        const studentName = `${row.first_name} ${row.last_name}`;
        const amountDollars = row.amount_cents / 100;
        let chargeStatus: 'success' | 'failed' | 'skipped' = 'skipped';
        let chargeError: string | undefined;
        let smsStatus: 'sent' | 'failed' | 'no_phone' | 'skipped' = 'skipped';
        let smsError: string | undefined;

        // 1. Attempt charge via FluidPay
        if (fpKey && row.fluidpay_customer_id && row.fluidpay_payment_method_id) {
          try {
            const description = `Tuition - ${row.plan_name} - ${studentName}`;
            await rawQuery(db,
              `INSERT INTO student_tuition_payments (enrollment_id, student_id, organization_id, amount_cents, status, description)
               VALUES (?, ?, ?, ?, 'pending', ?)`,
              [row.enrollment_id, row.student_id, orgId, row.amount_cents, description]
            );
            const payRec = await rawQuery(db,
              `SELECT id FROM student_tuition_payments WHERE student_id = ? AND organization_id = ? ORDER BY id DESC LIMIT 1`,
              [row.student_id, orgId]
            );
            const paymentId = payRec[0]?.id;
            const chargeResult = await chargeFluidPayCustomer(
              fpKey,
              row.fluidpay_customer_id,
              row.fluidpay_payment_method_id,
              row.amount_cents,
              description
            );
            const now = new Date().toISOString().slice(0, 19);
            if (chargeResult.success) {
              chargeStatus = 'success';
              await rawQuery(db,
                `UPDATE student_tuition_payments SET status='success', transaction_id=?, paid_at=? WHERE id=?`,
                [chargeResult.transactionId || null, now, paymentId]
              );
              await rawQuery(db,
                `UPDATE student_billing_enrollments SET status='active', retry_count=0, last_declined_at=NULL WHERE id=?`,
                [row.enrollment_id]
              );
            } else {
              chargeStatus = 'failed';
              chargeError = chargeResult.error || 'Charge declined';
              await rawQuery(db,
                `UPDATE student_tuition_payments SET status='failed', failure_reason=?, declined_at=? WHERE id=?`,
                [chargeError, now, paymentId]
              );
              await rawQuery(db,
                `UPDATE student_billing_enrollments SET retry_count=retry_count+1, last_declined_at=? WHERE id=?`,
                [now, row.enrollment_id]
              );
            }
          } catch (err: any) {
            chargeStatus = 'failed';
            chargeError = err.message;
          }
        }

        // 2. Send SMS reminder via Twilio
        if (row.phone) {
          try {
            const { formatPhoneNumber } = await import('./services/twilio.js');
            const formatted = formatPhoneNumber(row.phone);
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
            const form = new URLSearchParams();
            form.append('To', formatted);
            form.append('From', process.env.TWILIO_PHONE_NUMBER || '');
            form.append('Body', smsMessage);
            const resp = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: form.toString(),
            });
            const twilioData = await resp.json() as any;
            if (!resp.ok) throw new Error(twilioData.message || 'Twilio error');
            smsStatus = 'sent';
            try {
              await rawQuery(db,
                `INSERT INTO sms_log (organization_id, student_id, recipient_name, recipient_phone, message, status, twilio_sid, sent_by, filter_tag)
                 VALUES (?, ?, ?, ?, ?, 'sent', ?, 'collect_all', 'overdue')`,
                [orgId, row.student_id, studentName, formatted, smsMessage, twilioData.sid || null]
              );
            } catch {}
          } catch (err: any) {
            smsStatus = 'failed';
            smsError = err.message;
          }
        } else {
          smsStatus = 'no_phone';
        }

        results.push({ studentId: row.student_id, studentName, chargeStatus, chargeError, smsStatus, smsError, amountDollars });
      }

      const charged = results.filter(r => r.chargeStatus === 'success').length;
      const smsSent = results.filter(r => r.smsStatus === 'sent').length;
      const totalCollected = results.filter(r => r.chargeStatus === 'success').reduce((s, r) => s + r.amountDollars, 0);

      return {
        results,
        summary: {
          total: results.length,
          charged,
          smsSent,
          totalCollected,
          message: `Processed ${results.length} overdue accounts: ${charged} charged ($${totalCollected.toFixed(2)} collected), ${smsSent} SMS reminders sent.`,
        },
      };
    }),
});

export type TuitionBillingRouter = typeof tuitionBillingRouter;
