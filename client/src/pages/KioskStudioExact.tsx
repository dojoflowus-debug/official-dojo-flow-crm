import { useState, useRef, useEffect, ReactNode } from 'react';
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
import { Accordion } from '@/components/Accordion';
import { MOOD_PRESETS, CardStyle } from '../../../shared/kioskConfig';
import { ThemeTabPhase1 } from '@/components/ThemeTabPhase1';
import type { ButtonStyleConfig } from '../../../shared/buttonStyleConfig';

import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_BUTTON_STYLE } from '../../../shared/buttonStyleConfig';
import { SaveTemplateModal } from '@/components/SaveTemplateModal';
import { TemplateLibrary } from '@/components/TemplateLibrary';
import { useTemplateLibrary } from '@/hooks/useTemplateLibrary';
import { BookMarked } from 'lucide-react';

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
 * KioskStudioExact - Premium design studio interface with sticky preview
 * 
 * Layout:
 * - Top bar: "Live Preview" + Save/Publish buttons
 * - Left sidebar: Theme/Layout/Content/Behavior studio controls (scrollable)
 * - Right column: Device emulator with sticky positioning (stays visible while scrolling)
 * - Sticky Preview toggle to enable/disable sticky behavior
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
  const [currentMoodPreset, setCurrentMoodPreset] = useState<string>('dojo-dark');
  const [applyCardStyleGlobally, setApplyCardStyleGlobally] = useState(true);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isStickyPreviewEnabled, setIsStickyPreviewEnabled] = useState(() => {
    const stored = localStorage.getItem('dojoFlow:stickyPreview');
    return stored ? JSON.parse(stored) : true;
  });

  // TEMPLATES: Template library management
  const { templates, saveTemplate, deleteTemplate, duplicateTemplate, applyTemplate } = useTemplateLibrary();

  // SCROLL HIDE: Track scroll direction for auto-hiding UI with hysteresis and edge-reveal
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isUIHidden, isAutoHideEnabled, setIsAutoHideEnabled, registerInteraction } = useScrollHide({
    hideThreshold: 15,
    showThreshold: 8,
    edgeRevealZone: 40,
    scrollElement: scrollContainerRef.current,
  });

  // Wrap interaction handlers to register activity
  const handleSliderChange = (callback: () => void) => {
    registerInteraction();
    callback();
  };

  const handleTabClick = (tab: 'theme' | 'layout' | 'content' | 'behavior') => {
    registerInteraction();
    setActiveStudioTab(tab);
  };

  const handleDeviceSelect = (callback: () => void) => {
    registerInteraction();
    callback();
  };

  // TEMPLATES: Handle save template
  const handleSaveTemplate = async (name: string, description: string) => {
    setIsSavingTemplate(true);
    try {
      await saveTemplate(name, draftConfig, description);
      success('Template saved successfully');
      setShowSaveTemplateModal(false);
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // TEMPLATES: Handle apply template
  const handleApplyTemplate = (templateId: string) => {
    const config = applyTemplate(templateId);
    if (config) {
      setDraftConfig(config);
      setShowTemplateLibrary(false);
      success('Template applied');
    }
  };

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

  // EFFECTS: Initialize location/kiosk selection
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

  // HANDLERS: Mood preset selection
  const handleMoodPresetSelect = (presetKey: string, presetConfig: Partial<KioskConfig>) => {
    setCurrentMoodPreset(presetKey);
    setDraftConfig(prev => ({
      ...prev,
      ...presetConfig,
    }));
  };

  // HANDLERS: Card style changes
  const handleCardStyleChange = (cardStyle: CardStyle) => {
    setDraftConfig(prev => ({
      ...prev,
      cardStyle,
    }));
  };

  const handleResetCardStyle = () => {
    setDraftConfig(prev => ({
      ...prev,
      cardStyle: {},
    }));
  };

  const handleResetMoodPreset = () => {
    setCurrentMoodPreset('dojo-dark');
    setDraftConfig(prev => ({
      ...prev,
      cardStyle: MOOD_PRESETS['dojo-dark'].cardStyle,
      typographySystem: MOOD_PRESETS['dojo-dark'].typography,
      accentSystem: MOOD_PRESETS['dojo-dark'].accent,
    }));
  };

  // HANDLERS: Background changes
  const handleBackgroundChange = (key: string, value: any) => {
    setDraftConfig(prev => ({
      ...prev,
      backgroundIntelligence: {
        ...prev.backgroundIntelligence,
        [key]: value,
      },
    }));
  };

  // HANDLERS: Theme changes
  const handleThemeChange = (key: string, value: any) => {
    setDraftConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // HANDLERS: Save draft
  const handleSaveDraft = async () => {
    if (!selectedKiosk) return;
    setIsSaving(true);
    try {
      await trpc.kioskDevice.updateDraftConfig.mutate({
        kioskId: selectedKiosk,
        draftConfig,
      });
      setLastSavedConfig(JSON.parse(JSON.stringify(draftConfig)));
      success('Draft saved successfully');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to save draft');
      setPersistenceError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  // HANDLERS: Publish
  const handlePublish = async () => {
    if (!selectedKiosk) return;
    setIsPublishing(true);
    try {
      await trpc.kioskDevice.publishConfig.mutate({
        kioskId: selectedKiosk,
        draftConfig,
      });
      setPublishedConfig(JSON.parse(JSON.stringify(draftConfig)));
      setLastSavedConfig(JSON.parse(JSON.stringify(draftConfig)));
      success('Kiosk published successfully');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to publish');
      setPersistenceError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  // Determine preview config based on mode
  const previewConfig = previewMode === 'published' ? publishedConfig : draftConfig;

  return (
    <BottomNavLayout>
    <div className="flex flex-col h-screen bg-black" style={{backgroundColor: '#0B0D10'}}>
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{borderColor: 'rgba(255,255,255,0.06)'}}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">DojoFlow | Main Dojo · Live Preview</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowSaveTemplateModal(true)}
            variant="outline"
            size="sm"
            style={{borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)'}} className="transition-colors hover:bg-opacity-10"
          >
            <BookMarked className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button
            onClick={handleSaveDraft}
            disabled={isSaving}
            variant="outline"
            size="sm"
            style={{borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)'}} className="transition-colors hover:bg-opacity-10"
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

      {/* MAIN WORKSPACE - 2-column editor layout with independent scroll containers */}
      <div className="flex-1 flex overflow-hidden gap-6 p-6">
        {/* LEFT PANEL: Studio Controls - Independent scroll container */}
        <div className="w-80 rounded-lg p-6 flex flex-col overflow-y-auto flex-shrink-0" style={{backgroundColor: 'rgba(11, 13, 16, 0.65)', backdropFilter: 'blur(14px) saturate(120%)', border: '1px solid rgba(255,255,255,0.06)', maxHeight: 'calc(100vh - 200px)'}}>
          {/* Studio Panel Header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Kiosk Studio</h2>
            <p className="text-xs mt-1" style={{color: 'rgba(255,255,255,0.4)'}}>Design your kiosk experience</p>
          </div>

          {/* Studio Tabs Navigation */}
          <div className="flex flex-col gap-2 mb-6">
            <button
              onClick={() => handleTabClick('theme')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                activeStudioTab === 'theme'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4" />
              Theme
            </button>
            <button
              onClick={() => handleTabClick('layout')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                activeStudioTab === 'layout'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layout className="w-4 h-4" />
              Layout
            </button>
            <button
              onClick={() => handleTabClick('content')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                activeStudioTab === 'content'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Content
            </button>
            <button
              onClick={() => handleTabClick('behavior')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                activeStudioTab === 'behavior'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ZapIcon className="w-4 h-4" />
              Behavior
            </button>
          </div>

          {/* Theme Panel - Phase 1 */}
          {activeStudioTab === 'theme' && (
            <ThemeTabPhase1
              draftConfig={draftConfig}
              currentMoodPreset={currentMoodPreset}
              onMoodPresetSelect={handleMoodPresetSelect}
              onCardStyleChange={handleCardStyleChange}
              onResetCardStyle={handleResetCardStyle}
              onResetMoodPreset={handleResetMoodPreset}
              onBackgroundChange={handleBackgroundChange}
              onThemeChange={handleThemeChange}
              onSliderChange={handleSliderChange}
              onTypographyChange={(typography) => {
                setDraftConfig(prev => ({
                  ...prev,
                  typographySystem: typography,
                }));
              }}
              onButtonStyleChange={(buttonStyle) => {
                setDraftConfig(prev => ({
                  ...prev,
                  buttonStyle,
                }));
              }}
              onResetButtonStyle={() => {
                setDraftConfig(prev => ({
                  ...prev,
                  buttonStyle: DEFAULT_BUTTON_STYLE,
                }));
              }}
            />
          )}

          {/* Layout Panel */}
          {activeStudioTab === 'layout' && (
            <div className="flex-1 space-y-4">
              <p className="text-sm" style={{color: 'rgba(255,255,255,0.4)'}}>Layout controls coming next</p>
            </div>
          )}

          {/* Content Panel */}
          {activeStudioTab === 'content' && (
            <div className="flex-1 space-y-4">
              <p className="text-sm" style={{color: 'rgba(255,255,255,0.4)'}}>Kiosk content configuration</p>
            </div>
          )}

          {/* Behavior Panel */}
          {activeStudioTab === 'behavior' && (
            <div className="flex-1 space-y-4">
              <p className="text-sm" style={{color: 'rgba(255,255,255,0.4)'}}>Kiosk behavior & automation</p>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Sticky Preview Column - Independent scroll container */}
        <div className="flex-1 flex flex-col overflow-y-auto rounded-lg" style={{
          backgroundImage: 'url(/dojo-studio-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          maxHeight: 'calc(100vh - 200px)',
        }}>
          {/* Cinematic vignette overlay */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%)',
            }}
          />
          
          {/* Sticky Preview Header - Always visible at top of scroll container */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b" style={{
            background: 'rgba(18, 22, 28, 0.95)',
            backdropFilter: 'blur(8px)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}>
            <span className="text-xs font-semibold" style={{color: 'rgba(255,255,255,0.65)'}}>Preview</span>
            <button
              onClick={() => {
                const newState = !isStickyPreviewEnabled;
                setIsStickyPreviewEnabled(newState);
                localStorage.setItem('dojoFlow:stickyPreview', JSON.stringify(newState));
              }}
              className="px-2 py-1 text-xs rounded transition"
              style={{
                background: isStickyPreviewEnabled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                color: isStickyPreviewEnabled ? '#EF4444' : 'rgba(255,255,255,0.65)',
                border: `1px solid ${isStickyPreviewEnabled ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {isStickyPreviewEnabled ? 'Sticky: ON' : 'Sticky: OFF'}
            </button>
          </div>
          
          {/* Scrollable Preview Content */}
          <div className="relative z-10 flex flex-col flex-1">
            {/* Device Preview Container */}
            <div className="flex flex-col items-center justify-start pt-6 px-6 pb-6" style={{
              filter: 'drop-shadow(0 20px 60px rgba(0, 0, 0, 0.5))',
            }}>
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
