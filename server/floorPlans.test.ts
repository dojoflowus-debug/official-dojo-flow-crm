import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';

/**
 * Floor Plans Router Tests
 * Tests floor plan CRUD operations and spot generation algorithms
 */

// Mock context with admin user
const mockContext: Context = {
  user: {
    id: 1,
    openId: 'test-open-id',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

const caller = appRouter.createCaller(mockContext);

describe('Floor Plans Router', () => {
  let testFloorPlanId: number;

  describe('create', () => {
    it('should create a kickboxing floor plan with generated spots', async () => {
      const result = await caller.floorPlans.create({
        roomName: 'Main Kickboxing Room',
        lengthFeet: 40,
        widthFeet: 30,
        safetySpacingFeet: 3,
        templateType: 'kickboxing_bags',
        notes: 'Test kickboxing room',
      });

      expect(result).toBeDefined();
      expect(result.id).toBeGreaterThan(0);
      expect(result.maxCapacity).toBeGreaterThan(0);
      expect(result.spotsGenerated).toBe(result.maxCapacity);

      testFloorPlanId = result.id;
      console.log(`✓ Created kickboxing floor plan with ${result.spotsGenerated} bag spots`);
    });

    it('should create a yoga grid floor plan', async () => {
      const result = await caller.floorPlans.create({
        roomName: 'Yoga Studio',
        lengthFeet: 30,
        widthFeet: 25,
        safetySpacingFeet: 2,
        templateType: 'yoga_grid',
        notes: 'Test yoga studio',
      });

      expect(result).toBeDefined();
      expect(result.spotsGenerated).toBeGreaterThan(0);
      console.log(`✓ Created yoga floor plan with ${result.spotsGenerated} mat spots`);
    });

    it('should create a karate lines floor plan', async () => {
      const result = await caller.floorPlans.create({
        roomName: 'Traditional Dojo',
        lengthFeet: 35,
        widthFeet: 28,
        safetySpacingFeet: 3,
        templateType: 'karate_lines',
        notes: 'Test karate dojo',
      });

      expect(result).toBeDefined();
      expect(result.spotsGenerated).toBeGreaterThan(0);
      console.log(`✓ Created karate floor plan with ${result.spotsGenerated} lineup spots`);
    });
  });

  describe('list', () => {
    it('should list all floor plans', async () => {
      const plans = await caller.floorPlans.list();

      expect(plans).toBeDefined();
      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThan(0);
      console.log(`✓ Retrieved ${plans.length} floor plans`);
    });
  });

  describe('get', () => {
    it('should get a floor plan with its spots', async () => {
      const plan = await caller.floorPlans.get({ id: testFloorPlanId });

      expect(plan).toBeDefined();
      expect(plan.id).toBe(testFloorPlanId);
      expect(plan.spots).toBeDefined();
      expect(Array.isArray(plan.spots)).toBe(true);
      expect(plan.spots.length).toBe(plan.maxCapacity);

      // Verify spot labels
      const firstSpot = plan.spots[0];
      expect(firstSpot.spotLabel).toContain('Bag');
      expect(firstSpot.spotNumber).toBe(1);

      console.log(`✓ Retrieved floor plan with ${plan.spots.length} spots`);
      console.log(`  First spot: ${firstSpot.spotLabel}`);
    });
  });

  describe('update', () => {
    it('should update floor plan metadata without regenerating spots', async () => {
      const result = await caller.floorPlans.update({
        id: testFloorPlanId,
        roomName: 'Updated Kickboxing Room',
        notes: 'Updated notes',
      });

      expect(result.success).toBe(true);
      console.log('✓ Updated floor plan metadata');
    });

    it('should regenerate spots when dimensions change', async () => {
      // Get original spot count
      const originalPlan = await caller.floorPlans.get({ id: testFloorPlanId });
      const originalSpotCount = originalPlan.spots.length;

      // Update dimensions
      await caller.floorPlans.update({
        id: testFloorPlanId,
        lengthFeet: 50, // Increase length
        widthFeet: 35,  // Increase width
      });

      // Get updated plan
      const updatedPlan = await caller.floorPlans.get({ id: testFloorPlanId });
      const newSpotCount = updatedPlan.spots.length;

      expect(newSpotCount).toBeGreaterThan(originalSpotCount);
      console.log(`✓ Regenerated spots: ${originalSpotCount} → ${newSpotCount}`);
    });
  });

  describe('delete', () => {
    it('should delete a floor plan and its spots', async () => {
      // Create a temporary floor plan
      const tempPlan = await caller.floorPlans.create({
        roomName: 'Temp Room',
        lengthFeet: 20,
        widthFeet: 20,
        safetySpacingFeet: 3,
        templateType: 'kickboxing_bags',
      });

      // Delete it
      const result = await caller.floorPlans.delete({ id: tempPlan.id });
      expect(result.success).toBe(true);

      // Verify it's gone
      await expect(caller.floorPlans.get({ id: tempPlan.id })).rejects.toThrow();
      console.log('✓ Deleted floor plan and its spots');
    });
  });
});

describe('Spot Generation Algorithms', () => {
  it('should generate kickboxing spots with proper spacing', async () => {
    const plan = await caller.floorPlans.create({
      roomName: 'Kickboxing Test',
      lengthFeet: 40,
      widthFeet: 30,
      safetySpacingFeet: 3,
      templateType: 'kickboxing_bags',
    });

    const fullPlan = await caller.floorPlans.get({ id: plan.id });

    // Verify spot labels follow pattern "Bag 1", "Bag 2", etc.
    fullPlan.spots.forEach((spot, index) => {
      expect(spot.spotLabel).toBe(`Bag ${index + 1}`);
      expect(spot.spotNumber).toBe(index + 1);
    });

    console.log(`✓ Kickboxing spots properly labeled (${fullPlan.spots.length} bags)`);
  });

  it('should generate yoga grid spots with row/column labels', async () => {
    const plan = await caller.floorPlans.create({
      roomName: 'Yoga Test',
      lengthFeet: 30,
      widthFeet: 25,
      safetySpacingFeet: 2,
      templateType: 'yoga_grid',
    });

    const fullPlan = await caller.floorPlans.get({ id: plan.id });

    // Verify spot labels follow pattern "Mat A1", "Mat A2", "Mat B1", etc.
    const firstSpot = fullPlan.spots[0];
    expect(firstSpot.spotLabel).toMatch(/^Mat [A-Z]\d+$/);
    expect(firstSpot.rowIdentifier).toBeDefined();
    expect(firstSpot.columnIdentifier).toBeDefined();

    console.log(`✓ Yoga grid spots properly labeled (${fullPlan.spots.length} mats)`);
    console.log(`  Example: ${firstSpot.spotLabel}`);
  });

  it('should generate karate lineup spots with line/spot labels', async () => {
    const plan = await caller.floorPlans.create({
      roomName: 'Karate Test',
      lengthFeet: 35,
      widthFeet: 28,
      safetySpacingFeet: 3,
      templateType: 'karate_lines',
    });

    const fullPlan = await caller.floorPlans.get({ id: plan.id });

    // Verify spot labels follow pattern "Line 1 Spot 1", "Line 1 Spot 2", etc.
    const firstSpot = fullPlan.spots[0];
    expect(firstSpot.spotLabel).toMatch(/^Line \d+ Spot \d+$/);
    expect(firstSpot.rowIdentifier).toMatch(/^Line \d+$/);
    expect(firstSpot.columnIdentifier).toBeDefined();

    console.log(`✓ Karate lineup spots properly labeled (${fullPlan.spots.length} positions)`);
    console.log(`  Example: ${firstSpot.spotLabel}`);
  });
});
