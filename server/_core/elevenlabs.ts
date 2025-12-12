/**
 * ElevenLabs Voice Synthesis Helper Functions
 * 
 * This module provides helper functions for text-to-speech
 * using the ElevenLabs API.
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Default voice IDs from ElevenLabs
export const VOICES = {
  RACHEL: '21m00Tcm4TlvDq8ikWAM', // American female
  DOMI: 'AZnzlk1XvdvUeBnXmlld', // American female
  BELLA: 'EXAVITQu4vr4xnSDxMaL', // American female
  ANTONI: 'ErXwobaYiN019PkySvjV', // American male
  ELLI: 'MF3mGyEYCl7XYWbV9V6O', // American female
  JOSH: 'TxGEqnHWrfWFTfGW9XjX', // American male
  ARNOLD: 'VR6AewLTigWG4xSOukaG', // American male
  ADAM: 'pNInz6obpgDQGcFmaJgB', // American male
  SAM: 'yoZ06aMxZJJ28mfd3POQ', // American male
} as const;

interface TextToSpeechOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
  stability?: number; // 0-1, default 0.5
  similarityBoost?: number; // 0-1, default 0.75
  style?: number; // 0-1, default 0
  useSpeakerBoost?: boolean;
}

interface TextToSpeechResult {
  success: boolean;
  audioBuffer?: Buffer;
  audioBase64?: string;
  error?: string;
}

interface VoiceInfo {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
}

interface GetVoicesResult {
  success: boolean;
  voices?: VoiceInfo[];
  error?: string;
}

/**
 * Convert text to speech using ElevenLabs
 * 
 * @param options - TTS options including text and voice settings
 * @returns Promise with audio buffer
 * 
 * @example
 * const result = await textToSpeech({
 *   text: 'Welcome to DojoFlow! Your class starts in 10 minutes.',
 *   voiceId: VOICES.RACHEL
 * });
 * 
 * if (result.success && result.audioBuffer) {
 *   // Save to file or stream to client
 *   fs.writeFileSync('output.mp3', result.audioBuffer);
 * }
 */
export async function textToSpeech(options: TextToSpeechOptions): Promise<TextToSpeechResult> {
  if (!ELEVENLABS_API_KEY) {
    console.error('[ElevenLabs] Missing API key');
    return {
      success: false,
      error: 'ElevenLabs API key not configured'
    };
  }

  const voiceId = options.voiceId || VOICES.RACHEL;
  const modelId = options.modelId || 'eleven_monolingual_v1';

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: options.text,
        model_id: modelId,
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75,
          style: options.style ?? 0,
          use_speaker_boost: options.useSpeakerBoost ?? true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs] TTS failed:', response.status, errorText);
      return {
        success: false,
        error: `Failed to generate speech: ${response.status}`
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    const audioBase64 = audioBuffer.toString('base64');

    console.log('[ElevenLabs] Speech generated successfully, size:', audioBuffer.length);
    
    return {
      success: true,
      audioBuffer,
      audioBase64
    };
  } catch (error) {
    console.error('[ElevenLabs] TTS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get available voices from ElevenLabs
 * 
 * @returns Promise with list of available voices
 */
export async function getVoices(): Promise<GetVoicesResult> {
  if (!ELEVENLABS_API_KEY) {
    console.error('[ElevenLabs] Missing API key');
    return {
      success: false,
      error: 'ElevenLabs API key not configured'
    };
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs] Get voices failed:', response.status, errorText);
      return {
        success: false,
        error: `Failed to get voices: ${response.status}`
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      voices: data.voices
    };
  } catch (error) {
    console.error('[ElevenLabs] Get voices error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate speech for Kai's responses
 * Uses a professional, friendly voice suitable for a dojo assistant
 */
export async function generateKaiSpeech(text: string): Promise<TextToSpeechResult> {
  return textToSpeech({
    text,
    voiceId: VOICES.RACHEL, // Professional female voice
    stability: 0.6,
    similarityBoost: 0.8,
    style: 0.2 // Slight expressiveness
  });
}

/**
 * Generate speech for announcements
 * Uses a clear, authoritative voice
 */
export async function generateAnnouncementSpeech(text: string): Promise<TextToSpeechResult> {
  return textToSpeech({
    text,
    voiceId: VOICES.JOSH, // Professional male voice
    stability: 0.7,
    similarityBoost: 0.75,
    style: 0.1
  });
}

/**
 * Stream text-to-speech (for real-time applications)
 * Returns a readable stream instead of a buffer
 */
export async function textToSpeechStream(options: TextToSpeechOptions): Promise<{
  success: boolean;
  stream?: ReadableStream;
  error?: string;
}> {
  if (!ELEVENLABS_API_KEY) {
    console.error('[ElevenLabs] Missing API key');
    return {
      success: false,
      error: 'ElevenLabs API key not configured'
    };
  }

  const voiceId = options.voiceId || VOICES.RACHEL;
  const modelId = options.modelId || 'eleven_monolingual_v1';

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: options.text,
        model_id: modelId,
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75,
          style: options.style ?? 0,
          use_speaker_boost: options.useSpeakerBoost ?? true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs] TTS stream failed:', response.status, errorText);
      return {
        success: false,
        error: `Failed to generate speech stream: ${response.status}`
      };
    }

    return {
      success: true,
      stream: response.body || undefined
    };
  } catch (error) {
    console.error('[ElevenLabs] TTS stream error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
