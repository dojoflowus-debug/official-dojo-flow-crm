import { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Palette, 
  Settings as SettingsIcon, 
  Eye, 
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

import { toast } from 'sonner';

export default function KioskSettings() {
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Fetch locations
  const { data: locations, isLoading: locationsLoading } = trpc.kiosk.listLocations.useQuery();

  // Fetch kiosk settings for selected location
  const { data: kioskData, isLoading: settingsLoading, refetch } = trpc.kiosk.getKioskSettings.useQuery(
    selectedLocationId ? { locationId: selectedLocationId } : { locationId: 0 },
    { enabled: !!selectedLocationId }
  );

  // Fetch preset backgrounds
  const { data: presetBackgrounds } = trpc.kiosk.getPublicPresetBackgrounds.useQuery(undefined, {
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Update kiosk settings mutation
  const updateSettings = trpc.kiosk.updateKioskSettings.useMutation({
    onSuccess: (result) => {
      console.log('[TRUTH_TRACE] SAVE RESULT from server:', JSON.stringify(result, null, 2));
      toast.success("Settings saved", {
        description: "Kiosk settings have been updated successfully.",
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // Upload background image mutation
  const uploadBackgroundMutation = trpc.kiosk.uploadBackgroundImage.useMutation({
    onSuccess: (data) => {
      setBackgroundImageUrl(data.url);
      setUploadStatus('success');
      setUploadError(null);
      toast.success('Background uploaded', {
        description: data.message,
      });
      // Reset status after 3 seconds
      setTimeout(() => setUploadStatus('idle'), 3000);
      refetch();
    },
    onError: (error) => {
      setUploadStatus('error');
      setUploadError(error.message);
      toast.error('Upload failed', {
        description: error.message,
      });
      // Reset status after 5 seconds
      setTimeout(() => setUploadStatus('idle'), 5000);
    },
  });

  // Local state for form
  const [kioskEnabled, setKioskEnabled] = useState(false);
  const [theme, setTheme] = useState<"default" | "modern" | "minimal" | "bold">("default");
  const [accentColor, setAccentColor] = useState("#ef4444");
  const [headline, setHeadline] = useState("Welcome to Training");
  const [subtext, setSubtext] = useState("Sign in or get started below");
  const [backgroundIntensity, setBackgroundIntensity] = useState([70]);
  const [backgroundBlur, setBackgroundBlur] = useState([3]);
  const [showMemberLogin, setShowMemberLogin] = useState(true);
  const [showNewStudent, setShowNewStudent] = useState(true);
  const [idleTimeout, setIdleTimeout] = useState(30);
  const [autoReturn, setAutoReturn] = useState(true);
  const [kaiEnrollment, setKaiEnrollment] = useState(false);
  const [facialRecognition, setFacialRecognition] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | undefined>(undefined);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);
  const [showPresetGallery, setShowPresetGallery] = useState(false);

  // Auto-select first location
  useEffect(() => {
    if (locations && locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  // Load settings when data changes
  useEffect(() => {
    if (kioskData) {
      setKioskEnabled(kioskData.kioskEnabled);
      setTheme(kioskData.settings.theme);
      setAccentColor(kioskData.settings.appearance.accentColor);
      setHeadline(kioskData.settings.appearance.headline);
      setSubtext(kioskData.settings.appearance.subtext);
      setBackgroundImageUrl(kioskData.settings.appearance.backgroundImageUrl);
      setBackgroundIntensity([kioskData.settings.appearance.backgroundIntensity]);
      setBackgroundBlur([kioskData.settings.appearance.backgroundBlur]);
      setShowMemberLogin(kioskData.settings.behavior.showMemberLogin);
      setShowNewStudent(kioskData.settings.behavior.showNewStudent);
      setIdleTimeout(kioskData.settings.behavior.idleTimeout);
      setAutoReturn(kioskData.settings.behavior.autoReturn);
      setKaiEnrollment(kioskData.settings.behavior.kaiEnrollment);
      setFacialRecognition(kioskData.settings.behavior.facialRecognition);
    }
  }, [kioskData]);

  const handleSave = () => {
    if (!selectedLocationId) return;

    const input = {
      locationId: selectedLocationId,
      kioskEnabled,
      settings: {
        theme,
        appearance: {
          accentColor,
          headline,
          subtext,
          backgroundImageUrl,
          backgroundIntensity: backgroundIntensity[0],
          backgroundBlur: backgroundBlur[0],
        },
        behavior: {
          showMemberLogin,
          showNewStudent,
          idleTimeout,
          autoReturn,
          kaiEnrollment,
          facialRecognition,
        },
      },
    };
    
    console.log('[TRUTH_TRACE] SAVE INPUT from client:', JSON.stringify(input, null, 2));
    updateSettings.mutate(input);
  };

  const handleBackgroundImageUpload = async (file: File) => {
    if (!selectedLocationId) return;
    
    // Validate file size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setUploadStatus('error');
      setUploadError('File size exceeds 8MB limit');
      toast.error('File too large', {
        description: 'Maximum file size is 8MB',
      });
      setTimeout(() => setUploadStatus('idle'), 5000);
      return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadStatus('error');
      setUploadError('Invalid file type. Please use JPG, PNG, or WebP');
      toast.error('Invalid file type', {
        description: 'Please use JPG, PNG, or WebP format',
      });
      setTimeout(() => setUploadStatus('idle'), 5000);
      return;
    }
    
    setUploadStatus('uploading');
    setUploadFileName(file.name);
    setUploadError(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1];
        
        uploadBackgroundMutation.mutate({
          locationId: selectedLocationId,
          fileData: base64Data,
          mimeType: (file.type as 'image/jpeg' | 'image/png' | 'image/webp') || 'image/jpeg',
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadStatus('error');
      setUploadError('Failed to read file');
      toast.error('Error', {
        description: 'Failed to read file',
      });
      setTimeout(() => setUploadStatus('idle'), 5000);
    }
  };

  const handleReset = () => {
    setTheme("default");
    setAccentColor("#ef4444");
    setHeadline("Welcome to Training");
    setSubtext("Sign in or get started below");
    setBackgroundIntensity([70]);
    setBackgroundBlur([3]);
    setBackgroundImageUrl(undefined);
    setShowMemberLogin(true);
    setShowNewStudent(true);
    setIdleTimeout(30);
    setAutoReturn(true);
    setKaiEnrollment(false);
    setFacialRecognition(false);
    
    toast.info("Settings reset", {
      description: "Kiosk settings have been reset to defaults. Click Save to apply.",
    });
  };

  const handlePresetSelect = (presetUrl: string, presetKey?: string) => {
    setBackgroundImageUrl(presetUrl);
    setSelectedPresetKey(presetKey || null);
    setShowPresetGallery(false);
    toast.success("Preset selected", {
      description: "Background preset applied. Click Save to persist.",
    });
  };

  const handleCopyUrl = () => {
    if (kioskData?.kioskUrl) {
      navigator.clipboard.writeText(kioskData.kioskUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      toast.success("URL copied", {
        description: "Kiosk URL copied to clipboard",
      });
    }
  };

  const handlePreview = () => {
    if (kioskData?.kioskUrl) {
      window.open(kioskData.kioskUrl, '_blank');
    }
  };

  if (locationsLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading locations...</div>
        </div>
      </div>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Locations Found</CardTitle>
            <CardDescription>
              Please create a location first in Settings → Locations before configuring kiosk.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Kiosk Configuration</h1>
        <p className="text-muted-foreground">
          Configure kiosk appearance and behavior for each location
        </p>
      </div>

      {/* Location Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Location</CardTitle>
          <CardDescription>Choose a location to configure its kiosk</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedLocationId?.toString()}
            onValueChange={(value) => setSelectedLocationId(parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id.toString()}>
                  {loc.name} {loc.kioskEnabled && "(Enabled)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      {selectedLocationId && kioskData && (
        <>
          {/* Kiosk Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Kiosk Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable Kiosk</Label>
                  <p className="text-sm text-muted-foreground">
                    Make kiosk accessible at the URL below
                  </p>
                </div>
                <Switch
                  checked={kioskEnabled}
                  onCheckedChange={setKioskEnabled}
                />
              </div>

              {kioskEnabled && kioskData.kioskUrl && (
                <div className="space-y-2">
                  <Label>Kiosk URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={kioskData.kioskUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyUrl}
                    >
                      {copiedUrl ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePreview}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this URL with staff or display it on a dedicated device
                  </p>
                </div>
              )}

              {!kioskEnabled && (
                <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Enable kiosk to generate a public URL for this location
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration Tabs */}
          <Tabs defaultValue="appearance" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appearance">
                <Palette className="h-4 w-4 mr-2" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="behavior">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Behavior
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Theme & Colors</CardTitle>
                  <CardDescription>Customize the visual style of your kiosk</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Theme Preset</Label>
                    <Select value={theme} onValueChange={(v: any) => setTheme(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default (Warm & Inviting)</SelectItem>
                        <SelectItem value="modern">Modern (Clean & Minimal)</SelectItem>
                        <SelectItem value="minimal">Minimal (Simple & Elegant)</SelectItem>
                        <SelectItem value="bold">Bold (High Contrast)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        placeholder="#ef4444"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Headline Text</Label>
                    <Input
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Welcome to Training"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subtext</Label>
                    <Input
                      value={subtext}
                      onChange={(e) => setSubtext(e.target.value)}
                      placeholder="Sign in or get started below"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Background Image</Label>
                      <p className="text-sm text-muted-foreground mb-3">Choose a preset or upload a custom image</p>
                    </div>

                    {/* Preset Gallery Toggle */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowPresetGallery(!showPresetGallery)}
                    >
                      {showPresetGallery ? 'Hide Presets' : 'Browse Presets'}
                    </Button>

                    {/* Preset Gallery */}
                    {showPresetGallery && presetBackgrounds && presetBackgrounds.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 p-4 bg-muted rounded-lg">
                        {presetBackgrounds.map((preset) => (
                          <div
                            key={preset.key}
                            onClick={() => handlePresetSelect(preset.imageUrl, preset.key)}
                            className={`cursor-pointer group relative overflow-hidden rounded-lg border-2 transition-all ${
                              selectedPresetKey === preset.key
                                ? 'border-primary bg-primary/10'
                                : 'border-transparent hover:border-primary'
                            }`}
                          >
                            <img
                              src={preset.imageUrl}
                              alt={preset.label}
                              className="w-full h-24 object-cover group-hover:opacity-75 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity text-center px-1">
                                {preset.label}
                              </span>
                            </div>
                            {selectedPresetKey === preset.key && (
                              <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Current Background Preview */}
                    <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-3">
                      {backgroundImageUrl ? (
                        <div className="space-y-3">
                          <img src={backgroundImageUrl} alt="Background preview" className="w-full h-32 object-cover rounded" />
                          <div className="text-sm text-muted-foreground">
                            {uploadFileName && <p>File: {uploadFileName}</p>}
                          </div>
                          {uploadStatus === 'success' && (
                            <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                              <Check size={16} />
                              <span>Uploaded successfully</span>
                            </div>
                          )}
                          {uploadStatus === 'error' && uploadError && (
                            <div className="flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                              <AlertCircle size={16} />
                              <span>{uploadError}</span>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/jpeg,image/png,image/webp';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) handleBackgroundImageUpload(file);
                              };
                              input.click();
                            }}
                            disabled={uploadBackgroundMutation.isPending || uploadStatus === 'uploading'}
                          >
                            {uploadStatus === 'uploading' ? 'Uploading...' : 'Change Image'}
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/jpeg,image/png,image/webp';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleBackgroundImageUpload(file);
                            };
                            input.click();
                          }}
                          className="cursor-pointer space-y-2"
                        >
                          <p className="text-sm text-muted-foreground">Click to upload background image</p>
                          <p className="text-xs text-muted-foreground">JPG, PNG, or WebP (max 8MB)</p>
                          {uploadStatus === 'error' && uploadError && (
                            <div className="flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                              <AlertCircle size={16} />
                              <span>{uploadError}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Background Intensity: {backgroundIntensity[0]}%</Label>
                    <Slider
                      value={backgroundIntensity}
                      onValueChange={setBackgroundIntensity}
                      min={0}
                      max={100}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls the darkness of the background overlay
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Background Blur: {backgroundBlur[0]}px</Label>
                    <Slider
                      value={backgroundBlur}
                      onValueChange={setBackgroundBlur}
                      min={0}
                      max={10}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls the blur amount of the background image
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Behavior Tab */}
            <TabsContent value="behavior" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Kiosk Behavior</CardTitle>
                  <CardDescription>Configure how the kiosk operates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Member Login</Label>
                      <p className="text-sm text-muted-foreground">
                        Display the Member Login button
                      </p>
                    </div>
                    <Switch
                      checked={showMemberLogin}
                      onCheckedChange={setShowMemberLogin}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show New Student</Label>
                      <p className="text-sm text-muted-foreground">
                        Display the New Student button
                      </p>
                    </div>
                    <Switch
                      checked={showNewStudent}
                      onCheckedChange={setShowNewStudent}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Idle Timeout (seconds)</Label>
                    <Input
                      type="number"
                      value={idleTimeout}
                      onChange={(e) => setIdleTimeout(parseInt(e.target.value) || 30)}
                      min={10}
                      max={300}
                    />
                    <p className="text-xs text-muted-foreground">
                      Return to welcome screen after this many seconds of inactivity
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-Return to Welcome</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically return to welcome screen after timeout
                      </p>
                    </div>
                    <Switch
                      checked={autoReturn}
                      onCheckedChange={setAutoReturn}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Kai Enrollment Assistant</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable AI-powered enrollment assistance
                      </p>
                    </div>
                    <Switch
                      checked={kaiEnrollment}
                      onCheckedChange={setKaiEnrollment}
                    />
                  </div>

                  <div className="flex items-center justify-between opacity-50">
                    <div>
                      <Label>Facial Recognition (Coming Soon)</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable facial recognition for check-in
                      </p>
                    </div>
                    <Switch
                      checked={facialRecognition}
                      onCheckedChange={setFacialRecognition}
                      disabled
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Preview & Actions</CardTitle>
                  <CardDescription>Test your kiosk configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handlePreview}
                      disabled={!kioskEnabled || !kioskData.kioskUrl}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Kiosk Preview
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>

                  {!kioskEnabled && (
                    <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Enable kiosk in the Status section to preview
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              size="lg"
            >
              {updateSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
