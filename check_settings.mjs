import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL || '');
const [cols] = await conn.execute('DESCRIBE dojo_settings');
const orgCols = cols.filter(c => c.Field.toLowerCase().includes('org') || c.Field === 'id');
console.log('Org/ID columns:', orgCols.map(c => c.Field + ':' + c.Type));
const [rows] = await conn.execute('SELECT id, organizationId, fluidpayApiKey FROM dojo_settings WHERE fluidpayApiKey IS NOT NULL LIMIT 5');
rows.forEach(r => console.log('Row with key:', JSON.stringify({id: r.id, orgId: r.organizationId, hasKey: !!r.fluidpayApiKey, keyStart: r.fluidpayApiKey?.substring(0, 8)})));
await conn.end();
