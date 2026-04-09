import { z } from "zod";
import { router, orgScopedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { dojoSettings, organizations, schoolProfiles, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { upsertSchoolProfile } from "./schoolProfileDb";
import { storagePut } from "./storage.js";

// ─── Re-export shared types (no server deps) ─────────────────────────────────
export { ONBOARDING_STEPS, getStepQuestion } from "../shared/onboarding";
export type { OnboardingStep, OnboardingProfile, OnboardingState } from "../shared/onboarding";
import type { OnboardingStep, OnboardingProfile, OnboardingState } from "../shared/onboarding";
import {
  ONBOARDING_STEPS,
  getStepQuestion,
  detectIntent,
  buildCorrectionAck,
  buildObjectionResponse,
  parseAddress,
  microAck,
  buildSaveConfirmation,
  isValidHexColor,
  normalizeHexColor,
  normalizeTimezone,
  normalizeCurrency,
} from "../shared/onboarding";

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

function validateName(text: string): { valid: boolean; error?: string } {
  const t = text.trim();
  if (isGreeting(t)) return { valid: false, error: "greeting" };
  if (t.length < 2) return { valid: false, error: "too_short" };
  if (t.length > 100) return { valid: false, error: "too_long" };
  if (/^\d+$/.test(t)) return { valid: false, error: "numbers_only" };
  return { valid: true };
}

function validateTitle(text: string): { valid: boolean; error?: string } {
  const t = text.trim();
  if (t.length < 2) return { valid: false, error: "too_short" };
  if (/^\d+$/.test(t)) return { valid: false, error: "numbers_only" };
  return { valid: true };
}

function validatePrograms(text: string): { valid: boolean; error?: string } {
  const t = text.trim();
  if (isGreeting(t)) return { valid: false, error: "greeting" };
  if (t.length < 3) return { valid: false, error: "too_short" };
  return { valid: true };
}

function validateSchoolName(text: string): { valid: boolean; error?: string } {
  const t = text.trim();
  if (isGreeting(t)) return { valid: false, error: "greeting" };
  if (t.length < 2) return { valid: false, error: "too_short" };
  return { valid: true };
}

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
    "display_name",
    "tagline",
    ...(hasMartialArts ? ["martial_style" as OnboardingStep] : []),
    "address",
    "city_state_zip",
    "country",
    "phone",
    "email",
    "website",
    "logo_light",
    "logo_dark",
    "icon_logo_light",
    "icon_logo_dark",
    "brand_colors",
    "timezone",
    "currency",
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
  const idx = flow.indexOf(step as Exclude<OnboardingStep, "complete">);
  return {
    stepNumber: idx === -1 ? flow.length : idx + 1,
    totalSteps: flow.length,
  };
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function loadOnboardingState(orgId: number, userId?: number): Promise<OnboardingState> {
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

  let storedProfile: Partial<OnboardingProfile> & { completedSteps?: OnboardingStep[] } = {};
  if (org?.onboardingProfile) {
    try {
      storedProfile = JSON.parse(org.onboardingProfile as string);
    } catch {}
  }
  const loadedCompletedSteps: OnboardingStep[] = Array.isArray(storedProfile.completedSteps)
    ? storedProfile.completedSteps
    : [];

  const programs = storedProfile.programs ||
    (settings?.programsTaught ? parsePrograms(settings.programsTaught) : []);
  const hasMartialArts = programs.some((p) => detectsMartialArts(p));

  const onboardingProfile: OnboardingProfile = {
    name: storedProfile.name ?? settings?.operatorName ?? null,
    title: storedProfile.title ?? settings?.instructorTitle ?? null,
    programs,
    styles: storedProfile.styles ?? (settings?.martialArtsStyle ? [settings.martialArtsStyle] : []),
    schoolName: storedProfile.schoolName ?? profile?.schoolName ?? settings?.schoolName ?? null,
    displayName: storedProfile.displayName ?? profile?.displayName ?? null,
    tagline: storedProfile.tagline ?? profile?.tagline ?? null,
    addressStreet: storedProfile.addressStreet ?? profile?.addressStreet ?? null,
    addressCity: storedProfile.addressCity ?? profile?.addressCity ?? null,
    addressState: storedProfile.addressState ?? profile?.addressState ?? null,
    addressPostal: storedProfile.addressPostal ?? profile?.addressPostal ?? null,
    addressCountry: storedProfile.addressCountry ?? profile?.addressCountry ?? null,
    phone: storedProfile.phone ?? profile?.phone ?? null,
    email: storedProfile.email ?? profile?.email ?? null,
    website: storedProfile.website ?? profile?.website ?? null,
    logoLightUrl: storedProfile.logoLightUrl ?? profile?.logoLightUrl ?? null,
    logoDarkUrl: storedProfile.logoDarkUrl ?? profile?.logoDarkUrl ?? null,
    logoIconLightUrl: storedProfile.logoIconLightUrl ?? profile?.logoIconLightUrl ?? null,
    logoIconDarkUrl: storedProfile.logoIconDarkUrl ?? profile?.logoIconDarkUrl ?? null,
    brandColorPrimary: storedProfile.brandColorPrimary ?? profile?.brandColorPrimary ?? null,
    brandColorSecondary: storedProfile.brandColorSecondary ?? profile?.brandColorSecondary ?? null,
    brandColorTertiary: storedProfile.brandColorTertiary ?? profile?.brandColorTertiary ?? null,
    timezone: storedProfile.timezone ?? profile?.timezone ?? null,
    currency: storedProfile.currency ?? profile?.currency ?? null,
    profilePhotoUrl: storedProfile.profilePhotoUrl ?? null,
  };

  // Reality Check: load user's actual photo from users table
  if (userId && !onboardingProfile.profilePhotoUrl) {
    try {
      const [userRow] = await db
        .select({ photoUrl: users.photoUrl, name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (userRow?.photoUrl) {
        onboardingProfile.profilePhotoUrl = userRow.photoUrl;
      }
      if (!onboardingProfile.name && userRow?.name) {
        onboardingProfile.name = userRow.name;
      }
    } catch (e) {
      console.error('[OnboardingSM] Failed to load user data for reality check:', e);
    }
  }

  const realityCheckedStep = computeFirstIncompleteStep(onboardingProfile, hasMartialArts, loadedCompletedSteps);

  let currentStep: OnboardingStep = realityCheckedStep;
  if (org?.onboardingStep && org.onboardingStep > 0) {
    const stepMap: Record<number, OnboardingStep> = {
      1: "name", 2: "title", 3: "profile_photo", 4: "programs", 5: "rank",
      6: "school_name", 7: "display_name", 8: "tagline", 9: "martial_style",
      10: "address", 11: "city_state_zip", 12: "country", 13: "phone",
      14: "email", 15: "website", 16: "logo_light", 17: "logo_dark",
      18: "icon_logo_light", 19: "icon_logo_dark", 20: "brand_colors",
      21: "timezone", 22: "currency", 99: "complete",
    };
    const storedStep = stepMap[org.onboardingStep] || "name";
    const flow = buildFlow(hasMartialArts);
    const storedIdx = flow.indexOf(storedStep);
    const realityIdx = flow.indexOf(realityCheckedStep);
    currentStep = storedIdx >= realityIdx ? storedStep : realityCheckedStep;
  }

  return {
    step: currentStep,
    profile: onboardingProfile,
    completedSteps: loadedCompletedSteps,
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

  // Strip any raw base64 data URLs from the profile before persisting to the
  // TEXT column (65 KB limit). CDN URLs are short strings and safe to store;
  // base64-encoded images can easily exceed the limit and cause silent failures.
  const isBase64 = (v: unknown) => typeof v === 'string' && v.startsWith('data:');
  const safeProfile = Object.fromEntries(
    Object.entries(state.profile).map(([k, v]) => [k, isBase64(v) ? null : v])
  ) as typeof state.profile;
  const profileWithLocks = { ...safeProfile, completedSteps: state.completedSteps || [] };
  try {
    await db
      .update(organizations)
      .set({
        onboardingStatus: state.step === "complete" ? "completed" : "in_progress",
        onboardingStep: stepNumber,
        onboardingProfile: JSON.stringify(profileWithLocks),
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
      case "displayName":
        await upsertSchoolProfile(orgId, { displayName: stringValue });
        break;
      case "tagline":
        await upsertSchoolProfile(orgId, { tagline: stringValue });
        break;
      case "addressStreet":
        await upsertSchoolProfile(orgId, { addressStreet: stringValue });
        break;
      case "addressCity":
      case "addressState":
      case "addressPostal":
        break;
      case "addressCountry":
        await upsertSchoolProfile(orgId, { addressCountry: stringValue });
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
      case "timezone":
        await upsertSchoolProfile(orgId, { timezone: stringValue });
        break;
      case "currency":
        await upsertSchoolProfile(orgId, { currency: stringValue });
        break;
    }
  } catch (e) {
    console.error(`[OnboardingSM] Failed to persist field ${field}:`, e);
  }
}

// Step number map for DB storage
const STEP_NUMBERS: Record<OnboardingStep, number> = {
  name: 1, title: 2, profile_photo: 3, programs: 4, rank: 5,
  school_name: 6, display_name: 7, tagline: 8, martial_style: 9,
  address: 10, city_state_zip: 11, country: 12, phone: 13,
  email: 14, website: 15, logo_light: 16, logo_dark: 17,
  icon_logo_light: 18, icon_logo_dark: 19, brand_colors: 20,
  timezone: 21, currency: 22, complete: 99,
};

// ─── Reality Check: compute first step where data is actually missing ──────────

function computeFirstIncompleteStep(
  profile: OnboardingProfile,
  hasMartialArts: boolean,
  completedSteps: OnboardingStep[] = []
): OnboardingStep {
  const flow = buildFlow(hasMartialArts).filter((s) => s !== "complete");
  for (const step of flow) {
    if (completedSteps.includes(step)) continue;
    switch (step) {
      case "name":
        if (!profile.name?.trim()) return step;
        break;
      case "title":
        if (!profile.title?.trim()) return step;
        break;
      case "profile_photo":
        if (!profile.profilePhotoUrl?.trim()) return step;
        break;
      case "programs":
        if (!profile.programs || profile.programs.length === 0) return step;
        break;
      case "rank":
        // optional — skip if we've passed it
        break;
      case "school_name":
        if (!profile.schoolName?.trim()) return step;
        break;
      case "display_name":
        // optional — skip if not set
        break;
      case "tagline":
        // optional — skip if not set
        break;
      case "martial_style":
        // optional — skip if not set
        break;
      case "address":
        if (!profile.addressStreet?.trim()) return step;
        break;
      case "city_state_zip":
        if (!profile.addressCity?.trim() && !profile.addressPostal?.trim()) return step;
        break;
      case "country":
        // optional — skip if not set
        break;
      case "phone":
        if (!profile.phone?.trim()) return step;
        break;
      case "email":
        if (!profile.email?.trim()) return step;
        break;
      case "website":
        // optional — skip if not set
        break;
      case "logo_light":
        if (!profile.logoLightUrl?.trim()) return step;
        break;
      case "logo_dark":
        // optional — skip if not set
        break;
      case "icon_logo_light":
        // optional — skip if not set
        break;
      case "icon_logo_dark":
        // optional — skip if not set
        break;
      case "brand_colors":
        // optional — skip if not set
        break;
      case "timezone":
        // optional — skip if not set
        break;
      case "currency":
        // optional — skip if not set
        break;
    }
  }
  return "complete";
}

// ─── Truth Handling ───────────────────────────────────────────────────────────

type ClaimVerdict = "true" | "false" | "unknown";

interface ClaimEvaluation {
  verdict: ClaimVerdict;
  field: OnboardingStep | null;
  trueResponse?: string;
  falseResponse?: string;
}

const ALREADY_DONE_PATTERNS = [
  /\b(?:already|i(?:'ve| have)|done|uploaded|set|added|filled|completed|provided|entered|saved)\b/i,
  /\b(?:i did|that'?s\s+done|it'?s\s+(?:already\s+)?(?:set|done|there|uploaded|saved))\b/i,
  /\b(?:you\s+(?:already\s+)?have|you\s+(?:can\s+)?see|it\s+should\s+(?:be|show))\b/i,
  /\b(?:i\s+(?:just|already)\s+(?:did|uploaded|added|set|entered))\b/i,
];

function evaluateUserClaim(
  text: string,
  step: OnboardingStep,
  profile: OnboardingProfile
): ClaimEvaluation {
  const t = text.toLowerCase();
  const isAlreadyDoneClaim = ALREADY_DONE_PATTERNS.some((p) => p.test(text));

  if (!isAlreadyDoneClaim) {
    return { verdict: "unknown", field: null };
  }

  const displayName = (() => {
    if (profile.title && profile.name) {
      const nameLower = profile.name.toLowerCase();
      const titleLower = profile.title.toLowerCase();
      if (nameLower.startsWith(titleLower) || titleLower.startsWith(nameLower)) {
        return profile.name;
      }
      return `${profile.title} ${profile.name}`;
    }
    return profile.name || "there";
  })();

  let targetStep: OnboardingStep | null = null;

  if (/\b(?:photo|picture|image|headshot|avatar|profile\s+(?:photo|picture|image))\b/i.test(text)) {
    targetStep = "profile_photo";
  } else if (/\b(?:name|called|known\s+as)\b/i.test(text)) {
    targetStep = "name";
  } else if (/\b(?:title|sensei|sifu|coach|master|instructor|professor)\b/i.test(text)) {
    targetStep = "title";
  } else if (/\b(?:program|class|teach|discipline|course)\b/i.test(text)) {
    targetStep = "programs";
  } else if (/\b(?:school|dojo|academy|gym|studio)\b/i.test(text)) {
    targetStep = "school_name";
  } else if (/\b(?:display\s+name|short\s+name)\b/i.test(text)) {
    targetStep = "display_name";
  } else if (/\b(?:tagline|motto|slogan)\b/i.test(text)) {
    targetStep = "tagline";
  } else if (/\b(?:address|location|street)\b/i.test(text)) {
    targetStep = "address";
  } else if (/\b(?:country)\b/i.test(text)) {
    targetStep = "country";
  } else if (/\b(?:phone|number|contact)\b/i.test(text)) {
    targetStep = "phone";
  } else if (/\b(?:email|e-mail)\b/i.test(text)) {
    targetStep = "email";
  } else if (/\b(?:website|url|site|web\s+address)\b/i.test(text)) {
    targetStep = "website";
  } else if (/\b(?:icon|square\s+logo)\b/i.test(text)) {
    targetStep = t.includes("dark") ? "icon_logo_dark" : "icon_logo_light";
  } else if (/\b(?:logo)\b/i.test(text)) {
    targetStep = t.includes("dark") ? "logo_dark" : "logo_light";
  } else if (/\b(?:color|colour|brand)\b/i.test(text)) {
    targetStep = "brand_colors";
  } else if (/\b(?:timezone|time\s+zone)\b/i.test(text)) {
    targetStep = "timezone";
  } else if (/\b(?:currency|billing|payment)\b/i.test(text)) {
    targetStep = "currency";
  } else {
    targetStep = step;
  }

  let dataExists = false;
  switch (targetStep) {
    case "name": dataExists = !!profile.name?.trim(); break;
    case "title": dataExists = !!profile.title?.trim(); break;
    case "profile_photo": dataExists = !!profile.profilePhotoUrl?.trim(); break;
    case "programs": dataExists = profile.programs.length > 0; break;
    case "school_name": dataExists = !!profile.schoolName?.trim(); break;
    case "display_name": dataExists = !!profile.displayName?.trim(); break;
    case "tagline": dataExists = !!profile.tagline?.trim(); break;
    case "address": dataExists = !!profile.addressStreet?.trim(); break;
    case "city_state_zip": dataExists = !!profile.addressCity?.trim() || !!profile.addressPostal?.trim(); break;
    case "country": dataExists = !!profile.addressCountry?.trim(); break;
    case "phone": dataExists = !!profile.phone?.trim(); break;
    case "email": dataExists = !!profile.email?.trim(); break;
    case "website": dataExists = !!profile.website?.trim(); break;
    case "logo_light": dataExists = !!profile.logoLightUrl?.trim(); break;
    case "logo_dark": dataExists = !!profile.logoDarkUrl?.trim(); break;
    case "icon_logo_light": dataExists = !!profile.logoIconLightUrl?.trim(); break;
    case "icon_logo_dark": dataExists = !!profile.logoIconDarkUrl?.trim(); break;
    case "brand_colors": dataExists = !!profile.brandColorPrimary?.trim(); break;
    case "timezone": dataExists = !!profile.timezone?.trim(); break;
    case "currency": dataExists = !!profile.currency?.trim(); break;
    default: return { verdict: "unknown", field: targetStep };
  }

  if (dataExists) {
    const trueResponses: Partial<Record<OnboardingStep, string>> = {
      profile_photo: `You're right — I can see your photo is already set, ${displayName}. You're all set there.`,
      name: `Got it — your name is already on file as **${profile.name}**.`,
      title: `Noted — your title is already set to **${profile.title}**.`,
      programs: `You're right — your programs are already set: **${profile.programs.join(", ")}**.`,
      school_name: `Correct — **${profile.schoolName}** is already in your profile.`,
      display_name: `Got it — your display name is already set to **${profile.displayName}**.`,
      tagline: `Correct — your tagline is already saved: *"${profile.tagline}"*.`,
      address: `Got it — your address is already set to **${profile.addressStreet}**.`,
      country: `Correct — your country is already set to **${profile.addressCountry}**.`,
      phone: `Correct — your phone number is already on file: **${profile.phone}**.`,
      email: `You're right — your email is already set to **${profile.email}**.`,
      website: `Got it — your website is already linked: **${profile.website}**.`,
      logo_light: `You're right — your day mode logo is already uploaded.`,
      logo_dark: `Correct — your dark mode logo is already uploaded.`,
      icon_logo_light: `You're right — your light icon logo is already uploaded.`,
      icon_logo_dark: `Correct — your dark icon logo is already uploaded.`,
      brand_colors: `Got it — your brand colors are already set.`,
      timezone: `Correct — your timezone is already set to **${profile.timezone}**.`,
      currency: `Got it — your currency is already set to **${profile.currency}**.`,
    };
    return {
      verdict: "true",
      field: targetStep,
      trueResponse: trueResponses[targetStep] || `You're all set there, ${displayName}.`,
    };
  } else {
    const falseResponses: Partial<Record<OnboardingStep, string>> = {
      profile_photo: `I don't see a profile photo on file yet, ${displayName}. Go ahead and upload one using the button below — or skip if you'd prefer to do it later.`,
      name: `I don't have a name on file yet. What should I call you?`,
      title: `I don't have a title set for you yet. How should I address you?`,
      programs: `I don't see any programs listed yet. What do you teach?`,
      school_name: `I don't have a school name on file yet. What's the official name of your school?`,
      display_name: `I don't have a display name set yet. What should I use as the short name?`,
      tagline: `I don't have a tagline on file yet. What's your school's motto or tagline?`,
      address: `I don't have an address on file yet. What's your school's street address?`,
      country: `I don't have a country on file yet. What country is your school in?`,
      phone: `I don't see a phone number on file yet. What's the best number for your school?`,
      email: `I don't have an email address on file yet. What email should students use to reach you?`,
      website: `I don't have a website on file yet. Do you have a school website?`,
      logo_light: `I don't see a day mode logo uploaded yet. Use the Upload button below to add one.`,
      logo_dark: `I don't see a dark mode logo uploaded yet. Use the Upload button below to add one.`,
      icon_logo_light: `I don't see a light icon logo uploaded yet. Use the Upload button below to add one.`,
      icon_logo_dark: `I don't see a dark icon logo uploaded yet. Use the Upload button below to add one.`,
      brand_colors: `I don't have brand colors on file yet. What's your primary brand color?`,
      timezone: `I don't have a timezone set yet. What timezone is your school in?`,
      currency: `I don't have a currency set yet. What currency does your school use?`,
    };
    return {
      verdict: "false",
      field: targetStep,
      falseResponse: falseResponses[targetStep] || `I don't see that information on file yet. Let's take care of it now.`,
    };
  }
}

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
  _completedStepsToAdd?: OnboardingStep[];
}

// ─── Helper: is this step a logo/file upload step? ────────────────────────────

function isUploadStep(step: OnboardingStep): boolean {
  return step === "logo_light" || step === "logo_dark" || step === "icon_logo_light" || step === "icon_logo_dark";
}

function getLogoUploadType(step: OnboardingStep): "light" | "dark" | "icon-light" | "icon-dark" | undefined {
  if (step === "logo_light") return "light";
  if (step === "logo_dark") return "dark";
  if (step === "icon_logo_light") return "icon-light";
  if (step === "icon_logo_dark") return "icon-dark";
  return undefined;
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
  const input = userInput.trim().replace(/^[^a-zA-Z0-9#]+/, '');
  // Deduplicate title+name: if name already starts with the title, don't prepend it again
  const titleName = (() => {
    if (currentProfile.title && currentProfile.name) {
      const nameLower = currentProfile.name.toLowerCase();
      const titleLower = currentProfile.title.toLowerCase();
      if (nameLower.startsWith(titleLower) || titleLower.startsWith(nameLower)) {
        return currentProfile.name; // name already includes the title (or vice versa)
      }
      return `${currentProfile.title} ${currentProfile.name}`;
    }
    return currentProfile.name || "there";
  })();

  const hasPrev = getPrevStep(currentStep, hasMartialArts) !== null;

  // ── NLU: Run intent detection FIRST ──────────────────────────────────────────
  const nlu = detectIntent(input, currentStep);

  // ── Truth Handling ────────────────────────────────────────────────────────────
  if (
    nlu.intent === "unknown" ||
    nlu.intent === "confirmation" ||
    nlu.intent === "question"
  ) {
    const claim = evaluateUserClaim(input, currentStep, currentProfile);

    if (claim.verdict === "true" && claim.field) {
      const next = getNextStep(currentStep, currentProfile, hasMartialArts);
      const nextQuestion = next !== "complete" ? `\n\n${getStepQuestion(next, currentProfile)}` : "";
      return {
        kaiMessage: `${claim.trueResponse}${nextQuestion}`,
        nextStep: next,
        profile: currentProfile,
        stepCompleted: true,
        isComplete: next === "complete",
        expectsFileUpload: isUploadStep(next),
        showSkip: next !== "name" && next !== "programs" && next !== "complete",
        showBack: hasPrev,
      };
    }

    if (claim.verdict === "false" && claim.field) {
      return {
        kaiMessage: claim.falseResponse!,
        nextStep: currentStep,
        profile: currentProfile,
        stepCompleted: false,
        isComplete: false,
        expectsFileUpload: isUploadStep(currentStep) || currentStep === "profile_photo",
        showSkip: currentStep !== "name" && currentStep !== "programs",
        showBack: hasPrev,
      };
    }
  }

  // ── NLU Priority 1: Back ──────────────────────────────────────────────────────
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
      expectsFileUpload: isUploadStep(prevStep),
      showSkip: prevStep !== "name" && prevStep !== "programs",
      showBack: getPrevStep(prevStep, hasMartialArts) !== null,
    };
  }

  // ── NLU Priority 2: Identity/title/name update ────────────────────────────────
  if (
    nlu.intent === "identity_update" ||
    nlu.intent === "title_update" ||
    nlu.intent === "name_update"
  ) {
    let updatedProfile = { ...currentProfile };

    if (nlu.entities.title) {
      const toTitleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
      updatedProfile.title = toTitleCase(nlu.entities.title);
      await persistProfileField(orgId, "title", updatedProfile.title);
    }
    if (nlu.entities.fullName) {
      const toTitleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());
      updatedProfile.name = toTitleCase(nlu.entities.fullName);
      await persistProfileField(orgId, "name", updatedProfile.name);
      try {
        const db = await getDb();
        // Strip any previously-prepended title from the name to avoid duplication
        const prevTitle = currentProfile.title;
        let baseName = updatedProfile.name;
        if (prevTitle && baseName.toLowerCase().startsWith(prevTitle.toLowerCase() + ' ')) {
          baseName = baseName.slice(prevTitle.length + 1).trim();
        }
        const fullDisplayName = updatedProfile.title
          ? `${updatedProfile.title} ${baseName}`
          : baseName;
        if (db) await db.update(users).set({ name: fullDisplayName, updatedAt: new Date().toISOString() }).where(eq(users.id, userId));
      } catch (e) { console.error('[OnboardingSM] NLU: Failed to update users.name:', e); }
    }

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

    const ackMessage = buildCorrectionAck(nlu, currentStep, updatedProfile);
    return {
      kaiMessage: ackMessage,
      nextStep: currentStep,
      profile: updatedProfile,
      stepCompleted: false,
      isComplete: false,
      expectsFileUpload: isUploadStep(currentStep),
      showSkip: true,
      showBack: hasPrev,
    };
  }
  // ── NLU Priority 3: Correction ────────────────────────────────────────────────
  if (nlu.intent === "correction") {
    const lower = input.toLowerCase();
    let correctionStep: OnboardingStep = currentStep;
    if (lower.includes("name")) correctionStep = "name";
    else if (lower.includes("title")) correctionStep = "title";
    else if (lower.includes("program") || lower.includes("teach")) correctionStep = "programs";
    else if (lower.includes("rank") || lower.includes("belt")) correctionStep = "rank";
    else if (lower.includes("school") || lower.includes("dojo")) correctionStep = "school_name";
    else if (lower.includes("display")) correctionStep = "display_name";
    else if (lower.includes("tagline") || lower.includes("motto")) correctionStep = "tagline";
    else if (lower.includes("style") || lower.includes("martial")) correctionStep = "martial_style";
    else if (/\b(street|my address|home address|business address)\b/i.test(input)) correctionStep = "address";
    else if (lower.includes("city") || lower.includes("state") || lower.includes("zip")) correctionStep = "city_state_zip";
    else if (lower.includes("country")) correctionStep = "country";
    else if (lower.includes("phone")) correctionStep = "phone";
    else if (lower.includes("email")) correctionStep = "email";
    else if (lower.includes("website") || lower.includes("url")) correctionStep = "website";
    else if (lower.includes("color") || lower.includes("colour")) correctionStep = "brand_colors";
    else if (lower.includes("timezone") || lower.includes("time zone")) correctionStep = "timezone";
    else if (lower.includes("currency")) correctionStep = "currency";
    return {
      kaiMessage: `No problem — let's go back to that.\n\n${getStepQuestion(correctionStep, currentProfile)}`,
      nextStep: correctionStep,
      profile: currentProfile,
      stepCompleted: false,
      isComplete: false,
      expectsFileUpload: isUploadStep(correctionStep),
      showSkip: correctionStep !== "name" && correctionStep !== "title" && correctionStep !== "programs",
      showBack: false,
      correctionStep,
    };
  }

  // ── NLU Priority 4: Objection / question ──────────────────────────────────────
  if (nlu.intent === "objection" || (nlu.intent === "question" && currentStep !== "name" && currentStep !== "programs")) {
    return {
      kaiMessage: buildObjectionResponse(currentStep, currentProfile),
      nextStep: currentStep,
      profile: currentProfile,
      stepCompleted: false,
      isComplete: false,
      expectsFileUpload: isUploadStep(currentStep),
      showSkip: currentStep !== "name" && currentStep !== "programs",
      showBack: hasPrev,
    };
  }

  // ── NLU Priority 5: Skip ──────────────────────────────────────────────────────
  const normalisedInput = nlu.intent === "skip" ? "skip" : input;

  // ── Process each step ──────────────────────────────────────────────────────────
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
        kaiMessage: `${microAck(name)}, **${name}**.\n\n${getStepQuestion(next, updatedProfile)}`,
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
      const title = toTitleCase(normalisedInput.trim());
      const updatedProfile = { ...currentProfile, title };
      await persistProfileField(orgId, "title", title);
      // Store the title as the user's preferredName so the UI shows it without
      // touching the legal name column (which is used for billing/records).
      try {
        const db = await getDb();
        if (db) {
          await db.update(users).set({ preferredName: title, updatedAt: new Date().toISOString() }).where(eq(users.id, userId));
        }
      } catch (e) {
        console.error('[OnboardingSM] Failed to update users.preferredName with title:', e);
      }
      const next = getNextStep("title", updatedProfile, hasMartialArts);
      // Display name for KAI's acknowledgment message: just the title is enough
      const displayName = title;
      return {
        kaiMessage: `${displayName} — I like it.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: next === "profile_photo",
        showSkip: true,
        showBack: true,
      };
    }

    case "profile_photo": {
      if (isSkip(normalisedInput)) {
        const next = getNextStep("profile_photo", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — you can add a photo anytime in **Settings → Profile**.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      // If a URL was passed (from upload handler), treat as the photo URL
      if (normalisedInput.startsWith("http") || normalisedInput.startsWith("data:")) {
        const updatedProfile = { ...currentProfile, profilePhotoUrl: normalisedInput };
        const next = getNextStep("profile_photo", updatedProfile, hasMartialArts);
        return {
          kaiMessage: `Photo saved. ✅\n\n${getStepQuestion(next, updatedProfile)}`,
          nextStep: next,
          profile: updatedProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      const displayName = titleName;
      return {
        kaiMessage: `Use the **Upload Photo** button below to add your photo, ${displayName} — or tap **Skip** to continue without one.`,
        nextStep: "profile_photo",
        profile: currentProfile,
        stepCompleted: false,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: true,
        showBack: true,
        showPhotoUpload: true,
      } as any;
    }

    case "programs": {
      const validation = validatePrograms(normalisedInput);
      if (!validation.valid) {
        return {
          kaiMessage: `Tell me what you teach — even just one program to start. *(e.g., BJJ, Karate, Kickboxing)*`,
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
      const hasMartialArtsNow = programs.some((p) => detectsMartialArts(p));
      const updatedProfile = { ...currentProfile, programs };
      await persistProfileField(orgId, "programs", programs);
      const newCompletedSteps: OnboardingStep[] = ["programs"];
      const next = getNextStep("programs", updatedProfile, hasMartialArtsNow);
      const programList = programs.join(", ");
      return {
        kaiMessage: `Great — **${programList}** added to your roster.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: false,
        showBack: true,
        _completedStepsToAdd: newCompletedSteps,
      } as any;
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

    case "display_name": {
      if (isSkip(normalisedInput)) {
        const next = getNextStep("display_name", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — I'll use **${currentProfile.schoolName || "your full school name"}** everywhere.\n\n${getStepQuestion(next, currentProfile)}`,
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
          kaiMessage: `What should I use as the short display name for your school?`,
          nextStep: "display_name",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      const displayName = normalisedInput;
      const updatedProfile = { ...currentProfile, displayName };
      await persistProfileField(orgId, "displayName", displayName);
      const next = getNextStep("display_name", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `${microAck(displayName)} — **${displayName}** it is.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: true,
        showBack: true,
      };
    }

    case "tagline": {
      if (isSkip(normalisedInput)) {
        const next = getNextStep("tagline", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — you can add a tagline anytime in **Settings → School Profile**.\n\n${getStepQuestion(next, currentProfile)}`,
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
          kaiMessage: `What's your school's tagline or motto? *(e.g., "Train Hard. Fight Smart.")* — or skip.`,
          nextStep: "tagline",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      const tagline = normalisedInput;
      const updatedProfile = { ...currentProfile, tagline };
      await persistProfileField(orgId, "tagline", tagline);
      const next = getNextStep("tagline", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `*"${tagline}"* — locked in.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: true,
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

      const parsed = parseAddress(normalisedInput);

      if (parsed.isComplete && parsed.street && parsed.city && parsed.state && parsed.zip) {
        const updatedProfile = {
          ...currentProfile,
          addressStreet: parsed.street,
          addressCity: parsed.city,
          addressState: parsed.state,
          addressPostal: parsed.zip,
        };
        await upsertSchoolProfile(orgId, {
          addressStreet: parsed.street,
          addressCity: parsed.city,
          addressState: parsed.state,
          addressPostal: parsed.zip,
        });
        const nextAfterCityZip = getNextStep("city_state_zip", updatedProfile, hasMartialArts);
        const fullAddress = `${parsed.street}, ${parsed.city}, ${parsed.state} ${parsed.zip}`;
        return {
          kaiMessage: `Got it — **${fullAddress}**.\n\n${getStepQuestion(nextAfterCityZip, updatedProfile)}`,
          nextStep: nextAfterCityZip,
          profile: updatedProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
          _completedStepsToAdd: ["address", "city_state_zip"] as OnboardingStep[],
        };
      }

      const street = parsed.street || normalisedInput;
      const updatedProfile = { ...currentProfile, addressStreet: street };
      await upsertSchoolProfile(orgId, { addressStreet: street });
      const next = getNextStep("address", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `Got it — **${street}**.\n\n${getStepQuestion(next, updatedProfile)}`,
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

      const parsedCsz = parseAddress(normalisedInput);

      let city = parsedCsz.city || "";
      let state = parsedCsz.state || "";
      let postal = parsedCsz.zip || "";

      if (!city) {
        const parts = normalisedInput.split(/[,\s]+/);
        const lastPart = parts[parts.length - 1];
        const lastIsZip = /^\d{5}(-\d{4})?$/.test(lastPart);
        const secondLastIsStateAbbr = parts.length >= 3 && /^[A-Z]{2}$/i.test(parts[parts.length - 2]);
        if (lastIsZip && secondLastIsStateAbbr && parts.length >= 3) {
          // "city state zip" format
          postal = lastPart;
          state = parts[parts.length - 2].toUpperCase();
          city = parts.slice(0, parts.length - 2).join(" ");
        } else if (lastIsZip && parts.length >= 2) {
          // "city zip" format — no state abbreviation
          postal = lastPart;
          city = parts.slice(0, parts.length - 1).join(" ");
        } else if (parts.length >= 3) {
          postal = parts[parts.length - 1];
          state = parts[parts.length - 2];
          city = parts.slice(0, parts.length - 2).join(" ");
        } else if (parts.length === 2) {
          state = parts[1];
          city = parts[0];
        } else {
          city = normalisedInput;
        }
      }
      // Title-case the city for clean display (e.g., "new york" → "New York")
      if (city) {
        city = city.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      }

      const streetUpdate = parsedCsz.isComplete && parsedCsz.street && !currentProfile.addressStreet
        ? { addressStreet: parsedCsz.street }
        : {};

      const updatedProfile = { ...currentProfile, ...streetUpdate, addressCity: city, addressState: state, addressPostal: postal };
      await upsertSchoolProfile(orgId, { ...streetUpdate, addressCity: city, addressState: state, addressPostal: postal });
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

    case "country": {
      if (isSkip(normalisedInput)) {
        const next = getNextStep("country", currentProfile, hasMartialArts);
        return {
          kaiMessage: `Got it — defaulting to United States.\n\n${getStepQuestion(next, currentProfile)}`,
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
          kaiMessage: `What country is your school in? *(e.g., United States, Canada, United Kingdom)*`,
          nextStep: "country",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }
      const country = normalisedInput;
      const updatedProfile = { ...currentProfile, addressCountry: country };
      await upsertSchoolProfile(orgId, { addressCountry: country });
      const next = getNextStep("country", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `${microAck(country)} — **${country}** saved.\n\n${getStepQuestion(next, updatedProfile)}`,
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
        kaiMessage: `${buildSaveConfirmation("phone", normalisedInput, updatedProfile) ?? `${microAck(normalisedInput)} — **${normalisedInput}** saved.`}\n\n${getStepQuestion(next, updatedProfile)}`,
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
      if (!normalisedInput.includes("@") || !normalisedInput.includes(".")) {
        return {
          kaiMessage: `That doesn't look like a valid email. Try something like *info@${currentProfile.schoolName ? currentProfile.schoolName.toLowerCase().replace(/\s+/g, '') + '.com' : 'yourdojo.com'}*.`,
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
        kaiMessage: `${buildSaveConfirmation("email", normalisedInput, updatedProfile) ?? `${microAck(normalisedInput)} — **${normalisedInput}** saved.`}\n\n${getStepQuestion(next, updatedProfile)}`,
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
          expectsFileUpload: isUploadStep(next),
          showSkip: true,
          showBack: true,
        };
      }
      const website = normalisedInput.startsWith("http") ? normalisedInput : `https://${normalisedInput}`;
      const updatedProfile = { ...currentProfile, website };
      await upsertSchoolProfile(orgId, { website });
      const next = getNextStep("website", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `${buildSaveConfirmation("website", website, updatedProfile) ?? `${microAck(website)} — **${website}** connected.`}\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: isUploadStep(next),
        showSkip: true,
        showBack: true,
      };
    }

    case "logo_light":
    case "logo_dark":
    case "icon_logo_light":
    case "icon_logo_dark": {
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
          expectsFileUpload: isUploadStep(next),
          showSkip: true,
          showBack: true,
        };
      }
      const logoVariant =
        currentStep === "logo_light" ? "Day Mode logo" :
        currentStep === "logo_dark" ? "Dark Mode logo" :
        currentStep === "icon_logo_light" ? "light icon logo" :
        "dark icon logo";
      return {
        kaiMessage: `Use the **Upload Logo** button below to upload your ${logoVariant} — or tap **Skip** to continue without one.`,
        nextStep: currentStep,
        profile: currentProfile,
        stepCompleted: false,
        isComplete: false,
        expectsFileUpload: true,
        showSkip: true,
        showBack: true,
      };
    }

    case "brand_colors": {
      if (isSkip(normalisedInput)) {
        const next = getNextStep("brand_colors", currentProfile, hasMartialArts);
        return {
          kaiMessage: `No problem — I'll use the default DojoFlow palette.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: currentProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }

      // Parse hex color from input
      const normalized = normalizeHexColor(normalisedInput);
      if (!normalized) {
        return {
          kaiMessage: `That doesn't look like a valid hex color. Try something like **#FF0000** for red or **#1A1A2E** for dark navy.\n\nWhat's your primary brand color?`,
          nextStep: "brand_colors",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }

      const updatedProfile = { ...currentProfile, brandColorPrimary: normalized };
      await upsertSchoolProfile(orgId, { brandColorPrimary: normalized });
      const next = getNextStep("brand_colors", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `**${normalized}** — your primary brand color is set. 🎨\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: true,
        showBack: true,
      };
    }

    case "timezone": {
      if (isSkip(normalisedInput)) {
        const next = getNextStep("timezone", currentProfile, hasMartialArts);
        return {
          kaiMessage: `Got it — defaulting to Eastern Time.\n\n${getStepQuestion(next, currentProfile)}`,
          nextStep: next,
          profile: { ...currentProfile, timezone: "America/New_York" },
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }

      const tz = normalizeTimezone(normalisedInput);
      if (!tz) {
        return {
          kaiMessage: `I didn't recognize that timezone. Try something like **Eastern**, **Central**, **Pacific**, or a full IANA name like **America/New_York**.\n\nWhat timezone is your school in?`,
          nextStep: "timezone",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }

      const updatedProfile = { ...currentProfile, timezone: tz };
      await upsertSchoolProfile(orgId, { timezone: tz });
      const next = getNextStep("timezone", updatedProfile, hasMartialArts);
      return {
        kaiMessage: `${microAck(tz)} — **${tz}** set as your timezone.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
        showSkip: true,
        showBack: true,
      };
    }

    case "currency": {
      if (isSkip(normalisedInput)) {
        const next = getNextStep("currency", currentProfile, hasMartialArts);
        const updatedProfile = { ...currentProfile, currency: "USD" };
        await upsertSchoolProfile(orgId, { currency: "USD" });
        if (next === "complete") {
          return {
            kaiMessage: buildCompletionMessage(updatedProfile, hasMartialArts),
            nextStep: "complete",
            profile: updatedProfile,
            stepCompleted: true,
            isComplete: true,
            expectsFileUpload: false,
            showSkip: false,
            showBack: false,
          };
        }
        return {
          kaiMessage: `Got it — defaulting to USD.\n\n${getStepQuestion(next, updatedProfile)}`,
          nextStep: next,
          profile: updatedProfile,
          stepCompleted: true,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }

      const currency = normalizeCurrency(normalisedInput);
      if (!currency) {
        return {
          kaiMessage: `I didn't recognize that currency. Try a 3-letter code like **USD**, **CAD**, **GBP**, or **AUD**.\n\nWhat currency does your school use?`,
          nextStep: "currency",
          profile: currentProfile,
          stepCompleted: false,
          isComplete: false,
          expectsFileUpload: false,
          showSkip: true,
          showBack: true,
        };
      }

      const updatedProfile = { ...currentProfile, currency };
      await upsertSchoolProfile(orgId, { currency });
      const next = getNextStep("currency", updatedProfile, hasMartialArts);

      if (next === "complete") {
        return {
          kaiMessage: buildCompletionMessage(updatedProfile, hasMartialArts),
          nextStep: "complete",
          profile: updatedProfile,
          stepCompleted: true,
          isComplete: true,
          expectsFileUpload: false,
          showSkip: false,
          showBack: false,
        };
      }

      return {
        kaiMessage: `${microAck(currency)} — **${currency}** set as your currency.\n\n${getStepQuestion(next, updatedProfile)}`,
        nextStep: next,
        profile: updatedProfile,
        stepCompleted: true,
        isComplete: false,
        expectsFileUpload: false,
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

function toTitleCaseWord(str: string): string {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function buildCompletionMessage(profile: OnboardingProfile, hasMartialArts: boolean): string {
  // Deduplicate title+name: if name already starts with the title, don't prepend it again
  let titleName: string;
  if (profile.title && profile.name) {
    const nameLower = profile.name.toLowerCase();
    const titleLower = profile.title.toLowerCase();
    if (nameLower.startsWith(titleLower)) {
      titleName = profile.name; // name already includes the title
    } else {
      titleName = `${profile.title} ${profile.name}`;
    }
  } else {
    titleName = profile.name || "there";
  }

  const schoolName = profile.schoolName || "your school";

  // Title-case each program name for clean display (e.g., "KArate" → "Karate")
  const programs = profile.programs.map((p) => toTitleCaseWord(p));
  const programList = programs.length > 0 ? programs.join(", ") : null;

  return `You're all set, **${titleName}**. ✅\n\n**${schoolName}** is live in DojoFlow${programList ? ` — running **${programList}**` : ""}.\n\nI'm here whenever you need me — students, leads, attendance, scheduling. **What would you like to do first?**`;
}

// ─── tRPC Router ──────────────────────────────────────────────────────────────

// Shared profile schema for tRPC input validation
const profileSchema = z.object({
  name: z.string().nullable(),
  title: z.string().nullable(),
  profilePhotoUrl: z.string().nullable().optional(),
  programs: z.array(z.string()),
  styles: z.array(z.string()),
  schoolName: z.string().nullable(),
  displayName: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  addressStreet: z.string().nullable(),
  addressCity: z.string().nullable(),
  addressState: z.string().nullable(),
  addressPostal: z.string().nullable(),
  addressCountry: z.string().nullable().optional(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  logoLightUrl: z.string().nullable(),
  logoDarkUrl: z.string().nullable(),
  logoIconLightUrl: z.string().nullable().optional(),
  logoIconDarkUrl: z.string().nullable().optional(),
  brandColorPrimary: z.string().nullable().optional(),
  brandColorSecondary: z.string().nullable().optional(),
  brandColorTertiary: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
});

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

    const state = await loadOnboardingState(orgId, ctx.user.id);
    const progress = getStepProgress(state.step, state.hasMartialArts);

    return {
      needsOnboarding: true,
      isCompleted,
      step: state.step,
      profile: state.profile,
      hasMartialArts: state.hasMartialArts,
      completedSteps: state.completedSteps,
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
        userInput: z.string().min(1).max(10_000_000), // large enough for base64 data-URL fallback on profile_photo step
        currentProfile: profileSchema,
        hasMartialArts: z.boolean(),
        completedSteps: z.array(z.enum(ONBOARDING_STEPS)).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId;

      // Normalize optional fields to null if undefined
      const normalizedProfile: OnboardingProfile = {
        ...input.currentProfile,
        displayName: input.currentProfile.displayName ?? null,
        tagline: input.currentProfile.tagline ?? null,
        addressCountry: input.currentProfile.addressCountry ?? null,
        logoIconLightUrl: input.currentProfile.logoIconLightUrl ?? null,
        logoIconDarkUrl: input.currentProfile.logoIconDarkUrl ?? null,
        brandColorPrimary: input.currentProfile.brandColorPrimary ?? null,
        brandColorSecondary: input.currentProfile.brandColorSecondary ?? null,
        brandColorTertiary: input.currentProfile.brandColorTertiary ?? null,
        timezone: input.currentProfile.timezone ?? null,
        currency: input.currentProfile.currency ?? null,
      };

      const result = await processOnboardingStep(
        orgId,
        ctx.user.id,
        input.currentStep,
        input.userInput,
        normalizedProfile,
        input.hasMartialArts
      );

      const newHasMartialArts = input.currentStep === "programs"
        ? result.profile.programs.some((p) => detectsMartialArts(p))
        : input.hasMartialArts;

      const existingCompleted: OnboardingStep[] = input.completedSteps || [];
      const toAdd: OnboardingStep[] = (result as any)._completedStepsToAdd || [];
      const mergedSet = new Set([...existingCompleted, ...toAdd]);
      const mergedCompletedSteps: OnboardingStep[] = Array.from(mergedSet);

      const stepNumber = STEP_NUMBERS[result.nextStep] || 1;
      try {
        await saveOnboardingState(
          orgId,
          { step: result.nextStep, profile: result.profile, completedSteps: mergedCompletedSteps, hasMartialArts: newHasMartialArts },
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
            await db.update(organizations)
              .set({ onboardingStatus: "completed", onboardingStep: 99 } as any)
              .where(eq(organizations.id, orgId));
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
        currentProfile: profileSchema,
        hasMartialArts: z.boolean(),
        completedSteps: z.array(z.enum(ONBOARDING_STEPS)).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId;
      const prevStep = getPrevStep(input.currentStep, input.hasMartialArts);

      const normalizedProfile: OnboardingProfile = {
        ...input.currentProfile,
        displayName: input.currentProfile.displayName ?? null,
        tagline: input.currentProfile.tagline ?? null,
        addressCountry: input.currentProfile.addressCountry ?? null,
        logoIconLightUrl: input.currentProfile.logoIconLightUrl ?? null,
        logoIconDarkUrl: input.currentProfile.logoIconDarkUrl ?? null,
        brandColorPrimary: input.currentProfile.brandColorPrimary ?? null,
        brandColorSecondary: input.currentProfile.brandColorSecondary ?? null,
        brandColorTertiary: input.currentProfile.brandColorTertiary ?? null,
        timezone: input.currentProfile.timezone ?? null,
        currency: input.currentProfile.currency ?? null,
      };

      if (!prevStep) {
        const progress = getStepProgress(input.currentStep, input.hasMartialArts);
        return {
          kaiMessage: getStepQuestion(input.currentStep, normalizedProfile),
          nextStep: input.currentStep,
          profile: normalizedProfile,
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
          { step: prevStep, profile: normalizedProfile, completedSteps: input.completedSteps || [], hasMartialArts: input.hasMartialArts },
          stepNumber
        );
      } catch (e) {
        console.error('[OnboardingSM] goBack saveOnboardingState failed (non-fatal):', e);
      }

      const progress = getStepProgress(prevStep, input.hasMartialArts);
      const hasPrev = getPrevStep(prevStep, input.hasMartialArts) !== null;

      return {
        kaiMessage: getStepQuestion(prevStep, normalizedProfile),
        nextStep: prevStep,
        profile: normalizedProfile,
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
        type: z.enum(["light", "dark", "icon-light", "icon-dark"]),
        dataUrl: z.string().min(10),
        fileName: z.string().optional(),
        currentProfile: profileSchema,
        hasMartialArts: z.boolean(),
        completedSteps: z.array(z.enum(ONBOARDING_STEPS)).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const normalizedProfile: OnboardingProfile = {
        ...input.currentProfile,
        displayName: input.currentProfile.displayName ?? null,
        tagline: input.currentProfile.tagline ?? null,
        addressCountry: input.currentProfile.addressCountry ?? null,
        logoIconLightUrl: input.currentProfile.logoIconLightUrl ?? null,
        logoIconDarkUrl: input.currentProfile.logoIconDarkUrl ?? null,
        brandColorPrimary: input.currentProfile.brandColorPrimary ?? null,
        brandColorSecondary: input.currentProfile.brandColorSecondary ?? null,
        brandColorTertiary: input.currentProfile.brandColorTertiary ?? null,
        timezone: input.currentProfile.timezone ?? null,
        currency: input.currentProfile.currency ?? null,
      };

      // Upload logo to S3 and get a CDN URL
      // We store only the URL (not the raw base64) to avoid overflowing TEXT columns
      let logoUrl: string = input.dataUrl; // fallback to base64 if S3 unavailable
      try {
        // Strip the data URL prefix to get raw base64
        const matches = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");
          const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
          const fileName = input.fileName?.replace(/\s+/g, "-").toLowerCase() || `logo-${Date.now()}.${ext}`;
          const s3Key = `logos/org-${orgId}/${input.type}-${Date.now()}-${fileName}`;
          const result = await storagePut(s3Key, buffer, mimeType);
          logoUrl = result.url;
        }
      } catch (s3Err: any) {
        console.warn("[uploadLogo] S3 upload failed, falling back to base64 storage:", s3Err?.message);
        // Keep logoUrl as the base64 dataUrl as fallback
      }

      // Save logo URL to DB (CDN URL or base64 fallback)
      const updateData =
        input.type === "light" ? { logoLightUrl: logoUrl, logoLightData: logoUrl } :
        input.type === "dark" ? { logoDarkUrl: logoUrl, logoDarkData: logoUrl } :
        input.type === "icon-light" ? { logoIconLightUrl: logoUrl } :
        { logoIconDarkUrl: logoUrl };

      await upsertSchoolProfile(orgId, updateData);

      // Update local profile — use only the URL (never raw base64) to keep state small
      const updatedProfile: OnboardingProfile = {
        ...normalizedProfile,
        ...(input.type === "light" ? { logoLightUrl: logoUrl } :
            input.type === "dark" ? { logoDarkUrl: logoUrl } :
            input.type === "icon-light" ? { logoIconLightUrl: logoUrl } :
            { logoIconDarkUrl: logoUrl }),
      };

      const completedStep: OnboardingStep =
        input.type === "light" ? "logo_light" :
        input.type === "dark" ? "logo_dark" :
        input.type === "icon-light" ? "icon_logo_light" :
        "icon_logo_dark";

      const nextStep = getNextStep(completedStep, updatedProfile, input.hasMartialArts);

      const stepNumber = STEP_NUMBERS[nextStep] || 1;
      await saveOnboardingState(
        orgId,
        { step: nextStep, profile: updatedProfile, completedSteps: input.completedSteps || [], hasMartialArts: input.hasMartialArts },
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
        const logoLabel =
          input.type === "light" ? "Day Mode logo" :
          input.type === "dark" ? "Dark Mode logo" :
          input.type === "icon-light" ? "Light icon logo" :
          "Dark icon logo";
        kaiMessage = `✅ **${input.fileName || logoLabel}** activated.\n\n${getStepQuestion(nextStep, updatedProfile)}`;
      }

      const progress = getStepProgress(nextStep, input.hasMartialArts);

      return {
        kaiMessage,
        nextStep,
        profile: updatedProfile,
        isComplete,
        expectsFileUpload: isUploadStep(nextStep),
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
