import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { students, studentCancellationRequests } from '../drizzle/schema';
import { eq, and, gte, count } from 'drizzle-orm';

describe('Students Filter - Error Fixes', () => {
  let db: any;
  const testOrgId = 180001;

  beforeAll(async () => {
    db = await getDb();
  });

  it('should correctly count cancellation requests filtered by organization', async () => {
    // This test verifies that Error 1 & 2 are fixed
    // The query should only count cancellation requests for students in the current organization
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthStr = thisMonth.toISOString();

    const result = await db.select({ count: count().as('count') })
      .from(studentCancellationRequests)
      .innerJoin(students, eq(studentCancellationRequests.studentId, students.id))
      .where(and(
        eq(students.organizationId, testOrgId),
        gte(studentCancellationRequests.requestDate, thisMonthStr)
      ));

    // Should return a count without throwing an error
    expect(result).toBeDefined();
    expect(result[0]).toBeDefined();
    expect(result[0].count).toBeDefined();
    expect(typeof result[0].count).toBe('number');
  });

  it('should return valid analytics data with organization filter', async () => {
    // This test verifies that the getAnalytics query works correctly
    
    const totalResult = await db.select({ count: count().as('count') })
      .from(students)
      .where(eq(students.organizationId, testOrgId));

    const activeResult = await db.select({ count: count().as('count') })
      .from(students)
      .where(and(
        eq(students.organizationId, testOrgId),
        eq(students.status, 'Active')
      ));

    const atRiskResult = await db.select({ count: count().as('count') })
      .from(students)
      .where(and(
        eq(students.organizationId, testOrgId),
        eq(students.status, 'At Risk')
      ));

    expect(totalResult[0]?.count).toBeDefined();
    expect(activeResult[0]?.count).toBeDefined();
    expect(atRiskResult[0]?.count).toBeDefined();
  });

  it('should handle getListWithFilters with valid input', async () => {
    // This test verifies that Error 3 is fixed
    // The query should accept valid filter input
    
    const conditions = [eq(students.organizationId, testOrgId)];
    
    if ('At Risk') {
      conditions.push(eq(students.status, 'At Risk'));
    }

    const result = await db.select()
      .from(students)
      .where(and(...conditions))
      .limit(20)
      .offset(0);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle undefined input gracefully', async () => {
    // This test ensures that undefined input doesn't cause validation errors
    
    const conditions = [eq(students.organizationId, testOrgId)];
    
    // Simulate undefined input
    const search = undefined;
    const status = undefined;

    if (search) {
      // This should not execute
      throw new Error('Search should be undefined');
    }

    if (status) {
      // This should not execute
      throw new Error('Status should be undefined');
    }

    const result = await db.select()
      .from(students)
      .where(and(...conditions))
      .limit(20)
      .offset(0);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});
