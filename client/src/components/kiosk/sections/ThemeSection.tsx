interface ThemeSectionProps {
  state: any;
  setState: (state: any) => void;
}

const themes = [
  { id: 'default', name: 'Default', colors: ['#ef4444', '#fbbf24'] },
  { id: 'modern', name: 'Modern', colors: ['#3b82f6', '#10b981'] },
  { id: 'minimal', name: 'Minimal', colors: ['#1f2937', '#6b7280'] },
  { id: 'bold', name: 'Bold', colors: ['#dc2626', '#f59e0b'] },
];

export default function ThemeSection({ state, setState }: ThemeSectionProps) {
  const handleThemeChange = (themeId: string) => {
    setState({
      ...state,
      theme: themeId,
    });
  };

  const handlePrimaryColorChange = (color: string) => {
    setState({
      ...state,
      colors: {
        ...state.colors,
        primary: color,
      },
    });
  };

  const handleSecondaryColorChange = (color: string) => {
    setState({
      ...state,
      colors: {
        ...state.colors,
        secondary: color,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Theme Presets */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">Theme Preset</label>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                state.theme === theme.id
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-white/10 bg-slate-700/30 hover:border-white/30'
              }`}
            >
              <p className="text-sm font-medium text-white">{theme.name}</p>
              <div className="flex gap-1 mt-2">
                {theme.colors.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-4 h-4 rounded border border-white/20"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="pt-2 border-t border-white/10 space-y-3">
        {/* Primary Color */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Primary Color</label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={state.colors.primary}
              onChange={(e) => handlePrimaryColorChange(e.target.value)}
              className="w-16 h-10 rounded-lg cursor-pointer border border-white/10"
            />
            <input
              type="text"
              value={state.colors.primary}
              onChange={(e) => handlePrimaryColorChange(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
        </div>

        {/* Secondary Color */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Secondary Color</label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={state.colors.secondary}
              onChange={(e) => handleSecondaryColorChange(e.target.value)}
              className="w-16 h-10 rounded-lg cursor-pointer border border-white/10"
            />
            <input
              type="text"
              value={state.colors.secondary}
              onChange={(e) => handleSecondaryColorChange(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Font Selection */}
      <div className="pt-2 border-t border-white/10">
        <label className="block text-sm font-medium text-white mb-2">Font Family</label>
        <select className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50">
          <option value="system-ui">System UI</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
          <option value="sans-serif">Sans Serif</option>
        </select>
      </div>
    </div>
  );
}
