import React from 'react';
import { Label } from '@/components/ui/label';
import { KioskConfig, MOOD_PRESETS, CardStyle } from '../../../shared/kioskConfig';
import { KIOSK_BACKGROUND_PRESETS } from '../../../shared/kioskBackgroundPresets';
import { Accordion } from '@/components/Accordion';

interface ThemeTabPhase1Props {
  draftConfig: KioskConfig;
  currentMoodPreset: string;
  onMoodPresetSelect: (presetKey: string, presetConfig: Partial<KioskConfig>) => void;
  onCardStyleChange: (cardStyle: CardStyle) => void;
  onResetCardStyle: () => void;
  onResetMoodPreset: () => void;
  onBackgroundChange: (key: string, value: any) => void;
  onThemeChange: (key: string, value: any) => void;
  onSliderChange: (callback: () => void) => void;
}

const BACKGROUND_THEMES = KIOSK_BACKGROUND_PRESETS.slice(0, 6).map(preset => ({
  id: preset.id,
  name: preset.name,
  image: preset.imageUrl,
}));

export function ThemeTabPhase1({
  draftConfig,
  currentMoodPreset,
  onMoodPresetSelect,
  onCardStyleChange,
  onResetCardStyle,
  onResetMoodPreset,
  onBackgroundChange,
  onThemeChange,
  onSliderChange,
}: ThemeTabPhase1Props) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto">
      {/* PREMIUM DESIGN SYSTEM - Phase 1 */}
      <Accordion
        items={[
          {
            id: 'mood-presets',
            title: 'Mood Presets',
            description: 'Choose a design preset to auto-configure your kiosk',
            content: (
              <div className="space-y-3">
                {Object.entries(MOOD_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() =>
                      onMoodPresetSelect(key, {
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
                    className={`w-full p-3 rounded-lg border transition text-left ${
                      currentMoodPreset === key
                        ? 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{preset.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{preset.description}</p>
                      </div>
                      {currentMoodPreset === key && <div className="text-red-500 text-lg">✓</div>}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.accent.primaryAccent }} />
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.accent.secondaryAccent }} />
                      <div
                        className="w-6 h-6 rounded"
                        style={{ background: preset.cardStyle.backgroundColor, border: `1px solid ${preset.cardStyle.borderColor}` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            ),
            onReset: onResetMoodPreset,
          },
          {
            id: 'card-appearance',
            title: 'Card Appearance',
            description: 'Customize the white panels on your kiosk',
            content: (
              <div className="space-y-4">
                {/* Background Type */}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Background Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['solid', 'glass', 'dark-glass', 'transparent'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() =>
                          onCardStyleChange({
                            ...draftConfig.cardStyle!,
                            backgroundType: type,
                          })
                        }
                        className={`px-3 py-2 rounded text-xs font-medium transition ${
                          draftConfig.cardStyle?.backgroundType === type
                            ? 'bg-red-500 text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {type === 'dark-glass' ? 'Dark Glass' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-400">Opacity</label>
                    <span className="text-xs text-white font-mono">{draftConfig.cardStyle?.opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={draftConfig.cardStyle?.opacity || 100}
                    onChange={(e) =>
                      onSliderChange(() =>
                        onCardStyleChange({
                          ...draftConfig.cardStyle!,
                          opacity: parseInt(e.target.value),
                        })
                      )
                    }
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Blur */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-400">Blur</label>
                    <span className="text-xs text-white font-mono">{draftConfig.cardStyle?.blur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={draftConfig.cardStyle?.blur || 0}
                    onChange={(e) =>
                      onSliderChange(() =>
                        onCardStyleChange({
                          ...draftConfig.cardStyle!,
                          blur: parseInt(e.target.value),
                        })
                      )
                    }
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Saturate */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-400">Saturate</label>
                    <span className="text-xs text-white font-mono">{draftConfig.cardStyle?.saturate}%</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="150"
                    value={draftConfig.cardStyle?.saturate || 100}
                    onChange={(e) =>
                      onSliderChange(() =>
                        onCardStyleChange({
                          ...draftConfig.cardStyle!,
                          saturate: parseInt(e.target.value),
                        })
                      )
                    }
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Border Strength */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-400">Border Strength</label>
                    <span className="text-xs text-white font-mono">{draftConfig.cardStyle?.borderStrength}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={draftConfig.cardStyle?.borderStrength || 0}
                    onChange={(e) =>
                      onSliderChange(() =>
                        onCardStyleChange({
                          ...draftConfig.cardStyle!,
                          borderStrength: parseInt(e.target.value),
                        })
                      )
                    }
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Shadow Depth */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-400">Shadow Depth</label>
                    <span className="text-xs text-white font-mono">{draftConfig.cardStyle?.shadowDepth}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={draftConfig.cardStyle?.shadowDepth || 0}
                    onChange={(e) =>
                      onSliderChange(() =>
                        onCardStyleChange({
                          ...draftConfig.cardStyle!,
                          shadowDepth: parseInt(e.target.value),
                        })
                      )
                    }
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Corner Radius */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-400">Corner Radius</label>
                    <span className="text-xs text-white font-mono">{draftConfig.cardStyle?.cornerRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    value={draftConfig.cardStyle?.cornerRadius || 0}
                    onChange={(e) =>
                      onSliderChange(() =>
                        onCardStyleChange({
                          ...draftConfig.cardStyle!,
                          cornerRadius: parseInt(e.target.value),
                        })
                      )
                    }
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Live Preview */}
                <div className="mt-4 p-4 rounded-lg border border-white/20 bg-white/5">
                  <p className="text-xs text-gray-400 mb-2">Preview</p>
                  <div
                    style={{
                      background: draftConfig.cardStyle?.backgroundColor || '#ffffff',
                      border: `${((draftConfig.cardStyle?.borderStrength || 0) / 100) * 2}px solid ${draftConfig.cardStyle?.borderColor || 'transparent'}`,
                      borderRadius: `${draftConfig.cardStyle?.cornerRadius || 0}px`,
                      backdropFilter: `blur(${draftConfig.cardStyle?.blur || 0}px) saturate(${draftConfig.cardStyle?.saturate || 100}%)`,
                      opacity: (draftConfig.cardStyle?.opacity || 100) / 100,
                      boxShadow: `0 20px 60px ${draftConfig.cardStyle?.shadowColor || 'rgba(0,0,0,0.3)'}`,
                      padding: '16px',
                      minHeight: '80px',
                    }}
                    className="flex items-center justify-center text-gray-800 text-sm font-medium"
                  >
                    Card Preview
                  </div>
                </div>
              </div>
            ),
            onReset: onResetCardStyle,
          },
        ]}
        defaultOpenId="mood-presets"
      />

      {/* EXISTING BACKGROUND THEMES - Keep for now */}
      <div className="pt-4 border-t border-white/10">
        <Label className="text-xs font-semibold mb-3 block" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Background Themes
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {BACKGROUND_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onBackgroundChange('presetKey', theme.id)}
              className="group relative overflow-hidden border-2 transition-all aspect-square"
              style={{
                borderColor: draftConfig.background.presetKey === theme.id ? '#ef4444' : 'rgba(255,255,255,0.1)',
              }}
            >
              <img
                src={theme.image}
                alt={theme.name}
                className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-end">
                <p className="text-xs text-white font-medium p-2 w-full">{theme.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Background Controls */}
      <div className="pt-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Blur</Label>
          <input
            type="range"
            min="0"
            max="10"
            value={draftConfig.background.blur || 0}
            onChange={(e) => onBackgroundChange('blur', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Dim</Label>
          <input
            type="range"
            min="0"
            max="100"
            value={draftConfig.background.dim || 0}
            onChange={(e) => onBackgroundChange('dim', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Accent Color</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={draftConfig.theme.accentColor || '#ef4444'}
              onChange={(e) => onThemeChange('accentColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <input
              type="text"
              value={draftConfig.theme.accentColor || '#ef4444'}
              onChange={(e) => onThemeChange('accentColor', e.target.value)}
              className="flex-1 px-2 py-1 text-white text-xs rounded"
              style={{ backgroundColor: '#12151B', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
