import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Zap, Plus, MoreVertical, Trash2, Copy, Edit2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { KioskConfig, DEFAULT_KIOSK_CONFIG } from '../../../shared/kioskConfig';
import { KioskConfigSchema } from '../../../shared/kioskConfigSchema';
import KioskPreviewLive from '@/components/kiosk/KioskPreviewLive';
import { KioskBackgroundPresets } from '@/components/KioskBackgroundPresets';
import { KioskBackgroundUpload } from '@/components/KioskBackgroundUpload';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
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

export default function KioskStudioSimplified() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toasts, success, error, removeToast } = useToast();
  const [draftConfig, setDraftConfig] = useState<KioskConfig>(DEFAULT_KIOSK_CONFIG);
  const [lastSavedConfig, setLastSavedConfig] = useState<KioskConfig>(DEFAULT_KIOSK_CONFIG);
  const [publishedConfig, setPublishedConfig] = useState<KioskConfig>(DEFAULT_KIOSK_CONFIG);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedKiosk, setSelectedKiosk] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<'draft' | 'published'>('draft');
  const [isSaving, setIsSaving] = useState(false);

  // Calculate dirty state
  const isDirty = JSON.stringify(draftConfig) !== JSON.stringify(lastSavedConfig);

  // Fetch locations
  const { data: locationsData } = trpc.kiosk.listLocations.useQuery(undefined, { enabled: true });

  // Fetch kiosks for selected location
  const { data: kiosksData, refetch: refetchKiosks, isLoading: kiosksLoading, error: kiosksError } = trpc.kioskDevice.listByLocation.useQuery(
    { locationId: selectedLocation! },
    { enabled: !!selectedLocation }
  );

  // Debug logging
  useEffect(() => {
    console.log('[KioskStudio] State:', { selectedLocation, selectedKiosk, kiosksCount: kiosksData?.length, kiosksLoading, kiosksError: kiosksError?.message });
  }, [selectedLocation, selectedKiosk, kiosksData, kiosksLoading, kiosksError]);

  // Fetch current kiosk
  const { data: currentKiosk, isLoading: kioskLoading } = trpc.kioskDevice.getById.useQuery(
    { kioskId: selectedKiosk! },
    { enabled: !!selectedKiosk }
  );

  // Mutations
  const saveDraftMutation = trpc.kioskDevice.saveDraft.useMutation({
    onSuccess: () => {
      setLastSavedConfig(draftConfig);
      success('Draft saved');
      queryClient.invalidateQueries({ queryKey: ['kioskDevice.getById'] });
    },
    onError: (err) => {
      error(`Save failed: ${err.message}`);
    },
  });

  const publishMutation = trpc.kioskDevice.publish.useMutation({
    onSuccess: () => {
      setPublishedConfig(draftConfig);
      success('Published successfully');
      queryClient.invalidateQueries({ queryKey: ['kioskDevice.getById'] });
    },
    onError: (err) => {
      error(`Publish failed: ${err.message}`);
    },
  });

  const createKioskMutation = trpc.kioskDevice.create.useMutation({
    onSuccess: () => {
      toast.success('Kiosk created');
      refetchKiosks();
    },
    onError: (error) => {
      toast.error(`Create failed: ${error.message}`);
    },
  });

  const deleteKioskMutation = trpc.kioskDevice.delete.useMutation({
    onSuccess: () => {
      toast.success('Kiosk deleted');
      setSelectedKiosk(null);
      refetchKiosks();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  // Load kiosk data when selected
  useEffect(() => {
    if (currentKiosk) {
      if (currentKiosk.draftConfig) {
        setDraftConfig(currentKiosk.draftConfig);
        setLastSavedConfig(currentKiosk.draftConfig);
      }
      if (currentKiosk.publishedConfig) {
        setPublishedConfig(currentKiosk.publishedConfig);
      }
    }
  }, [currentKiosk]);

  // Auto-select first kiosk
  useEffect(() => {
    if (kiosksData && kiosksData.length > 0 && !selectedKiosk) {
      setSelectedKiosk(kiosksData[0].id);
    }
  }, [kiosksData, selectedKiosk]);

  // Auto-select first location
  useEffect(() => {
    if (locationsData && locationsData.length > 0 && !selectedLocation) {
      setSelectedLocation(locationsData[0].id);
    }
  }, [locationsData, selectedLocation]);

  // Get preview config
  const getPreviewConfig = (): KioskConfig => {
    if (previewMode === 'published' && publishedConfig) {
      return publishedConfig;
    }
    return draftConfig;
  };

  // Update config helpers
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

  const handleThemeChange = (key: string, value: any) => updateConfig('theme', key, value);
  const handleBackgroundChange = (key: string, value: any) => updateConfig('background', key, value);
  const handleTypographyChange = (key: string, value: any) => updateConfig('typography', key, value);
  const handleContentChange = (key: string, value: any) => updateConfig('content', key, value);
  const handleLayoutChange = (key: string, value: any) => updateConfig('layout', key, value);

  // Save handlers
  const handleSaveDraft = async () => {
    if (!selectedKiosk) {
      toast.error('No kiosk selected');
      return;
    }
    setIsSaving(true);
    try {
      const validationResult = KioskConfigSchema.safeParse(draftConfig);
      if (!validationResult.success) {
        toast.error('Invalid configuration');
        return;
      }
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
      toast.error('No kiosk selected');
      return;
    }
    setIsSaving(true);
    try {
      const validationResult = KioskConfigSchema.safeParse(draftConfig);
      if (!validationResult.success) {
        toast.error('Invalid configuration');
        return;
      }
      await publishMutation.mutateAsync({
        kioskId: selectedKiosk,
        config: draftConfig,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
      {/* LEFT PANEL - EDITOR */}
      <div className="w-96 border-r border-border overflow-y-auto bg-gradient-to-b from-background to-background/95">
        <div className="p-6 space-y-6">
          {/* Location & Kiosk Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Location & Kiosk</h3>
            
            <div>
              <Label className="text-xs">Location</Label>
              <select
                value={selectedLocation?.toString() || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const locId = parseInt(val);
                    setSelectedLocation(locId);
                    setSelectedKiosk(null); // Reset kiosk when location changes
                  } else {
                    setSelectedLocation(null);
                    setSelectedKiosk(null);
                  }
                }}
                className="w-full px-3 py-2 rounded border border-border bg-background text-sm mt-1"
              >
                <option value="">Select location...</option>
                {locationsData?.map((loc: any) => (
                  <option key={loc.id} value={loc.id.toString()}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Kiosk</Label>
              <select
                value={selectedKiosk?.toString() || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    setSelectedKiosk(parseInt(val));
                  } else {
                    setSelectedKiosk(null);
                  }
                }}
                className="w-full px-3 py-2 rounded border border-border bg-background text-sm mt-1"
                disabled={!selectedLocation}
              >
                <option value="">Select kiosk...</option>
                {kiosksData?.map((kiosk: any) => (
                  <option key={kiosk.id} value={kiosk.id.toString()}>{kiosk.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="background" className="w-full">
            <TabsList className="grid w-full grid-cols-3 text-xs">
              <TabsTrigger value="background">Background</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>

            {/* BACKGROUND TAB */}
            <TabsContent value="background" className="space-y-4">
              <div>
                <Label className="text-xs mb-2 block">Background Type</Label>
                <select
                  value={draftConfig.background.type}
                  onChange={(e) => handleBackgroundChange('type', e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
                >
                  <option value="solid">Solid Color</option>
                  <option value="preset">Preset Theme</option>
                  <option value="custom">Custom Image</option>
                </select>
              </div>

              {/* Solid Color */}
              {draftConfig.background.type === 'solid' && (
                <div className="space-y-2">
                  <Label className="text-xs">Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={draftConfig.background.color}
                      onChange={(e) => handleBackgroundChange('color', e.target.value)}
                      className="w-12 h-10 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={draftConfig.background.color}
                      onChange={(e) => handleBackgroundChange('color', e.target.value)}
                      className="text-sm flex-1"
                    />
                  </div>
                </div>
              )}

              {/* Preset */}
              {draftConfig.background.type === 'preset' && (
                <KioskBackgroundPresets
                  selectedPresetId={draftConfig.background.presetKey || undefined}
                  onSelectPreset={(presetId) => handleBackgroundChange('presetKey', presetId)}
                />
              )}

              {/* Custom Image Upload */}
              {draftConfig.background.type === 'custom' && selectedKiosk && (
                <KioskBackgroundUpload
                  kioskId={selectedKiosk}
                  onUploadComplete={(url) => {
                    handleBackgroundChange('customUrl', url);
                    success('Background uploaded successfully');
                  }}
                  onError={(err) => {
                    error(`Upload failed: ${err}`);
                  }}
                />
              )}

              {/* Blur & Dim */}
              {(draftConfig.background.type === 'preset' || draftConfig.background.type === 'custom') && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">Blur: {draftConfig.background.blur}px</Label>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={draftConfig.background.blur}
                      onChange={(e) => handleBackgroundChange('blur', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Dim: {draftConfig.background.dim}%</Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={draftConfig.background.dim}
                      onChange={(e) => handleBackgroundChange('dim', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* APPEARANCE TAB */}
            <TabsContent value="appearance" className="space-y-4">
              <div>
                <Label className="text-xs">Accent Color</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={draftConfig.theme.accentColor}
                    onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                    className="w-12 h-10 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={draftConfig.theme.accentColor}
                    onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                    className="text-sm flex-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Font Family</Label>
                <select
                  value={draftConfig.theme.fontFamily}
                  onChange={(e) => handleThemeChange('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-background text-sm mt-1"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Title Size: {draftConfig.typography.titleSize}px</Label>
                <input
                  type="range"
                  min="24"
                  max="72"
                  value={draftConfig.typography.titleSize}
                  onChange={(e) => handleTypographyChange('titleSize', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Title Weight: {draftConfig.typography.titleWeight}</Label>
                <input
                  type="range"
                  min="400"
                  max="900"
                  step="100"
                  value={draftConfig.typography.titleWeight}
                  onChange={(e) => handleTypographyChange('titleWeight', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Letter Spacing: {draftConfig.typography.letterSpacing}px</Label>
                <input
                  type="range"
                  min="-2"
                  max="4"
                  step="0.5"
                  value={draftConfig.typography.letterSpacing}
                  onChange={(e) => handleTypographyChange('letterSpacing', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Button Font Size: {draftConfig.typography.buttonFontSize}px</Label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={draftConfig.typography.buttonFontSize}
                  onChange={(e) => handleTypographyChange('buttonFontSize', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </TabsContent>

            {/* CONTENT TAB */}
            <TabsContent value="content" className="space-y-4">
              <div>
                <Label className="text-xs">Headline</Label>
                <Input
                  value={draftConfig.content.headline}
                  onChange={(e) => handleContentChange('headline', e.target.value)}
                  className="text-sm mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Subtext</Label>
                <Input
                  value={draftConfig.content.subtext}
                  onChange={(e) => handleContentChange('subtext', e.target.value)}
                  className="text-sm mt-1"
                />
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold mb-2">Left Tile (Check In)</p>
                <Input
                  placeholder="Title"
                  value={draftConfig.content.tileLeft.title}
                  onChange={(e) => {
                    const updated = { ...draftConfig };
                    updated.content.tileLeft.title = e.target.value;
                    setDraftConfig(updated);
                  }}
                  className="text-sm mb-2"
                />
                <Input
                  placeholder="Subtitle"
                  value={draftConfig.content.tileLeft.subtitle}
                  onChange={(e) => {
                    const updated = { ...draftConfig };
                    updated.content.tileLeft.subtitle = e.target.value;
                    setDraftConfig(updated);
                  }}
                  className="text-sm mb-2"
                />
                <Input
                  placeholder="Button"
                  value={draftConfig.content.tileLeft.button}
                  onChange={(e) => {
                    const updated = { ...draftConfig };
                    updated.content.tileLeft.button = e.target.value;
                    setDraftConfig(updated);
                  }}
                  className="text-sm"
                />
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold mb-2">Right Tile (Start Training)</p>
                <Input
                  placeholder="Title"
                  value={draftConfig.content.tileRight.title}
                  onChange={(e) => {
                    const updated = { ...draftConfig };
                    updated.content.tileRight.title = e.target.value;
                    setDraftConfig(updated);
                  }}
                  className="text-sm mb-2"
                />
                <Input
                  placeholder="Subtitle"
                  value={draftConfig.content.tileRight.subtitle}
                  onChange={(e) => {
                    const updated = { ...draftConfig };
                    updated.content.tileRight.subtitle = e.target.value;
                    setDraftConfig(updated);
                  }}
                  className="text-sm mb-2"
                />
                <Input
                  placeholder="Button"
                  value={draftConfig.content.tileRight.button}
                  onChange={(e) => {
                    const updated = { ...draftConfig };
                    updated.content.tileRight.button = e.target.value;
                    setDraftConfig(updated);
                  }}
                  className="text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Save/Publish Buttons */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              onClick={handleSaveDraft}
              disabled={!isDirty || isSaving || !selectedKiosk}
              className="flex-1"
              size="sm"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!isDirty || isSaving || !selectedKiosk}
              variant="default"
              className="flex-1"
              size="sm"
            >
              <Zap className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - PREVIEW */}
      <div className="flex-1 overflow-hidden bg-black/5">
        <div className="h-full flex flex-col">
          {/* Preview Mode Selector */}
          <div className="border-b border-border bg-background/50 px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Live Preview</h3>
            <div className="flex gap-2">
              <Button
                variant={previewMode === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('draft')}
              >
                Draft
              </Button>
              <Button
                variant={previewMode === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('published')}
              >
                Published
              </Button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-hidden">
            {kioskLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <KioskPreviewLive config={getPreviewConfig()} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
