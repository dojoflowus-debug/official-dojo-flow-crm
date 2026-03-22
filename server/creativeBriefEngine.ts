/**
 * Kai Creative — Creative Brief Engine
 *
 * Determines if a user prompt has enough information to generate a high-quality design.
 * If not, returns 2–4 targeted clarification questions.
 * If yes, returns a "ready to generate" signal with the enriched brief.
 *
 * Modes:
 *  - Guided Mode (default): ask questions before generating
 *  - Fast Mode: if prompt is complete → generate immediately
 *
 * Completeness scoring:
 *  - program/purpose        (required)  +30 pts
 *  - target audience/age    (optional)  +20 pts
 *  - key content (phone/CTA)(optional)  +20 pts
 *  - tone/style             (optional)  +10 pts
 *  - school name present    (from ctx)  +10 pts
 *  - logo present           (from ctx)  +10 pts
 *
 *  Score >= 60 → Fast Mode (generate immediately)
 *  Score <  60 → Guided Mode (ask questions)
 */

import type { BusinessContext, ProgramInfo } from "./contextInjectionEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BriefQuestion {
  id: string;
  question: string;
  hint: string;
  chips?: string[];           // quick-pick options
  required: boolean;
}

export interface BriefAnalysis {
  score: number;              // 0–100
  isComplete: boolean;        // score >= 60
  programConfirmed: boolean;  // hard gate: program must be confirmed
  missingFields: string[];
  questions: BriefQuestion[];
  enrichedBrief: string;      // the full brief to use for generation
  detectedProgram: string | null;
  detectedAudience: string | null;
  detectedTone: string | null;
  availablePrograms: string[];
}

// ── Keyword banks ─────────────────────────────────────────────────────────────

const PROGRAM_KEYWORDS = [
  "little ninjas", "ninja", "kickboxing", "karate", "taekwondo", "bjj",
  "jiu-jitsu", "jiu jitsu", "muay thai", "boxing", "wrestling", "judo",
  "mixed martial arts", "mma", "self defense", "self-defense", "fitness",
  "yoga", "gymnastics", "dance", "kids", "adult", "teen", "youth",
  "beginner", "advanced", "competition", "tournament",
];

const AUDIENCE_KEYWORDS = [
  "ages", "age", "year old", "years old", "kids", "children", "toddler",
  "adult", "teen", "teenager", "senior", "family", "beginner", "advanced",
  "women", "men", "boys", "girls", "youth", "all ages",
];

const CONTENT_KEYWORDS = [
  "phone", "call", "number", "email", "website", "address", "schedule",
  "class time", "offer", "discount", "free trial", "free class", "enroll",
  "register", "sign up", "join", "start", "promo", "special",
];

const TONE_KEYWORDS = [
  "bold", "cinematic", "fun", "playful", "professional", "premium", "energetic",
  "modern", "clean", "minimal", "dramatic", "intense", "friendly", "serious",
  "high energy", "exciting", "powerful", "strong",
];

const FORMAT_KEYWORDS = [
  "flyer", "poster", "banner", "instagram", "social media", "post", "ad",
  "advertisement", "brochure", "card", "postcard", "email header", "story",
];

// ── Scoring ───────────────────────────────────────────────────────────────────

