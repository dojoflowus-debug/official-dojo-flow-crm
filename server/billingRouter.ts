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
