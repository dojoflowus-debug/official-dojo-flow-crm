import { z } from "zod";
import { router, orgScopedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { dojoSettings, organizations, schoolProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { upsertSchoolProfile } from "./schoolProfileDb";

// ─── Step definitions ────────────────────────────────────────────────────────

export const ONBOARDING_STEPS = [
  "name",
  "title",
  "programs",
  "rank",          // conditional — only if programs includes martial arts
  "school_name",
  "martial_style", // conditional — only if programs includes martial arts
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MARTIAL_ARTS_KEYWORDS = [
  "jiu-jitsu", "jiujitsu", "bjj", "muay thai", "karate", "mma", "judo",
  "taekwondo", "kung fu", "boxing", "kickboxing", "wrestling", "hapkido",
  "aikido", "krav maga", "capoeira", "sambo", "wushu", "ninjutsu",
  "martial art", "combat sport", "self-defense", "self defense",
  "kenpo", "kempo", "tang soo do", "wing chun", "silat", "escrima",
];

function detectsMartialArts(text: string): boolean {
  const lower = text.toLowerCase();
  return MARTIAL_ARTS_KEYWORDS.some((kw) => lower.includes(kw));
}

// Detect correction intent: "that's wrong", "not my name", "actually", "I meant", etc.
const CORRECTION_PATTERNS = [
  /\b(that'?s?\s*(not|wrong|incorrect))/i,
  /\b(not\s+my\s+(name|title|rank|school))/i,
  /\b(i\s+meant|i\s+mean|actually|correction|correct\s+that|change\s+that)/i,
  /\b(go\s+back|redo|undo|start\s+over|reset)/i,
  /\b(wrong\s+(name|title|rank|school|answer))/i,
];

function isCorrection(text: string): boolean {
  return CORRECTION_PATTERNS.some((p) => p.test(text));
}

// Detect if input looks like a greeting rather than a real answer
const GREETING_PATTERNS = [
  /^(hi|hello|hey|howdy|greetings|good\s+(morning|afternoon|evening|day))[!.,\s]*$/i,
  /^(what'?s?\s+up|sup|yo)[!.,\s]*$/i,
];

function isGreeting(text: string): boolean {
  return GREETING_PATTERNS.some((p) => p.test(text.trim()));
}

// Detect skip intent
const SKIP_PATTERNS = [
  /^(skip|pass|later|not\s+now|no\s+thanks|n\/a|none|skip\s+for\s+now)[!.,\s]*$/i,
];

function isSkip(text: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(text.trim()));
}

// Validate name: must be at least 2 chars, not a greeting
function validateName(text: string): { valid: boolean; error?: string } {
  const t = text.trim();
  if (isGreeting(t)) return { valid: false, error: "greeting" };
  if (t.length < 2) return { valid: false, error: "too_short" };
  if (t.length > 100) return { valid: false, error: "too_long" };
  if (/^\d+$/.test(t)) return { valid: false, error: "numbers_only" };
  return { valid: true };
}

// Validate title: must be at least 2 chars
function validateTitle(text: string): { valid: boolean; error?: string } {
  const t = text.trim();
  if (t.length < 2) return { valid: false, error: "too_short" };
  if (/^\d+$/.test(t)) return { valid: false, error: "numbers_only" };
  return { valid: true };
}

// Validate programs: must mention at least one recognizable program or be a reasonable string
function validatePrograms(text: string): { valid: boolean; error?: string } {
  const t = text.trim();
  if (isGreeting(t)) return { valid: false, error: "greeting" };
  if (t.length < 3) return { valid: false, error: "too_short" };
  return { valid: true };
}

// Validate school name
function validateSchoolName(text: string): { valid: boolean; error?: string } {
  const t = text.trim();
  if (isGreeting(t)) return { valid: false, error: "greeting" };
  if (t.length < 2) return { valid: false, error: "too_short" };
  return { valid: true };
}

// Parse programs string into array
function parsePrograms(text: string): string[] {
  return text
    .split(/[,;&\/\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ─── Question messages for each step ─────────────────────────────────────────

export function getStepQuestion(step: OnboardingStep, profile: OnboardingProfile): string {
  switch (step) {
    case "name":
      return "First, **what's your name?**";
    case "title":
      return `What's your **title**, ${profile.name}? *(e.g., Sensei, Sifu, Coach, Professor, Master, Instructor)*`;
    case "programs":
      return "What **programs** do you teach? *(e.g., Brazilian Jiu-Jitsu, Muay Thai, Karate, Gymnastics, Yoga — list as many as you like)*";
    case "rank":
      return "What is your current **rank or belt**? *(e.g., Black Belt 3rd Degree, Brown Belt, Head Instructor)*";
    case "school_name":
      return "What's the **name of your school or dojo**?";
    case "martial_style":
      return "What **martial arts style(s)** do you primarily teach? *(e.g., Brazilian Jiu-Jitsu, Shotokan Karate)*";
    case "address":
      return "What's your **street address**?";
    case "city_state_zip":
      return "What's your **city, state, and ZIP code**? *(e.g., Austin, TX 78701)*";
    case "phone":
      return "What's your **school phone number**?";
    case "email":
      return "What's your **school email address**?";
    case "website":
      return "What's your **school website**? *(e.g., https://mydojo.com)*";
    case "logo_light":
      return "Now let's brand your dashboard. Upload your **Day Mode logo** — used on light backgrounds. PNG or SVG works best.";
    case "logo_dark":
      return "Upload your **Dark Mode logo** — usually a white or light version of your logo, used on dark backgrounds.";
    default:
      return "What would you like to set up next?";
  }
}

// ─── State machine transition ─────────────────────────────────────────────────

export interface ProcessStepResult {
  /** The KAI response message to show the user */
  kaiMessage: string;
  /** The next step to transition to */
  nextStep: OnboardingStep;
  /** Updated profile */
  profile: OnboardingProfile;
  /** Whether the step was completed (vs re-asked due to validation failure) */
  stepCompleted: boolean;
  /** Whether onboarding is now complete */
  isComplete: boolean;
  /** Whether this step expects a file upload */
  expectsFileUpload: boolean;
  /** Whether to show a skip button */
  showSkip: boolean;
  /** Whether a correction was detected and which step to return to */
  correctionStep?: OnboardingStep;
}

function getNextStep(
  current: OnboardingStep,
  profile: OnboardingProfile,
  hasMartialArts: boolean
): OnboardingStep {
  const flow: OnboardingStep[] = [
    "name",
    "title",
    "programs",
    ...(hasMartialArts ? ["rank" as OnboardingStep] : []),
    "school_name",
    ...(hasMartialArts ? ["martial_style" as OnboardingStep] : []),
    "address",
    "city_state_zip",
    "phone",
    "email",
    "website",
    "logo_light",
    "logo_dark",
    "complete",
  ];

  const idx = flow.indexOf(current);
  if (idx === -1 || idx >= flow.length - 1) return "complete";
  return flow[idx + 1];
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function loadOnboardingState(orgId: number): Promise<OnboardingState> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Load from organizations (step tracking) and dojo_settings + school_profiles (profile data)
  const [org] = await db
    .select({
      onboardingStatus: organizations.onboardingStatus,
      onboardingStep: organizations.onboardingStep,
      onboardingProfile: organizations.onboardingProfile,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const [settings] = await db
    .select({
      operatorName: dojoSettings.operatorName,
      instructorTitle: dojoSettings.instructorTitle,
      programsTaught: dojoSettings.programsTaught,
      ownerRank: dojoSettings.ownerRank,
      martialArtsStyle: dojoSettings.martialArtsStyle,
      schoolName: dojoSettings.schoolName,
    })
    .from(dojoSettings)
    .where(eq(dojoSettings.organizationId, orgId))
    .limit(1)
    .catch(() => [null]);

  const [profile] = await db
    .select()
    .from(schoolProfiles)
    .where(eq(schoolProfiles.organizationId, orgId))
    .limit(1)
    .catch(() => [null]);

  // Parse stored JSON profile if available
  let storedProfile: Partial<OnboardingProfile> = {};
  if (org?.onboardingProfile) {
    try {
      storedProfile = JSON.parse(org.onboardingProfile as string);
    } catch {}
  }

  const programs = storedProfile.programs ||
    (settings?.programsTaught ? parsePrograms(settings.programsTaught) : []);
  const hasMartialArts = programs.some((p) => detectsMartialArts(p));

  const onboardingProfile: OnboardingProfile = {
    name: storedProfile.name ?? settings?.operatorName ?? null,
    title: storedProfile.title ?? settings?.instructorTitle ?? null,
    programs,
    styles: storedProfile.styles ?? (settings?.martialArtsStyle ? [settings.martialArtsStyle] : []),
    schoolName: storedProfile.schoolName ?? profile?.schoolName ?? settings?.schoolName ?? null,
    addressStreet: storedProfile.addressStreet ?? profile?.addressStreet ?? null,
    addressCity: storedProfile.addressCity ?? profile?.addressCity ?? null,
    addressState: storedProfile.addressState ?? profile?.addressState ?? null,
    addressPostal: storedProfile.addressPostal ?? profile?.addressPostal ?? null,
    phone: storedProfile.phone ?? profile?.phone ?? null,
    email: storedProfile.email ?? profile?.email ?? null,
    website: storedProfile.website ?? profile?.website ?? null,
    logoLightUrl: storedProfile.logoLightUrl ?? profile?.logoLightUrl ?? null,
    logoDarkUrl: storedProfile.logoDarkUrl ?? profile?.logoDarkUrl ?? null,
  };

  // Determine current step from stored state or infer from what's missing
  let currentStep: OnboardingStep = "name";
  if (org?.onboardingStep && org.onboardingStep > 0) {
    const stepMap: Record<number, OnboardingStep> = {
      1: "name", 2: "title", 3: "programs", 4: "rank", 5: "school_name",
      6: "martial_style", 7: "address", 8: "city_state_zip", 9: "phone",
      10: "email", 11: "website", 12: "logo_light", 13: "logo_dark", 99: "complete",
    };
    currentStep = stepMap[org.onboardingStep] || "name";
  }

  return {
    step: currentStep,
    profile: onboardingProfile,
    completedSteps: [],
    hasMartialArts,
  };
}

async function saveOnboardingState(
  orgId: number,
  state: OnboardingState,
  stepNumber: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Save profile JSON to organizations table
  await db
    .update(organizations)
    .set({
      onboardingStatus: state.step === "complete" ? "completed" : "in_progress",
      onboardingStep: stepNumber,
      onboardingProfile: JSON.stringify(state.profile),
    } as any)
    .where(eq(organizations.id, orgId));
}

async function persistProfileField(
  orgId: number,
  field: keyof OnboardingProfile,
  value: string | string[]
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const stringValue = Array.isArray(value) ? value.join(", ") : value;

  try {
    switch (field) {
      case "name":
        await db
          .update(dojoSettings)
          .set({ operatorName: stringValue, updatedAt: new Date().toISOString() } as any)
          .where(eq(dojoSettings.organizationId, orgId));
        break;
      case "title":
        await db
          .update(dojoSettings)
          .set({ instructorTitle: stringValue, updatedAt: new Date().toISOString() } as any)
          .where(eq(dojoSettings.organizationId, orgId));
        break;
      case "programs":
        await db
          .update(dojoSettings)
          .set({ programsTaught: stringValue, updatedAt: new Date().toISOString() } as any)
          .where(eq(dojoSettings.organizationId, orgId));
        break;
      case "styles":
        await db
          .update(dojoSettings)
          .set({ martialArtsStyle: stringValue, updatedAt: new Date().toISOString() } as any)
          .where(eq(dojoSettings.organizationId, orgId));
        break;
      case "schoolName":
        await upsertSchoolProfile(orgId, { schoolName: stringValue });
        await db
          .update(dojoSettings)
          .set({ schoolName: stringValue, updatedAt: new Date().toISOString() } as any)
          .where(eq(dojoSettings.organizationId, orgId));
        await db
          .update(organizations)
          .set({ name: stringValue } as any)
          .where(eq(organizations.id, orgId));
        break;
      case "addressStreet":
        await upsertSchoolProfile(orgId, { addressStreet: stringValue });
        break;
      case "addressCity":
      case "addressState":
      case "addressPostal":
        // These are handled together in city_state_zip step
        break;
      case "phone":
        await upsertSchoolProfile(orgId, { phone: stringValue });
        break;
      case "email":
        await upsertSchoolProfile(orgId, { email: stringValue });
        break;
      case "website":
        await upsertSchoolProfile(orgId, { website: stringValue });
        break;
    }
  } catch (e) {
    console.error(`[OnboardingSM] Failed to persist field ${field}:`, e);
  }
}

// Step number map for DB storage
const STEP_NUMBERS: Record<OnboardingStep, number> = {
  name: 1, title: 2, programs: 3, rank: 4, school_name: 5,
  martial_style: 6, address: 7, city_state_zip: 8, phone: 9,
  email: 10, website: 11, logo_light: 12, logo_dark: 13, complete: 99,
};

// ─── Main state machine processor ────────────────────────────────────────────

export async function processOnboardingStep(
  orgId: number,
  currentStep: OnboardingStep,
  userInput: string,
  currentProfile: OnboardingProfile,
  hasMartialArts: boolean
): Promise<ProcessStepResult> {
  const input = userInput.trim();
  const titleName = currentProfile.title && currentProfile.name
    ? `${currentProfile.title} ${currentProfile.name}`
    : currentProfile.name || "there";

  // ── Correction detection ──────────────────────────────────────────────────
  if (isCorrection(input)) {
    // Determine which step to correct based on keywords
    let correctionStep: OnboardingStep = currentStep;
    const lower = input.toLowerCase();
    if (lower.includes("name")) correctionStep = "name";
    else if (lower.includes("title")) correctionStep = "title";
    else if (lower.includes("program") || lower.includes("teach")) correctionStep = "programs";
    else if (lower.includes("rank") || lower.includes("belt")) correctionStep = "rank";
    else if (lower.includes("school") || lower.includes("dojo")) correctionStep = "school_name";
    else if (lower.includes("style") || lower.includes("martial")) correctionStep = "martial_style";
    else if (lower.includes("address") || lower.includes("street")) correctionStep = "address";
    else if (lower.includes("city") || lower.includes("state") || lower.includes("zip")) correctionStep = "city_state_zip";
    else if (lower.includes("phone")) correctionStep = "phone";
    else if (lower.includes("email")) correctionStep = "email";
    else if (lower.includes("website") || lower.includes("url")) correctionStep = "website";

    return {
      kaiMessage: `No problem — let's correct that. ${getStepQuestion(correctionStep, currentProfile)}`,
      nextStep: correctionStep,
      profile: currentProfile,
      stepCompleted: false,
      isComplete: false,
      expectsFileUpload: correctionStep === "logo_light" || correctionStep === "logo_dark",
      showSkip: correctionStep !== "name" && correctionStep !== "title" && correctionStep !== "programs",
      correctionStep,
    };
  }

  // ── Process each step ─────────────────────────────────────────────────────
  switch (currentStep) {
    case "name": {
      const validation = validateName(input);
      if (!validation.valid) {
        const errorMsg =
          validation.error === "greeting"
            ? `I appreciate the greeting! But I need your **actual name** to get started. What should I call you?`
            : `That doesn't look like a name. What's your **full name or first name**?`;
        return {
          kaiMessage: errorMsg,
          nextStep: "name",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: false,
        };
      }
      const name = input;
      const updatedProfile = { ...currentProfile, name };
      await persistProfileField(orgId, "name", name);
      const next = getNextStep("name", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `Got it — **${name}**.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: false,
      };
    }

    case "title": {
      if (isSkip(input)) {
        const next = getNextStep("title", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — you can set your title later in Settings.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
        };
      }
      const validation = validateTitle(input);
      if (!validation.valid) {
        return {
          kaiMessage: `I need a title to address you properly — for example: Sensei, Sifu, Coach, Professor, or Master. What's yours?`,
          nextStep: "title",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
        };
      }
      const title = input;
      const updatedProfile = { ...currentProfile, title };
      await persistProfileField(orgId, "title", title);
      const titleName = `${title} ${currentProfile.name || ""}`.trim();
      const next = getNextStep("title", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `Perfect — I'll address you as **${titleName}** from here on.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: false,
      };
    }

    case "programs": {
      const validation = validatePrograms(input);
      if (!validation.valid) {
        return {
          kaiMessage: `I need to know what programs you teach to set up your profile correctly. Please list your programs — for example: *Brazilian Jiu-Jitsu, Muay Thai, Gymnastics*.`,
          nextStep: "programs",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: false,
        };
      }
      const programs = parsePrograms(input);
      const newHasMartialArts = programs.some((p) => detectsMartialArts(p));
      const updatedProfile = { ...currentProfile, programs };
      await persistProfileField(orgId, "programs", programs);
      const next = getNextStep("programs", updatedProfile, newHasMartialArts);
      const programList = programs.join(", ");
      const martialArtsNote = newHasMartialArts
        ? " Since you teach martial arts, I have one more question for you."
        : "";
      return {
        kaiMessage: `Perfect — **${programList}**.${martialArtsNote}\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: false,
        // Pass hasMartialArts update via profile (caller updates state)
      };
    }

    case "rank": {
      if (isSkip(input)) {
        const next = getNextStep("rank", currentProfile, hasMartialArts);
        return {
          kaiMessage: `Understood — you can add your rank later.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
        };
      }
      if (input.length < 2) {
        return {
          kaiMessage: `Please enter your rank or belt — for example: *Black Belt 2nd Degree*, *Brown Belt*, or *Head Instructor*.`,
          nextStep: "rank",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
        };
      }
      await persistProfileField(orgId, "title", currentProfile.title || "");
      // Save rank to ownerRank column
      const db = await getDb();
      if (db) {
        await db.update(dojoSettings)
          .set({ ownerRank: input, updatedAt: new Date().toISOString() } as any)
          .where(eq(dojoSettings.organizationId, orgId));
      }
      const next = getNextStep("rank", currentProfile, hasMartialArts);
      return {
        kaiMessage: `Impressive — **${input}**. 🏅\n\n${getStepQuestion(next, currentProfile)}`,
        nextStep: next,
        profile: currentProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: false,
      };
    }

    case "school_name": {
      const validation = validateSchoolName(input);
      if (!validation.valid) {
        return {
          kaiMessage: `I need a name for your school or dojo. What should we call it?`,
          nextStep: "school_name",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: false,
        };
      }
      const schoolName = input;
      const updatedProfile = { ...currentProfile, schoolName };
      await persistProfileField(orgId, "schoolName", schoolName);
      const next = getNextStep("school_name", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `**${schoolName}** — great name. 🏆\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: false,
      };
    }

    case "martial_style": {
      if (isSkip(input)) {
        const next = getNextStep("martial_style", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — you can add your style in Settings later.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
        };
      }
      const styles = parsePrograms(input);
      const updatedProfile = { ...currentProfile, styles };
      await persistProfileField(orgId, "styles", styles);
      const next = getNextStep("martial_style", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `Got it — **${styles.join(", ")}**.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: true,
      };
    }

    case "address": {
      if (isSkip(input)) {
        const next = getNextStep("address", currentProfile, hasMartialArts);
        return {
          kaiMessage: `Skipped — you can add your address in Settings.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
        };
      }
      if (input.length < 3) {
        return {
          kaiMessage: `Please enter your full street address — for example: *123 Main Street*.`,
          nextStep: "address",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
        };
      }
      const updatedProfile = { ...currentProfile, addressStreet: input };
      await upsertSchoolProfile(orgId, { addressStreet: input });
      const next = getNextStep("address", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `Got it — **${input}**.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: true,
      };
    }

    case "city_state_zip": {
      if (isSkip(input)) {
        const next = getNextStep("city_state_zip", currentProfile, hasMartialArts);
        return {
          kaiMessage: `Skipped — add your city/state/ZIP in Settings later.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
        };
      }
      // Parse "City, State ZIP" or "City, State, ZIP"
      const parts = input.split(/[,\s]+/);
      let city = "", state = "", postal = "";
      if (parts.length >= 3) {
        postal = parts[parts.length - 1];
        state = parts[parts.length - 2];
        city = parts.slice(0, parts.length - 2).join(" ");
      } else if (parts.length === 2) {
        state = parts[1];
        city = parts[0];
      } else {
        city = input;
      }
      const updatedProfile = { ...currentProfile, addressCity: city, addressState: state, addressPostal: postal };
      await upsertSchoolProfile(orgId, { addressCity: city, addressState: state, addressPostal: postal });
      const next = getNextStep("city_state_zip", updatedProfile, hasMartialArts);
      const location = [city, state, postal].filter(Boolean).join(", ");
      return {
        kaiMessage: `Got it — **${location}**.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: true,
      };
    }

    case "phone": {
      if (isSkip(input)) {
        const next = getNextStep("phone", currentProfile, hasMartialArts);
        return {
          kaiMessage: `Skipped — add your phone number in Settings later.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
        };
      }
      const updatedProfile = { ...currentProfile, phone: input };
      await upsertSchoolProfile(orgId, { phone: input });
      const next = getNextStep("phone", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `Got it — **${input}**.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: true,
      };
    }

    case "email": {
      if (isSkip(input)) {
        const next = getNextStep("email", currentProfile, hasMartialArts);
        return {
          kaiMessage: `Skipped — add your email in Settings later.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
        };
      }
      // Basic email validation
      if (!input.includes("@") || !input.includes(".")) {
        return {
          kaiMessage: `That doesn't look like a valid email address. Please enter a valid email — for example: *info@mydojo.com*.`,
          nextStep: "email",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
        };
      }
      const updatedProfile = { ...currentProfile, email: input };
      await upsertSchoolProfile(orgId, { email: input });
      const next = getNextStep("email", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `Got it — **${input}**.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: true,
      };
    }

    case "website": {
      if (isSkip(input)) {
        const next = getNextStep("website", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — add your website in Settings later.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: next === "logo_light",
          showSkip: true,
        };
      }
      const website = input.startsWith("http") ? input : `https://${input}`;
      const updatedProfile = { ...currentProfile, website };
      await upsertSchoolProfile(orgId, { website });
      const next = getNextStep("website", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `Got it — **${website}**.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: next === "logo_light",
        showSkip: true,
      };
    }

    case "logo_light":
    case "logo_dark": {
      // Logo steps are handled by the uploadLogo mutation — not text input
      // If user types text here, ask them to use the upload button
      if (isSkip(input)) {
        const next = getNextStep(currentStep, currentProfile, hasMartialArts);
        if (next === "complete") {
          return {
            kaiMessage: buildCompletionMessage(currentProfile, hasMartialArts),
            nextStep: "complete",
            profile: currentProfile,
            stepCompleted: true,
            isComplete: true,
            expectsFileUpload: false,
            showSkip: false,
          };
        }
        return {
          kaiMessage: `Skipped — you can upload your logo in Settings → School Profile later.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: next === "logo_dark",
          showSkip: true,
        };
      }
      return {
        kaiMessage: `Please use the **Upload Logo** button below to upload your logo file.`,
        nextStep: currentStep,
        profile: currentProfile,
        stepCompleted: false,
        isComplete: false,
        expectsFileUpload: true,
        showSkip: true,
      };
    }

    default:
      return {
        kaiMessage: "I'm not sure what step we're on. Let's start fresh — what's your name?",
        nextStep: "name",
        profile: currentProfile,
        stepCompleted: false,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: false,
      };
  }
}

function buildCompletionMessage(profile: OnboardingProfile, hasMartialArts: boolean): string {
  const titleName = profile.title && profile.name
    ? `${profile.title} ${profile.name}`
    : profile.name || "there";
  const schoolName = profile.schoolName || "your school";

  return `🎉 You're all set, **${titleName}**!\n\n**${schoolName}** is now configured and ready to go. I'm here to help you manage your students, leads, attendance, and more.\n\n**What would you like to do first?**`;
}

// ─── tRPC Router ──────────────────────────────────────────────────────────────

export const kaiOnboardingStateMachineRouter = router({
  /**
   * Get the current onboarding status and profile.
   * Returns whether onboarding is needed and the current state.
   */
  getStatus: orgScopedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const orgId = ctx.currentOrganizationId;

    const [org] = await db
      .select({
        onboardingStatus: organizations.onboardingStatus,
        onboardingStep: organizations.onboardingStep,
        onboardingProfile: organizations.onboardingProfile,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const isCompleted = org?.onboardingStatus === "completed" || org?.onboardingStatus === "skipped";

    if (isCompleted) {
      return { needsOnboarding: false, isCompleted: true, step: "complete" as OnboardingStep, profile: null };
    }

    const state = await loadOnboardingState(orgId);

    // Onboarding is needed whenever status is not completed/skipped
    const needsOnboarding = true;

    return {
      needsOnboarding,
      isCompleted,
      step: state.step,
      profile: state.profile,
      hasMartialArts: state.hasMartialArts,
    };
  }),

  /**
   * Process a single onboarding step.
   * Validates input, updates profile, and returns the next step + KAI response.
   */
  processStep: orgScopedProcedure
    .input(
      z.object({
        currentStep: z.enum(ONBOARDING_STEPS),
        userInput: z.string().min(1).max(2000),
        currentProfile: z.object({
          name: z.string().nullable(),
          title: z.string().nullable(),
          programs: z.array(z.string()),
          styles: z.array(z.string()),
          schoolName: z.string().nullable(),
          addressStreet: z.string().nullable(),
          addressCity: z.string().nullable(),
          addressState: z.string().nullable(),
          addressPostal: z.string().nullable(),
          phone: z.string().nullable(),
          email: z.string().nullable(),
          website: z.string().nullable(),
          logoLightUrl: z.string().nullable(),
          logoDarkUrl: z.string().nullable(),
        }),
        hasMartialArts: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId;

      const result = await processOnboardingStep(
        orgId,
        input.currentStep,
        input.userInput,
        input.currentProfile,
        input.hasMartialArts
      );

      // Determine hasMartialArts for the new state
      const newHasMartialArts = input.currentStep === "programs"
        ? result.profile.programs.some((p) => detectsMartialArts(p))
        : input.hasMartialArts;

      // Save state to DB
      const stepNumber = STEP_NUMBERS[result.nextStep] || 1;
      await saveOnboardingState(
        orgId,
        { step: result.nextStep, profile: result.profile, completedSteps: [], hasMartialArts: newHasMartialArts },
        stepNumber
      );

      if (result.isComplete) {
        // Mark onboarding as completed
        const db = await getDb();
        if (db) {
          await db.update(dojoSettings)
            .set({ setupCompleted: 1, updatedAt: new Date().toISOString() } as any)
            .where(eq(dojoSettings.organizationId, orgId));
        }
      }

      return {
        ...result,
        hasMartialArts: newHasMartialArts,
      };
    }),

  /**
   * Skip onboarding entirely.
   */
  skipOnboarding: orgScopedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    await db.update(organizations)
      .set({ onboardingStatus: "skipped", onboardingStep: 99 } as any)
      .where(eq(organizations.id, ctx.currentOrganizationId));

    return { success: true };
  }),

  /**
   * Upload a logo (base64) during onboarding.
   * Saves to school_profiles.logo_light_url or logo_dark_url.
   */
  uploadLogo: orgScopedProcedure
    .input(
      z.object({
        type: z.enum(["light", "dark"]),
        dataUrl: z.string().min(10),
        fileName: z.string().optional(),
        currentProfile: z.object({
          name: z.string().nullable(),
          title: z.string().nullable(),
          programs: z.array(z.string()),
          styles: z.array(z.string()),
          schoolName: z.string().nullable(),
          addressStreet: z.string().nullable(),
          addressCity: z.string().nullable(),
          addressState: z.string().nullable(),
          addressPostal: z.string().nullable(),
          phone: z.string().nullable(),
          email: z.string().nullable(),
          website: z.string().nullable(),
          logoLightUrl: z.string().nullable(),
          logoDarkUrl: z.string().nullable(),
        }),
        hasMartialArts: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const isLight = input.type === "light";
      const updateData = isLight
        ? { logoLightUrl: input.dataUrl, logoLightData: input.dataUrl }
        : { logoDarkUrl: input.dataUrl, logoDarkData: input.dataUrl };

      await upsertSchoolProfile(orgId, updateData);

      const updatedProfile: OnboardingProfile = {
        ...input.currentProfile,
        ...(isLight ? { logoLightUrl: input.dataUrl } : { logoDarkUrl: input.dataUrl }),
      };

      const completedStep: OnboardingStep = isLight ? "logo_light" : "logo_dark";
      const nextStep = getNextStep(completedStep, updatedProfile, input.hasMartialArts);

      // Save state
      const stepNumber = STEP_NUMBERS[nextStep] || 1;
      await saveOnboardingState(
        orgId,
        { step: nextStep, profile: updatedProfile, completedSteps: [], hasMartialArts: input.hasMartialArts },
        stepNumber
      );

      let kaiMessage: string;
      let isComplete = false;

      if (nextStep === "complete") {
        kaiMessage = buildCompletionMessage(updatedProfile, input.hasMartialArts);
        isComplete = true;
        // Mark complete
        await db.update(dojoSettings)
          .set({ setupCompleted: 1, updatedAt: new Date().toISOString() } as any)
          .where(eq(dojoSettings.organizationId, orgId));
        await db.update(organizations)
          .set({ onboardingStatus: "completed", onboardingStep: 99 } as any)
          .where(eq(organizations.id, orgId));
      } else {
        const fileName = input.fileName || (isLight ? "Day Mode logo" : "Dark Mode logo");
        kaiMessage = `✅ **${fileName}** saved.\n\n${getStepQuestion(nextStep, updatedProfile)}`;
      }

      return {
        kaiMessage,
        nextStep,
        profile: updatedProfile,
        isComplete,
        expectsFileUpload: nextStep === "logo_dark",
        showSkip: true,
      };
    }),
});
