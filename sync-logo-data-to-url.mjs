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

// Copy logo_light_data -> logo_light_url where logo_light_url is null but logo_light_data has data
const [lightResult] = await conn.execute(
  `UPDATE school_profiles 
   SET logo_light_url = logo_light_data, logo_icon_light_url = logo_light_data
   WHERE logo_light_data IS NOT NULL AND logo_light_data != '' 
   AND (logo_light_url IS NULL OR logo_light_url = '')`
);
console.log(`✅ Synced light logos: ${lightResult.affectedRows} rows updated`);

// Copy logo_dark_data -> logo_dark_url where logo_dark_url is null but logo_dark_data has data
const [darkResult] = await conn.execute(
  `UPDATE school_profiles 
   SET logo_dark_url = logo_dark_data, logo_icon_dark_url = logo_dark_data
   WHERE logo_dark_data IS NOT NULL AND logo_dark_data != '' 
   AND (logo_dark_url IS NULL OR logo_dark_url = '')`
);
console.log(`✅ Synced dark logos: ${darkResult.affectedRows} rows updated`);

// Verify
const [rows] = await conn.execute(
  `SELECT id, organization_id, 
   CASE WHEN logo_light_url IS NOT NULL AND logo_light_url != '' THEN 'HAS_LOGO' ELSE 'NO_LOGO' END as light,
   CASE WHEN logo_dark_url IS NOT NULL AND logo_dark_url != '' THEN 'HAS_LOGO' ELSE 'NO_LOGO' END as dark
   FROM school_profiles`
);
console.log('Current logo status:', rows);

await conn.end();
console.log('Done!');
