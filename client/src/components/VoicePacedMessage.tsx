import { useState, useEffect, useRef } from 'react';
import { Pause, Play, Square, Eye } from 'lucide-react';

interface VoicePacedMessageProps {
  content: string;
  voiceEnabled: boolean;
  audioUrl?: string; // URL to TTS audio file
  audioDuration?: number; // in milliseconds
  onSpeechEnd?: () => void;
  onSpeechInterrupt?: () => void;
  theme?: 'light' | 'dark' | 'cinematic';
}

/**
 * VoicePacedMessage - Renders text with typewriter effect synced to TTS audio
 * 
 * Rules:
 * - voiceEnabled=false: Render full text immediately (no typewriter)
 * - voiceEnabled=true: Always use paced reveal with typewriter effect
 * - Pacing syncs to audioDuration when available
 * - Falls back to natural speaking cadence (150 words/min) with punctuation pauses
 */
export default function VoicePacedMessage({
  content,
  voiceEnabled,
  audioUrl,
  audioDuration,
  onSpeechEnd,
  onSpeechInterrupt,
  theme = 'dark'
}: VoicePacedMessageProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showFullText, setShowFullText] = useState(false);
  
  const currentIndexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Calculate pacing
  const calculatePacing = () => {
    const totalChars = content.length;
    
    if (audioDuration && audioDuration > 0) {
      // Sync to audio duration (audioDuration is in milliseconds)
      const durationSeconds = audioDuration / 1000;
      const charsPerSecond = totalChars / durationSeconds;
      // Clamp to reasonable range (5-50 chars/second)
      return Math.max(5, Math.min(50, charsPerSecond));
    }
    
    // Fallback: Natural speaking cadence (150 words/min ≈ 12.5 chars/second)
    return 12.5;
  };

  // Get delay for next character based on punctuation
  const getCharDelay = (char: string, nextChar: string, baseDelay: number): number => {
    // Add micro-pauses on punctuation for natural feel
    if (char === '.' || char === '!' || char === '?') {
      return baseDelay * 8; // 8x pause after sentence
    }
    if (char === ',' || char === ';' || char === ':') {
      return baseDelay * 4; // 4x pause after clause
    }
    if (char === '\n') {
      return baseDelay * 6; // 6x pause for line break
    }
    return baseDelay;
  };

  // Initialize audio
  useEffect(() => {
    if (audioUrl && voiceEnabled) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener('ended', () => {
        console.log('[VoicePacedMessage] Audio playback ended');
        if (onSpeechEnd) {
          onSpeechEnd();
        }
      });
      audioRef.current.addEventListener('error', (e) => {
        console.error('[VoicePacedMessage] Audio playback error:', e);
      });
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl, voiceEnabled]);

  // Typewriter effect
  useEffect(() => {
    if (!voiceEnabled || showFullText) {
      // Voice OFF or full text shown - display immediately
      setDisplayedText(content);
      return;
    }

    // Voice ON - start typewriter effect
    currentIndexRef.current = 0;
    setDisplayedText('');
    setIsPlaying(true);
    startTimeRef.current = Date.now();

    // Start audio playback if available
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('[VoicePacedMessage] Failed to play audio:', err);
      });
    }

    const charsPerSecond = calculatePacing();
    const baseDelayMs = 1000 / charsPerSecond;

    const typeNextChar = () => {
      if (currentIndexRef.current < content.length) {
        const currentChar = content[currentIndexRef.current];
        const nextChar = content[currentIndexRef.current + 1] || '';
        
        setDisplayedText(content.substring(0, currentIndexRef.current + 1));
        currentIndexRef.current++;

        const delay = getCharDelay(currentChar, nextChar, baseDelayMs);
        intervalRef.current = setTimeout(typeNextChar, delay);
      } else {
        // Typing complete - audio will trigger onSpeechEnd via 'ended' event
        console.log('[VoicePacedMessage] Typewriter complete');
      }
    };

    typeNextChar();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [content, voiceEnabled, showFullText, audioDuration, audioUrl]);

  // Pause/Resume handlers
  const handlePause = () => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const handleResume = () => {
    if (currentIndexRef.current >= content.length) return;
    
    setIsPlaying(true);
    
    // Resume audio playback
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('[VoicePacedMessage] Failed to resume audio:', err);
      });
    }
    
    const charsPerSecond = calculatePacing();
    const baseDelayMs = 1000 / charsPerSecond;

    const typeNextChar = () => {
      if (currentIndexRef.current < content.length) {
        const currentChar = content[currentIndexRef.current];
        const nextChar = content[currentIndexRef.current + 1] || '';
        
        setDisplayedText(content.substring(0, currentIndexRef.current + 1));
        currentIndexRef.current++;

        const delay = getCharDelay(currentChar, nextChar, baseDelayMs);
        intervalRef.current = setTimeout(typeNextChar, delay);
      }
    };

    typeNextChar();
  };

  const handleStop = () => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    if (onSpeechInterrupt) {
      onSpeechInterrupt();
    }
  };

  const handleShowFullText = () => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setShowFullText(true);
    setDisplayedText(content);
  };

  // Theme-aware button styles
  const getButtonClass = () => {
    if (theme === 'cinematic') {
      return 'bg-white/10 hover:bg-white/20 text-white border border-white/20';
    }
    if (theme === 'dark') {
      return 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600';
    }
    return 'bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300';
  };

  return (
    <div className="relative">
      {/* Message content */}
      <div className="prose prose-sm max-w-none">
        {displayedText}
        {voiceEnabled && !showFullText && currentIndexRef.current < content.length && (
          <span className="inline-block w-1 h-4 bg-current animate-pulse ml-0.5" />
        )}
      </div>

      {/* Voice controls - only shown when voiceEnabled=true */}
      {voiceEnabled && !showFullText && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-current/10">
          {/* Pause/Resume */}
          {isPlaying ? (
            <button
              onClick={handlePause}
              className={`p-1.5 rounded transition-colors ${getButtonClass()}`}
              title="Pause speech"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleResume}
              className={`p-1.5 rounded transition-colors ${getButtonClass()}`}
              title="Resume speech"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Stop */}
          <button
            onClick={handleStop}
            className={`p-1.5 rounded transition-colors ${getButtonClass()}`}
            title="Stop speech"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          {/* Show Full Text */}
          <button
            onClick={handleShowFullText}
            className={`p-1.5 rounded transition-colors ${getButtonClass()} ml-auto`}
            title="Show full text"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Progress indicator */}
          <span className="text-xs opacity-60 ml-2">
            {Math.round((currentIndexRef.current / content.length) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
