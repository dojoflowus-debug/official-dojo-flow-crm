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
  type ImageSize,
  type BrandContext,
} from "./geminiImageService";
import { parseStyleFromText, type StylePreset } from "./kaiPromptEngine";
import { runContextInjection, getProgramSuggestions } from "./contextInjectionEngine";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const imageSizeSchema = z.enum([
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      // ALWAYS load brand — context injection enriches the prompt with real business data
      const brand = await getBrandDataForOrg(orgId);
      // Run context injection to enrich prompt with school name, phone, logo, programs
      const { enrichedPrompt } = await runContextInjection(input.prompt, orgId, true);

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
        // The two style presets to compare. Defaults to energetic vs premium.
        styleA: stylePresetSchema.default("energetic"),
        styleB: stylePresetSchema.default("premium"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const brand = await getBrandDataForOrg(orgId);
      const { enrichedPrompt: enrichedVarPrompt } = await runContextInjection(input.prompt, orgId, true);

      // Resolve auto styles
      const resolvedA = (input.styleA === "auto" || !input.styleA)
        ? parseStyleFromText(input.prompt)
        : input.styleA as StylePreset;
      const resolvedB = (input.styleB === "auto" || !input.styleB)
        ? "premium" as StylePreset
        : input.styleB as StylePreset;

      // Run both generations in parallel
      const [resultA, resultB] = await Promise.all([
        generateImage(enrichedVarPrompt, input.size as ImageSize, brand, resolvedA),
        generateImage(enrichedVarPrompt, input.size as ImageSize, brand, resolvedB),
      ]);

      // Save both to S3 (best-effort) and DB in parallel
      const [saveA, saveB] = await Promise.all([
        saveImageToS3(resultA.imageBase64, resultA.mimeType, orgId, "variation-a"),
        saveImageToS3(resultB.imageBase64, resultB.mimeType, orgId, "variation-b"),
      ]);

      const imageUrlA = saveA.url ?? `data:${resultA.mimeType};base64,${resultA.imageBase64}`;
      const imageUrlB = saveB.url ?? `data:${resultB.mimeType};base64,${resultB.imageBase64}`;

      const dbConn = await getDb();
      let assetIdA: number | null = null;
      let assetIdB: number | null = null;

      if (dbConn) {
        try {
          const [insA, insB] = await Promise.all([
            dbConn.insert(creativeAssets).values({
              orgId,
              assetType: "generated",
              name: `Variation A (${resolvedA}) — ${input.prompt.slice(0, 50)}`,
              url: imageUrlA,
              storageKey: saveA.key ?? null,
              prompt: input.prompt,
              outputSize: input.size,
              mimeType: resultA.mimeType,
              createdBy: ctx.user?.id ?? null,
            }).$returningId(),
            dbConn.insert(creativeAssets).values({
              orgId,
              assetType: "generated",
              name: `Variation B (${resolvedB}) — ${input.prompt.slice(0, 50)}`,
              url: imageUrlB,
              storageKey: saveB.key ?? null,
              prompt: input.prompt,
              outputSize: input.size,
              mimeType: resultB.mimeType,
              createdBy: ctx.user?.id ?? null,
            }).$returningId(),
          ]);
          assetIdA = (insA as any)?.[0]?.id ?? null;
          assetIdB = (insB as any)?.[0]?.id ?? null;
        } catch (dbErr: any) {
          console.warn("[KaiCreative] generateVariations DB insert failed:", dbErr?.message ?? dbErr);
        }
      }

      return {
        variantA: {
          imageUrl: imageUrlA,
          imageBase64: resultA.imageBase64,
          mimeType: resultA.mimeType,
          style: resolvedA,
          assetId: assetIdA,
        },
        variantB: {
          imageUrl: imageUrlB,
          imageBase64: resultB.imageBase64,
          mimeType: resultB.mimeType,
          style: resolvedB,
          assetId: assetIdB,
        },
        prompt: input.prompt,
        size: input.size,
        savedToLibrary: !!(assetIdA || assetIdB),
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const brand = await getBrandDataForOrg(orgId);
      const { enrichedPrompt: enrichedChatPrompt } = await runContextInjection(input.prompt, orgId, true);

      // Auto-detect style from prompt if not explicitly set
      const resolvedStyle = (input.style === "auto" || !input.style)
        ? parseStyleFromText(input.prompt)
        : input.style as StylePreset;

      let result: { imageBase64: string; mimeType: string };

      if (input.sourceImageBase64) {
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
        // Generate mode — text prompt only
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
});
