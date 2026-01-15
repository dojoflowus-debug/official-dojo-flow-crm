/**
 * EnvironmentEffectsPanel
 * Controls for modifying the appearance of background environments
 * Lighting, Atmosphere, and Depth effects applied to the kiosk background
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export interface EnvironmentEffects {
  // Lighting
  blur: number; // 0-30px
  glow: number; // 0-30px

  // Atmosphere
  opacity: number; // 0-100%
  saturation: number; // -100 to 100%

  // Depth
  shadow: number; // 0-100%
  border: number; // 0-100%
}

interface EnvironmentEffectsPanelProps {
  effects: EnvironmentEffects;
  onChange: (effects: EnvironmentEffects) => void;
}

export function EnvironmentEffectsPanel({
  effects,
  onChange,
}: EnvironmentEffectsPanelProps) {
  const handleChange = (key: keyof EnvironmentEffects, value: number) => {
    onChange({ ...effects, [key]: value });
  };

  // Generate CSS filter string for background effects
  const getFilterStyle = (): React.CSSProperties => {
    const filters: string[] = [];

    // Blur effect
    if (effects.blur > 0) {
      filters.push(`blur(${effects.blur}px)`);
    }

    // Opacity effect (via brightness)
    const opacityBrightness = 100 - (effects.opacity * 0.5); // 100% opacity = no change, 0% opacity = 50% darker
    filters.push(`brightness(${opacityBrightness}%)`);

    // Saturation effect
    const saturation = 100 + effects.saturation;
    filters.push(`saturate(${saturation}%)`);

    // Shadow effect (via contrast)
    const contrast = 100 + (effects.shadow * 0.5);
    filters.push(`contrast(${contrast}%)`);

    return {
      filter: filters.join(' '),
    };
  };

  return (
    <div className="space-y-8">
      {/* LIGHTING - Controls blur and glow */}
      <div className="space-y-3 border-b border-white/10 pb-6">
        <div>
          <Label className="text-xs font-semibold text-white uppercase tracking-wide">
            Lighting
          </Label>
          <p className="text-xs text-gray-500 mt-1">Adjust the glow and diffusion of elements</p>
        </div>

        <div className="space-y-3">
          {/* Blur Strength */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Blur Strength</span>
              <span className="text-xs font-mono text-amber-400">{effects.blur}px</span>
            </div>
            <Slider
              value={[effects.blur]}
              onValueChange={(val) => handleChange('blur', val[0])}
              min={0}
              max={30}
              step={1}
              className="w-full"
            />
          </div>

          {/* Glow Intensity */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Glow Intensity</span>
              <span className="text-xs font-mono text-amber-400">{effects.glow}px</span>
            </div>
            <Slider
              value={[effects.glow]}
              onValueChange={(val) => handleChange('glow', val[0])}
              min={0}
              max={30}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* ATMOSPHERE - Controls opacity and saturation */}
      <div className="space-y-3 border-b border-white/10 pb-6">
        <div>
          <Label className="text-xs font-semibold text-white uppercase tracking-wide">
            Atmosphere
          </Label>
          <p className="text-xs text-gray-500 mt-1">Control the transparency and density</p>
        </div>

        <div className="space-y-3">
          {/* Opacity */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Opacity</span>
              <span className="text-xs font-mono text-amber-400">{effects.opacity}%</span>
            </div>
            <Slider
              value={[effects.opacity]}
              onValueChange={(val) => handleChange('opacity', val[0])}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Saturation */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Saturation</span>
              <span className="text-xs font-mono text-amber-400">{effects.saturation}%</span>
            </div>
            <Slider
              value={[effects.saturation]}
              onValueChange={(val) => handleChange('saturation', val[0])}
              min={-100}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* DEPTH - Controls shadow and border effects */}
      <div className="space-y-3 border-b border-white/10 pb-6">
        <div>
          <Label className="text-xs font-semibold text-white uppercase tracking-wide">Depth</Label>
          <p className="text-xs text-gray-500 mt-1">Create layering and shadow effects</p>
        </div>

        <div className="space-y-3">
          {/* Shadow Depth */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Shadow Depth</span>
              <span className="text-xs font-mono text-amber-400">{effects.shadow}%</span>
            </div>
            <Slider
              value={[effects.shadow]}
              onValueChange={(val) => handleChange('shadow', val[0])}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Border Strength */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Border Strength</span>
              <span className="text-xs font-mono text-amber-400">{effects.border}%</span>
            </div>
            <Slider
              value={[effects.border]}
              onValueChange={(val) => handleChange('border', val[0])}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Preview of filter effects */}
      <div className="mt-6 p-3 bg-white/5 rounded border border-white/10">
        <p className="text-xs text-gray-400 mb-2">Filter Preview:</p>
        <div
          className="w-full h-24 rounded bg-gradient-to-br from-amber-900 to-amber-800 flex items-center justify-center text-white text-xs"
          style={getFilterStyle()}
        >
          Background Effect Preview
        </div>
      </div>
    </div>
  );
}
