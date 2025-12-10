import { processAutomations } from "./automationEngine";

/**
 * Background Job Scheduler
 * Runs automation processing at regular intervals
 */

let schedulerInterval: NodeJS.Timeout | null = null;

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

  // Run immediately on start
  processAutomations().catch(error => {
    console.error("Error in initial automation processing:", error);
  });

  // Then run every minute
  schedulerInterval = setInterval(() => {
    processAutomations().catch(error => {
      console.error("Error in scheduled automation processing:", error);
    });
  }, 60 * 1000); // 60 seconds

  console.log("Automation scheduler started - running every 60 seconds");
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
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    running: schedulerInterval !== null,
    interval: 60000, // milliseconds
  };
}
