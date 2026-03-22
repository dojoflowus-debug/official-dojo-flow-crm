/**
 * Tests for the Hard Execution Gate in creativeBriefEngine
 *
 * Verifies that:
 *   1. canGenerate is false unless ALL THREE fields are confirmed
 *   2. programConfirmed, audienceConfirmed, keyContentConfirmed are independent
 *   3. fastMode cannot bypass required fields
 *   4. missingFields correctly identifies what's missing
 *   5. A program with a built-in age range satisfies audienceConfirmed
 *   6. A context phone number satisfies keyContentConfirmed
 */
import { describe, it, expect } from "vitest";
import { analyzeBrief } from "../creativeBriefEngine";
import type { BusinessContext } from "../contextInjectionEngine";

// Minimal context with no data — worst case
const emptyContext: BusinessContext = {
  schoolName: null,
  phone: null,
  email: null,
  website: null,
  address: null,
  tagline: null,
  logoUrl: null,
  logoLightUrl: null,
  logoDarkUrl: null,
  primaryColor: null,
  secondaryColor: null,
  accentColor: null,
  brandTone: null,
  brandVoice: null,
  designEnergy: null,
  visualStyle: null,
  primaryAudience: null,
  ageRangeMin: null,
  ageRangeMax: null,
  programs: [],
};

// Context with phone — keyContentConfirmed should be auto-satisfied
const contextWithPhone: BusinessContext = {
  ...emptyContext,
  schoolName: "Dragon's Den Martial Arts",
  phone: "555-123-4567",
};

// Context with a program that has an age range
const contextWithPrograms: BusinessContext = {
  ...emptyContext,
  programs: [
    { id: 1, name: "Little Ninjas", ageRange: "Ages 3–6", description: null, type: "kids" },
    { id: 2, name: "Adult Karate", ageRange: null, description: null, type: "adult" },
  ],
};

