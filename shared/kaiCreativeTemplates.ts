// ─── Kai Creative — Marketing Templates ──────────────────────────────────────
// 10 martial arts marketing templates with smart prompt prefills

export type OutputSize =
  | "instagram_post"
  | "instagram_story"
  | "facebook_ad"
  | "facebook_post"
  | "website_banner"
  | "flyer"
  | "poster"
  | "sms_graphic"
  | "email_header";

export interface CreativeTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: "promo" | "event" | "program" | "seasonal" | "referral";
  defaultSize: OutputSize;
  promptTemplate: string; // {schoolName}, {primaryColor}, {tagline}, {phone}, {website} are replaced
  suggestedCta: string;
  tags: string[];
}

export const OUTPUT_SIZES: Record<OutputSize, { label: string; width: number; height: number; description: string }> = {
  instagram_post:   { label: "Instagram Post",   width: 1080, height: 1080, description: "Square (1:1)" },
  instagram_story:  { label: "Instagram Story",  width: 1080, height: 1920, description: "Vertical (9:16)" },
  facebook_ad:      { label: "Facebook Ad",      width: 1200, height: 628,  description: "Landscape (1.91:1)" },
  facebook_post:    { label: "Facebook Post",    width: 1200, height: 630,  description: "Landscape" },
  website_banner:   { label: "Website Banner",   width: 1920, height: 600,  description: "Wide banner" },
  flyer:            { label: "Flyer",            width: 816,  height: 1056, description: "Letter (8.5×11\")" },
  poster:           { label: "Poster",           width: 1080, height: 1440, description: "Portrait (3:4)" },
  sms_graphic:      { label: "SMS/MMS Graphic",  width: 600,  height: 600,  description: "Square (1:1)" },
  email_header:     { label: "Email Header",     width: 600,  height: 200,  description: "Wide strip" },
};

