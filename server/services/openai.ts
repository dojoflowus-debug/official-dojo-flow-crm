import { invokeLLM } from '../_core/llm';
import { getSalesKnowledgeSection } from '../kaiSalesKnowledge';

// Define CRM function tools for the LLM
const crmTools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_dashboard_stats',
      description: 'Get comprehensive dashboard statistics including student counts, lead counts, attendance, and at-risk students. Use this for questions like "how many students do I have?" or "how many leads?"',
      parameters: {
        type: 'object',
        properties: {
          locationId: {
            type: 'number',
            description: 'Optional location ID to filter stats by specific location',
          },
          includeInactive: {
            type: 'boolean',
            description: 'Whether to include inactive students in total count (default: false, returns only active)',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_student_count',
      description: 'Get the total number of students in the dojo (legacy, prefer get_dashboard_stats)',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'all'],
            description: 'Filter by student status',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'find_student',
      description: 'Get detailed student information with a visual card showing photo, rank, attendance, and status. Use this when the user asks to "show", "find", or "look up" a specific student. This is the PRIMARY tool for student lookups.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Student name, email, or phone to search for',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_revenue',
      description: 'Get LIVE revenue information from FluidPay payment gateway. Use this for ANY question about money collected, payments, revenue, transactions, or how much was charged. This returns real-time data from FluidPay. Always use this for questions like "how much was collected this month?", "what is the total revenue?", "how many payments came in?"',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month', 'year'],
            description: 'Time period for revenue calculation',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_leads',
      description: 'Get information about leads (prospective students)',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['new', 'contacted', 'converted', 'all'],
            description: 'Filter by lead status',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_students',
      description: 'Search for MULTIPLE students and return a simple list of IDs and names. Only use this for bulk operations or when explicitly asked for a "list" of students. For single student lookups, use find_student instead.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (name, email, or phone)',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_student',
      description: 'Get full details for a specific student by ID',
      parameters: {
        type: 'object',
        properties: {
          studentId: {
            type: 'number',
            description: 'Student ID',
          },
        },
        required: ['studentId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_at_risk_students',
      description: 'Find students who are inactive or on hold. Returns a list of at-risk students.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_late_payments',
      description: 'Find students with overdue payments. Returns a list of students with late payments.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_classes',
      description: "Get today's class schedule for the dojo. Use this for questions like 'what classes are today?', 'show me the schedule', 'what's on today?', or 'do we have any classes?'. Returns the list of classes with times, instructors, and enrollment.",
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: "Day of week to query (e.g. 'Monday', 'Tuesday'). Defaults to today if omitted.",
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_leads',
      description: 'Search for leads by name, email, or phone number. Returns a list of matching leads with their IDs.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (name, email, or phone)',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_lead',
      description: 'Get full details for a specific lead by ID',
      parameters: {
        type: 'object',
        properties: {
          leadId: {
            type: 'number',
            description: 'Lead ID',
          },
        },
        required: ['leadId'],
      },
    },
  },
  // ── Action tools (write/delete operations) ──────────────────────────────
  {
    type: 'function' as const,
    function: {
      name: 'remove_student',
      description: 'Archive or remove a student from the active roster. ADMIN ONLY. Use when user explicitly asks to remove, delete, or archive a student.',
      parameters: {
        type: 'object',
        properties: {
          studentId: { type: 'number', description: 'The ID of the student to remove' },
          studentName: { type: 'string', description: 'The name of the student (for confirmation)' },
          reason: { type: 'string', description: 'Reason for removal (optional)' },
        },
        required: ['studentId', 'studentName'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_lead',
      description: 'Add a new lead/prospect to the CRM. Use when the user wants to create a new lead.',
      parameters: {
        type: 'object',
        properties: {
          firstName: { type: 'string', description: "Lead's first name" },
          lastName: { type: 'string', description: "Lead's last name" },
          email: { type: 'string', description: "Lead's email address" },
          phone: { type: 'string', description: "Lead's phone number" },
          source: { type: 'string', description: 'Where the lead came from (e.g., Website, Referral, Walk-in)' },
          interestedProgram: { type: 'string', description: 'Program they are interested in' },
          notes: { type: 'string', description: 'Any notes about the lead' },
        },
        required: ['firstName'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_lead_status',
      description: "Update a lead's pipeline status. Use when user wants to move a lead to a different stage.",
      parameters: {
        type: 'object',
        properties: {
          leadId: { type: 'number', description: 'The ID of the lead' },
          leadName: { type: 'string', description: 'The name of the lead (for confirmation)' },
          status: {
            type: 'string',
            enum: ['New Lead', 'Attempting Contact', 'Contact Made', 'Intro Scheduled', 'Offer Presented', 'Enrolled', 'Nurture', 'Lost/Winback'],
            description: 'The new pipeline stage for the lead',
          },
        },
        required: ['leadId', 'leadName', 'status'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'mark_attendance',
      description: 'Mark a student as present, absent, or late for a class session.',
      parameters: {
        type: 'object',
        properties: {
          studentId: { type: 'number', description: "The student's ID" },
          studentName: { type: 'string', description: "The student's name" },
          classId: { type: 'number', description: 'The class ID (optional)' },
          status: { type: 'string', enum: ['present', 'absent', 'late'], description: 'Attendance status' },
          date: { type: 'string', description: 'Date of attendance (YYYY-MM-DD, defaults to today)' },
        },
        required: ['studentId', 'studentName', 'status'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'invite_staff',
      description: 'Invite a new staff member to the dojo. Creates their account and sends a welcome email with login credentials. Use when user asks to add, invite, or onboard a staff member, instructor, or team member.',
      parameters: {
        type: 'object',
        properties: {
          firstName: { type: 'string', description: "Staff member's first name" },
          lastName: { type: 'string', description: "Staff member's last name (optional)" },
          email: { type: 'string', description: "Staff member's email address" },
          role: {
            type: 'string',
            enum: ['instructor', 'front_desk', 'manager', 'admin', 'coach', 'trainer', 'assistant'],
            description: 'Role/position of the staff member (default: instructor)',
          },
        },
        required: ['firstName', 'email'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_staff',
      description: 'List all staff members for this organization. Use when user asks to see, show, or list staff, instructors, or team members.',
      parameters: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            description: 'Optional role filter (e.g., instructor, manager)',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'extract_class_schedule',
      description: 'MUST be called when you detect a class schedule in an image. Extracts all classes from the schedule image and returns structured data for import. Call this tool with every class you can see — do not embed schedule data in your text response.',
      parameters: {
        type: 'object',
        properties: {
          classes: {
            type: 'array',
            description: 'Array of all classes extracted from the schedule',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Class name/program (e.g. Dragon Kids, Little Ninjas)' },
                dayOfWeek: { type: 'string', description: 'Full day name: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday' },
                startTime: { type: 'string', description: 'Start time in 24-hour HH:MM format (e.g. 17:00)' },
                endTime: { type: 'string', description: 'End time in 24-hour HH:MM format (e.g. 18:00)' },
                instructor: { type: 'string', description: 'Instructor name, or empty string if not specified' },
                location: { type: 'string', description: 'Location/facility name, or empty string if not specified' },
              },
              required: ['name', 'dayOfWeek', 'startTime', 'endTime'],
            },
          },
          summary: {
            type: 'string',
            description: 'Brief human-readable summary of what was found (e.g. "Found 42 classes across 7 days")',
          },
        },
        required: ['classes', 'summary'],
      },
    },
  },
  // ── SMS Tools ─────────────────────────────────────────────────────────────
  {
    type: 'function' as const,
    function: {
      name: 'send_sms',
      description: 'Send an SMS text message to a specific student or lead. Use this when the user asks to text, message, or SMS a specific person. Always look up the student/lead first with find_student if you only have a name and no ID.',
      parameters: {
        type: 'object',
        properties: {
          studentId: { type: 'number', description: 'The student ID to send the SMS to (preferred over raw phone)' },
          phone: { type: 'string', description: 'Phone number to send to (fallback if no studentId)' },
          recipientName: { type: 'string', description: 'Name of the recipient (for confirmation display)' },
          message: { type: 'string', description: 'The text message content to send' },
        },
        required: ['message', 'recipientName'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'send_bulk_sms',
      description: 'Send an SMS text message to a group of students matching a filter. Use for bulk messaging like "text all students with billing issues", "text all inactive students", or "send a message to everyone about the class cancellation".',
      parameters: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            enum: ['all_active', 'billing_issues', 'inactive', 'at_risk', 'all'],
            description: 'Which group of students to message: all_active (active students), billing_issues (past_due billing), inactive, at_risk, or all (everyone)',
          },
          message: { type: 'string', description: 'The text message content to send to all matching students' },
          preview: { type: 'boolean', description: 'If true, return a preview of who would receive the message without actually sending. Use this when the user wants to see who will be contacted before confirming. Default: false.' },
        },
        required: ['filter', 'message'],
      },
    },
  },
];

export interface KaiConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function chatWithKai(
  userMessage: string,
  conversationHistory: KaiConversationMessage[] = [],
  avatarName: string = 'Kai',
  imageUrl?: string,
  contextBlock?: string,
  intentHint?: string
): Promise<{
  response: string;
  functionCalls?: Array<{ name: string; arguments: any }>;
  ui_blocks?: Array<{
    type: 'student_card' | 'student_list' | 'lead_card' | 'lead_list';
    studentId?: number;
    studentIds?: number[];
    leadId?: number;
    leadIds?: number[];
    label: string;
  }>;
}> {
  try {
    // Build the system prompt
    const systemPrompt = `You are ${avatarName}, an elite dojo operations AI built into DojoFlow. You are not a general chatbot — you are a tightly controlled, context-aware operations system for martial arts school management.

## CORE IDENTITY
You operate like a seasoned dojo ops lead: direct, grounded in data, instructor-like in tone. You are proactive, concise, and action-capable. You never freestyle or hallucinate. You never invent pricing, schedules, student info, or lead info. Every answer you give is grounded in system data or explicit user input.

## BOUNDED REASONING ENGINE
Before every response, internally determine:
1. **User intent** — what is the user actually trying to accomplish?
2. **Relevant entity** — which lead, student, class, or program is this about?
3. **Available data** — what does the system already know? (check LIVE SYSTEM CONTEXT below)
4. **Missing data** — what is genuinely unknown that I need to ask?
5. **Best next action** — answer, act, confirm, or ask ONE clarifying question?
6. **Confidence level** — high (act), medium (confirm), low (ask)

Rule: If the system context already has the answer, give it. Do NOT ask for information already in the context block.

## CONFIDENCE THRESHOLDS
- **High confidence (≥80%):** Execute immediately, report result
- **Medium confidence (50–79%):** State what you found, ask for confirmation before acting
- **Low confidence (<50%):** Ask exactly ONE clarifying question — never multiple questions at once

## INTENT ROUTING
When you detect these intents, act immediately using the corresponding tool:
- "how many students" / "student count" → get_dashboard_stats
- "how many leads" / "lead count" → get_dashboard_stats
- "find [name]" / "show [name]" / "look up [name]" → find_student or search_leads
- "what classes today" / "today's schedule" → get_classes
- "at-risk students" / "inactive students" → list_at_risk_students
- "billing issues" / "late payments" / "past due" → list_late_payments
- "revenue" / "how much collected" → get_revenue
- "list staff" / "show instructors" → list_staff
- "text [person]" / "SMS [person]" → send_sms (look up first if needed)
- "text all [group]" / "blast everyone" → send_bulk_sms with preview:true first
- "add lead" / "new lead" → add_lead
- "move [name] to [stage]" → update_lead_status
- "mark [name] as present/absent" → mark_attendance
- "invite [name] as [role]" → invite_staff
- "remove/archive [student]" → remove_student (ADMIN ONLY)

## PROACTIVE RESPONSE PATTERN
When you have all the data needed, respond like this:
"I found [entity] in [location]. [Key fact]. I can [available action] now."
Example: "I found Vincent in Leads. He's interested in Adult Karate. I can text him the pricing and enrollment link now — want me to?"

Never ask for information the system already has. Never ask multiple questions at once.

## TOOL USAGE RULES
- Always prefer system context data over calling a tool for basic facts (stats, programs, schedule)
- Use tools for lookups (find_student, search_leads) and actions (send_sms, add_lead, etc.)
- For destructive actions (remove_student), always confirm before executing
- For bulk SMS, always call with preview:true first, then confirm before sending
- After tool results, format response as natural conversational text (2-4 sentences)
- The UI auto-renders interactive cards for students/leads — just respond naturally

## DATA TOOLS
- get_dashboard_stats — student/lead counts, at-risk, attendance
- find_student — look up a specific student (PRIMARY for single lookups)
- search_students — bulk student search
- get_student — full details by ID
- search_leads — find leads by name/email/phone
- get_lead — full details by ID
- get_classes — today's or any day's schedule
- get_revenue — revenue from payment gateway (real-time)
- list_at_risk_students — inactive/on-hold students
- list_late_payments — past-due billing
- list_staff — all team members

## ACTION TOOLS
- add_lead — create new lead
- update_lead_status — move lead to pipeline stage
- mark_attendance — record student attendance
- invite_staff — add team member (sends welcome email)
- remove_student — archive student (ADMIN ONLY)
- send_sms — text a specific student or lead
- send_bulk_sms — text a group (preview first)

## PERMISSION RULES
- remove_student: admin-only, always confirm first
- send_bulk_sms: always preview first, then confirm
- All other actions: execute at high confidence, confirm at medium
- Permission errors: relay exact error to user

## WORKFLOW STATE INTELLIGENCE
For multi-step workflows, track what's done and what's next. Never repeat a completed step. Never ask for info already provided in this conversation. Continue workflows from where they left off.

Key workflows:
- **Lead follow-up:** find lead → check status → send pricing/schedule → update status → schedule intro
- **Student enrollment:** find lead → confirm interest → generate enrollment link → convert to student
- **Attendance:** find student → mark present/absent/late → confirm
- **Billing reminder:** find past-due students → draft message → confirm → send bulk SMS
- **Staff onboarding:** collect name + email + role → invite_staff → confirm sent

## EMPTY STATE RESPONSES
If get_dashboard_stats returns activeStudents = 0:
"Your roster is empty — let's fix that. Drop your student list, class schedule, or program documents into this chat. I can read PDFs, Excel, CSVs, and photos of handwritten lists. Ready to import?"

If get_classes returns empty:
"No classes scheduled today. Drop your schedule into this chat and I'll import it automatically — Excel, CSV, PDF, or a photo works."

## WEBSITE SCAN (NEVER refuse)
You CAN scan school websites. If asked anything like "can you pull my info from my website", "use my website", "check my site", respond:
"Absolutely — share your website URL and I'll extract your name, address, phone, logo, programs, and schedule, then save it to your DojoFlow profile."
NEVER say you cannot access URLs.

## DOCUMENT IMPORT
If a user mentions uploading a file: "Got it — analyzing now. I'll extract the data and show you a preview before anything is saved."

## VOICE OUTPUT RULES
- Never read markdown symbols, asterisks, bullets, or backticks aloud
- Speak in complete conversational sentences
- Use sequencing language: "first", "next", "then"
- ONE thinking phrase per response: "Let me pull that up." / "Checking now." / "One moment."

## TONE RULES
- Concise, confident, instructor-like, operational
- Never apologize for errors — describe and fix them
- Never say "it should work now" — state what was verified
- Never use vague phrases — be specific
- 2-4 sentences typically; longer only when data warrants it
- Format numbers clearly: "$1,234" for money, "42 students"

## TECHNICAL STATUS FORMAT (for errors/actions)
**Diagnosis:** [what the problem is]
**Root cause:** [why it happened]
**Action taken:** [what was changed]
**Current status:** [what is true now]
**Next step:** [what happens next]

${getSalesKnowledgeSection()}

${contextBlock || ''}
${intentHint || ''}`;

    // Build messages array
    // If an image is attached, build a multimodal content array for vision analysis
    const userContent: any = imageUrl
      ? [
          { type: 'text', text: userMessage || `Please analyze this image and describe what you see in detail.

If it contains a class schedule, you MUST call the extract_class_schedule tool with ALL the classes you can see. Do NOT include schedule data or JSON in your text response — use the tool instead. The tool will handle displaying and importing the data.

For the extract_class_schedule tool:
- startTime and endTime must be in 24-hour HH:MM format (e.g. 17:00)
- dayOfWeek must be the full day name (Monday, Tuesday, etc.)
- Include every class visible in the image
- If instructor or location is not shown, use an empty string` },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
        ]
      : userMessage;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
      { role: 'user' as const, content: userContent },
    ];

    console.log('[Kai] Calling Manus LLM with message:', userMessage);

    // Call the Manus built-in LLM
    const response = await invokeLLM({
      messages,
      tools: crmTools,
      tool_choice: 'auto',
    });

    console.log('[Kai] LLM response:', JSON.stringify(response, null, 2));

    const assistantMessage = response.choices?.[0]?.message;

    if (!assistantMessage) {
      throw new Error('No response from LLM');
    }

    // Check if LLM wants to call functions
    const toolCalls = assistantMessage.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      const functionCalls = toolCalls.map((call: any) => ({
        name: call.function.name,
        arguments: JSON.parse(call.function.arguments),
      }));

      return {
        // NOTE: Do NOT strip SCHEDULE_JSON here — the router extracts it before stripping
        response: assistantMessage.content || '',
        functionCalls,
      };
    }

    // Return conversational response (no function calls)
    // NOTE: Do NOT strip SCHEDULE_JSON here — the router extracts it before stripping
    return {
      response: assistantMessage.content || 'I apologize, but I couldn\'t process that request.',
      ui_blocks: [],
    };
  } catch (error) {
    console.error('[Kai] LLM Error:', error);
    // Return a friendly fallback response instead of throwing
    return {
      response: `I'm here to help! You asked: "${userMessage}". Let me check the data for you.`,
      ui_blocks: [],
    };
  }
}
