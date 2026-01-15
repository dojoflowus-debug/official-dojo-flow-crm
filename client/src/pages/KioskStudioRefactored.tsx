import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Zap, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { KioskConfig, DEFAULT_KIOSK_CONFIG } from '../../../shared/kioskConfig';
import { KioskConfigSchema } from '../../../shared/kioskConfigSchema';
import KioskPreviewLive from '@/components/kiosk/KioskPreviewLive';
import { KioskBackgroundPresets } from '@/components/KioskBackgroundPresets';
import { KioskBackgroundUpload } from '@/components/KioskBackgroundUpload';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { DeviceEmulator } from '@/components/DeviceEmulator';
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
 * KioskStudioRefactored - Fixed version with reliable binding, persistence, and clean layout
 * 
 * Key fixes:
 * 1. Live binding: Every control change immediately updates preview
 * 2. Persistence: Save/Publish writes to DB with verification
 * 3. Image loading: Preset images load correctly
 * 4. Clean layout: Top bar + left tabs + right preview
 */
export default function KioskStudioRefactored() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toasts, success, error, removeToast } = useToast();

  // STATE: Kiosk selection
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedKiosk, setSelectedKiosk] = useState<number | null>(null);

  // STATE: Configuration (SINGLE SOURCE OF TRUTH)
  const [draftConfig, setDraftConfig] = useState<KioskConfig>(DEFAULT_KIOSK_CONFIG);
  const [lastSavedConfig, setLastSavedConfig] = useState<KioskConfig>(DEFAULT_KIOSK_CONFIG);
  const [publishedConfig, setPublishedConfig] = useState<KioskConfig>(DEFAULT_KIOSK_CONFIG);

  // STATE: UI
  const [previewMode, setPreviewMode] = useState<'draft' | 'published'>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<'background' | 'appearance' | 'content' | 'behavior'>('background');
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  // QUERIES
  const { data: locationsData } = trpc.kiosk.listLocations.useQuery(void 0, { enabled: true });

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
      console.log('[Kiosk Studio] Draft saved successfully:', result);
      setLastSavedConfig(draftConfig);
      setPersistenceError(null);
      success('Draft saved successfully');
      // Verify by refetching
      refetchCurrentKiosk();
    },
    onError: (err) => {
      console.error('[Kiosk Studio] Save draft error:', err);
      setPersistenceError(`Save failed: ${err.message}`);
      error(`Save failed: ${err.message}`);
    },
  });

  const publishMutation = trpc.kioskDevice.publish.useMutation({
    onSuccess: (result) => {
      console.log('[Kiosk Studio] Published successfully:', result);
      setPublishedConfig(draftConfig);
      setPersistenceError(null);
      success('Published successfully');
      // Verify by refetching
      refetchCurrentKiosk();
    },
    onError: (err) => {
      console.error('[Kiosk Studio] Publish error:', err);
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
      console.log('[Kiosk Studio] Loading kiosk config:', {
        id: currentKiosk.id,
        hasDraft: !!currentKiosk.draftConfig,
        hasPublished: !!currentKiosk.publishedConfig,
      });
      if (currentKiosk.draftConfig) {
        setDraftConfig(currentKiosk.draftConfig);
        setLastSavedConfig(currentKiosk.draftConfig);
      }
      if (currentKiosk.publishedConfig) {
        setPublishedConfig(currentKiosk.publishedConfig);
      }
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

  // HANDLERS: Config updates (IMMEDIATE BINDING)
  const updateConfig = useCallback((section: keyof KioskConfig, key: string, value: any) => {
    setDraftConfig(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [key]: value,
      },
    }));
  }, []);

  const handleBackgroundChange = useCallback((key: string, value: any) => {
    updateConfig('background', key, value);
  }, [updateConfig]);

  const handleThemeChange = useCallback((key: string, value: any) => {
    updateConfig('theme', key, value);
  }, [updateConfig]);

  const handleTypographyChange = useCallback((key: string, value: any) => {
    updateConfig('typography', key, value);
  }, [updateConfig]);

  const handleContentChange = useCallback((key: string, value: any) => {
    updateConfig('content', key, value);
  }, [updateConfig]);

  const handleLayoutChange = useCallback((key: string, value: any) => {
    updateConfig('layout', key, value);
  }, [updateConfig]);

  // HANDLERS: Save/Publish
  const handleSaveDraft = async () => {
    if (!selectedKiosk) {
      error('No kiosk selected');
      return;
    }

    setIsSaving(true);
    try {
      const validationResult = KioskConfigSchema.safeParse(draftConfig);
      if (!validationResult.success) {
        console.error('[Kiosk Studio] Validation failed:', validationResult.error);
        error('Invalid configuration');
        return;
      }

      console.log('[Kiosk Studio] Saving draft:', { kioskId: selectedKiosk, config: draftConfig });
      await saveDraftMutation.mutateAsync({
        kioskId: selectedKiosk,
        config: draftConfig,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedKiosk) {
      error('No kiosk selected');
      return;
    }

    setIsPublishing(true);
    try {
      const validationResult = KioskConfigSchema.safeParse(draftConfig);
      if (!validationResult.success) {
        console.error('[Kiosk Studio] Validation failed:', validationResult.error);
        error('Invalid configuration');
        return;
      }

      console.log('[Kiosk Studio] Publishing:', { kioskId: selectedKiosk, config: draftConfig });
      await publishMutation.mutateAsync({
        kioskId: selectedKiosk,
        config: draftConfig,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleOpenPublicKiosk = () => {
    if (currentKiosk) {
      window.open(`/kiosk/${currentKiosk.slug}`, '_blank');
    }
  };

  // RENDER: Loading states
  if (kiosksLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading kiosks...</p>
      </div>
    );
  }

  if (!selectedKiosk || !currentKiosk) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">Select a kiosk to begin</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* TOP BAR */}
      <div className="border-b border-border bg-background/50 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Location Dropdown */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Location:</Label>
            <Select value={selectedLocation?.toString()} onValueChange={(val) => setSelectedLocation(parseInt(val))}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locationsData?.map(loc => (
                  <SelectItem key={loc.id} value={loc.id.toString()}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kiosk Dropdown */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Kiosk:</Label>
            <Select value={selectedKiosk?.toString()} onValueChange={(val) => setSelectedKiosk(parseInt(val))}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {kiosksData?.map(k => (
                  <SelectItem key={k.id} value={k.id.toString()}>
                    {k.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 ml-4 text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className={isDirty ? 'text-yellow-600 font-medium' : 'text-green-600 font-medium'}>
              {isDirty ? 'Unsaved changes' : 'All saved'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveDraft}
            disabled={!isDirty || isSaving}
            size="sm"
            variant="outline"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {persistenceError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {persistenceError}
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* LEFT PANEL: EDITOR CONTROLS */}
        <div className="w-96 border border-border rounded-lg bg-card overflow-hidden flex flex-col">
          <Tabs value={activeEditorTab} onValueChange={(val: any) => setActiveEditorTab(val)} className="flex flex-col h-full">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="background" className="flex-1">Background</TabsTrigger>
              <TabsTrigger value="appearance" className="flex-1">Appearance</TabsTrigger>
              <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
              <TabsTrigger value="behavior" className="flex-1">Behavior</TabsTrigger>
            </TabsList>

            {/* BACKGROUND TAB */}
            <TabsContent value="background" className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <Label>Background Type</Label>
                <Select value={draftConfig.background.type} onValueChange={(val: any) => handleBackgroundChange('type', val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid Color</SelectItem>
                    <SelectItem value="custom">Custom Image</SelectItem>
                    <SelectItem value="preset">Preset</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {draftConfig.background.type === 'solid' && (
                <div className="space-y-2">
                  <Label>Color</Label>
                  <input
                    type="color"
                    value={draftConfig.background.color || '#000000'}
                    onChange={(e) => handleBackgroundChange('color', e.target.value)}
                    className="w-full h-10 rounded border border-border cursor-pointer"
                  />
                </div>
              )}

              {draftConfig.background.type === 'preset' && (
                <div className="space-y-2">
                  <Label>Preset</Label>
                  <KioskBackgroundPresets
                    selectedPresetId={draftConfig.background.presetKey}
                    onSelectPreset={(presetId) => handleBackgroundChange('presetKey', presetId)}
                  />
                </div>
              )}

              {draftConfig.background.type === 'custom' && (
                <div className="space-y-2">
                  <Label>Upload Image</Label>
                  <KioskBackgroundUpload
                    kioskId={selectedKiosk}
                    onUpload={(url) => handleBackgroundChange('customUrl', url)}
                  />
                </div>
              )}

              {(draftConfig.background.type === 'preset' || draftConfig.background.type === 'custom') && (
                <>
                  <div className="space-y-2">
                    <Label>Blur ({draftConfig.background.blur}px)</Label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={draftConfig.background.blur || 0}
                      onChange={(e) => handleBackgroundChange('blur', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Dim ({draftConfig.background.dim}%)</Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={draftConfig.background.dim || 0}
                      className="w-full"
                      onChange={(e) => handleBackgroundChange('dim', parseInt(e.target.value))}
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* APPEARANCE TAB */}
            <TabsContent value="appearance" className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <input
                  type="color"
                  value={draftConfig.theme.accentColor || '#ef4444'}
                  onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                  className="w-full h-10 rounded border border-border cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select value={draftConfig.theme.fontFamily} onValueChange={(val) => handleThemeChange('fontFamily', val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="mono">Monospace</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title Size ({draftConfig.typography.titleSize}px)</Label>
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
                <Label>Title Weight</Label>
                <Select value={draftConfig.typography.titleWeight?.toString()} onValueChange={(val) => handleTypographyChange('titleWeight', parseInt(val))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">Normal</SelectItem>
                    <SelectItem value="600">Semibold</SelectItem>
                    <SelectItem value="700">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Letter Spacing ({draftConfig.typography.letterSpacing}px)</Label>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="0.1"
                  value={draftConfig.typography.letterSpacing || 0}
                  onChange={(e) => handleTypographyChange('letterSpacing', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Button Font Size ({draftConfig.typography.buttonFontSize}px)</Label>
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

            {/* CONTENT TAB */}
            <TabsContent value="content" className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <Label>Left Tile Title</Label>
                <Input
                  value={draftConfig.content.leftTile?.title || ''}
                  onChange={(e) => handleContentChange('leftTile', { ...draftConfig.content.leftTile, title: e.target.value })}
                  placeholder="e.g., Next Class"
                />
              </div>

              <div className="space-y-2">
                <Label>Right Tile Title</Label>
                <Input
                  value={draftConfig.content.rightTile?.title || ''}
                  onChange={(e) => handleContentChange('rightTile', { ...draftConfig.content.rightTile, title: e.target.value })}
                  placeholder="e.g., Today's Focus"
                />
              </div>
            </TabsContent>

            {/* BEHAVIOR TAB */}
            <TabsContent value="behavior" className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="text-sm text-muted-foreground">
                Behavior settings coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT PANEL: PREVIEW */}
        <div className="flex-1 border border-border rounded-lg bg-black/5 overflow-hidden flex flex-col">
          {/* Device Selector */}
          <div className="border-b border-border bg-background/50 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Preview:</span>
              <Button
                variant={previewMode === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('draft')}
                className="text-xs"
              >
                Draft
              </Button>
              <Button
                variant={previewMode === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('published')}
                className="text-xs"
              >
                Published
              </Button>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleOpenPublicKiosk}
                className="text-xs"
              >
                Open Public Kiosk →
              </Button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-hidden p-4">
            {kioskLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <DeviceEmulator
                orgId={1}
                locationId={selectedLocation!}
                kioskId={selectedKiosk}
                kioskSlug={currentKiosk.slug}
              >
                <KioskPreviewLive config={previewConfig} />
              </DeviceEmulator>
            )}
          </div>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
