import { processClassReminders } from "../classReminderService";
import { checkLowStockItems } from "../stockAlertEngine";

/**
 * Background Job Scheduler
 * Runs automation processing and class reminders at regular intervals
 */

let schedulerInterval: NodeJS.Timeout | null = null;
let reminderInterval: NodeJS.Timeout | null = null;
let stockAlertInterval: NodeJS.Timeout | null = null;

/**
 * Start the automation scheduler
 * Runs every minute to check for pending automation steps
 */
export function startScheduler() {
  if (schedulerInterval) {
    console.log("Scheduler already running");
    return;
  }

  console.log("Starting scheduler...");

  // Start class reminder scheduler
  startReminderScheduler();
  
  // Start stock alert scheduler
  startStockAlertScheduler();
}

/**
 * Start the class reminder scheduler
 * Runs every hour to check for classes starting in ~24 hours
 */
function startReminderScheduler() {
  if (reminderInterval) {
    console.log("Reminder scheduler already running");
    return;
  }

  console.log("Starting class reminder scheduler...");

  // Run class reminders after a short delay on startup
  setTimeout(() => {
    console.log("[Scheduler] Initial class reminder check...");
    processClassReminders()
      .then(result => {
        console.log(`[Scheduler] Initial reminder check complete: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped`);
      })
      .catch(error => {
        console.error("Error in initial class reminder processing:", error);
      });
  }, 10000); // 10 seconds after startup

  // Run class reminders every hour
  reminderInterval = setInterval(() => {
    console.log("[Scheduler] Running hourly class reminder check...");
    processClassReminders()
      .then(result => {
        console.log(`[Scheduler] Hourly reminder check complete: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped`);
      })
      .catch(error => {
        console.error("Error in class reminder processing:", error);
      });
  }, 60 * 60 * 1000); // 60 minutes

  console.log("Class reminder scheduler started - running every 60 minutes");
}

/**
 * Start the stock alert scheduler
 * Runs every 6 hours to check for low stock items
 */
function startStockAlertScheduler() {
  if (stockAlertInterval) {
    console.log("Stock alert scheduler already running");
    return;
  }

  console.log("Starting stock alert scheduler...");

  // Run stock alerts after a short delay on startup
  setTimeout(() => {
    console.log("[StockAlert] Initial stock check...");
    checkLowStockItems()
      .then(result => {
        console.log(`[StockAlert] Initial check complete: ${result.checked} items checked, ${result.alertsCreated} alerts created, ${result.emailsSent} emails sent, ${result.smsSent} SMS sent`);
        if (result.errors.length > 0) {
          console.error("[StockAlert] Errors:", result.errors);
        }
      })
      .catch(error => {
        console.error("Error in initial stock alert processing:", error);
      });
  }, 15000); // 15 seconds after startup

  // Run stock alerts every 6 hours
  stockAlertInterval = setInterval(() => {
    console.log("[StockAlert] Running scheduled stock check...");
    checkLowStockItems()
      .then(result => {
        console.log(`[StockAlert] Check complete: ${result.checked} items checked, ${result.alertsCreated} alerts created, ${result.emailsSent} emails sent, ${result.smsSent} SMS sent`);
        if (result.errors.length > 0) {
          console.error("[StockAlert] Errors:", result.errors);
        }
      })
      .catch(error => {
        console.error("Error in stock alert processing:", error);
      });
  }, 6 * 60 * 60 * 1000); // 6 hours

  console.log("Stock alert scheduler started - running every 6 hours");
}

/**
 * Stop the automation scheduler
 */
export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("Automation scheduler stopped");
  }
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log("Reminder scheduler stopped");
  }
  if (stockAlertInterval) {
    clearInterval(stockAlertInterval);
    stockAlertInterval = null;
    console.log("Stock alert scheduler stopped");
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    running: schedulerInterval !== null,
    reminderRunning: reminderInterval !== null,
    stockAlertRunning: stockAlertInterval !== null,
    automationInterval: 60000, // milliseconds
    reminderInterval: 3600000, // milliseconds (1 hour)
    stockAlertInterval: 21600000, // milliseconds (6 hours)
  };
}

/**
 * Manually trigger class reminder processing (for testing/admin)
 */
export async function triggerReminderProcessing() {
  console.log("[Scheduler] Manual class reminder trigger...");
  return processClassReminders();
}

/**
 * Manually trigger stock alert processing (for testing/admin)
 */
export async function triggerStockAlertProcessing() {
  console.log("[StockAlert] Manual stock alert trigger...");
  return checkLowStockItems();
}
