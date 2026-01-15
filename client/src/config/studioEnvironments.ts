/**
 * Studio Environment Configuration
 * Complete environment definitions with both thumbnails and backgrounds
 * All assets imported through bundler for proper resolution
 */

// Thumbnail imports
import martialArtsDojoThumb from '@/assets/environments/martial-arts-dojo-thumb.jpg';
import kidsDojoThumb from '@/assets/environments/kids-dojo-thumb.jpg';
import zenStudioThumb from '@/assets/environments/zen-studio-thumb.jpg';
import luxuryGymThumb from '@/assets/environments/luxury-gym-thumb.jpg';
import kickboxingFloorThumb from '@/assets/environments/kickboxing-floor-thumb.jpg';
import customUploadThumb from '@/assets/environments/custom-upload-thumb.jpg';

// Background imports
import martialArtsDojoBg from '@/assets/environments/martial-arts-dojo-bg.jpg';
import kidsDojoBg from '@/assets/environments/kids-dojo-bg.jpg';
import zenStudioBg from '@/assets/environments/zen-studio-bg.jpg';
import luxuryGymBg from '@/assets/environments/luxury-gym-bg.jpg';
import kickboxingFloorBg from '@/assets/environments/kickboxing-floor-bg.jpg';
import customUploadBg from '@/assets/environments/custom-upload-bg.jpg';

export interface StudioEnvironmentDefaults {
  lighting?: {
    blur?: number;
    glow?: number;
  };
  atmosphere?: {
    opacity?: number;
    saturation?: number;
  };
  depth?: {
    shadow?: number;
    border?: number;
  };
  accents?: {
    radius?: number;
    glow?: number;
  };
}

export interface StudioEnvironment {
  id: string;
  name: string;
  description: string;
  thumbnail: string; // Bundled thumbnail image
  background: string; // Bundled background image
  defaults: StudioEnvironmentDefaults;
}

export const STUDIO_ENVIRONMENTS: StudioEnvironment[] = [
  {
    id: 'martial-arts-dojo',
    name: 'Martial Arts Dojo',
    description: 'Professional martial arts training environment',
    thumbnail: martialArtsDojoThumb,
    background: martialArtsDojoBg,
    defaults: {
      lighting: { blur: 16, glow: 0 },
      atmosphere: { opacity: 65, saturation: 0 },
      depth: { shadow: 0, border: 0 },
      accents: { radius: 0, glow: 100 },
    },
  },
  {
    id: 'kids-dojo',
    name: 'Kids Dojo',
    description: 'Vibrant and energetic for youth programs',
    thumbnail: kidsDojoThumb,
    background: kidsDojoBg,
    defaults: {
      lighting: { blur: 12, glow: 8 },
      atmosphere: { opacity: 70, saturation: 20 },
      depth: { shadow: 5, border: 2 },
      accents: { radius: 8, glow: 120 },
    },
  },
  {
    id: 'zen-studio',
    name: 'Zen Studio',
    description: 'Calm and balanced aesthetic',
    thumbnail: zenStudioThumb,
    background: zenStudioBg,
    defaults: {
      lighting: { blur: 20, glow: 5 },
      atmosphere: { opacity: 60, saturation: -10 },
      depth: { shadow: 2, border: 1 },
      accents: { radius: 12, glow: 80 },
    },
  },
  {
    id: 'luxury-gym',
    name: 'Luxury Gym',
    description: 'Premium and sophisticated look',
    thumbnail: luxuryGymThumb,
    background: luxuryGymBg,
    defaults: {
      lighting: { blur: 14, glow: 2 },
      atmosphere: { opacity: 75, saturation: 5 },
      depth: { shadow: 8, border: 3 },
      accents: { radius: 4, glow: 60 },
    },
  },
  {
    id: 'kickboxing-floor',
    name: 'Kickboxing Floor',
    description: 'High-energy combat sports environment',
    thumbnail: kickboxingFloorThumb,
    background: kickboxingFloorBg,
    defaults: {
      lighting: { blur: 10, glow: 12 },
      atmosphere: { opacity: 80, saturation: 15 },
      depth: { shadow: 6, border: 2 },
      accents: { radius: 6, glow: 140 },
    },
  },
  {
    id: 'custom-upload',
    name: 'Custom Upload',
    description: 'Upload your own cinematic background',
    thumbnail: customUploadThumb,
    background: customUploadBg,
    defaults: {
      lighting: { blur: 16, glow: 0 },
      atmosphere: { opacity: 65, saturation: 0 },
      depth: { shadow: 0, border: 0 },
      accents: { radius: 0, glow: 100 },
    },
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
  return env?.thumbnail;
}

/**
 * Get background image for environment
 */
export function getEnvironmentBackground(id: string): string | undefined {
  const env = getEnvironmentById(id);
  return env?.background;
}

/**
 * Get defaults for environment
 */
export function getEnvironmentDefaults(id: string): StudioEnvironmentDefaults | undefined {
  const env = getEnvironmentById(id);
  return env?.defaults;
}
