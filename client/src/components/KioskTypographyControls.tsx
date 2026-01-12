import { KioskConfig } from '../../../shared/kioskConfig';

interface KioskTypographyControlsProps {
  typography: KioskConfig['typography'];
  onChange: (key: string, value: any) => void;
}

export function KioskTypographyControls({
  typography,
  onChange,
}: KioskTypographyControlsProps) {
  const safeSettings = typography || {
    titleSize: 48,
    titleWeight: 700,
    subtitleSize: 24,
    letterSpacing: 0,
    buttonFontSize: 16,
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Title Size</label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="24"
            max="72"
            value={safeSettings.titleSize || 48}
            onChange={(e) => onChange('titleSize', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12 text-right">{safeSettings.titleSize || 48}px</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Title Weight</label>
        <select
          value={safeSettings.titleWeight || 700}
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
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="14"
            max="48"
            value={safeSettings.subtitleSize || 24}
            onChange={(e) => onChange('subtitleSize', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12 text-right">{safeSettings.subtitleSize || 24}px</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Letter Spacing</label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="-2"
            max="4"
            step="0.5"
            value={safeSettings.letterSpacing || 0}
            onChange={(e) => onChange('letterSpacing', parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12 text-right">{safeSettings.letterSpacing || 0}px</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Button Font Size</label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="12"
            max="24"
            value={safeSettings.buttonFontSize || 16}
            onChange={(e) => onChange('buttonFontSize', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12 text-right">{safeSettings.buttonFontSize || 16}px</span>
        </div>
      </div>
    </div>
  );
}
