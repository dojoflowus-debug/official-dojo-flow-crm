import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, X, Upload, Check } from "lucide-react";

interface PresetBackground {
  id: number;
  key: string;
  name: string;
  description?: string;
  category: string;
  imageUrl: string;
  thumbnailUrl?: string;
  blurDefault: number;
  dimDefault: number;
}

interface BackgroundSettingsProps {
  locationId: number;
  onSave?: () => void;
}

export function BackgroundSettings({ locationId, onSave }: BackgroundSettingsProps) {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [blur, setBlur] = useState(0);
  const [dim, setDim] = useState(0);
  const [source, setSource] = useState<"preset" | "custom">("preset");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch preset backgrounds
  const { data: presets = [] } = trpc.kiosk.getPresetBackgrounds.useQuery();

  // Fetch current location background
  const { data: currentBackground } = trpc.kiosk.getLocationBackground.useQuery({
    locationId,
  });

  // Update background mutation
  const updateBackgroundMutation = trpc.kiosk.updateLocationBackground.useMutation({
    onSuccess: () => {
      toast.success("Background updated successfully");
      onSave?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update background");
    },
  });

  // Upload custom background mutation
  const uploadBackgroundMutation = trpc.kiosk.uploadCustomBackground.useMutation({
    onSuccess: (data) => {
      setCustomImageUrl(data.url);
      setSource("custom");
      toast.success("Background uploaded successfully");
      onSave?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload background");
    },
  });

  // Remove custom background mutation
  const removeBackgroundMutation = trpc.kiosk.removeCustomBackground.useMutation({
    onSuccess: () => {
      setCustomImageUrl(null);
      setSource("preset");
      setSelectedPresetKey("dojo-warm-lights");
      toast.success("Custom background removed");
      onSave?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove background");
    },
  });

  // Initialize with current background
  useEffect(() => {
    if (currentBackground) {
      if (currentBackground.imageUrl && currentBackground.type === "custom") {
        setCustomImageUrl(currentBackground.imageUrl);
        setSource("custom");
      } else if (currentBackground.presetKey) {
        setSelectedPresetKey(currentBackground.presetKey);
        setSource("preset");
      }
      setBlur(currentBackground.blur ?? 0);
      setDim(currentBackground.dim ?? 0);
    }
  }, [currentBackground]);

  const handlePresetSelect = (presetKey: string) => {
    setSelectedPresetKey(presetKey);
    setSource("preset");
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are supported");
      return;
    }

    // Validate file size (5-8MB)
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 8MB");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string)?.split(",")[1];
        if (!base64) {
          toast.error("Failed to read file");
          return;
        }

        await uploadBackgroundMutation.mutateAsync({
          locationId,
          fileData: base64,
          fileName: file.name,
          mimeType: file.type as "image/jpeg" | "image/png" | "image/webp",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload background");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await updateBackgroundMutation.mutateAsync({
        locationId,
        source,
        presetKey: source === "preset" ? selectedPresetKey : undefined,
        customUrl: source === "custom" ? customImageUrl : undefined,
        blur,
        dim,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCustom = async () => {
    setIsLoading(true);
    try {
      await removeBackgroundMutation.mutateAsync({ locationId });
    } finally {
      setIsLoading(false);
    }
  };

  // Get current background display
  const currentPreset = presets.find((p) => p.key === selectedPresetKey);
  const displayImage =
    source === "custom" && customImageUrl
      ? customImageUrl
      : currentPreset?.imageUrl;

  return (
    <div className="space-y-6">
      {/* Preview Section */}
      <Card className="overflow-hidden">
        <div className="relative h-48 bg-gray-900">
          {displayImage && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${displayImage})`,
                filter: `blur(${blur}px)`,
                opacity: 1 - dim / 100,
              }}
            />
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <p className="text-white text-sm font-medium">
              {source === "custom" && customImageUrl
                ? "Custom Background"
                : currentPreset?.name || "No background selected"}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs for Presets and Custom */}
      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="presets">Preset Library</TabsTrigger>
          <TabsTrigger value="custom">Custom Upload</TabsTrigger>
        </TabsList>

        {/* Preset Backgrounds Tab */}
        <TabsContent value="presets" className="space-y-4">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {presets.map((preset) => (
              <button
                key={preset.key}
                onClick={() => handlePresetSelect(preset.key)}
                className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                  selectedPresetKey === preset.key && source === "preset"
                    ? "border-blue-500 ring-2 ring-blue-400"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <img
                  src={preset.thumbnailUrl || preset.imageUrl}
                  alt={preset.name}
                  className="h-24 w-full object-cover"
                />
                {selectedPresetKey === preset.key && source === "preset" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20">
                    <Check className="h-5 w-5 text-blue-500" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                  <p className="truncate text-xs font-medium text-white">
                    {preset.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </TabsContent>

        {/* Custom Upload Tab */}
        <TabsContent value="custom" className="space-y-4">
          <Card className="border-2 border-dashed p-6">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-700">
                Upload a custom background
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, or WebP • Max 8MB
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Choose File"
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </Card>

          {customImageUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Current Custom Background
              </p>
              <div className="relative h-32 overflow-hidden rounded-lg border border-gray-300">
                <img
                  src={customImageUrl}
                  alt="Custom background"
                  className="h-full w-full object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveCustom}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Remove Custom Background
                  </>
                )}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Blur and Dim Controls */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="blur-slider" className="text-sm font-medium">
            Blur Effect: {blur}px
          </Label>
          <Slider
            id="blur-slider"
            min={0}
            max={24}
            step={1}
            value={[blur]}
            onValueChange={(value) => setBlur(value[0])}
            className="mt-2"
          />
          <p className="mt-1 text-xs text-gray-500">
            Adds blur to the background image (0-24px)
          </p>
        </div>

        <div>
          <Label htmlFor="dim-slider" className="text-sm font-medium">
            Dim Overlay: {dim}%
          </Label>
          <Slider
            id="dim-slider"
            min={0}
            max={70}
            step={1}
            value={[dim]}
            onValueChange={(value) => setDim(value[0])}
            className="mt-2"
          />
          <p className="mt-1 text-xs text-gray-500">
            Darkens the background with a black overlay (0-70%)
          </p>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSaveSettings}
        disabled={isLoading || updateBackgroundMutation.isPending}
        className="w-full"
      >
        {isLoading || updateBackgroundMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Background Settings"
        )}
      </Button>
    </div>
  );
}
