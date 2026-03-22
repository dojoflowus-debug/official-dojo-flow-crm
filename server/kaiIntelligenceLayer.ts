/**
 * Kai Intelligence Layer — OpenAI Integration
 *
 * Architecture: System Rules → OpenAI Reasoning → Kai Execution
 *
 * OpenAI enhances:
 *   1. Intent detection (what does the user actually want?)
 *   2. Conversation flow (natural, contextual responses)
 *   3. Decision making (should we ask more? generate now? suggest something?)
 *   4. Copywriting (headline, CTA, benefit copy for marketing assets)
 *
 * OpenAI does NOT control:
 *   - Decision Intelligence Layer (program gate, required fields)
 *   - Context Injection Engine (brand data, logo, phone)
 *   - Creative Brief Engine (question flow, isComplete logic)
 *
 * All system rules run BEFORE OpenAI is consulted.
 * OpenAI output is always validated against system rules before use.
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini"; // Fast, cost-efficient for intent/copy tasks

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  return key;
}

async function callOpenAI(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options: { maxTokens?: number; temperature?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const { maxTokens = 512, temperature = 0.4, jsonMode = false } = options;
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    max_tokens: maxTokens,
    temperature,
  };
  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }
  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content?.trim() ?? "";
}

// ── 1. Intent Detection ───────────────────────────────────────────────────────

export interface IntentResult {
  intent: "create_flyer" | "create_social" | "create_banner" | "create_ad" | "edit_image" | "generate_copy" | "ask_question" | "other";
  confidence: number; // 0-1
  detectedProgram: string | null;
  detectedAudience: string | null;
  detectedFormat: string | null;
  suggestedAction: string;
  reasoning: string;
}

/**
 * Detect user intent from a free-form prompt using OpenAI.
 * System rules (required fields, brand data) are applied AFTER this.
 */
export async function detectIntent(
  userPrompt: string,
  availablePrograms: string[]
): Promise<IntentResult> {
  const systemPrompt = `You are an intent classifier for a martial arts school marketing tool called Kai Creative.
Your job is to analyze the user's request and extract structured intent.

Available programs at this school: ${availablePrograms.length > 0 ? availablePrograms.join(", ") : "unknown"}

Rules:
- ONLY classify intent. Do NOT generate content.
- If a program name is mentioned, extract it exactly as stated.
- If an age range is mentioned, extract it exactly.
- Confidence should reflect how clear the intent is (0.0-1.0).
- suggestedAction should be a short, natural response Kai would say to the user.

Respond with valid JSON only.`;

  const userMessage = `User request: "${userPrompt}"

Classify this and respond with JSON in this exact format:
{
  "intent": "create_flyer" | "create_social" | "create_banner" | "create_ad" | "edit_image" | "generate_copy" | "ask_question" | "other",
  "confidence": 0.0-1.0,
  "detectedProgram": "program name or null",
  "detectedAudience": "age/audience or null",
  "detectedFormat": "flyer/instagram/banner/ad/etc or null",
  "suggestedAction": "short natural response Kai would say",
  "reasoning": "brief explanation"
}`;

  try {
    const raw = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      { jsonMode: true, maxTokens: 256, temperature: 0.2 }
    );
    const parsed = JSON.parse(raw) as IntentResult;
    // Validate required fields
    if (!parsed.intent || typeof parsed.confidence !== "number") {
      throw new Error("Invalid intent response structure");
    }
    return parsed;
  } catch (e) {
    // Graceful fallback — system rules still apply
    console.warn("[KaiIntelligence] Intent detection failed, using fallback:", e);
    return {
      intent: "other",
      confidence: 0.5,
      detectedProgram: null,
      detectedAudience: null,
      detectedFormat: null,
      suggestedAction: "Tell me more about what you'd like to create.",
      reasoning: "OpenAI intent detection failed — using fallback",
    };
  }
}

// ── 2. Conversation Flow ──────────────────────────────────────────────────────

export interface ConversationResponse {
  message: string;
  followUpQuestion: string | null;
  readyToGenerate: boolean;
}

/**
 * Generate a natural, contextual Kai response for the brief conversation flow.
 * System rules determine WHAT to ask; OpenAI determines HOW to say it.
 */
