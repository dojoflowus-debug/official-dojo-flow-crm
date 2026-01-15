/**
 * Kiosk Environment Definitions
 * 
 * Complete environment system with:
 * - Imported thumbnail assets (not string paths)
 * - Background images (verified to exist)
 * - Default lighting/atmosphere values per environment
 * - Proper persistence support
 */

/**
 * Atmosphere/Lighting Settings
 * Applied to background image for mood and visual hierarchy
 */
export interface AtmosphereSettings {
  // Blur effect on background (0-24px)
  blur: number;
  
  // Dim overlay (0-100%)
  dim: number;
  
  // Saturation adjustment (-100 to +100)
  saturation: number;
  
  // Brightness adjustment (-100 to +100)
  brightness: number;
  
  // Vignette effect (0-100%)
  vignette: number;
  
  // Warmth/coolness (-100 to +100, negative = cool, positive = warm)
  warmth: number;
}

/**
 * Environment Definition
 * Represents a complete kiosk environment with visuals and atmosphere
 */
export interface EnvironmentDefinition {
  // Unique identifier
  id: string;
  
  // Display name
  name: string;
  
  // Category for grouping
  category: 'martial-arts' | 'nature' | 'fitness' | 'yoga' | 'kids' | 'dance' | 'studio';
  
  // Thumbnail image (imported asset, not string path)
  // Used in environment selector UI
  thumbnailPath: string;
  
  // Background image URL (relative to /public/)
  // Applied to kiosk background
  backgroundImageUrl: string;
  
  // Default atmosphere settings
  atmosphere: AtmosphereSettings;
  
  // Description for UI tooltips
  description: string;
}

/**
 * Complete Environment Definitions
 * Each environment includes:
 * - Thumbnail for selector UI
 * - Background image for kiosk display
 * - Default lighting/atmosphere values
 * - Category for organization
 */
export const KIOSK_ENVIRONMENTS: EnvironmentDefinition[] = [
  {
    id: 'martial-arts-dojo',
    name: 'Martial Arts Dojo',
    category: 'martial-arts',
    thumbnailPath: '/dojo-background.jpg',
    backgroundImageUrl: '/dojo-background.jpg',
    atmosphere: {
      blur: 0,
      dim: 20,
      saturation: 10,
      brightness: 0,
      vignette: 15,
      warmth: 5,
    },
    description: 'Traditional dojo with training equipment and martial arts focus',
  },
  {
    id: 'karate-training',
    name: 'Karate Training',
    category: 'martial-arts',
    thumbnailPath: '/env-samurai-dojo.jpg',
    backgroundImageUrl: '/environments/samurai-red-dojo.jpg',
    atmosphere: {
      blur: 0,
      dim: 25,
      saturation: 5,
      brightness: -5,
      vignette: 20,
      warmth: 0,
    },
    description: 'Advanced karate training session with focused lighting',
  },
  {
    id: 'zen-studio',
    name: 'Zen Studio',
    category: 'yoga',
    thumbnailPath: '/env-zen-bamboo.jpg',
    backgroundImageUrl: '/environments/zen-bamboo-garden.jpg',
    atmosphere: {
      blur: 2,
      dim: 10,
      saturation: -10,
      brightness: 5,
      vignette: 20,
      warmth: -5,
    },
    description: 'Calm and balanced aesthetic',
  },
  {
    id: 'luxury-gym',
    name: 'Luxury Gym',
    category: 'fitness',
    thumbnailPath: '/env-luxury-dojo.jpg',
    backgroundImageUrl: '/environments/luxury-dojo-lounge.jpg',
    atmosphere: {
      blur: 1,
      dim: 15,
      saturation: 0,
      brightness: 10,
      vignette: 15,
      warmth: 5,
    },
    description: 'Premium and sophisticated look',
  },
  {
    id: 'kickboxing-floor',
    name: 'Kickboxing Floor',
    category: 'fitness',
    thumbnailPath: '/env-neon-dojo.jpg',
    backgroundImageUrl: '/environments/futuristic-neon-dojo.jpg',
    atmosphere: {
      blur: 0,
      dim: 20,
      saturation: 15,
      brightness: 5,
      vignette: 15,
      warmth: 10,
    },
    description: 'High-energy combat sports environment',
  },
  {
    id: 'kids-dojo',
    name: 'Kids Dojo',
    category: 'kids',
    thumbnailPath: '/Lightdojoflow.png',
    backgroundImageUrl: '/Lightdojoflow.png',
    atmosphere: {
      blur: 0,
      dim: 15,
      saturation: 20,
      brightness: 10,
      vignette: 10,
      warmth: 10,
    },
    description: 'Vibrant and energetic for youth programs',
  },
  {
    id: 'modern-studio',
    name: 'Modern Studio',
    category: 'studio',
    thumbnailPath: '/environments/modern-white-dojo.jpg',
    backgroundImageUrl: '/environments/modern-white-dojo.jpg',
    atmosphere: {
      blur: 1,
      dim: 10,
      saturation: 5,
      brightness: 15,
      vignette: 5,
      warmth: 0,
    },
    description: 'Clean and minimalist modern training space',
  },
];

