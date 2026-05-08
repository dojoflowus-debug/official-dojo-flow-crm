/**
 * Flyer Renderer Service
 *
 * Builds HTML flyer templates for client-side rendering via srcdoc iframe + html2canvas.
 * The server generates the HTML string; the browser renders it and captures a PNG.
 *
 * Design: FULL-BLEED hero image fills entire canvas.
 * Logo is large at top center. Program name has massive 3D metallic letters.
 * Text overlays the naturally dark left/bottom portion of the image.
 * Reference: MyDojo Little Ninjas poster aesthetic.
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
function darken(hex: string, amount = 0.4): string {
  const clean = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(clean.substring(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(clean.substring(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(clean.substring(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
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
  const darkPrimary = darken(primary, 0.25);
  const deepPrimary = darken(primary, 0.55);

  const size = data.size || "flyer";
  const dims = SIZE_DIMS[size] || SIZE_DIMS.flyer;
  const isSquare = size === "instagram_post";
  const isStory = size === "instagram_story";
  const W = dims.width;
  const H = dims.height;

  // Scale factor relative to base flyer (816x1056)
  const scale = H / 1056;

  // ── FONT SIZES ───────────────────────────────────────────────────────────────
  const programNamePx  = Math.round(155 * scale * (isStory ? 1.0 : isSquare ? 0.82 : 1.0));
  const ctaTextPx      = Math.round(64  * scale * (isStory ? 1.0 : isSquare ? 0.85 : 1.0));
  const benefitTitlePx = Math.round(28  * scale);
  const benefitSubPx   = Math.round(19  * scale);
  const qrLabelSmPx    = Math.round(26  * scale);
  const qrLabelLgPx    = Math.round(52  * scale);
  const pad            = Math.round(44  * scale);
  const qrSize         = Math.round(155 * scale);
  const iconSize       = Math.round(48  * scale);

  // ── HERO IMAGE (full-bleed background) ──────────────────────────────────────
  const heroBg = data.heroImageUrl
    ? `background-image:url('${data.heroImageUrl}');background-size:cover;background-position:center top;`
    : `background:radial-gradient(ellipse at 65% 35%,${darken(primary,0.3)} 0%,${darken(primary,0.6)} 35%,#050505 75%);`;

  // ── LOGO at TOP LEFT — large and prominent, with school name next to it ────────
  // Logo + school name row at top-left, matching reference design
  const logoH = Math.round(100 * scale);  // Much larger — reference shows logo ~100px
  const logoNameFontPx = Math.round(38 * scale);  // Large school name text
  const logoHtml = data.logoUrl
    ? `<div style="display:flex;align-items:center;gap:${Math.round(14*scale)}px">
        <img src="${data.logoUrl}" alt="${escapeHtml(data.schoolName)}"
             style="height:${logoH}px;max-width:${Math.round(logoH*1.6)}px;object-fit:contain;
                    filter:drop-shadow(0 2px 20px rgba(0,0,0,0.95)) drop-shadow(0 0 16px rgba(0,0,0,0.9)) brightness(1.15)" />
        <span style="font-family:'Oswald',sans-serif;font-size:${logoNameFontPx}px;font-weight:700;
                     color:#fff;letter-spacing:2px;text-transform:uppercase;line-height:1.1;
                     text-shadow:0 2px 16px rgba(0,0,0,0.95),0 0 12px rgba(0,0,0,0.9)">${escapeHtml(data.schoolName)}</span>
      </div>`
    : `<div style="display:inline-flex;align-items:center;gap:${Math.round(14*scale)}px">
        <div style="width:${Math.round(logoH*0.85)}px;height:${Math.round(logoH*0.85)}px;border-radius:50%;
                    background:${primary};display:flex;align-items:center;justify-content:center;
                    box-shadow:0 0 30px rgba(${primaryRgb},0.9),0 2px 16px rgba(0,0,0,0.95);flex-shrink:0">
          <svg width="${Math.round(logoH*0.5)}" height="${Math.round(logoH*0.5)}" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" fill="white" opacity="0.95"/>
          </svg>
        </div>
        <span style="font-family:'Oswald',sans-serif;font-size:${logoNameFontPx}px;font-weight:700;
                     color:#fff;letter-spacing:2px;text-transform:uppercase;line-height:1.1;
                     text-shadow:0 2px 16px rgba(0,0,0,0.95),0 0 12px rgba(0,0,0,0.9)">${escapeHtml(data.schoolName)}</span>
      </div>`;

  // ── PROGRAM NAME — massive 3D metallic letters ────────────────────────────────
  // Each word on its own line, same size, metallic silver/white with red glow border
  const words = data.programName.toUpperCase().split(' ');
  const wordCount = words.length;
  // Scale down for 3+ word programs
  const nameFontPx = wordCount >= 3
    ? Math.round(programNamePx * 0.72)
    : wordCount === 2
    ? programNamePx
    : Math.round(programNamePx * 1.1);

  // 3D metallic text-shadow: thick extrusion + red glow (matching reference's chunky beveled letters)
  const metalShadow = [
    // Thick downward extrusion for 3D depth
    `1px 2px 0 ${darkPrimary}`,
    `2px 4px 0 ${darkPrimary}`,
    `3px 6px 0 ${deepPrimary}`,
    `4px 8px 0 ${deepPrimary}`,
    `5px 10px 0 rgba(0,0,0,0.85)`,
    `6px 12px 0 rgba(0,0,0,0.7)`,
    `7px 14px 0 rgba(0,0,0,0.55)`,
    `8px 16px 0 rgba(0,0,0,0.4)`,
    `9px 18px 0 rgba(0,0,0,0.25)`,
    // Outer glow
    `0 0 30px rgba(${primaryRgb},1.0)`,
    `0 0 60px rgba(${primaryRgb},0.7)`,
    `0 0 100px rgba(${primaryRgb},0.4)`,
    `0 0 160px rgba(${primaryRgb},0.2)`,
  ].join(',');

  const programNameHtml = words.map(word =>
    `<div style="font-family:'Oswald',sans-serif;font-size:${nameFontPx}px;font-weight:700;
                 color:#f8f8f8;text-transform:uppercase;letter-spacing:3px;line-height:0.88;
                 text-shadow:${metalShadow};
                 -webkit-text-stroke:3px rgba(${primaryRgb},0.85);
                 display:block;white-space:nowrap;padding-bottom:${Math.round(4*scale)}px">${escapeHtml(word)}</div>`
  ).join('');

  // ── CTA TEXT — large, bold, below program name ────────────────────────────────
  const ctaText = data.callToAction || 'FREE TRIAL CLASS';
  // Split into two lines if it contains spaces
  const ctaParts = ctaText.toUpperCase().split(/\s+/);
  // Group into 2 lines: first half and second half
  const midpoint = Math.ceil(ctaParts.length / 2);
  const ctaLine1 = ctaParts.slice(0, midpoint).join(' ');
  const ctaLine2 = ctaParts.slice(midpoint).join(' ');
  const ctaShadow = `2px 2px 0 rgba(0,0,0,0.8),4px 4px 0 rgba(0,0,0,0.6),0 0 30px rgba(0,0,0,0.9)`;
  // Scale down CTA font if the text is long (offer text can be verbose)
  const ctaCharCount = Math.max(ctaLine1.length, ctaLine2.length);
  const ctaFontPx = ctaCharCount > 18
    ? Math.round(ctaTextPx * 0.62)  // Very long offer text
    : ctaCharCount > 12
    ? Math.round(ctaTextPx * 0.78)  // Medium offer text
    : ctaTextPx;                     // Short CTA like 'FREE TRIAL CLASS'
  const ctaHtml = ctaLine2
    ? `<div style="font-family:'Oswald',sans-serif;font-size:${ctaFontPx}px;font-weight:700;
                   color:#ffffff;text-transform:uppercase;letter-spacing:3px;line-height:0.95;
                   text-shadow:${ctaShadow};-webkit-text-stroke:1px rgba(255,255,255,0.15);
                   display:block">${escapeHtml(ctaLine1)}</div>
       <div style="font-family:'Oswald',sans-serif;font-size:${ctaFontPx}px;font-weight:700;
                   color:#ffffff;text-transform:uppercase;letter-spacing:3px;line-height:0.95;
                   text-shadow:${ctaShadow};-webkit-text-stroke:1px rgba(255,255,255,0.15);
                   display:block">${escapeHtml(ctaLine2)}</div>`
    : `<div style="font-family:'Oswald',sans-serif;font-size:${ctaFontPx}px;font-weight:700;
                   color:#ffffff;text-transform:uppercase;letter-spacing:3px;line-height:0.95;
                   text-shadow:${ctaShadow};display:block">${escapeHtml(ctaLine1)}</div>`;

  // ── BENEFITS with circular dark-red icons ────────────────────────────────────
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

  // Circular icons matching the reference (shield, headphones, smiley, person)
  const iconPaths = [
    // Shield with checkmark
    `<path d="M${iconSize*0.5} ${iconSize*0.18}l-${iconSize*0.3} ${iconSize*0.14}v${iconSize*0.19}c0 ${iconSize*0.17} ${iconSize*0.12} ${iconSize*0.33} ${iconSize*0.3} ${iconSize*0.38}c${iconSize*0.18}-${iconSize*0.05} ${iconSize*0.3}-${iconSize*0.21} ${iconSize*0.3}-${iconSize*0.38}v-${iconSize*0.19}z" fill="white" opacity="0.9"/><path d="M${iconSize*0.37} ${iconSize*0.52}l${iconSize*0.07} ${iconSize*0.07} ${iconSize*0.15}-${iconSize*0.15}" stroke="${primary}" stroke-width="${Math.round(2*scale)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
    // Headphones
    `<path d="M${iconSize*0.25} ${iconSize*0.5}v-${iconSize*0.08}a${iconSize*0.25} ${iconSize*0.25} 0 0 1 ${iconSize*0.5} 0v${iconSize*0.08}" stroke="white" stroke-width="${Math.round(2*scale)}" fill="none" opacity="0.9"/><rect x="${iconSize*0.2}" y="${iconSize*0.5}" width="${iconSize*0.1}" height="${iconSize*0.16}" rx="${iconSize*0.03}" fill="white" opacity="0.9"/><rect x="${iconSize*0.7}" y="${iconSize*0.5}" width="${iconSize*0.1}" height="${iconSize*0.16}" rx="${iconSize*0.03}" fill="white" opacity="0.9"/>`,
    // Smiley face
    `<circle cx="${iconSize*0.5}" cy="${iconSize*0.5}" r="${iconSize*0.27}" stroke="white" stroke-width="${Math.round(2*scale)}" fill="none" opacity="0.9"/><circle cx="${iconSize*0.38}" cy="${iconSize*0.44}" r="${iconSize*0.04}" fill="white" opacity="0.9"/><circle cx="${iconSize*0.62}" cy="${iconSize*0.44}" r="${iconSize*0.04}" fill="white" opacity="0.9"/><path d="M${iconSize*0.37} ${iconSize*0.57}q${iconSize*0.13} ${iconSize*0.1} ${iconSize*0.26} 0" stroke="white" stroke-width="${Math.round(2*scale)}" stroke-linecap="round" fill="none" opacity="0.9"/>`,
    // Person/user
    `<circle cx="${iconSize*0.5}" cy="${iconSize*0.35}" r="${iconSize*0.16}" fill="white" opacity="0.9"/><path d="M${iconSize*0.22} ${iconSize*0.75}c0-${iconSize*0.15} ${iconSize*0.13}-${iconSize*0.27} ${iconSize*0.28}-${iconSize*0.27}h${iconSize*0.2}c${iconSize*0.15} 0 ${iconSize*0.28} ${iconSize*0.12} ${iconSize*0.28} ${iconSize*0.27}" fill="white" opacity="0.9"/>`,
  ];

  const benefitItems = parsedBenefits.map((b, i) => `
    <div style="display:flex;align-items:center;gap:${Math.round(14*scale)}px;margin-bottom:${Math.round(16*scale)}px">
      <div style="flex-shrink:0;width:${iconSize}px;height:${iconSize}px;border-radius:50%;
                  background:rgba(${primaryRgb},0.85);border:2px solid rgba(${primaryRgb},0.4);
                  display:flex;align-items:center;justify-content:center;
                  box-shadow:0 2px 12px rgba(0,0,0,0.7),0 0 16px rgba(${primaryRgb},0.4)">
        <svg width="${Math.round(iconSize*0.7)}" height="${Math.round(iconSize*0.7)}"
             viewBox="0 0 ${iconSize} ${iconSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${iconPaths[i % iconPaths.length]}
        </svg>
      </div>
      <div>
        <div style="font-family:'Oswald',sans-serif;font-size:${benefitTitlePx}px;font-weight:700;
                    color:#fff;text-transform:uppercase;letter-spacing:1.5px;line-height:1.1;
                    text-shadow:0 1px 8px rgba(0,0,0,0.95),0 2px 16px rgba(0,0,0,0.8)">${escapeHtml(b.title)}</div>
        ${b.sub ? `<div style="font-family:'Roboto',sans-serif;font-size:${benefitSubPx}px;font-weight:400;
                               color:rgba(255,255,255,0.65);letter-spacing:0.3px;
                               margin-top:${Math.round(1*scale)}px;
                               text-shadow:0 1px 6px rgba(0,0,0,0.9)">${escapeHtml(b.sub)}</div>` : ''}
      </div>
    </div>`).join('');

  // ── QR CODE — large, bottom left, matching reference ─────────────────────────
  const qrSection = data.qrCodeDataUrl ? `
    <div style="display:flex;align-items:flex-end;gap:${Math.round(20*scale)}px">
      <div style="background:#fff;padding:${Math.round(8*scale)}px;border-radius:${Math.round(8*scale)}px;
                  box-shadow:0 0 30px rgba(0,0,0,0.8),0 4px 20px rgba(0,0,0,0.9);flex-shrink:0;
                  position:relative">
        <img src="${data.qrCodeDataUrl}" alt="QR" style="width:${qrSize}px;height:${qrSize}px;display:block" />
      </div>
      <div style="display:flex;flex-direction:column;gap:${Math.round(0*scale)}px;padding-bottom:${Math.round(6*scale)}px">
        <div style="font-family:'Oswald',sans-serif;font-size:${qrLabelSmPx}px;font-weight:600;
                    color:#fff;text-transform:uppercase;letter-spacing:3px;line-height:1.2;
                    text-shadow:0 2px 10px rgba(0,0,0,0.95)">SCAN TO</div>
        <div style="font-family:'Oswald',sans-serif;font-size:${qrLabelLgPx}px;font-weight:700;
                    color:${primary};text-transform:uppercase;letter-spacing:1px;line-height:0.95;
                    text-shadow:0 0 30px rgba(${primaryRgb},0.9),0 2px 10px rgba(0,0,0,0.95)">START</div>
        <div style="font-family:'Oswald',sans-serif;font-size:${Math.round(qrLabelLgPx*0.82)}px;font-weight:700;
                    color:#fff;text-transform:uppercase;letter-spacing:1px;line-height:1.0;
                    text-shadow:0 2px 10px rgba(0,0,0,0.95)">YOUR JOURNEY</div>
      </div>
    </div>` : '';

  // ── DARK GRADIENT OVERLAY — creates readable text area on left/bottom ─────────
  // This is the key: the hero image shows through on the right/top
  // but the left and bottom are darkened for text readability
  const darkOverlay = `
    <!-- Left-side dark gradient for text readability -->
    <div style="position:absolute;inset:0;
                background:linear-gradient(105deg,
                  rgba(0,0,0,0.88) 0%,
                  rgba(0,0,0,0.82) 18%,
                  rgba(0,0,0,0.65) 32%,
                  rgba(0,0,0,0.25) 52%,
                  rgba(0,0,0,0.0) 70%);
                z-index:2"></div>
    <!-- Bottom dark gradient for QR area -->
    <div style="position:absolute;bottom:0;left:0;right:0;
                height:${Math.round(H*0.35)}px;
                background:linear-gradient(180deg,transparent 0%,rgba(0,0,0,0.75) 60%,rgba(0,0,0,0.88) 100%);
                z-index:2"></div>
    <!-- Top dark gradient for logo area -->
    <div style="position:absolute;top:0;left:0;right:0;
                height:${Math.round(H*0.18)}px;
                background:linear-gradient(180deg,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.4) 60%,transparent 100%);
                z-index:2"></div>`;

  // ── EMBER PARTICLES (subtle, on top of everything) ────────────────────────────
  const embers = [
    {x:5,y:12,r:2.5,o:0.6},{x:15,y:5,r:1.8,o:0.45},{x:25,y:18,r:3,o:0.55},
    {x:3,y:30,r:1.5,o:0.4},{x:32,y:8,r:2,o:0.5},{x:42,y:25,r:1.2,o:0.45},
    {x:10,y:42,r:2.2,o:0.5},{x:48,y:15,r:1.8,o:0.35},{x:20,y:52,r:1.2,o:0.3},
    {x:55,y:6,r:2,o:0.45},{x:65,y:30,r:1.5,o:0.4},{x:78,y:12,r:2.2,o:0.5},
    {x:85,y:42,r:1.2,o:0.35},{x:90,y:20,r:1.8,o:0.45},{x:72,y:50,r:1,o:0.3},
  ].map(e=>`<circle cx="${e.x}" cy="${e.y}" r="${e.r}" fill="rgba(${primaryRgb},${e.o})"/>`).join('');
  const emberSvg = `<svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4"
                        viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="xMidYMid slice">${embers}</svg>`;

  // ── LEFT EDGE GLOW LINE ──────────────────────────────────────────────────────
  const glowLine = `<div style="position:absolute;left:0;top:${Math.round(H*0.1)}px;
                                width:${Math.round(4*scale)}px;height:${Math.round(H*0.8)}px;
                                background:linear-gradient(180deg,transparent 0%,${primary} 10%,${primary} 90%,transparent 100%);
                                box-shadow:0 0 20px 5px rgba(${primaryRgb},0.7);z-index:20"></div>`;

  // ── LOGO HEADER (top left) ───────────────────────────────────────────────────
  const headerH = Math.round(120 * scale);  // Taller header to accommodate larger logo
  const headerHtml = `
    <div style="position:absolute;top:0;left:0;right:0;height:${headerH}px;
                display:flex;align-items:center;justify-content:flex-start;
                padding:${Math.round(16*scale)}px ${pad}px;z-index:30">
      ${logoHtml}
    </div>`;

  // ── MAIN CONTENT AREA (left side, below logo) ─────────────────────────────────
  const contentW = Math.round(W * (isStory ? 0.92 : isSquare ? 0.7 : 0.65));
  // Reserve space: header + content + qr bottom. Calculate available height.
  const qrAreaH = Math.round(200 * scale);  // Fixed reserved height for QR at bottom
  const contentAreaH = H - headerH - qrAreaH;
  const mainContent = `
    <div style="position:absolute;top:${headerH}px;left:0;width:${contentW}px;
                height:${contentAreaH}px;
                z-index:20;padding:${Math.round(10*scale)}px ${pad}px 0;
                display:flex;flex-direction:column;justify-content:flex-start;overflow:hidden">
      <!-- PROGRAM NAME — massive 3D metallic -->
      <div style="margin-bottom:${Math.round(8*scale)}px">${programNameHtml}</div>
      <!-- CTA TEXT — large bold below program name -->
      <div style="margin-bottom:${Math.round(14*scale)}px">${ctaHtml}</div>
      <!-- THIN RED ACCENT LINE -->
      <div style="display:flex;align-items:center;gap:${Math.round(8*scale)}px;margin-bottom:${Math.round(14*scale)}px">
        <div style="width:${Math.round(55*scale)}px;height:${Math.round(2.5*scale)}px;
                    background:linear-gradient(90deg,${primary},transparent);
                    box-shadow:0 0 14px rgba(${primaryRgb},0.9)"></div>
        <div style="width:${Math.round(7*scale)}px;height:${Math.round(7*scale)}px;border-radius:50%;
                    background:${primary};box-shadow:0 0 12px rgba(${primaryRgb},1.0)"></div>
      </div>
      <!-- BENEFITS -->
      <div>${benefitItems}</div>
    </div>
    <!-- QR CODE — fixed at bottom, always visible -->
    <div style="position:absolute;bottom:0;left:0;width:${contentW}px;
                height:${qrAreaH}px;
                z-index:20;padding:${Math.round(16*scale)}px ${pad}px ${Math.round(20*scale)}px;">
      ${qrSection}
    </div>`;

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
  <div style="position:absolute;inset:0;${heroBg}z-index:1;filter:contrast(1.08) saturate(1.15) brightness(0.95)"></div>

  <!-- DARK OVERLAY GRADIENTS for text readability -->
  ${darkOverlay}

  <!-- EMBER PARTICLES -->
  ${emberSvg}

  <!-- LEFT EDGE GLOW LINE -->
  ${glowLine}

  <!-- LOGO HEADER — top center, large and prominent -->
  ${headerHtml}

  <!-- MAIN CONTENT — program name, CTA, benefits, QR -->
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
  "little ninjas": "young child karate white gi martial arts training energetic",
  "little ninja": "young child karate white gi martial arts training energetic",
  ninja: "young child karate martial arts kids training dojo white gi",
  "warrior kids": "child karate martial arts training punch kick energetic",
  "warrior teen": "teenager karate martial arts training punch kick powerful",
  "warrior youth": "youth teenager karate martial arts training powerful",
  teen: "teenager karate martial arts training kick punch powerful",
  youth: "youth teenager karate martial arts training powerful",
  junior: "young teenager karate martial arts training",
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
  // ── PROGRAM NAME EXTRACTION ──────────────────────────────────────────────────
  const knownPrograms = [
    'little ninjas', 'little ninja', 'warrior kids', 'warrior teen', 'warrior teens',
    'warrior youth', 'junior warriors', 'mini warriors',
    'teen karate', 'teen kickboxing', 'teen bjj', 'teen martial arts', 'youth karate',
    'youth kickboxing', 'youth martial arts',
    'adult karate', 'adult kickboxing', 'adult bjj', 'adult martial arts',
    'kickboxing', 'muay thai', 'jiu-jitsu', 'jiu jitsu', 'bjj', 'taekwondo',
    'boxing', 'wrestling', 'judo', 'mma',
    'self defense', 'self-defense', 'womens self defense', "women's self defense",
    'karate', 'ninja', 'kids karate', 'kids kickboxing',
  ].sort((a, b) => b.length - a.length);

  let programName = overrides?.programName || null;
  if (!programName) {
    const lowerBrief = brief.toLowerCase();
    for (const kp of knownPrograms) {
      if (lowerBrief.includes(kp)) {
        programName = kp.replace(/\b\w/g, c => c.toUpperCase());
        break;
      }
    }
  }
  if (!programName) {
    // Capture words after "for" or "a/an" before program-related words
    const forMatch = brief.match(/\bfor\s+(?:a\s+|an\s+)?([A-Z][A-Za-z\s&-]{2,35}?)(?:\s+(?:program|class|flyer|ad|poster)|$|\.|,)/i);
    const aMatch = brief.match(/\bcreate\s+(?:a\s+|an\s+)?([A-Z][A-Za-z\s&-]{2,35}?)(?:\s+(?:flyer|poster|ad|program|class)|$|\.|,)/i);
    programName = forMatch?.[1]?.trim() || aMatch?.[1]?.trim() || "Martial Arts";
  }

  // ── SIZE EXTRACTION ──────────────────────────────────────────────────────────
  let size: FlyerData['size'] = 'flyer';
  if (/instagram story/i.test(brief)) size = 'instagram_story';
  else if (/instagram/i.test(brief)) size = 'instagram_post';
  else if (/facebook/i.test(brief)) size = 'facebook_ad';
  else if (/banner/i.test(brief)) size = 'website_banner';
  else if (/business card/i.test(brief)) size = 'business_card';

  // ── OFFER / PRICE EXTRACTION ─────────────────────────────────────────────────
  const priceMatch = brief.match(/\$?([\d.]+)\s*(?:for\s+(\d+)\s+class(?:es)?)?/i);
  const price = priceMatch?.[1];
  const classCount = priceMatch?.[2];
  const offer = price ? `$${price}${classCount ? ` for ${classCount} classes` : ''}` : null;

  // ── AGE EXTRACTION ───────────────────────────────────────────────────────────
  const ageMatch = brief.match(/age[sd]?\s*([\d-]+(?:\s*(?:to|-)\s*[\d]+)?)/i);
  const audience = ageMatch?.[1] ? `Ages ${ageMatch[1]}` : null;

  // ── BENEFITS based on program ────────────────────────────────────────────────
  const lowerProgram = programName.toLowerCase();
  let benefits: string[];

  if (lowerProgram.includes('little ninja') || (lowerProgram.includes('ninja') && !lowerProgram.includes('teen') && !lowerProgram.includes('adult'))) {
    benefits = [
      "Builds Character|Confidence. Respect. Discipline.",
      "Better Listeners|Focus. Attention. Following Directions.",
      "Fun & Engaging|Active. Exciting. Age-Appropriate.",
      "Ages 3–5|The perfect start for your child.",
    ];
  } else if (lowerProgram.includes('warrior kid') || lowerProgram.includes('kids') || lowerProgram.includes('junior')) {
    benefits = [
      "Builds Confidence|Bully-proof your child.",
      "Focus & Discipline|Better grades, better behavior.",
      "Fun & Fitness|Active, exciting, age-appropriate.",
      "Ages 6–12|The perfect martial arts foundation.",
    ];
  } else if (lowerProgram.includes('teen') || lowerProgram.includes('warrior teen') || lowerProgram.includes('youth')) {
    benefits = [
      "Build Real Confidence|Stand tall, lead with strength.",
      "Self Defense Skills|Real-world protection techniques.",
      "Fitness & Discipline|Body and mind transformation.",
      "Ages 13–17|Train with your peers.",
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
  } else if (lowerProgram.includes('self defense') || lowerProgram.includes('self-defense')) {
    benefits = [
      "Real-World Skills|Techniques that actually work.",
      "Build Confidence|Walk tall, feel safe anywhere.",
      "Situational Awareness|Prevent threats before they start.",
      "All Welcome|No experience necessary.",
    ];
  } else {
    benefits = [
      "Builds Confidence|Mental & physical strength.",
      "Self Defense|Real-world protection skills.",
      "Get Fit|Full body workout every class.",
      "All Ages Welcome|Beginner friendly.",
    ];
  }

  // ── HERO IMAGE via Forge AI ──────────────────────────────────────────────────
  let heroImageUrl: string | null = null;
  try {
    const { generateImage } = await import("./_core/imageGeneration");
    const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
    const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;

    if (forgeApiKey && forgeApiUrl) {
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
    const pexelsResult = await fetchHeroPhotoAsBase64(programName);
    if (pexelsResult) {
      heroImageUrl = pexelsResult.dataUrl;
    }
  }

  // ── QR CODE ──────────────────────────────────────────────────────────────────
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
    headline: offer ? `${offer} — Limited Spots` : `Unleash Your Inner Warrior`,
    subheadline: null,
    benefits,
    callToAction: offer ? `${offer} — Enroll Today` : `FREE TRIAL CLASS`,
    offer,
    size,
    heroImageUrl,
    qrCodeDataUrl,
    ...overrides,
  };
}

// ── Hero image prompt builder ─────────────────────────────────────────────────
function buildHeroImagePrompt(programName: string, lowerProgram: string, primaryColor: string): string {
  const isToddler = lowerProgram.includes('little ninja');
  const isKids = !isToddler && (lowerProgram.includes('warrior kid') || lowerProgram.includes('kids') || lowerProgram.includes('junior') || lowerProgram.includes('mini') || (lowerProgram.includes('ninja') && !lowerProgram.includes('teen') && !lowerProgram.includes('adult')));
  const isTeen = lowerProgram.includes('teen') || lowerProgram.includes('warrior teen') || lowerProgram.includes('youth') || lowerProgram.includes('junior warrior');
  const isKickboxing = lowerProgram.includes('kickbox');
  const isBJJ = lowerProgram.includes('bjj') || lowerProgram.includes('jiu');
  const isSelfDefense = lowerProgram.includes('self defense') || lowerProgram.includes('self-defense');

  // CRITICAL: All prompts specify the subject is on the RIGHT side of frame
  // so the LEFT side is naturally darker for text overlay
  const baseStyle = `Style: UFC promotional poster meets Cobra Kai marketing meets Call of Duty key art. Unreal Engine quality lighting. Sharp subject isolation. High contrast, deep blacks, glowing red accents. Commercial print quality. No text in image. Vertical portrait orientation. IMPORTANT: Subject positioned on the RIGHT side of the frame, leaving the LEFT side naturally darker for text overlay.`;

  if (isToddler) {
    return `Hyper-realistic cinematic photograph. Subject: ONE small child, clearly aged 3-5 years old (toddler/preschool age), in a pristine white karate gi uniform with a white belt. The child is performing an energetic forward punch toward the camera with a fierce excited expression, mouth open in a battle cry. Dark cinematic background with deep red glowing energy, floating ember particles, volumetric smoke, dramatic red rim lighting from behind creating a halo effect. Floor reflections visible. IMPORTANT: The subject must look like a toddler/preschool child (3-5 years old), NOT a teenager or adult. ${baseStyle}`;
  } else if (isKids) {
    return `Hyper-realistic cinematic photograph. Subject: ONE child clearly aged 8-10 years old (elementary school age), in a pristine white karate gi uniform with a colored belt, performing a powerful side kick or punch toward the camera with an intense focused expression. Dark cinematic background with deep red and orange glowing energy, floating ember particles, volumetric smoke, dramatic red rim lighting. IMPORTANT: The subject must look like an elementary school child (8-10 years old), NOT a teenager or adult. ${baseStyle}`;
  } else if (isTeen) {
    return `Hyper-realistic cinematic photograph. Subject: ONE teenager clearly aged 15-16 years old (high school age), athletic build, in a black or white karate gi or athletic training gear, performing a powerful high kick or aggressive fighting stance toward the camera with intense determined expression. Dark cinematic background with deep red glowing energy, ember particles, volumetric smoke, dramatic red rim lighting. IMPORTANT: The subject must look like a teenager (15-16 years old), NOT a young child or adult. ${baseStyle}`;
  } else if (isKickboxing) {
    return `Hyper-realistic cinematic photograph. Subject: ONE powerful athletic adult (25-35 years old) in kickboxing gear — black shorts, red boxing gloves, athletic top — executing a devastating high roundhouse kick with explosive energy. Dark cinematic background with red energy glow, ember particles, volumetric smoke, dramatic rim lighting. ${baseStyle}`;
  } else if (isBJJ) {
    return `Hyper-realistic cinematic photograph. Subject: ONE BJJ practitioner (adult, 25-35 years old) in a white gi performing a dominant ground control position or standing ready in fighting stance, intense focused expression. Dark cinematic dojo background with subtle blue-red energy lighting, dramatic rim lighting. ${baseStyle}`;
  } else if (isSelfDefense) {
    return `Hyper-realistic cinematic photograph. Subject: ONE confident adult woman (25-35 years old) in athletic wear or gi, performing a powerful defensive strike or confident fighting stance, strong determined expression. Dark cinematic background with red energy glow, dramatic rim lighting. Empowerment and strength aesthetic. ${baseStyle}`;
  } else {
    return `Hyper-realistic cinematic photograph. Subject: ONE martial artist (adult, 25-35 years old) in a clean white karate gi performing a powerful dynamic kick or punch toward the camera with intense determined expression. Dark cinematic background with deep red glowing energy, floating ember particles, volumetric smoke, dramatic red rim lighting. ${baseStyle}`;
  }
}

// renderFlyerToPng removed — flyer PNG capture is now handled client-side via html2canvas
