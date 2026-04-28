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

// ── HTML template builder — Cinematic full-bleed layout ────────────────────────────────────
export function buildFlyerHtml(data: FlyerData): string {
  // Route business card to its own template
  if (data.size === 'business_card') return buildBusinessCardHtml(data);

  const primary = data.primaryColor || "#C8102E";
  const secondary = data.secondaryColor || "#1A1A1A";
  const darkPrimary = darken(primary, 0.3);

  const size = data.size || "flyer";
  const dims = SIZE_DIMS[size] || SIZE_DIMS.flyer;
  const isSquare = size === "instagram_post";
  const isStory = size === "instagram_story";
  const isBanner = size === "website_banner";

  const headline = data.headline || `Join Our ${data.programName} Program!`;
  const subheadline = data.subheadline || (data.audience ? `${data.programName} · ${data.audience}` : data.programName);
  const cta = data.callToAction || "Start Your FREE 7-Day Trial!";
  const benefits = data.benefits || [
    "Build confidence, focus & discipline",
    "Fun, safe learning environment",
    "Expert instructors, small class sizes",
    "FREE 7-Day Trial — no commitment required",
  ];

  const scale = isStory ? 1.5 : isSquare ? 1.1 : isBanner ? 0.75 : 1;
  const headlinePx = Math.round(52 * scale);
  const subPx = Math.round(22 * scale);
  const benefitPx = Math.round(17 * scale);
  const ctaPx = Math.round(20 * scale);
  const contactPx = Math.round(14 * scale);
  const logoMaxH = Math.round(48 * scale);

  // Smart headline coloring — last word in primary color
  const headlineWords = escapeHtml(headline).split(" ");
  const coloredHeadline = headlineWords.length > 2
    ? headlineWords.slice(0, -1).join(" ") + ` <span class="hl-accent">${headlineWords[headlineWords.length - 1]}</span>`
    : `<span class="hl-accent">${escapeHtml(headline)}</span>`;

  // Logo or school name wordmark
  const logoSection = data.logoUrl
    ? `<img class="school-logo" src="${data.logoUrl}" alt="${escapeHtml(data.schoolName)}" />`
    : `<div class="school-wordmark">${escapeHtml(data.schoolName)}</div>`;

  // Background: full-bleed photo or cinematic gradient fallback
  const bgStyle = data.heroImageUrl
    ? `background-image: url('${data.heroImageUrl}'); background-size: cover; background-position: center top;`
    : `background: linear-gradient(160deg, ${secondary} 0%, ${darken(secondary, 0.2)} 40%, ${darkPrimary} 100%);`;

  // Benefits icons (clean bullet style)
  const benefitItems = benefits.slice(0, isBanner ? 3 : 4).map(b =>
    `<li><span class="benefit-dot"></span><span>${escapeHtml(b)}</span></li>`
  ).join("\n      ");

  // Contact footer items
  const footerItems = [
    data.phone ? `<div class="footer-item"><span class="footer-icon">📞</span>${escapeHtml(data.phone)}</div>` : "",
    data.email ? `<div class="footer-item"><span class="footer-icon">✉</span>${escapeHtml(data.email)}</div>` : "",
    data.website ? `<div class="footer-item"><span class="footer-icon">🌐</span>${escapeHtml(data.website)}</div>` : "",
    data.address ? `<div class="footer-item footer-address"><span class="footer-icon">📍</span>${escapeHtml(data.address)}</div>` : "",
  ].filter(Boolean).join('<div class="footer-sep">·</div>');

  const testimonialHtml = data.testimonial
    ? `<div class="testimonial-bar">
        <span class="testimonial-quote">"${escapeHtml(data.testimonial)}"</span>
       </div>`
    : "";

  // QR code section (only shown if qrCodeDataUrl is provided)
  const qrSection = data.qrCodeDataUrl
    ? `<div class="qr-block">
        <img class="qr-img" src="${data.qrCodeDataUrl}" alt="QR Code" />
        <div class="qr-label">Scan to Enroll</div>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400&family=Open+Sans:wght@400;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    width: ${dims.width}px;
    height: ${dims.height}px;
    overflow: hidden;
    font-family: 'Montserrat', sans-serif;
  }

  /* ── Full-bleed canvas ── */
  .flyer {
    width: ${dims.width}px;
    height: ${dims.height}px;
    position: relative;
    overflow: hidden;
    ${bgStyle}
  }

  /* ── Cinematic gradient overlay ── */
  .overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(
        to bottom,
        rgba(0,0,0,0.72) 0%,
        rgba(0,0,0,0.28) 35%,
        rgba(0,0,0,0.18) 55%,
        rgba(0,0,0,0.82) 100%
      );
  }

  /* ── Color accent stripe at top ── */
  .top-stripe {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: ${Math.round(6 * scale)}px;
    background: ${primary};
  }

  /* ── Content layer ── */
  .content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    padding: ${isStory ? "48px 52px" : isBanner ? "28px 48px" : "32px 44px"};
  }

  /* ── TOP: Logo + program badge ── */
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: auto;
    padding-bottom: ${isStory ? "32px" : "20px"};
  }

  .school-logo {
    max-height: ${logoMaxH}px;
    max-width: ${Math.round(180 * scale)}px;
    object-fit: contain;
    filter: brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.5));
  }

  .school-wordmark {
    color: #ffffff;
    font-size: ${Math.round(20 * scale)}px;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-shadow: 0 2px 12px rgba(0,0,0,0.7);
  }

  .program-badge {
    background: ${primary};
    color: #ffffff;
    font-size: ${Math.round(11 * scale)}px;
    font-weight: 800;
    padding: ${Math.round(6 * scale)}px ${Math.round(16 * scale)}px;
    border-radius: 40px;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    white-space: nowrap;
    box-shadow: 0 4px 16px ${hexToRgba(primary, 0.5)};
  }

  /* ── MIDDLE: spacer to push content to bottom ── */
  .spacer { flex: 1; }

  /* ── BOTTOM: headline + benefits + CTA ── */
  .bottom-content {
    display: flex;
    flex-direction: column;
    gap: ${isStory ? "20px" : "14px"};
  }

  .headline {
    font-size: ${headlinePx}px;
    font-weight: 900;
    line-height: 1.05;
    color: #ffffff;
    letter-spacing: -0.5px;
    text-shadow: 0 3px 20px rgba(0,0,0,0.6);
  }

  .hl-accent { color: ${primary}; }

  .subheadline {
    font-size: ${subPx}px;
    font-weight: 700;
    color: rgba(255,255,255,0.88);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
  }

  /* ── Benefits ── */
  .benefits {
    list-style: none;
    display: flex;
    flex-direction: ${isBanner ? "row" : "column"};
    gap: ${isStory ? "10px" : "7px"};
    flex-wrap: wrap;
  }

  .benefits li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: ${benefitPx}px;
    color: rgba(255,255,255,0.92);
    font-weight: 600;
    text-shadow: 0 1px 6px rgba(0,0,0,0.5);
  }

  .benefit-dot {
    width: ${Math.round(8 * scale)}px;
    height: ${Math.round(8 * scale)}px;
    min-width: ${Math.round(8 * scale)}px;
    background: ${primary};
    border-radius: 50%;
    box-shadow: 0 0 8px ${hexToRgba(primary, 0.7)};
  }

  /* ── CTA button ── */
  .cta-section {
    display: flex;
    align-items: center;
    gap: ${isStory ? "20px" : "14px"};
    flex-wrap: wrap;
    margin-top: ${isStory ? "8px" : "4px"};
  }

  .cta-button {
    background: ${primary};
    color: #ffffff;
    font-size: ${ctaPx}px;
    font-weight: 800;
    padding: ${Math.round(14 * scale)}px ${Math.round(32 * scale)}px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 1px;
    white-space: nowrap;
    box-shadow: 0 6px 24px ${hexToRgba(primary, 0.6)};
  }

  .cta-phone {
    color: rgba(255,255,255,0.9);
    font-size: ${Math.round(ctaPx * 0.85)}px;
    font-weight: 700;
    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }

  /* ── Testimonial bar ── */
  .testimonial-bar {
    background: ${hexToRgba(primary, 0.2)};
    border-left: 4px solid ${primary};
    padding: ${isStory ? "12px 18px" : "8px 14px"};
    border-radius: 0 4px 4px 0;
  }

  .testimonial-quote {
    color: rgba(255,255,255,0.88);
    font-size: ${Math.round(14 * scale)}px;
    font-style: italic;
    font-weight: 500;
    text-shadow: 0 1px 6px rgba(0,0,0,0.4);
  }

  /* ── Footer contact strip ── */
  .footer {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(4px);
    padding: ${isStory ? "16px 52px" : "10px 44px"};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${isStory ? "16px" : "10px"};
    flex-wrap: wrap;
    border-top: 2px solid ${hexToRgba(primary, 0.5)};
  }

  .footer-item {
    color: rgba(255,255,255,0.85);
    font-size: ${contactPx}px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .footer-icon { font-size: ${Math.round(contactPx * 0.9)}px; }

  .footer-address {
    color: rgba(255,255,255,0.65);
    font-size: ${Math.round(contactPx * 0.85)}px;
  }

  .footer-sep {
    color: ${hexToRgba(primary, 0.7)};
    font-size: ${contactPx}px;
    font-weight: 700;
  }

  /* ── QR code block ── */
  .qr-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .qr-img {
    width: ${Math.round(72 * scale)}px;
    height: ${Math.round(72 * scale)}px;
    border-radius: 4px;
    background: #fff;
    padding: 3px;
  }
  .qr-label {
    color: rgba(255,255,255,0.75);
    font-size: ${Math.round(10 * scale)}px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    text-align: center;
  }

  /* ── Footer with QR: two-column layout ── */
  .footer-inner {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${isStory ? "16px" : "10px"};
    flex-wrap: wrap;
  }

  /* ── Bottom color stripe ── */
  .bottom-stripe {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: ${Math.round(4 * scale)}px;
    background: ${primary};
  }

</style>
</head>
<body>
<div class="flyer">

  <!-- Cinematic overlay -->
  <div class="overlay"></div>
  <div class="top-stripe"></div>

  <!-- Content layer -->
  <div class="content">

    <!-- Top bar: logo + program badge -->
    <div class="top-bar">
      ${logoSection}
      ${data.audience ? `<div class="program-badge">${escapeHtml(data.audience)}</div>` : `<div class="program-badge">${escapeHtml(data.programName)}</div>`}
    </div>

    <!-- Spacer pushes headline to bottom half -->
    <div class="spacer"></div>

    <!-- Bottom content block -->
    <div class="bottom-content">

      <h1 class="headline">${coloredHeadline}</h1>
      <p class="subheadline">${escapeHtml(subheadline)}</p>

      <ul class="benefits">
        ${benefitItems}
      </ul>

      ${testimonialHtml}

      <div class="cta-section">
        <div class="cta-button">${escapeHtml(cta)}</div>
        ${data.phone ? `<div class="cta-phone">📞 ${escapeHtml(data.phone)}</div>` : ""}
      </div>

    </div>
  </div>

  <!-- Footer contact strip with QR code -->
  ${(footerItems || qrSection) ? `<div class="footer">
    <div class="footer-inner">${footerItems}</div>
    ${qrSection}
  </div>` : ""}
  <div class="bottom-stripe"></div>

</div>
</body>
</html>`;
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
