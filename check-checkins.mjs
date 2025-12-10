import { getDb } from "./server/db.js";
import { kioskCheckIns } from "./drizzle/schema.js";

async function checkCheckIns() {
  const db = await getDb();
  const checkIns = await db.select().from(kioskCheckIns);
  
  console.log(`Total check-ins: ${checkIns.length}`);
  
  if (checkIns.length > 0) {
    console.log('\nFirst check-in:');
    console.log(checkIns[0]);
    
    console.log('\nLast check-in:');
    console.log(checkIns[checkIns.length - 1]);
    
    // Check if any are from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCheckIns = checkIns.filter(c => new Date(c.timestamp) >= today);
    console.log(`\nCheck-ins from today: ${todayCheckIns.length}`);
  }
  
  process.exit(0);
}

checkCheckIns();
