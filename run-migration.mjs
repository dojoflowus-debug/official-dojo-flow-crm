import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Parse the URL to extract components
const parsed = new URL(url);
const host = parsed.hostname;
const port = parseInt(parsed.port) || 4000;
const user = parsed.username;
const password = parsed.password;
const database = parsed.pathname.replace('/', '');

console.log(`Connecting to ${host}:${port}/${database} as ${user}`);

const conn = await createConnection({
  host,
  port,
  user,
  password,
  database,
  ssl: { rejectUnauthorized: true },
});

console.log('Connected!');

// Run the migration SQL
const sql = `ALTER TABLE \`users\` MODIFY COLUMN \`photoUrl\` mediumtext`;
const sql2 = `ALTER TABLE \`users\` MODIFY COLUMN \`photoUrlSmall\` mediumtext`;

try {
  console.log('Running: ALTER TABLE users MODIFY COLUMN photoUrl mediumtext');
  await conn.execute(sql);
  console.log('✓ photoUrl column altered to mediumtext');
} catch (err) {
  if (err.message.includes('already')) {
    console.log('⚠ photoUrl already mediumtext, skipping');
  } else {
    console.error('Error altering photoUrl:', err.message);
  }
}

try {
  console.log('Running: ALTER TABLE users MODIFY COLUMN photoUrlSmall mediumtext');
  await conn.execute(sql2);
  console.log('✓ photoUrlSmall column altered to mediumtext');
} catch (err) {
  if (err.message.includes('already')) {
    console.log('⚠ photoUrlSmall already mediumtext, skipping');
  } else {
    console.error('Error altering photoUrlSmall:', err.message);
  }
}

// Verify the change
const [rows] = await conn.execute(`SHOW COLUMNS FROM \`users\` WHERE Field IN ('photoUrl', 'photoUrlSmall')`);
console.log('\nColumn types after migration:');
for (const row of rows) {
  console.log(`  ${row.Field}: ${row.Type}`);
}

await conn.end();
console.log('\nMigration complete!');
