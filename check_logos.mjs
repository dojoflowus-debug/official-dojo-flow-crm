import { getDb } from './server/db.ts';
import { schoolProfiles } from './drizzle/schema.ts';

async function main() {
  const db = await getDb();
  const profiles = await db.select().from(schoolProfiles).limit(5);
  console.log('School profiles:', JSON.stringify(profiles, null, 2));
  process.exit(0);
}

main().catch(console.error);
