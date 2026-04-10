import { getDb } from "./server/db";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }
  
  const hash = await bcrypt.hash("Demo1234!", 10);
  
  // Update all owner/admin users to use this password
  const result = await db.update(users)
    .set({ password: hash })
    .where(eq(users.email, "demo@dojoflow.com"));
  
  console.log("Updated demo@dojoflow.com password to Demo1234!");
  
  // Also check what users exist
  const allUsers = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).limit(10);
  console.log("All users:", allUsers);
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
