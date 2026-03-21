/**
 * Kai Tutorial Utilities
 *
 * Low-level DOM helpers that match the production spec:
 *
 *   highlight(selector)        — add glowing ring + backdrop dimming
 *   pulse(selector)            — add pulsing animation to an element
 *   arrow(selector, position)  — inject a floating arrow pointing at an element
 *   tooltip(selector, text)    — show a tooltip near an element
 *   clearGuidance()            — remove all injected guidance elements
 *   waitForClick(selector, cb) — fire cb when user clicks the element
 *   waitForSubmit(selector, cb)— fire cb when user submits the form
 *
 * These are intentionally imperative so the tutorial engine can call them
 * directly without React re-renders.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const HIGHLIGHT_CLASS = "__kai-highlight__";
const PULSE_CLASS = "__kai-pulse__";
const ARROW_ID = "__kai-arrow__";
const TOOLTIP_ID = "__kai-tooltip__";
const OVERLAY_ID = "__kai-overlay__";

const BRAND_RED = "#FF4C4C";
const BRAND_DARK = "#1a1a2e";

// ─── Inject global styles once ────────────────────────────────────────────────

function ensureStyles() {
  if (document.getElementById("__kai-tutorial-styles__")) return;
  const style = document.createElement("style");
  style.id = "__kai-tutorial-styles__";
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      position: relative;
      z-index: 9991 !important;
      outline: 2px solid ${BRAND_RED} !important;
      outline-offset: 4px !important;
      border-radius: 8px !important;
      box-shadow: 0 0 0 4px rgba(255,76,76,0.2), 0 0 20px rgba(255,76,76,0.35) !important;
      transition: box-shadow 0.3s ease, outline 0.3s ease !important;
    }
    @keyframes __kai-pulse-ring__ {
      0%   { box-shadow: 0 0 0 0 rgba(255,76,76,0.5); }
      70%  { box-shadow: 0 0 0 12px rgba(255,76,76,0); }
      100% { box-shadow: 0 0 0 0 rgba(255,76,76,0); }
    }
    .${PULSE_CLASS} {
      animation: __kai-pulse-ring__ 1.4s ease-out infinite !important;
    }
    #${OVERLAY_ID} {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      z-index: 9989;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }
    #${ARROW_ID} {
      position: fixed;
      z-index: 9993;
      pointer-events: none;
      animation: __kai-arrow-bounce__ 0.8s ease-in-out infinite alternate;
    }
    @keyframes __kai-arrow-bounce__ {
      from { transform: translateY(0); }
      to   { transform: translateY(-6px); }
    }
    #${TOOLTIP_ID} {
      position: fixed;
      z-index: 9994;
      max-width: 280px;
      background: linear-gradient(135deg, ${BRAND_DARK} 0%, #16213e 100%);
      border: 1px solid rgba(255,76,76,0.35);
      border-radius: 14px;
      padding: 12px 16px;
      color: rgba(255,255,255,0.9);
      font-size: 13px;
      line-height: 1.5;
      font-family: inherit;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

function showOverlay() {
  ensureStyles();
  if (!document.getElementById(OVERLAY_ID)) {
    const el = document.createElement("div");
    el.id = OVERLAY_ID;
    document.body.appendChild(el);
  }
}

function hideOverlay() {
  document.getElementById(OVERLAY_ID)?.remove();
}

// ─── highlight ────────────────────────────────────────────────────────────────

/**
 * Add a glowing red ring around the target element and dim the background.
 * Returns a cleanup function.
 */
