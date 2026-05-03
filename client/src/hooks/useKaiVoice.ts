/**
 * useKaiVoice — Seamless voice conversation mode for Kai
 *
 * Flow:
 *  1. User activates voice mode
 *  2. Mic opens, Web Speech API listens continuously
 *  3. On speech pause (final result), transcript is auto-submitted
 *  4. While Kai is processing, mic is paused
 *  5. When Kai responds, ElevenLabs TTS plays the response
 *  6. When audio ends, mic reopens automatically → loop
 *
 * Works on both mobile and desktop (Chrome, Edge, Safari 17+).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceConversationState =
  | 'idle'        // voice mode off
  | 'listening'   // mic open, waiting for user speech
  | 'processing'  // Kai is thinking / fetching
  | 'speaking'    // Kai's TTS audio is playing
  | 'error';      // something went wrong

interface UseKaiVoiceOptions {
  /** Called with the final transcript — should trigger the Kai send flow */
  onTranscript: (text: string) => void;
  /** Pass the latest Kai assistant response text here so the hook can speak it */
  latestAssistantText: string | null;
  /** Voice gender for ElevenLabs */
  voiceGender?: 'male' | 'female';
  /** Whether voice mode is currently enabled */
  enabled: boolean;
  /** Called when the hook wants to change the enabled state (e.g. on error) */
  onEnabledChange?: (enabled: boolean) => void;
}

export function useKaiVoice({
  onTranscript,
  latestAssistantText,
  voiceGender = 'female',
  enabled,
  onEnabledChange,
}: UseKaiVoiceOptions) {
  const [state, setState] = useState<VoiceConversationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stateRef = useRef<VoiceConversationState>('idle');
  const lastSpokenTextRef = useRef<string | null>(null);
  const mutedRef = useRef(false);
  const enabledRef = useRef(enabled);

  // Keep refs in sync
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { mutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  // ─── Speech Recognition ───────────────────────────────────────────────────

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!enabledRef.current) return;
    if (stateRef.current === 'speaking' || stateRef.current === 'processing') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      setState('error');
      return;
    }

    stopListening();

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setState('processing');
        stopListening();
        onTranscript(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        if (enabledRef.current && stateRef.current === 'listening') {
          setTimeout(() => startListening(), 300);
        }
        return;
      }
      console.error('[useKaiVoice] Recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow mic access and try again.');
        setState('error');
        onEnabledChange?.(false);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (enabledRef.current && stateRef.current === 'listening') {
        setTimeout(() => startListening(), 200);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setState('listening');
    } catch (err) {
      console.error('[useKaiVoice] Failed to start recognition:', err);
    }
  }, [onTranscript, stopListening, onEnabledChange]);

  // ─── TTS Playback ─────────────────────────────────────────────────────────

  const speakText = useCallback(async (text: string) => {
    if (!text || mutedRef.current) {
      if (enabledRef.current) {
        setState('listening');
        startListening();
      }
      return;
    }

    // Strip markdown for cleaner TTS
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[⚠️🔥✅❌📊💡]/g, '')
      .trim();

    setState('speaking');

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, voiceGender }),
      });

      if (!response.ok) throw new Error('TTS request failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        if (enabledRef.current) {
          setState('listening');
          startListening();
        } else {
          setState('idle');
        }
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        if (enabledRef.current) {
          setState('listening');
          startListening();
        }
      };

      await audio.play();
    } catch (err) {
      console.error('[useKaiVoice] TTS error:', err);
      // Fallback to Web Speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 0.95;
        utterance.onend = () => {
          if (enabledRef.current) {
            setState('listening');
            startListening();
          } else {
            setState('idle');
          }
        };
        window.speechSynthesis.speak(utterance);
      } else {
        if (enabledRef.current) {
          setState('listening');
          startListening();
        }
      }
    }
  }, [voiceGender, startListening]);

  // ─── React to new Kai responses ──────────────────────────────────────────

  useEffect(() => {
    if (!enabled) return;
    if (!latestAssistantText) return;
    if (latestAssistantText === lastSpokenTextRef.current) return;
    if (stateRef.current !== 'processing' && stateRef.current !== 'speaking') return;

    lastSpokenTextRef.current = latestAssistantText;
    speakText(latestAssistantText);
  }, [latestAssistantText, enabled, speakText]);

  // ─── Enable / disable voice mode ─────────────────────────────────────────

  useEffect(() => {
    if (enabled) {
      setError(null);
      setState('listening');
      startListening();
    } else {
      stopListening();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setState('idle');
      lastSpokenTextRef.current = null;
    }
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopListening();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [stopListening]);

  // ─── Public API ───────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    setIsMuted(next);
    if (next && audioRef.current) {
      audioRef.current.pause();
    } else if (!next && audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    }
  }, []);

  /** Call this when Kai starts processing (user message sent) */
  const notifyProcessing = useCallback(() => {
    stopListening();
    setState('processing');
  }, [stopListening]);

  return {
    state,
    error,
    isMuted,
    toggleMute,
    notifyProcessing,
    isListening: state === 'listening',
    isSpeaking: state === 'speaking',
    isProcessing: state === 'processing',
  };
}
