/**
 * Kai Agent Intent Router
 * ─────────────────────────────────────────────────────────────────────────────
 * Classifies incoming messages into one of 13 intent categories using a fast
 * LLM call (gpt-4o-mini) with a structured JSON response.
 *
 * Falls back to regex heuristics if the LLM call fails or times out.
 *
 * Intent categories:
 *  - new_lead_intake      — someone new is inquiring about the school
 *  - trial_booking        — booking a free trial / intro class
 *  - pricing_question     — asking about tuition, fees, plans
 *  - student_lookup       — finding a specific student's record
 *  - attendance_issue     — attendance tracking, absences, check-ins
 *  - missed_class_followup — following up with a student who missed class
 *  - birthday_followup    — birthday recognition / outreach
 *  - payment_issue        — billing problems, failed payments, refunds
 *  - cancellation_risk    — student at risk of quitting / cancelling
 *  - business_coaching    — general dojo operations, growth, marketing
 *  - creative             — flyers, ads, images, marketing materials
 *  - operational          — data queries, reports, staff, schedules
 *  - unknown              — cannot determine intent
 */

import type { KaiIntentCategory } from './kaiModelRegistry';

export interface IntentClassification {
  intent: KaiIntentCategory;
  confidence: number; // 0.0 – 1.0
  reasoning: string;  // short explanation (for logging)
  entities: {
    personName?: string;
    programName?: string;
    ageRange?: string;
    phone?: string;
    email?: string;
    date?: string;
    amount?: string;
  };
  /** Whether this intent requires a confirmation step before executing */
  requiresConfirmation: boolean;
  /** Whether this intent is a follow-up to the previous message */
  isFollowUp: boolean;
}

// ── Fast regex heuristics (fallback) ─────────────────────────────────────────

const REGEX_RULES: Array<{ pattern: RegExp; intent: KaiIntentCategory; confidence: number }> = [
  // Lead intake
  { pattern: /\b(new lead|someone called|inquiry|interested in|wants to join|sign.*up|enroll)\b/i, intent: 'new_lead_intake', confidence: 0.75 },
  // Trial booking
  { pattern: /\b(book|schedule|set up|arrange).{0,20}(trial|intro|free class|first class)\b/i, intent: 'trial_booking', confidence: 0.85 },
  { pattern: /\b(trial|intro class|free class|first class|come in|visit)\b/i, intent: 'trial_booking', confidence: 0.65 },
  // Pricing
  { pattern: /\b(how much|price|cost|tuition|fee|rate|monthly|per month|billing plan)\b/i, intent: 'pricing_question', confidence: 0.80 },
  // Student lookup
  { pattern: /\b(find|look up|search|show me|pull up).{0,20}(student|member)\b/i, intent: 'student_lookup', confidence: 0.80 },
  // Attendance
  { pattern: /\b(attendance|absent|missed|check.?in|check.?out|who came|who showed)\b/i, intent: 'attendance_issue', confidence: 0.80 },
  // Missed class follow-up
  { pattern: /\b(follow.?up|reach out|contact).{0,20}(missed|absent|didn.t come|not here)\b/i, intent: 'missed_class_followup', confidence: 0.80 },
  // Birthday
  { pattern: /\b(birthday|bday|born|turning \d+)\b/i, intent: 'birthday_followup', confidence: 0.85 },
  // Payment
  { pattern: /\b(payment|billing|invoice|charge|refund|past due|failed payment|declined)\b/i, intent: 'payment_issue', confidence: 0.80 },
  // Cancellation risk
  { pattern: /\b(cancel|quit|leaving|drop out|at.?risk|retention|churn|inactive)\b/i, intent: 'cancellation_risk', confidence: 0.75 },
  // Creative
  { pattern: /\b(flyer|poster|ad|advertisement|social media|instagram|facebook|marketing material|design)\b/i, intent: 'creative', confidence: 0.85 },
  // Business coaching
  { pattern: /\b(how (do|can|should) (i|we)|best practice|strategy|grow|improve|advice|tips|help me with)\b/i, intent: 'business_coaching', confidence: 0.60 },
  // Operational
  { pattern: /\b(report|export|stats|how many|count|list|show all|schedule|class|staff|revenue|income)\b/i, intent: 'operational', confidence: 0.65 },
];

function classifyByRegex(message: string): IntentClassification | null {
  for (const rule of REGEX_RULES) {
    if (rule.pattern.test(message)) {
      return {
        intent: rule.intent,
        confidence: rule.confidence,
        reasoning: `Regex match: ${rule.pattern.source}`,
        entities: {},
        requiresConfirmation: false,
        isFollowUp: false,
      };
    }
  }
  return null;
}

// ── LLM-based classifier ──────────────────────────────────────────────────────

