import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router, protectedProcedure } from "./trpc";
import { getDashboardStats } from "../db";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  stats: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      try {
        const stats = await getDashboardStats(ctx.currentOrganizationId);
        return stats || {
          total_students: 0,
          active_students: 0,
          todays_attendance: 0,
          new_leads: 0,
          trials_scheduled: 0,
          new_enrollments: 0,
          monthly_revenue: 0,
          total_leads: 0,
          alerts: [],
          todays_classes: []
        };
      } catch (error) {
        console.error('[systemRouter.stats] Error fetching stats:', error);
        return {
          total_students: 0,
          active_students: 0,
          todays_attendance: 0,
          new_leads: 0,
          trials_scheduled: 0,
          new_enrollments: 0,
          monthly_revenue: 0,
          total_leads: 0,
          alerts: [],
          todays_classes: []
        };
      }
    }),
});
