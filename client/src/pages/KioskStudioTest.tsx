import { useState } from 'react';
import { Code } from 'lucide-react';
import { KioskConfig, DEFAULT_KIOSK_CONFIG } from '../../../shared/kioskConfig';

/**
 * Standalone test component for Kiosk Studio controls
 * This verifies that sliders, dropdowns, and tabs are clickable and responsive
 */
export default function KioskStudioTest() {
  const [activeTab, setActiveTab] = useState<'design' | 'content' | 'behavior'>('design');
  const [draftConfig, setDraftConfig] = useState<KioskConfig>(DEFAULT_KIOSK_CONFIG);
  const [showDebugPanel, setShowDebugPanel] = useState(true);

  // Update handler
  const updateConfig = (section: keyof KioskConfig, key: string, value: any) => {
    const updated = {
      ...draftConfig,
      [section]: {
        ...(draftConfig[section] as any),
        [key]: value,
      },
    };
    setDraftConfig(updated);
  };

  const handleTypographyChange = (key: string, value: any) => updateConfig('typography', key, value);

  return (
    <div className="min-h-full bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kiosk Studio - Control Test</h1>
            <p className="text-sm text-slate-400">Testing clickability and responsiveness</p>
          </div>
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100%-80px)]">
        {/* Left Panel - Controls with RED OUTLINE */}
        <div className="w-96 border-r border-slate-800 overflow-y-auto bg-slate-900/30 border-4 border-red-500 relative z-50 pointer-events-auto">
          {/* Click Test Button */}
          <div className="p-6 border-b border-slate-800 bg-red-900/20">
            <button
              onClick={() => alert('✓ Click works! Controls are clickable.')}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              Click Test (Debug)
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 px-6">
            {(['design', 'content', 'behavior'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 space-y-6">
            {activeTab === 'design' && (
              <div className="space-y-6">
                {/* Title Size Slider */}
                <div>
                  <label className="block text-sm font-medium mb-2">Title Size (SLIDER TEST)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="range"
                      min="24"
                      max="72"
                      value={draftConfig.typography.titleSize}
                      onChange={(e) => handleTypographyChange('titleSize', parseInt(e.target.value))}
                      className="flex-1 cursor-pointer"
                    />
                    <span className="text-xs text-slate-400 w-12 text-right">
                      {draftConfig.typography.titleSize}px
                    </span>
                  </div>
                  <p className="text-xs text-yellow-400 mt-2">Move slider → number should change live</p>
                </div>

                {/* Title Weight Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">Title Weight (DROPDOWN TEST)</label>
                  <select
                    value={draftConfig.typography.titleWeight}
                    onChange={(e) => handleTypographyChange('titleWeight', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm cursor-pointer"
                  >
                    <option value={400}>Regular (400)</option>
                    <option value={500}>Medium (500)</option>
                    <option value={600}>Semi-bold (600)</option>
                    <option value={700}>Bold (700)</option>
                    <option value={800}>Extra-bold (800)</option>
                    <option value={900}>Black (900)</option>
                  </select>
                  <p className="text-xs text-yellow-400 mt-2">Click dropdown → selection should change</p>
                </div>

                {/* Subtitle Size Slider */}
                <div>
                  <label className="block text-sm font-medium mb-2">Subtitle Size (SLIDER TEST)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="range"
                      min="14"
                      max="48"
                      value={draftConfig.typography.subtitleSize}
                      onChange={(e) => handleTypographyChange('subtitleSize', parseInt(e.target.value))}
                      className="flex-1 cursor-pointer"
                    />
                    <span className="text-xs text-slate-400 w-12 text-right">
                      {draftConfig.typography.subtitleSize}px
                    </span>
                  </div>
                </div>

                {/* Letter Spacing Slider */}
                <div>
                  <label className="block text-sm font-medium mb-2">Letter Spacing (SLIDER TEST)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="range"
                      min="-2"
                      max="4"
                      step="0.5"
                      value={draftConfig.typography.letterSpacing}
                      onChange={(e) => handleTypographyChange('letterSpacing', parseFloat(e.target.value))}
                      className="flex-1 cursor-pointer"
                    />
                    <span className="text-xs text-slate-400 w-12 text-right">
                      {draftConfig.typography.letterSpacing}px
                    </span>
                  </div>
                </div>

                {/* Button Font Size Slider */}
                <div>
                  <label className="block text-sm font-medium mb-2">Button Font Size (SLIDER TEST)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={draftConfig.typography.buttonFontSize}
                      onChange={(e) => handleTypographyChange('buttonFontSize', parseInt(e.target.value))}
                      className="flex-1 cursor-pointer"
                    />
                    <span className="text-xs text-slate-400 w-12 text-right">
                      {draftConfig.typography.buttonFontSize}px
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-4">
                <p className="text-slate-400">Content tab selected - Tab switching works!</p>
              </div>
            )}

            {activeTab === 'behavior' && (
              <div className="space-y-4">
                <p className="text-slate-400">Behavior tab selected - Tab switching works!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Debug Info */}
        <div className="flex-1 bg-slate-950 flex flex-col p-6">
          {showDebugPanel && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <div className="font-bold text-slate-300 mb-2 text-red-400">LIVE STATE:</div>
                  <div className="bg-slate-950 p-3 rounded space-y-1 text-xs font-mono">
                    <div><span className="text-yellow-400">activeTab:</span> {activeTab}</div>
                    <div><span className="text-yellow-400">titleSize:</span> {draftConfig.typography.titleSize}px</div>
                    <div><span className="text-yellow-400">titleWeight:</span> {draftConfig.typography.titleWeight}</div>
                    <div><span className="text-yellow-400">subtitleSize:</span> {draftConfig.typography.subtitleSize}px</div>
                    <div><span className="text-yellow-400">letterSpacing:</span> {draftConfig.typography.letterSpacing}px</div>
                    <div><span className="text-yellow-400">buttonFontSize:</span> {draftConfig.typography.buttonFontSize}px</div>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <div className="font-bold text-slate-300 mb-2">ACCEPTANCE TESTS:</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={draftConfig.typography.titleSize > 48 ? 'text-green-400' : 'text-slate-400'}>
                        ✓ Slider moves (titleSize: {draftConfig.typography.titleSize})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={activeTab !== 'design' ? 'text-green-400' : 'text-slate-400'}>
                        ✓ Tabs switch (current: {activeTab})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={draftConfig.typography.titleWeight !== 700 ? 'text-green-400' : 'text-slate-400'}>
                        ✓ Dropdown changes (weight: {draftConfig.typography.titleWeight})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <div className="font-bold text-slate-300 mb-2">Full Config:</div>
                  <pre className="bg-slate-950 p-2 rounded overflow-x-auto text-xs">
                    {JSON.stringify(draftConfig, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
