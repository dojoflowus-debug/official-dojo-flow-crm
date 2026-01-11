import { useState } from 'react';
import { Upload, X } from 'lucide-react';

/**
 * KioskBackgroundControls - Background appearance settings for kiosk
 * 
 * Provides controls for:
 * - Preset gallery selector
 * - Custom image upload
 * - Solid background color picker
 * - Dim/blur sliders
 * - Background fit mode
 */

interface BackgroundSettings {
  backgroundImageUrl?: string;
  presetKey?: string;
  backgroundColor?: string;
  backgroundIntensity?: number;
  backgroundBlur?: number;
  backgroundFitMode?: string;
}

interface KioskBackgroundControlsProps {
  settings: BackgroundSettings;
  onChange: (key: string, value: any) => void;
}

const PRESET_BACKGROUNDS = [
  { key: 'none', name: 'None (White)', color: '#ffffff' },
  { key: 'dojo-warm-lights', name: 'Warm Lights', image: '/kiosk-welcome-bg.jpg' },
  { key: 'dojo-dark', name: 'Dark', image: '/kiosk-dark-bg.jpg' },
  { key: 'dojo-minimal', name: 'Minimal', image: '/kiosk-minimal-bg.jpg' },
];

export function KioskBackgroundControls({
  settings,
  onChange,
}: KioskBackgroundControlsProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('File size must be less than 8MB');
      return;
    }

    setIsUploading(true);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        // TODO: Call TRPC mutation to upload
        // For now, just set the data URL
        onChange('backgroundImageUrl', base64);
        onChange('presetKey', null);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preset Gallery */}
      <div>
        <label className="block text-sm font-medium mb-3">Background Preset</label>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_BACKGROUNDS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => {
                onChange('presetKey', preset.key);
                onChange('backgroundImageUrl', undefined);
              }}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                settings.presetKey === preset.key
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="text-sm font-medium">{preset.name}</div>
              {preset.image && (
                <div
                  className="w-full h-12 rounded mt-2 bg-cover bg-center"
                  style={{ backgroundImage: `url(${preset.image})` }}
                />
              )}
              {preset.color && (
                <div
                  className="w-full h-12 rounded mt-2"
                  style={{ backgroundColor: preset.color }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">Custom Background</label>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="bg-upload"
          />
          <label
            htmlFor="bg-upload"
            className="block px-4 py-3 border-2 border-dashed border-slate-700 rounded-lg text-center cursor-pointer hover:border-slate-600 transition-colors"
          >
            {isUploading ? (
              <div className="text-sm text-slate-400">Uploading...</div>
            ) : (
              <>
                <Upload className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                <div className="text-sm text-slate-400">Click to upload</div>
                <div className="text-xs text-slate-500">PNG, JPG, WebP (max 8MB)</div>
              </>
            )}
          </label>
        </div>
        {settings.backgroundImageUrl && (
          <div className="mt-3 flex items-center gap-2">
            <div
              className="w-12 h-12 rounded bg-cover bg-center"
              style={{ backgroundImage: `url(${settings.backgroundImageUrl})` }}
            />
            <div className="flex-1">
              <div className="text-xs text-slate-400">Custom background uploaded</div>
            </div>
            <button
              onClick={() => onChange('backgroundImageUrl', undefined)}
              className="p-1 hover:bg-slate-800 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Background Intensity (Dim) */}
      <div>
        <label className="block text-sm font-medium mb-2">Background Intensity</label>
        <div className="flex gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={settings.backgroundIntensity || 0}
            onChange={(e) => onChange('backgroundIntensity', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12 text-right">{settings.backgroundIntensity || 0}%</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Controls the darkness overlay</p>
      </div>

      {/* Background Blur */}
      <div>
        <label className="block text-sm font-medium mb-2">Background Blur</label>
        <div className="flex gap-2">
          <input
            type="range"
            min="0"
            max="24"
            value={settings.backgroundBlur || 0}
            onChange={(e) => onChange('backgroundBlur', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12 text-right">{settings.backgroundBlur || 0}px</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Controls the blur amount</p>
      </div>

      {/* Background Fit Mode */}
      <div>
        <label className="block text-sm font-medium mb-2">Background Fit</label>
        <select
          value={settings.backgroundFitMode || 'cover'}
          onChange={(e) => onChange('backgroundFitMode', e.target.value)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
        >
          <option value="cover">Cover (fill and crop)</option>
          <option value="contain">Contain (fit inside)</option>
          <option value="fill">Fill (stretch)</option>
          <option value="scale-down">Scale Down</option>
        </select>
      </div>

      {/* Background Color Picker */}
      <div>
        <label className="block text-sm font-medium mb-2">Background Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={settings.backgroundColor || '#ffffff'}
            onChange={(e) => onChange('backgroundColor', e.target.value)}
            className="w-12 h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={settings.backgroundColor || '#ffffff'}
            onChange={(e) => onChange('backgroundColor', e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
            placeholder="#ffffff"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">Used when no image is selected</p>
      </div>
    </div>
  );
}
