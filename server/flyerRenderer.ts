/**
 * Flyer Renderer Service
 *
 * Uses puppeteer-core + system Chromium to render HTML flyer templates
 * to high-quality PNG images. This produces professional, print-ready
 * flyers with clean typography and structured layouts — far superior to
 * asking an image generation model to "draw a flyer" (which garbles text).
 *
 * Hero images are fetched from Pexels (real stock photography) using
 * program-specific search queries, giving flyers a photorealistic look.
 */

import puppeteer from "puppeteer-core";
import https from "https";
import http from "http";

// ── Pexels stock photo fetcher ────────────────────────────────────────────────
const PROGRAM_PHOTO_QUERIES: Record<string, string> = {
  "little ninjas": "children karate class kids martial arts",
  ninja: "children karate class kids martial arts",
  karate: "karate martial arts class students training",
  "adult karate": "adult karate martial arts training dojo",
  kickboxing: "kickboxing class fitness training",
  bjj: "brazilian jiu jitsu grappling class",
  "jiu-jitsu": "jiu jitsu martial arts class",
  taekwondo: "taekwondo martial arts class kicking",
  boxing: "boxing training class gym",
  "muay thai": "muay thai kickboxing training",
  mma: "mixed martial arts training class",
  wrestling: "wrestling training class",
  judo: "judo martial arts class",
  "self defense": "self defense class training women",
  "self-defense": "self defense class training",
  fitness: "fitness class workout training gym",
  yoga: "yoga class studio",
  dance: "dance class studio performance",
};

function getPhotoQuery(programName: string): string {
  const lower = programName.toLowerCase();
  return (
    Object.entries(PROGRAM_PHOTO_QUERIES).find(([k]) => lower.includes(k))?.[1] ??
    "martial arts class training dojo"
  );
}

async function fetchUrlBuffer(url: string, headers: Record<string, string> = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = (client as typeof https).get(url, { headers } as any, (res: any) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrlBuffer(res.headers.location as string, headers).then(resolve).catch(reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error("Timeout fetching URL"));
    });
  });
}

