/**
 * ThemeTabWithPresets - Enhanced theme tab with full preset functionality
 * Features: atomic preset updates, custom tracking, section reset, full reset
 */

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { KioskConfig, MOOD_PRESETS, CardStyle } from '../../../shared/kioskConfig';
import { KIOSK_BACKGROUND_PRESETS } from '../../../shared/kioskBackgroundPresets';
import { Accordion } from '@/components/Accordion';
import { GlassMorphismEngine } from '@/components/GlassMorphismEngine';
import { TypographyPanel } from '@/components/TypographyPanel';
import { ButtonStylePanel } from '@/components/ButtonStylePanel';
import { CinematicEnvironmentSelector } from '@/components/CinematicEnvironmentSelector';
import { StudioProfilesSelector } from '@/components/StudioProfilesSelector';
import { StudioInstrumentsPanel } from '@/components/StudioInstrumentsPanel';
import { EnvironmentEffectsPanel, type EnvironmentEffects } from '@/components/EnvironmentEffectsPanel';
import type { ButtonStyleConfig } from '../../../shared/buttonStyleConfig';
import { DEFAULT_BUTTON_STYLE } from '../../../shared/buttonStyleConfig';
import { useThemePreset } from '@/hooks/useThemePreset';
import { RotateCcw } from 'lucide-react';

interface ThemeTabWithPresetsProps {
  draftConfig: KioskConfig;
  locationId: string | number;
  deviceType: string;
  onConfigChange: (config: Partial<KioskConfig>) => void;
  onCardStyleChange: (cardStyle: CardStyle) => void;
  onBackgroundChange: (key: string, value: any) => void;
  onThemeChange: (key: string, value: any) => void;
  onSliderChange: (callback: () => void) => void;
  onTypographyChange?: (typography: any) => void;
  onButtonStyleChange?: (buttonStyle: ButtonStyleConfig) => void;
  onEnvironmentEffectsChange?: (effects: EnvironmentEffects) => void;
}

const BACKGROUND_THEMES = KIOSK_BACKGROUND_PRESETS.slice(0, 6).map(preset => ({
  id: preset.id,
  name: preset.name,
  image: preset.imageUrl,
}));

type CardType = 'next-class' | 'today-focus' | 'check-in' | 'start-training' | 'time-pill';

