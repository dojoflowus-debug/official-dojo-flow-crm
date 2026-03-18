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

const cols = [
  ['ownerRank', 'VARCHAR(100) NULL'],
  ['programsTaught', 'TEXT NULL'],
];

for (const [col, def] of cols) {
  try {
    await conn.execute(`ALTER TABLE \`dojo_settings\` ADD COLUMN IF NOT EXISTS \`${col}\` ${def}`);
    console.log(`✅ dojo_settings.${col} ensured`);
  } catch (e) {
    if (e.message?.includes('Duplicate column')) {
      console.log(`✅ dojo_settings.${col} already exists`);
    } else {
      console.error(`❌ Failed to add ${col}:`, e.message);
    }
  }
}

// Verify
const [cols2] = await conn.execute(
  `SHOW COLUMNS FROM \`dojo_settings\` WHERE Field IN ('ownerRank','programsTaught','instructorTitle','martialArtsStyle','operatorName')`
);
console.log('\nCurrent owner profile columns:');
cols2.forEach(c => console.log(`  ${c.Field}: ${c.Type}`));

await conn.end();
console.log('\nDone!');
