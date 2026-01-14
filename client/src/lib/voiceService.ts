/**
 * Voice Service for Kai Setup Wizard
 * Handles text-to-speech using ElevenLabs API with Web Speech API fallback
 */

interface VoiceQueueItem {
  text: string;
  onComplete?: () => void;
  disableFallback?: boolean;
}

class VoiceService {
  private audioElement: HTMLAudioElement | null = null;
  private queue: VoiceQueueItem[] = [];
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private voiceGender: 'male' | 'female' = 'female'; // Default to female

  constructor() {
    // Load mute preference from localStorage
    const savedMute = localStorage.getItem('kai-voice-muted');
    this.isMuted = savedMute === 'true';
  }

  /**
   * Speak text using ElevenLabs API (primary) or Web Speech API (fallback)
   */
  async speak(text: string, onComplete?: () => void, options?: { disableFallback?: boolean }): Promise<void> {
    // Add to queue with disableFallback option
    this.queue.push({ text, onComplete, disableFallback: options?.disableFallback });

    // If already playing, wait for current to finish
    if (this.isPlaying) {
      return;
    }

    // Process queue
    await this.processQueue();
  }

  /**
   * Speak immediately (for user interaction contexts)
   * Must be called directly from user event handler
   */
  async speakImmediate(text: string, onComplete?: () => void, options?: { disableFallback?: boolean }): Promise<void> {
    this.isPlaying = true;

    // Skip if muted
    if (this.isMuted) {
      console.log('[VoiceService] Muted - skipping:', text);
      if (onComplete) onComplete();
      this.isPlaying = false;
      return;
    }

    try {
      // Try ElevenLabs first
      await this.speakWithElevenLabs(text);
      console.log('[VoiceService] ElevenLabs playback complete');
    } catch (error) {
      console.warn('[VoiceService] ElevenLabs failed:', error);
      // Only fallback if not disabled
      if (!options?.disableFallback) {
        console.log('[VoiceService] Falling back to Web Speech API');
        await this.speakWithWebSpeech(text);
      } else {
        console.log('[VoiceService] Fallback disabled, skipping Web Speech API');
      }
    }

    if (onComplete) onComplete();
    this.isPlaying = false;
  }

  /**
   * Process voice queue sequentially
   */
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      this.isPlaying = true;

      // Skip if muted
      if (this.isMuted) {
        console.log('[VoiceService] Muted - skipping:', item.text);
        if (item.onComplete) item.onComplete();
        this.isPlaying = false;
        continue;
      }

      try {
        // Try ElevenLabs first
        await this.speakWithElevenLabs(item.text);
        console.log('[VoiceService] ElevenLabs playback complete');
      } catch (error) {
        console.warn('[VoiceService] ElevenLabs failed:', error);
        // Only fallback if not disabled (check item's disableFallback flag)
        if (!item.disableFallback) {
          console.log('[VoiceService] Falling back to Web Speech API');
          await this.speakWithWebSpeech(item.text);
        } else {
          console.log('[VoiceService] Fallback disabled, skipping Web Speech API');
        }
      }

      if (item.onComplete) item.onComplete();
      this.isPlaying = false;
    }
  }

  /**
   * Speak using ElevenLabs API
   */
  private async speakWithElevenLabs(text: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('[VoiceService] Calling ElevenLabs TTS API...');
        
        // Call backend TTS endpoint with voice gender
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text,
            voiceGender: this.voiceGender 
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[VoiceService] TTS API error:', errorText);
          throw new Error('TTS request failed');
        }

        console.log('[VoiceService] TTS API success, creating audio...');
        
        // Get audio blob
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Clean up previous audio
        if (this.audioElement) {
          this.audioElement.pause();
          this.audioElement.src = '';
        }

        // Create new audio element
        this.audioElement = new Audio(audioUrl);
        this.audioElement.volume = 1.0;

        // Set up event handlers
        this.audioElement.onended = () => {
          console.log('[VoiceService] Audio playback ended');
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        this.audioElement.onerror = (error) => {
          console.error('[VoiceService] Audio playback error:', error);
          URL.revokeObjectURL(audioUrl);
          reject(error);
        };

        // Play audio
        console.log('[VoiceService] Starting audio playback...');
        try {
          await this.audioElement.play();
          console.log('[VoiceService] Audio playback started successfully');
          // Note: Promise resolves when audio ENDS via onended handler above
        } catch (playError) {
          console.error('[VoiceService] Audio play() failed:', playError);
          URL.revokeObjectURL(audioUrl);
          reject(playError);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Speak using Web Speech API (fallback)
   */
  private async speakWithWebSpeech(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Web Speech API not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Stop current playback and clear queue
   */
  stop(): void {
    // Stop audio
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }

    // Stop Web Speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Clear queue
    this.queue = [];
    this.isPlaying = false;
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('kai-voice-muted', this.isMuted.toString());
    
    if (this.isMuted) {
      // Pause audio playback (don't stop)
      if (this.audioElement) {
        this.audioElement.pause();
      }
      // Pause Web Speech API
      if ('speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
    } else {
      // Resume audio playback
      if (this.audioElement && this.audioElement.paused) {
        this.audioElement.play().catch(err => {
          console.warn('[VoiceService] Failed to resume audio:', err);
        });
      }
      // Resume Web Speech API
      if ('speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }

    return this.isMuted;
  }

  /**
   * Get current mute state
   */
  isMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.isPlaying;
  }

  /**
   * Unlock audio playback (must be called from user interaction)
   * Creates and plays a silent audio element to unlock the audio context
   */
  async unlockAudio(): Promise<void> {
    try {
      // Create a silent audio element and play it
      const silentAudio = new Audio();
      silentAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T0Oi0HAAAAAAD/+xDEAAPAAAGkAAAAIAAANIAAAARMQU1FMy4xMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+xDECgPAAAGkAAAAIAAANIAAAARMQU1FMy4xMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+xDEDwPAAAGkAAAAIAAANIAAAARMQU1FMy4xMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
      silentAudio.volume = 0;
      await silentAudio.play();
      console.log('[VoiceService] Audio context unlocked');
    } catch (error) {
      console.warn('[VoiceService] Failed to unlock audio:', error);
    }
  }

  /**
   * Set voice gender for TTS
   */
  setVoiceGender(gender: 'male' | 'female'): void {
    this.voiceGender = gender;
    console.log(`[VoiceService] Voice gender set to: ${gender}`);
  }

  /**
   * Get current voice gender
   */
  getVoiceGender(): 'male' | 'female' {
    return this.voiceGender;
  }
}

// Export singleton instance
export const voiceService = new VoiceService();
