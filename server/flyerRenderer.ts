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
  const programNamePx = Math.round((isStory ? 112 : isSquare ? 100 : 108) * baseUnit);
  const taglinePx     = Math.round((isStory ? 34  : isSquare ? 30  : 32 ) * baseUnit);
  const benefitPx     = Math.round((isStory ? 28  : isSquare ? 24  : 25 ) * baseUnit);
  const ctaPx         = Math.round((isStory ? 32  : isSquare ? 27  : 29 ) * baseUnit);
  const contactPx     = Math.round((isStory ? 22  : isSquare ? 18  : 20 ) * baseUnit);
  const logoMaxH      = Math.round((isStory ? 88  : isSquare ? 68  : 72 ) * baseUnit);
  const contentPad    = Math.round(W * 0.055);
  const footerH       = Math.round(H * 0.095);
  const headerH       = Math.round(H * 0.105);

  // Hero image — full bleed background
  const heroStyle = data.heroImageUrl
    ? `background-image: url('${data.heroImageUrl}'); background-size: cover; background-position: center 20%;`
    : `background: linear-gradient(160deg, ${darken(primary, 0.6)} 0%, #0a0a0a 100%);`;

  // Logo or school wordmark
  const logoSection = data.logoUrl
    ? `<img style="max-height:${logoMaxH}px;max-width:${Math.round(W*0.45)}px;object-fit:contain;display:block;filter:drop-shadow(0 2px 12px rgba(${primaryRgb},0.5)) brightness(1.1)" src="${data.logoUrl}" alt="${escapeHtml(data.schoolName)}" />`
    : `<span style="font-family:'Oswald',sans-serif;font-size:${Math.round(logoMaxH*0.55)}px;font-weight:700;color:#fff;letter-spacing:3px;text-transform:uppercase;text-shadow:0 2px 16px rgba(${primaryRgb},0.6)">${escapeHtml(data.schoolName)}</span>`;

  // Program name — each word on its own line for maximum impact
  const programWords = data.programName.toUpperCase().split(' ');
  const programNameHtml = programWords.map((word, i) => {
    const isLastWord = i === programWords.length - 1;
    const color = isLastWord ? primary : '#ffffff';
    const shadow = isLastWord
      ? `0 0 30px rgba(${primaryRgb},1.0), 0 0 60px rgba(${primaryRgb},0.7), 0 0 100px rgba(${primaryRgb},0.4), 4px 4px 0 ${darkPrimary}, 8px 8px 0 rgba(0,0,0,0.5)`
      : `0 0 20px rgba(${primaryRgb},0.5), 4px 4px 0 rgba(0,0,0,0.6), 8px 8px 0 rgba(0,0,0,0.3)`;
    return `<div style="font-family:'Oswald',sans-serif;font-size:${programNamePx}px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:4px;line-height:0.92;text-shadow:${shadow};-webkit-text-stroke:1.5px rgba(${isLastWord ? '255,255,255' : primaryRgb},0.15)">${escapeHtml(word)}</div>`;
  }).join('');

  // Benefit items with circle-check icons
  const checkSvg = `<svg width="${Math.round(benefitPx*1.15)}" height="${Math.round(benefitPx*1.15)}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="11" fill="${primary}" opacity="0.95"/><path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const benefitItems = (data.benefits || [
    "Build confidence, focus &amp; discipline",
    "Develop motor skills &amp; coordination",
    "Fun, safe environment for all ages",
    "FREE 7-Day Trial — no commitment required",
  ]).slice(0, 4).map(b =>
    `<div style="display:flex;align-items:flex-start;gap:${Math.round(benefitPx*0.6)}px;margin-bottom:${Math.round(benefitPx*0.5)}px">
      ${checkSvg}
      <span style="font-family:'Roboto',sans-serif;font-size:${benefitPx}px;font-weight:600;color:rgba(255,255,255,0.93);line-height:1.35;text-shadow:0 1px 8px rgba(0,0,0,0.9)">${escapeHtml(b)}</span>
    </div>`
  ).join('');

  // Contact info
  const contactParts = [
    data.phone   ? `<span style="color:rgba(255,255,255,0.85);font-size:${contactPx}px;font-family:'Roboto',sans-serif">&#128222;&nbsp;${escapeHtml(data.phone)}</span>` : '',
    data.website ? `<span style="color:rgba(255,255,255,0.85);font-size:${contactPx}px;font-family:'Roboto',sans-serif">&#127760;&nbsp;${escapeHtml(data.website)}</span>` : '',
    data.address ? `<span style="color:rgba(255,255,255,0.75);font-size:${Math.round(contactPx*0.9)}px;font-family:'Roboto',sans-serif">&#128205;&nbsp;${escapeHtml(data.address)}</span>` : '',
  ].filter(Boolean).join(`<span style="color:${primary};margin:0 8px;font-weight:700">&middot;</span>`);

  // QR code
  const qrSize = Math.round(H * 0.075);
  const qrHtml = data.qrCodeDataUrl
    ? `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0">
        <img src="${data.qrCodeDataUrl}" alt="QR" style="width:${qrSize}px;height:${qrSize}px;background:#fff;padding:4px;border-radius:6px;display:block" />
        <span style="font-family:'Oswald',sans-serif;font-size:${Math.round(contactPx*0.75)}px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px">Scan to Enroll</span>
       </div>`
    : '';

  const cta = escapeHtml(data.callToAction || "START YOUR FREE 7-DAY TRIAL");
  const tagline = escapeHtml(data.headline || `Unleash Your Child's Inner Warrior`);
  const bandH = Math.round(H * (isStory ? 0.40 : isSquare ? 0.44 : 0.42));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@400;500;600;700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { width:${W}px; height:${H}px; overflow:hidden; background:#080808; }
</style>
</head>
<body>
<div style="width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#080808">

  <!-- FULL-BLEED HERO PHOTO -->
  <div style="position:absolute;inset:0;${heroStyle}z-index:0;filter:contrast(1.15) saturate(1.25) brightness(0.95)"></div>

  <!-- CINEMATIC GRADIENT OVERLAYS -->
  <!-- Heavy dark gradient from bottom so text pops -->
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.10) 25%,rgba(0,0,0,0.75) 58%,rgba(0,0,0,0.97) 100%);z-index:1"></div>
  <!-- Subtle left-side darkening for text readability -->
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,0.35) 0%,rgba(0,0,0,0.05) 50%,rgba(0,0,0,0.0) 100%);z-index:1"></div>
  <!-- Colored glow from bottom-left corner -->
  <div style="position:absolute;bottom:0;left:0;width:${Math.round(W*0.80)}px;height:${Math.round(H*0.60)}px;background:radial-gradient(ellipse at bottom left,rgba(${primaryRgb},0.30) 0%,transparent 60%);z-index:2"></div>

  <!-- HEADER: logo top-left -->
  <div style="position:absolute;top:0;left:0;right:0;height:${headerH}px;background:linear-gradient(180deg,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.0) 100%);display:flex;align-items:center;padding:0 ${contentPad}px;z-index:10">
    ${logoSection}
  </div>

  <!-- DIAGONAL ACCENT BAND (behind text) -->
  <div style="position:absolute;left:0;right:0;bottom:${footerH}px;height:${bandH}px;overflow:hidden;z-index:3">
    <div style="position:absolute;inset:0;background:linear-gradient(135deg,${primary} 0%,${darkPrimary} 100%);clip-path:polygon(0 38%,100% 0%,100% 62%,0 100%);opacity:0.88"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,0.6) 0%,rgba(0,0,0,0.1) 60%,rgba(0,0,0,0.0) 100%);clip-path:polygon(0 38%,100% 0%,100% 62%,0 100%)"></div>
  </div>

  <!-- MAIN CONTENT: anchored to bottom above footer -->
  <div style="position:absolute;left:0;right:0;bottom:${footerH}px;z-index:10;padding:0 ${contentPad}px ${Math.round(H*0.048)}px">

    <!-- PROGRAM NAME: massive, each word on its own line -->
    <div style="margin-bottom:${Math.round(H*0.016)}px;line-height:0.92">
      ${programNameHtml}
    </div>

    <!-- TAGLINE -->
    <div style="font-family:'Roboto',sans-serif;font-size:${taglinePx}px;font-weight:700;color:rgba(255,255,255,0.95);letter-spacing:0.5px;margin-bottom:${Math.round(H*0.022)}px;text-shadow:0 2px 14px rgba(0,0,0,0.95);max-width:${Math.round(W*0.75)}px;line-height:1.3">${tagline}</div>

    <!-- ACCENT DIVIDER -->
    <div style="width:${Math.round(W*0.08)}px;height:4px;background:${primary};border-radius:2px;margin-bottom:${Math.round(H*0.022)}px;box-shadow:0 0 18px rgba(${primaryRgb},0.85)"></div>

    <!-- BENEFITS -->
    <div style="margin-bottom:${Math.round(H*0.026)}px;max-width:${Math.round(W*0.72)}px">
      ${benefitItems}
    </div>

    <!-- CTA BUTTON -->
    <div style="display:inline-block;background:${primary};color:#fff;font-family:'Oswald',sans-serif;font-size:${ctaPx}px;font-weight:700;padding:${Math.round(H*0.016)}px ${Math.round(W*0.055)}px;border-radius:8px;text-transform:uppercase;letter-spacing:3px;box-shadow:0 8px 32px rgba(${primaryRgb},0.7),0 3px 12px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.2);white-space:nowrap">${cta}</div>

  </div>

  <!-- FOOTER BAR -->
  <div style="position:absolute;bottom:0;left:0;right:0;height:${footerH}px;background:rgba(0,0,0,0.96);border-top:3px solid ${primary};display:flex;align-items:center;justify-content:space-between;padding:0 ${contentPad}px;z-index:20;gap:16px">
    <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:0">
      <div style="font-family:'Oswald',sans-serif;font-size:${Math.round(contactPx*1.15)}px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(data.schoolName)}</div>
      <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">${contactParts}</div>
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

  // Benefits tailored to program
  const isKids = audience.toLowerCase().includes("kid") || audience.toLowerCase().includes("child") || programName.toLowerCase().includes("ninja") || programName.toLowerCase().includes("little");
  const benefits = isKids ? [
    "Build confidence, focus & discipline",
    "Develop motor skills & coordination",
    "Fun, safe environment for ages 4-12",
    isFreeTrialPrompt ? "FREE 7-Day Trial — no commitment required" : "Expert instructors, small class sizes",
  ] : [
    "Build strength, confidence & discipline",
    "Learn real self-defense techniques",
    "Expert instructors, all skill levels welcome",
    isFreeTrialPrompt ? "FREE 7-Day Trial — no commitment required" : "Flexible class schedules",
  ];

  // Headline
  const headline = isKids
    ? `Unleash Your Child's Inner Warrior`
    : `Transform Your Mind, Body & Spirit`;

  // Fetch hero photo
  const heroPhoto = await fetchHeroPhotoAsBase64(programName, "portrait");

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
    heroImageUrl: heroPhoto?.dataUrl || null,
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
