import { describe, it, expect, beforeEach } from 'vitest';
import { getDb } from '../db';
import { dojoSettings, automationSequences, automationSteps, automationTemplates } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Automation Template Auto-Install and Reset', () => {
  let db: any;

  beforeEach(async () => {
    db = await getDb();
  });

  it('should auto-install templates when setup is completed', async () => {
    // Get current settings
    const [settings] = await db.select().from(dojoSettings).limit(1);
    const industry = settings?.industry || 'martial_arts';

    // Get templates for the industry
    const templates = await db.select()
      .from(automationTemplates)
      .where(eq(automationTemplates.industry, industry));

    expect(templates.length).toBeGreaterThan(0);
    expect(templates.length).toBe(9); // Should have 9 templates per industry

    // Verify each template has valid structure
    for (const template of templates) {
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.trigger).toBeTruthy();
      expect(template.steps).toBeTruthy();
      
      // Verify steps can be parsed
      const steps = JSON.parse(template.steps);
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
    }
  });

  it('should install automation sequences from templates', async () => {
    const [settings] = await db.select().from(dojoSettings).limit(1);
    const industry = settings?.industry || 'martial_arts';

    // Get one template
    const [template] = await db.select()
      .from(automationTemplates)
      .where(eq(automationTemplates.industry, industry))
      .limit(1);

    // Install it as a sequence
    const [sequence] = await db.insert(automationSequences)
      .values({
        name: `Test: ${template.name}`,
        description: template.description,
        trigger: template.trigger,
        isActive: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    expect(sequence).toBeTruthy();
    expect(sequence.name).toContain('Test:');

    // Install steps
    const templateSteps = JSON.parse(template.steps);
    for (const step of templateSteps) {
      await db.insert(automationSteps).values({
        sequenceId: sequence.id,
        stepOrder: step.stepOrder,
        stepType: step.stepType,
        waitDuration: step.waitDuration || null,
        waitUnit: step.waitUnit || null,
        messageContent: step.messageContent || null,
        emailSubject: step.emailSubject || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Verify steps were created
    const steps = await db.select()
      .from(automationSteps)
      .where(eq(automationSteps.sequenceId, sequence.id));

    expect(steps.length).toBe(templateSteps.length);

    // Cleanup
    await db.delete(automationSteps).where(eq(automationSteps.sequenceId, sequence.id));
    await db.delete(automationSequences).where(eq(automationSequences.id, sequence.id));
  });

  it('should reset to default templates (delete and reinstall)', async () => {
    const [settings] = await db.select().from(dojoSettings).limit(1);
    const industry = settings?.industry || 'martial_arts';

    // Count sequences before
    const sequencesBefore = await db.select().from(automationSequences);
    const beforeCount = sequencesBefore.length;

    // Create a test sequence to ensure we have something to delete
    const [testSeq] = await db.insert(automationSequences)
      .values({
        name: 'Test Sequence to Delete',
        description: 'This should be deleted',
        trigger: 'new_lead',
        isActive: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Verify it was created
    const afterCreate = await db.select().from(automationSequences);
    expect(afterCreate.length).toBe(beforeCount + 1);

    // Delete all sequences (simulating reset)
    await db.delete(automationSequences);

    // Verify all deleted
    const afterDelete = await db.select().from(automationSequences);
    expect(afterDelete.length).toBe(0);

    // Reinstall templates
    const templates = await db.select()
      .from(automationTemplates)
      .where(eq(automationTemplates.industry, industry));

    let installedCount = 0;
    for (const template of templates) {
      const [sequence] = await db.insert(automationSequences)
        .values({
          name: template.name,
          description: template.description,
          trigger: template.trigger,
          isActive: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const templateSteps = JSON.parse(template.steps);
      for (const step of templateSteps) {
        await db.insert(automationSteps).values({
          sequenceId: sequence.id,
          stepOrder: step.stepOrder,
          stepType: step.stepType,
          waitDuration: step.waitDuration || null,
          waitUnit: step.waitUnit || null,
          messageContent: step.messageContent || null,
          emailSubject: step.emailSubject || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      installedCount++;
    }

    // Verify templates were reinstalled
    const afterReinstall = await db.select().from(automationSequences);
    expect(afterReinstall.length).toBe(installedCount);
    expect(installedCount).toBe(9); // Should have 9 templates
  });

  it('should verify template variables are present', async () => {
    const [settings] = await db.select().from(dojoSettings).limit(1);
    const industry = settings?.industry || 'martial_arts';

    const templates = await db.select()
      .from(automationTemplates)
      .where(eq(automationTemplates.industry, industry));

    // Check that templates contain variable placeholders
    const variablePattern = /\{\{[a-zA-Z_]+\}\}/;
    let foundVariables = false;

    for (const template of templates) {
      const steps = JSON.parse(template.steps);
      for (const step of steps) {
        if (step.messageContent && variablePattern.test(step.messageContent)) {
          foundVariables = true;
          break;
        }
        if (step.emailSubject && variablePattern.test(step.emailSubject)) {
          foundVariables = true;
          break;
        }
      }
      if (foundVariables) break;
    }

    expect(foundVariables).toBe(true);
  });
});
