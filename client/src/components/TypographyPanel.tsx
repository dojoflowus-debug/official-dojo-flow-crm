import React from 'react';
import { TypographyConfig } from '../../../shared/kioskConfig';

interface TypographyPanelProps {
  typography: TypographyConfig;
  onChange: (typography: TypographyConfig) => void;
}

const FONT_FAMILIES = [
  'Inter',
  'Poppins',
  'Playfair Display',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Raleway',
];

export function TypographyPanel({ typography, onChange }: TypographyPanelProps) {
  const handleChange = (key: keyof TypographyConfig, value: any) => {
    onChange({
      ...typography,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6 p-4 bg-black/20 rounded-lg border border-white/10">
      <h3 className="text-sm font-semibold text-white">Typography</h3>

      {/* Font Family */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Font Family</label>
        <select
          value={typography.fontFamily}
          onChange={(e) => handleChange('fontFamily', e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-xs text-white"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Font Weight */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-gray-400">Font Weight</label>
          <span className="text-xs text-white font-mono">{typography.fontWeight}</span>
        </div>
        <input
          type="range"
          min="400"
          max="900"
          step="100"
          value={typography.fontWeight}
          onChange={(e) => handleChange('fontWeight', parseInt(e.target.value))}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Letter Spacing */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-gray-400">Letter Spacing</label>
          <span className="text-xs text-white font-mono">{typography.letterSpacing}px</span>
        </div>
        <input
          type="range"
          min="-2"
          max="4"
          step="0.5"
          value={typography.letterSpacing}
          onChange={(e) => handleChange('letterSpacing', parseFloat(e.target.value))}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Header Color */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Header Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={typography.headerColor}
            onChange={(e) => handleChange('headerColor', e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-white/20"
          />
          <input
            type="text"
            value={typography.headerColor}
            onChange={(e) => handleChange('headerColor', e.target.value)}
            className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
          />
        </div>
      </div>

      {/* Body Color */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Body Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={typography.bodyColor}
            onChange={(e) => handleChange('bodyColor', e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-white/20"
          />
          <input
            type="text"
            value={typography.bodyColor}
            onChange={(e) => handleChange('bodyColor', e.target.value)}
            className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
          />
        </div>
      </div>

      {/* Button Text Color */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Button Text Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={typography.buttonTextColor}
            onChange={(e) => handleChange('buttonTextColor', e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-white/20"
          />
          <input
            type="text"
            value={typography.buttonTextColor}
            onChange={(e) => handleChange('buttonTextColor', e.target.value)}
            className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
          />
        </div>
      </div>

      {/* Time Widget Color */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Time Widget Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={typography.timeWidgetColor}
            onChange={(e) => handleChange('timeWidgetColor', e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-white/20"
          />
          <input
            type="text"
            value={typography.timeWidgetColor}
            onChange={(e) => handleChange('timeWidgetColor', e.target.value)}
            className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
          />
        </div>
      </div>

      {/* Glow Effect */}
      <div className="pt-2 border-t border-white/10">
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={typography.enableGlow}
            onChange={(e) => handleChange('enableGlow', e.target.checked)}
            className="w-4 h-4 rounded border-white/20"
          />
          <span className="text-xs text-gray-400">Enable Text Glow</span>
        </label>

        {typography.enableGlow && (
          <div className="space-y-3 mt-3 pl-6">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Glow Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={typography.glowColor}
                  onChange={(e) => handleChange('glowColor', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-white/20"
                />
                <input
                  type="text"
                  value={typography.glowColor}
                  onChange={(e) => handleChange('glowColor', e.target.value)}
                  className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-400">Glow Blur</label>
                <span className="text-xs text-white font-mono">{typography.glowBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={typography.glowBlur}
                onChange={(e) => handleChange('glowBlur', parseInt(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Shadow Effect */}
      <div className="pt-2 border-t border-white/10">
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={typography.enableShadow}
            onChange={(e) => handleChange('enableShadow', e.target.checked)}
            className="w-4 h-4 rounded border-white/20"
          />
          <span className="text-xs text-gray-400">Enable Text Shadow</span>
        </label>

        {typography.enableShadow && (
          <div className="space-y-3 mt-3 pl-6">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Shadow Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={typography.shadowColor}
                  onChange={(e) => handleChange('shadowColor', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-white/20"
                />
                <input
                  type="text"
                  value={typography.shadowColor}
                  onChange={(e) => handleChange('shadowColor', e.target.value)}
                  className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-400">Shadow Blur</label>
                <span className="text-xs text-white font-mono">{typography.shadowBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={typography.shadowBlur}
                onChange={(e) => handleChange('shadowBlur', parseInt(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
