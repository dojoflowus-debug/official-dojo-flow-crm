/**
 * Safe migration runner - applies pending migrations with error handling
 * Skips statements that fail due to "already exists" or "doesn't exist" errors
 */
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Migrations to apply (from 38 onwards, since 38 is the last applied)
const PENDING_MIGRATIONS = [
  '0038_round_amazoness',
  '0039_slippery_bucky',
  '0040_glamorous_mordo',
  '0041_stiff_cerebro',
  '0042_clumsy_hedge_knight',
  '0043_naive_bromley',
  '0044_watery_bromley',
  '0045_broad_living_tribunal',
  '0046_strange_prism',
  '0047_glossy_earthquake',
  '0048_simple_justice',
  '0049_minor_leper_queen',
  '0050_lonely_grandmaster',
  '0051_watery_the_twelve',
  '0052_bouncy_corsair',
  '0053_kind_pyro',
  '0054_tearful_maverick',
  '0055_flowery_lockheed',
  '0056_fuzzy_war_machine',
  '0057_sturdy_nomad',
  '0058_lying_apocalypse',
  '0059_fluffy_rick_jones',
  '0060_grey_maximus',
  '0061_milky_betty_ross',
  '0062_acoustic_wiccan',
  '0063_legal_blob',
  '0064_fixed_silver_samurai',
  '0065_flat_ulik',
  '0066_secret_malcolm_colcord',
  '0067_majestic_hobgoblin',
  '0068_nosy_xavin',
  '0069_wide_greymalkin',
  '0070_past_romulus',
  '0071_magical_captain_cross',
  '0072_many_taskmaster',
  '0073_keen_genesis',
  '0074_certain_silver_sable',
  '0075_fix_photo_url_mediumtext',
  '0076_add_onboarding_profile',
];

// Error codes that are safe to ignore (idempotent operations)
const IGNORABLE_ERRORS = [
  'ER_CANT_DROP_FIELD_OR_KEY',  // DROP COLUMN on non-existent column
  'ER_DUP_FIELDNAME',           // ADD COLUMN that already exists
  'ER_TABLE_EXISTS_ERROR',      // CREATE TABLE that already exists
  'ER_DUP_KEYNAME',             // ADD INDEX/CONSTRAINT that already exists
  'ER_BAD_FIELD_ERROR',         // Reference to non-existent column
  'ER_NO_SUCH_TABLE',           // DROP TABLE on non-existent table
];

async function main() {
  const conn = await mysql.createConnection({ 
    uri: url, 
    ssl: { rejectUnauthorized: false },
    multipleStatements: true,
  });

  // Check which migrations are already applied
  let appliedHashes = new Set();
  try {
    const [rows] = await conn.execute('SELECT hash FROM __drizzle_migrations');
    appliedHashes = new Set(rows.map(r => r.hash));
    console.log(`Already applied: ${appliedHashes.size} migrations`);
  } catch (e) {
    console.log('Could not read migration table:', e.message);
  }

  let applied = 0;
  let skipped = 0;
  let errors = 0;

  for (const migName of PENDING_MIGRATIONS) {
    const sqlPath = join(__dirname, 'drizzle', `${migName}.sql`);
    let sql;
    try {
      sql = readFileSync(sqlPath, 'utf-8');
    } catch (e) {
      console.log(`⚠️  File not found: ${migName}.sql - skipping`);
      skipped++;
      continue;
    }

    // Split into individual statements (drizzle uses --> statement-breakpoint)
    const statements = sql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`\n📦 ${migName} (${statements.length} statements)`);
    
    let migrationOk = true;
    for (const stmt of statements) {
      try {
        await conn.execute(stmt);
        console.log(`  ✅ ${stmt.substring(0, 80)}...`);
      } catch (e) {
        if (IGNORABLE_ERRORS.includes(e.code)) {
          console.log(`  ⏭️  Skipped (${e.code}): ${stmt.substring(0, 80)}`);
        } else {
          console.error(`  ❌ Error (${e.code}): ${e.message}`);
          console.error(`     SQL: ${stmt.substring(0, 120)}`);
          migrationOk = false;
          errors++;
        }
      }
    }

    // Record migration as applied in __drizzle_migrations
    // Use a simple hash of the filename for tracking
    if (migrationOk) {
      try {
        // Get the hash from journal
        const journalPath = join(__dirname, 'drizzle', 'meta', '_journal.json');
        const journal = JSON.parse(readFileSync(journalPath, 'utf-8'));
        const entry = journal.entries.find(e => e.tag === migName);
        if (entry) {
          // Check if already recorded
          const [existing] = await conn.execute(
            'SELECT id FROM __drizzle_migrations WHERE hash = ?',
            [entry.hash || migName]
          );
          if (existing.length === 0) {
            await conn.execute(
              'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
              [entry.hash || migName, Date.now()]
            );
          }
        }
        applied++;
      } catch (e) {
        console.log(`  ⚠️  Could not record migration: ${e.message}`);
      }
    }
  }

  await conn.end();
  
  console.log(`\n✅ Done: ${applied} applied, ${skipped} skipped, ${errors} errors`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
