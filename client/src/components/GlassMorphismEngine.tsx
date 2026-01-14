import React from 'react';
import { Label } from '@/components/ui/label';
import { CardStyle } from '../../../shared/kioskConfig';

interface GlassMorphismEngineProps {
  cardStyle: CardStyle;
  onStyleChange: (style: CardStyle) => void;
  onSliderChange: (callback: () => void) => void;
}

export function GlassMorphismEngine({
  cardStyle,
  onStyleChange,
  onSliderChange,
}: GlassMorphismEngineProps) {
  const glassMode = cardStyle.backgroundType || 'solid';

  const handleGlassModeChange = (mode: 'solid' | 'glass' | 'dark-glass' | 'ultra-glass') => {
    onStyleChange({
      ...cardStyle,
      backgroundType: mode,
      // Auto-adjust settings based on glass mode
      ...(mode === 'solid' && {
        blur: 0,
        saturate: 100,
        borderStrength: 0,
      }),
      ...(mode === 'glass' && {
        blur: 12,
        saturate: 130,
        borderStrength: 20,
        opacity: 90,
      }),
      ...(mode === 'dark-glass' && {
        blur: 16,
        saturate: 120,
        borderStrength: 15,
        opacity: 75,
      }),
      ...(mode === 'ultra-glass' && {
        blur: 20,
        saturate: 140,
        borderStrength: 25,
        opacity: 85,
      }),
    });
  };

  return (
    <div className="space-y-6">
      {/* Glass Mode Selector */}
      <div>
        <Label className="text-xs font-semibold mb-3 block">Glass Mode</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'solid', label: 'Solid', desc: 'Opaque background' },
            { id: 'glass', label: 'Frosted Glass', desc: 'Light glass effect' },
            { id: 'dark-glass', label: 'Dark Glass', desc: 'Dark glass effect' },
            { id: 'ultra-glass', label: 'Ultra Glass', desc: 'Cinematic glass' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleGlassModeChange(mode.id as any)}
              className={`p-3 rounded-lg border-2 transition text-left ${
                glassMode === mode.id
                  ? 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <p className="text-xs font-semibold text-white">{mode.label}</p>
              <p className="text-xs text-gray-400 mt-1">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Glass Effect Controls */}
      {glassMode !== 'solid' && (
        <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs font-semibold text-white mb-4">Glass Effect</p>

          {/* Blur Strength */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400">Blur Strength</label>
              <span className="text-xs text-white font-mono">{cardStyle.blur || 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={cardStyle.blur || 0}
              onChange={(e) =>
                onSliderChange(() =>
                  onStyleChange({
                    ...cardStyle,
                    blur: parseInt(e.target.value),
                  })
                )
              }
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Frost/Noise Amount */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400">Frost Amount</label>
              <span className="text-xs text-white font-mono">{cardStyle.frostAmount || 0}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={cardStyle.frostAmount || 0}
              onChange={(e) =>
                onSliderChange(() =>
                  onStyleChange({
                    ...cardStyle,
                    frostAmount: parseInt(e.target.value),
                  })
                )
              }
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Saturation */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400">Saturation</label>
              <span className="text-xs text-white font-mono">{cardStyle.saturate || 100}%</span>
            </div>
            <input
              type="range"
              min="80"
              max="150"
              value={cardStyle.saturate || 100}
              onChange={(e) =>
                onSliderChange(() =>
                  onStyleChange({
                    ...cardStyle,
                    saturate: parseInt(e.target.value),
                  })
                )
              }
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Brightness */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400">Brightness</label>
              <span className="text-xs text-white font-mono">{cardStyle.brightness || 100}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={cardStyle.brightness || 100}
              onChange={(e) =>
                onSliderChange(() =>
                  onStyleChange({
                    ...cardStyle,
                    brightness: parseInt(e.target.value),
                  })
                )
              }
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Border & Shadow Controls */}
      <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
        <p className="text-xs font-semibold text-white mb-4">Border & Shadow</p>

        {/* Border Strength */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-gray-400">Border Strength</label>
            <span className="text-xs text-white font-mono">{cardStyle.borderStrength || 0}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={cardStyle.borderStrength || 0}
            onChange={(e) =>
              onSliderChange(() =>
                onStyleChange({
                  ...cardStyle,
                  borderStrength: parseInt(e.target.value),
                })
              )
            }
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Border Glow Intensity */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-gray-400">Border Glow</label>
            <span className="text-xs text-white font-mono">{cardStyle.borderGlowIntensity || 0}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={cardStyle.borderGlowIntensity || 0}
            onChange={(e) =>
              onSliderChange(() =>
                onStyleChange({
                  ...cardStyle,
                  borderGlowIntensity: parseInt(e.target.value),
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
            <span className="text-xs text-white font-mono">{cardStyle.shadowDepth || 0}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={cardStyle.shadowDepth || 0}
            onChange={(e) =>
              onSliderChange(() =>
                onStyleChange({
                  ...cardStyle,
                  shadowDepth: parseInt(e.target.value),
                })
              )
            }
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Shadow Softness */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-gray-400">Shadow Softness</label>
            <span className="text-xs text-white font-mono">{cardStyle.shadowSoftness || 0}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={cardStyle.shadowSoftness || 0}
            onChange={(e) =>
              onSliderChange(() =>
                onStyleChange({
                  ...cardStyle,
                  shadowSoftness: parseInt(e.target.value),
                })
              )
            }
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Opacity & Radius */}
      <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
        <p className="text-xs font-semibold text-white mb-4">Appearance</p>

        {/* Opacity */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-gray-400">Opacity</label>
            <span className="text-xs text-white font-mono">{cardStyle.opacity || 100}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={cardStyle.opacity || 100}
            onChange={(e) =>
              onSliderChange(() =>
                onStyleChange({
                  ...cardStyle,
                  opacity: parseInt(e.target.value),
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
            <span className="text-xs text-white font-mono">{cardStyle.cornerRadius || 0}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="32"
            value={cardStyle.cornerRadius || 0}
            onChange={(e) =>
              onSliderChange(() =>
                onStyleChange({
                  ...cardStyle,
                  cornerRadius: parseInt(e.target.value),
                })
              )
            }
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Live Preview */}
      <div className="p-4 rounded-lg border border-white/20 bg-white/5">
        <p className="text-xs text-gray-400 mb-3">Live Preview</p>
        <div
          style={{
            background: cardStyle.backgroundColor || '#ffffff',
            border: `${((cardStyle.borderStrength || 0) / 100) * 2}px solid ${cardStyle.borderColor || 'transparent'}`,
            borderRadius: `${cardStyle.cornerRadius || 0}px`,
            backdropFilter: `blur(${cardStyle.blur || 0}px) saturate(${cardStyle.saturate || 100}%) brightness(${cardStyle.brightness || 100}%)`,
            opacity: (cardStyle.opacity || 100) / 100,
            boxShadow: `0 20px 60px ${cardStyle.shadowColor || 'rgba(0,0,0,0.3)'}`,
            padding: '16px',
            minHeight: '100px',
          }}
          className="flex items-center justify-center text-gray-800 text-sm font-medium"
        >
          Glass Preview
        </div>
      </div>
    </div>
  );
}