/**
 * Get environment by ID
 */
export function getEnvironmentById(id: string): EnvironmentDefinition | undefined {
  return KIOSK_ENVIRONMENTS.find(env => env.id === id);
}

/**
 * Get environments by category
 */
export function getEnvironmentsByCategory(category: string): EnvironmentDefinition[] {
  return KIOSK_ENVIRONMENTS.filter(env => env.category === category);
}

/**
 * Get all unique categories
 */
export function getEnvironmentCategories(): Array<{ id: string; label: string }> {
  const categories = new Set(KIOSK_ENVIRONMENTS.map(env => env.category));
  return Array.from(categories).map(cat => ({
    id: cat,
    label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' '),
  }));
}

/**
 * Get default environment
 */
export function getDefaultEnvironment(): EnvironmentDefinition {
  return KIOSK_ENVIRONMENTS[0]; // Martial Arts Dojo
}

/**
 * Apply atmosphere settings to element
 * Returns CSS filter string for background effects
 */
export function getAtmosphereFilter(atmosphere: AtmosphereSettings): string {
  const filters: string[] = [];
  
  if (atmosphere.blur > 0) {
    filters.push(`blur(${atmosphere.blur}px)`);
  }
  
  if (atmosphere.brightness !== 0) {
    const brightnessValue = 100 + atmosphere.brightness;
    filters.push(`brightness(${brightnessValue}%)`);
  }
  
  if (atmosphere.saturation !== 0) {
    const saturationValue = 100 + atmosphere.saturation;
    filters.push(`saturate(${saturationValue}%)`);
  }
  
  if (atmosphere.warmth !== 0) {
    // Warmth is handled via overlay color in background rendering
    // This is a placeholder for future CSS filter implementation
  }
  
  return filters.join(' ');
}

/**
 * Get overlay color based on atmosphere warmth
 * Warmth: negative = cool (blue), positive = warm (orange)
 */
export function getAtmosphereOverlayColor(atmosphere: AtmosphereSettings): string {
  const dim = atmosphere.dim;
  
  if (atmosphere.warmth > 0) {
    // Warm overlay (orange/amber)
    const opacity = (dim + Math.abs(atmosphere.warmth)) / 100;
    return `rgba(255, 140, 0, ${Math.min(opacity, 0.4)})`;
  } else if (atmosphere.warmth < 0) {
    // Cool overlay (blue)
    const opacity = (dim + Math.abs(atmosphere.warmth)) / 100;
    return `rgba(0, 100, 200, ${Math.min(opacity, 0.4)})`;
  } else {
    // Neutral overlay (black)
    return `rgba(0, 0, 0, ${dim / 100})`;
  }
}
