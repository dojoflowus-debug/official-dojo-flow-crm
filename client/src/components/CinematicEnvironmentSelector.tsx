/**
 * CinematicEnvironmentSelector - Premium environment selection for studio control
 * Displays 6 cinematic environments with real img tags and bundled asset imports
 */

import React, { useState } from 'react';
import { STUDIO_ENVIRONMENTS, getEnvironmentBackground } from '@/config/studioEnvironments';
import { KIOSK_BACKGROUND_PRESETS } from '../../../shared/kioskBackgroundPresets';

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
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleEnvironmentClick = (envId: string) => {
    if (envId === 'custom-upload') {
      // Trigger file upload
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
      // Find the environment and get its bundled background image
      const env = STUDIO_ENVIRONMENTS.find(e => e.id === envId);
      if (env) {
        console.log(`[CinematicEnvironmentSelector] Selected environment: ${envId}, background: ${env.background}`);
        onEnvironmentSelect(envId, env.background);
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
    // Remove from error set if it was previously errored
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
      <div className="grid grid-cols-2 gap-3">
        {STUDIO_ENVIRONMENTS.map(env => {
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
                    src={env.thumbnail}
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

      {/* Info text */}
      <p className="text-xs text-gray-500">
        Environments set the mood and lighting baseline for your kiosk display.
      </p>

      {/* Debug info - show loaded count */}
      {loadedImages.size > 0 && (
        <p className="text-xs text-gray-600">
          Loaded {loadedImages.size}/{STUDIO_ENVIRONMENTS.length} thumbnails
        </p>
      )}
    </div>
  );
}
