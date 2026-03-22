/**
 * Brand DNA Router — Kai Creative's brand identity store
 *
 * Brand DNA is the single source of truth for every Kai Creative generation.
 * It stores colors, fonts, tone, audience, visual style, and programs.
 * Kai will NEVER generate without loading Brand DNA first.
 *
 * Endpoints:
 *  get         — get Brand DNA for the current org (creates default if missing)
 *  upsert      — save/update Brand DNA
 *  syncFromProfile — pull brand data from school_profiles and merge into Brand DNA
 *  getMemory   — get creative memory preferences for the org
 *  recordMemory — record a user preference signal
 *  getInsights — get aggregated creative preferences (most-used style, size, etc.)
 */

import { z } from "zod";
import { orgScopedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { brandDna, creativeMemory, creativeAssets } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getSchoolProfile } from "./schoolProfileDb";

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const brandDnaInputSchema = z.object({
  primaryColor: z.string().max(7).optional(),
  secondaryColor: z.string().max(7).optional(),
  accentColor: z.string().max(7).optional(),
  headlineFont: z.string().max(100).optional(),
  bodyFont: z.string().max(100).optional(),
  brandTone: z.string().max(100).optional(),
  brandVoice: z.string().max(255).optional(),
  primaryAudience: z.string().max(255).optional(),
  ageRangeMin: z.number().int().min(0).max(120).optional(),
  ageRangeMax: z.number().int().min(0).max(120).optional(),
  visualStyle: z.string().max(100).optional(),
  designEnergy: z.string().max(50).optional(),
  brandKeywords: z.string().optional(),
  programs: z.array(z.string()).optional(),
  logoUrl: z.string().optional(),
  isSetupComplete: z.boolean().optional(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getOrCreateBrandDna(orgId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [existing] = await db
    .select()
    .from(brandDna)
    .where(eq(brandDna.orgId, orgId))
    .limit(1);

  if (existing) return existing;

  // Auto-create from school profile if available
  try {
    const profile = await getSchoolProfile(orgId);
    const addressParts = [
      profile?.addressStreet,
      profile?.addressCity,
      profile?.addressState,
      profile?.addressPostal,
    ].filter(Boolean);

    await db.insert(brandDna).values({
      orgId,
      primaryColor: profile?.brandColorPrimary ?? "#E53935",
      secondaryColor: profile?.brandColorSecondary ?? "#212121",
      accentColor: profile?.brandColorTertiary ?? "#FFFFFF",
      brandTone: "bold",
      designEnergy: "high-energy",
      visualStyle: "cinematic",
      logoUrl: profile?.logoLightUrl ?? profile?.logoDarkUrl ?? null,
      isSetupComplete: false,
    });
  } catch {
    await db.insert(brandDna).values({
      orgId,
      primaryColor: "#E53935",
      secondaryColor: "#212121",
      accentColor: "#FFFFFF",
      brandTone: "bold",
      designEnergy: "high-energy",
      visualStyle: "cinematic",
      isSetupComplete: false,
    });
  }

  const [created] = await db
    .select()
    .from(brandDna)
    .where(eq(brandDna.orgId, orgId))
    .limit(1);

  return created;
}

// ── Router ────────────────────────────────────────────────────────────────────

export const brandDnaRouter = router({

  // ── Get Brand DNA (auto-creates if missing) ────────────────────────────────
  get: orgScopedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.currentOrganizationId as number;
    return getOrCreateBrandDna(orgId);
  }),

  // ── Upsert Brand DNA ───────────────────────────────────────────────────────
  upsert: orgScopedProcedure
    .input(brandDnaInputSchema)
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await getOrCreateBrandDna(orgId);

      const updateData: Record<string, unknown> = {};
      if (input.primaryColor !== undefined) updateData.primaryColor = input.primaryColor;
      if (input.secondaryColor !== undefined) updateData.secondaryColor = input.secondaryColor;
      if (input.accentColor !== undefined) updateData.accentColor = input.accentColor;
      if (input.headlineFont !== undefined) updateData.headlineFont = input.headlineFont;
      if (input.bodyFont !== undefined) updateData.bodyFont = input.bodyFont;
      if (input.brandTone !== undefined) updateData.brandTone = input.brandTone;
      if (input.brandVoice !== undefined) updateData.brandVoice = input.brandVoice;
      if (input.primaryAudience !== undefined) updateData.primaryAudience = input.primaryAudience;
      if (input.ageRangeMin !== undefined) updateData.ageRangeMin = input.ageRangeMin;
      if (input.ageRangeMax !== undefined) updateData.ageRangeMax = input.ageRangeMax;
      if (input.visualStyle !== undefined) updateData.visualStyle = input.visualStyle;
      if (input.designEnergy !== undefined) updateData.designEnergy = input.designEnergy;
      if (input.brandKeywords !== undefined) updateData.brandKeywords = input.brandKeywords;
      if (input.programs !== undefined) updateData.programs = JSON.stringify(input.programs);
      if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;
      if (input.isSetupComplete !== undefined) {
        updateData.isSetupComplete = input.isSetupComplete;
        if (input.isSetupComplete) {
          updateData.setupCompletedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
        }
      }

      await db
        .update(brandDna)
        .set(updateData as any)
        .where(eq(brandDna.id, existing.id));

      return getOrCreateBrandDna(orgId);
    }),

  // ── Sync from School Profile ───────────────────────────────────────────────
  syncFromProfile: orgScopedProcedure.mutation(async ({ ctx }) => {
    const orgId = ctx.currentOrganizationId as number;
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const profile = await getSchoolProfile(orgId);
    const existing = await getOrCreateBrandDna(orgId);

    const updateData: Record<string, unknown> = {};
    if (profile?.brandColorPrimary) updateData.primaryColor = profile.brandColorPrimary;
    if (profile?.brandColorSecondary) updateData.secondaryColor = profile.brandColorSecondary;
    if (profile?.brandColorTertiary) updateData.accentColor = profile.brandColorTertiary;
    const logoUrl = profile?.logoLightUrl ?? profile?.logoDarkUrl;
    if (logoUrl) updateData.logoUrl = logoUrl;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(brandDna)
        .set(updateData as any)
        .where(eq(brandDna.id, existing.id));
    }

    return getOrCreateBrandDna(orgId);
  }),

  // ── Get Creative Memory ────────────────────────────────────────────────────
  getMemory: orgScopedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.currentOrganizationId as number;
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(creativeMemory)
      .where(eq(creativeMemory.orgId, orgId))
      .orderBy(desc(creativeMemory.createdAt))
      .limit(50);
  }),

  // ── Record Creative Memory ─────────────────────────────────────────────────
  recordMemory: orgScopedProcedure
    .input(z.object({
      selectedAssetId: z.number().optional(),
      preferredStyle: z.string().max(100).optional(),
      preferredSize: z.string().max(50).optional(),
      preferredColors: z.string().max(255).optional(),
      preferredLayout: z.string().max(100).optional(),
      successfulPromptKeywords: z.string().optional(),
      feedbackType: z.enum(["selected", "downloaded", "favorited", "regenerated", "edited"]),
      feedbackNote: z.string().optional(),
      programContext: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const db = await getDb();
      if (!db) return { success: false };

      await db.insert(creativeMemory).values({
        orgId,
        userId: ctx.user?.id ?? null,
        selectedAssetId: input.selectedAssetId ?? null,
        preferredStyle: input.preferredStyle ?? null,
        preferredSize: input.preferredSize ?? null,
        preferredColors: input.preferredColors ?? null,
        preferredLayout: input.preferredLayout ?? null,
        successfulPromptKeywords: input.successfulPromptKeywords ?? null,
        feedbackType: input.feedbackType,
        feedbackNote: input.feedbackNote ?? null,
        programContext: input.programContext ?? null,
      });

      return { success: true };
    }),

  // ── Get Creative Insights (aggregated preferences) ─────────────────────────
  getInsights: orgScopedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.currentOrganizationId as number;
    const db = await getDb();
    if (!db) return null;

    // Get recent memory entries
    const memories = await db
      .select()
      .from(creativeMemory)
      .where(eq(creativeMemory.orgId, orgId))
      .orderBy(desc(creativeMemory.createdAt))
      .limit(100);

    if (memories.length === 0) return null;

    // Aggregate preferences
    const styleCounts: Record<string, number> = {};
    const sizeCounts: Record<string, number> = {};
    const programCounts: Record<string, number> = {};
    const keywordCounts: Record<string, number> = {};

    for (const m of memories) {
      if (m.preferredStyle) {
        styleCounts[m.preferredStyle] = (styleCounts[m.preferredStyle] ?? 0) + 1;
      }
      if (m.preferredSize) {
        sizeCounts[m.preferredSize] = (sizeCounts[m.preferredSize] ?? 0) + 1;
      }
      if (m.programContext) {
        programCounts[m.programContext] = (programCounts[m.programContext] ?? 0) + 1;
      }
      if (m.successfulPromptKeywords) {
        for (const kw of m.successfulPromptKeywords.split(",")) {
          const k = kw.trim().toLowerCase();
          if (k) keywordCounts[k] = (keywordCounts[k] ?? 0) + 1;
        }
      }
    }

    const topStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const topSize = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const topProgram = Object.entries(programCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k]) => k);

    return {
      totalGenerations: memories.length,
      topStyle,
      topSize,
      topProgram,
      topKeywords,
      styleCounts,
      sizeCounts,
      programCounts,
    };
  }),
});
