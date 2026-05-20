/**
 * Kai Model Registry
 * ─────────────────────────────────────────────────────────────────────────────
 * Central model abstraction layer for Kai's AI brain.
 *
 * Design goals:
 *  1. Swap the underlying model per intent without touching the agent loop.
 *  2. Support OpenAI Chat Completions (gpt-4o, gpt-4.1, o3-mini, o4-mini).
 *  3. Expose a single `runModel()` call that returns a normalised result.
 *  4. Allow per-intent temperature / token overrides.
 *
 * Intent → Model mapping (can be overridden via env vars):
 *  - REASONING intents (complex multi-step): o4-mini or gpt-4.1
 *  - OPERATIONAL intents (fast tool calls):  gpt-4o
 *  - CREATIVE intents (marketing copy):      gpt-4o
 *  - FALLBACK / unknown:                     gpt-4o
 */

export type KaiModelId =
  | 'gpt-4o'
  | 'gpt-4.1'
  | 'gpt-4.1-mini'
  | 'o3-mini'
  | 'o4-mini';

export type KaiIntentCategory =
  | 'new_lead_intake'
  | 'trial_booking'
  | 'pricing_question'
  | 'student_lookup'
  | 'attendance_issue'
  | 'missed_class_followup'
  | 'birthday_followup'
  | 'payment_issue'
  | 'cancellation_risk'
  | 'business_coaching'
  | 'creative'
  | 'operational'
  | 'unknown';

/** Per-intent model configuration */
interface ModelConfig {
  model: KaiModelId;
  temperature: number;
  maxTokens: number;
  /** Whether this model supports tool/function calling */
  supportsTools: boolean;
  /** Whether to use reasoning tokens (o-series models) */
  isReasoningModel: boolean;
}

/** Default model configs per intent category */
const INTENT_MODEL_MAP: Record<KaiIntentCategory, ModelConfig> = {
  // High-stakes intake flows — use a reasoning model for better field collection
  new_lead_intake: {
    model: 'gpt-4.1',
    temperature: 0.4,
    maxTokens: 1024,
    supportsTools: true,
    isReasoningModel: false,
  },
  trial_booking: {
    model: 'gpt-4.1',
    temperature: 0.4,
    maxTokens: 1024,
    supportsTools: true,
    isReasoningModel: false,
  },
  // Complex coaching — use reasoning model
  business_coaching: {
    model: 'gpt-4.1',
    temperature: 0.6,
    maxTokens: 2048,
    supportsTools: true,
    isReasoningModel: false,
  },
  cancellation_risk: {
    model: 'gpt-4.1',
    temperature: 0.5,
    maxTokens: 1024,
    supportsTools: true,
    isReasoningModel: false,
  },
  payment_issue: {
    model: 'gpt-4.1',
    temperature: 0.3,
    maxTokens: 1024,
    supportsTools: true,
    isReasoningModel: false,
  },
  // Fast operational queries — gpt-4o is faster and cheaper
  pricing_question: {
    model: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 512,
    supportsTools: true,
    isReasoningModel: false,
  },
  student_lookup: {
    model: 'gpt-4o',
    temperature: 0.2,
    maxTokens: 512,
    supportsTools: true,
    isReasoningModel: false,
  },
  attendance_issue: {
    model: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 512,
    supportsTools: true,
    isReasoningModel: false,
  },
  missed_class_followup: {
    model: 'gpt-4o',
    temperature: 0.5,
    maxTokens: 512,
    supportsTools: true,
    isReasoningModel: false,
  },
  birthday_followup: {
    model: 'gpt-4o',
    temperature: 0.6,
    maxTokens: 512,
    supportsTools: true,
    isReasoningModel: false,
  },
  operational: {
    model: 'gpt-4o',
    temperature: 0.2,
    maxTokens: 1024,
    supportsTools: true,
    isReasoningModel: false,
  },
  creative: {
    model: 'gpt-4o',
    temperature: 0.8,
    maxTokens: 1024,
    supportsTools: false,
    isReasoningModel: false,
  },
  unknown: {
    model: 'gpt-4o',
    temperature: 0.5,
    maxTokens: 1024,
    supportsTools: true,
    isReasoningModel: false,
  },
};

/** Allow env-var overrides: KAI_MODEL_<INTENT>=gpt-4.1 */
function resolveModel(intent: KaiIntentCategory): ModelConfig {
  const envKey = `KAI_MODEL_${intent.toUpperCase()}`;
  const envOverride = process.env[envKey] as KaiModelId | undefined;
  const globalOverride = process.env.KAI_DEFAULT_MODEL as KaiModelId | undefined;

  const base = INTENT_MODEL_MAP[intent] ?? INTENT_MODEL_MAP.unknown;

  if (envOverride) {
    return { ...base, model: envOverride };
  }
  if (globalOverride) {
    return { ...base, model: globalOverride };
  }
  return base;
}

export interface ModelRunParams {
  intent: KaiIntentCategory;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | any;
    tool_call_id?: string;
    name?: string;
    tool_calls?: any[];
  }>;
  tools?: any[];
  toolChoice?: 'auto' | 'none' | 'required';
  /** Override max tokens for this specific call */
  maxTokensOverride?: number;
  /** Override temperature for this specific call */
  temperatureOverride?: number;
}

export interface ModelRunResult {
  id: string;
  model: KaiModelId;
  intent: KaiIntentCategory;
  content: string | null;
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
  }>;
  finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter' | string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Run the model for a given intent.
 * This is the single entry point for all LLM calls in the new Kai agent loop.
 */
export async function runKaiModel(params: ModelRunParams): Promise<ModelRunResult> {
  const config = resolveModel(params.intent);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  const payload: Record<string, unknown> = {
    model: config.model,
    messages: params.messages,
    max_tokens: params.maxTokensOverride ?? config.maxTokens,
    temperature: params.temperatureOverride ?? config.temperature,
  };

  // Add tools only if the model supports them and tools are provided
  if (config.supportsTools && params.tools && params.tools.length > 0) {
    payload.tools = params.tools;
    payload.tool_choice = params.toolChoice ?? 'auto';
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[KaiModelRegistry] OpenAI error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as any;
  const choice = data.choices?.[0];
  const message = choice?.message;

  // Parse tool calls
  const toolCalls = (message?.tool_calls ?? []).map((tc: any) => ({
    id: tc.id,
    name: tc.function?.name ?? '',
    arguments: (() => {
      try {
        return JSON.parse(tc.function?.arguments ?? '{}');
      } catch {
        return {};
      }
    })(),
  }));

  return {
    id: data.id ?? '',
    model: config.model,
    intent: params.intent,
    content: message?.content ?? null,
    toolCalls,
    finishReason: choice?.finish_reason ?? 'stop',
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
  };
}

/**
 * Get the model config for a given intent (for logging/debugging).
 */
export function getModelConfig(intent: KaiIntentCategory): ModelConfig {
  return resolveModel(intent);
}

/**
 * List all available model IDs.
 */
export const AVAILABLE_MODELS: KaiModelId[] = [
  'gpt-4o',
  'gpt-4.1',
  'gpt-4.1-mini',
  'o3-mini',
  'o4-mini',
];
