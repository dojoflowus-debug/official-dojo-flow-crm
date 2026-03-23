/**
 * Flyer Renderer Service
 *
 * Uses puppeteer-core + system Chromium to render HTML flyer templates
 * to high-quality PNG images. This produces professional, print-ready
 * flyers with clean typography and structured layouts — far superior to
 * asking an image generation model to "draw a flyer" (which garbles text).
 *
 * Usage:
 *   const png = await renderFlyerToPng(buildFlyerHtml(data));
 */

import puppeteer from "puppeteer-core";

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
  audience?: string | null;       // e.g. "Ages 3–5"
  headline?: string | null;       // e.g. "Unleash Your Child's Inner Ninja!"
  subheadline?: string | null;
  benefits?: string[];            // up to 4 bullet points
  callToAction?: string | null;   // e.g. "Sign up for a FREE Trial Class!"
  offer?: string | null;          // e.g. "First class FREE"
  testimonial?: string | null;

  // Layout
  size?: "flyer" | "instagram_post" | "instagram_story" | "facebook_ad" | "website_banner";
  style?: "bold" | "clean" | "cinematic" | "playful";

  // Optional hero image (base64 or URL)
  heroImageUrl?: string | null;
}

// ── Dimensions ────────────────────────────────────────────────────────────────
const SIZE_DIMS: Record<string, { width: number; height: number }> = {
  flyer:           { width: 816, height: 1056 },  // 8.5×11 @ 96dpi
  instagram_post:  { width: 1080, height: 1080 },
  instagram_story: { width: 1080, height: 1920 },
  facebook_ad:     { width: 1200, height: 1500 },
  website_banner:  { width: 1200, height: 628 },
};

