/**
 * kaiReview.test.ts
 * Unit tests for the Kai post-task review system.
 * Tests: ticket number generation, priority logic, task completion detection,
 * and review/ticket data structures.
 */

import { describe, it, expect } from "vitest";

// ── Helpers extracted from kaiReviewRouter for unit testing ───────────────────

function priorityFromRating(stars: number): "low" | "medium" | "high" | "urgent" {
  if (stars === 1) return "urgent";
  if (stars === 2) return "high";
  if (stars === 3) return "medium";
  return "low";
}

function formatTicketNumber(count: number): string {
  return `KAI-${(count + 1).toString().padStart(5, "0")}`;
}

// ── Task completion detection (mirrors server logic) ──────────────────────────

const TASK_COMPLETION_PHRASES = [
  "done!", "completed!", "finished!", "sent!", "created!", "added!",
  "scheduled!", "updated!", "deleted!", "removed!", "imported!",
  "i've sent", "i've created", "i've added", "i've scheduled",
  "i've updated", "i've deleted", "i've removed", "i've imported",
  "successfully sent", "successfully created", "successfully added",
  "successfully scheduled", "successfully updated", "has been sent",
  "has been created", "has been added", "has been scheduled",
];

function detectTaskCompletion(response: string): boolean {
  const lower = response.toLowerCase();
  return TASK_COMPLETION_PHRASES.some((phrase) => lower.includes(phrase));
}

function detectTaskType(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("sms") || lower.includes("text") || lower.includes("blast")) return "sms";
  if (lower.includes("email")) return "email";
  if (lower.includes("class") || lower.includes("schedule")) return "schedule";
  if (lower.includes("student") || lower.includes("enroll")) return "student_management";
  if (lower.includes("lead")) return "lead_management";
  if (lower.includes("import")) return "import";
  return "general";
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("priorityFromRating", () => {
  it("returns urgent for 1 star", () => {
    expect(priorityFromRating(1)).toBe("urgent");
  });

  it("returns high for 2 stars", () => {
    expect(priorityFromRating(2)).toBe("high");
  });

  it("returns medium for 3 stars", () => {
    expect(priorityFromRating(3)).toBe("medium");
  });

  it("returns low for 4 stars", () => {
    expect(priorityFromRating(4)).toBe("low");
  });

  it("returns low for 5 stars", () => {
    expect(priorityFromRating(5)).toBe("low");
  });
});

describe("formatTicketNumber", () => {
  it("formats first ticket as KAI-00001", () => {
    expect(formatTicketNumber(0)).toBe("KAI-00001");
  });

  it("formats 41st ticket as KAI-00042", () => {
    expect(formatTicketNumber(41)).toBe("KAI-00042");
  });

  it("formats 99999th ticket correctly", () => {
    expect(formatTicketNumber(99998)).toBe("KAI-99999");
  });
});

describe("detectTaskCompletion", () => {
  it("detects 'Done!' as task completion", () => {
    expect(detectTaskCompletion("Done! I've sent the SMS blast to 45 students.")).toBe(true);
  });

  it("detects 'successfully created' as task completion", () => {
    expect(detectTaskCompletion("The class has been successfully created in your schedule.")).toBe(true);
  });

  it("detects 'I've scheduled' as task completion", () => {
    expect(detectTaskCompletion("I've scheduled the class for Monday at 6pm.")).toBe(true);
  });

  it("does NOT flag a question as task completion", () => {
    expect(detectTaskCompletion("What would you like me to do?")).toBe(false);
  });

  it("does NOT flag an informational response as task completion", () => {
    expect(detectTaskCompletion("Here are the 5 students with overdue payments.")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(detectTaskCompletion("SUCCESSFULLY SENT the message to all leads.")).toBe(true);
  });
});

describe("detectTaskType", () => {
  it("detects SMS task type", () => {
    expect(detectTaskType("Send an SMS blast to all active students")).toBe("sms");
  });

  it("detects email task type", () => {
    expect(detectTaskType("Send an email to John Smith")).toBe("email");
  });

  it("detects schedule task type", () => {
    expect(detectTaskType("Add a new class to the schedule")).toBe("schedule");
  });

  it("detects student management task type", () => {
    expect(detectTaskType("Enroll Sarah in the beginner program")).toBe("student_management");
  });

  it("detects lead management task type", () => {
    expect(detectTaskType("Move this lead to the follow-up column")).toBe("lead_management");
  });

  it("detects import task type", () => {
    expect(detectTaskType("Import these records from the CSV file")).toBe("import");
  });

  it("defaults to general for unrecognized tasks", () => {
    expect(detectTaskType("What is the weather today?")).toBe("general");
  });
});

describe("ticket auto-creation logic", () => {
  it("should create ticket for 1-star rating", () => {
    const shouldCreate = (stars: number, requestRefund: boolean) =>
      stars <= 2 || requestRefund;
    expect(shouldCreate(1, false)).toBe(true);
  });

  it("should create ticket for 2-star rating", () => {
    const shouldCreate = (stars: number, requestRefund: boolean) =>
      stars <= 2 || requestRefund;
    expect(shouldCreate(2, false)).toBe(true);
  });

  it("should NOT create ticket for 3-star rating without refund request", () => {
    const shouldCreate = (stars: number, requestRefund: boolean) =>
      stars <= 2 || requestRefund;
    expect(shouldCreate(3, false)).toBe(false);
  });

  it("should create ticket for 3-star rating WITH refund request", () => {
    const shouldCreate = (stars: number, requestRefund: boolean) =>
      stars <= 2 || requestRefund;
    expect(shouldCreate(3, true)).toBe(true);
  });

  it("should NOT create ticket for 5-star rating without refund request", () => {
    const shouldCreate = (stars: number, requestRefund: boolean) =>
      stars <= 2 || requestRefund;
    expect(shouldCreate(5, false)).toBe(false);
  });
});
