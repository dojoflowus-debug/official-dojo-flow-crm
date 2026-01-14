import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { trpc } from '../lib/trpc';

interface KioskBackgroundUploadProps {
  kioskId: number;
  onUploadComplete: (url: string) => void;
  onError: (message: string) => void;
}

export const KioskBackgroundUpload: React.FC<KioskBackgroundUploadProps> = ({
  kioskId,
  onUploadComplete,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const uploadMutation = trpc.kioskDevice.uploadBackground.useMutation({
    onSuccess: (data) => {
      setIsUploading(false);
      setPreview(null);
      onUploadComplete(data.url);
    },
    onError: (error) => {
      setIsUploading(false);
      onError(error.message || 'Upload failed');
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError('Image must be smaller than 5MB');
      return;
    }

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreview(dataUrl);
      };
      reader.readAsDataURL(file);

      // Convert to base64 for upload
      const base64Reader = new FileReader();
      base64Reader.onload = async () => {
        const base64String = (base64Reader.result as string).split(',')[1];
        setIsUploading(true);
        await uploadMutation.mutateAsync({
          kioskId,
          imageData: base64String,
          fileName: file.name,
        });
      };
      base64Reader.readAsDataURL(file);
    } catch (error) {
      onError('Failed to process image');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-300">Upload Custom Background</label>
      </div>

      {preview && (
        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-600">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 p-1 bg-black/50 rounded hover:bg-black/70 transition-colors"
            disabled={isUploading}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-3 py-2 bg-accent hover:bg-accent/90 disabled:bg-muted text-white rounded-lg transition-colors text-sm"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? 'Uploading...' : 'Choose Image'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
};
