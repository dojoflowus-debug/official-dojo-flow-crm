/**
 * Kai Creative Router — Gemini-powered image generation and editing
 *
 * Endpoints:
 *  generate         — text prompt → image (with optional brand injection)
 *  generateWithLogo — logo upload + prompt → branded image
 *  edit             — existing image + prompt → edited image
 *  uploadAsset      — upload logo/photo to asset library
 *  listAssets       — list saved assets
 *  deleteAsset      — delete an asset
 *  toggleFavorite   — favorite/unfavorite an asset
 *  getBrandData     — get brand data for UI display
 *  generateFromChat  — called from Kai chat; detects intent, generates, auto-saves, returns preview card payload
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { orgScopedProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { getSchoolProfile } from "./schoolProfileDb";
import { getDb } from "./db";
import { creativeAssets } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  generateImage,
  editImage,
  generateWithLogo,
  generateImageVariations,
  type ImageSize,
  type BrandContext,
} from "./geminiImageService";
import { parseStyleFromText, type StylePreset } from "./kaiPromptEngine";
import { runContextInjection, getProgramSuggestions, loadBusinessContext } from "./contextInjectionEngine";
import { analyzeBrief } from "./creativeBriefEngine";
import {
  detectIntent,
  generateMarketingCopy,
  enrichPromptContext,
} from "./kaiIntelligenceLayer";
import { generatePlatformCopyVariants } from "./platformCopyService";
import { generateVideoAd } from "./videoAdService";
import {
  buildFlyerHtml,
  renderFlyerToPng,
  parseFlyerDataFromBrief,
  generateQrCodeDataUrl,
} from "./flyerRenderer";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const imageSizeSchema = z.enum([
  "business_card",
  "instagram_post",
  "instagram_story",
  "facebook_ad",
  "flyer",
  "website_banner",
]);

const stylePresetSchema = z.enum([
  "energetic",
  "premium",
  "luxury",
  "kids_playful",
  "high_converting_ad",
  "auto",
]).default("auto");

// ── Brand data helper ─────────────────────────────────────────────────────────

async function getBrandDataForOrg(orgId: number): Promise<
  BrandContext & {
    logoLightUrl: string | null;
    logoDarkUrl: string | null;
  }
> {
  try {
    const profile = await getSchoolProfile(orgId);
    // Also pull Brand DNA for richer context
    let dna: Record<string, unknown> | null = null;
    try {
      const { brandDna } = await import("../drizzle/schema");
      const db = await getDb();
      if (db) {
        const rows = await db.select().from(brandDna).where(eq(brandDna.orgId, orgId)).limit(1);
        if (rows.length > 0) dna = rows[0] as Record<string, unknown>;
      }
    } catch { /* Brand DNA table may not exist yet */ }
    // Build address string from components
    const addressParts = [
      profile?.addressStreet,
      profile?.addressCity,
      profile?.addressState,
      profile?.addressPostal,
    ].filter(Boolean);
    const address = addressParts.length > 0 ? addressParts.join(", ") : null;
    // Brand DNA overrides school profile colors when set
    const primaryColor = (dna?.primaryColor as string | null) ?? profile?.brandColorPrimary ?? null;
    const secondaryColor = (dna?.secondaryColor as string | null) ?? profile?.brandColorSecondary ?? null;
    const accentColor = (dna?.accentColor as string | null) ?? profile?.brandColorTertiary ?? null;
    const logoUrl = (dna?.logoUrl as string | null) ?? profile?.logoLightUrl ?? profile?.logoDarkUrl ?? null;
    return {
      schoolName: profile?.schoolName ?? null,
      tagline: profile?.tagline ?? null,
      phone: profile?.phone ?? null,
      email: profile?.email ?? null,
      website: profile?.website ?? null,
      primaryColor,
      secondaryColor,
      accentColor,
      address,
      logoUrl,
      logoLightUrl: profile?.logoLightUrl ?? null,
      logoDarkUrl: profile?.logoDarkUrl ?? null,
      // Extended Brand DNA fields injected into BrandContext
      brandTone: (dna?.brandTone as string | null) ?? null,
      brandVoice: (dna?.brandVoice as string | null) ?? null,
      designEnergy: (dna?.designEnergy as string | null) ?? null,
      headlineFont: (dna?.headlineFont as string | null) ?? null,
      visualStyle: (dna?.visualStyle as string | null) ?? null,
      primaryAudience: (dna?.primaryAudience as string | null) ?? null,
      ageRangeMin: (dna?.ageRangeMin as number | null) ?? null,
      ageRangeMax: (dna?.ageRangeMax as number | null) ?? null,
      programs: dna?.programs ? (() => { try { return JSON.parse(dna.programs as string); } catch { return null; } })() : null,
    } as BrandContext & { logoLightUrl: string | null; logoDarkUrl: string | null };
  } catch {
    return {
      schoolName: null,
      tagline: null,
      phone: null,
      website: null,
      primaryColor: null,
      secondaryColor: null,
      accentColor: null,
      address: null,
      logoUrl: null,
      logoLightUrl: null,
      logoDarkUrl: null,
    };
  }
}

// ── Helper: save generated image bytes to S3 (optional — skipped if credentials missing) ─────

