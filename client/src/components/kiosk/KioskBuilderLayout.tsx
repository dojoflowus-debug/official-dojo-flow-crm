import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Plus, MoreVertical, Eye, EyeOff, Save, Rocket, Loader } from 'lucide-react';
import { trpc } from '../../lib/trpc';
import { toast } from 'sonner';

interface KioskLocation {
  id: number;
  name: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

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

interface BuilderLayoutProps {
  children: React.ReactNode;
}

export default function KioskBuilderLayout({ children }: BuilderLayoutProps) {
  const [locations, setLocations] = useState<KioskLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [editorWidth, setEditorWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [isPreviewFocus, setIsPreviewFocus] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  const MIN_EDITOR_WIDTH = 420;
  const MIN_PREVIEW_WIDTH = 360;
  const LOCATIONS_WIDTH = 280;

  // Fetch locations
  const { data: fetchedLocations, refetch: refetchLocations } = trpc.kioskManager.getKioskLocations.useQuery();

  // Load split ratio from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kioskBuilder.splitRatio');
    if (saved) {
      setEditorWidth(parseInt(saved, 10));
    }
  }, []);

  // Update locations state
  useEffect(() => {
    if (fetchedLocations) {
      setLocations(fetchedLocations as KioskLocation[]);
      if (!selectedLocationId && fetchedLocations.length > 0) {
        setSelectedLocationId(fetchedLocations[0].id);
      }
    }
  }, [fetchedLocations, selectedLocationId]);

  // Handle divider drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current) return;
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = editorWidth;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(
        MIN_EDITOR_WIDTH,
        Math.min(
          startWidth + deltaX,
          containerRef.current!.clientWidth - LOCATIONS_WIDTH - MIN_PREVIEW_WIDTH
        )
      );
      setEditorWidth(newWidth);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      localStorage.setItem('kioskBuilder.splitRatio', editorWidth.toString());
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }, [editorWidth]);

  // Filter locations
  const filteredLocations = locations.filter(loc => {
    const isArchived = loc.isActive === 0;
    const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (showArchived || !isArchived);
  });

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

  // Mutations
  const renameLocationMutation = trpc.kioskManager.renameLocation.useMutation({
    onSuccess: () => {
      refetchLocations();
      toast.success('Location renamed');
      setMenuOpen(null);
    },
    onError: (error) => {
      toast.error('Failed to rename', { description: error.message });
      setMenuOpen(null);
    },
  });

  const duplicateLocationMutation = trpc.kioskManager.duplicateLocation.useMutation({
    onSuccess: (newLocation) => {
      refetchLocations();
      setSelectedLocationId(newLocation.id);
      toast.success('Location duplicated');
      setMenuOpen(null);
    },
    onError: (error) => {
      toast.error('Failed to duplicate', { description: error.message });
      setMenuOpen(null);
    },
  });

  const archiveLocationMutation = trpc.kioskManager.archiveLocation.useMutation({
    onSuccess: () => {
      refetchLocations();
      if (selectedLocationId === menuOpen) {
        setSelectedLocationId(locations.find(l => l.isActive === 1 && l.id !== menuOpen)?.id || null);
      }
      toast.success('Location archived');
      setMenuOpen(null);
    },
    onError: (error) => {
      toast.error('Failed to archive', { description: error.message });
      setMenuOpen(null);
    },
  });

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

  const handleArchive = (locationId: number) => {
    const location = locations.find(l => l.id === locationId);
    if (!location) return;

    // Check if this is the last active location
    const activeCount = locations.filter(l => l.isActive === 1).length;
    if (activeCount === 1) {
      toast.error('Cannot archive the last location', {
        description: 'You must have at least one active location',
      });
      setMenuOpen(null);
      return;
    }

    if (confirm(`Archive "${location.name}"? This will disable its kiosk route.`)) {
      archiveLocationMutation.mutate({ locationId });
    }
  };

  // Cleanup menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuOpen !== null) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  return (
    <div
      ref={containerRef}
      className="flex h-screen bg-background overflow-hidden"
      style={{ userSelect: isResizing ? 'none' : 'auto', cursor: isResizing ? 'col-resize' : 'auto' }}
    >
      {/* Left: Locations List */}
      <div className="w-[280px] border-r border-border bg-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Locations</h2>
            <button
              onClick={() => {
                const name = prompt('Location name:');
                if (name && name.trim()) {
                  // TODO: Call create location mutation
                }
              }}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="Add location"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />

          {/* Show Archived Toggle */}
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-3 h-3"
            />
            <span className="text-muted-foreground">Show archived</span>
          </label>
        </div>

        {/* Location List */}
        <div className="flex-1 overflow-y-auto">
          {filteredLocations.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {searchQuery ? 'No locations found' : 'No locations'}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className="relative group"
                >
                  <button
                    onClick={() => setSelectedLocationId(location.id)}
                    className={`w-full text-left p-2.5 rounded-md text-sm transition-colors ${
                      selectedLocationId === location.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div className="font-medium truncate">{location.name}</div>
                    <div className="text-xs opacity-60 mt-0.5">
                      {location.isActive === 1 ? '✓ Active' : '○ Archived'}
                    </div>
                  </button>

                  {/* Kebab Menu */}
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === location.id ? null : location.id);
                      }}
                      className="p-1 hover:bg-accent rounded-md"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {menuOpen === location.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-popover border border-border rounded-md shadow-md z-50" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRename(location.id);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                        >
                          Rename
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(location.id);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(location.id);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors border-t border-border"
                        >
                          {location.isActive === 1 ? 'Archive' : 'Restore'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Editor (Resizable) */}
      {!isPreviewFocus && (
        <div style={{ width: `${editorWidth}px` }} className="border-r border-border bg-card flex flex-col overflow-hidden">
          {selectedLocation ? (
            <>
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold">{selectedLocation.name}</h2>
                <p className="text-xs text-muted-foreground mt-1">Customize appearance</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {/* Editor content will be rendered here via children */}
                {children}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a location
            </div>
          )}
        </div>
      )}

      {/* Divider (Draggable) */}
      {!isPreviewFocus && (
        <div
          ref={dividerRef}
          onPointerDown={handlePointerDown}
          className="w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors active:bg-primary"
          style={{ userSelect: 'none' }}
        />
      )}

      {/* Right: Preview */}
      <div className="flex-1 bg-gray-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <h3 className="font-semibold">Live Preview</h3>
          <button
            onClick={() => setIsPreviewFocus(!isPreviewFocus)}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            title={isPreviewFocus ? 'Show editor' : 'Focus preview'}
          >
            {isPreviewFocus ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
          {selectedLocation ? (
            <iframe
              src={`/kiosk/${selectedLocation.id}?studioPreview=1`}
              className="w-full h-full border-none"
              title="Kiosk Preview"
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <p>Select a location to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
