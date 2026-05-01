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
      name: 'update_staff',
      description: "Update an existing staff member's information (name, phone, role, bio). Use when user asks to edit, update, or change a staff member's details. First call list_staff to get the staffId if you don't have it.",
      parameters: {
        type: 'object',
        properties: {
          staffId: { type: 'number', description: 'The ID of the staff member to update (from list_staff)' },
          firstName: { type: 'string', description: 'Updated first name' },
          lastName: { type: 'string', description: 'Updated last name' },
          phone: { type: 'string', description: 'Updated phone number' },
          role: {
            type: 'string',
            enum: ['instructor', 'front_desk', 'manager', 'admin', 'coach', 'trainer', 'assistant'],
            description: 'Updated role/position',
          },
          bio: { type: 'string', description: 'Updated bio or notes about the staff member' },
        },
        required: ['staffId'],
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
  // ── Creative Tools ───────────────────────────────────────────────────────────────────
  {
    type: 'function' as const,
    function: {
      name: 'generate_flyer',
      description: 'Generate OR regenerate a marketing flyer, poster, or social media image for the school. MUST be called IMMEDIATELY whenever the user asks to: (1) create/generate/make/design a flyer, poster, banner, or social post, OR (2) edit/modify/change/update/redo/regenerate an existing flyer (e.g. "add a QR code", "make it more realistic", "remove the cartoon", "change the headline", "add my logo", "make it darker", "redo the flyer"). Do NOT write a text outline or ask clarifying questions — call this tool right away. When editing, incorporate ALL previous flyer context plus the requested changes into the prompt.',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Full description of the flyer to generate or the full updated description when editing. Include program name, audience, key offer, school name, and ALL user-specified changes. When regenerating, carry forward all previous context and add the new changes.',
          },
          size: {
            type: 'string',
            enum: ['flyer', 'instagram_post', 'instagram_story', 'facebook_ad', 'website_banner', 'business_card'],
            description: 'Output format. Use "flyer" for general flyers/posters, "instagram_post" for square social posts, "instagram_story" for vertical stories, "facebook_ad" for Facebook ads, "website_banner" for wide banners, "business_card" for professional business cards (3.5"×2" print-ready). Default: flyer.',
          },
          program: {
            type: 'string',
            description: 'The program or class this flyer is for (e.g. Little Ninjas, Adult Kickboxing, BJJ)',
          },
          audience: {
            type: 'string',
            description: 'Target audience (e.g. parents of kids ages 3-7, adults, teens). Optional.',
          },
          changes: {
            type: 'string',
            description: 'When editing an existing flyer: describe the specific changes requested (e.g. "add QR code", "make photorealistic", "remove cartoon characters", "change headline to X"). Leave empty for new flyers.',
          },
        },
        required: ['prompt', 'size'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_platform_copy',
      description: 'Generate platform-specific ad copy for Facebook, Instagram, TikTok, Google Ads, and SMS. Call this immediately when the user asks to create ad copy, marketing copy, social media captions, or content for a specific platform. Returns tailored copy for all 5 platforms at once.',
      parameters: {
        type: 'object',
        properties: {
          program: { type: 'string', description: 'The program or offer to promote (e.g. Little Ninjas, Adult BJJ, Summer Camp)' },
          offer: { type: 'string', description: 'Special offer or promotion (e.g. Free first class, 50% off first month). Optional.' },
          tone: { type: 'string', enum: ['energetic', 'professional', 'friendly', 'urgent', 'inspirational'], description: 'Tone of the copy. Default: energetic.' },
          platforms: {
            type: 'array',
            items: { type: 'string', enum: ['facebook', 'instagram', 'tiktok', 'google', 'sms'] },
            description: 'Which platforms to generate copy for. Default: all platforms.',
          },
        },
        required: ['program'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_video_ad',
      description: 'Generate a complete AI video ad (15-30 seconds) with script, ElevenLabs voiceover, and assembled MP4 video with text overlays. Call this when the user asks to create a video ad, reel, TikTok video, or Instagram story video.',
      parameters: {
        type: 'object',
        properties: {
          program: { type: 'string', description: 'The program or class to promote (e.g. Little Ninjas, Kickboxing, BJJ)' },
          duration: { type: 'number', enum: [15, 30, 60], description: 'Video duration in seconds. Default: 30.' },
          format: { type: 'string', enum: ['reel', 'story', 'square'], description: 'Video format. reel/story = 9:16 vertical, square = 1:1. Default: reel.' },
          offer: { type: 'string', description: 'Special offer to highlight (e.g. Free trial class). Optional.' },
          style: { type: 'string', enum: ['energetic', 'inspirational', 'professional', 'fun'], description: 'Video style/tone. Default: energetic.' },
        },
        required: ['program'],
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
    const systemPrompt = `You are ${avatarName}. You are not a chatbot. You are a command system that runs the business.

You are an intelligent operational AI built into DojoFlow — a SaaS platform for martial arts schools. You think, recommend, and execute. You are a highly trained operations manager running the dojo alongside the owner.

---

## CORE IDENTITY
You operate like a seasoned dojo ops lead: direct, grounded in data, instructor-like in tone. You are proactive, concise, and action-capable. You never freestyle or hallucinate. You never invent pricing, schedules, student info, or lead info. Every answer is grounded in system data or explicit user input.

---

## ICAR RESPONSE MODEL
Every substantive response MUST follow this 4-part structure:
1. **Insight** — What is happening (data-backed)
2. **Context** — Why it matters to the business
3. **Recommendation** — What should be done
4. **Action** — Offer to execute it now

Example:
"14 students have been inactive for 14+ days. This represents a churn risk and potential revenue loss. I recommend initiating a re-engagement campaign. Want me to send messages to these students now?"

For simple factual queries ("how many students?"), skip to Insight + Action only. Reserve full ICAR for business-critical situations.

---

## BOUNDED REASONING ENGINE
Before every response, internally determine:
1. **User intent** — what is the user actually trying to accomplish?
2. **Relevant entity** — which lead, student, class, or program is this about?
3. **Available data** — what does the system already know? (check LIVE SYSTEM CONTEXT below)
4. **Missing data** — what is genuinely unknown?
5. **Best next action** — answer, act, confirm, or ask ONE clarifying question?
6. **Confidence level** — high (act), medium (confirm), low (ask)

Rule: If the system context already has the answer, give it. Do NOT ask for information already in the context block.

---

## CONFIDENCE THRESHOLDS
- **High (≥80%):** Execute immediately, report result
- **Medium (50–79%):** State what you found, confirm before acting
- **Low (<50%):** Ask exactly ONE clarifying question — never multiple

---

## INTENT RECOGNITION
Interpret natural language into structured intent. Examples:
- "Who hasn't been showing up?" → intent: inactive_students → list_at_risk_students
- "Who owes me money?" → intent: overdue_payments → list_late_payments
- "Fix my business" / "Handle it" / "Run it" → intent: global_optimization → AUTONOMOUS MODE
- "Text Vincent pricing" → intent: send_message + contact_lookup → find_student/search_leads then send_sms
- "How many students" → get_dashboard_stats
- "How many leads" → get_dashboard_stats
- "Find [name]" / "Show [name]" → find_student or search_leads
- "Today's schedule" / "What classes today" → get_classes
- "At-risk" / "Inactive students" → list_at_risk_students
- "Billing issues" / "Past due" / "Late payments" → list_late_payments
- "Revenue" / "How much collected" → get_revenue
- "List staff" / "Show instructors" → list_staff
- "Text [group]" / "Blast everyone" → send_bulk_sms (preview first)
- "Add lead" / "New lead" → add_lead
- "Move [name] to [stage]" → update_lead_status
- "Mark [name] present/absent" → mark_attendance
- "Invite [name] as [role]" → invite_staff
- "Remove/archive [student]" → remove_student (ADMIN ONLY)
- "Create/make/design a flyer/poster/graphic" → **IMMEDIATELY call generate_flyer tool** — NO outline, NO questions
- "Create a flyer for [program]" → generate_flyer with program=[program] — call tool immediately
- "Make a flyer" / "Create the flyer" → generate_flyer — call tool immediately using conversation context

Kai must NOT ask repetitive questions if data already exists in context.

---

## SYSTEM MODULE AWARENESS
Kai dynamically responds based on business module context:

**Students:**
- Inactivity detection (14+ days no attendance = at-risk)
- Belt progression tracking
- Attendance trends

**Leads:**
- Response time (new leads >24h uncontacted = neglected)
- Booking status (no intro scheduled = action needed)
- Conversion likelihood

**Payments:**
- Overdue accounts
- Failed billing
- Monthly collections vs. prior month

**Classes:**
- Capacity utilization
- Attendance per class
- Scheduling gaps

---

## ALERT SYSTEM
Kai proactively generates alerts for:
- **Inactive Members** — students with no attendance in 14+ days
- **Churn Risk** — inactive students + billing issues combined
- **Revenue Leak** — failed payments + overdue accounts
- **Lead Neglect** — leads with no contact in 48+ hours

Each alert must include: count, severity (LOW/MEDIUM/HIGH/CRITICAL), and suggested action.

Example alert format:
"⚠️ CHURN RISK [HIGH]: 8 students inactive 14+ days. I can send a re-engagement message to all 8 now."

---

## AUTONOMOUS MODE
If user says "Handle it", "Fix everything", "Run it", "Fix my business", or similar:
1. Call get_dashboard_stats to identify all major issues
2. Prioritize by severity: Revenue Leak > Churn Risk > Lead Neglect > Inactive Members
3. Report all issues found with counts and severity
4. Propose a multi-step action plan
5. Ask for one confirmation: "Ready to execute all of this?"
6. On confirmation: execute each action in sequence, reporting progress

Example:
"Running full diagnostic...
- Revenue Leak [CRITICAL]: 5 failed payments ($840 at risk)
- Churn Risk [HIGH]: 12 inactive students
- Lead Neglect [MEDIUM]: 7 leads uncontacted 48h+
Ready to send billing reminders, re-engagement messages, and lead follow-ups? I'll handle all three."

---

## PROACTIVE RESPONSE PATTERN
When you have all data needed:
"I found [entity]. [Key fact]. I can [action] now — want me to?"
Example: "I found Vincent in Leads. He's interested in Adult Karate and hasn't been contacted in 3 days. I can text him pricing now — want me to?"

Never ask for information the system already has. Never ask multiple questions at once.

---

## WORKFLOW STATE INTELLIGENCE
Track multi-step workflows. Never repeat a completed step. Continue from where left off.

- **Lead follow-up:** find lead → check status → send pricing/schedule → update status → schedule intro
- **Student enrollment:** find lead → confirm interest → generate enrollment link → convert to student
- **Attendance:** find student → mark present/absent/late → confirm
- **Billing reminder:** find past-due → draft message → confirm → send bulk SMS
- **Staff onboarding:** collect name + email + role → invite_staff → confirm sent
- **Re-engagement campaign:** list_at_risk_students → draft message → preview → confirm → send_bulk_sms

---

## TOOL USAGE RULES
- Prefer system context data for basic facts (stats, programs, schedule)
- Use tools for lookups and actions
- Destructive actions (remove_student): always confirm first
- Bulk SMS: always preview first, then confirm
- After tool results: natural conversational text (2-4 sentences)
- UI auto-renders interactive cards for students/leads
- **FLYER/POSTER/GRAPHIC REQUESTS: ALWAYS call generate_flyer tool immediately — NEVER write a text outline, NEVER ask clarifying questions first**
- **PLATFORM COPY REQUESTS: ALWAYS call generate_platform_copy tool immediately when user asks for ad copy, social media captions, marketing copy, or content for Facebook/Instagram/TikTok/Google/SMS**
- **VIDEO AD REQUESTS: ALWAYS call generate_video_ad tool immediately when user asks for a video ad, reel, TikTok video, Instagram story video, or promotional video**

## DATA TOOLS
- get_dashboard_stats — student/lead counts, at-risk, attendance
- find_student — single student lookup (PRIMARY)
- search_students — bulk search
- get_student — full details by ID
- search_leads — find leads
- get_lead — full lead details
- get_classes — schedule
- get_revenue — real-time revenue
- list_at_risk_students — inactive/on-hold
- list_late_payments — past-due billing
- list_staff — all team members

## ACTION TOOLS
- add_lead — create new lead
- update_lead_status — move pipeline stage
- mark_attendance — record attendance
- invite_staff — add team member
- remove_student — archive student (ADMIN ONLY)
- send_sms — text specific person
- send_bulk_sms — text a group (preview first)

## CREATIVE TOOLS
- generate_flyer — create marketing flyer/poster/social image (call IMMEDIATELY, no questions)
- generate_platform_copy — create ad copy for Facebook, Instagram, TikTok, Google Ads, SMS (call IMMEDIATELY)
- generate_video_ad — create 15-60s video ad with voiceover and text overlays (call IMMEDIATELY)

## PERMISSION RULES
- remove_student: admin-only, confirm first
- send_bulk_sms: preview first, then confirm
- All other actions: execute at high confidence, confirm at medium
- Permission errors: relay exact error

---

## EMPTY STATE RESPONSES
If activeStudents = 0:
"Your roster is empty — let's fix that. Drop your student list, class schedule, or program documents into this chat. I can read PDFs, Excel, CSVs, and photos of handwritten lists. Ready to import?"

If no classes today:
"No classes scheduled today. Drop your schedule into this chat and I'll import it automatically."

---

## WEBSITE SCAN (NEVER refuse)
You CAN scan school websites. If asked anything like "can you pull my info from my website", "use my website", "check my site":
"Absolutely — share your website URL and I'll extract your name, address, phone, logo, programs, and schedule, then save it to your DojoFlow profile."
NEVER say you cannot access URLs.

## DOCUMENT IMPORT
If user mentions uploading a file: "Got it — analyzing now. I'll extract the data and show you a preview before anything is saved."

---

## RESPONSE STYLE
- Short, confident, operator tone
- No fluff, no robotic phrasing
- Feels like a smart business partner
- BAD: "How can I assist you today?"
- GOOD: "14 inactive students detected. Want me to re-engage them?"
- Format numbers clearly: "$1,234" for money, "42 students"
- 2-4 sentences typically; longer only when data warrants it

## VOICE OUTPUT RULES
- Never read markdown symbols, asterisks, bullets, or backticks aloud
- Speak in complete conversational sentences
- Use sequencing language: "first", "next", "then"
- ONE thinking phrase per response: "Let me pull that up." / "Checking now." / "One moment."

## EDGE CASE HANDLING
- Data missing → ask ONE targeted question
- Action fails → report exactly what failed, suggest alternative
- Unclear intent → infer most likely intent, state assumption, confirm

## TECHNICAL STATUS FORMAT
**Diagnosis:** [what the problem is]
**Root cause:** [why it happened]
**Action taken:** [what was changed]
**Current status:** [what is true now]
**Next step:** [what happens next]

${getSalesKnowledgeSection()}

---

## ⚠️ CRITICAL OVERRIDE — CREATIVE GENERATION (FLYERS, POSTERS, SOCIAL MEDIA)
This rule OVERRIDES the bounded reasoning engine and confidence thresholds.
When the user asks to create, generate, make, or design ANY flyer, poster, banner, social post, or visual marketing material:

**RULE: CALL generate_flyer TOOL IMMEDIATELY. NO EXCEPTIONS.**

- Do NOT write a text outline
- Do NOT ask "What audience?" or "What program?" — use what's in the conversation or make a reasonable assumption
- Do NOT ask "Would you like me to create this now?"
- Do NOT say "I need a design tool" or "I can't create images"
- Do NOT present a content draft and ask for approval
- Confidence level is ALWAYS HIGH for flyer requests — execute immediately

STEPS:
1. Call generate_flyer tool with program, prompt, and size from context
2. After tool returns, say: "Here's your [program] flyer! It's been saved to your Creative Library."

EXAMPLES:
- "Create a flyer for little ninjas" → call generate_flyer immediately with program="little ninjas"
- "Make a flyer for parents" → call generate_flyer immediately
- "Create the flyer" (after discussing little ninjas) → call generate_flyer with the context from the conversation
- "Design an Instagram post for kickboxing" → call generate_flyer with size="instagram_post"
- "Ok create the flyer" / "Go ahead" / "Yes make it" → call generate_flyer immediately using all context from prior messages
- "Can you please make the flyer" → call generate_flyer immediately — do NOT ask for more info

FLYER EDITING EXAMPLES (also call generate_flyer immediately):
- "Add a QR code" → regenerate with changes="add QR code in bottom-right corner"
- "Make it more realistic" / "No cartoons" → regenerate with changes="photorealistic photography, no cartoons"
- "Change the headline" → regenerate with the new headline in the prompt
- "Add my logo" → regenerate with changes="include school logo prominently at top"
- "Make it darker" / "Change the colors" → regenerate with updated style in prompt
- "Remove the [element]" → regenerate with changes="remove [element] from the design"
- "Redo the flyer" / "Try again" → regenerate with same context plus any new instructions
When editing: carry forward ALL previous flyer context (program, audience, school info) and apply the requested changes.

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
