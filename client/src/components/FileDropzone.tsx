import React, { useCallback, useState } from 'react';
import { Upload, File, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in bytes
  isLoading?: boolean;
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/pdf',
  'image/png',
  'image/jpeg',
];

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function FileDropzone({
  onFileSelected,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSize = DEFAULT_MAX_SIZE,
  isLoading = false,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Accepted types: ${getAcceptedTypesLabel()}`;
    }

    if (file.size > maxSize) {
      return `File size exceeds ${formatBytes(maxSize)}`;
    }

    return null;
  };

  const handleFile = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const getAcceptedTypesLabel = (): string => {
    const typeMap: Record<string, string> = {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
      'application/vnd.ms-excel': 'Excel',
      'text/csv': 'CSV',
      'application/pdf': 'PDF',
      'image/png': 'PNG',
      'image/jpeg': 'JPEG',
    };

    return acceptedTypes
      .map((type) => typeMap[type] || type)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(', ');
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (file: File): React.ReactNode => {
    const type = file.type;
    if (type.includes('spreadsheet') || type === 'text/csv' || type.includes('excel')) {
      return '📊';
    } else if (type.includes('pdf')) {
      return '📄';
    } else if (type.includes('image')) {
      return '🖼️';
    }
    return <File className="w-6 h-6" />;
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          onChange={handleInputChange}
          accept={acceptedTypes.join(',')}
          disabled={isLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <div className="text-3xl">{getFileIcon(selectedFile)}</div>
            <div className="text-left">
              <p className="font-medium text-slate-900">{selectedFile.name}</p>
              <p className="text-sm text-slate-600">
                {formatBytes(selectedFile.size)}
              </p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-green-600 ml-auto" />
          </div>
        ) : (
          <div>
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-medium text-slate-900">
              Drag and drop your file here
            </p>
            <p className="text-sm text-slate-600 mt-1">
              or click to browse
            </p>
            <p className="text-xs text-slate-500 mt-3">
              Supported formats: {getAcceptedTypesLabel()}
            </p>
            <p className="text-xs text-slate-500">
              Max file size: {formatBytes(maxSize)}
            </p>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
