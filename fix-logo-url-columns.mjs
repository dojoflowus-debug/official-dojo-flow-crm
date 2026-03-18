import { createConnection } from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
const urlObj = new URL(dbUrl.replace('mysql://', 'http://'));
const conn = await createConnection({
  host: urlObj.hostname,
  port: parseInt(urlObj.port) || 3306,
  user: decodeURIComponent(urlObj.username),
  password: decodeURIComponent(urlObj.password),
  database: urlObj.pathname.replace(/^\//, ''),
  ssl: { rejectUnauthorized: false },
});

// Check current types
const [cols] = await conn.execute(
  "SHOW COLUMNS FROM school_profiles WHERE Field IN ('logo_light_url','logo_dark_url','logo_icon_light_url','logo_icon_dark_url','logo_light_data','logo_dark_data')"
);
console.log('Current logo column types:');
cols.forEach(c => console.log(`  ${c.Field}: ${c.Type}`));

// Upgrade varchar(1000) logo URL columns to MEDIUMTEXT so they can store base64 data URLs
const logoUrlCols = ['logo_light_url', 'logo_dark_url', 'logo_icon_light_url', 'logo_icon_dark_url'];
for (const col of logoUrlCols) {
  const existing = cols.find(c => c.Field === col);
  if (existing && existing.Type.toLowerCase().startsWith('varchar')) {
    console.log(`Upgrading ${col} from ${existing.Type} to MEDIUMTEXT...`);
    await conn.execute(`ALTER TABLE school_profiles MODIFY COLUMN \`${col}\` MEDIUMTEXT NULL`);
    console.log(`✅ ${col} upgraded to MEDIUMTEXT`);
  } else if (existing) {
    console.log(`✅ ${col} is already ${existing.Type}`);
  } else {
    console.log(`Adding ${col} as MEDIUMTEXT...`);
    await conn.execute(`ALTER TABLE school_profiles ADD COLUMN IF NOT EXISTS \`${col}\` MEDIUMTEXT NULL`);
    console.log(`✅ ${col} added`);
  }
}

await conn.end();
console.log('Done!');
