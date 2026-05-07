/**
 * Flyer Renderer Service
 *
 * Builds HTML flyer templates for client-side rendering via srcdoc iframe + html2canvas.
 * The server generates the HTML string; the browser renders it and captures a PNG.
 *
 * Design: Full-bleed hero background (AI-generated), text overlaid on top.
 * Matches reference: MyDojo Little Ninjas UFC/Cobra Kai aesthetic.
 */

import https from "https";
import http from "http";
import QRCode from "qrcode";

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

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── MAIN HTML TEMPLATE BUILDER ────────────────────────────────────────────────
export function buildFlyerHtml(data: FlyerData): string {
  if (data.size === 'business_card') return buildBusinessCardHtml(data);
  if (data.size === 'website_banner') return buildBannerHtml(data);

  const primary = data.primaryColor || "#C8102E";
  const primaryRgb = hexToRgb(primary);
  const darkPrimary = darken(primary, 0.3);

  const size = data.size || "flyer";
  const dims = SIZE_DIMS[size] || SIZE_DIMS.flyer;
  const isSquare = size === "instagram_post";
  const isStory = size === "instagram_story";
  const W = dims.width;
  const H = dims.height;

  // Scale factor relative to base flyer (816x1056)
  const scale = H / 1056;

  // ── FONT SIZES (all scale with canvas) ──────────────────────────────────────
  const programNamePx = Math.round(160 * scale * (isStory ? 1.1 : isSquare ? 0.9 : 1.0));
  const subtitlePx    = Math.round(44  * scale);
  const benefitTitlePx = Math.round(28 * scale);
  const benefitSubPx  = Math.round(20 * scale);
  const schoolNamePx  = Math.round(22 * scale);
  const qrLabelPx     = Math.round(26 * scale);
  const qrLabelBigPx  = Math.round(42 * scale);
  const pad           = Math.round(48 * scale);
  const qrSize        = Math.round(160 * scale);
  const iconSize      = Math.round(52 * scale);

  // ── LAYOUT WIDTHS (declared early so ctaBadge can reference leftW) ───────────
  const leftW = Math.round(W * (isStory ? 1.0 : isSquare ? 0.62 : 0.58));

  // ── HERO IMAGE (full-bleed background) ──────────────────────────────────────
  const heroBg = data.heroImageUrl
    ? `background-image:url('${data.heroImageUrl}');background-size:cover;background-position:center top;`
    : `background:linear-gradient(160deg,${darken(primary,0.7)} 0%,#050505 60%,#0a0202 100%);`;

  // ── LOGO / SCHOOL NAME ───────────────────────────────────────────────────────
  const logoHtml = data.logoUrl
    ? `<img src="${data.logoUrl}" alt="${escapeHtml(data.schoolName)}" style="max-height:${Math.round(50*scale)}px;max-width:${Math.round(W*0.5)}px;object-fit:contain;filter:drop-shadow(0 2px 12px rgba(0,0,0,0.9)) brightness(1.1)" />`
    : `<span style="font-family:'Oswald',sans-serif;font-size:${schoolNamePx}px;font-weight:700;color:#fff;letter-spacing:3px;text-transform:uppercase;text-shadow:0 2px 12px rgba(0,0,0,0.9)">${escapeHtml(data.schoolName)}</span>`;

  // ── PROGRAM NAME (massive, metallic, each word on its own line) ──────────────
  const words = data.programName.toUpperCase().split(' ');
  const programNameHtml = words.map((word, i) => {
    const isLast = i === words.length - 1;
    const color = isLast ? primary : '#ffffff';
    // Layered text-shadow creates metallic 3D extrusion effect
    const shadow = isLast
      ? `2px 2px 0 ${darkPrimary},4px 4px 0 ${darken(primary,0.5)},6px 6px 0 rgba(0,0,0,0.6),8px 8px 0 rgba(0,0,0,0.4),0 0 60px rgba(${primaryRgb},1.0),0 0 120px rgba(${primaryRgb},0.5)`
      : `2px 2px 0 #333,4px 4px 0 #222,6px 6px 0 rgba(0,0,0,0.7),8px 8px 0 rgba(0,0,0,0.5),0 0 40px rgba(255,255,255,0.1)`;
    const stroke = isLast ? `2px rgba(255,180,180,0.25)` : `1px rgba(200,200,200,0.15)`;
    return `<div style="font-family:'Oswald',sans-serif;font-size:${programNamePx}px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:-1px;line-height:0.88;text-shadow:${shadow};-webkit-text-stroke:${stroke};display:block">${escapeHtml(word)}</div>`;
  }).join('');

  // ── CTA BADGE ────────────────────────────────────────────────────────────────
  const ctaText = escapeHtml(data.callToAction || 'FREE TRIAL CLASS');
  const ctaBadge = `<div style="display:inline-flex;align-items:center;gap:${Math.round(8*scale)}px;background:rgba(${primaryRgb},0.15);border:2px solid rgba(${primaryRgb},0.7);border-radius:4px;padding:${Math.round(8*scale)}px ${Math.round(18*scale)}px;margin-top:${Math.round(10*scale)}px;margin-bottom:${Math.round(14*scale)}px;white-space:nowrap;max-width:${Math.round(leftW*0.95)}px">
    <div style="flex-shrink:0;width:${Math.round(8*scale)}px;height:${Math.round(8*scale)}px;border-radius:50%;background:${primary};box-shadow:0 0 10px rgba(${primaryRgb},1.0)"></div>
    <span style="font-family:'Oswald',sans-serif;font-size:${Math.round(subtitlePx*0.85)}px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:3px;text-shadow:0 2px 12px rgba(0,0,0,0.9);white-space:nowrap">${ctaText}</span>
  </div>`;

  // ── BENEFITS with shield icons ───────────────────────────────────────────────
  const rawBenefits = data.benefits || [
    "Builds Character|Confidence. Respect. Discipline.",
    "Better Listeners|Focus. Attention. Following Directions.",
    "Fun & Engaging|Active. Exciting. Age-Appropriate.",
    "Ages 3–5|The perfect start for your child.",
  ];
  const parsedBenefits = rawBenefits.slice(0, 4).map(b => {
    const [title, sub] = b.split('|');
    return { title: (title || b).trim(), sub: (sub || '').trim() };
  });

  // Shield icon variants
  const shieldPaths = [
    `<path d="M${iconSize/2} ${iconSize*0.15}l-${iconSize*0.33} ${iconSize*0.15}v${iconSize*0.21}c0 ${iconSize*0.19} ${iconSize*0.13} ${iconSize*0.37} ${iconSize*0.33} ${iconSize*0.42}c${iconSize*0.2}-${iconSize*0.05} ${iconSize*0.33}-${iconSize*0.23} ${iconSize*0.33}-${iconSize*0.42}v-${iconSize*0.21}z" fill="${primary}" opacity="0.9"/><path d="M${iconSize*0.38} ${iconSize*0.5}l${iconSize*0.08} ${iconSize*0.08} ${iconSize*0.17}-${iconSize*0.17}" stroke="white" stroke-width="${Math.round(2.5*scale)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
    `<circle cx="${iconSize/2}" cy="${iconSize*0.38}" r="${iconSize*0.17}" fill="${primary}" opacity="0.9"/><path d="M${iconSize*0.21} ${iconSize*0.75}c0-${iconSize*0.16} ${iconSize*0.13}-${iconSize*0.29} ${iconSize*0.29}-${iconSize*0.29}s${iconSize*0.29} ${iconSize*0.13} ${iconSize*0.29} ${iconSize*0.29}" stroke="${primary}" stroke-width="${Math.round(2.5*scale)}" stroke-linecap="round" fill="none" opacity="0.9"/>`,
    `<circle cx="${iconSize/2}" cy="${iconSize/2}" r="${iconSize*0.25}" stroke="${primary}" stroke-width="${Math.round(2.5*scale)}" fill="none" opacity="0.9"/><circle cx="${iconSize/2}" cy="${iconSize/2}" r="${iconSize*0.08}" fill="${primary}" opacity="0.9"/>`,
    `<path d="M${iconSize*0.25} ${iconSize*0.38}h${iconSize*0.5}M${iconSize*0.25} ${iconSize*0.5}h${iconSize*0.38}M${iconSize*0.25} ${iconSize*0.62}h${iconSize*0.25}" stroke="${primary}" stroke-width="${Math.round(2.5*scale)}" stroke-linecap="round" opacity="0.9"/>`,
  ];

  const benefitItems = parsedBenefits.map((b, i) => `
    <div style="display:flex;align-items:center;gap:${Math.round(16*scale)}px;margin-bottom:${Math.round(18*scale)}px">
      <div style="flex-shrink:0;width:${iconSize}px;height:${iconSize}px;border-radius:50%;background:rgba(${primaryRgb},0.12);border:1.5px solid rgba(${primaryRgb},0.5);display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px rgba(${primaryRgb},0.3)">
        <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 ${iconSize} ${iconSize}" fill="none" xmlns="http://www.w3.org/2000/svg">${shieldPaths[i % shieldPaths.length]}</svg>
      </div>
      <div>
        <div style="font-family:'Oswald',sans-serif;font-size:${benefitTitlePx}px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1.5px;line-height:1.1;text-shadow:0 1px 8px rgba(0,0,0,0.9)">${escapeHtml(b.title)}</div>
        ${b.sub ? `<div style="font-family:'Roboto',sans-serif;font-size:${benefitSubPx}px;font-weight:400;color:rgba(255,255,255,0.6);letter-spacing:0.3px;margin-top:${Math.round(2*scale)}px">${escapeHtml(b.sub)}</div>` : ''}
      </div>
    </div>`).join('');

  // ── QR CODE with SCAN TO START YOUR JOURNEY ──────────────────────────────────
  const qrSection = data.qrCodeDataUrl ? `
    <div style="display:flex;align-items:center;gap:${Math.round(20*scale)}px">
      <div style="background:#fff;padding:${Math.round(8*scale)}px;border-radius:${Math.round(10*scale)}px;box-shadow:0 0 30px rgba(${primaryRgb},0.4),0 4px 20px rgba(0,0,0,0.8);flex-shrink:0">
        <img src="${data.qrCodeDataUrl}" alt="QR" style="width:${qrSize}px;height:${qrSize}px;display:block" />
      </div>
      <div style="display:flex;flex-direction:column;gap:0">
        <div style="font-family:'Oswald',sans-serif;font-size:${qrLabelPx}px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:3px;line-height:1.1;text-shadow:0 2px 10px rgba(0,0,0,0.9)">SCAN TO</div>
        <div style="font-family:'Oswald',sans-serif;font-size:${qrLabelBigPx}px;font-weight:700;color:${primary};text-transform:uppercase;letter-spacing:2px;line-height:1.0;text-shadow:0 0 30px rgba(${primaryRgb},0.9),0 2px 10px rgba(0,0,0,0.9)">START</div>
        <div style="font-family:'Oswald',sans-serif;font-size:${qrLabelPx}px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:3px;line-height:1.1;text-shadow:0 2px 10px rgba(0,0,0,0.9)">YOUR JOURNEY</div>
      </div>
    </div>` : '';

  // ── EMBER PARTICLES ──────────────────────────────────────────────────────────
  const embers = [
    {x:8,y:15,r:3,o:0.7},{x:18,y:7,r:2,o:0.5},{x:28,y:20,r:3.5,o:0.6},
    {x:5,y:35,r:1.8,o:0.45},{x:35,y:10,r:2.5,o:0.65},{x:45,y:28,r:1.5,o:0.5},
    {x:12,y:45,r:2.8,o:0.55},{x:50,y:18,r:2,o:0.4},{x:22,y:55,r:1.5,o:0.35},
    {x:60,y:8,r:2.2,o:0.5},{x:70,y:35,r:1.8,o:0.45},{x:80,y:15,r:2.5,o:0.55},
    {x:88,y:45,r:1.5,o:0.4},{x:92,y:22,r:2,o:0.5},{x:75,y:55,r:1.2,o:0.35},
  ].map(e=>`<circle cx="${e.x}" cy="${e.y}" r="${e.r}" fill="rgba(${primaryRgb},${e.o})"/>`).join('');
  const emberSvg = `<svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5" viewBox="0 0 100 65" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">${embers}</svg>`;

  // ── LEFT EDGE GLOW LINE ──────────────────────────────────────────────────────
  const glowLine = `<div style="position:absolute;left:0;top:${Math.round(H*0.12)}px;width:${Math.round(4*scale)}px;height:${Math.round(H*0.76)}px;background:linear-gradient(180deg,transparent 0%,${primary} 15%,${primary} 85%,transparent 100%);box-shadow:0 0 24px 6px rgba(${primaryRgb},0.8);z-index:20"></div>`;

  // ── HEADER ───────────────────────────────────────────────────────────────────
  const headerH = Math.round(80 * scale);
  const headerHtml = `
    <div style="position:absolute;top:0;left:0;right:0;height:${headerH}px;display:flex;align-items:center;padding:0 ${pad}px;z-index:30;background:linear-gradient(180deg,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.0) 100%)">
      ${logoHtml}
    </div>`;

  // ── MAIN CONTENT (left half overlay) ─────────────────────────────────────────────────────
  const mainContent = `
    <div style="position:absolute;top:${headerH}px;left:0;width:${leftW}px;bottom:0;z-index:20;padding:${Math.round(20*scale)}px ${pad}px ${Math.round(36*scale)}px;display:flex;flex-direction:column;justify-content:space-between">
      <div>
        <!-- PROGRAM NAME -->
        <div style="margin-bottom:0">${programNameHtml}</div>
        <!-- CTA BADGE -->
        ${ctaBadge}
        <!-- RED ACCENT LINE -->
        <div style="display:flex;align-items:center;gap:${Math.round(10*scale)}px;margin-bottom:${Math.round(22*scale)}px">
          <div style="width:${Math.round(60*scale)}px;height:${Math.round(2.5*scale)}px;background:linear-gradient(90deg,${primary},transparent);box-shadow:0 0 16px rgba(${primaryRgb},0.9)"></div>
          <div style="width:${Math.round(8*scale)}px;height:${Math.round(8*scale)}px;border-radius:50%;background:${primary};box-shadow:0 0 12px rgba(${primaryRgb},1.0)"></div>
        </div>
        <!-- BENEFITS -->
        <div>${benefitItems}</div>
      </div>
      <!-- QR CODE -->
      <div>${qrSection}</div>
    </div>`;

  // ── LEFT PANEL DARK OVERLAY (so text is readable over hero image) ─────────────
  const leftOverlay = `<div style="position:absolute;top:0;left:0;width:${Math.round(leftW * 1.15)}px;height:${H}px;background:linear-gradient(90deg,rgba(3,3,3,0.97) 0%,rgba(3,3,3,0.93) 50%,rgba(3,3,3,0.7) 72%,rgba(3,3,3,0.0) 100%);z-index:10"></div>`;

  // ── BOTTOM DARK FADE ─────────────────────────────────────────────────────────
  const bottomFade = `<div style="position:absolute;bottom:0;left:0;right:0;height:${Math.round(H*0.15)}px;background:linear-gradient(180deg,transparent 0%,rgba(0,0,0,0.6) 100%);z-index:8"></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { width:${W}px; height:${H}px; overflow:hidden; background:#030303; }
</style>
</head>
<body>
<div style="width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#030303">

  <!-- HERO IMAGE — full bleed background -->
  <div style="position:absolute;inset:0;${heroBg}background-size:cover;background-position:center top;z-index:1;filter:contrast(1.1) saturate(1.2)"></div>

  <!-- DARK VIGNETTE over hero -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 70% 40%,transparent 30%,rgba(0,0,0,0.4) 70%);z-index:2"></div>

  <!-- LEFT PANEL DARK OVERLAY -->
  ${leftOverlay}

  <!-- BOTTOM FADE -->
  ${bottomFade}

  <!-- EMBER PARTICLES -->
  ${emberSvg}

  <!-- LEFT EDGE GLOW LINE -->
  ${glowLine}

  <!-- HEADER -->
  ${headerHtml}

  <!-- MAIN CONTENT -->
  ${mainContent}

</div>
</body>
</html>`;
}

// ── Website banner layout ─────────────────────────────────────────────────────
function buildBannerHtml(data: FlyerData): string {
  const primary = data.primaryColor || "#C8102E";
  const primaryRgb = hexToRgb(primary);
  const dims = SIZE_DIMS.website_banner;

  const headline = escapeHtml(data.headline || `Join Our ${data.programName} Program!`);
  const cta = escapeHtml(data.callToAction || "Start Your FREE 7-Day Trial!");
  const benefits = (data.benefits || []).slice(0, 3).map(b => b.split('|')[0].trim());
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

// ── Business card layout ──────────────────────────────────────────────────────
function buildBusinessCardHtml(data: FlyerData): string {
  const primary = data.primaryColor || "#C8102E";
  const primaryRgb = hexToRgb(primary);
  const dims = SIZE_DIMS.business_card;
  const W = dims.width;
  const H = dims.height;

  const heroStyle = data.heroImageUrl
    ? `background-image:url('${data.heroImageUrl}');background-size:cover;background-position:center;`
    : `background:linear-gradient(135deg,${darken(primary,0.5)} 0%,#111 100%);`;

  const logoHtml = data.logoUrl
    ? `<img src="${data.logoUrl}" alt="${escapeHtml(data.schoolName)}" style="max-height:52px;max-width:200px;object-fit:contain;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5))" />`
    : `<div style="font-family:'Oswald',sans-serif;font-size:28px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:2px;text-shadow:0 2px 8px rgba(0,0,0,0.7)">${escapeHtml(data.schoolName)}</div>`;

  const contactLines = [
    data.phone ? `📞 ${data.phone}` : '',
    data.email ? `✉ ${data.email}` : '',
    data.website ? `🌐 ${data.website}` : '',
    data.address ? `📍 ${data.address}` : '',
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Roboto:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { width:${W}px; height:${H}px; overflow:hidden; background:#0a0a0a; }
</style></head>
<body>
<div style="width:${W}px;height:${H}px;position:relative;overflow:hidden">
  <div style="position:absolute;inset:0;${heroStyle}"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.6) 60%,rgba(0,0,0,0.3) 100%)"></div>
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:44px 56px;z-index:10">
    <div>${logoHtml}</div>
    <div>
      <div style="font-family:'Oswald',sans-serif;font-size:22px;font-weight:600;color:${primary};text-transform:uppercase;letter-spacing:3px;margin-bottom:12px">${escapeHtml(data.programName)}</div>
      ${contactLines.map(l => `<div style="font-family:'Roboto',sans-serif;font-size:16px;color:rgba(255,255,255,0.8);margin-bottom:6px">${escapeHtml(l)}</div>`).join('')}
    </div>
  </div>
  <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${primary};box-shadow:0 0 20px rgba(${primaryRgb},0.8)"></div>
</div>
</body></html>`;
}

// ── Pexels stock photo fetcher (fallback when Forge AI unavailable) ────────────
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

// ── parseFlyerDataFromBrief ───────────────────────────────────────────────────
// Parses a natural language brief into structured FlyerData.
// Uses Forge AI to generate the hero image.
export async function parseFlyerDataFromBrief(
  brief: string,
  brandData: {
    schoolName?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    tagline?: string;
  },
  overrides?: Partial<FlyerData>
): Promise<FlyerData> {
  // Extract program name from brief
  const programMatch = brief.match(/for\s+([A-Za-z\s&-]+?)(?:\s+program|\s+class|\s+flyer|\s+ad|$)/i);
  const programName = overrides?.programName || programMatch?.[1]?.trim() || "Martial Arts";

  // Extract size from brief
  let size: FlyerData['size'] = 'flyer';
  if (/instagram story/i.test(brief)) size = 'instagram_story';
  else if (/instagram/i.test(brief)) size = 'instagram_post';
  else if (/facebook/i.test(brief)) size = 'facebook_ad';
  else if (/banner/i.test(brief)) size = 'website_banner';
  else if (/business card/i.test(brief)) size = 'business_card';

  // Extract offer/price from brief
  const priceMatch = brief.match(/\$?([\d.]+)\s*(?:for\s+(\d+)\s+class(?:es)?)?/i);
  const price = priceMatch?.[1];
  const classCount = priceMatch?.[2];
  const offer = price
    ? `$${price}${classCount ? ` for ${classCount} classes` : ''}`
    : null;

  // Extract age from brief
  const ageMatch = brief.match(/age[sd]?\s*([\d-]+(?:\s*(?:to|-)\s*[\d]+)?)/i);
  const audience = ageMatch?.[1] ? `Ages ${ageMatch[1]}` : null;

  // Determine benefits based on program
  const lowerProgram = programName.toLowerCase();
  let benefits: string[];
  if (lowerProgram.includes('ninja') || lowerProgram.includes('little') || lowerProgram.includes('kid')) {
    benefits = [
      "Builds Character|Confidence. Respect. Discipline.",
      "Better Listeners|Focus. Attention. Following Directions.",
      "Fun & Engaging|Active. Exciting. Age-Appropriate.",
      "Ages 3–5|The perfect start for your child.",
    ];
  } else if (lowerProgram.includes('kickbox')) {
    benefits = [
      "Total Body Workout|Burn calories, build strength.",
      "Self Defense Skills|Real-world techniques that work.",
      "Stress Relief|Punch away the day's tension.",
      "All Fitness Levels|Beginner to advanced welcome.",
    ];
  } else if (lowerProgram.includes('bjj') || lowerProgram.includes('jiu')) {
    benefits = [
      "Ground Defense|Master takedowns & submissions.",
      "Mental Toughness|Problem-solving under pressure.",
      "Full Body Strength|Functional fitness every class.",
      "All Ages Welcome|Kids, teens & adults.",
    ];
  } else {
    benefits = [
      "Builds Confidence|Mental & physical strength.",
      "Self Defense|Real-world protection skills.",
      "Get Fit|Full body workout every class.",
      "All Ages Welcome|Beginner friendly.",
    ];
  }

  // Generate hero image via Forge AI
  let heroImageUrl: string | null = null;
  try {
    const { generateImage } = await import("./_core/imageGeneration");
    const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
    const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;

    if (forgeApiKey && forgeApiUrl) {
      // Build a program-specific hero image prompt
      const heroPrompt = buildHeroImagePrompt(programName, lowerProgram, brandData.primaryColor || "#C8102E");
      const imageResult = await generateImage({
        prompt: heroPrompt,
        width: size === 'instagram_story' ? 1080 : 816,
        height: size === 'instagram_story' ? 1920 : 1056,
        apiKey: forgeApiKey,
        apiUrl: forgeApiUrl,
      });
      if (imageResult?.url) {
        heroImageUrl = imageResult.url;
      } else if (imageResult?.base64) {
        heroImageUrl = `data:image/png;base64,${imageResult.base64}`;
      }
      console.log("[FlyerRenderer] Forge AI hero image generated successfully");
    }
  } catch (err: any) {
    console.warn("[FlyerRenderer] Forge AI hero generation failed, falling back to Pexels:", err?.message);
    // Fallback to Pexels
    const pexelsResult = await fetchHeroPhotoAsBase64(programName);
    if (pexelsResult) {
      heroImageUrl = pexelsResult.dataUrl;
    }
  }

  // Generate QR code
  let qrCodeDataUrl: string | null = null;
  try {
    const qrTarget = brandData.website || brandData.phone || `https://mydojo.com`;
    qrCodeDataUrl = await QRCode.toDataURL(qrTarget, {
      width: 200,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch (err: any) {
    console.warn("[FlyerRenderer] QR code generation failed:", err?.message);
  }

  return {
    schoolName: brandData.schoolName || "My Dojo",
    logoUrl: brandData.logoUrl || null,
    primaryColor: brandData.primaryColor || "#C8102E",
    secondaryColor: brandData.secondaryColor || null,
    phone: brandData.phone || null,
    email: brandData.email || null,
    website: brandData.website || null,
    address: brandData.address || null,
    tagline: brandData.tagline || null,
    programName,
    audience,
    headline: offer ? `${offer} — Limited Spots` : `Unleash Your Child's Inner Warrior`,
    subheadline: null,
    benefits,
    callToAction: offer ? `Enroll Today — Limited Spots` : `FREE TRIAL CLASS`,
    offer,
    size,
    heroImageUrl,
    qrCodeDataUrl,
    ...overrides,
  };
}

// ── Hero image prompt builder ─────────────────────────────────────────────────
function buildHeroImagePrompt(programName: string, lowerProgram: string, primaryColor: string): string {
  const isKids = lowerProgram.includes('ninja') || lowerProgram.includes('little') || lowerProgram.includes('kid') || lowerProgram.includes('junior');
  const isKickboxing = lowerProgram.includes('kickbox');
  const isBJJ = lowerProgram.includes('bjj') || lowerProgram.includes('jiu');
  const isBoxing = lowerProgram.includes('boxing') && !isKickboxing;

  if (isKids) {
    return `Hyper-realistic cinematic photograph of a highly energetic young child aged 4-5 years old in a pristine white karate gi uniform with a white belt, performing an aggressive powerful forward punch directly toward the camera with intense determined expression, mouth slightly open showing excitement and confidence. The child is positioned on the RIGHT side of the frame, slightly off-center, with their punching fist closest to camera creating dramatic perspective. Dark cinematic background with deep red and orange glowing energy, floating ember particles, volumetric smoke, dramatic red rim lighting from behind creating a halo effect around the child. The floor has subtle reflections. Style: UFC promotional poster meets Call of Duty key art meets Cobra Kai marketing. Unreal Engine quality lighting. Hyper-detailed skin texture, crisp facial features. Sharp subject isolation with bokeh background. High contrast, deep blacks, glowing red accents. Commercial print quality. The right half of the image should be slightly darker/more atmospheric to allow text overlay on the left. No text in image. Vertical portrait orientation.`;
  } else if (isKickboxing) {
    return `Hyper-realistic cinematic photograph of a powerful athletic adult in kickboxing gear — black shorts, red gloves, no shirt (male) or sports top (female) — executing a devastating high roundhouse kick with explosive energy. Positioned on the RIGHT side of the frame. Dark cinematic background with red energy glow, ember particles, volumetric smoke, dramatic rim lighting. UFC fight poster aesthetic. Unreal Engine quality lighting. High contrast, deep blacks, glowing red accents. Commercial print quality. No text in image. Vertical portrait orientation.`;
  } else if (isBJJ) {
    return `Hyper-realistic cinematic photograph of a BJJ practitioner in a white gi performing a dominant ground control position or standing ready in fighting stance, intense focused expression. Positioned on the RIGHT side of the frame. Dark cinematic dojo background with subtle blue-red energy lighting, dramatic rim lighting. Premium sports advertisement aesthetic. High contrast, deep blacks. Commercial print quality. No text in image. Vertical portrait orientation.`;
  } else {
    return `Hyper-realistic cinematic photograph of a martial artist in a clean white karate gi performing a powerful dynamic kick or punch toward the camera with intense determined expression. Positioned on the RIGHT side of the frame. Dark cinematic background with deep red glowing energy, floating ember particles, volumetric smoke, dramatic red rim lighting. UFC promotional poster aesthetic. Unreal Engine quality lighting. High contrast, deep blacks, glowing red accents. Commercial print quality. No text in image. Vertical portrait orientation.`;
  }
}

// ── Puppeteer-based PNG renderer (server-side, used as fallback) ──────────────
let _browserInstance: any = null;

async function getBrowser(): Promise<any> {
  if (_browserInstance) return _browserInstance;
  try {
    const chromium = await import("@sparticuz/chromium");
    const puppeteer = await import("puppeteer-core");
    const executablePath = await (chromium as any).default.executablePath();
    _browserInstance = await (puppeteer as any).default.launch({
      args: (chromium as any).default.args,
      defaultViewport: (chromium as any).default.defaultViewport,
      executablePath,
      headless: true,
    });
    return _browserInstance;
  } catch (err: any) {
    throw new Error(`Failed to launch browser: ${err?.message}`);
  }
}

export async function renderFlyerToPng(html: string, width: number, height: number): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForTimeout(1500);
    const screenshot = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width, height } });
    return screenshot as Buffer;
  } finally {
    await page.close();
  }
}
