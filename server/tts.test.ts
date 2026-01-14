import { describe, it, expect } from 'vitest';
import { generateKaiSpeech } from './_core/elevenlabs';

describe('TTS Audio Generation', () => {
  it('should generate speech audio successfully', async () => {
    const testText = 'Hello, this is a test of the text-to-speech system.';
    
    const result = await generateKaiSpeech(testText);
    
    console.log('[TTS Test] Result:', {
      success: result.success,
      hasAudioBuffer: !!result.audioBuffer,
      audioBufferSize: result.audioBuffer?.length,
      error: result.error
    });
    
    expect(result.success).toBe(true);
    expect(result.audioBuffer).toBeDefined();
    expect(result.audioBuffer!.length).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for API call

  it('should handle missing API key gracefully', async () => {
    // Save original key
    const originalKey = process.env.ELEVENLABS_API_KEY;
    
    // Temporarily remove key
    delete process.env.ELEVENLABS_API_KEY;
    
    const result = await generateKaiSpeech('Test');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('API key');
    
    // Restore key
    if (originalKey) {
      process.env.ELEVENLABS_API_KEY = originalKey;
    }
  });
});
