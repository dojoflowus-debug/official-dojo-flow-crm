/**
 * Test script to verify automation email delivery for new leads
 */

import { getDb } from "./server/db.js";
import { leads, automationEnrollments } from "./drizzle/schema.js";
import { triggerAutomation } from "./server/services/automationEngine.js";
import { eq } from "drizzle-orm";

async function testAutomationEmail() {
  console.log("🧪 Testing Automation Email Delivery for New Leads\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    return;
  }

  // Create a test lead
  console.log("1️⃣ Creating test lead...");
  const testLead = {
    firstName: "Test",
    lastName: "Automation",
    email: "test.automation@example.com",
    phone: "+15555551234",
    source: "website",
    status: "New Lead", // Valid status from enum
    createdAt: new Date(),
  };

  const result = await db.insert(leads).values(testLead);
  const leadId = Number(result.insertId);
  console.log(`✅ Test lead created with ID: ${leadId}`);
  
  if (!leadId || isNaN(leadId)) {
    throw new Error("Failed to get lead ID from insert");
  }

  // Trigger automation
  console.log("\n2️⃣ Triggering 'new_lead' automation...");
  await triggerAutomation("new_lead", "lead", leadId);
  console.log("✅ Automation triggered");

  // Wait 2 seconds for immediate processing
  console.log("\n3️⃣ Waiting 2 seconds for immediate processing...");
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check enrollments
  console.log("\n4️⃣ Checking automation enrollments...");
  const enrollments = await db.select()
    .from(automationEnrollments)
    .where(
      eq(automationEnrollments.enrolledId, leadId)
    );

  console.log(`✅ Found ${enrollments.length} enrollment(s)`);
  
  if (enrollments.length > 0) {
    enrollments.forEach((enrollment, index) => {
      console.log(`\nEnrollment ${index + 1}:`);
      console.log(`  - Sequence ID: ${enrollment.sequenceId}`);
      console.log(`  - Status: ${enrollment.status}`);
      console.log(`  - Current Step: ${enrollment.currentStepId}`);
      console.log(`  - Next Execution: ${enrollment.nextExecutionAt}`);
    });
  }

  // Clean up test lead
  console.log("\n5️⃣ Cleaning up test lead...");
  await db.delete(leads).where(eq(leads.id, leadId));
  console.log("✅ Test lead deleted");

  console.log("\n✅ Test complete!");
  console.log("\n📧 Check your email and server logs to verify if emails were sent immediately.");
  
  process.exit(0);
}

testAutomationEmail().catch(error => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
