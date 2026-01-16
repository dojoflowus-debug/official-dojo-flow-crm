/**
 * OpenAI API Key Validation Test
 * Verifies that OPENAI_API_KEY is configured and working
 */

import { describe, it, expect } from 'vitest';

describe('OpenAI Integration', () => {
  it('should have OPENAI_API_KEY configured', () => {
    const key = process.env.OPENAI_API_KEY;
    expect(key).toBeDefined();
    expect(key?.length).toBeGreaterThan(0);
    expect(key).toMatch(/^sk-/); // OpenAI keys start with sk-
  });

  it('should validate OpenAI API key format', () => {
    const key = process.env.OPENAI_API_KEY;
    // OpenAI API keys are typically 48+ characters starting with sk-
    expect(key).toMatch(/^sk-[A-Za-z0-9-]{20,}$/);
  });

  it('should be able to call OpenAI API', async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    } catch (error) {
      throw new Error(`OpenAI API call failed: ${error}`);
    }
  });

  it('should be able to create a chat completion', async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: 'Say "OpenAI is working" and nothing else.',
            },
          ],
          max_tokens: 10,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.choices).toBeDefined();
      expect(data.choices[0].message.content).toContain('OpenAI');
    } catch (error) {
      throw new Error(`OpenAI chat completion failed: ${error}`);
    }
  });
});
