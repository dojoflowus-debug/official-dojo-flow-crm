import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import { getDb } from "./db";
import { merchandiseItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";

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

describe("merchandise.updateStock", () => {
  let testItemId: number;

  beforeAll(async () => {

    // Create a test merchandise item with stock tracking
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    const [result] = await db.insert(merchandiseItems).values({
      name: "Test Stock Item",
      type: "gear",
      defaultPrice: 5000, // $50.00
      requiresSize: 0,
      sizeOptions: null,
      description: "Item for testing stock adjustments",
      stockQuantity: 10,
      lowStockThreshold: 5,
      isActive: 1,
    });

    testItemId = result.insertId;
  });

  it("should update stock quantity successfully", async () => {
    const result = await caller.merchandise.updateStock({
      itemId: testItemId,
      newQuantity: 20,
      adjustmentReason: "received_shipment",
      notes: "Test shipment",
    });

    expect(result.success).toBe(true);
    expect(result.oldQuantity).toBe(10);
    expect(result.newQuantity).toBe(20);
    expect(result.difference).toBe(10);
  });

  it("should calculate negative difference correctly", async () => {
    const result = await caller.merchandise.updateStock({
      itemId: testItemId,
      newQuantity: 15,
      adjustmentReason: "damage_loss",
      notes: "5 items damaged",
    });

    expect(result.success).toBe(true);
    expect(result.oldQuantity).toBe(20);
    expect(result.newQuantity).toBe(15);
    expect(result.difference).toBe(-5);
  });

  it("should allow setting stock to zero", async () => {
    const result = await caller.merchandise.updateStock({
      itemId: testItemId,
      newQuantity: 0,
      adjustmentReason: "inventory_count",
      notes: "Out of stock",
    });

    expect(result.success).toBe(true);
    expect(result.newQuantity).toBe(0);
    expect(result.difference).toBe(-15);
  });

  it("should work without notes (optional field)", async () => {
    const result = await caller.merchandise.updateStock({
      itemId: testItemId,
      newQuantity: 10,
      adjustmentReason: "correction",
    });

    expect(result.success).toBe(true);
    expect(result.newQuantity).toBe(10);
  });

  it("should work without adjustment reason (optional field)", async () => {
    const result = await caller.merchandise.updateStock({
      itemId: testItemId,
      newQuantity: 12,
    });

    expect(result.success).toBe(true);
    expect(result.newQuantity).toBe(12);
  });

  it("should reject negative stock quantities", async () => {
    await expect(
      caller.merchandise.updateStock({
        itemId: testItemId,
        newQuantity: -5,
        adjustmentReason: "correction",
      })
    ).rejects.toThrow();
  });

  it("should reject non-existent item ID", async () => {
    await expect(
      caller.merchandise.updateStock({
        itemId: 999999,
        newQuantity: 10,
        adjustmentReason: "correction",
      })
    ).rejects.toThrow("Merchandise item not found");
  });

  it("should persist stock changes to database", async () => {
    await caller.merchandise.updateStock({
      itemId: testItemId,
      newQuantity: 25,
      adjustmentReason: "received_shipment",
      notes: "Final test",
    });

    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    const [item] = await db
      .select()
      .from(merchandiseItems)
      .where(eq(merchandiseItems.id, testItemId));

    expect(item.stockQuantity).toBe(25);
  });

  it("should accept all valid adjustment reasons", async () => {
    const reasons: Array<"received_shipment" | "inventory_count" | "correction" | "damage_loss" | "other"> = [
      "received_shipment",
      "inventory_count",
      "correction",
      "damage_loss",
      "other",
    ];

    for (const reason of reasons) {
      const result = await caller.merchandise.updateStock({
        itemId: testItemId,
        newQuantity: 20,
        adjustmentReason: reason,
        notes: `Testing ${reason}`,
      });

      expect(result.success).toBe(true);
    }
  });

  it("should update the updatedAt timestamp", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    // Get current timestamp
    const [beforeUpdate] = await db
      .select()
      .from(merchandiseItems)
      .where(eq(merchandiseItems.id, testItemId));

    const oldTimestamp = beforeUpdate.updatedAt;

    // Wait a moment to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update stock
    await caller.merchandise.updateStock({
      itemId: testItemId,
      newQuantity: 30,
      adjustmentReason: "correction",
    });

    // Check timestamp changed
    const [afterUpdate] = await db
      .select()
      .from(merchandiseItems)
      .where(eq(merchandiseItems.id, testItemId));

    expect(afterUpdate.updatedAt.getTime()).toBeGreaterThan(oldTimestamp.getTime());
  });
});
