import React, { useState } from 'react';
import { updateKioskBranding } from '@/lib/kioskConfigProvider';

interface LogoUploadSectionProps {
  locationId: string;
  deviceType: string;
  logoDataUrl?: string;
  onLogoChange: (logoDataUrl?: string) => void;
}

export function LogoUploadSection({
  locationId,
  deviceType,
  logoDataUrl,
  onLogoChange,
}: LogoUploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG, JPG, or SVG file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const dataUrl = e.target?.result as string;
        updateKioskBranding(locationId, deviceType, { logoDataUrl: dataUrl }).then(() => {
          onLogoChange(dataUrl);
          setUploading(false);
        });
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to upload logo');
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      await updateKioskBranding(locationId, deviceType, { logoDataUrl: undefined });
      onLogoChange(undefined);
      setError(null);
    } catch (err) {
      setError('Failed to remove logo');
    }
  };

  return (
    <div className="space-y-4 p-4 bg-slate-700 rounded-lg">
      <div>
        <h3 className="text-white font-bold text-lg mb-2">School Logo</h3>
        <p className="text-slate-300 text-sm mb-4">
          Upload your school logo (PNG, JPG, or SVG). Max 2MB.
        </p>
      </div>

      {logoDataUrl ? (
        <div className="flex items-center justify-center bg-slate-600 rounded-lg p-6 mb-4">
          <img
            src={logoDataUrl}
            alt="School Logo"
            className="max-w-full max-h-32 object-contain"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center bg-slate-600 rounded-lg p-6 mb-4 border-2 border-dashed border-slate-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📸</div>
            <p className="text-slate-400 text-sm">Upload your logo</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <label className="block">
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <button
          onClick={(e) => {
            const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
            input?.click();
          }}
          disabled={uploading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-all"
        >
          {uploading ? 'Uploading...' : logoDataUrl ? 'Replace Logo' : 'Upload Logo'}
        </button>
      </label>

      {logoDataUrl && (
        <button
          onClick={handleRemove}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-all"
        >
          Remove Logo
        </button>
      )}
    </div>
  );
}
