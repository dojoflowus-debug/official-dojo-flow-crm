import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });
  
  const [rows] = await connection.execute('SELECT id, firstName, lastName, photoUrl FROM students WHERE id = 360018');
  console.log('Student 360018:', JSON.stringify(rows, null, 2));
  
  await connection.end();
}

main().catch(console.error);
