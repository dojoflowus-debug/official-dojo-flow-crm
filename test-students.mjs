import { getDb } from './server/db.js';
import { students } from './drizzle/schema.js';

const db = await getDb();
if (!db) {
  console.log('Database not available');
  process.exit(1);
}

const allStudents = await db.select().from(students).limit(5);
console.log('Sample students:', JSON.stringify(allStudents, null, 2));
console.log('Total count:', allStudents.length);
