/**
 * shared/onboarding.ts
 *
 * Pure client/server-shared onboarding definitions + NLU layer.
 * NO server-only imports (no drizzle, no db, no trpc).
 * Safe to import in both client and server code.
 */

// ─── Step definitions ────────────────────────────────────────────────────────

export const ONBOARDING_STEPS = [
  "name",
  "title",
  "profile_photo",
  "programs",
  "rank",
  "school_name",
  "martial_style",
  "address",
  "city_state_zip",
  "phone",
  "email",
  "website",
  "logo_light",
  "logo_dark",
  "complete",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export interface OnboardingProfile {
  name: string | null;
  title: string | null;
  profilePhotoUrl?: string | null;
  programs: string[];
  styles: string[];
  schoolName: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostal: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
}

export interface OnboardingState {
  step: OnboardingStep;
  profile: OnboardingProfile;
  completedSteps: OnboardingStep[];
  hasMartialArts: boolean;
}

// ─── NLU: Intent types ────────────────────────────────────────────────────────

export type OnboardingIntent =
  | "correction"
  | "identity_update"
  | "title_update"
  | "name_update"
  | "confirmation"
  | "skip"
  | "back"
  | "objection"
  | "question"
  | "unknown";

export interface NLUResult {
  intent: OnboardingIntent;
  entities: {
    preferredName?: string;
    fullName?: string;
    title?: string;
    schoolName?: string;
    programs?: string[];
  };
  raw: string;
}

// ─── NLU: Pattern banks ───────────────────────────────────────────────────────

// Titles we recognise
const KNOWN_TITLES = [
  "master", "sensei", "sifu", "coach", "professor", "prof",
  "instructor", "grandmaster", "grand master", "shihan", "renshi",
  "kyoshi", "hanshi", "sabomnim", "guro", "kru", "ajarn",
  "dr", "dr.", "mr", "mr.", "ms", "ms.", "mrs", "mrs.",
];

// Patterns that signal a name/title preference
const CALL_ME_PATTERNS = [
  /\b(?:call|address|refer to)\s+me\s+(?:as\s+)?(.+)/i,
  /\b(?:my\s+name\s+is|i(?:'m| am)|i\s+go\s+by|known\s+as|please\s+use)\s+(.+)/i,
  /\buse\s+(.+?)\s+(?:instead|please|from\s+now|going\s+forward)?/i,
  /\bjust\s+(?:call\s+me\s+)?(.+?)\s+(?:is\s+fine|please|works|ok|okay)?$/i,
  /\bactually[,\s]+(?:it'?s?|i(?:'m| am)|my\s+name\s+is)?\s*(.+)/i,
];

// Patterns that signal a correction
const CORRECTION_PATTERNS = [
  /\b(?:that'?s?\s*(?:not|wrong|incorrect)|not\s+my\s+(?:name|title|rank|school))/i,
  /\b(?:i\s+meant|i\s+mean|correction|correct\s+that|change\s+that|update\s+that)/i,
  /\b(?:go\s+back|redo|undo|start\s+over|reset)/i,
  /\b(?:wrong\s+(?:name|title|rank|school|answer))/i,
  /\b(?:that(?:'s|\s+is)\s+(?:not\s+)?(?:right|correct|accurate))/i,
];

// Patterns that signal skip
const SKIP_PATTERNS = [
  /^(?:skip|pass|later|not\s+now|no\s+thanks|n\/a|none|skip\s+(?:this|for\s+now)|next)[!.,\s]*$/i,
  /\b(?:don'?t\s+(?:want|need)|leave\s+(?:it|this)\s+blank|skip\s+this\s+(?:step|one|for\s+now))/i,
];

// Patterns that signal going back
const BACK_PATTERNS = [
  /^(?:back|go\s+back|previous|prev|undo|last\s+step)[!.,\s]*$/i,
  /\b(?:take\s+me\s+back|return\s+to\s+previous|go\s+to\s+previous)/i,
];

// Patterns that signal confirmation
const CONFIRMATION_PATTERNS = [
  /^(?:yes|yeah|yep|yup|correct|right|sure|ok|okay|sounds\s+good|confirmed|confirm|that'?s?\s+right|perfect|exactly|absolutely)[!.,\s]*$/i,
];

// Patterns that signal an objection/question
const OBJECTION_PATTERNS = [
  /\b(?:why\s+(?:do\s+you\s+need|are\s+you\s+asking)|what\s+(?:is\s+this\s+for|do\s+you\s+need\s+this\s+for)|i\s+don'?t\s+(?:want\s+to|have\s+to))/i,
];

const QUESTION_PATTERNS = [
  /\?$/,
  /^(?:what|why|how|when|where|who|can\s+you|could\s+you|will\s+you|do\s+you)\b/i,
];

// ─── NLU: Entity extraction ───────────────────────────────────────────────────

/**
 * Try to extract a title + name from a raw string.
 * Returns { title, name } where either may be undefined.
 */
function extractTitleAndName(raw: string): { title?: string; name?: string } {
  const cleaned = raw.trim().replace(/[.,!?]+$/, "").trim();
  const words = cleaned.split(/\s+/);

  // Check if first word is a known title
  const firstWordLower = words[0]?.toLowerCase().replace(/\.$/, "");
  const isTitle = KNOWN_TITLES.includes(firstWordLower);

  if (isTitle && words.length >= 2) {
    return {
      title: words[0].replace(/\.$/, ""),
      name: words.slice(1).join(" "),
    };
  }

  if (isTitle && words.length === 1) {
    return { title: words[0].replace(/\.$/, "") };
  }

  // No title detected — treat whole thing as name
  return { name: cleaned };
}

/**
 * Try to extract a school name from a raw string.
 * Strips common prefixes like "it's called", "we are", "the school is".
 */
function extractSchoolName(raw: string): string | undefined {
  const cleaned = raw.trim()
    .replace(/^(?:it'?s?\s+(?:called|named)|(?:the\s+)?school\s+(?:is|name\s+is)|we\s+(?:are|go\s+by)|our\s+(?:school|dojo)\s+(?:is|name\s+is))\s*/i, "")
    .replace(/[.,!?]+$/, "")
    .trim();
  return cleaned.length >= 2 ? cleaned : undefined;
}

/**
 * Try to extract program names from a raw string.
 */
function extractPrograms(raw: string): string[] {
  return raw
    .split(/[,;&\/\n]+/)
    .map((s) => s.trim().replace(/^(?:and|also|plus)\s+/i, "").trim())
    .filter((s) => s.length >= 2);
}

// ─── NLU: Main intent + entity detector ──────────────────────────────────────

/**
 * Analyse a user's free-text input and return intent + extracted entities.
 * This is pure logic — no DB access, no side effects.
 */
export function detectIntent(text: string, currentStep: OnboardingStep): NLUResult {
  const t = text.trim();

  // ── Back ──────────────────────────────────────────────────────────────────
  if (BACK_PATTERNS.some((p) => p.test(t))) {
    return { intent: "back", entities: {}, raw: t };
  }

  // ── Skip ──────────────────────────────────────────────────────────────────
  if (SKIP_PATTERNS.some((p) => p.test(t))) {
    return { intent: "skip", entities: {}, raw: t };
  }

  // ── Confirmation ──────────────────────────────────────────────────────────
  if (CONFIRMATION_PATTERNS.some((p) => p.test(t))) {
    return { intent: "confirmation", entities: {}, raw: t };
  }

  // ── Objection ─────────────────────────────────────────────────────────────
  if (OBJECTION_PATTERNS.some((p) => p.test(t))) {
    return { intent: "objection", entities: {}, raw: t };
  }

  // ── Explicit correction phrases ───────────────────────────────────────────
  const isExplicitCorrection = CORRECTION_PATTERNS.some((p) => p.test(t));

  // ── "Call me / My name is / Use …" — identity preference ─────────────────
  for (const pattern of CALL_ME_PATTERNS) {
    const match = t.match(pattern);
    if (match) {
      const extracted = match[1]?.trim().replace(/[.,!?]+$/, "").trim();
      if (!extracted || extracted.length < 2) continue;

      const { title, name } = extractTitleAndName(extracted);

      // Determine whether this is a title-only, name-only, or combined update
      if (title && name) {
        return {
          intent: "identity_update",
          entities: { title, fullName: name, preferredName: `${title} ${name}` },
          raw: t,
        };
      }
      if (title && !name) {
        return {
          intent: "title_update",
          entities: { title },
          raw: t,
        };
      }
      return {
        intent: "name_update",
        entities: { fullName: name, preferredName: name },
        raw: t,
      };
    }
  }

  // ── Correction with no specific "call me" phrasing ───────────────────────
  if (isExplicitCorrection) {
    return { intent: "correction", entities: {}, raw: t };
  }

  // ── Question ──────────────────────────────────────────────────────────────
  if (QUESTION_PATTERNS.some((p) => p.test(t))) {
    return { intent: "question", entities: {}, raw: t };
  }

  // ── Step-aware entity extraction (for normal step answers) ────────────────
  // Even for "unknown" intent we try to extract useful entities
  const entities: NLUResult["entities"] = {};

  if (currentStep === "name" || currentStep === "title") {
    const { title, name } = extractTitleAndName(t);
    if (title) entities.title = title;
    if (name) entities.fullName = name;
  }

  if (currentStep === "school_name") {
    const schoolName = extractSchoolName(t);
    if (schoolName) entities.schoolName = schoolName;
  }

  if (currentStep === "programs") {
    const programs = extractPrograms(t);
    if (programs.length > 0) entities.programs = programs;
  }

  return { intent: "unknown", entities, raw: t };
}

/**
 * Build a contextual acknowledgement message when Kai handles a mid-flow identity correction.
 * Returns the acknowledgement text + the step question to re-ask.
 */
export function buildCorrectionAck(
  nlu: NLUResult,
  currentStep: OnboardingStep,
  profile: OnboardingProfile
): string {
  const { entities } = nlu;
  const intent = nlu.intent;

  // Build the new display name
  const newTitle = entities.title || profile.title;
  const newName = entities.fullName || profile.name;
  const displayName = newTitle && newName
    ? `${newTitle} ${newName}`
    : newName || newTitle || "you";

  let ack = "";

  if (intent === "identity_update") {
    ack = `Got it — I'll call you **${displayName}** from here on.`;
  } else if (intent === "title_update") {
    ack = `Noted — I'll use **${newTitle}** going forward.`;
  } else if (intent === "name_update") {
    ack = `Got it — I'll refer to you as **${newName}** from now on.`;
  } else if (intent === "correction") {
    ack = `No problem — let me know what you'd like to change.`;
  }

  // Re-ask the current step if it's still relevant
  if (currentStep !== "name" && currentStep !== "title" && currentStep !== "complete") {
    const stepQuestion = getStepQuestion(currentStep, {
      ...profile,
      title: newTitle ?? profile.title,
      name: newName ?? profile.name,
    });
    return `${ack}\n\n${stepQuestion}`;
  }

  return ack;
}

/**
 * Build a contextual response for objections/questions during onboarding.
 */
export function buildObjectionResponse(
  currentStep: OnboardingStep,
  profile: OnboardingProfile
): string {
  const displayName = profile.title && profile.name
    ? `${profile.title} ${profile.name}`
    : profile.name || "there";

  const stepContext: Partial<Record<OnboardingStep, string>> = {
    profile_photo: `It's just so your team and students can recognise you across the dashboard. Totally optional — you can always add it later in Settings.`,
    programs: `It helps me tailor your system — class types, scheduling, and student tracking all adapt to what you teach.`,
    rank: `It helps me display your profile correctly to staff and students. You can skip it if you prefer.`,
    school_name: `It's how your dojo appears throughout the system — on student records, reports, and the kiosk.`,
    address: `It's used for your school profile and can show up on your public-facing pages. You can skip it for now.`,
    phone: `It appears on your school profile and can be used for student communications. You can always add it later.`,
    email: `It's the primary contact for leads and student inquiries coming through DojoFlow.`,
    website: `It's optional — it just shows up on your public school profile if you have one.`,
    logo_light: `It shows up in the dashboard header and on student-facing screens. You can skip this and upload it later in Settings.`,
    logo_dark: `It appears when your team uses dark theme. Totally optional — skip if you don't have one ready.`,
  };

  const context = stepContext[currentStep] || `It helps me set up your profile accurately. You can skip it if you'd prefer.`;

  return `Good question, ${displayName}. ${context}\n\nWant to continue, or would you rather skip this step?`;
}

// ─── Step question messages — calm, confident, human-assistant tone ───────────

export function getStepQuestion(step: OnboardingStep, profile: OnboardingProfile): string {
  const titleName = profile.title && profile.name
    ? `${profile.title} ${profile.name}`
    : profile.name || null;

  switch (step) {
    case "name":
      return `Hi, I'm **KAI** — I'll be running your dojo's operations and keeping everything in order.\n\nBefore we get started, I'd like to get to know you a little.\n\n**What's your name?**`;

    case "title":
      return `Got it, **${profile.name}**. Good to meet you.\n\nHow should I address you? *(Sensei, Sifu, Coach, Master, Instructor — whatever you go by)*`;

    case "profile_photo": {
      const displayName = titleName || profile.name || "there";
      return `Nice to meet you, **${displayName}**.\n\nNext, let's add your photo — it'll show up across your dashboard and in conversations with your team.\n\n*(Totally optional — you can skip this and add one later in Settings)*`;
    }

    case "programs":
      return `Now let's set up your **program roster**.\n\nWhat do you teach? You can list everything — I'll use this to tailor your system to your school.\n\n*(e.g., Brazilian Jiu-Jitsu, Muay Thai, Karate, Gymnastics, Yoga)*`;

    case "rank":
      return `One more thing — what's your **current rank or belt**?\n\n*(e.g., Black Belt 3rd Degree, Brown Belt, Head Instructor)*`;

    case "school_name": {
      const programList = profile.programs.length > 0
        ? profile.programs.join(", ")
        : null;
      return programList
        ? `Great — **${programList}** added to your roster.\n\nWhat's the **official name of your school or dojo**?`
        : `Programs noted.\n\nWhat's the **official name of your school or dojo**?`;
    }

    case "martial_style":
      return `What **martial arts style(s)** do you primarily teach at **${profile.schoolName || "your school"}**?\n\n*(e.g., Brazilian Jiu-Jitsu, Shotokan Karate, Muay Thai)*`;

    case "address":
      return `Let's get your location set up. What's your **school's street address**?`;

    case "city_state_zip":
      return `And the **city, state, and ZIP code**?\n\n*(e.g., Austin, TX 78701)*`;

    case "phone":
      return `What's the **best phone number** for **${profile.schoolName || "your school"}**?`;

    case "email":
      return `What **email address** should students and leads use to reach you?\n\n*(e.g., info@${profile.schoolName ? profile.schoolName.toLowerCase().replace(/\s+/g, '') + '.com' : 'yourdojo.com'})*`;

    case "website":
      return `Does **${profile.schoolName || "your school"}** have a website? Drop the URL here — or skip if you don't have one yet.\n\n*(e.g., https://yourdojo.com)*`;

    case "logo_light":
      return `Almost done — let's get your branding in place. Upload your **Day Mode logo** for light backgrounds.\n\n*PNG or SVG works best. This will appear in your dashboard header.*`;

    case "logo_dark":
      return `One more — upload your **Dark Mode logo**, usually a white or light version of your logo.\n\n*This is what your team will see when using dark theme. You can skip this if you don't have one yet.*`;

    default:
      return "Let's keep going — what's next?";
  }
}

// ─── Structured Address Parser ────────────────────────────────────────────────

export interface ParsedAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  /** True when all four components were successfully extracted */
  isComplete: boolean;
}

/**
 * US state abbreviations for detection.
 */
const US_STATES: Record<string, string> = {
  AL: "AL", AK: "AK", AZ: "AZ", AR: "AR", CA: "CA", CO: "CO", CT: "CT",
  DE: "DE", FL: "FL", GA: "GA", HI: "HI", ID: "ID", IL: "IL", IN: "IN",
  IA: "IA", KS: "KS", KY: "KY", LA: "LA", ME: "ME", MD: "MD", MA: "MA",
  MI: "MI", MN: "MN", MS: "MS", MO: "MO", MT: "MT", NE: "NE", NV: "NV",
  NH: "NH", NJ: "NJ", NM: "NM", NY: "NY", NC: "NC", ND: "ND", OH: "OH",
  OK: "OK", OR: "OR", PA: "PA", RI: "RI", SC: "SC", SD: "SD", TN: "TN",
  TX: "TX", UT: "UT", VT: "VT", VA: "VA", WA: "WA", WV: "WV", WI: "WI",
  WY: "WY", DC: "DC",
  // Full names → abbreviations
  ALABAMA: "AL", ALASKA: "AK", ARIZONA: "AZ", ARKANSAS: "AR",
  CALIFORNIA: "CA", COLORADO: "CO", CONNECTICUT: "CT", DELAWARE: "DE",
  FLORIDA: "FL", GEORGIA: "GA", HAWAII: "HI", IDAHO: "ID", ILLINOIS: "IL",
  INDIANA: "IN", IOWA: "IA", KANSAS: "KS", KENTUCKY: "KY", LOUISIANA: "LA",
  MAINE: "ME", MARYLAND: "MD", MASSACHUSETTS: "MA", MICHIGAN: "MI",
  MINNESOTA: "MN", MISSISSIPPI: "MS", MISSOURI: "MO", MONTANA: "MT",
  NEBRASKA: "NE", NEVADA: "NV", "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM", "NEW YORK": "NY", "NORTH CAROLINA": "NC",
  "NORTH DAKOTA": "ND", OHIO: "OH", OKLAHOMA: "OK", OREGON: "OR",
  PENNSYLVANIA: "PA", "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD", TENNESSEE: "TN", TEXAS: "TX", UTAH: "UT",
  VERMONT: "VT", VIRGINIA: "VA", WASHINGTON: "WA", "WEST VIRGINIA": "WV",
  WISCONSIN: "WI", WYOMING: "WY",
};

/**
 * Attempt to parse a full or partial address from free text.
 *
 * Handles formats like:
 *   "11721 Spring Cypress Rd, Tomball, TX 77377"
 *   "123 Main St, Austin TX 78701"
 *   "456 Oak Ave Suite 2, Dallas, Texas, 75201"
 *   "789 Elm Street" (partial — street only)
 */
export function parseAddress(input: string): ParsedAddress {
  const text = input.trim();

  // ── Strategy 1: comma-delimited full address ──────────────────────────────
  // Matches: "street, city, state zip" or "street, city, state, zip"
  const commaParts = text.split(",").map((p) => p.trim()).filter(Boolean);

  if (commaParts.length >= 3) {
    const street = commaParts[0];
    const city = commaParts[1];
    // Last part(s) contain state + zip
    const stateZipRaw = commaParts.slice(2).join(" ").trim();
    const { state, zip } = extractStateZip(stateZipRaw);

    if (street && city && state) {
      return { street, city, state, zip, isComplete: !!(street && city && state && zip) };
    }
  }

  // ── Strategy 2: no commas — try to detect state+zip at end ───────────────
  // e.g., "123 Main St Austin TX 78701"
  const stateZipMatch = text.match(
    /^(.+?)\s+([A-Za-z\s]+)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i
  );
  if (stateZipMatch) {
    const street = stateZipMatch[1].trim();
    const city = stateZipMatch[2].trim();
    const state = stateZipMatch[3].toUpperCase();
    const zip = stateZipMatch[4];
    if (US_STATES[state]) {
      return { street, city, state: US_STATES[state], zip, isComplete: true };
    }
  }

  // ── Strategy 3: partial — just a street address (starts with a number) ───
  const looksLikeStreet = /^\d+\s+\w/.test(text) && !text.match(/,/);
  if (looksLikeStreet) {
    return { street: text, city: null, state: null, zip: null, isComplete: false };
  }

  // ── Strategy 4: city, state zip (no street) ───────────────────────────────
  const cityStateZip = text.match(/^([A-Za-z\s]+),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
  if (cityStateZip) {
    const city = cityStateZip[1].trim();
    const state = cityStateZip[2].toUpperCase();
    const zip = cityStateZip[3];
    if (US_STATES[state]) {
      return { street: null, city, state: US_STATES[state], zip, isComplete: false };
    }
  }

  // ── Fallback: treat entire input as street ────────────────────────────────
  return { street: text, city: null, state: null, zip: null, isComplete: false };
}

function extractStateZip(raw: string): { state: string | null; zip: string | null } {
  // Match "TX 77377" or "Texas 77377" or "TX" or "77377"
  const match = raw.match(/^([A-Za-z\s]+?)\s*(\d{5}(?:-\d{4})?)?$/);
  if (!match) return { state: null, zip: null };

  const statePart = match[1]?.trim().toUpperCase() || null;
  const zip = match[2] || null;
  const state = statePart ? (US_STATES[statePart] || null) : null;

  return { state, zip };
}
