import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
// TODO: These tables don't exist in schema yet
// import { 
//   billingApplications, 
//   billingDocuments, 
//   paymentMethods,
//   billingTransactions 
// } from "../drizzle/schema";
const billingApplications = null as any;
const billingDocuments = null as any;
const paymentMethods = null as any;
const billingTransactions = null as any;
import { getDb } from "./db";
import { eq, desc } from "drizzle-orm";
import { storagePut } from "./_core/storage";

export const billingRouter = router({
  // Get all programs for billing structure
  getPrograms: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      const { programs } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      
      const result = await db.select().from(programs).orderBy(desc(programs.createdAt));
      return result;
    }),

  // Get all membership plans
  getMembershipPlans: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      const { membershipPlans } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      
      const result = await db.select().from(membershipPlans).orderBy(desc(membershipPlans.createdAt));
      return result;
    }),

  // Get all entitlements
  getEntitlements: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      const { classEntitlements } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      
      const result = await db.select().from(classEntitlements).orderBy(desc(classEntitlements.createdAt));
      return result;
    }),

  // Get all fees
  getFees: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      const { oneTimeFees } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      
      const result = await db.select().from(oneTimeFees).orderBy(desc(oneTimeFees.createdAt));
      return result;
    }),

  // Get all discounts
  getDiscounts: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      const { discounts } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      
      const result = await db.select().from(discounts).orderBy(desc(discounts.createdAt));
      return result;
    }),

  // Get all add-ons
  getAddOns: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      const { addOns } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      
      const result = await db.select().from(addOns).orderBy(desc(addOns.createdAt));
      return result;
    }),

  // ========== PROGRAMS CRUD ==========
  
  createProgram: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      termLength: z.number().optional(),
      eligibility: z.enum(["open", "invitation_only"]).default("open"),
      ageRange: z.string().optional(),
      showOnKiosk: z.number().default(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { programs } = await import("../drizzle/schema");
      
      const [program] = await db.insert(programs).values(input);
      return program;
    }),

  updateProgram: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      termLength: z.number().optional(),
      eligibility: z.enum(["open", "invitation_only"]).optional(),
      ageRange: z.string().optional(),
      showOnKiosk: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { programs } = await import("../drizzle/schema");
      
      const { id, ...updates } = input;
      await db.update(programs)
        .set(updates)
        .where(eq(programs.id, id));
      
      return { success: true };
    }),

  deleteProgram: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { programs } = await import("../drizzle/schema");
      
      await db.delete(programs).where(eq(programs.id, input.id));
      return { success: true };
    }),

  // ========== MEMBERSHIP PLANS CRUD ==========
  
  // Alias for getPlans
  getPlans: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      const { membershipPlans } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      
      const result = await db.select().from(membershipPlans).orderBy(desc(membershipPlans.createdAt));
      return result;
    }),
  
  createMembershipPlan: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      
      // Billing frequency
      billingFrequency: z.enum(["monthly", "weekly", "daily", "drop_in"]).optional(),
      
      // Pricing (unified)
      priceAmount: z.number(), // In cents - base price for the frequency
      monthlyPrice: z.number().optional(), // DEPRECATED - for backward compatibility
      
      // Billing interval and anchor
      billingInterval: z.number().default(1).optional(),
      billingAnchorDayOfWeek: z.number().min(0).max(6).optional(), // 0-6 for weekly
      
      // Term length (flexible units)
      termLength: z.number().optional(), // DEPRECATED - months
      termLengthUnits: z.enum(["months", "weeks", "days", "visits"]).optional(),
      termLengthValue: z.number().optional(),
      
      // Drop-in / Visit pack options
      perVisitPrice: z.number().optional(),
      visitPackSize: z.number().optional(),
      visitPackExpiryDays: z.number().optional(),
      chargeOnAttendance: z.number().default(0).optional(),
      
      // Legacy fields
      billingCycle: z.enum(["monthly", "quarterly", "annually"]).default("monthly").optional(),
      registrationFee: z.number().optional(),
      downPayment: z.number().optional(),
      showOnKiosk: z.number().default(1).optional(),
      isPopular: z.number().default(0).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { membershipPlans } = await import("../drizzle/schema");
      
      // Convert monthlyPrice to priceAmount and monthlyAmount for backward compatibility
      const values: any = {
        name: input.name,
        description: input.description,
        billingFrequency: input.billingFrequency || "monthly",
        priceAmount: input.priceAmount,
        monthlyAmount: input.monthlyPrice || input.priceAmount,
        billingInterval: input.billingInterval,
        billingAnchorDayOfWeek: input.billingAnchorDayOfWeek,
        termLength: input.termLength,
        termLengthUnits: input.termLengthUnits,
        termLengthValue: input.termLengthValue,
        perVisitPrice: input.perVisitPrice,
        visitPackSize: input.visitPackSize,
        visitPackExpiryDays: input.visitPackExpiryDays,
        chargeOnAttendance: input.chargeOnAttendance,
        billingCycle: input.billingCycle,
        registrationFee: input.registrationFee,
        downPayment: input.downPayment,
        showOnKiosk: input.showOnKiosk,
        isPopular: input.isPopular,
      };
      
      const [plan] = await db.insert(membershipPlans).values(values);
      return plan;
    }),

  updateMembershipPlan: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      
      // Billing frequency
      billingFrequency: z.enum(["monthly", "weekly", "daily", "drop_in"]).optional(),
      
      // Pricing
      priceAmount: z.number().optional(),
      monthlyPrice: z.number().optional(), // DEPRECATED
      
      // Billing interval and anchor
      billingInterval: z.number().optional(),
      billingAnchorDayOfWeek: z.number().min(0).max(6).optional(),
      
      // Term length
      termLength: z.number().optional(),
      termLengthUnits: z.enum(["months", "weeks", "days", "visits"]).optional(),
      termLengthValue: z.number().optional(),
      
      // Drop-in options
      perVisitPrice: z.number().optional(),
      visitPackSize: z.number().optional(),
      visitPackExpiryDays: z.number().optional(),
      chargeOnAttendance: z.number().optional(),
      
      // Legacy fields
      billingCycle: z.enum(["monthly", "quarterly", "annually"]).optional(),
      registrationFee: z.number().optional(),
      downPayment: z.number().optional(),
      showOnKiosk: z.number().optional(),
      isPopular: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { membershipPlans } = await import("../drizzle/schema");
      
      const { id, ...updates } = input;
      
      // Handle backward compatibility
      const values: any = { ...updates };
      if (updates.monthlyPrice !== undefined) {
        values.monthlyAmount = updates.monthlyPrice;
        if (!values.priceAmount) {
          values.priceAmount = updates.monthlyPrice;
        }
      }
      
      await db.update(membershipPlans)
        .set(values)
        .where(eq(membershipPlans.id, id));
      
      return { success: true };
    }),

  deleteMembershipPlan: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { membershipPlans } = await import("../drizzle/schema");
      
      await db.delete(membershipPlans).where(eq(membershipPlans.id, input.id));
      return { success: true };
    }),

  // Bulk delete membership plans
  bulkDeleteMembershipPlans: publicProcedure
    .input(z.object({
      ids: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { membershipPlans } = await import("../drizzle/schema");
      const { inArray } = await import("drizzle-orm");
      
      // Delete all plans with the given IDs
      await db.delete(membershipPlans).where(inArray(membershipPlans.id, input.ids));
      
      return { 
        success: true, 
        deletedCount: input.ids.length 
      };
    }),

  // Shorter aliases for Plans
  // Alias for createMembershipPlan with multi-frequency support
  createPlan: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      
      // Billing frequency
      billingFrequency: z.enum(["monthly", "weekly", "daily", "drop_in"]).optional(),
      
      // Pricing (unified)
      priceAmount: z.number(), // In cents - base price for the frequency
      monthlyPrice: z.number().optional(), // DEPRECATED - for backward compatibility
      
      // Billing interval and anchor
      billingInterval: z.number().default(1).optional(),
      billingAnchorDayOfWeek: z.number().min(0).max(6).optional(), // 0-6 for weekly
      
      // Term length (flexible units)
      termLength: z.number().optional(), // DEPRECATED - months
      termLengthUnits: z.enum(["months", "weeks", "days", "visits"]).optional(),
      termLengthValue: z.number().optional(),
      
      // Drop-in / Visit pack options
      perVisitPrice: z.number().optional(),
      visitPackSize: z.number().optional(),
      visitPackExpiryDays: z.number().optional(),
      chargeOnAttendance: z.number().default(0).optional(),
      
      // Legacy fields
      billingCycle: z.enum(["monthly", "quarterly", "annually"]).default("monthly").optional(),
      registrationFee: z.number().optional(),
      downPayment: z.number().optional(),
      showOnKiosk: z.number().default(1).optional(),
      isPopular: z.number().default(0).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { membershipPlans } = await import("../drizzle/schema");
      
      // Build values object, filtering out undefined to prevent Drizzle from omitting fields
      const rawValues: any = {
        name: input.name,
        description: input.description,
        billingFrequency: input.billingFrequency || "monthly",
        priceAmount: input.priceAmount,
        monthlyAmount: input.monthlyPrice || input.priceAmount,
        billingInterval: input.billingInterval,
        billingAnchorDayOfWeek: input.billingAnchorDayOfWeek,
        termLength: input.termLength,
        termLengthUnits: input.termLengthUnits,
        termLengthValue: input.termLengthValue,
        perVisitPrice: input.perVisitPrice,
        visitPackSize: input.visitPackSize,
        visitPackExpiryDays: input.visitPackExpiryDays,
        chargeOnAttendance: input.chargeOnAttendance,
        billingCycle: input.billingCycle,
        registrationFee: input.registrationFee,
        downPayment: input.downPayment,
        showOnKiosk: input.showOnKiosk,
        isPopular: input.isPopular,
      };
      
      // Filter out undefined values
      const values = Object.fromEntries(
        Object.entries(rawValues).filter(([_, v]) => v !== undefined)
      );
      
      // Use raw SQL to bypass Drizzle ORM issue with ENUM fields
      const { sql } = await import("drizzle-orm");
      
      const result: any = await db.execute(
        sql`INSERT INTO membership_plans SET 
          name = ${values.name},
          description = ${values.description},
          billingFrequency = ${values.billingFrequency},
          priceAmount = ${values.priceAmount},
          monthlyAmount = ${values.monthlyAmount},
          ${values.billingInterval !== undefined ? sql`billingInterval = ${values.billingInterval},` : sql``}
          ${values.billingAnchorDayOfWeek !== undefined ? sql`billingAnchorDayOfWeek = ${values.billingAnchorDayOfWeek},` : sql``}
          ${values.termLength !== undefined ? sql`termLength = ${values.termLength},` : sql``}
          ${values.termLengthUnits !== undefined ? sql`termLengthUnits = ${values.termLengthUnits},` : sql``}
          ${values.termLengthValue !== undefined ? sql`termLengthValue = ${values.termLengthValue},` : sql``}
          ${values.perVisitPrice !== undefined ? sql`perVisitPrice = ${values.perVisitPrice},` : sql``}
          ${values.visitPackSize !== undefined ? sql`visitPackSize = ${values.visitPackSize},` : sql``}
          ${values.visitPackExpiryDays !== undefined ? sql`visitPackExpiryDays = ${values.visitPackExpiryDays},` : sql``}
          ${values.chargeOnAttendance !== undefined ? sql`chargeOnAttendance = ${values.chargeOnAttendance},` : sql``}
          ${values.billingCycle !== undefined ? sql`billingCycle = ${values.billingCycle},` : sql``}
          ${values.registrationFee !== undefined ? sql`registrationFee = ${values.registrationFee},` : sql``}
          ${values.downPayment !== undefined ? sql`downPayment = ${values.downPayment},` : sql``}
          isPopular = ${values.isPopular || 0}
        `
      );
      
      // Fetch the inserted plan
      const { eq } = await import("drizzle-orm");
      const [plan] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, Number(result[0].insertId)));
      
      return plan;
    }),

  // Alias for updateMembershipPlan with multi-frequency support
  updatePlan: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      
      // Billing frequency
      billingFrequency: z.enum(["monthly", "weekly", "daily", "drop_in"]).optional(),
      
      // Pricing
      priceAmount: z.number().optional(),
      monthlyPrice: z.number().optional(), // DEPRECATED
      
      // Billing interval and anchor
      billingInterval: z.number().optional(),
      billingAnchorDayOfWeek: z.number().min(0).max(6).optional(),
      
      // Term length
      termLength: z.number().optional(),
      termLengthUnits: z.enum(["months", "weeks", "days", "visits"]).optional(),
      termLengthValue: z.number().optional(),
      
      // Drop-in options
      perVisitPrice: z.number().optional(),
      visitPackSize: z.number().optional(),
      visitPackExpiryDays: z.number().optional(),
      chargeOnAttendance: z.number().optional(),
      
      // Legacy fields
      billingCycle: z.enum(["monthly", "quarterly", "annually"]).optional(),
      registrationFee: z.number().optional(),
      downPayment: z.number().optional(),
      showOnKiosk: z.number().optional(),
      isPopular: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { membershipPlans } = await import("../drizzle/schema");
      
      const { id, ...updates } = input;
      
      // Handle backward compatibility
      const values: any = { ...updates };
      if (updates.monthlyPrice !== undefined) {
        values.monthlyAmount = updates.monthlyPrice;
        if (!values.priceAmount) {
          values.priceAmount = updates.monthlyPrice;
        }
      }
      
      await db.update(membershipPlans)
        .set(values)
        .where(eq(membershipPlans.id, id));
      
      return { success: true };
    }),

  deletePlan: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { membershipPlans } = await import("../drizzle/schema");
      
      await db.delete(membershipPlans).where(eq(membershipPlans.id, input.id));
      return { success: true };
    }),

  // Bulk delete plans (alias)
  bulkDeletePlans: publicProcedure
    .input(z.object({
      ids: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { membershipPlans } = await import("../drizzle/schema");
      const { inArray } = await import("drizzle-orm");
      
      // Delete all plans with the given IDs
      await db.delete(membershipPlans).where(inArray(membershipPlans.id, input.ids));
      
      return { 
        success: true, 
        deletedCount: input.ids.length 
      };
    }),

  // ========== ENTITLEMENTS CRUD ==========
  
  createEntitlement: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      classesPerWeek: z.number().optional(),
      classesPerMonth: z.number().optional(),
      isUnlimited: z.number().default(0),
      classDuration: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { classEntitlements } = await import("../drizzle/schema");
      
      const [entitlement] = await db.insert(classEntitlements).values(input);
      return entitlement;
    }),

  updateEntitlement: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      classesPerWeek: z.number().optional(),
      classesPerMonth: z.number().optional(),
      isUnlimited: z.number().optional(),
      classDuration: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { classEntitlements } = await import("../drizzle/schema");
      
      const { id, ...updates } = input;
      await db.update(classEntitlements)
        .set(updates)
        .where(eq(classEntitlements.id, id));
      
      return { success: true };
    }),

  deleteEntitlement: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { classEntitlements } = await import("../drizzle/schema");
      
      await db.delete(classEntitlements).where(eq(classEntitlements.id, input.id));
      return { success: true };
    }),

  // ========== FEES CRUD ==========
  
  createFee: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      amount: z.number(),
      feeType: z.enum(["one_time", "recurring"]).default("one_time"),
      chargeWhen: z.enum(["signup", "testing_event", "certification_event", "manual"]).default("signup"),
      isRequired: z.number().default(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { oneTimeFees } = await import("../drizzle/schema");
      
      const [fee] = await db.insert(oneTimeFees).values(input);
      return fee;
    }),

  updateFee: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      amount: z.number().optional(),
      feeType: z.enum(["one_time", "recurring"]).optional(),
      chargeWhen: z.enum(["signup", "testing_event", "certification_event", "manual"]).optional(),
      isRequired: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { oneTimeFees } = await import("../drizzle/schema");
      
      const { id, ...updates } = input;
      await db.update(oneTimeFees)
        .set(updates)
        .where(eq(oneTimeFees.id, id));
      
      return { success: true };
    }),

  deleteFee: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { oneTimeFees } = await import("../drizzle/schema");
      
      await db.delete(oneTimeFees).where(eq(oneTimeFees.id, input.id));
      return { success: true };
    }),

  // ========== DISCOUNTS CRUD ==========
  
  createDiscount: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      discountType: z.enum(["percentage", "fixed_amount", "waive_fee"]).default("fixed_amount"),
      discountValue: z.number().optional(),
      eligibilityRules: z.string().optional(),
      requiresApproval: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { discounts } = await import("../drizzle/schema");
      
      const [discount] = await db.insert(discounts).values(input);
      return discount;
    }),

  updateDiscount: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      discountType: z.enum(["percentage", "fixed_amount", "waive_fee"]).optional(),
      discountValue: z.number().optional(),
      eligibilityRules: z.string().optional(),
      requiresApproval: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { discounts } = await import("../drizzle/schema");
      
      const { id, ...updates } = input;
      await db.update(discounts)
        .set(updates)
        .where(eq(discounts.id, id));
      
      return { success: true };
    }),

  deleteDiscount: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { discounts } = await import("../drizzle/schema");
      
      await db.delete(discounts).where(eq(discounts.id, input.id));
      return { success: true };
    }),

  // ========== ADD-ONS CRUD ==========
  
  createAddOn: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      price: z.number(),
      category: z.enum(["workshop", "event", "service", "merchandise"]).default("workshop"),
      capacity: z.number().optional(),
      currentEnrollment: z.number().default(0),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { addOns } = await import("../drizzle/schema");
      
      const [addOn] = await db.insert(addOns).values(input);
      return addOn;
    }),

  updateAddOn: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      price: z.number().optional(),
      category: z.enum(["workshop", "event", "service", "merchandise"]).optional(),
      capacity: z.number().optional(),
      currentEnrollment: z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { addOns } = await import("../drizzle/schema");
      
      const { id, ...updates } = input;
      await db.update(addOns)
        .set(updates)
        .where(eq(addOns.id, id));
      
      return { success: true };
    }),

  deleteAddOn: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { addOns } = await import("../drizzle/schema");
      
      await db.delete(addOns).where(eq(addOns.id, input.id));
      return { success: true };
    }),

  // ========== EXISTING BILLING METHODS ==========

  // Create PC Bancard application
  createPCBancardApplication: publicProcedure
    .input(z.object({
      provider: z.enum(["pcbancard", "stripe"]),
      businessName: z.string().optional(),
      dbaName: z.string().optional(),
      businessAddress: z.string().optional(),
      businessPhone: z.string().optional(),
      ownerName: z.string().optional(),
      ownerCell: z.string().optional(),
      managerName: z.string().optional(),
      managerCell: z.string().optional(),
      hoursOfOperation: z.string().optional(),
      daysOfOperation: z.string().optional(),
      estimatedMonthlyVolume: z.number().optional(),
      specialInstructions: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [application] = await db.insert(billingApplications).values({
        userId: ctx.user?.id,
        provider: input.provider,
        status: "draft",
        businessName: input.businessName,
        dbaName: input.dbaName,
        businessAddress: input.businessAddress,
        businessPhone: input.businessPhone,
        ownerName: input.ownerName,
        ownerCell: input.ownerCell,
        managerName: input.managerName,
        managerCell: input.managerCell,
        hoursOfOperation: input.hoursOfOperation,
        daysOfOperation: input.daysOfOperation,
        estimatedMonthlyVolume: input.estimatedMonthlyVolume,
        specialInstructions: input.specialInstructions,
      });

      return application;
    }),

  // Upload document to S3
  uploadDocument: publicProcedure
    .input(z.object({
      applicationId: z.number(),
      documentType: z.enum([
        "drivers_license",
        "voided_check",
        "state_ein",
        "address_verification",
        "bank_letter"
      ]),
      file: z.any(), // File object from FormData
    }))
    .mutation(async ({ input }) => {
      // In a real implementation, this would handle file upload to S3
      // For now, we'll create a placeholder record
      
      // Generate S3 key
      const timestamp = Date.now();
      const s3Key = `billing-documents/${input.applicationId}/${input.documentType}-${timestamp}`;
      
      // TODO: Implement actual S3 upload using storagePut
      // const fileBuffer = await input.file.arrayBuffer();
      // const result = await storagePut(s3Key, Buffer.from(fileBuffer), input.file.type);
      
      // Placeholder URL (in production, this would be the actual S3 URL)
      const s3Url = `https://s3.amazonaws.com/bucket/${s3Key}`;

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [document] = await db.insert(billingDocuments).values({
        applicationId: input.applicationId,
        documentType: input.documentType,
        s3Key,
        s3Url,
        fileName: `${input.documentType}.pdf`,
        fileSize: 0, // Would be actual file size
        mimeType: "application/pdf",
        verified: 0,
      });

      return document;
    }),

  // Submit application for review
  submitApplication: publicProcedure
    .input(z.object({
      applicationId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(billingApplications)
        .set({
          status: "submitted",
          submittedAt:new Date().toISOString(),
        })
        .where(eq(billingApplications.id, input.applicationId));

      return { success: true };
    }),

  // Get all applications for current user
  getApplications: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user?.id) {
        return [];
      }

      const db = await getDb();
      if (!db) return [];
      
      const applications = await db.select()
        .from(billingApplications)
        .where(eq(billingApplications.userId, ctx.user.id))
        .orderBy(desc(billingApplications.createdAt));

      return applications;
    }),

  // Get application by ID with documents
  getApplication: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [application] = await db.select()
        .from(billingApplications)
        .where(eq(billingApplications.id, input.id));

      if (!application) {
        throw new Error("Application not found");
      }

      const documents = await db.select()
        .from(billingDocuments)
        .where(eq(billingDocuments.applicationId, input.id));

      return {
        ...application,
        documents,
      };
    }),

  // Get all payment methods
  getPaymentMethods: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      const methods = await db.select()
        .from(paymentMethods)
        .orderBy(desc(paymentMethods.isPrimary), desc(paymentMethods.createdAt));

      return methods;
    }),

  // Get active payment method
  getActivePaymentMethod: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return null;
      
      const [method] = await db.select()
        .from(paymentMethods)
        .where(eq(paymentMethods.isActive, 1))
        .orderBy(desc(paymentMethods.isPrimary))
        .limit(1);

      return method || null;
    }),

  // Create payment method
  createPaymentMethod: publicProcedure
    .input(z.object({
      provider: z.enum(["pcbancard", "stripe", "square", "other"]),
      providerName: z.string().optional(),
      merchantId: z.string().optional(),
      apiKey: z.string().optional(),
      apiSecret: z.string().optional(),
      webhookSecret: z.string().optional(),
      isActive: z.number().default(0),
      isPrimary: z.number().default(0),
      applicationId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [method] = await db.insert(paymentMethods).values(input);
      return method;
    }),

  // Get recent transactions
  getTransactions: publicProcedure
    .input(z.object({
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const transactions = await db.select()
        .from(billingTransactions)
        .orderBy(desc(billingTransactions.createdAt))
        .limit(input.limit);

      return transactions;
    }),

  // Create transaction
  createTransaction: publicProcedure
    .input(z.object({
      transactionId: z.string(),
      paymentMethodId: z.number(),
      studentId: z.number().optional(),
      customerName: z.string().optional(),
      customerEmail: z.string().optional(),
      amount: z.number(),
      currency: z.string().default("USD"),
      status: z.enum(["pending", "completed", "failed", "refunded", "disputed"]).default("pending"),
      cardLast4: z.string().optional(),
      cardBrand: z.string().optional(),
      programId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [transaction] = await db.insert(billingTransactions).values({
        ...input,
        processedAt: input.status === "completed" ? new Date() : undefined,
      });

      return transaction;
    }),

  // ========== TRIAL & SUBSCRIPTION MANAGEMENT ==========

  // Create a $1 trial charge and set up subscription
  createTrial: publicProcedure
    .input(
      z.object({
        organizationId: z.number(),
        email: z.string().email(),
        paymentMethodId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { organizations, platformSubscriptions } = await import("../drizzle/schema");

        // Get organization
        const org = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, input.organizationId))
          .limit(1);

        if (!org || org.length === 0) {
          throw new Error("Organization not found");
        }

        const organization = org[0];

        // Create or get Stripe customer
        let stripeCustomerId = null;
        const existingSub = await db
          .select()
          .from(platformSubscriptions)
          .where(eq(platformSubscriptions.organizationId, input.organizationId))
          .limit(1);

        if (existingSub && existingSub.length > 0 && existingSub[0].stripeCustomerId) {
          stripeCustomerId = existingSub[0].stripeCustomerId;
        } else {
          const stripe = require("stripe")(process.env.DOJO_STRIPE_SECRET_KEY);
          const customer = await stripe.customers.create({
            email: input.email,
            metadata: {
              organizationId: input.organizationId,
              organizationName: organization.name,
            },
          });
          stripeCustomerId = customer.id;
        }

        // Create $1 trial charge
        const stripe = require("stripe")(process.env.DOJO_STRIPE_SECRET_KEY);
        const charge = await stripe.charges.create({
          amount: 100, // $1.00 in cents
          currency: "usd",
          customer: stripeCustomerId,
          payment_method: input.paymentMethodId,
          off_session: true,
          description: `DojoFlow 7-day trial for ${organization.name}`,
        });

        // Calculate trial end date (7 days from now)
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);

        // Update organization with trial info
        await db
          .update(organizations)
          .set({
            subscriptionStatus: "trial",
            trialEndsAt: trialEndsAt.toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(organizations.id, input.organizationId));

        // Create or update platform subscription
        const existingSubRecord = await db
          .select()
          .from(platformSubscriptions)
          .where(eq(platformSubscriptions.organizationId, input.organizationId))
          .limit(1);

        if (existingSubRecord && existingSubRecord.length > 0) {
          await db
            .update(platformSubscriptions)
            .set({
              stripeCustomerId,
              billingStatus: "trialing",
              currentPeriodStart: new Date().toISOString(),
              currentPeriodEnd: trialEndsAt.toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .where(eq(platformSubscriptions.organizationId, input.organizationId));
        } else {
          await db.insert(platformSubscriptions).values({
            organizationId: input.organizationId,
            plan: "starter",
            billingStatus: "trialing",
            stripeCustomerId,
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: trialEndsAt.toISOString(),
          });
        }

        return {
          success: true,
          message: "Trial started successfully",
          trialEndsAt: trialEndsAt.toISOString(),
          chargeId: charge.id,
        };
      } catch (error: any) {
        console.error("Trial creation error:", error);
        throw new Error(`Failed to create trial: ${error.message}`);
      }
    }),

  // Upgrade trial to paid subscription ($49/month)
  upgradeToPaid: publicProcedure
    .input(
      z.object({
        organizationId: z.number(),
        paymentMethodId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { organizations, platformSubscriptions } = await import("../drizzle/schema");

        // Get subscription
        const sub = await db
          .select()
          .from(platformSubscriptions)
          .where(eq(platformSubscriptions.organizationId, input.organizationId))
          .limit(1);

        if (!sub || sub.length === 0) {
          throw new Error("Subscription not found");
        }

        const subscription = sub[0];
        const stripeCustomerId = subscription.stripeCustomerId;

        if (!stripeCustomerId) {
          throw new Error("Stripe customer not found");
        }

        // Create monthly subscription ($49/month)
        const stripe = require("stripe")(process.env.DOJO_STRIPE_SECRET_KEY);
        const stripeSubscription = await stripe.subscriptions.create({
          customer: stripeCustomerId,
          items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "DojoFlow Pro",
                  description: "Professional dojo management software",
                },
                unit_amount: 4900, // $49.00 in cents
                recurring: {
                  interval: "month",
                  interval_count: 1,
                },
              },
            },
          ],
          payment_method: input.paymentMethodId,
          off_session: true,
          default_payment_method: input.paymentMethodId,
        });

        // Update organization subscription status
        await db
          .update(organizations)
          .set({
            subscriptionStatus: "active",
            trialEndsAt: null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(organizations.id, input.organizationId));

        // Update platform subscription
        await db
          .update(platformSubscriptions)
          .set({
            plan: "pro",
            billingStatus: "active",
            stripeSubscriptionId: stripeSubscription.id,
            currentPeriodStart: new Date(
              stripeSubscription.current_period_start * 1000
            ).toISOString(),
            currentPeriodEnd: new Date(
              stripeSubscription.current_period_end * 1000
            ).toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(platformSubscriptions.organizationId, input.organizationId));

        return {
          success: true,
          message: "Upgraded to paid subscription",
          subscriptionId: stripeSubscription.id,
        };
      } catch (error: any) {
        console.error("Upgrade error:", error);
        throw new Error(`Failed to upgrade subscription: ${error.message}`);
      }
    }),

  // Get subscription status
  getSubscriptionStatus: publicProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { organizations, platformSubscriptions } = await import("../drizzle/schema");

        const org = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, input.organizationId))
          .limit(1);

        if (!org || org.length === 0) {
          throw new Error("Organization not found");
        }

        const organization = org[0];

        const sub = await db
          .select()
          .from(platformSubscriptions)
          .where(eq(platformSubscriptions.organizationId, input.organizationId))
          .limit(1);

        const subscription = sub && sub.length > 0 ? sub[0] : null;

        return {
          organizationId: input.organizationId,
          subscriptionStatus: organization.subscriptionStatus,
          trialEndsAt: organization.trialEndsAt,
          plan: subscription?.plan || "free",
          billingStatus: subscription?.billingStatus || "none",
          currentPeriodEnd: subscription?.currentPeriodEnd,
        };
      } catch (error: any) {
        console.error("Get subscription status error:", error);
        throw new Error(`Failed to get subscription status: ${error.message}`);
      }
    }),

});
