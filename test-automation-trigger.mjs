import mysql from 'mysql2/promise';
import { triggerAutomation } from './server/services/automationEngine.ts';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Insert a test lead directly
const [result] = await conn.execute(`
  INSERT INTO leads (firstName, lastName, email, phone, source, status)
  VALUES ('Automation', 'Test', 'automation-test@example.com', '+15555559999', 'Manual Test', 'New Lead')
`);

const leadId = result.insertId;
console.log('Created test lead with ID:', leadId);

// Trigger automation
await triggerAutomation('new_lead', 'lead', leadId);

// Wait a moment for async operations
await new Promise(resolve => setTimeout(resolve, 3000));

// Check if enrollment was created
const [enrollments] = await conn.execute(`
  SELECT * FROM automation_enrollments WHERE enrolledType = 'lead' AND enrolledId = ?
`, [leadId]);

console.log('Enrollments created:', JSON.stringify(enrollments, null, 2));

// Check step executions
if (enrollments.length > 0) {
  const [executions] = await conn.execute(`
    SELECT * FROM automation_step_executions WHERE enrollmentId = ?
  `, [enrollments[0].id]);
  console.log('Step executions:', JSON.stringify(executions, null, 2));
}

await conn.end();
