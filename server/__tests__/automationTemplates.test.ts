import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../db";
import { automationSequences, automationSteps, dojoSettings, locations } from "../../drizzle/schema";
import { getAvailableTemplates, installAutomationTemplate } from "../services/installAutomationTemplate";
import { eq } from "drizzle-orm";

describe("Automation Template System", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Ensure we have dojo settings for variable replacement
    const existingSettings = await db.select().from(dojoSettings).limit(1);
    if (existingSettings.length === 0) {
      await db.insert(dojoSettings).values({
        businessName: "Test Dojo",
        operatorName: "John Smith",
        preferredName: "Coach John",
        businessPhone: "555-1234",
        businessEmail: "test@testdojo.com",
        industry: "martial_arts",
        businessModel: "standalone",
      });
    }

    // Ensure we have a location for variable replacement
    const existingLocations = await db.select().from(locations).limit(1);
    if (existingLocations.length === 0) {
      await db.insert(locations).values({
        name: "Main Location",
        address: "123 Test St, Test City, ST 12345",
        isActive: 1,
      });
    }
  });

  it("should return all available templates", () => {
    const templates = getAvailableTemplates();
    
    expect(templates).toBeDefined();
    expect(templates.length).toBeGreaterThan(0);
    
    // Check that each template has required fields
    templates.forEach(template => {
      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.trigger).toBeDefined();
      expect(template.steps).toBeDefined();
      expect(template.steps.length).toBeGreaterThan(0);
    });
  });

  it("should have New Lead Welcome Sequence template", () => {
    const templates = getAvailableTemplates();
    const welcomeTemplate = templates.find(t => t.name === "New Lead Welcome Sequence");
    
    expect(welcomeTemplate).toBeDefined();
    expect(welcomeTemplate?.trigger).toBe("new_lead");
    expect(welcomeTemplate?.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("should install a template successfully", async () => {
    if (!db) throw new Error("Database not available");

    const result = await installAutomationTemplate("New Lead Welcome Sequence", 1);
    
    expect(result.success).toBe(true);
    expect(result.sequenceId).toBeDefined();

    // Verify sequence was created
    const [sequence] = await db.select()
      .from(automationSequences)
      .where(eq(automationSequences.id, result.sequenceId))
      .limit(1);

    expect(sequence).toBeDefined();
    expect(sequence.name).toBe("New Lead Welcome Sequence");
    expect(sequence.trigger).toBe("new_lead");
    expect(sequence.isActive).toBe(1);

    // Verify steps were created
    const steps = await db.select()
      .from(automationSteps)
      .where(eq(automationSteps.sequenceId, result.sequenceId));

    expect(steps.length).toBeGreaterThan(0);
    
    // Check that steps have proper order
    const stepOrders = steps.map(s => s.stepOrder).sort((a, b) => a - b);
    expect(stepOrders[0]).toBe(1);
    
    // Check that messages contain variables
    const smsStep = steps.find(s => s.stepType === "send_sms");
    expect(smsStep?.message).toContain("{{firstName}}");
    expect(smsStep?.message).toContain("{{businessName}}");
  });

  it("should throw error for non-existent template", async () => {
    await expect(
      installAutomationTemplate("Non-Existent Template", 1)
    ).rejects.toThrow('Template "Non-Existent Template" not found');
  });

  it("should have templates with proper variable usage", () => {
    const templates = getAvailableTemplates();
    
    templates.forEach(template => {
      template.steps.forEach(step => {
        if (step.message) {
          // Check for lead/student variables
          const hasLeadVariables = 
            step.message.includes("{{firstName}}") ||
            step.message.includes("{{lastName}}") ||
            step.message.includes("{{email}}") ||
            step.message.includes("{{phone}}");

          // Check for dojo settings variables
          const hasDojoVariables = 
            step.message.includes("{{businessName}}") ||
            step.message.includes("{{operatorName}}") ||
            step.message.includes("{{preferredName}}") ||
            step.message.includes("{{dojoPhone}}") ||
            step.message.includes("{{dojoEmail}}");

          // At least one type of variable should be present
          expect(hasLeadVariables || hasDojoVariables).toBe(true);
        }
      });
    });
  });

  it("should have templates with valid step types", () => {
    const templates = getAvailableTemplates();
    const validStepTypes = ["wait", "send_sms", "send_email", "condition", "end"];
    
    templates.forEach(template => {
      template.steps.forEach(step => {
        expect(validStepTypes).toContain(step.stepType);
      });
    });
  });

  it("should have templates with sequential step orders", () => {
    const templates = getAvailableTemplates();
    
    templates.forEach(template => {
      const stepOrders = template.steps.map(s => s.stepOrder).sort((a, b) => a - b);
      
      // Should start at 1
      expect(stepOrders[0]).toBe(1);
      
      // Should be sequential (no gaps)
      for (let i = 1; i < stepOrders.length; i++) {
        expect(stepOrders[i]).toBe(stepOrders[i - 1] + 1);
      }
    });
  });

  it("should have templates ending with 'end' step", () => {
    const templates = getAvailableTemplates();
    
    templates.forEach(template => {
      const lastStep = template.steps[template.steps.length - 1];
      expect(lastStep.stepType).toBe("end");
    });
  });
});
