/**
 * Kai Creative — Premium Marketing Prompt Engine v2
 *
 * Transforms raw user input into high-converting, brand-accurate marketing prompts.
 *
 * Pipeline:
 *  1. extractUserValues()    — lock in user-specified ages, names, phones (NO hallucination)
 *  2. sanitizePrompt()       — strip banned phrases, replace with urgency copy
 *  3. injectCTA()            — auto-inject CTA if user didn't provide one
 *  4. detectProgram()        — inject program-specific context (Little Ninjas, etc.)
 *  5. detectStylePreset()    — infer or accept explicit style preset
 *  6. buildMarketingPrompt() — full hierarchy: logo → headline → visual → CTA → contact
 *
 * STRICT RULES:
 *  - NEVER change user-specified age ranges, program names, or phone numbers
 *  - ALWAYS inject logo/brand assets when available
 *  - ALWAYS use premium design language — cinematic, bold, high-contrast
 *  - NEVER produce generic stock-template outputs
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

// ── User Value Extraction (anti-hallucination) ────────────────────────────────

interface ExtractedUserValues {
  ageRange: string | null;
  programName: string | null;
  phone: string | null;
  headline: string | null;
  colors: string[];
}

/**
 * Extract explicit values the user specified — these must NEVER be changed.
 * Age ranges, program names, phone numbers, and headline text are locked.
 */
export function extractUserValues(userPrompt: string): ExtractedUserValues {
  const text = userPrompt;

  // Age range patterns: "ages 3-5", "ages 3–5", "3 to 5 year", "3-5 year olds"
  const ageMatch = text.match(/ages?\s*(\d+\s*[-–to]+\s*\d+)/i)
    ?? text.match(/(\d+\s*[-–to]+\s*\d+)\s*year/i)
    ?? text.match(/(\d+\s*[-–to]+\s*\d+)\s*yr/i);
  const ageRange = ageMatch ? ageMatch[1].replace(/\s+/g, "").replace("to", "–") : null;

  // Phone number: various formats
  const phoneMatch = text.match(/(?:phone|call|tel|#)?\s*(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/i);
  const phone = phoneMatch ? phoneMatch[1] : null;

  // Headline: text in ALL CAPS or quoted
  const headlineMatch = text.match(/headline[:\s]+"([^"]+)"/i)
    ?? text.match(/headline[:\s]+([A-Z][A-Z\s]{4,})/);
  const headline = headlineMatch ? headlineMatch[1].trim() : null;

  // Program name: quoted or after "program:"
  const programMatch = text.match(/program[:\s]+"([^"]+)"/i)
    ?? text.match(/program[:\s]+([A-Za-z\s]+?)(?:\n|ages|,)/i);
  const programName = programMatch ? programMatch[1].trim() : null;

  // Color mentions
  const colorPatterns = ["red", "black", "white", "gold", "blue", "green", "purple", "orange"];
  const colors = colorPatterns.filter(c => text.toLowerCase().includes(c));

  return { ageRange, programName, phone, headline, colors };
}

// ── Banned Phrases → Urgency Replacements ────────────────────────────────────

const BANNED_PHRASES: Array<{ pattern: RegExp; replacement: string }> = [
  // -- Template artifacts -- must NEVER appear in a real ad --
  { pattern: /\bonce provide prints\b/gi, replacement: "" },
  { pattern: /\bprovide prints\b/gi, replacement: "" },
  { pattern: /\bonce provide\b/gi, replacement: "" },
  { pattern: /\bsample text\b/gi, replacement: "" },
  { pattern: /\byour text here\b/gi, replacement: "" },
  { pattern: /\binsert text\b/gi, replacement: "" },
  { pattern: /\bclick to edit\b/gi, replacement: "" },
  { pattern: /\btext goes here\b/gi, replacement: "" },
  { pattern: /\blorem ipsum\b/gi, replacement: "" },
  { pattern: /\bstock photo\b/gi, replacement: "" },
  // -- Weak CTA replacements --
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
  /register/i, /enroll/i, /sign up/i, /join/i, /call now/i, /book/i,
  /reserve/i, /limited spots/i, /don't miss/i, /act now/i, /get started/i,
  /claim/i, /free trial/i, /try now/i,
];

