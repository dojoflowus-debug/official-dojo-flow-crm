'use client';

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Zap, AlertCircle, RotateCcw, Palette, Layout, FileText, BookMarked, ChevronDown, Smartphone, Monitor } from 'lucide-react';
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
import { Accordion } from '@/components/Accordion';
import { MOOD_PRESETS, CardStyle } from '../../../shared/kioskConfig';
import { ThemeTabPhase1 } from '@/components/ThemeTabPhase1';
import type { ButtonStyleConfig } from '../../../shared/buttonStyleConfig';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_BUTTON_STYLE } from '../../../shared/buttonStyleConfig';
import { SaveTemplateModal } from '@/components/SaveTemplateModal';
import { TemplateLibrary } from '@/components/TemplateLibrary';
import { useTemplateLibrary } from '@/hooks/useTemplateLibrary';

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

const BACKGROUND_THEMES = KIOSK_BACKGROUND_PRESETS.slice(0, 6).map(preset => ({
  id: preset.id,
  name: preset.name,
  image: preset.imageUrl,
}));

/**
 * KioskStudioExact - Studio-style editor with kiosk as centerpiece
 * 
 * Layout:
 * - Top command bar: Location, Device, Orientation, Live/Touch, Publish, Ask Kai
 * - Left panel: Studio controls (Theme, Layout, Content, Behavior, Deployment) - scrollable
 * - Center: Large, fixed kiosk preview with realistic device frame and cinematic lighting
 * - Premium aesthetics: black/charcoal/red, minimal, martial arts inspired
 */
