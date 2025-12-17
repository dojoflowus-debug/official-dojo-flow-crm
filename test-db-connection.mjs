import mysql from 'mysql2/promise';

try {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('✅ Connected successfully');
  
  const [rows] = await connection.execute('SELECT businessName, logoSquare FROM dojo_settings LIMIT 1');
  console.log('✅ Query result:', rows);
  
  await connection.end();
  console.log('✅ Connection closed');
  process.exit(0);
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  process.exit(1);
}
