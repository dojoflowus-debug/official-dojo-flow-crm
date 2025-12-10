import { getDb } from "./server/db.js";
import { students, leads, kioskCheckIns, kioskVisitors, kioskWaivers, classes } from "./drizzle/schema.js";

async function checkData() {
  const db = await getDb();
  
  const studentCount = await db.select().from(students);
  const leadCount = await db.select().from(leads);
  const checkInCount = await db.select().from(kioskCheckIns);
  const visitorCount = await db.select().from(kioskVisitors);
  const waiverCount = await db.select().from(kioskWaivers);
  const classCount = await db.select().from(classes);
  
  console.log("📊 Database Data Check:");
  console.log(`  Students: ${studentCount.length}`);
  console.log(`  Leads: ${leadCount.length}`);
  console.log(`  Check-ins: ${checkInCount.length}`);
  console.log(`  Visitors: ${visitorCount.length}`);
  console.log(`  Waivers: ${waiverCount.length}`);
  console.log(`  Classes: ${classCount.length}`);
  
  if (studentCount.length > 0) {
    console.log("\n👤 Sample student:");
    console.log(studentCount[0]);
  }
  
  process.exit(0);
}

checkData();
