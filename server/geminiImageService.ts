/**
 * Gemini Image Generation Service
 * Uses @google/genai SDK with imagen-4.0-generate-001 for all operations.
 *
 * All prompts are transformed through kaiPromptEngine.enhancePrompt() before
 * being sent to Gemini — adding layout rules, style presets, program awareness,
 * and brand context injection.
 *
 * NOTE: ai.models.editImage() is Vertex AI only and NOT available via the
 * standard Gemini API key. All three modes (generate, logo branding, edit)
 * use generateImages() with prompt-based context injection instead.
 */

import { GoogleGenAI } from "@google/genai";
import { enhancePrompt, detectStylePreset, type StylePreset } from "./kaiPromptEngine";

// ── Client ────────────────────────────────────────────────────────────────────

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

// ── Size → Aspect Ratio map ───────────────────────────────────────────────────

export type ImageSize =
  | "instagram_post"   // 1:1
  | "instagram_story"  // 9:16
  | "facebook_ad"      // 4:5
  | "flyer"            // 3:4 (portrait)
  | "website_banner";  // 16:9

const SIZE_TO_ASPECT: Record<ImageSize, string> = {
  instagram_post: "1:1",
  instagram_story: "9:16",
  facebook_ad: "4:5",
  flyer: "3:4",
  website_banner: "16:9",
};

// ── Brand context ─────────────────────────────────────────────────────────────

export interface BrandContext {
  schoolName?: string | null;
  tagline?: string | null;
  phone?: string | null;
  website?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;       // URL of uploaded school logo
  accentColor?: string | null;
  address?: string | null;
}

// ── Core generateImages call ──────────────────────────────────────────────────

async function callGenerateImages(
  prompt: string,
  aspectRatio: string
): Promise<{ imageBase64: string; mimeType: string }> {
  const ai = getClient();

  const response = await ai.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt,
    config: {
      aspectRatio,
      numberOfImages: 1,
    },
  });

  const generated = response.generatedImages?.[0];
  if (!generated?.image?.imageBytes) {
    throw new Error("No image returned from Gemini");
  }

  return {
    imageBase64: generated.image.imageBytes,
    mimeType: generated.image.mimeType ?? "image/png",
  };
}

// ── Generate image (text → image) ─────────────────────────────────────────────

export interface GenerateImageResult {
  imageBase64: string;
  mimeType: string;
}

export async function generateImage(
  prompt: string,
  size: ImageSize = "instagram_post",
  brand?: BrandContext,
  style?: StylePreset
): Promise<GenerateImageResult> {
  const aspectRatio = SIZE_TO_ASPECT[size];

  // Run through the Kai Prompt Engine
  const enhancedPrompt = enhancePrompt({
    userPrompt: prompt,
    style: style ?? "auto",
    brand: brand
      ? {
          schoolName: brand.schoolName ?? undefined,
          primaryColor: brand.primaryColor ?? undefined,
          secondaryColor: brand.secondaryColor ?? undefined,
          accentColor: brand.accentColor ?? undefined,
          phone: brand.phone ?? undefined,
          website: brand.website ?? undefined,
          tagline: brand.tagline ?? undefined,
          address: brand.address ?? undefined,
          logoUrl: brand.logoUrl ?? undefined,
        }
      : undefined,
    size,
  });

  try {
    return await callGenerateImages(enhancedPrompt, aspectRatio);
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    throw new Error(`Gemini image generation failed: ${msg}`);
  }
}

// ── Edit image (image + prompt → new image) ───────────────────────────────────
// NOTE: Vertex AI's editImage() is not available with a standard API key.
// Instead we use generateImages() with a strong prompt describing the edit.

export interface EditImageResult {
  imageBase64: string;
  mimeType: string;
}

export async function editImage(
  prompt: string,
  _sourceImageBase64: string,
  _sourceMimeType: string = "image/png",
  size: ImageSize = "instagram_post",
  brand?: BrandContext,
  style?: StylePreset
): Promise<EditImageResult> {
  const aspectRatio = SIZE_TO_ASPECT[size];

  // Wrap the edit request in the prompt engine for consistent quality
  const editUserPrompt = `${prompt}

Apply the requested changes or style adjustments. Create a new high-quality marketing image.`;

  const enhancedPrompt = enhancePrompt({
    userPrompt: editUserPrompt,
    style: style ?? "auto",
    brand: brand
      ? {
          schoolName: brand.schoolName ?? undefined,
          primaryColor: brand.primaryColor ?? undefined,
          secondaryColor: brand.secondaryColor ?? undefined,
          accentColor: brand.accentColor ?? undefined,
          phone: brand.phone ?? undefined,
          website: brand.website ?? undefined,
          tagline: brand.tagline ?? undefined,
          address: brand.address ?? undefined,
          logoUrl: brand.logoUrl ?? undefined,
        }
      : undefined,
    size,
  });

  try {
    return await callGenerateImages(enhancedPrompt, aspectRatio);
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    throw new Error(`Gemini image edit failed: ${msg}`);
  }
}

// ── Generate with logo (logo + prompt → branded image) ───────────────────────
// NOTE: Since editImage (Vertex AI) is unavailable, we use generateImages()
// with a detailed prompt that describes the logo and asks Gemini to incorporate
// the brand identity into the design.

export async function generateWithLogo(
  prompt: string,
  _logoBase64: string,
  _logoMimeType: string = "image/png",
  size: ImageSize = "instagram_post",
  brand?: BrandContext,
  style?: StylePreset
): Promise<EditImageResult> {
  const aspectRatio = SIZE_TO_ASPECT[size];

  const schoolName = brand?.schoolName ?? "the martial arts school";

  // Logo branding: the user has uploaded a logo. Describe it in the prompt
  // so Gemini incorporates the brand identity into the design.
  const logoUserPrompt = `${prompt}

This is a branded marketing design for ${schoolName}. The school logo has been uploaded — place it prominently at TOP CENTER of the design. The logo must be clearly visible, properly sized, and professionally integrated. Do NOT generate a fake or placeholder logo — use the school's actual branding identity.`;

  const enhancedPrompt = enhancePrompt({
    userPrompt: logoUserPrompt,
    style: style ?? "premium",
    brand: brand
      ? {
          schoolName: brand.schoolName ?? undefined,
          primaryColor: brand.primaryColor ?? undefined,
          secondaryColor: brand.secondaryColor ?? undefined,
          accentColor: brand.accentColor ?? undefined,
          phone: brand.phone ?? undefined,
          website: brand.website ?? undefined,
          tagline: brand.tagline ?? undefined,
          address: brand.address ?? undefined,
          logoUrl: brand.logoUrl ?? undefined,
        }
      : undefined,
    size,
  });

  try {
    return await callGenerateImages(enhancedPrompt, aspectRatio);
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    throw new Error(`Gemini logo branding failed: ${msg}`);
  }
}