// ── Style Preset Definitions ──────────────────────────────────────────────────

const STYLE_DEFINITIONS: Record<Exclude<StylePreset, "auto">, string> = {
  energetic: `
VISUAL STYLE: Bold, cinematic, high-energy martial arts brand
- Deep black background with explosive red accents
- Dynamic action photography or illustrated figures in motion
- Typography: ultra-bold, condensed, military/sport style (like Bebas Neue or Impact)
- Diagonal composition lines creating forward momentum
- Dramatic lighting: rim light on subjects, dark vignette edges
- Red/black/white color scheme — high contrast, zero ambiguity
- Feels like a premium martial arts brand, NOT a stock template`,

  premium: `
VISUAL STYLE: Clean, professional, modern martial arts brand
- Dark background with sophisticated red and white accents
- Strong typographic hierarchy with intentional white space
- Balanced composition with clear focal point
- Subtle gradients and refined shadows
- Conveys trust, quality, and mastery
- Feels like a $500 agency design`,

  luxury: `
VISUAL STYLE: Elegant, exclusive, premium martial arts school
- Near-black backgrounds with gold or crimson accents
- Minimal text, maximum visual impact
- Premium textures (brushed metal, leather, aged paper)
- Generous breathing room and refined spacing
- Conveys prestige, exclusivity, and mastery`,

  kids_playful: `
VISUAL STYLE: Fun, energetic, kid-friendly martial arts — PHOTOREALISTIC photography style
- Bold, vibrant colors: red, black, white with bright accents
- REAL CHILDREN photographed in martial arts uniforms — NOT cartoons, NOT illustrations, NOT anime
- Cinematic, professional photography with dramatic lighting
- Rounded, friendly typography that's still bold and readable
- Playful but structured — NOT childish or cheap-looking
- Parents see: safe, professional, confidence-building
- Kids see: exciting, fun, I want to do that!
- Think: high-end children's brand photographed by a professional sports photographer
- PHOTOREALISTIC: 2–3 real children in white karate gi, black belts, big smiles
- Characters doing kicks, punches, or bow stance — full of energy
- CRITICAL: NO cartoons, NO illustrations, NO anime, NO 3D renders — REAL PHOTOS ONLY`,

  high_converting_ad: `
VISUAL STYLE: Direct-response marketing — maximum conversion
- Attention-grabbing headline dominates top third
- Clear value proposition in subheadline
- Social proof element (numbers, testimonials, badges)
- Urgency or scarcity element (limited spots, deadline)
- Single dominant CTA button/text — large and contrasting
- Minimal distractions, maximum conversion focus
- Red CTA button on dark background — impossible to miss`,
};

// ── Program Awareness ─────────────────────────────────────────────────────────

interface ProgramContext {
  name: string;
  defaultAgeRange: string;
  benefits: string[];
  tone: string;
  targetAudience: string;
  keywords: string[];
  defaultCTA: string;
  visualStyle: string;
}

