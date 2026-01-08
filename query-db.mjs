import { getDb } from './server/db.js';
import { locations } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const db = await getDb();
const result = await db.select().from(locations).where(eq(locations.kioskSlug, 'main-dojo')).limit(1);

if (result.length > 0) {
  const loc = result[0];
  console.log('[TRUTH_TRACE] DB Query Result for main-dojo:');
  console.log('ID:', loc.id);
  console.log('Name:', loc.name);
  console.log('Slug:', loc.kioskSlug);
  console.log('Settings JSON:', JSON.stringify(loc.kioskSettings, null, 2));
} else {
  console.log('Location not found');
}

process.exit(0);
