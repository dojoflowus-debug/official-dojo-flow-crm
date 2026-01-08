import { getDb } from './server/db';
import { students, studentAccounts } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function checkStudent() {
  const db = await getDb();
  if (!db) {
    console.error('No DB');
    process.exit(1);
  }

  const student = await db.select().from(students).where(eq(students.email, 'test.student@dojoflow.test')).limit(1);
  console.log('Student:', student[0]);

  const account = await db.select().from(studentAccounts).where(eq(studentAccounts.email, 'test.student@dojoflow.test')).limit(1);
  console.log('Account:', account[0]);
}

checkStudent();
