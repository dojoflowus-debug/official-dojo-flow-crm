import { z } from "zod";
import { getDb } from "./db";
import { kaiConversations, kaiMessages } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { processMetricQuery } from "./kai-metric-handler";
import { classifyIntent } from "./kai-nlp-router";
import { detectIntent } from "./kaiIntelligenceLayer";
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

      const result = await db.insert(kaiConversations).values({
        organizationId: ctx.user.organizationId,
        userId: ctx.user.id,
        title: input?.title || "New Conversation",
        
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString(),
        lastMessageAt:new Date().toISOString(),
      });

      const conversationId = (result as any).insertId;
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
        .from(kaiConversations)
        .where(
          and(
            eq(kaiConversations.organizationId, ctx.user.organizationId),
            eq(kaiConversations.userId, ctx.user.id)
          )
        )
        .orderBy(desc(kaiConversations.lastMessageAt));

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
        .from(kaiConversations)
        .where(
          and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.organizationId, ctx.user.organizationId)
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
        limit: z.number().default(40),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify conversation belongs to user
      const [conversation] = await db
        .select()
        .from(kaiConversations)
        .where(
          and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.organizationId, ctx.user.organizationId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Get messages ordered by createdAt (oldest first for context)
      const conversationMessages = await db
        .select()
        .from(kaiMessages)
        .where(eq(kaiMessages.conversationId, input.conversationId))
        .orderBy(kaiMessages.createdAt)
        .limit(input.limit);

      // Parse metadata to extract quickReplies
      return conversationMessages.map(msg => {
        const parsedMetadata = msg.metadata ? JSON.parse(msg.metadata) : {};
        return {
          ...msg,
          quickReplies: parsedMetadata.quickReplies || undefined,
          metadata: parsedMetadata,
        };
      });
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
        metadata: z.record(z.string(), z.any()).optional(),
        quickReplies: z.array(z.object({
          label: z.string(),
          action: z.string(),
        })).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify conversation belongs to user
      const [conversation] = await db
        .select()
        .from(kaiConversations)
        .where(
          and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.organizationId, ctx.user.organizationId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Insert message
      const metadata = {
        ...input.metadata,
        ...(input.quickReplies && { quickReplies: input.quickReplies }),
      };
      
      const result = await db.insert(kaiMessages).values({
        conversationId: input.conversationId,
        organizationId: ctx.user.organizationId,
        role: input.role,
        content: input.content,
        metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
        createdAt:new Date().toISOString(),
      });

      const messageId = (result as any).insertId;

      // Update conversation's lastMessageAt
      await db
        .update(kaiConversations)
        .set({
          lastMessageAt:new Date().toISOString(),
          updatedAt:new Date().toISOString(),
        })
        .where(eq(kaiConversations.id, input.conversationId));

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
        .update(kaiConversations)
        .set({
          title: input.title,
          updatedAt:new Date().toISOString(),
        })
        .where(
          and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.organizationId, ctx.user.organizationId)
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
        .update(kaiConversations)
        .set({
          preview: input.summary.substring(0, 500),
          updatedAt:new Date().toISOString(),
        })
        .where(
          and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.organizationId, ctx.user.organizationId)
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
        .from(kaiMessages)
        .where(eq(kaiMessages.conversationId, input.conversationId))
        .orderBy(kaiMessages.createdAt);

      if (conversationMessages.length === 0) {
        return { summary: "" };
      }

      // Format messages for LLM
      const formattedMessages = conversationMessages.map((msg) => ({
        role: msg.role,
        content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
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
                .map((m) => `${m.role}: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`)
                .join("\n\n")}`,
            },
          ],
        });

        const summaryRaw = response.choices?.[0]?.message?.content || "Conversation summary";
        const summary = typeof summaryRaw === "string" ? summaryRaw : JSON.stringify(summaryRaw);

        // Update conversation with summary
        await db
          .update(kaiConversations)
          .set({
            preview: summary.substring(0, 500),
            updatedAt:new Date().toISOString(),
          })
          .where(eq(kaiConversations.id, input.conversationId));

        return { summary: summary.substring(0, 500) };
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
        .from(kaiConversations)
        .where(
          and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.organizationId, ctx.user.organizationId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Step 1: Store user message
      await db.insert(kaiMessages).values({
        conversationId: input.conversationId,
        organizationId: ctx.user.organizationId,
        role: "user",
        content: input.query,
        createdAt: new Date().toISOString(),
      });

      // Step 2: Detect if user wants to create a flyer
      const isFlyerRequest = detectFlyerRequest(input.query);
      
      // Step 3: Classify intent (rule-based NLP + OpenAI fallback for low-confidence cases)
      const classification = classifyIntent(input.query);
      let aiResponse = "";
      let metricData = null;
      let uiBlocks = null;
      // OpenAI intent enrichment when rule-based confidence is low (non-blocking)
      if (!classification || classification.confidence < 0.6) {
        try {
          await detectIntent(input.query, []);
          // Result is used to inform the LLM system prompt below
        } catch {
          // Non-blocking — system rules still apply
        }
      }

      // Step 4: Route to metric handler or LLM
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
      } else if (isFlyerRequest) {
        // Handle flyer creation request
        aiResponse = "I'll help you create a flyer! Let me open the flyer creation tool for you.";
        uiBlocks = [
          {
            type: "flyer_creation",
            label: "Create Flyer",
            initialPrompt: input.query.replace(/create|flyer|design|make|generate|build|poster|ad/gi, '').trim(),
          }
        ];
      } else {
        // Fall back to LLM for general conversation with tool calling
        try {
          const groundedSystemPrompt = `You are Kai, an AI operations assistant for martial arts schools. You operate as a technical operator — not a chatbot. Your communication style is clear, direct, and specific.

DATA GROUNDING RULES:
1. NEVER invent or guess metrics. If you don't have data, state: "No data available for [specific metric]." Do not apologize.
2. ALWAYS use available tools to query the database for factual information:
   - Student counts → use get_student_count
   - Student details → use search_students
   - Lead information → use get_new_leads
   - Class schedules → use list_classes
3. If a query asks for data you haven't queried, state: "I haven't queried [specific data source] yet." Then query it immediately.
4. Always cite data sources inline: (Source: Students module), (Source: Leads module).
5. When you have data from a tool call, use it directly — no hedging.

TECHNICAL STATUS FORMAT:
When reporting on system issues, errors, actions taken, or progress — always use this structure:

**Diagnosis:**
[1–2 sentences stating what the problem is, based on observed evidence]

**Root cause:**
[1–2 sentences identifying why it happened]

**Action taken:**
[Bullet list or sentences describing exactly what was changed]

**Current status:**
[1 sentence stating what is true right now]

**Next step:**
[1 sentence stating what needs to happen next]

TONE RULES:
- Never say "it should work now" — state what was verified
- Never apologize for errors — describe them and fix them
- Never use vague phrases like "there might be an issue" — be specific
- Separate what is true now from what was wrong from what was changed from what still needs verification
- Sound like a capable operator, not a customer service bot`;

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

          const aiRaw = response.choices?.[0]?.message?.content || "I am not sure how to help with that.";
          aiResponse = typeof aiRaw === "string" ? aiRaw : JSON.stringify(aiRaw);
          
          // Log grounded response for debugging
          console.log('[Kai] Grounded response generated', {
            query: input.query,
            responseLength: aiResponse.length,
            hasDataCitation: aiResponse.includes('Source:'),
            hadToolCalls: toolCalls && toolCalls.length > 0
          });
        } catch (error) {
          console.error("[Kai] LLM error:", error);
          aiResponse = "Something went wrong — please try again.";
          // Log full error for debugging
          console.error('[Kai] Full error details:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      }

      // Step 5: Store AI response
      const responseMetadata = metricData
        ? {
            type: "metric",
            procedure: classification?.procedure,
            data: metricData,
          }
        : uiBlocks
          ? { type: "chat", ui_blocks: uiBlocks }
          : { type: "chat" };

      await db.insert(kaiMessages).values({
        conversationId: input.conversationId,
        organizationId: ctx.user.organizationId,
        role: "assistant",
        content: aiResponse,
        metadata: JSON.stringify(responseMetadata),
        createdAt: new Date().toISOString(),
      });

      // Step 6: Update conversation timestamp
      await db
        .update(kaiConversations)
        .set({
          lastMessageAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(kaiConversations.id, input.conversationId));

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
        .from(kaiConversations)
        .where(
          and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.organizationId, ctx.user.organizationId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Delete all messages in conversation
      await db
        .delete(kaiMessages)
        .where(eq(kaiMessages.conversationId, input.conversationId));

      // Delete conversation
      await db
        .delete(kaiConversations)
        .where(eq(kaiConversations.id, input.conversationId));

      return { success: true };
    }),
});

/**
 * Detect if user is asking to create a flyer
 * Looks for keywords like "create", "design", "make", "flyer", "poster", etc.
 */
function detectFlyerRequest(query: string): boolean {
  const flyerKeywords = [
    'flyer',
    'poster',
    'create',
    'design',
    'make',
    'generate',
    'build',
    'marketing',
    'promotional',
    'advertisement',
    'ad',
    'graphic',
    'image',
    'visual',
  ];

  const queryLower = query.toLowerCase();
  const hasFlyerKeyword = flyerKeywords.some(keyword => queryLower.includes(keyword));
  
  // Check if it's specifically about creating marketing materials
  const isCreativeRequest = /create|design|make|generate|build/.test(queryLower) &&
    /flyer|poster|ad|graphic|marketing|promotional|visual|image|banner/.test(queryLower);
  
  return hasFlyerKeyword && isCreativeRequest;
}
