import { KioskConfig } from './kioskConfig';

export interface KioskTemplate {
  id: string;
  name: string;
  description: string;
  category: 'martial-arts' | 'fitness' | 'yoga' | 'dance' | 'kids' | 'general';
  icon: string;
  config: KioskConfig;
  thumbnail?: string;
}

/**
 * Quick-start design templates for kiosks
 * Users can apply these templates instantly to get started
 */
export const KIOSK_TEMPLATES: KioskTemplate[] = [
  {
    id: 'kids-karate',
    name: 'Kids Karate',
    description: 'Colorful, energetic design perfect for kids martial arts classes',
    category: 'kids',
    icon: '🥋',
    thumbnail: '/kiosk-backgrounds/kids-martial-arts.png',
    config: {
      background: {
        type: 'preset',
        presetId: 'kids',
        color: '#000000',
        blur: 0,
        dim: 0.3,
        customImageUrl: '',
      },
      theme: {
        accentColor: '#ff6b35', // Bright orange
      },
      typography: {
        titleSize: 56,
        titleWeight: 700,
        letterSpacing: 1,
        buttonFontSize: 18,
        subtitleSize: 14,
      },
      content: {
        leftTileTitle: 'Next Class',
        rightTileTitle: "Today's Focus",
      },
    },
  },
  {
    id: 'fitness-studio',
    name: 'Fitness Studio',
    description: 'Bold, modern design for high-energy fitness classes',
    category: 'fitness',
    icon: '💪',
    thumbnail: '/kiosk-backgrounds/fitness-battle-ropes.png',
    config: {
      background: {
        type: 'preset',
        presetId: 'fitness',
        color: '#000000',
        blur: 0,
        dim: 0.4,
        customImageUrl: '',
      },
      theme: {
        accentColor: '#ff0055', // Hot pink
      },
      typography: {
        titleSize: 64,
        titleWeight: 800,
        letterSpacing: 0.5,
        buttonFontSize: 20,
        subtitleSize: 16,
      },
      content: {
        leftTileTitle: 'Current Class',
        rightTileTitle: 'Instructor',
      },
    },
  },
  {
    id: 'yoga-studio',
    name: 'Yoga Studio',
    description: 'Calm, serene design for yoga and wellness classes',
    category: 'yoga',
    icon: '🧘',
    thumbnail: '/kiosk-backgrounds/yoga-studio.png',
    config: {
      background: {
        type: 'preset',
        presetId: 'yoga',
        color: '#000000',
        blur: 2,
        dim: 0.2,
        customImageUrl: '',
      },
      theme: {
        accentColor: '#7c3aed', // Purple
      },
      typography: {
        titleSize: 48,
        titleWeight: 600,
        letterSpacing: 2,
        buttonFontSize: 16,
        subtitleSize: 13,
      },
      content: {
        leftTileTitle: 'Next Session',
        rightTileTitle: 'Wellness Tip',
      },
    },
  },
  {
    id: 'dance-studio',
    name: 'Dance Studio',
    description: 'Vibrant, artistic design for dance and movement classes',
    category: 'dance',
    icon: '💃',
    thumbnail: '/kiosk-backgrounds/dance-studio.png',
    config: {
      background: {
        type: 'preset',
        presetId: 'dance',
        color: '#000000',
        blur: 1,
        dim: 0.35,
        customImageUrl: '',
      },
      theme: {
        accentColor: '#ec4899', // Pink
      },
      typography: {
        titleSize: 60,
        titleWeight: 700,
        letterSpacing: 1.5,
        buttonFontSize: 18,
        subtitleSize: 15,
      },
      content: {
        leftTileTitle: 'Now Dancing',
        rightTileTitle: 'Next Up',
      },
    },
  },
  {
    id: 'martial-arts-dojo',
    name: 'Martial Arts Dojo',
    description: 'Professional, traditional design for martial arts schools',
    category: 'martial-arts',
    icon: '🥋',
    thumbnail: '/kiosk-backgrounds/martial-arts-dojo.png',
    config: {
      background: {
        type: 'preset',
        presetId: 'martial-arts',
        color: '#000000',
        blur: 0,
        dim: 0.3,
        customImageUrl: '',
      },
      theme: {
        accentColor: '#dc2626', // Red
      },
      typography: {
        titleSize: 52,
        titleWeight: 700,
        letterSpacing: 0.5,
        buttonFontSize: 17,
        subtitleSize: 14,
      },
      content: {
        leftTileTitle: 'Current Class',
        rightTileTitle: 'Instructor',
      },
    },
  },
  {
    id: 'zen-garden',
    name: 'Zen Garden',
    description: 'Minimalist, peaceful design for meditation and wellness',
    category: 'general',
    icon: '🌿',
    thumbnail: '/kiosk-backgrounds/zen-garden.png',
    config: {
      background: {
        type: 'preset',
        presetId: 'zen',
        color: '#000000',
        blur: 3,
        dim: 0.25,
        customImageUrl: '',
      },
      theme: {
        accentColor: '#059669', // Green
      },
      typography: {
        titleSize: 44,
        titleWeight: 600,
        letterSpacing: 2.5,
        buttonFontSize: 15,
        subtitleSize: 12,
      },
      content: {
        leftTileTitle: 'Meditation',
        rightTileTitle: 'Mindfulness',
      },
    },
  },
  {
    id: 'nature-escape',
    name: 'Nature Escape',
    description: 'Natural, outdoor-inspired design for outdoor fitness',
    category: 'fitness',
    icon: '🏞️',
    thumbnail: '/kiosk-backgrounds/japanese-nature.png',
    config: {
      background: {
        type: 'preset',
        presetId: 'nature',
        color: '#000000',
        blur: 1,
        dim: 0.3,
        customImageUrl: '',
      },
      theme: {
        accentColor: '#f59e0b', // Amber
      },
      typography: {
        titleSize: 50,
        titleWeight: 700,
        letterSpacing: 1,
        buttonFontSize: 17,
        subtitleSize: 14,
      },
      content: {
        leftTileTitle: 'Outdoor Class',
        rightTileTitle: 'Weather',
      },
    },
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Simple, modern design with solid colors',
    category: 'general',
    icon: '✨',
    thumbnail: undefined,
    config: {
      background: {
        type: 'solid',
        presetId: '',
        color: '#1a1a1a',
        blur: 0,
        dim: 0,
        customImageUrl: '',
      },
      theme: {
        accentColor: '#3b82f6', // Blue
      },
      typography: {
        titleSize: 48,
        titleWeight: 700,
        letterSpacing: 1,
        buttonFontSize: 16,
        subtitleSize: 13,
      },
      content: {
        leftTileTitle: 'Schedule',
        rightTileTitle: 'Details',
      },
    },
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): KioskTemplate | undefined {
  return KIOSK_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): KioskTemplate[] {
  return KIOSK_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get all unique categories
 */
export function getTemplateCategories(): string[] {
  const categories = new Set(KIOSK_TEMPLATES.map(t => t.category));
  return Array.from(categories);
}
