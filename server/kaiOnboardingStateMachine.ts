import { z } from "zod";
import { router, orgScopedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { dojoSettings, organizations, schoolProfiles, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { upsertSchoolProfile } from "./schoolProfileDb";

// ─── Re-export shared types (no server deps) ─────────────────────────────────
export { ONBOARDING_STEPS, getStepQuestion } from "../shared/onboarding";
export type { OnboardingStep, OnboardingProfile, OnboardingState } from "../shared/onboarding";
import type { OnboardingStep, OnboardingProfile, OnboardingState } from "../shared/onboarding";
import { ONBOARDING_STEPS, getStepQuestion, detectIntent, buildCorrectionAck, buildObjectionResponse } from "../shared/onboarding";

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

// Detect correction intent
const CORRECTION_PATTERNS = [
  /\b(that'?s?\s*(not|wrong|incorrect))/i,
  /\b(not\s+my\s+(name|title|rank|school))/i,
  /\b(i\s+meant|i\s+mean|actually|correction|correct\s+that|change\s+that)/i,
  /\b(go\s+back|redo|undo|start\s+over|reset)/i,
  /\b(wrong\s+(name|title|rank|school|answer))/i,
  /\b(address\s+me\s+as|call\s+me|refer\s+to\s+me\s+as|known\s+as|can\s+you\s+call|please\s+call)/i,
  /\b(would\s+like\s+to\s+be\s+called|want\s+to\s+be\s+called|like\s+to\s+be\s+called|should\s+call\s+me|my\s+name\s+is|i\s+go\s+by)/i,
];

function isCorrection(text: string): boolean {
  return CORRECTION_PATTERNS.some((p) => p.test(text));
}

const GREETING_PATTERNS = [
  /^(hi|hello|hey|howdy|greetings|good\s+(morning|afternoon|evening|day))[!.,\s]*$/i,
  /^(what'?s?\s+up|sup|yo)[!.,\s]*$/i,
];

function isGreeting(text: string): boolean {
  return GREETING_PATTERNS.some((p) => p.test(text.trim()));
}

const SKIP_PATTERNS = [
  /^(skip|pass|later|not\s+now|no\s+thanks|n\/a|none|skip\s+for\s+now)[!.,\s]*$/i,
];

function isSkip(text: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(text.trim()));
}

// Validate name
function validateName(text: string): { valid: boolean; error?: string } {
  const t = text.trim();
  if (isGreeting(t)) return { valid: false, error: "greeting" };
  if (t.length < 2) return { valid: false, error: "too_short" };
  if (t.length > 100) return { valid: false, error: "too_long" };
  if (/^\d+$/.test(t)) return { valid: false, error: "numbers_only" };
  return { valid: true };
}

// Validate title
function validateTitle(text: string): { valid: boolean; error?: string } {
  const t = text.trim();
  if (t.length < 2) return { valid: false, error: "too_short" };
  if (/^\d+$/.test(t)) return { valid: false, error: "numbers_only" };
  return { valid: true };
}

// Validate programs
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

// ─── Ordered flow builder ─────────────────────────────────────────────────────

function buildFlow(hasMartialArts: boolean): OnboardingStep[] {
  return [
    "name",
    "title",
    "profile_photo",
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
}

function getNextStep(
  current: OnboardingStep,
  profile: OnboardingProfile,
  hasMartialArts: boolean
): OnboardingStep {
  const flow = buildFlow(hasMartialArts);
  const idx = flow.indexOf(current);
  if (idx === -1 || idx >= flow.length - 1) return "complete";
  return flow[idx + 1];
}

function getPrevStep(
  current: OnboardingStep,
  hasMartialArts: boolean
): OnboardingStep | null {
  const flow = buildFlow(hasMartialArts);
  const idx = flow.indexOf(current);
  if (idx <= 0) return null;
  return flow[idx - 1];
}

/** Returns 1-based step number and total steps (excluding "complete") */
export function getStepProgress(
  step: OnboardingStep,
  hasMartialArts: boolean
): { stepNumber: number; totalSteps: number } {
  const flow = buildFlow(hasMartialArts).filter((s) => s !== "complete");
  const idx = flow.indexOf(step);
  return {
    stepNumber: idx === -1 ? flow.length : idx + 1,
    totalSteps: flow.length,
  };
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function loadOnboardingState(orgId: number): Promise<OnboardingState> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let org: { onboardingStatus: string | null; onboardingStep: number | null; onboardingProfile: string | null } | null = null;
  try {
    const [row] = await db
      .select({
        onboardingStatus: organizations.onboardingStatus,
        onboardingStep: organizations.onboardingStep,
        onboardingProfile: organizations.onboardingProfile,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);
    org = row ?? null;
  } catch (e: any) {
    if (e?.message?.includes('onboarding_profile') || e?.message?.includes('Unknown column')) {
      const [row] = await db
        .select({
          onboardingStatus: organizations.onboardingStatus,
          onboardingStep: organizations.onboardingStep,
        })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1)
        .catch(() => [null]);
      org = row ? { ...row, onboardingProfile: null } : null;
    } else {
      throw e;
    }
  }

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
    profilePhotoUrl: storedProfile.profilePhotoUrl ?? null,
  };

  let currentStep: OnboardingStep = "name";
  if (org?.onboardingStep && org.onboardingStep > 0) {
    const stepMap: Record<number, OnboardingStep> = {
      1: "name", 2: "title", 3: "profile_photo", 4: "programs", 5: "rank",
      6: "school_name", 7: "martial_style", 8: "address", 9: "city_state_zip",
      10: "phone", 11: "email", 12: "website", 13: "logo_light", 14: "logo_dark", 99: "complete",
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

  try {
    await db
      .update(organizations)
      .set({
        onboardingStatus: state.step === "complete" ? "completed" : "in_progress",
        onboardingStep: stepNumber,
        onboardingProfile: JSON.stringify(state.profile),
      } as any)
      .where(eq(organizations.id, orgId));
    return;
  } catch (e: any) {
    const isColumnMissing = e?.message?.includes('onboarding_profile') || e?.message?.includes('Unknown column');
    if (!isColumnMissing) throw e;
    console.warn('[OnboardingSM] onboarding_profile column missing, saving without it');
  }

  await db
    .update(organizations)
    .set({
      onboardingStatus: state.step === "complete" ? "completed" : "in_progress",
      onboardingStep: stepNumber,
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
  name: 1, title: 2, profile_photo: 3, programs: 4, rank: 5, school_name: 6,
  martial_style: 7, address: 8, city_state_zip: 9, phone: 10,
  email: 11, website: 12, logo_light: 13, logo_dark: 14, complete: 99,
};

// ─── Result type ──────────────────────────────────────────────────────────────

export interface ProcessStepResult {
  kaiMessage: string;
  nextStep: OnboardingStep;
  profile: OnboardingProfile;
  stepCompleted: boolean;
  isComplete: boolean;
  expectsFileUpload: boolean;
  showSkip: boolean;
  showBack: boolean;
  correctionStep?: OnboardingStep;
}

// ─── Main state machine processor ────────────────────────────────────────────

export async function processOnboardingStep(
  orgId: number,
  userId: number,
  currentStep: OnboardingStep,
  userInput: string,
  currentProfile: OnboardingProfile,
  hasMartialArts: boolean
): Promise<ProcessStepResult> {
  const input = userInput.trim().replace(/^[^a-zA-Z0-9]+/, '');
  const titleName = currentProfile.title && currentProfile.name
    ? `${currentProfile.title} ${currentProfile.name}`
    : currentProfile.name || "there";

  const hasPrev = getPrevStep(currentStep, hasMartialArts) !== null;

  // ── NLU: Run intent detection FIRST on every input ────────────────────────────
  const nlu = detectIntent(input, currentStep);

  // ── NLU Priority 1: Back intent ──────────────────────────────────────────────
  if (nlu.intent === "back") {
    const prevStep = getPrevStep(currentStep, hasMartialArts);
    if (!prevStep) {
      return {
        kaiMessage: `You're already at the start of the activation sequence.\n\n${getStepQuestion(currentStep, currentProfile)}`,
        nextStep: currentStep,
        profile: currentProfile,
        stepCompleted: false,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: currentStep !== "name" && currentStep !== "programs",
        showBack: false,
      };
    }
    return {
      kaiMessage: getStepQuestion(prevStep, currentProfile),
      nextStep: prevStep,
      profile: currentProfile,
      stepCompleted: false,
      isComplete: false,
      expectsFileUpload: prevStep === "logo_light" || prevStep === "logo_dark",
      showSkip: prevStep !== "name" && prevStep !== "programs",
      showBack: getPrevStep(prevStep, hasMartialArts) !== null,
    };
  }

  // ── NLU Priority 2: Identity/title/name update (mid-flow correction) ───────────
  if (
    nlu.intent === "identity_update" ||
    nlu.intent === "title_update" ||
    nlu.intent === "name_update"
  ) {
    let updatedProfile = { ...currentProfile };

    // Apply the extracted entities
    if (nlu.entities.title) {
      const toTitleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
      updatedProfile.title = toTitleCase(nlu.entities.title);
      await persistProfileField(orgId, "title", updatedProfile.title);
    }
    if (nlu.entities.fullName) {
      const toTitleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());
      updatedProfile.name = toTitleCase(nlu.entities.fullName);
      await persistProfileField(orgId, "name", updatedProfile.name);
      // Also update users.name
      try {
        const db = await getDb();
        const fullDisplayName = updatedProfile.title
          ? `${updatedProfile.title} ${updatedProfile.name}`
          : updatedProfile.name;
        if (db) await db.update(users).set({ name: fullDisplayName, updatedAt: new Date().toISOString() }).where(eq(users.id, userId));
      } catch (e) { console.error('[OnboardingSM] NLU: Failed to update users.name:', e); }
    }

    // If we're currently on name or title step, this IS the answer — advance
    if (currentStep === "name" || currentStep === "title") {
      const next = getNextStep(currentStep, updatedProfile, hasMartialArts);
      const displayName = updatedProfile.title && updatedProfile.name
        ? `${updatedProfile.title} ${updatedProfile.name}`
        : updatedProfile.name || updatedProfile.title || "there";
      return {
        kaiMessage: `Got it, **${displayName}**.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: next !== "name" && next !== "programs",
        showBack: true,
      };
    }

    // Mid-flow: acknowledge correction, stay on current step
    const ackMessage = buildCorrectionAck(nlu, currentStep, updatedProfile);
    return {
      kaiMessage: ackMessage,
      nextStep: currentStep,
      profile: updatedProfile,
      stepCompleted: false,
      isComplete: false,
      expectsFileUpload: currentStep === "logo_light" || currentStep === "logo_dark",
      showSkip: currentStep !== "name" && currentStep !== "programs",
      showBack: hasPrev,
    };
  }

  // ── NLU Priority 3: Correction (field-targeted, no entity extracted) ────────
  if (nlu.intent === "correction") {
    const lower = input.toLowerCase();
    let correctionStep: OnboardingStep = currentStep;
    if (lower.includes("name")) correctionStep = "name";
    else if (lower.includes("title")) correctionStep = "title";
    else if (lower.includes("program") || lower.includes("teach")) correctionStep = "programs";
    else if (lower.includes("rank") || lower.includes("belt")) correctionStep = "rank";
    else if (lower.includes("school") || lower.includes("dojo")) correctionStep = "school_name";
    else if (lower.includes("style") || lower.includes("martial")) correctionStep = "martial_style";
    else if (/\b(street|my address|home address|business address)\b/i.test(input)) correctionStep = "address";
    else if (lower.includes("city") || lower.includes("state") || lower.includes("zip")) correctionStep = "city_state_zip";
    else if (lower.includes("phone")) correctionStep = "phone";
    else if (lower.includes("email")) correctionStep = "email";
    else if (lower.includes("website") || lower.includes("url")) correctionStep = "website";
    return {
      kaiMessage: `No problem — let's go back to that.\n\n${getStepQuestion(correctionStep, currentProfile)}`,
      nextStep: correctionStep,
      profile: currentProfile,
      stepCompleted: false,
      isComplete: false,
      expectsFileUpload: correctionStep === "logo_light" || correctionStep === "logo_dark",
      showSkip: correctionStep !== "name" && correctionStep !== "title" && correctionStep !== "programs",
      showBack: false,
      correctionStep,
    };
  }

  // ── NLU Priority 4: Objection / question ──────────────────────────────────
  if (nlu.intent === "objection" || (nlu.intent === "question" && currentStep !== "name" && currentStep !== "programs")) {
    return {
      kaiMessage: buildObjectionResponse(currentStep, currentProfile),
      nextStep: currentStep,
      profile: currentProfile,
      stepCompleted: false,
      isComplete: false,
      expectsFileUpload: currentStep === "logo_light" || currentStep === "logo_dark",
      showSkip: currentStep !== "name" && currentStep !== "programs",
      showBack: hasPrev,
    };
  }

  // ── NLU Priority 5: Skip intent (free text) ───────────────────────────────
  // (Handled per-step below, but we normalise the input to "skip" so step logic picks it up)
  const normalisedInput = nlu.intent === "skip" ? "skip" : input;
  // ── Process each step ──────────────────────────────────────────────────────
  switch (currentStep) {
    case "name": {
      const validation = validateName(normalisedInput);
      if (!validation.valid) {
        const errorMsg =
          validation.error === "greeting"
            ? `I appreciate the greeting — but I need your **actual name** to initialize your profile. What should I call you?`
            : `That doesn't register as a name. Give me your **first name** — or the name you go by.`;
        return {
          kaiMessage: errorMsg,
          nextStep: "name",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: false,
          showBack: false,
        };
      }
      const name = normalisedInput;
      const updatedProfile = { ...currentProfile, name };
      await persistProfileField(orgId, "name", name);
      try {
        const db = await getDb();
        if (db) {
          await db.update(users).set({ name, updatedAt: new Date().toISOString() }).where(eq(users.id, userId));
        }
      } catch (e) {
        console.error('[OnboardingSM] Failed to update users.name:', e);
      }
      const next = getNextStep("name", updatedProfile, hasMartialArts);
      return {
          kaiMessage: `Got it, **${name}**.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: false,
        showBack: false,
      };
    }

    case "title": {
      if (isSkip(normalisedInput)) {
        const next = getNextStep("title", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — you can add a title anytime in **Settings → Profile**.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      const validation = validateTitle(normalisedInput);
      if (!validation.valid) {
        return {
          kaiMessage: `Just need a title to address you properly — for example: **Sensei, Sifu, Coach, Professor, or Master**. What do you go by?`,
          nextStep: "title",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      const toTitleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      const title = toTitleCase(normalisedInput);
      const updatedProfile = { ...currentProfile, title };
      await persistProfileField(orgId, "title", title);
      const fullTitleName = `${title} ${currentProfile.name || ""}`.trim();
      try {
        const db = await getDb();
        if (db) {
          await db.update(users).set({ name: fullTitleName, updatedAt: new Date().toISOString() }).where(eq(users.id, userId));
        }
      } catch (e) {
        console.error('[OnboardingSM] Failed to update users.name with title:', e);
      }
      const next = getNextStep("title", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `Got it — I'll call you **${fullTitleName}** throughout your system.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: false,
        showBack: true,
      };
    }

    case "profile_photo": {
      // Skip if NLU detected skip intent or explicit skip phrases
      const photoNormInput = normalisedInput;
      if (isSkip(photoNormInput) || /^(no|later|not now|no thanks|maybe later|pass|next|continue|move on)$/i.test(photoNormInput)) {
        const next = getNextStep("profile_photo", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — you can add a photo anytime in **Settings → Profile**.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: false,
          showBack: true,
        };
      }
      const isUrl = photoNormInput.startsWith('http://') || photoNormInput.startsWith('https://');
      if (isUrl) {
        const updatedProfile = { ...currentProfile, profilePhotoUrl: photoNormInput };
        try {
          const db = await getDb();
          if (db) {
            await db.update(users).set({ photoUrl: photoNormInput, photoUrlSmall: photoNormInput, updatedAt: new Date().toISOString() }).where(eq(users.id, userId));
          }
        } catch (e) {
          console.error('[OnboardingSM] Failed to update users.photoUrl:', e);
        }
        const next = getNextStep("profile_photo", updatedProfile, hasMartialArts);
        return {
          kaiMessage: `Photo added — looking good. 📸\n\n${getStepQuestion(next, updatedProfile)}`,
          nextStep: next,
          profile: updatedProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: false,
          showBack: true,
        };
      }
      // Free text on photo step — interpret it intelligently instead of ignoring
      // If it looks like they're asking something or expressing intent, respond contextually
      const next = getNextStep("profile_photo", currentProfile, hasMartialArts);
      const displayName = currentProfile.title && currentProfile.name
        ? `${currentProfile.title} ${currentProfile.name}`
        : currentProfile.name || "there";
      return {
        kaiMessage: `Use the **Upload Photo** button below, ${displayName} — or tap **Skip** if you'd rather do it later.`,
        nextStep: "profile_photo",
        profile: currentProfile,
        stepCompleted: false,
        isComplete: false,
        expectsFileUpload: true,
        showSkip: true,
        showBack: true,
      };
    }

    case "programs": {
      const validation = validatePrograms(normalisedInput);
      if (!validation.valid) {
        return {
          kaiMessage: `What do you teach? List your programs and I'll get your system set up.\n\n*(e.g., Brazilian Jiu-Jitsu, Muay Thai, Gymnastics, Yoga)*`,
          nextStep: "programs",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: false,
          showBack: true,
        };
      }
      const programs = parsePrograms(normalisedInput);
      const newHasMartialArts = programs.some((p) => detectsMartialArts(p));
      const updatedProfile = { ...currentProfile, programs };
      await persistProfileField(orgId, "programs", programs);
      const next = getNextStep("programs", updatedProfile, newHasMartialArts);
      const programList = programs.join(", ");
      const martialArtsNote = newHasMartialArts
        ? " Since you teach martial arts, I have one additional field to configure."
        : "";
      return {
        kaiMessage: `Great — **${programList}** added to your roster.${martialArtsNote}\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: false,
        showBack: true,
      };
    }

    case "rank": {
      if (isSkip(normalisedInput)) {
        const next = getNextStep("rank", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — you can add your rank anytime in Settings.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      if (normalisedInput.length < 2) {
        return {
          kaiMessage: `What's your rank or belt? *(e.g., Black Belt 2nd Degree, Brown Belt, Head Instructor)*`,
          nextStep: "rank",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      await persistProfileField(orgId, "title", currentProfile.title || "");
      const db = await getDb();
      if (db) {
        await db.update(dojoSettings)
          .set({ ownerRank: normalisedInput, updatedAt: new Date().toISOString() } as any)
          .where(eq(dojoSettings.organizationId, orgId));
      }
      const next = getNextStep("rank", currentProfile, hasMartialArts);
      return {
        kaiMessage: `Got it — **${normalisedInput}**. 🏅\n\n${getStepQuestion(next, currentProfile)}`,
        nextStep: next,
        profile: currentProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: false,
        showBack: true,
      };
    }

    case "school_name": {
      const validation = validateSchoolName(normalisedInput);
      if (!validation.valid) {
        return {
          kaiMessage: `What's the official name of your school or dojo?`,
          nextStep: "school_name",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: false,
          showBack: true,
        };
      }
      const schoolName = normalisedInput;
      const updatedProfile = { ...currentProfile, schoolName };
      await persistProfileField(orgId, "schoolName", schoolName);
      const next = getNextStep("school_name", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `**${schoolName}** — got it. 🏆\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: false,
        showBack: true,
      };
    }

    case "martial_style": {
      if (isSkip(normalisedInput)) {
        const next = getNextStep("martial_style", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — you can add your style anytime in Settings.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      const styles = parsePrograms(normalisedInput);
      const updatedProfile = { ...currentProfile, styles };
      await persistProfileField(orgId, "styles", styles);
      const next = getNextStep("martial_style", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `**${styles.join(", ")}** — noted.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: true,
        showBack: true,
      };
    }

    case "address": {
      if (isSkip(normalisedInput)) {
        const next = getNextStep("address", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — you can add your address anytime in **Settings → School Profile**.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      if (normalisedInput.length < 3) {
        return {
          kaiMessage: `What's your school's street address? *(e.g., 123 Main Street)*`,
          nextStep: "address",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      const updatedProfile = { ...currentProfile, addressStreet: normalisedInput };
      await upsertSchoolProfile(orgId, { addressStreet: normalisedInput });
      const next = getNextStep("address", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `Got it — **${normalisedInput}**.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: true,
        showBack: true,
      };
    }

    case "city_state_zip": {
      if (isSkip(normalisedInput)) {
        const next = getNextStep("city_state_zip", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — you can add this anytime in **Settings → School Profile**.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      const parts = normalisedInput.split(/[,\s]+/);
      let city = "", state = "", postal = "";
      if (parts.length >= 3) {
        postal = parts[parts.length - 1];
        state = parts[parts.length - 2];
        city = parts.slice(0, parts.length - 2).join(" ");
      } else if (parts.length === 2) {
        state = parts[1];
        city = parts[0];
      } else {
        city = normalisedInput;
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
        showBack: true,
      };
    }

    case "phone": {
      if (isSkip(normalisedInput)) {
        const next = getNextStep("phone", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — you can add a phone number anytime in **Settings → School Profile**.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      const updatedProfile = { ...currentProfile, phone: normalisedInput };
      await upsertSchoolProfile(orgId, { phone: normalisedInput });
      const next = getNextStep("phone", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `Got it — **${normalisedInput}**.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: true,
        showBack: true,
      };
    }

    case "email": {
      if (isSkip(normalisedInput)) {
        const next = getNextStep("email", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — you can add an email anytime in **Settings → School Profile**.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      if (!normalisedInput.includes("@") || !input.includes(".")) {
        return {
          kaiMessage: `That doesn't look like a valid email. Try something like *info@${profile.schoolName ? profile.schoolName.toLowerCase().replace(/\s+/g, '') + '.com' : 'yourdojo.com'}*.`,
          nextStep: "email",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      const updatedProfile = { ...currentProfile, email: normalisedInput };
      await upsertSchoolProfile(orgId, { email: normalisedInput });
      const next = getNextStep("email", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `Got it — **${normalisedInput}**.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: true,
        showBack: true,
      };
    }

    case "website": {
      if (isSkip(normalisedInput)) {
        const next = getNextStep("website", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — you can add your website anytime in **Settings → School Profile**.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: next === "logo_light",
          showSkip: true,
          showBack: true,
        };
      }
      const website = normalisedInput.startsWith("http") ? normalisedInput : `https://${normalisedInput}`;
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
        showBack: true,
      };
    }

    case "logo_light":
    case "logo_dark": {
      if (isSkip(normalisedInput)) {
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
            showBack: false,
          };
        }
        return {
          kaiMessage: `No problem — you can upload your logo anytime in **Settings → School Profile**.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: next === "logo_dark",
          showSkip: true,
          showBack: true,
        };
      }
      // Free text on logo step — respond contextually
      const logoDisplayName = currentProfile.title && currentProfile.name
        ? `${currentProfile.title} ${currentProfile.name}`
        : currentProfile.name || "there";
      const logoVariant = currentStep === "logo_light" ? "light mode" : "dark mode";
      return {
        kaiMessage: `Use the **Upload Logo** button below to upload your ${logoVariant} logo, ${logoDisplayName} — or tap **Skip** to continue without one.`,
        nextStep: currentStep,
        profile: currentProfile,
        stepCompleted: false,
        isComplete: false,
        expectsFileUpload: true,
        showSkip: true,
        showBack: true,
      };
    }

    default:
      return {
        kaiMessage: getStepQuestion("name", currentProfile),
        nextStep: "name",
        profile: currentProfile,
        stepCompleted: false,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: false,
        showBack: false,
      };
  }
}

function buildCompletionMessage(profile: OnboardingProfile, hasMartialArts: boolean): string {
  const titleName = profile.title && profile.name
    ? `${profile.title} ${profile.name}`
    : profile.name || "there";
  const schoolName = profile.schoolName || "your school";
  const programList = profile.programs.length > 0 ? profile.programs.join(", ") : null;

  return `You're all set, **${titleName}**. ✅\n\n**${schoolName}** is live in DojoFlow${programList ? ` — running **${programList}**` : ""}.\n\nI'm here whenever you need me — students, leads, attendance, scheduling. **What would you like to do first?**`;
}

// ─── tRPC Router ──────────────────────────────────────────────────────────────

export const kaiOnboardingStateMachineRouter = router({
  /**
   * Get the current onboarding status and profile.
   */
  getStatus: orgScopedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const orgId = ctx.currentOrganizationId;

    let org: { onboardingStatus: string | null; onboardingStep: number | null; onboardingProfile?: string | null } | null = null;
    try {
      const [row] = await db
        .select({
          onboardingStatus: organizations.onboardingStatus,
          onboardingStep: organizations.onboardingStep,
          onboardingProfile: organizations.onboardingProfile,
        })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);
      org = row ?? null;
    } catch (e: any) {
      if (e?.message?.includes('onboarding_profile') || e?.message?.includes('Unknown column')) {
        const [row] = await db
          .select({
            onboardingStatus: organizations.onboardingStatus,
            onboardingStep: organizations.onboardingStep,
          })
          .from(organizations)
          .where(eq(organizations.id, orgId))
          .limit(1)
          .catch(() => [null]);
        org = row ? { ...row, onboardingProfile: null } : null;
      } else {
        throw e;
      }
    }

    const isCompleted = org?.onboardingStatus === "completed" || org?.onboardingStatus === "skipped";

    if (isCompleted) {
      return { needsOnboarding: false, isCompleted: true, step: "complete" as OnboardingStep, profile: null, stepNumber: null, totalSteps: null };
    }

    const state = await loadOnboardingState(orgId);
    const progress = getStepProgress(state.step, state.hasMartialArts);

    return {
      needsOnboarding: true,
      isCompleted,
      step: state.step,
      profile: state.profile,
      hasMartialArts: state.hasMartialArts,
      stepNumber: progress.stepNumber,
      totalSteps: progress.totalSteps,
    };
  }),

  /**
   * Process a single onboarding step.
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
        ctx.user.id,
        input.currentStep,
        input.userInput,
        input.currentProfile,
        input.hasMartialArts
      );

      const newHasMartialArts = input.currentStep === "programs"
        ? result.profile.programs.some((p) => detectsMartialArts(p))
        : input.hasMartialArts;

      const stepNumber = STEP_NUMBERS[result.nextStep] || 1;
      try {
        await saveOnboardingState(
          orgId,
          { step: result.nextStep, profile: result.profile, completedSteps: [], hasMartialArts: newHasMartialArts },
          stepNumber
        );
      } catch (saveErr) {
        console.error('[OnboardingSM] saveOnboardingState failed (non-fatal):', saveErr);
      }

      if (result.isComplete) {
        try {
          const db = await getDb();
          if (db) {
            await db.update(dojoSettings)
              .set({ setupCompleted: 1, updatedAt: new Date().toISOString() } as any)
              .where(eq(dojoSettings.organizationId, orgId));
          }
        } catch (completeErr) {
          console.error('[OnboardingSM] Failed to mark setup completed:', completeErr);
        }
      }

      const progress = getStepProgress(result.nextStep, newHasMartialArts);

      return {
        ...result,
        hasMartialArts: newHasMartialArts,
        stepNumber: progress.stepNumber,
        totalSteps: progress.totalSteps,
      };
    }),

  /**
   * Go back to the previous onboarding step.
   */
  goBack: orgScopedProcedure
    .input(
      z.object({
        currentStep: z.enum(ONBOARDING_STEPS),
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
      const prevStep = getPrevStep(input.currentStep, input.hasMartialArts);

      if (!prevStep) {
        const progress = getStepProgress(input.currentStep, input.hasMartialArts);
        return {
          kaiMessage: getStepQuestion(input.currentStep, input.currentProfile),
          nextStep: input.currentStep,
          profile: input.currentProfile,
          hasMartialArts: input.hasMartialArts,
          stepNumber: progress.stepNumber,
          totalSteps: progress.totalSteps,
          showBack: false,
          showSkip: input.currentStep !== "name" && input.currentStep !== "title" && input.currentStep !== "programs",
        };
      }

      const stepNumber = STEP_NUMBERS[prevStep] || 1;
      try {
        await saveOnboardingState(
          orgId,
          { step: prevStep, profile: input.currentProfile, completedSteps: [], hasMartialArts: input.hasMartialArts },
          stepNumber
        );
      } catch (e) {
        console.error('[OnboardingSM] goBack saveOnboardingState failed (non-fatal):', e);
      }

      const progress = getStepProgress(prevStep, input.hasMartialArts);
      const hasPrev = getPrevStep(prevStep, input.hasMartialArts) !== null;

      return {
        kaiMessage: getStepQuestion(prevStep, input.currentProfile),
        nextStep: prevStep,
        profile: input.currentProfile,
        hasMartialArts: input.hasMartialArts,
        stepNumber: progress.stepNumber,
        totalSteps: progress.totalSteps,
        showBack: hasPrev,
        showSkip: prevStep !== "name" && prevStep !== "title" && prevStep !== "programs",
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
        await db.update(dojoSettings)
          .set({ setupCompleted: 1, updatedAt: new Date().toISOString() } as any)
          .where(eq(dojoSettings.organizationId, orgId));
        await db.update(organizations)
          .set({ onboardingStatus: "completed", onboardingStep: 99 } as any)
          .where(eq(organizations.id, orgId));
      } else {
        const fileName = input.fileName || (isLight ? "Day Mode logo" : "Dark Mode logo");
        kaiMessage = `✅ **${fileName}** activated.\n\n${getStepQuestion(nextStep, updatedProfile)}`;
      }

      const progress = getStepProgress(nextStep, input.hasMartialArts);

      return {
        kaiMessage,
        nextStep,
        profile: updatedProfile,
        isComplete,
        expectsFileUpload: nextStep === "logo_dark",
        showSkip: true,
        showBack: !isComplete,
        stepNumber: progress.stepNumber,
        totalSteps: progress.totalSteps,
      };
    }),

  /**
   * Reset onboarding so the user can start fresh from step 1.
   */
  resetOnboarding: orgScopedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const orgId = ctx.currentOrganizationId;

    try {
      await db.update(organizations)
        .set({ onboardingStatus: "pending", onboardingStep: 0, onboardingProfile: null } as any)
        .where(eq(organizations.id, orgId));
    } catch (e: any) {
      await db.update(organizations)
        .set({ onboardingStatus: "pending", onboardingStep: 0 } as any)
        .where(eq(organizations.id, orgId));
    }

    try {
      await db.update(dojoSettings)
        .set({ setupCompleted: 0, updatedAt: new Date().toISOString() } as any)
        .where(eq(dojoSettings.organizationId, orgId));
    } catch {}

    return { success: true };
  }),
});
