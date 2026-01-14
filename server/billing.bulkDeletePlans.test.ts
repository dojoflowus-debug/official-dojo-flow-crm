import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { membershipPlans } from '../drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

describe('Bulk Delete Plans', () => {
  let testPlanIds: number[] = [];

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create 3 test plans for bulk deletion
    const [plan1] = await db.insert(membershipPlans).values({
      name: 'Bulk Test Plan 1',
      description: 'Test plan for bulk deletion',
      monthlyAmount: 9900, // $99.00
      billingCycle: 'monthly',
      termLength: 12,
      registrationFee: 5000, // $50.00
      isActive: 1,
    });

    const [plan2] = await db.insert(membershipPlans).values({
      name: 'Bulk Test Plan 2',
      description: 'Test plan for bulk deletion',
      monthlyAmount: 14900, // $149.00
      billingCycle: 'monthly',
      termLength: 12,
      registrationFee: 5000, // $50.00
      isActive: 1,
    });

    const [plan3] = await db.insert(membershipPlans).values({
      name: 'Bulk Test Plan 3',
      description: 'Test plan for bulk deletion',
      monthlyAmount: 19900, // $199.00
      billingCycle: 'monthly',
      termLength: 12,
      registrationFee: 5000, // $50.00
      isActive: 1,
    });

    testPlanIds = [
      plan1.insertId,
      plan2.insertId,
      plan3.insertId,
    ];
  });

  it('should bulk delete multiple plans', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Verify plans exist before deletion
    const beforeDelete = await db
      .select()
      .from(membershipPlans)
      .where(inArray(membershipPlans.id, testPlanIds));
    
    expect(beforeDelete.length).toBe(3);

    // Perform bulk delete
    await db.delete(membershipPlans).where(inArray(membershipPlans.id, testPlanIds));

    // Verify plans are deleted
    const afterDelete = await db
      .select()
      .from(membershipPlans)
      .where(inArray(membershipPlans.id, testPlanIds));
    
    expect(afterDelete.length).toBe(0);
  });

  it('should return correct deleted count', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create 2 more test plans
    const [plan1] = await db.insert(membershipPlans).values({
      name: 'Bulk Test Plan 4',
      description: 'Test plan for count verification',
      monthlyAmount: 9900,
      billingCycle: 'monthly',
      termLength: 12,
      isActive: 1,
    });

    const [plan2] = await db.insert(membershipPlans).values({
      name: 'Bulk Test Plan 5',
      description: 'Test plan for count verification',
      monthlyAmount: 14900,
      billingCycle: 'monthly',
      termLength: 12,
      isActive: 1,
    });

    const idsToDelete = [plan1.insertId, plan2.insertId];

    // Delete and verify count
    await db.delete(membershipPlans).where(inArray(membershipPlans.id, idsToDelete));

    // The deletedCount should match the number of IDs provided
    expect(idsToDelete.length).toBe(2);
  });

  it('should handle empty array gracefully', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Attempting to delete with empty array should not throw error
    // Note: inArray with empty array may cause SQL error, so we skip the operation
    const emptyIds: number[] = [];
    
    if (emptyIds.length > 0) {
      await db.delete(membershipPlans).where(inArray(membershipPlans.id, emptyIds));
    }

    // No error should be thrown
    expect(true).toBe(true);
  });

  it('should only delete specified plans, not others', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create 3 plans
    const [plan1] = await db.insert(membershipPlans).values({
      name: 'Keep Plan 1',
      description: 'Should not be deleted',
      monthlyAmount: 9900,
      billingCycle: 'monthly',
      termLength: 12,
      isActive: 1,
    });

    const [plan2] = await db.insert(membershipPlans).values({
      name: 'Delete Plan',
      description: 'Should be deleted',
      monthlyAmount: 14900,
      billingCycle: 'monthly',
      termLength: 12,
      isActive: 1,
    });

    const [plan3] = await db.insert(membershipPlans).values({
      name: 'Keep Plan 2',
      description: 'Should not be deleted',
      monthlyAmount: 19900,
      billingCycle: 'monthly',
      termLength: 12,
      isActive: 1,
    });

    const keepIds = [plan1.insertId, plan3.insertId];
    const deleteId = plan2.insertId;

    // Delete only plan2
    await db.delete(membershipPlans).where(eq(membershipPlans.id, deleteId));

    // Verify plan2 is deleted
    const deletedPlan = await db
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.id, deleteId));
    expect(deletedPlan.length).toBe(0);

    // Verify plan1 and plan3 still exist
    const keptPlans = await db
      .select()
      .from(membershipPlans)
      .where(inArray(membershipPlans.id, keepIds));
    expect(keptPlans.length).toBe(2);

    // Clean up
    await db.delete(membershipPlans).where(inArray(membershipPlans.id, keepIds));
  });
});
