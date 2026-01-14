import { drizzle } from "drizzle-orm/mysql2";
import { students } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);
const result = await db.select({ 
  id: students.id, 
  firstName: students.firstName, 
  lastName: students.lastName, 
  email: students.email 
}).from(students).limit(5);
console.log(JSON.stringify(result, null, 2));
process.exit(0);
