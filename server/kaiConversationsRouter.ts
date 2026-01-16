import { z } from "zod";
import { getDb } from "./db";
import { conversations, messages } from "../drizzle/schema";
import { eq, and, desc, limit } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { processMetricQuery } from "./kai-metric-handler";
import { classifyIntent } from "./kai-nlp-router";
import { kaiTools, executeKaiTool } from "./kai-tools";

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
   * Process a user query (metric or chat)
   * Detects if query is about metrics and routes appropriately
   * Returns AI response with optional metric data
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

      // Step 2: Classify intent
      const classification = classifyIntent(input.query);
      let aiResponse = "";
      let metricData = null;

      // Step 3: Route to metric handler or LLM
      if (classification && classification.confidence > 0.5) {
        // This is likely a metric query
        const metricResult = await processMetricQuery(
          input.query,
          ctx.user.organizationId
        );

        if (metricResult.success) {
          aiResponse = metricResult.message;
          metricData = metricResult.data;
        } else {
          aiResponse = metricResult.message;
        }
      } else {
        // Fall back to LLM for general conversation with tool calling
        try {
          const groundedSystemPrompt = `You are Kai, an AI operations assistant for martial arts schools.

CRITICAL GROUNDING RULES:
1. NEVER invent or guess metrics. If you don't have data, say "I can't see that data yet."
2. ALWAYS use available tools to query the database for factual information about:
   - Student counts ("How many students do I have?" → use get_student_count)
   - Student details ("Show me student Ashley" → use search_students)
   - Lead information ("Find leads from last month" → use get_new_leads)
   - Class schedules ("What classes do we have?" → use list_classes)
3. If a query asks for data you haven't queried, respond with:
   "I can't see that data yet. Would you like me to check [specific data source]?"
4. Be helpful, friendly, and concise.
5. Always cite data sources: "Source: Students module", "Source: Leads module", etc.
6. When you have data from a tool call, use it directly in your response.`;

          // First attempt: Call LLM with tools
          let response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: groundedSystemPrompt,
              },
              {
                role: "user",
                content: input.query,
              },
            ],
            tools: kaiTools as any,
            toolChoice: "auto",
          });
          
          // Handle tool calls
          const toolCalls = response.choices?.[0]?.message?.tool_calls;
          if (toolCalls && toolCalls.length > 0) {
            console.log('[Kai] Tool calls detected:', toolCalls.map(t => t.function.name));
            
            // Execute tool calls and build tool results
            const toolResults = [];
            for (const toolCall of toolCalls) {
              const toolName = toolCall.function.name;
              const toolArgs = JSON.parse(toolCall.function.arguments);
              console.log(`[Kai] Executing tool: ${toolName}`, toolArgs);
              
              const toolResult = await executeKaiTool(toolName, toolArgs, ctx);
              toolResults.push({
                toolCallId: toolCall.id,
                toolName,
                result: toolResult
              });
            }
            
            // Second call: Send tool results back to LLM for final response
            const messagesWithTools = [
              {
                role: "system" as const,
                content: groundedSystemPrompt,
              },
              {
                role: "user" as const,
                content: input.query,
              },
              {
                role: "assistant" as const,
                content: response.choices?.[0]?.message?.content || "",
                tool_calls: toolCalls as any,
              },
              ...toolResults.map(tr => ({
                role: "tool" as const,
                tool_call_id: tr.toolCallId,
                name: tr.toolName,
                content: tr.result,
              })),
            ];
            
            response = await invokeLLM({
              messages: messagesWithTools as any,
            });
          }

          aiResponse =
            response.choices?.[0]?.message?.content ||
            "I am not sure how to help with that.";
          
          // Log grounded response for debugging
          console.log('[Kai] Grounded response generated', {
            query: input.query,
            responseLength: aiResponse.length,
            hasDataCitation: aiResponse.includes('Source:'),
            hadToolCalls: toolCalls && toolCalls.length > 0
          });
        } catch (error) {
          console.error("[Kai] LLM error:", error);
          aiResponse = "Sorry, I encountered an error. Please try again.";
          // Log full error for debugging
          console.error('[Kai] Full error details:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      }

      // Step 4: Store AI response
      const responseMetadata = metricData
        ? {
            type: "metric",
            procedure: classification?.procedure,
            data: metricData,
          }
        : { type: "chat" };

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
        type: metricData ? "metric" : "chat",
        procedure: classification?.procedure,
        data: metricData,
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
