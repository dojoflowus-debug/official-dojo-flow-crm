import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { ButtonStyleConfig } from '../../../shared/buttonStyleConfig';
import { DEFAULT_BUTTON_STYLE, BUTTON_STYLE_PRESETS } from '../../../shared/buttonStyleConfig';

interface ButtonStylePanelProps {
  config: ButtonStyleConfig;
  onChange: (config: ButtonStyleConfig) => void;
  onReset: () => void;
}

export function ButtonStylePanel({ config, onChange, onReset }: ButtonStylePanelProps) {
  const handleStyleChange = (style: 'solid' | 'glass' | 'outline' | 'neon') => {
    const preset = BUTTON_STYLE_PRESETS[style as keyof typeof BUTTON_STYLE_PRESETS];
    if (preset) {
      onChange({
        ...config,
        style: preset.style,
        radius: preset.radius,
        glowIntensity: preset.glowIntensity,
        animation: preset.animation,
      });
    }
  };

  const handleAnimationChange = (animation: 'none' | 'pulse' | 'breathing-glow' | 'subtle-lift') => {
    onChange({
      ...config,
      animation,
    });
  };

  const handleRadiusChange = (radius: number) => {
    onChange({
      ...config,
      radius,
    });
  };

  const handleGlowChange = (glowIntensity: number) => {
    onChange({
      ...config,
      glowIntensity,
    });
  };

  const handleApplyToAllToggle = () => {
    onChange({
      ...config,
      applyToAllButtons: !config.applyToAllButtons,
    });
  };

  return (
    <div className="space-y-4">
      {/* Button Style Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">Button Style</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(BUTTON_STYLE_PRESETS).map(([key, preset]: [string, any]) => (
            <button
              key={key}
              onClick={() => handleStyleChange(key as keyof typeof BUTTON_STYLE_PRESETS as 'solid' | 'glass' | 'outline' | 'neon')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                config.style === key
                  ? 'bg-red-500 text-white ring-2 ring-red-300'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">{BUTTON_STYLE_PRESETS[config.style as keyof typeof BUTTON_STYLE_PRESETS]?.description || 'Button style'}</p>
      </div>

      {/* Button Radius */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-200">Radius</label>
          <span className="text-xs text-gray-400">{config.radius}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          value={config.radius}
          onChange={(e) => handleRadiusChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
        />
      </div>

      {/* Glow Intensity */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-200">Glow Intensity</label>
          <span className="text-xs text-gray-400">{config.glowIntensity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={config.glowIntensity}
          onChange={(e) => handleGlowChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
        />
      </div>

      {/* Animation Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">Animation</label>
        <div className="space-y-2">
          {(['none', 'pulse', 'breathing-glow', 'subtle-lift'] as const).map((anim) => (
            <label key={anim} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="animation"
                value={anim}
                checked={config.animation === anim}
                onChange={() => handleAnimationChange(anim)}
                className="w-4 h-4 text-red-500 cursor-pointer"
              />
              <span className="text-sm text-gray-300 capitalize">{anim.replace('-', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Apply to All / Per-Button Toggle */}
      <div className="pt-2 border-t border-gray-700">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.applyToAllButtons}
            onChange={handleApplyToAllToggle}
            className="w-4 h-4 text-red-500 rounded cursor-pointer"
          />
          <span className="text-sm text-gray-300">Apply to all buttons</span>
        </label>
        {!config.applyToAllButtons && (
          <p className="text-xs text-gray-400 mt-2">Per-button overrides available below</p>
        )}
      </div>

      {/* Live Preview */}
      <div className="pt-4 border-t border-gray-700">
        <p className="text-xs font-medium text-gray-400 mb-3">Preview</p>
        <div className="space-y-2">
          <button
            className={`w-full px-4 py-2 rounded-lg font-medium text-white transition-all ${
              config.style === 'solid'
                ? 'bg-red-500 hover:bg-red-600'
                : config.style === 'glass'
                  ? 'bg-red-500/20 backdrop-blur-md border border-red-500/30 hover:bg-red-500/30'
                  : config.style === 'outline'
                    ? 'bg-transparent border-2 border-red-500 hover:bg-red-500/10'
                    : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50'
            }`}
            style={{
              borderRadius: `${config.radius}px`,
              animation:
                config.animation === 'pulse'
                  ? 'pulse 2s ease-in-out infinite'
                  : config.animation === 'breathing-glow'
                    ? 'breathe 3s ease-in-out infinite'
                    : 'none',
            }}
          >
            Check In
          </button>
          <button
            className={`w-full px-4 py-2 rounded-lg font-medium text-white transition-all ${
              config.style === 'solid'
                ? 'bg-red-500 hover:bg-red-600'
                : config.style === 'glass'
                  ? 'bg-red-500/20 backdrop-blur-md border border-red-500/30 hover:bg-red-500/30'
                  : config.style === 'outline'
                    ? 'bg-transparent border-2 border-red-500 hover:bg-red-500/10'
                    : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50'
            }`}
            style={{
              borderRadius: `${config.radius}px`,
              animation:
                config.animation === 'pulse'
                  ? 'pulse 2s ease-in-out infinite'
                  : config.animation === 'breathing-glow'
                    ? 'breathe 3s ease-in-out infinite'
                    : 'none',
            }}
          >
            Start Training
          </button>
        </div>
      </div>
    </div>
  );
}
