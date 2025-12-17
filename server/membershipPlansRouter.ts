import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc.js";
import { getDb } from "./db.js";
import { membershipPlans } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

export const membershipPlansRouter = router({
  // Get all membership plans
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const plans = await db
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.isActive, 1))
      .orderBy(membershipPlans.sortOrder);
    
    return plans;
  }),
  
  // Get single plan by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [plan] = await db
        .select()
        .from(membershipPlans)
        .where(eq(membershipPlans.id, input.id))
        .limit(1);
      
      return plan || null;
    }),
  
  // Create new membership plan
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      monthlyAmount: z.number(),
      termLength: z.number().optional(),
      billingCycle: z.enum(["monthly", "biweekly", "weekly", "annual"]).default("monthly"),
      billingDays: z.string().optional(),
      downPayment: z.number().default(0),
      registrationFee: z.number().default(0),
      autoRenew: z.number().default(1),
      cancellationPolicy: z.string().optional(),
      isPopular: z.number().default(0),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(membershipPlans).values(input);
      return { id: Number(result.insertId), ...input };
    }),
  
  // Update membership plan
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      monthlyAmount: z.number().optional(),
      termLength: z.number().optional(),
      billingCycle: z.enum(["monthly", "biweekly", "weekly", "annual"]).optional(),
      billingDays: z.string().optional(),
      downPayment: z.number().optional(),
      registrationFee: z.number().optional(),
      autoRenew: z.number().optional(),
      cancellationPolicy: z.string().optional(),
      isPopular: z.number().optional(),
      sortOrder: z.number().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updates } = input;
      await db
        .update(membershipPlans)
        .set(updates)
        .where(eq(membershipPlans.id, id));
      
      return { success: true };
    }),
  
  // Delete (soft delete) membership plan
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(membershipPlans)
        .set({ isActive: 0 })
        .where(eq(membershipPlans.id, input.id));
      
      return { success: true };
    }),
});
