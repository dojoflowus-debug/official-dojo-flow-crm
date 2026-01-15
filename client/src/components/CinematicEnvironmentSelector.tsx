/**
 * CinematicEnvironmentSelector - Premium environment selection for studio control
 * Displays 6 cinematic backgrounds as primary feature with bundled images and fallback states
 */

import React, { useState } from 'react';
import { STUDIO_ENVIRONMENTS, getEnvironmentById } from '@/config/studioEnvironments';
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
      // Find the preset and get its image URL
      const preset = KIOSK_BACKGROUND_PRESETS.find(p => p.id === envId);
      if (preset) {
        onEnvironmentSelect(envId, preset.imageUrl);
      }
    }
  };

  const handleImageError = (envId: string) => {
    console.error(`[CinematicEnvironmentSelector] Failed to load thumbnail for environment: ${envId}`);
    setImageErrors(prev => new Set(prev).add(envId));
  };

  const handleImageLoad = (envId: string) => {
    console.log(`[CinematicEnvironmentSelector] Successfully loaded thumbnail for environment: ${envId}`);
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

      {/* Environment Grid - Visually Dominant */}
      <div className="grid grid-cols-2 gap-3">
        {STUDIO_ENVIRONMENTS.map(env => {
          const isSelected = selectedEnvironmentId === env.id;
          const hasImageError = imageErrors.has(env.id);
          const preset = KIOSK_BACKGROUND_PRESETS.find(p => p.id === env.id);
          const backgroundImageUrl = preset?.imageUrl || '';

          return (
            <button
              key={env.id}
              onClick={() => handleEnvironmentClick(env.id)}
              className={`relative h-32 rounded-lg overflow-hidden transition-all ${
                isSelected
                  ? 'ring-2 ring-red-500 shadow-lg shadow-red-500/50'
                  : 'ring-1 ring-white/10 hover:ring-white/20'
              }`}
              title={env.description}
            >
              {/* Thumbnail Image - Real img element */}
              {!hasImageError ? (
                <img
                  src={env.thumbnailImage}
                  alt={env.name}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(env.id)}
                  onLoad={() => handleImageLoad(env.id)}
                />
              ) : (
                /* Fallback: Dark card with environment name */
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-white">{env.name}</p>
                    <p className="text-xs text-gray-400 mt-1">Image unavailable</p>
                  </div>
                </div>
              )}

              {/* Overlay with name */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                <p className="text-xs font-semibold text-white">{env.name}</p>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info text */}
      <p className="text-xs text-gray-500">
        Environments set the mood and lighting baseline for your kiosk display.
      </p>
    </div>
  );
}
