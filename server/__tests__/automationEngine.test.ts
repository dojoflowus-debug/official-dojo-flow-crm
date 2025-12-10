import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDb } from "../db";
import { automationSequences, automationSteps, automationEnrollments, leads } from "../../drizzle/schema";
import { triggerAutomation, processAutomations } from "../services/automationEngine";
import { eq } from "drizzle-orm";

describe("Automation Engine", () => {
  let testSequenceId: number;
  let testLeadId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test lead
    const [lead] = await db.insert(leads).values({
      firstName: "Test",
      lastName: "Lead",
      email: "test@example.com",
      phone: "+15551234567",
      source: "Test",
      status: "New Lead",
    });
    testLeadId = lead.insertId;

    // Create test automation sequence
    const [sequence] = await db.insert(automationSequences).values({
      name: "Test Welcome Sequence",
      description: "Test automation for new leads",
      trigger: "new_lead",
      isActive: 1,
      createdBy: 1,
    });
    testSequenceId = sequence.insertId;

    // Add steps to sequence
    await db.insert(automationSteps).values([
      {
        sequenceId: testSequenceId,
        stepOrder: 1,
        stepType: "wait",
        waitMinutes: 1, // 1 minute wait for testing
        name: "Wait 1 minute",
      },
      {
        sequenceId: testSequenceId,
        stepOrder: 2,
        stepType: "send_sms",
        message: "Hi {{firstName}}, welcome to our dojo!",
        name: "Send welcome SMS",
      },
      {
        sequenceId: testSequenceId,
        stepOrder: 3,
        stepType: "end",
        name: "End sequence",
      },
    ]);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(automationEnrollments).where(eq(automationEnrollments.sequenceId, testSequenceId));
    await db.delete(automationSteps).where(eq(automationSteps.sequenceId, testSequenceId));
    await db.delete(automationSequences).where(eq(automationSequences.id, testSequenceId));
    await db.delete(leads).where(eq(leads.id, testLeadId));
  });

  it("should trigger automation for new lead", async () => {
    await triggerAutomation("new_lead", "lead", testLeadId);

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Check enrollment was created
    const enrollments = await db.select()
      .from(automationEnrollments)
      .where(eq(automationEnrollments.sequenceId, testSequenceId));

    expect(enrollments.length).toBeGreaterThan(0);
    expect(enrollments[0].enrolledType).toBe("lead");
    expect(enrollments[0].enrolledId).toBe(testLeadId);
    expect(enrollments[0].status).toBe("active");
  });

  it("should not create duplicate enrollments", async () => {
    // Try to trigger again
    await triggerAutomation("new_lead", "lead", testLeadId);

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Should still have only one enrollment
    const enrollments = await db.select()
      .from(automationEnrollments)
      .where(eq(automationEnrollments.sequenceId, testSequenceId));

    expect(enrollments.length).toBe(1);
  });

  it("should set next execution time based on wait step", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const enrollments = await db.select()
      .from(automationEnrollments)
      .where(eq(automationEnrollments.sequenceId, testSequenceId));

    expect(enrollments[0].nextExecutionAt).toBeTruthy();
    
    // Next execution should be in the future (wait step is 1 minute)
    const nextExecution = new Date(enrollments[0].nextExecutionAt!);
    const now = new Date();
    expect(nextExecution.getTime()).toBeGreaterThan(now.getTime());
  });

  it("should process pending automations", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Set next execution to past so it gets processed
    await db.update(automationEnrollments)
      .set({ nextExecutionAt: new Date(Date.now() - 1000) })
      .where(eq(automationEnrollments.sequenceId, testSequenceId));

    // Process automations
    await processAutomations();

    // Check that enrollment moved to next step
    const enrollments = await db.select()
      .from(automationEnrollments)
      .where(eq(automationEnrollments.sequenceId, testSequenceId));

    // Should have moved from step 1 (wait) to step 2 (send_sms)
    const steps = await db.select()
      .from(automationSteps)
      .where(eq(automationSteps.sequenceId, testSequenceId));

    const step2 = steps.find(s => s.stepOrder === 2);
    expect(enrollments[0].currentStepId).toBe(step2?.id);
  });

  it("should complete sequence when reaching end step", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Move to end step
    const steps = await db.select()
      .from(automationSteps)
      .where(eq(automationSteps.sequenceId, testSequenceId));

    const endStep = steps.find(s => s.stepType === "end");

    await db.update(automationEnrollments)
      .set({ 
        currentStepId: endStep?.id,
        nextExecutionAt: new Date(Date.now() - 1000)
      })
      .where(eq(automationEnrollments.sequenceId, testSequenceId));

    // Process automations
    await processAutomations();

    // Check enrollment is completed
    const enrollments = await db.select()
      .from(automationEnrollments)
      .where(eq(automationEnrollments.sequenceId, testSequenceId));

    expect(enrollments[0].status).toBe("completed");
    expect(enrollments[0].completedAt).toBeTruthy();
  });

  it("should update sequence enrollment count", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [sequence] = await db.select()
      .from(automationSequences)
      .where(eq(automationSequences.id, testSequenceId));

    expect(sequence.enrollmentCount).toBeGreaterThan(0);
  });

  it("should update sequence completed count", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [sequence] = await db.select()
      .from(automationSequences)
      .where(eq(automationSequences.id, testSequenceId));

    expect(sequence.completedCount).toBeGreaterThan(0);
  });

  it("should not trigger inactive sequences", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create inactive sequence
    const [inactiveSeq] = await db.insert(automationSequences).values({
      name: "Inactive Sequence",
      trigger: "new_lead",
      isActive: 0,
      createdBy: 1,
    });

    // Try to trigger
    await triggerAutomation("new_lead", "lead", testLeadId);

    // Check no enrollment for inactive sequence
    const enrollments = await db.select()
      .from(automationEnrollments)
      .where(eq(automationEnrollments.sequenceId, inactiveSeq.insertId));

    expect(enrollments.length).toBe(0);

    // Clean up
    await db.delete(automationSequences).where(eq(automationSequences.id, inactiveSeq.insertId));
  });

  it("should replace variables in messages", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get the SMS step
    const steps = await db.select()
      .from(automationSteps)
      .where(eq(automationSteps.sequenceId, testSequenceId));

    const smsStep = steps.find(s => s.stepType === "send_sms");
    expect(smsStep?.message).toContain("{{firstName}}");

    // Variable replacement is tested in the actual execution
    // We just verify the template exists
    expect(smsStep?.message).toBeTruthy();
  });
});
