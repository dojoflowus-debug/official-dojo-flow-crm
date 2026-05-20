/**
 * Kai Agent Loop
 * ─────────────────────────────────────────────────────────────────────────────
 * The core agentic execution engine for Kai.
 *
 * Replaces the old single-pass LLM call with a proper multi-turn agent loop:
 *
 *  1. Classify intent (Intent Router)
 *  2. Load long-term memory
 *  3. Load/create Reliability Kernel state
 *  4. Extract fields from user message
 *  5. Compute next action (Kernel)
 *  6. Select model (Model Registry)
 *  7. Build system prompt with kernel + memory context
 *  8. Run model with tools
 *  9. Handle tool calls (execute → feed results back → continue loop)
 * 10. Update kernel state
 * 11. Persist memory
 * 12. Return final response
 *
 * The loop runs up to MAX_TOOL_ITERATIONS before forcing a text response.
 */

import { classifyKaiIntent, type IntentClassification } from './kaiAgentIntentRouter';
import {
  runKaiModel,
  type ModelRunParams,
  type ModelRunResult,
  type KaiIntentCategory,
} from './kaiModelRegistry';
import {
  createKernelState,
  mergeFields,
  extractFieldsFromMessage,
  computeNextAction,
  recordAction,
  advancePhase,
  buildKernelContextBlock,
  serialiseKernel,
  deserialiseKernel,
  type KernelState,
} from './kaiReliabilityKernel';
import {
  recallMemory,
  buildMemoryContextBlock,
  extractAndStoreMemories,
  rememberFact,
} from './kaiLongTermMemory';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_TOOL_ITERATIONS = 8;
const TOOL_TIMEOUT_MS = 25000;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentLoopInput {
  /** The user's message */
  userMessage: string;
  /** Full conversation history (OpenAI format) */
  conversationHistory: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | any;
    tool_call_id?: string;
    name?: string;
    tool_calls?: any[];
  }>;
  /** Organisation context */
  organizationId: number;
  userId: number;
  /** Serialised kernel state from previous turn (stored in DB) */
  kernelStateJson?: string | null;
  /** Available tools (from kai-tools.ts) */
  tools: any[];
  /** Tool executor function */
  executeTool: (toolName: string, args: Record<string, any>) => Promise<string>;
  /** System prompt base (from kaiPromptEngine) */
  baseSystemPrompt: string;
  /** Owner/user display name */
  ownerName?: string;
  /** Whether this is a new conversation */
  isNewConversation?: boolean;
}

export interface AgentLoopOutput {
  /** The final text response to send to the user */
  response: string;
  /** Updated kernel state (serialise and store in DB) */
  kernelStateJson: string;
  /** Intent classification result */
  intent: IntentClassification;
  /** Model used for the final response */
  modelUsed: string;
  /** Total tokens used */
  tokensUsed: number;
  /** Tool calls made during this turn */
  toolCallsMade: Array<{ name: string; args: Record<string, any>; result: string }>;
  /** Whether the conversation goal was achieved */
  goalAchieved: boolean;
}

// ── Main agent loop ───────────────────────────────────────────────────────────