export default function KioskStudioExact() {
  const queryClient = useQueryClient();
  const { toasts, success, error, removeToast } = useToast();
  const navigate = useNavigate();

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
  const [activeStudioTab, setActiveStudioTab] = useState<'theme' | 'layout' | 'content' | 'behavior' | 'deployment'>('theme');
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [currentMoodPreset, setCurrentMoodPreset] = useState<string>('dojo-dark');
  const [applyCardStyleGlobally, setApplyCardStyleGlobally] = useState(true);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [deviceMode, setDeviceMode] = useState<'ipad' | 'wall-kiosk' | 'front-desk'>('wall-kiosk');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isLiveMode, setIsLiveMode] = useState(true);

  // TEMPLATES
  const { templates, saveTemplate, deleteTemplate, duplicateTemplate, applyTemplate } = useTemplateLibrary();

  // SCROLL HIDE
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isUIHidden, isAutoHideEnabled, setIsAutoHideEnabled, registerInteraction } = useScrollHide({
    hideThreshold: 15,
    showThreshold: 8,
    edgeRevealZone: 40,
    scrollElement: scrollContainerRef.current,
  });

  // TRPC QUERIES
  const locationsQuery = trpc.locations.listLocations.useQuery();
  const kioskQuery = trpc.kiosk.getKiosk.useQuery(
    { kioskId: selectedKiosk || 1 },
    { enabled: !!selectedKiosk }
  );
  const updateKioskMutation = trpc.kiosk.updateKiosk.useMutation();
  const publishKioskMutation = trpc.kiosk.publishKiosk.useMutation();

  // Initialize
  useEffect(() => {
    if (locationsQuery.data?.locations && locationsQuery.data.locations.length > 0) {
      const firstLocation = locationsQuery.data.locations[0];
      setSelectedLocation(firstLocation.id);
      if (firstLocation.kiosks && firstLocation.kiosks.length > 0) {
        setSelectedKiosk(firstLocation.kiosks[0].id);
      }
    }
  }, [locationsQuery.data]);

  // Load kiosk config
  useEffect(() => {
    if (kioskQuery.data?.kiosk) {
      const kiosk = kioskQuery.data.kiosk as Kiosk;
      if (kiosk.draftConfig) {
        setDraftConfig(kiosk.draftConfig);
        setLastSavedConfig(kiosk.draftConfig);
      }
      if (kiosk.publishedConfig) {
        setPublishedConfig(kiosk.publishedConfig);
      }
    }
  }, [kioskQuery.data]);

  // Save draft
  const handleSaveDraft = async () => {
    if (!selectedKiosk) return;
    setIsSaving(true);
    try {
      await updateKioskMutation.mutateAsync({
        kioskId: selectedKiosk,
        draftConfig,
      });
      setLastSavedConfig(JSON.parse(JSON.stringify(draftConfig)));
      success('Draft saved successfully');
      queryClient.invalidateQueries({ queryKey: ['kiosk.getKiosk'] });
    } catch (err) {
      error('Failed to save draft');
      setPersistenceError('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish
  const handlePublish = async () => {
    if (!selectedKiosk) return;
    setIsPublishing(true);
    try {
      await publishKioskMutation.mutateAsync({
        kioskId: selectedKiosk,
        config: draftConfig,
      });
      setPublishedConfig(JSON.parse(JSON.stringify(draftConfig)));
      success('Kiosk published successfully');
      queryClient.invalidateQueries({ queryKey: ['kiosk.getKiosk'] });
    } catch (err) {
      error('Failed to publish kiosk');
      setPersistenceError('Failed to publish kiosk');
    } finally {
      setIsPublishing(false);
    }
  };

  const currentConfig = previewMode === 'draft' ? draftConfig : publishedConfig;
  const selectedLocationData = locationsQuery.data?.locations?.find(l => l.id === selectedLocation);

  return (
    <div className="flex flex-col h-screen bg-black" style={{backgroundColor: '#0B0D10'}}>
      {/* TOP COMMAND BAR - Slim, minimal, professional */}
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{
        background: 'rgba(18, 22, 28, 0.95)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}>
        {/* Left: Location + Device + Orientation */}
        <div className="flex items-center gap-4">
          {/* Location Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{color: 'rgba(255,255,255,0.65)'}}>Location:</span>
            <Select value={selectedLocation?.toString() || ''} onValueChange={(val) => setSelectedLocation(parseInt(val))}>
              <SelectTrigger className="w-40 h-8 text-xs" style={{
                background: 'rgba(22, 27, 34, 0.8)',
                borderColor: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.92)',
              }}>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent style={{background: 'rgba(22, 27, 34, 0.95)', borderColor: 'rgba(255,255,255,0.08)'}}>
                {locationsQuery.data?.locations?.map(loc => (
                  <SelectItem key={loc.id} value={loc.id.toString()} style={{color: 'rgba(255,255,255,0.92)'}}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Device Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{color: 'rgba(255,255,255,0.65)'}}>Device:</span>
            <Select value={deviceMode} onValueChange={(val: any) => setDeviceMode(val)}>
              <SelectTrigger className="w-40 h-8 text-xs" style={{
                background: 'rgba(22, 27, 34, 0.8)',
                borderColor: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.92)',
              }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{background: 'rgba(22, 27, 34, 0.95)', borderColor: 'rgba(255,255,255,0.08)'}}>
                <SelectItem value="ipad" style={{color: 'rgba(255,255,255,0.92)'}}>iPad</SelectItem>
                <SelectItem value="wall-kiosk" style={{color: 'rgba(255,255,255,0.92)'}}>Wall Kiosk</SelectItem>
                <SelectItem value="front-desk" style={{color: 'rgba(255,255,255,0.92)'}}>Front Desk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orientation Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{color: 'rgba(255,255,255,0.65)'}}>Orientation:</span>
            <div className="flex gap-1">
              {['portrait', 'landscape'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setOrientation(mode as any)}
                  className="px-2 py-1 text-xs rounded transition"
                  style={{
                    background: orientation === mode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                    color: orientation === mode ? '#EF4444' : 'rgba(255,255,255,0.65)',
                    border: `1px solid ${orientation === mode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {mode === 'portrait' ? '📱' : '📺'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Live/Touch Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{color: 'rgba(255,255,255,0.65)'}}>Mode:</span>
          <div className="flex gap-1">
            {['live', 'touch'].map(mode => (
              <button
                key={mode}
                onClick={() => setIsLiveMode(mode === 'live')}
                className="px-2 py-1 text-xs rounded transition"
                style={{
                  background: (isLiveMode && mode === 'live') || (!isLiveMode && mode === 'touch') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                  color: (isLiveMode && mode === 'live') || (!isLiveMode && mode === 'touch') ? '#EF4444' : 'rgba(255,255,255,0.65)',
                  border: `1px solid ${(isLiveMode && mode === 'live') || (!isLiveMode && mode === 'touch') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {mode === 'live' ? 'Live' : 'Touch'}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Publish + Ask Kai */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveDraft}
            disabled={isSaving}
            size="sm"
            variant="outline"
            style={{borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)'}}
            className="text-xs"
          >
            <Save className="w-3 h-3 mr-1" />
            Save Draft
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white text-xs"
          >
            <Zap className="w-3 h-3 mr-1" />
            Publish
          </Button>
          <Button
            onClick={() => setShowTemplateLibrary(true)}
            size="sm"
            variant="outline"
            style={{borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)'}}
            className="text-xs"
          >
            <BookMarked className="w-3 h-3 mr-1" />
            Templates
          </Button>
          <Button
            size="sm"
            variant="outline"
            style={{borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)'}}
            className="text-xs"
          >
            Ask Kai
          </Button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {persistenceError && (
        <div className="flex items-center gap-2 px-6 py-3 bg-red-950/50 border-b border-red-900/50 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{persistenceError}</span>
        </div>
      )}

      {/* MAIN WORKSPACE - Studio layout with left panel + centered kiosk */}
      <div className="flex-1 flex overflow-hidden gap-6 p-6">
        {/* LEFT PANEL: Studio Controls - Expanded, scrollable */}
        <div className="w-96 rounded-lg p-6 flex flex-col overflow-y-auto flex-shrink-0" style={{
          backgroundColor: 'rgba(11, 13, 16, 0.65)',
          backdropFilter: 'blur(14px) saturate(120%)',
          border: '1px solid rgba(255,255,255,0.06)',
          maxHeight: 'calc(100vh - 200px)',
        }}>
          {/* Studio Panel Header */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white">Kiosk Studio</h2>
            <p className="text-xs mt-1" style={{color: 'rgba(255,255,255,0.4)'}}>Design your kiosk experience</p>
          </div>

          {/* Studio Tabs */}
          <Tabs value={activeStudioTab} onValueChange={(val: any) => setActiveStudioTab(val)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-6" style={{
              background: 'rgba(22, 27, 34, 0.4)',
              borderColor: 'rgba(255,255,255,0.08)',
            }}>
              <TabsTrigger value="theme" className="text-xs">Theme</TabsTrigger>
              <TabsTrigger value="layout" className="text-xs">Layout</TabsTrigger>
              <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
              <TabsTrigger value="behavior" className="text-xs">Behavior</TabsTrigger>
            </TabsList>

            {/* THEME TAB */}
            <TabsContent value="theme" className="flex-1 space-y-6 overflow-y-auto">
              {draftConfig && (
                <ThemeTabPhase1
                  draftConfig={draftConfig}
                  currentMoodPreset={currentMoodPreset}
                  onMoodPresetSelect={(presetKey, presetConfig) => {
                    setCurrentMoodPreset(presetKey);
                    setDraftConfig(prev => ({ ...prev, ...presetConfig }));
                  }}
                  onCardStyleChange={(cardStyle) => {
                    setDraftConfig(prev => ({ ...prev, cardStyle }));
                  }}
                  onResetCardStyle={() => {
                    setDraftConfig(prev => ({
                      ...prev,
                      cardStyle: DEFAULT_KIOSK_CONFIG.cardStyle,
                    }));
                  }}
                  onResetMoodPreset={() => {
                    setCurrentMoodPreset('dojo-dark');
                    setDraftConfig(DEFAULT_KIOSK_CONFIG);
                  }}
                  onBackgroundChange={(key, value) => {
                    setDraftConfig(prev => ({
                      ...prev,
                      background: { ...prev.background, [key]: value },
                    }));
                  }}
                  onThemeChange={(key, value) => {
                    setDraftConfig(prev => ({
                      ...prev,
                      [key]: value,
                    }));
                  }}
                  onSliderChange={() => {}}
                  onTypographyChange={(typography) => {
                    setDraftConfig(prev => ({ ...prev, typography }));
                  }}
                  onButtonStyleChange={(buttonStyle) => {
                    setDraftConfig(prev => ({ ...prev, buttonStyle }));
                  }}
                  onResetButtonStyle={() => {
                    setDraftConfig(prev => ({
                      ...prev,
                      buttonStyle: DEFAULT_BUTTON_STYLE,
                    }));
                  }}
                />
              )}
            </TabsContent>

            {/* LAYOUT TAB */}
            <TabsContent value="layout" className="flex-1 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">Layout Settings</h3>
                <p className="text-xs" style={{color: 'rgba(255,255,255,0.5)'}}>Configure kiosk layout and positioning</p>
              </div>
            </TabsContent>

            {/* CONTENT TAB */}
            <TabsContent value="content" className="flex-1 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">Content Settings</h3>
                <p className="text-xs" style={{color: 'rgba(255,255,255,0.5)'}}>Manage kiosk content and messaging</p>
              </div>
            </TabsContent>

            {/* BEHAVIOR TAB */}
            <TabsContent value="behavior" className="flex-1 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">Behavior Settings</h3>
                <p className="text-xs" style={{color: 'rgba(255,255,255,0.5)'}}>Configure kiosk interactions and animations</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* CENTER: Kiosk Preview - Large, centered, fixed */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden rounded-lg" style={{
          backgroundImage: 'url(/dojo-studio-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}>
          {/* Cinematic vignette overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)',
          }} />

          {/* Kiosk Device Frame Container - Realistic, premium */}
          <div className="relative z-10 flex items-center justify-center" style={{
            perspective: '1200px',
          }}>
            {/* Outer frame shadow (cinematic lighting) */}
            <div className="absolute inset-0 rounded-3xl" style={{
              background: 'radial-gradient(ellipse at 30% 30%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)',
              filter: 'blur(40px)',
              transform: 'scale(1.1)',
            }} />

            {/* Device Frame */}
            <div className="relative rounded-3xl overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.9) 0%, rgba(20, 20, 25, 0.95) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
              width: deviceMode === 'ipad' ? '600px' : '800px',
              height: orientation === 'portrait' ? '800px' : '600px',
            }}>
              {/* Notch/bezel (for iPad style) */}
              {deviceMode === 'ipad' && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 rounded-b-3xl" style={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  zIndex: 20,
                }} />
              )}

              {/* Device Screen Content */}
              <div className="flex-1 w-full overflow-hidden" style={{
                background: 'rgba(20, 20, 25, 0.2)',
              }}>
                {selectedLocation && selectedKiosk && currentConfig && (
                  <DeviceEmulator
                    orgId={selectedLocation}
                    locationId={selectedLocation}
                    kioskId={selectedKiosk}
                    config={currentConfig}
                    isLiveMode={isLiveMode}
                  />
                )}
              </div>
            </div>

            {/* Bottom bezel/stand (for wall kiosk style) */}
            {deviceMode === 'wall-kiosk' && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-96 h-6 rounded-t-2xl" style={{
                background: 'linear-gradient(180deg, rgba(30, 30, 35, 0.9) 0%, rgba(20, 20, 25, 0.95) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              }} />
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showSaveTemplateModal && (
        <SaveTemplateModal
          onClose={() => setShowSaveTemplateModal(false)}
          onSave={async (name, description) => {
            setIsSavingTemplate(true);
            try {
              await saveTemplate(name, description, draftConfig);
              success('Template saved successfully');
              setShowSaveTemplateModal(false);
            } catch (err) {
              error('Failed to save template');
            } finally {
              setIsSavingTemplate(false);
            }
          }}
          isSaving={isSavingTemplate}
        />
      )}

      {showTemplateLibrary && (
        <TemplateLibrary
          templates={templates}
          onClose={() => setShowTemplateLibrary(false)}
          onApply={async (template) => {
            try {
              await applyTemplate(template.id, setDraftConfig);
              success('Template applied successfully');
              setShowTemplateLibrary(false);
            } catch (err) {
              error('Failed to apply template');
            }
          }}
          onDelete={async (templateId) => {
            try {
              await deleteTemplate(templateId);
              success('Template deleted successfully');
            } catch (err) {
              error('Failed to delete template');
            }
          }}
          onDuplicate={async (templateId) => {
            try {
              await duplicateTemplate(templateId);
              success('Template duplicated successfully');
            } catch (err) {
              error('Failed to duplicate template');
            }
          }}
        />
      )}

      {/* TOASTS */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
