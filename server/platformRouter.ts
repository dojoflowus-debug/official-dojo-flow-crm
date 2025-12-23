/**
 * Platform Admin Router
 * Internal CRM for DojoFlow administrators to manage organizations
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  organizations,
  organizationUsers,
  users,
  platformSubscriptions,
  usageEvents,
  platformOnboardingProgress,
  featureFlags,
  accountFlags,
} from "../drizzle/schema";
import { eq, desc, and, gte, lte, sql, like } from "drizzle-orm";

/**
 * Middleware to verify platform admin access
 */
const platformAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.globalRole !== "platform_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Platform admin access required",
    });
  }
  return next({ ctx });
});

export const platformRouter = router({
  /**
   * Get all organizations with optional filters
   */
  getOrganizations: platformAdminProcedure
    .input(
      z.object({
        status: z.enum(["trial", "active", "past_due", "cancelled", "inactive"]).optional(),
        planId: z.number().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions = [];

      if (input.status) {
        conditions.push(eq(organizations.subscriptionStatus, input.status));
      }

      if (input.planId) {
        conditions.push(eq(organizations.planId, input.planId));
      }

      if (input.search) {
        conditions.push(like(organizations.name, `%${input.search}%`));
      }

      const orgs = await db
        .select()
        .from(organizations)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(organizations.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(organizations)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        organizations: orgs,
        total: countResult.count,
      };
    }),

  /**
   * Get single organization details
   */
  getOrganization: platformAdminProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.organizationId));

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      const orgUsers = await db
        .select({
          id: organizationUsers.id,
          role: organizationUsers.role,
          isPrimary: organizationUsers.isPrimary,
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
          createdAt: organizationUsers.createdAt,
        })
        .from(organizationUsers)
        .leftJoin(users, eq(organizationUsers.userId, users.id))
        .where(eq(organizationUsers.organizationId, input.organizationId));

      const [subscription] = await db
        .select()
        .from(platformSubscriptions)
        .where(eq(platformSubscriptions.organizationId, input.organizationId));

      const [onboarding] = await db
        .select()
        .from(platformOnboardingProgress)
        .where(eq(platformOnboardingProgress.organizationId, input.organizationId));

      const flags = await db
        .select()
        .from(accountFlags)
        .where(
          and(
            eq(accountFlags.organizationId, input.organizationId),
            eq(accountFlags.resolved, 0)
          )
        );

      return {
        organization: org,
        users: orgUsers,
        subscription,
        onboarding,
        flags,
      };
    }),

  /**
   * Get usage statistics
   */
  getUsageStats: platformAdminProcedure
    .input(
      z.object({
        organizationId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions = [eq(usageEvents.organizationId, input.organizationId)];

      if (input.startDate) {
        conditions.push(gte(usageEvents.createdAt, input.startDate));
      }

      if (input.endDate) {
        conditions.push(lte(usageEvents.createdAt, input.endDate));
      }

      const usageByType = await db
        .select({
          type: usageEvents.type,
          totalQuantity: sql<number>`SUM(${usageEvents.quantity})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(usageEvents)
        .where(and(...conditions))
        .groupBy(usageEvents.type);

      const dailyUsage = await db
        .select({
          date: sql<string>`DATE(${usageEvents.createdAt})`,
          type: usageEvents.type,
          quantity: sql<number>`SUM(${usageEvents.quantity})`,
        })
        .from(usageEvents)
        .where(and(...conditions))
        .groupBy(sql`DATE(${usageEvents.createdAt})`, usageEvents.type)
        .orderBy(sql`DATE(${usageEvents.createdAt})`);

      return { byType: usageByType, daily: dailyUsage };
    }),

  /**
   * Update organization status
   */
  updateOrganizationStatus: platformAdminProcedure
    .input(
      z.object({
        organizationId: z.number(),
        status: z.enum(["trial", "active", "past_due", "cancelled", "inactive"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(organizations)
        .set({ subscriptionStatus: input.status })
        .where(eq(organizations.id, input.organizationId));

      return { success: true };
    }),

  /**
   * Toggle feature flag
   */
  toggleFeatureFlag: platformAdminProcedure
    .input(
      z.object({
        organizationId: z.number(),
        featureName: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [existing] = await db
        .select()
        .from(featureFlags)
        .where(
          and(
            eq(featureFlags.organizationId, input.organizationId),
            eq(featureFlags.featureName, input.featureName)
          )
        );

      if (existing) {
        await db
          .update(featureFlags)
          .set({ enabled: input.enabled ? 1 : 0 })
          .where(eq(featureFlags.id, existing.id));
      } else {
        await db.insert(featureFlags).values({
          organizationId: input.organizationId,
          featureName: input.featureName,
          enabled: input.enabled ? 1 : 0,
        });
      }

      return { success: true };
    }),

  /**
   * Create account flag
   */
  createAccountFlag: platformAdminProcedure
    .input(
      z.object({
        organizationId: z.number(),
        flagType: z.enum([
          "billing_risk",
          "abuse",
          "review_required",
          "high_usage",
          "support_escalation",
        ]),
        notes: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.insert(accountFlags).values({
        organizationId: input.organizationId,
        flagType: input.flagType,
        notes: input.notes,
        createdBy: ctx.user.id,
        resolved: 0,
      });

      return { success: true };
    }),

  /**
   * Get platform stats
   */
  getPlatformStats: platformAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const orgsByStatus = await db
      .select({
        status: organizations.subscriptionStatus,
        count: sql<number>`COUNT(*)`,
      })
      .from(organizations)
      .groupBy(organizations.subscriptionStatus);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsage = await db
      .select({
        type: usageEvents.type,
        total: sql<number>`SUM(${usageEvents.quantity})`,
      })
      .from(usageEvents)
      .where(gte(usageEvents.createdAt, thirtyDaysAgo))
      .groupBy(usageEvents.type);

    const [flagsCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(accountFlags)
      .where(eq(accountFlags.resolved, 0));

    return {
      organizationsByStatus: orgsByStatus,
      recentUsage,
      activeFlagsCount: flagsCount.count,
    };
  }),
});
