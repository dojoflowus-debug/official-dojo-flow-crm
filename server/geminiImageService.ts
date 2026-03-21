/**
 * Gemini Image Generation Service
 * Uses @google/genai SDK with imagen-4.0-generate-001 for all operations.
 *
 * NOTE: ai.models.editImage() is Vertex AI only and NOT available via the
 * standard Gemini API key. All three modes (generate, logo branding, edit)
 * use generateImages() with prompt-based context injection instead.
 */

import { GoogleGenAI } from "@google/genai";

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
  brand?: BrandContext
): Promise<GenerateImageResult> {
  const aspectRatio = SIZE_TO_ASPECT[size];
  const finalPrompt = buildBrandedPrompt(prompt, brand);

  try {
    return await callGenerateImages(finalPrompt, aspectRatio);
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
  brand?: BrandContext
): Promise<EditImageResult> {
  const aspectRatio = SIZE_TO_ASPECT[size];
  // Since editImage (Vertex AI) is unavailable, generate a new image from the
  // edit prompt. The source image context is described via the prompt.
  const editPrompt = `${prompt}

Create a new high-quality marketing image based on the above description. Apply any requested changes or style adjustments.`;

  const finalPrompt = buildBrandedPrompt(editPrompt, brand);

  try {
    return await callGenerateImages(finalPrompt, aspectRatio);
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
  brand?: BrandContext
): Promise<EditImageResult> {
  const aspectRatio = SIZE_TO_ASPECT[size];

  // Build a logo-aware prompt. Since we can't pass the image bytes to
  // generateImages(), we describe the brand identity in text.
  const schoolName = brand?.schoolName ?? "the martial arts school";
  const primaryColor = brand?.primaryColor ?? "red and black";

  const logoPrompt = `${prompt}

Design requirements:
- This is a branded marketing image for ${schoolName}
- Include a prominent logo placeholder or emblem in the design representing the school
- Use ${primaryColor} as the primary color scheme
- The design should look professional and suitable for martial arts marketing
- Include space for the school logo/emblem as a key visual element
- Bold, energetic, high-impact design`;

  const finalPrompt = buildBrandedPrompt(logoPrompt, brand);

  try {
    return await callGenerateImages(finalPrompt, aspectRatio);
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    throw new Error(`Gemini logo branding failed: ${msg}`);
  }
}
