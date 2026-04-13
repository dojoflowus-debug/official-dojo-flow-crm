import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('No TURSO_DATABASE_URL');
  process.exit(1);
}

const client = createClient({ url, authToken });

const result = await client.execute('SELECT id, email, role, CASE WHEN password IS NOT NULL THEN "yes" ELSE "no" END as has_password FROM users LIMIT 10');
console.log('Users in DB:');
result.rows.forEach(r => console.log(JSON.stringify(r)));
process.exit(0);
