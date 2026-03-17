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

// Reset onboarding status so the expanded flow triggers
await conn.execute(
  "UPDATE organizations SET onboardingStatus = 'not_started', onboardingStep = 1 WHERE id = 1"
);
console.log('✅ Onboarding status reset to not_started');

// Check current state
const [orgs] = await conn.execute('SELECT id, name, onboardingStatus, onboardingStep FROM organizations WHERE id = 1');
console.log('Organization:', JSON.stringify(orgs[0]));

await conn.end();
