import { getDb } from "./db";
import { merchandiseItems, stockAlerts, alertSettings } from "../drizzle/schema";
import { and, eq, lte, or, isNull, sql } from "drizzle-orm";
import { sendEmail } from "./_core/sendgrid";
import { sendSMS } from "./_core/twilio";

/**
 * Stock Alert Engine
 * Monitors merchandise inventory levels and sends notifications when items fall below threshold
 */

export interface LowStockItem {
  id: number;
  name: string;
  type: string;
  stockQuantity: number;
  lowStockThreshold: number;
  alertType: "low_stock" | "out_of_stock";
}

export interface AlertCheckResult {
  checked: number;
  alertsCreated: number;
  emailsSent: number;
  smsSent: number;
  errors: string[];
}

/**
 * Check all merchandise items for low stock and create alerts
 */
export async function checkLowStockItems(): Promise<AlertCheckResult> {
  const result: AlertCheckResult = {
    checked: 0,
    alertsCreated: 0,
    emailsSent: 0,
    smsSent: 0,
    errors: [],
  };

  try {
    const db = await getDb();
    if (!db) {
      result.errors.push("Database not initialized");
      return result;
    }

    // Get alert settings
    const [settings] = await db.select().from(alertSettings).limit(1);
    
    if (!settings || !settings.isEnabled) {
      console.log("[StockAlert] Alert system is disabled");
      return result;
    }

    // Find all items with stock tracking enabled (stockQuantity is not null)
    // where current stock is at or below threshold
    const lowStockItems = await db
      .select({
        id: merchandiseItems.id,
        name: merchandiseItems.name,
        type: merchandiseItems.type,
        stockQuantity: merchandiseItems.stockQuantity,
        lowStockThreshold: merchandiseItems.lowStockThreshold,
      })
      .from(merchandiseItems)
      .where(
        and(
          sql`${merchandiseItems.stockQuantity} IS NOT NULL`,
          sql`${merchandiseItems.lowStockThreshold} IS NOT NULL`,
          lte(merchandiseItems.stockQuantity, sql`${merchandiseItems.lowStockThreshold}`),
          eq(merchandiseItems.isActive, 1)
        )
      );

    result.checked = lowStockItems.length;

    if (lowStockItems.length === 0) {
      console.log("[StockAlert] No low stock items found");
      return result;
    }

    console.log(`[StockAlert] Found ${lowStockItems.length} low stock items`);

    // Process each low stock item
    for (const item of lowStockItems) {
      try {
        const alertType = item.stockQuantity === 0 ? "out_of_stock" : "low_stock";
        
        // Check if we already have an unresolved alert for this item
        const [existingAlert] = await db
          .select()
          .from(stockAlerts)
          .where(
            and(
              eq(stockAlerts.itemId, item.id),
              eq(stockAlerts.isResolved, 0)
            )
          )
          .limit(1);

        if (existingAlert) {
          // Check if we should send another notification (cooldown period)
          const hoursSinceLastAlert = 
            (Date.now() - existingAlert.lastAlertSent.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastAlert < settings.alertCooldownHours) {
            console.log(`[StockAlert] Skipping ${item.name} - cooldown period active`);
            continue;
          }

          // Update existing alert
          await db
            .update(stockAlerts)
            .set({
              lastAlertSent: new Date(),
              alertCount: existingAlert.alertCount + 1,
              quantityAtAlert: item.stockQuantity!,
            })
            .where(eq(stockAlerts.id, existingAlert.id));
          
          console.log(`[StockAlert] Updated alert for ${item.name}`);
        } else {
          // Create new alert
          await db.insert(stockAlerts).values({
            itemId: item.id,
            alertType,
            quantityAtAlert: item.stockQuantity!,
            threshold: item.lowStockThreshold!,
            lastAlertSent: new Date(),
            alertCount: 1,
            isResolved: 0,
          });
          
          result.alertsCreated++;
          console.log(`[StockAlert] Created new alert for ${item.name}`);
        }

        // Send notifications
        const itemData: LowStockItem = {
          id: item.id,
          name: item.name,
          type: item.type,
          stockQuantity: item.stockQuantity!,
          lowStockThreshold: item.lowStockThreshold!,
          alertType,
        };

        if (settings.notifyEmail && settings.recipientEmails) {
          try {
            await sendStockAlertEmail(itemData, settings.recipientEmails);
            result.emailsSent++;
          } catch (error) {
            result.errors.push(`Email failed for ${item.name}: ${error}`);
          }
        }

        if (settings.notifySMS && settings.recipientPhones) {
          try {
            await sendStockAlertSMS(itemData, settings.recipientPhones);
            result.smsSent++;
          } catch (error) {
            result.errors.push(`SMS failed for ${item.name}: ${error}`);
          }
        }
      } catch (error) {
        result.errors.push(`Error processing ${item.name}: ${error}`);
      }
    }

    console.log(`[StockAlert] Check complete: ${result.alertsCreated} alerts created, ${result.emailsSent} emails sent, ${result.smsSent} SMS sent`);
    return result;
  } catch (error) {
    result.errors.push(`Fatal error: ${error}`);
    console.error("[StockAlert] Fatal error:", error);
    return result;
  }
}

