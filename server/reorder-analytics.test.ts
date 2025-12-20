import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import { getDb } from "./db";
import { merchandiseItems, stockUsageHistory } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  calculateConsumptionVelocity,
  calculateReorderPoint,
  calculateReorderQuantity,
  trackUsage,
  updateReorderAnalytics,
} from "./lib/reorder-analytics";

// Mock context for protected procedures
const mockContext: Context = {
  user: {
    id: 1,
    openId: "test-open-id",
    name: "Test User",
    email: "test@example.com",
    role: "admin",
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

describe("Reorder Analytics Engine", () => {
  let testItemId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    // Create a test merchandise item
    const [result] = await db.insert(merchandiseItems).values({
      name: "Test Reorder Item",
      type: "gear",
      defaultPrice: 3000,
      requiresSize: 0,
      sizeOptions: null,
      description: "Item for testing reorder analytics",
      stockQuantity: 100,
      lowStockThreshold: 20,
      leadTimeDays: 7,
      safetyStockMultiplier: "1.5",
      isActive: 1,
    });

    testItemId = result.insertId;

    // Simulate 30 days of usage history
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Simulate 2-3 items used per day
      const usageAmount = Math.floor(Math.random() * 2) + 2; // 2 or 3 items
      const quantityAfter = 100 - (i * 2.5); // Approximate declining stock

      await db.insert(stockUsageHistory).values({
        itemId: testItemId,
        quantityChange: -usageAmount,
        changeType: "fulfillment",
        quantityAfter: Math.floor(quantityAfter),
        notes: `Day ${i + 1} usage`,
        timestamp: date,
      });
    }
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(stockUsageHistory).where(eq(stockUsageHistory.itemId, testItemId));
    await db.delete(merchandiseItems).where(eq(merchandiseItems.id, testItemId));
  });

  describe("trackUsage", () => {
    it("should track stock usage in history", async () => {
      await trackUsage({
        itemId: testItemId,
        quantityChange: -5,
        changeType: "fulfillment",
        quantityAfter: 95,
        notes: "Test fulfillment",
      });

      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const history = await db
        .select()
        .from(stockUsageHistory)
        .where(eq(stockUsageHistory.itemId, testItemId));

      expect(history.length).toBeGreaterThan(0);
      const latestEntry = history[history.length - 1];
      expect(latestEntry.quantityChange).toBe(-5);
      expect(latestEntry.changeType).toBe("fulfillment");
    });

    it("should track stock additions (positive changes)", async () => {
      await trackUsage({
        itemId: testItemId,
        quantityChange: 50,
        changeType: "received_shipment",
        quantityAfter: 145,
        notes: "New shipment received",
      });

      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const history = await db
        .select()
        .from(stockUsageHistory)
        .where(eq(stockUsageHistory.itemId, testItemId));

      const shipmentEntry = history.find(h => h.changeType === "received_shipment");
      expect(shipmentEntry).toBeDefined();
      expect(shipmentEntry?.quantityChange).toBe(50);
    });
  });

  describe("calculateConsumptionVelocity", () => {
    it("should calculate 30-day average daily usage", async () => {
      const velocity = await calculateConsumptionVelocity(testItemId, 30);

      // We simulated 2-3 items per day, so velocity should be around 2.5
      expect(velocity).toBeGreaterThan(1.5);
      expect(velocity).toBeLessThan(4);
    });

    it("should return 0 for items with no usage history", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      // Create item without usage history
      const [result] = await db.insert(merchandiseItems).values({
        name: "No Usage Item",
        type: "gear",
        defaultPrice: 1000,
        requiresSize: 0,
        stockQuantity: 50,
        isActive: 1,
      });

      const velocity = await calculateConsumptionVelocity(result.insertId, 30);
      expect(velocity).toBe(0);

      // Cleanup
      await db.delete(merchandiseItems).where(eq(merchandiseItems.id, result.insertId));
    });

    it("should calculate different velocities for different time periods", async () => {
      const velocity30 = await calculateConsumptionVelocity(testItemId, 30);
      const velocity60 = await calculateConsumptionVelocity(testItemId, 60);
      const velocity90 = await calculateConsumptionVelocity(testItemId, 90);

      // All should be valid numbers
      expect(velocity30).toBeGreaterThanOrEqual(0);
      expect(velocity60).toBeGreaterThanOrEqual(0);
      expect(velocity90).toBeGreaterThanOrEqual(0);
    });
  });

  describe("calculateReorderPoint", () => {
    it("should calculate reorder point correctly", () => {
      const reorderPoint = calculateReorderPoint({
        averageDailyUsage: 2.5,
        leadTimeDays: 7,
        safetyStockMultiplier: 1.5,
      });

      // (2.5 items/day × 7 days) × 1.5 = 26.25 → 27 (rounded up)
      expect(reorderPoint).toBe(27);
    });

    it("should handle zero usage", () => {
      const reorderPoint = calculateReorderPoint({
        averageDailyUsage: 0,
        leadTimeDays: 7,
        safetyStockMultiplier: 1.5,
      });

      expect(reorderPoint).toBe(0);
    });

    it("should scale with lead time", () => {
      const reorderPoint7 = calculateReorderPoint({
        averageDailyUsage: 2,
        leadTimeDays: 7,
        safetyStockMultiplier: 1.5,
      });

      const reorderPoint14 = calculateReorderPoint({
        averageDailyUsage: 2,
        leadTimeDays: 14,
        safetyStockMultiplier: 1.5,
      });

      expect(reorderPoint14).toBeGreaterThan(reorderPoint7);
    });
  });

  describe("calculateReorderQuantity", () => {
    it("should calculate reorder quantity correctly", () => {
      const quantity = calculateReorderQuantity({
        averageDailyUsage: 2.5,
        leadTimeDays: 7,
      });

      // 2.5 items/day × (7 lead time + 30 review period) = 92.5 → 93
      expect(quantity).toBeGreaterThanOrEqual(93);
    });

    it("should enforce minimum order quantity", () => {
      const quantity = calculateReorderQuantity({
        averageDailyUsage: 0.01,
        leadTimeDays: 1,
      });

      // Even with tiny usage, should return at least 5
      expect(quantity).toBeGreaterThanOrEqual(5);
    });

    it("should allow custom review period", () => {
      const quantity30 = calculateReorderQuantity({
        averageDailyUsage: 2,
        leadTimeDays: 7,
        reviewPeriodDays: 30,
      });

      const quantity60 = calculateReorderQuantity({
        averageDailyUsage: 2,
        leadTimeDays: 7,
        reviewPeriodDays: 60,
      });

      expect(quantity60).toBeGreaterThan(quantity30);
    });
  });

  describe("updateReorderAnalytics", () => {
    it("should update item with calculated analytics", async () => {
      const result = await updateReorderAnalytics(testItemId);

      expect(result.itemId).toBe(testItemId);
      expect(result.velocity).toBeGreaterThan(0);
      expect(result.reorderPoint).toBeGreaterThan(0);
      expect(result.reorderQuantity).toBeGreaterThan(0);

      // Verify database was updated
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const [item] = await db
        .select()
        .from(merchandiseItems)
        .where(eq(merchandiseItems.id, testItemId));

      expect(item.averageDailyUsage).toBeTruthy();
      expect(item.reorderPoint).toBeGreaterThan(0);
      expect(item.reorderQuantity).toBeGreaterThan(0);
      expect(item.lastCalculatedAt).toBeTruthy();
    });
  });

  describe("API endpoints", () => {
    it("should get reorder suggestions", async () => {
      // First, set stock below reorder point
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      await db
        .update(merchandiseItems)
        .set({ stockQuantity: 10, reorderPoint: 25 })
        .where(eq(merchandiseItems.id, testItemId));

      const suggestions = await caller.merchandise.getReorderSuggestions();

      expect(Array.isArray(suggestions)).toBe(true);
      const testSuggestion = suggestions.find(s => s.id === testItemId);
      expect(testSuggestion).toBeDefined();
      expect(testSuggestion?.stockQuantity).toBeLessThanOrEqual(testSuggestion?.reorderPoint || 0);
    });

    it("should update reorder analytics via API", async () => {
      const result = await caller.merchandise.updateReorderAnalytics({
        itemId: testItemId,
      });

      expect(result.itemId).toBe(testItemId);
      expect(result.velocity).toBeGreaterThanOrEqual(0);
    });

    it("should get usage history via API", async () => {
      const history = await caller.merchandise.getUsageHistory({
        itemId: testItemId,
        days: 30,
      });

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it("should get consumption velocity via API", async () => {
      const velocities = await caller.merchandise.getConsumptionVelocity({
        itemId: testItemId,
      });

      expect(velocities.velocity30).toBeGreaterThanOrEqual(0);
      expect(velocities.velocity60).toBeGreaterThanOrEqual(0);
      expect(velocities.velocity90).toBeGreaterThanOrEqual(0);
    });

    it("should update reorder settings via API", async () => {
      const result = await caller.merchandise.updateReorderSettings({
        itemId: testItemId,
        leadTimeDays: 10,
        safetyStockMultiplier: 2.0,
      });

      expect(result.success).toBe(true);
      expect(result.leadTime).toBe(10);
      expect(result.safetyMultiplier).toBe(2.0);

      // Verify database was updated
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      const [item] = await db
        .select()
        .from(merchandiseItems)
        .where(eq(merchandiseItems.id, testItemId));

      expect(item.leadTimeDays).toBe(10);
      expect(item.safetyStockMultiplier).toBe("2");
    });

    it("should recalculate all reorder points via API", async () => {
      const result = await caller.merchandise.recalculateAllReorderPoints();

      expect(result.success).toBe(true);
      expect(result.itemsUpdated).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should handle items with sporadic usage", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      // Create item with sporadic usage
      const [result] = await db.insert(merchandiseItems).values({
        name: "Sporadic Usage Item",
        type: "gear",
        defaultPrice: 1000,
        requiresSize: 0,
        stockQuantity: 50,
        leadTimeDays: 7,
        safetyStockMultiplier: "1.5",
        isActive: 1,
      });

      const sporadicItemId = result.insertId;

      // Add sporadic usage (only 3 events in 30 days)
      const dates = [1, 10, 25];
      for (const dayAgo of dates) {
        const date = new Date();
        date.setDate(date.getDate() - dayAgo);

        await db.insert(stockUsageHistory).values({
          itemId: sporadicItemId,
          quantityChange: -5,
          changeType: "fulfillment",
          quantityAfter: 45,
          timestamp: date,
        });
      }

      const velocity = await calculateConsumptionVelocity(sporadicItemId, 30);
      expect(velocity).toBeGreaterThanOrEqual(0);

      // Cleanup
      await db.delete(stockUsageHistory).where(eq(stockUsageHistory.itemId, sporadicItemId));
      await db.delete(merchandiseItems).where(eq(merchandiseItems.id, sporadicItemId));
    });

    it("should handle high variability in usage", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");

      // Create item with high variability
      const [result] = await db.insert(merchandiseItems).values({
        name: "Variable Usage Item",
        type: "gear",
        defaultPrice: 1000,
        requiresSize: 0,
        stockQuantity: 100,
        leadTimeDays: 7,
        safetyStockMultiplier: "1.5",
        isActive: 1,
      });

      const variableItemId = result.insertId;

      // Add highly variable usage (1, 10, 2, 15, 3, etc.)
      const usageAmounts = [1, 10, 2, 15, 3, 12, 1, 8, 2, 20];
      for (let i = 0; i < usageAmounts.length; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        await db.insert(stockUsageHistory).values({
          itemId: variableItemId,
          quantityChange: -usageAmounts[i],
          changeType: "fulfillment",
          quantityAfter: 100 - usageAmounts[i],
          timestamp: date,
        });
      }

      const analytics = await updateReorderAnalytics(variableItemId);
      expect(analytics.velocity).toBeGreaterThan(0);
      expect(analytics.reorderPoint).toBeGreaterThan(0);

      // Cleanup
      await db.delete(stockUsageHistory).where(eq(stockUsageHistory.itemId, variableItemId));
      await db.delete(merchandiseItems).where(eq(merchandiseItems.id, variableItemId));
    });
  });
});
