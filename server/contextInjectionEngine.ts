/**
 * Kai Creative — Context Injection Engine
 *
 * Automatically loads user business data and injects it into every generation prompt.
 * Detects vague prompts and returns clarification questions with program suggestions.
 *
 * Pipeline:
 *  1. loadBusinessContext()   — fetch school name, logo, phone, email, programs, colors
 *  2. detectVaguePrompt()     — identify missing program/audience context
 *  3. buildClarification()    — suggest programs from stored data
 *  4. validateRequiredData()  — warn if critical data (logo/phone/name) is missing
 *  5. injectContext()         — enrich the raw user prompt with real business data
 *
 * RULES:
 *  - ALWAYS inject school name, phone, colors — never leave placeholders
 *  - NEVER generate "LOGO HERE", "SCHOOL NAME", "PHONE NUMBER" placeholders
 *  - If logo exists → inject it; if missing → ask before generating
 *  - If prompt is vague → return clarification question with program chips
 */

import { getDb } from "./db";
import { getSchoolProfile } from "./schoolProfileDb";
import { programs as programsTable } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BusinessContext {
  schoolName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  tagline: string | null;
  logoUrl: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  programs: ProgramInfo[];
  // Brand DNA overrides
  brandTone: string | null;
  brandVoice: string | null;
  designEnergy: string | null;
  visualStyle: string | null;
  primaryAudience: string | null;
  ageRangeMin: number | null;
  ageRangeMax: number | null;
}

export interface ProgramInfo {
  id: number;
  name: string;
  ageRange: string | null;
  description: string | null;
  type: string;
}

export interface MissingDataWarning {
  field: "logo" | "phone" | "email" | "schoolName" | "programs";
  severity: "blocking" | "warning";
  message: string;
  suggestion: string;
}

export interface ClarificationRequest {
  needed: boolean;
  question: string | null;
  programChips: string[];
  reason: "vague_prompt" | "no_program_specified" | "none";
}

export interface ContextInjectionResult {
  enrichedPrompt: string;
  context: BusinessContext;
  clarification: ClarificationRequest;
  warnings: MissingDataWarning[];
  contextSummary: string; // Human-readable summary of what was injected
}

// ── Load Business Context ─────────────────────────────────────────────────────

export async function loadBusinessContext(orgId: number): Promise<BusinessContext> {
  try {
    const profile = await getSchoolProfile(orgId);
    const db = await getDb();

    // Load programs from the programs table
    let orgPrograms: ProgramInfo[] = [];
    if (db) {
      try {
        const rows = await db
          .select({
            id: programsTable.id,
            name: programsTable.name,
            ageRange: programsTable.ageRange,
            description: programsTable.description,
            type: programsTable.type,
          })
          .from(programsTable)
          .where(eq(programsTable.organizationId, orgId));
        orgPrograms = rows.map((r) => ({
          id: r.id,
          name: r.name,
          ageRange: r.ageRange ?? null,
          description: r.description ?? null,
          type: r.type,
        }));
      } catch { /* programs table may be empty */ }
    }

    // Also load Brand DNA for overrides
    let dna: Record<string, unknown> | null = null;
    if (db) {
      try {
        const { brandDna } = await import("../drizzle/schema");
        const rows = await db.select().from(brandDna).where(eq(brandDna.orgId, orgId)).limit(1);
        if (rows.length > 0) dna = rows[0] as Record<string, unknown>;
      } catch { /* Brand DNA table may not exist */ }
    }

    // Also pull programs from Brand DNA JSON if no programs table entries
    if (orgPrograms.length === 0 && dna?.programs) {
      try {
        const dnaPrograms = JSON.parse(dna.programs as string) as string[];
        orgPrograms = dnaPrograms.map((name, i) => ({
          id: -(i + 1),
          name,
          ageRange: null,
          description: null,
          type: "membership",
        }));
      } catch { /* ignore */ }
    }

    // Also pull programs from dojo_settings programsTaught if still empty
    if (orgPrograms.length === 0) {
      try {
        const { dojoSettings } = await import("../drizzle/schema");
        if (db) {
          const [settings] = await db.select({ programsTaught: dojoSettings.programsTaught })
            .from(dojoSettings)
            .where(eq(dojoSettings.organizationId, orgId))
            .limit(1);
          if (settings?.programsTaught) {
            const names = (settings.programsTaught as string).split(/[,;|]+/).map((s) => s.trim()).filter(Boolean);
            orgPrograms = names.map((name, i) => ({
              id: -(i + 100),
              name,
              ageRange: null,
              description: null,
              type: "membership",
            }));
          }
        }
      } catch { /* ignore */ }
    }

    const addressParts = [
      profile?.addressStreet,
      profile?.addressCity,
      profile?.addressState,
      profile?.addressPostal,
    ].filter(Boolean);

    return {
      schoolName: profile?.schoolName ?? null,
      phone: profile?.phone ?? null,
      email: profile?.email ?? null,
      website: profile?.website ?? null,
      address: addressParts.length > 0 ? addressParts.join(", ") : null,
      tagline: profile?.tagline ?? null,
      logoUrl: (dna?.logoUrl as string | null) ?? profile?.logoLightUrl ?? profile?.logoDarkUrl ?? null,
      logoLightUrl: profile?.logoLightUrl ?? null,
      logoDarkUrl: profile?.logoDarkUrl ?? null,
      primaryColor: (dna?.primaryColor as string | null) ?? profile?.brandColorPrimary ?? null,
      secondaryColor: (dna?.secondaryColor as string | null) ?? profile?.brandColorSecondary ?? null,
      accentColor: (dna?.accentColor as string | null) ?? profile?.brandColorTertiary ?? null,
      programs: orgPrograms,
      brandTone: (dna?.brandTone as string | null) ?? null,
      brandVoice: (dna?.brandVoice as string | null) ?? null,
      designEnergy: (dna?.designEnergy as string | null) ?? null,
      visualStyle: (dna?.visualStyle as string | null) ?? null,
      primaryAudience: (dna?.primaryAudience as string | null) ?? null,
      ageRangeMin: (dna?.ageRangeMin as number | null) ?? null,
      ageRangeMax: (dna?.ageRangeMax as number | null) ?? null,
    };
  } catch {
    return {
      schoolName: null,
      phone: null,
      email: null,
      website: null,
      address: null,
      tagline: null,
      logoUrl: null,
      logoLightUrl: null,
      logoDarkUrl: null,
      primaryColor: null,
      secondaryColor: null,
      accentColor: null,
      programs: [],
      brandTone: null,
      brandVoice: null,
      designEnergy: null,
      visualStyle: null,
      primaryAudience: null,
      ageRangeMin: null,
      ageRangeMax: null,
    };
  }
}