/**
 * Send email notification for low stock item
 */
async function sendStockAlertEmail(item: LowStockItem, recipients: string): Promise<void> {
  const emails = recipients.split(",").map((e) => e.trim()).filter((e) => e);
  
  if (emails.length === 0) {
    throw new Error("No valid email recipients");
  }

  const subject = item.alertType === "out_of_stock"
    ? `🚨 OUT OF STOCK: ${item.name}`
    : `⚠️ Low Stock Alert: ${item.name}`;

  const message = `
<h2>${subject}</h2>

<p><strong>Item:</strong> ${item.name}</p>
<p><strong>Type:</strong> ${item.type}</p>
<p><strong>Current Stock:</strong> ${item.stockQuantity}</p>
<p><strong>Threshold:</strong> ${item.lowStockThreshold}</p>

${item.alertType === "out_of_stock" 
  ? "<p style='color: red;'><strong>This item is completely out of stock!</strong></p>"
  : `<p style='color: orange;'><strong>Stock is running low. Consider reordering soon.</strong></p>`
}

<p>Please check your inventory management system for more details.</p>
  `.trim();

  for (const email of emails) {
    await sendEmail({
      to: email,
      subject,
      html: message,
    });
  }
}

/**
 * Send SMS notification for low stock item
 */
async function sendStockAlertSMS(item: LowStockItem, recipients: string): Promise<void> {
  const phones = recipients.split(",").map((p) => p.trim()).filter((p) => p);
  
  if (phones.length === 0) {
    throw new Error("No valid phone recipients");
  }

  const message = item.alertType === "out_of_stock"
    ? `🚨 OUT OF STOCK: ${item.name}. Current: ${item.stockQuantity}. Please reorder immediately.`
    : `⚠️ LOW STOCK: ${item.name}. Current: ${item.stockQuantity}, Threshold: ${item.lowStockThreshold}. Consider reordering.`;

  for (const phone of phones) {
    await sendSMS({
      to: phone,
      message,
    });
  }
}

/**
 * Get all active (unresolved) stock alerts
 */
export async function getActiveAlerts() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const alerts = await db
    .select({
      alert: stockAlerts,
      item: {
        id: merchandiseItems.id,
        name: merchandiseItems.name,
        type: merchandiseItems.type,
        stockQuantity: merchandiseItems.stockQuantity,
        lowStockThreshold: merchandiseItems.lowStockThreshold,
      },
    })
    .from(stockAlerts)
    .innerJoin(merchandiseItems, eq(stockAlerts.itemId, merchandiseItems.id))
    .where(eq(stockAlerts.isResolved, 0))
    .orderBy(sql`${stockAlerts.createdAt} DESC`);

  return alerts;
}

/**
 * Get alert history (all alerts including resolved)
 */
export async function getAlertHistory(limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const alerts = await db
    .select({
      alert: stockAlerts,
      item: {
        id: merchandiseItems.id,
        name: merchandiseItems.name,
        type: merchandiseItems.type,
      },
    })
    .from(stockAlerts)
    .innerJoin(merchandiseItems, eq(stockAlerts.itemId, merchandiseItems.id))
    .orderBy(sql`${stockAlerts.createdAt} DESC`)
    .limit(limit);

  return alerts;
}

/**
 * Resolve a stock alert
 */
export async function resolveAlert(alertId: number, resolvedBy?: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  await db
    .update(stockAlerts)
    .set({
      isResolved: 1,
      resolvedAt: new Date(),
      resolvedBy,
      resolutionNotes: notes,
    })
    .where(eq(stockAlerts.id, alertId));

  return { success: true };
}