const PROGRAM_CONTEXTS: ProgramContext[] = [
  {
    name: "Little Ninjas",
    defaultAgeRange: "ages 3–5",  // default only — user value takes precedence
    benefits: ["Focus", "Confidence", "Discipline", "Coordination", "Listening Skills"],
    tone: "fun, energetic, parent-focused, safe and nurturing",
    targetAudience: "parents of young children",
    keywords: ["little ninjas", "little ninja", "tiny ninjas"],
    defaultCTA: "Enroll Today – Limited Spots!",
    visualStyle: "PHOTOREALISTIC real children in white karate gi, big smiles, energetic poses. Professional sports photography. Playful but structured. Red/black/white palette. NO cartoons, NO illustrations.",
  },
  {
    name: "Kids Karate",
    defaultAgeRange: "ages 6–12",
    benefits: ["Self-Defense", "Discipline", "Confidence", "Fitness", "Anti-Bullying"],
    tone: "energetic, empowering, parent-reassuring",
    targetAudience: "parents of school-age children",
    keywords: ["kids karate", "children karate", "youth karate", "kids martial arts", "children martial arts"],
    defaultCTA: "Register Now – Limited Spots Available!",
    visualStyle: "Dynamic kids in martial arts action. Bold, high-energy. Red and black.",
  },
  {
    name: "Teen Karate",
    defaultAgeRange: "ages 13–17",
    benefits: ["Self-Defense", "Leadership", "Focus", "Stress Relief", "Confidence"],
    tone: "cool, empowering, achievement-focused",
    targetAudience: "teens and their parents",
    keywords: ["teen karate", "teenage karate", "teen martial arts", "youth program"],
    defaultCTA: "Join Today – Build Confidence & Leadership",
    visualStyle: "Teen martial artist in powerful stance. Dark, cinematic. Red accent lighting.",
  },
  {
    name: "Adult Karate",
    defaultAgeRange: "adults 18+",
    benefits: ["Self-Defense", "Fitness", "Stress Relief", "Mental Clarity", "Community"],
    tone: "strong, professional, results-focused",
    targetAudience: "working adults seeking fitness and self-defense",
    keywords: ["adult karate", "adult martial arts", "adult class", "adults"],
    defaultCTA: "Start Your Free Trial – Limited Spots Available",
    visualStyle: "Adult martial artist in powerful stance. Professional, cinematic. Dark background.",
  },
  {
    name: "Self Defense",
    defaultAgeRange: "all ages",
    benefits: ["Personal Safety", "Confidence", "Situational Awareness", "Practical Skills"],
    tone: "empowering, practical, urgent, safety-focused",
    targetAudience: "adults concerned about personal safety",
    keywords: ["self defense", "self-defense", "personal safety", "women's self defense"],
    defaultCTA: "Register Now – Protect Yourself & Your Family",
    visualStyle: "Empowering stance, confident subject. Bold typography. Dark, serious tone.",
  },
  {
    name: "Belt Test",
    defaultAgeRange: "all students",
    benefits: ["Achievement", "Recognition", "Advancement", "Milestone"],
    tone: "celebratory, prestigious, achievement-focused",
    targetAudience: "current students and their families",
    keywords: ["belt test", "belt promotion", "belt ceremony", "rank promotion", "testing"],
    defaultCTA: "Register for Your Belt Test – Spots Are Limited!",
    visualStyle: "Student holding belt, triumphant pose. Gold and black accents. Prestigious.",
  },
  {
    name: "Summer Camp",
    defaultAgeRange: "ages 6–14",
    benefits: ["Fun", "Fitness", "Friends", "Skills", "Daily Structure"],
    tone: "exciting, fun, summer energy, parent-convenient",
    targetAudience: "parents looking for summer activities",
    keywords: ["summer camp", "summer program", "camp", "summer"],
    defaultCTA: "Reserve Your Spot – Summer Fills Fast!",
    visualStyle: "Kids in action, bright summer energy. Bold colors. Fun but structured.",
  },
  {
    name: "Grand Opening",
    defaultAgeRange: "all ages",
    benefits: ["Community", "New Beginning", "Special Offers", "Introductory Pricing"],
    tone: "exciting, welcoming, community-focused, celebratory",
    targetAudience: "local community, all ages",
    keywords: ["grand opening", "opening", "new location", "now open"],
    defaultCTA: "Join Us – Grand Opening Special Offer Inside!",
    visualStyle: "Celebratory, bold. Red ribbon cutting or school exterior. Community energy.",
  },
];

// ── Size → Format Label ───────────────────────────────────────────────────────

const SIZE_FORMAT_LABELS: Record<string, string> = {
  instagram_post: "square Instagram post (1:1 ratio)",
  instagram_story: "vertical Instagram story (9:16 ratio, mobile-first)",
  facebook_ad: "Facebook ad (4:5 ratio)",
  flyer: "landscape flyer (4:3 ratio, 11×8.5 inches, print-ready)",
  website_banner: "wide website banner (16:9 ratio, landscape)",
};

