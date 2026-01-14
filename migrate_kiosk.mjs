import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log('Checking if columns exist...');
  const [cols] = await conn.execute('DESCRIBE kiosk_locations');
  const colNames = cols.map(c => c.Field);
  console.log('Existing columns:', colNames);
  
  if (!colNames.includes('kioskAppearanceDraft')) {
    console.log('Adding kioskAppearanceDraft column...');
    await conn.execute('ALTER TABLE kiosk_locations ADD COLUMN kioskAppearanceDraft LONGTEXT');
  }
  
  if (!colNames.includes('kioskAppearancePublished')) {
    console.log('Adding kioskAppearancePublished column...');
    await conn.execute('ALTER TABLE kiosk_locations ADD COLUMN kioskAppearancePublished LONGTEXT');
  }
  
  if (!colNames.includes('kioskAppearanceVersion')) {
    console.log('Adding kioskAppearanceVersion column...');
    await conn.execute('ALTER TABLE kiosk_locations ADD COLUMN kioskAppearanceVersion INT DEFAULT 1 NOT NULL');
  }
  
  console.log('Migration completed successfully!');
} catch (e) {
  console.error('Migration error:', e.message);
} finally {
  await conn.end();
}
