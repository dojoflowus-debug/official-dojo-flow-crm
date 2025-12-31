import mysql from "mysql2/promise";

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Check students for these orgs
  const [students] = await connection.execute(`
    SELECT organizationId, COUNT(*) as count FROM students 
    WHERE organizationId IN (120001, 180001) 
    GROUP BY organizationId
  `);
  console.log("Students by org:", students);
  
  // Check classes for these orgs
  const [classes] = await connection.execute(`
    SELECT organizationId, COUNT(*) as count FROM classes 
    WHERE organizationId IN (120001, 180001) 
    GROUP BY organizationId
  `);
  console.log("Classes by org:", classes);
  
  // Check platform_onboarding_progress for school names
  const [onboarding] = await connection.execute(`
    SELECT * FROM platform_onboarding_progress 
    WHERE organizationId IN (120001, 180001)
  `);
  console.log("Onboarding progress:", JSON.stringify(onboarding, null, 2));
  
  // Check kiosk_settings for school info
  const [kiosk] = await connection.execute(`
    SELECT organizationId, schoolName, schoolLogo FROM kiosk_settings 
    WHERE organizationId IN (120001, 180001)
  `);
  console.log("Kiosk settings:", JSON.stringify(kiosk, null, 2));
  
  await connection.end();
}

main().catch(console.error);
