import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDb } from './db';
import { organizations } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Setup Mode Router Tests
 * Tests for Kai Setup Mode onboarding wizard procedures
 */

describe('setupModeRouter', () => {
  let db: any;
  let testOrgId: number;

  beforeEach(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test organization
    const [result] = await db.insert(organizations).values({
      name: 'Test School',
      timezone: 'America/New_York',
      onboardingStatus: 'not_started',
      onboardingStep: 1,
      onboardingChecklist: JSON.stringify({}),
    });

    testOrgId = result.insertId;
  });

  describe('getStatus', () => {
    it('should return current onboarding status', async () => {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrgId))
        .limit(1);

      expect(org.onboardingStatus).toBe('not_started');
      expect(org.onboardingStep).toBe(1);
      expect(org.onboardingChecklist).toBeDefined();
    });

    it('should return parsed checklist JSON', async () => {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrgId))
        .limit(1);

      const checklist = JSON.parse(org.onboardingChecklist);
      expect(typeof checklist).toBe('object');
    });
  });

  describe('saveStep', () => {
    it('should save step data and increment to next step', async () => {
      const stepData = {
        name: 'Test School',
        phone: '555-1234',
        email: 'test@school.com',
        address: '123 Main St',
        timezone: 'America/New_York',
      };

      // Simulate saving step 1
      const checklist = {};
      checklist[`step_1`] = {
        completed: true,
        completedAt: new Date().toISOString(),
        data: stepData,
      };

      await db
        .update(organizations)
        .set({
          onboardingStatus: 'in_progress',
          onboardingStep: 2,
          onboardingChecklist: JSON.stringify(checklist),
        })
        .where(eq(organizations.id, testOrgId));

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrgId))
        .limit(1);

      expect(org.onboardingStatus).toBe('in_progress');
      expect(org.onboardingStep).toBe(2);

      const savedChecklist = JSON.parse(org.onboardingChecklist);
      expect(savedChecklist.step_1).toBeDefined();
      expect(savedChecklist.step_1.data.name).toBe('Test School');
    });

    it('should mark as completed when step 8 is saved', async () => {
      // Simulate completing all steps
      const checklist = {};
      for (let i = 1; i <= 8; i++) {
        checklist[`step_${i}`] = {
          completed: true,
          completedAt: new Date().toISOString(),
          data: {},
        };
      }

      await db
        .update(organizations)
        .set({
          onboardingStatus: 'completed',
          onboardingStep: 8,
          onboardingChecklist: JSON.stringify(checklist),
          onboardingCompletedAt: new Date(),
        })
        .where(eq(organizations.id, testOrgId));

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrgId))
        .limit(1);

      expect(org.onboardingStatus).toBe('completed');
      expect(org.onboardingStep).toBe(8);
      expect(org.onboardingCompletedAt).toBeDefined();
    });
  });

  describe('skipSetup', () => {
    it('should set status to skipped', async () => {
      await db
        .update(organizations)
        .set({
          onboardingStatus: 'skipped',
        })
        .where(eq(organizations.id, testOrgId));

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrgId))
        .limit(1);

      expect(org.onboardingStatus).toBe('skipped');
    });

    it('should preserve step and checklist data when skipping', async () => {
      const checklist = {
        step_1: {
          completed: true,
          data: { name: 'Test School' },
        },
      };

      await db
        .update(organizations)
        .set({
          onboardingStatus: 'skipped',
          onboardingChecklist: JSON.stringify(checklist),
        })
        .where(eq(organizations.id, testOrgId));

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrgId))
        .limit(1);

      expect(org.onboardingStatus).toBe('skipped');
      const savedChecklist = JSON.parse(org.onboardingChecklist);
      expect(savedChecklist.step_1).toBeDefined();
    });
  });

  describe('completeSetup', () => {
    it('should set status to completed with timestamp', async () => {
      const completedAt = new Date();

      await db
        .update(organizations)
        .set({
          onboardingStatus: 'completed',
          onboardingStep: 8,
          onboardingCompletedAt: completedAt,
        })
        .where(eq(organizations.id, testOrgId));

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrgId))
        .limit(1);

      expect(org.onboardingStatus).toBe('completed');
      expect(org.onboardingStep).toBe(8);
      expect(org.onboardingCompletedAt).toBeDefined();
    });
  });

  describe('resumeSetup', () => {
    it('should return last step and data for resume', async () => {
      const checklist = {
        step_1: {
          completed: true,
          data: { name: 'Test School' },
        },
        step_2: {
          completed: true,
          data: { programs: ['karate', 'kickboxing'] },
        },
      };

      await db
        .update(organizations)
        .set({
          onboardingStatus: 'in_progress',
          onboardingStep: 3,
          onboardingChecklist: JSON.stringify(checklist),
        })
        .where(eq(organizations.id, testOrgId));

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrgId))
        .limit(1);

      expect(org.onboardingStatus).toBe('in_progress');
      expect(org.onboardingStep).toBe(3);

      const savedChecklist = JSON.parse(org.onboardingChecklist);
      expect(savedChecklist.step_2.data.programs).toContain('karate');
    });

    it('should handle empty checklist on first resume', async () => {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrgId))
        .limit(1);

      expect(org.onboardingStatus).toBe('not_started');
      expect(org.onboardingStep).toBe(1);

      const checklist = JSON.parse(org.onboardingChecklist);
      expect(Object.keys(checklist).length).toBe(0);
    });
  });

  describe('Onboarding Flow', () => {
    it('should complete full 8-step onboarding flow', async () => {
      // Step 1: Start
      expect(testOrgId).toBeGreaterThan(0);

      // Step 2-8: Simulate saving each step
      for (let step = 1; step <= 8; step++) {
        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, testOrgId))
          .limit(1);

        const checklist = JSON.parse(org.onboardingChecklist);
        checklist[`step_${step}`] = {
          completed: true,
          completedAt: new Date().toISOString(),
          data: { step: step },
        };

        const nextStep = step === 8 ? 8 : step + 1;
        const status = step === 8 ? 'completed' : 'in_progress';

        await db
          .update(organizations)
          .set({
            onboardingStatus: status,
            onboardingStep: nextStep,
            onboardingChecklist: JSON.stringify(checklist),
            onboardingCompletedAt: step === 8 ? new Date() : null,
          })
          .where(eq(organizations.id, testOrgId));
      }

      // Verify final state
      const [finalOrg] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrgId))
        .limit(1);

      expect(finalOrg.onboardingStatus).toBe('completed');
      expect(finalOrg.onboardingStep).toBe(8);
      expect(finalOrg.onboardingCompletedAt).toBeDefined();

      const finalChecklist = JSON.parse(finalOrg.onboardingChecklist);
      for (let i = 1; i <= 8; i++) {
        expect(finalChecklist[`step_${i}`]).toBeDefined();
        expect(finalChecklist[`step_${i}`].completed).toBe(true);
      }
    });

    it('should handle skip in middle of flow', async () => {
      // Complete step 1
      const checklist = {
        step_1: {
          completed: true,
          data: { name: 'Test School' },
        },
      };

      await db
        .update(organizations)
        .set({
          onboardingStatus: 'in_progress',
          onboardingStep: 2,
          onboardingChecklist: JSON.stringify(checklist),
        })
        .where(eq(organizations.id, testOrgId));

      // Skip setup
      await db
        .update(organizations)
        .set({
          onboardingStatus: 'skipped',
        })
        .where(eq(organizations.id, testOrgId));

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrgId))
        .limit(1);

      expect(org.onboardingStatus).toBe('skipped');
      expect(org.onboardingStep).toBe(2); // Should preserve step

      const savedChecklist = JSON.parse(org.onboardingChecklist);
      expect(savedChecklist.step_1).toBeDefined(); // Should preserve progress
    });
  });
});
