import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

// Load .env
try {
  const env = readFileSync('/home/ubuntu/official-dojo-flow-crm/.env', 'utf8');
  for (const line of env.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
} catch {}

const url = process.env.DATABASE_URL;
if (!url) { console.log('No DATABASE_URL'); process.exit(1); }

// Strip SSL param from URL for local connection
const cleanUrl = url.replace(/[?&]ssl=[^&]*/g, '').replace(/[?&]sslaccept=[^&]*/g, '');
const conn = await createConnection({ uri: cleanUrl, ssl: { rejectUnauthorized: false } });
const [rows] = await conn.query('SHOW COLUMNS FROM organizations LIKE "%onboard%"');
console.log('Organizations onboarding columns:', JSON.stringify(rows, null, 2));

const [rows2] = await conn.query('SHOW COLUMNS FROM dojo_settings LIKE "%operator%"');
console.log('dojo_settings operator columns:', JSON.stringify(rows2, null, 2));

const [rows3] = await conn.query('SHOW COLUMNS FROM dojo_settings');
console.log('All dojo_settings columns:', rows3.map(r => r.Field));

await conn.end();
