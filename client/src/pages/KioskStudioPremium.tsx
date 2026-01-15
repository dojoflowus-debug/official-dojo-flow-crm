'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Zap, AlertCircle, Palette, Image as ImageIcon, Type, Zap as Sparkles, Eye, Download, Share2, ChevronDown } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { KioskConfig, DEFAULT_KIOSK_CONFIG } from '../../../shared/kioskConfig';
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
 * KioskStudioPremium - Premium design experience for kiosk configuration
 * 
 * Design Philosophy:
 * - Apple device preview + Figma canvas + Peloton polish
 * - Hero preview centered as studio canvas
 * - Clean command bar at top
 * - Beautiful control modules on left
 * - Premium depth and visual hierarchy
 */
export default function KioskStudioPremium() {
  const navigate = useNavigate();
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
  const [activeEditorTab, setActiveEditorTab] = useState<'background' | 'appearance' | 'content' | 'behavior'>('background');
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

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

  const handleOpenPublicKiosk = useCallback(() => {
    if (currentKiosk?.slug) {
      window.open(`/kiosk/${currentKiosk.slug}`, '_blank');
    }
  }, [currentKiosk?.slug]);

  // RENDER: Loading states
  if (!locationsData || locationsData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
        <p className="text-slate-400">No locations available</p>
      </div>
    );
  }

  if (!selectedLocation || kiosksLoading || !kiosksData || kiosksData.length === 0 || !selectedKiosk || kioskLoading || !currentKiosk) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
        <p className="text-slate-400">Loading studio...</p>
      </div>
    );
  }

  if (!draftConfig || !draftConfig.background || !draftConfig.theme || !draftConfig.typography || !draftConfig.content) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
        <p className="text-slate-400">Invalid configuration</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-950 to-black">
      {/* PREMIUM COMMAND BAR */}
      <div className="h-16 px-8 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between">
        {/* Left: Branding */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400 tracking-widest uppercase">Kiosk Studio</span>
            <span className="text-sm font-medium text-white">{currentKiosk?.name}</span>
          </div>
        </div>

        {/* Center: Status */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isDirty ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-slate-300">{isDirty ? 'Unsaved changes' : 'All saved'}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveDraft}
            disabled={!isDirty || isSaving}
            size="sm"
            variant="outline"
            className="border-slate-700 hover:border-slate-600 hover:bg-slate-800"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Zap className="w-4 h-4 mr-2" />
            Publish
          </Button>
          <Button
            onClick={handleOpenPublicKiosk}
            size="sm"
            variant="ghost"
            className="text-slate-400 hover:text-slate-200"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {persistenceError && (
        <div className="flex items-center gap-2 px-8 py-3 bg-red-950/50 border-b border-red-900/50 text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{persistenceError}</span>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden gap-8 p-8">
        {/* LEFT PANEL: DESIGN MODULES */}
        <div className="w-96 flex flex-col gap-4 overflow-y-auto pr-4">
          {/* BACKGROUND MODULE */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-slate-600/50 transition-colors">
            <button
              onClick={() => setExpandedModule(expandedModule === 'background' ? null : 'background')}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Background</h3>
                  <p className="text-xs text-slate-400">Set the visual foundation</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedModule === 'background' ? 'rotate-180' : ''}`} />
            </button>

            {expandedModule === 'background' && (
              <div className="space-y-4 pt-4 border-t border-slate-700/50">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-200">Type</Label>
                  <Select value={draftConfig.background.type || 'solid'} onValueChange={(val: any) => handleBackgroundChange('type', val)}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid Color</SelectItem>
                      <SelectItem value="custom">Custom Image</SelectItem>
                      <SelectItem value="preset">Preset Theme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {draftConfig.background.type === 'solid' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-200">Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={draftConfig.background.color || '#000000'}
                        onChange={(e) => handleBackgroundChange('color', e.target.value)}
                        className="w-12 h-10 rounded-lg border border-slate-700 cursor-pointer"
                      />
                      <Input
                        value={draftConfig.background.color || '#000000'}
                        onChange={(e) => handleBackgroundChange('color', e.target.value)}
                        className="flex-1 bg-slate-900/50 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                )}

                {draftConfig.background.type === 'preset' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-200">Theme Gallery</Label>
                    <KioskBackgroundPresets
                      selectedPresetId={draftConfig.background.presetKey || undefined}
                      onSelectPreset={(presetId) => handleBackgroundChange('presetKey', presetId)}
                    />
                  </div>
                )}

                {draftConfig.background.type === 'custom' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-200">Upload</Label>
                    <KioskBackgroundUpload
                      kioskId={selectedKiosk}
                      onUploadSuccess={(url) => handleBackgroundChange('customUrl', url)}
                    />
                  </div>
                )}

                {(draftConfig.background.type === 'preset' || draftConfig.background.type === 'custom') && (
                  <div className="space-y-4 pt-4 border-t border-slate-700/50">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-slate-200">Blur</Label>
                        <span className="text-xs text-slate-400">{draftConfig.background.blur}px</span>
                      </div>
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
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-slate-200">Dim</Label>
                        <span className="text-xs text-slate-400">{draftConfig.background.dim}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={draftConfig.background.dim || 0}
                        className="w-full"
                        onChange={(e) => handleBackgroundChange('dim', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* APPEARANCE MODULE */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-slate-600/50 transition-colors">
            <button
              onClick={() => setExpandedModule(expandedModule === 'appearance' ? null : 'appearance')}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Appearance</h3>
                  <p className="text-xs text-slate-400">Colors and styling</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedModule === 'appearance' ? 'rotate-180' : ''}`} />
            </button>

            {expandedModule === 'appearance' && (
              <div className="space-y-4 pt-4 border-t border-slate-700/50">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-200">Accent Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={draftConfig.theme.accentColor || '#ef4444'}
                      onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                      className="w-12 h-10 rounded-lg border border-slate-700 cursor-pointer"
                    />
                    <Input
                      value={draftConfig.theme.accentColor || '#ef4444'}
                      onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                      className="flex-1 bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-200">Font Family</Label>
                  <Select value={draftConfig.theme.fontFamily || 'system'} onValueChange={(val) => handleThemeChange('fontFamily', val)}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="sans">Sans-serif</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="mono">Monospace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* TYPOGRAPHY MODULE */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-slate-600/50 transition-colors">
            <button
              onClick={() => setExpandedModule(expandedModule === 'typography' ? null : 'typography')}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Type className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Typography</h3>
                  <p className="text-xs text-slate-400">Text and sizing</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedModule === 'typography' ? 'rotate-180' : ''}`} />
            </button>

            {expandedModule === 'typography' && (
              <div className="space-y-4 pt-4 border-t border-slate-700/50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-slate-200">Title Size</Label>
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
                  <Label className="text-sm font-medium text-slate-200">Title Weight</Label>
                  <Select value={(draftConfig.typography.titleWeight || 400).toString()} onValueChange={(val) => handleTypographyChange('titleWeight', parseInt(val))}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
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
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-slate-200">Letter Spacing</Label>
                    <span className="text-xs text-slate-400">{draftConfig.typography.letterSpacing}px</span>
                  </div>
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
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-slate-200">Button Size</Label>
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
              </div>
            )}
          </div>

          {/* CONTENT MODULE */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-slate-600/50 transition-colors">
            <button
              onClick={() => setExpandedModule(expandedModule === 'content' ? null : 'content')}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Content</h3>
                  <p className="text-xs text-slate-400">Text and messaging</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedModule === 'content' ? 'rotate-180' : ''}`} />
            </button>

            {expandedModule === 'content' && (
              <div className="space-y-4 pt-4 border-t border-slate-700/50">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-200">Left Tile Title</Label>
                  <Input
                    value={draftConfig.content.leftTile?.title || ''}
                    onChange={(e) => handleContentChange('leftTile', { ...draftConfig.content.leftTile, title: e.target.value })}
                    placeholder="e.g., Next Class"
                    className="bg-slate-900/50 border-slate-700 text-white placeholder-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-200">Right Tile Title</Label>
                  <Input
                    value={draftConfig.content.rightTile?.title || ''}
                    onChange={(e) => handleContentChange('rightTile', { ...draftConfig.content.rightTile, title: e.target.value })}
                    placeholder="e.g., Today's Focus"
                    className="bg-slate-900/50 border-slate-700 text-white placeholder-slate-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: PREMIUM PREVIEW */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Device Selector Dock */}
          <DeviceEmulator
            config={previewConfig}
            kioskId={selectedKiosk}
            onOpenPublicKiosk={handleOpenPublicKiosk}
          />

          {/* Preview Canvas */}
          <div className="flex-1 flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 overflow-hidden backdrop-blur-sm p-8">
            <div className="w-full h-full max-w-4xl rounded-xl overflow-hidden shadow-2xl">
              <KioskPreviewLive config={previewConfig} />
            </div>
          </div>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
