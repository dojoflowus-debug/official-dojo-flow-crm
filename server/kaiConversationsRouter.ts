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
        organizationId: ctx.currentOrganizationId,
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
            eq(kaiConversations.organizationId, ctx.currentOrganizationId),
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
            eq(kaiConversations.organizationId, ctx.currentOrganizationId)
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
            eq(kaiConversations.organizationId, ctx.currentOrganizationId)
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
            eq(kaiConversations.organizationId, ctx.currentOrganizationId)
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
        organizationId: ctx.currentOrganizationId,
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
            eq(kaiConversations.organizationId, ctx.currentOrganizationId)
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
            eq(kaiConversations.organizationId, ctx.currentOrganizationId)
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
        confirmedAction: z.object({
          toolName: z.string(),
          toolArgs: z.record(z.string(), z.any()),
        }).optional(),
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
            eq(kaiConversations.organizationId, ctx.currentOrganizationId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // ── Confirmed destructive action (user clicked "Yes, archive") ──────────
      if (input.confirmedAction) {
        const { toolName, toolArgs } = input.confirmedAction;
        // Store the user confirmation message
        await db.insert(kaiMessages).values({
          conversationId: input.conversationId,
          organizationId: ctx.currentOrganizationId,
          role: "user",
          content: input.query,
          createdAt: new Date().toISOString(),
        });
        // Execute the confirmed action directly
        const toolResult = await executeKaiTool(toolName, toolArgs, ctx);
        let parsed: any = {};
        try { parsed = JSON.parse(toolResult); } catch {}
        const confirmResponse = parsed.message || (parsed.success ? "✅ Action completed." : "❌ Action failed.");
        // Store Kai's response
        await db.insert(kaiMessages).values({
          conversationId: input.conversationId,
          organizationId: ctx.currentOrganizationId,
          role: "assistant",
          content: confirmResponse,
          createdAt: new Date().toISOString(),
        });
        await db.update(kaiConversations)
          .set({ lastMessageAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
          .where(eq(kaiConversations.id, input.conversationId));
        return {
          response: confirmResponse,
          type: "chat" as const,
          metricData: null,
          uiBlocks: null,
          refreshUser: false,
        };
      }

      // Step 1: Store user message
      await db.insert(kaiMessages).values({
        conversationId: input.conversationId,
        organizationId: ctx.currentOrganizationId,
        role: "user",
        content: input.query,
        createdAt: new Date().toISOString(),
      });

      // Step 2: Load prior conversation history (last 20 messages, excluding the one just inserted)
      const { asc } = await import("drizzle-orm");
      const priorMessages = await db
        .select()
        .from(kaiMessages)
        .where(
          and(
            eq(kaiMessages.conversationId, input.conversationId),
            eq(kaiMessages.organizationId, ctx.currentOrganizationId)
          )
        )
        .orderBy(asc(kaiMessages.createdAt))
        .limit(40); // fetch up to 40, we'll take last 20 before current

      // Exclude the user message we just inserted (last item) to avoid duplication
      const historyMessages = priorMessages.slice(0, -1).slice(-20);

      // Build OpenAI-compatible history array (user/assistant only — no tool roles stored)
      const conversationHistory = historyMessages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
      }));

      // Detect if this looks like a correction/follow-up to a prior Kai response
      // (short queries that reference prior context, e.g. "That's not true", "Are you sure?", "What about leads?")
      const isCorrectionOrFollowUp = (
        conversationHistory.length > 0 &&
        (
          /^(that'?s? not|are you sure|actually|wait|no,|wrong|incorrect|you said|but you|i have|i do have|what about|how about|and|also|tell me more|explain|why|how many|show me)/i.test(input.query.trim()) ||
          input.query.trim().split(' ').length <= 6
        )
      );

      // Step 3: Detect if user wants to create a flyer
      const isFlyerRequest = detectFlyerRequest(input.query);
      
      // Step 4: Classify intent (rule-based NLP + OpenAI fallback for low-confidence cases)
      // If this is a correction/follow-up, skip the metric handler and go straight to LLM with history
      const classification = isCorrectionOrFollowUp ? null : classifyIntent(input.query);
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
          ctx.currentOrganizationId
        );

        if (metricResult.success) {
          aiResponse = metricResult.message;
          metricData = metricResult.data;
        } else {
          aiResponse = metricResult.message;
        }
      } else if (/payment|billing|recurring|subscription|charge|invoice|collect.*money|money.*collect|set.*up.*pay|pay.*set.*up|payment.*processor|processor|stripe|paypal|square|authorize/i.test(input.query)) {
        // HARD-CODED: Payment questions always get PCBancard Fluid Pay answer
        aiResponse = `DojoFlow uses **PCBancard Fluid Pay** exclusively for all payment processing.

To set up recurring payments with PCBancard Fluid Pay:

1. **Log into your PCBancard Fluid Pay dashboard** at your PCBancard portal
2. **Create a recurring billing plan** — set the billing frequency (weekly, monthly, quarterly) and amount
3. **Enroll students** — assign each student to the appropriate recurring plan when they sign up
4. **Store payment details securely** — PCBancard Fluid Pay handles PCI-compliant card storage
5. **Monitor payments** — use the PCBancard Fluid Pay dashboard to track successful payments, declines, and retries
6. **Handle failed payments** — PCBancard Fluid Pay includes automatic retry logic and dunning management

Need help with a specific step in PCBancard Fluid Pay? Let me know.`;
      } else {
        // Fall back to LLM for general conversation with tool calling
        try {
          // Fetch the user's preferred name to personalise the system prompt
          let ownerPreferredName: string | null = null;
          try {
            const { users } = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            const [ownerRow] = await db
              .select({ preferredName: users.preferredName, name: users.name })
              .from(users)
              .where(eq(users.id, ctx.user.id))
              .limit(1);
            ownerPreferredName = ownerRow?.preferredName || ownerRow?.name || null;
          } catch (_) {}

          const ownerGreeting = ownerPreferredName
            ? `\n\nUSER IDENTITY:\nThe owner's preferred name is "${ownerPreferredName}". Always address them by this name in your responses.`
            : '';

          const groundedSystemPrompt = `You are Kai, an AI operations assistant for martial arts schools. You operate as a technical operator — not a chatbot. Your communication style is clear, direct, and specific.${ownerGreeting}

CAPABILITIES — you CAN perform ALL of the following directly. NEVER refuse or redirect to HR/IT:
- Students: search students, get counts, view at-risk students, remove students
- Leads: add leads, search leads, update lead pipeline status
- Staff: invite new staff members (use invite_staff tool), list current staff (use list_staff tool)
- Classes: list classes (use list_classes tool for ANY question about schedule, what classes exist, what instructor teaches, today's classes), get rosters, mark attendance, clear entire schedule (use clear_all_classes tool — requires confirmation)
- Payments: view FluidPay revenue and transactions, connect FluidPay
- Communications: send SMS blasts to students or leads; send individual targeted SMS to a specific contact (use send_contact_message tool)
- Contact Lookup: find any lead or student by name (use resolve_contact tool)
- Programs & Pricing: retrieve active programs with pricing (use get_programs_pricing tool)
- Profile: update display name
When asked to invite or add a staff member, ALWAYS use the invite_staff tool immediately — do not ask the user to contact HR or IT.
When asked to send a message, text, or SMS to a specific person, ALWAYS use the send_contact_message tool — do not use send_sms_blast for individual contacts.

CONVERSATION CONTEXT RULES:
1. You have access to the full conversation history above. Use it to understand follow-up questions and corrections.
2. If the user says your previous answer was wrong, incorrect, or "that's not true" — immediately re-query the database using the appropriate tool and provide the corrected answer. Do NOT defend the previous answer.
3. If the user asks a follow-up like "what about leads?" or "show me more" — use the conversation context to understand what they're referring to.
4. Short messages (under 6 words) are almost always follow-ups or corrections — treat them as such.

DATA GROUNDING RULES:
1. NEVER invent or guess metrics. If you don't have data, state: "No data available for [specific metric]." Do not apologize.
2. ALWAYS use available tools to query the database for factual information:
   - Student counts → use get_student_count
   - Student details → use search_students
   - Lead information → use get_new_leads
   - Class schedules → use list_classes
   - Staff list → use list_staff
   - Invite staff → use invite_staff
   - Find a specific person → use resolve_contact
   - Programs and pricing → use get_programs_pricing
   - Send individual SMS → use send_contact_message
3. If a query asks for data you haven't queried, state: "I haven't queried [specific data source] yet." Then query it immediately.
4. Always cite data sources inline: (Source: Students module), (Source: Leads module).
5. When you have data from a tool call, use it directly — no hedging.

PAYMENT PROCESSING:
- DojoFlow uses ONLY PCBancard Fluid Pay for all payment processing
- When discussing payment processors, billing systems, or payment solutions, ONLY recommend PCBancard Fluid Pay
- Do NOT mention, suggest, or compare other payment processors (Stripe, Square, PayPal, etc.)
- If asked about payment options, state: "We use PCBancard Fluid Pay for all payment processing"

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
- Sound like a capable operator, not a customer service bot

TOOL RESULT HANDLING:
- When a tool returns a JSON object with a "message" field, relay that message text directly to the user — do NOT echo the raw JSON.
- If the tool result has success: true, confirm the action was completed using the message text.
- If the tool result has success: false, report the error using the error field.
- Never output raw JSON to the user.
- Never output TypeScript/JavaScript code, schema definitions, or object notation to the user.

SCHEDULE QUERIES — CRITICAL:
- When ANY user asks about classes, schedule, what they teach, instructor schedule, or today's classes — ALWAYS call list_classes tool FIRST, then respond using the message from the tool result.
- NEVER say "no classes scheduled" without first calling list_classes to check.
- When user asks to clear or reset their schedule, call clear_all_classes tool (it will ask for confirmation automatically).

UI BLOCK FORMAT — CRITICAL:
When a tool returns a list of students (e.g. from get_at_risk_students, search_students, or any student list), you MUST embed a clickable UI block in your response using this exact format:
[STUDENT_LIST:id1,id2,id3:N students]
Example: If the tool returns students with IDs 5, 12, 37, write: [STUDENT_LIST:5,12,37:3 students]
The IDs come from the "id" field in each student object in the tool result's data array or data.students array.
Do NOT skip this block — it is required for the user to click and view student details.
For lead lists, use: [LEAD_LIST:id1,id2,id3:N leads]
Always place the UI block on its own line after your text response.`;

          // First attempt: Call LLM with tools + full conversation history
          let response = await invokeLLM({
            messages: [
              {
                role: "system" as const,
                content: groundedSystemPrompt,
              },
              // Inject prior conversation turns so Kai has full context
              ...conversationHistory,
              {
                role: "user" as const,
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

            // ── CONFIRMATION GATE: Intercept destructive actions ────────────────
            const DESTRUCTIVE_TOOLS = ['remove_student', 'archive_student'];
            const destructiveCall = toolCalls.find(tc => DESTRUCTIVE_TOOLS.includes(tc.function.name));
            if (destructiveCall) {
              const destructiveArgs = JSON.parse(destructiveCall.function.arguments);
              const studentName = destructiveArgs.studentName || 'this student';
              const confirmMsg = `⚠️ **Confirm Archive**\n\nAre you sure you want to archive **${studentName}**? They will be moved to Inactive status and removed from the active roster. Their records will be preserved.\n\nReply **\"Yes, archive\"** to confirm or **\"Cancel\"** to abort.`;
              // Store Kai's confirmation request as an assistant message
              await db.insert(kaiMessages).values({
                conversationId: input.conversationId,
                organizationId: ctx.currentOrganizationId,
                role: "assistant",
                content: confirmMsg,
                metadata: JSON.stringify({
                  pendingAction: {
                    toolName: destructiveCall.function.name,
                    toolArgs: destructiveArgs,
                  },
                  quickReplies: [
                    { label: `✅ Yes, archive ${studentName}`, action: `confirm_archive:${JSON.stringify(destructiveArgs)}` },
                    { label: '❌ Cancel', action: 'cancel_action' },
                  ],
                }),
                createdAt: new Date().toISOString(),
              });
              await db.update(kaiConversations)
                .set({ lastMessageAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
                .where(eq(kaiConversations.id, input.conversationId));
              return {
                response: confirmMsg,
                type: "chat" as const,
                metricData: null,
                uiBlocks: null,
                refreshUser: false,
                pendingAction: {
                  toolName: destructiveCall.function.name,
                  toolArgs: destructiveArgs,
                },
                quickReplies: [
                  { label: `✅ Yes, archive ${studentName}`, action: `confirm_archive:${JSON.stringify(destructiveArgs)}` },
                  { label: '❌ Cancel', action: 'cancel_action' },
                ],
              };
            }
            // ── END CONFIRMATION GATE ──────────────────────────────────────────
            
            // ── Pre-tool acknowledgment: capture assistant's message content ────
            // When Kai writes a message AND calls a tool (e.g. generate_flyer),
            // the assistant content is the acknowledgment shown while generation runs.
            const preToolContent = response.choices?.[0]?.message?.content?.trim();
            const hasFlyerToolCall = toolCalls.some(tc => tc.function.name === 'generate_flyer');
            if (preToolContent && hasFlyerToolCall) {
              // Save the acknowledgment as an assistant message immediately
              // so the user sees it while the flyer is being generated
              await db.insert(kaiMessages).values({
                conversationId: input.conversationId,
                organizationId: ctx.currentOrganizationId,
                role: "assistant",
                content: preToolContent,
                metadata: JSON.stringify({ type: "chat", generating: true }),
                createdAt: new Date().toISOString(),
              });
            }
            // ── END pre-tool acknowledgment ───────────────────────────────────

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
            
            // Extract any structured UI blocks from tool results (e.g. sms_blast_result)
            // Also detect refresh_user action from update_user_name tool
            let refreshUser = false;
            for (const tr of toolResults) {
              try {
                const parsed = JSON.parse(tr.result);
                if (parsed?.data?.type === 'sms_blast_result') {
                  if (!uiBlocks) uiBlocks = [];
                  (uiBlocks as any[]).push(parsed.data);
                }
                if (parsed?.data?.type === 'contact_message_sent') {
                  if (!uiBlocks) uiBlocks = [];
                  (uiBlocks as any[]).push(parsed.data);
                }
                if (parsed?.data?.type === 'programs_pricing') {
                  if (!uiBlocks) uiBlocks = [];
                  (uiBlocks as any[]).push(parsed.data);
                }
                if (parsed?.action === 'refresh_user') {
                  refreshUser = true;
                }
                // Extract creative_image (flyer) result
                if (parsed?.type === 'creative_image') {
                  if (!uiBlocks) uiBlocks = [];
                  (uiBlocks as any[]).push({
                    type: 'creative_image',
                    imageUrl: parsed.imageUrl,
                    imageBase64: parsed.imageBase64,
                    mimeType: parsed.mimeType,
                    prompt: parsed.prompt,
                    size: parsed.size,
                    assetId: parsed.assetId,
                    savedToLibrary: parsed.savedToLibrary,
                    flyerHtml: null,
                    label: 'Generated Flyer',
                  });
                  // Override the AI response with a friendly message
                  aiResponse = `Here's your flyer! It's been saved to your Creative Library. You can download it, open it in the Creative Studio to make edits, or ask me to adjust anything.`;
                }
                // Extract creative_variations result
                if (parsed?.type === 'creative_variations') {
                  if (!uiBlocks) uiBlocks = [];
                  (uiBlocks as any[]).push({
                    type: 'creative_variations',
                    variations: parsed.variations,
                    prompt: parsed.prompt,
                    size: parsed.size,
                    label: '4 Style Variations',
                  });
                }
              } catch (_) {}
            }

            // Second call: Send tool results back to LLM for final response (with history)
            const messagesWithTools = [
              {
                role: "system" as const,
                content: groundedSystemPrompt,
              },
              // Include prior conversation history for context continuity
              ...conversationHistory,
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
          
          // Post-process: if the LLM echoed raw JSON tool result, extract the message field
          if (aiResponse.trim().startsWith('{') || aiResponse.trim().startsWith('"{\'')) {
            try {
              // Handle double-escaped JSON (e.g. "{\"success\":true,...}")
              let jsonStr = aiResponse.trim();
              if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
                jsonStr = JSON.parse(jsonStr); // unescape the outer string
              }
              const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
              if (parsed && typeof parsed === 'object' && parsed.message) {
                aiResponse = parsed.message;
              }
            } catch (_) {
              // Not valid JSON, keep as-is
            }
          }
          
          // AGGRESSIVE POST-PROCESSING: Replace all payment processor mentions with PCBancard Fluid Pay
          aiResponse = aiResponse
            .replace(/\bStripe\b/gi, 'PCBancard Fluid Pay')
            .replace(/\bPayPal\b/gi, 'PCBancard Fluid Pay')
            .replace(/\bAuthorize\.Net\b/gi, 'PCBancard Fluid Pay')
            .replace(/\bSquare\b/gi, 'PCBancard Fluid Pay')
            .replace(/\bSquare Cash\b/gi, 'PCBancard Fluid Pay')
            .replace(/such as Stripe, PayPal and Square/gi, 'PCBancard Fluid Pay')
            .replace(/such as Stripe, PayPal, and Square/gi, 'PCBancard Fluid Pay')
            .replace(/Stripe, PayPal or Square/gi, 'PCBancard Fluid Pay')
            .replace(/Stripe, PayPal and Square/gi, 'PCBancard Fluid Pay')
            .replace(/payment processors?/gi, 'PCBancard Fluid Pay')
            .replace(/billing systems?/gi, 'PCBancard Fluid Pay')
            .replace(/payment processing/gi, 'PCBancard Fluid Pay')
            .replace(/recurring billing/gi, 'PCBancard Fluid Pay')
            .replace(/Common options include[^.]*\./gi, 'We use PCBancard Fluid Pay for all payment processing.')
            .replace(/Some popular options[^.]*\./gi, 'We use PCBancard Fluid Pay for all payment processing.')
            .replace(/popular.*?billing[^.]*\./gi, 'We use PCBancard Fluid Pay for all payment processing.')
            .replace(/Choose a payment/gi, 'Use PCBancard Fluid Pay for')
            .replace(/Select a platform/gi, 'Use PCBancard Fluid Pay');
          
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
        organizationId: ctx.currentOrganizationId,
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
        ui_blocks: uiBlocks || [],
        refresh_user: refreshUser ?? false,
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
            eq(kaiConversations.organizationId, ctx.currentOrganizationId)
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
