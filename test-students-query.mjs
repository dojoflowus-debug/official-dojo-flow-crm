import { getDb } from './server/db.ts';
import { students } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function test() {
  try {
    const db = await getDb();
    if (!db) {
      console.log('Database not available');
      return;
    }
    
    // Test if students table exists and can be queried
    const result = await db.select().from(students).where(eq(students.organizationId, 120001)).limit(1);
    console.log('Students query successful:', result.length, 'records');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
