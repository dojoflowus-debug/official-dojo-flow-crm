import React from 'react';
import { Label } from '@/components/ui/label';
import { TypographyConfig } from '../../../shared/kioskConfig';

interface TypographyPanelProps {
  typography: TypographyConfig;
  onChange: (typography: TypographyConfig) => void;
  onSliderChange: (callback: () => void) => void;
}

const FONT_FAMILIES = [
  { id: 'Inter', name: 'Inter' },
  { id: 'System', name: 'System' },
  { id: 'Georgia', name: 'Georgia' },
  { id: 'Monospace', name: 'Mono' },
];

export function TypographyPanel({
  typography,
  onChange,
  onSliderChange,
}: TypographyPanelProps) {
  const handleChange = (key: keyof TypographyConfig, value: any) => {
    onChange({
      ...typography,
      [key]: value,
    });
  };

  return (
    <div className="space-y-5">
      {/* Font Family */}
      <div>
        <Label className="text-xs font-semibold mb-3 block" style={{color: 'rgba(255,255,255,0.92)'}}>Font Family</Label>
        <div className="grid grid-cols-2 gap-2">
          {FONT_FAMILIES.map((font) => (
            <button
              key={font.id}
              onClick={() => handleChange('fontFamily', font.id)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition"
              style={{
                background: typography.fontFamily === font.id ? '#EF4444' : 'rgba(18, 22, 28, 0.5)',
                color: typography.fontFamily === font.id ? 'white' : 'rgba(255,255,255,0.92)',
                border: `1px solid ${typography.fontFamily === font.id ? '#EF4444' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {font.name}
            </button>
          ))}
        </div>
      </div>

      {/* Header Weight */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label className="text-xs font-medium" style={{color: 'rgba(255,255,255,0.65)'}}>Header Weight</Label>
          <span className="text-xs font-mono" style={{color: 'rgba(255,255,255,0.92)'}}>{typography.fontWeight}</span>
        </div>
        <input
          type="range"
          min="300"
          max="900"
          step="100"
          value={typography.fontWeight || 700}
          onChange={(e) =>
            onSliderChange(() =>
              handleChange('fontWeight', parseInt(e.target.value))
            )
          }
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Body Weight */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label className="text-xs font-medium" style={{color: 'rgba(255,255,255,0.65)'}}>Body Weight</Label>
          <span className="text-xs font-mono" style={{color: 'rgba(255,255,255,0.92)'}}>{typography.fontWeight}</span>
        </div>
        <input
          type="range"
          min="300"
          max="700"
          step="100"
          value={typography.fontWeight || 400}
          onChange={(e) =>
            onSliderChange(() =>
              handleChange('fontWeight', parseInt(e.target.value))
            )
          }
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Text Colors */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold block" style={{color: 'rgba(255,255,255,0.92)'}}>Text Colors</Label>

        {/* Title Color */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={typography.headerColor || '#ffffff'}
            onChange={(e) => handleChange('headerColor', e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <Label className="text-xs text-gray-400 flex-1">Title</Label>
        </div>

        {/* Body Color */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={typography.bodyColor || '#ffffff'}
            onChange={(e) => handleChange('bodyColor', e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <Label className="text-xs text-gray-400 flex-1">Body</Label>
        </div>

        {/* Button Color */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={typography.buttonTextColor || '#ffffff'}
            onChange={(e) => handleChange('buttonTextColor', e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <Label className="text-xs text-gray-400 flex-1">Button</Label>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={typography.enableShadow || false}
            onChange={(e) => handleChange('enableShadow', e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-xs text-gray-300">Text Shadow</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={typography.enableGlow || false}
            onChange={(e) => handleChange('enableGlow', e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-xs text-gray-300">High Contrast</span>
        </label>
      </div>
    </div>
  );
}
