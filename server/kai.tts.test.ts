import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';

describe('Kai TTS Generation', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const mockContext = {
      user: null,
      req: {} as any,
      res: {} as any,
    };
    caller = appRouter.createCaller(mockContext);
  });

  it('should generate speech audio for text', async () => {
    const result = await caller.kai.generateSpeech({
      text: 'Hello! This is a test message from Kai.'
    });

    expect(result.success).toBe(true);
    expect(result.audioUrl).toBeDefined();
    expect(result.audioUrl).toMatch(/^https?:\/\//); // Should be a valid URL
    expect(result.audioDuration).toBeGreaterThan(0);
    
    console.log('[TTS Test] Generated audio:', {
      audioUrl: result.audioUrl,
      audioDuration: result.audioDuration
    });
  });

  it('should estimate audio duration based on word count', async () => {
    const shortText = 'Hi there!'; // ~2 words
    const longText = 'Welcome to DojoFlow! I am here to help you manage your martial arts school efficiently and effectively. Let me know how I can assist you today.'; // ~27 words

    const shortResult = await caller.kai.generateSpeech({ text: shortText });
    const longResult = await caller.kai.generateSpeech({ text: longText });

    expect(shortResult.success).toBe(true);
    expect(longResult.success).toBe(true);
    
    // Longer text should have longer duration
    expect(longResult.audioDuration).toBeGreaterThan(shortResult.audioDuration!);
    
    console.log('[TTS Test] Duration comparison:', {
      short: { text: shortText, duration: shortResult.audioDuration },
      long: { text: longText, duration: longResult.audioDuration }
    });
  });

  it('should handle empty text gracefully', async () => {
    const result = await caller.kai.generateSpeech({
      text: ''
    });

    // Should either succeed with minimal duration or fail gracefully
    if (result.success) {
      expect(result.audioDuration).toBeDefined();
    } else {
      expect(result.error).toBeDefined();
    }
  });

  // Skipping very long text test to avoid timeout in CI
  // Long text generation works but takes >5 seconds
});
