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

// Check current columns
const [cols] = await conn.execute("SHOW COLUMNS FROM school_profiles");
const colNames = cols.map(c => c.Field);
console.log('Current columns:', colNames);

// Map of camelCase → snake_case renames needed
// Format: [camelCase, snake_case, type_definition]
const renames = [
  ['organizationId', 'organization_id', 'int NOT NULL'],
  ['schoolName', 'school_name', 'varchar(255) NOT NULL DEFAULT "My Dojo"'],
  ['displayName', 'display_name', 'varchar(255) DEFAULT NULL'],
  ['addressStreet', 'address_street', 'varchar(255) DEFAULT NULL'],
  ['addressCity', 'address_city', 'varchar(100) DEFAULT NULL'],
  ['addressState', 'address_state', 'varchar(100) DEFAULT NULL'],
  ['addressPostal', 'address_postal', 'varchar(20) DEFAULT NULL'],
  ['addressCountry', 'address_country', 'varchar(100) DEFAULT NULL'],
  ['logoLightUrl', 'logo_light_url', 'varchar(1000) DEFAULT NULL'],
  ['logoDarkUrl', 'logo_dark_url', 'varchar(1000) DEFAULT NULL'],
  ['createdAt', 'created_at', 'timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP'],
  ['updatedAt', 'updated_at', 'timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
];

for (const [camel, snake, typeDef] of renames) {
  if (colNames.includes(camel) && !colNames.includes(snake)) {
    try {
      await conn.execute(`ALTER TABLE school_profiles CHANGE \`${camel}\` \`${snake}\` ${typeDef}`);
      console.log(`✅ Renamed ${camel} → ${snake}`);
    } catch (err) {
      console.error(`❌ Failed to rename ${camel}: ${err.message}`);
    }
  } else if (colNames.includes(snake)) {
    console.log(`⏭️  ${snake} already exists, skipping`);
  } else {
    console.log(`⚠️  ${camel} not found, skipping`);
  }
}

// Also add missing columns that the schema expects
const missingCols = [
  ['logo_icon_light_url', 'varchar(1000) DEFAULT NULL'],
  ['logo_icon_dark_url', 'varchar(1000) DEFAULT NULL'],
  ['brand_color_primary', 'varchar(7) DEFAULT NULL'],
  ['brand_color_secondary', 'varchar(7) DEFAULT NULL'],
  ['brand_color_tertiary', 'varchar(7) DEFAULT NULL'],
  ['chat_use_full_logo', 'tinyint(1) DEFAULT 0'],
  ['chat_welcome_message', 'text DEFAULT NULL'],
  ['logo_light_data', 'MEDIUMTEXT DEFAULT NULL'],
  ['logo_dark_data', 'MEDIUMTEXT DEFAULT NULL'],
];

// Re-read columns after renames
const [updatedCols] = await conn.execute("SHOW COLUMNS FROM school_profiles");
const updatedColNames = updatedCols.map(c => c.Field);

for (const [colName, typeDef] of missingCols) {
  if (!updatedColNames.includes(colName)) {
    try {
      await conn.execute(`ALTER TABLE school_profiles ADD COLUMN \`${colName}\` ${typeDef}`);
      console.log(`✅ Added missing column: ${colName}`);
    } catch (err) {
      console.error(`❌ Failed to add ${colName}: ${err.message}`);
    }
  } else {
    console.log(`⏭️  ${colName} already exists`);
  }
}

// Show final state
const [finalCols] = await conn.execute("SHOW COLUMNS FROM school_profiles");
console.log('\nFinal columns:', finalCols.map(c => c.Field));

await conn.end();
console.log('\n✅ Migration complete');
