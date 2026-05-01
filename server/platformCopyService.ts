/**
 * Platform-Specific Copy Variants Service
 *
 * Generates tailored ad copy for each major platform:
 * - Facebook: Story-driven, parent-focused, emotional
 * - Instagram: Visual-first, punchy captions + hashtags
 * - TikTok: Hook-first, pattern interrupt, conversational script
 * - Google Ads: Keyword-rich, character-limited headlines
 * - SMS: Ultra-concise, opt-out compliant
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  return key;
}

async function callOpenAI(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options: { maxTokens?: number; temperature?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const { maxTokens = 1200, temperature = 0.7, jsonMode = false } = options;
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    max_tokens: maxTokens,
    temperature,
  };
  if (jsonMode) body.response_format = { type: "json_object" };
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

export interface PlatformCopyVariants {
  facebook: {
    headline: string;
    primaryText: string;       // Hook + story + urgency (up to 500 chars)
    description: string;       // Short description below ad
    cta: string;               // "Sign Up", "Learn More", "Book Now"
  };
  instagram: {
    caption: string;           // Emoji opener + body + CTA
    hashtags: string[];        // 10-15 relevant hashtags
    storyText: string;         // Ultra-short Story overlay (≤ 60 chars)
    cta: string;
  };
  tiktok: {
    hook: string;              // First 3 seconds — pattern interrupt (≤ 15 words)
    script: string;            // Full 15-30s spoken script
    caption: string;           // TikTok caption with trending hooks
    hashtags: string[];
    cta: string;
  };
  google: {
    headline1: string;         // ≤ 30 chars
    headline2: string;         // ≤ 30 chars
    headline3: string;         // ≤ 30 chars
    description1: string;      // ≤ 90 chars
    description2: string;      // ≤ 90 chars
    finalUrl: string | null;
  };
  sms: {
    message: string;           // ≤ 160 chars including opt-out
    followUp: string;          // ≤ 160 chars follow-up if no reply
  };
}

export interface PlatformCopyInput {
  program: string;
  audience: string;
  tone?: string;
  brandContext: {
    schoolName: string;
    phone: string | null;
    website: string | null;
    primaryColor: string | null;
  };
  lockedValues?: {
    ageRange?: string;
    phoneNumber?: string;
    programName?: string;
  };
}

export async function generatePlatformCopyVariants(
  input: PlatformCopyInput
): Promise<PlatformCopyVariants> {
  const programDisplay = input.lockedValues?.programName || input.program;
  const audienceDisplay = input.lockedValues?.ageRange || input.audience;
  const phoneDisplay = input.lockedValues?.phoneNumber || input.brandContext.phone || null;
  const school = input.brandContext.schoolName || "our school";
  const website = input.brandContext.website || null;
  const tone = input.tone || "bold, energetic, conversion-focused";

  const systemPrompt = `You are a world-class performance marketing copywriter specializing in martial arts schools and fitness studios.
You write platform-native ad copy that converts. Each platform has different psychology and format rules — you know them all.

BRAND RULES (non-negotiable):
- School: "${school}"
- Program: "${programDisplay}" — use EXACTLY this name, no variations
- Audience: "${audienceDisplay}"
- Phone: "${phoneDisplay || "[PHONE]"}"
- Tone: ${tone}

PLATFORM RULES:
FACEBOOK: Story-driven, parent-focused, emotional. Primary text starts with a HOOK (question or bold statement). Include social proof or urgency. CTA button: "Learn More", "Sign Up", "Get Quote", or "Book Now".
INSTAGRAM: Visual-first. Caption starts with emoji + punchy line. Body is short (2-3 sentences). End with CTA. 10-15 niche hashtags (mix broad + local + program-specific).
TIKTOK: Hook must be a PATTERN INTERRUPT — something unexpected that stops the scroll. Script is conversational, energetic, trend-aware. Use "POV:", "Tell me why", or "Things that hit different" style openers.
GOOGLE ADS: Keyword-rich. Each headline MUST be 30 characters or fewer (count carefully). Descriptions are specific and include a differentiator. No exclamation marks in headlines.
SMS: Ultra-concise. First message is the offer + urgency + link/phone. Second is a softer follow-up if no reply. Always end with "Reply STOP to opt out".`;

  const userMessage = `Generate platform-specific ad copy for:
- Program: ${programDisplay}
- Audience: ${audienceDisplay}
- School: ${school}
${phoneDisplay ? `- Phone: ${phoneDisplay}` : ""}
${website ? `- Website: ${website}` : ""}

Respond with this exact JSON structure (no extra fields):
{
  "facebook": {
    "headline": "Benefit-driven headline (under 40 chars)",
    "primaryText": "Hook sentence that grabs attention.\\n\\nStory paragraph (2-3 sentences about transformation/benefit).\\n\\nUrgency + CTA sentence.",
    "description": "Short description (under 30 chars)",
    "cta": "Sign Up"
  },
  "instagram": {
    "caption": "🥋 Punchy opener line\\n\\nBody (2-3 sentences).\\n\\n👉 CTA with phone or link",
    "hashtags": ["#MartialArts", "#KidsKarate", "#Confidence"],
    "storyText": "Ultra-short story overlay under 60 chars",
    "cta": "Book Free Trial"
  },
  "tiktok": {
    "hook": "Pattern interrupt opener under 15 words",
    "script": "Full 15-30 second spoken script (conversational, energetic, no stage directions)",
    "caption": "TikTok caption with trending format and emojis",
    "hashtags": ["#MartialArts", "#KidsActivities", "#FYP"],
    "cta": "Link in bio"
  },
  "google": {
    "headline1": "Max 30 chars benefit",
    "headline2": "Max 30 chars differentiator",
    "headline3": "Max 30 chars urgency",
    "description1": "Specific benefit statement with proof point, max 90 chars",
    "description2": "CTA with phone or location, max 90 chars",
    "finalUrl": ${website ? `"${website}"` : "null"}
  },
  "sms": {
    "message": "First SMS under 160 chars with offer + phone. Reply STOP to opt out.",
    "followUp": "Follow-up SMS under 160 chars. Reply STOP to opt out."
  }
}`;

  try {
    const raw = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      { jsonMode: true, maxTokens: 1400, temperature: 0.7 }
    );
    const parsed = JSON.parse(raw) as PlatformCopyVariants;

    // Enforce phone in SMS
    if (phoneDisplay && parsed.sms && !parsed.sms.message.includes(phoneDisplay)) {
      parsed.sms.message = parsed.sms.message.replace(
        "Reply STOP",
        `Call ${phoneDisplay}. Reply STOP`
      );
    }

    // Enforce Google headline char limits
    if (parsed.google) {
      parsed.google.headline1 = parsed.google.headline1.slice(0, 30);
      parsed.google.headline2 = parsed.google.headline2.slice(0, 30);
      parsed.google.headline3 = parsed.google.headline3.slice(0, 30);
      parsed.google.description1 = parsed.google.description1.slice(0, 90);
      parsed.google.description2 = parsed.google.description2.slice(0, 90);
    }

    return parsed;
  } catch (e) {
    console.warn("[PlatformCopy] Generation failed, using fallback:", e);
    return buildFallbackCopy(programDisplay, audienceDisplay, school, phoneDisplay, website);
  }
}

function buildFallbackCopy(
  program: string,
  audience: string,
  school: string,
  phone: string | null,
  website: string | null
): PlatformCopyVariants {
  const phoneStr = phone ? `Call ${phone}` : "Register today";
  return {
    facebook: {
      headline: `${program} — Build Confidence`,
      primaryText: `Is your child ready to build real confidence and discipline?\n\n${school} is now enrolling for ${program} (${audience}). Our proven program builds life skills through martial arts in a fun, safe environment.\n\nLimited spots available — ${phoneStr}!`,
      description: "Free trial class available",
      cta: "Sign Up",
    },
    instagram: {
      caption: `🥋 ${program} at ${school}!\n\nBuilding confidence, discipline & focus in ${audience}. Join a community that changes lives.\n\n👉 Free trial class — ${phone || "DM us to book"}`,
      hashtags: [
        "#MartialArts", "#KidsKarate", "#Confidence", "#Discipline",
        "#FreeClass", "#KidsActivities", "#MartialArtsLife", "#Karate",
        "#KidsFitness", "#AfterSchool",
      ],
      storyText: `Free Trial — ${program}`,
      cta: "Book Free Trial",
    },
    tiktok: {
      hook: "This is what confidence looks like at age 6",
      script: `If you've been looking for an activity that actually builds your kid's confidence — ${program} at ${school} is it. We're enrolling ${audience} right now. Free trial class. ${phone ? `Call ${phone}` : "Link in bio"}.`,
      caption: `POV: Your kid just earned their first belt 🥋 #MartialArts #KidsActivities #${program.replace(/\s+/g, "")}`,
      hashtags: ["#MartialArts", "#KidsActivities", "#FYP", "#Confidence", "#Karate"],
      cta: "Link in bio",
    },
    google: {
      headline1: `${program} Classes`.slice(0, 30),
      headline2: "Build Confidence & Focus".slice(0, 30),
      headline3: "Free Trial Class".slice(0, 30),
      description1: `${school} offers ${program} for ${audience}. Expert instructors, proven results.`.slice(0, 90),
      description2: phone ? `Call ${phone} to book your free trial today.`.slice(0, 90) : "Book your free trial class today.".slice(0, 90),
      finalUrl: website,
    },
    sms: {
      message: `${school}: ${program} open for ${audience}! Free trial this week. ${phone ? `Call ${phone}` : "Reply YES to book"}. Reply STOP to opt out.`.slice(0, 160),
      followUp: `Hi! Following up on ${program} at ${school}. Spots filling fast — ${phone ? `call ${phone}` : "reply YES"}. Reply STOP to opt out.`.slice(0, 160),
    },
  };
}
