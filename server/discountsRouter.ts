import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc.js";
import { getDb } from "./db.js";
import { discounts } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

export const discountsRouter = router({
  // Get all discounts
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const allDiscounts = await db
      .select()
      .from(discounts)
      .where(eq(discounts.isActive, 1));
    
    return allDiscounts;
  }),
  
  // Get single discount by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [discount] = await db
        .select()
        .from(discounts)
        .where(eq(discounts.id, input.id))
        .limit(1);
      
      return discount || null;
    }),
  
  // Create new discount
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      discountType: z.enum(["percentage", "fixed_amount", "waive_fee", "special_rate"]),
      discountValue: z.number(),
      appliesTo: z.enum(["monthly_fee", "registration_fee", "down_payment", "all_fees"]),
      eligibilityRules: z.string().optional(),
      applicableToPrograms: z.string().optional(),
      applicableToPlans: z.string().optional(),
      validFrom: z.string().optional(),
      validUntil: z.string().optional(),
      maxUses: z.number().optional(),
      requiresApproval: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(discounts).values(input);
      return { id: Number(result.insertId), ...input };
    }),
  
  // Update discount
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      discountType: z.enum(["percentage", "fixed_amount", "waive_fee", "special_rate"]).optional(),
      discountValue: z.number().optional(),
      appliesTo: z.enum(["monthly_fee", "registration_fee", "down_payment", "all_fees"]).optional(),
      eligibilityRules: z.string().optional(),
      applicableToPrograms: z.string().optional(),
      applicableToPlans: z.string().optional(),
      validFrom: z.string().optional(),
      validUntil: z.string().optional(),
      maxUses: z.number().optional(),
      requiresApproval: z.number().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updates } = input;
      await db
        .update(discounts)
        .set(updates)
        .where(eq(discounts.id, id));
      
      return { success: true };
    }),
  
  // Delete (soft delete) discount
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(discounts)
        .set({ isActive: 0 })
        .where(eq(discounts.id, input.id));
      
      return { success: true };
    }),
});
