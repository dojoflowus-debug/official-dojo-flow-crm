import { getDb } from './server/db';
import { students } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  const result = await db.select({
    id: students.id,
    firstName: students.firstName,
    lastName: students.lastName,
    photoUrl: students.photoUrl
  }).from(students).where(eq(students.id, 360018));
  console.log('Student 360018:', JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch(console.error);
