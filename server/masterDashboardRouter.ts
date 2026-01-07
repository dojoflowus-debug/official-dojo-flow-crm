/**
 * Master Dashboard Router
 * API for DojoFlow platform admin dashboard - displays real organization data
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  organizations,
  organizationUsers,
  users,
  students,
  subscriptionPlans,
  organizationSubscriptions,
  aiCreditBalance,
  teamMembers,
} from "../drizzle/schema";
import { eq, desc, and, sql, like, count, or } from "drizzle-orm";

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

export const masterDashboardRouter = router({
  /**
   * Get dashboard statistics - real data from organizations
   */
  getStats: platformAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Total organizations count
    const [totalOrgsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(organizations);

    // Active organizations (trial or active status)
    const [activeOrgsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(organizations)
      .where(
        or(
          eq(organizations.subscriptionStatus, "active"),
          eq(organizations.subscriptionStatus, "trial")
        )
      );

    // Organizations by status for health breakdown
    const orgsByStatus = await db
      .select({
        status: organizations.subscriptionStatus,
        count: sql<number>`count(*)`,
      })
      .from(organizations)
      .groupBy(organizations.subscriptionStatus);

    // Total students across all organizations
    const [totalStudentsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(students);

    // Total AI credits used (sum of credits_used from ai_credit_balance)
    const [aiUsageResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(period_used), 0)` })
      .from(aiCreditBalance);

    // Calculate health status counts
    let healthyCount = 0;
    let warningCount = 0;
    let riskCount = 0;

    orgsByStatus.forEach((row) => {
      const statusCount = Number(row.count) || 0;
      if (row.status === "active") {
        healthyCount += statusCount;
      } else if (row.status === "trial") {
        healthyCount += statusCount; // Trial is also healthy
      } else if (row.status === "past_due") {
        warningCount += statusCount;
      } else if (row.status === "cancelled" || row.status === "inactive") {
        riskCount += statusCount;
      }
    });

    return {
      totalSchools: Number(totalOrgsResult?.count) || 0,
      activeSchools: Number(activeOrgsResult?.count) || 0,
      totalStudents: Number(totalStudentsResult?.count) || 0,
      aiUsage: Number(aiUsageResult?.total) || 0,
      healthyCount,
      warningCount,
      riskCount,
    };
  }),

  /**
   * Get all schools (organizations) with owner info, subscription details, credits, and staff count
   */
  getSchools: platformAdminProcedure
    .input(
      z.object({
        status: z.enum(["all", "Active", "Warning", "Risk"]).optional().default("all"),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Build conditions based on status filter
      const conditions = [];
      
      if (input.status === "Active") {
        conditions.push(
          or(
            eq(organizations.subscriptionStatus, "active"),
            eq(organizations.subscriptionStatus, "trial")
          )
        );
      } else if (input.status === "Warning") {
        conditions.push(eq(organizations.subscriptionStatus, "past_due"));
      } else if (input.status === "Risk") {
        conditions.push(
          or(
            eq(organizations.subscriptionStatus, "cancelled"),
            eq(organizations.subscriptionStatus, "inactive")
          )
        );
      }

      if (input.search) {
        conditions.push(like(organizations.name, `%${input.search}%`));
      }

      // Get organizations with their primary owner
      const orgs = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          address: organizations.address,
          city: organizations.city,
          state: organizations.state,
          zipCode: organizations.zipCode,
          timezone: organizations.timezone,
          programs: organizations.programs,
          subscriptionStatus: organizations.subscriptionStatus,
          planId: organizations.planId,
          estimatedStudents: organizations.estimatedStudents,
          lastActivity: organizations.lastActivity,
          logoUrl: organizations.logoUrl,
          trialEndsAt: organizations.trialEndsAt,
          createdAt: organizations.createdAt,
        })
        .from(organizations)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(organizations.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get owner info for each organization
      const schoolsWithDetails = await Promise.all(
        orgs.map(async (org) => {
          // Get primary owner
          const [ownerResult] = await db
            .select({
              userId: users.id,
              userName: users.name,
              userEmail: users.email,
            })
            .from(organizationUsers)
            .leftJoin(users, eq(organizationUsers.userId, users.id))
            .where(
              and(
                eq(organizationUsers.organizationId, org.id),
                eq(organizationUsers.isPrimary, 1)
              )
            )
            .limit(1);

          // Get subscription plan details
          let planName = "Free";
          let monthlyPrice = 0;
          let monthlyCredits = 0;
          if (org.planId) {
            const [planResult] = await db
              .select({ 
                name: subscriptionPlans.name,
                monthlyPrice: subscriptionPlans.monthlyPrice,
                monthlyCredits: subscriptionPlans.monthlyCredits,
              })
              .from(subscriptionPlans)
              .where(eq(subscriptionPlans.id, org.planId))
              .limit(1);
            if (planResult) {
              planName = planResult.name;
              monthlyPrice = planResult.monthlyPrice;
              monthlyCredits = planResult.monthlyCredits;
            }
          }

          // Get subscription details (billing info)
          const [subscriptionResult] = await db
            .select({
              status: organizationSubscriptions.status,
              billingCycle: organizationSubscriptions.billingCycle,
              currentPeriodEnd: organizationSubscriptions.currentPeriodEnd,
              stripeSubscriptionId: organizationSubscriptions.stripeSubscriptionId,
            })
            .from(organizationSubscriptions)
            .where(eq(organizationSubscriptions.organizationId, org.id))
            .limit(1);

          // Get actual student count for this organization
          const [studentCountResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(students)
            .where(eq(students.organizationId, org.id));

          // Get credit balance
          const [creditResult] = await db
            .select({
              balance: aiCreditBalance.balance,
              periodUsed: aiCreditBalance.periodUsed,
              periodAllowance: aiCreditBalance.periodAllowance,
            })
            .from(aiCreditBalance)
            .where(eq(aiCreditBalance.organizationId, org.id))
            .limit(1);

          // Get staff/instructor count
          const [staffCountResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(teamMembers)
            .where(
              and(
                eq(teamMembers.organizationId, org.id),
                eq(teamMembers.isActive, 1)
              )
            );

          // Also count organization users (sub-users with access)
          const [subUserCountResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(organizationUsers)
            .where(eq(organizationUsers.organizationId, org.id));

          // Map subscription status to display status
          let displayStatus: "Active" | "Warning" | "Risk" | "Inactive" = "Active";
          let paymentStatus: "current" | "delinquent" | "trial" | "cancelled" = "current";
          
          const subStatus = subscriptionResult?.status || org.subscriptionStatus;
          if (subStatus === "past_due") {
            displayStatus = "Warning";
            paymentStatus = "delinquent";
          } else if (subStatus === "cancelled") {
            displayStatus = "Risk";
            paymentStatus = "cancelled";
          } else if (subStatus === "inactive") {
            displayStatus = "Inactive";
            paymentStatus = "cancelled";
          } else if (subStatus === "trial") {
            displayStatus = "Active";
            paymentStatus = "trial";
          } else if (subStatus === "active") {
            displayStatus = "Active";
            paymentStatus = "current";
          }

          // Format last activity
          let lastActivityText = "Never";
          if (org.lastActivity) {
            const now = new Date();
            const lastAct = new Date(org.lastActivity);
            const diffMs = now.getTime() - lastAct.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) {
              lastActivityText = "Just now";
            } else if (diffMins < 60) {
              lastActivityText = `${diffMins} min ago`;
            } else if (diffHours < 24) {
              lastActivityText = `${diffHours} hours ago`;
            } else if (diffDays < 7) {
              lastActivityText = `${diffDays} days ago`;
            } else {
              lastActivityText = `${Math.floor(diffDays / 7)} weeks ago`;
            }
          }

          // Parse programs if available
          let programsList: string[] = [];
          if (org.programs) {
            try {
              programsList = JSON.parse(org.programs);
            } catch {
              programsList = [org.programs];
            }
          }

          // Format next billing date
          let nextBillingDate = null;
          if (subscriptionResult?.currentPeriodEnd) {
            nextBillingDate = new Date(subscriptionResult.currentPeriodEnd).toISOString();
          }

          return {
            id: org.id,
            name: org.name,
            owner: ownerResult?.userName || "No owner",
            ownerEmail: ownerResult?.userEmail || null,
            location: org.city && org.state ? `${org.city}, ${org.state}` : "Unknown",
            fullAddress: org.address ? `${org.address}, ${org.city || ""}, ${org.state || ""} ${org.zipCode || ""}`.trim() : null,
            plan: planName as "Starter" | "Growth" | "Pro" | "Enterprise",
            status: displayStatus,
            paymentStatus,
            studentCount: Number(studentCountResult?.count) || org.estimatedStudents || 0,
            lastActivity: lastActivityText,
            logoUrl: org.logoUrl || null,
            // New fields
            credits: creditResult?.balance || 0,
            creditsUsed: creditResult?.periodUsed || 0,
            creditsAllowance: creditResult?.periodAllowance || monthlyCredits,
            monthlyPrice: monthlyPrice / 100, // Convert cents to dollars
            billingCycle: subscriptionResult?.billingCycle || "monthly",
            nextBillingDate,
            staffCount: Number(staffCountResult?.count) || 0,
            subUserCount: Number(subUserCountResult?.count) || 0,
            programs: programsList,
            timezone: org.timezone,
            trialEndsAt: org.trialEndsAt ? new Date(org.trialEndsAt).toISOString() : null,
            joinedDate: new Date(org.createdAt).toISOString(),
          };
        })
      );

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(organizations)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        schools: schoolsWithDetails,
        total: Number(countResult?.count) || 0,
      };
    }),

  /**
   * Get single school details
   */
  getSchoolDetails: platformAdminProcedure
    .input(z.object({ schoolId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [org] = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          address: organizations.address,
          city: organizations.city,
          state: organizations.state,
          zipCode: organizations.zipCode,
          timezone: organizations.timezone,
          programs: organizations.programs,
          estimatedStudents: organizations.estimatedStudents,
          launchDate: organizations.launchDate,
          logoUrl: organizations.logoUrl,
          planId: organizations.planId,
          subscriptionStatus: organizations.subscriptionStatus,
          trialEndsAt: organizations.trialEndsAt,
          createdAt: organizations.createdAt,
          updatedAt: organizations.updatedAt,
          lastActivity: organizations.lastActivity,
          settings: organizations.settings,
          onboardingStatus: organizations.onboardingStatus,
          onboardingStep: organizations.onboardingStep,
          onboardingChecklist: organizations.onboardingChecklist,
          onboardingCompletedAt: organizations.onboardingCompletedAt,
        })
        .from(organizations)
        .where(eq(organizations.id, input.schoolId));

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "School not found" });
      }

      // Get owner info
      const [ownerResult] = await db
        .select({
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
        })
        .from(organizationUsers)
        .leftJoin(users, eq(organizationUsers.userId, users.id))
        .where(
          and(
            eq(organizationUsers.organizationId, org.id),
            eq(organizationUsers.isPrimary, 1)
          )
        )
        .limit(1);

      // Get subscription details
      const [subscription] = await db
        .select()
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.organizationId, org.id));

      // Get plan details
      let planDetails = null;
      if (org.planId) {
        const [planResult] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, org.planId))
          .limit(1);
        if (planResult) {
          planDetails = planResult;
        }
      }

      // Get student count
      const [studentCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(students)
        .where(eq(students.organizationId, org.id));

      // Get credit balance
      const [creditResult] = await db
        .select()
        .from(aiCreditBalance)
        .where(eq(aiCreditBalance.organizationId, org.id));

      // Get staff members
      const staffMembers = await db
        .select({
          id: teamMembers.id,
          name: teamMembers.name,
          role: teamMembers.role,
          email: teamMembers.email,
          isActive: teamMembers.isActive,
        })
        .from(teamMembers)
        .where(eq(teamMembers.organizationId, org.id))
        .limit(20);

      // Get sub-users (organization users)
      const subUsers = await db
        .select({
          userId: organizationUsers.userId,
          role: organizationUsers.role,
          isPrimary: organizationUsers.isPrimary,
          userName: users.name,
          userEmail: users.email,
        })
        .from(organizationUsers)
        .leftJoin(users, eq(organizationUsers.userId, users.id))
        .where(eq(organizationUsers.organizationId, org.id));

      // Parse programs
      let programs: string[] = [];
      if (org.programs) {
        try {
          programs = JSON.parse(org.programs);
        } catch {
          programs = [org.programs];
        }
      }

      return {
        organization: {
          ...org,
          programs,
        },
        owner: ownerResult,
        subscription,
        planDetails,
        studentCount: Number(studentCountResult?.count) || 0,
        creditBalance: creditResult?.balance || 0,
        creditsUsed: creditResult?.periodUsed || 0,
        creditsAllowance: creditResult?.periodAllowance || 0,
        staffMembers,
        subUsers,
      };
    }),
});