// ── Vague Prompt Detection ────────────────────────────────────────────────────

const VAGUE_PATTERNS = [
  /^create\s+a\s+flyer\s*$/i,
  /^make\s+a\s+flyer\s*$/i,
  /^flyer\s*$/i,
  /^poster\s*$/i,
  /^social\s+post\s*$/i,
  /^instagram\s+post\s*$/i,
  /^marketing\s+material\s*$/i,
  /^design\s+something\s*$/i,
  /^create\s+something\s*$/i,
  /^make\s+something\s*$/i,
  /^generate\s+a\s+flyer\s*$/i,
  /^generate\s+a\s+poster\s*$/i,
];

const PROGRAM_MENTION_PATTERNS = [
  /little\s*ninja/i,
  /kickbox/i,
  /karate/i,
  /jiu.?jitsu/i,
  /bjj/i,
  /taekwondo/i,
  /judo/i,
  /muay\s*thai/i,
  /boxing/i,
  /self.?defense/i,
  /summer\s*camp/i,
  /belt\s*test/i,
  /belt\s*promotion/i,
  /adult\s+class/i,
  /kids\s+class/i,
  /teen/i,
  /youth/i,
  /fitness/i,
  /wrestling/i,
  /grappling/i,
];

export function detectVaguePrompt(userPrompt: string, programs: ProgramInfo[]): ClarificationRequest {
  const trimmed = userPrompt.trim();

  // Check for exact vague patterns
  const isExactlyVague = VAGUE_PATTERNS.some((p) => p.test(trimmed));

  // Check if any program is mentioned
  const hasProgramMention = PROGRAM_MENTION_PATTERNS.some((p) => p.test(trimmed))
    || programs.some((prog) => trimmed.toLowerCase().includes(prog.name.toLowerCase()));

  // If prompt is short (< 15 chars) and no program mentioned
  const isTooShort = trimmed.length < 15 && !hasProgramMention;

  if (isExactlyVague || isTooShort) {
    const programChips = programs.slice(0, 6).map((p) => p.name);

    if (programs.length > 0) {
      return {
        needed: true,
        question: `Which program should I promote? I can create one for ${programs.slice(0, 3).map((p) => p.name).join(", ")}${programs.length > 3 ? ", or others" : ""}.`,
        programChips,
        reason: "no_program_specified",
      };
    }

    return {
      needed: true,
      question: "Which program should I promote? (e.g., Little Ninjas, Kickboxing, Adult Karate, Self Defense)",
      programChips: ["Little Ninjas", "Kickboxing", "Adult Karate", "Self Defense", "Summer Camp", "Belt Test"],
      reason: "vague_prompt",
    };
  }

  return { needed: false, question: null, programChips: [], reason: "none" };
}

// ── Missing Data Validation ───────────────────────────────────────────────────

export function validateRequiredData(context: BusinessContext): MissingDataWarning[] {
  const warnings: MissingDataWarning[] = [];

  if (!context.schoolName) {
    warnings.push({
      field: "schoolName",
      severity: "blocking",
      message: "No school name found in your profile.",
      suggestion: "Add your school name in Settings → School Profile.",
    });
  }

  if (!context.phone) {
    warnings.push({
      field: "phone",
      severity: "warning",
      message: "No phone number in your profile.",
      suggestion: "Add your phone number in Settings → School Profile so it appears on every flyer.",
    });
  }

  if (!context.logoUrl && !context.logoLightUrl && !context.logoDarkUrl) {
    warnings.push({
      field: "logo",
      severity: "warning",
      message: "No logo uploaded.",
      suggestion: "Upload your logo in Settings → School Profile to have it auto-placed on every design.",
    });
  }

  return warnings;
}

