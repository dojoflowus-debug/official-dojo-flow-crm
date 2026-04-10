/**
 * run-mydojo-sync.mjs
 * 
 * Directly imports leads and students from mydojoma.com into DojoFlow CRM.
 * Run with: node run-mydojo-sync.mjs
 */
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

const MYDOJO_SYNC_URL = 'https://mydojoma.com/api/sync-export';
const MYDOJO_API_KEY = 'man-zone-outdoor';

function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  if (parts.length === 0) return { firstName: 'Unknown', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function mapStatus(pipelineStage, status) {
  const stage = (pipelineStage || status || '').toLowerCase();
  if (stage.includes('enrolled') || stage.includes('won')) return 'Enrolled';
  if (stage.includes('intro') || stage.includes('scheduled') || stage.includes('trial')) return 'Intro Scheduled';
  if (stage.includes('offer') || stage.includes('proposal')) return 'Offer Presented';
  if (stage.includes('contact_made') || stage.includes('contacted')) return 'Contact Made';
  if (stage.includes('attempting') || stage.includes('attempt')) return 'Attempting Contact';
  if (stage.includes('nurture') || stage.includes('cold')) return 'Nurture';
  if (stage.includes('lost') || stage.includes('winback')) return 'Lost/Winback';
  return 'New Lead';
}

async function main() {
  console.log('🔄 Fetching data from mydojoma.com...');
  const res = await fetch(MYDOJO_SYNC_URL, {
    headers: { 'x-api-key': MYDOJO_API_KEY, Accept: 'application/json' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (text.trim().startsWith('<')) throw new Error('Got HTML instead of JSON');
  const data = JSON.parse(text);
  console.log(`✅ Got ${data.counts.introAppointments} intro appointments, ${data.counts.students} students`);

  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Vincent Holmes (vincent.holmes00@gmail.com) → organizationId 210001 (MyDojo)
  const orgId = 210001;
  console.log(`✅ Using org ID: ${orgId} (MyDojo - Vincent Holmes)`);

  let leadsCreated = 0, leadsUpdated = 0, leadsSkipped = 0;
  let studentsCreated = 0, studentsUpdated = 0, studentsSkipped = 0;
  const errors = [];

  // ── Import leads (intro appointments) ──────────────────────────────────
  console.log('\n📋 Importing intro appointments as leads...');
  for (const appt of data.introAppointments) {
    try {
      const { firstName, lastName } = splitName(appt.name || '');
      const email = (appt.email || '').trim().toLowerCase() || null;
      const phone = (appt.phone || '').replace(/[^0-9+]/g, '') || null;
      const leadStatus = mapStatus(appt.pipelineStage, appt.status);
      const source = appt.source === 'lead_magnet' ? 'Website' 
        : appt.source === 'referral' ? 'Referral'
        : appt.source === 'social_media' ? 'Social Media'
        : appt.source || 'MyDojo Website';
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const createdAt = appt.createdAt 
        ? new Date(appt.createdAt).toISOString().slice(0, 19).replace('T', ' ')
        : now;

      // Check for existing lead by email or phone
      let existingId = null;
      if (email) {
        const [found] = await conn.execute(
          'SELECT id FROM leads WHERE organizationId = ? AND email = ? LIMIT 1',
          [orgId, email]
        );
        if (found.length > 0) existingId = found[0].id;
      }
      if (!existingId && phone) {
        const [found] = await conn.execute(
          'SELECT id FROM leads WHERE organizationId = ? AND phone = ? LIMIT 1',
          [orgId, phone]
        );
        if (found.length > 0) existingId = found[0].id;
      }

      if (existingId) {
        await conn.execute(
          `UPDATE leads SET status = ?, source = ?, interestedProgram = ?, updatedAt = ? WHERE id = ?`,
          [leadStatus, source, appt.program || null, now, existingId]
        );
        leadsUpdated++;
      } else {
        await conn.execute(
          `INSERT INTO leads (firstName, lastName, email, phone, status, source, interestedProgram, notes, organizationId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [firstName, lastName, email, phone, leadStatus, source, appt.program || null, appt.notes || null, orgId, createdAt, now]
        );
        leadsCreated++;
      }
    } catch (err) {
      errors.push(`Lead "${appt.name}": ${err.message}`);
      leadsSkipped++;
    }
  }
  console.log(`  ✅ Leads: ${leadsCreated} created, ${leadsUpdated} updated, ${leadsSkipped} skipped`);

  // ── Import students ─────────────────────────────────────────────────────
  console.log('\n👥 Importing students...');
  for (const s of data.students) {
    try {
      const fullName = s.studentName || s.customerName || '';
      const { firstName, lastName } = splitName(fullName);
      const email = (s.customerEmail || '').trim().toLowerCase() || null;
      const phone = (s.customerPhone || '').replace(/[^0-9+]/g, '') || null;
      const beltRank = s.beltRank || null;
      const studentStatus = s.status === 'active' ? 'Active' : s.status === 'frozen' ? 'On Hold' : 'Inactive';
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const createdAt = s.createdAt
        ? new Date(s.createdAt).toISOString().slice(0, 19).replace('T', ' ')
        : now;

      let existingId = null;
      if (email) {
        const [found] = await conn.execute(
          'SELECT id FROM students WHERE organizationId = ? AND email = ? LIMIT 1',
          [orgId, email]
        );
        if (found.length > 0) existingId = found[0].id;
      }

      if (existingId) {
        await conn.execute(
          `UPDATE students SET beltRank = ?, status = ?, membershipStatus = ?, updatedAt = ? WHERE id = ?`,
          [beltRank, studentStatus, s.packageName || null, now, existingId]
        );
        studentsUpdated++;
      } else {
        await conn.execute(
          `INSERT INTO students (firstName, lastName, email, phone, beltRank, status, membershipStatus, program, organizationId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [firstName, lastName, email, phone, beltRank, studentStatus, s.packageName || null, s.packageName || null, orgId, createdAt, now]
        );
        studentsCreated++;
      }
    } catch (err) {
      errors.push(`Student "${s.studentName || s.customerName}": ${err.message}`);
      studentsSkipped++;
    }
  }
  console.log(`  ✅ Students: ${studentsCreated} created, ${studentsUpdated} updated, ${studentsSkipped} skipped`);

  if (errors.length > 0) {
    console.log('\n⚠️  Errors:');
    errors.slice(0, 10).forEach(e => console.log(' -', e));
  }

  console.log('\n🎉 Sync complete!');
  console.log(`Total: ${leadsCreated + leadsUpdated} leads, ${studentsCreated + studentsUpdated} students imported`);
  
  await conn.end();
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
