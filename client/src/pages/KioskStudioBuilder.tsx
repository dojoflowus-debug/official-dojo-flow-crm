import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Zap, RotateCcw, RefreshCw, Palette, Type, Layout, FileText, Zap as Zap2 } from 'lucide-react';

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

export default function KioskStudioBuilder() {
  const { locationId } = useParams<{ locationId: string }>();
  const [activeTab, setActiveTab] = useState<'appearance' | 'typography' | 'layout' | 'content' | 'behavior'>('appearance');
  const [draft, setDraft] = useState<KioskAppearance | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);

  const locId = locationId ? parseInt(locationId) : 0;

  // Fetch current settings
  const { data: settingsData, isLoading } = trpc.kioskStudio.getSettings.useQuery(
    { locationId: locId },
    { enabled: !!locId }
  );

  // Initialize draft from fetched data
  useEffect(() => {
    if (settingsData?.draft) {
      setDraft(settingsData.draft);
    }
  }, [settingsData]);

  // Mutations
  const saveDraftMutation = trpc.kioskStudio.saveDraft.useMutation({
    onSuccess: () => {
      toast.success('Draft saved', { description: 'Your changes have been saved' });
    },
    onError: (error) => {
      toast.error('Error', { description: error.message });
    },
  });

  const publishMutation = trpc.kioskStudio.publish.useMutation({
    onSuccess: (data) => {
      toast.success('Published', { description: `Version ${data.version} is now live` });
      setPreviewKey(prev => prev + 1);
    },
    onError: (error) => {
      toast.error('Error', { description: error.message });
    },
  });

  const resetMutation = trpc.kioskStudio.resetToDefault.useMutation({
    onSuccess: (data) => {
      setDraft(data.appearance);
      toast.success('Reset', { description: 'Settings reset to default' });
    },
    onError: (error) => {
      toast.error('Error', { description: error.message });
    },
  });

  const uploadBackgroundMutation = trpc.kioskStudio.uploadBackgroundImage.useMutation({
    onSuccess: (data) => {
      if (draft) {
        const updated = {
          ...draft,
          background: {
            ...draft.background,
            type: 'image' as const,
            customUrl: data.url,
          },
        };
        setDraft(updated);
        sendPreviewUpdate(updated);
      }
      toast.success('Uploaded', { description: 'Background image uploaded' });
    },
    onError: (error) => {
      toast.error('Error', { description: error.message });
    },
  });

  const applyPresetMutation = trpc.kioskStudio.applyThemePreset.useMutation({
    onSuccess: (data) => {
      setDraft(data.appearance);
      sendPreviewUpdate(data.appearance);
      toast.success('Applied', { description: `${data.message}` });
    },
    onError: (error) => {
      toast.error('Error', { description: error.message });
    },
  });

  // Send draft to preview iframe via postMessage
  const sendPreviewUpdate = (appearance: KioskAppearance) => {
    if (previewFrameRef.current?.contentWindow) {
      previewFrameRef.current.contentWindow.postMessage(
        {
          type: 'KIOSK_STUDIO_UPDATE',
          appearance,
          timestamp: Date.now(),
        },
        '*'
      );
    }
  };

  // Handle changes
  const updateDraft = (updates: Partial<KioskAppearance>) => {
    if (!draft) return;
    const updated = { ...draft, ...updates };
    setDraft(updated);
    sendPreviewUpdate(updated);
  };

  const updateBackground = (updates: Partial<KioskAppearance['background']>) => {
    if (!draft) return;
    const updated = {
      ...draft,
      background: { ...draft.background, ...updates },
    };
    setDraft(updated);
    sendPreviewUpdate(updated);
  };

  const updateTypography = (updates: Partial<KioskAppearance['typography']>) => {
    if (!draft) return;
    const updated = {
      ...draft,
      typography: { ...draft.typography, ...updates },
    };
    setDraft(updated);
    sendPreviewUpdate(updated);
  };

  const updateLayout = (updates: Partial<KioskAppearance['layout']>) => {
    if (!draft) return;
    const updated = {
      ...draft,
      layout: { ...draft.layout, ...updates },
    };
    setDraft(updated);
    sendPreviewUpdate(updated);
  };

  const updateContent = (updates: Partial<KioskAppearance['content']>) => {
    if (!draft) return;
    const updated = {
      ...draft,
      content: { ...draft.content, ...updates },
    };
    setDraft(updated);
    sendPreviewUpdate(updated);
  };

  const updateBehavior = (updates: Partial<KioskAppearance['behavior']>) => {
    if (!draft) return;
    const updated = {
      ...draft,
      behavior: { ...draft.behavior, ...updates },
    };
    setDraft(updated);
    sendPreviewUpdate(updated);
  };

  // Handle file upload
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = event.target?.result as string;
      uploadBackgroundMutation.mutate({
        locationId: locId,
        fileName: file.name,
        fileData,
        mimeType: file.type,
        blur: draft?.background.blur || 0,
        dim: draft?.background.dim || 0,
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle save and publish
  const handleSaveDraft = async () => {
    if (!draft) return;
    setIsSaving(true);
    try {
      await saveDraftMutation.mutateAsync({
        locationId: locId,
        appearance: draft,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    // First save draft, then publish
    if (!draft) return;
    setIsSaving(true);
    try {
      await saveDraftMutation.mutateAsync({
        locationId: locId,
        appearance: draft,
      });
      await publishMutation.mutateAsync({ locationId: locId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all settings to default?')) {
      resetMutation.mutate({ locationId: locId });
    }
  };

  if (isLoading || !draft) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Controls */}
      <div className="w-1/2 overflow-y-auto border-r border-gray-200 bg-white">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Kiosk Studio</h1>
            <p className="text-sm text-gray-600">Customize your kiosk appearance and behavior</p>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex gap-2">
            <Button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex-1"
              variant="outline"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isSaving}
              className="flex-1"
            >
              <Zap className="w-4 h-4 mr-2" />
              Publish
            </Button>
            <Button
              onClick={handleReset}
              variant="ghost"
              size="icon"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="appearance" title="Appearance">
                <Palette className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="typography" title="Typography">
                <Type className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="layout" title="Layout">
                <Layout className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="content" title="Content">
                <FileText className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="behavior" title="Behavior">
                <Zap2 className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Background</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={draft.background.type} onValueChange={(v: any) => updateBackground({ type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="color">Solid Color</SelectItem>
                        <SelectItem value="preset">Preset</SelectItem>
                        <SelectItem value="image">Custom Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {draft.background.type === 'color' && (
                    <div>
                      <Label>Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={draft.background.color}
                          onChange={(e) => updateBackground({ color: e.target.value })}
                          className="w-12 h-10 rounded border"
                        />
                        <Input
                          value={draft.background.color}
                          onChange={(e) => updateBackground({ color: e.target.value })}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  )}

                  {draft.background.type === 'preset' && (
                    <div>
                      <Label>Theme Preset</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['minimal-white', 'dojo-warm', 'night-mode', 'high-contrast'].map((preset) => (
                          <Button
                            key={preset}
                            variant={draft.background.presetKey === preset ? 'default' : 'outline'}
                            onClick={() => applyPresetMutation.mutate({ locationId: locId, presetName: preset as any })}
                            className="text-xs"
                          >
                            {preset.replace('-', ' ')}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {draft.background.type === 'image' && (
                    <div>
                      <Label>Upload Image</Label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Blur: {draft.background.blur}</Label>
                    <Slider
                      value={[draft.background.blur]}
                      onValueChange={(v) => updateBackground({ blur: v[0] })}
                      min={0}
                      max={24}
                      step={1}
                    />
                  </div>

                  <div>
                    <Label>Dim: {draft.background.dim}%</Label>
                    <Slider
                      value={[draft.background.dim]}
                      onValueChange={(v) => updateBackground({ dim: v[0] })}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div>
                    <Label>Fit</Label>
                    <Select value={draft.background.fit} onValueChange={(v: any) => updateBackground({ fit: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Cover</SelectItem>
                        <SelectItem value="contain">Contain</SelectItem>
                        <SelectItem value="stretch">Stretch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Colors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={draft.content.accentColor}
                        onChange={(e) => updateContent({ accentColor: e.target.value })}
                        className="w-12 h-10 rounded border"
                      />
                      <Input
                        value={draft.content.accentColor}
                        onChange={(e) => updateContent({ accentColor: e.target.value })}
                        placeholder="#ef4444"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Typography</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Font Family</Label>
                    <Select value={draft.typography.fontFamily} onValueChange={(v) => updateTypography({ fontFamily: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system-ui">System UI</SelectItem>
                        <SelectItem value="serif">Serif</SelectItem>
                        <SelectItem value="monospace">Monospace</SelectItem>
                        <SelectItem value="cursive">Cursive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Title Size: {draft.typography.titleSize}px</Label>
                    <Slider
                      value={[draft.typography.titleSize]}
                      onValueChange={(v) => updateTypography({ titleSize: v[0] })}
                      min={16}
                      max={96}
                      step={2}
                    />
                  </div>

                  <div>
                    <Label>Title Weight: {draft.typography.titleWeight}</Label>
                    <Slider
                      value={[draft.typography.titleWeight]}
                      onValueChange={(v) => updateTypography({ titleWeight: v[0] })}
                      min={300}
                      max={900}
                      step={100}
                    />
                  </div>

                  <div>
                    <Label>Subtitle Size: {draft.typography.subtitleSize}px</Label>
                    <Slider
                      value={[draft.typography.subtitleSize]}
                      onValueChange={(v) => updateTypography({ subtitleSize: v[0] })}
                      min={12}
                      max={48}
                      step={1}
                    />
                  </div>

                  <div>
                    <Label>Letter Spacing: {draft.typography.letterSpacing}px</Label>
                    <Slider
                      value={[draft.typography.letterSpacing]}
                      onValueChange={(v) => updateTypography({ letterSpacing: v[0] })}
                      min={-2}
                      max={10}
                      step={0.5}
                    />
                  </div>

                  <div>
                    <Label>Button Font Size: {draft.typography.buttonFontSize}px</Label>
                    <Slider
                      value={[draft.typography.buttonFontSize]}
                      onValueChange={(v) => updateTypography({ buttonFontSize: v[0] })}
                      min={12}
                      max={32}
                      step={1}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Layout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Spacing</Label>
                    <Select value={draft.layout.spacing} onValueChange={(v: any) => updateLayout({ spacing: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Alignment</Label>
                    <Select value={draft.layout.alignment} onValueChange={(v: any) => updateLayout({ alignment: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Max Width: {draft.layout.maxWidth}px</Label>
                    <Slider
                      value={[draft.layout.maxWidth]}
                      onValueChange={(v) => updateLayout({ maxWidth: v[0] })}
                      min={300}
                      max={1200}
                      step={50}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Headline</Label>
                    <Input
                      value={draft.content.headline}
                      onChange={(e) => updateContent({ headline: e.target.value })}
                      placeholder="Welcome to Training"
                    />
                  </div>

                  <div>
                    <Label>Subtext</Label>
                    <Input
                      value={draft.content.subtext}
                      onChange={(e) => updateContent({ subtext: e.target.value })}
                      placeholder="Sign in or get started below"
                    />
                  </div>

                  <div>
                    <Label>Logo URL (optional)</Label>
                    <Input
                      value={draft.content.logoUrl || ''}
                      onChange={(e) => updateContent({ logoUrl: e.target.value || null })}
                      placeholder="https://..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Behavior Tab */}
            <TabsContent value="behavior" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Behavior</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Show Member Login</Label>
                    <Switch
                      checked={draft.behavior.showMemberLogin}
                      onCheckedChange={(v) => updateBehavior({ showMemberLogin: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Show New Student</Label>
                    <Switch
                      checked={draft.behavior.showNewStudent}
                      onCheckedChange={(v) => updateBehavior({ showNewStudent: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto Return</Label>
                    <Switch
                      checked={draft.behavior.autoReturn}
                      onCheckedChange={(v) => updateBehavior({ autoReturn: v })}
                    />
                  </div>

                  <div>
                    <Label>Idle Timeout: {draft.behavior.idleSeconds}s</Label>
                    <Slider
                      value={[draft.behavior.idleSeconds]}
                      onValueChange={(v) => updateBehavior({ idleSeconds: v[0] })}
                      min={10}
                      max={600}
                      step={10}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Enable Screensaver</Label>
                    <Switch
                      checked={draft.behavior.screensaverEnabled}
                      onCheckedChange={(v) => updateBehavior({ screensaverEnabled: v })}
                    />
                  </div>

                  <div>
                    <Label>Screensaver Message</Label>
                    <Input
                      value={draft.behavior.screensaverMessage}
                      onChange={(e) => updateBehavior({ screensaverMessage: e.target.value })}
                      placeholder="Tap to continue"
                    />
                  </div>

                  <div>
                    <Label>Screensaver Logo URL (optional)</Label>
                    <Input
                      value={draft.behavior.screensaverLogoUrl || ''}
                      onChange={(e) => updateBehavior({ screensaverLogoUrl: e.target.value || null })}
                      placeholder="https://..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Panel - Live Preview */}
      <div className="w-1/2 bg-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <h2 className="font-semibold">Live Preview</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewKey(prev => prev + 1)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe
            ref={previewFrameRef}
            src={`/kiosk/${locId}?studioPreview=1&v=${settingsData?.version || 1}&ts=${previewKey}`}
            className="w-full h-full border-none"
            title="Kiosk Preview"
          />
        </div>
      </div>
    </div>
  );
}
