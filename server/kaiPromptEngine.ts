/**
 * Kai Creative Prompt Engine
 *
 * Transforms raw user input into structured, high-quality Gemini prompts.
 *
 * Pipeline:
 *  1. detectStylePreset()   — infer or accept explicit style preset
 *  2. detectProgram()       — inject program-specific context (Little Ninjas, etc.)
 *  3. enhancePrompt()       — wrap with layout rules, brand context, quality directives
 *
 * This is the "photographer + lighting + editing + direction" layer.
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
  primaryColor?: string;
  secondaryColor?: string;
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
}

const PROGRAM_CONTEXTS: ProgramContext[] = [
  {
    name: "Little Ninjas",
    ageRange: "ages 4–7",
    benefits: ["focus", "confidence", "discipline", "coordination", "listening skills"],
    tone: "fun, energetic, parent-focused, safe and nurturing",
    targetAudience: "parents of young children ages 4–7",
    keywords: ["little ninjas", "little ninja", "tiny ninjas"],
  },
  {
    name: "Kids Karate",
    ageRange: "ages 6–12",
    benefits: ["self-defense", "discipline", "confidence", "fitness", "anti-bullying"],
    tone: "energetic, empowering, parent-reassuring",
    targetAudience: "parents of school-age children",
    keywords: ["kids karate", "children karate", "youth karate", "kids martial arts", "children martial arts"],
  },
  {
    name: "Teen Karate",
    ageRange: "ages 13–17",
    benefits: ["self-defense", "leadership", "focus", "stress relief", "confidence"],
    tone: "cool, empowering, achievement-focused",
    targetAudience: "teens and their parents",
    keywords: ["teen karate", "teenage karate", "teen martial arts", "youth program"],
  },
  {
    name: "Adult Karate",
    ageRange: "adults 18+",
    benefits: ["self-defense", "fitness", "stress relief", "mental clarity", "community"],
    tone: "strong, professional, results-focused",
    targetAudience: "working adults seeking fitness and self-defense",
    keywords: ["adult karate", "adult martial arts", "adult class", "adults"],
  },
  {
    name: "Self Defense",
    ageRange: "all ages",
    benefits: ["personal safety", "confidence", "situational awareness", "practical skills"],
    tone: "empowering, practical, urgent, safety-focused",
    targetAudience: "adults concerned about personal safety",
    keywords: ["self defense", "self-defense", "personal safety", "women's self defense"],
  },
  {
    name: "Belt Test",
    ageRange: "all students",
    benefits: ["achievement", "recognition", "advancement", "milestone"],
    tone: "celebratory, prestigious, achievement-focused",
    targetAudience: "current students and their families",
    keywords: ["belt test", "belt promotion", "belt ceremony", "rank promotion", "testing"],
  },
  {
    name: "Summer Camp",
    ageRange: "ages 6–14",
    benefits: ["fun", "fitness", "friends", "skills", "daily structure"],
    tone: "exciting, fun, summer energy, parent-convenient",
    targetAudience: "parents looking for summer activities",
    keywords: ["summer camp", "summer program", "camp", "summer"],
  },
  {
    name: "Grand Opening",
    ageRange: "all ages",
    benefits: ["community", "new beginning", "special offers", "introductory pricing"],
    tone: "exciting, welcoming, community-focused, celebratory",
    targetAudience: "local community, all ages",
    keywords: ["grand opening", "opening", "new location", "now open"],
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
 * Build the full enhanced prompt from user input + brand + style + program context.
 */
export function enhancePrompt(options: PromptEngineOptions): string {
  const { userPrompt, style, brand, size } = options;

  const resolvedStyle = detectStylePreset(userPrompt, style);
  const styleDefinition = STYLE_DEFINITIONS[resolvedStyle];
  const program = detectProgram(userPrompt);
  const formatLabel = size ? SIZE_FORMAT_LABELS[size] ?? size : "marketing design";

  // Brand block
  const brandBlock = brand
    ? `
BRAND IDENTITY:
- School name: ${brand.schoolName ?? "the martial arts school"}
- Primary color: ${brand.primaryColor ?? "red"}
- Secondary color: ${brand.secondaryColor ?? "black"}
${brand.phone ? `- Phone: ${brand.phone}` : ""}
${brand.website ? `- Website: ${brand.website}` : ""}
${brand.tagline ? `- Tagline: "${brand.tagline}"` : ""}
- Include the school name prominently in the design`
    : "";

  // Program context block
  const programBlock = program
    ? `
PROGRAM CONTEXT — ${program.name.toUpperCase()}:
- Target audience: ${program.targetAudience}
- Age range: ${program.ageRange}
- Key benefits to highlight: ${program.benefits.join(", ")}
- Tone: ${program.tone}`
    : "";

  // Layout rules (always enforced)
  const layoutRules = `
LAYOUT RULES (CRITICAL — always enforce):
- HEADLINE: Large, bold, dominant — occupies top third of design
- SUBHEADLINE: Supporting text below headline, readable at a glance
- VISUAL FOCUS: Engaging central imagery (people, action, energy)
- CALL TO ACTION: Clear, high-contrast CTA at the bottom — make it impossible to miss
- SPACING: Clean breathing room between elements — never cluttered
- READABILITY: All text must be readable from 10 feet away
- HIERARCHY: One dominant element, one secondary, one accent — no competing elements
- CONTRAST: Text must have strong contrast against background`;

  // Quality directives
  const qualityDirectives = `
OUTPUT QUALITY REQUIREMENTS:
- Premium marketing quality — looks like it was designed by a professional agency
- Print-ready sharpness and clarity
- No watermarks, no lorem ipsum, no placeholder text
- Photorealistic where applicable
- Format: ${formatLabel}
- Do NOT include any text that says "placeholder" or generic stock photo feel`;

  // Assemble the full enhanced prompt
  return `Create a high-converting marketing design for a martial arts school.

DESIGN REQUEST:
${userPrompt}
${programBlock}
${brandBlock}

STYLE DIRECTION:
${styleDefinition}
${layoutRules}
${qualityDirectives}

FINAL INSTRUCTION: This should look like a $500 professional marketing design. Make it stunning, bold, and immediately compelling.`;
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
