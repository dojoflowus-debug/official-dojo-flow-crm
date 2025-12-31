import mysql from "mysql2/promise";

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [kiosk] = await connection.execute(`
    SELECT organizationId, schoolName, schoolLogo FROM kiosk_settings 
    WHERE organizationId IN (120001, 180001)
  `);
  console.log("Kiosk settings:", JSON.stringify(kiosk, null, 2));
  
  await connection.end();
}

main().catch(console.error);
