import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Save, Zap, Code, Plus, MoreVertical, Trash2, Copy, Edit2, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { KioskTypographyControls } from '@/components/KioskTypographyControls';
import { KioskBackgroundControls } from '@/components/KioskBackgroundControls';
import { KioskConfig, DEFAULT_KIOSK_CONFIG } from '../../../shared/kioskConfig';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import KioskPreviewLive from '@/components/kiosk/KioskPreviewLive';

interface Kiosk {
  id: number;
  name: string;
  slug: string;
  isActive: number;
  config: KioskConfig | null;
  createdAt: string;
  updatedAt: string;
}

export default function KioskStudio() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'design' | 'content' | 'behavior' | 'screensaver'>('design');
  const [draftConfig, setDraftConfig] = useState<KioskConfig>(DEFAULT_KIOSK_CONFIG);
  const [lastSavedConfig, setLastSavedConfig] = useState<KioskConfig>(DEFAULT_KIOSK_CONFIG);
  const [publishedConfig, setPublishedConfig] = useState<KioskConfig>(DEFAULT_KIOSK_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedKiosk, setSelectedKiosk] = useState<number | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [renameKioskId, setRenameKioskId] = useState<number | null>(null);
  const [newKioskName, setNewKioskName] = useState('');
  const [showAddKiosk, setShowAddKiosk] = useState(false);
  const [newKioskNameInput, setNewKioskNameInput] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewMode, setPreviewMode] = useState<'draft' | 'published'>('draft');

  // Fetch locations
  const { data: locationsData } = trpc.kiosk.listLocations.useQuery(undefined, { enabled: true })

  // Fetch kiosks for selected location
  const { data: kiosksData, refetch: refetchKiosks } = trpc.kioskDevice.listByLocation.useQuery(
    { locationId: selectedLocation! },
    { enabled: !!selectedLocation }
  );

  // Fetch current kiosk settings
  const { data: settingsData, isLoading: settingsLoading } = trpc.kioskSettings.getSettings.useQuery(
    selectedLocation ? { locationSlug: selectedLocation.toString() } : undefined,
    { enabled: !!selectedLocation }
  );

  // Initialize mutations
  const saveDraftMutation = trpc.kioskDevice.saveDraft.useMutation();
  const publishMutation = trpc.kioskDevice.publish.useMutation();
  const createKioskMutation = trpc.kioskDevice.create.useMutation();
  const updateKioskMutation = trpc.kioskDevice.update.useMutation();
  const deleteKioskMutation = trpc.kioskDevice.delete.useMutation();
  const duplicateKioskMutation = trpc.kioskDevice.duplicate.useMutation();
  const getKioskQuery = trpc.kioskDevice.getById.useQuery(
    { kioskId: selectedKiosk! },
    { enabled: !!selectedKiosk }
  );

  // Load kiosk data when selected
  useEffect(() => {
    if (getKioskQuery.data) {
      const kiosk = getKioskQuery.data;
      if (kiosk.draftConfig) {
        setDraftConfig(kiosk.draftConfig);
        setLastSavedConfig(kiosk.draftConfig);
      }
      if (kiosk.publishedConfig) {
        setPublishedConfig(kiosk.publishedConfig);
      }
    }
  }, [getKioskQuery.data]);

  // Auto-select first kiosk when kiosks list loads
  useEffect(() => {
    if (kiosksData && kiosksData.length > 0 && !selectedKiosk) {
      setSelectedKiosk(kiosksData[0].id);
    }
  }, [kiosksData, selectedKiosk]);

  // Set default location on mount
  useEffect(() => {
    if (!locationsData || !Array.isArray(locationsData)) return;
    
    if (locationId) {
      const loc = locationsData.find(l => l.id === parseInt(locationId));
      if (loc) {
        setSelectedLocation(loc.id);
      }
    } else if (locationsData.length > 0) {
      const firstWithKiosk = locationsData.find(l => l.kioskEnabled === 1);
      if (firstWithKiosk) {
        setSelectedLocation(firstWithKiosk.id);
      }
    }
  }, [locationId, locationsData]);

  // Auto-select first kiosk when kiosks list loads
  useEffect(() => {
    if (kiosksData && kiosksData.length > 0 && !selectedKiosk) {
      setSelectedKiosk(kiosksData[0].id);
    }
  }, [kiosksData, selectedKiosk]);


  // Preview config selection
  const getPreviewConfig = (): KioskConfig => {
    if (previewMode === 'published' && publishedConfig) {
      return publishedConfig;
    }
    return draftConfig;
  };
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
            ...(draftConfig.content[section as any] as any),
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

  // Behavior updates
  const handleBehaviorChange = (key: string, value: any) => updateConfig('behavior', key, value);

  // Screensaver updates
  const handleScreensaverChange = (key: string, value: any) => updateConfig('screensaver', key, value);

  const handleSaveDraft = async () => {
    if (!selectedKiosk) return;
    setIsSaving(true);
    try {
      // Ensure we have a valid config
      const safeConfig = draftConfig ?? DEFAULT_KIOSK_CONFIG;
      console.log('[KioskStudio] Saving draft with config:', safeConfig);
      await saveDraftMutation.mutateAsync({
        kioskId: selectedKiosk,
        config: safeConfig,
      });
      setLastSavedConfig(draftConfig);
      setSaveMessage({ type: 'success', text: '✓ Draft saved' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: '✗ Failed to save draft' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedKiosk) return;
    setIsSaving(true);
    try {
      // Ensure we have a valid config
      const safeConfig = draftConfig ?? DEFAULT_KIOSK_CONFIG;
      console.log('[KioskStudio] Publishing with config:', safeConfig);
      await publishMutation.mutateAsync({
        kioskId: selectedKiosk,
        config: safeConfig,
      });
      setPublishedConfig(draftConfig);
      setSaveMessage({ type: 'success', text: '✓ Published successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('[KioskStudio] Publish error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setSaveMessage({ type: 'error', text: `✗ Failed to publish: ${errorMsg}` });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateKiosk = async (useDefaultName: boolean = false) => {
    if (!selectedLocation) {
      setCreateError('Please select a location first.');
      return;
    }

    let kioskName = useDefaultName ? 'Front Desk iPad' : newKioskNameInput.trim();
    
    if (!kioskName) {
      setCreateError('Kiosk name is required.');
      return;
    }

    // If not using default name and we have existing kiosks, auto-increment the name
    if (!useDefaultName && kiosksForLocation && kiosksForLocation.length > 0) {
      const count = kiosksForLocation.length + 1;
      kioskName = `Kiosk ${count}`;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const newKiosk = await createKioskMutation.mutateAsync({
        locationId: selectedLocation,
        name: kioskName,
        config: DEFAULT_KIOSK_CONFIG,
      });
      
      setNewKioskNameInput('');
      setShowAddKiosk(false);
      
      // Invalidate and refetch kiosks query
      await queryClient.invalidateQueries({
        queryKey: ['kioskDevice.listByLocation', { locationId: selectedLocation }],
      });
      await refetchKiosks();
      setSelectedKiosk(newKiosk.id);
      
      // Show success toast
      setSaveMessage({ type: 'success', text: `✓ Kiosk "${kioskName}" created` });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create kiosk';
      console.error('[KioskStudio] Create error:', { locationId: selectedLocation, orgId: 'ctx.organizationId', error });
      setCreateError(errorMsg);
      setSaveMessage({ type: 'error', text: `✗ ${errorMsg}` });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKiosk = async (kioskId: number) => {
    try {
      await deleteKioskMutation.mutateAsync({ kioskId });
      setShowDeleteConfirm(null);
      if (selectedKiosk === kioskId) {
        setSelectedKiosk(null);
      }
      // Invalidate and refetch kiosks query
      await queryClient.invalidateQueries({
        queryKey: ['kioskDevice.listByLocation', { locationId: selectedLocation }],
      });
      await refetchKiosks();
    } catch (error) {
      console.error('Failed to delete kiosk:', error);
    }
  };

  const handleDuplicateKiosk = async (kioskId: number) => {
    try {
      await duplicateKioskMutation.mutateAsync({ kioskId });
      // Invalidate and refetch kiosks query
      await queryClient.invalidateQueries({
        queryKey: ['kioskDevice.listByLocation', { locationId: selectedLocation }],
      });
      await refetchKiosks();
    } catch (error) {
      console.error('Failed to duplicate kiosk:', error);
    }
  };

  const handleRenameKiosk = async (kioskId: number) => {
    if (!newKioskName.trim()) return;
    try {
      await updateKioskMutation.mutateAsync({
        kioskId,
        patch: { name: newKioskName },
      });
      setRenameKioskId(null);
      setNewKioskName('');
      // Invalidate and refetch kiosks query
      await queryClient.invalidateQueries({
        queryKey: ['kioskDevice.listByLocation', { locationId: selectedLocation }],
      });
      await refetchKiosks();
    } catch (error) {
      console.error('Failed to rename kiosk:', error);
    }
  };

  const selectedLocationData = locationsData?.find(l => l.id === selectedLocation);
  const kiosksForLocation = kiosksData || [];
  const hasNoKiosks = kiosksForLocation.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
        <h1 className="text-2xl font-bold">Kiosk Studio</h1>
        <div className="flex gap-2">
          {saveMessage && (
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
              saveMessage.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
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
            disabled={isSaving || hasNoKiosks}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 inline mr-2" />
            Save Draft
          </button>
          <button
            onClick={handlePublish}
            disabled={isSaving || hasNoKiosks}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Publish
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Controls */}
        <div className="w-96 border-r border-slate-800 overflow-y-auto bg-slate-900/30 border-4 border-red-500 relative z-50 pointer-events-auto">
          {/* Location Selector */}
          <div className="p-6 border-b border-slate-800">
            <label className="block text-sm font-medium mb-2">Location</label>
            <select
              value={selectedLocation || ''}
              onChange={(e) => {
                setSelectedLocation(parseInt(e.target.value));
                setSelectedKiosk(null);
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
            >
              <option value="">Select a location...</option>
              {locationsData?.filter(l => l.kioskEnabled).map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Kiosk List */}
          {selectedLocation && (
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium">Kiosks</label>
                <button
                  onClick={() => {
                    if (!selectedLocation) {
                      setCreateError('Please select a location first.');
                      return;
                    }
                    setShowAddKiosk(true);
                    setCreateError(null);
                  }}
                  disabled={!selectedLocation || isCreating}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>

              {hasNoKiosks ? (
                <div className="text-center py-8">
                  {!selectedLocation ? (
                    <>
                      <p className="text-sm text-slate-400 mb-4">Select a location to create kiosks</p>
                      <button
                        disabled
                        className="w-full px-4 py-2 bg-slate-700 rounded-lg text-sm font-medium transition-colors opacity-50 cursor-not-allowed"
                      >
                        Create First Kiosk
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-400 mb-4">No kiosks yet. Create one to get started.</p>
                      <button
                        onClick={() => handleCreateKiosk(true)}
                        disabled={isCreating}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isCreating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {isCreating ? 'Creating...' : 'Create First Kiosk'}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {kiosksForLocation.map((kiosk) => (
                    <div
                      key={kiosk.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedKiosk === kiosk.id
                          ? 'bg-red-600/20 border-red-500'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                      }`}
                      onClick={() => setSelectedKiosk(kiosk.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {renameKioskId === kiosk.id ? (
                            <input
                              type="text"
                              value={newKioskName}
                              onChange={(e) => setNewKioskName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameKiosk(kiosk.id);
                                if (e.key === 'Escape') setRenameKioskId(null);
                              }}
                              onBlur={() => setRenameKioskId(null)}
                              className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm"
                              autoFocus
                            />
                          ) : (
                            <p className="text-sm font-medium">{kiosk.name}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">{kiosk.slug}</p>
                        </div>
                        <div className="relative group">
                          <button className="p-1 hover:bg-slate-700 rounded">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                              onClick={() => {
                                setRenameKioskId(kiosk.id);
                                setNewKioskName(kiosk.name);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Edit2 className="w-3 h-3" />
                              Rename
                            </button>
                            <button
                              onClick={() => handleDuplicateKiosk(kiosk.id)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Copy className="w-3 h-3" />
                              Duplicate
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(kiosk.id)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700 text-red-400 flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Kiosk Form */}
              {showAddKiosk && (
                <div className="mt-4 p-3 bg-slate-800 border border-slate-700 rounded-lg">
                  <input
                    type="text"
                    placeholder="Kiosk name (e.g., Front Desk iPad)"
                    value={newKioskNameInput}
                    onChange={(e) => {
                      setNewKioskNameInput(e.target.value);
                      setCreateError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateKiosk(false);
                      if (e.key === 'Escape') setShowAddKiosk(false);
                    }}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm mb-2"
                    autoFocus
                    disabled={isCreating}
                  />
                  {createError && (
                    <div className="px-3 py-2 mb-2 bg-red-900/30 border border-red-700/50 rounded text-xs text-red-300">
                      {createError}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCreateKiosk(false)}
                      disabled={isCreating}
                      className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      {isCreating && <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin" />}
                      {isCreating ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddKiosk(false);
                        setCreateError(null);
                      }}
                      disabled={isCreating}
                      className="flex-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-sm">
                    <h3 className="text-lg font-bold mb-4">Delete Kiosk?</h3>
                    <p className="text-sm text-slate-400 mb-6">
                      Type <strong>DELETE</strong> to confirm deletion of this kiosk.
                    </p>
                    <input
                      type="text"
                      placeholder="Type DELETE to confirm"
                      id="delete-confirm-input"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm mb-4"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const input = document.getElementById('delete-confirm-input') as HTMLInputElement;
                          if (input.value === 'DELETE') {
                            handleDeleteKiosk(showDeleteConfirm);
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Navigation */}
          {!hasNoKiosks && (
            <>
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
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                        />
                      </div>
                    </div>

                    {/* Background */}
                    <KioskBackgroundControls
                      background={draftConfig.background}
                      onChange={(key, value) => {
                        const updated = {
                          ...draftConfig,
                          background: {
                            ...draftConfig.background,
                            [key]: value,
                          },
                        };
                        setDraftConfig(updated);
                        sendPreviewUpdate(updated);
                      }}
                    />

                    {/* Typography */}
                    <KioskTypographyControls
                      typography={draftConfig.typography}
                      onChange={(key, value) => {
                        const updated = {
                          ...draftConfig,
                          typography: {
                            ...draftConfig.typography,
                            [key]: value,
                          },
                        };
                        setDraftConfig(updated);
                        sendPreviewUpdate(updated);
                      }}
                    />
                  </div>
                )}

                {activeTab === 'content' && (
                  <div className="space-y-6">
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
                      <textarea
                        value={draftConfig.content.subtext}
                        onChange={(e) => handleContentChange('subtext', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'behavior' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show Member Login</label>
                      <input
                        type="checkbox"
                        checked={draftConfig.behavior.showMemberLogin}
                        onChange={(e) => handleBehaviorChange('showMemberLogin', e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show New Student</label>
                      <input
                        type="checkbox"
                        checked={draftConfig.behavior.showNewStudent}
                        onChange={(e) => handleBehaviorChange('showNewStudent', e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Idle Timeout (seconds)</label>
                      <input
                        type="number"
                        min="10"
                        max="600"
                        value={draftConfig.behavior.idleSeconds}
                        onChange={(e) => handleBehaviorChange('idleSeconds', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'screensaver' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Enable Screensaver</label>
                      <input
                        type="checkbox"
                        checked={draftConfig.screensaver.enabled}
                        onChange={(e) => handleScreensaverChange('enabled', e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Idle Timeout (seconds)</label>
                      <input
                        type="number"
                        min="10"
                        max="300"
                        value={draftConfig.screensaver.idleSeconds}
                        onChange={(e) => handleScreensaverChange('idleSeconds', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show Logo</label>
                      <input
                        type="checkbox"
                        checked={draftConfig.screensaver.showLogo}
                        onChange={(e) => handleScreensaverChange('showLogo', e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <input
                        type="text"
                        value={draftConfig.screensaver.message}
                        onChange={(e) => handleScreensaverChange('message', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 bg-slate-950 flex flex-col">
          {!hasNoKiosks && (
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/50">
              <h3 className="font-semibold text-white">Live Preview</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode('draft')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    previewMode === 'draft'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Draft
                </button>
                <button
                  onClick={() => setPreviewMode('published')}
                  disabled={!publishedConfig}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    previewMode === 'published'
                      ? 'bg-green-600 text-white'
                      : publishedConfig
                      ? 'bg-slate-800 text-slate-400 hover:text-white'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  Published
                </button>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            {hasNoKiosks ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">No Kiosks Yet</h2>
                  <p className="text-slate-400 mb-6">Create your first kiosk to start designing</p>
                </div>
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
