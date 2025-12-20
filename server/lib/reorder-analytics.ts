/**
 * Reorder Analytics Service
 * Tracks stock usage, calculates consumption velocity, and generates reorder suggestions
 */

import { getDb } from "../db";
import { merchandiseItems, stockUsageHistory } from "../../drizzle/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

/**
 * Track a stock change event in the usage history
 */
export async function trackUsage(params: {
  itemId: number;
  quantityChange: number;
  changeType: "fulfillment" | "bulk_assignment" | "adjustment" | "received_shipment" | "inventory_count" | "damage" | "return" | "other";
  quantityAfter: number;
  notes?: string;
  changedBy?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  await db.insert(stockUsageHistory).values({
    itemId: params.itemId,
    quantityChange: params.quantityChange,
    changeType: params.changeType,
    quantityAfter: params.quantityAfter,
    notes: params.notes,
    changedBy: params.changedBy,
  });

  console.log(`[ReorderAnalytics] Tracked usage for item ${params.itemId}: ${params.quantityChange > 0 ? '+' : ''}${params.quantityChange} (${params.changeType})`);
}

/**
 * Calculate consumption velocity (average daily usage) for an item
 * @param itemId - Merchandise item ID
 * @param days - Number of days to analyze (30, 60, or 90)
 * @returns Average items consumed per day
 */
export async function calculateConsumptionVelocity(itemId: number, days: number = 30): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Get all usage events (negative changes only) within the time period
  const usageEvents = await db
    .select({
      quantityChange: stockUsageHistory.quantityChange,
    })
    .from(stockUsageHistory)
    .where(
      and(
        eq(stockUsageHistory.itemId, itemId),
        gte(stockUsageHistory.timestamp, cutoffDate),
        sql`${stockUsageHistory.quantityChange} < 0` // Only count decreases (usage)
      )
    );

  if (usageEvents.length === 0) {
    return 0; // No usage data available
  }

  // Sum up all usage (convert negative to positive)
  const totalUsed = usageEvents.reduce((sum, event) => sum + Math.abs(event.quantityChange), 0);

  // Calculate average daily usage
  const velocity = totalUsed / days;

  return parseFloat(velocity.toFixed(2));
}

/**
 * Calculate reorder point based on consumption velocity, lead time, and safety stock
 * Formula: Reorder Point = (Average Daily Usage × Lead Time) × Safety Stock Multiplier
 */
export function calculateReorderPoint(params: {
  averageDailyUsage: number;
  leadTimeDays: number;
  safetyStockMultiplier: number;
}): number {
  const baseUsage = params.averageDailyUsage * params.leadTimeDays;
  const reorderPoint = Math.ceil(baseUsage * params.safetyStockMultiplier);
  return reorderPoint;
}

/**
 * Calculate suggested reorder quantity
 * Uses Economic Order Quantity (EOQ) concept simplified for martial arts inventory
 * Formula: Reorder Quantity = Average Daily Usage × (Lead Time + Review Period)
 */
export function calculateReorderQuantity(params: {
  averageDailyUsage: number;
  leadTimeDays: number;
  reviewPeriodDays?: number; // How often you review inventory (default: 30 days)
}): number {
  const reviewPeriod = params.reviewPeriodDays || 30;
  const totalDays = params.leadTimeDays + reviewPeriod;
  const reorderQuantity = Math.ceil(params.averageDailyUsage * totalDays);
  
  // Minimum order quantity of 5 items (practical minimum)
  return Math.max(reorderQuantity, 5);
}

/**
 * Calculate confidence score for reorder suggestions
 * Based on data consistency and sample size
 * @returns Score from 0-100 (100 = highest confidence)
 */
export async function calculateConfidenceScore(itemId: number, days: number = 30): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const usageEvents = await db
    .select({
      quantityChange: stockUsageHistory.quantityChange,
      timestamp: stockUsageHistory.timestamp,
    })
    .from(stockUsageHistory)
    .where(
      and(
        eq(stockUsageHistory.itemId, itemId),
        gte(stockUsageHistory.timestamp, cutoffDate),
        sql`${stockUsageHistory.quantityChange} < 0`
      )
    )
    .orderBy(desc(stockUsageHistory.timestamp));

  if (usageEvents.length === 0) return 0;

  // Factor 1: Sample size (more data = higher confidence)
  const sampleScore = Math.min((usageEvents.length / 10) * 50, 50); // Max 50 points

  // Factor 2: Data consistency (lower variance = higher confidence)
  const usageAmounts = usageEvents.map(e => Math.abs(e.quantityChange));
  const mean = usageAmounts.reduce((sum, val) => sum + val, 0) / usageAmounts.length;
  const variance = usageAmounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / usageAmounts.length;
  const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 1;
  
  // Lower CV = more consistent = higher score
  const consistencyScore = Math.max(50 - (coefficientOfVariation * 25), 0); // Max 50 points

  const totalScore = Math.round(sampleScore + consistencyScore);
  return Math.min(totalScore, 100);
}

