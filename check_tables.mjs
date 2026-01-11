import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [tables] = await conn.execute('SHOW TABLES');
  console.log('Tables in database:');
  tables.forEach(t => {
    const tableName = Object.values(t)[0];
    if (tableName.includes('kiosk')) {
      console.log('  -', tableName);
    }
  });
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await conn.end();
}
