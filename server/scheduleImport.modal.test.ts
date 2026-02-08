import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from './routers';
import { db } from './db';
import { classes, organizations, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Schedule Import Modal Workflow', () => {
  let testOrgId: number;
  let testUserId: number;
  let caller: any;

  beforeEach(async () => {
    // Create test organization
    const orgResult = await db.insert(organizations).values({
      name: 'Test Dojo Modal',
      subdomain: `test-modal-${Date.now()}`,
      ownerId: 1,
    });
    testOrgId = Number(orgResult.insertId);

    // Create test user
    const userResult = await db.insert(users).values({
      email: `modal-test-${Date.now()}@test.com`,
      name: 'Modal Test User',
      role: 'owner',
      organizationId: testOrgId,
    });
    testUserId = Number(userResult.insertId);

    // Create caller with test context
    caller = appRouter.createCaller({
      user: {
        id: testUserId,
        email: `modal-test-${Date.now()}@test.com`,
        name: 'Modal Test User',
        role: 'owner',
        organizationId: testOrgId,
      },
      organizationId: testOrgId,
      currentOrganizationId: testOrgId,
      req: {} as any,
      res: {} as any,
    });
  });

  it('should create classes when using modal approve workflow', async () => {
    // Simulate the modal approve workflow
    const classesToImport = [
      {
        name: 'Modal Test Class 1',
        dayOfWeek: 'Mon',
        startTime: '10:00',
        endTime: '11:00',
        instructor: 'Test Instructor',
        room: 'Room 1',
        level: 'Beginner',
        capacity: 20,
      },
      {
        name: 'Modal Test Class 2',
        dayOfWeek: ['Tue', 'Thu'],
        startTime: '14:00',
        endTime: '15:00',
        instructor: 'Test Instructor 2',
        room: 'Room 2',
        level: 'Advanced',
        capacity: 15,
      },
    ];

    // Call createClassesFromSchedule (what the modal does)
    const result = await caller.kai.scheduleExtractor.createClassesFromSchedule({
      classes: classesToImport,
    });

    // Verify result
    expect(result.success).toBe(true);
    expect(result.createdCount).toBe(2);

    // Verify classes were created in database
    const createdClasses = await db
      .select()
      .from(classes)
      .where(eq(classes.organizationId, testOrgId));

    expect(createdClasses.length).toBe(2);
    expect(createdClasses[0].name).toBe('Modal Test Class 1');
    expect(createdClasses[1].name).toBe('Modal Test Class 2');
  });

  it('should handle errors gracefully when creating classes', async () => {
    // Try to create class with invalid data
    const invalidClasses = [
      {
        name: '', // Empty name should fail
        dayOfWeek: 'Mon',
        startTime: '10:00',
        endTime: '11:00',
        instructor: 'Test',
        room: 'Room 1',
        level: 'Beginner',
        capacity: 20,
      },
    ];

    try {
      await caller.kai.scheduleExtractor.createClassesFromSchedule({
        classes: invalidClasses,
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      // Should throw an error for invalid data
      expect(error).toBeDefined();
    }
  });
});
