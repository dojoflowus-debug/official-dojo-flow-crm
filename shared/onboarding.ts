/**
 * shared/onboarding.ts
 *
 * Pure client/server-shared onboarding definitions + NLU layer.
 * NO server-only imports (no drizzle, no db, no trpc).
 * Safe to import in both client and server code.
 */

// ─── Step definitions ────────────────────────────────────────────────────────

// Core required steps for onboarding (reduced from 23 to 9 steps)
export const ONBOARDING_STEPS = [
  "name",
  "title",
  "school_name",
  "programs",
  "email",
  "phone",
  "timezone",
  "currency",
  "complete",
] as const;

// Optional steps that can be done later
export const OPTIONAL_ONBOARDING_STEPS = [
  "profile_photo",
  "rank",
  "display_name",
  "tagline",
  "martial_style",
  "address",
  "city_state_zip",
  "country",
  "website",
  "logo_light",
  "logo_dark",
  "icon_logo_light",
  "icon_logo_dark",
  "brand_colors",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

// Combined array of all steps (core + optional) for use in tRPC enums
export const ALL_ONBOARDING_STEPS = [
  ...ONBOARDING_STEPS,
  ...OPTIONAL_ONBOARDING_STEPS,
] as const;
export type AnyOnboardingStep = (typeof ALL_ONBOARDING_STEPS)[number];

// ─── Section grouping ─────────────────────────────────────────────────────────

export type OnboardingSection =
  | "identity"
  | "school"
  | "location"
  | "contact"
  | "branding"
  | "preferences";

export const STEP_SECTIONS: Record<OnboardingStep, OnboardingSection | null> = {
  name: "identity",
  title: "identity",
  profile_photo: "identity",
  programs: "school",
  rank: "school",
  school_name: "school",
  display_name: "school",
  tagline: "school",
  martial_style: "school",
  address: "location",
  city_state_zip: "location",
  country: "location",
  phone: "contact",
  email: "contact",
  website: "contact",
  logo_light: "branding",
  logo_dark: "branding",
  icon_logo_light: "branding",
  icon_logo_dark: "branding",
  brand_colors: "branding",
  timezone: "preferences",
  currency: "preferences",
  complete: null,
};

export const SECTION_LABELS: Record<OnboardingSection, string> = {
  identity: "Identity Setup",
  school: "School Setup",
  location: "Location Setup",
  contact: "Contact Setup",
  branding: "Branding Setup",
  preferences: "Preferences",
};

export interface OnboardingProfile {
  name: string | null;
  title: string | null;
  profilePhotoUrl?: string | null;
  programs: string[];
  styles: string[];
  schoolName: string | null;
  displayName: string | null;
  tagline: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostal: string | null;
  addressCountry: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  logoIconLightUrl: string | null;
  logoIconDarkUrl: string | null;
  brandColorPrimary: string | null;
  brandColorSecondary: string | null;
  brandColorTertiary: string | null;
  timezone: string | null;
  currency: string | null;
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
    color?: string;
    timezone?: string;
    currency?: string;
    country?: string;
  };
  raw: string;
}

// ─── NLU: Pattern banks ───────────────────────────────────────────────────────

const KNOWN_TITLES = [
  "master", "sensei", "sifu", "coach", "professor", "prof",
  "instructor", "grandmaster", "grand master", "shihan", "renshi",
  "kyoshi", "hanshi", "sabomnim", "guro", "kru", "ajarn",
  "dr", "dr.", "mr", "mr.", "ms", "ms.", "mrs", "mrs.",
];