export async function fetchHeroPhotoAsBase64(
  programName: string,
  orientation: "landscape" | "portrait" = "portrait"
): Promise<{ dataUrl: string; credit: string } | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  const query = encodeURIComponent(getPhotoQuery(programName));
  const apiUrl = `https://api.pexels.com/v1/search?query=${query}&per_page=5&orientation=${orientation}&size=large`;

  try {
    const apiBuf = await fetchUrlBuffer(apiUrl, { Authorization: apiKey });
    const json = JSON.parse(apiBuf.toString("utf-8"));
    if (!json.photos || json.photos.length === 0) return null;

    const photo = json.photos[Math.floor(Math.random() * json.photos.length)];
    const photoUrl: string = photo.src.large2x || photo.src.large || photo.src.original;
    const photographer: string = photo.photographer || "Pexels";

    const imgBuf = await fetchUrlBuffer(photoUrl);
    const base64 = imgBuf.toString("base64");

    return {
      dataUrl: `data:image/jpeg;base64,${base64}`,
      credit: photographer,
    };
  } catch (err: any) {
    console.warn("[FlyerRenderer] Pexels fetch failed:", err?.message);
    return null;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface FlyerData {
  // School / brand
  schoolName: string;
  tagline?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;

  // Program / content
  programName: string;
  audience?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  benefits?: string[];
  callToAction?: string | null;
  offer?: string | null;
  testimonial?: string | null;

  // Layout
  size?: "flyer" | "instagram_post" | "instagram_story" | "facebook_ad" | "website_banner";
  style?: "bold" | "clean" | "cinematic" | "playful";

  // Hero image (base64 data URL or external URL)
  heroImageUrl?: string | null;
}

// ── Dimensions ────────────────────────────────────────────────────────────────
const SIZE_DIMS: Record<string, { width: number; height: number }> = {
  flyer:           { width: 816, height: 1056 },
  instagram_post:  { width: 1080, height: 1080 },
  instagram_story: { width: 1080, height: 1920 },
  facebook_ad:     { width: 1200, height: 1500 },
  website_banner:  { width: 1200, height: 628 },
};

// ── Color helpers ─────────────────────────────────────────────────────────────
function lighten(hex: string, amount = 0.9): string {
  const clean = hex.replace("#", "");
  const r = Math.min(255, Math.round(parseInt(clean.substring(0, 2), 16) + (255 - parseInt(clean.substring(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(clean.substring(2, 4), 16) + (255 - parseInt(clean.substring(2, 4), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(clean.substring(4, 6), 16) + (255 - parseInt(clean.substring(4, 6), 16)) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── HTML template builder ─────────────────────────────────────────────────────
export function buildFlyerHtml(data: FlyerData): string {
  const primary = data.primaryColor || "#C8102E";
  const secondary = data.secondaryColor || "#1A1A1A";
  const lightPrimary = lighten(primary, 0.9);

  const size = data.size || "flyer";
  const dims = SIZE_DIMS[size] || SIZE_DIMS.flyer;
  const isSquare = size === "instagram_post";
  const isStory = size === "instagram_story";
  const isBanner = size === "website_banner";

  const headline = data.headline || `Join Our ${data.programName} Program!`;
  const subheadline = data.subheadline || (data.audience ? `${data.programName} · ${data.audience}` : data.programName);
  const cta = data.callToAction || "Sign Up for a FREE Trial Class!";
  const benefits = data.benefits || [
    "Build confidence, focus & discipline",
    "Fun, safe learning environment",
    "Expert instructors, small class sizes",
    "First class FREE — no commitment",
  ];

  // Hero section — use real photo if available, otherwise gradient placeholder
  const heroSection = data.heroImageUrl
    ? `<div class="hero-img" style="background-image: url('${data.heroImageUrl}');"></div>`
    : `<div class="hero-placeholder">
        <div class="hero-icon">🥋</div>
        <div class="hero-program-label">${escapeHtml(data.programName)}</div>
       </div>`;

  const logoSection = data.logoUrl
    ? `<img class="school-logo" src="${data.logoUrl}" alt="${escapeHtml(data.schoolName)}" />`
    : `<div class="school-name-badge">${escapeHtml(data.schoolName)}</div>`;

  const testimonialSection = data.testimonial
    ? `<div class="testimonial">"${escapeHtml(data.testimonial)}"</div>`
    : "";

  const scale = isStory ? 1.4 : isSquare ? 1.1 : isBanner ? 0.8 : 1;
  const headlinePx = Math.round(44 * scale);
  const subPx = Math.round(20 * scale);
  const benefitPx = Math.round(16 * scale);
  const ctaPx = Math.round(19 * scale);
  const contactPx = Math.round(13 * scale);

  // Smart headline coloring — bold the last word in a different color
  const headlineWords = escapeHtml(headline).split(" ");
  const coloredHeadline = headlineWords.length > 2
    ? headlineWords.slice(0, -1).join(" ") + ` <span>${headlineWords[headlineWords.length - 1]}</span>`
    : `<span>${escapeHtml(headline)}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Open+Sans:wght@400;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    width: ${dims.width}px;
    height: ${dims.height}px;
    overflow: hidden;
    font-family: 'Montserrat', sans-serif;
    background: #ffffff;
  }

  .flyer {
    width: ${dims.width}px;
    height: ${dims.height}px;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    overflow: hidden;
  }

  .header {
    background: ${secondary};
    padding: ${isStory ? "28px 40px" : "18px 32px"};
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    min-height: ${isStory ? "90px" : "64px"};
  }

  .school-logo {
    max-height: ${isStory ? "56px" : "40px"};
    max-width: 200px;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }

  .school-name-badge {
    color: #ffffff;
    font-size: ${isStory ? "24px" : "18px"};
    font-weight: 800;
    letter-spacing: 0.5px;
  }

  .header-program-tag {
    background: ${primary};
    color: #ffffff;
    font-size: ${isStory ? "14px" : "11px"};
    font-weight: 700;
    padding: 5px 14px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    white-space: nowrap;
  }

  .hero-img {
    flex: 1;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    min-height: ${isStory ? "580px" : isSquare ? "360px" : "300px"};
    position: relative;
  }

  .hero-img::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.4));
  }

  .hero-placeholder {
    flex: 1;
    min-height: ${isStory ? "500px" : isSquare ? "320px" : "260px"};
    background: linear-gradient(135deg, ${secondary} 0%, ${primary} 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .hero-icon { font-size: ${isStory ? "110px" : "72px"}; line-height: 1; }

  .hero-program-label {
    color: rgba(255,255,255,0.85);
    font-size: ${isStory ? "26px" : "18px"};
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .content {
    background: #ffffff;
    padding: ${isStory ? "36px 44px" : "24px 32px"};
    flex-shrink: 0;
  }

  .headline {
    font-size: ${headlinePx}px;
    font-weight: 900;
    line-height: 1.1;
    color: ${secondary};
    margin-bottom: 6px;
    letter-spacing: -0.5px;
  }

  .headline span { color: ${primary}; }

  .subheadline {
    font-size: ${subPx}px;
    font-weight: 700;
    color: ${primary};
    margin-bottom: ${isStory ? "24px" : "16px"};
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .benefits {
    list-style: none;
    margin-bottom: ${isStory ? "24px" : "16px"};
    display: flex;
    flex-direction: column;
    gap: ${isStory ? "9px" : "6px"};
  }

  .benefits li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: ${benefitPx}px;
    color: #333333;
    line-height: 1.4;
    font-weight: 500;
  }

  .benefits li::before {
    content: '';
    width: ${isStory ? "9px" : "7px"};
    height: ${isStory ? "9px" : "7px"};
    min-width: ${isStory ? "9px" : "7px"};
    background: ${primary};
    border-radius: 50%;
    margin-top: ${isStory ? "6px" : "5px"};
  }

  .cta-section {
    background: ${primary};
    margin: 0 -${isStory ? "44px" : "32px"};
    padding: ${isStory ? "20px 44px" : "14px 32px"};
    text-align: center;
  }

  .cta-text {
    color: #ffffff;
    font-size: ${ctaPx}px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    line-height: 1.3;
  }

  .testimonial {
    background: ${lightPrimary};
    border-left: 4px solid ${primary};
    padding: ${isStory ? "14px 18px" : "10px 14px"};
    font-size: ${Math.round(14 * scale)}px;
    color: #444;
    font-style: italic;
    line-height: 1.5;
    margin: ${isStory ? "18px 0" : "12px 0"};
  }

  .footer {
    background: ${secondary};
    padding: ${isStory ? "18px 44px" : "12px 32px"};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${isStory ? "20px" : "14px"};
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .footer-item {
    color: rgba(255,255,255,0.85);
    font-size: ${contactPx}px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .footer-item .icon { color: ${primary}; }

  .footer-divider {
    color: rgba(255,255,255,0.3);
    font-size: ${contactPx}px;
  }
</style>
</head>
<body>
<div class="flyer">

  <div class="header">
    ${logoSection}
    ${data.audience ? `<div class="header-program-tag">${escapeHtml(data.audience)}</div>` : ""}
  </div>

  ${heroSection}

  <div class="content">
    <h1 class="headline">${coloredHeadline}</h1>
    <p class="subheadline">${escapeHtml(subheadline)}</p>

    <ul class="benefits">
      ${benefits.slice(0, 4).map(b => `<li>${escapeHtml(b)}</li>`).join("\n      ")}
    </ul>

    ${testimonialSection}

    <div class="cta-section">
      <div class="cta-text">${escapeHtml(cta)}</div>
    </div>
  </div>

  <div class="footer">
    ${data.phone ? `<div class="footer-item"><span class="icon">📞</span>${escapeHtml(data.phone)}</div><div class="footer-divider">·</div>` : ""}
    ${data.email ? `<div class="footer-item"><span class="icon">✉</span>${escapeHtml(data.email)}</div><div class="footer-divider">·</div>` : ""}
    ${data.website ? `<div class="footer-item"><span class="icon">🌐</span>${escapeHtml(data.website)}</div>` : ""}
    ${!data.phone && !data.email && !data.website ? `<div class="footer-item">${escapeHtml(data.schoolName)}</div>` : ""}
  </div>

</div>
</body>
</html>`;
}

// ── Puppeteer renderer ────────────────────────────────────────────────────────
let _browser: puppeteer.Browser | null = null;

async function getBrowser(): Promise<puppeteer.Browser> {
  if (_browser && _browser.connected) return _browser;
  _browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium-browser",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });
  return _browser;
}

export async function renderFlyerToPng(
  html: string,
  size: FlyerData["size"] = "flyer"
): Promise<Buffer> {
  const dims = SIZE_DIMS[size || "flyer"] || SIZE_DIMS.flyer;
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: dims.width, height: dims.height, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    const screenshot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: dims.width, height: dims.height },
      omitBackground: false,
    });
    return Buffer.from(screenshot);
  } finally {
    await page.close();
  }
}

// ── Parse flyer data from brief + brand context ───────────────────────────────
export async function parseFlyerDataFromBrief(
  prompt: string,
  briefAnswers: Record<string, string>,
  brand: {
    schoolName?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    logoUrl?: string | null;
    address?: string | null;
  },
  size: FlyerData["size"] = "flyer"
): Promise<FlyerData> {
  const programName = briefAnswers.program || extractProgram(prompt) || "Martial Arts Program";
  const audience = briefAnswers.audience || extractAudience(prompt) || null;
  const cta = briefAnswers.content || extractCta(prompt) || "Sign Up for a FREE Trial Class!";

  const headlineMap: Record<string, string> = {
    "little ninjas": "Unleash Your Child's Inner Ninja!",
    ninja: "Unleash Your Child's Inner Ninja!",
    kickboxing: "Get Fit. Get Strong. Get Confident.",
    karate: "Discipline, Focus & Confidence Starts Here.",
    "adult karate": "Discipline, Focus & Confidence Starts Here.",
    bjj: "Learn the Art of Brazilian Jiu-Jitsu.",
    "jiu-jitsu": "Learn the Art of Brazilian Jiu-Jitsu.",
    "self defense": "Real Skills. Real Confidence. Real Safety.",
    "self-defense": "Real Skills. Real Confidence. Real Safety.",
    taekwondo: "Kick Higher. Reach Further. Achieve More.",
    boxing: "Train Like a Champion.",
    fitness: "Transform Your Body. Transform Your Life.",
  };
  const lowerProgram = programName.toLowerCase();
  const headline =
    Object.entries(headlineMap).find(([k]) => lowerProgram.includes(k))?.[1] ||
    `Join Our ${programName} Program!`;

  const benefitsMap: Record<string, string[]> = {
    "little ninjas": [
      "Build confidence, focus & discipline",
      "Develop motor skills & coordination",
      "Fun, safe environment for ages 3–5",
      "Expert instructors, small class sizes",
    ],
    ninja: [
      "Build confidence, focus & discipline",
      "Develop motor skills & coordination",
      "Fun, safe environment for ages 3–5",
      "Expert instructors, small class sizes",
    ],
    kickboxing: [
      "Full-body workout — burn up to 800 cal/hr",
      "Learn real striking techniques",
      "Stress relief & mental clarity",
      "All fitness levels welcome",
    ],
    karate: [
      "Traditional values, modern training",
      "Improve focus, discipline & respect",
      "Belt progression system",
      "Classes for all ages & skill levels",
    ],
    bjj: [
      "Learn real self-defense techniques",
      "Build strength, flexibility & focus",
      "Beginner-friendly, all body types",
      "Compete or train recreationally",
    ],
    taekwondo: [
      "Olympic-style kicking techniques",
      "Build speed, agility & coordination",
      "Belt progression with clear goals",
      "Fun for kids and adults alike",
    ],
    boxing: [
      "Full-body cardio & strength training",
      "Learn proper technique from day one",
      "Build mental toughness & discipline",
      "All skill levels welcome",
    ],
  };
  const benefits =
    Object.entries(benefitsMap).find(([k]) => lowerProgram.includes(k))?.[1] || [
      "Expert instruction from certified coaches",
      "Safe, welcoming environment for all levels",
      "Build strength, confidence & discipline",
      "Flexible class schedules",
    ];

  // Fetch a real stock photo from Pexels for the hero image
  const orientation = size === "website_banner" ? "landscape" : "portrait";
  const heroPhoto = await fetchHeroPhotoAsBase64(programName, orientation);

  return {
    schoolName: brand.schoolName || "Your Dojo",
    phone: brand.phone || null,
    email: brand.email || null,
    website: brand.website || null,
    address: brand.address || null,
    logoUrl: brand.logoUrl || null,
    primaryColor: brand.primaryColor || "#C8102E",
    secondaryColor: brand.secondaryColor || "#1A1A1A",
    programName,
    audience,
    headline,
    subheadline: audience ? `${programName} · ${audience}` : programName,
    benefits,
    callToAction: cta,
    heroImageUrl: heroPhoto?.dataUrl || null,
    size,
  };
}

function extractProgram(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  const programs = [
    "little ninjas", "kickboxing", "karate", "taekwondo", "bjj", "jiu-jitsu",
    "muay thai", "boxing", "wrestling", "judo", "mma", "self defense", "self-defense",
    "fitness", "yoga", "gymnastics", "dance",
  ];
  return programs.find(p => lower.includes(p)) || null;
}

function extractAudience(prompt: string): string | null {
  const match = prompt.match(/ages?\s+[\d–\-]+(?:\s*[–\-]\s*[\d]+)?/i);
  return match ? match[0] : null;
}

function extractCta(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  if (lower.includes("free trial")) return "Sign Up for a FREE Trial Class!";
  if (lower.includes("enroll")) return "Enroll Today — Limited Spots Available!";
  if (lower.includes("limited spots")) return "Limited Spots Available — Register Now!";
  return null;
}
