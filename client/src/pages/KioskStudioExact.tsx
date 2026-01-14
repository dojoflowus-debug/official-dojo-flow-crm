import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Zap, AlertCircle, RotateCcw, Palette, Layout, FileText, Zap as ZapIcon } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { KioskConfig, DEFAULT_KIOSK_CONFIG } from '../../../shared/kioskConfig';
import KioskPreviewLive from '@/components/kiosk/KioskPreviewLive';
import { KioskBackgroundPresets } from '@/components/KioskBackgroundPresets';
import { KioskBackgroundUpload } from '@/components/KioskBackgroundUpload';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { DeviceEmulator } from '@/components/DeviceEmulator';
import { KioskThumbnail } from '@/components/KioskThumbnail';
import { KIOSK_BACKGROUND_PRESETS } from '../../../shared/kioskBackgroundPresets';
import BottomNavLayout from '@/components/BottomNavLayout';
import { useScrollHide } from '@/hooks/useScrollHide';
import '@/styles/scrollHide.css';

import { useQueryClient } from '@tanstack/react-query';

interface Kiosk {
  id: number;
  name: string;
  slug: string;
  isActive: number;
  draftConfig?: KioskConfig;
  publishedConfig?: KioskConfig;
  createdAt: string;
  updatedAt: string;
}

// Background theme categories - using canonical presets
const BACKGROUND_THEMES = KIOSK_BACKGROUND_PRESETS.slice(0, 6).map(preset => ({
  id: preset.id,
  name: preset.name,
  image: preset.imageUrl,
}));

/**
 * KioskStudioExact - Premium design studio interface
 * 
 * Layout:
 * - Left sidebar: Kiosk thumbnails (location/device selector removed)
 * - Top bar: "Live Preview" + Save/Publish buttons
 * - Left panel: Theme/Layout/Content/Behavior studio controls
 * - Center: Device emulator with dojo background
 * - Device controls: Above preview (not in sidebar)
 */
