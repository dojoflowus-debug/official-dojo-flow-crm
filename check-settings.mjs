import { getDb } from './server/db.js';
import { dojoSettings } from './drizzle/schema.js';

const db = await getDb();
if (!db) {
  console.log('Database not available');
  process.exit(1);
}

const settings = await db.select().from(dojoSettings).limit(1);
console.log('dojo_settings rows:', settings.length);
if (settings.length > 0) {
  console.log('businessName:', settings[0].businessName);
  console.log('logoSquare:', settings[0].logoSquare);
} else {
  console.log('No settings found - table is empty');
}
process.exit(0);
