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

// ── Zod schemas ───────────────────────────────────────────────────────────────

const imageSizeSchema = z.enum([
  "instagram_post",
  "instagram_story",
  "facebook_ad",
  "flyer",
  "website_banner",
]);

// ── Brand data helper ─────────────────────────────────────────────────────────

async function getBrandDataForOrg(orgId: number): Promise<
  BrandContext & {
    logoLightUrl: string | null;
    logoDarkUrl: string | null;
  }
> {
  try {
    const profile = await getSchoolProfile(orgId);
    return {
      schoolName: profile?.schoolName ?? null,
      tagline: profile?.tagline ?? null,
      phone: profile?.phone ?? null,
      website: profile?.website ?? null,
      primaryColor: profile?.brandColorPrimary ?? null,
      secondaryColor: profile?.brandColorSecondary ?? null,
      logoLightUrl: profile?.logoLightUrl ?? null,
      logoDarkUrl: profile?.logoDarkUrl ?? null,
    };
  } catch {
    return {
      schoolName: null,
      tagline: null,
      phone: null,
      website: null,
      primaryColor: null,
      secondaryColor: null,
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

  // ── Generate: text prompt → image ──────────────────────────────────────────
  generate: orgScopedProcedure
    .input(
      z.object({
        prompt: z.string().min(3).max(2000),
        size: imageSizeSchema.default("instagram_post"),
        useBrandColors: z.boolean().default(true),
        assetName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const brand = input.useBrandColors ? await getBrandDataForOrg(orgId) : undefined;

      const result = await generateImage(
        input.prompt,
        input.size as ImageSize,
        brand ?? undefined
      );

      const { url: s3Url, key } = await saveImageToS3(
        result.imageBase64,
        result.mimeType,
        orgId,
        "gen"
      );

      // Use S3 URL if available, otherwise fall back to base64 data URL
      const imageUrl = s3Url ?? `data:${result.mimeType};base64,${result.imageBase64}`;

      // Auto-save to asset library (only if S3 upload succeeded)
      if (s3Url && key) {
        const db = await getDb();
        if (db) {
          await db.insert(creativeAssets).values({
            orgId,
            assetType: "generated",
            name: input.assetName ?? `Generated — ${new Date().toLocaleDateString()}`,
            url: s3Url,
            storageKey: key,
            prompt: input.prompt,
            outputSize: input.size,
            mimeType: result.mimeType,
            createdBy: ctx.user?.id ?? null,
          });
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const brand = input.useBrandColors ? await getBrandDataForOrg(orgId) : undefined;

      const result = await generateWithLogo(
        input.prompt,
        input.logoBase64,
        input.logoMimeType,
        input.size as ImageSize,
        brand ?? undefined
      );

      const { url: s3Url, key } = await saveImageToS3(
        result.imageBase64,
        result.mimeType,
        orgId,
        "logo-gen"
      );

      const imageUrl = s3Url ?? `data:${result.mimeType};base64,${result.imageBase64}`;

      if (s3Url && key) {
        const db = await getDb();
        if (db) {
          await db.insert(creativeAssets).values({
            orgId,
            assetType: "generated",
            name: input.assetName ?? `Logo Design — ${new Date().toLocaleDateString()}`,
            url: s3Url,
            storageKey: key,
            prompt: input.prompt,
            outputSize: input.size,
            mimeType: result.mimeType,
            createdBy: ctx.user?.id ?? null,
          });
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const brand = input.useBrandColors ? await getBrandDataForOrg(orgId) : undefined;

      const result = await editImage(
        input.prompt,
        input.sourceImageBase64,
        input.sourceMimeType,
        input.size as ImageSize,
        brand ?? undefined
      );

      const { url: s3Url, key } = await saveImageToS3(
        result.imageBase64,
        result.mimeType,
        orgId,
        "edit"
      );

      const imageUrl = s3Url ?? `data:${result.mimeType};base64,${result.imageBase64}`;

      if (s3Url && key) {
        const db = await getDb();
        if (db) {
          await db.insert(creativeAssets).values({
            orgId,
            assetType: "generated",
            name: input.assetName ?? `Edited — ${new Date().toLocaleDateString()}`,
            url: s3Url,
            storageKey: key,
            prompt: input.prompt,
            outputSize: input.size,
            mimeType: result.mimeType,
            createdBy: ctx.user?.id ?? null,
          });
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const brand = await getBrandDataForOrg(orgId);

      let result: { imageBase64: string; mimeType: string };

      if (input.sourceImageBase64) {
        // Edit mode — source image was uploaded in chat
        result = await editImage(
          input.prompt,
          input.sourceImageBase64,
          input.sourceMimeType ?? "image/png",
          input.size as ImageSize,
          brand
        );
      } else {
        // Generate mode — text prompt only
        result = await generateImage(
          input.prompt,
          input.size as ImageSize,
          brand
        );
      }

      const { url: s3Url, key } = await saveImageToS3(
        result.imageBase64,
        result.mimeType,
        orgId,
        "chat-gen"
      );

      const imageUrl = s3Url ?? `data:${result.mimeType};base64,${result.imageBase64}`;

      // Auto-save to Creative Library
      let assetId: number | null = null;
      const db = await getDb();
      if (db) {
        const inserted = await db
          .insert(creativeAssets)
          .values({
            orgId,
            assetType: "generated",
            name: `Chat — ${input.prompt.slice(0, 60)}`,
            url: imageUrl,
            storageKey: key,
            prompt: input.prompt,
            outputSize: input.size,
            mimeType: result.mimeType,
            createdBy: ctx.user?.id ?? null,
          })
          .$returningId();
        assetId = (inserted as any)?.[0]?.id ?? null;
      }

      return {
        imageUrl,
        imageBase64: result.imageBase64,
        mimeType: result.mimeType,
        prompt: input.prompt,
        size: input.size,
        assetId,
        savedToLibrary: db !== null,
      };
    }),
});
