import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc.js";
import { getDb } from "./db.js";
import { classEntitlements } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

export const classEntitlementsRouter = router({
  // Get all entitlements
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const entitlements = await db
      .select()
      .from(classEntitlements)
      .where(eq(classEntitlements.isActive, 1));
    
    return entitlements;
  }),
  
  // Get single entitlement by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [entitlement] = await db
        .select()
        .from(classEntitlements)
        .where(eq(classEntitlements.id, input.id))
        .limit(1);
      
      return entitlement || null;
    }),
  
  // Create new entitlement
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      classesPerWeek: z.number().optional(),
      classesPerMonth: z.number().optional(),
      isUnlimited: z.number().default(0),
      allowedDurations: z.string().optional(),
      allowedCategories: z.string().optional(),
      requiresAdvanceBooking: z.number().default(0),
      bookingWindowDays: z.number().default(7),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(classEntitlements).values(input);
      return { id: Number(result.insertId), ...input };
    }),
  
  // Update entitlement
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      classesPerWeek: z.number().optional(),
      classesPerMonth: z.number().optional(),
      isUnlimited: z.number().optional(),
      allowedDurations: z.string().optional(),
      allowedCategories: z.string().optional(),
      requiresAdvanceBooking: z.number().optional(),
      bookingWindowDays: z.number().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updates } = input;
      await db
        .update(classEntitlements)
        .set(updates)
        .where(eq(classEntitlements.id, id));
      
      return { success: true };
    }),
  
  // Delete (soft delete) entitlement
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(classEntitlements)
        .set({ isActive: 0 })
        .where(eq(classEntitlements.id, input.id));
      
      return { success: true };
    }),
});
