/**
 * Video Ad Generator Service
 *
 * Pipeline:
 * 1. Generate video script via OpenAI (hook + story + CTA)
 * 2. Generate voiceover via ElevenLabs TTS
 * 3. Assemble video: background image/color + text overlays + voiceover + music
 * 4. Upload to S3 and return URL
 *
 * Output: 15-30 second MP4 suitable for Instagram Reels, TikTok, Facebook Video Ads
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const MODEL = "gpt-4o-mini";
const KAI_VOICE_ID = "BL7YSL1bAkmW8U0JnU8o"; // Custom Kai voice

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  return key;
}

function getElevenLabsKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not configured");
  return key;
}

async function callOpenAI(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options: { maxTokens?: number; temperature?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const { maxTokens = 800, temperature = 0.7, jsonMode = false } = options;
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    max_tokens: maxTokens,
    temperature,
  };
  if (jsonMode) body.response_format = { type: "json_object" };
  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenAIKey()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content?.trim() ?? "";
}

export interface VideoAdScript {
  hook: string;           // First 3 seconds — pattern interrupt
  story: string;          // Middle 10-15 seconds — benefit story
  cta: string;            // Last 5 seconds — call to action
  fullScript: string;     // Complete spoken script (15-30 seconds)
  textOverlays: {         // Text to display on screen at each segment
    time: number;         // Seconds from start
    text: string;
    style: "hook" | "body" | "cta";
  }[];
  estimatedDuration: number; // Estimated seconds
}

export interface VideoAdResult {
  success: boolean;
  videoUrl?: string;
  videoKey?: string;
  script?: VideoAdScript;
  error?: string;
  durationSeconds?: number;
}

export interface VideoAdInput {
  program: string;
  audience: string;
  tone?: string;
  format?: "reel" | "story" | "square"; // 9:16 reel, 9:16 story, 1:1 square
  brandContext: {
    schoolName: string;
    phone: string | null;
    website: string | null;
    primaryColor: string | null;
    logoUrl?: string | null;
  };
  backgroundImageBase64?: string; // Optional background image
  voiceId?: string;               // Override ElevenLabs voice
  orgId: number;
}

/**
 * Step 1: Generate a video ad script using OpenAI
 */
export async function generateVideoAdScript(
  input: VideoAdInput
): Promise<VideoAdScript> {
  const school = input.brandContext.schoolName || "our school";
  const phone = input.brandContext.phone || null;
  const website = input.brandContext.website || null;
  const tone = input.tone || "energetic and motivational";

  const systemPrompt = `You are an expert video ad scriptwriter for martial arts schools.
You write 15-30 second video ad scripts that convert viewers into leads.

RULES:
- Hook: First 3 seconds must STOP the scroll. Use a bold statement, surprising fact, or emotional question.
- Story: 10-15 seconds showing the transformation/benefit. Speak to the parent's desire.
- CTA: Last 5 seconds. Clear, urgent, specific action with phone/website.
- Tone: ${tone}
- School: "${school}"
- Program: "${input.program}"
- Audience: "${input.audience}"
- Phone: "${phone || "[PHONE]"}"
- Total spoken words: 60-90 words (15-30 seconds at normal speaking pace)
- NO placeholder text. NO "INSERT NAME HERE". Use real school name.`;

  const userMessage = `Write a video ad script for:
- Program: ${input.program}
- Audience: ${input.audience}
- School: ${school}
${phone ? `- Phone: ${phone}` : ""}
${website ? `- Website: ${website}` : ""}

Respond with JSON:
{
  "hook": "First 3 seconds — pattern interrupt (1-2 punchy sentences)",
  "story": "Middle 10-15 seconds — transformation story (3-4 sentences)",
  "cta": "Last 5 seconds — urgent call to action (1-2 sentences)",
  "fullScript": "Complete spoken script combining all three parts naturally",
  "textOverlays": [
    {"time": 0, "text": "Hook text for screen", "style": "hook"},
    {"time": 4, "text": "Key benefit text", "style": "body"},
    {"time": 18, "text": "CTA text for screen", "style": "cta"}
  ],
  "estimatedDuration": 20
}`;

  const raw = await callOpenAI(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    { jsonMode: true, maxTokens: 800, temperature: 0.7 }
  );
  return JSON.parse(raw) as VideoAdScript;
}

/**
 * Step 2: Generate voiceover audio via ElevenLabs
 */