function scorePrompt(
  prompt: string,
  context: BusinessContext
): {
  score: number;
  hasProgram: boolean;
  hasAudience: boolean;
  hasContent: boolean;
  hasTone: boolean;
  hasFormat: boolean;
  detectedProgram: string | null;
  detectedAudience: string | null;
  detectedTone: string | null;
} {
  const lower = prompt.toLowerCase();

  // Check for program/purpose
  const hasProgram =
    PROGRAM_KEYWORDS.some((k) => lower.includes(k)) ||
    context.programs.some((p) => lower.includes(p.name.toLowerCase()));

  // Check for audience/age
  const hasAudience = AUDIENCE_KEYWORDS.some((k) => lower.includes(k));

  // Check for key content (phone, CTA, offer)
  // NOTE: context.phone does NOT count toward hasContent scoring — it's injected automatically
  // but the user still needs to specify a program. Phone presence should not inflate score.
  const hasContent = CONTENT_KEYWORDS.some((k) => lower.includes(k));

  // Check for tone/style
  const hasTone = TONE_KEYWORDS.some((k) => lower.includes(k));

  // Check for format
  const hasFormat = FORMAT_KEYWORDS.some((k) => lower.includes(k));

  // Detect specific values
  const detectedProgram =
    context.programs.find((p) => lower.includes(p.name.toLowerCase()))?.name ||
    PROGRAM_KEYWORDS.find((k) => lower.includes(k)) || null;

  const audienceMatch = lower.match(/ages?\s+(\d+[\s–-]+\d+|\d+\+?)/i);
  const detectedAudience = audienceMatch ? audienceMatch[0] : null;

  const detectedTone = TONE_KEYWORDS.find((k) => lower.includes(k)) || null;

  // Score calculation
  let score = 0;
  if (hasProgram) score += 30;
  if (hasAudience) score += 20;
  if (hasContent) score += 20;
  if (hasTone) score += 10;
  if (context.schoolName) score += 10;
  if (context.logoUrl) score += 10;

  return {
    score,
    hasProgram,
    hasAudience,
    hasContent,
    hasTone,
    hasFormat,
    detectedProgram,
    detectedAudience,
    detectedTone,
  };
}

// ── Question builder ──────────────────────────────────────────────────────────

function buildQuestions(
  scoring: ReturnType<typeof scorePrompt>,
  context: BusinessContext,
  prompt: string
): BriefQuestion[] {
  const questions: BriefQuestion[] = [];

  // Q1: Program/purpose (required if missing)
  if (!scoring.hasProgram) {
    const programChips = context.programs.length > 0
      ? context.programs.slice(0, 5).map((p) =>
          p.ageRange ? `${p.name} (${p.ageRange})` : p.name
        )
      : ["Little Ninjas", "Kickboxing", "Adult Karate", "Self Defense", "Kids Program"];

    questions.push({
      id: "program",
      question: "What program or event are we promoting?",
      hint: "e.g. Little Ninjas, Kickboxing, Summer Camp",
      chips: programChips,
      required: true,
    });
  }

  // Q2: Audience (if missing and no program with age range detected)
  if (!scoring.hasAudience && !scoring.detectedAudience) {
    const audienceChips = ["Ages 3–5", "Ages 6–12", "Teens (13–17)", "Adults 18+", "All Ages", "Families"];
    questions.push({
      id: "audience",
      question: "Who is this for?",
      hint: "e.g. Ages 3–5, Adults, Families",
      chips: audienceChips,
      required: false,
    });
  }

  // Q3: Key content (if missing phone and no CTA)
  if (!scoring.hasContent && !context.phone) {
    questions.push({
      id: "content",
      question: "Anything specific to include? (phone number, offer, schedule)",
      hint: "e.g. Call 555-1234, Free Trial Class, Mon/Wed 6pm",
      chips: ["Include phone number", "Add free trial offer", "Include class schedule", "Skip — use my profile data"],
      required: false,
    });
  }

  // Q4: Tone/style (only ask if no tone and prompt is very short)
  if (!scoring.hasTone && prompt.trim().split(" ").length < 8 && questions.length < 3) {
    questions.push({
      id: "tone",
      question: "What vibe should this have?",
      hint: "e.g. Bold & energetic, Fun & playful, Clean & professional",
      chips: ["Bold & Cinematic", "Fun & Playful", "Clean & Professional", "High Energy", "Premium & Modern"],
      required: false,
    });
  }

  return questions.slice(0, 4); // max 4 questions
}

// ── Brief builder ─────────────────────────────────────────────────────────────

