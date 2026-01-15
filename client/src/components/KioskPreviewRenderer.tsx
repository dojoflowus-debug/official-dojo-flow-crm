import React from 'react';
import { normalizeKioskConfig } from '../lib/defaultKioskConfig';

interface KioskPreviewRendererProps {
  config: any;
  isLiveMode?: boolean;
  className?: string;
}

/**
 * KioskPreviewRenderer - Renders the kiosk preview content from config
 * This is what gets displayed inside the device frame
 */
export const KioskPreviewRenderer: React.FC<KioskPreviewRendererProps> = ({
  config,
  isLiveMode = false,
  className = '',
}) => {
  // Normalize config with defaults
  const normalizedConfig = normalizeKioskConfig(config);

  const {
    moodPreset,
    backgroundTheme,
    blur,
    dim,
    accentColor,
    layout,
  } = normalizedConfig;

  // Get background image based on theme
  const getBackgroundImage = () => {
    const backgrounds: Record<string, string> = {
      'martial-arts-dojo': 'linear-gradient(135deg, #8B4513 0%, #654321 100%)',
      'kids-martial-arts': 'linear-gradient(135deg, #FF6B9D 0%, #FFC75F 100%)',
      'zen-garden': 'linear-gradient(135deg, #90EE90 0%, #3CB371 100%)',
      'karate-training': 'linear-gradient(135deg, #1E90FF 0%, #4169E1 100%)',
      'yoga-studio': 'linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 100%)',
      'yoga-in-nature': 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)',
    };
    return backgrounds[backgroundTheme] || backgrounds['martial-arts-dojo'];
  };

  // Get mood preset colors
  const getMoodColors = () => {
    const moodColors: Record<string, { primary: string; secondary: string; text: string }> = {
      'dojo-dark': { primary: '#1a1a1a', secondary: '#2d2d2d', text: '#ffffff' },
      'kids-bright': { primary: '#FFE5B4', secondary: '#FFD700', text: '#000000' },
      'zen': { primary: '#E8F5E9', secondary: '#C8E6C9', text: '#1B5E20' },
      'luxury': { primary: '#1a1a2e', secondary: '#16213e', text: '#eaeaea' },
    };
    return moodColors[moodPreset] || moodColors['dojo-dark'];
  };

  const moodColors = getMoodColors();
  const backgroundImage = getBackgroundImage();

  return (
    <div
      className={`flex flex-col items-center justify-center relative overflow-hidden ${className}`}
      style={{
        width: '100%',
        height: '100%',
        background: backgroundImage,
        filter: `blur(${blur}px) brightness(${1 - dim * 0.01})`,
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(0, 0, 0, ${dim * 0.01})`,
          pointerEvents: 'none',
        }}
      />

      {/* Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '40px 20px',
          color: moodColors.text,
          boxSizing: 'border-box',
        }}
      >
        {/* Logo Placeholder */}
        {layout?.showLogo && (
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: accentColor,
              marginBottom: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            🥋
          </div>
        )}

        {/* Time Display */}
        {layout?.showTime && (
          <div
            style={{
              fontSize: '14px',
              marginBottom: '40px',
              opacity: 0.8,
              flexShrink: 0,
            }}
          >
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}

        {/* Cards Grid - Simplified */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            width: '100%',
            maxWidth: '500px',
            marginBottom: '30px',
          }}
        >
          {layout?.cards && layout.cards.length > 0 ? (
            layout.cards.map((card: any, idx: number) => (
              <div
                key={card.id || `card-${idx}`}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  background: `rgba(255, 255, 255, 0.15)`,
                  border: `2px solid ${accentColor}`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  minHeight: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `rgba(255, 255, 255, 0.25)`;
                  el.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `rgba(255, 255, 255, 0.15)`;
                  el.style.transform = 'scale(1)';
                }}
              >
                {/* Card Icon */}
                <div
                  style={{
                    fontSize: '32px',
                    marginBottom: '10px',
                    color: accentColor,
                  }}
                >
                  {card.icon || '•'}
                </div>

                {/* Card Title */}
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: moodColors.text,
                    margin: 0,
                  }}
                >
                  {card.title}
                </h3>

                {/* Card Subtitle */}
                <p
                  style={{
                    fontSize: '12px',
                    opacity: 0.8,
                    color: moodColors.text,
                    margin: 0,
                  }}
                >
                  {card.subtitle}
                </p>
              </div>
            ))
          ) : (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '40px',
                textAlign: 'center',
                opacity: 0.5,
              }}
            >
              <p>No cards configured</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          style={{
            padding: '12px 32px',
            borderRadius: '24px',
            background: accentColor,
            color: '#ffffff',
            border: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.opacity = '0.9';
            el.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.opacity = '1';
            el.style.transform = 'scale(1)';
          }}
        >
          Get Started
        </button>

        {/* Focus Display */}
        {layout?.showFocus && (
          <div
            style={{
              marginTop: '30px',
              fontSize: '12px',
              opacity: 0.6,
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            <p style={{ margin: 0 }}>Today's Focus</p>
            <p style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '5px', margin: 0 }}>
              Discipline • Confidence • Fitness
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
