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
  eventSubtitle?: string | null;  // e.g. "PARENTS NIGHT OUT"
  eventDate?: string | null;      // e.g. "JUNE 10TH"
  eventTime?: string | null;      // e.g. "6PM - 10PM"
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
  const benefitIconSize = Math.round(iconSize * 1.1);  // 10% larger than before

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

  // ── PROGRAM NAME — massive 3D RED beveled letters (matching reference exactly) ──
  // Reference: thick chunky red letters with silver/grey extrusion shadow below
  const words = data.programName.toUpperCase().split(' ');
  const wordCount = words.length;
  const nameFontPx = wordCount >= 3
    ? Math.round(programNamePx * 0.72)
    : wordCount === 2
    ? programNamePx
    : Math.round(programNamePx * 1.1);

  // Reference has RED letters with thick grey/dark extrusion (3D bevel effect)
  // The letter face is bright red, the extrusion goes down-right in dark red/black
  const metalShadow = [
    // Thick downward-right extrusion (creates 3D bevel depth)
    `2px 2px 0 ${darken(primary, 0.15)}`,
    `4px 4px 0 ${darken(primary, 0.25)}`,
    `6px 6px 0 ${darken(primary, 0.4)}`,
    `8px 8px 0 ${darken(primary, 0.55)}`,
    `10px 10px 0 rgba(0,0,0,0.8)`,
    `12px 12px 0 rgba(0,0,0,0.65)`,
    `14px 14px 0 rgba(0,0,0,0.5)`,
    `16px 16px 0 rgba(0,0,0,0.35)`,
    // Outer red glow
    `0 0 40px rgba(${primaryRgb},0.9)`,
    `0 0 80px rgba(${primaryRgb},0.5)`,
    `0 0 120px rgba(${primaryRgb},0.25)`,
  ].join(',');

  const programNameHtml = words.map(word =>
    `<div style="font-family:'Oswald',sans-serif;font-size:${nameFontPx}px;font-weight:700;
                 color:${primary};text-transform:uppercase;letter-spacing:2px;line-height:0.88;
                 text-shadow:${metalShadow};
                 -webkit-text-stroke:${Math.round(2*scale)}px rgba(255,255,255,0.12);
                 display:block;white-space:nowrap;padding-bottom:${Math.round(6*scale)}px">${escapeHtml(word)}</div>`
  ).join('');

  // ── CTA TEXT — thick white 3D beveled letters (matching reference's "FREE TRIAL CLASS") ──
  // Reference: white letters with grey/dark extrusion shadow, thick and bold
  const ctaText = data.callToAction || 'FREE TRIAL CLASS';
  const ctaParts = ctaText.toUpperCase().split(/\s+/);
  const midpoint = Math.ceil(ctaParts.length / 2);
  const ctaLine1 = ctaParts.slice(0, midpoint).join(' ');
  const ctaLine2 = ctaParts.slice(midpoint).join(' ');
  // White 3D bevel: white face, dark grey extrusion going down-right
  const ctaBevelShadow = [
    `2px 2px 0 rgba(80,80,80,0.9)`,
    `4px 4px 0 rgba(60,60,60,0.8)`,
    `6px 6px 0 rgba(40,40,40,0.7)`,
    `8px 8px 0 rgba(20,20,20,0.6)`,
    `10px 10px 0 rgba(0,0,0,0.5)`,
    `12px 12px 0 rgba(0,0,0,0.35)`,
    `0 0 20px rgba(0,0,0,0.8)`,
  ].join(',');
  const ctaCharCount = Math.max(ctaLine1.length, ctaLine2.length);
  const ctaFontPx = ctaCharCount > 18
    ? Math.round(ctaTextPx * 0.62)
    : ctaCharCount > 12
    ? Math.round(ctaTextPx * 0.78)
    : ctaTextPx;
  const ctaHtml = ctaLine2
    ? `<div style="font-family:'Oswald',sans-serif;font-size:${ctaFontPx}px;font-weight:700;
                   color:#ffffff;text-transform:uppercase;letter-spacing:2px;line-height:0.92;
                   text-shadow:${ctaBevelShadow};
                   display:block">${escapeHtml(ctaLine1)}</div>
       <div style="font-family:'Oswald',sans-serif;font-size:${ctaFontPx}px;font-weight:700;
                   color:#ffffff;text-transform:uppercase;letter-spacing:2px;line-height:0.92;
                   text-shadow:${ctaBevelShadow};
                   display:block">${escapeHtml(ctaLine2)}</div>`
    : `<div style="font-family:'Oswald',sans-serif;font-size:${ctaFontPx}px;font-weight:700;
                   color:#ffffff;text-transform:uppercase;letter-spacing:2px;line-height:0.92;
                   text-shadow:${ctaBevelShadow};display:block">${escapeHtml(ctaLine1)}</div>`;

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
    <div style="display:flex;align-items:center;gap:${Math.round(16*scale)}px;margin-bottom:${Math.round(14*scale)}px">
      <div style="flex-shrink:0;width:${benefitIconSize}px;height:${benefitIconSize}px;border-radius:50%;
                  background:rgba(${primaryRgb},0.9);border:${Math.round(2*scale)}px solid rgba(${primaryRgb},0.5);
                  display:flex;align-items:center;justify-content:center;
                  box-shadow:0 3px 14px rgba(0,0,0,0.8),0 0 20px rgba(${primaryRgb},0.5),inset 0 1px 0 rgba(255,255,255,0.1)">
        <svg width="${Math.round(benefitIconSize*0.65)}" height="${Math.round(benefitIconSize*0.65)}"
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

  // ── QR CODE — large, bottom left, with logo watermark inside QR box ────────────
  // Reference: QR code has the school logo overlaid in the center (standard QR logo embed)
  const qrLogoOverlay = data.logoUrl
    ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                  width:${Math.round(qrSize*0.22)}px;height:${Math.round(qrSize*0.22)}px;
                  background:#fff;border-radius:${Math.round(4*scale)}px;
                  display:flex;align-items:center;justify-content:center;
                  box-shadow:0 0 4px rgba(0,0,0,0.3);overflow:hidden">
        <img src="${data.logoUrl}" style="width:${Math.round(qrSize*0.18)}px;height:${Math.round(qrSize*0.18)}px;object-fit:contain" />
      </div>`
    : `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                  width:${Math.round(qrSize*0.22)}px;height:${Math.round(qrSize*0.22)}px;
                  background:#fff;border-radius:${Math.round(4*scale)}px;
                  display:flex;align-items:center;justify-content:center;
                  box-shadow:0 0 4px rgba(0,0,0,0.3)">
        <svg width="${Math.round(qrSize*0.16)}" height="${Math.round(qrSize*0.16)}" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" fill="${primary}"/>
        </svg>
      </div>`;

  // QR label: "SCAN TO" small, "START" very large red, "YOUR JOURNEY" medium white
  const qrStartShadow = [
    `2px 2px 0 ${darken(primary,0.3)}`,
    `4px 4px 0 ${darken(primary,0.5)}`,
    `6px 6px 0 rgba(0,0,0,0.7)`,
    `0 0 20px rgba(${primaryRgb},0.8)`,
  ].join(',');

  const qrSection = data.qrCodeDataUrl ? `
    <div style="display:flex;align-items:flex-end;gap:${Math.round(18*scale)}px">
      <div style="background:#fff;padding:${Math.round(8*scale)}px;border-radius:${Math.round(8*scale)}px;
                  box-shadow:0 0 30px rgba(0,0,0,0.8),0 4px 20px rgba(0,0,0,0.9);flex-shrink:0;
                  position:relative;width:${qrSize + Math.round(16*scale)}px;height:${qrSize + Math.round(16*scale)}px">
        <img src="${data.qrCodeDataUrl}" alt="QR" style="width:${qrSize}px;height:${qrSize}px;display:block" />
        ${qrLogoOverlay}
      </div>
      <div style="display:flex;flex-direction:column;padding-bottom:${Math.round(4*scale)}px">
        <div style="font-family:'Oswald',sans-serif;font-size:${qrLabelSmPx}px;font-weight:600;
                    color:#fff;text-transform:uppercase;letter-spacing:4px;line-height:1.1;
                    text-shadow:0 2px 10px rgba(0,0,0,0.95)">SCAN TO</div>
        <div style="font-family:'Oswald',sans-serif;font-size:${Math.round(qrLabelLgPx*1.15)}px;font-weight:700;
                    color:${primary};text-transform:uppercase;letter-spacing:1px;line-height:0.88;
                    text-shadow:${qrStartShadow}">START</div>
        <div style="font-family:'Oswald',sans-serif;font-size:${Math.round(qrLabelLgPx*0.88)}px;font-weight:700;
                    color:#fff;text-transform:uppercase;letter-spacing:1.5px;line-height:1.0;
                    text-shadow:0 2px 10px rgba(0,0,0,0.95)">YOUR</div>
        <div style="font-family:'Oswald',sans-serif;font-size:${Math.round(qrLabelLgPx*0.88)}px;font-weight:700;
                    color:#fff;text-transform:uppercase;letter-spacing:1.5px;line-height:1.0;
                    text-shadow:0 2px 10px rgba(0,0,0,0.95)">JOURNEY</div>
      </div>
    </div>` : '';

  // ── BACKGROUND LOGO WATERMARK — large faded logo behind hero (top-right area) ──
  // Reference has a large semi-transparent red logo symbol in the background
  const bgLogoWatermark = data.logoUrl
    ? `<div style="position:absolute;top:${Math.round(H*0.04)}px;right:${Math.round(W*0.02)}px;
                  width:${Math.round(W*0.55)}px;height:${Math.round(H*0.55)}px;
                  z-index:3;opacity:0.12;pointer-events:none">
        <img src="${data.logoUrl}" style="width:100%;height:100%;object-fit:contain;
               filter:brightness(0) saturate(100%) invert(15%) sepia(90%) saturate(700%) hue-rotate(340deg) brightness(0.8)" />
      </div>`
    : `<div style="position:absolute;top:${Math.round(H*0.04)}px;right:${Math.round(W*0.02)}px;
                  width:${Math.round(W*0.55)}px;height:${Math.round(H*0.55)}px;
                  z-index:3;opacity:0.08;pointer-events:none">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
          <!-- Stylized martial arts symbol -->
          <circle cx="50" cy="50" r="45" stroke="${primary}" stroke-width="3" fill="none"/>
          <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" stroke="${primary}" stroke-width="2.5" fill="none"/>
          <circle cx="50" cy="50" r="12" fill="${primary}" opacity="0.6"/>
          <line x1="50" y1="10" x2="50" y2="90" stroke="${primary}" stroke-width="1.5" opacity="0.4"/>
          <line x1="15" y1="30" x2="85" y2="70" stroke="${primary}" stroke-width="1.5" opacity="0.4"/>
          <line x1="85" y1="30" x2="15" y2="70" stroke="${primary}" stroke-width="1.5" opacity="0.4"/>
        </svg>
      </div>`;

  // ── DARK GRADIENT OVERLAY — creates readable text area on left/bottom ─────────
  const darkOverlay = `
    <!-- Left-side dark gradient for text readability -->
    <div style="position:absolute;inset:0;
                background:linear-gradient(105deg,
                  rgba(0,0,0,0.92) 0%,
                  rgba(0,0,0,0.85) 20%,
                  rgba(0,0,0,0.65) 38%,
                  rgba(0,0,0,0.2) 58%,
                  rgba(0,0,0,0.0) 72%);
                z-index:2"></div>
    <!-- Bottom dark gradient for QR area -->
    <div style="position:absolute;bottom:0;left:0;right:0;
                height:${Math.round(H*0.38)}px;
                background:linear-gradient(180deg,transparent 0%,rgba(0,0,0,0.8) 55%,rgba(0,0,0,0.92) 100%);
                z-index:2"></div>
    <!-- Top dark gradient for logo area -->
    <div style="position:absolute;top:0;left:0;right:0;
                height:${Math.round(H*0.2)}px;
                background:linear-gradient(180deg,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.45) 65%,transparent 100%);
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

  <!-- BACKGROUND LOGO WATERMARK — large faded symbol top-right -->
  ${bgLogoWatermark}

  <!-- EMBER PARTICLES -->
  ${emberSvg}

  <!-- LEFT EDGE GLOW LINE -->
  ${glowLine}

  <!-- LOGO HEADER — top left, large and prominent -->
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
  const lowerBriefForProgram = brief.toLowerCase();

  // Check for known events FIRST before martial arts programs
  const knownEvents = [
    'nerf wars', 'nerf war', 'nerf battle', 'nerf event',
    'birthday party', 'birthday bash', 'birthday celebration',
    'summer camp', 'summer intensive',
    'belt ceremony', 'belt test', 'belt graduation', 'graduation ceremony',
    'open house', 'grand opening',
    'tournament', 'championship', 'competition',
    'fundraiser', 'charity event',
    'demo day', 'demonstration', 'showcase',
  ].sort((a, b) => b.length - a.length);

  if (!programName) {
    for (const ke of knownEvents) {
      if (lowerBriefForProgram.includes(ke)) {
        programName = ke.replace(/\b\w/g, c => c.toUpperCase());
        break;
      }
    }
  }

  if (!programName) {
    for (const kp of knownPrograms) {
      if (lowerBriefForProgram.includes(kp)) {
        programName = kp.replace(/\b\w/g, c => c.toUpperCase());
        break;
      }
    }
  }
  if (!programName) {
    // Capture words after "for" or "a/an" before program-related words
    const forMatch = brief.match(/\bfor\s+(?:a\s+|an\s+)?([A-Z][A-Za-z\s&-]{2,35}?)(?:\s+(?:program|class|flyer|ad|poster|event)|$|\.|,)/i);
    const aMatch = brief.match(/\bcreate\s+(?:a\s+|an\s+)?([A-Z][A-Za-z\s&-]{2,35}?)(?:\s+(?:flyer|poster|ad|program|class|event)|$|\.|,)/i);
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

  // ── EVENT SUBTITLE EXTRACTION ────────────────────────────────────────────────
  // e.g. "Nerf Wars Parents Night Out June 10th" → subtitle: "PARENTS NIGHT OUT", date: "JUNE 10TH"
  let eventSubtitle: string | null = null;
  let eventDate: string | null = null;
  let eventTime: string | null = null;

  // Extract subtitle keywords ("parents night out", "family night", "open mat", etc.)
  const subtitlePatterns = [
    { pattern: /parents?\s+night\s+out/i, label: 'PARENTS NIGHT OUT' },
    { pattern: /family\s+night/i, label: 'FAMILY NIGHT' },
    { pattern: /kids?\s+night/i, label: 'KIDS NIGHT' },
    { pattern: /open\s+mat/i, label: 'OPEN MAT' },
    { pattern: /free\s+trial/i, label: 'FREE TRIAL' },
    { pattern: /grand\s+opening/i, label: 'GRAND OPENING' },
    { pattern: /open\s+house/i, label: 'OPEN HOUSE' },
    { pattern: /belt\s+ceremony/i, label: 'BELT CEREMONY' },
    { pattern: /graduation\s+ceremony/i, label: 'GRADUATION CEREMONY' },
    { pattern: /demo\s+day/i, label: 'DEMO DAY' },
  ];
  for (const sp of subtitlePatterns) {
    if (sp.pattern.test(brief)) {
      eventSubtitle = sp.label;
      break;
    }
  }

  // Extract date: "June 10th", "June 10", "6/10", "June 10th, 2025"
  const dateMatch = brief.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:[,\s]+(\d{4}))?/i
  ) || brief.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dateMatch) {
    const monthNames: Record<string, string> = {
      january: 'JANUARY', february: 'FEBRUARY', march: 'MARCH', april: 'APRIL',
      may: 'MAY', june: 'JUNE', july: 'JULY', august: 'AUGUST',
      september: 'SEPTEMBER', october: 'OCTOBER', november: 'NOVEMBER', december: 'DECEMBER'
    };
    const isMonthName = isNaN(Number(dateMatch[1]));
    if (isMonthName) {
      const month = monthNames[dateMatch[1].toLowerCase()] || dateMatch[1].toUpperCase();
      const day = dateMatch[2];
      const suffix = Number(day) === 1 ? 'ST' : Number(day) === 2 ? 'ND' : Number(day) === 3 ? 'RD' : 'TH';
      eventDate = `${month} ${day}${suffix}`;
    } else {
      eventDate = `${dateMatch[1]}/${dateMatch[2]}`;
    }
  }

  // Extract time: "6pm", "6:00 PM", "6-10pm", "6pm to 10pm"
  const timeMatch = brief.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*(?:[-–to]+\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))?)/i);
  if (timeMatch) {
    eventTime = timeMatch[1].trim().toUpperCase();
  }

   // ── EVENT DETECTION (check brief first) ──────────────────────────────────────
  const lowerBriefFull = brief.toLowerCase();
  const isNerfEvent = lowerBriefFull.includes('nerf');
  const isBirthdayEvent = lowerBriefFull.includes('birthday') || lowerBriefFull.includes('party');
  const isTournamentEvent = lowerBriefFull.includes('tournament') || lowerBriefFull.includes('competition') || lowerBriefFull.includes('championship');
  const isSummerCampEvent = lowerBriefFull.includes('summer camp') || lowerBriefFull.includes('camp');
  const isGraduationEvent = lowerBriefFull.includes('graduation') || lowerBriefFull.includes('belt ceremony') || lowerBriefFull.includes('belt test');
  const isOpenHouseEvent = lowerBriefFull.includes('open house') || lowerBriefFull.includes('grand opening');
  const isDemoEvent = lowerBriefFull.includes('demo') || lowerBriefFull.includes('demonstration') || lowerBriefFull.includes('showcase');

  // ── BENEFITS based on program ────────────────────────────────────────────
  const lowerProgram = programName.toLowerCase();
  let benefits: string[];

  if (isNerfEvent) {
    benefits = [
      "Epic Foam Battles|Team vs team Nerf warfare!",
      "Safe & Supervised|Trained staff. Safety gear provided.",
      "All Welcome|Ages 6 and up. No experience needed.",
      "Fun Guaranteed|The ultimate action-packed event.",
    ];
  } else if (isBirthdayEvent) {
    benefits = [
      "Unforgettable Party|Your child will love it!",
      "Martial Arts Fun|Games, drills & mini-sparring.",
      "Stress-Free|We handle setup, cleanup & activities.",
      "All Ages Welcome|Kids of all skill levels.",
    ];
  } else if (isTournamentEvent) {
    benefits = [
      "Compete & Win|Medals & trophies for all divisions.",
      "All Belt Levels|Beginner to advanced divisions.",
      "Safe Competition|Certified referees & safety rules.",
      "Family Event|Spectators welcome. Come support!",
    ];
  } else if (isSummerCampEvent) {
    benefits = [
      "Full Day Activities|Martial arts, games & more.",
      "Build Confidence|Character development every day.",
      "Safe Environment|Certified instructors on-site.",
      "Ages 6–14|All skill levels welcome.",
    ];
  } else if (isGraduationEvent) {
    benefits = [
      "Belt Promotion|Earn your next rank!",
      "Celebrate Achievement|Family & friends welcome.",
      "Skill Demonstration|Show what you've learned.",
      "Milestone Moment|A day to remember.",
    ];
  } else if (isOpenHouseEvent || isDemoEvent) {
    benefits = [
      "Free to Attend|No experience necessary.",
      "See It Live|Watch our students in action.",
      "Meet the Team|Talk to instructors & staff.",
      "Try a Free Class|Sign up on the spot!",
    ];
  } else if (lowerProgram.includes('little ninja') || (lowerProgram.includes('ninja') && !lowerProgram.includes('teen') && !lowerProgram.includes('adult'))) {
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
      const heroPrompt = buildHeroImagePrompt(programName, lowerProgram, brandData.primaryColor || "#C8102E", brief);
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
    eventSubtitle,
    eventDate,
    eventTime,
    audience,
    // Event-specific headlines and CTAs
    headline: (() => {
      const lp = programName.toLowerCase();
      if (lp.includes('nerf')) return offer ? `${offer} — Limited Spots!` : `NERF WARS EVENT`;
      if (lp.includes('birthday')) return offer ? `${offer} — Book Now!` : `BIRTHDAY BASH`;
      if (lp.includes('tournament') || lp.includes('championship') || lp.includes('competition')) return `REGISTER NOW — Limited Spots`;
      if (lp.includes('summer camp')) return offer ? `${offer} — Enroll Now` : `SUMMER CAMP`;
      if (lp.includes('graduation') || lp.includes('belt')) return `BELT GRADUATION CEREMONY`;
      if (lp.includes('open house') || lp.includes('grand opening')) return `FREE OPEN HOUSE EVENT`;
      return offer ? `${offer} — Limited Spots` : `Unleash Your Inner Warrior`;
    })(),
    subheadline: null,
    benefits,
    callToAction: (() => {
      const lp = programName.toLowerCase();
      if (lp.includes('nerf')) return offer ? `${offer} — Register Today` : `REGISTER NOW`;
      if (lp.includes('birthday')) return offer ? `${offer} — Book Your Party` : `BOOK YOUR PARTY`;
      if (lp.includes('tournament') || lp.includes('championship')) return offer ? `${offer} — Register` : `REGISTER TODAY`;
      if (lp.includes('summer camp')) return offer ? `${offer} — Enroll Today` : `ENROLL TODAY`;
      if (lp.includes('graduation') || lp.includes('belt')) return `JOIN US TO CELEBRATE`;
      if (lp.includes('open house') || lp.includes('grand opening')) return `COME SEE US — FREE ENTRY`;
      return offer ? `${offer} — Enroll Today` : `FREE TRIAL CLASS`;
    })(),
    offer,
    size,
    heroImageUrl,
    qrCodeDataUrl,
    ...overrides,
  };
}

