/**
 * useKaiVoice — Seamless voice conversation hook for Kai AI
 *
 * Architecture:
 *  1. MediaRecorder records audio in chunks (works on iOS Safari, Android Chrome, Desktop)
 *  2. Silence detection via AudioContext AnalyserNode — auto-stops recording after ~1.5s of quiet
 *  3. Audio blob sent to /api/stt (OpenAI Whisper) for transcription
 *  4. Transcript fired via onTranscript callback → KaiCommand sends the message
 *  5. After Kai responds, latestAssistantText triggers /api/tts → Audio plays
 *  6. After TTS finishes, mic reopens automatically → seamless loop
 *
 * iOS Safari notes:
 *  - SpeechRecognition API is NOT supported → we use MediaRecorder instead
 *  - Audio playback requires user gesture to unlock → first TTS play is triggered by the
 *    "Enable Voice Mode" button click which satisfies the gesture requirement
 *  - MediaRecorder on iOS produces audio/mp4 → Whisper accepts it fine
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

  // Refs so callbacks always see current values without stale closures
  const stateRef = useRef<VoiceConversationState>('idle');
  const lastSpokenTextRef = useRef<string | null>(null);
  const mutedRef = useRef(false);
  const enabledRef = useRef(enabled);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Silence detection refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  const setStateSync = useCallback((s: VoiceConversationState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  useEffect(() => { mutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  // ─── Silence detection ────────────────────────────────────────────────────
  const stopSilenceDetection = useCallback(() => {
    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (_) {}
      audioContextRef.current = null;
      analyserRef.current = null;
    }
  }, []);

  const startSilenceDetection = useCallback((stream: MediaStream, onSilence: () => void) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) throw new Error('No AudioContext');
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      let silentFrames = 0;
      const SILENCE_THRESHOLD = 8;  // RMS below this = silent
      const SILENCE_FRAMES = 45;    // ~1.5s at 30fps

      silenceCheckIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const rms = Math.sqrt(data.reduce((sum, v) => sum + v * v, 0) / data.length);
        if (rms < SILENCE_THRESHOLD) {
          silentFrames++;
          if (silentFrames >= SILENCE_FRAMES) {
            clearInterval(silenceCheckIntervalRef.current!);
            silenceCheckIntervalRef.current = null;
            onSilence();
          }
        } else {
          silentFrames = 0;
        }
      }, 33);
    } catch (_) {
      // Fallback: fixed 6s max recording
      silenceTimerRef.current = setTimeout(onSilence, 6000);
    }
  }, []);

  // ─── Stop recording ───────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    stopSilenceDetection();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (_) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, [stopSilenceDetection]);

  // ─── Transcribe audio blob via Whisper ────────────────────────────────────
  const transcribeBlob = useCallback(async (blob: Blob) => {
    if (blob.size < 1000) {
      // Too small — likely silence, restart listening
      if (enabledRef.current) setStateSync('listening');
      return;
    }
    setStateSync('processing');
    try {
      const fd = new FormData();
      fd.append('audio', blob, 'audio.webm');
      const res = await fetch('/api/stt', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('STT failed');
      const { text } = await res.json() as { text: string };
      if (text && text.trim().length > 0) {
        onTranscript(text.trim());
        // State transitions: processing → (Kai responds) → speaking → listening
      } else {
        // Empty transcript — restart listening
        if (enabledRef.current) setStateSync('listening');
      }
    } catch (err) {
      console.error('[useKaiVoice] STT error:', err);
      if (enabledRef.current) setStateSync('listening');
    }
  }, [onTranscript, setStateSync]);

  // ─── Start recording ──────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (!enabledRef.current) return;
    if (stateRef.current === 'speaking' || stateRef.current === 'processing') return;
    if (mediaRecorderRef.current) return; // already recording

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      // Pick best supported MIME type (iOS Safari supports audio/mp4)
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        '',
      ].find(t => t === '' || MediaRecorder.isTypeSupported(t)) || '';

      const recorderOptions = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const finalMime = mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalMime });
        audioChunksRef.current = [];
        transcribeBlob(blob);
      };

      recorder.start(250); // collect chunks every 250ms
      setStateSync('listening');

      // Start silence detection — stops recorder when quiet
      startSilenceDetection(stream, () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          stopRecording();
        }
      });
    } catch (err: any) {
      console.error('[useKaiVoice] Mic access error:', err);
      const msg = err?.name === 'NotAllowedError'
        ? 'Microphone permission denied. Please allow mic access and try again.'
        : 'Could not access microphone.';
      setError(msg);
      setStateSync('error');
      onEnabledChange?.(false);
    }
  }, [startSilenceDetection, stopRecording, transcribeBlob, setStateSync, onEnabledChange]);

  // ─── Auto-restart listening when state returns to 'listening' ─────────────
  useEffect(() => {
    if (state === 'listening' && enabled && !mediaRecorderRef.current) {
      startListening();
    }
  }, [state, enabled, startListening]);

  // ─── TTS Playback ─────────────────────────────────────────────────────────
  const speakText = useCallback(async (text: string) => {
    if (!text || mutedRef.current) {
      if (enabledRef.current) setStateSync('listening');
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

    setStateSync('speaking');

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

      const onDone = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        if (enabledRef.current) setStateSync('listening');
        else setStateSync('idle');
      };

      audio.onended = onDone;
      audio.onerror = onDone;
      await audio.play();
    } catch (err) {
      console.error('[useKaiVoice] TTS error:', err);
      // Fallback to Web Speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 0.95;
        utterance.onend = () => {
          if (enabledRef.current) setStateSync('listening');
          else setStateSync('idle');
        };
        window.speechSynthesis.speak(utterance);
      } else {
        if (enabledRef.current) setStateSync('listening');
      }
    }
  }, [voiceGender, setStateSync]);

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
      // Ensure any stale recorder state is cleared before re-enabling
      // so startListening() doesn't bail out on the mediaRecorderRef.current check
      if (mediaRecorderRef.current) {
        try { mediaRecorderRef.current.stop(); } catch (_) {}
        mediaRecorderRef.current = null;
      }
      audioChunksRef.current = [];
      setStateSync('listening');
      // startListening triggered by the state effect above
    } else {
      stopRecording();
      // Explicitly null out the recorder ref so re-enable works cleanly
      mediaRecorderRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setStateSync('idle');
      lastSpokenTextRef.current = null;
    }
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopRecording();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [stopRecording]);

  // ─── Mute toggle ─────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setIsMuted(next);
    if (next && audioRef.current) {
      audioRef.current.pause();
    } else if (!next && audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    }
  }, []);

  /** Call this when Kai starts processing (user message sent) */
  const notifyProcessing = useCallback(() => {
    stopRecording();
    setStateSync('processing');
  }, [stopRecording, setStateSync]);

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
