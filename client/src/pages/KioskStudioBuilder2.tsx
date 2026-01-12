import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Zap, RotateCcw, Palette, Type, Layout, FileText, Zap as Zap2, MoreVertical } from 'lucide-react';
import ConfirmationModal from '@/components/kiosk/ConfirmationModal';

interface KioskAppearance {
  background: {
    type: 'color' | 'image' | 'preset';
    color: string;
    presetKey: string | null;
    customUrl: string | null;
    blur: number;
    dim: number;
    fit: 'cover' | 'contain' | 'stretch';
  };
  typography: {
    fontFamily: string;
    titleSize: number;
    titleWeight: number;
    subtitleSize: number;
    letterSpacing: number;
    buttonFontSize: number;
  };
  layout: {
    spacing: 'compact' | 'comfortable' | 'spacious';
    alignment: 'left' | 'center' | 'right';
    maxWidth: number;
  };
  content: {
    headline: string;
    subtext: string;
    logoUrl: string | null;
    accentColor: string;
  };
  behavior: {
    showMemberLogin: boolean;
    showNewStudent: boolean;
    idleSeconds: number;
    autoReturn: boolean;
    screensaverEnabled: boolean;
    screensaverMessage: string;
    screensaverLogoUrl: string | null;
  };
}

interface KioskLocation {
  id: number;
  name: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

export default function KioskStudioBuilder2() {
  const { locationId } = useParams<{ locationId: string }>();
  const [activeTab, setActiveTab] = useState<'appearance' | 'typography' | 'layout' | 'content' | 'behavior'>('appearance');
  const [draft, setDraft] = useState<KioskAppearance | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [editorWidth, setEditorWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [isPreviewFocus, setIsPreviewFocus] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [locations, setLocations] = useState<KioskLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; locationId?: number }>({ isOpen: false });
  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_EDITOR_WIDTH = 520;
  const MIN_PREVIEW_WIDTH = 360;
  const LOCATIONS_WIDTH = 280;
  const ICON_RAIL_WIDTH = 60;
  const locId = locationId ? parseInt(locationId) : 0;

  const { data: fetchedLocations, refetch: refetchLocations } = trpc.kioskManager.getKioskLocations.useQuery();
  const { data: settingsData, isLoading } = trpc.kioskStudio.getSettings.useQuery(
    { locationId: selectedLocationId || locId || 0 },
    { enabled: !!(selectedLocationId || locId) }
  );

  useEffect(() => {
    if (settingsData?.draft) {
      setDraft(settingsData.draft);
    }
  }, [settingsData]);

  useEffect(() => {
    if (fetchedLocations) {
      setLocations(fetchedLocations as KioskLocation[]);
      if (!selectedLocationId && fetchedLocations.length > 0) {
        setSelectedLocationId(fetchedLocations[0].id);
      }
    }
  }, [fetchedLocations, selectedLocationId]);

  useEffect(() => {
    const saved = localStorage.getItem('kioskBuilder.splitRatio');
    if (saved) setEditorWidth(parseInt(saved, 10));
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    setIsResizing(true);
    document.body.style.userSelect = 'none';
    const startX = e.clientX;
    const startWidth = editorWidth;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const containerWidth = containerRef.current!.clientWidth;
      const maxEditorWidth = containerWidth - LOCATIONS_WIDTH - MIN_PREVIEW_WIDTH;
      const newWidth = Math.max(
        MIN_EDITOR_WIDTH,
        Math.min(startWidth + deltaX, maxEditorWidth)
      );
      setEditorWidth(newWidth);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = 'auto';
      localStorage.setItem('kioskBuilder.splitRatio', editorWidth.toString());
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const saveDraftMutation = trpc.kioskStudio.saveDraft.useMutation({
    onSuccess: () => toast.success('Draft saved'),
    onError: (error) => toast.error('Error', { description: error.message }),
  });

  const publishMutation = trpc.kioskStudio.publish.useMutation({
    onSuccess: (data) => {
      toast.success('Published', { description: `Version ${data.version} is now live` });
      setPreviewKey(prev => prev + 1);
    },
    onError: (error) => toast.error('Error', { description: error.message }),
  });

  const resetMutation = trpc.kioskStudio.resetToDefault.useMutation({
    onSuccess: (data) => {
      setDraft(data.appearance);
      toast.success('Reset');
    },
    onError: (error) => toast.error('Error', { description: error.message }),
  });

  const renameLocationMutation = trpc.kioskManager.renameLocation.useMutation({
    onSuccess: () => {
      refetchLocations();
      toast.success('Location renamed');
      setMenuOpen(null);
    },
    onError: (error) => toast.error('Failed to rename', { description: error.message }),
  });

  const duplicateLocationMutation = trpc.kioskManager.duplicateLocation.useMutation({
    onSuccess: (newLocation) => {
      refetchLocations();
      setSelectedLocationId(newLocation.id);
      toast.success('Location duplicated');
      setMenuOpen(null);
    },
    onError: (error) => toast.error('Failed to duplicate', { description: error.message }),
  });

  const archiveLocationMutation = trpc.kioskManager.archiveLocation.useMutation({
    onSuccess: () => {
      refetchLocations();
      if (selectedLocationId === confirmModal.locationId) {
        const nextActive = locations.find(l => l.isActive === 1 && l.id !== confirmModal.locationId);
        setSelectedLocationId(nextActive?.id || null);
      }
      toast.success('Location archived');
      setConfirmModal({ isOpen: false });
    },
    onError: (error) => {
      toast.error('Failed to archive', { description: error.message });
      setConfirmModal({ isOpen: false });
    },
  });

  const sendPreviewUpdate = (appearance: KioskAppearance) => {
    if (previewFrameRef.current?.contentWindow) {
      previewFrameRef.current.contentWindow.postMessage({ type: 'KIOSK_STUDIO_UPDATE', appearance, timestamp: Date.now() }, '*');
    }
  };

  const updateDraft = (updates: Partial<KioskAppearance>) => {
    if (!draft) return;
    const updated = { ...draft, ...updates };
    setDraft(updated);
    sendPreviewUpdate(updated);
  };

  const updateBackground = (updates: Partial<KioskAppearance['background']>) => {
    if (!draft) return;
    const updated = { ...draft, background: { ...draft.background, ...updates } };
    setDraft(updated);
    sendPreviewUpdate(updated);
  };

  const updateTypography = (updates: Partial<KioskAppearance['typography']>) => {
    if (!draft) return;
    const updated = { ...draft, typography: { ...draft.typography, ...updates } };
    setDraft(updated);
    sendPreviewUpdate(updated);
  };

  const updateLayout = (updates: Partial<KioskAppearance['layout']>) => {
    if (!draft) return;
    const updated = { ...draft, layout: { ...draft.layout, ...updates } };
    setDraft(updated);
    sendPreviewUpdate(updated);
  };

  const updateContent = (updates: Partial<KioskAppearance['content']>) => {
    if (!draft) return;
    const updated = { ...draft, content: { ...draft.content, ...updates } };
    setDraft(updated);
    sendPreviewUpdate(updated);
  };

  const updateBehavior = (updates: Partial<KioskAppearance['behavior']>) => {
    if (!draft) return;
    const updated = { ...draft, behavior: { ...draft.behavior, ...updates } };
    setDraft(updated);
    sendPreviewUpdate(updated);
  };

  const handleSaveDraft = async () => {
    if (!draft || !selectedLocationId) return;
    setIsSaving(true);
    try {
      await saveDraftMutation.mutateAsync({ locationId: selectedLocationId, appearance: draft });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draft || !selectedLocationId) return;
    setIsSaving(true);
    try {
      await saveDraftMutation.mutateAsync({ locationId: selectedLocationId, appearance: draft });
      await publishMutation.mutateAsync({ locationId: selectedLocationId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all settings to default?')) {
      resetMutation.mutate({ locationId: selectedLocationId || locId });
    }
  };

  const handleRename = (locationId: number) => {
    const location = locations.find(l => l.id === locationId);
    if (!location) return;
    const newName = prompt('New location name:', location.name);
    if (newName && newName.trim()) {
      renameLocationMutation.mutate({ locationId, name: newName.trim() });
    }
  };

  const handleDuplicate = (locationId: number) => {
    const location = locations.find(l => l.id === locationId);
    if (!location) return;
    const newName = prompt('New location name:', `${location.name} (Copy)`);
    if (newName && newName.trim()) {
      duplicateLocationMutation.mutate({ locationId, name: newName.trim() });
    }
  };

  const handleArchiveClick = (locationId: number) => {
    const activeCount = locations.filter(l => l.isActive === 1).length;
    if (activeCount === 1) {
      toast.error('Cannot archive the last location', { description: 'You must have at least one active location' });
      return;
    }
    setConfirmModal({ isOpen: true, locationId });
  };

  const handleConfirmArchive = () => {
    if (confirmModal.locationId) {
      archiveLocationMutation.mutate({ locationId: confirmModal.locationId });
    }
  };

  const filteredLocations = locations.filter(loc => {
    const isArchived = loc.isActive === 0;
    const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (showArchived || !isArchived);
  });

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (isLoading || !draft) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div ref={containerRef} className="flex h-screen bg-background overflow-hidden" style={{ userSelect: isResizing ? 'none' : 'auto', cursor: isResizing ? 'col-resize' : 'auto' }}>
      {/* Left: Locations List */}
      <div className="w-[280px] border-r border-border bg-card flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border space-y-3">
          <h2 className="text-sm font-semibold">Locations</h2>
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="w-3 h-3" />
            <span className="text-muted-foreground">Show archived</span>
          </label>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredLocations.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">{searchQuery ? 'No locations found' : 'No locations'}</div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredLocations.map((location) => (
                <div key={location.id} className="relative group">
                  <button onClick={() => setSelectedLocationId(location.id)} className={`w-full text-left p-2.5 rounded-md text-sm transition-colors ${selectedLocationId === location.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
                    <div className="font-medium truncate">{location.name}</div>
                    <div className="text-xs opacity-60 mt-0.5">{location.isActive === 1 ? '✓ Active' : '○ Archived'}</div>
                  </button>
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === location.id ? null : location.id); }} className="p-1 hover:bg-accent rounded-md">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen === location.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-popover border border-border rounded-md shadow-md z-50" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => { e.stopPropagation(); handleRename(location.id); }} className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors">Rename</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDuplicate(location.id); }} className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors">Duplicate</button>
                        <button onClick={(e) => { e.stopPropagation(); handleArchiveClick(location.id); }} className="w-full text-left px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors border-t border-border">{location.isActive === 1 ? 'Archive' : 'Restore'}</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Editor */}
      {isPreviewFocus ? (
        <div className="w-[60px] border-r border-border bg-card flex flex-col items-center justify-center overflow-hidden">
          <button
            onClick={() => setIsPreviewFocus(false)}
            className="p-2 hover:bg-accent rounded-md transition-colors mb-4"
            title="Expand Editor"
          >
            <Layout className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div style={{ width: `${editorWidth}px` }} className="border-r border-border bg-card flex flex-col overflow-hidden">
          {selectedLocation ? (
            <>
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold">{selectedLocation.name}</h2>
                <p className="text-xs text-muted-foreground mt-1">Customize appearance</p>
              </div>
              <div className="p-4 border-b border-border space-y-2">
                <div className="flex gap-2">
                  <button onClick={handleSaveDraft} disabled={isSaving} className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"><Save className="w-4 h-4 inline mr-2" />Save</button>
                  <button onClick={handlePublish} disabled={isSaving} className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"><Zap className="w-4 h-4 inline mr-2" />Publish</button>
                </div>
                <button onClick={handleReset} className="w-full px-3 py-2 text-sm bg-muted text-muted-foreground rounded-md hover:bg-muted/80"><RotateCcw className="w-4 h-4 inline mr-2" />Reset</button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="h-full">
                  <TabsList className="w-full rounded-none border-b border-border bg-background p-0 h-auto sticky top-0">
                    <TabsTrigger value="appearance" className="rounded-none text-xs"><Palette className="w-3 h-3" /></TabsTrigger>
                    <TabsTrigger value="typography" className="rounded-none text-xs"><Type className="w-3 h-3" /></TabsTrigger>
                    <TabsTrigger value="layout" className="rounded-none text-xs"><Layout className="w-3 h-3" /></TabsTrigger>
                    <TabsTrigger value="content" className="rounded-none text-xs"><FileText className="w-3 h-3" /></TabsTrigger>
                    <TabsTrigger value="behavior" className="rounded-none text-xs"><Zap2 className="w-3 h-3" /></TabsTrigger>
                  </TabsList>
                  <TabsContent value="appearance" className="p-4 space-y-4">
                    <div><Label>Background Type</Label><Select value={draft.background.type} onValueChange={(v: any) => updateBackground({ type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="color">Solid Color</SelectItem><SelectItem value="image">Image</SelectItem><SelectItem value="preset">Preset</SelectItem></SelectContent></Select></div>
                    {draft.background.type === 'color' && (<div><Label>Color</Label><div className="flex gap-2"><input type="color" value={draft.background.color} onChange={(e) => updateBackground({ color: e.target.value })} className="w-12 h-10 rounded border border-border cursor-pointer" /><Input value={draft.background.color} onChange={(e) => updateBackground({ color: e.target.value })} className="flex-1" /></div></div>)}
                    <div><Label>Accent Color</Label><div className="flex gap-2"><input type="color" value={draft.content.accentColor} onChange={(e) => updateContent({ accentColor: e.target.value })} className="w-12 h-10 rounded border border-border cursor-pointer" /><Input value={draft.content.accentColor} onChange={(e) => updateContent({ accentColor: e.target.value })} className="flex-1" /></div></div>
                    <div><Label>Blur: {draft.background.blur}px</Label><Slider value={[draft.background.blur]} onValueChange={(v) => updateBackground({ blur: v[0] })} min={0} max={20} step={1} /></div>
                    <div><Label>Dim: {draft.background.dim}%</Label><Slider value={[draft.background.dim]} onValueChange={(v) => updateBackground({ dim: v[0] })} min={0} max={100} step={5} /></div>
                  </TabsContent>
                  <TabsContent value="typography" className="p-4 space-y-4">
                    <div><Label>Font Family</Label><Select value={draft.typography.fontFamily} onValueChange={(v) => updateTypography({ fontFamily: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Inter">Inter</SelectItem><SelectItem value="Roboto">Roboto</SelectItem><SelectItem value="Poppins">Poppins</SelectItem></SelectContent></Select></div>
                    <div><Label>Title Size: {draft.typography.titleSize}px</Label><Slider value={[draft.typography.titleSize]} onValueChange={(v) => updateTypography({ titleSize: v[0] })} min={24} max={72} step={2} /></div>
                    <div><Label>Subtitle Size: {draft.typography.subtitleSize}px</Label><Slider value={[draft.typography.subtitleSize]} onValueChange={(v) => updateTypography({ subtitleSize: v[0] })} min={12} max={48} step={1} /></div>
                    <div><Label>Letter Spacing: {draft.typography.letterSpacing}px</Label><Slider value={[draft.typography.letterSpacing]} onValueChange={(v) => updateTypography({ letterSpacing: v[0] })} min={-2} max={10} step={0.5} /></div>
                  </TabsContent>
                  <TabsContent value="layout" className="p-4 space-y-4">
                    <div><Label>Spacing</Label><Select value={draft.layout.spacing} onValueChange={(v: any) => updateLayout({ spacing: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="compact">Compact</SelectItem><SelectItem value="comfortable">Comfortable</SelectItem><SelectItem value="spacious">Spacious</SelectItem></SelectContent></Select></div>
                    <div><Label>Alignment</Label><Select value={draft.layout.alignment} onValueChange={(v: any) => updateLayout({ alignment: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent></Select></div>
                    <div><Label>Max Width: {draft.layout.maxWidth}px</Label><Slider value={[draft.layout.maxWidth]} onValueChange={(v) => updateLayout({ maxWidth: v[0] })} min={300} max={1200} step={50} /></div>
                  </TabsContent>
                  <TabsContent value="content" className="p-4 space-y-4">
                    <div><Label>Headline</Label><Input value={draft.content.headline} onChange={(e) => updateContent({ headline: e.target.value })} placeholder="Welcome to Training" /></div>
                    <div><Label>Subtext</Label><Input value={draft.content.subtext} onChange={(e) => updateContent({ subtext: e.target.value })} placeholder="Sign in or get started below" /></div>
                    <div><Label>Logo URL (optional)</Label><Input value={draft.content.logoUrl || ''} onChange={(e) => updateContent({ logoUrl: e.target.value || null })} placeholder="https://..." /></div>
                  </TabsContent>
                  <TabsContent value="behavior" className="p-4 space-y-4">
                    <div className="flex items-center justify-between"><Label>Show Member Login</Label><Switch checked={draft.behavior.showMemberLogin} onCheckedChange={(v) => updateBehavior({ showMemberLogin: v })} /></div>
                    <div className="flex items-center justify-between"><Label>Show New Student</Label><Switch checked={draft.behavior.showNewStudent} onCheckedChange={(v) => updateBehavior({ showNewStudent: v })} /></div>
                    <div className="flex items-center justify-between"><Label>Auto Return</Label><Switch checked={draft.behavior.autoReturn} onCheckedChange={(v) => updateBehavior({ autoReturn: v })} /></div>
                    <div><Label>Idle Timeout: {draft.behavior.idleSeconds}s</Label><Slider value={[draft.behavior.idleSeconds]} onValueChange={(v) => updateBehavior({ idleSeconds: v[0] })} min={10} max={600} step={10} /></div>
                    <div className="flex items-center justify-between"><Label>Enable Screensaver</Label><Switch checked={draft.behavior.screensaverEnabled} onCheckedChange={(v) => updateBehavior({ screensaverEnabled: v })} /></div>
                    <div><Label>Screensaver Message</Label><Input value={draft.behavior.screensaverMessage} onChange={(e) => updateBehavior({ screensaverMessage: e.target.value })} placeholder="Tap to continue" /></div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">Select a location</div>
          )}
        </div>
      )}

      {/* Divider */}
      {!isPreviewFocus && (
        <div
          onPointerDown={handlePointerDown}
          className="w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors active:bg-primary flex-shrink-0"
          style={{ userSelect: 'none' }}
          role="separator"
          aria-label="Resize editor and preview"
        />
      )}

      {/* Right: Preview */}
      <div className="flex-1 bg-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <h3 className="font-semibold">Live Preview</h3>
          <button
            onClick={() => setIsPreviewFocus(!isPreviewFocus)}
            className="px-3 py-1.5 text-sm bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
            title={isPreviewFocus ? 'Show Editor' : 'Collapse Editor'}
          >
            {isPreviewFocus ? 'Show Editor' : 'Focus Preview'}
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
          {selectedLocation ? (
            <iframe ref={previewFrameRef} src={`/kiosk/${selectedLocation.id}?studioPreview=1&v=${settingsData?.version || 1}&ts=${previewKey}`} className="w-full h-full border-none" title="Kiosk Preview" />
          ) : (
            <div className="text-center text-muted-foreground"><p>Select a location to preview</p></div>
          )}
        </div>
      </div>

      <ConfirmationModal isOpen={confirmModal.isOpen} title="Archive Location" message={`Are you sure you want to archive "${locations.find(l => l.id === confirmModal.locationId)?.name}"? This will disable its kiosk route.`} confirmText="Archive" cancelText="Cancel" isDangerous={true} onConfirm={handleConfirmArchive} onCancel={() => setConfirmModal({ isOpen: false })} />
    </div>
  );
}
