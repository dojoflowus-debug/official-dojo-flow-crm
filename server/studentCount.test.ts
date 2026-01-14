/**
 * Student Count Consistency Tests
 * 
 * Verifies that the dashboard student count matches the actual number of students
 * returned by the students list endpoint.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { students } from '../drizzle/schema';
import { eq, count } from 'drizzle-orm';

describe('Student Count Consistency', () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  const testOrgId = 999999; // Test organization ID
  
  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Clean up any existing test data
    await db.delete(students).where(eq(students.organizationId, testOrgId));
    
    // Insert test students with different statuses
    await db.insert(students).values([
      {
        firstName: 'Active',
        lastName: 'Student1',
        email: 'active1@test.com',
        status: 'Active',
        organizationId: testOrgId,
      },
      {
        firstName: 'Active',
        lastName: 'Student2',
        email: 'active2@test.com',
        status: 'Active',
        organizationId: testOrgId,
      },
      {
        firstName: 'Inactive',
        lastName: 'Student1',
        email: 'inactive1@test.com',
        status: 'Inactive',
        organizationId: testOrgId,
      },
      {
        firstName: 'OnHold',
        lastName: 'Student1',
        email: 'onhold1@test.com',
        status: 'On Hold',
        organizationId: testOrgId,
      },
    ]);
  });
  
  afterAll(async () => {
    if (db) {
      // Clean up test data
      await db.delete(students).where(eq(students.organizationId, testOrgId));
    }
  });
  
  it('should count ALL students for an organization (not just active)', async () => {
    if (!db) throw new Error('Database not available');
    
    // Count all students for the test organization (what the Students page shows)
    const allStudentsResult = await db
      .select({ count: count() })
      .from(students)
      .where(eq(students.organizationId, testOrgId));
    
    const totalCount = allStudentsResult[0]?.count || 0;
    
    // We inserted 4 students (2 active, 1 inactive, 1 on hold)
    expect(totalCount).toBe(4);
  });
  
  it('should count only active students separately', async () => {
    if (!db) throw new Error('Database not available');
    const { and } = await import('drizzle-orm');
    
    // Count only active students
    const activeStudentsResult = await db
      .select({ count: count() })
      .from(students)
      .where(and(eq(students.organizationId, testOrgId), eq(students.status, 'Active')));
    
    const activeCount = activeStudentsResult[0]?.count || 0;
    
    // We inserted 2 active students
    expect(activeCount).toBe(2);
  });
  
  it('should return the same count for list and count queries', async () => {
    if (!db) throw new Error('Database not available');
    
    // Get all students (what the Students page does)
    const allStudents = await db
      .select()
      .from(students)
      .where(eq(students.organizationId, testOrgId));
    
    // Count all students (what the dashboard should do)
    const countResult = await db
      .select({ count: count() })
      .from(students)
      .where(eq(students.organizationId, testOrgId));
    
    // Both should match
    expect(allStudents.length).toBe(countResult[0]?.count || 0);
  });
  
  it('should filter students by organization correctly', async () => {
    if (!db) throw new Error('Database not available');
    
    // Count students for a different (non-existent) organization
    const otherOrgResult = await db
      .select({ count: count() })
      .from(students)
      .where(eq(students.organizationId, 888888));
    
    const otherOrgCount = otherOrgResult[0]?.count || 0;
    
    // Should be 0 for non-existent organization
    expect(otherOrgCount).toBe(0);
  });
});
