import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Upload, X, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (base64Data: string, mimeType: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  currentPhotoUrl?: string | null;
  onRemovePhoto?: () => Promise<void>;
  isRemovingPhoto?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PhotoUploadModal({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  error = null,
  currentPhotoUrl,
  onRemovePhoto,
  isRemovingPhoto = false,
  onSuccess,
  onError,
}: PhotoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [initialCropState, setInitialCropState] = useState({ x: 0, y: 0, zoom: 1 });
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreview(null);
      setCropPosition({ x: 0, y: 0 });
      setCropZoom(1);
      setInitialCropState({ x: 0, y: 0, zoom: 1 });
      setHasChanges(false);
    }
  }, [isOpen]);

  // Detect changes in crop parameters or new file
  useEffect(() => {
    if (!selectedFile) {
      setHasChanges(false);
      return;
    }

    const cropChanged = 
      cropPosition.x !== initialCropState.x ||
      cropPosition.y !== initialCropState.y ||
      cropZoom !== initialCropState.zoom;

    setHasChanges(true);
  }, [selectedFile, cropPosition, cropZoom, initialCropState]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && hasChanges && !isSaving) {
        handleSave();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasChanges, isSaving]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a JPG, PNG, or HEIC image');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'posX') {
      setCropPosition({ ...cropPosition, x: parseInt(value) });
    } else if (name === 'posY') {
      setCropPosition({ ...cropPosition, y: parseInt(value) });
    }
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCropZoom(parseFloat(e.target.value));
  };

  const cropAndCompress = async (): Promise<{ base64: string; mimeType: string } | null> => {
    if (!preview || !canvasRef.current) return null;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        // Set canvas to square (300x300)
        const size = 300;
        canvas.width = size;
        canvas.height = size;

        // Calculate source crop area
        const sourceSize = Math.min(img.width, img.height) / cropZoom;
        const sourceX = (img.width - sourceSize) / 2 + cropPosition.x;
        const sourceY = (img.height - sourceSize) / 2 + cropPosition.y;

        // Draw cropped and squared image
        ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

        // Compress to JPEG
        const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        resolve({ base64, mimeType: 'image/jpeg' });
      };
      img.src = preview;
    });
  };

  const handleSave = async () => {
    if (!selectedFile || !hasChanges) return;

    try {
      setIsSaving(true);
      const cropped = await cropAndCompress();
      if (!cropped) {
        const errorMsg = 'Failed to process image';
        onError?.(errorMsg);
        return;
      }

      await onSave(cropped.base64, cropped.mimeType);
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save photo';
      console.error('Error saving photo:', err);
      onError?.(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemovePhoto) return;
    if (!confirm('Are you sure you want to remove the photo?')) return;

    try {
      await onRemovePhoto();
      onClose();
    } catch (err) {
      console.error('Error removing photo:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border border-white/10">
        <DialogHeader>
          <DialogTitle>Change Student Photo</DialogTitle>
          <DialogDescription>
            Upload a new photo or adjust the existing one
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* File Input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isSaving}
            >
              <Upload className="w-4 h-4" />
              Choose Photo
            </Button>
          </div>

          {/* Preview and Crop */}
          {preview && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Preview (square crop)</div>

              {/* Crop Container */}
              <div
                ref={cropContainerRef}
                className="relative w-full aspect-square bg-black/20 rounded-lg overflow-hidden border border-white/10"
              >
                <img
                  src={preview}
                  alt="Crop preview"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    transform: `scale(${cropZoom}) translate(${cropPosition.x}px, ${cropPosition.y}px)`,
                    transformOrigin: 'center',
                  }}
                />
              </div>

              {/* Crop Controls */}
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground">Zoom</label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={cropZoom}
                    onChange={handleZoomChange}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Position X</label>
                    <input
                      type="range"
                      name="posX"
                      min="-100"
                      max="100"
                      step="5"
                      value={cropPosition.x}
                      onChange={handleCropChange}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Position Y</label>
                    <input
                      type="range"
                      name="posY"
                      min="-100"
                      max="100"
                      step="5"
                      value={cropPosition.y}
                      onChange={handleCropChange}
                      className="w-full"
                    />
                  </div>
                </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full gap-2"
              onClick={() => {
                setCropPosition({ x: 0, y: 0 });
                setCropZoom(1);
                setInitialCropState({ x: 0, y: 0, zoom: 1 });
              }}
            >
              <RotateCw className="w-4 h-4" />
              Reset
            </Button>
              </div>
            </div>
          )}

          {/* Hidden Canvas for Cropping */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <DialogFooter className="flex gap-2 justify-between">
          <div className="flex gap-2">
            {currentPhotoUrl && onRemovePhoto && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={isRemovingPhoto || isSaving}
              >
                Remove Photo
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading || isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || isLoading || isSaving}
              title={!hasChanges ? 'Make changes to enable save' : 'Save photo (Enter)'}
            >
              {isSaving ? 'Saving...' : 'Save Photo'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