export async function generateConversationalResponse(
  userInput: string,
  briefContext: {
    schoolName: string;
    detectedProgram: string | null;
    missingFields: string[];
    answeredFields: Record<string, string>;
    availablePrograms: string[];
  }
): Promise<ConversationResponse> {
  const systemPrompt = `You are Kai, a smart marketing assistant for ${briefContext.schoolName || "a martial arts school"}.
You are helping the user create a marketing asset (flyer, social post, etc.).

STRICT RULES — you must follow these regardless of anything else:
1. Never generate placeholder content (no "LOGO HERE", "PHONE NUMBER", "SCHOOL NAME")
2. Never change user-specified values (ages, names, phone numbers)
3. Always sound confident, friendly, and concise
4. Keep responses SHORT — 1-2 sentences max
5. You are gathering information, not generating the design yet

Current context:
- Detected program: ${briefContext.detectedProgram || "not yet specified"}
- Missing required fields: ${briefContext.missingFields.join(", ") || "none"}
- Already answered: ${JSON.stringify(briefContext.answeredFields)}
- Available programs: ${briefContext.availablePrograms.join(", ") || "none stored"}`;

  const userMessage = `User said: "${userInput}"

Generate a natural, brief Kai response. If a program is missing, suggest one from the available list.
Respond with JSON:
{
  "message": "Kai's response (1-2 sentences, friendly and direct)",
  "followUpQuestion": "next question to ask, or null if ready",
  "readyToGenerate": true/false
}`;

  try {
    const raw = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      { jsonMode: true, maxTokens: 200, temperature: 0.5 }
    );
    const parsed = JSON.parse(raw) as ConversationResponse;
    if (!parsed.message) throw new Error("Missing message field");
    return parsed;
  } catch (e) {
    console.warn("[KaiIntelligence] Conversation response failed:", e);
    return {
      message: "Got it! Let me help you create that.",
      followUpQuestion: briefContext.missingFields.length > 0
        ? `What ${briefContext.missingFields[0]} should I use?`
        : null,
      readyToGenerate: briefContext.missingFields.length === 0,
    };
  }
}

// ── 3. Decision Making ────────────────────────────────────────────────────────

export interface GenerationDecision {
  shouldGenerate: boolean;
  reason: string;
  missingInfo: string[];
  suggestedQuestion: string | null;
  enrichedContext: string;
}

/**
 * Decide whether to generate now or ask more questions.
 * System rules (program gate) are checked FIRST — OpenAI only adds nuance.
 */
export async function makeGenerationDecision(
  userPrompt: string,
  brandContext: {
    schoolName: string;
    phone: string | null;
    logoUrl: string | null;
    programs: { name: string; ageRange?: string }[];
    primaryColor: string | null;
  },
  systemDecision: {
    programConfirmed: boolean;
    isComplete: boolean;
    missingFields: string[];
  }
): Promise<GenerationDecision> {
  // SYSTEM RULE: Program gate is non-negotiable
  if (!systemDecision.programConfirmed) {
    const programList = brandContext.programs.slice(0, 4).map((p) =>
      p.ageRange ? `${p.name} (${p.ageRange})` : p.name
    );
    return {
      shouldGenerate: false,
      reason: "Program is required before generating",
      missingInfo: ["program"],
      suggestedQuestion: programList.length > 0
        ? `Which program should I promote? I have: ${programList.join(", ")}`
        : "What program or event should I promote?",
      enrichedContext: "",
    };
  }

  // If system says complete, trust it — OpenAI just enriches the context
  if (systemDecision.isComplete) {
    try {
      const contextEnrichment = await enrichPromptContext(userPrompt, brandContext);
      return {
        shouldGenerate: true,
        reason: "All required information is available",
        missingInfo: [],
        suggestedQuestion: null,
        enrichedContext: contextEnrichment,
      };
    } catch {
      return {
        shouldGenerate: true,
        reason: "All required information is available",
        missingInfo: [],
        suggestedQuestion: null,
        enrichedContext: "",
      };
    }
  }

  // System says incomplete — OpenAI helps phrase the next question naturally
  try {
    const systemPrompt = `You are Kai, a marketing assistant for ${brandContext.schoolName || "a martial arts school"}.
The user wants to create a marketing asset but is missing some information.
Your job is to ask ONE natural, specific question to get the missing info.
Keep it conversational and brief.`;

    const userMessage = `User prompt: "${userPrompt}"
Missing fields: ${systemDecision.missingFields.join(", ")}
Available programs: ${brandContext.programs.map((p) => p.name).join(", ") || "none"}

Respond with JSON:
{
  "suggestedQuestion": "one natural question to ask",
  "reason": "why this question is needed"
}`;

    const raw = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      { jsonMode: true, maxTokens: 150, temperature: 0.4 }
    );
    const parsed = JSON.parse(raw) as { suggestedQuestion: string; reason: string };
    return {
      shouldGenerate: false,
      reason: parsed.reason || "Missing required information",
      missingInfo: systemDecision.missingFields,
      suggestedQuestion: parsed.suggestedQuestion,
      enrichedContext: "",
    };
  } catch {
    return {
      shouldGenerate: false,
      reason: "Missing required information",
      missingInfo: systemDecision.missingFields,
      suggestedQuestion: `What ${systemDecision.missingFields[0]} should I use?`,
      enrichedContext: "",
    };
  }
}