export function ThemeTabWithPresets({
  draftConfig,
  locationId,
  deviceType,
  onConfigChange,
  onCardStyleChange,
  onBackgroundChange,
  onThemeChange,
  onSliderChange,
  onTypographyChange,
  onButtonStyleChange,
  onEnvironmentEffectsChange,
}: ThemeTabWithPresetsProps) {
  const [applyToAll, setApplyToAll] = useState(true);
  const [selectedCardType, setSelectedCardType] = useState<CardType>('next-class');
  const [perCardStyles, setPerCardStyles] = useState<Record<CardType, CardStyle>>({
    'next-class': draftConfig.cardStyle || {},
    'today-focus': draftConfig.cardStyle || {},
    'check-in': draftConfig.cardStyle || {},
    'start-training': draftConfig.cardStyle || {},
    'time-pill': draftConfig.cardStyle || {},
  } as any);
  const [environmentEffects, setEnvironmentEffects] = useState<EnvironmentEffects>(
    draftConfig.environmentEffects || {
      blur: 0,
      glow: 0,
      opacity: 65,
      saturation: 0,
      shadow: 0,
      border: 0,
    }
  );

  // Use theme preset hook for localStorage persistence
  const themePreset = useThemePreset({
    locationId,
    deviceType,
    defaultPresetKey: 'dojo-dark',
    onThemeChange: (themeValues) => {
      onConfigChange(themeValues);
    },
  });

  const handleCardStyleChange = (style: CardStyle) => {
    if (applyToAll) {
      onCardStyleChange(style);
      const updated = { ...perCardStyles };
      Object.keys(updated).forEach(key => {
        updated[key as CardType] = style;
      });
      setPerCardStyles(updated);
    } else {
      const updated = { ...perCardStyles };
      updated[selectedCardType] = style;
      setPerCardStyles(updated);
      onCardStyleChange(style);
    }
    themePreset.markCustom();
  };

  const handlePresetSelect = (presetKey: string) => {
    themePreset.selectPreset(presetKey);
  };

  const handleResetAll = () => {
    themePreset.resetAllToDefault();
  };

  const handleResetCardStyle = () => {
    themePreset.resetSectionToPreset('cardStyle');
  };

  const handleResetTypography = () => {
    themePreset.resetSectionToPreset('typographySystem');
  };

  const handleResetAccent = () => {
    themePreset.resetSectionToPreset('accentSystem');
  };

  const handleResetBackground = () => {
    themePreset.resetSectionToPreset('backgroundIntelligence');
  };

  const handleEnvironmentEffectsChange = (effects: EnvironmentEffects) => {
    setEnvironmentEffects(effects);
    if (onEnvironmentEffectsChange) {
      onEnvironmentEffectsChange(effects);
    }
    onConfigChange({ environmentEffects: effects });
  };

  const currentCardStyle = applyToAll 
    ? (draftConfig.cardStyle || {})
    : (perCardStyles[selectedCardType] || draftConfig.cardStyle || {});

  return (
    <div className="flex-1 space-y-6 overflow-y-auto">
      {/* CINEMATIC ENVIRONMENT - Primary Feature */}
      <CinematicEnvironmentSelector
        selectedEnvironmentId={draftConfig.environmentId}
        onEnvironmentSelect={(envId, imageUrl) => {
          onConfigChange({
            environmentId: envId,
            backgroundImage: imageUrl
          });
          console.log(`[ThemeTabWithPresets] Environment selected: ${envId}, image: ${imageUrl}`);
        }}
      />

      {/* STUDIO INSTRUMENTS - Main Control Panel */}
      <div className="space-y-4 border-t border-white/10 pt-6">
        <div>
          <h3 className="text-sm font-bold text-white">Studio Instruments</h3>
          <p className="text-xs mt-1" style={{color: 'rgba(255,255,255,0.4)'}}>Fine-tune lighting, atmosphere, depth, and accents</p>
        </div>
        <EnvironmentEffectsPanel
          effects={environmentEffects}
          onChange={handleEnvironmentEffectsChange}
        />
      </div>

      {/* STUDIO PROFILES - Secondary Feature */}
      <StudioProfilesSelector
        selectedProfileKey={themePreset.selectedPresetKey}
        isCustom={themePreset.isCustom}
        onProfileSelect={handlePresetSelect}
        onResetAll={handleResetAll}
      />

      {/* ADVANCED CONTROLS - Collapsed by default */}
      <Accordion
        items={[
          {
            id: 'advanced-card-controls',
            title: 'Advanced Card Controls',
            description: 'Per-card styling and glass morphism effects',
            content: (
              <div className="space-y-6">
                {/* Apply to All vs Per-Card Toggle */}
                <div className="flex items-center gap-4">
                  <Label className="text-xs text-gray-400">Apply to:</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setApplyToAll(true)}
                      className={`px-3 py-1 rounded text-xs transition ${
                        applyToAll
                          ? 'bg-red-500/20 border border-red-500 text-red-400'
                          : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      All Cards
                    </button>
                    <button
                      onClick={() => setApplyToAll(false)}
                      className={`px-3 py-1 rounded text-xs transition ${
                        !applyToAll
                          ? 'bg-red-500/20 border border-red-500 text-red-400'
                          : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      Selected Card
                    </button>
                  </div>
                </div>

                {/* Per-Card Selection */}
                {!applyToAll && (
                  <div className="flex gap-2 flex-wrap">
                    {(['next-class', 'today-focus', 'check-in', 'start-training', 'time-pill'] as CardType[]).map(
                      cardType => (
                        <button
                          key={cardType}
                          onClick={() => setSelectedCardType(cardType)}
                          className={`px-3 py-1 rounded text-xs transition ${
                            selectedCardType === cardType
                              ? 'bg-red-500/20 border border-red-500 text-red-400'
                              : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {cardType.replace('-', ' ')}
                        </button>
                      )
                    )}
                  </div>
                )}

                {/* Glass Morphism Engine */}
                <GlassMorphismEngine
                  cardStyle={currentCardStyle}
                  onChange={handleCardStyleChange}
                  onSliderChange={onSliderChange}
                />

                {/* Reset Card Style Button */}
                <button
                  onClick={handleResetCardStyle}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm text-gray-400 hover:text-gray-300"
                >
                  <RotateCcw size={16} />
                  Reset to Profile
                </button>
              </div>
            ),
          },
          {
            id: 'typography',
            title: 'Typography',
            description: 'Font family, sizes, and text effects',
            content: (
              <div className="space-y-4">
                <TypographyPanel
                  typography={draftConfig.typographySystem || {}}
                  onChange={onTypographyChange}
                  onSliderChange={onSliderChange}
                />
                
                {/* Reset Typography Button */}
                <button
                  onClick={handleResetTypography}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm text-gray-400 hover:text-gray-300"
                >
                  <RotateCcw size={16} />
                  Reset Typography to Preset
                </button>
              </div>
            ),
          },
          {
            id: 'button-styling',
            title: 'Button Styling',
            description: 'Customize button appearance and animations',
            content: (
              <div className="space-y-4">
                <ButtonStylePanel
                  buttonStyle={draftConfig.buttonStyle || DEFAULT_BUTTON_STYLE}
                  onChange={onButtonStyleChange}
                  onSliderChange={onSliderChange}
                />
              </div>
            ),
          },
          {
            id: 'background',
            title: 'Background',
            description: 'Image, color, blur, and effects',
            content: (
              <div className="space-y-4">
                {/* Background controls */}
                <div className="space-y-3">
                  <Label className="text-xs text-gray-400">Background Type</Label>
                  <select
                    value={draftConfig.backgroundIntelligence?.type || 'solid'}
                    onChange={(e) => onBackgroundChange('type', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                  >
                    <option value="solid">Solid Color</option>
                    <option value="preset">Preset Image</option>
                    <option value="custom">Custom Upload</option>
                  </select>
                </div>

                {/* Blur slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs text-gray-400">Blur</Label>
                    <span className="text-xs text-gray-400">
                      {draftConfig.backgroundIntelligence?.blur || 0}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={draftConfig.backgroundIntelligence?.blur || 0}
                    onChange={(e) => onBackgroundChange('blur', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Dim slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs text-gray-400">Dim</Label>
                    <span className="text-xs text-gray-400">
                      {draftConfig.backgroundIntelligence?.dim || 0}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={draftConfig.backgroundIntelligence?.dim || 0}
                    onChange={(e) => onBackgroundChange('dim', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Reset Background Button */}
                <button
                  onClick={handleResetBackground}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm text-gray-400 hover:text-gray-300"
                >
                  <RotateCcw size={16} />
                  Reset Background to Preset
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
