/**
 * Full DB setup script - applies all migrations from scratch
 * Handles idempotency and TiDB compatibility (fixes DEFAULT 'CURRENT_TIMESTAMP')
 */
import mysql from 'mysql2/promise';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Error codes that are safe to ignore (idempotent operations)
const IGNORABLE_ERRORS = new Set([
  'ER_CANT_DROP_FIELD_OR_KEY',  // DROP COLUMN on non-existent column
  'ER_DUP_FIELDNAME',           // ADD COLUMN that already exists
  'ER_TABLE_EXISTS_ERROR',      // CREATE TABLE that already exists
  'ER_DUP_KEYNAME',             // ADD INDEX/CONSTRAINT that already exists
  'ER_BAD_FIELD_ERROR',         // Reference to non-existent column
  'ER_NO_SUCH_TABLE',           // DROP TABLE / ALTER TABLE on non-existent table
  'ER_DUP_ENTRY',               // Duplicate key on insert
  'ER_KEY_COLUMN_DOES_NOT_EXITS', // Index on non-existent column
]);

// Fix TiDB/MySQL 8 incompatibilities in SQL statements
function fixSql(sql) {
  // Fix: DEFAULT 'CURRENT_TIMESTAMP' -> DEFAULT (now())
  sql = sql.replace(/DEFAULT 'CURRENT_TIMESTAMP'/g, 'DEFAULT (now())');
  // Fix: DEFAULT CURRENT_TIMESTAMP (without parens, not in quotes) -> DEFAULT (now())
  sql = sql.replace(/DEFAULT CURRENT_TIMESTAMP(?!\(\))/g, 'DEFAULT (now())');
  return sql;
}

async function main() {
  const conn = await mysql.createConnection({ 
    uri: url, 
    ssl: { rejectUnauthorized: false },
  });

  // Get list of all migration SQL files in order
  const drizzleDir = join(__dirname, 'drizzle');
  const allFiles = readdirSync(drizzleDir)
    .filter(f => f.match(/^\d{4}_.*\.sql$/))
    .sort();

  console.log(`Found ${allFiles.length} migration files`);

  let totalApplied = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const file of allFiles) {
    const filePath = join(drizzleDir, file);
    const rawSql = readFileSync(filePath, 'utf-8');
    const sql = fixSql(rawSql);

    // Split into individual statements
    const statements = sql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    if (statements.length === 0) continue;

    let fileErrors = 0;
    for (const stmt of statements) {
      if (!stmt || stmt.trim() === '') continue;
      try {
        await conn.execute(stmt);
        totalApplied++;
      } catch (e) {
        if (IGNORABLE_ERRORS.has(e.code)) {
          totalSkipped++;
        } else if (e.message && (
          e.message.includes('Unsupported drop primary key') ||
          e.message.includes('Schema change caused error') ||
          e.message.includes('doesn\'t exist')
        )) {
          // TiDB-specific errors we can ignore
          totalSkipped++;
        } else {
          console.error(`  ❌ [${file}] ${e.code || 'ERR'}: ${(e.message || '').substring(0, 100)}`);
          totalErrors++;
          fileErrors++;
        }
      }
    }
    
    if (fileErrors === 0) {
      process.stdout.write(`✅ ${file}\n`);
    } else {
      process.stdout.write(`⚠️  ${file} (${fileErrors} errors)\n`);
    }
  }

  await conn.end();
  
  console.log(`\n✅ Done: ${totalApplied} applied, ${totalSkipped} skipped, ${totalErrors} errors`);
  
  // Verify key tables exist
  const conn2 = await mysql.createConnection({ uri: url, ssl: { rejectUnauthorized: false } });
  const [rows] = await conn2.execute('SHOW TABLES');
  const tables = rows.map(r => Object.values(r)[0]);
  console.log(`\nTables in DB (${tables.length}):`, tables.sort().join(', '));
  await conn2.end();
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
