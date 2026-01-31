import { getDb } from './server/db.ts';
import { students } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  const [student] = await db.select().from(students).where(eq(students.id, 360018));
  
  if (student) {
    console.log('Student ID:', student.id);
    console.log('Name:', student.firstName, student.lastName);
    console.log('Photo URL type:', student.photoUrl ? (student.photoUrl.startsWith('data:') ? 'data URL' : 'external URL') : 'null');
    console.log('Photo URL length:', student.photoUrl?.length || 0);
    console.log('Photo URL preview:', student.photoUrl?.substring(0, 100) || 'null');
  } else {
    console.log('Student not found');
  }
  process.exit(0);
}

main().catch(console.error);
