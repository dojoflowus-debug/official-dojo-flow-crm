/**
 * Kai Module Registry
 * Defines all available Kai Data Tools with capabilities and example utterances
 * Used by NLP Router for intent classification and routing
 */

export interface ModuleCapability {
  procedure: string;
  description: string;
  inputs: Record<string, string>;
  outputs: string[];
  examples: string[];
}

export interface KaiModule {
  name: string;
  category: string;
  capabilities: ModuleCapability[];
}

/**
 * Complete registry of Kai Data Tools
 * Organized by module for efficient lookup and routing
 */
export const KAI_MODULE_REGISTRY: Record<string, KaiModule> = {
  // STUDENT MODULE
  student: {
    name: "Student Module",
    category: "CRM",
    capabilities: [
      {
        procedure: "searchStudents",
        description: "Search for students by name, email, or phone",
        inputs: { query: "search term", limit: "max results" },
        outputs: ["student_card"],
        examples: [
          "Find student John Smith",
          "Search for students named Sarah",
          "Look up email john@example.com",
          "Find phone 555-1234",
          "Show me all active students",
        ],
      },
      {
        procedure: "getStudent",
        description: "Get detailed student profile",
        inputs: { studentId: "student ID" },
        outputs: ["student_card"],
        examples: [
          "Get student 123 details",
          "Show me student profile for ID 456",
          "Get full info on student 789",
        ],
      },
      {
        procedure: "listAtRiskStudents",
        description: "List students at risk of dropping out",
        inputs: { days: "days without activity" },
        outputs: ["student_card"],
        examples: [
          "Show at-risk students",
          "Who hasn't attended in 30 days",
          "List inactive students",
          "Show students at risk",
        ],
      },
    ],
  },

  // LEAD MODULE
  lead: {
    name: "Lead Module",
    category: "CRM",
    capabilities: [
      {
        procedure: "searchLeads",
        description: "Search for leads by name, email, or phone",
        inputs: { query: "search term", limit: "max results" },
        outputs: ["lead_card"],
        examples: [
          "Find lead Jane Doe",
          "Search for leads from website",
          "Look up email jane@example.com",
          "Find phone 555-5678",
          "Show me all new leads",
        ],
      },
      {
        procedure: "getLead",
        description: "Get detailed lead profile",
        inputs: { leadId: "lead ID" },
        outputs: ["lead_card"],
        examples: [
          "Get lead 123 details",
          "Show me lead profile for ID 456",
          "Get full info on lead 789",
        ],
      },
    ],
  },

  // CLASSES MODULE
  classes: {
    name: "Classes Module",
    category: "Operations",
    capabilities: [
      {
        procedure: "listClasses",
        description: "List all active classes with optional filters",
        inputs: { limit: "max results", dayOfWeek: "filter by day" },
        outputs: ["class_card"],
        examples: [
          "Show all classes",
          "List Monday classes",
          "What classes are available",
          "Show classes for Wednesday",
          "List all karate classes",
        ],
      },
      {
        procedure: "getClassCapacity",
        description: "Get class capacity and enrollment info",
        inputs: { classId: "class ID" },
        outputs: ["class_capacity"],
        examples: [
          "How many students in class 5",
          "What's the capacity for class 10",
          "Show enrollment for class 3",
          "Is class 7 full",
        ],
      },
      {
        procedure: "getClassRoster",
        description: "Get list of students enrolled in a class",
        inputs: { classId: "class ID", date: "optional date" },
        outputs: ["class_roster"],
        examples: [
          "Show roster for class 5",
          "Who's in class 10",
          "List students in class 3",
          "Show attendance for class 7 today",
        ],
      },
      {
        procedure: "getAttendanceSummary",
        description: "Get attendance statistics for a class",
        inputs: { classId: "class ID", dateRange: "date range" },
        outputs: ["attendance_summary"],
        examples: [
          "Show attendance for class 5",
          "How many attended class 10 this week",
          "Attendance report for class 3",
          "Show class 7 attendance stats",
        ],
      },
    ],
  },

  // KIOSK MODULE
  kiosk: {
    name: "Kiosk Activity Module",
    category: "Operations",
    capabilities: [
      {
        procedure: "getKioskToday",
        description: "Get today's kiosk check-ins for a location",
        inputs: { locationId: "location ID" },
        outputs: ["kiosk_checkin_list"],
        examples: [
          "Show today's check-ins",
          "Who checked in today",
          "Today's kiosk activity",
          "Show check-ins for location 1",
        ],
      },
      {
        procedure: "getCheckins",
        description: "Get check-ins for a date range",
        inputs: { startDate: "start date", endDate: "end date", locationId: "location ID" },
        outputs: ["kiosk_checkin_list"],
        examples: [
          "Show check-ins from Jan 1 to Jan 15",
          "Get check-ins for last week",
          "List check-ins for this month",
          "Show kiosk activity for date range",
        ],
      },
      {
        procedure: "getNewVisitors",
        description: "Get new visitors in a date range",
        inputs: { startDate: "start date", endDate: "end date", locationId: "location ID" },
        outputs: ["kiosk_checkin_list"],
        examples: [
          "Show new visitors this week",
          "How many new people checked in",
          "List new visitors for January",
          "Who are the new faces",
        ],
      },
      {
        procedure: "getWaiverStatus",
        description: "Get waiver compliance status for a person",
        inputs: { personId: "person ID" },
        outputs: ["waiver_status"],
        examples: [
          "Is student 123 waiver valid",
          "Check waiver status for person 456",
          "Does student 789 have a signed waiver",
          "Show waiver info for ID 101",
        ],
      },
    ],
  },

  // BILLING MODULE
  billing: {
    name: "Billing Module",
    category: "Finance",
    capabilities: [
      {
        procedure: "getRevenueSummary",
        description: "Get revenue summary for a date range",
        inputs: { startDate: "start date", endDate: "end date", locationId: "location ID" },
        outputs: ["revenue_summary"],
        examples: [
          "Show revenue for January",
          "What's our total revenue this month",
          "Revenue report for last week",
          "How much did we earn this year",
        ],
      },
      {
        procedure: "getOverdueAccounts",
        description: "Get list of overdue student accounts",
        inputs: { daysPastDue: "days past due", locationId: "location ID" },
        outputs: ["overdue_accounts_list"],
        examples: [
          "Show overdue accounts",
          "Who owes money",
          "List students 30 days past due",
          "Show accounts with unpaid tuition",
        ],
      },
      {
        procedure: "getFailedPayments",
        description: "Get failed payment attempts",
        inputs: { startDate: "start date", endDate: "end date", locationId: "location ID" },
        outputs: ["failed_payments_list"],
        examples: [
          "Show failed payments this month",
          "What payments failed",
          "List payment failures for January",
          "Show declined transactions",
        ],
      },
    ],
  },
};

