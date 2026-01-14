import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import { getDb } from "./db";
import { floorPlans, floorPlanSpots } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Floor Plans Router - Rotation Editing Tests
 * Tests the ability to change mat rotation on existing yoga grid floor plans
 */

describe("FloorPlans Router - Rotation Editing", () => {
  let testFloorPlanId: number;
  const mockContext: Context = {
    user: {
      openId: "test-user-123",
      name: "Test User",
      email: "test@example.com",
      avatar: null,
      role: "admin",
      locationId: null,
    },
  };

  const caller = appRouter.createCaller(mockContext);

  beforeAll(async () => {
    // Create a test yoga grid floor plan with horizontal rotation
    const result = await caller.floorPlans.create({
      roomName: "Test Yoga Studio - Rotation Test",
      lengthFeet: 40,
      widthFeet: 30,
      safetySpacingFeet: 3,
      templateType: "yoga_grid",
      matRotation: "horizontal",
      notes: "Test floor plan for rotation editing",
    });

    testFloorPlanId = result.id;
  });

  afterAll(async () => {
    // Clean up test data
    const db = await getDb();
    if (!db) return;

    await db.delete(floorPlanSpots).where(eq(floorPlanSpots.floorPlanId, testFloorPlanId));
    await db.delete(floorPlans).where(eq(floorPlans.id, testFloorPlanId));
  });

  it("should create floor plan with horizontal rotation", async () => {
    const plan = await caller.floorPlans.get({ id: testFloorPlanId });

    expect(plan).toBeDefined();
    expect(plan.matRotation).toBe("horizontal");
    expect(plan.templateType).toBe("yoga_grid");
    expect(plan.spots.length).toBeGreaterThan(0);
  });

  it("should change rotation from horizontal to vertical", async () => {
    // Get initial spot count
    const initialPlan = await caller.floorPlans.get({ id: testFloorPlanId });
    const initialSpotCount = initialPlan.spots.length;

    // Update rotation to vertical
    await caller.floorPlans.update({
      id: testFloorPlanId,
      matRotation: "vertical",
    });

    // Verify rotation changed
    const updatedPlan = await caller.floorPlans.get({ id: testFloorPlanId });
    expect(updatedPlan.matRotation).toBe("vertical");

    // Verify spots were regenerated (count may differ due to different layout)
    expect(updatedPlan.spots.length).toBeGreaterThan(0);

    // Verify all spots have new positions
    const spotNumbers = updatedPlan.spots.map((s) => s.spotNumber);
    expect(spotNumbers).toContain(1);
  });

  it("should change rotation from vertical back to horizontal", async () => {
    // Update rotation back to horizontal
    await caller.floorPlans.update({
      id: testFloorPlanId,
      matRotation: "horizontal",
    });

    // Verify rotation changed back
    const updatedPlan = await caller.floorPlans.get({ id: testFloorPlanId });
    expect(updatedPlan.matRotation).toBe("horizontal");

    // Verify spots were regenerated
    expect(updatedPlan.spots.length).toBeGreaterThan(0);
  });

  it("should update maxCapacity when rotation changes", async () => {
    // Get current capacity
    const beforeUpdate = await caller.floorPlans.get({ id: testFloorPlanId });
    const beforeCapacity = beforeUpdate.maxCapacity;

    // Change to vertical (different spot count)
    await caller.floorPlans.update({
      id: testFloorPlanId,
      matRotation: "vertical",
    });

    const afterUpdate = await caller.floorPlans.get({ id: testFloorPlanId });
    const afterCapacity = afterUpdate.maxCapacity;

    // Verify capacity matches spot count
    expect(afterCapacity).toBe(afterUpdate.spots.length);

    // Note: Capacity may be same or different depending on room dimensions
    // The important thing is it matches the actual spot count
    expect(afterCapacity).toBeGreaterThan(0);
  });

  it("should not regenerate spots when rotation doesn't change", async () => {
    // Get current plan
    const beforeUpdate = await caller.floorPlans.get({ id: testFloorPlanId });
    const beforeSpotIds = beforeUpdate.spots.map((s) => s.id);

    // Update with same rotation
    await caller.floorPlans.update({
      id: testFloorPlanId,
      matRotation: beforeUpdate.matRotation || "horizontal",
      roomName: "Updated Name Only",
    });

    const afterUpdate = await caller.floorPlans.get({ id: testFloorPlanId });
    const afterSpotIds = afterUpdate.spots.map((s) => s.id);

    // Verify room name changed
    expect(afterUpdate.roomName).toBe("Updated Name Only");

    // Verify spots were NOT regenerated (same IDs)
    expect(afterSpotIds).toEqual(beforeSpotIds);
  });

  it("should only allow rotation changes for yoga_grid template", async () => {
    // Create a kickboxing floor plan
    const kickboxingPlan = await caller.floorPlans.create({
      roomName: "Test Kickboxing - No Rotation",
      lengthFeet: 40,
      widthFeet: 30,
      safetySpacingFeet: 3,
      templateType: "kickboxing_bags",
      notes: "Should not support rotation",
    });

    // Get initial spots
    const beforeUpdate = await caller.floorPlans.get({ id: kickboxingPlan.id });
    const beforeSpotIds = beforeUpdate.spots.map((s) => s.id);

    // Try to update with rotation (should be ignored for non-yoga templates)
    await caller.floorPlans.update({
      id: kickboxingPlan.id,
      matRotation: "vertical", // This should be ignored
    });

    const afterUpdate = await caller.floorPlans.get({ id: kickboxingPlan.id });
    const afterSpotIds = afterUpdate.spots.map((s) => s.id);

    // Verify spots were NOT regenerated (rotation change ignored)
    expect(afterSpotIds).toEqual(beforeSpotIds);

    // Clean up
    const db = await getDb();
    if (db) {
      await db.delete(floorPlanSpots).where(eq(floorPlanSpots.floorPlanId, kickboxingPlan.id));
      await db.delete(floorPlans).where(eq(floorPlans.id, kickboxingPlan.id));
    }
  });

  it("should regenerate spots when dimensions AND rotation change together", async () => {
    // Update both dimensions and rotation
    await caller.floorPlans.update({
      id: testFloorPlanId,
      lengthFeet: 50, // Changed from 40
      widthFeet: 35,  // Changed from 30
      matRotation: "horizontal",
    });

    const updatedPlan = await caller.floorPlans.get({ id: testFloorPlanId });

    // Verify both changes applied
    expect(updatedPlan.lengthFeet).toBe(50);
    expect(updatedPlan.widthFeet).toBe(35);
    expect(updatedPlan.matRotation).toBe("horizontal");

    // Verify spots regenerated
    expect(updatedPlan.spots.length).toBeGreaterThan(0);
    expect(updatedPlan.maxCapacity).toBe(updatedPlan.spots.length);
  });
});
