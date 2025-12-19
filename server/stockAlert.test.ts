import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { merchandiseItems, stockAlerts, alertSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { checkLowStockItems, getActiveAlerts, getAlertHistory, resolveAlert } from "./stockAlertEngine";

describe("Stock Alert System", () => {
  let testItemId: number;
  let testAlertId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    // Create test merchandise item with low stock
    const [item] = await db.insert(merchandiseItems).values({
      name: "Test Alert Item",
      type: "equipment",
      defaultPrice: 1000,
      requiresSize: 0,
      stockQuantity: 3,
      lowStockThreshold: 5,
      isActive: 1,
    }).$returningId();

    testItemId = item.id;

    // Ensure alert settings exist
    const [existingSettings] = await db.select().from(alertSettings).limit(1);
    if (!existingSettings) {
      await db.insert(alertSettings).values({
        isEnabled: 1,
        notifyEmail: 0, // Disable email for tests
        notifySMS: 0, // Disable SMS for tests
        checkIntervalMinutes: 360,
        alertCooldownHours: 24,
      });
    }
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    if (testItemId) {
      await db.delete(stockAlerts).where(eq(stockAlerts.itemId, testItemId));
      await db.delete(merchandiseItems).where(eq(merchandiseItems.id, testItemId));
    }
  });

  it("should detect low stock items", async () => {
    const result = await checkLowStockItems();
    
    expect(result.checked).toBeGreaterThanOrEqual(1);
    expect(result.alertsCreated).toBeGreaterThanOrEqual(0);
    expect(result.errors).toEqual([]);
  });

  it("should create alert for low stock item", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    // Delete any existing alerts for this item
    await db.delete(stockAlerts).where(eq(stockAlerts.itemId, testItemId));

    // Run check
    const result = await checkLowStockItems();
    
    // Should create at least one alert
    expect(result.alertsCreated).toBeGreaterThanOrEqual(1);

    // Verify alert was created in database
    const alerts = await db.select()
      .from(stockAlerts)
      .where(eq(stockAlerts.itemId, testItemId));

    expect(alerts.length).toBeGreaterThan(0);
    const alert = alerts[0];
    testAlertId = alert.id;

    expect(alert.alertType).toBe("low_stock");
    expect(alert.quantityAtAlert).toBe(3);
    expect(alert.threshold).toBe(5);
    expect(alert.isResolved).toBe(0);
  });

  it("should get active alerts", async () => {
    const alerts = await getActiveAlerts();
    
    expect(Array.isArray(alerts)).toBe(true);
    
    // Should include our test alert
    const testAlert = alerts.find((a) => a.item.id === testItemId);
    expect(testAlert).toBeDefined();
    expect(testAlert?.alert.isResolved).toBe(0);
  });

  it("should get alert history", async () => {
    const history = await getAlertHistory(50);
    
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    
    // Should include our test alert
    const testAlert = history.find((a) => a.item.id === testItemId);
    expect(testAlert).toBeDefined();
  });

  it("should resolve an alert", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    // Resolve the alert
    const result = await resolveAlert(testAlertId, 1, "Test resolution");
    
    expect(result.success).toBe(true);

    // Verify alert is resolved
    const [alert] = await db.select()
      .from(stockAlerts)
      .where(eq(stockAlerts.id, testAlertId));

    expect(alert.isResolved).toBe(1);
    expect(alert.resolvedBy).toBe(1);
    expect(alert.resolutionNotes).toBe("Test resolution");
    expect(alert.resolvedAt).toBeDefined();
  });

  it("should not create duplicate alerts for same item", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    // Delete existing alerts
    await db.delete(stockAlerts).where(eq(stockAlerts.itemId, testItemId));

    // Run check twice
    await checkLowStockItems();
    const result2 = await checkLowStockItems();

    // Second run should not create new alerts (cooldown period)
    expect(result2.alertsCreated).toBe(0);

    // Should only have one alert
    const alerts = await db.select()
      .from(stockAlerts)
      .where(eq(stockAlerts.itemId, testItemId));

    expect(alerts.length).toBe(1);
  });

  it("should detect out of stock items", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    // Update item to out of stock
    await db.update(merchandiseItems)
      .set({ stockQuantity: 0 })
      .where(eq(merchandiseItems.id, testItemId));

    // Delete existing alerts
    await db.delete(stockAlerts).where(eq(stockAlerts.itemId, testItemId));

    // Run check
    await checkLowStockItems();

    // Verify alert type is out_of_stock
    const [alert] = await db.select()
      .from(stockAlerts)
      .where(eq(stockAlerts.itemId, testItemId));

    expect(alert.alertType).toBe("out_of_stock");
    expect(alert.quantityAtAlert).toBe(0);
  });

  it("should respect disabled alert system", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    // Disable alert system
    const [settings] = await db.select().from(alertSettings).limit(1);
    await db.update(alertSettings)
      .set({ isEnabled: 0 })
      .where(eq(alertSettings.id, settings.id));

    // Delete existing alerts
    await db.delete(stockAlerts).where(eq(stockAlerts.itemId, testItemId));

    // Run check
    const result = await checkLowStockItems();

    // Should not create any alerts
    expect(result.checked).toBe(0);
    expect(result.alertsCreated).toBe(0);

    // Re-enable for other tests
    await db.update(alertSettings)
      .set({ isEnabled: 1 })
      .where(eq(alertSettings.id, settings.id));
  });

  it("should not alert for items without stock tracking", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    // Create item without stock tracking
    const [untrackedItem] = await db.insert(merchandiseItems).values({
      name: "Untracked Item",
      type: "other",
      defaultPrice: 500,
      requiresSize: 0,
      stockQuantity: null, // No stock tracking
      lowStockThreshold: null,
      isActive: 1,
    }).$returningId();

    // Run check
    await checkLowStockItems();

    // Should not create alert for untracked item
    const alerts = await db.select()
      .from(stockAlerts)
      .where(eq(stockAlerts.itemId, untrackedItem.id));

    expect(alerts.length).toBe(0);

    // Clean up
    await db.delete(merchandiseItems).where(eq(merchandiseItems.id, untrackedItem.id));
  });

  it("should not alert for items above threshold", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    // Create item with sufficient stock
    const [sufficientItem] = await db.insert(merchandiseItems).values({
      name: "Sufficient Stock Item",
      type: "equipment",
      defaultPrice: 1000,
      requiresSize: 0,
      stockQuantity: 20,
      lowStockThreshold: 10,
      isActive: 1,
    }).$returningId();

    // Run check
    await checkLowStockItems();

    // Should not create alert
    const alerts = await db.select()
      .from(stockAlerts)
      .where(eq(stockAlerts.itemId, sufficientItem.id));

    expect(alerts.length).toBe(0);

    // Clean up
    await db.delete(merchandiseItems).where(eq(merchandiseItems.id, sufficientItem.id));
  });
});