function buildEnrichedBrief(
  prompt: string,
  context: BusinessContext,
  answers: Record<string, string>
): string {
  const parts: string[] = [prompt.trim()];

  // Inject answered fields
  if (answers.program && !prompt.toLowerCase().includes(answers.program.toLowerCase())) {
    parts.push(`for ${answers.program}`);
  }
  if (answers.audience && !prompt.toLowerCase().includes("age")) {
    parts.push(`targeting ${answers.audience}`);
  }
  if (answers.content && answers.content !== "Skip — use my profile data") {
    parts.push(`— include: ${answers.content}`);
  }
  if (answers.tone) {
    parts.push(`— style: ${answers.tone}`);
  }

  // Always inject business context
  const contextParts: string[] = [];
  if (context.schoolName) contextParts.push(`School: ${context.schoolName}`);
  if (context.phone) contextParts.push(`Phone: ${context.phone}`);
  if (context.email) contextParts.push(`Email: ${context.email}`);
  if (context.website) contextParts.push(`Website: ${context.website}`);
  if (context.address) contextParts.push(`Address: ${context.address}`);
  if (context.logoUrl) contextParts.push(`Logo: [use uploaded logo at top center]`);
  if (context.primaryColor) contextParts.push(`Brand color: ${context.primaryColor}`);
  if (context.programs.length > 0) {
    const programList = context.programs.slice(0, 3).map((p) =>
      p.ageRange ? `${p.name} (${p.ageRange})` : p.name
    ).join(", ");
    contextParts.push(`Programs offered: ${programList}`);
  }

  if (contextParts.length > 0) {
    parts.push(`\n\nBUSINESS DATA (use exactly as provided, do NOT change):\n${contextParts.join("\n")}`);
  }

  return parts.join(" ");
}

// ── Main export ───────────────────────────────────────────────────────────────

export function analyzeBrief(
  prompt: string,
  context: BusinessContext,
  answers: Record<string, string> = {},
  fastMode: boolean = false
): BriefAnalysis {
  // Merge any chip answers into the prompt for re-scoring
  const mergedPrompt = [
    prompt,
    answers.program || "",
    answers.audience || "",
    answers.content || "",
    answers.tone || "",
  ].filter(Boolean).join(" ");

  const scoring = scorePrompt(mergedPrompt, context);
  // Hard gate: program is ALWAYS required — cannot be bypassed by score or answer count alone.
  // Fast Mode only skips optional questions (audience, tone), not the required program question.
  const programConfirmed = scoring.hasProgram || !!answers.program;
  // isComplete requires:
  //   1. Program MUST be confirmed (hard gate — cannot be bypassed)
  //   2. Fast Mode: skip optional questions once program is known
  //   3. Guided Mode: score >= 60 OR all required questions answered
  // Object.keys(answers).length >= 1 is NOT sufficient alone — program must be one of those answers.
  const isComplete = programConfirmed && (fastMode || scoring.score >= 60);

  const missingFields: string[] = [];
  if (!programConfirmed) missingFields.push("program");
  if (!scoring.hasAudience && !answers.audience) missingFields.push("audience");
  if (!scoring.hasContent && !context.phone && !answers.content) missingFields.push("key content");

  const questions = isComplete ? [] : buildQuestions(scoring, context, mergedPrompt);
  const enrichedBrief = buildEnrichedBrief(mergedPrompt, context, answers);

  // Include available programs so the client can always show the smart opening card
  const availablePrograms = context.programs.length > 0
    ? context.programs.slice(0, 6).map((p) =>
        p.ageRange ? `${p.name} (${p.ageRange})` : p.name
      )
    : ["Little Ninjas", "Kickboxing", "Adult Karate", "Self Defense", "Kids Program"];

  return {
    score: scoring.score,
    isComplete,
    programConfirmed,
    missingFields,
    questions,
    enrichedBrief,
    detectedProgram: scoring.detectedProgram,
    detectedAudience: scoring.detectedAudience,
    detectedTone: scoring.detectedTone,
    availablePrograms,
  };
}

// ── Guided conversation helper ────────────────────────────────────────────────

/**
 * Returns the next unanswered question from the brief analysis.
 * Used by the client to show one question at a time in conversation style.
 */
export function getNextQuestion(
  analysis: BriefAnalysis,
  answeredIds: string[]
): BriefQuestion | null {
  return analysis.questions.find((q) => !answeredIds.includes(q.id)) || null;
}

/**
 * Checks if all required questions have been answered.
 */
export function allRequiredAnswered(
  analysis: BriefAnalysis,
  answeredIds: string[]
): boolean {
  const required = analysis.questions.filter((q) => q.required);
  return required.every((q) => answeredIds.includes(q.id));
}
