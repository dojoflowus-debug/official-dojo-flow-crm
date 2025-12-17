import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc.js";
import { getDb } from "./db.js";
import { addOns } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

export const addOnsRouter = router({
  // Get all add-ons
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const allAddOns = await db
      .select()
      .from(addOns)
      .where(eq(addOns.isActive, 1))
      .orderBy(addOns.sortOrder);
    
    return allAddOns;
  }),
  
  // Get single add-on by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [addOn] = await db
        .select()
        .from(addOns)
        .where(eq(addOns.id, input.id))
        .limit(1);
      
      return addOn || null;
    }),
  
  // Create new add-on
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      addOnType: z.enum(["seminar", "workshop", "tournament", "camp", "merchandise", "equipment", "private_lesson", "other"]),
      price: z.number(),
      pricingType: z.enum(["one_time", "per_session", "subscription"]).default("one_time"),
      availableFrom: z.string().optional(),
      availableUntil: z.string().optional(),
      maxCapacity: z.number().optional(),
      requiresMembership: z.number().default(0),
      minimumBeltRank: z.string().optional(),
      showOnKiosk: z.number().default(1),
      showOnEnrollment: z.number().default(1),
      imageUrl: z.string().optional(),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(addOns).values(input);
      return { id: Number(result.insertId), ...input };
    }),
  
  // Update add-on
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      addOnType: z.enum(["seminar", "workshop", "tournament", "camp", "merchandise", "equipment", "private_lesson", "other"]).optional(),
      price: z.number().optional(),
      pricingType: z.enum(["one_time", "per_session", "subscription"]).optional(),
      availableFrom: z.string().optional(),
      availableUntil: z.string().optional(),
      maxCapacity: z.number().optional(),
      requiresMembership: z.number().optional(),
      minimumBeltRank: z.string().optional(),
      showOnKiosk: z.number().optional(),
      showOnEnrollment: z.number().optional(),
      imageUrl: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updates } = input;
      await db
        .update(addOns)
        .set(updates)
        .where(eq(addOns.id, id));
      
      return { success: true };
    }),
  
  // Delete (soft delete) add-on
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(addOns)
        .set({ isActive: 0 })
        .where(eq(addOns.id, input.id));
      
      return { success: true };
    }),
});
