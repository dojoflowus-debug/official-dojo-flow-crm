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

const orgId = 1;

// Test school_profiles query (what Drizzle generates with snake_case columns)
const [profiles] = await conn.execute(
  'SELECT school_name, logo_light_url, logo_dark_url, LENGTH(logo_light_data) as light_len, LENGTH(logo_dark_data) as dark_len FROM school_profiles WHERE organization_id = ? LIMIT 1',
  [orgId]
);
console.log('Profile query result:', JSON.stringify(profiles[0]));

const p = profiles[0];
const hasLogoLight = Boolean(p?.logo_light_url?.length || p?.light_len > 0);
const hasLogoDark = Boolean(p?.logo_dark_url?.length || p?.dark_len > 0);

// Test organizations query
const [orgs] = await conn.execute(
  'SELECT onboardingStatus, onboardingStep FROM organizations WHERE id = ? LIMIT 1',
  [orgId]
);
console.log('Org query result:', JSON.stringify(orgs[0]));

const isCompleted = orgs[0]?.onboardingStatus === 'completed' || orgs[0]?.onboardingStatus === 'skipped';
const hasCriticalMissing = !hasLogoLight || !hasLogoDark;
const needsOnboarding = (!isCompleted && (hasLogoLight === false || hasLogoDark === false)) || (isCompleted && hasCriticalMissing);

console.log('hasLogoLight:', hasLogoLight, 'hasLogoDark:', hasLogoDark);
console.log('isCompleted:', isCompleted);
console.log('needsOnboarding:', needsOnboarding);
console.log(needsOnboarding ? '❌ STILL showing onboarding' : '✅ Onboarding will NOT show again');

await conn.end();