// -- Headline Rewriter -- weak program names to benefit-driven headlines --
/**
 * Rewrites weak program-name-only headlines into benefit-driven ad headlines.
 * "Dragon Kids Program" -> "DRAGON KIDS -- Build Confidence & Discipline"
 */
const HEADLINE_UPGRADES: Array<{ pattern: RegExp; upgrade: string }> = [
  { pattern: /^little ninjas?\s*program?$/i,           upgrade: "LITTLE NINJAS -- Confidence Starts Here" },
  { pattern: /^kids?\s*karate\s*program?$/i,           upgrade: "KIDS KARATE -- Discipline, Focus & Fun" },
  { pattern: /^adult\s*karate\s*program?$/i,           upgrade: "ADULT KARATE -- Train. Focus. Dominate." },
  { pattern: /^adult\s*martial\s*arts?\s*program?$/i, upgrade: "ADULT MARTIAL ARTS -- Stronger Every Day" },
  { pattern: /^dragon\s*kids?\s*program?$/i,           upgrade: "DRAGON KIDS -- Build Confidence & Discipline" },
  { pattern: /^teen\s*karate\s*program?$/i,            upgrade: "TEEN KARATE -- Strength, Respect & Confidence" },
  { pattern: /^self[\s-]?defense\s*program?$/i,        upgrade: "SELF DEFENSE -- Protect Yourself & Your Family" },
  { pattern: /^summer\s*camp\s*program?$/i,            upgrade: "SUMMER MARTIAL ARTS CAMP -- Skills for Life" },
  { pattern: /^belt\s*test\s*program?$/i,              upgrade: "BELT TEST -- Earn Your Next Rank" },
  { pattern: /^grand\s*opening\s*program?$/i,          upgrade: "GRAND OPENING -- Join Our Martial Arts Family" },
];

export function rewriteHeadline(rawHeadline: string): string {
  const trimmed = rawHeadline.trim();
  for (const { pattern, upgrade } of HEADLINE_UPGRADES) {
    if (pattern.test(trimmed)) return upgrade;
  }
  // If it is just a program name with no benefit (no dash, colon, or exclamation), append a benefit
  const isWeakHeadline = !/[-|:!]/.test(trimmed) && trimmed.split(" ").length <= 3;
  if (isWeakHeadline) {
    return trimmed.toUpperCase() + " -- Build Confidence & Discipline";
  }
  return trimmed;
}

// ── Core Functions ────────────────────────────────────────────────────────────

export function sanitizePrompt(userPrompt: string): string {
  let cleaned = userPrompt;
  for (const { pattern, replacement } of BANNED_PHRASES) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  return cleaned;
}

export function hasCTA(userPrompt: string): boolean {
  return CTA_PATTERNS.some((pattern) => pattern.test(userPrompt));
}

export function injectCTA(userPrompt: string, program?: ProgramContext | null): string {
  if (hasCTA(userPrompt)) return userPrompt;
  const cta = program?.defaultCTA ?? "Register Now – Limited Spots Available!";
  return `${userPrompt}\n\nCall to action: "${cta}"`;
}

export function detectProgram(userPrompt: string): ProgramContext | null {
  const lower = userPrompt.toLowerCase();
  for (const program of PROGRAM_CONTEXTS) {
    if (program.keywords.some((kw) => lower.includes(kw))) {
      return program;
    }
  }
  return null;
}

