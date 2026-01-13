'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Zap, AlertCircle, RotateCcw } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { KioskConfig, DEFAULT_KIOSK_CONFIG } from '../../../shared/kioskConfig';
import KioskPreviewLive from '@/components/kiosk/KioskPreviewLive';
import { KioskBackgroundPresets } from '@/components/KioskBackgroundPresets';
import { KioskBackgroundUpload } from '@/components/KioskBackgroundUpload';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { DeviceEmulator } from '@/components/DeviceEmulator';
import { KioskThumbnail } from '@/components/KioskThumbnail';
import { TemplateGallery } from '@/components/TemplateGallery';
import { useTemplateApplication } from '@/hooks/useTemplateApplication';
import { KioskTemplate } from '../../../shared/kioskTemplates';
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

/**
 * KioskStudioExact - Matches the reference image layout exactly
 * 
 * Layout:
 * - Left sidebar: Location/Kiosk selector with thumbnails
 * - Top bar: "Live Preview" + Save/Publish buttons + device controls
 * - Left panel: Theme/Layout/Content/Behavior tabs
 * - Center: Device emulator with preview
 * - Bottom: Restore Defaults button
 */
export default function KioskStudioExact() {
  const queryClient = useQueryClient();
  const { toasts, success, error, removeToast } = useToast();

   // STATE: Kiosk selection
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedKiosk, setSelectedKiosk] = useState<number | null>(null);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  // STATE: Configurationn
  const [draftConfig, setDraftConfig] = useState<KioskConfig>(JSON.parse(JSON.stringify(DEFAULT_KIOSK_CONFIG)));
  const [lastSavedConfig, setLastSavedConfig] = useState<KioskConfig>(JSON.parse(JSON.stringify(DEFAULT_KIOSK_CONFIG)));
  const [publishedConfig, setPublishedConfig] = useState<KioskConfig>(JSON.parse(JSON.stringify(DEFAULT_KIOSK_CONFIG)));

  // STATE: UI
  const [previewMode, setPreviewMode] = useState<'draft' | 'published'>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<'theme' | 'layout' | 'content' | 'behavior'>('theme');
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

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

  // EFFECTS: Auto-select first location
  useEffect(() => {
    if (locationsData && locationsData.length > 0 && !selectedLocation) {
      setSelectedLocation(locationsData[0].id);
    }
  }, [locationsData, selectedLocation]);

  // EFFECTS: Auto-select first kiosk
  useEffect(() => {
    if (kiosksData && kiosksData.length > 0 && !selectedKiosk) {
      setSelectedKiosk(kiosksData[0].id);
    }
  }, [kiosksData, selectedKiosk]);

  // EFFECTS: Load kiosk config when selected
  useEffect(() => {
    if (currentKiosk) {
      const draft = currentKiosk.draftConfig ? JSON.parse(JSON.stringify(currentKiosk.draftConfig)) : JSON.parse(JSON.stringify(DEFAULT_KIOSK_CONFIG));
      const published = currentKiosk.publishedConfig ? JSON.parse(JSON.stringify(currentKiosk.publishedConfig)) : JSON.parse(JSON.stringify(DEFAULT_KIOSK_CONFIG));
      
      setDraftConfig(draft);
      setLastSavedConfig(draft);
      setPublishedConfig(published);
    }
  }, [currentKiosk]);

  // COMPUTED: Dirty state
  const isDirty = useMemo(() => {
    return JSON.stringify(draftConfig) !== JSON.stringify(lastSavedConfig);
  }, [draftConfig, lastSavedConfig]);

  // COMPUTED: Preview config
  const previewConfig = useMemo(() => {
    if (previewMode === 'published' && publishedConfig) {
      return publishedConfig;
    }
    return draftConfig;
  }, [previewMode, draftConfig, publishedConfig]);

  // HANDLERS: Config updates
  const updateConfig = useCallback((updates: Partial<KioskConfig>) => {
    setDraftConfig(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      Object.assign(updated, updates);
      return updated;
    });
  }, []);

  const handleBackgroundChange = useCallback((key: string, value: any) => {
    setDraftConfig(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated.background) updated.background = {};
      (updated.background as any)[key] = value;
      return updated;
    });
  }, []);

  const handleThemeChange = useCallback((key: string, value: any) => {
    setDraftConfig(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated.theme) updated.theme = {};
      (updated.theme as any)[key] = value;
      return updated;
    });
  }, []);

  const handleTypographyChange = useCallback((key: string, value: any) => {
    setDraftConfig(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated.typography) updated.typography = {};
      (updated.typography as any)[key] = value;
      return updated;
    });
  }, []);

  const handleContentChange = useCallback((key: string, value: any) => {
    setDraftConfig(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated.content) updated.content = {};
      (updated.content as any)[key] = value;
      return updated;
    });
  }, []);

  // HANDLERS: Save/Publish
  const handleSaveDraft = useCallback(async () => {
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
  }, [selectedKiosk, draftConfig, saveDraftMutation]);

  const handlePublish = useCallback(async () => {
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
  }, [selectedKiosk, draftConfig, publishMutation]);

  const handleRestoreDefaults = useCallback(() => {
    if (confirm('Are you sure you want to restore to default settings?')) {
      setDraftConfig(JSON.parse(JSON.stringify(DEFAULT_KIOSK_CONFIG)));
    }
  }, []);

  const handleOpenPublicKiosk = useCallback(() => {
    if (currentKiosk?.slug) {
      window.open(`/kiosk/${currentKiosk.slug}`, '_blank');
    }
  }, [currentKiosk?.slug]);

  // RENDER: Loading states
  if (!locationsData || locationsData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <p className="text-slate-400">No locations available</p>
      </div>
    );
  }

  if (!selectedLocation || kiosksLoading || !kiosksData || kiosksData.length === 0 || !selectedKiosk || kioskLoading || !currentKiosk) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <p className="text-slate-400">Loading studio...</p>
      </div>
    );
  }

  if (!draftConfig || !draftConfig.background || !draftConfig.theme || !draftConfig.typography || !draftConfig.content) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <p className="text-slate-400">Invalid configuration</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-black">
      {/* LEFT SIDEBAR: Location/Kiosk Selector */}
      <div className="w-36 bg-slate-900 border-r border-slate-800 flex flex-col p-4 overflow-y-auto">
        <div className="space-y-4">
          {kiosksData?.map((kiosk) => (
            <button
              key={kiosk.id}
              onClick={() => setSelectedKiosk(kiosk.id)}
              className="w-full text-left rounded-lg overflow-hidden transition-all focus:outline-none"
            >
              <KioskThumbnail
                config={selectedKiosk === kiosk.id && currentKiosk ? draftConfig : (kiosk.draftConfig ? JSON.parse(JSON.stringify(kiosk.draftConfig)) : JSON.parse(JSON.stringify(DEFAULT_KIOSK_CONFIG)))}
                kioskName={kiosk.name}
                isSelected={selectedKiosk === kiosk.id}
              />
            </button>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-800">
          <Button
            onClick={handleRestoreDefaults}
            variant="ghost"
            size="sm"
            className="w-full text-xs text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="w-3 h-3 mr-2" />
            Restore Defaults
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* TOP BAR */}
        <div className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">Live Preview</h1>
          
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
        <div className="flex-1 flex overflow-hidden gap-6 p-6">
          {/* LEFT PANEL: Controls */}
          <div className="w-40 bg-slate-900 rounded-lg border border-slate-800 p-4 flex flex-col overflow-y-auto">
            <Tabs value={activeEditorTab} onValueChange={(val: any) => setActiveEditorTab(val)} className="flex flex-col h-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-800">
                <TabsTrigger value="theme" className="text-xs">Theme</TabsTrigger>
                <TabsTrigger value="layout" className="text-xs">Layout</TabsTrigger>
              </TabsList>

              <TabsContent value="theme" className="flex-1 space-y-3 text-sm">
                <Button
                  onClick={() => setShowTemplateGallery(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs mb-4"
                >
                  ✨ Apply Template
                </Button>

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

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Background Type</Label>
                  <Select value={draftConfig.background.type || 'solid'} onValueChange={(val: any) => handleBackgroundChange('type', val)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="preset">Preset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {draftConfig.background.type === 'solid' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={draftConfig.background.color || '#000000'}
                        onChange={(e) => handleBackgroundChange('color', e.target.value)}
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
                      />
                      <Input
                        value={draftConfig.background.color || '#000000'}
                        onChange={(e) => handleBackgroundChange('color', e.target.value)}
                        className="flex-1 bg-slate-800 border-slate-700 text-white text-xs h-8"
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="layout" className="flex-1 space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Title Size</Label>
                    <span className="text-xs text-slate-400">{draftConfig.typography.titleSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="72"
                    value={draftConfig.typography.titleSize || 48}
                    onChange={(e) => handleTypographyChange('titleSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Button Size</Label>
                    <span className="text-xs text-slate-400">{draftConfig.typography.buttonFontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={draftConfig.typography.buttonFontSize || 16}
                    onChange={(e) => handleTypographyChange('buttonFontSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* CENTER: Device Emulator Preview */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <DeviceEmulator
              config={previewConfig}
              kioskId={selectedKiosk}
              onOpenPublicKiosk={handleOpenPublicKiosk}
            />
          </div>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {showTemplateGallery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Design Templates</h2>
              <button
                onClick={() => setShowTemplateGallery(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                X
              </button>
            </div>
            <div className="p-6">
              <TemplateGallery
                onApplyTemplate={(template: KioskTemplate) => {
                  const newConfig = JSON.parse(JSON.stringify(template.config)) as KioskConfig;
                  setDraftConfig(newConfig);
                  setShowTemplateGallery(false);
                  success(`Applied template`);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}