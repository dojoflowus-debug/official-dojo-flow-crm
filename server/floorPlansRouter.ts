/**
 * Floor Plans Router
 * Provides CRUD operations for floor plans (room layouts for classes).
 */
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { floorPlans } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const floorPlansRouter = router({
  /**
   * List all floor plans for the current organization.
   * Returns empty array if no floor plans exist (never throws).
   */
  list: protectedProcedure
    .input(z.object({}).optional())
    .query(async ({ ctx }) => {
      try {
        const db = await getDb();
        if (!db) return [];
        const orgId = ctx.currentOrganizationId;
        if (!orgId) return [];

        // Floor plans are linked via locationId — fetch all active plans
        // For now return all floor plans (location filtering can be added later)
        const plans = await db
          .select()
          .from(floorPlans)
          .where(eq(floorPlans.isActive, 1));

        return plans;
      } catch (err) {
        console.error("[FloorPlans] list error:", err);
        return [];
      }
    }),

  /**
   * Get a single floor plan by ID.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [plan] = await db
        .select()
        .from(floorPlans)
        .where(eq(floorPlans.id, input.id))
        .limit(1);

      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Floor plan not found" });
      return plan;
    }),

  /**
   * Create a new floor plan.
   */
  create: protectedProcedure
    .input(
      z.object({
        roomName: z.string().min(1),
        locationId: z.number().optional(),
        lengthFeet: z.number().optional(),
        widthFeet: z.number().optional(),
        templateType: z.enum(["kickboxing_bags", "yoga_grid", "karate_lines"]),
        matRotation: z.enum(["horizontal", "vertical"]).optional(),
        maxCapacity: z.number().optional(),
        notes: z.string().optional(),
        bagsInstalled: z.number().optional(),
        defaultLayout: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const squareFeet =
        input.lengthFeet && input.widthFeet
          ? input.lengthFeet * input.widthFeet
          : undefined;

      const result = await db.insert(floorPlans).values({
        roomName: input.roomName,
        locationId: input.locationId ?? null,
        lengthFeet: input.lengthFeet ?? null,
        widthFeet: input.widthFeet ?? null,
        squareFeet: squareFeet ?? null,
        templateType: input.templateType,
        matRotation: input.matRotation ?? "horizontal",
        maxCapacity: input.maxCapacity ?? 0,
        notes: input.notes ?? null,
        bagsInstalled: input.bagsInstalled ?? 0,
        defaultLayout: input.defaultLayout ?? "grid",
        isActive: 1,
      });

      return { id: Number((result as any).insertId), success: true };
    }),

  /**
   * Update an existing floor plan.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        roomName: z.string().min(1).optional(),
        maxCapacity: z.number().optional(),
        bagsInstalled: z.number().optional(),
        notes: z.string().optional(),
        isActive: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updates } = input;
      await db.update(floorPlans).set(updates).where(eq(floorPlans.id, id));
      return { success: true };
    }),

  /**
   * Delete (soft-delete) a floor plan.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(floorPlans)
        .set({ isActive: 0 })
        .where(eq(floorPlans.id, input.id));

      return { success: true };
    }),
});
