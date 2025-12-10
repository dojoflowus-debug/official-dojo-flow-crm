import { getDashboardStats } from "./server/db.js";

async function testStats() {
  console.log("Testing getDashboardStats()...\n");
  
  const stats = await getDashboardStats();
  
  console.log("Dashboard Stats:");
  console.log(JSON.stringify(stats, null, 2));
  
  process.exit(0);
}

testStats();