const CALL_ME_PATTERNS = [
  /\b(?:call|address|refer to)\s+me\s+(?:as\s+)?(.+)/i,
  /\b(?:my\s+name\s+is|i(?:'m| am)|i\s+go\s+by|known\s+as|please\s+use)\s+(.+)/i,
  /\buse\s+(.+?)\s+(?:instead|please|from\s+now|going\s+forward)?/i,
  /\bjust\s+(?:call\s+me\s+)?(.+?)\s+(?:is\s+fine|please|works|ok|okay)?$/i,
  /\bactually[,\s]+(?:it'?s?|i(?:'m| am)|my\s+name\s+is)?\s*(.+)/i,
];

const CORRECTION_PATTERNS = [
  /\b(?:that'?s?\s*(?:not|wrong|incorrect)|not\s+my\s+(?:name|title|rank|school))/i,
  /\b(?:i\s+meant|i\s+mean|correction|correct\s+that|change\s+that|update\s+that)/i,
  /\b(?:go\s+back|redo|undo|start\s+over|reset)/i,
  /\b(?:wrong\s+(?:name|title|rank|school|answer))/i,
  /\b(?:that(?:'s|\s+is)\s+(?:not\s+)?(?:right|correct|accurate))/i,
];

const SKIP_PATTERNS = [
  /^(?:skip|pass|later|not\s+now|no\s+thanks|n\/a|none|skip\s+(?:this|for\s+now)|next)[!.,\s]*$/i,
  /\b(?:don'?t\s+(?:want|need)|leave\s+(?:it|this)\s+blank|skip\s+this\s+(?:step|one|for\s+now))/i,
];

const BACK_PATTERNS = [
  /^(?:back|go\s+back|previous|prev|undo|last\s+step)[!.,\s]*$/i,
  /\b(?:take\s+me\s+back|return\s+to\s+previous|go\s+to\s+previous)/i,
];

const CONFIRMATION_PATTERNS = [
  /^(?:yes|yeah|yep|yup|correct|right|sure|ok|okay|sounds\s+good|confirmed|confirm|that'?s?\s+right|perfect|exactly|absolutely)[!.,\s]*$/i,
];

const OBJECTION_PATTERNS = [
  /\b(?:why\s+(?:do\s+you\s+need|are\s+you\s+asking)|what\s+(?:is\s+this\s+for|do\s+you\s+need\s+this\s+for)|i\s+don'?t\s+(?:want\s+to|have\s+to))/i,
];

const QUESTION_PATTERNS = [
  /\?$/,
  /^(?:what|why|how|when|where|who|can\s+you|could\s+you|will\s+you|do\s+you)\b/i,
];

// ─── NLU: Entity extraction ───────────────────────────────────────────────────

function extractTitleAndName(raw: string): { title?: string; name?: string } {
  const cleaned = raw.trim().replace(/[.,!?]+$/, "").trim();
  const words = cleaned.split(/\s+/);
  const firstWordLower = words[0]?.toLowerCase().replace(/\.$/, "");
  const isTitle = KNOWN_TITLES.includes(firstWordLower);

  if (isTitle && words.length >= 2) {
    return { title: words[0].replace(/\.$/, ""), name: words.slice(1).join(" ") };
  }
  if (isTitle && words.length === 1) {
    return { title: words[0].replace(/\.$/, "") };
  }
  return { name: cleaned };
}

function extractSchoolName(raw: string): string | undefined {
  const cleaned = raw.trim()
    .replace(/^(?:it'?s?\s+(?:called|named)|(?:the\s+)?school\s+(?:is|name\s+is)|we\s+(?:are|go\s+by)|our\s+(?:school|dojo)\s+(?:is|name\s+is))\s*/i, "")
    .replace(/[.,!?]+$/, "")
    .trim();
  return cleaned.length >= 2 ? cleaned : undefined;
}

function extractPrograms(raw: string): string[] {
  return raw
    .split(/[,;&\/\n]+/)
    .map((s) => s.trim().replace(/^(?:and|also|plus)\s+/i, "").trim())
    .filter((s) => s.length >= 2);
}

// ─── NLU: Main intent + entity detector ──────────────────────────────────────

export function detectIntent(text: string, currentStep: OnboardingStep): NLUResult {
  const t = text.trim();

  if (BACK_PATTERNS.some((p) => p.test(t))) {
    return { intent: "back", entities: {}, raw: t };
  }
  if (SKIP_PATTERNS.some((p) => p.test(t))) {
    return { intent: "skip", entities: {}, raw: t };
  }
  if (CONFIRMATION_PATTERNS.some((p) => p.test(t))) {
    return { intent: "confirmation", entities: {}, raw: t };
  }
  if (OBJECTION_PATTERNS.some((p) => p.test(t))) {
    return { intent: "objection", entities: {}, raw: t };
  }

  const isExplicitCorrection = CORRECTION_PATTERNS.some((p) => p.test(t));

  for (const pattern of CALL_ME_PATTERNS) {
    const match = t.match(pattern);
    if (match) {
      const extracted = match[1]?.trim().replace(/[.,!?]+$/, "").trim();
      if (!extracted || extracted.length < 2) continue;
      const { title, name } = extractTitleAndName(extracted);
      if (title && name) {
        return { intent: "identity_update", entities: { title, fullName: name, preferredName: `${title} ${name}` }, raw: t };
      }
      if (title && !name) {
        return { intent: "title_update", entities: { title }, raw: t };
      }
      return { intent: "name_update", entities: { fullName: name, preferredName: name }, raw: t };
    }
  }

  if (isExplicitCorrection) {
    return { intent: "correction", entities: {}, raw: t };
  }
  if (QUESTION_PATTERNS.some((p) => p.test(t))) {
    return { intent: "question", entities: {}, raw: t };
  }

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

// ─── Micro-behavior: subtle acknowledgement variants ─────────────────────────

const MICRO_ACKS = ["Got it.", "Perfect.", "Nice.", "Locked in.", "Done.", "Noted."];

/** Returns a subtle, varied acknowledgement — never the same one twice in a row. */
export function microAck(seed?: string): string {
  const idx = seed
    ? seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % MICRO_ACKS.length
    : Math.floor(Math.random() * MICRO_ACKS.length);
  return MICRO_ACKS[idx];
}

// ─── Correction acknowledgement ──────────────────────────────────────────────

export function buildCorrectionAck(
  nlu: NLUResult,
  currentStep: OnboardingStep,
  profile: OnboardingProfile
): string {
  const { entities } = nlu;
  const intent = nlu.intent;

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

// ─── Objection response ───────────────────────────────────────────────────────

export function buildObjectionResponse(
  currentStep: OnboardingStep,
  profile: OnboardingProfile
): string {
  const displayName = profile.title && profile.name
    ? `${profile.title} ${profile.name}`
    : profile.name || "there";

  const stepContext: Partial<Record<OnboardingStep, string>> = {
    profile_photo: `It just helps your team and students recognise you across the dashboard. Totally optional — add it later in Settings if you prefer.`,
    programs: `It's how I tailor your system — class types, scheduling, and student tracking all adapt to what you teach.`,
    rank: `It shows up on your profile for staff and students to see. You can skip it if you'd rather not share.`,
    school_name: `It's how your dojo appears throughout the system — on student records, reports, and the kiosk.`,
    display_name: `It's the short name shown in the app header and notifications. Skip it and I'll use your full school name.`,
    tagline: `It shows up on your public profile and kiosk welcome screen. Totally optional — skip if you don't have one.`,
    address: `It's used for your school profile and can appear on your public-facing pages. Skip it for now if you want.`,
    country: `It's used for your school profile and regional settings. Skip it if you're in the US.`,
    phone: `It shows up on your school profile and can be used for student communications. Easy to add later.`,
    email: `It's the primary contact for leads and student inquiries coming through DojoFlow.`,
    website: `Totally optional — it just shows up on your public school profile if you have one.`,
    logo_light: `It shows up in the dashboard header on light theme. Skip it if you don't have one ready.`,
    logo_dark: `It appears when your team uses dark theme. Skip it if you don't have one ready.`,
    icon_logo_light: `It's the square version of your logo — used for avatars, app icons, and compact spaces. Skip it if you don't have one.`,
    icon_logo_dark: `It's the dark version of your square icon logo. Skip it if you don't have one ready.`,
    brand_colors: `Your brand colors are used throughout the dashboard to match your school's identity. Skip it and I'll use the default DojoFlow palette.`,
    timezone: `It's used for scheduling, class times, and notifications. Skip it and I'll default to Eastern Time.`,
    currency: `It's used for billing, memberships, and payment tracking. Skip it and I'll default to USD.`,
  };

  const context = stepContext[currentStep] || `It helps me set up your profile accurately. You can skip it if you'd prefer.`;
  return `Fair question, ${displayName}. ${context}\n\nWant to continue, or skip this step?`;
}

// ─── Step questions — confident, smooth, human-assistant tone ─────────────────

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

export function getStepQuestion(step: OnboardingStep, profile: OnboardingProfile): string {
  const titleName = profile.title && profile.name
    ? `${profile.title} ${profile.name}`
    : profile.name || null;
  const school = profile.schoolName || null;
  const rawCity = profile.addressCity || null;
  const city = rawCity ? toTitleCase(rawCity) : null;
  const locationRef = city && school ? `${school} in ${city}` : school || "your school";

  switch (step) {
    case "name":
      return `Hi — I'm **Kai**, your dojo's command system.\n\nI'll be running your operations, tracking your students, and keeping everything in order.\n\n**What's your name?**`;

    case "title":
      return `Good to meet you, **${profile.name}**.\n\nHow should I address you? *(Sensei, Sifu, Coach, Master, Instructor — whatever you go by)*`;

    case "profile_photo": {
      const displayName = titleName || profile.name || "there";
      return `Nice to meet you, **${displayName}**.\n\nLet's add your photo — it'll show up across your dashboard and in conversations with your team.\n\n*Optional — you can always add one later in Settings.*`;
    }

    case "programs":
      return `Let's build your **program roster**.\n\nWhat do you teach? List everything — I'll use this to tailor your entire system.\n\n*(e.g., BJJ, Muay Thai, Karate, Gymnastics, Yoga)*`;

    case "rank":
      return `What's your **current rank or belt**?\n\n*(e.g., Black Belt 3rd Degree, Brown Belt, Head Instructor — or skip if you prefer)*`;

    case "school_name": {
      const programList = profile.programs.length > 0 ? profile.programs.join(", ") : null;
      return programList
        ? `${programList} — solid roster.\n\nWhat's the **official name of your school or dojo**?`
        : `What's the **official name of your school or dojo**?`;
    }

    case "display_name": {
      const schoolRef = school || "your school";
      return `What should I call **${schoolRef}** in short form?\n\nThis is the name shown in the app header and notifications — usually a shorter version.\n\n*(e.g., "Tiger Dojo" instead of "Tiger Martial Arts Academy" — or skip to use the full name)*`;
    }

    case "tagline": {
      const schoolRef = school || "your school";
      return `Does **${schoolRef}** have a tagline or motto?\n\nIt shows up on your public profile and kiosk welcome screen.\n\n*(e.g., "Train Hard. Fight Smart." — or skip if you don't have one)*`;
    }

    case "martial_style":
      return `What **martial arts style(s)** do you primarily teach at **${school || "your school"}**?\n\n*(e.g., Brazilian Jiu-Jitsu, Shotokan Karate, Muay Thai)*`;

    case "address":
      return `Let's get your location set up.\n\nWhat's **${locationRef}'s street address**? *(You can paste the full address and I'll handle the rest)*`;

    case "city_state_zip":
      return `And the **city, state, and ZIP**?\n\n*(e.g., Austin, TX 78701)*`;

    case "country": {
      const hasUS = profile.addressState?.trim();
      if (hasUS) {
        return `What **country** is **${locationRef}** in?\n\n*(Type the country name — or skip if you're in the United States)*`;
      }
      return `What **country** is **${locationRef}** in?\n\n*(e.g., United States, Canada, United Kingdom — or skip)*`;
    }

    case "phone": {
      const schoolRef = school || "your school";
      return `Got your ${city ? `${city} location` : "location"} locked in.\n\nWhat's the **best phone number** for **${schoolRef}**?`;
    }

    case "email": {
      const schoolRef = school || "your school";
      const domain = school ? school.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com" : "yourdojo.com";
      return `What's the **best email** for students and leads to reach **${schoolRef}**?\n\n*(e.g., info@${domain})*`;
    }

    case "website": {
      const schoolRef = school || "your school";
      return `Got a website for **${schoolRef}**? Drop the URL here and I'll connect everything.\n\n*(e.g., https://yourdojo.com — or skip if you don't have one yet)*`;
    }

    case "logo_light":
      return `Let's get your branding in place.\n\nUpload your **Day Mode logo** *(for light backgrounds)*.\n\n*PNG or SVG works best. This shows up in your dashboard header.*`;

    case "logo_dark":
      return `Upload your **Dark Mode logo** — usually a white or light version of your logo.\n\n*This is what your team sees in dark theme. Skip if you don't have one ready.*`;

    case "icon_logo_light":
      return `Now let's add your **square icon logo** *(for light backgrounds)*.\n\nThis is used for avatars, app icons, and compact spaces — typically just your symbol or emblem.\n\n*Skip if you only have a horizontal logo.*`;

    case "icon_logo_dark":
      return `And the **dark version of your icon logo** — the square emblem for dark backgrounds.\n\n*Skip if you don't have a separate dark version.*`;

    case "brand_colors": {
      const schoolRef = school || "your school";
      return `What are **${schoolRef}'s brand colors**?\n\nEnter your primary color as a hex code — I'll apply it throughout your dashboard.\n\n*(e.g., #FF0000 for red, #1A1A2E for dark navy — or skip to use the default DojoFlow palette)*`;
    }

    case "timezone": {
      const cityRef = city || "your school";
      return `What **timezone** is **${cityRef}** in?\n\n*(e.g., America/New_York, America/Chicago, America/Los_Angeles — or skip to default to Eastern Time)*`;
    }

    case "currency":
      return `What **currency** does your school use for billing and memberships?\n\n*(e.g., USD, CAD, GBP, AUD — or skip to default to USD)*`;

    default:
      return "What's next?";
  }
}

// ─── Context-aware save confirmations ────────────────────────────────────────

export function buildSaveConfirmation(
  step: OnboardingStep,
  value: string,
  profile: OnboardingProfile
): string | null {
  const school = profile.schoolName || "your school";

  switch (step) {
    case "name":
      return null;
    case "title":
      return null;
    case "school_name":
      return `**${value}** — locked in. 🏆`;
    case "display_name":
      return null;
    case "tagline":
      return null;
    case "phone":
      return `Perfect. I've got **${school}'s** number saved.`;
    case "email":
      return `Perfect. I've got your contact email saved.`;
    case "website":
      return `${school} is connected online.`;
    case "address":
      return null;
    case "city_state_zip":
      return null;
    case "country":
      return null;
    case "brand_colors":
      return null;
    case "timezone":
      return null;
    case "currency":
      return null;
    default:
      return null;
  }
}

// ─── Proactive completion message ────────────────────────────────────────────

export function buildCompletionMessage(profile: OnboardingProfile): string {
  const displayName = profile.title && profile.name
    ? `${profile.title} ${profile.name}`
    : profile.name || "there";
  const school = profile.schoolName || "your school";

  return `You're all set, **${displayName}**. ✅\n\n**${school}** is live in DojoFlow.\n\nWhat do you want to tackle first?\n\n- **Bring in leads** — activate your pipeline\n- **Set up your class schedule** — get your roster ready\n- **Build your student dashboard** — see everyone in one place\n\nJust say the word and I'll get it started.`;
}

// ─── Structured Address Parser ────────────────────────────────────────────────

export interface ParsedAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  isComplete: boolean;
}

const US_STATES: Record<string, string> = {
  AL: "AL", AK: "AK", AZ: "AZ", AR: "AR", CA: "CA", CO: "CO", CT: "CT",
  DE: "DE", FL: "FL", GA: "GA", HI: "HI", ID: "ID", IL: "IL", IN: "IN",
  IA: "IA", KS: "KS", KY: "KY", LA: "LA", ME: "ME", MD: "MD", MA: "MA",
  MI: "MI", MN: "MN", MS: "MS", MO: "MO", MT: "MT", NE: "NE", NV: "NV",
  NH: "NH", NJ: "NJ", NM: "NM", NY: "NY", NC: "NC", ND: "ND", OH: "OH",
  OK: "OK", OR: "OR", PA: "PA", RI: "RI", SC: "SC", SD: "SD", TN: "TN",
  TX: "TX", UT: "UT", VT: "VT", VA: "VA", WA: "WA", WV: "WV", WI: "WI",
  WY: "WY", DC: "DC",
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

export function parseAddress(input: string): ParsedAddress {
  const text = input.trim();

  const commaParts = text.split(",").map((p) => p.trim()).filter(Boolean);
  if (commaParts.length >= 3) {
    const street = commaParts[0];
    const city = commaParts[1];
    const stateZipRaw = commaParts.slice(2).join(" ").trim();
    const { state, zip } = extractStateZip(stateZipRaw);
    if (street && city && state) {
      return { street, city, state, zip, isComplete: !!(street && city && state && zip) };
    }
  }

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

  const looksLikeStreet = /^\d+\s+\w/.test(text) && !text.match(/,/);
  if (looksLikeStreet) {
    return { street: text, city: null, state: null, zip: null, isComplete: false };
  }

  const cityStateZip = text.match(/^([A-Za-z\s]+),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
  if (cityStateZip) {
    const city = cityStateZip[1].trim();
    const state = cityStateZip[2].toUpperCase();
    const zip = cityStateZip[3];
    if (US_STATES[state]) {
      return { street: null, city, state: US_STATES[state], zip, isComplete: false };
    }
  }

  return { street: text, city: null, state: null, zip: null, isComplete: false };
}

function extractStateZip(raw: string): { state: string | null; zip: string | null } {
  const match = raw.match(/^([A-Za-z\s]+?)\s*(\d{5}(?:-\d{4})?)?$/);
  if (!match) return { state: null, zip: null };
  const statePart = match[1]?.trim().toUpperCase() || null;
  const zip = match[2] || null;
  const state = statePart ? (US_STATES[statePart] || null) : null;
  return { state, zip };
}

// ─── Color validation ─────────────────────────────────────────────────────────

export function isValidHexColor(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value.trim());
}

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  // Add # if missing
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (isValidHexColor(withHash)) return withHash.toUpperCase();
  return null;
}

// ─── Common timezones ─────────────────────────────────────────────────────────

export const COMMON_TIMEZONES: Record<string, string> = {
  "eastern": "America/New_York",
  "central": "America/Chicago",
  "mountain": "America/Denver",
  "pacific": "America/Los_Angeles",
  "alaska": "America/Anchorage",
  "hawaii": "Pacific/Honolulu",
  "est": "America/New_York",
  "cst": "America/Chicago",
  "mst": "America/Denver",
  "pst": "America/Los_Angeles",
  "et": "America/New_York",
  "ct": "America/Chicago",
  "mt": "America/Denver",
  "pt": "America/Los_Angeles",
  "utc": "UTC",
  "gmt": "UTC",
  "london": "Europe/London",
  "paris": "Europe/Paris",
  "berlin": "Europe/Berlin",
  "toronto": "America/Toronto",
  "vancouver": "America/Vancouver",
  "sydney": "Australia/Sydney",
  "melbourne": "Australia/Melbourne",
  "auckland": "Pacific/Auckland",
  "dubai": "Asia/Dubai",
  "singapore": "Asia/Singapore",
  "tokyo": "Asia/Tokyo",
};

export function normalizeTimezone(input: string): string | null {
  const lower = input.trim().toLowerCase();
  // Check common aliases
  if (COMMON_TIMEZONES[lower]) return COMMON_TIMEZONES[lower];
  // Check if it looks like a valid IANA timezone
  if (/^[A-Za-z]+\/[A-Za-z_]+$/.test(input.trim())) return input.trim();
  // Check for partial match
  for (const [key, tz] of Object.entries(COMMON_TIMEZONES)) {
    if (lower.includes(key)) return tz;
  }
  return null;
}

// ─── Common currencies ────────────────────────────────────────────────────────

export const COMMON_CURRENCIES: Record<string, string> = {
  "usd": "USD", "dollar": "USD", "us dollar": "USD", "$": "USD",
  "cad": "CAD", "canadian": "CAD", "canadian dollar": "CAD",
  "gbp": "GBP", "pound": "GBP", "british pound": "GBP", "£": "GBP",
  "eur": "EUR", "euro": "EUR", "€": "EUR",
  "aud": "AUD", "australian": "AUD", "australian dollar": "AUD",
  "nzd": "NZD", "new zealand": "NZD",
  "jpy": "JPY", "yen": "JPY", "¥": "JPY",
  "mxn": "MXN", "peso": "MXN", "mexican peso": "MXN",
  "brl": "BRL", "real": "BRL", "brazilian real": "BRL",
  "sgd": "SGD", "singapore dollar": "SGD",
  "hkd": "HKD", "hong kong dollar": "HKD",
  "chf": "CHF", "franc": "CHF", "swiss franc": "CHF",
  "inr": "INR", "rupee": "INR", "indian rupee": "INR",
  "zar": "ZAR", "rand": "ZAR", "south african rand": "ZAR",
};

export function normalizeCurrency(input: string): string | null {
  const lower = input.trim().toLowerCase();
  if (COMMON_CURRENCIES[lower]) return COMMON_CURRENCIES[lower];
  // Check 3-letter ISO code
  if (/^[A-Za-z]{3}$/.test(input.trim())) return input.trim().toUpperCase();
  // Partial match
  for (const [key, code] of Object.entries(COMMON_CURRENCIES)) {
    if (lower.includes(key)) return code;
  }
  return null;
}
