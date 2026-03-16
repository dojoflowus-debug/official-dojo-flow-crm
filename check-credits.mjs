import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

// Read .env file
const envContent = readFileSync('.env', 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
}

const url = envVars.DATABASE_URL || '';
console.log('DB URL prefix:', url.substring(0, 30));

// Parse mysql URL: mysql://user:pass@host:port/db?params
const urlMatch = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
if (!urlMatch) {
  console.log('Could not parse DATABASE_URL');
  process.exit(1);
}
const [, user, pass, host, port, db] = urlMatch;

const conn = await mysql.createConnection({
  host,
  port: parseInt(port),
  user,
  password: decodeURIComponent(pass),
  database: db,
  ssl: { rejectUnauthorized: false }
});

const [rows] = await conn.execute('SELECT * FROM ai_credit_balance LIMIT 10');
console.log('Credit balances:', JSON.stringify(rows, null, 2));

const [orgs] = await conn.execute('SELECT id, name FROM organizations LIMIT 5');
console.log('Organizations:', JSON.stringify(orgs, null, 2));

await conn.end();