export const CREATIVE_TEMPLATES: CreativeTemplate[] = [
  {
    id: "summer_camp",
    name: "Summer Camp Flyer",
    description: "High-energy summer camp promotional graphic",
    emoji: "☀️",
    category: "seasonal",
    defaultSize: "flyer",
    promptTemplate:
      "Create a vibrant, high-energy summer camp flyer for {schoolName}. " +
      "Use bold colors including {primaryColor}. " +
      "Headline: 'Summer Camp {year}'. " +
      "Include: ages 5–14, fun martial arts training, confidence building, character development. " +
      "CTA: 'Spots Filling Fast — Call {phone}'. " +
      "Modern, premium design. No clutter. Strong visual hierarchy.",
    suggestedCta: "Spots Filling Fast — Call Now",
    tags: ["summer", "camp", "kids", "seasonal"],
  },
  {
    id: "little_ninjas",
    name: "Little Ninjas Promo",
    description: "Cute, energetic promo for the youngest students",
    emoji: "🥷",
    category: "program",
    defaultSize: "instagram_post",
    promptTemplate:
      "Design a fun, colorful Little Ninjas program promotional graphic for {schoolName}. " +
      "Target audience: parents of children ages 3–6. " +
      "Use playful, bold fonts. Primary color: {primaryColor}. " +
      "Headline: 'Little Ninjas — Ages 3–6'. " +
      "Key benefits: focus, discipline, confidence, coordination. " +
      "CTA: 'Free Trial Class — {phone}'. " +
      "Bright, joyful, premium design.",
    suggestedCta: "Free Trial Class — Call Now",
    tags: ["little ninjas", "kids", "preschool", "program"],
  },
  {
    id: "dragon_kids",
    name: "Dragon Kids Promo",
    description: "Action-packed promo for the Dragon Kids program",
    emoji: "🐉",
    category: "program",
    defaultSize: "instagram_post",
    promptTemplate:
      "Create a bold, action-packed Dragon Kids program graphic for {schoolName}. " +
      "Target: parents of children ages 7–12. " +
      "Primary color: {primaryColor}. " +
      "Headline: 'Dragon Kids — Ages 7–12'. " +
      "Emphasize: strength, discipline, teamwork, belt progression. " +
      "CTA: 'Start Your Journey — {phone}'. " +
      "Powerful, modern martial arts aesthetic.",
    suggestedCta: "Start Your Journey — Call Now",
    tags: ["dragon kids", "kids", "program", "martial arts"],
  },
  {
    id: "teen_martial_arts",
    name: "Teen Martial Arts Ad",
    description: "Cool, aspirational ad targeting teens",
    emoji: "🔥",
    category: "program",
    defaultSize: "facebook_ad",
    promptTemplate:
      "Design a cool, aspirational Teen Martial Arts ad for {schoolName}. " +
      "Target: teens ages 13–17 and their parents. " +
      "Primary color: {primaryColor}. " +
      "Headline: 'Level Up Your Life'. " +
      "Key messages: confidence, self-defense, discipline, elite training. " +
      "CTA: 'Join the Team — {phone}'. " +
      "Dark, premium, high-contrast design. Feels like a sports brand.",
    suggestedCta: "Join the Team — Call Now",
    tags: ["teens", "program", "martial arts", "youth"],
  },
  {
    id: "adult_kickboxing",
    name: "Adult Kickboxing Ad",
    description: "High-energy kickboxing ad for adult enrollment",
    emoji: "🥊",
    category: "program",
    defaultSize: "facebook_ad",
    promptTemplate:
      "Create a high-energy Adult Kickboxing ad for {schoolName}. " +
      "Target: adults 18–45, fitness-focused. " +
      "Primary color: {primaryColor}. " +
      "Headline: 'Get Fit. Get Strong. Get Confident.' " +
      "Key messages: full-body workout, stress relief, real self-defense, community. " +
      "CTA: 'First Class Free — {phone}'. " +
      "Bold, athletic, premium design. Feels like a premium fitness brand.",
    suggestedCta: "First Class Free — Call Now",
    tags: ["kickboxing", "adults", "fitness", "program"],
  },
  {
    id: "after_school",
    name: "After School Program Flyer",
    description: "Structured after-school program for working parents",
    emoji: "🎒",
    category: "program",
    defaultSize: "flyer",
    promptTemplate:
      "Design a professional After School Program flyer for {schoolName}. " +
      "Target: parents of school-age children. " +
      "Primary color: {primaryColor}. " +
      "Headline: 'After School Program — Safe. Fun. Focused.' " +
      "Key messages: homework help, martial arts training, character development, safe environment, pickup available. " +
      "Include: ages 5–12, Mon–Fri. " +
      "CTA: 'Limited Spots — Call {phone}'. " +
      "Clean, trustworthy, professional design.",
    suggestedCta: "Limited Spots — Call Now",
    tags: ["after school", "kids", "program", "parents"],
  },
  {
    id: "tournament",
    name: "Tournament Announcement",
    description: "Exciting tournament or competition announcement",
    emoji: "🏆",
    category: "event",
    defaultSize: "poster",
    promptTemplate:
      "Create an exciting tournament announcement poster for {schoolName}. " +
      "Primary color: {primaryColor}. " +
      "Headline: 'Annual Tournament — {year}'. " +
      "Include: competition categories, registration deadline, location. " +
      "CTA: 'Register Now — {phone}'. " +
      "Bold, dramatic, championship-level design. Gold accents. High energy.",
    suggestedCta: "Register Now — Call for Details",
    tags: ["tournament", "competition", "event", "championship"],
  },
  {
    id: "belt_test",
    name: "Belt Test Promotion",
    description: "Motivational belt test announcement for students",
    emoji: "🥋",
    category: "event",
    defaultSize: "instagram_post",
    promptTemplate:
      "Design a motivational Belt Test promotion graphic for {schoolName}. " +
      "Primary color: {primaryColor}. " +
      "Headline: 'Belt Test — Are You Ready?' " +
      "Key messages: honor the journey, prove your skills, earn your next rank. " +
      "Include: colorful belt progression visual. " +
      "CTA: 'Talk to your instructor today'. " +
      "Inspiring, prestigious, martial arts heritage feel.",
    suggestedCta: "Talk to Your Instructor Today",
    tags: ["belt test", "promotion", "students", "rank"],
  },
  {
    id: "grand_opening",
    name: "Grand Opening Ad",
    description: "Big, bold grand opening announcement",
    emoji: "🎉",
    category: "event",
    defaultSize: "facebook_ad",
    promptTemplate:
      "Create a bold Grand Opening announcement ad for {schoolName}. " +
      "Primary color: {primaryColor}. " +
      "Headline: 'Now Open — {schoolName}'. " +
      "Tagline: '{tagline}'. " +
      "Key messages: new state-of-the-art facility, world-class instruction, all ages welcome. " +
      "CTA: 'Free Week — Call {phone} or Visit {website}'. " +
      "Celebratory, premium, community-focused design. Confetti or ribbon elements.",
    suggestedCta: "Free Week — Call or Visit Us",
    tags: ["grand opening", "launch", "event", "new location"],
  },
  {
    id: "referral_campaign",
    name: "Referral Campaign Graphic",
    description: "Bring-a-friend referral incentive graphic",
    emoji: "🤝",
    category: "referral",
    defaultSize: "instagram_post",
    promptTemplate:
      "Design a friendly Referral Campaign graphic for {schoolName}. " +
      "Primary color: {primaryColor}. " +
      "Headline: 'Bring a Friend — Train Together'. " +
      "Key messages: refer a friend, both get a reward, build the community. " +
      "CTA: 'Ask us about our referral program — {phone}'. " +
      "Warm, community-focused, modern design. Feels like a reward program.",
    suggestedCta: "Ask About Our Referral Program",
    tags: ["referral", "community", "bring a friend", "reward"],
  },
];

/**
 * Build a brand-aware prompt from a template, injecting school profile data.
 * Falls back gracefully if brand data is missing.
 */
