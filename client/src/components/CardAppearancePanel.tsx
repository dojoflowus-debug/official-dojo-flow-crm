import React from 'react';
import { CardStyle } from '../../../shared/kioskConfig';

interface CardAppearancePanelProps {
  cardStyle: CardStyle;
  onChange: (cardStyle: CardStyle) => void;
}

export function CardAppearancePanel({ cardStyle, onChange }: CardAppearancePanelProps) {
  const handleChange = (key: keyof CardStyle, value: any) => {
    onChange({
      ...cardStyle,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6 p-4 bg-black/20 rounded-lg border border-white/10">
      <h3 className="text-sm font-semibold text-white">Card Appearance</h3>

      {/* Background Type */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Background Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(['solid', 'glass', 'dark-glass', 'transparent'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleChange('backgroundType', type)}
              className={`px-3 py-2 rounded text-xs font-medium transition ${
                cardStyle.backgroundType === type
                  ? 'bg-red-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {type === 'dark-glass' ? 'Dark Glass' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-gray-400">Opacity</label>
          <span className="text-xs text-white font-mono">{cardStyle.opacity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={cardStyle.opacity}
          onChange={(e) => handleChange('opacity', parseInt(e.target.value))}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Blur Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-gray-400">Blur</label>
          <span className="text-xs text-white font-mono">{cardStyle.blur}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="30"
          value={cardStyle.blur}
          onChange={(e) => handleChange('blur', parseInt(e.target.value))}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Saturate Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-gray-400">Saturate</label>
          <span className="text-xs text-white font-mono">{cardStyle.saturate}%</span>
        </div>
        <input
          type="range"
          min="80"
          max="150"
          value={cardStyle.saturate}
          onChange={(e) => handleChange('saturate', parseInt(e.target.value))}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Border Strength */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-gray-400">Border Strength</label>
          <span className="text-xs text-white font-mono">{cardStyle.borderStrength}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={cardStyle.borderStrength}
          onChange={(e) => handleChange('borderStrength', parseInt(e.target.value))}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Shadow Depth */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-gray-400">Shadow Depth</label>
          <span className="text-xs text-white font-mono">{cardStyle.shadowDepth}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={cardStyle.shadowDepth}
          onChange={(e) => handleChange('shadowDepth', parseInt(e.target.value))}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Corner Radius */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-gray-400">Corner Radius</label>
          <span className="text-xs text-white font-mono">{cardStyle.cornerRadius}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="32"
          value={cardStyle.cornerRadius}
          onChange={(e) => handleChange('cornerRadius', parseInt(e.target.value))}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Background Color */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Background Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={cardStyle.backgroundColor}
            onChange={(e) => handleChange('backgroundColor', e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-white/20"
          />
          <input
            type="text"
            value={cardStyle.backgroundColor}
            onChange={(e) => handleChange('backgroundColor', e.target.value)}
            className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
          />
        </div>
      </div>

      {/* Border Color */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Border Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={cardStyle.borderColor}
            onChange={(e) => handleChange('borderColor', e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-white/20"
          />
          <input
            type="text"
            value={cardStyle.borderColor}
            onChange={(e) => handleChange('borderColor', e.target.value)}
            className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
          />
        </div>
      </div>

      {/* Shadow Color */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Shadow Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={cardStyle.shadowColor}
            onChange={(e) => handleChange('shadowColor', e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-white/20"
          />
          <input
            type="text"
            value={cardStyle.shadowColor}
            onChange={(e) => handleChange('shadowColor', e.target.value)}
            className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
          />
        </div>
      </div>

      {/* Live Preview */}
      <div className="mt-4 p-4 rounded-lg border border-white/20 bg-white/5">
        <p className="text-xs text-gray-400 mb-2">Preview</p>
        <div
          style={{
            background: cardStyle.backgroundColor,
            border: `${(cardStyle.borderStrength / 100) * 2}px solid ${cardStyle.borderColor}`,
            borderRadius: `${cardStyle.cornerRadius}px`,
            backdropFilter: `blur(${cardStyle.blur}px) saturate(${cardStyle.saturate}%)`,
            opacity: cardStyle.opacity / 100,
            boxShadow: `0 20px 60px ${cardStyle.shadowColor}`,
            padding: '16px',
            minHeight: '80px',
          }}
          className="flex items-center justify-center text-white text-sm font-medium"
        >
          Card Preview
        </div>
      </div>
    </div>
  );
}