async function saveImageToS3(
  imageBase64: string,
  mimeType: string,
  orgId: number,
  label: string
): Promise<{ url: string | null; key: string | null }> {
  const ext = mimeType.includes("jpeg") ? "jpg" : "png";
  const key = `creative/${orgId}/${Date.now()}-${label}.${ext}`;
  const buffer = Buffer.from(imageBase64, "base64");
  try {
    const { url } = await storagePut(key, buffer, mimeType);
    return { url, key };
  } catch (err: any) {
    // Storage not available (e.g. Railway deployment without Manus proxy)
    // Return null URL — the caller will use base64 data URL instead
    console.warn("[KaiCreative] S3 upload skipped:", err?.message ?? err);
    return { url: null, key: null };
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

export const kaiCreativeRouter = router({

  // ── Check context: returns business context + clarification + warnings ───────
  checkContext: orgScopedProcedure
    .input(
      z.object({
        prompt: z.string().min(1).max(2000),
      })
    )
    .query(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const result = await runContextInjection(input.prompt, orgId);
      return {
        clarification: result.clarification,
        warnings: result.warnings,
        contextSummary: result.contextSummary,
        hasLogo: !!result.context.logoUrl,
        hasPhone: !!result.context.phone,
        hasSchoolName: !!result.context.schoolName,
        programs: result.context.programs.slice(0, 8).map((p) => ({
          name: p.name,
          ageRange: p.ageRange,
          label: p.ageRange ? `${p.name} (${p.ageRange})` : p.name,
        })),
      };
    }),

  // ── Analyze brief: score prompt completeness and return questions ──────────
  analyzeBrief: orgScopedProcedure
    .input(
      z.object({
        prompt: z.string().min(0).max(2000),
        answers: z.record(z.string(), z.string()).default({}),
        fastMode: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const context = await loadBusinessContext(orgId);
      const analysis = analyzeBrief(
        input.prompt,
        context,
        input.answers,
        input.fastMode
      );
      // Enhance with OpenAI intent detection when prompt is non-empty (non-blocking)
      if (input.prompt.trim().length > 3) {
        try {
          const programNames = (context.programs ?? []).map((p: { name: string }) => p.name);
          const intent = await detectIntent(input.prompt, programNames);
          (analysis as unknown as Record<string, unknown>).openAiIntent = intent;
          // If OpenAI detects a program that the rule engine missed, surface it
          if (intent.detectedProgram && !analysis.programConfirmed) {
            (analysis as unknown as Record<string, unknown>).aiSuggestedProgram = intent.detectedProgram;
          }
        } catch {
          // OpenAI failure is non-blocking — system rules still apply
        }
      }
      return analysis;
    }),

  // ── Get program suggestions for clarification UI ───────────────────────────
  getProgramSuggestions: orgScopedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.currentOrganizationId as number;
      return getProgramSuggestions(orgId);
    }),

  // ── Generate: text prompt → image ──────────────────────────────────────────
  generate: orgScopedProcedure
    .input(
      z.object({
        prompt: z.string().min(3).max(2000),
        size: imageSizeSchema.default("instagram_post"),
        useBrandColors: z.boolean().default(true),
        assetName: z.string().optional(),
        style: stylePresetSchema,
        // Hard gate: client must pass confirmed brief fields
        briefAnswers: z.record(z.string(), z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;

      // ── SERVER-SIDE HARD EXECUTION GATE ────────────────────────────────────
      // Validate the brief against the 3-field gate before ANY generation.
      // This is the final enforcement layer — the client gate is UX-only.
      const briefContext = await loadBusinessContext(orgId);
      const briefCheck = analyzeBrief(
        input.prompt,
        briefContext,
        input.briefAnswers ?? {},
        false // fastMode is always false — gate cannot be bypassed
      );
      if (!briefCheck.canGenerate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Let's build this together — I just need a couple more details before I can create this for you. Please answer the quick questions in the brief panel.`,
        });
      }
      // ── END GATE ────────────────────────────────────────────────────────────

      // ALWAYS load brand — context injection enriches the prompt with real business data
      const brand = await getBrandDataForOrg(orgId);
      // Run context injection to enrich prompt with school name, phone, logo, programs
      const { enrichedPrompt: contextEnrichedPrompt } = await runContextInjection(input.prompt, orgId, true);
      // OpenAI creative direction enhancement (non-blocking, runs after system rules)
      let enrichedPrompt = contextEnrichedPrompt;
      try {
        const aiDirection = await enrichPromptContext(input.prompt, {
          schoolName: brand.schoolName ?? "",
          phone: brand.phone ?? null,
          logoUrl: brand.logoUrl ?? null,
          programs: Array.isArray((brand as any).programs) ? (brand as any).programs : [],
          primaryColor: brand.primaryColor ?? null,
        });
        if (aiDirection) {
          enrichedPrompt = `${contextEnrichedPrompt}\n\nCreative direction: ${aiDirection}`;
        }
      } catch {
        // OpenAI failure is non-blocking — use context-enriched prompt
      }

      const result = await generateImage(
        enrichedPrompt,
        input.size as ImageSize,
        brand,
        input.style as StylePreset
      );

      const { url: s3Url, key } = await saveImageToS3(
        result.imageBase64,
        result.mimeType,
        orgId,
        "gen"
      );

      // Use S3 URL if available, otherwise fall back to base64 data URL
      const imageUrl = s3Url ?? `data:${result.mimeType};base64,${result.imageBase64}`;

      // Always save to Creative Library (base64 fallback when S3 unavailable)
      const _genUrlToStore = s3Url ?? `data:${result.mimeType};base64,${result.imageBase64}`;
      const _genDb = await getDb();
      if (_genDb) {
        try {
          await _genDb.insert(creativeAssets).values({
            orgId,
            assetType: "generated",
            name: input.assetName ?? `Generated — ${new Date().toLocaleDateString()}`,
            url: _genUrlToStore,
            storageKey: key ?? null,
            prompt: input.prompt,
            outputSize: input.size,
            mimeType: result.mimeType,
            createdBy: ctx.user?.id ?? null,
          });
        } catch (e: any) {
          console.warn("[KaiCreative] generate DB insert failed:", e?.message);
        }
      }

      return {
        imageUrl,
        imageBase64: result.imageBase64,
        mimeType: result.mimeType,
        prompt: input.prompt,
        size: input.size,
      };
    }),

  // ── Generate with logo: logo base64 + prompt → branded image ───────────────
  generateWithLogo: orgScopedProcedure
    .input(
      z.object({
        prompt: z.string().min(3).max(2000),
        logoBase64: z.string(),
        logoMimeType: z.string().default("image/png"),
        size: imageSizeSchema.default("instagram_post"),
        useBrandColors: z.boolean().default(true),
        assetName: z.string().optional(),
        style: stylePresetSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const brand = await getBrandDataForOrg(orgId);
      const { enrichedPrompt: enrichedLogoPrompt } = await runContextInjection(input.prompt, orgId, true);

      const result = await generateWithLogo(
        enrichedLogoPrompt,
        input.logoBase64,
        input.logoMimeType,
        input.size as ImageSize,
        brand,
        input.style as StylePreset
      );

      const { url: s3Url, key } = await saveImageToS3(
        result.imageBase64,
        result.mimeType,
        orgId,
        "logo-gen"
      );

      const imageUrl = s3Url ?? `data:${result.mimeType};base64,${result.imageBase64}`;

      // Always save to Creative Library (base64 fallback when S3 unavailable)
      const _logoUrlToStore = s3Url ?? `data:${result.mimeType};base64,${result.imageBase64}`;
      const _logoDb = await getDb();
      if (_logoDb) {
        try {
          await _logoDb.insert(creativeAssets).values({
            orgId,
            assetType: "generated",
            name: input.assetName ?? `Logo Design — ${new Date().toLocaleDateString()}`,
            url: _logoUrlToStore,
            storageKey: key ?? null,
            prompt: input.prompt,
            outputSize: input.size,
            mimeType: result.mimeType,
            createdBy: ctx.user?.id ?? null,
          });
        } catch (e: any) {
          console.warn("[KaiCreative] generateWithLogo DB insert failed:", e?.message);
        }
      }

      return {
        imageUrl,
        imageBase64: result.imageBase64,
        mimeType: result.mimeType,
        prompt: input.prompt,
        size: input.size,
      };
    }),

  // ── Edit: existing image + prompt → edited image ───────────────────────────
  edit: orgScopedProcedure
    .input(
      z.object({
        prompt: z.string().min(3).max(2000),
        sourceImageBase64: z.string(),
        sourceMimeType: z.string().default("image/png"),
        size: imageSizeSchema.default("instagram_post"),
        useBrandColors: z.boolean().default(true),
        assetName: z.string().optional(),
        style: stylePresetSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const brand = await getBrandDataForOrg(orgId);
      const { enrichedPrompt: enrichedEditPrompt } = await runContextInjection(input.prompt, orgId, true);

      const result = await editImage(
        enrichedEditPrompt,
        input.sourceImageBase64,
        input.sourceMimeType,
        input.size as ImageSize,
        brand,
        input.style as StylePreset
      );

      const { url: s3Url, key } = await saveImageToS3(
        result.imageBase64,
        result.mimeType,
        orgId,
        "edit"
      );

      const imageUrl = s3Url ?? `data:${result.mimeType};base64,${result.imageBase64}`;

      // Always save to Creative Library (base64 fallback when S3 unavailable)
      const _editUrlToStore = s3Url ?? `data:${result.mimeType};base64,${result.imageBase64}`;
      const _editDb = await getDb();
      if (_editDb) {
        try {
          await _editDb.insert(creativeAssets).values({
            orgId,
            assetType: "generated",
            name: input.assetName ?? `Edited — ${new Date().toLocaleDateString()}`,
            url: _editUrlToStore,
            storageKey: key ?? null,
            prompt: input.prompt,
            outputSize: input.size,
            mimeType: result.mimeType,
            createdBy: ctx.user?.id ?? null,
          });
        } catch (e: any) {
          console.warn("[KaiCreative] edit DB insert failed:", e?.message);
        }
      }

      return {
        imageUrl,
        imageBase64: result.imageBase64,
        mimeType: result.mimeType,
        prompt: input.prompt,
        size: input.size,
      };
    }),

  // ── Upload asset (logo, photo) to library ─────────────────────────────────
  uploadAsset: orgScopedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        assetType: z.enum(["uploaded_logo", "uploaded_photo", "uploaded_other"]),
        base64Data: z.string(),
        mimeType: z.string().default("image/png"),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;

      const buffer = Buffer.from(input.base64Data, "base64");
      const ext = input.mimeType.split("/")[1] ?? "png";
      const key = `creative/${orgId}/${input.assetType}/${Date.now()}.${ext}`;

      let uploadUrl: string;
      let uploadKey: string | null = null;
      try {
        const result = await storagePut(key, buffer, input.mimeType);
        uploadUrl = result.url;
        uploadKey = result.key;
      } catch {
        // No storage proxy available — use base64 data URL
        uploadUrl = `data:${input.mimeType};base64,${input.base64Data}`;
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(creativeAssets).values({
        orgId,
        assetType: input.assetType,
        name: input.name,
        url: uploadUrl,
        storageKey: uploadKey,
        mimeType: input.mimeType,
        fileSizeBytes: buffer.length,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        createdBy: ctx.user?.id ?? null,
      });

      return { url: uploadUrl, key: uploadKey ?? key };
    }),

  // ── List assets ────────────────────────────────────────────────────────────
  listAssets: orgScopedProcedure
    .input(
      z.object({
        assetType: z
          .enum(["generated", "uploaded_logo", "uploaded_photo", "uploaded_other", "all"])
          .default("all"),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const db = await getDb();
      if (!db) return { assets: [] };

      const conditions =
        input.assetType === "all"
          ? [eq(creativeAssets.orgId, orgId)]
          : [eq(creativeAssets.orgId, orgId), eq(creativeAssets.assetType, input.assetType)];

      const assets = await db
        .select()
        .from(creativeAssets)
        .where(and(...conditions))
        .orderBy(desc(creativeAssets.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        assets: assets.map((a: typeof creativeAssets.$inferSelect) => ({
          id: a.id,
          assetType: a.assetType,
          name: a.name,
          url: a.url,
          prompt: a.prompt,
          outputSize: a.outputSize,
          mimeType: a.mimeType,
          isFavorited: a.isFavorited === 1,
          tags: a.tags ? (JSON.parse(a.tags) as string[]) : [],
          createdAt: a.createdAt,
        })),
      };
    }),

  // ── Delete asset ───────────────────────────────────────────────────────────
  deleteAsset: orgScopedProcedure
    .input(z.object({ assetId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(creativeAssets)
        .where(and(eq(creativeAssets.id, input.assetId), eq(creativeAssets.orgId, orgId)));

      return { success: true };
    }),

  // ── Toggle favorite ────────────────────────────────────────────────────────
  toggleFavorite: orgScopedProcedure
    .input(z.object({ assetId: z.number(), isFavorited: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(creativeAssets)
        .set({ isFavorited: input.isFavorited ? 1 : 0 })
        .where(and(eq(creativeAssets.id, input.assetId), eq(creativeAssets.orgId, orgId)));

      return { success: true };
    }),

  // ── Get brand data for UI ──────────────────────────────────────────────────
  getBrandData: orgScopedProcedure.query(async ({ ctx }) => {
    return getBrandDataForOrg(ctx.currentOrganizationId as number);
  }),

  // ── generateVariations: A/B — two parallel generations with different styles ─
  generateVariations: orgScopedProcedure
    .input(
      z.object({
        prompt: z.string().min(3).max(2000),
        size: imageSizeSchema.default("instagram_post"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const brand = await getBrandDataForOrg(orgId);
      const { enrichedPrompt: enrichedVarPrompt } = await runContextInjection(input.prompt, orgId, true);

      // Generate 4 style variations in parallel using the new service
      const { variations } = await generateImageVariations(
        enrichedVarPrompt,
        input.size as ImageSize,
        brand
      );

      // Save all 4 to S3 in parallel (best-effort)
      const saves = await Promise.all(
        variations.map((v, i) =>
          saveImageToS3(v.imageBase64, v.mimeType, orgId, `variation-${i + 1}-${v.styleId}`)
        )
      );

      // Build result array with URLs and save to DB
      const dbConn = await getDb();
      const results = await Promise.all(
        variations.map(async (v, i) => {
          const imageUrl = saves[i].url ?? `data:${v.mimeType};base64,${v.imageBase64}`;
          let assetId: number | null = null;
          if (dbConn) {
            try {
              const [ins] = await dbConn.insert(creativeAssets).values({
                orgId,
                assetType: "generated",
                name: `${v.styleLabel} — ${input.prompt.slice(0, 50)}`,
                url: imageUrl,
                storageKey: saves[i].key ?? null,
                prompt: input.prompt,
                outputSize: input.size,
                mimeType: v.mimeType,
                createdBy: ctx.user?.id ?? null,
              }).$returningId();
              assetId = (ins as any)?.id ?? null;
            } catch (dbErr: any) {
              console.warn("[KaiCreative] generateVariations DB insert failed:", dbErr?.message ?? dbErr);
            }
          }
          return {
            imageUrl,
            imageBase64: v.imageBase64,
            mimeType: v.mimeType,
            styleLabel: v.styleLabel,
            styleId: v.styleId,
            assetId,
          };
        })
      );

      return {
        variations: results,
        prompt: input.prompt,
        size: input.size,
        savedToLibrary: results.some((r) => r.assetId !== null),
      };
    }),

  // ── generateFromChat: unified pipeline called from Kai chat ───────────────
  // Accepts a text prompt (and optional uploaded source image for edit mode),
  // generates via Gemini, auto-saves to Creative Library, and returns a
  // preview card payload the chat UI renders as a CreativePreviewCard.
  generateFromChat: orgScopedProcedure
    .input(
      z.object({
        prompt: z.string().min(3).max(2000),
        size: imageSizeSchema.default("instagram_post"),
        // Optional source image for edit mode (uploaded from chat)
        sourceImageBase64: z.string().optional(),
        sourceMimeType: z.string().optional(),
        // Style preset — auto-detected from prompt if not provided
        style: stylePresetSchema,
        // Hard gate: client must pass confirmed brief fields
        briefAnswers: z.record(z.string(), z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;

      // Gate removed — generate immediately with whatever context is available.
      // The prompt enrichment below will fill in brand details automatically.

      const brand = await getBrandDataForOrg(orgId);
      const { enrichedPrompt: contextChatPrompt } = await runContextInjection(input.prompt, orgId, true);
      // OpenAI creative direction enhancement (non-blocking, runs after system rules)
      let enrichedChatPrompt = contextChatPrompt;
      try {
        const aiChatDirection = await enrichPromptContext(input.prompt, {
          schoolName: brand.schoolName ?? "",
          phone: brand.phone ?? null,
          logoUrl: brand.logoUrl ?? null,
          programs: Array.isArray((brand as any).programs) ? (brand as any).programs : [],
          primaryColor: brand.primaryColor ?? null,
        });
        if (aiChatDirection) {
          enrichedChatPrompt = `${contextChatPrompt}\n\nCreative direction: ${aiChatDirection}`;
        }
      } catch {
        // OpenAI failure is non-blocking
      }
      // Auto-detect style from prompt if not explicitly set
      const resolvedStyle = (input.style === "auto" || !input.style)
        ? parseStyleFromText(input.prompt)
        : input.style as StylePreset;

      let result: { imageBase64: string; mimeType: string };

      // ── FLYER/POSTER ROUTE: use HTML renderer for clean typography ──────────
      // ALL flyer/poster/social sizes use the HTML-to-PNG renderer unconditionally.
      // Pure image generation models cannot render readable text in structured layouts.
      // We never fall back to Imagen for these sizes — if the renderer fails, we throw.
      const isFlyerSize = input.size === "flyer" || input.size === "instagram_post" ||
        input.size === "instagram_story" || input.size === "facebook_ad";

      if (!input.sourceImageBase64 && isFlyerSize) {
        // Use HTML renderer for structured flyer output — unconditional, no Imagen fallback
        const flyerData = await parseFlyerDataFromBrief(
          input.prompt,
          input.briefAnswers ?? {},
          {
            schoolName: brand.schoolName ?? null,
            phone: brand.phone ?? null,
            email: (brand as any).email ?? null,
            website: brand.website ?? null,
            primaryColor: brand.primaryColor ?? null,
            secondaryColor: brand.secondaryColor ?? null,
            logoUrl: brand.logoUrl ?? null,
            address: brand.address ?? null,
          },
          input.size as "flyer" | "instagram_post" | "instagram_story" | "facebook_ad" | "website_banner"
        );
        const html = buildFlyerHtml(flyerData);
        const pngBuffer = await renderFlyerToPng(html, flyerData.size);
        result = {
          imageBase64: pngBuffer.toString("base64"),
          mimeType: "image/png",
        };
      } else if (input.sourceImageBase64) {
        // Edit mode — source image was uploaded in chat
        result = await editImage(
          enrichedChatPrompt,
          input.sourceImageBase64,
          input.sourceMimeType ?? "image/png",
          input.size as ImageSize,
          brand,
          resolvedStyle
        );
      } else {
        // Generate mode — text prompt only (photos, illustrations, etc.)
        result = await generateImage(
          enrichedChatPrompt,
          input.size as ImageSize,
          brand,
          resolvedStyle
        );
      }

      const { url: s3Url, key } = await saveImageToS3(
        result.imageBase64,
        result.mimeType,
        orgId,
        "chat-gen"
      );

      const imageUrl = s3Url ?? `data:${result.mimeType};base64,${result.imageBase64}`;

      // Always save to Creative Library.
      // If S3 is available, store the CDN URL. Otherwise store the base64 data URL
      // (url column is MEDIUMTEXT, supports up to 16MB).
      const urlToStore = s3Url ?? `data:${result.mimeType};base64,${result.imageBase64}`;
      let assetId: number | null = null;
      let savedToLibrary = false;
      const dbConn = await getDb();
      if (dbConn) {
        try {
          const inserted = await dbConn
            .insert(creativeAssets)
            .values({
              orgId,
              assetType: "generated",
              name: `Chat — ${input.prompt.slice(0, 60)}`,
              url: urlToStore,
              storageKey: key ?? null,
              prompt: input.prompt,
              outputSize: input.size,
              mimeType: result.mimeType,
              createdBy: ctx.user?.id ?? null,
            })
            .$returningId();
          assetId = (inserted as any)?.[0]?.id ?? null;
          savedToLibrary = true;
        } catch (dbErr: any) {
          console.warn("[KaiCreative] DB insert failed:", dbErr?.message ?? dbErr);
        }
      }

      return {
        imageUrl,
        imageBase64: result.imageBase64,
        mimeType: result.mimeType,
        prompt: input.prompt,
        size: input.size,
        assetId,
        savedToLibrary,
      };
    }),

  // ── saveGeneratedAsset: manual save from chat card when auto-save failed ──────
  saveGeneratedAsset: orgScopedProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        mimeType: z.string().default("image/png"),
        prompt: z.string().max(2000),
        size: z.string().default("flyer"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const buffer = Buffer.from(input.imageBase64, "base64");
      const ext = input.mimeType.includes("jpeg") ? "jpg" : "png";
      const key = `creative/${orgId}/generated/${Date.now()}.${ext}`;
      let uploadUrl: string;
      let uploadKey: string | null = null;
      try {
        const result = await storagePut(key, buffer, input.mimeType);
        uploadUrl = result.url;
        uploadKey = result.key;
      } catch {
        uploadUrl = `data:${input.mimeType};base64,${input.imageBase64}`;
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const inserted = await db
        .insert(creativeAssets)
        .values({
          orgId,
          assetType: "generated",
          name: `Chat — ${input.prompt.slice(0, 60)}`,
          url: uploadUrl,
          storageKey: uploadKey,
          prompt: input.prompt,
          outputSize: input.size,
          mimeType: input.mimeType,
          createdBy: ctx.user?.id ?? null,
        })
        .$returningId();
      const assetId = (inserted as any)?.[0]?.id ?? null;
      return { assetId, url: uploadUrl, savedToLibrary: true };
    }),

  // ── Generate marketing copy: OpenAI-powered copywriting for flyers/ads ───────
  generateCopy: orgScopedProcedure
    .input(
      z.object({
        program: z.string().min(1).max(200),
        audience: z.string().optional(),
        format: z.enum(["flyer", "social_post", "email", "sms", "ad"]).default("flyer"),
        tone: z.string().optional(),
        keyContent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const brand = await getBrandDataForOrg(orgId);
      const copy = await generateMarketingCopy(
        input.program,
        input.audience,
        input.tone ?? "bold and energetic",
        {
          schoolName: brand.schoolName ?? "",
          phone: brand.phone ?? null,
          website: brand.website ?? null,
          primaryColor: brand.primaryColor ?? null,
        },
        {
          programName: input.program,
        }
      );
      return copy;
    }),

  // ── generatePlatformCopy: Platform-specific copy for Facebook/Instagram/TikTok/Google/SMS ──
  generatePlatformCopy: orgScopedProcedure
    .input(
      z.object({
        program: z.string().min(1).max(200),
        audience: z.string().optional().default("all ages"),
        tone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const brand = await getBrandDataForOrg(orgId);
      return generatePlatformCopyVariants({
        program: input.program,
        audience: input.audience ?? "all ages",
        tone: input.tone ?? "bold and energetic",
        brandContext: {
          schoolName: brand.schoolName ?? "",
          phone: brand.phone ?? null,
          website: brand.website ?? null,
          primaryColor: brand.primaryColor ?? null,
        },
        lockedValues: { programName: input.program },
      });
    }),

  // ── generateVideoAd: AI video reel with ElevenLabs voiceover + ffmpeg assembly ──
  generateVideoAd: orgScopedProcedure
    .input(
      z.object({
        program: z.string().min(1).max(200),
        audience: z.string().optional().default("all ages"),
        tone: z.string().optional(),
        format: z.enum(["reel", "story", "square"]).default("reel"),
        backgroundImageBase64: z.string().optional(),
        voiceId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const brand = await getBrandDataForOrg(orgId);
      return generateVideoAd({
        program: input.program,
        audience: input.audience ?? "all ages",
        tone: input.tone ?? "energetic and motivational",
        format: input.format,
        backgroundImageBase64: input.backgroundImageBase64,
        voiceId: input.voiceId,
        brandContext: {
          schoolName: brand.schoolName ?? "",
          phone: brand.phone ?? null,
          website: brand.website ?? null,
          primaryColor: brand.primaryColor ?? null,
          logoUrl: brand.logoUrl ?? null,
        },
        orgId,
      });
    }),
});

// ── Exported helper for Kai tool calls ───────────────────────────────────────
/**
 * generateFlyerFromKai — called from executeCRMFunction when Kai's generate_flyer tool fires.
 * Runs the same pipeline as generateFromChat but without the tRPC context requirement.
 */
export async function generateFlyerFromKai(
  orgId: number,
  prompt: string,
  size: string = 'flyer'
): Promise<{
  imageUrl: string;
  imageBase64: string;
  mimeType: string;
  prompt: string;
  size: string;
  assetId: number | null;
  savedToLibrary: boolean;
}> {
  const validSize = ['flyer', 'instagram_post', 'instagram_story', 'facebook_ad', 'website_banner', 'business_card'].includes(size)
    ? size as ImageSize
    : 'flyer' as ImageSize;

  const brand = await getBrandDataForOrg(orgId);

  // ── Pipeline: Gemini AI generation + sharp compositing ──────────────────────
  // 1. Use kaiPromptEngine to build a premium, conversion-focused prompt
  // 2. Gemini Imagen generates the full cinematic background + hero image + headline
  // 3. sharp composites the real school logo (with background strip) on top
  // 4. sharp composites a real scannable QR code in the bottom-right

  const schoolName = brand.schoolName || 'Your Dojo';
  const phone = brand.phone || '';
  const address = brand.address || '';
  const website = brand.website || '';
  const isBusinessCard = validSize === 'business_card';

  // ── Build the Imagen prompt ──────────────────────────────────────────────────
  // KEY INSIGHT: Imagen 4 produces the best results when the prompt focuses on
  // VISUAL DESIGN (background, hero image, color, mood, typography style) and
  // keeps text to an absolute minimum (1-2 text elements max).
  // All contact info, phone numbers, and detailed copy are composited via sharp.
  //
  // The kaiPromptEngine is used for the full marketing context, but we override
  // the text-heavy sections with a visuals-first directive.

  const resolvedStyle = parseStyleFromText(prompt);

  // Build a visuals-first prompt that tells Imagen what to DRAW, not what text to render
  const programContext = (() => {
    const lower = prompt.toLowerCase();
    if (lower.includes('little ninja') || lower.includes('tiny ninja')) return { program: 'Little Ninjas', ages: '3-5', visual: 'two happy young children (ages 3-5) in white karate gi doing a high kick together, big smiles, energetic, professional sports photography' };
    if (lower.includes('kids') || lower.includes('children') || lower.includes('youth')) return { program: 'Kids Karate', ages: '6-12', visual: 'a confident child (age 8-10) in white karate gi doing a powerful punch, dramatic lighting, professional sports photography' };
    if (lower.includes('teen') || lower.includes('teenage')) return { program: 'Teen Karate', ages: '13-17', visual: 'a confident teenager in black karate gi in a powerful stance, cinematic dark background, dramatic lighting' };
    if (lower.includes('adult') || lower.includes('women') || lower.includes('self defense')) return { program: 'Adult Karate', ages: 'Adults 18+', visual: 'a confident adult martial artist in gi doing a powerful kick, cinematic, dark dramatic background' };
    if (lower.includes('summer camp') || lower.includes('camp')) return { program: 'Summer Camp', ages: '5-12', visual: 'group of happy children in karate uniforms outdoors, summer energy, professional photography' };
    if (lower.includes('belt test') || lower.includes('graduation')) return { program: 'Belt Test', ages: 'All Students', visual: 'martial arts student receiving a new belt from instructor, proud moment, cinematic lighting' };
    return { program: 'Martial Arts', ages: 'All Ages', visual: 'a powerful martial artist in gi doing a dramatic kick, cinematic dark background, professional sports photography' };
  })();

  const primaryColor = brand.primaryColor || '#C8102E';
  const hasLogo = !!(brand.logoUrl && (brand.logoUrl.startsWith('http') || brand.logoUrl.startsWith('data:')));

  const imagenPrompt = isBusinessCard
    ? `Professional martial arts school business card design. School: "${schoolName}". Dark background with ${primaryColor} accents. Clean modern typography. Martial arts themed. Horizontal layout. Premium, sleek, print-ready. NO generic clip art. Real photography style background.`
    : [
        `Create a CINEMATIC, PHOTOREALISTIC martial arts marketing poster/flyer.`,
        ``,
        `HERO IMAGE (fills 60% of the design): ${programContext.visual}`,
        `PHOTOREALISM MANDATE: Real photography style. NO cartoons. NO illustrations. NO anime. NO 3D renders.`,
        ``,
        `COLOR PALETTE: Deep dark background (near-black or dark navy), ${primaryColor} as the dominant accent color, white text.`,
        ``,
        `TYPOGRAPHY — render ONLY these 2 text elements (nothing else):`,
        `  1. HEADLINE at top: Bold, condensed, white text on dark background — 3-5 words maximum`,
        `  2. CTA BUTTON at bottom: Bold red/accent button — "ENROLL TODAY" or "FREE TRIAL"`,
        ``,
        `LAYOUT:`,
        `  - TOP 15%: Dark header strip — leave clean (logo will be composited here)`,
        `  - MIDDLE 60%: Hero photography — ${programContext.visual}`,
        `  - BOTTOM 25%: Dark footer strip — leave clean (contact info will be composited here)`,
        ``,
        `STYLE: Cinematic sports poster quality. Think Nike or Under Armour ad. Bold. High contrast. Premium.`,
        `DO NOT render: phone numbers, addresses, websites, QR codes, benefit lists, bullet points, or any small text.`,
        `DO NOT render: any logo, emblem, shield, or crest — leave the header strip clean.`,
        `ONLY render: the hero image, headline text, and CTA button.`,
      ].join('\n');

  const result = await generateImage(imagenPrompt, validSize, brand, resolvedStyle);
  let imageBase64 = result.imageBase64;
  let mimeType = result.mimeType;

  // ── Step 2: Composite logo + footer strip using sharp ──────────────────────────
  // This step adds professional branding elements that Imagen can't reliably render:
  // - School logo with a dark semi-transparent background pill at top-center
  // - Dark footer strip with school name, phone, address, website
  // - Real scannable QR code in the bottom-right corner

  try {
    const sharp = (await import('sharp')).default;
    const mainBuf = Buffer.from(imageBase64, 'base64');
    const mainMeta = await sharp(mainBuf).metadata();
    const w = mainMeta.width || 800;
    const h = mainMeta.height || 1000;

    const compositeInputs: sharp.OverlayOptions[] = [];

    // ── Footer strip: dark semi-transparent bar at the bottom ────────────────────
    // Height: ~22% of image height, contains school name + contact info
    const footerH = Math.round(h * 0.22);
    const footerTop = h - footerH;
    // Build SVG footer with school name, phone, address, website
    const contactLines: string[] = [];
    if (phone) contactLines.push(phone);
    if (address) contactLines.push(address);
    if (website) contactLines.push(website);
    const contactText = contactLines.join('  ·  ');
    const footerSvg = `<svg width="${w}" height="${footerH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="footerGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)" />
      <stop offset="40%" stop-color="rgba(0,0,0,0.85)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.95)" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${footerH}" fill="url(#footerGrad)" />
  <text x="${w / 2}" y="${Math.round(footerH * 0.42)}" 
    font-family="Arial Black, Arial, sans-serif" 
    font-size="${Math.round(w * 0.045)}" 
    font-weight="900" 
    fill="white" 
    text-anchor="middle" 
    letter-spacing="2">${schoolName.toUpperCase()}</text>
  ${contactText ? `<text x="${w / 2}" y="${Math.round(footerH * 0.68)}" 
    font-family="Arial, sans-serif" 
    font-size="${Math.round(w * 0.022)}" 
    font-weight="400" 
    fill="rgba(255,255,255,0.8)" 
    text-anchor="middle">${contactText}</text>` : ''}
</svg>`;
    const footerBuf = Buffer.from(footerSvg);
    compositeInputs.push({ input: footerBuf, top: footerTop, left: 0, blend: 'over' });

    // ── Logo: centered at top with dark pill background ─────────────────────────
    const logoUrl = brand.logoUrl;
    if (logoUrl && (logoUrl.startsWith('http') || logoUrl.startsWith('data:'))) {
      try {
        let logoBuf: Buffer;
        if (logoUrl.startsWith('data:')) {
          const b64 = logoUrl.replace(/^data:[^;]+;base64,/, '');
          logoBuf = Buffer.from(b64, 'base64');
        } else {
          const { default: https } = await import('https');
          const { default: http } = await import('http');
          logoBuf = await new Promise<Buffer>((resolve, reject) => {
            const client = logoUrl.startsWith('https') ? https : http;
            client.get(logoUrl, (res) => {
              const chunks: Buffer[] = [];
              res.on('data', (c: Buffer) => chunks.push(c));
              res.on('end', () => resolve(Buffer.concat(chunks)));
              res.on('error', reject);
            }).on('error', reject);
          });
        }
        // Target logo size: max 220px wide, 80px tall
        const logoMaxW = Math.round(w * 0.28);
        const logoMaxH = Math.round(h * 0.08);
        const logoResized = await sharp(logoBuf)
          .resize(logoMaxW, logoMaxH, { fit: 'inside', withoutEnlargement: true })
          .png()
          .toBuffer();
        const logoMeta = await sharp(logoResized).metadata();
        const lw = logoMeta.width || logoMaxW;
        const lh = logoMeta.height || logoMaxH;
        // Dark pill background behind logo
        const pillPadX = 24;
        const pillPadY = 12;
        const pillW = lw + pillPadX * 2;
        const pillH = lh + pillPadY * 2;
        const pillLeft = Math.round((w - pillW) / 2);
        const pillTop = 20;
        const pillSvg = `<svg width="${pillW}" height="${pillH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" ry="${Math.round(pillH / 2)}" fill="rgba(0,0,0,0.72)" />
</svg>`;
        compositeInputs.push({ input: Buffer.from(pillSvg), top: pillTop, left: pillLeft, blend: 'over' });
        // Logo centered inside the pill
        const logoLeft = pillLeft + pillPadX;
        const logoTop = pillTop + pillPadY;
        compositeInputs.push({ input: logoResized, top: logoTop, left: logoLeft, blend: 'over' });
        console.log('[KaiCreative] Logo composited with pill background at top-center');
      } catch (logoErr: any) {
        console.warn('[KaiCreative] Logo compositing failed (non-blocking):', logoErr?.message);
      }
    }

    // ── QR code: bottom-right corner ───────────────────────────────────────────────
    try {
      const { generateQrCodeDataUrl } = await import('./flyerRenderer');
      const qrUrl = website || `https://www.google.com/search?q=${encodeURIComponent(schoolName + ' martial arts')}`;
      const qrDataUrl = await generateQrCodeDataUrl(qrUrl);
      if (qrDataUrl) {
        const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
        const qrBuf = Buffer.from(qrBase64, 'base64');
        const qrSize = Math.round(w * 0.14); // ~14% of width
        const qrResized = await sharp(qrBuf).resize(qrSize, qrSize).png().toBuffer();
        // White background behind QR for scannability
        const qrPad = 6;
        const qrBgSvg = `<svg width="${qrSize + qrPad * 2}" height="${qrSize + qrPad * 2}" xmlns="http://www.w3.org/2000/svg"><rect width="${qrSize + qrPad * 2}" height="${qrSize + qrPad * 2}" rx="4" fill="white"/></svg>`;
        const qrBgLeft = w - qrSize - qrPad * 2 - 16;
        const qrBgTop = h - footerH + Math.round((footerH - qrSize - qrPad * 2) / 2);
        compositeInputs.push({ input: Buffer.from(qrBgSvg), top: qrBgTop, left: qrBgLeft, blend: 'over' });
        compositeInputs.push({ input: qrResized, top: qrBgTop + qrPad, left: qrBgLeft + qrPad, blend: 'over' });
        console.log('[KaiCreative] QR code composited in footer');
      }
    } catch (qrErr: any) {
      console.warn('[KaiCreative] QR compositing failed (non-blocking):', qrErr?.message);
    }

    // Apply all composites in one sharp pass
    if (compositeInputs.length > 0) {
      const finalBuf = await sharp(mainBuf).composite(compositeInputs).png().toBuffer();
      imageBase64 = finalBuf.toString('base64');
      mimeType = 'image/png';
      console.log(`[KaiCreative] Composited ${compositeInputs.length} elements onto flyer`);
    }
  } catch (compErr: any) {
    console.warn('[KaiCreative] Compositing failed (non-blocking):', compErr?.message);
  }

  const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
  const key = `creative/${orgId}/generated/${Date.now()}.${ext}`;
  let imageUrl: string = `data:${mimeType};base64,${imageBase64}`;
  let s3Key: string | null = null;
  try {
    const { storagePut: sp } = await import('./storage');
    const buffer = Buffer.from(imageBase64, 'base64');
    const s3Result = await sp(key, buffer, mimeType);
    imageUrl = s3Result.url;
    s3Key = s3Result.key;
  } catch { /* non-blocking */ }

  // Save to creative library
  let assetId: number | null = null;
  let savedToLibrary = false;
  const db = await getDb();
  if (db) {
    try {
      const inserted = await db.insert(creativeAssets).values({
        orgId,
        assetType: 'generated',
        name: `Kai — ${prompt.slice(0, 60)}`,
        url: imageUrl,
        storageKey: s3Key,
        prompt,
        outputSize: validSize,
        mimeType,
        createdBy: null,
      }).$returningId();
      assetId = (inserted as any)?.[0]?.id ?? null;
      savedToLibrary = true;
    } catch { /* non-blocking */ }
  }

  return {
    imageUrl,
    imageBase64,
    mimeType,
    prompt,
    size: validSize,
    assetId,
    savedToLibrary,
  };
}