// ── Context Injection ─────────────────────────────────────────────────────────

/**
 * Injects real business data into the user's prompt.
 * Replaces vague references with actual values.
 * Never generates placeholders.
 */
export function injectContext(userPrompt: string, context: BusinessContext): {
  enrichedPrompt: string;
  contextSummary: string;
} {
  let enriched = userPrompt.trim();
  const injected: string[] = [];

  // Build a context prefix block with real data
  const contextLines: string[] = [];

  if (context.schoolName) {
    contextLines.push(`School: ${context.schoolName}`);
    injected.push(`school name "${context.schoolName}"`);
  }

  if (context.phone) {
    // Only inject phone if user didn't already specify one
    const userSpecifiedPhone = /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/.test(enriched);
    if (!userSpecifiedPhone) {
      contextLines.push(`Phone: ${context.phone}`);
      injected.push(`phone ${context.phone}`);
    }
  }

  if (context.email) {
    contextLines.push(`Email: ${context.email}`);
    injected.push("email");
  }

  if (context.website) {
    contextLines.push(`Website: ${context.website}`);
    injected.push("website");
  }

  if (context.address) {
    contextLines.push(`Address: ${context.address}`);
    injected.push("address");
  }

  if (context.tagline) {
    contextLines.push(`Tagline: "${context.tagline}"`);
    injected.push("tagline");
  }

  if (context.logoUrl) {
    contextLines.push(`Logo: PROVIDED — place at top center, do not generate placeholder`);
    injected.push("logo");
  } else if (context.schoolName) {
    contextLines.push(`Logo: NOT uploaded — use school name "${context.schoolName}" as bold text wordmark at top center`);
  }

  // Colors
  const colors: string[] = [];
  if (context.primaryColor) colors.push(`primary: ${context.primaryColor}`);
  if (context.secondaryColor) colors.push(`secondary: ${context.secondaryColor}`);
  if (context.accentColor) colors.push(`accent: ${context.accentColor}`);
  if (colors.length > 0) {
    contextLines.push(`Brand colors: ${colors.join(", ")}`);
    injected.push("brand colors");
  }

  // Programs — inject if user mentioned a program that matches stored ones
  if (context.programs.length > 0) {
    const matchedProgram = context.programs.find((p) =>
      enriched.toLowerCase().includes(p.name.toLowerCase())
    );
    if (matchedProgram) {
      const programDetails: string[] = [`Program: ${matchedProgram.name}`];
      if (matchedProgram.ageRange) programDetails.push(`Ages: ${matchedProgram.ageRange}`);
      if (matchedProgram.description) programDetails.push(`Details: ${matchedProgram.description}`);
      contextLines.push(...programDetails);
      injected.push(`program "${matchedProgram.name}"`);
    }
  }

  // Brand tone/voice
  if (context.brandTone) {
    contextLines.push(`Brand tone: ${context.brandTone}`);
  }
  if (context.designEnergy) {
    contextLines.push(`Design energy: ${context.designEnergy}`);
  }

  // Build the enriched prompt
  if (contextLines.length > 0) {
    enriched = `${enriched}\n\n--- AUTO-INJECTED BUSINESS CONTEXT (use all of this) ---\n${contextLines.join("\n")}\n--- END CONTEXT ---`;
  }

  const contextSummary = injected.length > 0
    ? `Auto-injected: ${injected.join(", ")}`
    : "No additional context available";

  return { enrichedPrompt: enriched, contextSummary };
}

// ── Master Function ───────────────────────────────────────────────────────────

/**
 * Full context injection pipeline.
 * Call this before every generation to enrich the user's prompt with real data.
 */
export async function runContextInjection(
  userPrompt: string,
  orgId: number,
  skipClarificationCheck = false
): Promise<ContextInjectionResult> {
  const context = await loadBusinessContext(orgId);
  const clarification = skipClarificationCheck
    ? { needed: false, question: null, programChips: [], reason: "none" as const }
    : detectVaguePrompt(userPrompt, context.programs);
  const warnings = validateRequiredData(context);
  const { enrichedPrompt, contextSummary } = injectContext(userPrompt, context);

  return {
    enrichedPrompt,
    context,
    clarification,
    warnings,
    contextSummary,
  };
}

/**
 * Get program suggestions for the clarification UI.
 * Returns program names with age ranges for display.
 */
export async function getProgramSuggestions(orgId: number): Promise<{
  name: string;
  ageRange: string | null;
  label: string;
}[]> {
  const context = await loadBusinessContext(orgId);
  return context.programs.slice(0, 8).map((p) => ({
    name: p.name,
    ageRange: p.ageRange,
    label: p.ageRange ? `${p.name} (${p.ageRange})` : p.name,
  }));
}