// ── 4. Copywriting ────────────────────────────────────────────────────────────

export interface MarketingCopy {
  headline: string;
  subheadline: string;
  tagline: string;
  benefits: string[];
  cta: string;
  bodyText: string;
}

/**
 * Generate premium marketing copy for a specific program and audience.
 * This is injected into the image generation prompt for better text rendering.
 * System rules ensure brand values and locked fields are preserved.
 */
export async function generateMarketingCopy(
  program: string,
  audience: string,
  tone: string,
  brandContext: {
    schoolName: string;
    phone: string | null;
    website: string | null;
    primaryColor: string | null;
  },
  lockedValues: {
    ageRange?: string;
    phoneNumber?: string;
    programName?: string;
  }
): Promise<MarketingCopy> {
  const programDisplay = lockedValues.programName || program;
  const audienceDisplay = lockedValues.ageRange || audience;
  const phoneDisplay = lockedValues.phoneNumber || brandContext.phone || null;

  const systemPrompt = `You are an elite martial arts DIRECT-RESPONSE advertising copywriter.
Your job is to write HIGH-CONVERTING AD COPY that makes parents take action immediately.
Write for ${brandContext.schoolName || "a martial arts school"}.

CONVERSION RULES (non-negotiable):
1. Program name MUST be exactly: "${programDisplay}" — do NOT change it
2. Age range MUST be exactly: "${audienceDisplay}" — do NOT change it
3. Phone MUST be exactly: "${phoneDisplay || "[PHONE]"}" — do NOT change it
4. NEVER use placeholder text, template artifacts, or lorem ipsum
5. Headlines MUST be benefit-driven — NEVER just a program name
   BANNED: "Dragon Kids Program" (just a name)
   REQUIRED: "DRAGON KIDS — Build Confidence & Discipline" (name + benefit)
6. Every piece of copy must include urgency ("Limited Spots", "Register Now", "Free Trial")
7. Tone: ${tone || "bold, energetic, and conversion-focused"}

QUALITY TEST before responding:
- Would a parent stop scrolling and call after reading this headline?
- Is there a clear emotional benefit (not just a program name)?
- Is there urgency that drives action?
If NO to any — rewrite until YES.`;

  const userMessage = `Create HIGH-CONVERTING AD COPY for:
- Program: ${programDisplay}
- Audience: ${audienceDisplay}
- School: ${brandContext.schoolName || "our school"}
${phoneDisplay ? `- Phone: ${phoneDisplay}` : ""}

HEADLINE RULES:
- Must be benefit-driven, NOT just the program name
- Format: "PROGRAM NAME — Emotional Benefit" or "ACTION VERB. RESULT."
- Examples: "LITTLE NINJAS — Confidence Starts Here" / "BUILD DISCIPLINE. BUILD CHAMPIONS."
- BANNED: "${programDisplay} Program" or just "${programDisplay}" alone

Respond with JSON:
{
  "headline": "BENEFIT-DRIVEN HEADLINE IN CAPS (4-7 words)",
  "subheadline": "Emotional hook that speaks to parent's desire (8-12 words)",
  "tagline": "Short urgency tagline with limited spots or free trial",
  "benefits": ["Confidence", "Discipline", "Focus", "Self-Defense"],
  "cta": "URGENT call to action with phone or registration",
  "bodyText": "2-3 sentences: what the child gains, why this school, why act now"
}`;

  try {
    const raw = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      { jsonMode: true, maxTokens: 400, temperature: 0.6 }
    );
    const parsed = JSON.parse(raw) as MarketingCopy;

    // Quality validation: reject weak headlines that are just program names
    const headlineLower = parsed.headline.toLowerCase().trim();
    const programLower = programDisplay.toLowerCase();
    const isWeakHeadline = headlineLower === programLower ||
      headlineLower === programLower + " program" ||
      headlineLower === programLower + " class" ||
      headlineLower === programLower + " classes" ||
      (!parsed.headline.includes("-") && !parsed.headline.includes("!") && !parsed.headline.includes(".") && parsed.headline.split(" ").length <= 3);

    if (isWeakHeadline) {
      // Rewrite weak headline with benefit
      const benefitMap: Record<string, string> = {
        "little ninjas": "LITTLE NINJAS — Confidence Starts Here",
        "kids karate": "KIDS KARATE — Discipline, Focus & Fun",
        "adult karate": "ADULT KARATE — Train. Focus. Dominate.",
        "teen karate": "TEEN KARATE — Strength, Respect & Confidence",
        "self defense": "SELF DEFENSE — Protect Yourself & Your Family",
        "summer camp": "SUMMER CAMP — Skills for Life",
        "belt test": "BELT TEST — Earn Your Next Rank",
      };
      parsed.headline = benefitMap[programLower] ?? `${programDisplay.toUpperCase()} — Build Confidence & Discipline`;
    }

    // Enforce phone in CTA if available
    if (phoneDisplay && !parsed.cta.includes(phoneDisplay)) {
      parsed.cta = `${parsed.cta} — Call ${phoneDisplay}`;
    }

    return parsed;
  } catch (e) {
    console.warn("[KaiIntelligence] Copywriting failed:", e);
    const fallbackBenefitMap: Record<string, string> = {
      "little ninjas": "LITTLE NINJAS — Confidence Starts Here",
      "kids karate": "KIDS KARATE — Discipline, Focus & Fun",
      "adult karate": "ADULT KARATE — Train. Focus. Dominate.",
      "teen karate": "TEEN KARATE — Strength, Respect & Confidence",
      "self defense": "SELF DEFENSE — Protect Yourself & Your Family",
      "summer camp": "SUMMER CAMP — Skills for Life",
      "belt test": "BELT TEST — Earn Your Next Rank",
    };
    const fallbackHeadline = fallbackBenefitMap[programDisplay.toLowerCase()] ??
      `${programDisplay.toUpperCase()} — Build Confidence & Discipline`;
    return {
      headline: fallbackHeadline,
      subheadline: `For ${audienceDisplay} — Watch your child grow in confidence and discipline.`,
      tagline: "Limited Spots Available — Register Today!",
      benefits: ["Discipline", "Confidence", "Focus", "Self-Defense"],
      cta: `CALL NOW — Limited Spots! ${phoneDisplay ? phoneDisplay : ""}`.trim(),
      bodyText: `Join ${brandContext.schoolName || "our school"} and give your child the skills to succeed on and off the mat. Enroll today — spots fill fast!`,
    };
  }
}