export function buildBrandAwarePrompt(
  template: CreativeTemplate,
  brand: {
    schoolName?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    tagline?: string | null;
    phone?: string | null;
    website?: string | null;
    programNames?: string[];
  },
  userOverride?: string
): string {
  const year = new Date().getFullYear().toString();
  const schoolName = brand.schoolName || "our martial arts school";
  const primaryColor = brand.primaryColor || "#E53935";
  const tagline = brand.tagline || "Train Hard. Live Well.";
  const phone = brand.phone || "call us";
  const website = brand.website || "";

  let prompt = userOverride || template.promptTemplate;

  prompt = prompt
    .replace(/{schoolName}/g, schoolName)
    .replace(/{primaryColor}/g, primaryColor)
    .replace(/{tagline}/g, tagline)
    .replace(/{phone}/g, phone)
    .replace(/{website}/g, website || "our website")
    .replace(/{year}/g, year);

  // Append brand context block
  const brandContext: string[] = [];
  if (brand.secondaryColor) brandContext.push(`Secondary color: ${brand.secondaryColor}.`);
  if (brand.programNames?.length) brandContext.push(`Programs offered: ${brand.programNames.join(", ")}.`);

  if (brandContext.length > 0) {
    prompt += " " + brandContext.join(" ");
  }

  // Always append quality rules
  prompt +=
    " Design rules: use brand colors, keep text readable, avoid overcrowding, " +
    "strong headline + clear CTA, premium modern marketing style, high-converting layout.";

  return prompt;
}

/**
 * Build a free-form brand-aware prompt from a natural language request.
 * Used when the user types their own prompt instead of picking a template.
 */
export function buildFreeformPrompt(
  userRequest: string,
  brand: {
    schoolName?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    tagline?: string | null;
    phone?: string | null;
    website?: string | null;
    programNames?: string[];
  }
): string {
  const schoolName = brand.schoolName || "our martial arts school";
  const primaryColor = brand.primaryColor || "#E53935";

  let prompt = userRequest;

  // Inject brand context if not already mentioned
  const lower = userRequest.toLowerCase();
  if (!lower.includes(schoolName.toLowerCase()) && schoolName !== "our martial arts school") {
    prompt = `For ${schoolName}: ` + prompt;
  }

  prompt += ` Use brand colors (primary: ${primaryColor}`;
  if (brand.secondaryColor) prompt += `, secondary: ${brand.secondaryColor}`;
  prompt += ").";

  if (brand.tagline) prompt += ` Tagline: "${brand.tagline}".`;
  if (brand.phone) prompt += ` Include phone: ${brand.phone}.`;
  if (brand.website) prompt += ` Website: ${brand.website}.`;
  if (brand.programNames?.length) {
    prompt += ` Programs: ${brand.programNames.join(", ")}.`;
  }

  prompt +=
    " Design rules: use brand colors, keep text readable, avoid overcrowding, " +
    "strong headline + clear CTA, premium modern marketing style, high-converting layout.";

  return prompt;
}

/**
 * Detect the intent of a user's creative request.
 */
export type CreativeIntent = "generate" | "edit" | "resize" | "brand_apply";

export function detectCreativeIntent(input: string): CreativeIntent {
  const lower = input.toLowerCase();

  if (
    lower.includes("put my logo") ||
    lower.includes("add my logo") ||
    lower.includes("remove background") ||
    lower.includes("change the") ||
    lower.includes("make this") ||
    lower.includes("edit this") ||
    lower.includes("modify") ||
    lower.includes("update this") ||
    lower.includes("fix this")
  ) {
    return "edit";
  }

  if (
    lower.includes("resize") ||
    lower.includes("for instagram") ||
    lower.includes("for facebook") ||
    lower.includes("story size") ||
    lower.includes("square version") ||
    lower.includes("make it fit")
  ) {
    return "resize";
  }

  if (
    lower.includes("use my colors") ||
    lower.includes("use dojo colors") ||
    lower.includes("apply brand") ||
    lower.includes("brand this")
  ) {
    return "brand_apply";
  }

  return "generate";
}

/**
 * Generate smart follow-up suggestions after image creation.
 */
export function getFollowUpSuggestions(
  templateId: string | null,
  outputSize: OutputSize,
  hasPhone: boolean,
  hasWebsite: boolean
): string[] {
  const suggestions: string[] = [];

  // Size-based suggestions
  const sizeAlts: Partial<Record<OutputSize, OutputSize[]>> = {
    instagram_post: ["instagram_story", "facebook_ad"],
    facebook_ad: ["instagram_post", "flyer"],
    flyer: ["instagram_post", "facebook_ad"],
    poster: ["instagram_story", "flyer"],
  };

  const altSizes = sizeAlts[outputSize];
  if (altSizes?.[0]) {
    suggestions.push(`Resize this for ${OUTPUT_SIZES[altSizes[0]].label}`);
  }

  // Content suggestions
  if (!hasPhone) suggestions.push("Add your phone number to this");
  if (!hasWebsite) suggestions.push("Add your website URL");
  suggestions.push("Make a second version with a different color scheme");
  suggestions.push("Generate matching ad copy for this graphic");

  return suggestions.slice(0, 4);
}
