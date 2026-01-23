/**
 * CinematicEnvironmentSelector - Premium environment selection for studio control
 * Displays 6 cinematic environments with real img tags and bundled asset imports
 */

import React, { useState, useEffect } from 'react';
import { KIOSK_ENVIRONMENTS } from '@shared/kioskEnvironments';
import { KIOSK_BACKGROUND_PRESETS } from '@shared/kioskBackgroundPresets';
import { useAuth } from '@/hooks/useAuth';

interface CustomBackground {
  id: number;
  name: string;
  thumbnailUrl: string;
  imageUrl: string;
}

interface CinematicEnvironmentSelectorProps {
  selectedEnvironmentId?: string;
  onEnvironmentSelect: (environmentId: string, imageUrl: string) => void;
  onCustomUpload?: (file: File) => void;
}

export function CinematicEnvironmentSelector({
  selectedEnvironmentId,
  onEnvironmentSelect,
  onCustomUpload,
}: CinematicEnvironmentSelectorProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [customBackgrounds, setCustomBackgrounds] = useState<CustomBackground[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCustomTab, setShowCustomTab] = useState(false);
  const [organizationId, setOrganizationId] = useState<number | null>(null);

  useEffect(() => {
    if (user && user.activeOrgId) {
      setOrganizationId(user.activeOrgId);
      loadCustomBackgrounds();
    }
  }, [user]);

  const loadCustomBackgrounds = async () => {
    if (!user || !user.activeOrgId) return;
    
    try {
      const response = await fetch(
        `/api/custom-backgrounds/list/${user.activeOrgId}/${user.id}`
      );
      if (response.ok) {
        const backgrounds = await response.json();
        setCustomBackgrounds(backgrounds);
      } else {
        console.error('[CinematicEnvironmentSelector] Failed to load custom backgrounds:', response.statusText);
      }
    } catch (error) {
      console.error('[CinematicEnvironmentSelector] Failed to load custom backgrounds:', error);
    }
  };



  const handleFileUpload = async (file: File) => {
    if (!user || !organizationId) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        const response = await fetch('/api/custom-backgrounds/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: organizationId,
            userId: user.id,
            name: file.name.replace(/\.[^/.]+$/, ''),
            file: base64,
            mimeType: file.type,
          }),
        });

        if (response.ok) {
          const newBackground = await response.json();
          setCustomBackgrounds([...customBackgrounds, newBackground]);
          onEnvironmentSelect(`custom-${newBackground.id}`, newBackground.imageUrl);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('[CinematicEnvironmentSelector] Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteBackground = async (backgroundId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user || !organizationId) return;
    
    if (!confirm('Are you sure you want to delete this background?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/custom-backgrounds/${backgroundId}/${organization.id}/${user.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setCustomBackgrounds(customBackgrounds.filter(bg => bg.id !== backgroundId));
        console.log('[CinematicEnvironmentSelector] Background deleted successfully');
      }
    } catch (error) {
      console.error('[CinematicEnvironmentSelector] Delete failed:', error);
    }
  };

  const handleEnvironmentClick = (envId: string) => {
    if (envId === 'custom-upload') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && onCustomUpload) {
          onCustomUpload(file);
        }
      };
      input.click();
    } else {
      const env = KIOSK_ENVIRONMENTS.find(e => e.id === envId);
      if (env) {
        console.log(`[CinematicEnvironmentSelector] Selected environment: ${envId}, background: ${env.backgroundImageUrl}`);
        onEnvironmentSelect(envId, env.backgroundImageUrl);
      }
    }
  };

  const handleImageError = (envId: string) => {
    console.error(
      `[CinematicEnvironmentSelector] Failed to load thumbnail for environment: ${envId}`,
      `Expected asset path: /assets/environments/${envId}-thumb.jpg`
    );
    setImageErrors(prev => new Set(prev).add(envId));
  };

  const handleImageLoad = (envId: string) => {
    console.log(`[CinematicEnvironmentSelector] Successfully loaded thumbnail for environment: ${envId}`);
    setLoadedImages(prev => new Set(prev).add(envId));
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(envId);
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-white">Studio Environment</h3>
        <p className="text-xs mt-1" style={{color: 'rgba(255,255,255,0.4)'}}>
          Select the cinematic backdrop for your kiosk
        </p>
      </div>

      {/* Tabs for Presets and Custom */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowCustomTab(false)}
          className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
            !showCustomTab
              ? 'bg-red-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setShowCustomTab(true)}
          className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
            showCustomTab
              ? 'bg-red-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          My Uploads ({customBackgrounds.length})
        </button>
      </div>

      {/* Environment Grid - Visually Dominant with Real Images */}
      <style>{`
        @keyframes zoomIn {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.08);
          }
        }
        .env-thumbnail {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .env-thumbnail:hover {
          animation: zoomIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>

      {!showCustomTab ? (
      <div className="grid grid-cols-2 gap-3">
        {KIOSK_ENVIRONMENTS.map(env => {
          const isSelected = selectedEnvironmentId === env.id;
          const hasImageError = imageErrors.has(env.id);
          const isLoaded = loadedImages.has(env.id);

          return (
            <button
              key={env.id}
              onClick={() => handleEnvironmentClick(env.id)}
              className={`env-thumbnail relative h-32 rounded-lg overflow-hidden transition-all ${
                isSelected
                  ? 'ring-2 ring-red-500 shadow-lg shadow-red-500/50'
                  : 'ring-1 ring-white/10 hover:ring-white/20'
              }`}
              title={env.description}
            >
              {/* Real IMG Element - Thumbnail */}
              {!hasImageError ? (
                <>
                  <img
                    src={env.thumbnailPath}
                    alt={env.name}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(env.id)}
                    onLoad={() => handleImageLoad(env.id)}
                  />
                  {/* Loading indicator */}
                  {!isLoaded && (
                    <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                      <div className="text-xs text-gray-400">Loading...</div>
                    </div>
                  )}
                </>
              ) : (
                /* Fallback: Dark card with environment name and error message */
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex flex-col items-center justify-center p-2">
                  <p className="text-xs font-semibold text-white text-center">{env.name}</p>
                  <p className="text-xs text-red-400 mt-1 text-center">Asset failed to load</p>
                </div>
              )}

              {/* Bottom Gradient Bar with Environment Name */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent px-3 py-2">
                <p className="text-xs font-semibold text-white truncate">{env.name}</p>
              </div>

              {/* Selected State: Red Border + Selected Pill */}
              {isSelected && (
                <>
                  <div className="absolute inset-0 border-2 border-red-500 rounded-lg pointer-events-none" />
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Selected
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
      ) : (
      <div className="space-y-3">
        {/* Upload Button */}
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFileUpload(file);
            };
            input.click();
          }}
          disabled={isUploading}
          className="w-full py-2 px-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white text-sm font-semibold rounded transition-all"
        >
          {isUploading ? 'Uploading...' : '+ Upload Custom Background'}
        </button>

        {/* Custom Backgrounds Grid */}
        {customBackgrounds.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {customBackgrounds.map(bg => (
              <div
                key={bg.id}
                className="relative group"
              >
                <button
                  onClick={() => onEnvironmentSelect(`custom-${bg.id}`, bg.imageUrl)}
                  className={`env-thumbnail relative w-full h-32 rounded-lg overflow-hidden transition-all ${
                    selectedEnvironmentId === `custom-${bg.id}`
                      ? 'ring-2 ring-red-500 shadow-lg shadow-red-500/50'
                      : 'ring-1 ring-white/10 hover:ring-white/20'
                  }`}
                  title={bg.name}
                >
                  <img
                    src={bg.thumbnailUrl}
                    alt={bg.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent px-3 py-2">
                    <p className="text-xs font-semibold text-white truncate">{bg.name}</p>
                  </div>
                  {selectedEnvironmentId === `custom-${bg.id}` && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Selected
                    </div>
                  )}
                </button>
                
                {/* Delete Button - Visible on Hover */}
                <button
                  onClick={(e) => handleDeleteBackground(bg.id, e)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 z-10"
                  title="Delete this background"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">No custom backgrounds yet</p>
            <p className="text-xs text-gray-500 mt-1">Upload your first background to get started</p>
          </div>
        )}
      </div>
      )}

      {/* Info text */}
      <p className="text-xs text-gray-500 mt-4">
        {showCustomTab
          ? 'Upload your own images to customize your kiosk backdrop'
          : 'Environments set the mood and lighting baseline for your kiosk display.'}
      </p>
    </div>
  );
}
