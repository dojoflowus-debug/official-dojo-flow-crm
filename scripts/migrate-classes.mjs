/**
 * Migration script to add missing columns to the classes table
 * These columns exist in the Drizzle schema but were never migrated to the DB
 */
import { createPool } from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const pool = createPool(url);

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('Checking existing columns...');
    const [rows] = await conn.execute('DESCRIBE classes');
    const existingColumns = rows.map(r => r.Field);
    console.log('Existing columns:', existingColumns);

    const columnsToAdd = [
      { name: 'location_id', sql: 'ALTER TABLE classes ADD COLUMN location_id INT NULL' },
      { name: 'start_date', sql: 'ALTER TABLE classes ADD COLUMN start_date DATE NULL' },
      { name: 'end_date', sql: 'ALTER TABLE classes ADD COLUMN end_date DATE NULL' },
      { name: 'duration_minutes', sql: 'ALTER TABLE classes ADD COLUMN duration_minutes INT NOT NULL DEFAULT 60' },
      { name: 'recurring_pattern', sql: "ALTER TABLE classes ADD COLUMN recurring_pattern ENUM('weekly','biweekly','monthly','one_time') DEFAULT 'weekly'" },
      { name: 'class_notes', sql: 'ALTER TABLE classes ADD COLUMN class_notes TEXT NULL' },
    ];

    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name)) {
        console.log(`Adding column: ${col.name}`);
        await conn.execute(col.sql);
        console.log(`  ✓ Added ${col.name}`);
      } else {
        console.log(`  ✓ Column ${col.name} already exists`);
      }
    }

    console.log('Migration complete!');
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate().catch(e => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
