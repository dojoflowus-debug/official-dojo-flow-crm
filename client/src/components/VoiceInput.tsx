import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from './ui/button';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  autoSubmit?: boolean;
  onAutoSubmit?: () => void;
}

export default function VoiceInput({ onTranscript, onListeningChange, autoSubmit = false, onAutoSubmit }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  const createRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        console.log('[VoiceInput] Final transcript:', finalTranscript.trim());
        console.log('[VoiceInput] autoSubmit prop:', autoSubmit);
        console.log('[VoiceInput] onAutoSubmit callback exists:', !!onAutoSubmit);
        
        onTranscript(finalTranscript.trim());
        
        if (autoSubmit) {
          console.log('[VoiceInput] Auto-submit is enabled, preparing to submit...');
          
          // Stop listening after getting final transcript
          try {
            recognition.stop();
            console.log('[VoiceInput] Recognition stopped successfully');
          } catch (e) {
            console.error('[VoiceInput] Error stopping recognition:', e);
          }
          setIsListening(false);
          onListeningChange?.(false);
          
          // Trigger auto-submit after a short delay to ensure text is set
          console.log('[VoiceInput] Setting timeout for auto-submit (500ms)...');
          setTimeout(() => {
            console.log('[VoiceInput] Timeout fired! Calling onAutoSubmit...');
            if (onAutoSubmit) {
              onAutoSubmit();
              console.log('[VoiceInput] onAutoSubmit called successfully');
            } else {
              console.error('[VoiceInput] ERROR: onAutoSubmit callback is undefined!');
            }
          }, 500);
        } else {
          console.log('[VoiceInput] Auto-submit is disabled, not submitting');
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[VoiceInput] Speech recognition error:', event.error);
      setIsListening(false);
      onListeningChange?.(false);
      recognitionRef.current = null; // Clear the reference on error
    };

    recognition.onend = () => {
      console.log('[VoiceInput] Recognition ended');
      setIsListening(false);
      onListeningChange?.(false);
      recognitionRef.current = null; // Clear the reference when ended
    };

    return recognition;
  };

  const toggleListening = () => {
    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('[VoiceInput] Error stopping recognition:', e);
        }
      }
      setIsListening(false);
      onListeningChange?.(false);
      recognitionRef.current = null;
    } else {
      // Start listening - create a fresh recognition object
      console.log('[VoiceInput] Creating new recognition object');
      const recognition = createRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        try {
          recognition.start();
          console.log('[VoiceInput] Recognition started');
          setIsListening(true);
          onListeningChange?.(true);
        } catch (e) {
          console.error('[VoiceInput] Error starting recognition:', e);
          setIsListening(false);
          onListeningChange?.(false);
          recognitionRef.current = null;
        }
      }
    }
  };

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <Button
      onClick={toggleListening}
      variant={isListening ? "default" : "outline"}
      size="icon"
      className={isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : ""}
      title={isListening ? "Stop listening" : "Start voice input"}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}
