import { getDb } from './server/db.ts';
import { kioskThemePresets } from './drizzle/schema.ts';

const themePresets = [
  {
    id: 1,
    name: 'Default (Clean Dark)',
    type: 'preset',
    description: 'Clean dark gradient with red accents - the original DojoFlow kiosk theme',
    config: {
      background: 'gradient-to-br from-slate-950 via-slate-900 to-slate-950',
      accentColor: '#dc2626', // red-600
      cardBg: 'slate-900/50',
      cardBorder: 'slate-700',
      textPrimary: 'white',
      textSecondary: 'slate-300',
      buttonPrimary: 'gradient-to-r from-red-600 to-red-700',
      buttonHover: 'from-red-700 to-red-800',
    },
    isActive: 1,
  },
  {
    id: 2,
    name: 'Light Minimal',
    type: 'preset',
    description: 'Light background with subtle shadows and clean typography',
    config: {
      background: 'gradient-to-br from-gray-50 via-white to-gray-100',
      accentColor: '#dc2626', // red-600
      cardBg: 'white',
      cardBorder: 'gray-200',
      textPrimary: 'gray-900',
      textSecondary: 'gray-600',
      buttonPrimary: 'gradient-to-r from-red-600 to-red-700',
      buttonHover: 'from-red-700 to-red-800',
    },
    isActive: 1,
  },
  {
    id: 3,
    name: 'Dojo Interior',
    type: 'preset',
    description: 'Photo background with blur overlay for a dojo interior feel',
    config: {
      background: 'gradient-to-br from-slate-950 via-slate-900 to-slate-950',
      backgroundImage: '/dojo-background.jpg',
      backgroundBlur: 10,
      backgroundOpacity: 20,
      accentColor: '#dc2626',
      cardBg: 'slate-900/70',
      cardBorder: 'slate-700',
      textPrimary: 'white',
      textSecondary: 'slate-300',
      buttonPrimary: 'gradient-to-r from-red-600 to-red-700',
      buttonHover: 'from-red-700 to-red-800',
    },
    isActive: 1,
  },
  {
    id: 4,
    name: 'Winter Holiday',
    type: 'holiday',
    description: 'Cool blue tones with snow effects for winter season',
    config: {
      background: 'gradient-to-br from-blue-950 via-blue-900 to-slate-950',
      accentColor: '#3b82f6', // blue-500
      cardBg: 'blue-900/50',
      cardBorder: 'blue-700',
      textPrimary: 'white',
      textSecondary: 'blue-200',
      buttonPrimary: 'gradient-to-r from-blue-600 to-blue-700',
      buttonHover: 'from-blue-700 to-blue-800',
    },
    isActive: 1,
  },
  {
    id: 5,
    name: 'Halloween',
    type: 'holiday',
    description: 'Orange and purple theme for Halloween season',
    config: {
      background: 'gradient-to-br from-purple-950 via-orange-950 to-slate-950',
      accentColor: '#f97316', // orange-500
      cardBg: 'purple-900/50',
      cardBorder: 'orange-700',
      textPrimary: 'white',
      textSecondary: 'orange-200',
      buttonPrimary: 'gradient-to-r from-orange-600 to-orange-700',
      buttonHover: 'from-orange-700 to-orange-800',
    },
    isActive: 1,
  },
  {
    id: 6,
    name: 'Summer',
    type: 'holiday',
    description: 'Bright warm tones for summer season',
    config: {
      background: 'gradient-to-br from-amber-50 via-orange-50 to-yellow-50',
      accentColor: '#f59e0b', // amber-500
      cardBg: 'white',
      cardBorder: 'amber-200',
      textPrimary: 'gray-900',
      textSecondary: 'amber-800',
      buttonPrimary: 'gradient-to-r from-amber-600 to-orange-600',
      buttonHover: 'from-amber-700 to-orange-700',
    },
    isActive: 1,
  },
  {
    id: 7,
    name: 'Tournament Mode',
    type: 'event',
    description: 'High-energy red and gold theme for tournament days',
    config: {
      background: 'gradient-to-br from-red-950 via-amber-950 to-slate-950',
      accentColor: '#fbbf24', // amber-400
      cardBg: 'red-900/50',
      cardBorder: 'amber-700',
      textPrimary: 'white',
      textSecondary: 'amber-200',
      buttonPrimary: 'gradient-to-r from-red-600 to-amber-600',
      buttonHover: 'from-red-700 to-amber-700',
    },
    isActive: 1,
  },
  {
    id: 8,
    name: 'Test Day',
    type: 'event',
    description: 'Calm blue and green theme for belt testing days',
    config: {
      background: 'gradient-to-br from-blue-950 via-teal-950 to-slate-950',
      accentColor: '#14b8a6', // teal-500
      cardBg: 'blue-900/50',
      cardBorder: 'teal-700',
      textPrimary: 'white',
      textSecondary: 'teal-200',
      buttonPrimary: 'gradient-to-r from-blue-600 to-teal-600',
      buttonHover: 'from-blue-700 to-teal-700',
    },
    isActive: 1,
  },
];

async function seedThemes() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  console.log('Seeding kiosk theme presets...');

  for (const theme of themePresets) {
    try {
      await db.insert(kioskThemePresets).values(theme).onDuplicateKeyUpdate({
        set: {
          name: theme.name,
          type: theme.type,
          description: theme.description,
          config: theme.config,
          isActive: theme.isActive,
        },
      });
      console.log(`✓ Seeded theme: ${theme.name}`);
    } catch (error) {
      console.error(`✗ Failed to seed theme ${theme.name}:`, error);
    }
  }

  console.log('Theme seeding complete!');
  process.exit(0);
}

seedThemes();
