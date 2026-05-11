/**
 * Kai Intent Router
 * Classifies incoming messages into intents with confidence scores.
 */

export type IntentCategory = 'READ' | 'WRITE' | 'DESTROY' | 'WORKFLOW' | 'CHAT';

export interface IntentMatch {
  intent: string;
  category: IntentCategory;
  confidence: number;
  entities: Record<string, string | number | null>;
  requiresConfirmation: boolean;
  suggestedTool?: string;
  suggestedArgs?: Record<string, any>;
}

interface IntentPattern {
  intent: string;
  category: IntentCategory;
  patterns: RegExp[];
  entities?: (match: RegExpMatchArray, message: string) => Record<string, string | number | null>;
  suggestedTool?: string;
  buildArgs?: (entities: Record<string, any>) => Record<string, any>;
  requiresConfirmation?: boolean;
}

const INTENT_PATTERNS: IntentPattern[] = [
  // READ intents
  {
    intent: 'query_student_count',
    category: 'READ',
    patterns: [/how many students/i, /student count/i, /total students/i, /number of students/i],
    suggestedTool: 'get_dashboard_stats',
    buildArgs: () => ({}),
  },
  {
    intent: 'query_lead_count',
    category: 'READ',
    patterns: [/how many leads/i, /lead count/i, /total leads/i, /number of leads/i],
    suggestedTool: 'get_dashboard_stats',
    buildArgs: () => ({}),
  },
  {
    intent: 'query_revenue',
    category: 'READ',
    patterns: [
      /how much.*collected/i, /revenue.*this (month|week|year|today)/i,
      /total.*revenue/i, /how much.*made/i, /money.*collected/i,
    ],
    suggestedTool: 'get_revenue',
    buildArgs: (e) => ({ period: e.period || 'month' }),
  },
  {
    intent: 'lookup_student',
    category: 'READ',
    patterns: [
      /(?:find|look up|show|pull up|get|search for)\s+(?:student\s+)?(.+?)(?:\s+for me|\s+please|$)/i,
      /(?:who is|tell me about)\s+(.+)/i,
    ],
    entities: (match) => ({ name: match[1]?.trim() || null }),
    suggestedTool: 'find_student',
    buildArgs: (e) => ({ query: e.name }),
  },
  {
    intent: 'query_schedule',
    category: 'READ',
    patterns: [
      /what classes.*today/i, /today.*classes/i, /show.*schedule/i,
      /what'?s on today/i, /class schedule/i, /today'?s schedule/i,
      /my schedule/i, /what.*schedule/i, /schedule.*today/i,
      /what.*teaching/i, /what.*classes.*teaching/i, /instructor.*schedule/i,
      /what.*class.*do.*have/i, /what.*class.*am.*teach/i,
      /what.*on.*today/i, /what.*happening.*today/i,
    ],
    suggestedTool: 'list_classes',
    buildArgs: () => ({}),
  },
  {
    intent: 'clear_schedule',
    category: 'DESTROY',
    requiresConfirmation: true,
    patterns: [
      /clear.*schedule/i, /delete.*all.*class/i, /remove.*all.*class/i,
      /wipe.*schedule/i, /reset.*schedule/i, /clear.*all.*class/i,
      /start.*over.*schedule/i,
    ],
    suggestedTool: 'clear_all_classes',
    buildArgs: () => ({}),
  },
  {
    intent: 'list_at_risk',
    category: 'READ',
    patterns: [
      /at.?risk students/i, /inactive students/i,
      /students.*haven'?t.*(?:come|been|attended)/i, /flag.*students/i,
    ],
    suggestedTool: 'list_at_risk_students',
    buildArgs: () => ({}),
  },
  {
    intent: 'list_billing_issues',
    category: 'READ',
    patterns: [/billing issues/i, /late payments/i, /overdue.*payments/i, /past.?due/i, /who.*owes/i],
    suggestedTool: 'list_late_payments',
    buildArgs: () => ({}),
  },
  {
    intent: 'list_staff',
    category: 'READ',
    patterns: [
      /(?:list|show|who are|who'?s on|get)\s+(?:my\s+)?(?:staff|instructors|team)/i,
      /staff members/i,
    ],
    suggestedTool: 'list_staff',
    buildArgs: () => ({}),
  },

  // WRITE intents
  {
    intent: 'add_lead',
    category: 'WRITE',
    patterns: [/add (?:a )?(?:new )?lead/i, /create (?:a )?(?:new )?lead/i, /new lead/i],
    suggestedTool: 'add_lead',
    buildArgs: (e) => e,
  },
  {
    intent: 'update_lead_status',
    category: 'WRITE',
    patterns: [
      /move (.+?) to (.+)/i,
      /update (.+?)'?s? status to (.+)/i,
      /change (.+?)'?s? (?:stage|status) to (.+)/i,
    ],
    entities: (match) => ({ leadName: match[1]?.trim() || null, status: match[2]?.trim() || null }),
    suggestedTool: 'update_lead_status',
    buildArgs: (e) => ({ leadName: e.leadName, status: e.status }),
  },
  {
    intent: 'mark_attendance',
    category: 'WRITE',
    patterns: [
      /mark (.+?) as (present|absent|late)/i,
      /(.+?) (?:is|was) (present|absent|late)/i,
    ],
    entities: (match) => ({ studentName: match[1]?.trim() || null, status: match[2]?.toLowerCase() || null }),
    suggestedTool: 'mark_attendance',
    buildArgs: (e) => ({ studentName: e.studentName, status: e.status }),
  },
  {
    intent: 'send_sms',
    category: 'WRITE',
    requiresConfirmation: true,
    patterns: [
      /(?:text|sms|message|send.*message.*to)\s+(.+?)(?:\s+(?:saying|that|about|to say|:)\s+(.+))?$/i,
    ],
    entities: (match) => ({ recipient: match[1]?.trim() || null, message: match[2]?.trim() || null }),
    suggestedTool: 'send_sms',
    buildArgs: (e) => ({ recipientName: e.recipient, message: e.message }),
  },
  {
    intent: 'send_bulk_sms',
    category: 'WRITE',
    requiresConfirmation: true,
    patterns: [
      /(?:text|message|blast|notify)\s+(?:all\s+)?(?:students|everyone|inactive|at.?risk|billing)/i,
    ],
    suggestedTool: 'send_bulk_sms',
    buildArgs: (e) => e,
  },
  {
    intent: 'invite_staff',
    category: 'WRITE',
    patterns: [
      /(?:add|invite|onboard)\s+(.+?)\s+as\s+(?:an?\s+)?(.+)/i,
      /(?:add|invite)\s+(?:new\s+)?(?:staff|instructor|team member)/i,
    ],
    entities: (match) => ({ name: match[1]?.trim() || null, role: match[2]?.trim() || null }),
    suggestedTool: 'invite_staff',
    buildArgs: (e) => ({
      firstName: (e.name as string)?.split(' ')[0],
      lastName: (e.name as string)?.split(' ').slice(1).join(' '),
      role: e.role,
    }),
  },

  // DESTROY intents
  {
    intent: 'remove_student',
    category: 'DESTROY',
    requiresConfirmation: true,
    patterns: [/(?:remove|delete|archive|drop)\s+(?:student\s+)?(.+)/i],
    entities: (match) => ({ studentName: match[1]?.trim() || null }),
    suggestedTool: 'remove_student',
    buildArgs: (e) => ({ studentName: e.studentName }),
  },

  // WORKFLOW intents
  {
    intent: 'enroll_student',
    category: 'WORKFLOW',
    patterns: [
      /enroll (.+)/i, /sign up (.+)/i, /register (.+)/i,
      /convert (.+?) (?:to|as) (?:a )?student/i,
    ],
    entities: (match) => ({ name: match[1]?.trim() || null }),
  },
  {
    intent: 'book_intro',
    category: 'WORKFLOW',
    patterns: [
      /book (?:an? )?(?:intro|trial|free class|first class)/i,
      /schedule (?:an? )?(?:intro|trial)/i,
    ],
  },
  {
    intent: 'website_scan',
    category: 'WORKFLOW',
    patterns: [
      /scan.*website/i,
      /pull.*(?:from|off).*(?:my )?(?:website|site)/i,
      /(?:import|get|extract).*(?:from|off).*(?:my )?(?:website|site)/i,
      /(?:my )?website.*(?:url|link|address)/i,
      /(?:use|check|analyze).*(?:my )?(?:website|site)/i,
    ],
  },
];

/**
 * Detect if a message is a confirmation reply (yes/no/confirm/cancel)
 * based on the message text alone. Used to prevent context loss on short replies.
 */
export function isConfirmationReply(message: string): boolean {
  const trimmed = message.trim().toLowerCase();
  const confirmPatterns = [
    /^yes$/i, /^yeah$/i, /^yep$/i, /^yup$/i, /^sure$/i, /^ok$/i, /^okay$/i,
    /^confirm$/i, /^confirmed$/i, /^go ahead$/i, /^do it$/i, /^send it$/i,
    /^sounds good$/i, /^that'?s? (?:fine|good|correct|right)$/i,
    /^no$/i, /^nope$/i, /^cancel$/i, /^stop$/i, /^don'?t$/i, /^never mind$/i,
    /^please do$/i, /^yes please$/i, /^go for it$/i, /^proceed$/i,
  ];
  return confirmPatterns.some(p => p.test(trimmed));
}

export function classifyIntent(message: string): IntentMatch | null {
  for (const def of INTENT_PATTERNS) {
    for (const pattern of def.patterns) {
      const match = message.match(pattern);
      if (match) {
        const entities = def.entities ? def.entities(match, message) : {};
        const coverage = match[0].length / message.length;
        const confidence = Math.min(0.95, 0.6 + coverage * 0.35);
        const requiresConfirmation =
          def.requiresConfirmation === true ||
          def.category === 'DESTROY' ||
          (def.category === 'WRITE' && confidence < 0.8);

        return {
          intent: def.intent,
          category: def.category,
          confidence,
          entities,
          requiresConfirmation,
          suggestedTool: def.suggestedTool,
          suggestedArgs: def.buildArgs ? def.buildArgs(entities) : undefined,
        };
      }
    }
  }
  return null;
}

export function buildIntentHint(match: IntentMatch | null): string {
  if (!match) return '';
  const lines = [
    `## INTENT CLASSIFICATION`,
    `- Intent: ${match.intent} (${match.category}, ${(match.confidence * 100).toFixed(0)}% confidence)`,
  ];
  if (Object.keys(match.entities).length > 0) {
    lines.push(`- Extracted entities: ${JSON.stringify(match.entities)}`);
  }
  if (match.suggestedTool) {
    lines.push(`- Suggested tool: ${match.suggestedTool}`);
    if (match.suggestedArgs) lines.push(`- Suggested args: ${JSON.stringify(match.suggestedArgs)}`);
  }
  if (match.requiresConfirmation) lines.push(`- REQUIRES CONFIRMATION before executing`);
  lines.push('');
  return lines.join('\n');
}
