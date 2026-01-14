import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const enrollments = await db.execute('SELECT * FROM automation_enrollments');
console.log('Total enrollments:', enrollments[0].length);
console.log(JSON.stringify(enrollments[0], null, 2));

await connection.end();
