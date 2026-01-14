import React from 'react';
import { MOOD_PRESETS, MoodPreset, KioskConfig } from '../../../shared/kioskConfig';

interface MoodPresetSelectorProps {
  currentPreset: string;
  onPresetSelect: (preset: string, config: Partial<KioskConfig>) => void;
}

export function MoodPresetSelector({ currentPreset, onPresetSelect }: MoodPresetSelectorProps) {
  const presets = Object.entries(MOOD_PRESETS);

  return (
    <div className="space-y-4 p-4 bg-black/20 rounded-lg border border-white/10">
      <h3 className="text-sm font-semibold text-white">Mood Presets</h3>
      <p className="text-xs text-gray-400">Choose a design preset to auto-configure your kiosk</p>

      <div className="grid grid-cols-1 gap-3">
        {presets.map(([key, preset]) => (
          <button
            key={key}
            onClick={() =>
              onPresetSelect(key, {
                cardStyle: preset.cardStyle,
                typographySystem: preset.typography,
                accentSystem: preset.accent,
                backgroundIntelligence: {
                  type: 'preset',
                  color: '#000000',
                  presetKey: 'dojo-warm-lights',
                  customUrl: null,
                  fit: 'cover',
                  blur: preset.background.blur,
                  dim: 20,
                  vignette: preset.background.vignette,
                  warmth: preset.background.warmth,
                  parallaxIntensity: 0,
                },
                uiControls: preset.uiControls,
              })
            }
            className={`p-3 rounded-lg border transition text-left ${
              currentPreset === key
                ? 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{preset.name}</p>
                <p className="text-xs text-gray-400 mt-1">{preset.description}</p>
              </div>
              {currentPreset === key && (
                <div className="text-red-500 text-lg">✓</div>
              )}
            </div>

            {/* Visual preview of the preset */}
            <div className="mt-2 flex gap-2">
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: preset.accent.primaryAccent }}
              />
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: preset.accent.secondaryAccent }}
              />
              <div
                className="w-6 h-6 rounded"
                style={{
                  background: preset.cardStyle.backgroundColor,
                  border: `1px solid ${preset.cardStyle.borderColor}`,
                }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
