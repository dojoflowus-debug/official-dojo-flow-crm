import { createConnection } from 'mysql2/promise';

const urlObj = new URL(process.env.DATABASE_URL.replace('mysql://', 'http://'));
const conn = await createConnection({
  host: urlObj.hostname,
  port: parseInt(urlObj.port) || 3306,
  user: decodeURIComponent(urlObj.username),
  password: decodeURIComponent(urlObj.password),
  database: urlObj.pathname.replace(/^\//, ''),
  ssl: { rejectUnauthorized: false },
});

// Check and add martialArtsStyle to dojo_settings
const [dojoColumns] = await conn.execute('SHOW COLUMNS FROM dojo_settings');
const dojoColNames = dojoColumns.map(c => c.Field.toLowerCase());
console.log('dojo_settings columns:', dojoColNames.join(', '));

if (!dojoColNames.includes('martialartsstyle') && !dojoColNames.includes('martial_arts_style')) {
  // Check what the column is named in schema (no explicit mapping = camelCase)
  console.log('Adding martialArtsStyle column to dojo_settings...');
  await conn.execute('ALTER TABLE dojo_settings ADD COLUMN martialArtsStyle VARCHAR(100) NULL');
  console.log('✅ Added martialArtsStyle');
} else {
  console.log('✅ martialArtsStyle already exists');
}

// Check school_profiles for missing columns
const [spColumns] = await conn.execute('SHOW COLUMNS FROM school_profiles');
const spColNames = spColumns.map(c => c.Field.toLowerCase());
console.log('school_profiles columns:', spColNames.join(', '));

const missingCols = [];
if (!spColNames.includes('phone')) missingCols.push('ADD COLUMN phone VARCHAR(50) NULL');
if (!spColNames.includes('email')) missingCols.push('ADD COLUMN email VARCHAR(255) NULL');
if (!spColNames.includes('website')) missingCols.push('ADD COLUMN website VARCHAR(500) NULL');
if (!spColNames.includes('tagline')) missingCols.push('ADD COLUMN tagline VARCHAR(500) NULL');
if (!spColNames.includes('address_street')) missingCols.push('ADD COLUMN address_street VARCHAR(255) NULL');
if (!spColNames.includes('address_city')) missingCols.push('ADD COLUMN address_city VARCHAR(100) NULL');
if (!spColNames.includes('address_state')) missingCols.push('ADD COLUMN address_state VARCHAR(100) NULL');
if (!spColNames.includes('address_postal')) missingCols.push('ADD COLUMN address_postal VARCHAR(20) NULL');
if (!spColNames.includes('address_country')) missingCols.push('ADD COLUMN address_country VARCHAR(100) NULL');
if (!spColNames.includes('logo_icon_light_url')) missingCols.push('ADD COLUMN logo_icon_light_url VARCHAR(1000) NULL');
if (!spColNames.includes('logo_icon_dark_url')) missingCols.push('ADD COLUMN logo_icon_dark_url VARCHAR(1000) NULL');
if (!spColNames.includes('brand_color_primary')) missingCols.push('ADD COLUMN brand_color_primary VARCHAR(7) NULL');
if (!spColNames.includes('brand_color_secondary')) missingCols.push('ADD COLUMN brand_color_secondary VARCHAR(7) NULL');
if (!spColNames.includes('brand_color_tertiary')) missingCols.push('ADD COLUMN brand_color_tertiary VARCHAR(7) NULL');
if (!spColNames.includes('chat_use_full_logo')) missingCols.push('ADD COLUMN chat_use_full_logo TINYINT(1) DEFAULT 0');
if (!spColNames.includes('chat_welcome_message')) missingCols.push('ADD COLUMN chat_welcome_message TEXT NULL');
if (!spColNames.includes('display_name')) missingCols.push('ADD COLUMN display_name VARCHAR(255) NULL');

if (missingCols.length > 0) {
  console.log(`Adding ${missingCols.length} missing columns to school_profiles...`);
  const sql = `ALTER TABLE school_profiles ${missingCols.join(', ')}`;
  await conn.execute(sql);
  console.log('✅ Added missing columns:', missingCols.join(', '));
} else {
  console.log('✅ All school_profiles columns already exist');
}

await conn.end();
console.log('Migration complete!');