export async function runKaiAgentLoop(input: AgentLoopInput): Promise<AgentLoopOutput> {
  const startTime = Date.now();
  let totalTokens = 0;
  const toolCallsMade: Array<{ name: string; args: Record<string, any>; result: string }> = [];

  // ── Step 1: Classify intent ──────────────────────────────────────────────
  const recentContext = input.conversationHistory
    .slice(-6)
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => `${m.role}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
    .join('\n');

  const intent = await classifyKaiIntent(input.userMessage, recentContext);

  // ── Step 2: Load long-term memory ────────────────────────────────────────
  const memories = await recallMemory(input.organizationId, input.userId);
  const memoryBlock = buildMemoryContextBlock(memories);

  // ── Step 3: Load / create kernel state ───────────────────────────────────
  let kernel: KernelState;
  if (input.kernelStateJson && !input.isNewConversation) {
    kernel = deserialiseKernel(input.kernelStateJson) ?? createKernelState(intent.intent);
    // Update intent if confidence improved
    if (intent.confidence > kernel.intentConfidence && intent.intent !== 'unknown') {
      kernel = {
        ...kernel,
        intent: intent.intent,
        intentConfidence: intent.confidence,
      };
    }
  } else {
    kernel = createKernelState(intent.intent);
    kernel.intentConfidence = intent.confidence;
  }

  kernel = { ...kernel, turnCount: kernel.turnCount + 1 };

  // ── Step 4: Extract fields from user message ─────────────────────────────
  const extractedFields = extractFieldsFromMessage(input.userMessage);
  // Also merge entities from intent classifier
  if (intent.entities.personName) {
    const parts = intent.entities.personName.split(/\s+/);
    if (!extractedFields.firstName) extractedFields.firstName = parts[0];
    if (!extractedFields.lastName && parts.length > 1) extractedFields.lastName = parts.slice(1).join(' ');
  }
  if (intent.entities.phone && !extractedFields.phone) extractedFields.phone = intent.entities.phone;
  if (intent.entities.email && !extractedFields.email) extractedFields.email = intent.entities.email;
  if (intent.entities.ageRange && !extractedFields.ageRange) extractedFields.ageRange = intent.entities.ageRange;
  if (intent.entities.programName && !extractedFields.programName) extractedFields.programName = intent.entities.programName;
  if (intent.entities.date && !extractedFields.preferredDate) extractedFields.preferredDate = intent.entities.date;

  kernel = mergeFields(kernel, extractedFields);

  // ── Step 5: Compute next action ──────────────────────────────────────────
  const nextAction = computeNextAction(kernel);
  kernel = { ...kernel, nextAction };

  // ── Step 6: Build system prompt ──────────────────────────────────────────
  const kernelBlock = buildKernelContextBlock(kernel);

  const systemPrompt = [
    input.baseSystemPrompt,
    '',
    memoryBlock,
    kernelBlock,
  ].filter(Boolean).join('\n');

  // ── Step 7: Build message array ──────────────────────────────────────────
  const messages: ModelRunParams['messages'] = [
    { role: 'system', content: systemPrompt },
    ...input.conversationHistory.filter(m => m.role !== 'system'),
  ];

  // ── Step 8: Agentic tool loop ─────────────────────────────────────────────
  let iteration = 0;
  let finalResponse = '';
  let lastModelResult: ModelRunResult | null = null;

  while (iteration < MAX_TOOL_ITERATIONS) {
    iteration++;

    // Select model based on current intent
    const modelResult = await runKaiModel({
      intent: intent.intent as KaiIntentCategory,
      messages,
      tools: input.tools,
      toolChoice: 'auto',
    });

    lastModelResult = modelResult;
    totalTokens += modelResult.usage.totalTokens;

    // If no tool calls, we have our final response
    if (modelResult.finishReason !== 'tool_calls' || modelResult.toolCalls.length === 0) {
      finalResponse = modelResult.content ?? '';
      break;
    }

    // Add assistant message with tool calls to history
    messages.push({
      role: 'assistant',
      content: modelResult.content ?? null,
      tool_calls: modelResult.toolCalls.map(tc => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.arguments),
        },
      })),
    });

    // Execute each tool call
    for (const toolCall of modelResult.toolCalls) {
      let toolResult: string;
      try {
        const timeoutPromise = new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('Tool timeout')), TOOL_TIMEOUT_MS)
        );
        toolResult = await Promise.race([
          input.executeTool(toolCall.name, toolCall.arguments),
          timeoutPromise,
        ]);
      } catch (err: any) {
        toolResult = JSON.stringify({ success: false, error: err?.message ?? 'Tool execution failed' });
      }

      // Record in kernel
      kernel = recordAction(kernel, toolCall.name, toolCall.arguments, toolResult);
      toolCallsMade.push({ name: toolCall.name, args: toolCall.arguments, result: toolResult });

      // Add tool result to message history
      messages.push({
        role: 'tool',
        content: toolResult,
        tool_call_id: toolCall.id,
        name: toolCall.name,
      });
    }

    // Recompute next action after tool execution
    const updatedNextAction = computeNextAction(kernel);
    kernel = { ...kernel, nextAction: updatedNextAction };

    // If next action is 'done', signal the model to wrap up
    if (updatedNextAction.type === 'done') {
      kernel = { ...kernel, goalAchieved: true };
      break;
    }
  }

  // If we hit the iteration limit without a text response, force one
  if (!finalResponse && iteration >= MAX_TOOL_ITERATIONS) {
    const forceResult = await runKaiModel({
      intent: intent.intent as KaiIntentCategory,
      messages,
      tools: [],
      toolChoice: 'none',
    });
    finalResponse = forceResult.content ?? 'I encountered an issue processing your request. Please try again.';
    totalTokens += forceResult.usage.totalTokens;
    lastModelResult = forceResult;
  }

  // ── Step 9: Update kernel phase ──────────────────────────────────────────
  if (kernel.goalAchieved) {
    kernel = advancePhase(kernel, 'done');
  } else if (toolCallsMade.length > 0) {
    kernel = advancePhase(kernel, 'follow_up');
  } else if (kernel.phase === 'greeting') {
    kernel = advancePhase(kernel, 'intake');
  }

  // ── Step 10: Persist memory ──────────────────────────────────────────────
  await extractAndStoreMemories(
    input.organizationId,
    input.userId,
    input.userMessage,
    finalResponse,
    toolCallsMade
  ).catch(() => {}); // Never let memory persistence crash the response

  // Store intent as a user preference if high confidence
  if (intent.confidence >= 0.8 && intent.intent !== 'unknown') {
    await rememberFact({
      organizationId: input.organizationId,
      userId: input.userId,
      memoryType: 'user_fact',
      key: 'last_intent',
      value: intent.intent,
      confidence: intent.confidence,
      source: 'inferred',
    }).catch(() => {});
  }

  return {
    response: finalResponse,
    kernelStateJson: serialiseKernel(kernel),
    intent,
    modelUsed: lastModelResult?.model ?? 'gpt-4o',
    tokensUsed: totalTokens,
    toolCallsMade,
    goalAchieved: kernel.goalAchieved,
  };
}

/**
 * Build a conversation context string from recent messages for the intent classifier.
 */
export function buildConversationContext(
  history: Array<{ role: string; content: string | any }>
): string {
  return history
    .slice(-8)
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => {
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return `${m.role}: ${content.slice(0, 200)}`;
    })
    .join('\n');
}
