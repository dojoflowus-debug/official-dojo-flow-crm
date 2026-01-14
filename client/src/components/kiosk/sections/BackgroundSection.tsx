import { useState } from 'react';
import { Upload, X } from 'lucide-react';

interface BackgroundSectionProps {
  state: any;
  setState: (state: any) => void;
}

const backgroundPresets = [
  { id: 'warm', name: 'Dojo Warm', preview: '/presets/dojo-warm.jpg' },
  { id: 'minimal', name: 'Minimal White', preview: '/presets/minimal-white.jpg' },
  { id: 'night', name: 'Night Mode', preview: '/presets/night-mode.jpg' },
  { id: 'contrast', name: 'High Contrast', preview: '/presets/high-contrast.jpg' },
];

export default function BackgroundSection({ state, setState }: BackgroundSectionProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const handleColorChange = (color: string) => {
    setState({
      ...state,
      background: {
        ...state.background,
        type: 'color',
        color,
      },
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setUploadedImages([...uploadedImages, imageUrl]);
        setState({
          ...state,
          background: {
            ...state.background,
            type: 'image',
            imageUrl,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBlurChange = (blur: number) => {
    setState({
      ...state,
      background: {
        ...state.background,
        blur,
      },
    });
  };

  const handleDimChange = (dim: number) => {
    setState({
      ...state,
      background: {
        ...state.background,
        dim,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Background Type */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">Background Type</label>
        <div className="flex gap-2">
          {['color', 'image', 'preset'].map((type) => (
            <button
              key={type}
              onClick={() => setState({
                ...state,
                background: { ...state.background, type: type as any },
              })}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                state.background.type === type
                  ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                  : 'bg-slate-700/30 border border-white/10 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Color Picker */}
      {state.background.type === 'color' && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">Color</label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={state.background.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-16 h-10 rounded-lg cursor-pointer border border-white/10"
            />
            <input
              type="text"
              value={state.background.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
        </div>
      )}

      {/* Image Upload */}
      {state.background.type === 'image' && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">Upload Image</label>
          <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-white/20 rounded-lg hover:border-white/40 cursor-pointer transition-colors bg-slate-700/20 hover:bg-slate-700/30">
            <div className="text-center">
              <Upload size={24} className="text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-300">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          {/* Uploaded Images Gallery */}
          {uploadedImages.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-slate-300 mb-2">Uploaded Images</p>
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt={`Upload ${idx}`}
                      className={`w-full h-20 object-cover rounded-lg border-2 cursor-pointer transition-all ${
                        state.background.imageUrl === img
                          ? 'border-red-500'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                      onClick={() => setState({
                        ...state,
                        background: { ...state.background, imageUrl: img },
                      })}
                    />
                    <button
                      onClick={() => {
                        setUploadedImages(uploadedImages.filter((_, i) => i !== idx));
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Presets */}
      {state.background.type === 'preset' && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">Select Preset</label>
          <div className="grid grid-cols-2 gap-3">
            {backgroundPresets.map((preset) => (
              <button
                key={preset.id}
                className="relative group overflow-hidden rounded-lg border-2 border-white/10 hover:border-white/30 transition-all"
                onClick={() => setState({
                  ...state,
                  background: { ...state.background, presetKey: preset.id },
                })}
              >
                <div className="w-full h-24 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-400">
                  {preset.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3 pt-2 border-t border-white/10">
        {/* Blur */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Blur: {state.background.blur}
          </label>
          <input
            type="range"
            min="0"
            max="24"
            value={state.background.blur}
            onChange={(e) => handleBlurChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>

        {/* Dim */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Dim: {state.background.dim}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={state.background.dim}
            onChange={(e) => handleDimChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>
      </div>
    </div>
  );
}
