import { getDb } from './server/db';
import { sql } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) { console.log('No DB connection'); return; }

  // Check leads
  const leads = await db.execute(sql`
    SELECT id, firstName, lastName, email, organizationId, status, stage, createdAt 
    FROM leads 
    WHERE email LIKE '%vincent%' OR firstName LIKE '%vincent%' OR lastName LIKE '%holmes%' 
    LIMIT 10
  `);
  console.log('\n=== LEADS for vincent/holmes ===');
  console.log(JSON.stringify(leads[0], null, 2));

  // Check students
  const students = await db.execute(sql`
    SELECT id, firstName, lastName, email, organizationId, status, createdAt 
    FROM students 
    WHERE email LIKE '%vincent%' OR firstName LIKE '%vincent%' OR lastName LIKE '%holmes%' 
    LIMIT 10
  `);
  console.log('\n=== STUDENTS for vincent/holmes ===');
  console.log(JSON.stringify(students[0], null, 2));

  // Check what orgs exist
  const orgs = await db.execute(sql`
    SELECT id, name, widgetApiKey FROM organizations LIMIT 10
  `);
  console.log('\n=== ORGANIZATIONS ===');
  console.log(JSON.stringify(orgs[0], null, 2));

  // Check recent leads to see what's coming in
  const recentLeads = await db.execute(sql`
    SELECT id, firstName, lastName, email, organizationId, source, status, createdAt 
    FROM leads 
    ORDER BY createdAt DESC 
    LIMIT 10
  `);
  console.log('\n=== RECENT LEADS (last 10) ===');
  console.log(JSON.stringify(recentLeads[0], null, 2));

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