/**
 * Flatten registry for quick lookup by procedure name
 */
export const PROCEDURE_LOOKUP = (() => {
  const lookup: Record<string, ModuleCapability> = {};
  Object.values(KAI_MODULE_REGISTRY).forEach((module) => {
    module.capabilities.forEach((cap) => {
      lookup[cap.procedure] = cap;
    });
  });
  return lookup;
})();

/**
 * Extract all example utterances for training NLP model
 */
export function getAllExampleUtterances(): Array<{
  utterance: string;
  procedure: string;
  module: string;
}> {
  const utterances: Array<{ utterance: string; procedure: string; module: string }> = [];

  Object.entries(KAI_MODULE_REGISTRY).forEach(([moduleKey, module]) => {
    module.capabilities.forEach((cap) => {
      cap.examples.forEach((example) => {
        utterances.push({
          utterance: example.toLowerCase(),
          procedure: cap.procedure,
          module: moduleKey,
        });
      });
    });
  });

  return utterances;
}

/**
 * Get all procedures for a module
 */
export function getModuleProcedures(moduleKey: string): string[] {
  const module = KAI_MODULE_REGISTRY[moduleKey];
  if (!module) return [];
  return module.capabilities.map((cap) => cap.procedure);
}

/**
 * Get procedure details
 */
export function getProcedureDetails(procedure: string): ModuleCapability | null {
  return PROCEDURE_LOOKUP[procedure] || null;
}
