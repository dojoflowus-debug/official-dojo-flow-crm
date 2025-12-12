import { processAutomations } from "./automationEngine";
import { processClassReminders } from "../classReminderService";

/**
 * Background Job Scheduler
 * Runs automation processing and class reminders at regular intervals
 */

let schedulerInterval: NodeJS.Timeout | null = null;
let reminderInterval: NodeJS.Timeout | null = null;

/**
 * Start the automation scheduler
 * Runs every minute to check for pending automation steps
 */
export function startScheduler() {
  if (schedulerInterval) {
    console.log("Scheduler already running");
    return;
  }

  console.log("Starting automation scheduler...");

  // Run automations immediately on start
  processAutomations().catch(error => {
    console.error("Error in initial automation processing:", error);
  });

  // Then run automations every minute
  schedulerInterval = setInterval(() => {
    processAutomations().catch(error => {
      console.error("Error in scheduled automation processing:", error);
    });
  }, 60 * 1000); // 60 seconds

  console.log("Automation scheduler started - running every 60 seconds");

  // Start class reminder scheduler
  startReminderScheduler();
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
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    running: schedulerInterval !== null,
    reminderRunning: reminderInterval !== null,
    automationInterval: 60000, // milliseconds
    reminderInterval: 3600000, // milliseconds (1 hour)
  };
}

/**
 * Manually trigger class reminder processing (for testing/admin)
 */
export async function triggerReminderProcessing() {
  console.log("[Scheduler] Manual class reminder trigger...");
  return processClassReminders();
}
