import React from 'react';
import { KaiCaptions } from '../KaiCaptions';

interface SetupKaiProps {
  message: string;
  isSpeaking: boolean;
  onSpeakComplete?: () => void;
  bubblePosition?: 'left' | 'below';
  showCaptions?: boolean;
  appearance?: 'default' | 'orb' | 'particles';
}

export default function SetupKai({ 
  message, 
  isSpeaking, 
  onSpeakComplete, 
  bubblePosition = 'left', 
  showCaptions = true,
  appearance = 'default'
}: SetupKaiProps) {
  // Render different appearances based on selection
  const renderKaiOrb = () => {
    if (appearance === 'orb') {
      // Plasma Kai (cyan particles)
      return (
        <div className="w-40 h-40 rounded-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600 rounded-full" />
          <div className="absolute inset-0 bg-cyan-500/50 blur-xl animate-pulse" />
        </div>
      );
    } else if (appearance === 'particles') {
      // Red Vortex Kai (yin-yang center)
      return (
        <div className="w-40 h-40 rounded-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-400 via-red-500 to-red-600 rounded-full" />
          <div className="absolute inset-0 bg-red-500/50 blur-xl animate-pulse" />
        </div>
      );
    } else {
      // Default: Simple red glowing sphere
      return (
        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-2xl shadow-red-500/50 flex items-center justify-center relative">
          <div 
            className={`w-32 h-32 rounded-full bg-gradient-to-br from-red-400 to-red-600 transition-all duration-300 ${
              isSpeaking ? 'animate-pulse' : ''
            }`} 
          />
        </div>
      );
    }
  };

  return (
    <div className="fixed top-8 right-24 z-50">
      <div className="relative">
        <div 
          className="transition-transform duration-300 ease-in-out"
          style={{ 
            transform: isSpeaking ? 'scale(1.15)' : 'scale(1.0)' 
          }}
        >
          <div 
            className="absolute inset-0 transition-all duration-300 ease-in-out"
            style={{
              transform: isSpeaking ? 'scale(1.15)' : 'scale(1.0)',
              opacity: isSpeaking ? 1.0 : 0.3
            }}
          >
            <div 
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                width: '380px',
                height: '380px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, transparent 0%, transparent 40%, rgba(251, 191, 36, 0.6) 40%, rgba(251, 191, 36, 0.3) 60%, rgba(251, 191, 36, 0) 75%)',
                filter: 'blur(20px)',
                animationDuration: '2s'
              }}
            />
            <div 
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                width: '450px',
                height: '450px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, transparent 0%, transparent 35%, rgba(249, 115, 22, 0.5) 35%, rgba(249, 115, 22, 0.2) 60%, rgba(249, 115, 22, 0) 75%)',
                filter: 'blur(30px)',
                animationDuration: '2.5s'
              }}
            />
            <div 
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                width: '520px',
                height: '520px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, transparent 0%, transparent 30%, rgba(239, 68, 68, 0.4) 30%, rgba(239, 68, 68, 0.15) 55%, rgba(239, 68, 68, 0) 70%)',
                filter: 'blur(40px)',
                animationDuration: '3s'
              }}
            />
            <div 
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                width: '600px',
                height: '600px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, transparent 0%, transparent 25%, rgba(220, 38, 38, 0.3) 25%, rgba(220, 38, 38, 0.1) 50%, rgba(220, 38, 38, 0) 70%)',
                filter: 'blur(50px)',
                animationDuration: '3.5s'
              }}
            />
          </div>
          {renderKaiOrb()}
        </div>
        {isSpeaking && (
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex items-end gap-1 h-12">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-gradient-to-t from-amber-400 to-amber-300"
                style={{
                  animation: `waveform ${0.8 + (i % 3) * 0.2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.05}s`,
                  height: '20px'
                }}
              />
            ))}
          </div>
        )}
        {showCaptions && (
          <KaiCaptions 
            message={message} 
            isPlaying={isSpeaking}
            onComplete={onSpeakComplete}
          />
        )}
      </div>
      <style>{`
        @keyframes waveform {
          0%, 100% {
            height: 20px;
          }
          50% {
            height: 48px;
          }
        }
      `}</style>
    </div>
  );
}
