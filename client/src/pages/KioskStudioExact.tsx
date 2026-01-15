'use client';

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Zap, BookMarked, Monitor, Smartphone, RotateCcw } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { KioskConfig, DEFAULT_KIOSK_CONFIG } from '../../../shared/kioskConfig';
import KioskPreviewLive from '@/components/kiosk/KioskPreviewLive';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { DeviceEmulator } from '@/components/DeviceEmulator';
import { KioskPreviewRenderer } from '@/components/KioskPreviewRenderer';
import { normalizeKioskConfig } from '@/lib/defaultKioskConfig';
import { ThemeTabWithPresets } from '@/components/ThemeTabWithPresets';
import { useThemePreset } from '@/hooks/useThemePreset';
import { validateKioskConfig } from '@/lib/themePresetValidator';
import type { ButtonStyleConfig } from '../../../shared/buttonStyleConfig';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_BUTTON_STYLE } from '../../../shared/buttonStyleConfig';
import { SaveTemplateModal } from '@/components/SaveTemplateModal';
import { TemplateLibrary } from '@/components/TemplateLibrary';
import { useTemplateLibrary } from '@/hooks/useTemplateLibrary';
import { getDeviceProfile, getAllDeviceProfiles, DeviceProfileType } from '@/lib/deviceProfiles';
import { LogoUploadSection } from '@/components/LogoUploadSection';
import { EditableContentSection } from '@/components/EditableContentSection';
import { getKioskConfig, type KioskConfig as KioskConfigType } from '@/lib/kioskConfigProvider';
import { DeployTab } from '@/components/DeployTab';
import { EnvironmentEffectsPanel, type EnvironmentEffects } from '@/components/EnvironmentEffectsPanel';
import DojoFlowLayout from '@/components/DojoFlowLayout';

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
 * KioskStudioExact - Canvas-first deployment studio
 * 
 * Layout:
 * - Top: Slim command bar (Location, Device, Mode, Publish, Ask Kai)
 * - Left: Studio tools (scrollable) - Theme, Layout, Content, Behavior, Deployment
 * - Center: Large, fixed kiosk device frame (iPad/wall kiosk/front desk)
 * - Background: Dark, neutral, clean
 * 
 * The kiosk is the hero. It never moves. Only left panel scrolls.
 */