// ── Color helpers ─────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function lighten(hex: string, amount = 0.85): string {
  const clean = hex.replace("#", "");
  const r = Math.min(255, Math.round(parseInt(clean.substring(0, 2), 16) + (255 - parseInt(clean.substring(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(clean.substring(2, 4), 16) + (255 - parseInt(clean.substring(2, 4), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(clean.substring(4, 6), 16) + (255 - parseInt(clean.substring(4, 6), 16)) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ── HTML template builder ─────────────────────────────────────────────────────
export function buildFlyerHtml(data: FlyerData): string {
  const primary = data.primaryColor || "#C8102E";
  const secondary = data.secondaryColor || "#1A1A1A";
  const lightPrimary = lighten(primary, 0.9);
  const rgbPrimary = hexToRgb(primary);

  const size = data.size || "flyer";
  const dims = SIZE_DIMS[size] || SIZE_DIMS.flyer;
  const isSquare = size === "instagram_post";
  const isStory = size === "instagram_story";
  const isBanner = size === "website_banner";

  const headline = data.headline || `Unleash Your Child's Inner Ninja!`;
  const subheadline = data.subheadline || (data.audience ? `${data.programName} · ${data.audience}` : data.programName);
  const cta = data.callToAction || "Sign Up for a FREE Trial Class!";
  const benefits = data.benefits || [
    "Build confidence, focus & discipline",
    "Fun, safe learning environment",
    "Expert instructors, small class sizes",
    "First class FREE — no commitment",
  ];

  const heroSection = data.heroImageUrl
    ? `<div class="hero-img" style="background-image: url('${data.heroImageUrl}');"></div>`
    : `<div class="hero-placeholder">
        <div class="hero-icon">🥋</div>
        <div class="hero-program-label">${data.programName}</div>
       </div>`;

  const logoSection = data.logoUrl
    ? `<img class="school-logo" src="${data.logoUrl}" alt="${data.schoolName}" />`
    : `<div class="school-name-badge">${data.schoolName}</div>`;

  const contactLine = [
    data.phone,
    data.email,
    data.website,
  ].filter(Boolean).join("  ·  ");

  const testimonialSection = data.testimonial
    ? `<div class="testimonial">"${data.testimonial}"</div>`
    : "";

  // Scale font sizes for different formats
  const scale = isStory ? 1.4 : isSquare ? 1.1 : isBanner ? 0.8 : 1;
  const headlinePx = Math.round(48 * scale);
  const subPx = Math.round(22 * scale);
  const benefitPx = Math.round(17 * scale);
  const ctaPx = Math.round(20 * scale);
  const contactPx = Math.round(14 * scale);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Open+Sans:wght@400;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    width: ${dims.width}px;
    height: ${dims.height}px;
    overflow: hidden;
    font-family: 'Montserrat', 'Open Sans', sans-serif;
    background: #ffffff;
  }

  .flyer {
    width: ${dims.width}px;
    height: ${dims.height}px;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    position: relative;
    overflow: hidden;
  }

  /* ── Header strip ── */
  .header {
    background: ${secondary};
    padding: ${isStory ? "28px 40px" : "20px 36px"};
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    min-height: ${isStory ? "100px" : "72px"};
  }

  .school-logo {
    max-height: ${isStory ? "60px" : "44px"};
    max-width: 200px;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }

  .school-name-badge {
    color: #ffffff;
    font-size: ${isStory ? "26px" : "20px"};
    font-weight: 800;
    letter-spacing: 0.5px;
  }

  .header-program-tag {
    background: ${primary};
    color: #ffffff;
    font-size: ${isStory ? "15px" : "12px"};
    font-weight: 700;
    padding: 5px 14px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    white-space: nowrap;
  }

  /* ── Hero image ── */
  .hero-img {
    flex: 1;
    background-size: cover;
    background-position: center top;
    background-repeat: no-repeat;
    min-height: ${isStory ? "600px" : isSquare ? "380px" : "320px"};
    position: relative;
  }

  .hero-img::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.5));
  }

  .hero-placeholder {
    flex: 1;
    min-height: ${isStory ? "500px" : isSquare ? "340px" : "280px"};
    background: linear-gradient(135deg, ${secondary} 0%, ${primary} 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .hero-icon {
    font-size: ${isStory ? "120px" : "80px"};
    line-height: 1;
  }

  .hero-program-label {
    color: rgba(255,255,255,0.85);
    font-size: ${isStory ? "28px" : "20px"};
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  /* ── Content area ── */
  .content {
    background: #ffffff;
    padding: ${isStory ? "40px 48px" : "28px 36px"};
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

  .headline span {
    color: ${primary};
  }

  .subheadline {
    font-size: ${subPx}px;
    font-weight: 600;
    color: ${primary};
    margin-bottom: ${isStory ? "28px" : "20px"};
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* ── Benefits ── */
  .benefits {
    list-style: none;
    margin-bottom: ${isStory ? "28px" : "20px"};
    display: flex;
    flex-direction: column;
    gap: ${isStory ? "10px" : "7px"};
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
    width: ${isStory ? "10px" : "8px"};
    height: ${isStory ? "10px" : "8px"};
    min-width: ${isStory ? "10px" : "8px"};
    background: ${primary};
    border-radius: 50%;
    margin-top: ${isStory ? "6px" : "5px"};
  }

  /* ── CTA button ── */
  .cta-section {
    background: ${primary};
    margin: 0 -${isStory ? "48px" : "36px"};
    padding: ${isStory ? "22px 48px" : "16px 36px"};
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

  /* ── Testimonial ── */
  .testimonial {
    background: ${lightPrimary};
    border-left: 4px solid ${primary};
    padding: ${isStory ? "16px 20px" : "12px 16px"};
    font-size: ${Math.round(15 * scale)}px;
    color: #444;
    font-style: italic;
    line-height: 1.5;
    margin: ${isStory ? "20px 0" : "14px 0"};
  }

  /* ── Footer ── */
  .footer {
    background: ${secondary};
    padding: ${isStory ? "20px 48px" : "14px 36px"};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${isStory ? "24px" : "16px"};
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .footer-item {
    color: rgba(255,255,255,0.85);
    font-size: ${contactPx}px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .footer-item .icon {
    color: ${primary};
    font-size: ${Math.round(contactPx * 1.2)}px;
  }

  .footer-divider {
    color: rgba(255,255,255,0.3);
    font-size: ${contactPx}px;
  }

  /* ── Diagonal accent ── */
  .diagonal-accent {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 8px;
    background: ${primary};
  }
</style>
</head>
<body>
<div class="flyer">

  <!-- Header -->
  <div class="header">
    ${logoSection}
    ${data.audience ? `<div class="header-program-tag">${data.audience}</div>` : ""}
  </div>

  <!-- Hero -->
  ${heroSection}

  <!-- Content -->
  <div class="content">
    <h1 class="headline">${escapeHtml(headline).replace(/inner/i, '<span>Inner</span>').replace(/ninja/i, '<span>Ninja</span>')}</h1>
    <p class="subheadline">${escapeHtml(subheadline)}</p>

    <ul class="benefits">
      ${benefits.slice(0, 4).map(b => `<li>${escapeHtml(b)}</li>`).join("\n      ")}
    </ul>

    ${testimonialSection}

    <div class="cta-section">
      <div class="cta-text">${escapeHtml(cta)}</div>
    </div>
  </div>

  <!-- Footer -->
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });
    // Wait for fonts to load
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
export function parseFlyerDataFromBrief(
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
): FlyerData {
  const programName = briefAnswers.program || extractProgram(prompt) || "Martial Arts Program";
  const audience = briefAnswers.audience || extractAudience(prompt) || null;
  const cta = briefAnswers.content || extractCta(prompt) || "Sign Up for a FREE Trial Class!";

  // Build headline from program
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
  const headline = Object.entries(headlineMap).find(([k]) => lowerProgram.includes(k))?.[1]
    || `Join Our ${programName} Program!`;

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
  };
  const benefits = Object.entries(benefitsMap).find(([k]) => lowerProgram.includes(k))?.[1]
    || [
      "Expert instruction from certified coaches",
      "Safe, welcoming environment for all levels",
      "Build strength, confidence & discipline",
      "Flexible class schedules",
    ];

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
    size,
  };
}

function extractProgram(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  const programs = ["little ninjas", "kickboxing", "karate", "taekwondo", "bjj", "jiu-jitsu",
    "muay thai", "boxing", "wrestling", "judo", "mma", "self defense", "self-defense",
    "fitness", "yoga", "gymnastics", "dance"];
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