// ── Hero image prompt builder ─────────────────────────────────────────────────
// Accepts the full brief text so event-specific context can be used
function buildHeroImagePrompt(programName: string, lowerProgram: string, primaryColor: string, fullBrief?: string): string {
  const lowerBrief = (fullBrief || programName).toLowerCase();

  // ── EVENT / NON-MARTIAL-ARTS DETECTION ──────────────────────────────────────
  const isNerfWar = lowerBrief.includes('nerf') || lowerBrief.includes('nerf war');
  const isBirthdayParty = lowerBrief.includes('birthday') || lowerBrief.includes('party') || lowerBrief.includes('celebration');
  const isTournament = lowerBrief.includes('tournament') || lowerBrief.includes('competition') || lowerBrief.includes('championship');
  const isSummerCamp = lowerBrief.includes('summer camp') || lowerBrief.includes('camp');
  const isGraduation = lowerBrief.includes('graduation') || lowerBrief.includes('belt ceremony') || lowerBrief.includes('belt test');
  const isFundraiser = lowerBrief.includes('fundraiser') || lowerBrief.includes('fundraising') || lowerBrief.includes('charity');
  const isOpenHouse = lowerBrief.includes('open house') || lowerBrief.includes('grand opening') || lowerBrief.includes('free event');
  const isDemo = lowerBrief.includes('demo') || lowerBrief.includes('demonstration') || lowerBrief.includes('showcase');

  // ── MARTIAL ARTS PROGRAM DETECTION ──────────────────────────────────────────
  const isToddler = lowerProgram.includes('little ninja') || (lowerBrief.includes('little ninja') && !lowerBrief.includes('teen'));
  const isKids = !isToddler && (lowerProgram.includes('warrior kid') || lowerProgram.includes('kids') || lowerProgram.includes('junior') || lowerProgram.includes('mini') || (lowerProgram.includes('ninja') && !lowerProgram.includes('teen') && !lowerProgram.includes('adult')));
  const isTeen = lowerProgram.includes('teen') || lowerProgram.includes('warrior teen') || lowerProgram.includes('youth') || lowerProgram.includes('junior warrior');
  const isKickboxing = lowerProgram.includes('kickbox');
  const isBJJ = lowerProgram.includes('bjj') || lowerProgram.includes('jiu');
  const isSelfDefense = lowerProgram.includes('self defense') || lowerProgram.includes('self-defense');

  // Base style for martial arts posters
  const baseStyle = `Style: UFC promotional poster meets Cobra Kai marketing meets Call of Duty key art. Unreal Engine quality lighting. Sharp subject isolation. High contrast, deep blacks, glowing red accents. Commercial print quality. No text in image. Vertical portrait orientation. IMPORTANT: Subject positioned on the RIGHT side of the frame, leaving the LEFT side naturally darker for text overlay.`;

  // Base style for events/parties — more vibrant and fun
  const eventStyle = `Style: High-energy event promotional poster. Vibrant action photography. Dynamic lighting with dramatic shadows. Commercial print quality. No text in image. Vertical portrait orientation. IMPORTANT: Main subject/action positioned on the RIGHT side of the frame, leaving the LEFT side naturally darker for text overlay.`;

  // ── EVENT-SPECIFIC PROMPTS ───────────────────────────────────────────────────
  if (isNerfWar) {
    return `Hyper-realistic cinematic action photograph. Subject: ONE excited child or group of children aged 8-14 years old, wearing tactical vests and eye protection, holding Nerf blasters/foam dart guns, in a dynamic action pose as if mid-battle. Colorful foam darts flying through the air. Background: dark dramatic indoor arena with colored lighting, smoke effects, and neon accents. High energy, fun, competitive atmosphere. Bright orange and yellow Nerf gun colors contrast against dark background. ${eventStyle}`;
  } else if (isBirthdayParty) {
    return `Hyper-realistic cinematic photograph. Subject: Excited children in a martial arts dojo celebrating, wearing karate gis, with birthday decorations and a festive atmosphere. Colorful balloons, confetti, dramatic dojo lighting. Fun and celebratory energy. Dark background with colorful accent lighting. ${eventStyle}`;
  } else if (isTournament) {
    return `Hyper-realistic cinematic photograph. Subject: ONE young martial artist (age appropriate to the program) in a crisp white gi, in a powerful competition stance or executing a technique, with dramatic arena lighting suggesting a tournament setting. Spotlights, dramatic shadows, competitive energy. Trophy or medal visible in background. ${baseStyle}`;
  } else if (isSummerCamp) {
    return `Hyper-realistic cinematic photograph. Subject: Group of excited children aged 6-12 in karate gis, energetically training outdoors or in a bright dojo, smiling and doing martial arts moves together. Vibrant summer energy, bright lighting, fun and active atmosphere. ${eventStyle}`;
  } else if (isGraduation) {
    return `Hyper-realistic cinematic photograph. Subject: ONE proud martial artist holding up a new colored belt, triumphant expression, in a crisp white gi. Dramatic spotlight from above, dark background, celebratory atmosphere. Achievement and pride energy. ${baseStyle}`;
  } else if (isDemo || isOpenHouse) {
    return `Hyper-realistic cinematic photograph. Subject: ONE skilled martial artist (adult or teen) performing an impressive flying kick or acrobatic technique in a dojo, dramatic lighting, audience silhouettes in background. Showcase and demonstration energy. ${baseStyle}`;
  }

  // ── MARTIAL ARTS PROGRAM PROMPTS ─────────────────────────────────────────────
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

// ── buildFullFlyerPrompt ──────────────────────────────────────────────────────
// Builds a comprehensive Imagen prompt that instructs the AI to render the
// ENTIRE flyer as a single image — text, layout, QR code, logo area, and
// cinematic background all baked into one image.
export function buildFullFlyerPrompt(flyerData: FlyerData): string {
  const {
    programName,
    eventSubtitle,
    eventDate,
    eventTime,
    schoolName,
    phone,
    website,
    primaryColor,
    benefits = [],
    callToAction,
    offer,
    audience,
    size = "flyer",
  } = flyerData;

  const primary = primaryColor || "#C8102E";
  const lp = programName.toLowerCase();
  const isNerfEvent = lp.includes("nerf");
  const isBirthdayEvent = lp.includes("birthday");
  const isTournamentEvent = lp.includes("tournament") || lp.includes("championship");
  const isSummerCamp = lp.includes("summer camp") || lp.includes("camp");
  const isGraduation = lp.includes("graduation") || lp.includes("belt ceremony");
  const isOpenHouse = lp.includes("open house") || lp.includes("grand opening");
  const isToddler = lp.includes("little ninja") || lp.includes("tiny ninja") || lp.includes("lil ninja");
  const isKids = lp.includes("warrior kid") || lp.includes("junior") || lp.includes("kids");
  const isTeen = lp.includes("teen") || lp.includes("warrior teen");
  const isKickboxing = lp.includes("kickbox") || lp.includes("kick box");
  const isBJJ = lp.includes("bjj") || lp.includes("jiu jitsu") || lp.includes("grappling");

  // ── Scene description based on event type ──────────────────────────────────
  let sceneDescription: string;
  if (isNerfEvent) {
    sceneDescription = `PHOTOREALISTIC BACKGROUND SCENE (fills entire image behind text layers):
A group of 4-6 joyful children aged 6-12 wearing BLACK MARTIAL ARTS UNIFORMS (karate gis) and colorful safety goggles, holding Nerf blasters and laughing mid-battle inside a professional martial arts dojo. The dojo has black padded floor mats with orange trim, wall-mounted mirrors, Japanese calligraphy scrolls on the walls, and proper dojo lighting. Foam darts are flying through the air. The children are diverse and full of energy. The scene is photographed with a wide-angle lens showing the full dojo interior. Cinematic orange and electric blue rim lighting with dramatic depth of field. The background fills the entire image from edge to edge with the children spread across the frame.`;
  } else if (isBirthdayEvent) {
    sceneDescription = `PHOTOREALISTIC BACKGROUND SCENE: A festive martial arts birthday party inside a professional dojo. Children in karate gis with party hats, colorful balloons, confetti, and a birthday cake. Warm golden party lighting with bokeh effects. The dojo has padded mats and the scene is full of joy and celebration. Wide-angle shot showing the full dojo space.`;
  } else if (isTournamentEvent) {
    sceneDescription = `PHOTOREALISTIC BACKGROUND SCENE: A dramatic martial arts tournament arena with professional competition mats, bright arena spotlights, and audience silhouettes in the background. Two competitors in white gis facing off in the center. Intense dramatic lighting with deep shadows and bright spotlights. Championship energy throughout the frame.`;
  } else if (isSummerCamp) {
    sceneDescription = `PHOTOREALISTIC BACKGROUND SCENE: A large group of energetic children aged 6-14 in white and black karate gis training together in a bright, professional martial arts dojo. Summer sunlight streaming through windows. The children are smiling and performing synchronized martial arts moves. Vibrant, energetic atmosphere.`;
  } else if (isGraduation) {
    sceneDescription = `PHOTOREALISTIC BACKGROUND SCENE: A proud young martial artist in a crisp white gi holding up a new colored belt in triumph under a dramatic spotlight. Dark ceremonial background with warm golden light. Other students and parents watching in the background. Achievement and pride energy throughout.`;
  } else if (isOpenHouse) {
    sceneDescription = `PHOTOREALISTIC BACKGROUND SCENE: A beautiful, professional martial arts dojo with students training, instructors demonstrating techniques, and a welcoming open atmosphere. Clean professional lighting, padded mats, mirrors, and a modern dojo interior. Families watching from the sides.`;
  } else if (isToddler) {
    sceneDescription = `PHOTOREALISTIC BACKGROUND SCENE: ONE adorable toddler child aged 3-5 years old in a pristine white karate gi with white belt, performing an energetic forward punch with a fierce excited expression. Dark cinematic background with deep red glowing energy, floating ember particles, volumetric smoke, dramatic red rim lighting from behind. The child is positioned on the right side of the image, facing slightly left.`;
  } else if (isKids) {
    sceneDescription = `PHOTOREALISTIC BACKGROUND SCENE: ONE child aged 8-10 years old in a white karate gi with a colored belt, performing a powerful side kick with an intense focused expression. Dark cinematic background with deep red and orange glowing energy, ember particles, dramatic rim lighting. The child is positioned on the right side of the image.`;
  } else if (isTeen) {
    sceneDescription = `PHOTOREALISTIC BACKGROUND SCENE: ONE teenager aged 15-16 years old in a black or white karate gi, performing a powerful high kick with intense determined expression. Dark cinematic background with deep red glowing energy, ember particles, dramatic rim lighting. The teen is positioned on the right side of the image.`;
  } else if (isKickboxing) {
    sceneDescription = `PHOTOREALISTIC BACKGROUND SCENE: ONE powerful athletic adult in kickboxing gear executing a devastating high roundhouse kick. Dark cinematic background with red energy glow, ember particles, dramatic rim lighting. The athlete is positioned on the right side of the image.`;
  } else if (isBJJ) {
    sceneDescription = `PHOTOREALISTIC BACKGROUND SCENE: ONE BJJ practitioner in a white gi performing a dominant ground control position, intense focused expression. Dark cinematic dojo background with subtle blue-red energy lighting. The practitioner is positioned on the right side of the image.`;
  } else {
    sceneDescription = `PHOTOREALISTIC BACKGROUND SCENE: ONE martial artist in a clean white karate gi performing a powerful dynamic kick or punch with intense determined expression. Dark cinematic background with deep red glowing energy, floating ember particles, volumetric smoke, dramatic red rim lighting. The martial artist is positioned on the right side of the image.`;
  }

  // ── Text content assembly ──────────────────────────────────────────────────
  const benefitLines = benefits.slice(0, 4).map((b: string) => {
    const parts = b.split("|");
    return parts[0].trim();
  });

  const ctaText = callToAction || offer || "FREE TRIAL CLASS";
  const contactLine = [phone, website].filter(Boolean).join("  •  ");

  const formatLabel = size === "instagram_story" ? "vertical 9:16 Instagram story"
    : size === "instagram_post" ? "square 1:1 Instagram post"
    : size === "facebook_ad" ? "vertical Facebook ad"
    : "vertical 8.5x11 flyer poster";

  const schoolUpper = (schoolName || "MY DOJO").toUpperCase();
  const programUpper = programName.toUpperCase();
  const ctaUpper = ctaText.toUpperCase();

  // Build the headline block — up to 3 layers: program name, subtitle, date
  const headlineLayer1 = programUpper;  // e.g. "NERF WARS"
  const headlineLayer2 = eventSubtitle || null;  // e.g. "PARENTS NIGHT OUT"
  const headlineLayer3 = eventDate || null;  // e.g. "JUNE 10TH"

  const benefitBullets = benefitLines.map((b: string) => `   • ${b}`).join("\n");
  const dateTimeLine = [eventDate, eventTime].filter(Boolean).join(" · ");
  const audienceLine = audience ? `\n   • ${audience}` : "";

  // Build the multi-layer headline description
  let headlineBlock: string;
  if (headlineLayer2 && headlineLayer3) {
    headlineBlock = `HEADLINE — THREE STACKED LAYERS (most dominant visual element, top 40% of image):
   LAYER 1 (largest): "${headlineLayer1}"
   - MASSIVE 3D EXTRUDED METALLIC LETTERS in glowing orange-gold (#FF6B00) with chrome highlights
   - Ultra-bold condensed font (Impact/Oswald style), fills the full width of the flyer
   - Deep drop shadow, glowing halo behind letters, beveled 3D extrusion going down-right
   
   LAYER 2 (second largest): "${headlineLayer2}"
   - LARGE bold silver/white metallic letters, slightly smaller than Layer 1
   - Same 3D extrusion style but silver/steel color with dark grey shadow
   - Centered below Layer 1
   
   LAYER 3 (date banner): "${headlineLayer3}"
   - Bold text inside a dark rectangular banner/badge with glowing orange border
   - Orange-gold color with metallic finish, centered below Layer 2
   - Clearly readable, prominent but smaller than Layers 1 and 2`;
  } else if (headlineLayer2) {
    headlineBlock = `HEADLINE — TWO STACKED LAYERS (most dominant visual element, top 40% of image):
   LAYER 1 (largest): "${headlineLayer1}"
   - MASSIVE 3D EXTRUDED METALLIC LETTERS in glowing orange-gold with chrome highlights
   - Ultra-bold condensed font, fills the full width of the flyer
   - Deep drop shadow, glowing halo, beveled 3D extrusion
   
   LAYER 2: "${headlineLayer2}"
   - LARGE bold silver/white metallic letters, centered below Layer 1
   - Same 3D extrusion style but silver/steel color`;
  } else {
    headlineBlock = `HEADLINE (most dominant visual element, top 40% of image):
   Text: "${headlineLayer1}"
   - MASSIVE 3D EXTRUDED METALLIC LETTERS in glowing orange-gold (#FF6B00) with chrome highlights
   - Ultra-bold condensed font (Impact/Oswald style), fills the full width of the flyer
   - Deep drop shadow, glowing halo behind letters, beveled 3D extrusion going down-right`;
  }

  return `Create a COMPLETE, PRINT-READY promotional event flyer as a single fully-rendered image. Format: ${formatLabel}.

CRITICAL REQUIREMENT: This is the COMPLETE FINISHED FLYER — not a background image. ALL text, layout elements, and graphics must be rendered directly into the image as if professionally typeset and printed. Every text element listed below MUST appear in the final image exactly as specified.

═══════════════════════════════════════════
BACKGROUND / SCENE
═══════════════════════════════════════════
${sceneDescription}

═══════════════════════════════════════════
FLYER LAYOUT — TOP TO BOTTOM
═══════════════════════════════════════════

[ZONE 1 — TOP HEADER, top 8% of image]
- School/brand name: "${schoolUpper}"
- Style: Bold white sans-serif text, centered, on a semi-transparent dark strip
- Size: Small-medium, clearly readable

[ZONE 2 — MAIN HEADLINE, 8% to 50% of image height]
${headlineBlock}

[ZONE 3 — BENEFITS SECTION, 50% to 75% of image height]
- Semi-transparent dark overlay panel covering the lower portion of the image
- Benefits list with bullet points, white bold text:
${benefitBullets}${audienceLine}
- Each bullet point on its own line, left-aligned
- Font: Clean bold sans-serif, clearly legible

[ZONE 4 — CALL TO ACTION, 72% to 82% of image height]
- Text: "${ctaUpper}"
- Style: Large bold white or gold text, centered, on a dark panel
- This should be the second most prominent text after the headline

[ZONE 5 — BOTTOM CONTACT STRIP, bottom 15% of image]
- Full-width dark semi-transparent horizontal bar
- LEFT SIDE: A black-and-white QR code square (approximately 80x80 pixels)
- NEXT TO QR CODE: Small white text "SCAN TO REGISTER"
- RIGHT SIDE: "${contactLine}" in white bold text
- The QR code must look like a real functional QR code with the characteristic square pattern

═══════════════════════════════════════════
QUALITY & STYLE REQUIREMENTS
═══════════════════════════════════════════
- ALL human figures: photorealistic cinematic photography — NO cartoons, NO illustrations, NO anime
- Color palette: Dark near-black background, orange-gold (#FF6B00) and white as primary text colors
- Professional print-quality — this should look like a $500+ agency design
- High contrast: every text element must be clearly legible against the background
- Cinematic lighting: deep shadows, rim lighting, volumetric effects
- Print-ready sharpness: no blur, no artifacts, clean crisp edges on all text

═══════════════════════════════════════════
NON-NEGOTIABLE ELEMENTS (ALL must appear)
═══════════════════════════════════════════
✓ "${schoolUpper}" at the very top
✓ "${headlineLayer1}" as massive 3D metallic letters${headlineLayer2 ? `\n✓ "${headlineLayer2}" as large metallic subtitle` : ""}${headlineLayer3 ? `\n✓ "${headlineLayer3}" as date banner` : ""}
✓ All ${benefitLines.length} benefit bullet points
✓ "${ctaUpper}" as call to action
✓ A QR code square in the bottom-left area
✓ "${contactLine}" contact info at the bottom
✗ NO placeholder text, NO lorem ipsum, NO template artifacts
✗ NO cartoons or illustrations — photorealistic photography only`;
}

// ── generateQrCodeDataUrl (exported for use in kaiCreativeRouter) ─────────────
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
