import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL || '';
// Parse MySQL URL: mysql://user:pass@host:port/dbname?ssl=...
const urlObj = new URL(url.replace('mysql://', 'http://'));
const host = urlObj.hostname;
const port = parseInt(urlObj.port) || 3306;
const user = decodeURIComponent(urlObj.username);
const password = decodeURIComponent(urlObj.password);
const database = urlObj.pathname.replace(/^\//, '');

console.log(`Connecting to ${host}:${port}/${database} as ${user}`);

const conn = await createConnection({
  host,
  port,
  user,
  password,
  database,
  ssl: { rejectUnauthorized: false },
});

try {
  // Add logo_light_data column if not exists
  await conn.execute(`
    ALTER TABLE school_profiles 
    ADD COLUMN IF NOT EXISTS logo_light_data MEDIUMTEXT NULL,
    ADD COLUMN IF NOT EXISTS logo_dark_data MEDIUMTEXT NULL
  `);
  console.log('✅ Migration successful: added logo_light_data and logo_dark_data columns');
} catch (err) {
  if (err.message && err.message.includes('Duplicate column')) {
    console.log('✅ Columns already exist, skipping');
  } else {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
} finally {
  await conn.end();
}