function KioskStudioExactContent() {
  const queryClient = useQueryClient();
  const { toasts, success, error, removeToast } = useToast();
  const navigate = useNavigate();

  // STATE
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedKiosk, setSelectedKiosk] = useState<number | null>(null);
  const [draftConfig, setDraftConfig] = useState<KioskConfig>(JSON.parse(JSON.stringify(DEFAULT_KIOSK_CONFIG)));
  const [lastSavedConfig, setLastSavedConfig] = useState<KioskConfig>(JSON.parse(JSON.stringify(DEFAULT_KIOSK_CONFIG)));
  const [publishedConfig, setPublishedConfig] = useState<KioskConfig>(JSON.parse(JSON.stringify(DEFAULT_KIOSK_CONFIG)));
  const [previewMode, setPreviewMode] = useState<'draft' | 'published'>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<'theme' | 'layout' | 'content' | 'behavior' | 'deployment'>('theme');
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [currentMoodPreset, setCurrentMoodPreset] = useState<string>('dojo-dark');
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('martial-arts-dojo');
  const [deviceMode, setDeviceMode] = useState<DeviceProfileType>('wall-kiosk');
  const currentDeviceProfile = getDeviceProfile(deviceMode);
  const [isLiveMode, setIsLiveMode] = useState(true);

  // Handle environment selection and update draftConfig
  const handleEnvironmentSelect = (envId: string, imageUrl: string) => {
    setSelectedEnvironmentId(envId);
    setDraftConfig(prev => ({
      ...prev,
      environmentId: envId,
      backgroundImage: imageUrl,
      environmentEffects: environmentEffects,
    }));
    console.log(`[KioskStudioExact] Environment selected: ${envId}, image: ${imageUrl}`);
  };

  // Handle environment effects changes
  const handleEnvironmentEffectsChange = (effects: EnvironmentEffects) => {
    setEnvironmentEffects(effects);
    setDraftConfig(prev => ({
      ...prev,
      environmentEffects: effects,
    }));
  };
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [kioskConfig, setKioskConfig] = useState<KioskConfigType | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);
  const [contentData, setContentData] = useState({ headline: 'Welcome', subheadline: 'Tap the screen to begin', helper: '', footer: '' });
  const [publishedVersion, setPublishedVersion] = useState<number>(0);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [environmentEffects, setEnvironmentEffects] = useState<EnvironmentEffects>({
    blur: 0,
    glow: 0,
    opacity: 65,
    saturation: 0,
    shadow: 0,
    border: 0,
  });

  // TEMPLATES
  const { templates, saveTemplate, deleteTemplate, duplicateTemplate, applyTemplate } = useTemplateLibrary();

  // THEME PRESET MANAGEMENT
  const themePreset = useThemePreset({
    locationId: selectedLocation || 1,
    deviceType: deviceMode,
    defaultPresetKey: 'dojo-dark',
    onThemeChange: (themeValues) => {
      setDraftConfig(prev => ({
        ...prev,
        ...themeValues,
      }));
    },
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

  // Fallback initialization
  useEffect(() => {
    if (!selectedLocation) setSelectedLocation(1);
    if (!selectedKiosk) setSelectedKiosk(1);
  }, []);

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

  // Reset to starter layout
  const handleReset = () => {
    const confirmed = window.confirm('Reset kiosk to starter layout? This cannot be undone.');
    if (confirmed) {
      setDraftConfig(JSON.parse(JSON.stringify(DEFAULT_KIOSK_CONFIG)));
      setCurrentMoodPreset('dojo-dark');
      success('Kiosk reset to starter layout');
    }
  };

  // Publish (Option A: Local publish with localStorage)
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const { publishKiosk } = await import("@/lib/publishHandler");
      
      const locationId = selectedLocation || "Main Dojo";
      const deviceType = currentDeviceProfile?.id || "wall_kiosk";
      
      const published = publishKiosk(locationId, deviceType, draftConfig);
      
      setPublishedConfig(published.config);
      setPublishedVersion(published.version);
      setPublishedAt(published.publishedAt);
      
      success(`Kiosk published successfully (v${published.version})`);
      queryClient.invalidateQueries({ queryKey: ["kiosk.getKiosk"] });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      
      console.error("[Publish Error]", {
        error: errorMessage,
        locationId: selectedLocation,
        deviceType: currentDeviceProfile?.id,
        configExists: !!draftConfig,
        stack: err instanceof Error ? err.stack : undefined,
      });
      
      error(`Failed to publish kiosk: ${errorMessage}`);
      setPersistenceError(`Failed to publish kiosk: ${errorMessage}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const currentConfig = previewMode === 'draft' ? draftConfig : publishedConfig;

  return (
    <div className="flex flex-col h-full" style={{backgroundColor: '#0B0D10'}}>
      {/* TOP COMMAND BAR - Slim, minimal, professional */}
      <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0" style={{
        background: 'rgba(18, 22, 28, 0.95)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}>
        {/* Left: Location + Device */}
        <div className="flex items-center gap-4">
          <Select value={selectedLocation?.toString() || ''} onValueChange={(val) => setSelectedLocation(parseInt(val))}>
            <SelectTrigger className="w-32 h-8 text-xs" style={{
              background: 'rgba(22, 27, 34, 0.8)',
              borderColor: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.92)',
            }}>
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent style={{background: 'rgba(22, 27, 34, 0.95)', borderColor: 'rgba(255,255,255,0.08)'}}>
              {locationsQuery.data?.locations?.map(loc => (
                <SelectItem key={loc.id} value={loc.id.toString()} style={{color: 'rgba(255,255,255,0.92)'}}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={deviceMode} onValueChange={(val: any) => setDeviceMode(val as DeviceProfileType)}>
            <SelectTrigger className="w-32 h-8 text-xs" style={{
              background: 'rgba(22, 27, 34, 0.8)',
              borderColor: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.92)',
            }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{background: 'rgba(22, 27, 34, 0.95)', borderColor: 'rgba(255,255,255,0.08)'}}>
              {getAllDeviceProfiles().map(profile => (
                <SelectItem key={profile.id} value={profile.id} style={{color: 'rgba(255,255,255,0.92)'}}>
                  {profile.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Center: Mode toggle */}
        <div className="flex items-center gap-2">
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

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveDraft}
            disabled={isSaving}
            size="sm"
            variant="outline"
            style={{borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)'}}
            className="text-xs"
          >
            <Save className="w-3 h-3 mr-1" />
            Save
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
            <BookMarked className="w-3 h-3" />
          </Button>
          <Button
            onClick={handleReset}
            size="sm"
            variant="outline"
            style={{borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)'}}
            className="text-xs"
            title="Reset to Starter Kiosk"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {persistenceError && (
        <div className="px-6 py-2 bg-red-950/50 border-b border-red-900/50 text-red-300 text-xs">
          {persistenceError}
        </div>
      )}

      {/* MAIN WORKSPACE - Canvas-first layout */}
      <div className="flex-1 flex overflow-hidden gap-0">
        {/* LEFT PANEL: Studio Tools - Scrollable */}
        <div className="w-80 border-r overflow-y-auto flex-shrink-0 p-6" style={{
          backgroundColor: 'rgba(11, 13, 16, 0.5)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}>
          {/* Panel Header */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-white">Studio</h2>
            <p className="text-xs mt-1" style={{color: 'rgba(255,255,255,0.4)'}}>Configure your kiosk</p>
          </div>

          {/* Studio Tabs */}
          <Tabs value={activeStudioTab} onValueChange={(val: any) => setActiveStudioTab(val)} className="flex flex-col">
            <TabsList className="grid w-full grid-cols-5 mb-4" style={{
              background: 'rgba(22, 27, 34, 0.4)',
              borderColor: 'rgba(255,255,255,0.08)',
            }}>
              <TabsTrigger value="theme" className="text-xs">Theme</TabsTrigger>
              <TabsTrigger value="layout" className="text-xs">Layout</TabsTrigger>
              <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
              <TabsTrigger value="behavior" className="text-xs">Behavior</TabsTrigger>
              <TabsTrigger value="deployment" className="text-xs">Deploy</TabsTrigger>
            </TabsList>

            {/* THEME TAB */}
            <TabsContent value="theme" className="space-y-4">
              {draftConfig && (
                <ThemeTabWithPresets
                  draftConfig={draftConfig}
                  locationId={selectedLocation || 1}
                  deviceType={deviceMode}
                  onConfigChange={(config) => {
                    setDraftConfig(prev => ({ ...prev, ...config }));
                  }}
                  onCardStyleChange={(cardStyle) => {
                    setDraftConfig(prev => ({ ...prev, cardStyle }));
                    themePreset.markCustom();
                  }}
                  onBackgroundChange={(key, value) => {
                    setDraftConfig(prev => ({
                      ...prev,
                      backgroundIntelligence: { ...prev.backgroundIntelligence, [key]: value },
                    }));
                    themePreset.markCustom();
                  }}
                  onThemeChange={(key, value) => {
                    setDraftConfig(prev => ({
                      ...prev,
                      [key]: value,
                    }));
                    themePreset.markCustom();
                  }}
                  onSliderChange={() => {}}
                  onTypographyChange={(typography) => {
                    setDraftConfig(prev => ({ ...prev, typographySystem: typography }));
                    themePreset.markCustom();
                  }}
                  onButtonStyleChange={(buttonStyle) => {
                    setDraftConfig(prev => ({ ...prev, buttonStyle }));
                    themePreset.markCustom();
                  }}
                />
              )}
            </TabsContent>

            {/* LAYOUT TAB */}
            <TabsContent value="layout" className="space-y-4">
              <p className="text-xs" style={{color: 'rgba(255,255,255,0.5)'}}>Layout controls coming soon</p>
            </TabsContent>

            {/* CONTENT TAB */}
            <TabsContent value="content" className="space-y-4">
              <LogoUploadSection
                locationId={selectedLocation?.toString() || '1'}
                deviceType={deviceMode}
                logoDataUrl={logoDataUrl}
                onLogoChange={setLogoDataUrl}
              />
              <EditableContentSection
                locationId={selectedLocation?.toString() || '1'}
                deviceType={deviceMode}
                content={contentData}
                onContentChange={setContentData}
              />
            </TabsContent>

            {/* BEHAVIOR TAB */}
            <TabsContent value="behavior" className="space-y-4">
              <p className="text-xs" style={{color: 'rgba(255,255,255,0.5)'}}>Behavior controls coming soon</p>
            </TabsContent>

            {/* DEPLOYMENT TAB */}
            <TabsContent value="deployment" className="space-y-4">
              <DeployTab
                locationId={selectedLocation?.id || 'default'}
                deviceType={currentDeviceProfile?.type || 'wall-kiosk'}
                currentConfig={{
                  logoDataUrl: logoDataUrl,
                  contentData: contentData,
                  theme: draftConfig?.theme,
                  layout: draftConfig?.layout,
                  behavior: draftConfig?.behavior,
                }}
                onVersionDeployed={(version) => {
                  console.log('Version deployed:', version);
                  toast.success(`Version "${version.name}" deployed successfully!`);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* CENTER: Kiosk Canvas - Fixed, never scrolls */}
        <div className="flex-1 flex items-center justify-center overflow-hidden relative" style={{
          backgroundColor: '#0B0D10',
        }}>
          {/* Kiosk Device Frame Container */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Outer glow/shadow */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '24px',
              background: 'radial-gradient(ellipse at 30% 30%, rgba(239, 68, 68, 0.08) 0%, transparent 60%)',
              filter: 'blur(60px)',
              transform: 'scale(1.15)',
              pointerEvents: 'none',
            }} />

            {/* Device Frame - Physical, mounted appearance */}
            <div style={{
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(25, 25, 30, 0.95) 0%, rgba(15, 15, 20, 0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 40px rgba(239, 68, 68, 0.1)',
              width: deviceMode === 'ipad' ? '640px' : deviceMode === 'wall-kiosk' ? '920px' : '480px',
              height: deviceMode === 'ipad' ? '860px' : deviceMode === 'wall-kiosk' ? '640px' : '800px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Device Bezel/Notch */}
              {deviceMode === 'ipad' && (
                <div style={{
                  width: '128px',
                  height: '24px',
                  borderBottomLeftRadius: '24px',
                  borderBottomRightRadius: '24px',
                  margin: '0 auto',
                  background: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }} />
              )}

              {/* Kiosk Screen Content */}
              <div style={{
                flex: 1,
                width: '100%',
                overflow: 'hidden',
                background: 'rgba(15, 15, 20, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {selectedLocation && selectedKiosk ? (
                  <DeviceEmulator
                    orgId={selectedLocation}
                    locationId={selectedLocation}
                    kioskId={selectedKiosk}
                  >
                    <KioskPreviewRenderer
                      config={currentConfig || normalizeKioskConfig(null)}
                      isLiveMode={isLiveMode}
                      logoDataUrl={logoDataUrl}
                      contentData={contentData}
                      kioskConfig={draftConfig}
                    />
                  </DeviceEmulator>
                ) : (
                  <div style={{
                    color: 'rgba(239, 68, 68, 0.6)',
                    fontSize: '12px',
                    textAlign: 'center',
                  }}>
                    <p>Loading kiosk...</p>
                    <p style={{fontSize: '10px', marginTop: '8px', color: 'rgba(255,255,255,0.3)'}}>Location: {selectedLocation}, Kiosk: {selectedKiosk}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Stand (for wall kiosk) */}
            {deviceMode === 'wall-kiosk' && (
              <div style={{
                position: 'absolute',
                bottom: '-40px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '384px',
                height: '32px',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                background: 'linear-gradient(180deg, rgba(25, 25, 30, 0.95) 0%, rgba(15, 15, 20, 0.98) 100%)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)',
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
            try {
              await saveTemplate(name, description, draftConfig);
              success('Template saved successfully');
              setShowSaveTemplateModal(false);
            } catch (err) {
              error('Failed to save template');
            }
          }}
          isSaving={false}
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

export default function KioskStudioExact() {
  return (
    <DojoFlowLayout>
      <KioskStudioExactContent />
    </DojoFlowLayout>
  );
}
