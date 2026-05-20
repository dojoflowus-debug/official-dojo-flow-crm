/**
 * Kai Reliability Kernel
 * ─────────────────────────────────────────────────────────────────────────────
 * Deterministic state tracker for Kai conversations.
 *
 * Tracks:
 *  - Current intent and confidence
 *  - Conversation phase (greeting → intake → action → confirmation → done)
 *  - Collected fields (name, phone, email, age, program, date, etc.)
 *  - Missing required fields for the current intent
 *  - Questions already asked (prevents repeating)
 *  - Actions already taken (prevents duplicate tool calls)
 *  - Next best action recommendation
 *
 * The kernel is serialised to JSON and stored in the conversation record
 * so it persists across messages.
 */

import type { KaiIntentCategory } from './kaiModelRegistry';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConversationPhase =
  | 'greeting'     // First message, no intent yet
  | 'intake'       // Collecting required fields
  | 'action'       // Executing a tool/action
  | 'confirmation' // Waiting for user to confirm a destructive/important action
  | 'follow_up'    // Action done, checking if user needs more
  | 'done';        // Conversation goal achieved

export interface CollectedFields {
  // Lead / contact info
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  // Program / enrollment
  programName?: string;
  ageRange?: string;
  childAge?: number;
  childName?: string;
  // Scheduling
  preferredDate?: string;
  preferredTime?: string;
  // Payment
  paymentAmount?: number;
  // Generic
  [key: string]: string | number | boolean | undefined;
}

export interface KernelState {
  /** Current detected intent */
  intent: KaiIntentCategory;
  intentConfidence: number;
  /** Conversation phase */
  phase: ConversationPhase;
  /** Fields collected so far in this conversation */
  collectedFields: CollectedFields;
  /** Questions already asked (to prevent repetition) */
  askedQuestions: string[];
  /** Tool calls already executed in this conversation */
  executedActions: Array<{
    toolName: string;
    args: Record<string, any>;
    result: string;
    timestamp: string;
  }>;
  /** Next recommended action */
  nextAction: {
    type: 'ask_field' | 'call_tool' | 'confirm' | 'respond' | 'done';
    field?: string;        // For ask_field
    toolName?: string;     // For call_tool
    toolArgs?: Record<string, any>; // For call_tool
    message?: string;      // For respond
  };
  /** Turn count */
  turnCount: number;
  /** Whether the primary goal has been achieved */
  goalAchieved: boolean;
  /** Timestamp of last update */
  updatedAt: string;
}

// ── Required fields per intent ────────────────────────────────────────────────

const REQUIRED_FIELDS_BY_INTENT: Record<KaiIntentCategory, string[]> = {
  new_lead_intake: ['firstName', 'phone'],
  trial_booking: ['firstName', 'phone', 'preferredDate'],
  pricing_question: [], // No required fields — just answer
  student_lookup: ['firstName'], // At minimum a name
  attendance_issue: ['firstName'],
  missed_class_followup: ['firstName'],
  birthday_followup: ['firstName'],
  payment_issue: ['firstName'],
  cancellation_risk: ['firstName'],
  business_coaching: [], // No required fields
  creative: [], // No required fields
  operational: [], // No required fields
  unknown: [],
};

// ── Field extraction from conversation ───────────────────────────────────────

/**
 * Extract structured fields from a user message.
 * This is a fast regex-based extractor — the LLM intent classifier also
 * returns entities, which are merged in by the agent loop.
 */
export function extractFieldsFromMessage(message: string): Partial<CollectedFields> {
  const fields: Partial<CollectedFields> = {};

  // Phone number (US formats)
  const phoneMatch = message.match(/(?:phone|call|text|reach me at|number is)?\s*\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/i);
  if (phoneMatch) {
    fields.phone = phoneMatch[0].replace(/[^\d]/g, '').replace(/^1/, '');
    // Reformat as (XXX) XXX-XXXX
    if (fields.phone && fields.phone.length === 10) {
      fields.phone = `(${fields.phone.slice(0,3)}) ${fields.phone.slice(3,6)}-${fields.phone.slice(6)}`;
    }
  }

  // Email
  const emailMatch = message.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    fields.email = emailMatch[0].toLowerCase();
  }

  // Age / age range
  const ageMatch = message.match(/(\d+)\s*(?:year[s]?\s*old|yr[s]?\s*old|yo\b)/i)
    ?? message.match(/ages?\s*(\d+)\s*[-–to]+\s*(\d+)/i);
  if (ageMatch) {
    if (ageMatch[2]) {
      fields.ageRange = `${ageMatch[1]}-${ageMatch[2]}`;
    } else {
      fields.childAge = parseInt(ageMatch[1], 10);
    }
  }

  // Name patterns: "my name is X", "I'm X", "this is X", "for X"
  const nameMatch = message.match(/(?:my name is|i'm|i am|this is|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    ?? message.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)[\s,!.]/);
  if (nameMatch) {
    const name = nameMatch[1].trim();
    const parts = name.split(/\s+/);
    fields.firstName = parts[0];
    if (parts.length > 1) {
      fields.lastName = parts.slice(1).join(' ');
      fields.fullName = name;
    }
  }

  // Date patterns
  const dateMatch = message.match(/(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i)
    ?? message.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}/i)
    ?? message.match(/\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/);
  if (dateMatch) {
    fields.preferredDate = dateMatch[0];
  }

  return fields;
}

