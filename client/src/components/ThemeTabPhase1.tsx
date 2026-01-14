import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { KioskConfig, MOOD_PRESETS, CardStyle } from '../../../shared/kioskConfig';
import { KIOSK_BACKGROUND_PRESETS } from '../../../shared/kioskBackgroundPresets';
import { Accordion } from '@/components/Accordion';
import { GlassMorphismEngine } from '@/components/GlassMorphismEngine';
import { TypographyPanel } from '@/components/TypographyPanel';

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
  onTypographyChange?: (typography: any) => void;
}

const BACKGROUND_THEMES = KIOSK_BACKGROUND_PRESETS.slice(0, 6).map(preset => ({
  id: preset.id,
  name: preset.name,
  image: preset.imageUrl,
}));

type CardType = 'next-class' | 'today-focus' | 'check-in' | 'start-training' | 'time-pill';

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
  onTypographyChange,
}: ThemeTabPhase1Props) {
  const [applyToAll, setApplyToAll] = useState(true);
  const [selectedCardType, setSelectedCardType] = useState<CardType>('next-class');
  const [perCardStyles, setPerCardStyles] = useState<Record<CardType, CardStyle>>({
    'next-class': draftConfig.cardStyle || {},
    'today-focus': draftConfig.cardStyle || {},
    'check-in': draftConfig.cardStyle || {},
    'start-training': draftConfig.cardStyle || {},
    'time-pill': draftConfig.cardStyle || {},
  } as any);

  const handleCardStyleChange = (style: CardStyle) => {
    if (applyToAll) {
      // Apply to all cards
      onCardStyleChange(style);
      // Update all per-card styles
      const updated = { ...perCardStyles };
      Object.keys(updated).forEach(key => {
        updated[key as CardType] = style;
      });
      setPerCardStyles(updated);
    } else {
      // Apply only to selected card
      const updated = { ...perCardStyles };
      updated[selectedCardType] = style;
      setPerCardStyles(updated);
      // Still update main config for preview
      onCardStyleChange(style);
    }
  };

  const currentCardStyle = applyToAll 
    ? (draftConfig.cardStyle || {})
    : (perCardStyles[selectedCardType] || draftConfig.cardStyle || {});

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
            description: 'Customize the white panels on your kiosk with glass morphism',
            content: (
              <div className="space-y-6">
                {/* Apply to All vs Per-Card Toggle */}
                <div className="flex gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                  <button
                    onClick={() => setApplyToAll(true)}
                    className={`flex-1 px-3 py-2 rounded text-xs font-medium transition ${
                      applyToAll
                        ? 'bg-red-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    Apply to All
                  </button>
                  <button
                    onClick={() => setApplyToAll(false)}
                    className={`flex-1 px-3 py-2 rounded text-xs font-medium transition ${
                      !applyToAll
                        ? 'bg-red-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    Per-Card
                  </button>
                </div>

                {/* Per-Card Selector */}
                {!applyToAll && (
                  <div>
                    <Label className="text-xs font-semibold mb-3 block">Select Card</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'next-class', label: 'Next Class' },
                        { id: 'today-focus', label: 'Today\'s Focus' },
                        { id: 'check-in', label: 'Check In' },
                        { id: 'start-training', label: 'Start Training' },
                        { id: 'time-pill', label: 'Time Pill' },
                      ].map((card) => (
                        <button
                          key={card.id}
                          onClick={() => setSelectedCardType(card.id as CardType)}
                          className={`px-3 py-2 rounded text-xs font-medium transition ${
                            selectedCardType === card.id
                              ? 'bg-red-500 text-white'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          {card.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Glass Morphism Engine */}
                <GlassMorphismEngine
                  cardStyle={currentCardStyle}
                  onStyleChange={handleCardStyleChange}
                  onSliderChange={onSliderChange}
                />
              </div>
            ),
            onReset: onResetCardStyle,
          },
          {
            id: 'typography',
            title: 'Typography',
            description: 'Customize fonts and text styling',
            content: onTypographyChange ? (
              <TypographyPanel
                typography={draftConfig.typographySystem || {}}
                onChange={onTypographyChange}
                onSliderChange={onSliderChange}
              />
            ) : null,
            onReset: () => {
              if (onTypographyChange) {
                onTypographyChange({
                  fontFamily: 'Inter',
                  fontWeight: 400,
                  letterSpacing: 0,
                  headerColor: '#ffffff',
                  bodyColor: 'rgba(255, 255, 255, 0.8)',
                  buttonTextColor: '#ffffff',
                  timeWidgetColor: 'rgba(255, 255, 255, 0.9)',
                  enableGlow: false,
                  glowColor: '#ffffff',
                  glowBlur: 0,
                  enableShadow: false,
                  shadowColor: 'rgba(0, 0, 0, 0)',
                  shadowBlur: 0,
                });
              }
            },
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
