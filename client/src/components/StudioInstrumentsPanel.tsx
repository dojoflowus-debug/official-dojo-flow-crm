/**
 * StudioInstrumentsPanel - Reframes theme controls as professional studio instruments
 * Replaces "glass/blur/border" language with: Lighting, Atmosphere, Depth, Accents
 */

import React from 'react';
import { CardStyle } from '../../../shared/kioskConfig';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface StudioInstrumentsPanelProps {
  cardStyle: CardStyle;
  onChange: (style: CardStyle) => void;
  onSliderChange?: (callback: () => void) => void;
}

export function StudioInstrumentsPanel({
  cardStyle,
  onChange,
  onSliderChange,
}: StudioInstrumentsPanelProps) {
  const handleChange = (key: string, value: any) => {
    const updated = { ...cardStyle, [key]: value };
    onChange(updated);
    if (onSliderChange) {
      onSliderChange(() => {});
    }
  };

  return (
    <div className="space-y-8">
      {/* LIGHTING - Controls blur and glow */}
      <div className="space-y-3 border-b border-white/10 pb-6">
        <div>
          <Label className="text-xs font-semibold text-white uppercase tracking-wide">Lighting</Label>
          <p className="text-xs text-gray-500 mt-1">Adjust the glow and diffusion of elements</p>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Blur Strength</span>
              <span className="text-xs font-mono text-red-400">{cardStyle.blur || 0}px</span>
            </div>
            <Slider
              value={[cardStyle.blur || 0]}
              onValueChange={(val) => handleChange('blur', val[0])}
              min={0}
              max={30}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Glow Intensity</span>
              <span className="text-xs font-mono text-red-400">{cardStyle.shadowBlur || 0}px</span>
            </div>
            <Slider
              value={[cardStyle.shadowBlur || 0]}
              onValueChange={(val) => handleChange('shadowBlur', val[0])}
              min={0}
              max={30}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* ATMOSPHERE - Controls opacity and background */}
      <div className="space-y-3 border-b border-white/10 pb-6">
        <div>
          <Label className="text-xs font-semibold text-white uppercase tracking-wide">Atmosphere</Label>
          <p className="text-xs text-gray-500 mt-1">Control the transparency and density</p>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Opacity</span>
              <span className="text-xs font-mono text-red-400">{cardStyle.opacity || 0}%</span>
            </div>
            <Slider
              value={[cardStyle.opacity || 0]}
              onValueChange={(val) => handleChange('opacity', val[0])}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Saturation</span>
              <span className="text-xs font-mono text-red-400">{cardStyle.saturation || 0}%</span>
            </div>
            <Slider
              value={[cardStyle.saturation || 0]}
              onValueChange={(val) => handleChange('saturation', val[0])}
              min={0}
              max={200}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* DEPTH - Controls shadows and spacing */}
      <div className="space-y-3 border-b border-white/10 pb-6">
        <div>
          <Label className="text-xs font-semibold text-white uppercase tracking-wide">Depth</Label>
          <p className="text-xs text-gray-500 mt-1">Create layering and shadow effects</p>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Shadow Depth</span>
              <span className="text-xs font-mono text-red-400">{cardStyle.shadowSpread || 0}px</span>
            </div>
            <Slider
              value={[cardStyle.shadowSpread || 0]}
              onValueChange={(val) => handleChange('shadowSpread', val[0])}
              min={0}
              max={20}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Border Strength</span>
              <span className="text-xs font-mono text-red-400">{cardStyle.borderWidth || 0}px</span>
            </div>
            <Slider
              value={[cardStyle.borderWidth || 0]}
              onValueChange={(val) => handleChange('borderWidth', val[0])}
              min={0}
              max={3}
              step={0.5}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* ACCENTS - Controls color and highlights */}
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-semibold text-white uppercase tracking-wide">Accents</Label>
          <p className="text-xs text-gray-500 mt-1">Adjust corner radius and highlights</p>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Corner Radius</span>
              <span className="text-xs font-mono text-red-400">{cardStyle.borderRadius || 0}px</span>
            </div>
            <Slider
              value={[cardStyle.borderRadius || 0]}
              onValueChange={(val) => handleChange('borderRadius', val[0])}
              min={0}
              max={32}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Border Glow</span>
              <span className="text-xs font-mono text-red-400">{cardStyle.brightness || 0}%</span>
            </div>
            <Slider
              value={[cardStyle.brightness || 0]}
              onValueChange={(val) => handleChange('brightness', val[0])}
              min={0}
              max={150}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
