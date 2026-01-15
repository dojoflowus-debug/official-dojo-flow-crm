/**
 * MoodPresetSelectorEnhanced - Visual preset selector with custom state indicator
 */

import React from 'react';
import { MOOD_PRESETS } from '../../../shared/kioskConfig';
import { RotateCcw } from 'lucide-react';

interface MoodPresetSelectorEnhancedProps {
  selectedPresetKey: string;
  isCustom: boolean;
  onPresetSelect: (presetKey: string) => void;
  onResetAll: () => void;
}

const PRESET_COLORS: Record<string, string> = {
  'dojo-dark': '#1a1a1a',
  'kids-bright': '#fbbf24',
  'zen': '#10b981',
  'luxury': '#8b5cf6',
  'high-contrast': '#000000',
  'minimal': '#f5f5f5',
};

export function MoodPresetSelectorEnhanced({
  selectedPresetKey,
  isCustom,
  onPresetSelect,
  onResetAll,
}: MoodPresetSelectorEnhancedProps) {
  const presetKeys = Object.keys(MOOD_PRESETS);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Mood Presets</h3>
          <p className="text-xs mt-1" style={{color: 'rgba(255,255,255,0.4)'}}>
            {isCustom ? 'Custom Theme' : `Using ${selectedPresetKey}`}
          </p>
        </div>
        {isCustom && (
          <button
            onClick={onResetAll}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 transition text-xs text-amber-400"
            title="Reset all theme values to preset defaults"
          >
            <RotateCcw size={14} />
            Reset All
          </button>
        )}
      </div>

      {/* Preset Chips */}
      <div className="grid grid-cols-3 gap-2">
        {presetKeys.map(presetKey => {
          const preset = MOOD_PRESETS[presetKey];
          const color = PRESET_COLORS[presetKey] || '#666666';
          const isSelected = selectedPresetKey === presetKey;
          const showCustomBadge = isSelected && isCustom;

          return (
            <button
              key={presetKey}
              onClick={() => onPresetSelect(presetKey)}
              className={`relative flex flex-col items-center gap-2 p-3 rounded-lg transition ${
                isSelected
                  ? 'bg-white/10 border border-red-500/50'
                  : 'bg-white/5 border border-white/10 hover:bg-white/8'
              }`}
              title={`Apply ${presetKey} preset`}
            >
              {/* Color Swatch */}
              <div
                className="w-8 h-8 rounded-full border border-white/20 shadow-lg"
                style={{backgroundColor: color}}
              />

              {/* Preset Name */}
              <span className="text-xs font-medium text-gray-300 capitalize text-center line-clamp-2">
                {presetKey.replace('-', ' ')}
              </span>

              {/* Selection Checkmark */}
              {isSelected && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}

              {/* Custom Badge */}
              {showCustomBadge && (
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full bg-amber-500/30 border border-amber-500/50 text-amber-400 text-xs font-medium">
                  Custom
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom State Indicator */}
      {isCustom && (
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
          ⚠️ Theme has been customized. Click "Reset All" to return to preset defaults.
        </div>
      )}
    </div>
  );
}
