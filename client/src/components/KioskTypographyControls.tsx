/**
 * KioskTypographyControls - Typography settings for kiosk
 * 
 * Provides controls for:
 * - Font family selection
 * - Title size (24-72px)
 * - Title weight (400-900)
 * - Subtitle size (14-48px)
 * - Letter spacing (-2 to 4px)
 * - Button font size (12-24px)
 */

interface TypographySettings {
  fontFamily?: string;
  titleSize?: number;
  titleWeight?: number;
  subtitleSize?: number;
  letterSpacing?: number;
  buttonFontSize?: number;
}

interface KioskTypographyControlsProps {
  settings: TypographySettings;
  onChange: (key: string, value: any) => void;
}

export function KioskTypographyControls({
  settings,
  onChange,
}: KioskTypographyControlsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Font Family</label>
        <select
          value={settings.fontFamily || 'system'}
          onChange={(e) => onChange('fontFamily', e.target.value)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
        >
          <option value="system">System Default</option>
          <option value="sans">Sans Serif</option>
          <option value="serif">Serif</option>
          <option value="mono">Monospace</option>
          <option value="inter">Inter</option>
          <option value="poppins">Poppins</option>
          <option value="playfair">Playfair Display</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Title Size</label>
        <div className="flex gap-2">
          <input
            type="range"
            min="24"
            max="72"
            value={settings.titleSize || 48}
            onChange={(e) => onChange('titleSize', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12 text-right">{settings.titleSize || 48}px</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Title Weight</label>
        <select
          value={settings.titleWeight || 700}
          onChange={(e) => onChange('titleWeight', parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
        >
          <option value={400}>Regular (400)</option>
          <option value={500}>Medium (500)</option>
          <option value={600}>Semi-bold (600)</option>
          <option value={700}>Bold (700)</option>
          <option value={800}>Extra-bold (800)</option>
          <option value={900}>Black (900)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Subtitle Size</label>
        <div className="flex gap-2">
          <input
            type="range"
            min="14"
            max="48"
            value={settings.subtitleSize || 24}
            onChange={(e) => onChange('subtitleSize', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12 text-right">{settings.subtitleSize || 24}px</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Letter Spacing</label>
        <div className="flex gap-2">
          <input
            type="range"
            min="-2"
            max="4"
            step="0.1"
            value={settings.letterSpacing || 0}
            onChange={(e) => onChange('letterSpacing', parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12 text-right">{settings.letterSpacing || 0}px</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Button Font Size</label>
        <div className="flex gap-2">
          <input
            type="range"
            min="12"
            max="24"
            value={settings.buttonFontSize || 16}
            onChange={(e) => onChange('buttonFontSize', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12 text-right">{settings.buttonFontSize || 16}px</span>
        </div>
      </div>
    </div>
  );
}
