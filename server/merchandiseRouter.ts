import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { merchandiseItems, studentMerchandise, students } from "../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { sendSMS } from "./_core/twilio";
import { sendEmail } from "./_core/sendgrid";
import crypto from "crypto";

/**
 * Merchandise Router
 * Handles merchandise items, student fulfillment, and confirmation flow
 */
export const merchandiseRouter = router({
  /**
   * Get all merchandise items
   */
  getItems: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });
    
    const items = await db.select({
      id: merchandiseItems.id,
      name: merchandiseItems.name,
      type: merchandiseItems.type,
      defaultPrice: merchandiseItems.defaultPrice,
      requiresSize: merchandiseItems.requiresSize,
      sizeOptions: merchandiseItems.sizeOptions,
      description: merchandiseItems.description,
      stockQuantity: merchandiseItems.stockQuantity,
      lowStockThreshold: merchandiseItems.lowStockThreshold,
      isActive: merchandiseItems.isActive,
      createdAt: merchandiseItems.createdAt,
      updatedAt: merchandiseItems.updatedAt,
    }).from(merchandiseItems).where(eq(merchandiseItems.isActive, 1));
    
    return items.map(item => ({
      ...item,
      sizeOptions: item.sizeOptions ? JSON.parse(item.sizeOptions) : null,
    }));
  }),

  /**
   * Create a new merchandise item
   */
  createItem: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      type: z.enum(["uniform", "gear", "belt", "equipment", "other"]),
      defaultPrice: z.number().int().min(0),
      requiresSize: z.boolean(),
      sizeOptions: z.array(z.string()).optional(),
      description: z.string().optional(),
      stockQuantity: z.number().int().min(0).optional(),
      lowStockThreshold: z.number().int().min(0).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });

      const [item] = await db.insert(merchandiseItems).values({
        name: input.name,
        type: input.type,
        defaultPrice: input.defaultPrice,
        requiresSize: input.requiresSize ? 1 : 0,
        sizeOptions: input.sizeOptions ? JSON.stringify(input.sizeOptions) : null,
        description: input.description,
        stockQuantity: input.stockQuantity ?? null,
        lowStockThreshold: input.lowStockThreshold ?? null,
        isActive: 1,
      });

      return { success: true, itemId: item.insertId };
    }),

  /**
   * Attach merchandise item to student
   */
  attachToStudent: protectedProcedure
    .input(z.object({
      studentId: z.number().int(),
      itemId: z.number().int(),
      size: z.string().optional(),
      pricePaid: z.number().int().min(0).default(0),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });

      // Verify student exists
      const [student] = await db.select().from(students).where(eq(students.id, input.studentId)).limit(1);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
      }

      // Verify item exists
      const [item] = await db.select().from(merchandiseItems).where(eq(merchandiseItems.id, input.itemId)).limit(1);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Merchandise item not found" });
      }

      // Check if size is required
      if (item.requiresSize && !input.size) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Size is required for this item" });
      }

      const [result] = await db.insert(studentMerchandise).values({
        studentId: input.studentId,
        itemId: input.itemId,
        size: input.size,
        pricePaid: input.pricePaid,
        fulfillmentStatus: "pending",
        notes: input.notes,
      });

      return { success: true, id: result.insertId };
    }),

  /**
   * Get pending fulfillments
   */
  getPendingFulfillments: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "handed_out", "confirmed", "disputed"]).optional(),
      programFilter: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });

      // Build query
      let query = db
        .select({
          id: studentMerchandise.id,
          studentId: studentMerchandise.studentId,
          studentName: students.firstName,
          studentLastName: students.lastName,
          program: students.program,
          beltRank: students.beltRank,
          itemId: studentMerchandise.itemId,
          itemName: merchandiseItems.name,
          itemType: merchandiseItems.type,
          size: studentMerchandise.size,
          fulfillmentStatus: studentMerchandise.fulfillmentStatus,
          handedOutAt: studentMerchandise.handedOutAt,
          confirmedAt: studentMerchandise.confirmedAt,
          createdAt: studentMerchandise.createdAt,
        })
        .from(studentMerchandise)
        .leftJoin(students, eq(studentMerchandise.studentId, students.id))
        .leftJoin(merchandiseItems, eq(studentMerchandise.itemId, merchandiseItems.id));

      // Apply filters
      const conditions = [];
      if (input.status) {
        conditions.push(eq(studentMerchandise.fulfillmentStatus, input.status));
      }
      if (input.programFilter) {
        conditions.push(eq(students.program, input.programFilter));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query;

      return results.map(r => ({
        ...r,
        studentFullName: `${r.studentName} ${r.studentLastName}`,
      }));
    }),

  /**
   * Mark item as handed out
   */
  markHandedOut: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      handedOutBy: z.number().int(),
      sendConfirmation: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });

      // Get the merchandise record with student info
      const [record] = await db
        .select({
          merchandise: studentMerchandise,
          student: students,
          item: merchandiseItems,
        })
        .from(studentMerchandise)
        .leftJoin(students, eq(studentMerchandise.studentId, students.id))
        .leftJoin(merchandiseItems, eq(studentMerchandise.itemId, merchandiseItems.id))
        .where(eq(studentMerchandise.id, input.id))
        .limit(1);

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Merchandise record not found" });
      }

      // Generate confirmation token
      const confirmationToken = crypto.randomBytes(32).toString("hex");
      const confirmationTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Update status
      await db
        .update(studentMerchandise)
        .set({
          fulfillmentStatus: "handed_out",
          handedOutAt: new Date(),
          handedOutBy: input.handedOutBy,
          confirmationToken,
          confirmationTokenExpiry,
        })
        .where(eq(studentMerchandise.id, input.id));

      // Send confirmation request if enabled
      if (input.sendConfirmation && record.student) {
        const confirmationUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/confirm-receipt/${confirmationToken}`;
        
        const message = `Hi ${record.student.firstName}, we've handed out your ${record.item?.name || "item"}${record.merchandise.size ? ` (Size: ${record.merchandise.size})` : ""}. Please confirm receipt: ${confirmationUrl}`;

        // Send SMS if phone available
        if (record.student.phone) {
          try {
            await sendSMS({
              to: record.student.phone,
              message,
            });
          } catch (error) {
            console.error("Failed to send SMS confirmation:", error);
          }
        }

        // Send email if email available
        if (record.student.email) {
          try {
            await sendEmail({
              to: record.student.email,
              subject: "Confirm Receipt of Merchandise",
              text: message,
              html: `
                <p>Hi ${record.student.firstName},</p>
                <p>We've handed out your <strong>${record.item?.name || "item"}</strong>${record.merchandise.size ? ` (Size: ${record.merchandise.size})` : ""}.</p>
                <p>Please confirm receipt by clicking the link below:</p>
                <p><a href="${confirmationUrl}">Confirm Receipt</a></p>
                <p>This link expires in 7 days.</p>
              `,
            });
          } catch (error) {
            console.error("Failed to send email confirmation:", error);
          }
        }
      }

      return { success: true };
    }),

  /**
   * Confirm receipt (public endpoint for parents)
   */
  confirmReceipt: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });

      // Find record by token
      const [record] = await db
        .select()
        .from(studentMerchandise)
        .where(eq(studentMerchandise.confirmationToken, input.token))
        .limit(1);

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid confirmation link" });
      }

      // Check if token expired
      if (record.confirmationTokenExpiry && new Date() > new Date(record.confirmationTokenExpiry)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Confirmation link has expired" });
      }

      // Update status
      await db
        .update(studentMerchandise)
        .set({
          fulfillmentStatus: "confirmed",
          confirmedAt: new Date(),
          confirmationMethod: "email", // Could be detected from referrer
        })
        .where(eq(studentMerchandise.id, record.id));

      return { success: true };
    }),

  /**
   * Mark as disputed (public endpoint for parents)
   */
  markDisputed: publicProcedure
    .input(z.object({
      token: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });

      // Find record by token
      const [record] = await db
        .select({
          merchandise: studentMerchandise,
          student: students,
          item: merchandiseItems,
        })
        .from(studentMerchandise)
        .leftJoin(students, eq(studentMerchandise.studentId, students.id))
        .leftJoin(merchandiseItems, eq(studentMerchandise.itemId, merchandiseItems.id))
        .where(eq(studentMerchandise.confirmationToken, input.token))
        .limit(1);

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid confirmation link" });
      }

      // Update status
      await db
        .update(studentMerchandise)
        .set({
          fulfillmentStatus: "disputed",
          disputeReason: input.reason,
          disputedAt: new Date(),
        })
        .where(eq(studentMerchandise.id, record.merchandise.id));

      // TODO: Send notification to staff about dispute

      return { success: true };
    }),

  /**
   * Get fulfillment history for a student
   */
  getFulfillmentHistory: protectedProcedure
    .input(z.object({
      studentId: z.number().int(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });

      const history = await db
        .select({
          id: studentMerchandise.id,
          itemName: merchandiseItems.name,
          itemType: merchandiseItems.type,
          size: studentMerchandise.size,
          pricePaid: studentMerchandise.pricePaid,
          fulfillmentStatus: studentMerchandise.fulfillmentStatus,
          handedOutAt: studentMerchandise.handedOutAt,
          confirmedAt: studentMerchandise.confirmedAt,
          confirmationMethod: studentMerchandise.confirmationMethod,
          disputeReason: studentMerchandise.disputeReason,
          disputedAt: studentMerchandise.disputedAt,
          notes: studentMerchandise.notes,
          createdAt: studentMerchandise.createdAt,
        })
        .from(studentMerchandise)
        .leftJoin(merchandiseItems, eq(studentMerchandise.itemId, merchandiseItems.id))
        .where(eq(studentMerchandise.studentId, input.studentId));

      return history;
    }),

  /**
   * Get fulfillment statistics
   */
  getStatistics: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });

    const all = await db.select().from(studentMerchandise);

    const stats = {
      pending: all.filter(r => r.fulfillmentStatus === "pending").length,
      handedOut: all.filter(r => r.fulfillmentStatus === "handed_out").length,
      confirmed: all.filter(r => r.fulfillmentStatus === "confirmed").length,
      disputed: all.filter(r => r.fulfillmentStatus === "disputed").length,
      total: all.length,
    };

    return stats;
  }),

  /**
   * Get inventory status with low stock alerts
   */
  getInventoryStatus: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });

    const items = await db.select().from(merchandiseItems).where(eq(merchandiseItems.isActive, 1));

    return items.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      stockQuantity: item.stockQuantity,
      lowStockThreshold: item.lowStockThreshold,
      isLowStock: item.stockQuantity !== null && item.lowStockThreshold !== null && item.stockQuantity <= item.lowStockThreshold,
      isOutOfStock: item.stockQuantity !== null && item.stockQuantity === 0,
      isTracked: item.stockQuantity !== null,
    }));
  }),

  /**
   * Update stock quantity for an item
   */
  updateStock: protectedProcedure
    .input(z.object({
      itemId: z.number().int(),
      stockQuantity: z.number().int().min(0).optional(),
      lowStockThreshold: z.number().int().min(0).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });

      // Verify item exists
      const [item] = await db.select().from(merchandiseItems).where(eq(merchandiseItems.id, input.itemId));
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Merchandise item not found" });
      }

      await db
        .update(merchandiseItems)
        .set({
          stockQuantity: input.stockQuantity ?? item.stockQuantity,
          lowStockThreshold: input.lowStockThreshold ?? item.lowStockThreshold,
        })
        .where(eq(merchandiseItems.id, input.itemId));

      return { success: true };
    }),

  /**
   * Bulk assign merchandise to students by program and/or belt level
   */
  bulkAssignToStudents: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      program: z.string().optional(),
      beltRank: z.string().optional(),
      sizeMappings: z.array(z.object({
        studentId: z.number(),
        size: z.string().optional(),
      })),
      pricePaid: z.number().int().min(0).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });

      // Verify item exists
      const [item] = await db.select().from(merchandiseItems).where(eq(merchandiseItems.id, input.itemId));
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Merchandise item not found" });
      }

      const successfulAssignments: number[] = [];
      const failedAssignments: Array<{ studentId: number; error: string }> = [];

      // Process each size mapping
      for (const mapping of input.sizeMappings) {
        try {
          // Verify student exists
          const [student] = await db.select().from(students).where(eq(students.id, mapping.studentId));
          if (!student) {
            failedAssignments.push({ studentId: mapping.studentId, error: "Student not found" });
            continue;
          }

          // Check if size is required
          if (item.requiresSize && !mapping.size) {
            failedAssignments.push({ studentId: mapping.studentId, error: "Size is required for this item" });
            continue;
          }

          // Check if already assigned
          const existing = await db.select()
            .from(studentMerchandise)
            .where(
              and(
                eq(studentMerchandise.studentId, mapping.studentId),
                eq(studentMerchandise.itemId, input.itemId)
              )
            );

          if (existing.length > 0) {
            failedAssignments.push({ studentId: mapping.studentId, error: "Item already assigned to this student" });
            continue;
          }

          // Create assignment
          await db.insert(studentMerchandise).values({
            studentId: mapping.studentId,
            itemId: input.itemId,
            size: mapping.size || null,
            pricePaid: input.pricePaid || item.defaultPrice,
            fulfillmentStatus: "pending",
            notes: input.notes || null,
            confirmationToken: crypto.randomBytes(32).toString("hex"),
          });

          successfulAssignments.push(mapping.studentId);
        } catch (error) {
          failedAssignments.push({
            studentId: mapping.studentId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return {
        success: true,
        successCount: successfulAssignments.length,
        failedCount: failedAssignments.length,
        successfulAssignments,
        failedAssignments,
      };
    }),
});
