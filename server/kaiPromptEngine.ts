/**
 * Kai Creative — Marketing Structure Engine
 *
 * Transforms raw user input into high-converting marketing prompts.
 *
 * Pipeline:
 *  1. sanitizePrompt()      — strip banned phrases, replace with urgency copy
 *  2. injectCTA()           — auto-inject CTA if user didn't provide one
 *  3. detectProgram()       — inject program-specific context (Little Ninjas, etc.)
 *  4. detectStylePreset()   — infer or accept explicit style preset
 *  5. buildMarketingPrompt() — full hierarchy: headline → visual → CTA → contact
 *
 * This is the "designer + marketer + copywriter" layer.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type StylePreset =
  | "energetic"
  | "premium"
  | "luxury"
  | "kids_playful"
  | "high_converting_ad"
  | "auto"; // auto = engine picks based on content

export interface BrandContext {
  schoolName?: string;
  logoUrl?: string;       // URL or base64 data URL of the school logo
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  phone?: string;
  website?: string;
  address?: string;
  tagline?: string;
}

export interface PromptEngineOptions {
  userPrompt: string;
  style?: StylePreset;
  brand?: BrandContext;
  size?: string; // e.g. "instagram_post", "flyer"
}

// ── Banned Phrases → Urgency Replacements ────────────────────────────────────

const BANNED_PHRASES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bkey details\b/gi, replacement: "Register Now" },
  { pattern: /\bkey detail\b/gi, replacement: "Register Now" },
  { pattern: /\bdetails\b/gi, replacement: "Limited Spots Available" },
  { pattern: /\binformation\b/gi, replacement: "Join Today" },
  { pattern: /\binfo\b/gi, replacement: "Act Now" },
  { pattern: /\blearn more\b/gi, replacement: "Register Now" },
  { pattern: /\bcontact us\b/gi, replacement: "Call Now – Limited Spots" },
  { pattern: /\bsee details\b/gi, replacement: "Enroll Today" },
  { pattern: /\bfind out more\b/gi, replacement: "Don't Miss Out" },
  { pattern: /\bmore information\b/gi, replacement: "Join Today" },
];

// ── CTA Patterns (detect if user already provided a CTA) ─────────────────────

const CTA_PATTERNS = [
  /register/i,
  /enroll/i,
  /sign up/i,
  /join/i,
  /call now/i,
  /book/i,
  /reserve/i,
  /limited spots/i,
  /don't miss/i,
  /act now/i,
  /get started/i,
  /claim/i,
  /free trial/i,
  /try now/i,
];

// ── Style Preset Definitions ──────────────────────────────────────────────────

const STYLE_DEFINITIONS: Record<Exclude<StylePreset, "auto">, string> = {
  energetic: `
    Visual style: bold, high-energy, dynamic
    - Vibrant colors with strong contrast
    - Action-oriented imagery (movement, power, motion blur)
    - Large impactful typography with strong weight
    - Diagonal design elements and energetic composition
    - Conveys excitement, strength, and motivation`,

  premium: `
    Visual style: clean, professional, modern
    - Sophisticated color palette with intentional white space
    - Strong typographic hierarchy with elegant fonts
    - Balanced composition with clear focal point
    - Subtle gradients and refined shadows
    - Conveys trust, quality, and expertise`,

  luxury: `
    Visual style: elegant, exclusive, refined
    - Dark backgrounds with gold or platinum accents
    - Minimal text, maximum visual impact
    - Premium materials and textures (marble, metal, leather)
    - Generous white space and breathing room
    - Conveys prestige, exclusivity, and high value`,

  kids_playful: `
    Visual style: fun, colorful, approachable
    - Bright, cheerful colors (primary palette)
    - Rounded shapes and friendly typography
    - Playful illustrations or cartoon-style elements
    - High energy but safe and welcoming
    - Appeals to both children AND parents
    - Conveys fun, safety, and growth`,

  high_converting_ad: `
    Visual style: direct-response marketing optimized
    - Attention-grabbing headline dominates top third
    - Clear value proposition in subheadline
    - Social proof element (numbers, testimonials, badges)
    - Urgency or scarcity element (limited spots, deadline)
    - Single dominant CTA button/text — large and contrasting
    - Minimal distractions, maximum conversion focus`,
};

// ── Program Awareness ─────────────────────────────────────────────────────────

interface ProgramContext {
  name: string;
  ageRange: string;
  benefits: string[];
  tone: string;
  targetAudience: string;
  keywords: string[];
  defaultCTA: string;
}

const PROGRAM_CONTEXTS: ProgramContext[] = [
  {
    name: "Little Ninjas",
    ageRange: "ages 4–7",
    benefits: ["focus", "confidence", "discipline", "coordination", "listening skills"],
    tone: "fun, energetic, parent-focused, safe and nurturing",
    targetAudience: "parents of young children ages 4–7",
    keywords: ["little ninjas", "little ninja", "tiny ninjas"],
    defaultCTA: "Enroll Today – Limited Spots for Ages 4–7!",
  },
  {
    name: "Kids Karate",
    ageRange: "ages 6–12",
    benefits: ["self-defense", "discipline", "confidence", "fitness", "anti-bullying"],
    tone: "energetic, empowering, parent-reassuring",
    targetAudience: "parents of school-age children",
    keywords: ["kids karate", "children karate", "youth karate", "kids martial arts", "children martial arts"],
    defaultCTA: "Register Now – Limited Spots Available!",
  },
  {
    name: "Teen Karate",
    ageRange: "ages 13–17",
    benefits: ["self-defense", "leadership", "focus", "stress relief", "confidence"],
    tone: "cool, empowering, achievement-focused",
    targetAudience: "teens and their parents",
    keywords: ["teen karate", "teenage karate", "teen martial arts", "youth program"],
    defaultCTA: "Join Today – Build Confidence & Leadership",
  },
  {
    name: "Adult Karate",
    ageRange: "adults 18+",
    benefits: ["self-defense", "fitness", "stress relief", "mental clarity", "community"],
    tone: "strong, professional, results-focused",
    targetAudience: "working adults seeking fitness and self-defense",
    keywords: ["adult karate", "adult martial arts", "adult class", "adults"],
    defaultCTA: "Start Your Free Trial – Limited Spots Available",
  },
  {
    name: "Self Defense",
    ageRange: "all ages",
    benefits: ["personal safety", "confidence", "situational awareness", "practical skills"],
    tone: "empowering, practical, urgent, safety-focused",
    targetAudience: "adults concerned about personal safety",
    keywords: ["self defense", "self-defense", "personal safety", "women's self defense"],
    defaultCTA: "Register Now – Protect Yourself & Your Family",
  },
  {
    name: "Belt Test",
    ageRange: "all students",
    benefits: ["achievement", "recognition", "advancement", "milestone"],
    tone: "celebratory, prestigious, achievement-focused",
    targetAudience: "current students and their families",
    keywords: ["belt test", "belt promotion", "belt ceremony", "rank promotion", "testing"],
    defaultCTA: "Register for Your Belt Test – Spots Are Limited!",
  },
  {
    name: "Summer Camp",
    ageRange: "ages 6–14",
    benefits: ["fun", "fitness", "friends", "skills", "daily structure"],
    tone: "exciting, fun, summer energy, parent-convenient",
    targetAudience: "parents looking for summer activities",
    keywords: ["summer camp", "summer program", "camp", "summer"],
    defaultCTA: "Reserve Your Spot – Summer Fills Fast!",
  },
  {
    name: "Grand Opening",
    ageRange: "all ages",
    benefits: ["community", "new beginning", "special offers", "introductory pricing"],
    tone: "exciting, welcoming, community-focused, celebratory",
    targetAudience: "local community, all ages",
    keywords: ["grand opening", "opening", "new location", "now open"],
    defaultCTA: "Join Us – Grand Opening Special Offer Inside!",
  },
];

// ── Size → Format Label ───────────────────────────────────────────────────────

const SIZE_FORMAT_LABELS: Record<string, string> = {
  instagram_post: "square Instagram post (1:1 ratio)",
  instagram_story: "vertical Instagram story (9:16 ratio, mobile-first)",
  facebook_ad: "Facebook ad (4:5 ratio)",
  flyer: "portrait flyer (3:4 ratio, print-ready)",
  website_banner: "wide website banner (16:9 ratio, landscape)",
};

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * Strip banned phrases from user input and replace with urgency copy.
 */
