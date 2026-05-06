/**
 * Flyer Renderer Service
 *
 * Uses puppeteer-core + system Chromium to render HTML flyer templates
 * to high-quality PNG images. This produces professional, print-ready
 * flyers with clean typography and structured layouts — far superior to
 * asking an image generation model to "draw a flyer" (which garbles text).
 *
 * Hero images are fetched from Pexels (real stock photography) using
 * program-specific search queries. The template uses a full-bleed hero
 * photo as the background with a cinematic gradient overlay — matching
 * the Manus reference flyer style.
 */

import puppeteer from "puppeteer-core";
import https from "https";
import http from "http";
import QRCode from "qrcode";

// ── Pexels stock photo fetcher ────────────────────────────────────────────────
const PROGRAM_PHOTO_QUERIES: Record<string, string> = {
  "little ninjas": "children karate class kids martial arts dojo",
  ninja: "children karate class kids martial arts dojo",
  karate: "karate martial arts class students training dojo",
  "adult karate": "adult karate martial arts training dojo",
  kickboxing: "kickboxing class fitness training gym",
  bjj: "brazilian jiu jitsu grappling class",
  "jiu-jitsu": "jiu jitsu martial arts class",
  taekwondo: "taekwondo martial arts class kicking",
  boxing: "boxing training class gym",
  "muay thai": "muay thai kickboxing training",
  mma: "mixed martial arts training class",
  wrestling: "wrestling training class",
  judo: "judo martial arts class",
  "self defense": "self defense class training women empowerment",
  "self-defense": "self defense class training",
  fitness: "fitness class workout training gym",
  yoga: "yoga class studio peaceful",
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
      // Reject on non-2xx (e.g. 503 Service Unavailable from Pexels)
      if (res.statusCode < 200 || res.statusCode >= 300) {
        const errChunks: Buffer[] = [];
        res.on("data", (c: Buffer) => errChunks.push(c));
        res.on("end", () => reject(new Error(`HTTP ${res.statusCode}: ${Buffer.concat(errChunks).toString('utf-8').slice(0, 200)}`)));
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
  size?: "flyer" | "instagram_post" | "instagram_story" | "facebook_ad" | "website_banner" | "business_card";
  style?: "bold" | "clean" | "cinematic" | "playful";

  // Hero image (base64 data URL or external URL)
  heroImageUrl?: string | null;

  // QR code (pre-generated data URL)
  qrCodeDataUrl?: string | null;
}

// ── Dimensions ────────────────────────────────────────────────────────────────
const SIZE_DIMS: Record<string, { width: number; height: number }> = {
  flyer:           { width: 816, height: 1056 },
  instagram_post:  { width: 1080, height: 1080 },
  instagram_story: { width: 1080, height: 1920 },
  facebook_ad:     { width: 1200, height: 1500 },
  website_banner:  { width: 1200, height: 628 },
  // Business card: 3.5" × 2" at 300dpi = 1050 × 600px
  business_card:   { width: 1050, height: 600 },
};

// ── Color helpers ─────────────────────────────────────────────────────────────
function lighten(hex: string, amount = 0.9): string {
  const clean = hex.replace("#", "");
  const r = Math.min(255, Math.round(parseInt(clean.substring(0, 2), 16) + (255 - parseInt(clean.substring(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(clean.substring(2, 4), 16) + (255 - parseInt(clean.substring(2, 4), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(clean.substring(4, 6), 16) + (255 - parseInt(clean.substring(4, 6), 16)) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function darken(hex: string, amount = 0.4): string {
  const clean = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(clean.substring(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(clean.substring(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(clean.substring(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── HTML template builder — Bold 3D Reference-Quality Layout ─────────────────
export function buildFlyerHtml(data: FlyerData): string {
  // Route business card to its own template
  if (data.size === 'business_card') return buildBusinessCardHtml(data);

  // Route banner to its own layout
  if (data.size === 'website_banner') return buildBannerHtml(data);

  const primary = data.primaryColor || "#C8102E";
  const secondary = data.secondaryColor || "#1A1A1A";
  const darkPrimary = darken(primary, 0.3);
  const primaryRgb = (() => {
    const c = primary.replace('#', '');
    return `${parseInt(c.substring(0,2),16)}, ${parseInt(c.substring(2,4),16)}, ${parseInt(c.substring(4,6),16)}`;
  })();

  const size = data.size || "flyer";
  const dims = SIZE_DIMS[size] || SIZE_DIMS.flyer;
  const isSquare = size === "instagram_post";
  const isStory = size === "instagram_story";
  const isFacebookAd = size === "facebook_ad";

  const programName = escapeHtml(data.programName);
  const headline = escapeHtml(data.headline || `Join Our ${data.programName} Program!`);
  const cta = escapeHtml(data.callToAction || "Start Your FREE 7-Day Trial!");
  const benefits = data.benefits || [
    "Build confidence, focus & discipline",
    "Fun, safe learning environment",
    "Expert instructors, small class sizes",
    "FREE 7-Day Trial — no commitment required",
  ];

  // Scale factors for different sizes
  const scale = isStory ? 1.4 : isSquare ? 1.0 : isFacebookAd ? 1.1 : 1.0;
  const programNamePx = Math.round(isStory ? 88 : isSquare ? 72 : 80);
  const headlinePx = Math.round(isStory ? 40 : isSquare ? 34 : 36);
  const benefitPx = Math.round(isStory ? 26 : isSquare ? 21 : 22);
  const ctaPx = Math.round(isStory ? 30 : isSquare ? 24 : 26);
  const contactPx = Math.round(isStory ? 22 : isSquare ? 17 : 18);
  const logoMaxH = Math.round(isStory ? 90 : isSquare ? 70 : 72);
  const logoMaxW = Math.round(isStory ? 280 : isSquare ? 220 : 240);

  // Logo section — centered at top
  const logoSection = data.logoUrl
    ? `<img class="school-logo" src="${data.logoUrl}" alt="${escapeHtml(data.schoolName)}" />`
    : `<div class="school-wordmark">${escapeHtml(data.schoolName)}</div>`;

  // Hero image: right side background
  const heroStyle = data.heroImageUrl
    ? `background-image: url('${data.heroImageUrl}'); background-size: cover; background-position: center top;`
    : `background: linear-gradient(160deg, ${darken(primary, 0.5)} 0%, #111 100%);`;

  // Benefit items with shield SVG icons
  const shieldSvg = (color: string) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;margin-top:1px"><path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" fill="${color}" opacity="0.9"/><path d="M10.5 14.5l-2.5-2.5 1.06-1.06 1.44 1.44 3.44-3.44 1.06 1.06-4.5 4.5z" fill="white"/></svg>`;

  const benefitItems = benefits.slice(0, 4).map(b =>
    `<li class="benefit-item">
      ${shieldSvg(primary)}
      <span>${escapeHtml(b)}</span>
    </li>`
  ).join("\n");

  // Contact info for footer
  const contactParts = [
    data.phone ? `<span class="contact-item">📞 ${escapeHtml(data.phone)}</span>` : "",
    data.website ? `<span class="contact-item">🌐 ${escapeHtml(data.website)}</span>` : "",
    data.address ? `<span class="contact-item">📍 ${escapeHtml(data.address)}</span>` : "",
  ].filter(Boolean).join('<span class="contact-sep">·</span>');

  // QR code
  const qrHtml = data.qrCodeDataUrl
    ? `<div class="qr-block">
        <img class="qr-img" src="${data.qrCodeDataUrl}" alt="QR Code" />
        <div class="qr-label">Scan to Enroll</div>
       </div>`
    : "";

  // Program name split into lines for big bold display
  const programWords = data.programName.toUpperCase().split(' ');
  const programLine1 = programWords.slice(0, Math.ceil(programWords.length / 2)).join(' ');
  const programLine2 = programWords.slice(Math.ceil(programWords.length / 2)).join(' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@400;500;700;900&family=Bebas+Neue&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    width: ${dims.width}px;
    height: ${dims.height}px;
    overflow: hidden;
    font-family: 'Roboto', sans-serif;
    background: #0a0a0a;
  }

  /* ── Main canvas ── */
  .flyer {
    width: ${dims.width}px;
    height: ${dims.height}px;
    position: relative;
    overflow: hidden;
    background: #0a0a0a;
    display: flex;
    flex-direction: column;
  }

  /* ── TOP HEADER: Logo centered ── */
  .header {
    flex-shrink: 0;
    height: ${Math.round(dims.height * (isStory ? 0.10 : 0.11))}px;
    background: linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(10,10,10,0.85) 100%);
    border-bottom: 3px solid ${primary};
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 32px;
    position: relative;
    z-index: 10;
  }

  .school-logo {
    max-height: ${logoMaxH}px;
    max-width: ${logoMaxW}px;
    object-fit: contain;
    filter: drop-shadow(0 2px 12px rgba(${primaryRgb}, 0.4));
  }

  .school-wordmark {
    color: #ffffff;
    font-family: 'Oswald', sans-serif;
    font-size: ${Math.round(logoMaxH * 0.6)}px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    text-shadow: 0 2px 16px rgba(${primaryRgb}, 0.5);
  }

  /* ── MIDDLE BODY: split left/right ── */
  .body {
    flex: 1;
    display: flex;
    min-height: 0;
    position: relative;
  }

  /* ── LEFT PANEL: program name + headline + benefits + CTA ── */
  .left-panel {
    width: ${isStory ? '100%' : '52%'};
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: ${isStory ? '32px 44px' : '28px 36px 28px 40px'};
    position: relative;
    z-index: 5;
    background: linear-gradient(90deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.90) 70%, rgba(0,0,0,0.0) 100%);
  }

  /* ── RIGHT PANEL: hero photo ── */
  .right-panel {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: ${isStory ? '100%' : '60%'};
    ${heroStyle}
    z-index: 1;
  }

  /* Gradient mask on right panel so left content reads clearly */
  .right-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(0,0,0,0.92) 0%,
      rgba(0,0,0,0.55) 35%,
      rgba(0,0,0,0.10) 65%,
      rgba(0,0,0,0.0) 100%
    );
    z-index: 2;
  }

  /* ── PROGRAM NAME — massive bold 3D text ── */
  .program-name-block {
    margin-bottom: ${Math.round(16 * scale)}px;
    line-height: 0.88;
  }

  .program-name {
    font-family: 'Oswald', sans-serif;
    font-size: ${programNamePx}px;
    font-weight: 700;
    color: #ffffff;
    text-transform: uppercase;
    letter-spacing: 2px;
    line-height: 0.9;
    display: block;
    /* 3D fire/glow effect */
    text-shadow:
      0 0 20px rgba(${primaryRgb}, 0.9),
      0 0 40px rgba(${primaryRgb}, 0.6),
      0 0 80px rgba(${primaryRgb}, 0.3),
      3px 3px 0px ${darkPrimary},
      6px 6px 0px rgba(0,0,0,0.4),
      0 4px 20px rgba(0,0,0,0.8);
    -webkit-text-stroke: 1px rgba(${primaryRgb}, 0.3);
  }

  .program-name.accent {
    color: ${primary};
    text-shadow:
      0 0 20px rgba(${primaryRgb}, 1.0),
      0 0 40px rgba(${primaryRgb}, 0.8),
      0 0 80px rgba(${primaryRgb}, 0.5),
      3px 3px 0px ${darkPrimary},
      6px 6px 0px rgba(0,0,0,0.5),
      0 4px 20px rgba(0,0,0,0.8);
    -webkit-text-stroke: 1px rgba(255,255,255,0.1);
  }

  /* Glow orb behind program name */
  .program-glow {
    position: absolute;
    top: ${Math.round(dims.height * 0.12)}px;
    left: -60px;
    width: ${Math.round(dims.width * 0.55)}px;
    height: ${Math.round(dims.height * 0.35)}px;
    background: radial-gradient(ellipse at center, rgba(${primaryRgb}, 0.18) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── HEADLINE ── */
  .headline {
    font-family: 'Roboto', sans-serif;
    font-size: ${headlinePx}px;
    font-weight: 700;
    color: rgba(255,255,255,0.95);
    line-height: 1.2;
    margin-bottom: ${Math.round(20 * scale)}px;
    text-shadow: 0 2px 12px rgba(0,0,0,0.7);
  }

  /* ── DIVIDER ── */
  .divider {
    width: 60px;
    height: 4px;
    background: ${primary};
    border-radius: 2px;
    margin-bottom: ${Math.round(18 * scale)}px;
    box-shadow: 0 0 12px rgba(${primaryRgb}, 0.7);
  }

  /* ── BENEFITS LIST ── */
  .benefits {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: ${Math.round(10 * scale)}px;
    margin-bottom: ${Math.round(24 * scale)}px;
  }

  .benefit-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: ${benefitPx}px;
    font-weight: 500;
    color: rgba(255,255,255,0.90);
    line-height: 1.3;
    text-shadow: 0 1px 6px rgba(0,0,0,0.6);
  }

  /* ── CTA BUTTON ── */
  .cta-button {
    display: inline-block;
    background: ${primary};
    color: #ffffff;
    font-family: 'Oswald', sans-serif;
    font-size: ${ctaPx}px;
    font-weight: 600;
    padding: ${Math.round(14 * scale)}px ${Math.round(36 * scale)}px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 2px;
    white-space: nowrap;
    box-shadow:
      0 6px 24px rgba(${primaryRgb}, 0.55),
      0 2px 8px rgba(0,0,0,0.5),
      inset 0 1px 0 rgba(255,255,255,0.15);
    margin-bottom: ${Math.round(8 * scale)}px;
  }

  /* ── FOOTER: school info + QR ── */
  .footer {
    flex-shrink: 0;
    height: ${Math.round(dims.height * (isStory ? 0.09 : 0.10))}px;
    background: linear-gradient(0deg, rgba(0,0,0,0.98) 0%, rgba(10,10,10,0.90) 100%);
    border-top: 3px solid ${primary};
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 ${isStory ? '44px' : '36px'};
    position: relative;
    z-index: 10;
    gap: 16px;
  }

  .footer-left {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }

  .school-name-footer {
    font-family: 'Oswald', sans-serif;
    font-size: ${contactPx + 2}px;
    font-weight: 700;
    color: #ffffff;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .contact-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .contact-item {
    font-size: ${contactPx - 2}px;
    color: rgba(255,255,255,0.70);
    font-weight: 400;
    white-space: nowrap;
  }

  .contact-sep {
    color: ${primary};
    font-weight: 700;
    font-size: ${contactPx - 2}px;
    margin: 0 2px;
  }

  /* ── QR code ── */
  .qr-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
  }

  .qr-img {
    width: ${Math.round(dims.height * (isStory ? 0.065 : 0.072))}px;
    height: ${Math.round(dims.height * (isStory ? 0.065 : 0.072))}px;
    background: #fff;
    padding: 3px;
    border-radius: 4px;
  }

  .qr-label {
    font-size: ${Math.round(contactPx * 0.75)}px;
    color: rgba(255,255,255,0.55);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    text-align: center;
  }

</style>
</head>
<body>
<div class="flyer">

  <!-- Header: school logo centered -->
  <div class="header">
    ${logoSection}
  </div>

  <!-- Body: left content + right hero photo -->
  <div class="body">

    <!-- Right panel: hero photo (behind left content) -->
    <div class="right-panel"></div>

    <!-- Glow orb behind program name -->
    <div class="program-glow"></div>

    <!-- Left panel: all text content -->
    <div class="left-panel">

      <!-- Program name: massive bold 3D -->
      <div class="program-name-block">
        <span class="program-name">${escapeHtml(programLine1)}</span>
        ${programLine2 ? `<span class="program-name accent">${escapeHtml(programLine2)}</span>` : ''}
      </div>

      <!-- Headline -->
      <p class="headline">${headline}</p>

      <!-- Colored divider -->
      <div class="divider"></div>

      <!-- Benefits with shield icons -->
      <ul class="benefits">
        ${benefitItems}
      </ul>

      <!-- CTA button -->
      <div class="cta-button">${cta}</div>

    </div>
  </div>

  <!-- Footer: school name + contact + QR -->
  <div class="footer">
    <div class="footer-left">
      <div class="school-name-footer">${escapeHtml(data.schoolName)}</div>
      <div class="contact-row">${contactParts}</div>
    </div>
    ${qrHtml}
  </div>

</div>
</body>
</html>`;
}

// ── Website banner layout ─────────────────────────────────────────────────────
function buildBannerHtml(data: FlyerData): string {
  const primary = data.primaryColor || "#C8102E";
  const secondary = data.secondaryColor || "#1A1A1A";
  const dims = SIZE_DIMS.website_banner; // 1200 × 628
  const primaryRgb = (() => {
    const c = primary.replace('#', '');
    return `${parseInt(c.substring(0,2),16)}, ${parseInt(c.substring(2,4),16)}, ${parseInt(c.substring(4,6),16)}`;
  })();

  const headline = escapeHtml(data.headline || `Join Our ${data.programName} Program!`);
  const cta = escapeHtml(data.callToAction || "Start Your FREE 7-Day Trial!");
  const benefits = (data.benefits || []).slice(0, 3);
  const heroStyle = data.heroImageUrl
    ? `background-image: url('${data.heroImageUrl}'); background-size: cover; background-position: center;`
    : `background: linear-gradient(135deg, ${darken(primary, 0.5)} 0%, #111 100%);`;

  const logoSection = data.logoUrl
    ? `<img style="max-height:52px;max-width:180px;object-fit:contain;filter:drop-shadow(0 2px 8px rgba(${primaryRgb},0.4))" src="${data.logoUrl}" alt="${escapeHtml(data.schoolName)}" />`
    : `<div style="font-family:'Oswald',sans-serif;font-size:28px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:2px">${escapeHtml(data.schoolName)}</div>`;

  const shieldSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0"><path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" fill="${primary}" opacity="0.9"/><path d="M10.5 14.5l-2.5-2.5 1.06-1.06 1.44 1.44 3.44-3.44 1.06 1.06-4.5 4.5z" fill="white"/></svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { width:${dims.width}px; height:${dims.height}px; overflow:hidden; font-family:'Roboto',sans-serif; background:#0a0a0a; }
  .banner { width:${dims.width}px; height:${dims.height}px; position:relative; overflow:hidden; display:flex; }
  .bg { position:absolute; inset:0; ${heroStyle} }
  .bg::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.75) 45%, rgba(0,0,0,0.2) 100%); }
  .left { position:relative; z-index:5; width:55%; display:flex; flex-direction:column; justify-content:center; padding:40px 48px; gap:16px; }
  .logo-row { margin-bottom:8px; }
  .headline { font-family:'Oswald',sans-serif; font-size:52px; font-weight:700; color:#fff; line-height:1.0; text-shadow:0 2px 16px rgba(0,0,0,0.7); }
  .benefits-row { display:flex; flex-direction:column; gap:8px; }
  .benefit { display:flex; align-items:center; gap:10px; font-size:18px; color:rgba(255,255,255,0.88); font-weight:500; }
  .cta { display:inline-block; background:${primary}; color:#fff; font-family:'Oswald',sans-serif; font-size:22px; font-weight:600; padding:14px 36px; border-radius:6px; text-transform:uppercase; letter-spacing:2px; box-shadow:0 6px 24px rgba(${primaryRgb},0.5); }
</style></head>
<body><div class="banner">
  <div class="bg"></div>
  <div class="left">
    <div class="logo-row">${logoSection}</div>
    <div class="headline">${headline}</div>
    <div class="benefits-row">${benefits.map(b => `<div class="benefit">${shieldSvg}<span>${escapeHtml(b)}</span></div>`).join('')}</div>
    <div class="cta">${cta}</div>
  </div>
</div></body></html>`;
}

// ── Business card HTML template ─────────────────────────────────────────────
export function buildBusinessCardHtml(data: FlyerData): string {
  const primary = data.primaryColor || "#C8102E";
  const secondary = data.secondaryColor || "#1A1A1A";
  const dims = SIZE_DIMS.business_card; // 1050 × 600

  const schoolName = escapeHtml(data.schoolName || "Your Dojo");
  const tagline = escapeHtml(data.tagline || "Martial Arts · Self-Defense · Fitness");
  const phone = data.phone ? escapeHtml(data.phone) : null;
  const email = data.email ? escapeHtml(data.email) : null;
  const website = data.website ? escapeHtml(data.website) : null;
  const address = data.address ? escapeHtml(data.address) : null;

  // Logo or wordmark
  const logoHtml = data.logoUrl
    ? `<img class="bc-logo" src="${data.logoUrl}" alt="${schoolName}" />`
    : `<div class="bc-wordmark">${schoolName}</div>`;

  // QR code (right side)
  const qrHtml = data.qrCodeDataUrl
    ? `<div class="bc-qr-block">
        <img class="bc-qr" src="${data.qrCodeDataUrl}" alt="QR" />
        <div class="bc-qr-label">Scan to Connect</div>
       </div>`
    : "";

  // Contact rows
  const contactRows = [
    phone  ? `<div class="bc-contact-row"><span class="bc-icon">📞</span><span>${phone}</span></div>` : "",
    email  ? `<div class="bc-contact-row"><span class="bc-icon">✉</span><span>${email}</span></div>` : "",
    website? `<div class="bc-contact-row"><span class="bc-icon">🌐</span><span>${website}</span></div>` : "",
    address? `<div class="bc-contact-row"><span class="bc-icon">📍</span><span>${address}</span></div>` : "",
  ].filter(Boolean).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    width: ${dims.width}px;
    height: ${dims.height}px;
    overflow: hidden;
    font-family: 'Montserrat', sans-serif;
    background: ${secondary};
  }

  /* ── Card canvas ── */
  .bc {
    width: ${dims.width}px;
    height: ${dims.height}px;
    position: relative;
    overflow: hidden;
    display: flex;
    background: ${secondary};
  }

  /* ── Left accent stripe ── */
  .bc-stripe {
    width: 12px;
    background: ${primary};
    flex-shrink: 0;
  }

  /* ── Left panel: logo + tagline ── */
  .bc-left {
    width: 380px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px 36px;
    background: ${secondary};
    border-right: 1px solid rgba(255,255,255,0.08);
    position: relative;
  }

  .bc-logo {
    max-height: 80px;
    max-width: 260px;
    object-fit: contain;
    margin-bottom: 16px;
  }

  .bc-wordmark {
    font-size: 28px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: -0.5px;
    line-height: 1.1;
    margin-bottom: 16px;
    text-transform: uppercase;
  }

  .bc-tagline {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255,255,255,0.55);
    letter-spacing: 1.2px;
    text-transform: uppercase;
    line-height: 1.5;
  }

  /* ── Accent dot ── */
  .bc-dot {
    width: 8px;
    height: 8px;
    background: ${primary};
    border-radius: 50%;
    margin-bottom: 12px;
  }

  /* ── Right panel: contact info ── */
  .bc-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px 36px;
    gap: 0;
  }

  .bc-contact-row {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 15px;
    font-weight: 500;
    color: rgba(255,255,255,0.88);
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    font-family: 'Open Sans', sans-serif;
  }

  .bc-contact-row:last-child { border-bottom: none; }

  .bc-icon {
    font-size: 14px;
    width: 20px;
    text-align: center;
    flex-shrink: 0;
    color: ${primary};
  }

  /* ── QR code block ── */
  .bc-qr-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 28px;
    border-left: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
  }

  .bc-qr {
    width: 100px;
    height: 100px;
    border-radius: 6px;
    background: #fff;
    padding: 4px;
  }

  .bc-qr-label {
    font-size: 10px;
    font-weight: 600;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-top: 8px;
    text-align: center;
  }

  /* ── Bottom color bar ── */
  .bc-bottom-bar {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 5px;
    background: ${primary};
  }

</style>
</head>
<body>
<div class="bc">
  <div class="bc-stripe"></div>

  <!-- Left: Logo + tagline -->
  <div class="bc-left">
    <div class="bc-dot"></div>
    ${logoHtml}
    <div class="bc-tagline">${tagline}</div>
  </div>

  <!-- Right: Contact info -->
  <div class="bc-right">
    ${contactRows}
  </div>

  <!-- QR code -->
  ${qrHtml}

  <div class="bc-bottom-bar"></div>
</div>
</body>
</html>`;
}

// ── Puppeteer renderer ────────────────────────────────────────────────────────
let _browser: puppeteer.Browser | null = null;

async function getBrowser(): Promise<puppeteer.Browser> {
  if (_browser && _browser.connected) return _browser;
  // Use @sparticuz/chromium in production (Cloud Run), fall back to local Chromium in dev
  let executablePath: string;
  let extraArgs: string[] = [];
  try {
    const chromium = await import('@sparticuz/chromium');
    executablePath = await chromium.default.executablePath();
    extraArgs = chromium.default.args;
  } catch {
    // Fallback for local development — try multiple common paths
    const { existsSync } = await import('fs');
    executablePath = process.env.CHROMIUM_PATH ||
      ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']
        .find(p => existsSync(p)) ||
      '/usr/bin/chromium';
  }
  _browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      ...extraArgs,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
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
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 25000 });
    await page.evaluate(() => document.fonts.ready);
    // Extra wait for background images to fully render
    await new Promise(r => setTimeout(r, 800));
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
  const cta = briefAnswers.content || extractCta(prompt) || "Start Your FREE 7-Day Trial!";

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
      "FREE 7-Day Trial — no commitment required",
    ],
    ninja: [
      "Build confidence, focus & discipline",
      "Develop motor skills & coordination",
      "Fun, safe environment for ages 3–5",
      "FREE 7-Day Trial — no commitment required",
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

  // Generate QR code for the school website (or a fallback URL)
  const qrUrl = brand.website || `https://www.google.com/search?q=${encodeURIComponent(brand.schoolName || 'martial arts school near me')}`;
  const qrCodeDataUrl = await generateQrCodeDataUrl(qrUrl);

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
    qrCodeDataUrl,
    size,
  };
}

// ── QR code generator ───────────────────────────────────────────────────────
export async function generateQrCodeDataUrl(url: string): Promise<string | null> {
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 200,
      color: { dark: '#000000', light: '#ffffff' },
    });
    return dataUrl;
  } catch (err: any) {
    console.warn('[FlyerRenderer] QR code generation failed:', err?.message);
    return null;
  }
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
  if (lower.includes("free trial") || lower.includes("7 day") || lower.includes("7-day")) return "Start Your FREE 7-Day Trial!";
  if (lower.includes("enroll")) return "Enroll Today — 7-Day Trial Available!";
  if (lower.includes("limited spots")) return "Limited Spots Available — Register Now!";
  return null;
}
