/**
 * Kai Intent Router
 * Maps user directives to kaiDataRouter procedures for tool-first execution
 * NO generic "I can help..." responses - execute immediately
 */

import { appRouter } from './routers';
import { TRPCError } from '@trpc/server';

export type KaiProcedure = keyof typeof appRouter._def.procedures;

export interface IntentMatch {
  procedure: string;
  confidence: number;
  parameters?: Record<string, any>;
  description: string;
}

/**
 * Intent keywords mapped to procedures
 */
const INTENT_KEYWORDS: Record<string, { procedure: string; keywords: string[] }> = {
  // Student procedures
  searchStudents: {
    procedure: 'kai.searchStudents',
    keywords: ['find student', 'search student', 'show me', 'student named', 'locate student'],
  },
  getAtRiskStudents: {
    procedure: 'kai.getAtRiskStudents',
    keywords: [
      'high-risk students',
      'at-risk students',
      'identify risk',
      'risk assessment',
      'struggling students',
      'students at risk',
      'intervention needed',
      'recommend intervention',
    ],
  },
  searchLeads: {
    procedure: 'kai.searchLeads',
    keywords: ['find lead', 'search lead', 'show lead', 'lead named', 'locate lead'],
  },
  getHotLeads: {
    procedure: 'kai.getHotLeads',
    keywords: ['hot leads', 'warm leads', 'ready to convert', 'conversion ready', 'sales ready'],
  },

  // Class procedures
  listClasses: {
    procedure: 'kai.listClasses',
    keywords: ['list classes', 'all classes', 'show classes', 'class schedule', 'available classes'],
  },
  getClassCapacity: {
    procedure: 'kai.getClassCapacity',
    keywords: [
      'class capacity',
      'how full',
      'class full',
      'enrollment',
      'class size',
      'available spots',
      'today classes',
      'classes today',
    ],
  },

  // Attendance procedures
  getAttendanceSummary: {
    procedure: 'kai.getAttendanceSummary',
    keywords: [
      'attendance summary',
      'attendance rate',
      'attendance stats',
      'attendance overview',
      'check-in rate',
    ],
  },
  getKioskToday: {
    procedure: 'kai.getKioskToday',
    keywords: [
      "today's check-in",
      'today attendance',
      "who checked in today",
      'check-ins today',
      'kiosk activity today',
    ],
  },
  getCheckins: {
    procedure: 'kai.getCheckins',
    keywords: [
      'check-in history',
      'attendance history',
      'past check-ins',
      'check-in records',
      'attendance records',
      'absent for',
      'days absent',
      'no check-in',
    ],
  },

  // Billing procedures
  getRevenueSummary: {
    procedure: 'kai.getRevenueSummary',
    keywords: ['revenue', 'income', 'earnings', 'sales', 'money made', 'total income'],
  },
  getOverdueAccounts: {
    procedure: 'kai.getOverdueAccounts',
    keywords: [
      'overdue accounts',
      'overdue payments',
      'late payments',
      'past due',
      'unpaid',
      'payment overdue',
      'billing issues',
    ],
  },
  getFailedPayments: {
    procedure: 'kai.getFailedPayments',
    keywords: ['failed payments', 'payment failures', 'declined', 'payment errors', 'payment issues'],
  },

  // Lead procedures
  getLeadPipeline: {
    procedure: 'kai.getLeadPipeline',
    keywords: [
      'lead pipeline',
      'pipeline status',
      'sales pipeline',
      'pipeline stages',
      'stuck in pipeline',
      'leads stuck',
    ],
  },
};

/**
 * Classify user message and find matching intent
 */
export function classifyUserIntent(message: string): IntentMatch | null {
  const messageLower = message.toLowerCase();

  // Try exact keyword matches first
  for (const [procedureName, { procedure, keywords }] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (messageLower.includes(keyword)) {
        return {
          procedure,
          confidence: 0.9,
          description: `Executing ${procedureName}...`,
        };
      }
    }
  }

  // Try partial matches
  for (const [procedureName, { procedure, keywords }] of Object.entries(INTENT_KEYWORDS)) {
    const matchedKeywords = keywords.filter((kw) => messageLower.includes(kw.split(' ')[0]));
    if (matchedKeywords.length > 0) {
      return {
        procedure,
        confidence: 0.6,
        description: `Executing ${procedureName}...`,
      };
    }
  }

  return null;
}

/**
 * Extract parameters from user message
 */
export function extractParameters(message: string, procedure: string): Record<string, any> {
  const params: Record<string, any> = {};

  // Extract date range if mentioned
  const dateRangeMatch = message.match(/(\d+)\s*(?:day|week|month)/i);
  if (dateRangeMatch) {
    params.days = parseInt(dateRangeMatch[1]);
  }

  // Extract student/lead name
  const nameMatch = message.match(/(?:named|called|is)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
  if (nameMatch) {
    params.name = nameMatch[1];
  }

  // Extract location if mentioned
  const locationMatch = message.match(/(?:at|location|studio)\s+([A-Za-z\s]+?)(?:\.|,|$)/i);
  if (locationMatch) {
    params.location = locationMatch[1].trim();
  }

  return params;
}

/**
 * Execute Kai procedure and return result
 */
export async function executeProcedure(
  caller: any,
  procedure: string,
  params: Record<string, any> = {}
): Promise<any> {
  try {
    // Parse procedure path (e.g., "kai.getAtRiskStudents" -> ["kai", "getAtRiskStudents"])
    const [router, method] = procedure.split('.');

    if (!router || !method) {
      throw new Error(`Invalid procedure format: ${procedure}`);
    }

    // Get the router and call the procedure
    const routerObj = (caller as any)[router];
    if (!routerObj || typeof routerObj[method] !== 'function') {
      throw new Error(`Procedure not found: ${procedure}`);
    }

    // Execute the procedure
    const result = await routerObj[method](params);
    return result;
  } catch (error) {
    console.error(`[Kai] Procedure execution failed: ${procedure}`, error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to execute ${procedure}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

/**
 * Format procedure result as response
 */
export function formatProcedureResult(result: any, procedure: string): string {
  if (!result) {
    return `No data returned from ${procedure}`;
  }

  if (typeof result === 'string') {
    return result;
  }

  if (Array.isArray(result)) {
    return `Found ${result.length} results from ${procedure}`;
  }

  if (typeof result === 'object') {
    if (result.message) {
      return result.message;
    }
    return JSON.stringify(result, null, 2);
  }

  return String(result);
}

/**
 * Check if a message is a directive (not a question)
 */
export function isDirective(message: string): boolean {
  const directivePatterns = [
    /^(?:identify|find|show|list|get|retrieve|pull|fetch|check|analyze|review|report)/i,
    /(?:recommend|suggest|propose|advise|guide)/i,
    /(?:intervention|action|task|next steps)/i,
  ];

  return directivePatterns.some((pattern) => pattern.test(message));
}

/**
 * Check if message requires tool execution
 */
export function requiresToolExecution(message: string): boolean {
  return isDirective(message) && classifyUserIntent(message) !== null;
}