export function sanitizePrompt(userPrompt: string): string {
  let cleaned = userPrompt;
  for (const { pattern, replacement } of BANNED_PHRASES) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  return cleaned;
}

/**
 * Detect if the user's prompt already contains a CTA.
 */
export function hasCTA(userPrompt: string): boolean {
  return CTA_PATTERNS.some((pattern) => pattern.test(userPrompt));
}

/**
 * Auto-inject a CTA if the user didn't provide one.
 * Uses program-specific CTA if a program is detected, otherwise uses default.
 */
export function injectCTA(userPrompt: string, program?: ProgramContext | null): string {
  if (hasCTA(userPrompt)) return userPrompt;
  const cta = program?.defaultCTA ?? "Register Now – Limited Spots Available!";
  return `${userPrompt}\n\nCall to action: "${cta}"`;
}

/**
 * Detect which program the user is referring to based on keywords in their prompt.
 */
export function detectProgram(userPrompt: string): ProgramContext | null {
  const lower = userPrompt.toLowerCase();
  for (const program of PROGRAM_CONTEXTS) {
    if (program.keywords.some((kw) => lower.includes(kw))) {
      return program;
    }
  }
  return null;
}

/**
 * Detect or infer the best style preset from the user's prompt.
 * If an explicit preset is provided, use it. Otherwise infer from content.
 */
