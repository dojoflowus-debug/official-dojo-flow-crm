import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { students, leads, billingTransactions, kaiConversations, kaiMessages, merchandiseItems, studentMerchandise, kiosk_locations } from "../drizzle/schema";
import { eq, and, or, lt, gt, isNull, sql, count } from "drizzle-orm";

/**
 * Navigation Badge Router
 * 
 * Provides actionable counts for navigation menu items.
 * Only shows counts for items requiring attention/action.
 */

export const navBadgesRouter = router({
  /**
   * Get all actionable counts for navigation badges
   * Returns counts only when > 0
   */
  getActionableCounts: protectedProcedure
    .input(z.object({
      locationId: z.string().optional(), // For multi-location support
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const userRole = ctx.user.role;
      
      // Initialize all counts
      const counts = {
        students: 0,
        leads: 0,
        billing: 0,
        tasks: 0,
        messages: 0,
        kiosk: 0,
        operations: 0,
      };

      try {
        const db = await getDb();
        if (!db) {
          console.warn('[NavBadges] Database not available');
          return {};
        }

        // STUDENTS COUNT: Students needing attention
        // - Late on payments (overdue > 7 days)
        // - Missing waiver
        // - At risk (status = 'on_hold' or 'inactive')
        // - Failed autopay
        const studentsNeedingAttention = await db
          .select({ count: count() })
          .from(students)
          .where(
            or(
              eq(students.status, 'on_hold'),
              eq(students.status, 'inactive'),
              // Add more conditions as needed
            )
          );
        
        counts.students = studentsNeedingAttention[0]?.count || 0;

        // LEADS COUNT: Leads requiring follow-up
        // - New leads (created < 24h ago, no contact yet)
        // - Uncontacted leads (no activities)
        // - Overdue follow-ups (last contact > 3 days ago, stage = 'contacted' or 'qualified')
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

        const leadsRequiringFollowup = await db
          .select({ count: count() })
          .from(leads)
          .where(
            or(
              // New leads (created < 24h ago)
              and(
                gt(leads.createdAt, oneDayAgo),
                eq(leads.status, 'New Lead')
              ),
              // Overdue follow-ups
              and(
                lt(leads.updatedAt, threeDaysAgo),
                or(
                  eq(leads.status, 'Attempting Contact'),
                  eq(leads.status, 'Contact Made')
                )
              )
            )
          );

        counts.leads = leadsRequiringFollowup[0]?.count || 0;

        // BILLING COUNT: Failed payments and disputed transactions
        // - Failed payments (status = 'failed')
        // - Disputed transactions (status = 'disputed')
        try {
          const failedTransactions = await db
            .select({ count: count() })
            .from(billingTransactions)
            .where(
              or(
                eq(billingTransactions.status, 'failed'),
                eq(billingTransactions.status, 'disputed')
              )
            );

          counts.billing = failedTransactions[0]?.count || 0;
        } catch (error) {
          // Table may not exist yet, skip billing count
          console.log('[NavBadges] Billing table not available, skipping billing count');
          counts.billing = 0;
        }

        // TASKS COUNT: Open tasks assigned to current user
        // Note: This requires a tasks table which may not exist yet
        // Placeholder for now
        counts.tasks = 0;

        // MESSAGES COUNT: Unread messages for current user
        // Count unread messages in kaiConversations where user is a participant
        const unreadMessages = await db
          .select({ count: count() })
          .from(kaiMessages)
          .where(
            and(
              sql`${kaiMessages.conversationId} IN (
                SELECT id FROM ${kaiConversations} 
                WHERE ${kaiConversations.userId} = ${userId}
              )`,
              eq(kaiMessages.role, 'assistant'),
              // Add unread tracking field if it exists
            )
          );

        // For now, count conversations with new messages (simplified)
        counts.messages = 0; // Will implement proper unread tracking later

        // KIOSK COUNT: Issues requiring attention
        // - Unconfigured kiosks
        // - Offline kiosks (if we track status)
        // - Pending merchandise fulfillment
        const pendingFulfillments = await db
          .select({ count: count() })
          .from(studentMerchandise)
          .where(eq(studentMerchandise.fulfillmentStatus, 'pending'));

        counts.kiosk = pendingFulfillments[0]?.count || 0;

        // OPERATIONS COUNT: Pending fulfillments + low stock items
        const lowStockItems = await db
          .select({ count: count() })
          .from(merchandiseItems)
          .where(
            and(
              sql`${merchandiseItems.stockQuantity} IS NOT NULL`,
              sql`${merchandiseItems.lowStockThreshold} IS NOT NULL`,
              sql`${merchandiseItems.stockQuantity} <= ${merchandiseItems.lowStockThreshold}`
            )
          );

        counts.operations = (pendingFulfillments[0]?.count || 0) + (lowStockItems[0]?.count || 0);

        // Return only non-zero counts
        const result: Record<string, number> = {};
        Object.entries(counts).forEach(([key, value]) => {
          if (value > 0) {
            result[key] = value;
          }
        });

        return result;
      } catch (error) {
        console.error('Error fetching badge counts:', error);
        return {};
      }
    }),

  /**
   * Get detailed breakdown for a specific badge
   * Used when user clicks on a badge to see what needs attention
   */
  getBadgeDetails: protectedProcedure
    .input(z.object({
      badge: z.enum(['students', 'leads', 'billing', 'tasks', 'messages', 'kiosk', 'operations']),
      locationId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { badge } = input;
      const db = await getDb();
      if (!db) {
        return { items: [] };
      }

      switch (badge) {
        case 'students':
          // Return list of students needing attention with reasons
          const studentsAtRisk = await db
            .select()
            .from(students)
            .where(
              or(
                eq(students.status, 'on_hold'),
                eq(students.status, 'inactive')
              )
            )
            .limit(50);

          return {
            items: studentsAtRisk.map(s => ({
              id: s.id,
              name: s.name,
              reason: s.status === 'on_hold' ? 'On Hold' : 'Inactive',
              severity: 'medium',
            })),
          };

        case 'leads':
          // Return leads requiring follow-up
          const now = new Date();
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

          const leadsNeedingAction = await db
            .select()
            .from(leads)
            .where(
              or(
                and(
                  gt(leads.createdAt, oneDayAgo),
                  eq(leads.status, 'New Lead')
                ),
                and(
                  lt(leads.updatedAt, threeDaysAgo),
                  or(
                    eq(leads.status, 'Attempting Contact'),
                    eq(leads.status, 'Contact Made')
                  )
                )
              )
            )
            .limit(50);

          return {
            items: leadsNeedingAction.map(l => ({
              id: l.id,
              name: `${l.firstName} ${l.lastName}`,
              reason: l.status === 'New Lead' ? 'New Lead' : 'Overdue Follow-up',
              severity: l.status === 'New Lead' ? 'high' : 'medium',
            })),
          };

        case 'billing':
          // Return failed/disputed transactions
          const failedTransactions = await db
            .select()
            .from(billingTransactions)
            .where(
              or(
                eq(billingTransactions.status, 'failed'),
                eq(billingTransactions.status, 'disputed')
              )
            )
            .limit(50);

          return {
            items: failedTransactions.map(txn => ({
              id: txn.id,
              name: `Transaction #${txn.transactionId}`,
              reason: txn.status === 'failed' ? 'Payment Failed' : 'Disputed',
              severity: txn.status === 'failed' ? 'high' : 'medium',
              amount: txn.amount,
            })),
          };

        case 'operations':
          // Return pending fulfillments
          const pendingItems = await db
            .select({
              id: studentMerchandise.id,
              studentId: studentMerchandise.studentId,
              itemName: merchandiseItems.name,
              size: studentMerchandise.size,
              assignedAt: studentMerchandise.assignedAt,
            })
            .from(studentMerchandise)
            .leftJoin(merchandiseItems, eq(studentMerchandise.itemId, merchandiseItems.id))
            .where(eq(studentMerchandise.fulfillmentStatus, 'pending'))
            .limit(50);

          return {
            items: pendingItems.map(item => ({
              id: item.id,
              name: item.itemName || 'Unknown Item',
              reason: 'Pending Fulfillment',
              severity: 'medium',
            })),
          };

        default:
          return { items: [] };
      }
    }),
});
