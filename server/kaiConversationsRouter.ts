import { z } from "zod";
import { getDb } from "./db";
import { conversations, messages } from "../drizzle/schema";
import { eq, and, desc, limit } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { processMetricQuery } from "./kai-metric-handler";
import { classifyIntent } from "./kai-nlp-router";
import {
  classifyUserIntent,
  extractParameters,
  executeProcedure,
  requiresToolExecution,
} from "./kai-intent-router";
import { getKaiCorePrompt } from "./kai-core-prompt";
import { validateKaiResponse } from "./kai-response-contract";
import z from "zod";

/**
 * Kai Conversations Router
 * Handles persistent conversation management for Kai AI chat
 * - Create conversations once, store with organizationId and userId
 * - Load full conversation history with messages
 * - Auto-title conversations from first user message
 * - Maintain conversation summaries for context
 */

export const kaiConversationsRouter = router({
  /**
   * Create a new conversation
   * Called once per chat session, returns conversationId
   */
  create: protectedProcedure
    .input(z.object({
      title: z.string().optional(),
    }).optional())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(conversations).values({
        organizationId: ctx.user.organizationId,
        createdByUserId: ctx.user.id,
        title: input?.title || "New Conversation",
        summary: null,
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString(),
        lastMessageAt:new Date().toISOString(),
      });

      const conversationId = (result as any).insertId || result[0]?.id;
      return { conversationId };
    }),

  /**
   * List all conversations for the current user/organization
   * Sorted by lastMessageAt descending (most recent first)
   */
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userConversations = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.organizationId, ctx.user.organizationId),
            eq(conversations.createdByUserId, ctx.user.id)
          )
        )
        .orderBy(desc(conversations.lastMessageAt));

      return userConversations;
    }),

  /**
   * Get a single conversation with its summary
   * Used to load conversation context before sending a message
   */
  get: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [conversation] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.organizationId, ctx.user.organizationId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      return conversation;
    }),

  /**
   * Get messages for a conversation
   * Newest-last order, limited to specified count (default 40)
   * Used to load chat history for context
   */
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        limit: z.number().default(40).max(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify conversation belongs to user
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.organizationId, ctx.user.organizationId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Get messages ordered by createdAt (oldest first for context)
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(messages.createdAt)
        .limit(input.limit);

      return conversationMessages;
    }),

  /**
   * Add a message to a conversation
   * Called after user sends message and after AI responds
   * role: 'user' | 'assistant' | 'system'
   */
  addMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify conversation belongs to user
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.organizationId, ctx.user.organizationId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Insert message
      const result = await db.insert(messages).values({
        conversationId: input.conversationId,
        organizationId: ctx.user.organizationId,
        role: input.role,
        content: input.content,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        createdAt:new Date().toISOString(),
      });

      const messageId = (result as any).insertId || result[0]?.id;

      // Update conversation's lastMessageAt
      await db
        .update(conversations)
        .set({
          lastMessageAt:new Date().toISOString(),
          updatedAt:new Date().toISOString(),
        })
        .where(eq(conversations.id, input.conversationId));

      return { messageId };
    }),

  /**
   * Update conversation title
   * Called after first user message to auto-title the conversation
   */
  updateTitle: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        title: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(conversations)
        .set({
          title: input.title,
          updatedAt:new Date().toISOString(),
        })
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.organizationId, ctx.user.organizationId)
          )
        );

      return { success: true };
    }),

  /**
   * Update conversation summary
   * Called every 5 messages to maintain context summary
   * Summary should be under 1200 chars and include:
   * - Goals discussed
   * - Key decisions made
   * - Pending follow-ups
   */
  updateSummary: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        summary: z.string().max(1200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(conversations)
        .set({
          summary: input.summary,
          updatedAt:new Date().toISOString(),
        })
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.organizationId, ctx.user.organizationId)
          )
        );

      return { success: true };
    }),

  /**
   * Generate a summary for a conversation
   * Uses LLM to create a concise summary of the conversation
   * Called every 5 messages to maintain context
   */
  generateSummary: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all messages in conversation
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(messages.createdAt);

      if (conversationMessages.length === 0) {
        return { summary: "" };
      }

      // Format messages for LLM
      const formattedMessages = conversationMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Generate summary using LLM
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are a conversation summarizer. Create a concise summary (under 1200 chars) of the conversation including: goals discussed, key decisions made, and pending follow-ups.",
            },
            {
              role: "user",
              content: `Please summarize this conversation:\n\n${formattedMessages
                .map((m) => `${m.role}: ${m.content}`)
                .join("\n\n")}`,
            },
          ],
        });

        const summary =
          response.choices?.[0]?.message?.content || "Conversation summary";

        // Update conversation with summary
        await db
          .update(conversations)
          .set({
            summary: summary.substring(0, 1200),
            updatedAt:new Date().toISOString(),
          })
          .where(eq(conversations.id, input.conversationId));

        return { summary: summary.substring(0, 1200) };
      } catch (error) {
        console.error("Failed to generate summary:", error);
        return { summary: "Unable to generate summary" };
      }
    }),

  /**
   * Process a user query with TOOL-FIRST EXECUTION
   * 1. Check if directive matches a known procedure
   * 2. Execute procedure immediately (NO generic preamble)
   * 3. Return results as UIBlocks/cards
   * 4. Fall back to LLM only if no tool match
   */
  processQuery: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        query: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify conversation belongs to user
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.organizationId, ctx.user.organizationId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Step 1: Store user message
      await db.insert(messages).values({
        conversationId: input.conversationId,
        organizationId: ctx.user.organizationId,
        role: "user",
        content: input.query,
        createdAt: new Date().toISOString(),
      });

      let aiResponse = "";
      let procedureResult = null;
      let uiBlocks: any[] = [];
      let executedProcedure = "";

      // PHASE 1: TOOL-FIRST EXECUTION
      // Check if this is a directive that matches a known procedure
      if (requiresToolExecution(input.query)) {
        const intentMatch = classifyUserIntent(input.query);

        if (intentMatch) {
          try {
            // Extract parameters from user message
            const params = extractParameters(input.query, intentMatch.procedure);
            params.organizationId = ctx.user.organizationId;

            // Execute the procedure immediately (NO preamble)
            executedProcedure = intentMatch.procedure;
            console.log(`[Kai] TOOL-FIRST EXECUTION: ${intentMatch.procedure}`, params);

            // Get the tRPC caller
            const caller = (ctx as any).caller || ctx;
            procedureResult = await executeProcedure(caller, intentMatch.procedure, params);

            // Format result as response
            if (procedureResult) {
              if (Array.isArray(procedureResult)) {
                aiResponse = `Found ${procedureResult.length} results`;
                uiBlocks = procedureResult.map((item: any) => ({
                  type: "card",
                  data: item,
                }));
              } else if (typeof procedureResult === "object" && procedureResult.message) {
                aiResponse = procedureResult.message;
                if (procedureResult.cards) {
                  uiBlocks = procedureResult.cards;
                }
              } else {
                aiResponse = String(procedureResult);
              }
            } else {
              aiResponse = `No results from ${intentMatch.procedure}`;
            }
          } catch (error) {
            console.error(`[Kai] Tool execution failed: ${intentMatch.procedure}`, error);
            aiResponse = `Error executing ${intentMatch.procedure}: ${error instanceof Error ? error.message : "Unknown error"}`;
          }
        }
      }

      // PHASE 2: FALLBACK TO LLM
      // Only if no tool was executed
      if (!executedProcedure) {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: getKaiCorePrompt(),
              },
              {
                role: "user",
                content: input.query,
              },
            ],
          });

          aiResponse =
            response.choices?.[0]?.message?.content ||
            "I am not sure how to help with that.";
        } catch (error) {
          console.error("[Kai] LLM error:", error);
          aiResponse = "Sorry, I encountered an error. Please try again.";
        }
      }

      // Step 4: Store AI response with execution metadata
      const responseMetadata = {
        type: executedProcedure ? "tool" : "chat",
        procedure: executedProcedure,
        uiBlocks: uiBlocks.length > 0 ? uiBlocks : undefined,
      };

      await db.insert(messages).values({
        conversationId: input.conversationId,
        organizationId: ctx.user.organizationId,
        role: "assistant",
        content: aiResponse,
        metadata: JSON.stringify(responseMetadata),
        createdAt: new Date().toISOString(),
      });

      // Step 5: Update conversation timestamp
      await db
        .update(conversations)
        .set({
          lastMessageAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(conversations.id, input.conversationId));

      return {
        response: aiResponse,
        type: executedProcedure ? "tool" : "chat",
        procedure: executedProcedure,
        uiBlocks: uiBlocks.length > 0 ? uiBlocks : undefined,
        data: procedureResult,
      };
    }),

  /**
   * Delete a conversation and all its messages
   */
  delete: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify conversation belongs to user
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.organizationId, ctx.user.organizationId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Delete all messages in conversation
      await db
        .delete(messages)
        .where(eq(messages.conversationId, input.conversationId));

      // Delete conversation
      await db
        .delete(conversations)
        .where(eq(conversations.id, input.conversationId));

      return { success: true };
    }),
});
