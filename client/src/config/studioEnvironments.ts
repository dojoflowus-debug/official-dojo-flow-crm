/**
 * Studio Environment Configuration
 * Defines all available environments with bundled image imports
 */

import martialArtsDojoThumb from '@/assets/environments/martial-arts-dojo-thumb.jpg';
import kidsDojoThumb from '@/assets/environments/kids-dojo-thumb.jpg';
import zenStudioThumb from '@/assets/environments/zen-studio-thumb.jpg';
import luxuryGymThumb from '@/assets/environments/luxury-gym-thumb.jpg';
import kickboxingFloorThumb from '@/assets/environments/kickboxing-floor-thumb.jpg';
import customUploadThumb from '@/assets/environments/custom-upload-thumb.jpg';

export interface StudioEnvironment {
  id: string;
  name: string;
  description: string;
  thumbnailImage: string; // Bundled image path
  backgroundImage?: string; // Optional: different image for full background
}

export const STUDIO_ENVIRONMENTS: StudioEnvironment[] = [
  {
    id: 'martial-arts-dojo',
    name: 'Martial Arts Dojo',
    description: 'Professional martial arts training environment',
    thumbnailImage: martialArtsDojoThumb,
  },
  {
    id: 'kids-dojo',
    name: 'Kids Dojo',
    description: 'Vibrant and energetic for youth programs',
    thumbnailImage: kidsDojoThumb,
  },
  {
    id: 'zen-studio',
    name: 'Zen Studio',
    description: 'Calm and balanced aesthetic',
    thumbnailImage: zenStudioThumb,
  },
  {
    id: 'luxury-gym',
    name: 'Luxury Gym',
    description: 'Premium and sophisticated look',
    thumbnailImage: luxuryGymThumb,
  },
  {
    id: 'kickboxing-floor',
    name: 'Kickboxing Floor',
    description: 'High-energy combat sports environment',
    thumbnailImage: kickboxingFloorThumb,
  },
  {
    id: 'custom-upload',
    name: 'Custom Upload',
    description: 'Upload your own cinematic background',
    thumbnailImage: customUploadThumb,
  },
];

/**
 * Get environment by ID
 */
export function getEnvironmentById(id: string): StudioEnvironment | undefined {
  return STUDIO_ENVIRONMENTS.find(env => env.id === id);
}

/**
 * Get thumbnail image for environment
 */
export function getEnvironmentThumbnail(id: string): string | undefined {
  const env = getEnvironmentById(id);
  return env?.thumbnailImage;
}
