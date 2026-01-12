import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { KioskConfig } from '../../../shared/kioskConfig';

interface KioskBackgroundControlsProps {
  settings: KioskConfig['background'];
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
  const safeSettings = settings || {
    type: 'solid',
    color: '#ffffff',
    presetKey: null,
    customUrl: null,
    blur: 0,
    dim: 0,
    fit: 'cover',
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        onChange('type', 'custom');
        onChange('customUrl', base64);
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
                onChange('type', preset.key === 'none' ? 'solid' : 'preset');
                onChange('presetKey', preset.key === 'none' ? null : preset.key);
                onChange('customUrl', null);
              }}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                (preset.key === 'none' && safeSettings.type === 'solid') || safeSettings.presetKey === preset.key
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
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
        {safeSettings.customUrl && (
          <div className="mt-3 flex items-center gap-2">
            <div
              className="w-12 h-12 rounded bg-cover bg-center"
              style={{ backgroundImage: `url(${safeSettings.customUrl})` }}
            />
            <div className="flex-1">
              <div className="text-xs text-slate-400">Custom background uploaded</div>
            </div>
            <button
              onClick={() => {
                onChange('type', 'solid');
                onChange('customUrl', null);
              }}
              className="p-1 hover:bg-slate-800 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Solid Color */}
      <div>
        <label className="block text-sm font-medium mb-3">Solid Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={safeSettings.color || '#ffffff'}
            onChange={(e) => {
              onChange('type', 'solid');
              onChange('color', e.target.value);
            }}
            className="w-12 h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={safeSettings.color || '#ffffff'}
            onChange={(e) => {
              onChange('type', 'solid');
              onChange('color', e.target.value);
            }}
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm font-mono"
          />
        </div>
      </div>

      {/* Blur */}
      <div>
        <label className="block text-sm font-medium mb-2">Blur</label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="0"
            max="24"
            value={safeSettings.blur || 0}
            onChange={(e) => onChange('blur', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12 text-right">{safeSettings.blur || 0}</span>
        </div>
      </div>

      {/* Dim/Overlay */}
      <div>
        <label className="block text-sm font-medium mb-2">Dim</label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="0"
            max="100"
            value={safeSettings.dim || 0}
            onChange={(e) => onChange('dim', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12 text-right">{safeSettings.dim || 0}%</span>
        </div>
      </div>

      {/* Fit Mode */}
      <div>
        <label className="block text-sm font-medium mb-2">Fit Mode</label>
        <select
          value={safeSettings.fit || 'cover'}
          onChange={(e) => onChange('fit', e.target.value)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="stretch">Stretch</option>
        </select>
      </div>
    </div>
  );
}
