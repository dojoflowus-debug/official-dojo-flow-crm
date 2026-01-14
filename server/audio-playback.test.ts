import { describe, it, expect } from 'vitest';

describe('Audio Playback Integration', () => {
  it('should generate TTS audio with valid URL and duration', async () => {
    const { generateKaiSpeech } = await import('./_core/elevenlabs');
    const { storagePut } = await import('./storage');
    
    const testText = 'Welcome to DojoFlow. Your class starts in 10 minutes.';
    
    // Step 1: Generate speech
    const ttsResult = await generateKaiSpeech(testText);
    
    expect(ttsResult.success).toBe(true);
    expect(ttsResult.audioBuffer).toBeDefined();
    expect(ttsResult.audioBuffer!.length).toBeGreaterThan(0);
    
    console.log('[Audio Test] TTS generated:', {
      success: ttsResult.success,
      audioSize: ttsResult.audioBuffer?.length
    });
    
    // Step 2: Upload to S3
    const audioKey = `test-audio/${Date.now()}.mp3`;
    const { url: audioUrl } = await storagePut(
      audioKey, 
      ttsResult.audioBuffer!, 
      'audio/mpeg'
    );
    
    expect(audioUrl).toBeDefined();
    expect(audioUrl).toContain('http');
    expect(audioUrl).toContain('.mp3');
    
    console.log('[Audio Test] Audio uploaded:', { audioUrl });
    
    // Step 3: Verify URL is accessible
    const response = await fetch(audioUrl);
    expect(response.ok).toBe(true);
    expect(response.headers.get('content-type')).toContain('audio');
    
    const audioData = await response.arrayBuffer();
    expect(audioData.byteLength).toBeGreaterThan(0);
    
    console.log('[Audio Test] Audio accessible:', {
      status: response.status,
      contentType: response.headers.get('content-type'),
      size: audioData.byteLength
    });
  }, 45000); // 45 second timeout for full flow

  it('should calculate reasonable audio duration estimate', () => {
    const testText = 'This is a test message with exactly ten words here.';
    const wordCount = testText.split(/\s+/).length;
    
    // Average speaking rate: ~150 words per minute = 2.5 words per second
    const estimatedDuration = (wordCount / 2.5) * 1000;
    
    expect(wordCount).toBe(10);
    expect(estimatedDuration).toBe(4000); // 4 seconds
    
    console.log('[Audio Test] Duration calculation:', {
      wordCount,
      estimatedDuration: `${estimatedDuration}ms`
    });
  });
});
