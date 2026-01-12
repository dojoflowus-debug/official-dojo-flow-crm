import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Zap, RotateCcw, Palette, Type, Layout, FileText, Zap as Zap2, MoreVertical, Plus } from 'lucide-react';
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

interface Location {
  id: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

interface Kiosk {
  id: number;
  name: string;
  slug: string;
  isActive: number;
  config: KioskAppearance | null;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_APPEARANCE: KioskAppearance = {
  background: {
    type: 'color',
    color: '#ffffff',
    presetKey: null,
    customUrl: null,
    blur: 0,
    dim: 0,
    fit: 'cover',
  },
  typography: {
    fontFamily: 'system-ui',
    titleSize: 48,
    titleWeight: 700,
    subtitleSize: 24,
    letterSpacing: 0,
    buttonFontSize: 16,
  },
  layout: {
    spacing: 'comfortable',
    alignment: 'center',
    maxWidth: 800,
  },
  content: {
    headline: 'Welcome to Training',
    subtext: 'Sign in or get started below',
    logoUrl: null,
    accentColor: '#ef4444',
  },
  behavior: {
    showMemberLogin: true,
    showNewStudent: true,
    idleSeconds: 60,
    autoReturn: true,
    screensaverEnabled: true,
    screensaverMessage: 'Tap to continue',
    screensaverLogoUrl: null,
  },
};

export default function KioskStudioBuilder2() {
  console.log('[KioskStudioBuilder2] Component mounted');
  const { locationId: paramLocationId } = useParams<{ locationId: string }>();
  const [activeTab, setActiveTab] = useState<'appearance' | 'typography' | 'layout' | 'content' | 'behavior'>('appearance');
  const [draft, setDraft] = useState<KioskAppearance>(DEFAULT_APPEARANCE);
  const [isSaving, setIsSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [editorWidth, setEditorWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [isPreviewFocus, setIsPreviewFocus] = useState(false);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  
  // Location and kiosk state
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [selectedKioskId, setSelectedKioskId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; kioskId?: number; locationId?: number; type?: 'kiosk' | 'location' }>({ isOpen: false });
  const [createKioskName, setCreateKioskName] = useState('');
  const [showCreateKioskModal, setShowCreateKioskModal] = useState(false);
  
  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_EDITOR_WIDTH = 520;
  const MIN_PREVIEW_WIDTH = 360;
  const LOCATIONS_WIDTH = 280;
  const ICON_RAIL_WIDTH = 60;

  // Fetch locations for the organization
  const { data: locationsData, isLoading: locationsLoading, error: locationsError, refetch: refetchLocations } = trpc.kioskManager.getLocations.useQuery(
    undefined,
    {
      retry: 1,
      retryDelay: 1000,
    }
  );
  
  // Fetch kiosks for the selected location
  const { data: kiosksList, isLoading: kioskLoading, refetch: refetchKiosks } = trpc.kioskManager.listKiosksByLocation.useQuery(
    { locationId: selectedLocationId || 0 },
    { enabled: !!(selectedLocationId) }
  );

  // Mutations
  const createKioskMutation = trpc.kioskManager.createKiosk.useMutation({
    onSuccess: (data) => {
      refetchKiosks();
      setSelectedKioskId(data.id);
      toast.success('Kiosk created');
    },
    onError: (error) => toast.error('Error', { description: error.message }),
  });

  const updateKioskMutation = trpc.kioskManager.updateKiosk.useMutation({
    onSuccess: () => {
      refetchKiosks();
      toast.success('Kiosk updated');
    },
    onError: (error) => toast.error('Error', { description: error.message }),
  });

  const deleteKioskMutation = trpc.kioskManager.deleteKiosk.useMutation({
    onSuccess: () => {
      refetchKiosks();
      setSelectedKioskId(null);
      toast.success('Kiosk deleted');
      setConfirmModal({ isOpen: false });
    },
    onError: (error) => toast.error('Error', { description: error.message }),
  });

  const duplicateKioskMutation = trpc.kioskManager.duplicateKiosk.useMutation({
    onSuccess: (data) => {
      refetchKiosks();
      setSelectedKioskId(data.id);
      toast.success('Kiosk duplicated');
      setMenuOpen(null);
    },
    onError: (error) => toast.error('Error', { description: error.message }),
  });

  const createLocationMutation = trpc.kioskManager.createLocation.useMutation({
    onSuccess: (data) => {
      refetchLocations();
      setSelectedLocationId(data.locationId);
      toast.success('Location created');
    },
    onError: (error) => toast.error('Error', { description: error.message }),
  });

  const deleteLocationMutation = trpc.kioskManager.deleteLocation.useMutation({
    onSuccess: () => {
      refetchLocations();
      setSelectedLocationId(null);
      setSelectedKioskId(null);
      toast.success('Location deleted');
      setConfirmModal({ isOpen: false });
    },
    onError: (error) => toast.error('Error', { description: error.message }),
  });

  // Initialize locations
  useEffect(() => {
    if (locationsData) {
      setLocations(locationsData as Location[]);
      if (!selectedLocationId && locationsData.length > 0) {
        const defaultLoc = paramLocationId ? parseInt(paramLocationId) : locationsData[0].id;
        setSelectedLocationId(defaultLoc);
      }
    }
  }, [locationsData, selectedLocationId, paramLocationId]);

  // Initialize kiosks and select first one
  useEffect(() => {
    if (kiosksList) {
      setKiosks(kiosksList as Kiosk[]);
      if (!selectedKioskId && kiosksList.length > 0) {
        setSelectedKioskId(kiosksList[0].id);
        setDraft(kiosksList[0].config || DEFAULT_APPEARANCE);
      }
    }
  }, [kiosksList, selectedKioskId]);

  // Update draft when selected kiosk changes
  useEffect(() => {
    const kiosk = kiosks.find(k => k.id === selectedKioskId);
    if (kiosk) {
      setDraft(kiosk.config || DEFAULT_APPEARANCE);
    }
  }, [selectedKioskId, kiosks]);

  // Restore editor width from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kioskBuilder.splitRatio');
    if (saved) setEditorWidth(parseInt(saved, 10));
  }, []);

  // Handle resizing
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
    if (!draft || !selectedKioskId) return;
    setIsSaving(true);
    try {
      await updateKioskMutation.mutateAsync({ kioskId: selectedKioskId, config: draft });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedLocationId) return;
    setIsSaving(true);
    try {
      // First save the draft
      if (selectedKioskId && draft) {
        await updateKioskMutation.mutateAsync({ kioskId: selectedKioskId, config: draft });
      }
      toast.success('Configuration published and live');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateKiosk = () => {
    if (!selectedLocationId) return;
    setCreateKioskName('New Kiosk');
    setShowCreateKioskModal(true);
  };

  const handleConfirmCreateKiosk = () => {
    if (!selectedLocationId || !createKioskName.trim()) return;
    createKioskMutation.mutate({ locationId: selectedLocationId, name: createKioskName.trim() });
    setShowCreateKioskModal(false);
    setCreateKioskName('');
  };

  const handleRenameKiosk = (kioskId: number) => {
    const kiosk = kiosks.find(k => k.id === kioskId);
    if (!kiosk) return;
    const newName = prompt('New kiosk name:', kiosk.name);
    if (newName && newName.trim()) {
      updateKioskMutation.mutate({ kioskId, name: newName.trim() });
    }
  };

  const handleDuplicateKiosk = (kioskId: number) => {
    const kiosk = kiosks.find(k => k.id === kioskId);
    if (!kiosk) return;
    const newName = prompt('New kiosk name:', `${kiosk.name} (Copy)`);
    if (newName && newName.trim()) {
      duplicateKioskMutation.mutate({ kioskId, name: newName.trim() });
    }
  };

  const handleDeleteClick = (kioskId: number) => {
    setConfirmModal({ isOpen: true, kioskId, type: 'kiosk' });
  };

  const handleDeleteLocationClick = (locationId: number) => {
    setConfirmModal({ isOpen: true, locationId, type: 'location' });
  };

  const handleConfirmDelete = () => {
    if (confirmModal.type === 'kiosk' && confirmModal.kioskId) {
      deleteKioskMutation.mutate({ kioskId: confirmModal.kioskId });
    } else if (confirmModal.type === 'location' && confirmModal.locationId) {
      deleteLocationMutation.mutate({ locationId: confirmModal.locationId });
    }
  };

  const handleCreateLocation = () => {
    const name = prompt('Location name:', 'New Location');
    if (name && name.trim()) {
      createLocationMutation.mutate({ name: name.trim() });
    }
  };

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
  const selectedKiosk = kiosks.find(k => k.id === selectedKioskId);

  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const isInitializing = locationsLoading || (selectedLocationId && kioskLoading);
  const hasNoLocations = locationsData && locationsData.length === 0;
  
  if (locationsError) {
    return <div className="flex items-center justify-center h-screen text-destructive">Error loading locations: {locationsError.message}</div>;
  }
  
  if (isInitializing) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (hasNoLocations) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">No locations found. Please create a location first.</div>;
  }
  
  if (!selectedLocationId) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Please select a location.</div>;
  }

