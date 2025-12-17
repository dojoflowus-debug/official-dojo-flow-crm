import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc.js";
import { getDb } from "./db.js";
import { oneTimeFees } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

export const oneTimeFeesRouter = router({
  // Get all fees
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const fees = await db
      .select()
      .from(oneTimeFees)
      .where(eq(oneTimeFees.isActive, 1));
    
    return fees;
  }),
  
  // Get single fee by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [fee] = await db
        .select()
        .from(oneTimeFees)
        .where(eq(oneTimeFees.id, input.id))
        .limit(1);
      
      return fee || null;
    }),
  
  // Create new fee
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      amount: z.number(),
      feeType: z.enum(["registration", "down_payment", "certification", "testing", "equipment", "uniform", "other"]),
      chargeWhen: z.enum(["signup", "first_class", "certification_event", "testing_event", "manual"]).default("signup"),
      applicableToPrograms: z.string().optional(),
      applicableToPlans: z.string().optional(),
      isRequired: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(oneTimeFees).values(input);
      return { id: Number(result.insertId), ...input };
    }),
  
  // Update fee
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      amount: z.number().optional(),
      feeType: z.enum(["registration", "down_payment", "certification", "testing", "equipment", "uniform", "other"]).optional(),
      chargeWhen: z.enum(["signup", "first_class", "certification_event", "testing_event", "manual"]).optional(),
      applicableToPrograms: z.string().optional(),
      applicableToPlans: z.string().optional(),
      isRequired: z.number().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updates } = input;
      await db
        .update(oneTimeFees)
        .set(updates)
        .where(eq(oneTimeFees.id, id));
      
      return { success: true };
    }),
  
  // Delete (soft delete) fee
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(oneTimeFees)
        .set({ isActive: 0 })
        .where(eq(oneTimeFees.id, input.id));
      
      return { success: true };
    }),
});
