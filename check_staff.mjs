import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

// Read .env manually
const envContent = readFileSync('/home/ubuntu/official-dojo-flow-crm/.env', 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
}

const dbUrl = envVars['DATABASE_URL'];
console.log('Connecting to DB...');

const conn = await createConnection(dbUrl + '?ssl={"rejectUnauthorized":false}');

const [rows] = await conn.execute(
  "SELECT id, email, name, role, provider, created_at FROM users WHERE role = 'staff' ORDER BY id DESC LIMIT 10"
);
console.log('Staff users:');
console.table(rows);

// Also check if organizationUsers links exist
const [orgRows] = await conn.execute(
  "SELECT ou.user_id, ou.organization_id, ou.role, u.email FROM organization_users ou JOIN users u ON u.id = ou.user_id WHERE u.role = 'staff' ORDER BY ou.user_id DESC LIMIT 10"
);
console.log('\nOrganization links:');
console.table(orgRows);

await conn.end();
