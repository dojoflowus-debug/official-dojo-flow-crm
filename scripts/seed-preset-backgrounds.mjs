import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const presetBackgrounds = [
  // Dojo/Martial Arts
  {
    key: 'dojo-warm-lights',
    name: 'Warm Dojo',
    description: 'Traditional dojo with warm golden lighting and wooden floors',
    category: 'dojo',
    imageUrl: 'https://images.unsplash.com/photo-1599447488458-f2b5d2a5a0a5?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1599447488458-f2b5d2a5a0a5?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 1,
  },
  {
    key: 'dojo-traditional',
    name: 'Traditional Dojo',
    description: 'Classic martial arts training hall with tatami mats',
    category: 'dojo',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 2,
  },
  {
    key: 'dojo-modern',
    name: 'Modern Dojo',
    description: 'Contemporary martial arts facility with clean lines and bright lighting',
    category: 'dojo',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 3,
  },
  // Gym/Fitness
  {
    key: 'gym-modern',
    name: 'Modern Gym',
    description: 'State-of-the-art fitness facility with equipment and mirrors',
    category: 'gym',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 4,
  },
  {
    key: 'gym-industrial',
    name: 'Industrial Gym',
    description: 'Raw industrial-style training space with exposed brick and metal',
    category: 'gym',
    imageUrl: 'https://images.unsplash.com/photo-1599447488458-f2b5d2a5a0a5?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1599447488458-f2b5d2a5a0a5?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 5,
  },
  // Gradients
  {
    key: 'gradient-dark-blue',
    name: 'Dark Blue Gradient',
    description: 'Professional dark blue gradient background',
    category: 'gradient',
    imageUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 6,
  },
  {
    key: 'gradient-red-orange',
    name: 'Red-Orange Gradient',
    description: 'Energetic red to orange gradient background',
    category: 'gradient',
    imageUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 7,
  },
  {
    key: 'gradient-purple-blue',
    name: 'Purple-Blue Gradient',
    description: 'Cool purple to blue gradient background',
    category: 'gradient',
    imageUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 8,
  },
  // Patterns
  {
    key: 'pattern-geometric',
    name: 'Geometric Pattern',
    description: 'Modern geometric pattern background',
    category: 'pattern',
    imageUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 9,
  },
  {
    key: 'pattern-minimal',
    name: 'Minimal Pattern',
    description: 'Clean minimal pattern background',
    category: 'pattern',
    imageUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 10,
  },
  // Nature
  {
    key: 'nature-mountains',
    name: 'Mountain Landscape',
    description: 'Serene mountain landscape background',
    category: 'nature',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 11,
  },
  {
    key: 'nature-forest',
    name: 'Forest Path',
    description: 'Peaceful forest path background',
    category: 'nature',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 12,
  },
  {
    key: 'nature-ocean',
    name: 'Ocean Waves',
    description: 'Calming ocean waves background',
    category: 'nature',
    imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 13,
  },
  // Neutral
  {
    key: 'neutral-light-gray',
    name: 'Light Gray',
    description: 'Clean light gray neutral background',
    category: 'neutral',
    imageUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 14,
  },
  {
    key: 'neutral-dark-gray',
    name: 'Dark Gray',
    description: 'Professional dark gray neutral background',
    category: 'neutral',
    imageUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 15,
  },
  {
    key: 'neutral-charcoal',
    name: 'Charcoal',
    description: 'Deep charcoal neutral background',
    category: 'neutral',
    imageUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 16,
  },
  {
    key: 'neutral-white',
    name: 'Pure White',
    description: 'Clean white neutral background',
    category: 'neutral',
    imageUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1920&h=1080&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200&h=150&fit=crop',
    blurDefault: 0,
    dimDefault: 0,
    sortOrder: 17,
  },
];

async function seedPresetBackgrounds() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Seeding preset backgrounds...');

    for (const bg of presetBackgrounds) {
      await connection.execute(
        `INSERT INTO preset_backgrounds (
          \`key\`, name, description, category, imageUrl, thumbnailUrl, 
          blurDefault, dimDefault, sortOrder, isActive
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          description = VALUES(description),
          category = VALUES(category),
          imageUrl = VALUES(imageUrl),
          thumbnailUrl = VALUES(thumbnailUrl),
          blurDefault = VALUES(blurDefault),
          dimDefault = VALUES(dimDefault),
          sortOrder = VALUES(sortOrder)`,
        [
          bg.key,
          bg.name,
          bg.description,
          bg.category,
          bg.imageUrl,
          bg.thumbnailUrl,
          bg.blurDefault,
          bg.dimDefault,
          bg.sortOrder,
        ]
      );
      console.log(`✓ Seeded: ${bg.name}`);
    }

    console.log(`\n✓ Successfully seeded ${presetBackgrounds.length} preset backgrounds`);
  } catch (error) {
    console.error('Error seeding preset backgrounds:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedPresetBackgrounds();
