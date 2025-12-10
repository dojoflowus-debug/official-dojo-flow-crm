import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import { getDb } from '../db';

describe('Automation Router', () => {
  let caller: any;
  let db: any;

  beforeAll(async () => {
    const mockContext = {
      user: { id: 1, name: 'Test User', email: 'test@example.com' },
      req: {} as any,
      res: {} as any,
    };
    
    caller = appRouter.createCaller(mockContext);
    db = await getDb();
  });

  it('should get all automation sequences', async () => {
    const result = await caller.automation.getAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should get automation stats', async () => {
    const stats = await caller.automation.getStats();
    expect(stats).toHaveProperty('totalSequences');
    expect(stats).toHaveProperty('activeSequences');
    expect(stats).toHaveProperty('totalEnrollments');
    expect(typeof stats.totalSequences).toBe('number');
  });

  it('should create an automation sequence', async () => {
    const sequenceData = {
      name: 'Test Sequence',
      description: 'A test automation sequence',
      trigger: 'new_lead' as const,
      isActive: true,
    };

    const result = await caller.automation.create(sequenceData);
    expect(result).toHaveProperty('id');
    expect(typeof result.id).toBe('number');
  });

  it('should get sequence by id with steps', async () => {
    // Create a sequence
    const created = await caller.automation.create({
      name: 'Test Sequence with Steps',
      trigger: 'trial_scheduled' as const,
      isActive: true,
    });

    // Add a step
    await caller.automation.addStep({
      sequenceId: created.id,
      stepOrder: 1,
      stepType: 'wait' as const,
      name: 'Wait 1 day',
      waitMinutes: 1440,
    });

    // Get sequence with steps
    const sequence = await caller.automation.getById({ id: created.id });
    expect(sequence).toBeDefined();
    expect(sequence.name).toBe('Test Sequence with Steps');
    expect(Array.isArray(sequence.steps)).toBe(true);
    expect(sequence.steps.length).toBeGreaterThan(0);
  });

  it('should add steps to a sequence', async () => {
    // Create a sequence
    const sequence = await caller.automation.create({
      name: 'Sequence for Steps Test',
      trigger: 'enrollment' as const,
      isActive: true,
    });

    // Add wait step
    const waitStep = await caller.automation.addStep({
      sequenceId: sequence.id,
      stepOrder: 1,
      stepType: 'wait' as const,
      name: 'Wait 2 days',
      waitMinutes: 2880,
    });
    expect(waitStep).toHaveProperty('id');

    // Add SMS step
    const smsStep = await caller.automation.addStep({
      sequenceId: sequence.id,
      stepOrder: 2,
      stepType: 'send_sms' as const,
      name: 'Send welcome SMS',
      message: 'Welcome to our dojo!',
    });
    expect(smsStep).toHaveProperty('id');

    // Verify steps were added
    const updated = await caller.automation.getById({ id: sequence.id });
    expect(updated.steps.length).toBe(2);
  });

  it('should update a sequence', async () => {
    // Create a sequence
    const created = await caller.automation.create({
      name: 'Original Sequence Name',
      trigger: 'missed_class' as const,
      isActive: true,
    });

    // Update it
    await caller.automation.update({
      id: created.id,
      name: 'Updated Sequence Name',
      isActive: false,
    });

    // Verify update
    const updated = await caller.automation.getById({ id: created.id });
    expect(updated.name).toBe('Updated Sequence Name');
    expect(updated.isActive).toBe(0);
  });

  it('should update a step', async () => {
    // Create sequence and step
    const sequence = await caller.automation.create({
      name: 'Sequence for Step Update',
      trigger: 'renewal_due' as const,
      isActive: true,
    });

    const step = await caller.automation.addStep({
      sequenceId: sequence.id,
      stepOrder: 1,
      stepType: 'send_email' as const,
      name: 'Original Step Name',
      subject: 'Original Subject',
      message: 'Original message',
    });

    // Update the step
    await caller.automation.updateStep({
      id: step.id,
      name: 'Updated Step Name',
      subject: 'Updated Subject',
    });

    // Verify update
    const updated = await caller.automation.getById({ id: sequence.id });
    const updatedStep = updated.steps.find((s: any) => s.id === step.id);
    expect(updatedStep.name).toBe('Updated Step Name');
    expect(updatedStep.subject).toBe('Updated Subject');
  });

  it('should delete a step', async () => {
    // Create sequence with a step
    const sequence = await caller.automation.create({
      name: 'Sequence for Step Deletion',
      trigger: 'inactive_student' as const,
      isActive: true,
    });

    const step = await caller.automation.addStep({
      sequenceId: sequence.id,
      stepOrder: 1,
      stepType: 'wait' as const,
      name: 'Step to Delete',
      waitMinutes: 1440,
    });

    // Delete the step
    await caller.automation.deleteStep({ id: step.id });

    // Verify deletion
    const updated = await caller.automation.getById({ id: sequence.id });
    expect(updated.steps.length).toBe(0);
  });
});
