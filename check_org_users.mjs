import mysql from "mysql2/promise";

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [results] = await connection.execute(`
    SELECT ou.organizationId as orgId, ou.userId, ou.role, ou.isPrimary, u.email, u.name 
    FROM organization_users ou 
    LEFT JOIN users u ON ou.userId = u.id 
    WHERE u.email IN ('sensei30002003@gmail.com', 'solbittech@gmail.com')
  `);
  
  console.log(JSON.stringify(results, null, 2));
  await connection.end();
}

main().catch(console.error);
