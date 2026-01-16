import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Save,
  Rocket,
  Palette,
  Type,
  Settings as SettingsIcon,
  Monitor,
  Search,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface KioskLocation {
  id: number;
  name: string;
  slug: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface KioskSettings {
  theme: { accentColor: string; fontFamily: string };
  content: {
    headline: string;
    subtext: string;
    tileLeft: { title: string; subtitle: string; button: string };
    tileRight: { title: string; subtitle: string; button: string };
    infoLeftLabel: string;
    infoRightLabel: string;
  };
  layout: { showClock: boolean; showInfoBar: boolean };
  background: { type: string; color: string; presetKey: string | null; customUrl: string | null; blur: number; dim: number; fit: string };
  screensaver: { enabled: boolean; idleSeconds: number; message: string; showLogo: boolean };
}

const DEFAULT_SETTINGS: KioskSettings = {
  theme: { accentColor: '#ef4444', fontFamily: 'Inter' },
  content: {
    headline: 'Welcome to Training',
    subtext: 'Tap to begin',
    tileLeft: { title: 'Check In', subtitle: 'Tap here to check into class', button: 'Check In' },
    tileRight: { title: 'Start Training', subtitle: 'New students start here', button: 'Start Training' },
    infoLeftLabel: 'Next Class',
    infoRightLabel: 'Today\'s Focus',
  },
  layout: { showClock: true, showInfoBar: true },
  background: { type: 'solid', color: '#ffffff', presetKey: null, customUrl: null, blur: 0, dim: 0, fit: 'cover' },
  screensaver: { enabled: true, idleSeconds: 60, message: 'Tap the screen to check-in', showLogo: true },
};

export default function KioskManager() {
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [previewMode, setPreviewMode] = useState<'iPad' | 'portrait' | '1080p'>('iPad');
  const [isDraftModified, setIsDraftModified] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Local state for builder controls
  const [settings, setSettings] = useState<KioskSettings>(DEFAULT_SETTINGS);

  // Fetch locations
  const { data: locations, isLoading: locationsLoading, refetch: refetchLocations } = trpc.kioskManager.getKioskLocations.useQuery();

  // Seed default location on mount
  const seedMutation = trpc.kioskManager.seedDefaultLocation.useMutation({
    onSuccess: () => {
      refetchLocations();
    },
  });

  // Create location mutation
  const createLocationMutation = trpc.kioskManager.createKioskLocation.useMutation({
    onSuccess: () => {
      setNewLocationName('');
      setIsAddingLocation(false);
      refetchLocations();
      toast.success('Location created');
    },
    onError: (error) => {
      toast.error('Failed to create location', { description: error.message });
    },
  });

  // Get kiosk config
  const { data: kioskConfig, refetch: refetchConfig } = trpc.kioskManager.getKioskConfig.useQuery(
    selectedLocationId ? { kioskLocationId: selectedLocationId } : { kioskLocationId: 0 },
    { enabled: !!selectedLocationId }
  );

  // Update appearance mutation
  const updateAppearanceMutation = trpc.kioskManager.updateKioskAppearance.useMutation({
    onSuccess: () => {
      setIsDraftModified(false);
      toast.success('Draft saved');
    },
    onError: (error) => {
      toast.error('Failed to save draft', { description: error.message });
    },
  });

  // Publish mutation
  const publishMutation = trpc.kioskManager.publishKioskAppearance.useMutation({
    onSuccess: () => {
      refetchConfig();
      toast.success('Published successfully');
    },
    onError: (error) => {
      toast.error('Failed to publish', { description: error.message });
    },
  });

  // Initialize on mount
  useEffect(() => {
    if (!locationsLoading && (!locations || locations.length === 0)) {
      seedMutation.mutate();
    }
  }, [locationsLoading, locations]);

  // Load settings when config changes
  useEffect(() => {
    if (kioskConfig?.draft) {
      setSettings(kioskConfig.draft);
      setIsDraftModified(false);
    }
  }, [kioskConfig]);

  // Auto-select first location
  useEffect(() => {
    if (locations && locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  const handleSaveDraft = () => {
    if (!selectedLocationId) return;
    updateAppearanceMutation.mutate({
      kioskLocationId: selectedLocationId,
      appearance: settings,
    });
  };

  const handlePublish = () => {
    if (!selectedLocationId) return;
    publishMutation.mutate({ kioskLocationId: selectedLocationId });
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim()) {
      toast.error('Please enter a location name');
      return;
    }
    createLocationMutation.mutate({ name: newLocationName });
  };

  const filteredLocations = locations?.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const selectedLocation = locations?.find(loc => loc.id === selectedLocationId);

  return (
    <div className="flex h-full bg-background">
      {/* Left Column: Location List */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Locations</h2>
            <Dialog open={isAddingLocation} onOpenChange={setIsAddingLocation}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Kiosk Location</DialogTitle>
                  <DialogDescription>Create a new kiosk location</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location-name">Location Name</Label>
                    <Input
                      id="location-name"
                      placeholder="e.g., Main Dojo, Downtown"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddLocation} className="w-full">
                    Create Location
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Location List */}
        <div className="flex-1 overflow-y-auto">
          {locationsLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : filteredLocations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">No locations found</div>
          ) : (
            <div className="space-y-2 p-2">
              {filteredLocations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => setSelectedLocationId(location.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedLocationId === location.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <div className="font-medium text-sm">{location.name}</div>
                  <div className="text-xs opacity-70">{location.slug}</div>
                  <div className="text-xs opacity-60 mt-1">
                    {location.isEnabled ? '✓ Active' : '○ Inactive'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle Column: Builder Controls */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedLocation ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-border bg-card">
              <h1 className="text-2xl font-bold">{selectedLocation.name}</h1>
              <p className="text-sm text-muted-foreground">Customize your kiosk appearance</p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="design" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full rounded-none border-b border-border bg-background p-0 h-auto">
                <TabsTrigger value="design" className="rounded-none">
                  <Palette className="w-4 h-4 mr-2" />
                  Design
                </TabsTrigger>
                <TabsTrigger value="content" className="rounded-none">
                  <Type className="w-4 h-4 mr-2" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="behavior" className="rounded-none">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Behavior
                </TabsTrigger>
                <TabsTrigger value="screensaver" className="rounded-none">
                  <Monitor className="w-4 h-4 mr-2" />
                  Screensaver
                </TabsTrigger>
              </TabsList>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto">
                {/* Design Tab */}
                <TabsContent value="design" className="p-6 space-y-6">
                  <div>
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        type="color"
                        value={settings.theme.accentColor}
                        onChange={(e) => {
                          setSettings({
                            ...settings,
                            theme: { ...settings.theme, accentColor: e.target.value },
                          });
                          setIsDraftModified(true);
                        }}
                        className="w-12 h-12 rounded border border-border cursor-pointer"
                      />
                      <Input
                        value={settings.theme.accentColor}
                        onChange={(e) => {
                          setSettings({
                            ...settings,
                            theme: { ...settings.theme, accentColor: e.target.value },
                          });
                          setIsDraftModified(true);
                        }}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Font Family</Label>
                    <Select
                      value={settings.theme.fontFamily}
                      onValueChange={(value) => {
                        setSettings({
                          ...settings,
                          theme: { ...settings.theme, fontFamily: value },
                        });
                        setIsDraftModified(true);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Background Type</Label>
                    <Select
                      value={settings.background.type}
                      onValueChange={(value) => {
                        setSettings({
                          ...settings,
                          background: { ...settings.background, type: value },
                        });
                        setIsDraftModified(true);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid Color</SelectItem>
                        <SelectItem value="preset">Preset</SelectItem>
                        <SelectItem value="custom">Custom Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.background.type === 'solid' && (
                    <div>
                      <Label>Background Color</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <input
                          type="color"
                          value={settings.background.color}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              background: { ...settings.background, color: e.target.value },
                            });
                            setIsDraftModified(true);
                          }}
                          className="w-12 h-12 rounded border border-border cursor-pointer"
                        />
                        <Input
                          value={settings.background.color}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              background: { ...settings.background, color: e.target.value },
                            });
                            setIsDraftModified(true);
                          }}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Blur ({settings.background.blur}px)</Label>
                    <Slider
                      value={[settings.background.blur]}
                      onValueChange={(value) => {
                        setSettings({
                          ...settings,
                          background: { ...settings.background, blur: value[0] },
                        });
                        setIsDraftModified(true);
                      }}
                      min={0}
                      max={20}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Dim ({settings.background.dim}%)</Label>
                    <Slider
                      value={[settings.background.dim]}
                      onValueChange={(value) => {
                        setSettings({
                          ...settings,
                          background: { ...settings.background, dim: value[0] },
                        });
                        setIsDraftModified(true);
                      }}
                      min={0}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Fit Mode</Label>
                    <Select
                      value={settings.background.fit}
                      onValueChange={(value) => {
                        setSettings({
                          ...settings,
                          background: { ...settings.background, fit: value },
                        });
                        setIsDraftModified(true);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Cover</SelectItem>
                        <SelectItem value="contain">Contain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="p-6 space-y-6">
                  <div>
                    <Label>Headline</Label>
                    <Input
                      value={settings.content.headline}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          content: { ...settings.content, headline: e.target.value },
                        });
                        setIsDraftModified(true);
                      }}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Subtext</Label>
                    <Input
                      value={settings.content.subtext}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          content: { ...settings.content, subtext: e.target.value },
                        });
                        setIsDraftModified(true);
                      }}
                      className="mt-2"
                    />
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Left Tile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={settings.content.tileLeft.title}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              content: {
                                ...settings.content,
                                tileLeft: { ...settings.content.tileLeft, title: e.target.value },
                              },
                            });
                            setIsDraftModified(true);
                          }}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Subtitle</Label>
                        <Input
                          value={settings.content.tileLeft.subtitle}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              content: {
                                ...settings.content,
                                tileLeft: { ...settings.content.tileLeft, subtitle: e.target.value },
                              },
                            });
                            setIsDraftModified(true);
                          }}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Button Text</Label>
                        <Input
                          value={settings.content.tileLeft.button}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              content: {
                                ...settings.content,
                                tileLeft: { ...settings.content.tileLeft, button: e.target.value },
                              },
                            });
                            setIsDraftModified(true);
                          }}
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Right Tile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={settings.content.tileRight.title}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              content: {
                                ...settings.content,
                                tileRight: { ...settings.content.tileRight, title: e.target.value },
                              },
                            });
                            setIsDraftModified(true);
                          }}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Subtitle</Label>
                        <Input
                          value={settings.content.tileRight.subtitle}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              content: {
                                ...settings.content,
                                tileRight: { ...settings.content.tileRight, subtitle: e.target.value },
                              },
                            });
                            setIsDraftModified(true);
                          }}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Button Text</Label>
                        <Input
                          value={settings.content.tileRight.button}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              content: {
                                ...settings.content,
                                tileRight: { ...settings.content.tileRight, button: e.target.value },
                              },
                            });
                            setIsDraftModified(true);
                          }}
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <Label>Info Left Label</Label>
                    <Input
                      value={settings.content.infoLeftLabel}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          content: { ...settings.content, infoLeftLabel: e.target.value },
                        });
                        setIsDraftModified(true);
                      }}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Info Right Label</Label>
                    <Input
                      value={settings.content.infoRightLabel}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          content: { ...settings.content, infoRightLabel: e.target.value },
                        });
                        setIsDraftModified(true);
                      }}
                      className="mt-2"
                    />
                  </div>
                </TabsContent>

                {/* Behavior Tab */}
                <TabsContent value="behavior" className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <Label>Show Clock</Label>
                    <Switch
                      checked={settings.layout.showClock}
                      onCheckedChange={(checked) => {
                        setSettings({
                          ...settings,
                          layout: { ...settings.layout, showClock: checked },
                        });
                        setIsDraftModified(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Show Info Bar</Label>
                    <Switch
                      checked={settings.layout.showInfoBar}
                      onCheckedChange={(checked) => {
                        setSettings({
                          ...settings,
                          layout: { ...settings.layout, showInfoBar: checked },
                        });
                        setIsDraftModified(true);
                      }}
                    />
                  </div>
                </TabsContent>

                {/* Screensaver Tab */}
                <TabsContent value="screensaver" className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <Label>Enable Screensaver</Label>
                    <Switch
                      checked={settings.screensaver.enabled}
                      onCheckedChange={(checked) => {
                        setSettings({
                          ...settings,
                          screensaver: { ...settings.screensaver, enabled: checked },
                        });
                        setIsDraftModified(true);
                      }}
                    />
                  </div>

                  {settings.screensaver.enabled && (
                    <>
                      <div>
                        <Label>Idle Time (seconds)</Label>
                        <Input
                          type="number"
                          value={settings.screensaver.idleSeconds}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              screensaver: { ...settings.screensaver, idleSeconds: parseInt(e.target.value) || 60 },
                            });
                            setIsDraftModified(true);
                          }}
                          className="mt-2"
                          min={10}
                          max={600}
                        />
                      </div>

                      <div>
                        <Label>Message</Label>
                        <Input
                          value={settings.screensaver.message}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              screensaver: { ...settings.screensaver, message: e.target.value },
                            });
                            setIsDraftModified(true);
                          }}
                          className="mt-2"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Show Logo</Label>
                        <Switch
                          checked={settings.screensaver.showLogo}
                          onCheckedChange={(checked) => {
                            setSettings({
                              ...settings,
                              screensaver: { ...settings.screensaver, showLogo: checked },
                            });
                            setIsDraftModified(true);
                          }}
                        />
                      </div>
                    </>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            {/* Bottom Bar */}
            <div className="border-t border-border bg-card p-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {isDraftModified ? '● Draft changes' : '○ No changes'}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={!isDraftModified}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={handlePublish}>
                  <Rocket className="w-4 h-4 mr-2" />
                  Publish
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Select a location to begin</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Live Preview */}
      {showPreview && selectedLocation && (
        <div className="w-96 border-l border-border bg-muted/50 flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Preview</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPreview(false)}
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
            <div className="space-y-2 w-full">
              {/* Preview Size Toggle */}
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  variant={previewMode === 'iPad' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode('iPad')}
                >
                  iPad
                </Button>
                <Button
                  size="sm"
                  variant={previewMode === 'portrait' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode('portrait')}
                >
                  Portrait
                </Button>
                <Button
                  size="sm"
                  variant={previewMode === '1080p' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode('1080p')}
                >
                  1080p
                </Button>
              </div>

              {/* Device Frame */}
              <div className="flex justify-center mt-4">
                <div
                  className="border-8 border-black rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    width: previewMode === 'iPad' ? '320px' : previewMode === 'portrait' ? '280px' : '300px',
                    aspectRatio: previewMode === 'iPad' ? '4/3' : previewMode === 'portrait' ? '9/16' : '16/9',
                  }}
                >
                  {/* Kiosk Preview Content */}
                  <div
                    className="w-full h-full flex flex-col items-center justify-center text-white p-6 text-center"
                    style={{
                      backgroundColor: settings.background.color,
                      fontFamily: settings.theme.fontFamily,
                      filter: `blur(${settings.background.blur}px) brightness(${1 - settings.background.dim / 100})`,
                    }}
                  >
                    {settings.layout.showClock && (
                      <div className="text-2xl font-bold mb-4">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}

                    <h1 className="text-3xl font-bold mb-2">{settings.content.headline}</h1>
                    <p className="text-lg mb-8 opacity-90">{settings.content.subtext}</p>

                    <div className="flex gap-4 mb-8">
                      <button
                        className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                        style={{ backgroundColor: settings.theme.accentColor, color: 'white' }}
                      >
                        {settings.content.tileLeft.button}
                      </button>
                      <button
                        className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                        style={{ backgroundColor: settings.theme.accentColor, color: 'white' }}
                      >
                        {settings.content.tileRight.button}
                      </button>
                    </div>

                    {settings.layout.showInfoBar && (
                      <div className="flex gap-8 text-sm opacity-75">
                        <div>{settings.content.infoLeftLabel}: 3:30 PM</div>
                        <div>{settings.content.infoRightLabel}: Discipline</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