  return (
    <div ref={containerRef} className="flex h-screen bg-background overflow-hidden" style={{ userSelect: isResizing ? 'none' : 'auto', cursor: isResizing ? 'col-resize' : 'auto' }}>
      {/* Left: Locations & Kiosks */}
      <div className="w-[280px] border-r border-border bg-card flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Location</h2>
            <button onClick={handleCreateLocation} className="p-1 hover:bg-accent rounded-md transition-colors" title="Add location">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <Select value={selectedLocationId?.toString()} onValueChange={(v) => setSelectedLocationId(parseInt(v))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedLocation && (
            <button onClick={() => handleDeleteLocationClick(selectedLocation.id)} className="w-full px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors border border-destructive/20">
              Delete Location
            </button>
          )}
        </div>

        <div className="p-4 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Kiosks</h3>
            <button onClick={handleCreateKiosk} className="p-1 hover:bg-accent rounded-md transition-colors" title="Add kiosk">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {kiosks.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">No kiosks. Create one to start.</div>
          ) : (
            <div className="space-y-1 p-2">
              {kiosks.map((kiosk) => (
                <div key={kiosk.id} className="relative group">
                  <button onClick={() => setSelectedKioskId(kiosk.id)} className={`w-full text-left p-2.5 rounded-md text-sm transition-colors ${selectedKioskId === kiosk.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
                    <div className="font-medium truncate">{kiosk.name}</div>
                    <div className="text-xs opacity-60 mt-0.5">{kiosk.slug}</div>
                  </button>
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === kiosk.id ? null : kiosk.id); }} className="p-1 hover:bg-accent rounded-md">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen === kiosk.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-popover border border-border rounded-md shadow-md z-50" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => { e.stopPropagation(); handleRenameKiosk(kiosk.id); }} className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors">Rename</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDuplicateKiosk(kiosk.id); }} className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors">Duplicate</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(kiosk.id); }} className="w-full text-left px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors border-t border-border">Delete</button>
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
          {selectedKiosk ? (
            <>
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold">{selectedKiosk.name}</h2>
                <p className="text-xs text-muted-foreground mt-1">Customize appearance</p>
              </div>
              <div className="p-4 border-b border-border space-y-2 flex gap-2">
                <button onClick={handleSaveDraft} disabled={isSaving} className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"><Save className="w-4 h-4 inline mr-2" />Save</button>
                <button onClick={handlePublish} disabled={isSaving} className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"><Zap className="w-4 h-4 inline mr-2" />Publish</button>
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
                    <div><Label>Font Family</Label><Select value={draft?.typography?.fontFamily || 'Inter'} onValueChange={(v) => updateTypography({ fontFamily: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Inter">Inter</SelectItem><SelectItem value="Roboto">Roboto</SelectItem><SelectItem value="Poppins">Poppins</SelectItem></SelectContent></Select></div>
                    <div><Label>Title Size: {draft?.typography?.titleSize || 0}px</Label><Slider value={[draft?.typography?.titleSize || 48]} onValueChange={(v) => updateTypography({ titleSize: v[0] })} min={24} max={72} step={2} /></div>
                    <div><Label>Subtitle Size: {draft?.typography?.subtitleSize || 0}px</Label><Slider value={[draft?.typography?.subtitleSize || 24]} onValueChange={(v) => updateTypography({ subtitleSize: v[0] })} min={12} max={48} step={1} /></div>
                    <div><Label>Letter Spacing: {draft?.typography?.letterSpacing || 0}px</Label><Slider value={[draft?.typography?.letterSpacing || 0]} onValueChange={(v) => updateTypography({ letterSpacing: v[0] })} min={-2} max={10} step={0.5} /></div>
                  </TabsContent>
                  <TabsContent value="layout" className="p-4 space-y-4">
                    <div><Label>Spacing</Label><Select value={draft?.layout?.spacing || 'comfortable'} onValueChange={(v: any) => updateLayout({ spacing: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="compact">Compact</SelectItem><SelectItem value="comfortable">Comfortable</SelectItem><SelectItem value="spacious">Spacious</SelectItem></SelectContent></Select></div>
                    <div><Label>Alignment</Label><Select value={draft?.layout?.alignment || 'center'} onValueChange={(v: any) => updateLayout({ alignment: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent></Select></div>
                    <div><Label>Max Width: {draft?.layout?.maxWidth || 0}px</Label><Slider value={[draft?.layout?.maxWidth || 1000]} onValueChange={(v) => updateLayout({ maxWidth: v[0] })} min={300} max={1200} step={50} /></div>
                  </TabsContent>
                  <TabsContent value="content" className="p-4 space-y-4">
                    <div><Label>Headline</Label><Input value={draft?.content?.headline || ''} onChange={(e) => updateContent({ headline: e.target.value })} placeholder="Welcome to Training" /></div>
                    <div><Label>Subtext</Label><Input value={draft?.content?.subtext || ''} onChange={(e) => updateContent({ subtext: e.target.value })} placeholder="Sign in or get started below" /></div>
                    <div><Label>Logo URL (optional)</Label><Input value={draft?.content?.logoUrl || ''} onChange={(e) => updateContent({ logoUrl: e.target.value || null })} placeholder="https://..." /></div>
                  </TabsContent>
                  <TabsContent value="behavior" className="p-4 space-y-4">
                    <div className="flex items-center justify-between"><Label>Show Member Login</Label><Switch checked={draft?.behavior?.showMemberLogin || false} onCheckedChange={(v) => updateBehavior({ showMemberLogin: v })} /></div>
                    <div className="flex items-center justify-between"><Label>Show New Student</Label><Switch checked={draft?.behavior?.showNewStudent || false} onCheckedChange={(v) => updateBehavior({ showNewStudent: v })} /></div>
                    <div className="flex items-center justify-between"><Label>Auto Return</Label><Switch checked={draft?.behavior?.autoReturn || false} onCheckedChange={(v) => updateBehavior({ autoReturn: v })} /></div>
                    <div><Label>Idle Timeout: {draft?.behavior?.idleSeconds || 0}s</Label><Slider value={[draft?.behavior?.idleSeconds || 300]} onValueChange={(v) => updateBehavior({ idleSeconds: v[0] })} min={10} max={600} step={10} /></div>
                    <div className="flex items-center justify-between"><Label>Enable Screensaver</Label><Switch checked={draft?.behavior?.screensaverEnabled || false} onCheckedChange={(v) => updateBehavior({ screensaverEnabled: v })} /></div>
                    <div><Label>Screensaver Message</Label><Input value={draft?.behavior?.screensaverMessage || ''} onChange={(e) => updateBehavior({ screensaverMessage: e.target.value })} placeholder="Tap to continue" /></div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">Select or create a kiosk</div>
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
          >
            {isPreviewFocus ? 'Expand' : 'Focus'}
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <iframe
            key={previewKey}
            ref={previewFrameRef}
            src={`/kiosk/${selectedKiosk?.slug || 'preview'}`}
            className="w-full h-full border border-border rounded-lg shadow-lg"
            title="Kiosk Preview"
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'location' ? 'Delete Location' : 'Delete Kiosk'}
        message={confirmModal.type === 'location' ? 'Are you sure you want to delete this location and all its kiosks? This action cannot be undone.' : 'Are you sure you want to delete this kiosk? This action cannot be undone.'}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false })}
        isDangerous
      />

      {/* Create Kiosk Modal */}
      {showCreateKioskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Create New Kiosk</h2>
            <Input
              value={createKioskName}
              onChange={(e) => setCreateKioskName(e.target.value)}
              placeholder="Kiosk name"
              className="mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowCreateKioskModal(false); setCreateKioskName(''); }} className="flex-1 px-3 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors">Cancel</button>
              <button onClick={handleConfirmCreateKiosk} className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
