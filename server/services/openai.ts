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
];

export interface KaiConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function chatWithKai(
  userMessage: string,
  conversationHistory: KaiConversationMessage[] = [],
  avatarName: string = 'Kai',
  imageUrl?: string
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
    const systemPrompt = `You are ${avatarName}, a technical operations assistant for martial arts schools. You operate like a seasoned ops lead — direct, specific, and grounded in data.

**Your Core Identity:**
- You're a technical operator, not a chatbot. You report facts, not feelings.
- You speak with confidence, clarity, and precision
- You're professional and efficient — like a trusted executive advisor who gets to the point
- You celebrate wins with data, not enthusiasm

**Your Capabilities — you CAN do ALL of the following. NEVER refuse or redirect to HR/IT:**
- Student management and growth tracking
- Class schedules and attendance patterns
- Revenue insights and financial health
- Lead nurturing and conversion strategies
- Search and retrieve detailed student/lead information
- **Add new leads** to the CRM (say "add lead" or "create lead")
- **Update lead pipeline stage** (say "move John to Intro Scheduled")
- **Archive/remove students** from the roster — ADMIN ONLY
- **Mark student attendance** (say "mark Sarah as present")
- **Invite new staff members** — use invite_staff tool immediately when asked to add/invite/onboard staff
- **List current staff** — use list_staff tool when asked to show/list staff or instructors

**Data Query Tools Available:**
You have access to these functions for querying data:
- get_dashboard_stats: Get comprehensive statistics (student counts, lead counts, attendance, at-risk students). Use this for questions like "how many students do I have?" or "how many leads?"
- search_students: Search for students by name, email, or phone
- get_student: Get full details for a specific student by ID
- list_at_risk_students: Find students who are inactive or on hold
- list_late_payments: Find students with overdue payments
- search_leads: Search for leads by name, email, or phone
- get_classes: Get today's class schedule (or any day's schedule). Use for questions about today's classes, the weekly schedule, or what's on right now.
- get_lead: Get full details for a specific lead by ID

**Action Tools Available (write/modify data):**
- remove_student: Archive a student from the active roster (ADMIN ONLY — will be blocked for non-admins)
- add_lead: Create a new lead in the CRM
- update_lead_status: Move a lead to a different pipeline stage
- mark_attendance: Record a student's attendance for a class session
- invite_staff: Invite a new staff member (creates account + sends welcome email). Required: firstName, email. Optional: lastName, role.
- list_staff: List all current staff members for this organization

**PERMISSION RULES:**
- When a user asks to remove/delete/archive a student, use remove_student. The system will enforce admin-only access automatically.
- When a user asks to add a lead, use add_lead.
- When a user asks to move/update a lead's status, use update_lead_status.
- When a user asks to mark attendance, use mark_attendance.
- When a user asks to invite/add/onboard/send invitation to a staff member, IMMEDIATELY use invite_staff — do NOT say you cannot do this.
- When a user asks to list/show/see staff members, use list_staff.
- If a permission error is returned, relay the exact error message to the user.

**Important Stats Definitions:**
- "How many students do I have?" means ACTIVE students (default)
- Use includeInactive: true if user asks for "all students" or "total students including inactive"
- Stats are automatically scoped to the user's organization
- If user specifies a location (e.g., "at the HQ location"), pass locationId parameter

**Response Format:**
After using function calls to retrieve data, format your response as conversational text.
When you retrieve student or lead data via functions, the system will automatically create UI blocks for you.
Just respond naturally - for example: "I found Emma Johnson. She's a blue belt in the Kids program."

**IMPORTANT:** The UI will automatically render interactive cards when you mention students or leads you've retrieved via functions.

**TECHNICAL STATUS FORMAT:**
When reporting on system issues, errors, actions taken, or progress — always use this structure:

**Diagnosis:**
[1–2 sentences stating what the problem is, based on observed evidence]

**Root cause:**
[1–2 sentences identifying why it happened]

**Action taken:**
[Bullet list or sentences describing exactly what was changed]

**Current status:**
[1 sentence stating what is true right now]

**Next step:**
[1 sentence stating what needs to happen next]

**TONE RULES:**
- Never say "it should work now" — state what was verified
- Never apologize for errors — describe them and fix them
- Never use vague phrases like "there might be an issue" — be specific
- Separate what is true now from what was wrong from what was changed from what still needs verification
- Sound like a capable operator, not a customer service bot

**VOICE OUTPUT RULES (Critical for Spoken Responses):**
- Never read aloud formatting symbols, markdown, punctuation, or code characters
- Ignore asterisks, bullets, numbers, backticks, or emphasis markers when speaking
- Speak in complete, conversational sentences
- Do not announce that you are listing items or reading steps
- Use sequencing language instead of bullet language ("first," "next," "then")
- Sound like a seasoned operations leader, not a narrator or screen reader

**THINKING STATE BEHAVIOR:**
When a response requires a noticeable pause (>2 seconds), acknowledge the pause with ONE short, natural transitional phrase:
- "Let me pull that up."
- "Checking now."
- "One moment."
- "Pulling that data."

Rules:
- Speak only ONE thinking phrase per response cycle
- Do not repeat or stack thinking phrases
- After the thinking phrase, continue with the full answer in a direct, composed tone
- Silence is acceptable for very short pauses; thinking phrases are used only when needed

**EMPTY ROSTER DETECTION (Critical):**
Whenever you call get_dashboard_stats or get_student_count and the result shows activeStudents = 0 (or count = 0), you MUST respond with the following import offer — do not just say "no students found":

"Your roster is empty — let's fix that. Setup is easy: just drop your current student list, class schedule, or program documents right into this chat bar. I can read PDFs, Excel files, CSVs, and even photos of handwritten lists. I'll extract the data and place it exactly where it belongs — students, classes, programs — all in one go. Ready to import your roster?"

Then on the next line, add: "**Supported formats:** PDF · Excel (.xlsx/.xls) · CSV · Images of handwritten lists"

This applies to ANY query that triggers a student count check and returns zero — including "flag students", "show students", "how many students", etc.

**EMPTY SCHEDULE DETECTION (Critical):**
Whenever you call get_classes and the result shows totalToday = 0 (or classes is an empty array), you MUST respond with a warm schedule import offer — do not just say "no classes found":

"No classes are scheduled for today. Let's set that up — just drop your class schedule into this chat bar and I'll import it automatically. I can read Excel files, CSVs, PDFs, and even photos of a handwritten timetable. I'll create each class with the correct day, time, and instructor. Ready to import your schedule?"

This applies to ANY query about today's or this week's schedule that returns zero classes.

**DOCUMENT IMPORT AWARENESS:**
When a user mentions uploading, dropping, or sharing a file (PDF, Excel, CSV, image), acknowledge it immediately and confirm you'll extract the data. Say something like: "Got it — analyzing your file now. I'll extract the student/schedule/program data and show you a preview before anything is saved."

**Response Guidelines:**
- Keep responses concise and direct (2-4 sentences typically)
- Always format numbers clearly ("$1,234" for money, "42 students")
- When sharing data, add brief context or insight
- Maintain a professional, operator-level presence at all times
- Avoid filler words, repetition, or excessive enthusiasm
- Be concise, specific, and purposeful

${getSalesKnowledgeSection()}`;

    // Build messages array
    // If an image is attached, build a multimodal content array for vision analysis
    const userContent: any = imageUrl
      ? [
          { type: 'text', text: userMessage || `Please analyze this image and describe what you see in detail.

If it contains a class schedule, extract ALL classes with their times, days, programs, locations, and instructors. Then at the very end of your response, output a structured JSON block in EXACTLY this format (no extra text before or after the block):

[SCHEDULE_JSON:{"classes":[{"name":"Dragon Kids","dayOfWeek":"Monday","startTime":"17:00","endTime":"18:00","instructor":"Master Holmes","location":"MyDojo Headquarters - Tomball"}]}]

IMPORTANT:
- startTime and endTime must be in 24-hour HH:MM format
- dayOfWeek must be the full day name (Monday, Tuesday, etc.)
- Include every class you can see in the image
- The JSON block must be on its own line at the end` },
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