// ── Kernel operations ─────────────────────────────────────────────────────────

/**
 * Create a fresh kernel state for a new conversation.
 */
export function createKernelState(intent: KaiIntentCategory = 'unknown'): KernelState {
  return {
    intent,
    intentConfidence: 0,
    phase: 'greeting',
    collectedFields: {},
    askedQuestions: [],
    executedActions: [],
    nextAction: { type: 'respond' },
    turnCount: 0,
    goalAchieved: false,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Merge new fields into the kernel state.
 * Only updates fields that are not already set (prevents overwriting confirmed data).
 */
export function mergeFields(state: KernelState, newFields: Partial<CollectedFields>): KernelState {
  const merged = { ...state.collectedFields };
  for (const [key, value] of Object.entries(newFields)) {
    if (value !== undefined && value !== null && value !== '') {
      // Only overwrite if the field isn't already set
      if (!merged[key]) {
        merged[key] = value;
      }
    }
  }
  return { ...state, collectedFields: merged, updatedAt: new Date().toISOString() };
}

/**
 * Get the list of required fields that are still missing for the current intent.
 */
export function getMissingFields(state: KernelState): string[] {
  const required = REQUIRED_FIELDS_BY_INTENT[state.intent] ?? [];
  return required.filter(field => !state.collectedFields[field]);
}

/**
 * Check if a question about a specific field has already been asked.
 */
export function hasAskedAbout(state: KernelState, field: string): boolean {
  return state.askedQuestions.includes(field);
}

/**
 * Mark a question as asked (prevents repetition).
 */
export function markAsked(state: KernelState, field: string): KernelState {
  if (state.askedQuestions.includes(field)) return state;
  return {
    ...state,
    askedQuestions: [...state.askedQuestions, field],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Record that a tool action was executed.
 */
export function recordAction(
  state: KernelState,
  toolName: string,
  args: Record<string, any>,
  result: string
): KernelState {
  // Mark goal achieved when a booking/lead creation tool succeeds
  const goalTools = ['book_intro_lesson', 'create_lead', 'update_lead', 'send_sms', 'send_email'];
  let goalAchieved = state.goalAchieved;
  if (goalTools.includes(toolName)) {
    try {
      const parsed = JSON.parse(result);
      if (parsed?.success === true) goalAchieved = true;
    } catch (_) {}
  }
  return {
    ...state,
    goalAchieved,
    executedActions: [
      ...state.executedActions,
      { toolName, args, result, timestamp: new Date().toISOString() },
    ],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Check if a specific tool has already been called with similar args.
 */
export function hasExecuted(state: KernelState, toolName: string): boolean {
  return state.executedActions.some(a => a.toolName === toolName);
}

/**
 * Advance the conversation phase.
 */
export function advancePhase(state: KernelState, phase: ConversationPhase): KernelState {
  return {
    ...state,
    phase,
    goalAchieved: phase === 'done' ? true : state.goalAchieved,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Compute the next best action based on current state.
 * This is the deterministic decision engine.
 */
export function computeNextAction(state: KernelState): KernelState['nextAction'] {
  const missing = getMissingFields(state);

  // If we're waiting for confirmation, stay in confirmation phase
  if (state.phase === 'confirmation') {
    return { type: 'confirm' };
  }

  // If goal is achieved, we're done
  if (state.goalAchieved) {
    return { type: 'done' };
  }

  // If there are missing required fields, ask for the next one
  if (missing.length > 0) {
    // Find the first field we haven't asked about yet
    const nextField = missing.find(f => !hasAskedAbout(state, f)) ?? missing[0];
    return { type: 'ask_field', field: nextField };
  }

  // All required fields collected — determine next tool to call
  switch (state.intent) {
    case 'new_lead_intake':
      if (!hasExecuted(state, 'add_lead')) {
        return {
          type: 'call_tool',
          toolName: 'add_lead',
          toolArgs: {
            firstName: state.collectedFields.firstName,
            lastName: state.collectedFields.lastName,
            phone: state.collectedFields.phone,
            email: state.collectedFields.email,
            interestedProgram: state.collectedFields.programName,
          },
        };
      }
      break;

    case 'trial_booking':
      if (!hasExecuted(state, 'add_lead')) {
        return {
          type: 'call_tool',
          toolName: 'add_lead',
          toolArgs: {
            firstName: state.collectedFields.firstName,
            lastName: state.collectedFields.lastName,
            phone: state.collectedFields.phone,
            email: state.collectedFields.email,
            interestedProgram: state.collectedFields.programName,
            notes: `Trial requested: ${state.collectedFields.preferredDate ?? 'date TBD'}`,
          },
        };
      }
      if (hasExecuted(state, 'add_lead') && !hasExecuted(state, 'update_lead_status')) {
        const leadAction = state.executedActions.find(a => a.toolName === 'add_lead');
        let leadId: number | undefined;
        try {
          const parsed = JSON.parse(leadAction?.result ?? '{}');
          leadId = parsed.data?.leadId ?? parsed.leadId;
        } catch {}
        if (leadId) {
          return {
            type: 'call_tool',
            toolName: 'update_lead_status',
            toolArgs: { leadId, leadName: state.collectedFields.firstName, status: 'Intro Scheduled' },
          };
        }
      }
      break;

    case 'student_lookup':
      if (!hasExecuted(state, 'search_students')) {
        return {
          type: 'call_tool',
          toolName: 'search_students',
          toolArgs: { query: state.collectedFields.firstName ?? '' },
        };
      }
      break;

    case 'attendance_issue':
      if (!hasExecuted(state, 'get_absent_students')) {
        return { type: 'call_tool', toolName: 'get_absent_students', toolArgs: {} };
      }
      break;

    case 'payment_issue':
      if (!hasExecuted(state, 'get_fluidpay_transactions')) {
        return { type: 'call_tool', toolName: 'get_fluidpay_transactions', toolArgs: { limit: 20 } };
      }
      break;
  }

  // Default: let the LLM respond
  return { type: 'respond' };
}

/**
 * Serialise kernel state to JSON string for database storage.
 */
export function serialiseKernel(state: KernelState): string {
  return JSON.stringify(state);
}

/**
 * Deserialise kernel state from JSON string.
 */
export function deserialiseKernel(json: string | null | undefined): KernelState | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as KernelState;
  } catch {
    return null;
  }
}

/**
 * Build a concise kernel context block to inject into the system prompt.
 * This tells the LLM exactly what state we're in without repeating the whole history.
 */
export function buildKernelContextBlock(state: KernelState): string {
  const missing = getMissingFields(state);
  const lines: string[] = [
    '## CONVERSATION STATE (Reliability Kernel)',
    `- Intent: ${state.intent} (${(state.intentConfidence * 100).toFixed(0)}% confidence)`,
    `- Phase: ${state.phase}`,
    `- Turn: ${state.turnCount}`,
  ];

  if (Object.keys(state.collectedFields).length > 0) {
    lines.push('- Collected fields:');
    for (const [key, value] of Object.entries(state.collectedFields)) {
      if (value !== undefined) {
        lines.push(`  • ${key}: ${value}`);
      }
    }
  }

  if (missing.length > 0) {
    lines.push(`- MISSING required fields: ${missing.join(', ')}`);
  }

  if (state.askedQuestions.length > 0) {
    lines.push(`- Already asked about: ${state.askedQuestions.join(', ')} — DO NOT ask again`);
  }

  if (state.executedActions.length > 0) {
    lines.push(`- Actions already taken: ${state.executedActions.map(a => a.toolName).join(', ')}`);
  }

  // Next action directive
  const next = state.nextAction;
  if (next.type === 'ask_field' && next.field) {
    lines.push(`- NEXT ACTION: Ask for ${next.field} — ask naturally, do not list all missing fields at once`);
  } else if (next.type === 'call_tool' && next.toolName) {
    lines.push(`- NEXT ACTION: Call tool "${next.toolName}" with the collected data`);
  } else if (next.type === 'confirm') {
    lines.push('- NEXT ACTION: Wait for user confirmation before proceeding');
  } else if (next.type === 'done') {
    lines.push('- NEXT ACTION: Goal achieved — offer follow-up or close conversation');
  }

  lines.push('');
  lines.push('CRITICAL RULES:');
  lines.push('1. NEVER ask for a field that is already in "Collected fields" above');
  lines.push('2. NEVER ask for a field that is in "Already asked about" — if still missing, acknowledge and move on');
  lines.push('3. If NEXT ACTION says to call a tool, call it immediately — do not ask the user first');
  lines.push('4. Ask only ONE question at a time — never list multiple questions');
  lines.push('');

  return lines.join('\n');
}
