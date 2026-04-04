import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { students, leads, kaiConversations, kaiMessages, merchandiseItems, studentMerchandise } from "../drizzle/schema";
import { eq, and, or, lt, gt, isNull, sql, count } from "drizzle-orm";

/**
 * Navigation Badge Router
 * 
 * Provides actionable counts for navigation menu items.
 * Only shows counts for items requiring attention/action.
 * 
 * IMPORTANT: These badges should ONLY show items that need attention,
 * NOT total counts. The badge is meant to alert users to take action.
 * 
 * MULTI-TENANCY: All queries MUST filter by organizationId to ensure
 * each account only sees their own data.
 */

export const navBadgesRouter = router({
  /**
   * Get all actionable counts for navigation badges
   * Returns counts only when > 0
   */
  getActionableCounts: protectedProcedure
    .input(z.object({
      locationId: z.string().optional(), // For multi-location support
    }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const userRole = ctx.user.role;
      const organizationId = ctx.currentOrganizationId;
      
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

      // If no organization context, return empty counts
      if (!organizationId) {
        console.warn('[NavBadges] No organization context available');
        return {};
      }

      try {
        const db = await getDb();
        if (!db) {
          console.warn('[NavBadges] Database not available');
          return {};
        }

        // STUDENTS COUNT: Only ACTIVE students for THIS organization
        // Shows active student count so the badge reflects real enrolled members
        const totalStudents = await db
          .select({ count: count() })
          .from(students)
          .where(
            and(
              eq(students.organizationId, organizationId),
              eq(students.status, 'Active')
            )
          );
        
        counts.students = totalStudents[0]?.count || 0;

        // LEADS COUNT: Only leads requiring follow-up action for THIS organization
        // - New leads (not yet contacted) - need immediate action
        // - Leads in "Attempting Contact" for more than 3 days
        // - Leads in "Contact Made" with no activity for more than 7 days
        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const leadsNeedingFollowUp = await db
          .select({ count: count() })
          .from(leads)
          .where(
            and(
              eq(leads.organizationId, organizationId),
              or(
                // New leads that haven't been contacted
                eq(leads.status, 'New Lead'),
                // Leads stuck in "Attempting Contact" for too long
                and(
                  eq(leads.status, 'Attempting Contact'),
                  lt(leads.updatedAt, threeDaysAgo)
                ),
                // Leads with contact made but stale
                and(
                  eq(leads.status, 'Contact Made'),
                  lt(leads.updatedAt, sevenDaysAgo)
                )
              )
            )
          );

        counts.leads = leadsNeedingFollowUp[0]?.count || 0;

        // BILLING COUNT: Failed payments and disputed transactions for THIS organization
        // - Failed payments (status = 'failed')
        // - Disputed transactions (status = 'disputed')
        try {
          const failedTransactions = await db
            .select({ count: count() })
            .from(billingTransactions)
            .where(
              and(
                eq(billingTransactions.organizationId, organizationId),
                or(
                  eq(billingTransactions.status, 'failed'),
                  eq(billingTransactions.status, 'disputed')
                )
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
        // For now, count conversations with new messages (simplified)
        counts.messages = 0; // Will implement proper unread tracking later

        // KIOSK COUNT: Issues requiring attention for THIS organization
        // - Pending merchandise fulfillment
        try {
          const pendingFulfillments = await db
            .select({ count: count() })
            .from(studentMerchandise)
            .where(
              and(
                eq(studentMerchandise.organizationId, organizationId),
                eq(studentMerchandise.fulfillmentStatus, 'pending')
              )
            );

          counts.kiosk = pendingFulfillments[0]?.count || 0;
        } catch (error) {
          counts.kiosk = 0;
        }

        // OPERATIONS COUNT: Pending fulfillments + low stock items for THIS organization
        try {
          const pendingFulfillments = await db
            .select({ count: count() })
            .from(studentMerchandise)
            .where(
              and(
                eq(studentMerchandise.organizationId, organizationId),
                eq(studentMerchandise.fulfillmentStatus, 'pending')
              )
            );

          const lowStockItems = await db
            .select({ count: count() })
            .from(merchandiseItems)
            .where(
              and(
                eq(merchandiseItems.organizationId, organizationId),
                sql`${merchandiseItems.stockQuantity} IS NOT NULL`,
                sql`${merchandiseItems.lowStockThreshold} IS NOT NULL`,
                sql`${merchandiseItems.stockQuantity} <= ${merchandiseItems.lowStockThreshold}`
              )
            );

          counts.operations = (pendingFulfillments[0]?.count || 0) + (lowStockItems[0]?.count || 0);
        } catch (error) {
          counts.operations = 0;
        }

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
      const organizationId = ctx.currentOrganizationId;
      
      const db = await getDb();
      if (!db || !organizationId) {
        return { items: [] };
      }

      switch (badge) {
        case 'students':
          // Return list of students needing attention with reasons for THIS organization
          // Note: Status values are capitalized ("On Hold", "Inactive")
          const studentsAtRisk = await db
            .select()
            .from(students)
            .where(
              and(
                eq(students.organizationId, organizationId),
                or(
                  eq(students.status, 'On Hold'),
                  eq(students.status, 'Inactive')
                )
              )
            )
            .limit(50);

          return {
            items: studentsAtRisk.map(s => ({
              id: s.id,
              name: `${s.firstName} ${s.lastName}`,
              reason: s.status === 'On Hold' ? 'On Hold' : 'Inactive',
              severity: s.status === 'On Hold' ? 'medium' : 'high',
            })),
          };

        case 'leads':
          // Return leads requiring follow-up for THIS organization
          const now = new Date();
          const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

          const leadsNeedingAction = await db
            .select()
            .from(leads)
            .where(
              and(
                eq(leads.organizationId, organizationId),
                or(
                  eq(leads.status, 'New Lead'),
                  and(
                    eq(leads.status, 'Attempting Contact'),
                    lt(leads.updatedAt, threeDaysAgo)
                  ),
                  and(
                    eq(leads.status, 'Contact Made'),
                    lt(leads.updatedAt, sevenDaysAgo)
                  )
                )
              )
            )
            .limit(50);

          return {
            items: leadsNeedingAction.map(l => ({
              id: l.id,
              name: `${l.firstName} ${l.lastName}`,
              reason: l.status === 'New Lead' ? 'New Lead - Needs Contact' : 
                      l.status === 'Attempting Contact' ? 'Stale - No Response' :
                      'Overdue Follow-up',
              severity: l.status === 'New Lead' ? 'high' : 'medium',
            })),
          };

        case 'billing':
          // Return failed/disputed transactions for THIS organization
          const failedTransactions = await db
            .select()
            .from(billingTransactions)
            .where(
              and(
                eq(billingTransactions.organizationId, organizationId),
                or(
                  eq(billingTransactions.status, 'failed'),
                  eq(billingTransactions.status, 'disputed')
                )
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
          // Return pending fulfillments for THIS organization
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
            .where(
              and(
                eq(studentMerchandise.organizationId, organizationId),
                eq(studentMerchandise.fulfillmentStatus, 'pending')
              )
            )
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
