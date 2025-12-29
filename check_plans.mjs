import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const result = await connection.query('SELECT id, name, slug, monthlyPrice, monthlyCredits FROM subscription_plans ORDER BY displayOrder');
console.log(JSON.stringify(result[0], null, 2));

await connection.end();
