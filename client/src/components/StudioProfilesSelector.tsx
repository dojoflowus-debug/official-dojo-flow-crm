/**
 * StudioProfilesSelector - Professional "Studio Profiles" instead of "Mood Presets"
 * Positioned as secondary feature, not primary interaction
 */

import React from 'react';
import { MOOD_PRESETS } from '../../../shared/kioskConfig';

interface StudioProfilesSelectorProps {
  selectedProfileKey: string;
  isCustom: boolean;
  onProfileSelect: (profileKey: string) => void;
  onResetAll: () => void;
}

const PROFILE_DESCRIPTIONS: Record<string, string> = {
  'dojo-dark': 'Professional dark theme with high contrast',
  'kids-bright': 'Vibrant and energetic for youth programs',
  'zen': 'Calm and balanced aesthetic',
  'luxury': 'Premium and sophisticated look',
  'high-contrast': 'Maximum accessibility and clarity',
  'minimal': 'Clean and distraction-free',
};

export function StudioProfilesSelector({
  selectedProfileKey,
  isCustom,
  onProfileSelect,
  onResetAll,
}: StudioProfilesSelectorProps) {
  const profileKeys = Object.keys(MOOD_PRESETS);

  return (
    <div className="space-y-3 border-t border-white/10 pt-6">
      {/* Minimal header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Studio Profiles</h4>
          <p className="text-xs text-gray-600 mt-1">Quick starting points for your environment</p>
        </div>
      </div>

      {/* Compact profile selector - horizontal list */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {profileKeys.map(profileKey => {
          const isSelected = selectedProfileKey === profileKey;
          const description = PROFILE_DESCRIPTIONS[profileKey] || profileKey;

          return (
            <button
              key={profileKey}
              onClick={() => onProfileSelect(profileKey)}
              className={`flex-shrink-0 px-3 py-2 rounded text-xs transition whitespace-nowrap ${
                isSelected
                  ? 'bg-red-500/20 border border-red-500 text-red-400'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/8'
              }`}
              title={description}
            >
              {profileKey.replace('-', ' ')}
              {isSelected && ' ✓'}
            </button>
          );
        })}
      </div>

      {/* Custom indicator - only show if modified */}
      {isCustom && (
        <div className="flex items-center justify-between p-2 rounded bg-amber-500/10 border border-amber-500/30">
          <span className="text-xs text-amber-400">Custom adjustments applied</span>
          <button
            onClick={onResetAll}
            className="text-xs px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
