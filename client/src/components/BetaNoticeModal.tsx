import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

interface BetaNoticeModalProps {
  onReadNotes: () => void;
  onSkip: () => void;
}

export function BetaNoticeModal({ onReadNotes, onSkip }: BetaNoticeModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div 
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          pointerEvents: 'auto'
        }}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" style={{ color: isDark ? '#ffffff' : '#000000' }} />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div 
              className="p-4 rounded-full"
              style={{
                backgroundColor: isDark ? 'rgba(255, 76, 76, 0.1)' : 'rgba(255, 76, 76, 0.1)'
              }}
            >
              <Sparkles className="w-8 h-8" style={{ color: '#FF4C4C' }} />
            </div>
          </div>

          {/* Title */}
          <h2 
            className="text-2xl font-bold text-center mb-2"
            style={{ color: isDark ? '#ffffff' : '#000000' }}
          >
            Kai v0.9.0-beta
          </h2>

          {/* Subtitle */}
          <p 
            className="text-center mb-6"
            style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
          >
            You're in Beta
          </p>

          {/* Body */}
          <div 
            className="space-y-3 mb-8"
            style={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}
          >
            <p className="text-sm">Thanks for being an early adopter! This beta includes:</p>
            <ul className="text-sm space-y-2 ml-4">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Light mode command center with prompt carousel</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Enhanced chat input with loading feedback</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Improved navigation and theme switching</span>
              </li>
            </ul>
            <p className="text-sm">
              We're actively improving Kai. Your feedback helps shape the future!
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={onReadNotes}
              className="w-full h-11 bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white font-medium rounded-lg"
            >
              Read what's new
            </Button>
            <Button
              onClick={onSkip}
              variant="ghost"
              className="w-full h-11 font-medium rounded-lg"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                backgroundColor: 'transparent'
              }}
            >
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
