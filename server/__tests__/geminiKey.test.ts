/**
 * Gemini API Key Validation Test
 * Verifies the GEMINI_API_KEY is present and the SDK initializes without error.
 * Does NOT make a real API call (no cost, no network required).
 */
import { describe, it, expect } from "vitest";

describe("Gemini API Key", () => {
  it("GEMINI_API_KEY is set in environment", () => {
    const key = process.env.GEMINI_API_KEY;
    expect(key).toBeDefined();
    expect(typeof key).toBe("string");
    expect(key!.length).toBeGreaterThan(10);
  });

  it("@google/genai SDK can be imported and initialized", async () => {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    expect(ai).toBeDefined();
    // models property should exist on the client
    expect(typeof ai.models).toBe("object");
  });
});