describe("creativeBriefEngine — Hard Execution Gate", () => {

  // ── canGenerate must be false when nothing is provided ──────────────────

  it("canGenerate is false with empty prompt and no context", () => {
    const result = analyzeBrief("", emptyContext, {}, false);
    expect(result.canGenerate).toBe(false);
    expect(result.isComplete).toBe(false);
  });

  it("canGenerate is false with only program confirmed", () => {
    const result = analyzeBrief("", emptyContext, { program: "Kickboxing" }, false);
    expect(result.programConfirmed).toBe(true);
    expect(result.audienceConfirmed).toBe(false);
    expect(result.keyContentConfirmed).toBe(false);
    expect(result.canGenerate).toBe(false);
    expect(result.missingFields).toContain("audience");
    expect(result.missingFields).toContain("key content");
  });

  it("canGenerate is false with program + audience but no key content", () => {
    const result = analyzeBrief("", emptyContext, {
      program: "Kickboxing",
      audience: "Adults 18+",
    }, false);
    expect(result.programConfirmed).toBe(true);
    expect(result.audienceConfirmed).toBe(true);
    expect(result.keyContentConfirmed).toBe(false);
    expect(result.canGenerate).toBe(false);
    expect(result.missingFields).toContain("key content");
    expect(result.missingFields).not.toContain("program");
    expect(result.missingFields).not.toContain("audience");
  });

  // ── canGenerate must be true when ALL THREE are confirmed ───────────────

  it("canGenerate is true when all three fields are answered", () => {
    const result = analyzeBrief("", emptyContext, {
      program: "Kickboxing",
      audience: "Adults 18+",
      content: "Call 555-0000 for a free trial",
    }, false);
    expect(result.programConfirmed).toBe(true);
    expect(result.audienceConfirmed).toBe(true);
    expect(result.keyContentConfirmed).toBe(true);
    expect(result.canGenerate).toBe(true);
    expect(result.isComplete).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  // ── fastMode CANNOT bypass required fields ──────────────────────────────

  it("fastMode does NOT bypass audience or key content requirements", () => {
    // fastMode=true with only program — should still be blocked
    const result = analyzeBrief("", emptyContext, { program: "Kickboxing" }, true);
    expect(result.canGenerate).toBe(false);
    expect(result.missingFields).toContain("audience");
    expect(result.missingFields).toContain("key content");
  });

  it("fastMode does NOT bypass key content when audience is also missing", () => {
    const result = analyzeBrief("kickboxing for adults", emptyContext, {}, true);
    // Even with program+audience in prompt, no phone/content = still blocked
    expect(result.keyContentConfirmed).toBe(false);
    expect(result.canGenerate).toBe(false);
  });

  // ── Context phone auto-satisfies keyContentConfirmed ───────────────────

  it("context phone auto-satisfies keyContentConfirmed", () => {
    const result = analyzeBrief("", contextWithPhone, {
      program: "Kickboxing",
      audience: "Adults 18+",
    }, false);
    expect(result.keyContentConfirmed).toBe(true);
    expect(result.canGenerate).toBe(true);
  });

  it("canGenerate is true with program+audience answers and context phone", () => {
    const result = analyzeBrief("create a flyer", contextWithPhone, {
      program: "Little Ninjas",
      audience: "Ages 3–5",
    }, false);
    expect(result.canGenerate).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  // ── Program with built-in age range auto-satisfies audienceConfirmed ────

  it("program with built-in age range auto-satisfies audienceConfirmed", () => {
    // Use context that has BOTH phone (for keyContent) AND programs with age ranges
    const contextWithProgramsAndPhone: BusinessContext = {
      ...contextWithPrograms,
      phone: "555-123-4567",
    };
    const result = analyzeBrief("", contextWithProgramsAndPhone, {
      program: "Little Ninjas",
      // no audience answer — but Little Ninjas has ageRange: "Ages 3–6"
    }, false);
    expect(result.programConfirmed).toBe(true);
    expect(result.audienceConfirmed).toBe(true); // auto-satisfied by program age range
    expect(result.keyContentConfirmed).toBe(true); // auto-satisfied by context phone
    expect(result.canGenerate).toBe(true);
  });

  it("program WITHOUT age range does NOT auto-satisfy audienceConfirmed", () => {
    // Use a context with a program that has no age range AND whose name doesn't
    // contain audience keywords (e.g. "Kickboxing" — no "adult", "kids", etc.)
    const contextWithKickboxingAndPhone: BusinessContext = {
      ...emptyContext,
      phone: "555-123-4567",
      programs: [
        { id: 1, name: "Kickboxing", ageRange: null, description: null, type: "general" },
      ],
    };
    const result = analyzeBrief("", contextWithKickboxingAndPhone, {
      program: "Kickboxing",
      // Kickboxing has ageRange: null — audience should NOT be auto-confirmed
    }, false);
    expect(result.programConfirmed).toBe(true);
    expect(result.audienceConfirmed).toBe(false); // no age range on this program
    expect(result.canGenerate).toBe(false);
  });

  // ── Prompt keywords can satisfy fields ─────────────────────────────────

  it("audience keyword in prompt satisfies audienceConfirmed", () => {
    const result = analyzeBrief("create a flyer for adults ages 18+", emptyContext, {
      program: "Kickboxing",
      content: "Call 555-9999",
    }, false);
    expect(result.audienceConfirmed).toBe(true);
    expect(result.canGenerate).toBe(true);
  });

  it("phone number in prompt satisfies keyContentConfirmed", () => {
    const result = analyzeBrief("create a flyer, call 555-1234 for details", emptyContext, {
      program: "Kickboxing",
      audience: "Adults 18+",
    }, false);
    expect(result.keyContentConfirmed).toBe(true);
    expect(result.canGenerate).toBe(true);
  });

  // ── missingFields accuracy ──────────────────────────────────────────────

  it("missingFields contains all three when nothing is provided", () => {
    const result = analyzeBrief("", emptyContext, {}, false);
    expect(result.missingFields).toContain("program");
    expect(result.missingFields).toContain("audience");
    expect(result.missingFields).toContain("key content");
  });

  it("missingFields is empty when canGenerate is true", () => {
    const result = analyzeBrief("", contextWithPhone, {
      program: "Kickboxing",
      audience: "Adults 18+",
    }, false);
    expect(result.canGenerate).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  // ── canGenerate and isComplete are always in sync ───────────────────────

  it("canGenerate and isComplete are always identical", () => {
    const cases = [
      analyzeBrief("", emptyContext, {}, false),
      analyzeBrief("", emptyContext, { program: "Kickboxing" }, false),
      analyzeBrief("", contextWithPhone, { program: "Kickboxing", audience: "Adults" }, false),
    ];
    for (const r of cases) {
      expect(r.canGenerate).toBe(r.isComplete);
    }
  });
});
