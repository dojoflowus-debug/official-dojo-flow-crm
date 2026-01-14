import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ElevenLabs Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set up environment variables for tests
    process.env.ELEVENLABS_API_KEY = 'test_elevenlabs_key';
  });

  describe('textToSpeech', () => {
    it('should generate speech successfully', async () => {
      const mockAudioData = new ArrayBuffer(1024);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockAudioData
      });

      // Dynamic import to get fresh module with mocked env
      const { textToSpeech, VOICES } = await import('./_core/elevenlabs');
      
      const result = await textToSpeech({
        text: 'Welcome to DojoFlow!',
        voiceId: VOICES.RACHEL
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.elevenlabs.io/v1/text-to-speech'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'xi-api-key': 'test_elevenlabs_key'
          })
        })
      );
      expect(result.success).toBe(true);
      expect(result.audioBuffer).toBeDefined();
      expect(result.audioBase64).toBeDefined();
    });

    it('should use default voice when not specified', async () => {
      const mockAudioData = new ArrayBuffer(512);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockAudioData
      });

      const { textToSpeech, VOICES } = await import('./_core/elevenlabs');
      
      await textToSpeech({
        text: 'Test message'
      });

      // Should use RACHEL as default
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(VOICES.RACHEL),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Invalid API key'
      });

      const { textToSpeech } = await import('./_core/elevenlabs');
      
      const result = await textToSpeech({
        text: 'Test message'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
    });
  });

  describe('getVoices', () => {
    it('should fetch available voices', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          voices: [
            { voice_id: 'voice1', name: 'Voice 1', category: 'premade', labels: {} },
            { voice_id: 'voice2', name: 'Voice 2', category: 'cloned', labels: {} }
          ]
        })
      });

      const { getVoices } = await import('./_core/elevenlabs');
      
      const result = await getVoices();

      expect(result.success).toBe(true);
      expect(result.voices).toHaveLength(2);
      expect(result.voices?.[0].name).toBe('Voice 1');
    });
  });

  describe('generateKaiSpeech', () => {
    it('should generate speech with Kai-specific settings', async () => {
      const mockAudioData = new ArrayBuffer(2048);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockAudioData
      });

      const { generateKaiSpeech } = await import('./_core/elevenlabs');
      
      const result = await generateKaiSpeech('Hello, I am Kai, your dojo assistant.');

      expect(result.success).toBe(true);
      
      // Verify voice settings were passed
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.voice_settings.stability).toBe(0.6);
      expect(body.voice_settings.similarity_boost).toBe(0.8);
    });
  });
});
