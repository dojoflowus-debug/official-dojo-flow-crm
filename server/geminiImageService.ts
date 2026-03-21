/**
 * Gemini Image Generation Service
 * Uses @google/genai SDK with gemini-2.0-flash-preview-image-generation for fast generation.
 * Falls back to imagen-3.0-generate-002 for editing operations.
 */

import { GoogleGenAI, RawReferenceImage } from "@google/genai";

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

// ── Brand context builder ─────────────────────────────────────────────────────

export interface BrandContext {
  schoolName?: string | null;
  tagline?: string | null;
  phone?: string | null;
  website?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

function buildBrandedPrompt(userPrompt: string, brand?: BrandContext): string {
  if (!brand) return userPrompt;

  const brandLines: string[] = [];

  if (brand.schoolName) brandLines.push(`School name: "${brand.schoolName}"`);
  if (brand.tagline) brandLines.push(`Tagline: "${brand.tagline}"`);
  if (brand.phone) brandLines.push(`Phone: ${brand.phone}`);
  if (brand.website) brandLines.push(`Website: ${brand.website}`);
  if (brand.primaryColor) brandLines.push(`Primary brand color: ${brand.primaryColor}`);
  if (brand.secondaryColor) brandLines.push(`Secondary brand color: ${brand.secondaryColor}`);
  if (brandLines.length === 0) return userPrompt;

  return `${userPrompt}

Brand details to incorporate:
${brandLines.join("\n")}

Style: Professional martial arts marketing. Bold, energetic, clean layout. High contrast. No watermarks.`;
}

// ── Generate image (text → image) ─────────────────────────────────────────────

export interface GenerateImageResult {
  imageBase64: string;
  mimeType: string;
}

export async function generateImage(
  prompt: string,
  size: ImageSize = "instagram_post",
  brand?: BrandContext
): Promise<GenerateImageResult> {
  const ai = getClient();
  const aspectRatio = SIZE_TO_ASPECT[size];
  const finalPrompt = buildBrandedPrompt(prompt, brand);

  // Try gemini-2.0-flash-preview-image-generation first (fast)
  try {
    const response = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: finalPrompt,
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
  } catch (err: any) {
    // Surface the error clearly
    const msg = err?.message ?? String(err);
    throw new Error(`Gemini image generation failed: ${msg}`);
  }
}

// ── Edit image (image + prompt → new image) ───────────────────────────────────

export interface EditImageResult {
  imageBase64: string;
  mimeType: string;
}

export async function editImage(
  prompt: string,
  sourceImageBase64: string,
  sourceMimeType: string = "image/png",
  size: ImageSize = "instagram_post",
  brand?: BrandContext
): Promise<EditImageResult> {
  const ai = getClient();
  const finalPrompt = buildBrandedPrompt(prompt, brand);

  // Use imagen-3.0-capability-001 for editing (supports referenceImages)
  const refImage = new RawReferenceImage();
  refImage.referenceId = 1;
  refImage.referenceImage = {
    imageBytes: sourceImageBase64,
    mimeType: sourceMimeType,
  };

  try {
    const response = await ai.models.editImage({
      model: "imagen-3.0-capability-001",
      prompt: finalPrompt,
      referenceImages: [refImage],
      config: {
        numberOfImages: 1,
      },
    });

    const generated = response.generatedImages?.[0];
    if (!generated?.image?.imageBytes) {
      throw new Error("No image returned from Gemini edit");
    }

    return {
      imageBase64: generated.image.imageBytes,
      mimeType: generated.image.mimeType ?? "image/png",
    };
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    throw new Error(`Gemini image edit failed: ${msg}`);
  }
}

// ── Generate with logo (logo + prompt → branded image) ───────────────────────

export async function generateWithLogo(
  prompt: string,
  logoBase64: string,
  logoMimeType: string = "image/png",
  size: ImageSize = "instagram_post",
  brand?: BrandContext
): Promise<EditImageResult> {
  // Use editImage with the logo as a reference image
  const brandedPrompt = buildBrandedPrompt(
    `${prompt}. Include the provided logo prominently in the design.`,
    brand
  );
  return editImage(brandedPrompt, logoBase64, logoMimeType, size, brand);
}
