import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.query('SELECT fluidpay_public_key, fluidpay_api_key FROM dojo_settings LIMIT 3');
console.log('Rows:', JSON.stringify(rows, null, 2));
await conn.end();
