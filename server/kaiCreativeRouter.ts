import { z } from "zod";
import { orgScopedProcedure, router } from "./_core/trpc";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import { getSchoolProfile } from "./schoolProfileDb";
import { getDb } from "./db";
import { creativeAssets } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  buildBrandAwarePrompt,
  buildFreeformPrompt,
  CREATIVE_TEMPLATES,
  getFollowUpSuggestions,
  type OutputSize,
} from "../shared/kaiCreativeTemplates";

// ─── Helper: get brand data for an org ───────────────────────────────────────
async function getBrandData(orgId: number) {
  try {
    const profile = await getSchoolProfile(orgId);
    return {
      schoolName: profile?.schoolName ?? null,
      primaryColor: profile?.brandColorPrimary ?? null,
      secondaryColor: profile?.brandColorSecondary ?? null,
      tagline: profile?.tagline ?? null,
      phone: profile?.phone ?? null,
      website: profile?.website ?? null,
      logoLightUrl: profile?.logoLightUrl ?? null,
      logoDarkUrl: profile?.logoDarkUrl ?? null,
    };
  } catch {
    return {
      schoolName: null,
      primaryColor: null,
      secondaryColor: null,
      tagline: null,
      phone: null,
      website: null,
      logoLightUrl: null,
      logoDarkUrl: null,
    };
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const kaiCreativeRouter = router({

  /**
   * Generate a new marketing image from a prompt or template.
   */
  generate: orgScopedProcedure
    .input(
      z.object({
        prompt: z.string().min(3).max(2000),
        templateId: z.string().optional(),
        outputSize: z.string().optional().default("instagram_post"),
        referenceImageUrl: z.string().url().optional(), // for editing
        assetName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const brand = await getBrandData(orgId);

      // Build the final prompt
      let finalPrompt: string;
      if (input.templateId) {
        const template = CREATIVE_TEMPLATES.find((t) => t.id === input.templateId);
        if (template) {
          finalPrompt = buildBrandAwarePrompt(template, brand, input.prompt !== template.promptTemplate ? input.prompt : undefined);
        } else {
          finalPrompt = buildFreeformPrompt(input.prompt, brand);
        }
      } else {
        finalPrompt = buildFreeformPrompt(input.prompt, brand);
      }

      // Call the image generation API
      const result = await generateImage({
        prompt: finalPrompt,
        originalImages: input.referenceImageUrl
          ? [{ url: input.referenceImageUrl }]
          : undefined,
      });

      if (!result.url) {
        throw new Error("Image generation failed — no URL returned");
      }

      // Save to creative_assets table
      const db = await getDb();
      if (db) {
        await db.insert(creativeAssets).values({
          orgId,
          assetType: "generated",
          name: input.assetName || `Generated — ${new Date().toLocaleDateString()}`,
          url: result.url,
          prompt: input.prompt,
          templateId: input.templateId ?? null,
          outputSize: input.outputSize,
          mimeType: "image/png",
          createdBy: ctx.user?.id ?? null,
        });
      }

      // Build follow-up suggestions
      const followUps = getFollowUpSuggestions(
        input.templateId ?? null,
        (input.outputSize as OutputSize) ?? "instagram_post",
        !!brand.phone,
        !!brand.website
      );

      return {
        url: result.url,
        prompt: finalPrompt,
        followUpSuggestions: followUps,
      };
    }),

  /**
   * Upload a user-provided image (logo, photo, etc.) to the asset library.
   */
  uploadAsset: orgScopedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        assetType: z.enum(["uploaded_logo", "uploaded_photo", "uploaded_other"]),
        base64Data: z.string(), // base64-encoded image data
        mimeType: z.string().default("image/png"),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;

      // Decode and upload to S3
      const buffer = Buffer.from(input.base64Data, "base64");
      const ext = input.mimeType.split("/")[1] || "png";
      const key = `creative/${orgId}/${input.assetType}/${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);

      // Save to creative_assets table
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(creativeAssets).values({
        orgId,
        assetType: input.assetType,
        name: input.name,
        url,
        storageKey: key,
        mimeType: input.mimeType,
        fileSizeBytes: buffer.length,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        createdBy: ctx.user?.id ?? null,
      });

      return { url, key };
    }),

  /**
   * List all creative assets for the org, optionally filtered by type.
   */
  listAssets: orgScopedProcedure
    .input(
      z.object({
        assetType: z.enum(["generated", "uploaded_logo", "uploaded_photo", "uploaded_other", "all"]).default("all"),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const orgId = ctx.currentOrganizationId as number;
      const db = await getDb();
      if (!db) return { assets: [], total: 0 };

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
        assets: assets.map((a) => ({
          id: a.id,
          assetType: a.assetType,
          name: a.name,
          url: a.url,
          prompt: a.prompt,
          templateId: a.templateId,
          outputSize: a.outputSize,
          mimeType: a.mimeType,
          isFavorited: a.isFavorited === 1,
          tags: a.tags ? (JSON.parse(a.tags) as string[]) : [],
          createdAt: a.createdAt,
        })),
      };
    }),

  /**
   * Delete a creative asset.
   */
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

  /**
   * Toggle favorite on a creative asset.
   */
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

  /**
   * Get the brand data for the current org (used by the frontend to show brand preview).
   */
  getBrandData: orgScopedProcedure.query(async ({ ctx }) => {
    return getBrandData(ctx.currentOrganizationId as number);
  }),

  /**
   * Get all available templates.
   */
  getTemplates: orgScopedProcedure.query(() => {
    return { templates: CREATIVE_TEMPLATES };
  }),
});
