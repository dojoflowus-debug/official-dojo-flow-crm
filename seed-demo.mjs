/**
 * Seed demo owner account for DojoFlow CRM
 * Creates: demo@dojoflow.com / demo123 (owner role)
 * Also creates a demo organization and links them
 */
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const conn = await mysql.createConnection({ uri: url, ssl: { rejectUnauthorized: false } });

const DEMO_EMAIL = 'demo@dojoflow.com';
const DEMO_PASSWORD = 'demo123';
const DEMO_NAME = 'Demo Sensei';
const DEMO_ORG_NAME = 'Demo Dojo';

async function main() {
  // Check if demo user already exists
  const [existing] = await conn.execute('SELECT id, email FROM users WHERE email = ?', [DEMO_EMAIL]);
  if (existing.length > 0) {
    console.log('✅ Demo user already exists (id:', existing[0].id, ')');
    // Make sure password is set correctly
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    await conn.execute(
      'UPDATE users SET password = ?, role = "owner" WHERE email = ?',
      [passwordHash, DEMO_EMAIL]
    );
    console.log('✅ Password updated for demo user');
    await ensureOrg(existing[0].id);
    await conn.end();
    return;
  }

  // Create demo user
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const openId = `local_demo_${Date.now()}`;
  
  const [userResult] = await conn.execute(
    `INSERT INTO users (openId, name, email, password, role, loginMethod, createdAt, updatedAt, lastSignedIn, authProvider, emailVerified, welcomeMessageSeen, globalRole)
     VALUES (?, ?, ?, ?, 'owner', 'password', NOW(), NOW(), NOW(), 'password', 1, 0, 'none')`,
    [openId, DEMO_NAME, DEMO_EMAIL, passwordHash]
  );
  const userId = userResult.insertId;
  console.log('✅ Created demo user (id:', userId, ')');

  await ensureOrg(userId);
  await conn.end();
}

async function ensureOrg(userId) {
  // Check if user already has an org
  const [orgLinks] = await conn.execute(
    'SELECT ou.organizationId FROM organization_users ou WHERE ou.userId = ? LIMIT 1',
    [userId]
  );
  
  if (orgLinks.length > 0) {
    console.log('✅ User already linked to org:', orgLinks[0].organizationId);
    return orgLinks[0].organizationId;
  }

  // Create demo organization
  const [orgResult] = await conn.execute(
    `INSERT INTO organizations (name, timezone, subscriptionStatus, onboardingStatus, onboardingStep, createdAt, updatedAt)
     VALUES (?, 'America/New_York', 'trial', 'not_started', 1, NOW(), NOW())`,
    [DEMO_ORG_NAME]
  );
  const orgId = orgResult.insertId;
  console.log('✅ Created demo organization (id:', orgId, ')');

  // Link user to org
  await conn.execute(
    `INSERT INTO organization_users (userId, organizationId, role, createdAt)
     VALUES (?, ?, 'owner', NOW())`,
    [userId, orgId]
  );
  console.log('✅ Linked user to organization');

  // Create dojo_settings row for the org
  const [dsExisting] = await conn.execute(
    'SELECT id FROM dojo_settings WHERE organizationId = ? LIMIT 1',
    [orgId]
  );
  if (dsExisting.length === 0) {
    await conn.execute(
      `INSERT INTO dojo_settings (organizationId, businessName, schoolName, timezone, setupCompleted, createdAt, updatedAt)
       VALUES (?, 'Demo Dojo', 'Demo Martial Arts Academy', 'America/New_York', 0, NOW(), NOW())`,
      [orgId]
    );
    console.log('✅ Created dojo_settings for org');
  }

  return orgId;
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