const CLASSIFIER_SYSTEM_PROMPT = `You are an intent classifier for a martial arts school AI assistant called Kai.

Classify the user's message into exactly ONE of these intents:
- new_lead_intake: Someone new is inquiring about the school or a parent is asking about their child
- trial_booking: Booking a free trial, intro class, or first visit
- pricing_question: Questions about tuition, fees, billing plans, or costs
- student_lookup: Finding a specific student's record, profile, or information
- attendance_issue: Attendance tracking, absences, check-ins, who showed up
- missed_class_followup: Following up with a student who missed class
- birthday_followup: Birthday recognition or outreach to a student
- payment_issue: Billing problems, failed payments, refunds, past-due accounts
- cancellation_risk: Student at risk of quitting, cancelling, or going inactive
- business_coaching: General dojo operations, growth strategies, marketing advice
- creative: Creating flyers, ads, images, or marketing materials
- operational: Data queries, reports, staff management, class schedules, revenue
- unknown: Cannot determine intent from the message

Also extract any entities mentioned:
- personName: Name of a student, lead, or parent
- programName: Name of a martial arts program (e.g., Little Ninjas, Adult Karate)
- ageRange: Age range mentioned (e.g., "ages 5-8", "7 year old")
- phone: Phone number
- email: Email address
- date: Date or time mentioned
- amount: Dollar amount mentioned

Respond with valid JSON only. No markdown, no explanation outside the JSON.`;

interface LLMClassifierResponse {
  intent: KaiIntentCategory;
  confidence: number;
  reasoning: string;
  entities: IntentClassification['entities'];
  requiresConfirmation: boolean;
  isFollowUp: boolean;
}

async function classifyByLLM(
  message: string,
  conversationContext?: string
): Promise<IntentClassification | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const userContent = conversationContext
    ? `Recent conversation context:\n${conversationContext}\n\nLatest user message: "${message}"`
    : `User message: "${message}"`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        max_tokens: 300,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) return null;

    const data = await response.json() as any;
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as LLMClassifierResponse;

    // Validate intent is a known category
    const validIntents: KaiIntentCategory[] = [
      'new_lead_intake', 'trial_booking', 'pricing_question', 'student_lookup',
      'attendance_issue', 'missed_class_followup', 'birthday_followup', 'payment_issue',
      'cancellation_risk', 'business_coaching', 'creative', 'operational', 'unknown',
    ];

    if (!validIntents.includes(parsed.intent)) {
      parsed.intent = 'unknown';
    }

    return {
      intent: parsed.intent,
      confidence: Math.min(1.0, Math.max(0.0, parsed.confidence ?? 0.5)),
      reasoning: parsed.reasoning ?? '',
      entities: parsed.entities ?? {},
      requiresConfirmation: parsed.requiresConfirmation ?? false,
      isFollowUp: parsed.isFollowUp ?? false,
    };
  } catch {
    return null;
  }
}

// ── Short message / confirmation detection ────────────────────────────────────

const CONFIRMATION_PATTERNS = [
  /^(yes|yeah|yep|yup|sure|ok|okay|confirm|confirmed|go ahead|do it|send it|sounds good|please do|yes please|go for it|proceed)$/i,
  /^(no|nope|cancel|stop|don'?t|never mind|skip|back|not now)$/i,
];

export function isConfirmationMessage(message: string): boolean {
  const trimmed = message.trim();
  return CONFIRMATION_PATTERNS.some(p => p.test(trimmed));
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Classify a user message into an intent category.
 *
 * Strategy:
 *  1. If message is very short (< 4 words) and looks like a confirmation → return 'unknown' with isFollowUp=true
 *  2. Try LLM classifier (fast, structured)
 *  3. Fall back to regex heuristics
 *  4. Default to 'operational' if nothing matches
 */
export async function classifyKaiIntent(
  message: string,
  conversationContext?: string
): Promise<IntentClassification> {
  const trimmed = message.trim();

  // Very short messages are almost always follow-ups
  if (trimmed.split(/\s+/).length <= 3 || isConfirmationMessage(trimmed)) {
    return {
      intent: 'unknown',
      confidence: 0.9,
      reasoning: 'Short message — treating as follow-up',
      entities: {},
      requiresConfirmation: false,
      isFollowUp: true,
    };
  }

  // Try LLM classifier first
  const llmResult = await classifyByLLM(trimmed, conversationContext);
  if (llmResult && llmResult.confidence >= 0.5) {
    return llmResult;
  }

  // Fall back to regex
  const regexResult = classifyByRegex(trimmed);
  if (regexResult) {
    return regexResult;
  }

  // Default to operational (most common)
  return {
    intent: 'operational',
    confidence: 0.4,
    reasoning: 'No pattern matched — defaulting to operational',
    entities: {},
    requiresConfirmation: false,
    isFollowUp: false,
  };
}

/**
 * Get a human-readable label for an intent category.
 */
export function getIntentLabel(intent: KaiIntentCategory): string {
  const labels: Record<KaiIntentCategory, string> = {
    new_lead_intake: 'New Lead Intake',
    trial_booking: 'Trial Booking',
    pricing_question: 'Pricing Question',
    student_lookup: 'Student Lookup',
    attendance_issue: 'Attendance Issue',
    missed_class_followup: 'Missed Class Follow-up',
    birthday_followup: 'Birthday Follow-up',
    payment_issue: 'Payment Issue',
    cancellation_risk: 'Cancellation Risk',
    business_coaching: 'Business Coaching',
    creative: 'Creative',
    operational: 'Operational',
    unknown: 'Unknown',
  };
  return labels[intent] ?? intent;
}
