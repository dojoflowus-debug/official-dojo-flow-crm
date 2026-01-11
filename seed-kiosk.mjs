import mysql from 'mysql2/promise';

const DEFAULT_SETTINGS = {
  theme: { accentColor: '#ef4444', fontFamily: 'Inter' },
  content: {
    headline: 'Welcome to Training',
    subtext: 'Tap to begin',
    tileLeft: { title: 'Check In', subtitle: 'Tap here to check into class', button: 'Check In' },
    tileRight: { title: 'Start Training', subtitle: 'New students start here', button: 'Start Training' },
    infoLeftLabel: 'Next Class',
    infoRightLabel: 'Today\'s Focus'
  },
  layout: { showClock: true, showInfoBar: true },
  background: { type: 'solid', color: '#ffffff', presetKey: null, customUrl: null, blur: 0, dim: 0, fit: 'cover' },
  screensaver: { enabled: true, idleSeconds: 60, message: 'Tap the screen to check-in', showLogo: true }
};

async function seedKiosk() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    // Check if kiosk_locations table exists
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kiosk_locations'`
    );

    if (tables.length === 0) {
      console.log('Creating kiosk_locations table...');
      await connection.query(`
        CREATE TABLE kiosk_locations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          locationId INT,
          isActive INT DEFAULT 1,
          settings TEXT,
          kioskAppearanceDraft TEXT,
          kioskAppearancePublished TEXT,
          kioskAppearanceVersion INT DEFAULT 1,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('kiosk_locations table created');
    }

    // Check if any locations exist
    const [existing] = await connection.query('SELECT id FROM kiosk_locations LIMIT 1');

    if (existing.length === 0) {
      console.log('Seeding default kiosk location...');
      await connection.query(
        `INSERT INTO kiosk_locations (name, locationId, isActive, kioskAppearanceDraft, kioskAppearancePublished, kioskAppearanceVersion, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          'Main Dojo',
          null,
          1,
          JSON.stringify(DEFAULT_SETTINGS),
          JSON.stringify(DEFAULT_SETTINGS),
          1
        ]
      );
      console.log('Default kiosk location created successfully');
    } else {
      console.log('Kiosk locations already exist');
    }
  } catch (error) {
    console.error('Error seeding kiosk:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedKiosk();
