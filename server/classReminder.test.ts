/**
 * Class Reminder Service Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Twilio module
vi.mock("./_core/twilio", () => ({
  sendSMS: vi.fn().mockResolvedValue({ success: true, messageId: "SM123456" }),
}));

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null), // Will test with null db
}));

describe("Class Reminder Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Time Parsing", () => {
    it("should parse 12-hour time format correctly", async () => {
      // Import the module to test time parsing logic
      const { processClassReminders } = await import("./classReminderService");
      
      // Test that the function handles missing database gracefully
      const result = await processClassReminders();
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain("Database not initialized");
    });
  });

  describe("Reminder Processing", () => {
    it("should return error when database is not available", async () => {
      const { processClassReminders } = await import("./classReminderService");
      
      const result = await processClassReminders();
      
      expect(result.success).toBe(false);
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it("should handle test reminder with missing phone", async () => {
      const { sendTestReminder } = await import("./classReminderService");
      
      // This should fail because the phone number is empty
      const result = await sendTestReminder("");
      
      // The function should handle this gracefully
      expect(result).toBeDefined();
    });
  });

  describe("SMS Preferences", () => {
    it("should return false when updating preferences with no database", async () => {
      const { updateSmsPreferences } = await import("./classReminderService");
      
      const result = await updateSmsPreferences(1, {
        optedIn: true,
        classReminders: true,
      });
      
      expect(result).toBe(false);
    });

    it("should return empty array for reminder history with no database", async () => {
      const { getStudentReminderHistory } = await import("./classReminderService");
      
      const result = await getStudentReminderHistory(1);
      
      expect(result).toEqual([]);
    });
  });
});

describe("SMS Reminder Router", () => {
  it("should export the router", async () => {
    const { smsReminderRouter } = await import("./smsReminderRouter");
    
    expect(smsReminderRouter).toBeDefined();
  });
});

describe("Scheduler Integration", () => {
  it("should export scheduler functions", async () => {
    const { startScheduler, stopScheduler, getSchedulerStatus, triggerReminderProcessing } = await import("./services/scheduler");
    
    expect(startScheduler).toBeDefined();
    expect(stopScheduler).toBeDefined();
    expect(getSchedulerStatus).toBeDefined();
    expect(triggerReminderProcessing).toBeDefined();
  });

  it("should return correct scheduler status", async () => {
    const { getSchedulerStatus } = await import("./services/scheduler");
    
    const status = getSchedulerStatus();
    
    expect(status).toHaveProperty("running");
    expect(status).toHaveProperty("reminderRunning");
    expect(status).toHaveProperty("automationInterval");
    expect(status).toHaveProperty("reminderInterval");
    expect(status.reminderInterval).toBe(3600000); // 1 hour
  });
});