export function detectStylePreset(
  userPrompt: string,
  explicitPreset?: StylePreset
): Exclude<StylePreset, "auto"> {
  if (explicitPreset && explicitPreset !== "auto") return explicitPreset;

  const lower = userPrompt.toLowerCase();

  // Kids content → playful
  if (
    lower.includes("little ninja") ||
    lower.includes("kids") ||
    lower.includes("children") ||
    lower.includes("youth") ||
    lower.includes("camp")
  ) {
    return "kids_playful";
  }

  // Luxury / high-end signals
  if (
    lower.includes("luxury") ||
    lower.includes("elite") ||
    lower.includes("exclusive") ||
    lower.includes("premium")
  ) {
    return "luxury";
  }

  // Ad / conversion signals
  if (
    lower.includes("ad") ||
    lower.includes("offer") ||
    lower.includes("free trial") ||
    lower.includes("limited") ||
    lower.includes("enroll") ||
    lower.includes("sign up") ||
    lower.includes("call to action")
  ) {
    return "high_converting_ad";
  }

  // Default: energetic for martial arts content
  return "energetic";
}

/**
 * Build the full marketing-optimized prompt.
 * This is the main entry point — replaces the old enhancePrompt().
 */
export function buildMarketingPrompt(options: PromptEngineOptions): string {
  const { style, brand, size } = options;

  // Step 1: Sanitize — remove banned phrases
  const sanitized = sanitizePrompt(options.userPrompt);

  // Step 2: Detect program context
  const program = detectProgram(sanitized);

  // Step 3: Inject CTA if missing
  const withCTA = injectCTA(sanitized, program);

  // Step 4: Detect style
  const resolvedStyle = detectStylePreset(withCTA, style);
  const styleDefinition = STYLE_DEFINITIONS[resolvedStyle];

  // Step 5: Format label
  const formatLabel = size ? SIZE_FORMAT_LABELS[size] ?? size : "marketing design";

  // ── Brand Block ──────────────────────────────────────────────────────────────
  const brandBlock = brand
    ? `
BRAND IDENTITY (AUTO-APPLIED — inject ALL of these into the design):
- School name: "${brand.schoolName ?? "the martial arts school"}" — display prominently
- Primary color: ${brand.primaryColor ?? "red"} — dominant color throughout
- Secondary color: ${brand.secondaryColor ?? "black"} — backgrounds and contrast areas
${brand.accentColor ? `- Accent color: ${brand.accentColor} — use sparingly for highlights` : ""}
${brand.phone ? `- Phone: ${brand.phone} — bottom section, large and readable` : ""}
${brand.website ? `- Website: ${brand.website} — bottom section` : ""}
${brand.address ? `- Address: ${brand.address} — include if space allows` : ""}
${brand.tagline ? `- Tagline: "${brand.tagline}" — subheadline or footer` : ""}

LOGO PLACEMENT (CRITICAL):
- Place school name/logo at TOP CENTER or TOP LEFT
- Clear padding around logo — never stretch or distort
- Logo must be visible against background (use contrast backing if needed)
- Logo size: 15–20% of design width
- Never overlap logo with busy imagery
- School name "${brand.schoolName ?? "the school"}" must be instantly readable`
    : "";

  // ── Program Block ────────────────────────────────────────────────────────────
  const programBlock = program
    ? `
PROGRAM CONTEXT — ${program.name.toUpperCase()}:
- Target audience: ${program.targetAudience}
- Age range: ${program.ageRange}
- Benefits to highlight: ${program.benefits.join(", ")}
- Tone: ${program.tone}
- Suggested CTA: "${program.defaultCTA}"`
    : "";

  // ── Marketing Structure Rules ────────────────────────────────────────────────
  const marketingStructure = `
MARKETING DESIGN STRUCTURE (follow this hierarchy exactly):
1. HEADLINE (top third) — Bold, large, dominant. Maximum 6 words. High impact.
   Examples: "SUMMER KARATE CAMP", "BUILD CONFIDENCE & DISCIPLINE", "TRAIN LIKE A CHAMPION"
   NEVER use: "Key Details", "Information", "Details"

2. SUBHEADLINE — Supporting statement. Benefit-driven, not descriptive.
   Examples: "Ages 6–12 • July 8–12 • 9AM–12PM"
   NEVER use generic labels

3. VISUAL CENTER — Dynamic, engaging imagery. People in action. Energy and movement.

4. KEY BENEFITS (if applicable) — 2–3 short punchy lines. Use icons or bullets.
   Examples: "✓ Build Confidence", "✓ Learn Self-Defense", "✓ Make Friends"

5. CALL TO ACTION (bottom third) — LARGE, HIGH CONTRAST, IMPOSSIBLE TO MISS.
   Must use urgency language: "Register Now", "Limited Spots", "Enroll Today", "Don't Miss Out"
   NEVER use: "Learn More", "Find Out More", "See Details"

6. CONTACT INFO (bottom) — Phone number and website. Clean, readable.`;

  // ── Copywriting Rules ────────────────────────────────────────────────────────
  const copywritingRules = `
COPYWRITING RULES (psychology + persuasion):
- Use URGENCY: "Limited Spots Available", "Spots Filling Fast", "Register Before [Date]"
- Use ACTION verbs: "Register", "Enroll", "Join", "Train", "Start", "Claim"
- Use BENEFIT language: what they GET, not what it IS
- NEVER use passive or generic phrases
- Make it PERSUASIVE, not informational
- Every word must earn its place — no filler text`;

  // ── Layout Rules ─────────────────────────────────────────────────────────────
  const layoutRules = `
LAYOUT RULES (always enforce):
- Strong visual hierarchy — one dominant element at a time
- Clean breathing room — never cluttered
- All text readable from 10 feet away
- High contrast — text must pop against background
- Format: ${formatLabel}`;

  // ── Quality Directives ───────────────────────────────────────────────────────
  const qualityDirectives = `
OUTPUT QUALITY:
- Professional agency quality — looks like a $500 design
- Print-ready sharpness
- No watermarks, no placeholder text, no lorem ipsum
- Photorealistic imagery where applicable
- This should make someone stop scrolling and take action`;

  // ── Assemble Full Prompt ─────────────────────────────────────────────────────
  return `Create a HIGH-CONVERTING marketing design for a martial arts school.

DESIGN REQUEST:
${withCTA}
${programBlock}
${brandBlock}

STYLE DIRECTION:
${styleDefinition}
${marketingStructure}
${copywritingRules}
${layoutRules}
${qualityDirectives}

FINAL INSTRUCTION: This must look like it was designed by a professional marketing agency. Bold. Persuasive. Impossible to ignore. Make someone want to register immediately.`;
}

/**
 * Alias for backward compatibility — routes to buildMarketingPrompt.
 */
export function enhancePrompt(options: PromptEngineOptions): string {
  return buildMarketingPrompt(options);
}

/**
 * Parse style preset from a natural language string (for chat-based generation).
 */
export function parseStyleFromText(text: string): StylePreset {
  const lower = text.toLowerCase();
  if (lower.includes("luxury") || lower.includes("elegant") || lower.includes("upscale")) return "luxury";
  if (lower.includes("premium") || lower.includes("professional") || lower.includes("clean")) return "premium";
  if (lower.includes("playful") || lower.includes("fun") || lower.includes("colorful")) return "kids_playful";
  if (lower.includes("ad") || lower.includes("convert") || lower.includes("offer") || lower.includes("enroll")) return "high_converting_ad";
  if (lower.includes("energetic") || lower.includes("bold") || lower.includes("powerful")) return "energetic";
  return "auto";
}
