import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { leads, automationEnrollments, automationStepExecutions } from "../../drizzle/schema";
import { triggerAutomation } from "../services/automationEngine";
import { eq, and } from "drizzle-orm";

describe("Automation Trigger on Lead Creation", () => {
  let testLeadId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test lead
    const [lead] = await db.insert(leads).values({
      firstName: "Trigger",
      lastName: "Test",
      email: "trigger-test@example.com",
      phone: "+15555558888",
      status: "New Lead",
    }).$returningId();

    testLeadId = lead.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(automationStepExecutions)
      .where(
        eq(automationStepExecutions.enrollmentId, 
          db.select({ id: automationEnrollments.id })
            .from(automationEnrollments)
            .where(
              and(
                eq(automationEnrollments.enrolledType, "lead"),
                eq(automationEnrollments.enrolledId, testLeadId)
              )
            ) as any
        )
      );
    
    await db.delete(automationEnrollments)
      .where(
        and(
          eq(automationEnrollments.enrolledType, "lead"),
          eq(automationEnrollments.enrolledId, testLeadId)
        )
      );
    
    await db.delete(leads).where(eq(leads.id, testLeadId));
  });

  it("should create automation enrollment when new lead is created", async () => {
    // Trigger automation for the new lead
    await triggerAutomation("new_lead", "lead", testLeadId);

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Check that enrollment was created
    const enrollments = await db.select()
      .from(automationEnrollments)
      .where(
        and(
          eq(automationEnrollments.enrolledType, "lead"),
          eq(automationEnrollments.enrolledId, testLeadId),
          eq(automationEnrollments.status, "active")
        )
      );

    expect(enrollments.length).toBeGreaterThan(0);
    expect(enrollments[0].enrolledType).toBe("lead");
    expect(enrollments[0].enrolledId).toBe(testLeadId);
    expect(enrollments[0].status).toBe("active");
  });

  it("should execute first step of automation sequence", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get the enrollment
    const [enrollment] = await db.select()
      .from(automationEnrollments)
      .where(
        and(
          eq(automationEnrollments.enrolledType, "lead"),
          eq(automationEnrollments.enrolledId, testLeadId)
        )
      )
      .limit(1);

    expect(enrollment).toBeDefined();

    // Check that at least one step execution exists
    const executions = await db.select()
      .from(automationStepExecutions)
      .where(eq(automationStepExecutions.enrollmentId, enrollment.id));

    expect(executions.length).toBeGreaterThan(0);
    expect(executions[0].status).toMatch(/^(pending|completed|failed)$/);
  });
});
