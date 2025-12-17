import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  billingApplications, 
  billingDocuments, 
  paymentMethods,
  billingTransactions 
} from "../drizzle/schema";
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
  
  createMembershipPlan: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      monthlyPrice: z.number(),
      termLength: z.number().default(12),
      billingCycle: z.enum(["monthly", "quarterly", "annually"]).default("monthly"),
      registrationFee: z.number().optional(),
      downPayment: z.number().optional(),
      showOnKiosk: z.number().default(1),
      isPopular: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { membershipPlans } = await import("../drizzle/schema");
      
      const [plan] = await db.insert(membershipPlans).values(input);
      return plan;
    }),

  updateMembershipPlan: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      monthlyPrice: z.number().optional(),
      termLength: z.number().optional(),
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
      await db.update(membershipPlans)
        .set(updates)
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
          submittedAt: new Date(),
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
});
