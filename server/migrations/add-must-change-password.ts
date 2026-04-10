import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function addMustChangePasswordColumn() {
  try {
    // Check if column already exists
    const result = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'must_change_password'
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    const rows = result as any[];
    const count = rows[0]?.count || rows[0]?.[0]?.count || 0;
    
    if (Number(count) === 0) {
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN must_change_password INT NOT NULL DEFAULT 0
      `);
      console.log('[Migration] Added must_change_password column to users table');
    } else {
      console.log('[Migration] must_change_password column already exists, skipping');
    }
  } catch (error) {
    console.error('[Migration] Failed to add must_change_password column:', error);
  }
}
