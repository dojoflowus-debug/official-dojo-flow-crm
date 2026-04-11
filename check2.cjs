const mysql = require('mysql2/promise');
require('dotenv').config();

mysql.createConnection(process.env.DATABASE_URL || '').then(async conn => {
  // Check what rows exist with fluidpayApiKey set
  const [rows] = await conn.execute('SELECT id, organizationId, fluidpayApiKey FROM dojo_settings WHERE fluidpayApiKey IS NOT NULL LIMIT 5');
  console.log('Rows with FluidPay key:');
  rows.forEach(r => console.log('  id:', r.id, 'orgId:', r.organizationId, 'hasKey:', !!r.fluidpayApiKey, 'keyStart:', r.fluidpayApiKey ? r.fluidpayApiKey.substring(0, 12) : 'null'));
  
  // Check row for org 210001
  const [rows2] = await conn.execute('SELECT id, organizationId, fluidpayApiKey FROM dojo_settings WHERE organizationId = 210001 LIMIT 1');
  console.log('Row for org 210001:', rows2.length ? JSON.stringify({id: rows2[0].id, orgId: rows2[0].organizationId, hasKey: !!rows2[0].fluidpayApiKey}) : 'NOT FOUND');
  
  await conn.end();
}).catch(e => console.error('Error:', e.message));
