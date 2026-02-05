/**
 * Classes Router - Class schedule management
 * Provides endpoints for managing class schedules across locations
 */

import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const classesRouter = router({
  /**
   * Get all classes for the current organization
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    const { classes } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    // Get organization ID from context
    const organizationId = ctx.currentOrganizationId;
    
    if (!organizationId) {
      // Return empty array for unauthenticated users or users without org
      return [];
    }

    const result = await ctx.db
      .select()
      .from(classes)
      .where(
        and(
          eq(classes.organizationId, organizationId),
          eq(classes.isActive, 1)
        )
      )
      .orderBy(classes.dayOfWeek, classes.time);

    return result;
  }),

  /**
   * Get classes by location ID
   */
  getByLocation: publicProcedure
    .input(z.object({ locationId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { classes } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const result = await ctx.db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.locationId, input.locationId),
            eq(classes.isActive, 1)
          )
        )
        .orderBy(classes.dayOfWeek, classes.time);

      return result;
    }),

  /**
   * Get classes by day of week
   */
  getByDay: publicProcedure
    .input(z.object({ dayOfWeek: z.string(), locationId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { classes } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const organizationId = ctx.currentOrganizationId;
      
      if (!organizationId) {
        return [];
      }

      const conditions = [
        eq(classes.organizationId, organizationId),
        eq(classes.dayOfWeek, input.dayOfWeek),
        eq(classes.isActive, 1)
      ];

      if (input.locationId) {
        conditions.push(eq(classes.locationId, input.locationId));
      }

      const result = await ctx.db
        .select()
        .from(classes)
        .where(and(...conditions))
        .orderBy(classes.time);

      return result;
    }),

  /**
   * Get available class times (for chatbot scheduling)
   */
  getAvailableTimes: publicProcedure
    .input(z.object({ 
      locationId: z.number().optional(),
      program: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { classes } = await import("../drizzle/schema");
      const { eq, and, lt } = await import("drizzle-orm");

      const organizationId = ctx.currentOrganizationId;
      
      if (!organizationId) {
        return [];
      }

      const conditions = [
        eq(classes.organizationId, organizationId),
        eq(classes.isActive, 1),
        // Only show classes with available spots
        lt(classes.enrolled, classes.capacity)
      ];

      if (input.locationId) {
        conditions.push(eq(classes.locationId, input.locationId));
      }

      if (input.program) {
        conditions.push(eq(classes.program, input.program));
      }

      const result = await ctx.db
        .select({
          id: classes.id,
          name: classes.name,
          dayOfWeek: classes.dayOfWeek,
          time: classes.time,
          program: classes.program,
          level: classes.level,
          instructor: classes.instructor,
          availableSpots: classes.capacity - classes.enrolled,
          capacity: classes.capacity,
          enrolled: classes.enrolled,
        })
        .from(classes)
        .where(and(...conditions))
        .orderBy(classes.dayOfWeek, classes.time);

      return result;
    }),

  /**
   * Create a new class
   */
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      dayOfWeek: z.string(),
      time: z.string(),
      capacity: z.number().default(20),
      instructor: z.string().optional(),
      instructorId: z.number().optional(),
      program: z.string().optional(),
      level: z.string().optional(),
      room: z.string().optional(),
      ageRange: z.string().optional(),
      locationId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      duration: z.number().default(60),
      recurringPattern: z.enum(['weekly', 'biweekly', 'monthly', 'one_time']).default('weekly'),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { classes } = await import("../drizzle/schema");
      const organizationId = ctx.currentOrganizationId;

      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization found",
        });
      }

      const result = await ctx.db.insert(classes).values({
        ...input,
        organizationId,
        enrolled: 0,
        isActive: 1,
      });

      return { success: true, id: result.insertId };
    }),

  /**
   * Update a class
   */
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      dayOfWeek: z.string().optional(),
      time: z.string().optional(),
      capacity: z.number().optional(),
      instructor: z.string().optional(),
      instructorId: z.number().optional(),
      program: z.string().optional(),
      level: z.string().optional(),
      room: z.string().optional(),
      ageRange: z.string().optional(),
      locationId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      duration: z.number().optional(),
      recurringPattern: z.enum(['weekly', 'biweekly', 'monthly', 'one_time']).optional(),
      notes: z.string().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { classes } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const { id, ...updateData } = input;

      await ctx.db
        .update(classes)
        .set(updateData)
        .where(eq(classes.id, id));

      return { success: true };
    }),

  /**
   * Delete a class (soft delete)
   */
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      if (!ctx.db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { classes } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      await ctx.db
        .update(classes)
        .set({ isActive: 0 })
        .where(eq(classes.id, input.id));

      return { success: true };
    }),
});