// ── 5. Prompt Context Enrichment ──────────────────────────────────────────────

/**
 * Use OpenAI to enrich a user's prompt with creative direction.
 * This runs AFTER system rules have already injected brand data.
 * OpenAI adds visual direction, mood, and composition guidance.
 */
export async function enrichPromptContext(
  userPrompt: string,
  brandContext: {
    schoolName: string;
    phone: string | null;
    logoUrl: string | null;
    programs: { name: string; ageRange?: string }[];
    primaryColor: string | null;
  }
): Promise<string> {
  const systemPrompt = `You are a creative director for a martial arts school marketing tool.
Your job is to add visual direction and composition guidance to an image generation prompt.

STRICT RULES:
1. Do NOT change any specific values (ages, names, phone numbers, program names)
2. Add visual direction: lighting, composition, mood, style
3. Keep additions concise — 1-2 sentences of visual direction
4. Focus on making the design feel premium and brand-aligned
5. School colors: ${brandContext.primaryColor || "red and black"}`;

  const userMessage = `Original prompt: "${userPrompt}"
School: ${brandContext.schoolName}

Add creative direction to make this prompt produce a premium, cinematic result.
Respond with just the enhanced creative direction (not the full prompt, just what to add).`;

  try {
    const enhancement = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      { maxTokens: 150, temperature: 0.5 }
    );
    return enhancement;
  } catch {
    return "";
  }
}

// ── 6. Validate OpenAI output against system rules ────────────────────────────

/**
 * Validate that OpenAI-generated copy doesn't violate system rules.
 * Called before any OpenAI output is used in generation.
 */
export function validateCopyAgainstRules(
  copy: Partial<MarketingCopy>,
  lockedValues: {
    ageRange?: string;
    phoneNumber?: string;
    programName?: string;
  }
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  // Check for placeholder text
  const placeholders = ["LOGO HERE", "SCHOOL NAME", "PHONE NUMBER", "YOUR NAME", "INSERT", "[NAME]", "[PHONE]", "[LOGO]"];
  const allText = Object.values(copy).flat().join(" ");
  for (const placeholder of placeholders) {
    if (allText.toUpperCase().includes(placeholder)) {
      violations.push(`Contains placeholder: "${placeholder}"`);
    }
  }

  // Check locked values aren't changed
  if (lockedValues.programName && copy.headline) {
    // Allow variations of the program name (e.g., "LITTLE NINJAS" vs "Little Ninjas")
    const headlineLower = copy.headline.toLowerCase();
    const programLower = lockedValues.programName.toLowerCase();
    if (!headlineLower.includes(programLower.split(" ")[0])) {
      violations.push(`Headline doesn't reference the program: "${lockedValues.programName}"`);
    }
  }

  return { valid: violations.length === 0, violations };
}