export function highlight(selector: string): () => void {
  ensureStyles();
  showOverlay();
  const el = document.querySelector(selector) as HTMLElement | null;
  if (el) {
    el.classList.add(HIGHLIGHT_CLASS);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return () => {
    el?.classList.remove(HIGHLIGHT_CLASS);
    hideOverlay();
  };
}

// ─── pulse ────────────────────────────────────────────────────────────────────

/**
 * Add a pulsing ring animation to the target element.
 * Returns a cleanup function.
 */
export function pulse(selector: string): () => void {
  ensureStyles();
  const el = document.querySelector(selector) as HTMLElement | null;
  if (el) el.classList.add(PULSE_CLASS);
  return () => el?.classList.remove(PULSE_CLASS);
}

// ─── arrow ────────────────────────────────────────────────────────────────────

/**
 * Inject a floating arrow pointing at the target element.
 * position: "above" | "below" | "left" | "right"
 * Returns a cleanup function.
 */
export function arrow(
  selector: string,
  position: "above" | "below" | "left" | "right" = "above"
): () => void {
  ensureStyles();
  clearArrow();

  const el = document.querySelector(selector);
  if (!el) return () => {};

  const r = el.getBoundingClientRect();
  const arrowEl = document.createElement("div");
  arrowEl.id = ARROW_ID;

  const ARROW_SIZE = 24;
  const GAP = 8;

  let top = 0;
  let left = 0;
  let rotation = 0;

  switch (position) {
    case "above":
      top = r.top - ARROW_SIZE - GAP;
      left = r.left + r.width / 2 - ARROW_SIZE / 2;
      rotation = 180; // pointing down
      break;
    case "below":
      top = r.bottom + GAP;
      left = r.left + r.width / 2 - ARROW_SIZE / 2;
      rotation = 0; // pointing up
      break;
    case "left":
      top = r.top + r.height / 2 - ARROW_SIZE / 2;
      left = r.left - ARROW_SIZE - GAP;
      rotation = 90; // pointing right
      break;
    case "right":
      top = r.top + r.height / 2 - ARROW_SIZE / 2;
      left = r.right + GAP;
      rotation = -90; // pointing left
      break;
  }

  arrowEl.style.cssText = `top:${top}px;left:${left}px;`;
  arrowEl.innerHTML = `
    <svg width="${ARROW_SIZE}" height="${ARROW_SIZE}" viewBox="0 0 24 24" 
         style="transform:rotate(${rotation}deg);filter:drop-shadow(0 0 6px rgba(255,76,76,0.7))">
      <path d="M12 2L4 10h5v12h6V10h5L12 2z" fill="${BRAND_RED}"/>
    </svg>
  `;
  document.body.appendChild(arrowEl);

  return () => clearArrow();
}

function clearArrow() {
  document.getElementById(ARROW_ID)?.remove();
}

// ─── tooltip ──────────────────────────────────────────────────────────────────

/**
 * Show a simple tooltip near the target element.
 * Returns a cleanup function.
 */
export function tooltip(
  selector: string,
  text: string,
  position: "top" | "bottom" | "left" | "right" = "bottom"
): () => void {
  ensureStyles();
  clearTooltip();

  const el = document.querySelector(selector);
  if (!el) return () => {};

  const r = el.getBoundingClientRect();
  const tipEl = document.createElement("div");
  tipEl.id = TOOLTIP_ID;
  tipEl.textContent = text;
  document.body.appendChild(tipEl);

  // Position after paint so we can measure
  requestAnimationFrame(() => {
    const tipR = tipEl.getBoundingClientRect();
    const GAP = 12;
    let top = 0;
    let left = 0;

    switch (position) {
      case "bottom":
        top = r.bottom + GAP;
        left = r.left + r.width / 2 - tipR.width / 2;
        break;
      case "top":
        top = r.top - tipR.height - GAP;
        left = r.left + r.width / 2 - tipR.width / 2;
        break;
      case "left":
        top = r.top + r.height / 2 - tipR.height / 2;
        left = r.left - tipR.width - GAP;
        break;
      case "right":
        top = r.top + r.height / 2 - tipR.height / 2;
        left = r.right + GAP;
        break;
    }

    // Clamp
    left = Math.max(8, Math.min(left, window.innerWidth - tipR.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - tipR.height - 8));

    tipEl.style.top = `${top}px`;
    tipEl.style.left = `${left}px`;
  });

  return () => clearTooltip();
}

function clearTooltip() {
  document.getElementById(TOOLTIP_ID)?.remove();
}

// ─── clearGuidance ────────────────────────────────────────────────────────────

/**
 * Remove all injected guidance elements from the DOM.
 */
export function clearGuidance() {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
    el.classList.remove(HIGHLIGHT_CLASS);
  });
  document.querySelectorAll(`.${PULSE_CLASS}`).forEach((el) => {
    el.classList.remove(PULSE_CLASS);
  });
  clearArrow();
  clearTooltip();
  hideOverlay();
}

// ─── waitForClick ─────────────────────────────────────────────────────────────

/**
 * Fire `callback` the next time the user clicks the target element.
 * Returns a cleanup function that removes the listener.
 */
export function waitForClick(
  selector: string,
  callback: () => void
): () => void {
  const el = document.querySelector(selector);
  if (!el) return () => {};

  const handler = () => {
    el.removeEventListener("click", handler);
    callback();
  };
  el.addEventListener("click", handler);
  return () => el.removeEventListener("click", handler);
}

// ─── waitForSubmit ────────────────────────────────────────────────────────────

/**
 * Fire `callback` the next time the target form is submitted.
 * Returns a cleanup function that removes the listener.
 */
export function waitForSubmit(
  selector: string,
  callback: () => void
): () => void {
  const form = document.querySelector(selector) as HTMLFormElement | null;
  if (!form) return () => {};

  const handler = (e: Event) => {
    // Don't prevent default — just observe
    form.removeEventListener("submit", handler);
    callback();
  };
  form.addEventListener("submit", handler);
  return () => form.removeEventListener("submit", handler);
}
