import { X, Sparkles, Star, Zap, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

interface BetaNoticeModalProps {
  onReadNotes: () => void;
  onSkip: () => void;
}

const LATEST_FEATURES = [
  {
    icon: Star,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    label: 'New',
    text: 'Kai Creative — AI flyer & ad generation with 6-element ad structure',
  },
  {
    icon: Star,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    label: 'New',
    text: 'Hard execution gate — program, audience & content required before generation',
  },
  {
    icon: Star,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    label: 'New',
    text: 'OpenAI Intelligence Layer — intent detection, copy enhancement & decision engine',
  },
  {
    icon: Star,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    label: 'New',
    text: 'Context Injection — school name, phone, programs & brand auto-loaded into every prompt',
  },
  {
    icon: Zap,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    label: 'Improved',
    text: 'Conversational brief panel with guided questions and program chips',
  },
  {
    icon: Zap,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    label: 'Improved',
    text: 'Forward-moving language throughout — no more "Sorry" or error-style messages',
  },
  {
    icon: Bug,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    label: 'Fixed',
    text: "Removed premature 'I'm creating now' message — Kai asks questions first",
  },
  {
    icon: Bug,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    label: 'Fixed',
    text: 'Login fixed — email/password accounts now work correctly',
  },
];

export function BetaNoticeModal({ onReadNotes, onSkip }: BetaNoticeModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'cinema';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          maxHeight: '90vh',
        }}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-2 rounded-full transition-colors z-10"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
          aria-label="Close"
        >
          <X className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }} />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-5 flex-shrink-0">
          <div className="flex justify-center mb-4">
            <div className="p-3.5 rounded-full" style={{ backgroundColor: 'rgba(255,76,76,0.12)' }}>
              <Sparkles className="w-7 h-7" style={{ color: '#FF4C4C' }} />
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-2xl font-bold" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                DojoFlow v0.9.6
              </h2>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: '#FF4C4C', backgroundColor: 'rgba(255,76,76,0.12)' }}
              >
                Latest
              </span>
            </div>
            <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              Here's what's new since your last visit
            </p>
          </div>
        </div>

        {/* Scrollable feature list */}
        <div className="px-8 pb-2 overflow-y-auto flex-1" style={{ maxHeight: '340px' }}>
          <div className="space-y-2">
            {LATEST_FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 py-2.5 px-3 rounded-xl"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                >
                  <div
                    className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: feat.bg }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: feat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ color: feat.color, backgroundColor: feat.bg }}
                      >
                        {feat.label}
                      </span>
                      <span className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>
                        {feat.text}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        <div className="px-8 pt-3 pb-2 flex-shrink-0">
          <p className="text-xs text-center" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>
            We're actively improving DojoFlow. Your feedback shapes every release.
          </p>
        </div>

        {/* Buttons */}
        <div className="px-8 pb-8 pt-3 flex flex-col gap-3 flex-shrink-0">
          <Button
            type="button"
            onClick={onReadNotes}
            className="w-full h-11 bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white font-medium rounded-xl"
          >
            View full changelog
          </Button>
          <Button
            onClick={onSkip}
            variant="ghost"
            className="w-full h-11 font-medium rounded-xl"
            style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', backgroundColor: 'transparent' }}
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
