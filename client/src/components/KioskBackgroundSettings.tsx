import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Upload, Trash2, RotateCw } from 'lucide-react';
import type { KioskSettings } from '../../../drizzle/schema';

interface KioskBackgroundSettingsProps {
  locationId: number;
  locationSlug: string;
}

const PRESETS = [
  { key: 'dojo-warm-lights', name: 'Dojo Warm Lights' },
  { key: 'clean-modern-gym', name: 'Clean Modern Gym' },
  { key: 'kids-class-bright', name: 'Kids Class Bright' },
];

export function KioskBackgroundSettings({ locationId, locationSlug }: KioskBackgroundSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [blur, setBlur] = useState(0);
  const [dim, setDim] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: settingsData } = trpc.kioskSettings.getSettings.useQuery({ locationSlug });
  const uploadMutation = trpc.kioskSettings.uploadBackgroundImage.useMutation({
    onSuccess: (data) => {
      toast.success('Background image uploaded');
      setPreviewUrl(data.url);
      setBlur(0);
      setDim(0);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload image');
    },
  });

  const updateEffectsMutation = trpc.kioskSettings.updateBackgroundEffects.useMutation({
    onSuccess: () => {
      toast.success('Background effects updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update effects');
    },
  });

  const resetMutation = trpc.kioskSettings.resetBackground.useMutation({
    onSuccess: () => {
      toast.success('Background reset to default');
      setPreviewUrl(null);
      setBlur(0);
      setDim(0);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reset background');
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('File size must be less than 8MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP files are supported');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      uploadMutation.mutate({
        locationId,
        fileName: file.name,
        fileData: base64Data,
        mimeType: file.type,
        blur,
        dim,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleBlurChange = (value: number) => {
    setBlur(value);
    if (settingsData?.settings?.background?.imageUrl) {
      updateEffectsMutation.mutate({ locationId, blur: value, dim });
    }
  };

  const handleDimChange = (value: number) => {
    setDim(value);
    if (settingsData?.settings?.background?.imageUrl) {
      updateEffectsMutation.mutate({ locationId, blur, dim: value });
    }
  };

  const currentSettings = settingsData?.settings;
  const currentImageUrl = previewUrl || currentSettings?.background?.imageUrl;

  return (
    <div className="space-y-4">
      {/* Background Preview */}
      <Card className="p-4 border-border/50">
        <h4 className="font-medium text-sm mb-3">Background Preview</h4>
        <div
          className="w-full h-48 rounded-lg border-2 border-dashed border-border bg-background/50 flex items-center justify-center overflow-hidden relative"
          style={{
            backgroundImage: currentImageUrl ? `url(${currentImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {currentImageUrl && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: `rgba(0, 0, 0, ${dim / 100})`,
                filter: `blur(${blur}px)`,
              }}
            />
          )}
          {!currentImageUrl && (
            <p className="text-foreground/50 text-sm">No background image</p>
          )}
        </div>
      </Card>

      {/* Upload Section */}
      <Card className="p-4 border-border/50">
        <h4 className="font-medium text-sm mb-3">Upload Background</h4>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploadMutation.isPending ? 'Uploading...' : 'Upload Image'}
        </Button>
      </Card>

      {/* Presets Section */}
      <Card className="p-4 border-border/50">
        <h4 className="font-medium text-sm mb-3">Presets</h4>
        <div className="space-y-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.key}
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => resetMutation.mutate({ locationId, presetKey: preset.key })}
              disabled={resetMutation.isPending}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </Card>

      {/* Effects Section */}
      {currentImageUrl && (
        <Card className="p-4 border-border/50">
          <h4 className="font-medium text-sm mb-4">Effects</h4>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Blur ({blur}px)</Label>
              <Input
                type="range"
                min="0"
                max="24"
                value={blur}
                onChange={(e) => handleBlurChange(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Dim Overlay ({dim}%)</Label>
              <Input
                type="range"
                min="0"
                max="70"
                value={dim}
                onChange={(e) => handleDimChange(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Reset Button */}
      {currentImageUrl && (
        <Button
          variant="destructive"
          size="sm"
          className="w-full justify-start"
          onClick={() => resetMutation.mutate({ locationId })}
          disabled={resetMutation.isPending}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remove Background
        </Button>
      )}
    </div>
  );
}
