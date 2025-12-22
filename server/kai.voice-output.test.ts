import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';

describe('Kai Voice Output', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const mockContext = {
      user: null,
      req: {} as any,
      res: {} as any,
    };
    caller = appRouter.createCaller(mockContext);
  });

  it('should generate TTS audio and return accessible URL', async () => {
    
    const testText = 'Hello, this is a test of the voice output system.';
    
    const result = await caller.kai.generateSpeech({
      text: testText
    });
    
    console.log('[Voice Output Test] TTS Result:', {
      success: result.success,
      hasAudioUrl: !!result.audioUrl,
      audioDuration: result.audioDuration,
      error: result.error
    });
    
    // Verify TTS generation succeeded
    expect(result.success).toBe(true);
    expect(result.audioUrl).toBeDefined();
    expect(result.audioUrl).toMatch(/^https?:\/\//); // Should be a valid URL
    expect(result.audioDuration).toBeGreaterThan(0);
    
    // Verify audio URL is accessible
    if (result.audioUrl) {
      const response = await fetch(result.audioUrl);
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('audio');
      
      const audioBuffer = await response.arrayBuffer();
      expect(audioBuffer.byteLength).toBeGreaterThan(0);
      
      console.log('[Voice Output Test] Audio file verified:', {
        url: result.audioUrl,
        contentType: response.headers.get('content-type'),
        sizeBytes: audioBuffer.byteLength
      });
    }
  });
  
  it('should generate audio for longer text', async () => {
    
    const longText = `
      Welcome to DojoFlow. I can help you manage your martial arts school 
      with powerful analytics, student tracking, and automated workflows. 
      Let me know what you'd like to accomplish today.
    `.trim();
    
    const result = await caller.kai.generateSpeech({
      text: longText
    });
    
    expect(result.success).toBe(true);
    expect(result.audioUrl).toBeDefined();
    expect(result.audioDuration).toBeGreaterThan(5000); // Should be longer than 5 seconds
  });
  
  it('should handle TTS errors gracefully', async () => {
    
    // Test with empty text
    const result = await caller.kai.generateSpeech({
      text: ''
    });
    
    // Should either succeed with minimal audio or fail gracefully
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});
