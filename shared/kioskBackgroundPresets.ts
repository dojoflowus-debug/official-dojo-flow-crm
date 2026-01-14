/**
 * Kiosk Background Presets
 * Pre-configured background themes for kiosk customization
 */

export interface BackgroundPreset {
  id: string;
  name: string;
  category: 'martial-arts' | 'nature' | 'fitness' | 'yoga' | 'kids' | 'dance' | 'studio';
  imageUrl: string;
  blur: number;
  dim: number;
  colorOverlay?: string;
  colorOverlayOpacity?: number;
  description: string;
}

export const KIOSK_BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'martial-arts-dojo',
    name: 'Martial Arts Dojo',
    category: 'martial-arts',
    imageUrl: '/kiosk-backgrounds/martial-arts-dojo.png',
    blur: 0,
    dim: 20,
    description: 'Traditional dojo with training equipment',
  },
  {
    id: 'kids-martial-arts',
    name: 'Kids Martial Arts',
    category: 'kids',
    imageUrl: '/kiosk-backgrounds/kids-martial-arts.png',
    blur: 0,
    dim: 15,
    description: 'Colorful kids martial arts class',
  },
  {
    id: 'zen-garden',
    name: 'Zen Garden',
    category: 'nature',
    imageUrl: '/kiosk-backgrounds/zen-garden.png',
    blur: 0,
    dim: 10,
    description: 'Peaceful Japanese zen garden',
  },
  {
    id: 'karate-training',
    name: 'Karate Training',
    category: 'martial-arts',
    imageUrl: '/kiosk-backgrounds/martial-arts-dojo.png',
    blur: 0,
    dim: 25,
    description: 'Advanced karate training session',
  },
  {
    id: 'yoga-studio',
    name: 'Yoga Studio',
    category: 'yoga',
    imageUrl: '/kiosk-backgrounds/yoga-studio.png',
    blur: 0,
    dim: 20,
    description: 'Peaceful yoga and meditation space',
  },
  {
    id: 'yoga-nature',
    name: 'Yoga in Nature',
    category: 'nature',
    imageUrl: '/kiosk-backgrounds/japanese-nature.png',
    blur: 0,
    dim: 15,
    description: 'Outdoor yoga with nature background',
  },
  {
    id: 'fitness-ropes',
    name: 'Fitness Battle Ropes',
    category: 'fitness',
    imageUrl: '/kiosk-backgrounds/fitness-battle-ropes.jpg',
    blur: 0,
    dim: 20,
    description: 'High-intensity fitness training',
  },
  {
    id: 'dance-studio',
    name: 'Dance Studio',
    category: 'dance',
    imageUrl: '/kiosk-backgrounds/dance-studio.jpg',
    blur: 0,
    dim: 15,
    description: 'Professional dance studio with mirrors',
  },
];

export const BACKGROUND_CATEGORIES = [
  { id: 'martial-arts', label: 'Martial Arts' },
  { id: 'nature', label: 'Nature' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'kids', label: 'Kids' },
  { id: 'dance', label: 'Dance' },
  { id: 'studio', label: 'Studio' },
];

// Helper function to resolve preset image URL
export function resolvePresetImageUrl(preset: BackgroundPreset | undefined): string | null {
  if (!preset || !preset.imageUrl) return null;
  // Ensure URL is absolute or relative to root
  if (preset.imageUrl.startsWith('/')) return preset.imageUrl;
  return `/${preset.imageUrl}`;
}

export function getPresetById(id: string): BackgroundPreset | undefined {
  return KIOSK_BACKGROUND_PRESETS.find(p => p.id === id);
}

export function getPresetsByCategory(category: string): BackgroundPreset[] {
  return KIOSK_BACKGROUND_PRESETS.filter(p => p.category === category);
}
