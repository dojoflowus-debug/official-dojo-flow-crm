import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Check if column exists
const [cols] = await conn.query("SHOW COLUMNS FROM dojo_settings LIKE 'fluidpay_public_key'");
if (cols.length === 0) {
  console.log('Adding fluidpay_public_key column...');
  await conn.query("ALTER TABLE dojo_settings ADD COLUMN fluidpay_public_key VARCHAR(255) NULL");
  console.log('Column added.');
} else {
  console.log('Column already exists.');
}

// Check existing rows
const [rows] = await conn.query('SELECT id, organizationId, fluidpayApiKey FROM dojo_settings');
console.log('Existing rows:', JSON.stringify(rows));

// Update the first row with the public key
if (rows.length > 0) {
  await conn.query(
    "UPDATE dojo_settings SET fluidpay_public_key = ? WHERE id = ?",
    ['pub_38LwnXemiKVtMoMlgoHjXOOHGF4', rows[0].id]
  );
  console.log('Updated row', rows[0].id, 'with public key');
}

// Verify
const [updated] = await conn.query('SELECT id, fluidpay_public_key FROM dojo_settings');
console.log('After update:', JSON.stringify(updated));

await conn.end();
