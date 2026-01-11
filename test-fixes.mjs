import { getDb } from './server/db.ts';
import { students, leadSources } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function testFixes() {
  try {
    const db = await getDb();
    if (!db) {
      console.log('❌ Database not available');
      return;
    }
    
    console.log('✓ Database connected');
    
    // Test 1: Query students with organizationId
    try {
      const result = await db.select().from(students).where(eq(students.organizationId, 120001)).limit(1);
      console.log('✓ Students query works:', result.length, 'records found');
    } catch (error) {
      console.log('❌ Students query failed:', error.message);
    }
    
    // Test 2: Check if lead_sources table exists
    try {
      const result = await db.select().from(leadSources).limit(1);
      console.log('✓ Lead sources query works:', result.length, 'records found');
    } catch (error) {
      console.log('❌ Lead sources query failed:', error.message);
    }
    
    console.log('\n✓ All tests completed');
  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

testFixes();