export async function generateVoiceover(
  script: string,
  voiceId: string = KAI_VOICE_ID
): Promise<Buffer> {
  const url = `${ELEVENLABS_API_URL}/${voiceId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": getElevenLabsKey(),
    },
    body: JSON.stringify({
      text: script,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${err}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Step 3: Assemble video using ffmpeg
 * Creates a video with: background color/image + text overlays + voiceover
 */
export async function assembleVideo(
  script: VideoAdScript,
  voiceoverBuffer: Buffer,
  options: {
    format: "reel" | "story" | "square";
    primaryColor: string | null;
    schoolName: string;
    backgroundImageBase64?: string;
    logoUrl?: string | null;
  }
): Promise<Buffer> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "kai-video-"));

  try {
    // Determine dimensions
    const dimensions = {
      reel: { w: 1080, h: 1920 },
      story: { w: 1080, h: 1920 },
      square: { w: 1080, h: 1080 },
    }[options.format];

    const duration = Math.max(script.estimatedDuration || 20, 15);
    const bgColor = (options.primaryColor || "#1a1a2e").replace("#", "");

    // Write voiceover to temp file
    const audioPath = path.join(tmpDir, "voiceover.mp3");
    fs.writeFileSync(audioPath, voiceoverBuffer);

    // Write background image if provided
    let bgInput = "";
    if (options.backgroundImageBase64) {
      const bgPath = path.join(tmpDir, "background.jpg");
      const bgBuf = Buffer.from(options.backgroundImageBase64, "base64");
      fs.writeFileSync(bgPath, bgBuf);
      bgInput = `-loop 1 -i "${bgPath}"`;
    }

    // Build drawtext filters for overlays
    const fontColor = "white";
    const shadowColor = "black@0.8";

    const drawtextFilters = script.textOverlays.map((overlay, i) => {
      const nextOverlay = script.textOverlays[i + 1];
      const endTime = nextOverlay ? nextOverlay.time : duration;
      const fontSize = overlay.style === "hook" ? 72 : overlay.style === "cta" ? 64 : 52;
      const yPos = overlay.style === "hook" ? "h*0.25" : overlay.style === "cta" ? "h*0.75" : "h*0.5";

      // Escape special characters for ffmpeg drawtext
      const escapedText = overlay.text
        .replace(/'/g, "\\'")
        .replace(/:/g, "\\:")
        .replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]");

      return `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${fontColor}:shadowcolor=${shadowColor}:shadowx=2:shadowy=2:x=(w-text_w)/2:y=${yPos}:enable='between(t,${overlay.time},${endTime})'`;
    });

    const filterComplex = drawtextFilters.join(",");

    // Build ffmpeg command
    const outputPath = path.join(tmpDir, "output.mp4");

    let ffmpegCmd: string;
    if (options.backgroundImageBase64) {
      ffmpegCmd = [
        "ffmpeg -y",
        bgInput,
        `-i "${audioPath}"`,
        `-vf "scale=${dimensions.w}:${dimensions.h}:force_original_aspect_ratio=increase,crop=${dimensions.w}:${dimensions.h},${filterComplex}"`,
        `-t ${duration}`,
        `-c:v libx264 -preset fast -crf 23`,
        `-c:a aac -b:a 128k`,
        `-pix_fmt yuv420p`,
        `-shortest`,
        `"${outputPath}"`,
      ].join(" ");
    } else {
      // Generate solid color background
      ffmpegCmd = [
        "ffmpeg -y",
        `-f lavfi -i "color=c=${bgColor}:size=${dimensions.w}x${dimensions.h}:rate=30"`,
        `-i "${audioPath}"`,
        `-vf "${filterComplex}"`,
        `-t ${duration}`,
        `-c:v libx264 -preset fast -crf 23`,
        `-c:a aac -b:a 128k`,
        `-pix_fmt yuv420p`,
        `-shortest`,
        `"${outputPath}"`,
      ].join(" ");
    }

    execSync(ffmpegCmd, { timeout: 120000, stdio: "pipe" });

    const videoBuffer = fs.readFileSync(outputPath);
    return videoBuffer;
  } finally {
    // Cleanup temp files
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Non-blocking cleanup failure
    }
  }
}

/**
 * Main entry point: Generate a complete video ad
 */
export async function generateVideoAd(input: VideoAdInput): Promise<VideoAdResult> {
  try {
    console.log(`[VideoAd] Starting video ad generation for org ${input.orgId}`);

    // Step 1: Generate script
    const script = await generateVideoAdScript(input);
    console.log(`[VideoAd] Script generated: "${script.hook.slice(0, 50)}..."`);

    // Step 2: Generate voiceover
    const voiceoverBuffer = await generateVoiceover(
      script.fullScript,
      input.voiceId || KAI_VOICE_ID
    );
    console.log(`[VideoAd] Voiceover generated: ${voiceoverBuffer.length} bytes`);

    // Step 3: Assemble video
    const videoBuffer = await assembleVideo(script, voiceoverBuffer, {
      format: input.format || "reel",
      primaryColor: input.brandContext.primaryColor,
      schoolName: input.brandContext.schoolName,
      backgroundImageBase64: input.backgroundImageBase64,
      logoUrl: input.brandContext.logoUrl,
    });
    console.log(`[VideoAd] Video assembled: ${videoBuffer.length} bytes`);

    // Step 4: Upload to S3
    const key = `creative/${input.orgId}/videos/${Date.now()}.mp4`;
    let videoUrl = "";
    let videoKey: string | null = null;

    try {
      const { storagePut } = await import("./storage");
      const s3Result = await storagePut(key, videoBuffer, "video/mp4");
      videoUrl = s3Result.url;
      videoKey = s3Result.key;
      console.log(`[VideoAd] Uploaded to S3: ${videoUrl}`);
    } catch (s3Err) {
      console.warn("[VideoAd] S3 upload failed, returning base64:", s3Err);
      videoUrl = `data:video/mp4;base64,${videoBuffer.toString("base64")}`;
    }

    return {
      success: true,
      videoUrl,
      videoKey: videoKey || undefined,
      script,
      durationSeconds: script.estimatedDuration,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[VideoAd] Generation failed:", message);
    return {
      success: false,
      error: message,
    };
  }
}
