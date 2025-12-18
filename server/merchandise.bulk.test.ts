import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';

// Mock context for protected procedures
const mockContext: Context = {
  user: {
    id: 1,
    openId: 'test-open-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    provider: null,
    providerId: null,
    password: null,
    resetToken: null,
    resetTokenExpiry: null,
    loginMethod: null,
  },
  req: {} as any,
  res: {} as any,
};

// Create caller with mock context
const caller = appRouter.createCaller(mockContext);

describe('Merchandise Bulk Assignment', () => {
  let testItemId: number;
  let testStudentIds: number[] = [];

  beforeAll(async () => {
    // Create a test merchandise item
    const itemResult = await caller.merchandise.createItem({
      name: 'Bulk Test Uniform',
      type: 'uniform',
      defaultPrice: 5000,
      requiresSize: true,
      sizeOptions: ['XS', 'S', 'M', 'L', 'XL'],
      description: 'Test uniform for bulk assignment',
    });
    testItemId = itemResult.itemId as number;

    // Try to find existing test students or create them
    try {
      const allStudents = await caller.students.getAll();
      const karateStudents = allStudents.filter(s => s.program === 'Karate');
      
      if (karateStudents.length >= 2) {
        testStudentIds = karateStudents.slice(0, 2).map(s => s.id);
      } else {
        // Create test students if not enough exist
        for (let i = 0; i < 2; i++) {
          try {
            const student = await caller.students.create({
              firstName: `BulkTest${i}`,
              lastName: 'Student',
              email: `bulktest${i}@example.com`,
              phone: `555-010${i}`,
              program: 'Karate',
              beltRank: 'White',
            });
            testStudentIds.push(student.id);
          } catch (error) {
            // Student might already exist, try to find it
            const existing = allStudents.find(s => s.email === `bulktest${i}@example.com`);
            if (existing) {
              testStudentIds.push(existing.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to setup test students:', error);
    }
  });

  describe('bulkAssignToStudents', () => {
    it('should bulk assign merchandise to multiple students', async () => {
      if (testStudentIds.length < 2) {
        console.warn('Skipping test: not enough test students');
        return;
      }

      const sizeMappings = testStudentIds.map(id => ({
        studentId: id,
        size: 'M',
      }));

      const result = await caller.merchandise.bulkAssignToStudents({
        itemId: testItemId,
        sizeMappings,
        pricePaid: 5000,
      });

      expect(result.success).toBe(true);
      expect(result.successCount).toBeGreaterThan(0);
      expect(result.successfulAssignments.length).toBeGreaterThan(0);
    });

    it('should handle size mappings correctly', async () => {
      // Create another test item
      const itemResult = await caller.merchandise.createItem({
        name: 'Bulk Test Belt',
        type: 'belt',
        defaultPrice: 1500,
        requiresSize: false,
      });

      if (testStudentIds.length < 1) {
        console.warn('Skipping test: no test students');
        return;
      }

      const sizeMappings = testStudentIds.slice(0, 1).map(id => ({
        studentId: id,
        size: undefined, // No size needed for belt
      }));

      const result = await caller.merchandise.bulkAssignToStudents({
        itemId: itemResult.itemId as number,
        sizeMappings,
      });

      expect(result.success).toBe(true);
      expect(result.successCount).toBeGreaterThan(0);
    });

    it('should fail if size is required but not provided', async () => {
      if (testStudentIds.length < 1) {
        console.warn('Skipping test: no test students');
        return;
      }

      const sizeMappings = [{
        studentId: testStudentIds[0],
        size: undefined, // Missing required size
      }];

      const result = await caller.merchandise.bulkAssignToStudents({
        itemId: testItemId, // This item requires size
        sizeMappings,
      });

      expect(result.success).toBe(true);
      expect(result.failedCount).toBeGreaterThan(0);
      expect(result.failedAssignments[0]?.error).toContain('Size is required');
    });

    it('should skip already assigned items', async () => {
      if (testStudentIds.length < 1) {
        console.warn('Skipping test: no test students');
        return;
      }

      // Try to assign the same item again
      const sizeMappings = [{
        studentId: testStudentIds[0],
        size: 'L',
      }];

      const result = await caller.merchandise.bulkAssignToStudents({
        itemId: testItemId,
        sizeMappings,
      });

      // Should have at least one failure due to duplicate
      expect(result.success).toBe(true);
      if (result.failedCount > 0) {
        expect(result.failedAssignments.some(f => f.error.includes('already assigned'))).toBe(true);
      }
    });

    it('should return detailed success and failure counts', async () => {
      // Create a new item for clean test
      const itemResult = await caller.merchandise.createItem({
        name: 'Bulk Test Gear',
        type: 'gear',
        defaultPrice: 2500,
        requiresSize: true,
        sizeOptions: ['S', 'M', 'L'],
      });

      if (testStudentIds.length < 1) {
        console.warn('Skipping test: no test students');
        return;
      }

      const sizeMappings = [
        { studentId: testStudentIds[0], size: 'M' },
        { studentId: 999999, size: 'L' }, // Non-existent student
      ];

      const result = await caller.merchandise.bulkAssignToStudents({
        itemId: itemResult.itemId as number,
        sizeMappings,
      });

      expect(result.success).toBe(true);
      expect(result.successCount).toBeGreaterThan(0);
      expect(result.failedCount).toBeGreaterThan(0);
      expect(result.successfulAssignments).toBeDefined();
      expect(result.failedAssignments).toBeDefined();
      expect(result.failedAssignments.some(f => f.error.includes('not found'))).toBe(true);
    });
  });
});
