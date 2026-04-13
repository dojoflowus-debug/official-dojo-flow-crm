/**
 * kaiReviewRouter.ts
 * Post-task review system for Kai AI.
 * Handles star ratings, feedback submission, support ticket creation, and admin review.
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { kaiReviews, kaiSupportTickets } from "../drizzle/schema";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Generate a human-readable ticket number like KAI-00042 */
async function generateTicketNumber(db: any): Promise<string> {
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(kaiSupportTickets);
  const next = (Number(row?.count ?? 0) + 1).toString().padStart(5, "0");
  return `KAI-${next}`;
}

/** Determine priority from star rating */
function priorityFromRating(stars: number): "low" | "medium" | "high" | "urgent" {
  if (stars === 1) return "urgent";
  if (stars === 2) return "high";
  if (stars === 3) return "medium";
  return "low";
}

// ── Router ─────────────────────────────────────────────────────────────────────

export const kaiReviewRouter = router({
  /**
   * Submit a post-task review (star rating + optional feedback).
   * If stars <= 2 OR the user explicitly requests a refund, a support ticket is auto-created.
   */
  submitReview: protectedProcedure
    .input(
      z.object({
        starRating: z.number().int().min(1).max(5),
        feedback: z.string().max(2000).optional(),
        taskSummary: z.string().max(500).optional(),
        taskType: z.string().max(100).optional(),
        creditsUsed: z.number().int().min(0).default(0),
        conversationId: z.string().max(255).optional(),
        requestRefund: z.boolean().default(false),
        creditsRequested: z.number().int().min(0).default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const orgId = ctx.organizationId;
      const userId = ctx.userId;

      // Insert the review
      const [reviewResult] = await db.insert(kaiReviews).values({
        organizationId: orgId,
        userId,
        conversationId: input.conversationId ?? null,
        taskSummary: input.taskSummary ?? null,
        starRating: input.starRating,
        feedback: input.feedback ?? null,
        taskType: input.taskType ?? null,
        creditsUsed: input.creditsUsed,
        hasTicket: 0,
      });

      const reviewId = (reviewResult as any).insertId as number;

      // Auto-create a support ticket for low ratings or explicit refund requests
      const shouldCreateTicket = input.starRating <= 2 || input.requestRefund;
      let ticketId: number | null = null;
      let ticketNumber: string | null = null;

      if (shouldCreateTicket) {
        ticketNumber = await generateTicketNumber(db);
        const priority = priorityFromRating(input.starRating);
        const subject =
          input.starRating <= 2
            ? `Low rating (${input.starRating}★) — ${input.taskType ?? "Kai task"}`
            : `Credit refund request — ${input.taskType ?? "Kai task"}`;

        const [ticketResult] = await db.insert(kaiSupportTickets).values({
          organizationId: orgId,
          userId,
          reviewId,
          ticketNumber,
          subject,
          description: input.feedback ?? null,
          starRating: input.starRating,
          taskSummary: input.taskSummary ?? null,
          creditsRequested: input.creditsRequested || input.creditsUsed,
          creditsRefunded: 0,
          status: "open",
          priority,
          adminNotes: null,
        });

        ticketId = (ticketResult as any).insertId as number;

        // Mark the review as having a ticket
        await db
          .update(kaiReviews)
          .set({ hasTicket: 1 })
          .where(eq(kaiReviews.id, reviewId));
      }

      return {
        success: true,
        reviewId,
        ticketCreated: shouldCreateTicket,
        ticketId,
        ticketNumber,
      };
    }),

  /**
   * Manually create a support ticket (e.g. user clicks "Report an issue" on a 3-star review).
   */
  createTicket: protectedProcedure
    .input(
      z.object({
        reviewId: z.number().int().optional(),
        subject: z.string().max(255),
        description: z.string().max(2000).optional(),
        starRating: z.number().int().min(1).max(5).optional(),
        taskSummary: z.string().max(500).optional(),
        creditsRequested: z.number().int().min(0).default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const ticketNumber = await generateTicketNumber(db);
      const priority = input.starRating ? priorityFromRating(input.starRating) : "medium";

      const [result] = await db.insert(kaiSupportTickets).values({
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        reviewId: input.reviewId ?? null,
        ticketNumber,
        subject: input.subject,
        description: input.description ?? null,
        starRating: input.starRating ?? null,
        taskSummary: input.taskSummary ?? null,
        creditsRequested: input.creditsRequested,
        creditsRefunded: 0,
        status: "open",
        priority,
        adminNotes: null,
      });

      if (input.reviewId) {
        await db
          .update(kaiReviews)
          .set({ hasTicket: 1 })
          .where(eq(kaiReviews.id, input.reviewId));
      }

      return {
        success: true,
        ticketId: (result as any).insertId as number,
        ticketNumber,
      };
    }),

  /**
   * List all support tickets for this organization (admin view).
   */
  listTickets: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["open", "in_review", "resolved", "closed", "refunded", "all"])
          .default("all"),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { tickets: [], total: 0 };

      const conditions = [eq(kaiSupportTickets.organizationId, ctx.organizationId)];
      if (input.status !== "all") {
        conditions.push(eq(kaiSupportTickets.status, input.status as any));
      }

      const tickets = await db
        .select()
        .from(kaiSupportTickets)
        .where(and(...conditions))
        .orderBy(desc(kaiSupportTickets.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [countRow] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(kaiSupportTickets)
        .where(and(...conditions));

      return {
        tickets,
        total: Number(countRow?.count ?? 0),
      };
    }),

  /**
   * Get a single ticket by ID.
   */
  getTicket: protectedProcedure
    .input(z.object({ ticketId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const [ticket] = await db
        .select()
        .from(kaiSupportTickets)
        .where(
          and(
            eq(kaiSupportTickets.id, input.ticketId),
            eq(kaiSupportTickets.organizationId, ctx.organizationId)
          )
        );

      return ticket ?? null;
    }),

  /**
   * Update ticket status and optionally add admin notes / process refund.
   */
  updateTicket: protectedProcedure
    .input(
      z.object({
        ticketId: z.number().int(),
        status: z
          .enum(["open", "in_review", "resolved", "closed", "refunded"])
          .optional(),
        adminNotes: z.string().max(2000).optional(),
        creditsRefunded: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updateData: Record<string, any> = {};
      if (input.status) updateData.status = input.status;
      if (input.adminNotes !== undefined) updateData.adminNotes = input.adminNotes;
      if (input.creditsRefunded !== undefined) updateData.creditsRefunded = input.creditsRefunded;
      if (input.status === "resolved" || input.status === "closed" || input.status === "refunded") {
        updateData.resolvedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
        updateData.resolvedBy = ctx.userId;
      }

      await db
        .update(kaiSupportTickets)
        .set(updateData)
        .where(
          and(
            eq(kaiSupportTickets.id, input.ticketId),
            eq(kaiSupportTickets.organizationId, ctx.organizationId)
          )
        );

      return { success: true };
    }),

  /**
   * Get review stats for the organization (average rating, total reviews, ticket count).
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { avgRating: 0, totalReviews: 0, openTickets: 0, totalTickets: 0 };

    const [statsRow] = await db
      .select({
        avgRating: sql<number>`AVG(star_rating)`,
        totalReviews: sql<number>`COUNT(*)`,
      })
      .from(kaiReviews)
      .where(eq(kaiReviews.organizationId, ctx.organizationId));

    const [ticketRow] = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(kaiSupportTickets)
      .where(eq(kaiSupportTickets.organizationId, ctx.organizationId));

    const [openRow] = await db
      .select({ open: sql<number>`COUNT(*)` })
      .from(kaiSupportTickets)
      .where(
        and(
          eq(kaiSupportTickets.organizationId, ctx.organizationId),
          eq(kaiSupportTickets.status, "open")
        )
      );

    return {
      avgRating: Number(statsRow?.avgRating ?? 0),
      totalReviews: Number(statsRow?.totalReviews ?? 0),
      openTickets: Number(openRow?.open ?? 0),
      totalTickets: Number(ticketRow?.total ?? 0),
    };
  }),
});
