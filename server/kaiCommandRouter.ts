/**
 * KAI Command Router
 * 
 * Procedures for the KAI Command operational status dashboard
 * Handles incidents, alerts, and operations log queries
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

export const kaiCommandRouter = router({
  /**
   * Get all incidents for an organization with filtering
   */
  incidents: router({
    list: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        status: z.enum(['open', 'acknowledged', 'in_progress', 'resolved', 'closed']).optional(),
        severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input, ctx }) => {
        // Verify user has access to this organization
        if (input.organizationId !== ctx.currentOrganizationId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this organization',
          });
        }

        const { getDb } = await import("./db");
        const { kaiIncidents } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const conditions = [eq(kaiIncidents.organizationId, input.organizationId)];
        
        if (input.status) {
          conditions.push(eq(kaiIncidents.status, input.status));
        }
        
        if (input.severity) {
          conditions.push(eq(kaiIncidents.severity, input.severity));
        }

        const incidents = await db
          .select()
          .from(kaiIncidents)
          .where(and(...conditions))
          .orderBy((t) => [t.createdAt])
          .limit(input.limit)
          .offset(input.offset);

        return incidents || [];
      }),

    /**
     * Create a new incident
     */
    create: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        severity: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
        category: z.enum(['system', 'infrastructure', 'security', 'performance', 'other']).default('other'),
      }))
      .mutation(async ({ input, ctx }) => {
        if (input.organizationId !== ctx.currentOrganizationId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this organization',
          });
        }

        const { getDb } = await import("./db");
        const { kaiIncidents } = await import("../drizzle/schema");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const [result] = await db.insert(kaiIncidents).values({
          organizationId: input.organizationId,
          title: input.title,
          description: input.description,
          severity: input.severity,
          category: input.category,
          status: 'open',
          createdBy: ctx.user.id,
        });

        return { id: result.insertId };
      }),

    /**
     * Update incident status
     */
    updateStatus: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        incidentId: z.number(),
        status: z.enum(['open', 'acknowledged', 'in_progress', 'resolved', 'closed']),
      }))
      .mutation(async ({ input, ctx }) => {
        if (input.organizationId !== ctx.currentOrganizationId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this organization',
          });
        }

        const { getDb } = await import("./db");
        const { kaiIncidents } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const updateData: any = { status: input.status };
        
        if (input.status === 'resolved' || input.status === 'closed') {
          updateData.resolvedAt = new Date().toISOString();
        }

        await db
          .update(kaiIncidents)
          .set(updateData)
          .where(eq(kaiIncidents.id, input.incidentId));

        return { success: true };
      }),
  }),

  /**
   * Get all alerts for an organization
   */
  alerts: router({
    list: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        dismissed: z.boolean().optional(),
        severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
        limit: z.number().default(50),
      }))
      .query(async ({ input, ctx }) => {
        if (input.organizationId !== ctx.currentOrganizationId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this organization',
          });
        }

        const { getDb } = await import("./db");
        const { kaiAlerts } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const conditions = [eq(kaiAlerts.organizationId, input.organizationId)];
        
        if (input.dismissed !== undefined) {
          conditions.push(eq(kaiAlerts.dismissed, input.dismissed ? 1 : 0));
        }
        
        if (input.severity) {
          conditions.push(eq(kaiAlerts.severity, input.severity));
        }

        const alerts = await db
          .select()
          .from(kaiAlerts)
          .where(and(...conditions))
          .orderBy((t) => [t.createdAt])
          .limit(input.limit);

        return alerts || [];
      }),

    /**
     * Dismiss an alert
     */
    dismiss: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        alertId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (input.organizationId !== ctx.currentOrganizationId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this organization',
          });
        }

        const { getDb } = await import("./db");
        const { kaiAlerts } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .update(kaiAlerts)
          .set({
            dismissed: 1,
            dismissedAt:new Date().toISOString(),
            dismissedBy: ctx.user.id,
          })
          .where(eq(kaiAlerts.id, input.alertId));

        return { success: true };
      }),
  }),

  /**
   * Get operations log
   */
  operations: router({
    getLog: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      }))
      .query(async ({ input, ctx }) => {
        if (input.organizationId !== ctx.currentOrganizationId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this organization',
          });
        }

        const { getDb } = await import("./db");
        const { kaiOperationsLog } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const operations = await db
          .select()
          .from(kaiOperationsLog)
          .where(eq(kaiOperationsLog.organizationId, input.organizationId))
          .orderBy((t) => [t.createdAt])
          .limit(input.limit)
          .offset(input.offset);

        return operations || [];
      }),
  }),

  /**
   * Get system status
   */
  systems: router({
    getStatus: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        if (input.organizationId !== ctx.currentOrganizationId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this organization',
          });
        }

        const { getDb } = await import("./db");
        const { kaiSystemStatus } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const systems = await db
          .select()
          .from(kaiSystemStatus)
          .where(eq(kaiSystemStatus.organizationId, input.organizationId));

        return systems || [];
      }),
  }),
});
