/**
 * Kai NLP Router Acceptance Tests
 * Validates intent classification and routing accuracy
 */

import { describe, it, expect } from "vitest";
import { classifyIntent, suggestProcedures, isValidProcedure, getAllProcedures } from "./kai-nlp-router";

describe("Kai NLP Router - Intent Classification", () => {
  it("should classify exact example utterances with high confidence", () => {
    const queries = [
      "Find student John Smith",
      "Show all classes",
      "Who checked in today",
      "Show overdue accounts",
      "What's our total revenue this month",
    ];

    queries.forEach((query) => {
      const result = classifyIntent(query);
      expect(result).toBeDefined();
      expect(result?.confidence).toBeGreaterThan(0.8);
      expect(result?.procedure).toBeDefined();
      expect(result?.module).toBeDefined();
    });
  });
  it("should classify keyword-based queries with reasonable confidence", () => {
    const queries = [
      "search for students",
      "list classes for Monday",
      "show attendance",
      "who owes money",
    ];

    queries.forEach((query) => {
      const result = classifyIntent(query);
      expect(result).toBeDefined();
      expect(result?.confidence).toBeGreaterThan(0.2);
    });
  });

  it("should handle case-insensitive queries", () => {
    const queries = [
      "FIND STUDENT JOHN",
      "find student john",
      "Find Student John",
    ];

    const results = queries.map((q) => classifyIntent(q));
    const procedures = results.map((r) => r?.procedure);

    expect(procedures[0]).toBe(procedures[1]);
    expect(procedures[1]).toBe(procedures[2]);
  });

  it("should return null for ambiguous or empty queries", () => {
    const result = classifyIntent("");
    expect(result).toBeNull();
  });

  it("should classify classes module queries correctly", () => {
    const classesQueries = [
      "Show all classes",
      "What's the capacity for class 5",
      "Show roster for class 10",
      "Attendance report for class 3",
    ];

    classesQueries.forEach((query) => {
      const result = classifyIntent(query);
      expect(result).toBeDefined();
      expect([
        "listClasses",
        "getClassCapacity",
        "getClassRoster",
        "getAttendanceSummary",
      ]).toContain(result?.procedure);
      expect(result?.module).toBe("classes");
    });
  });

  it("should classify kiosk module queries correctly", () => {
    const kioskQueries = [
      "Show today's check-ins",
      "Who checked in today",
      "Show new visitors this week",
      "Is student 123 waiver valid",
    ];

    kioskQueries.forEach((query) => {
      const result = classifyIntent(query);
      expect(result).toBeDefined();
      expect([
        "getKioskToday",
        "getCheckins",
        "getNewVisitors",
        "getWaiverStatus",
      ]).toContain(result?.procedure);
      expect(result?.module).toBe("kiosk");
    });
  });

  it("should classify billing module queries correctly", () => {
    const billingQueries = [
      "Show revenue for January",
      "Who owes money",
      "Show failed payments this month",
      "What's our total revenue",
    ];

    billingQueries.forEach((query) => {
      const result = classifyIntent(query);
      expect(result).toBeDefined();
      expect([
        "getRevenueSummary",
        "getOverdueAccounts",
        "getFailedPayments",
      ]).toContain(result?.procedure);
      expect(result?.module).toBe("billing");
    });
  });

  it("should provide reasoning for classification", () => {
    const result = classifyIntent("Find student John Smith");
    expect(result?.reasoning).toBeDefined();
    expect(result?.reasoning?.length).toBeGreaterThan(0);
  });

  it("should maintain consistent classifications for same query", () => {
    const query = "Show all classes";
    const result1 = classifyIntent(query);
    const result2 = classifyIntent(query);

    expect(result1?.procedure).toBe(result2?.procedure);
    expect(result1?.confidence).toBe(result2?.confidence);
  });
});

describe("Kai NLP Router - Procedure Validation", () => {
  it("should validate existing procedures", () => {
    const procedures = [
      "searchStudents",
      "listClasses",
      "getKioskToday",
      "getRevenueSummary",
    ];

    procedures.forEach((procedure) => {
      expect(isValidProcedure(procedure)).toBe(true);
    });
  });

  it("should reject invalid procedures", () => {
    const invalidProcedures = ["invalidProcedure", "fakeMethod", "xyz"];

    invalidProcedures.forEach((procedure) => {
      expect(isValidProcedure(procedure)).toBe(false);
    });
  });

  it("should return all available procedures", () => {
    const procedures = getAllProcedures();
    expect(procedures).toBeDefined();
    expect(Array.isArray(procedures)).toBe(true);
    expect(procedures.length).toBeGreaterThan(10);

    expect(procedures).toContain("searchStudents");
    expect(procedures).toContain("listClasses");
    expect(procedures).toContain("getKioskToday");
    expect(procedures).toContain("getRevenueSummary");
  });
});

describe("Kai NLP Router - Edge Cases", () => {
  it("should handle extra whitespace", () => {
    const queries = [
      "Find   student   John",
      "Find student John",
      "  Find student John  ",
    ];

    const results = queries.map((q) => classifyIntent(q));
    const procedures = results.map((r) => r?.procedure);

    expect(procedures[0]).toBe(procedures[1]);
    expect(procedures[1]).toBe(procedures[2]);
  });

  it("should handle special characters", () => {
    const query = "Find student: John Smith!";
    const result = classifyIntent(query);
    expect(result).toBeDefined();
    expect(result?.procedure).toBeDefined();
  });

  it("should handle very long queries", () => {
    const longQuery =
      "I would like to find a student named John Smith who is currently enrolled in our karate program";
    const result = classifyIntent(longQuery);
    expect(result).toBeDefined();
    expect(result?.procedure).toBeDefined();
  });

  it("should handle queries with numbers", () => {
    const queries = [
      "Show class 5 roster",
      "Get student 123 details",
      "Show revenue for 2026",
    ];

    queries.forEach((query) => {
      const result = classifyIntent(query);
      expect(result).toBeDefined();
      expect(result?.procedure).toBeDefined();
    });
  });
});

describe("Kai NLP Router - Procedure Suggestions", () => {
  it("should suggest procedures based on partial query", () => {
    const suggestions = suggestProcedures("show classes", 5);
    expect(suggestions).toBeDefined();
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  it("should return suggestions for empty query", () => {
    const suggestions = suggestProcedures("", 5);
    expect(suggestions).toBeDefined();
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  it("should respect limit parameter", () => {
    const limits = [1, 3, 5, 10];
    limits.forEach((limit) => {
      const suggestions = suggestProcedures("show classes", limit);
      expect(suggestions.length).toBeLessThanOrEqual(limit);
    });
  });
});
