import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Save, Zap, Code } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { KioskTypographyControls } from '@/components/KioskTypographyControls';
import { KioskBackgroundControls } from '@/components/KioskBackgroundControls';
import { KioskConfig, DEFAULT_KIOSK_CONFIG } from '../../../shared/kioskConfig';

export default function KioskStudio() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'design' | 'content' | 'behavior' | 'screensaver'>('design');
  const [draftConfig, setDraftConfig] = useState<KioskConfig>(DEFAULT_KIOSK_CONFIG);
  const [lastSavedConfig, setLastSavedConfig] = useState<KioskConfig>(DEFAULT_KIOSK_CONFIG);
  const [publishedConfig, setPublishedConfig] = useState<KioskConfig>(DEFAULT_KIOSK_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch locations
  const { data: locationsData } = trpc.kiosk.listLocations.useQuery();

  // Fetch current kiosk settings
  const { data: settingsData, isLoading: settingsLoading } = trpc.kioskSettings.getSettings.useQuery(
    { locationSlug: selectedLocation },
    { enabled: !!selectedLocation }
  );

  // Initialize draft settings from fetched data
  useEffect(() => {
    if (settingsData?.settings) {
      const config = settingsData.settings as KioskConfig;
      setDraftConfig(config);
      setLastSavedConfig(config);
      setPublishedConfig(config);
    }
  }, [settingsData]);

  // Set default location on mount
  useEffect(() => {
    if (!locationsData || !Array.isArray(locationsData)) return;
    
    if (locationId) {
      const loc = locationsData.find(l => l.id === parseInt(locationId));
      if (loc?.kioskSlug) {
        setSelectedLocation(loc.kioskSlug);
      }
    } else if (locationsData.length > 0) {
      const firstWithKiosk = locationsData.find(l => l.kioskEnabled === 1);
      if (firstWithKiosk?.kioskSlug) {
        setSelectedLocation(firstWithKiosk.kioskSlug);
      }
    }
  }, [locationId, locationsData]);

  // Send draft to iframe preview
  const sendPreviewUpdate = (config: KioskConfig) => {
    const previewFrame = document.getElementById('kiosk-preview') as HTMLIFrameElement;
    if (previewFrame?.contentWindow) {
      previewFrame.contentWindow.postMessage(
        {
          type: 'KIOSK_SETTINGS_UPDATE',
          settings: config,
          timestamp: Date.now(),
        },
        '*'
      );
    }
  };

  // Generic handler for nested config updates
  const updateConfig = (section: keyof KioskConfig, key: string, value: any) => {
    const updated = {
      ...draftConfig,
      [section]: {
        ...(draftConfig[section] as any),
        [key]: value,
      },
    };
    setDraftConfig(updated);
    sendPreviewUpdate(updated);
  };

  // Theme updates
  const handleThemeChange = (key: string, value: any) => updateConfig('theme', key, value);

  // Content updates
  const handleContentChange = (key: string, value: any) => {
    if (key.includes('.')) {
      // Handle nested content like 'tileLeft.title'
      const [section, field] = key.split('.');
      const updated = {
        ...draftConfig,
        content: {
          ...draftConfig.content,
          [section]: {
            ...(draftConfig.content[section as keyof typeof draftConfig.content] as any),
            [field]: value,
          },
        },
      };
      setDraftConfig(updated);
      sendPreviewUpdate(updated);
    } else {
      updateConfig('content', key, value);
    }
  };

  // Typography updates
  const handleTypographyChange = (key: string, value: any) => updateConfig('typography', key, value);

  // Layout updates
  const handleLayoutChange = (key: string, value: any) => updateConfig('layout', key, value);

  // Background updates
  const handleBackgroundChange = (key: string, value: any) => updateConfig('background', key, value);

  // Behavior/Screensaver updates
  const handleScreensaverChange = (key: string, value: any) => updateConfig('screensaver', key, value);

  const handleSaveDraft = async () => {
    if (!draftConfig || !selectedLocation) return;
    setIsSaving(true);
    try {
      await trpc.kioskSettings.saveDraft.mutate({
        locationSlug: selectedLocation,
        config: draftConfig,
      });
      setLastSavedConfig(draftConfig);
      setSaveMessage({ type: 'success', text: 'Draft saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Save draft error:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save draft' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draftConfig || !selectedLocation) return;
    setIsSaving(true);
    try {
      await trpc.kioskSettings.publish.mutate({
        locationSlug: selectedLocation,
        config: draftConfig,
      });
      setPublishedConfig(draftConfig);
      setLastSavedConfig(draftConfig);
      setSaveMessage({ type: 'success', text: 'Published successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Publish error:', error);
      setSaveMessage({ type: 'error', text: 'Failed to publish' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedLocation && !settingsLoading && locationsData && locationsData.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center space-y-4">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500" />
          <h1 className="text-2xl font-bold">No Kiosk Found</h1>
          <p className="text-muted-foreground">
            Please enable a kiosk for a location first.
          </p>
        </Card>
      </div>
    );
  }

  const previewUrl = selectedLocation
    ? `/kiosk/${selectedLocation}?studioPreview=1&ts=${Date.now()}`
    : '';

  const hasUnsavedChanges = JSON.stringify(draftConfig) !== JSON.stringify(lastSavedConfig);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Kiosk Studio</h1>
              <p className="text-sm text-slate-400">Configure kiosk appearance and behavior</p>
              {hasUnsavedChanges && <p className="text-xs text-yellow-400 mt-1">● Unsaved changes</p>}
            </div>
            <div className="flex gap-3">
              {saveMessage && (
                <div className={`px-3 py-2 rounded-lg text-sm ${
                  saveMessage.type === 'success' ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
                }`}>
                  {saveMessage.text}
                </div>
              )}
              <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                title="Toggle debug panel"
              >
                <Code className="w-4 h-4" />
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Save Draft
              </button>
              <button
                onClick={handlePublish}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Zap className="w-4 h-4 inline mr-2" />
                Publish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Controls */}
        <div className="w-96 border-r border-slate-800 overflow-y-auto bg-slate-900/30">
          {/* Location Selector */}
          <div className="p-6 border-b border-slate-800">
            <label className="block text-sm font-medium mb-2">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
            >
              <option value="">Select a location...</option>
              {locationsData?.filter(l => l.kioskEnabled === 1).map((loc) => (
                <option key={loc.id} value={loc.kioskSlug || ''}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 px-6">
            {(['design', 'content', 'behavior', 'screensaver'] as const).map((tab) => {
              const tabLabels: Record<string, string> = {
                design: 'Design',
                content: 'Content',
                behavior: 'Behavior',
                screensaver: 'Screensaver',
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-red-500 text-red-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6 space-y-6">
            {activeTab === 'design' && (
              <div className="space-y-6">
                {/* Accent Color */}
                <div>
                  <label className="block text-sm font-medium mb-2">Accent Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={draftConfig.theme.accentColor}
                      onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={draftConfig.theme.accentColor}
                      onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Typography Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Typography</h3>
                  <KioskTypographyControls
                    settings={draftConfig.typography}
                    onChange={handleTypographyChange}
                  />
                </div>

                {/* Background Section */}
                <div className="border-t border-slate-700 pt-6">
                  <h3 className="text-lg font-semibold mb-4">Background</h3>
                  <KioskBackgroundControls
                    settings={draftConfig.background}
                    onChange={handleBackgroundChange}
                  />
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Headline</label>
                  <input
                    type="text"
                    value={draftConfig.content.headline}
                    onChange={(e) => handleContentChange('headline', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subtext</label>
                  <input
                    type="text"
                    value={draftConfig.content.subtext}
                    onChange={(e) => handleContentChange('subtext', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                  />
                </div>

                {/* Left Tile */}
                <div className="border-t border-slate-700 pt-4 mt-4">
                  <h4 className="font-medium mb-3">Left Tile (Check In)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Title</label>
                      <input
                        type="text"
                        value={draftConfig.content.tileLeft.title}
                        onChange={(e) => handleContentChange('tileLeft.title', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={draftConfig.content.tileLeft.subtitle}
                        onChange={(e) => handleContentChange('tileLeft.subtitle', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Button Label</label>
                      <input
                        type="text"
                        value={draftConfig.content.tileLeft.button}
                        onChange={(e) => handleContentChange('tileLeft.button', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Tile */}
                <div className="border-t border-slate-700 pt-4 mt-4">
                  <h4 className="font-medium mb-3">Right Tile (Start Training)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Title</label>
                      <input
                        type="text"
                        value={draftConfig.content.tileRight.title}
                        onChange={(e) => handleContentChange('tileRight.title', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={draftConfig.content.tileRight.subtitle}
                        onChange={(e) => handleContentChange('tileRight.subtitle', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Button Label</label>
                      <input
                        type="text"
                        value={draftConfig.content.tileRight.button}
                        onChange={(e) => handleContentChange('tileRight.button', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Info Labels */}
                <div className="border-t border-slate-700 pt-4 mt-4">
                  <h4 className="font-medium mb-3">Info Bar Labels</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Left Label</label>
                      <input
                        type="text"
                        value={draftConfig.content.infoLeftLabel}
                        onChange={(e) => handleContentChange('infoLeftLabel', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Right Label</label>
                      <input
                        type="text"
                        value={draftConfig.content.infoRightLabel}
                        onChange={(e) => handleContentChange('infoRightLabel', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'behavior' && (
              <BehaviorControls
                layout={draftConfig.layout}
                screensaver={draftConfig.screensaver}
                onLayoutChange={handleLayoutChange}
                onScreensaverChange={handleScreensaverChange}
              />
            )}

            {activeTab === 'screensaver' && (
              <ScreensaverControls
                screensaver={draftConfig.screensaver}
                onChange={handleScreensaverChange}
              />
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 bg-slate-950 flex flex-col relative">
          <div className="flex-1 border border-slate-800 m-6 rounded-lg overflow-hidden bg-white">
            {previewUrl && (
              <iframe
                id="kiosk-preview"
                src={previewUrl}
                className="w-full h-full border-0"
                title="Kiosk Preview"
              />
            )}
          </div>

          {/* Debug Panel */}
          {showDebugPanel && (
            <div className="absolute bottom-0 right-0 w-96 max-h-96 bg-slate-900 border-l border-t border-slate-700 rounded-tl-lg p-4 overflow-y-auto text-xs font-mono">
              <div className="space-y-2">
                <div className="text-slate-400">
                  <div className="font-bold text-slate-300 mb-2">Current Config:</div>
                  <pre className="bg-slate-950 p-2 rounded overflow-x-auto text-xs">
                    {JSON.stringify(draftConfig, null, 2)}
                  </pre>
                </div>
                <div className="text-slate-400 border-t border-slate-700 pt-2">
                  <div className="font-bold text-slate-300 mb-2">State:</div>
                  <div>Location: {selectedLocation || 'none'}</div>
                  <div>Has Unsaved: {hasUnsavedChanges ? 'yes' : 'no'}</div>
                  <div>Last Saved: {lastSavedConfig ? 'loaded' : 'none'}</div>
                  <div>Published: {publishedConfig ? 'loaded' : 'none'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Behavior Controls Component
function BehaviorControls({
  layout,
  screensaver,
  onLayoutChange,
  onScreensaverChange,
}: {
  layout: KioskConfig['layout'];
  screensaver: KioskConfig['screensaver'];
  onLayoutChange: (key: string, value: any) => void;
  onScreensaverChange: (key: string, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Display Options</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Show Clock</label>
            <input
              type="checkbox"
              checked={layout.showClock}
              onChange={(e) => onLayoutChange('showClock', e.target.checked)}
              className="w-4 h-4 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Show Info Bar</label>
            <input
              type="checkbox"
              checked={layout.showInfoBar}
              onChange={(e) => onLayoutChange('showInfoBar', e.target.checked)}
              className="w-4 h-4 rounded"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700 pt-6">
        <h3 className="text-lg font-semibold mb-4">Screensaver</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Enable Screensaver</label>
            <input
              type="checkbox"
              checked={screensaver.enabled}
              onChange={(e) => onScreensaverChange('enabled', e.target.checked)}
              className="w-4 h-4 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Idle Timeout (seconds)</label>
            <input
              type="number"
              min="10"
              max="300"
              value={screensaver.idleSeconds}
              onChange={(e) => onScreensaverChange('idleSeconds', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Show Logo</label>
            <input
              type="checkbox"
              checked={screensaver.showLogo}
              onChange={(e) => onScreensaverChange('showLogo', e.target.checked)}
              className="w-4 h-4 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <input
              type="text"
              value={screensaver.message}
              onChange={(e) => onScreensaverChange('message', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Screensaver Controls Component
function ScreensaverControls({
  screensaver,
  onChange,
}: {
  screensaver: KioskConfig['screensaver'];
  onChange: (key: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Enable Screensaver</label>
        <input
          type="checkbox"
          checked={screensaver.enabled}
          onChange={(e) => onChange('enabled', e.target.checked)}
          className="w-4 h-4 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Idle Timeout (seconds)</label>
        <input
          type="number"
          min="10"
          max="300"
          value={screensaver.idleSeconds}
          onChange={(e) => onChange('idleSeconds', parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Show Logo</label>
        <input
          type="checkbox"
          checked={screensaver.showLogo}
          onChange={(e) => onChange('showLogo', e.target.checked)}
          className="w-4 h-4 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Message</label>
        <input
          type="text"
          value={screensaver.message}
          onChange={(e) => onChange('message', e.target.value)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
        />
      </div>
    </div>
  );
}