export default function KioskStudioExact() {
  const queryClient = useQueryClient();
  const { toasts, success, error, removeToast } = useToast();

   // STATE: Kiosk selection
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedKiosk, setSelectedKiosk] = useState<number | null>(null);

  // STATE: Configuration
  const [draftConfig, setDraftConfig] = useState<KioskConfig>(JSON.parse(JSON.stringify(DEFAULT_KIOSK_CONFIG)));
  const [lastSavedConfig, setLastSavedConfig] = useState<KioskConfig>(JSON.parse(JSON.stringify(DEFAULT_KIOSK_CONFIG)));
  const [publishedConfig, setPublishedConfig] = useState<KioskConfig>(JSON.parse(JSON.stringify(DEFAULT_KIOSK_CONFIG)));

  // STATE: UI
  const [previewMode, setPreviewMode] = useState<'draft' | 'published'>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<'theme' | 'layout' | 'content' | 'behavior'>('theme');
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  // SCROLL HIDE: Track scroll direction for auto-hiding UI
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUIHidden = useScrollHide({ threshold: 10, scrollElement: scrollContainerRef.current });

  // QUERIES
  const { data: locationsData } = trpc.kiosk.listLocations.useQuery(undefined, { enabled: true });

  const { data: kiosksData, refetch: refetchKiosks, isLoading: kiosksLoading } = trpc.kioskDevice.listByLocation.useQuery(
    { locationId: selectedLocation! },
    { enabled: !!selectedLocation }
  );

  const { data: currentKiosk, isLoading: kioskLoading, refetch: refetchCurrentKiosk } = trpc.kioskDevice.getById.useQuery(
    { kioskId: selectedKiosk! },
    { enabled: !!selectedKiosk }
  );

  // MUTATIONS
  const saveDraftMutation = trpc.kioskDevice.saveDraft.useMutation({
    onSuccess: (result) => {
      setLastSavedConfig(JSON.parse(JSON.stringify(draftConfig)));
      setPersistenceError(null);
      success('Draft saved successfully');
      refetchCurrentKiosk();
    },
    onError: (err) => {
      setPersistenceError(`Save failed: ${err.message}`);
      error(`Save failed: ${err.message}`);
    },
  });

  const publishMutation = trpc.kioskDevice.publish.useMutation({
    onSuccess: (result) => {
      setPublishedConfig(JSON.parse(JSON.stringify(draftConfig)));
      setPersistenceError(null);
      success('Published successfully');
      refetchCurrentKiosk();
    },
    onError: (err) => {
      setPersistenceError(`Publish failed: ${err.message}`);
      error(`Publish failed: ${err.message}`);
    },
  });

  // EFFECTS
  useEffect(() => {
    if (locationsData && locationsData.length > 0 && !selectedLocation) {
      setSelectedLocation(locationsData[0].id);
    }
  }, [locationsData, selectedLocation]);

  useEffect(() => {
    if (kiosksData && kiosksData.length > 0 && !selectedKiosk) {
      setSelectedKiosk(kiosksData[0].id);
    }
  }, [kiosksData, selectedKiosk]);

  useEffect(() => {
    if (currentKiosk?.draftConfig) {
      const parsed = typeof currentKiosk.draftConfig === 'string'
        ? JSON.parse(currentKiosk.draftConfig)
        : currentKiosk.draftConfig;
      setDraftConfig(JSON.parse(JSON.stringify(parsed)));
      setLastSavedConfig(JSON.parse(JSON.stringify(parsed)));
    }
    if (currentKiosk?.publishedConfig) {
      const parsed = typeof currentKiosk.publishedConfig === 'string'
        ? JSON.parse(currentKiosk.publishedConfig)
        : currentKiosk.publishedConfig;
      setPublishedConfig(JSON.parse(JSON.stringify(parsed)));
    }
  }, [currentKiosk]);

  // HANDLERS
  const isDirty = useMemo(() => {
    return JSON.stringify(draftConfig) !== JSON.stringify(lastSavedConfig);
  }, [draftConfig, lastSavedConfig]);

  const previewConfig = previewMode === 'draft' ? draftConfig : publishedConfig;

  const handleThemeChange = useCallback((key: string, value: any) => {
    setDraftConfig((prev) => ({
      ...prev,
      theme: { ...prev.theme, [key]: value },
    }));
  }, []);

  const handleBackgroundChange = useCallback((key: string, value: any) => {
    setDraftConfig((prev) => ({
      ...prev,
      background: { ...prev.background, [key]: value },
    }));
  }, []);

  const handleTypographyChange = useCallback((key: string, value: any) => {
    setDraftConfig((prev) => ({
      ...prev,
      typography: { ...prev.typography, [key]: value },
    }));
  }, []);

  const handleSaveDraft = async () => {
    if (!selectedKiosk) return;
    setIsSaving(true);
    try {
      await saveDraftMutation.mutateAsync({
        kioskId: selectedKiosk,
        config: draftConfig,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedKiosk) return;
    setIsPublishing(true);
    try {
      await publishMutation.mutateAsync({
        kioskId: selectedKiosk,
        config: draftConfig,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRestoreDefaults = () => {
    setDraftConfig(JSON.parse(JSON.stringify(DEFAULT_KIOSK_CONFIG)));
  };

  const updateConfig = (updates: Partial<KioskConfig>) => {
    setDraftConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <BottomNavLayout>
    <div ref={scrollContainerRef} className={`flex h-full bg-black transition-all duration-300 overflow-y-auto ${isUIHidden ? 'ui-hidden' : ''}`}>
      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* TOP BAR */}
        <div id="kiosk-top-toolbar" className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">D</div>
            <span className="text-xs font-medium text-slate-400 letter-spacing-wide">DojoFlow</span>
            <span className="text-slate-600">|</span>
            <span className="text-base font-semibold text-white">Main Dojo</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-medium text-slate-400">Live Preview</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveDraft}
              disabled={!isDirty || isSaving}
              size="sm"
              variant="outline"
              className="border-slate-700 hover:border-slate-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Zap className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        {/* ERROR BANNER */}
        {persistenceError && (
          <div className="flex items-center gap-2 px-6 py-3 bg-red-950/50 border-b border-red-900/50 text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{persistenceError}</span>
          </div>
        )}

        {/* CONTENT AREA */}
        <div id="kiosk-preview-wrapper" className="flex-1 flex overflow-hidden gap-6 p-6 flex-shrink-0">
          {/* LEFT PANEL: Studio Controls */}
          <div className="w-64 bg-slate-900 rounded-lg border border-slate-800 p-4 flex flex-col overflow-y-auto">
            {/* Studio Panel Header */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Kiosk Studio</h2>
              <p className="text-xs text-slate-400 mt-1">Design your kiosk experience</p>
            </div>

            {/* Studio Tabs Navigation */}
            <div className="flex flex-col gap-2 mb-6">
              <button
                onClick={() => setActiveStudioTab('theme')}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                  activeStudioTab === 'theme'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Palette className="w-4 h-4" />
                Theme
              </button>
              <button
                onClick={() => setActiveStudioTab('layout')}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                  activeStudioTab === 'layout'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Layout className="w-4 h-4" />
                Layout
              </button>
              <button
                onClick={() => setActiveStudioTab('content')}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                  activeStudioTab === 'content'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                Content
              </button>
              <button
                onClick={() => setActiveStudioTab('behavior')}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                  activeStudioTab === 'behavior'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ZapIcon className="w-4 h-4" />
                Behavior
              </button>
            </div>

            {/* Theme Panel */}
            {activeStudioTab === 'theme' && (
              <div className="flex-1 space-y-4">
                {/* Background Themes */}
                <div>
                  <Label className="text-xs font-semibold text-slate-300 mb-3 block">Background Themes</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {BACKGROUND_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => updateConfig({ background: { ...draftConfig.background, type: 'preset', presetKey: theme.id } })}
                        className="group relative overflow-hidden border-2 transition-all aspect-square"
                        style={{
                          borderColor: draftConfig.background.presetKey === theme.id ? '#3b82f6' : '#334155',
                        }}
                      >
                        <img
                          src={theme.image}
                          alt={theme.name}
                          className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-end">
                          <p className="text-xs text-white font-medium p-2 w-full">{theme.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Controls */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Blur</Label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={draftConfig.background.blur || 0}
                      onChange={(e) => handleBackgroundChange('blur', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Dim</Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={draftConfig.background.dim || 0}
                      onChange={(e) => handleBackgroundChange('dim', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Accent Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={draftConfig.theme.accentColor || '#ef4444'}
                        onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
                      />
                      <Input
                        value={draftConfig.theme.accentColor || '#ef4444'}
                        onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                        className="flex-1 bg-slate-800 border-slate-700 text-white text-xs h-8"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Layout Panel */}
            {activeStudioTab === 'layout' && (
              <div className="flex-1 space-y-4">
                <p className="text-sm text-slate-400">Layout controls coming next</p>
              </div>
            )}

            {/* Content Panel */}
            {activeStudioTab === 'content' && (
              <div className="flex-1 space-y-4">
                <p className="text-sm text-slate-400">Kiosk content configuration</p>
              </div>
            )}

            {/* Behavior Panel */}
            {activeStudioTab === 'behavior' && (
              <div className="flex-1 space-y-4">
                <p className="text-sm text-slate-400">Kiosk behavior & automation</p>
              </div>
            )}
          </div>

          {/* CENTER: Device Emulator Preview with Dojo Background */}
          <div 
            className="flex-1 flex flex-col items-center justify-center relative overflow-hidden rounded-lg"
            style={{
              backgroundImage: 'url(/dojo-studio-bg.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }}
          >
            {/* Cinematic vignette overlay */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%)',
              }}
            />
            
            {/* Subtle blur and depth effect */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backdropFilter: 'blur(1px)',
                background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.2) 100%)',
              }}
            />
            
            {/* Device Emulator */}
            <div className="relative z-10">
              <DeviceEmulator
                orgId={selectedLocation || 1}
                locationId={selectedLocation || 1}
                kioskId={selectedKiosk || 1}
                kioskSlug={currentKiosk?.slug}
              >
                <KioskPreviewLive config={previewConfig} />
              </DeviceEmulator>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <div id="kiosk-toast-container" className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
    </BottomNavLayout>
    
  );
}
