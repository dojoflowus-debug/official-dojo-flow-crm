import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, Sun, Moon } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface LogoUploadProps {
  lightModeUrl?: string;
  darkModeUrl?: string;
  onLightModeUpload?: (url: string) => void;
  onDarkModeUpload?: (url: string) => void;
}

export default function LogoUpload({
  lightModeUrl,
  darkModeUrl,
  onLightModeUpload,
  onDarkModeUpload,
}: LogoUploadProps) {
  const [lightPreview, setLightPreview] = useState<string>(lightModeUrl || '');
  const [darkPreview, setDarkPreview] = useState<string>(darkModeUrl || '');
  const [lightUploading, setLightUploading] = useState(false);
  const [darkUploading, setDarkUploading] = useState(false);

  const uploadLogoMutation = trpc.setupWizard.uploadLogo.useMutation();

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/png')) {
      return 'Please upload a PNG image file';
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }

    return null;
  };

  const handleFileUpload = async (
    file: File,
    mode: 'light' | 'dark'
  ) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    const isLight = mode === 'light';
    const setUploading = isLight ? setLightUploading : setDarkUploading;
    const setPreview = isLight ? setLightPreview : setDarkPreview;
    const onUpload = isLight ? onLightModeUpload : onDarkModeUpload;

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          
          // Upload to S3 via backend
          const result = await uploadLogoMutation.mutateAsync({
            mode,
            fileData: base64,
            fileName: file.name,
          });

          setPreview(result.url);
          if (onUpload) {
            onUpload(result.url);
          }
        } catch (error) {
          console.error('Upload error:', error);
          alert('Failed to upload logo. Please try again.');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File read error:', error);
      alert('Failed to read file. Please try again.');
      setUploading(false);
    }
  };

  const handleClear = (mode: 'light' | 'dark') => {
    if (mode === 'light') {
      setLightPreview('');
      if (onLightModeUpload) {
        onLightModeUpload('');
      }
    } else {
      setDarkPreview('');
      if (onDarkModeUpload) {
        onDarkModeUpload('');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base">Logo Upload</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Upload PNG images for your logo. You'll need separate logos optimized for light and dark backgrounds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Light Mode Logo */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-yellow-500" />
            <Label className="text-sm font-medium">Light Mode Logo</Label>
          </div>
          
          {lightPreview ? (
            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-white">
              <img
                src={lightPreview}
                alt="Light mode logo preview"
                className="max-h-32 mx-auto object-contain"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleClear('light')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-primary transition-colors bg-white">
              <input
                type="file"
                accept="image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file, 'light');
                  }
                }}
                disabled={lightUploading}
              />
              {lightUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Click to upload</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, max 5MB</span>
                </>
              )}
            </label>
          )}
        </div>

        {/* Dark Mode Logo */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-blue-500" />
            <Label className="text-sm font-medium">Dark Mode Logo</Label>
          </div>
          
          {darkPreview ? (
            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-900">
              <img
                src={darkPreview}
                alt="Dark mode logo preview"
                className="max-h-32 mx-auto object-contain"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleClear('dark')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-primary transition-colors bg-gray-900">
              <input
                type="file"
                accept="image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file, 'dark');
                  }
                }}
                disabled={darkUploading}
              />
              {darkUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-300">Click to upload</span>
                  <span className="text-xs text-gray-500 mt-1">PNG, max 5MB</span>
                </>
              )}
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
