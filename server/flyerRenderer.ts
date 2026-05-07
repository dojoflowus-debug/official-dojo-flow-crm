/**
 * Flyer Renderer Service
 *
 * Builds HTML flyer templates for client-side rendering via srcdoc iframe + html2canvas.
 * The server generates the HTML string; the browser renders it and captures a PNG.
 *
 * Design: Cinematic full-bleed poster layout — hero photo fills the entire canvas,
 * bold program name at bottom, diagonal accent band, and clean footer bar.
 */

// puppeteer-core is dynamically imported inside renderFlyerToPng to avoid
// TypeScript namespace errors when @types/puppeteer is not installed.
import https from "https";
import http from "http";
import QRCode from "qrcode";

// ── Pexels stock photo fetcher ────────────────────────────────────────────────
const PROGRAM_PHOTO_QUERIES: Record<string, string> = {
  "little ninjas": "children karate martial arts kids training dojo white gi",
  ninja: "children karate martial arts kids training dojo white gi",
  karate: "karate martial arts student training kick punch dojo",
  "adult karate": "adult karate martial arts training kick powerful dojo",
  kickboxing: "kickboxing martial arts training punch kick powerful",
  bjj: "jiu jitsu grappling martial arts training mat",
  "jiu-jitsu": "jiu jitsu grappling martial arts training mat",
  taekwondo: "taekwondo martial arts high kick training powerful",
  boxing: "boxing training punch powerful athlete gym",
  "muay thai": "muay thai kickboxing training powerful kick",
  mma: "mixed martial arts training powerful athlete",
  wrestling: "wrestling martial arts training athlete",
  judo: "judo martial arts throw training",
  "self defense": "self defense martial arts training women empowerment",
  "self-defense": "self defense martial arts training women empowerment",
  fitness: "fitness workout training gym athlete powerful",
  yoga: "yoga class studio peaceful meditation",
  dance: "dance class studio performance energy",
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

// ── HTML template builder — Cinematic Full-Bleed Poster Layout ───────────────
export function buildFlyerHtml(data: FlyerData): string {
  // Route business card to its own template
  if (data.size === 'business_card') return buildBusinessCardHtml(data);
  // Route banner to its own layout
  if (data.size === 'website_banner') return buildBannerHtml(data);

  const primary = data.primaryColor || "#C8102E";
  const darkPrimary = darken(primary, 0.35);
  const primaryRgb = (() => {
    const c = primary.replace('#', '');
    return `${parseInt(c.substring(0,2),16)}, ${parseInt(c.substring(2,4),16)}, ${parseInt(c.substring(4,6),16)}`;
  })();

  const size = data.size || "flyer";
  const dims = SIZE_DIMS[size] || SIZE_DIMS.flyer;
  const isSquare = size === "instagram_post";
  const isStory = size === "instagram_story";
  const W = dims.width;
  const H = dims.height;

  // Font sizes scale with canvas height
  const baseUnit = H / 1056;
  const programNamePx = Math.round((isStory ? 148 : isSquare ? 120 : 148) * baseUnit);
  const taglinePx     = Math.round((isStory ? 34  : isSquare ? 30  : 34 ) * baseUnit);
  const benefitPx     = Math.round((isStory ? 28  : isSquare ? 24  : 26 ) * baseUnit);
  const ctaPx         = Math.round((isStory ? 32  : isSquare ? 28  : 30 ) * baseUnit);
  const contactPx     = Math.round((isStory ? 20  : isSquare ? 16  : 18 ) * baseUnit);
  const logoMaxH      = Math.round((isStory ? 80  : isSquare ? 60  : 64 ) * baseUnit);
  const contentPad    = Math.round(W * 0.045);
  const footerH       = Math.round(H * 0.09);
  const headerH       = Math.round(H * 0.095);

  // Hero image — full bleed background
  const heroStyle = data.heroImageUrl
    ? `background-image: url('${data.heroImageUrl}'); background-size: cover; background-position: center 20%;`
    : `background: linear-gradient(160deg, ${darken(primary, 0.6)} 0%, #0a0a0a 100%);`;

  // Logo or school wordmark
  const logoSection = data.logoUrl
    ? `<img style="max-height:${logoMaxH}px;max-width:${Math.round(W*0.45)}px;object-fit:contain;display:block;filter:drop-shadow(0 2px 12px rgba(${primaryRgb},0.5)) brightness(1.1)" src="${data.logoUrl}" alt="${escapeHtml(data.schoolName)}" />`
    : `<span style="font-family:'Oswald',sans-serif;font-size:${Math.round(logoMaxH*0.55)}px;font-weight:700;color:#fff;letter-spacing:3px;text-transform:uppercase;text-shadow:0 2px 16px rgba(${primaryRgb},0.6)">${escapeHtml(data.schoolName)}</span>`;

  // Program name — each word on its own line for maximum impact
  // Metallic beveled effect: layered text-shadows simulate 3D extrusion
  const programWords = data.programName.toUpperCase().split(' ');
  const programNameHtml = programWords.map((word, i) => {
    const isLastWord = i === programWords.length - 1;
    const color = isLastWord ? primary : '#ffffff';
    // Metallic 3D extrusion: multiple offset shadows create depth
    const shadow = isLastWord
      ? `1px 1px 0 ${darkPrimary}, 2px 2px 0 ${darkPrimary}, 3px 3px 0 rgba(0,0,0,0.5), 4px 4px 0 rgba(0,0,0,0.4), 5px 5px 0 rgba(0,0,0,0.3), 0 0 40px rgba(${primaryRgb},1.0), 0 0 80px rgba(${primaryRgb},0.6), 0 0 120px rgba(${primaryRgb},0.3)`
      : `1px 1px 0 rgba(80,80,80,0.8), 2px 2px 0 rgba(60,60,60,0.7), 3px 3px 0 rgba(40,40,40,0.6), 4px 4px 0 rgba(0,0,0,0.5), 5px 5px 0 rgba(0,0,0,0.4), 0 0 30px rgba(255,255,255,0.15)`;
    const stroke = isLastWord ? `1.5px rgba(255,200,200,0.3)` : `1px rgba(200,200,200,0.2)`;
    return `<div style="font-family:'Oswald',sans-serif;font-size:${programNamePx}px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:3px;line-height:0.90;text-shadow:${shadow};-webkit-text-stroke:${stroke}">${escapeHtml(word)}</div>`;
  }).join('');

  // Benefit items — shield icon + bold title + subtitle format (matching reference)
  const benefitList = (data.benefits || [
    "Builds Character|Confidence. Respect. Discipline.",
    "Better Listeners|Focus. Attention. Following Directions.",
    "Fun & Engaging|Active. Exciting. Age-Appropriate.",
    "Ages 3-12|The perfect start for your child.",
  ]);

  // Parse benefits: if they contain | separator, split into title/subtitle
  const parsedBenefits = benefitList.slice(0, 4).map(b => {
    const parts = b.split('|');
    return { title: parts[0].trim(), sub: parts[1]?.trim() || '' };
  });

  const shieldIconSvg = (color: string, iconPath: string) =>
    `<svg width="${Math.round(benefitPx*2.2)}" height="${Math.round(benefitPx*2.2)}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
      <circle cx="24" cy="24" r="23" fill="${color}" opacity="0.15" stroke="${color}" stroke-width="1.5" opacity="0.6"/>
      <circle cx="24" cy="24" r="17" fill="${color}" opacity="0.25"/>
      ${iconPath}
    </svg>`;

  const shieldIcons = [
    shieldIconSvg(primary, `<path d="M24 14l-8 3.5v5c0 4.6 3.2 8.9 8 10 4.8-1.1 8-5.4 8-10v-5l-8-3.5z" fill="${primary}" opacity="0.9"/><path d="M21 24l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`),
    shieldIconSvg(primary, `<circle cx="24" cy="20" r="5" fill="${primary}" opacity="0.9"/><path d="M14 34c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="${primary}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.9"/>`),
    shieldIconSvg(primary, `<circle cx="24" cy="24" r="8" stroke="${primary}" stroke-width="2.5" fill="none" opacity="0.9"/><path d="M21 24l2 2 4-4" stroke="${primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`),
    shieldIconSvg(primary, `<path d="M16 20h16M16 24h12M16 28h8" stroke="${primary}" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>`),
  ];

  const benefitItems = parsedBenefits.map((b, i) =>
    `<div style="display:flex;align-items:center;gap:${Math.round(benefitPx*0.7)}px;margin-bottom:${Math.round(benefitPx*0.55)}px">
      ${shieldIcons[i % shieldIcons.length]}
      <div style="display:flex;flex-direction:column;gap:2px">
        <span style="font-family:'Oswald',sans-serif;font-size:${Math.round(benefitPx*1.05)}px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1.5px;text-shadow:0 1px 8px rgba(0,0,0,0.9)">${escapeHtml(b.title)}</span>
        ${b.sub ? `<span style="font-family:'Roboto',sans-serif;font-size:${Math.round(benefitPx*0.78)}px;font-weight:400;color:rgba(255,255,255,0.65);letter-spacing:0.5px">${escapeHtml(b.sub)}</span>` : ''}
      </div>
    </div>`
  ).join('');

  // QR code — large, bottom-left, with SCAN TO START YOUR JOURNEY
  const qrSize = Math.round(H * 0.135);
  const scanLine1 = "SCAN TO";
  const scanLine2 = "START";
  const scanLine3 = "YOUR JOURNEY";
  const qrHtml = data.qrCodeDataUrl
    ? `<div style="display:flex;align-items:center;gap:${Math.round(W*0.025)}px">
        <div style="background:#fff;padding:8px;border-radius:10px;display:inline-block;box-shadow:0 4px 24px rgba(0,0,0,0.8)">
          <img src="${data.qrCodeDataUrl}" alt="QR" style="width:${qrSize}px;height:${qrSize}px;display:block" />
        </div>
        <div style="display:flex;flex-direction:column;gap:0">
          <span style="font-family:'Oswald',sans-serif;font-size:${Math.round(ctaPx*0.9)}px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:2px;line-height:1.1">${scanLine1}</span>
          <span style="font-family:'Oswald',sans-serif;font-size:${Math.round(ctaPx*1.5)}px;font-weight:700;color:${primary};text-transform:uppercase;letter-spacing:2px;line-height:1.0;text-shadow:0 0 20px rgba(${primaryRgb},0.8)">${scanLine2}</span>
          <span style="font-family:'Oswald',sans-serif;font-size:${Math.round(ctaPx*0.9)}px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:2px;line-height:1.1">${scanLine3}</span>
        </div>
      </div>`
    : '';

  const tagline = escapeHtml(data.headline || `Unleash Your Child's Inner Warrior`);

  // Split layout: left text panel (50%), right hero image (55% — overlaps for depth)
  const leftW = Math.round(W * (isStory ? 1.0 : isSquare ? 0.58 : 0.55));
  // Hero takes up right 60% of canvas, overlapping slightly with left panel
  const heroW = Math.round(W * (isStory ? 0 : isSquare ? 0.55 : 0.60));
  const heroImageHtml = data.heroImageUrl
    ? `<div style="position:absolute;top:0;right:0;width:${heroW}px;height:${H}px;overflow:hidden;z-index:1">
        <img src="${data.heroImageUrl}" style="width:100%;height:100%;object-fit:cover;object-position:center 15%;filter:contrast(1.15) saturate(1.25) brightness(1.05)" />
        <!-- Strong gradient fade left edge — hero bleeds into dark panel -->
        <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,3,3,1.0) 0%,rgba(3,3,3,0.55) 18%,rgba(3,3,3,0.1) 40%,rgba(3,3,3,0.0) 60%)"></div>
        <!-- Subtle bottom fade -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:${Math.round(H*0.18)}px;background:linear-gradient(180deg,transparent 0%,rgba(3,3,3,0.7) 100%)"></div>
      </div>`
    : `<div style="position:absolute;top:0;right:0;width:${Math.round(W*0.6)}px;height:${H}px;background:radial-gradient(ellipse at center,rgba(${primaryRgb},0.15) 0%,transparent 70%);z-index:1"></div>`;

  // ── Ember particle SVGs for atmosphere ──────────────────────────────────────
  const embers = [
    { x: 8, y: 12, r: 2.5, o: 0.7 }, { x: 15, y: 6, r: 1.8, o: 0.5 },
    { x: 22, y: 18, r: 3, o: 0.6 }, { x: 5, y: 28, r: 1.5, o: 0.4 },
    { x: 30, y: 8, r: 2, o: 0.65 }, { x: 38, y: 22, r: 1.2, o: 0.5 },
    { x: 12, y: 35, r: 2.2, o: 0.55 }, { x: 45, y: 15, r: 1.8, o: 0.45 },
  ].map(e => `<circle cx="${e.x}" cy="${e.y}" r="${e.r}" fill="rgba(${primaryRgb},${e.o})"/>`).join('');
  const emberSvg = `<svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">${embers}</svg>`;

  // ── Red glow accent lines ─────────────────────────────────────────────────────
  const glowLine = `<div style="position:absolute;left:0;top:${Math.round(H*0.14)}px;width:${Math.round(W*0.005)}px;height:${Math.round(H*0.72)}px;background:linear-gradient(180deg,transparent 0%,${primary} 20%,${primary} 80%,transparent 100%);box-shadow:0 0 20px 4px rgba(${primaryRgb},0.8);z-index:15"></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@400;500;600;700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { width:${W}px; height:${H}px; overflow:hidden; background:#030303; }
</style>
</head>
<body>
<div style="width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#030303">

  <!-- DEEP DARK BACKGROUND with red radial glow -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 60%,rgba(${primaryRgb},0.18) 0%,rgba(${primaryRgb},0.06) 35%,transparent 65%),radial-gradient(ellipse at 70% 30%,rgba(${primaryRgb},0.08) 0%,transparent 50%),linear-gradient(180deg,#0a0505 0%,#030303 40%,#050202 100%);z-index:0"></div>

  <!-- EMBER PARTICLES overlay -->
  ${emberSvg}

  <!-- RIGHT HERO IMAGE — takes up 55% of canvas -->
  ${heroImageHtml}

  <!-- LEFT PANEL GRADIENT OVERLAY — deep dark to transparent -->
  <div style="position:absolute;top:0;left:0;width:${Math.round(W*0.72)}px;height:${H}px;background:linear-gradient(90deg,rgba(3,3,3,1.0) 0%,rgba(3,3,3,0.97) 55%,rgba(3,3,3,0.7) 72%,rgba(3,3,3,0.0) 100%);z-index:4"></div>

  <!-- RED GLOW LEFT EDGE LINE -->
  ${glowLine}

  <!-- TOP HEADER BAR — school name/logo -->
  <div style="position:absolute;top:0;left:0;right:0;height:${headerH}px;display:flex;align-items:center;padding:0 ${contentPad}px;z-index:20;border-bottom:1px solid rgba(${primaryRgb},0.15)">
    ${logoSection}
  </div>

  <!-- MAIN LEFT CONTENT PANEL -->
  <div style="position:absolute;top:${headerH}px;left:0;width:${leftW}px;bottom:0;z-index:20;padding:${Math.round(H*0.018)}px ${contentPad}px ${Math.round(H*0.035)}px;display:flex;flex-direction:column;justify-content:space-between">

    <!-- TOP SECTION: Program name + tagline + benefits -->
    <div>

      <!-- PROGRAM NAME — metallic beveled style -->
      <div style="margin-bottom:${Math.round(H*0.008)}px">
        ${programNameHtml}
      </div>

      <!-- FREE TRIAL OFFER BADGE -->
      <div style="display:inline-flex;align-items:center;gap:10px;background:rgba(${primaryRgb},0.12);border:1.5px solid rgba(${primaryRgb},0.5);border-radius:4px;padding:${Math.round(H*0.008)}px ${Math.round(W*0.025)}px;margin-bottom:${Math.round(H*0.022)}px">
        <div style="width:8px;height:8px;border-radius:50%;background:${primary};box-shadow:0 0 10px rgba(${primaryRgb},1.0)"></div>
        <span style="font-family:'Oswald',sans-serif;font-size:${Math.round(taglinePx*0.95)}px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:3px">${escapeHtml(data.callToAction || 'FREE TRIAL CLASS')}</span>
      </div>

      <!-- TAGLINE -->
      <div style="font-family:'Roboto',sans-serif;font-size:${Math.round(taglinePx*0.82)}px;font-weight:400;color:rgba(255,255,255,0.70);letter-spacing:0.3px;margin-bottom:${Math.round(H*0.022)}px;line-height:1.3;max-width:${Math.round(leftW*0.9)}px">${tagline}</div>

      <!-- RED ACCENT DIVIDER -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:${Math.round(H*0.022)}px">
        <div style="width:${Math.round(W*0.055)}px;height:2px;background:linear-gradient(90deg,${primary},rgba(${primaryRgb},0));box-shadow:0 0 12px rgba(${primaryRgb},0.9)"></div>
        <div style="width:6px;height:6px;border-radius:50%;background:${primary};box-shadow:0 0 8px rgba(${primaryRgb},1.0)"></div>
      </div>

      <!-- BENEFITS with shield icons -->
      <div>
        ${benefitItems}
      </div>
    </div>

    <!-- BOTTOM SECTION: QR code + CTA -->
    <div>
      ${qrHtml}
    </div>

  </div>

</div>
</body>
</html>`;

}

// ── Website banner layout ─────────────────────────────────────────────────────
function buildBannerHtml(data: FlyerData): string {
  const primary = data.primaryColor || "#C8102E";
  const secondary = data.secondaryColor || "#1A1A1A";
  const dims = SIZE_DIMS.website_banner;
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
  const dims = SIZE_DIMS.business_card;

  const schoolName = escapeHtml(data.schoolName || "Your Dojo");
  const tagline = escapeHtml(data.tagline || "Martial Arts · Self-Defense · Fitness");
  const phone = data.phone ? escapeHtml(data.phone) : null;
  const email = data.email ? escapeHtml(data.email) : null;
  const website = data.website ? escapeHtml(data.website) : null;
  const address = data.address ? escapeHtml(data.address) : null;
  const primaryRgb = (() => {
    const c = primary.replace('#', '');
    return `${parseInt(c.substring(0,2),16)}, ${parseInt(c.substring(2,4),16)}, ${parseInt(c.substring(4,6),16)}`;
  })();

  const logoSection = data.logoUrl
    ? `<img style="max-height:64px;max-width:200px;object-fit:contain;filter:drop-shadow(0 2px 8px rgba(${primaryRgb},0.4))" src="${data.logoUrl}" alt="${schoolName}" />`
    : `<div style="font-family:'Oswald',sans-serif;font-size:32px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:2px;text-shadow:0 2px 12px rgba(${primaryRgb},0.5)">${schoolName}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { width:${dims.width}px; height:${dims.height}px; overflow:hidden; font-family:'Roboto',sans-serif; }
</style></head>
<body>
<div style="width:${dims.width}px;height:${dims.height}px;background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%);display:flex;overflow:hidden;position:relative">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 50%,rgba(${primaryRgb},0.15) 0%,transparent 70%)"></div>
  <div style="width:${Math.round(dims.width*0.42)}px;background:${primary};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;position:relative;z-index:2">
    ${logoSection}
    <div style="margin-top:16px;font-family:'Oswald',sans-serif;font-size:16px;font-weight:500;color:rgba(255,255,255,0.75);text-align:center;letter-spacing:1.5px;text-transform:uppercase;line-height:1.4">${tagline}</div>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 48px;gap:14px;position:relative;z-index:2">
    ${phone ? `<div style="display:flex;align-items:center;gap:12px;font-size:22px;color:#fff;font-weight:600">&#128222; ${phone}</div>` : ''}
    ${email ? `<div style="display:flex;align-items:center;gap:12px;font-size:20px;color:rgba(255,255,255,0.85)">&#9993; ${email}</div>` : ''}
    ${website ? `<div style="display:flex;align-items:center;gap:12px;font-size:20px;color:rgba(255,255,255,0.85)">&#127760; ${website}</div>` : ''}
    ${address ? `<div style="display:flex;align-items:center;gap:12px;font-size:18px;color:rgba(255,255,255,0.7);line-height:1.4">&#128205; ${address}</div>` : ''}
  </div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:5px;background:${primary}"></div>
</div>
</body></html>`;
}

// ── QR code generator ─────────────────────────────────────────────────────────
export async function generateQrCodeDataUrl(url: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch {
    return null;
  }
}

// ── parseFlyerDataFromBrief ───────────────────────────────────────────────────
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
  size: "flyer" | "instagram_post" | "instagram_story" | "facebook_ad" | "website_banner" = "flyer"
): Promise<FlyerData> {
  // Extract program name from prompt
  const promptLower = prompt.toLowerCase();
  let programName = briefAnswers.program || "";

  if (!programName) {
    // Try to detect from prompt
    const programKeywords = [
      "little ninjas", "ninja", "kickboxing", "karate", "taekwondo", "bjj",
      "jiu-jitsu", "jiu jitsu", "boxing", "muay thai", "mma", "wrestling",
      "judo", "self defense", "self-defense", "fitness", "yoga", "dance",
      "adult karate", "kids karate", "kids martial arts",
    ];
    for (const kw of programKeywords) {
      if (promptLower.includes(kw)) {
        programName = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        break;
      }
    }
    if (!programName) programName = "Martial Arts";
  }

  // Audience
  const audience = briefAnswers.audience || (
    promptLower.includes("kid") || promptLower.includes("child") || promptLower.includes("little") || promptLower.includes("ninja")
      ? "Kids Ages 4-12"
      : promptLower.includes("adult") ? "Adults" : "All Ages"
  );

  // Offer / CTA
  const isFreeTrialPrompt = promptLower.includes("free trial") || promptLower.includes("free class");
  const callToAction = briefAnswers.cta || (isFreeTrialPrompt ? "START YOUR FREE 7-DAY TRIAL" : "ENROLL TODAY — LIMITED SPOTS");

  // Benefits tailored to program — title|subtitle format for shield icon display
  const isKids = audience.toLowerCase().includes("kid") || audience.toLowerCase().includes("child") || programName.toLowerCase().includes("ninja") || programName.toLowerCase().includes("little");
  const benefits = isKids ? [
    "Builds Character|Confidence. Respect. Discipline.",
    "Better Listeners|Focus. Attention. Following Directions.",
    "Fun & Engaging|Active. Exciting. Age-Appropriate.",
    isFreeTrialPrompt ? "Free Trial Class|No commitment required." : "Small Class Sizes|Expert instructors, ages 4-12.",
  ] : [
    "Builds Confidence|Strength. Discipline. Focus.",
    "Real Self-Defense|Practical techniques that work.",
    "All Skill Levels|Beginners to advanced welcome.",
    isFreeTrialPrompt ? "Free Trial Class|No commitment required." : "Flexible Schedules|Morning & evening classes.",
  ];

  // Headline
  const headline = isKids
    ? `Unleash Your Child's Inner Warrior`
    : `Transform Your Mind, Body & Spirit`;

  // Generate AI hero image using Forge API
  let heroImageUrl: string | null = null;
  try {
    const { generateImage } = await import("./_core/imageGeneration");
    const isKidsProgram = isKids;
    const programLower = programName.toLowerCase();
    let heroPrompt = "";
    if (isKidsProgram) {
      heroPrompt = `Ultra-realistic cinematic martial arts advertisement photography. A highly energetic young child aged 4-5 wearing a pristine white karate gi uniform performing an explosive aggressive forward punch directly toward the camera with intense determined confident expression. The child is isolated against a dramatic dark cinematic background with deep blacks, glowing red energy aura emanating from behind the subject, floating ember particles, volumetric smoke, subtle floor reflections. Dramatic red rim lighting illuminates the edges of the white uniform creating a powerful silhouette effect. The composition is dynamic with the fist closest to camera in sharp focus. Style: UFC promotional poster meets Call of Duty key art meets Cobra Kai marketing. Hyper-detailed skin texture, crisp facial features, premium commercial photography quality. Shot on RED camera, cinematic color grading, deep shadows, high contrast. The uniform has a small circular logo patch on the chest. No text in image. Vertical portrait orientation. Full body visible from head to feet.`;
    } else if (programLower.includes("kickbox") || programLower.includes("muay")) {
      heroPrompt = `Ultra-realistic cinematic martial arts advertisement photography. A powerful athletic adult wearing boxing gloves and shorts throwing an explosive high kick directly toward the camera with intense fierce expression. Isolated against a dramatic dark background with glowing red energy aura, floating ember particles, volumetric smoke, dramatic red rim lighting. Style: UFC promotional poster meets Call of Duty key art. Premium commercial photography quality, cinematic color grading, deep shadows, high contrast. No text in image. Vertical portrait orientation. Full body visible.`;
    } else if (programLower.includes("bjj") || programLower.includes("jiu")) {
      heroPrompt = `Ultra-realistic cinematic martial arts advertisement photography. A powerful martial artist in a white gi performing a dynamic grappling technique with intense focused expression. Isolated against a dramatic dark background with glowing red energy, floating ember particles, dramatic rim lighting. Style: UFC promotional poster quality. Premium commercial photography, cinematic color grading, high contrast. No text in image. Vertical portrait orientation.`;
    } else {
      heroPrompt = `Ultra-realistic cinematic martial arts advertisement photography. A powerful martial artist in a pristine white karate gi performing an explosive high kick toward the camera with intense fierce expression. Isolated against a dramatic dark background with glowing red energy aura, floating ember particles, volumetric smoke, dramatic red rim lighting creating a powerful silhouette. Style: UFC promotional poster meets Cobra Kai marketing. Premium commercial photography quality, cinematic color grading, deep shadows, high contrast. No text in image. Vertical portrait orientation. Full body visible.`;
    }
    const result = await generateImage({ prompt: heroPrompt });
    if (result.url) {
      heroImageUrl = result.url;
    }
  } catch (err: any) {
    console.warn("[FlyerRenderer] Forge hero image generation failed, falling back to Pexels:", err?.message);
    // Fallback to Pexels
    const heroPhoto = await fetchHeroPhotoAsBase64(programName, "portrait");
    heroImageUrl = heroPhoto?.dataUrl || null;
  }

  // Generate QR code
  const qrUrl = brand.website || "https://example.com";
  const qrCodeDataUrl = await generateQrCodeDataUrl(qrUrl);

  return {
    schoolName: brand.schoolName || "Your Martial Arts School",
    phone: brand.phone || null,
    email: brand.email || null,
    website: brand.website || null,
    address: brand.address || null,
    logoUrl: brand.logoUrl || null,
    primaryColor: brand.primaryColor || "#C8102E",
    secondaryColor: brand.secondaryColor || null,
    programName,
    audience,
    headline,
    benefits,
    callToAction,
    heroImageUrl: heroImageUrl,
    qrCodeDataUrl,
    size,
  };
}

// ── Puppeteer PNG renderer (server-side, used only when available) ─────────────
export async function renderFlyerToPng(html: string, size?: string): Promise<Buffer> {
  const dims = SIZE_DIMS[size || "flyer"] || SIZE_DIMS.flyer;
  let browser: any = null;
  try {
    const chromium = await import("@sparticuz/chromium");
    const puppeteer = await import("puppeteer-core");
    browser = await (puppeteer as any).default.launch({
      args: (chromium as any).default.args,
      defaultViewport: { width: dims.width, height: dims.height },
      executablePath: await (chromium as any).default.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    await page.setViewport({ width: dims.width, height: dims.height });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const screenshot = await page.screenshot({ type: "png", fullPage: false });
    return Buffer.from(screenshot as Uint8Array);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
