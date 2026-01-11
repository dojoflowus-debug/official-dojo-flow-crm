import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Save, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { KioskTypographyControls } from '@/components/KioskTypographyControls';
import { KioskBackgroundControls } from '@/components/KioskBackgroundControls';

interface DraftSettings {
  theme: {
    mode: string;
    primaryColor: string;
    accentColor: string;
  };
  appearance: {
    accentColor: string;
    headline: string;
    subtext: string;
    backgroundImageUrl?: string;
    backgroundIntensity: number;
    backgroundBlur: number;
    fontFamily?: string;
    titleSize?: number;
    titleWeight?: number;
    subtitleSize?: number;
    letterSpacing?: number;
    buttonFontSize?: number;
    backgroundFitMode?: string;
  };
  behavior: {
    showMemberLogin: boolean;
    showNewStudent: boolean;
    idleTimeout: number;
    idleSeconds?: number;
    autoReturn: boolean;
    kaiEnrollment: boolean;
    facialRecognition: boolean;
  };
}

export default function KioskStudio() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'appearance' | 'behavior' | 'preview'>('appearance');
  const [draftSettings, setDraftSettings] = useState<DraftSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  // Fetch locations - using kiosk router for now
  const { data: locationsData } = trpc.kiosk.listLocations.useQuery();

  // Fetch current kiosk settings
  const { data: settingsData, isLoading: settingsLoading } = trpc.kioskSettings.getSettings.useQuery(
    { locationSlug: selectedLocation },
    { enabled: !!selectedLocation }
  );

  // Initialize draft settings from fetched data
  useEffect(() => {
    if (settingsData?.settings) {
      setDraftSettings(settingsData.settings as DraftSettings);
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
  const sendPreviewUpdate = (settings: DraftSettings) => {
    const previewFrame = document.getElementById('kiosk-preview') as HTMLIFrameElement;
    if (previewFrame?.contentWindow) {
      previewFrame.contentWindow.postMessage(
        {
          type: 'KIOSK_SETTINGS_UPDATE',
          settings,
          timestamp: Date.now(),
        },
        '*'
      );
    }
  };

  // Handle setting changes
  const handleAppearanceChange = (key: string, value: any) => {
    if (!draftSettings) return;
    const updated = {
      ...draftSettings,
      appearance: {
        ...draftSettings.appearance,
        [key]: value,
      },
    };
    setDraftSettings(updated);
    sendPreviewUpdate(updated);
  };

  const handleBehaviorChange = (key: string, value: any) => {
    if (!draftSettings) return;
    const updated = {
      ...draftSettings,
      behavior: {
        ...draftSettings.behavior,
        [key]: value,
      },
    };
    setDraftSettings(updated);
    sendPreviewUpdate(updated);
  };

  const handleThemeChange = (key: string, value: any) => {
    if (!draftSettings) return;
    const updated = {
      ...draftSettings,
      theme: {
        ...draftSettings.theme,
        [key]: value,
      },
    };
    setDraftSettings(updated);
    sendPreviewUpdate(updated);
  };

  // Save draft to database
  const handleSaveDraft = async () => {
    if (!draftSettings || !selectedLocation) return;
    setIsSaving(true);
    try {
      // TODO: Call TRPC mutation to save draft
      console.log('Saving draft:', draftSettings);
      // await trpc.kioskSettings.saveDraft.mutate({ locationSlug: selectedLocation, settings: draftSettings });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draftSettings || !selectedLocation) return;
    setIsSaving(true);
    try {
      // TODO: Call TRPC mutation to publish
      console.log('Publishing:', draftSettings);
      // await trpc.kioskSettings.publish.mutate({ locationSlug: selectedLocation, settings: draftSettings });
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedLocation && !settingsLoading && locationsData) {
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
    ? `/kiosk/${selectedLocation}?studioPreview=1&ts=${previewKey}`
    : '';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Kiosk Studio</h1>
              <p className="text-sm text-slate-400">Configure kiosk appearance and behavior</p>
            </div>
            <div className="flex gap-3">
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
            {(['appearance', 'behavior', 'preview'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 space-y-6">
            {activeTab === 'appearance' && draftSettings && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Typography</h3>
                  <KioskTypographyControls
                    settings={draftSettings.appearance}
                    onChange={handleAppearanceChange}
                  />
                </div>
                <div className="border-t border-slate-700 pt-6">
                  <h3 className="text-lg font-semibold mb-4">Background</h3>
                  <KioskBackgroundControls
                    settings={draftSettings.appearance}
                    onChange={handleAppearanceChange}
                  />
                </div>
              </div>
            )}

            {activeTab === 'behavior' && draftSettings && (
              <BehaviorControls
                settings={draftSettings.behavior}
                onChange={handleBehaviorChange}
              />
            )}

            {activeTab === 'preview' && (
              <div className="text-sm text-slate-400">
                <p>Live preview updates appear on the right side.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 bg-slate-950 flex flex-col">
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
        </div>
      </div>
    </div>
  );
}



// Behavior Controls Component
function BehaviorControls({
  settings,
  onChange,
}: {
  settings: any;
  onChange: (key: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Show Member Login</label>
        <input
          type="checkbox"
          checked={settings.showMemberLogin ?? true}
          onChange={(e) => onChange('showMemberLogin', e.target.checked)}
          className="w-4 h-4 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Show New Student</label>
        <input
          type="checkbox"
          checked={settings.showNewStudent ?? true}
          onChange={(e) => onChange('showNewStudent', e.target.checked)}
          className="w-4 h-4 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Idle Timeout (seconds)</label>
        <input
          type="number"
          min="10"
          max="300"
          value={settings.idleTimeout || settings.idleSeconds || 60}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            onChange('idleTimeout', val);
            onChange('idleSeconds', val);
          }}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">Time before screensaver appears</p>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Auto Return</label>
        <input
          type="checkbox"
          checked={settings.autoReturn ?? true}
          onChange={(e) => onChange('autoReturn', e.target.checked)}
          className="w-4 h-4 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Kai Enrollment</label>
        <input
          type="checkbox"
          checked={settings.kaiEnrollment ?? false}
          onChange={(e) => onChange('kaiEnrollment', e.target.checked)}
          className="w-4 h-4 rounded"
        />
      </div>
    </div>
  );
}
