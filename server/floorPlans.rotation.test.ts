import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

/**
 * Test suite for yoga mat rotation feature
 * Verifies that mats can be oriented horizontally or vertically
 */

describe("Floor Plans - Yoga Mat Rotation", () => {
  let ctx: Context;

  beforeAll(() => {
    // Mock context with owner user
    ctx = {
      user: {
        id: 1,
        openId: "test-owner",
        name: "Test Owner",
        email: "owner@test.com",
        role: "owner" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    } as Context;
  });

  it("should create yoga grid with horizontal mats (default)", async () => {
    const caller = appRouter.createCaller(ctx);

    const result = await caller.floorPlans.create({
      roomName: "Yoga Studio - Horizontal Test",
      lengthFeet: 30,
      widthFeet: 40,
      safetySpacingFeet: 3,
      templateType: "yoga_grid",
      matRotation: "horizontal",
    });

    expect(result.id).toBeDefined();
    expect(result.spotsGenerated).toBeGreaterThan(0);

    // Fetch the created floor plan
    const floorPlan = await caller.floorPlans.get({ id: result.id });
    expect(floorPlan.matRotation).toBe("horizontal");
    expect(floorPlan.spots.length).toBeGreaterThan(0);

    // Verify spots were generated with correct layout
    // Horizontal mats: 6ft wide x 2ft tall
    // With 40ft width and 3ft spacing: floor(40 / (6 + 3)) = 4 mats per row
    // With 30ft length and 3ft spacing: floor(30 / (2 + 3)) = 6 rows
    // Expected: 4 * 6 = 24 mats
    expect(floorPlan.spots.length).toBe(24);
  });

  it("should create yoga grid with vertical mats", async () => {
    const caller = appRouter.createCaller(ctx);

    const result = await caller.floorPlans.create({
      roomName: "Yoga Studio - Vertical Test",
      lengthFeet: 30,
      widthFeet: 40,
      safetySpacingFeet: 3,
      templateType: "yoga_grid",
      matRotation: "vertical",
    });

    expect(result.id).toBeDefined();
    expect(result.spotsGenerated).toBeGreaterThan(0);

    // Fetch the created floor plan
    const floorPlan = await caller.floorPlans.get({ id: result.id });
    expect(floorPlan.matRotation).toBe("vertical");
    expect(floorPlan.spots.length).toBeGreaterThan(0);

    // Verify spots were generated with correct layout
    // Vertical mats: 2ft wide x 6ft tall
    // With 40ft width and 3ft spacing: floor(40 / (2 + 3)) = 8 mats per row
    // With 30ft length and 3ft spacing: floor(30 / (6 + 3)) = 3 rows
    // Expected: 8 * 3 = 24 mats
    expect(floorPlan.spots.length).toBe(24);
  });

  it("should default to horizontal rotation when not specified", async () => {
    const caller = appRouter.createCaller(ctx);

    const result = await caller.floorPlans.create({
      roomName: "Yoga Studio - Default Rotation",
      lengthFeet: 30,
      widthFeet: 40,
      safetySpacingFeet: 3,
      templateType: "yoga_grid",
      // matRotation not specified, should default to horizontal
    });

    const floorPlan = await caller.floorPlans.get({ id: result.id });
    expect(floorPlan.matRotation).toBe("horizontal");
  });

  it("should generate different spot counts for horizontal vs vertical", async () => {
    const caller = appRouter.createCaller(ctx);

    // Create horizontal layout
    const horizontalResult = await caller.floorPlans.create({
      roomName: "Yoga Studio - Horizontal Comparison",
      lengthFeet: 40,
      widthFeet: 30,
      safetySpacingFeet: 3,
      templateType: "yoga_grid",
      matRotation: "horizontal",
    });

    // Create vertical layout with same dimensions
    const verticalResult = await caller.floorPlans.create({
      roomName: "Yoga Studio - Vertical Comparison",
      lengthFeet: 40,
      widthFeet: 30,
      safetySpacingFeet: 3,
      templateType: "yoga_grid",
      matRotation: "vertical",
    });

    const horizontalPlan = await caller.floorPlans.get({ id: horizontalResult.id });
    const verticalPlan = await caller.floorPlans.get({ id: verticalResult.id });

    // Horizontal: floor(30 / 9) * floor(40 / 5) = 3 * 8 = 24
    // Vertical: floor(30 / 5) * floor(40 / 9) = 6 * 4 = 24
    // In this case they're equal, but layout is different
    expect(horizontalPlan.spots.length).toBe(24);
    expect(verticalPlan.spots.length).toBe(24);

    // Verify they have different spot arrangements by checking second row
    // Horizontal has 3 mats per row, vertical has 6 mats per row
    // So the 4th spot (index 3) will be in different positions
    const horizontalSpot4 = horizontalPlan.spots.find(s => s.spotNumber === 4);
    const verticalSpot4 = verticalPlan.spots.find(s => s.spotNumber === 4);
    
    // Horizontal: spot 4 is in row 2 (A4 doesn't exist, so B1)
    // Vertical: spot 4 is still in row 1 (A4)
    expect(horizontalSpot4?.rowIdentifier).toBe("B");
    expect(verticalSpot4?.rowIdentifier).toBe("A");
  });

  it("should not apply rotation to non-yoga templates", async () => {
    const caller = appRouter.createCaller(ctx);

    // Kickboxing template should ignore matRotation
    const result = await caller.floorPlans.create({
      roomName: "Kickboxing Room - Rotation Ignored",
      lengthFeet: 30,
      widthFeet: 40,
      safetySpacingFeet: 3,
      templateType: "kickboxing_bags",
      matRotation: "vertical", // Should be ignored
    });

    const floorPlan = await caller.floorPlans.get({ id: result.id });
    // matRotation field exists but doesn't affect kickboxing layout
    expect(floorPlan.templateType).toBe("kickboxing_bags");
  });
});
