/**
 * KaiVoiceSetupModal
 *
 * Shown the first time a user activates voice mode on the Kai page.
 * Lets them:
 *  1. Choose voice gender (with audio preview)
 *  2. Enable or decline voice conversation
 *
 * Preference is persisted to localStorage so the modal only shows once.
 */

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react';

export type VoiceSetupResult = {
  enabled: boolean;
  gender: 'male' | 'female';
};

interface KaiVoiceSetupModalProps {
  open: boolean;
  onClose: (result: VoiceSetupResult) => void;
  /** Name of the AI assistant (defaults to "Kai") */
  assistantName?: string;
}

const PREVIEW_TEXTS = {
  female: "Hi! I'm Kai, your dojo assistant. I'll help you manage your school with my voice.",
  male: "Hey there! I'm Kai, your dojo assistant. Ready to help you run your school.",
};

export function KaiVoiceSetupModal({ open, onClose, assistantName = 'Kai' }: KaiVoiceSetupModalProps) {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('female');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewedGender, setPreviewedGender] = useState<'male' | 'female' | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!open) stopPreview();
  }, [open]);

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPreviewing(false);
  };

  const playPreview = async (gender: 'male' | 'female') => {
    stopPreview();
    setSelectedGender(gender);
    setIsPreviewing(true);
    setPreviewedGender(gender);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: PREVIEW_TEXTS[gender], voiceGender: gender }),
      });

      if (!response.ok) throw new Error('TTS failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; setIsPreviewing(false); };
      audio.onerror = () => { URL.revokeObjectURL(url); audioRef.current = null; setIsPreviewing(false); };
      await audio.play();
    } catch (err) {
      console.error('[VoiceSetup] Preview error:', err);
      setIsPreviewing(false);
    }
  };

  const handleEnable = () => { stopPreview(); onClose({ enabled: true, gender: selectedGender }); };
  const handleDecline = () => { stopPreview(); onClose({ enabled: false, gender: selectedGender }); };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDecline} />

      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)' }}
      >
        <button onClick={handleDecline} className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors z-10">
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <div
            className="mx-auto mb-5 w-20 h-20 rounded-full flex items-center justify-center relative"
            style={{
              background: 'radial-gradient(circle at 40% 35%, #ff4444 0%, #cc0000 50%, #660000 100%)',
              boxShadow: '0 0 40px rgba(255,68,68,0.4), 0 0 80px rgba(255,68,68,0.15)',
            }}
          >
            <Mic className="w-8 h-8 text-white" />
            <div className="absolute inset-0 rounded-full border border-red-400/30 scale-110 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 rounded-full border border-red-400/20 scale-125 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Talk to {assistantName}</h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Enable voice mode for a natural, hands-free conversation.{' '}
            {assistantName} will listen and respond out loud — no typing needed.
          </p>
          <p className="text-white/30 text-xs mt-2">You can change this anytime in settings.</p>
        </div>

        {/* Voice gender selection */}
        <div className="px-8 py-4">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-3 text-center">
            Choose {assistantName}'s Voice
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(['female', 'male'] as const).map((gender) => (
              <button
                key={gender}
                onClick={() => playPreview(gender)}
                className={`relative rounded-xl p-4 border transition-all text-left group ${
                  selectedGender === gender
                    ? 'border-red-500/60 bg-red-500/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${selectedGender === gender ? 'bg-red-400' : 'bg-white/20'}`} />
                  <span className={`text-sm font-medium capitalize ${selectedGender === gender ? 'text-white' : 'text-white/60'}`}>
                    {gender}
                  </span>
                </div>
                <svg viewBox="0 0 80 20" className="w-full h-4 mb-2" fill="none">
                  <path
                    d={gender === 'female'
                      ? 'M0,10 C10,2 20,18 30,10 C40,2 50,18 60,10 C70,2 80,18 80,10'
                      : 'M0,10 C15,4 25,16 40,10 C55,4 65,16 80,10'}
                    stroke={selectedGender === gender ? '#ef4444' : 'rgba(255,255,255,0.2)'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex items-center gap-1">
                  {isPreviewing && previewedGender === gender ? (
                    <><VolumeX className="w-3 h-3 text-red-400" /><span className="text-xs text-red-400">Playing...</span></>
                  ) : (
                    <><Volume2 className="w-3 h-3 text-white/30 group-hover:text-white/60" /><span className="text-xs text-white/30 group-hover:text-white/50">Preview</span></>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 pt-2 flex flex-col gap-3">
          <Button
            onClick={handleEnable}
            className="w-full h-12 rounded-xl font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              boxShadow: '0 4px 20px rgba(239,68,68,0.3)',
            }}
          >
            <Mic className="w-4 h-4 mr-2" />
            Enable Voice Mode
          </Button>
          <button onClick={handleDecline} className="w-full h-10 text-white/40 hover:text-white/60 text-sm transition-colors">
            <MicOff className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            No thanks, text only
          </button>
        </div>
      </div>
    </div>
  );
}