/**
 * Update reorder analytics for a specific item
 * Calculates velocity, reorder point, and reorder quantity
 */
export async function updateReorderAnalytics(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  // Get item details
  const item = await db
    .select()
    .from(merchandiseItems)
    .where(eq(merchandiseItems.id, itemId))
    .limit(1);

  if (item.length === 0) {
    throw new Error(`Item ${itemId} not found`);
  }

  const itemData = item[0];

  // Calculate 30-day consumption velocity
  const velocity = await calculateConsumptionVelocity(itemId, 30);

  // Use item's lead time and safety stock multiplier (or defaults)
  const leadTime = itemData.leadTimeDays || 7;
  const safetyMultiplier = parseFloat(itemData.safetyStockMultiplier || "1.5");

  // Calculate reorder point and quantity
  const reorderPoint = calculateReorderPoint({
    averageDailyUsage: velocity,
    leadTimeDays: leadTime,
    safetyStockMultiplier: safetyMultiplier,
  });

  const reorderQuantity = calculateReorderQuantity({
    averageDailyUsage: velocity,
    leadTimeDays: leadTime,
  });

  // Update item with calculated values
  await db
    .update(merchandiseItems)
    .set({
      averageDailyUsage: velocity.toString(),
      reorderPoint,
      reorderQuantity,
      lastCalculatedAt: new Date(),
    })
    .where(eq(merchandiseItems.id, itemId));

  console.log(`[ReorderAnalytics] Updated item ${itemId}: velocity=${velocity}/day, reorder point=${reorderPoint}, reorder qty=${reorderQuantity}`);

  return {
    itemId,
    velocity,
    reorderPoint,
    reorderQuantity,
    leadTime,
    safetyMultiplier,
  };
}

/**
 * Get items that need reordering (current stock <= reorder point)
 */
export async function getReorderSuggestions() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const items = await db
    .select()
    .from(merchandiseItems)
    .where(
      and(
        eq(merchandiseItems.isActive, 1),
        sql`${merchandiseItems.stockQuantity} IS NOT NULL`,
        sql`${merchandiseItems.reorderPoint} IS NOT NULL`,
        sql`${merchandiseItems.stockQuantity} <= ${merchandiseItems.reorderPoint}`
      )
    );

  // Calculate additional metrics for each item
  const suggestions = await Promise.all(
    items.map(async (item) => {
      const velocity = parseFloat(item.averageDailyUsage || "0");
      const daysUntilStockout = velocity > 0 ? Math.floor((item.stockQuantity || 0) / velocity) : 999;
      const confidenceScore = await calculateConfidenceScore(item.id, 30);

      return {
        ...item,
        velocity,
        daysUntilStockout,
        confidenceScore,
      };
    })
  );

  // Sort by urgency (days until stockout, ascending)
  suggestions.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

  return suggestions;
}

/**
 * Get usage history for an item (for charts and analytics)
 */
export async function getUsageHistory(itemId: number, days: number = 90) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const history = await db
    .select()
    .from(stockUsageHistory)
    .where(
      and(
        eq(stockUsageHistory.itemId, itemId),
        gte(stockUsageHistory.timestamp, cutoffDate)
      )
    )
    .orderBy(desc(stockUsageHistory.timestamp));

  return history;
}

/**
 * Recalculate reorder analytics for all active items with stock tracking
 */
export async function recalculateAllReorderPoints() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const items = await db
    .select({ id: merchandiseItems.id })
    .from(merchandiseItems)
    .where(
      and(
        eq(merchandiseItems.isActive, 1),
        sql`${merchandiseItems.stockQuantity} IS NOT NULL`
      )
    );

  console.log(`[ReorderAnalytics] Recalculating reorder points for ${items.length} items...`);

  const results = [];
  for (const item of items) {
    try {
      const result = await updateReorderAnalytics(item.id);
      results.push(result);
    } catch (error) {
      console.error(`[ReorderAnalytics] Failed to update item ${item.id}:`, error);
    }
  }

  console.log(`[ReorderAnalytics] Recalculation complete: ${results.length} items updated`);

  return results;
}