export function detectStylePreset(
  userPrompt: string,
  explicitPreset?: StylePreset
): Exclude<StylePreset, "auto"> {
  if (explicitPreset && explicitPreset !== "auto") return explicitPreset;

  const lower = userPrompt.toLowerCase();

  if (lower.includes("little ninja") || lower.includes("kids") || lower.includes("children") || lower.includes("youth") || lower.includes("camp")) {
    return "kids_playful";
  }
  if (lower.includes("luxury") || lower.includes("elite") || lower.includes("exclusive") || lower.includes("premium")) {
    return "luxury";
  }
  if (lower.includes("offer") || lower.includes("free trial") || lower.includes("limited") || lower.includes("enroll") || lower.includes("sign up")) {
    return "high_converting_ad";
  }
  if (lower.includes("professional") || lower.includes("clean") || lower.includes("modern")) {
    return "premium";
  }

  return "energetic";
}

/**
 * Build the full premium marketing prompt.
 * STRICT: user-specified values (age, phone, name) are NEVER overridden.
 */
export function buildMarketingPrompt(options: PromptEngineOptions): string {
  const { style, brand, size } = options;

  // Step 1: Extract user-specified values (these are LOCKED — never change)
  const userValues = extractUserValues(options.userPrompt);

  // Step 2: Sanitize
  const sanitized = sanitizePrompt(options.userPrompt);

  // Step 3: Detect program context
  const program = detectProgram(sanitized);

  // Step 4: Inject CTA if missing
  const withCTA = injectCTA(sanitized, program);

  // Step 5: Detect style
  const resolvedStyle = detectStylePreset(withCTA, style);
  const styleDefinition = STYLE_DEFINITIONS[resolvedStyle];

  // Step 6: Format label
  const formatLabel = size ? SIZE_FORMAT_LABELS[size] ?? size : "marketing flyer";

  // ── Strict Value Lock Block (anti-hallucination) ─────────────────────────────
  const strictValueBlock = `
⚠️ STRICT DATA ACCURACY — DO NOT CHANGE THESE VALUES:
${userValues.ageRange ? `- Age range: "${userValues.ageRange}" — display EXACTLY as written, do not change to any other age range` : ""}
${userValues.phone ? `- Phone number: "${userValues.phone}" — display EXACTLY as written` : ""}
${userValues.headline ? `- Headline text: "${rewriteHeadline(userValues.headline)}" — use EXACTLY as written` : ""}
${userValues.programName ? `- Program name: "${userValues.programName}" — use EXACTLY as written` : ""}
${userValues.colors.length > 0 ? `- Color scheme: ${userValues.colors.join(", ")} — use these colors throughout` : ""}
RULE: Never invent, approximate, or change any of the above. If a value is specified by the user, it is final.`;

  // ── Brand Block ──────────────────────────────────────────────────────────────
  const hasLogo = brand?.logoUrl;
  const brandBlock = brand
    ? `
BRAND IDENTITY — AUTO-APPLIED (inject ALL into the design):
- School name: "${brand.schoolName ?? "the martial arts school"}" — display prominently
- Primary color: ${brand.primaryColor ?? "red"} — dominant color throughout
- Secondary color: ${brand.secondaryColor ?? "black"} — backgrounds and contrast areas
${brand.accentColor ? `- Accent color: ${brand.accentColor} — use sparingly for highlights` : ""}
${brand.phone && !userValues.phone ? `- Phone: ${brand.phone} — bottom section, large and readable` : ""}
${brand.website ? `- Website: ${brand.website} — bottom section` : ""}
${brand.address ? `- Address: ${brand.address} — include if space allows` : ""}
${brand.tagline ? `- Tagline: "${brand.tagline}" — subheadline or footer` : ""}

LOGO PLACEMENT — CRITICAL REQUIREMENT:
${hasLogo
  ? `- The school logo has been provided — place it prominently at TOP CENTER of the design
- Logo must be clearly visible, properly sized (15–20% of design width)
- Clear padding around logo — never stretch, distort, or overlap with busy imagery
- Logo must be readable against background — use contrast backing if needed
- DO NOT generate a fake or placeholder logo — use the provided school logo only`
  : `- No logo uploaded — use the school name "${brand.schoolName ?? "the school"}" as a bold text logo at top center
- Style the school name as a premium wordmark — bold, clean, professional
- DO NOT generate a generic placeholder logo or clip-art emblem`}`
    : `
LOGO: No brand data available. Use a bold martial arts emblem at top center.`;

  // ── Program Block ────────────────────────────────────────────────────────────
  // Use user-specified age range if provided, otherwise use program default
  const effectiveAgeRange = userValues.ageRange ?? program?.defaultAgeRange ?? null;
  const programBlock = program
    ? `
PROGRAM: ${program.name.toUpperCase()}
- Target audience: ${program.targetAudience}
- Age range: ${effectiveAgeRange ?? program.defaultAgeRange} — USE EXACTLY THIS, do not change
- Benefits to highlight: ${program.benefits.join(", ")}
- Tone: ${program.tone}
- Visual style: ${program.visualStyle}
- CTA: "${program.defaultCTA}"`
    : effectiveAgeRange
    ? `\nAGE RANGE: ${effectiveAgeRange} — display EXACTLY as specified`
    : "";

  // -- Conversion Mode -- enforces 6-element ad structure --
  const ctaPhone = userValues.phone ?? brand?.phone ?? null;
  const conversionMode = `
CONVERSION MODE -- THIS IS A DIRECT-RESPONSE AD, NOT A FLYER:
Every element must serve one goal: get a parent or adult to TAKE ACTION.

MANDATORY AD ELEMENTS (all 6 must appear -- no exceptions):
1. HEADLINE -- Attention-grabbing, benefit-driven, 3-6 words in ALL CAPS
   STRONG: "LITTLE NINJAS -- Confidence Starts Here"
   STRONG: "BUILD DISCIPLINE. BUILD CHAMPIONS."
   BANNED: "Dragon Kids Program" (just a name, no benefit)
   BANNED: "Martial Arts Classes" (generic, no emotion)

2. EMOTIONAL HOOK -- One line that speaks to the parent's desire
   STRONG: "Watch your child grow in confidence, focus, and discipline."
   WEAK: "We offer martial arts classes for kids."

3. TARGET AUDIENCE -- Clearly stated age group
   STRONG: "Ages 3-5" / "Ages 6-12" / "Adults 18+"
   WEAK: "All ages" (too vague)

4. BENEFITS -- 3-4 short, punchy benefit statements
   STRONG: "Confidence  Discipline  Focus  Self-Defense"
   WEAK: "We teach karate"

5. CALL TO ACTION -- Urgent, specific, impossible to miss
   STRONG: "CALL NOW -- Limited Spots Available!"
   STRONG: "FREE TRIAL CLASS -- Register Today!"
   WEAK: "Contact us" / "Learn more"
   ${ctaPhone ? "Phone: " + ctaPhone + " -- display LARGE in the CTA section" : "Include a phone number or registration link in the CTA"}

6. URGENCY -- Scarcity or time pressure element
   STRONG: "Limited Spots Available" / "This Month Only" / "Free Trial Ends Soon"
   WEAK: No urgency = no action

QUALITY TEST -- Before finalizing, ask:
- Does this look like a REAL AD a parent would stop and read?
- Is the headline bold enough to grab attention in 1 second?
- Would a parent pick up the phone after seeing this?
If NO to any of these -- redesign with stronger copy and bolder hierarchy.`;

  // ── Premium Composition Rules ────────────────────────────────────────────────
  const compositionRules = `
PREMIUM COMPOSITION RULES — follow this layout hierarchy exactly:

1. LOGO / SCHOOL NAME (top center, ~15% height)
   - Logo or bold school name wordmark
   - Clean white space below logo

2. HEADLINE (bold, large, dominant — 30–40% of visual space)
   - Maximum 4–6 words
   - Ultra-bold, condensed typeface
   - High contrast against background
   - Examples: "LITTLE NINJAS", "TRAIN LIKE A CHAMPION", "BUILD CONFIDENCE"

3. SUBHEADLINE (supporting, benefit-driven)
   - Age range, dates, or key benefit
   - Smaller than headline but still prominent

4. VISUAL CENTER (dynamic, engaging imagery)
   - ${program?.visualStyle ?? "Martial artist in powerful action pose"}
   - Characters centered, full of energy
   - Professional illustration or cinematic photography style

5. BENEFITS (clean icon layout, 3–4 items)
   - Short, punchy: "✓ Discipline  ✓ Confidence  ✓ Coordination"
   - Icon + text format, horizontally arranged

6. CTA SECTION (bottom third — IMPOSSIBLE TO MISS)
   - Large red button or bold text block
   - Urgency language: "Register Now", "Limited Spots", "Enroll Today"
   - Phone number large and readable

7. CONTACT INFO (bottom strip)
   - Phone, website, address — clean, readable`;

  // ── Premium Design Directives ────────────────────────────────────────────────
  const premiumDesignDirectives = `
PREMIUM DESIGN STANDARDS:
- This must look like a $500+ professional agency design
- Cinematic quality — not a stock template, not clip-art
- High contrast: text pops, hierarchy is instantly clear
- Bold typography: condensed, impactful, modern
- Color discipline: ${userValues.colors.length > 0 ? userValues.colors.join("/") : "red/black/white"} — use intentionally
- Every element earns its place — no clutter, no filler
- Print-ready quality: sharp edges, no blur, no artifacts
- Format: ${formatLabel}

WHAT TO AVOID -- HARD BANS (any of these = failed output):
- Cartoons, anime, illustrations, 3D renders, or any non-photorealistic style
- Generic stock photo backgrounds
- Clip-art or low-quality illustrations
- Overcrowded layouts
- Weak typography (thin fonts, poor contrast)
- Placeholder text, lorem ipsum, or ANY template artifact
- Fake or invented logos
- Changing user-specified values (ages, names, phone numbers)
- Stock template labels: "Once Provide Prints", "Sample Text", "Your Text Here", "Insert Text"
- Generic filler: "Key Details", "More Information", "Contact Us for Details"
- Weak headlines that are just program names with no benefit or emotion
- Any text that looks like it came from a Canva or stock template`;

  // ── Assemble Full Prompt ─────────────────────────────────────────────────────
  return `Create a HIGH-CONVERTING MARTIAL ARTS AD -- not a generic flyer, not a template.
This is a DIRECT-RESPONSE ADVERTISEMENT designed to make parents take action immediately.


DESIGN REQUEST:
${withCTA}
${strictValueBlock}
${programBlock}
${brandBlock}

STYLE DIRECTION:
${styleDefinition}
${conversionMode}
${compositionRules}
${premiumDesignDirectives}

PHOTOREALISM MANDATE: ALL human figures, people, children, and athletes in this image MUST be photorealistic. Use cinematic photography style. Absolutely NO cartoons, NO illustrations, NO anime, NO 3D renders, NO clip-art. Real people, real photography, real lighting.
FINAL DIRECTIVE: This must be the kind of ad that stops a parent scrolling and makes them say "I need to call this school." Bold. Cinematic. Conversion-focused. Every value the user specified must appear EXACTLY as written. NO placeholder text. NO template artifacts. NO weak headlines.`;
}

/**
 * Alias for backward compatibility.
 */
export function enhancePrompt(options: PromptEngineOptions): string {
  return buildMarketingPrompt(options);
}

/**
 * Parse style preset from natural language.
 */
export function parseStyleFromText(text: string): StylePreset {
  const lower = text.toLowerCase();
  if (lower.includes("luxury") || lower.includes("elegant") || lower.includes("upscale")) return "luxury";
  if (lower.includes("premium") || lower.includes("professional") || lower.includes("clean")) return "premium";
  if (lower.includes("playful") || lower.includes("fun") || lower.includes("colorful") || lower.includes("kids") || lower.includes("children")) return "kids_playful";
  if (lower.includes("ad") || lower.includes("convert") || lower.includes("offer") || lower.includes("enroll")) return "high_converting_ad";
  if (lower.includes("energetic") || lower.includes("bold") || lower.includes("powerful") || lower.includes("cinematic")) return "energetic";
  return "auto";
}
