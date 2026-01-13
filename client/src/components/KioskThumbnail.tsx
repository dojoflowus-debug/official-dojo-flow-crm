import { KioskConfig } from '../../../shared/kioskConfig';

interface KioskThumbnailProps {
  config: KioskConfig;
  kioskName: string;
  isSelected?: boolean;
}

/**
 * KioskThumbnail - Renders a mini preview of the kiosk design
 * Shows the background, accent color, and a preview of the layout
 */
export function KioskThumbnail({ config, kioskName, isSelected = false }: KioskThumbnailProps) {
  // Get background style
  const getBackgroundStyle = () => {
    if (config.background.type === 'solid') {
      return {
        backgroundColor: config.background.color || '#000000',
      };
    } else if (config.background.type === 'custom' && config.background.customImageUrl) {
      return {
        backgroundImage: `url(${config.background.customImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    } else if (config.background.type === 'preset' && config.background.presetId) {
      const presetMap: Record<string, string> = {
        'martial-arts': '/kiosk-backgrounds/martial-arts-dojo.png',
        'kids': '/kiosk-backgrounds/kids-martial-arts.png',
        'yoga': '/kiosk-backgrounds/yoga-studio.png',
        'fitness': '/kiosk-backgrounds/fitness-battle-ropes.png',
        'nature': '/kiosk-backgrounds/japanese-nature.png',
        'zen': '/kiosk-backgrounds/zen-garden.png',
        'dance': '/kiosk-backgrounds/dance-studio.png',
      };
      const bgImage = presetMap[config.background.presetId] || '/kiosk-backgrounds/martial-arts-dojo.png';
      return {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return { backgroundColor: '#000000' };
  };

  const accentColor = config.theme.accentColor || '#ef4444';
  const titleSize = config.typography.titleSize || 48;
  const buttonFontSize = config.typography.buttonFontSize || 16;

  return (
    <div
      className={`relative w-full aspect-square rounded-lg overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-blue-500 opacity-100' : 'opacity-60 hover:opacity-100'
      }`}
      style={{
        ...getBackgroundStyle(),
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content preview */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        {/* Title preview */}
        <div
          className="text-center font-bold text-white mb-1 truncate"
          style={{
            fontSize: `${Math.min(titleSize * 0.15, 14)}px`,
          }}
        >
          {config.content.leftTileTitle || 'Title'}
        </div>

        {/* Two-tile layout preview */}
        <div className="flex gap-1 w-full px-1">
          {/* Left tile */}
          <div
            className="flex-1 rounded p-1 flex items-center justify-center"
            style={{
              backgroundColor: accentColor,
              opacity: 0.8,
            }}
          >
            <span
              className="text-white font-semibold text-center truncate"
              style={{
                fontSize: `${Math.min(buttonFontSize * 0.6, 8)}px`,
              }}
            >
              L
            </span>
          </div>

          {/* Right tile */}
          <div
            className="flex-1 rounded p-1 flex items-center justify-center"
            style={{
              backgroundColor: accentColor,
              opacity: 0.8,
            }}
          >
            <span
              className="text-white font-semibold text-center truncate"
              style={{
                fontSize: `${Math.min(buttonFontSize * 0.6, 8)}px`,
              }}
            >
              R
            </span>
          </div>
        </div>
      </div>

      {/* Kiosk name label */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
        <p className="text-xs text-white truncate font-medium">{kioskName}</p>
      </div>
    </div>
  );
}
