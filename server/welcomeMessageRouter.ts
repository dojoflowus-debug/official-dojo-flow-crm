import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { welcomeMessages, users } from "../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const welcomeMessageRouter = router({
  /**
   * Get welcome message for new Google Sign-In users
   * Returns the active welcome message if user hasn't seen it yet
   */
  getWelcomeMessage: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        // Check if user has already seen the welcome message
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1)
          .then((rows) => rows[0]);

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // If user has already seen the welcome message, return null
        if (user.welcomeMessageSeen) {
          return null;
        }

        // Check if user signed in with Google
        if (user.authProvider !== "google") {
          return null;
        }

        // Get the active welcome message
        const welcomeMessage = await db
          .select()
          .from(welcomeMessages)
          .where(
            and(
              eq(welcomeMessages.isActive, 1),
              eq(welcomeMessages.showForNewGoogleUsers, 1),
              // Get organization-specific message or global message (organizationId is NULL)
              isNull(welcomeMessages.organizationId)
            )
          )
          .orderBy(welcomeMessages.id)
          .limit(1)
          .then((rows) => rows[0]);

        return welcomeMessage || null;
      } catch (error) {
        console.error("[WelcomeMessage] Error fetching welcome message:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch welcome message",
        });
      }
    }),

  /**
   * Mark welcome message as seen by user
   */
  markWelcomeMessageSeen: protectedProcedure
    .input(z.object({ messageId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        await db
          .update(users)
          .set({ welcomeMessageSeen: 1 })
          .where(eq(users.id, ctx.user.id));

        return { success: true };
      } catch (error) {
        console.error("[WelcomeMessage] Error marking message as seen:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark welcome message as seen",
        });
      }
    }),

  /**
   * Admin: Create or update welcome message
   */
  upsertWelcomeMessage: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        title: z.string().min(1).max(255),
        message: z.string().min(1),
        subMessage: z.string().optional(),
        ctaText: z.string().max(100).default("Get Started"),
        ctaUrl: z.string().url().optional(),
        imageUrl: z.string().url().optional(),
        isActive: z.number().default(1),
        showForNewGoogleUsers: z.number().default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user is admin
        if (ctx.user.role !== "admin" && ctx.user.role !== "owner") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can manage welcome messages",
          });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        if (input.id) {
          // Update existing message
          await db
            .update(welcomeMessages)
            .set({
              title: input.title,
              message: input.message,
              subMessage: input.subMessage,
              ctaText: input.ctaText,
              ctaUrl: input.ctaUrl,
              imageUrl: input.imageUrl,
              isActive: input.isActive,
              showForNewGoogleUsers: input.showForNewGoogleUsers,
            })
            .where(eq(welcomeMessages.id, input.id));

          return { success: true, id: input.id };
        } else {
          // Create new message
          const [result] = await db.insert(welcomeMessages).values({
            title: input.title,
            message: input.message,
            subMessage: input.subMessage,
            ctaText: input.ctaText,
            ctaUrl: input.ctaUrl,
            imageUrl: input.imageUrl,
            isActive: input.isActive,
            showForNewGoogleUsers: input.showForNewGoogleUsers,
          });

          return { success: true, id: Number(result.insertId) };
        }
      } catch (error) {
        console.error("[WelcomeMessage] Error upserting message:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save welcome message",
        });
      }
    }),

  /**
   * Admin: Get all welcome messages
   */
  listWelcomeMessages: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Check if user is admin
      if (ctx.user.role !== "admin" && ctx.user.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view welcome messages",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const messages = await db
        .select()
        .from(welcomeMessages)
        .orderBy(welcomeMessages.id);

      return messages;
    } catch (error) {
      console.error("[WelcomeMessage] Error listing messages:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch welcome messages",
      });
    }
  }),

  /**
   * Admin: Delete welcome message
   */
  deleteWelcomeMessage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user is admin
        if (ctx.user.role !== "admin" && ctx.user.role !== "owner") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can delete welcome messages",
          });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        await db
          .delete(welcomeMessages)
          .where(eq(welcomeMessages.id, input.id));

        return { success: true };
      } catch (error) {
        console.error("[WelcomeMessage] Error deleting message:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete welcome message",
        });
      }
    }),
});
