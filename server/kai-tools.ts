/**
 * Kai Tool Definitions
 * Defines the tools/functions that Kai can call to fetch real data
 */

export const kaiTools = [
  {
    type: "function",
    function: {
      name: "search_students",
      description: "Search for students by name or email. Use this when user asks about specific students.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Student name or email to search for"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_student_count",
      description: "Get the total count of active students. Use this when user asks 'How many students do I have?'",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_at_risk_students",
      description: "Get list of at-risk students (those with low attendance or payment issues). Also use this when user asks about absent, inactive, or missing students.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_absent_students",
      description: "Get students who have been absent or have not attended class recently. Use this when user asks 'Any absent students?', 'Who hasn\'t shown up?', 'Who missed class?', or similar attendance questions.",
      parameters: {
        type: "object",
        properties: {
          days: {
            type: "number",
            description: "Number of days to look back for absences (default: 14)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_leads",
      description: "Search for leads by name or email. Use this when user asks about specific leads.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Lead name or email to search for"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_new_leads",
      description: "Get recent new leads. Use this when user asks about new leads or recent inquiries.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of leads to return (default 10)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_classes",
      description: "Get all classes with enrollment and capacity info. Use this when user asks about their schedule, what classes they teach, what's on today, instructor schedule, or any question about classes.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "clear_all_classes",
      description: "Delete ALL classes from the schedule. Use ONLY when user explicitly asks to clear, wipe, or reset their entire schedule. Requires confirmation.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_class_roster",
      description: "Get students enrolled in a specific class",
      parameters: {
        type: "object",
        properties: {
          classId: {
            type: "number",
            description: "The ID of the class"
          }
        },
        required: ["classId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_attendance_summary",
      description: "Get attendance statistics for a specific student or class",
      parameters: {
        type: "object",
        properties: {
          studentId: {
            type: "number",
            description: "Student ID (optional)"
          },
          classId: {
            type: "number",
            description: "Class ID (optional)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_revenue_summary",
      description: "Get revenue statistics from the internal tuition/billing records. Use this when the user asks about revenue, money collected, payments, or financial summary. Automatically uses the current month if no date range is specified.",
      parameters: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "Start date in YYYY-MM-DD format. Defaults to first day of current month." },
          endDate: { type: "string", description: "End date in YYYY-MM-DD format. Defaults to last day of current month." }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_user_name",
      description: "Update the user's display name. Use this immediately when the user says they want to be called something (e.g., 'call me Master Holmes', 'my name is...', 'I'd like to be called...'). This changes their name in the system right away.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The new display name for the user (e.g., 'Master Holmes', 'Sensei Rodriguez')"
          }
        },
        required: ["name"]
      }
    }
  },
  // ── Action tools (write/delete operations) ──────────────────────────────
  {
    type: "function",
    function: {
      name: "remove_student",
      description: "Archive or remove a student from the system. ADMIN ONLY. Use this when the user explicitly asks to remove, delete, or archive a student. Always confirm the student's name before proceeding.",
      parameters: {
        type: "object",
        properties: {
          studentId: {
            type: "number",
            description: "The ID of the student to remove"
          },
          studentName: {
            type: "string",
            description: "The name of the student (for confirmation)"
          },
          reason: {
            type: "string",
            description: "Reason for removal (optional)"
          }
        },
        required: ["studentId", "studentName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_lead",
      description: "Add a new lead to the CRM. Use this when the user wants to create or add a new lead/prospect.",
      parameters: {
        type: "object",
        properties: {
          firstName: { type: "string", description: "Lead's first name" },
          lastName: { type: "string", description: "Lead's last name" },
          email: { type: "string", description: "Lead's email address" },
          phone: { type: "string", description: "Lead's phone number" },
          source: { type: "string", description: "Where the lead came from (e.g., Website, Referral, Walk-in)" },
          interestedProgram: { type: "string", description: "Program they are interested in" },
          notes: { type: "string", description: "Any notes about the lead" }
        },
        required: ["firstName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_lead_status",
      description: "Update a lead's pipeline status or stage. Use this when the user wants to move a lead to a different stage (e.g., 'mark John as Intro Scheduled', 'move Sarah to Enrolled').",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "number", description: "The ID of the lead" },
          leadName: { type: "string", description: "The name of the lead (for confirmation)" },
          status: {
            type: "string",
            enum: ["New Lead", "Attempting Contact", "Contact Made", "Intro Scheduled", "Offer Presented", "Enrolled", "Nurture", "Lost/Winback"],
            description: "The new status/pipeline stage for the lead"
          }
        },
        required: ["leadId", "leadName", "status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "mark_attendance",
      description: "Mark a student as present or absent for a class session. Use this when the user wants to record attendance.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "number", description: "The student's ID" },
          studentName: { type: "string", description: "The student's name" },
          classId: { type: "number", description: "The class ID" },
          status: {
            type: "string",
            enum: ["present", "absent", "late"],
            description: "Attendance status"
          },
          date: { type: "string", description: "Date of attendance (YYYY-MM-DD, defaults to today)" }
        },
        required: ["studentId", "studentName", "status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_sms_blast",
      description: "Send an SMS blast (bulk SMS campaign) to leads or students. Use this when the user wants to send a promotional message, reminder, or announcement via text message to multiple contacts. Supports targeting 'leads', 'students', or 'all'. Automatically personalizes [Name] placeholder in the message.",
      parameters: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "The SMS message to send. Use [Name] as a placeholder for personalization (e.g., 'Hi [Name]! Special offer...'). Keep under 160 characters for best delivery."
          },
          target: {
            type: "string",
            enum: ["leads", "students", "all"],
            description: "Who to send the blast to: 'leads' (all leads with phone numbers), 'students' (all active students with phone numbers), or 'all' (both leads and students)"
          },
          filter: {
            type: "string",
            description: "Optional filter to narrow the audience. Examples: 'new leads', 'at-risk students', 'inactive students', 'billing issues'. Leave empty to target all in the group."
          },
          delay_ms: {
            type: "number",
            description: "Delay in milliseconds between each SMS send to avoid rate limiting. Default is 1200ms (1.2 seconds). Increase to 2000ms if experiencing rate limit errors."
          }
        },
        required: ["message", "target"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "connect_fluidpay",
      description: "Connect a FluidPay payment gateway account to this dojo. Use this when the user provides a FluidPay API key or asks to connect their FluidPay account. Validates and stores the key securely.",
      parameters: {
        type: "object",
        properties: {
          api_key: {
            type: "string",
            description: "The FluidPay API key provided by the user (e.g., 'pub_38LwnXemi...')"
          }
        },
        required: ["api_key"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_fluidpay_revenue",
      description: "Get monthly revenue totals from FluidPay for this dojo. Use when the user asks about revenue, money collected, payments, or how much was earned this month. Returns total, settled, and pending amounts.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "number", description: "Month number (1-12). Defaults to current month." },
          year: { type: "number", description: "Year (e.g., 2026). Defaults to current year." }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_fluidpay_transactions",
      description: "Get recent payment transactions from FluidPay. Use when the user asks to see recent payments, transactions, or payment history.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of transactions to return (default 10, max 50)" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "invite_staff",
      description: "Add a new staff member to the dojo and send them an invitation email with login credentials. Use this when the user asks to invite, add, or onboard a new staff member, instructor, coach, or employee. Collects their name, email, and role, creates their account, and emails them login instructions.",
      parameters: {
        type: "object",
        properties: {
          firstName: { type: "string", description: "Staff member's first name" },
          lastName: { type: "string", description: "Staff member's last name (optional)" },
          email: { type: "string", description: "Staff member's email address — required to send the invitation" },
          role: {
            type: "string",
            enum: ["instructor", "coach", "trainer", "assistant", "manager", "front_desk", "owner"],
            description: "Staff role. Default: instructor"
          },
          phone: { type: "string", description: "Staff member's phone number (optional)" },
          sendEmail: { type: "boolean", description: "Whether to send an invitation email. Default: true" }
        },
        required: ["firstName", "email"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_staff",
      description: "List all staff members for this dojo. Use when the user asks who is on staff, how many instructors they have, or wants to see their team.",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string", description: "Filter by role (optional). E.g. 'instructor', 'manager'" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_tuition_plans",
      description: "List all available tuition plans for this dojo. Use when the user asks about tuition plans, billing plans, or what payment options are available.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "create_tuition_plan",
      description: "Create a new tuition plan for the dojo. Use when the user wants to set up a new billing plan, tuition amount, or payment tier.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Plan name (e.g., 'Monthly Karate', 'Kids Program')" },
          amountDollars: { type: "number", description: "Monthly/recurring amount in dollars (e.g., 99 for $99)" },
          frequency: { type: "string", enum: ["monthly", "weekly", "biweekly", "quarterly", "annual", "one_time"], description: "Billing frequency. Default: monthly" },
          description: { type: "string", description: "Optional description of what's included" }
        },
        required: ["name", "amountDollars"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "enroll_student_in_plan",
      description: "Enroll a student in a tuition plan. Use when the user asks to enroll, sign up, or assign a billing plan to a student. This links the student to a recurring tuition plan.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "number", description: "The ID of the student to enroll" },
          studentName: { type: "string", description: "The student's name (for confirmation)" },
          planId: { type: "number", description: "The ID of the tuition plan to enroll them in" },
          planName: { type: "string", description: "The plan name (for confirmation)" }
        },
        required: ["studentId", "studentName", "planId", "planName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_student_billing_status",
      description: "Get a student's current billing enrollment status, plan details, and payment history. Use when the user asks about a specific student's billing, tuition status, or payment history.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "number", description: "The ID of the student" },
          studentName: { type: "string", description: "The student's name" }
        },
        required: ["studentId", "studentName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "charge_student_tuition",
      description: "Charge a student's tuition via FluidPay using their card on file. Use when the user asks to charge, collect payment, or run a tuition payment for a specific student. The student must have a card on file and be enrolled in a plan.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "number", description: "The ID of the student to charge" },
          studentName: { type: "string", description: "The student's name (for confirmation)" },
          amountDollars: { type: "number", description: "Optional override amount. If not provided, uses the plan amount." }
        },
        required: ["studentId", "studentName"]
      }
    }
  }
,
  // ── Kai Command Execution Engine Tools ──────────────────────────────────────
  {
    type: "function",
    function: {
      name: "send_contact_message",
      description: "Send an SMS or email to a specific contact (lead or student) with plans, pricing, enrollment link, trial offer, or a custom message. Use this when the user says things like 'text Vincent the plans and enrollment link', 'send pricing to Marcus', 'text Sarah the trial offer', 'email John the membership plans'. This tool resolves the contact, builds the message from a template, sends it via Twilio, and logs the activity.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The full natural-language command from the user, e.g. 'Text Vincent plans and pricing and send him an enrollment link'"
          },
          contact_name_override: {
            type: "string",
            description: "If the user has already confirmed which contact to use (e.g. after disambiguation), provide the exact full name here"
          },
          program_name_override: {
            type: "string",
            description: "If the user has specified a specific program (e.g. 'Dragon Kids', 'Kickboxing'), provide it here"
          },
          channel: {
            type: "string",
            enum: ["sms", "email"],
            description: "Delivery channel. Default: sms"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "resolve_contact",
      description: "Look up a contact by name in the CRM (searches both leads and students). Use this when you need to find a contact before sending a message, or when the user asks 'who is Vincent?' or 'find Marcus in the CRM'.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The contact's name to search for"
          }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_programs_pricing",
      description: "Get the list of active programs and their pricing from the CRM. Use this when the user asks 'what are our programs?', 'what do we charge?', 'show me the pricing', or when building a pricing summary to send to a contact.",
      parameters: {
        type: "object",
        properties: {
          program_name: {
            type: "string",
            description: "Optional: filter to a specific program name (e.g. 'Dragon Kids', 'Kickboxing')"
          }
        },
        required: []
      }
    }
  }
];

/**
 * SMS Blast result type for structured UI rendering
 */
export interface SmsBlastResult {
  type: "sms_blast_result";
  message: string;
  target: string;
  filter?: string;
  totalTargeted: number;
  delivered: number;
  failed: number;
  rateLimited: number;
  skippedNoPhone: number;
  recipients: Array<{
    name: string;
    phone: string;
    status: "delivered" | "failed" | "rate_limited" | "skipped";
    error?: string;
  }>;
  retryAvailable: boolean;
  retryCount: number;
}

/**
 * Tool call executor - maps tool names to actual kaiDataRouter calls
 * Includes permission enforcement via staffPermissions module
 */
export async function executeKaiTool(
  toolName: string,
  toolArgs: Record<string, any>,
  ctx: any
): Promise<string> {
  const { kaiDataRouter } = await import("./kaiDataRouter");
  const { checkKaiPermission, getUserRole } = await import("./staffPermissions");

  // ── Permission check ──────────────────────────────────────────────────────
  const userRole = await getUserRole(ctx);
  const permCheck = checkKaiPermission(userRole, toolName);
  if (!permCheck.allowed) {
    return JSON.stringify({
      success: false,
      permissionDenied: true,
      message: permCheck.reason,
    });
  }
  
  try {
    switch (toolName) {
      case "search_students": {
        const result = await (kaiDataRouter.searchStudents as any).createCaller(ctx)({
          query: toolArgs.query,
          limit: 10
        });
        const studentList = Array.isArray(result) ? result : (result?.students || []);
        const count = studentList.length;
        const idList = studentList.map((s: any) => s.id).filter(Boolean).join(',');
        return JSON.stringify({
          success: true,
          data: { students: studentList, studentIds: idList, totalCount: count },
          message: count > 0
            ? `Found ${count} student${count !== 1 ? 's' : ''} matching "${toolArgs.query}". IDs: ${idList}. Embed [STUDENT_LIST:${idList}:${count} students] in your response.`
            : `No students found matching "${toolArgs.query}".`
        });
      }
      
      case "get_student_count": {
        // Query database directly for count
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const result = await db
          .select()
          .from(students)
          .where(eq(students.organizationId, ctx.currentOrganizationId));
        
        return JSON.stringify({
          success: true,
          data: { count: result.length },
          message: `You have ${result.length} students enrolled.`
        });
      }
      
      case "get_at_risk_students": {
        const result = await (kaiDataRouter.listAtRiskStudents as any).createCaller(ctx)({
          days: 30
        });
        const studentList = result?.students || result || [];
        const count = studentList.length;
        const idList = studentList.map((s: any) => s.id).filter(Boolean).join(',');
        return JSON.stringify({
          success: true,
          data: { students: studentList, studentIds: idList, totalCount: count },
          message: count > 0
            ? `Found ${count} at-risk student${count !== 1 ? 's' : ''} (inactive or on hold). IDs: ${idList}. Embed [STUDENT_LIST:${idList}:${count} students] in your response.`
            : 'No at-risk students found at this time.'
        });
      }

      case "get_absent_students": {
        // Find active students who have NOT attended class in the last N days
        const { getDb } = await import("./db");
        const { students: studentsTable, studentAttendance } = await import("../drizzle/schema");
        const { eq, and, gte, inArray, notInArray } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const orgId = ctx.currentOrganizationId;
        const daysBack = toolArgs.days || 14;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);
        const cutoffStr = cutoffDate.toISOString().slice(0, 10);

        let absentStudents: any[] = [];
        try {
          // Get all active students
          const activeStudents = await db
            .select({
              id: studentsTable.id,
              firstName: studentsTable.firstName,
              lastName: studentsTable.lastName,
              status: studentsTable.status,
              beltRank: studentsTable.beltRank,
              phone: studentsTable.phone,
              email: studentsTable.email,
            })
            .from(studentsTable)
            .where(
              and(
                eq(studentsTable.organizationId, orgId),
                eq(studentsTable.status, 'Active')
              )
            )
            .limit(100);

          if (activeStudents.length > 0) {
            const activeIds = activeStudents.map(s => s.id);
            // Find students who DID attend in the last N days
            const attendedRows = await db
              .select({ studentId: studentAttendance.studentId })
              .from(studentAttendance)
              .where(
                and(
                  inArray(studentAttendance.studentId, activeIds),
                  gte(studentAttendance.classDate, cutoffStr)
                )
              );
            const attendedIds = new Set(attendedRows.map(a => a.studentId));
            // Students who did NOT attend = absent
            absentStudents = activeStudents.filter(s => !attendedIds.has(s.id));
          }
        } catch (err) {
          // Fallback: return at-risk students
          const fallback = await (kaiDataRouter.listAtRiskStudents as any).createCaller(ctx)({ days: daysBack });
          absentStudents = fallback?.students || fallback || [];
        }

        const absentCount = absentStudents.length;
        const absentIdList = absentStudents.map((s: any) => s.id).filter(Boolean).join(',');
        return JSON.stringify({
          success: true,
          data: { students: absentStudents, studentIds: absentIdList, totalCount: absentCount },
          message: absentCount > 0
            ? `Found ${absentCount} student${absentCount !== 1 ? 's' : ''} who have not attended class in the last ${daysBack} days. IDs: ${absentIdList}. Embed [STUDENT_LIST:${absentIdList}:${absentCount} students] in your response.`
            : `All active students have attended class in the last ${daysBack} days.`
        });
      }
      
      case "search_leads": {
        const result = await (kaiDataRouter.searchLeads as any).createCaller(ctx)({
          query: toolArgs.query,
          limit: 5
        });
        return JSON.stringify({
          success: true,
          data: result,
          message: `Found ${result?.length || 0} leads matching "${toolArgs.query}"`
        });
      }
      
      case "get_new_leads": {
        const result = await (kaiDataRouter.getNewLeads as any).createCaller(ctx)({
          limit: toolArgs.limit || 10
        });
        return JSON.stringify({
          success: true,
          data: result,
          message: `Found ${result?.length || 0} new leads`
        });
      }
      
      case "list_classes": {
        const result = await (kaiDataRouter.listClasses as any).createCaller(ctx)({
          limit: 50
        });
        const classList = result?.classes || result || [];
        const count = Array.isArray(classList) ? classList.length : 0;
        // Format classes as readable text so Kai doesn't output raw JSON/code
        const classLines = Array.isArray(classList) ? classList.map((c: any) => {
          const time = c.startTime ? `${c.startTime}${c.endTime ? '–' + c.endTime : ''}` : (c.time || 'time TBD');
          const days = c.dayOfWeek || c.schedule || 'days TBD';
          const instructor = c.instructor ? ` | Instructor: ${c.instructor}` : '';
          const enrolled = (c.enrolled ?? c.enrolledCount ?? 0);
          const capacity = c.capacity ?? 20;
          return `• ${c.name} — ${days} @ ${time}${instructor} (${enrolled}/${capacity} enrolled)`;
        }) : [];
        const message = count === 0
          ? 'No classes are currently scheduled.'
          : `Here are your ${count} class(es):\n${classLines.join('\n')}`;
        return JSON.stringify({
          success: true,
          data: { count, classes: classLines },
          message
        });
      }
      
      case "clear_all_classes": {
        // Delete all classes for this organization
        const { classes: classesTable } = await import("../../drizzle/schema");
        const { eq: eqOp } = await import("drizzle-orm");
        const db = await (await import("./db")).getDb();
        if (!db) return JSON.stringify({ success: false, message: 'Database not available' });
        const orgId = ctx.currentOrganizationId;
        if (!orgId) return JSON.stringify({ success: false, message: 'Organization context required' });
        await db.delete(classesTable).where(eqOp(classesTable.organizationId, orgId));
        return JSON.stringify({
          success: true,
          message: 'All classes have been cleared from your schedule. You can now import a new schedule or add classes manually.'
        });
      }

      case "get_class_roster": {
        const result = await (kaiDataRouter.getClassRoster as any).createCaller(ctx)({
          classId: toolArgs.classId
        });
        return JSON.stringify({
          success: true,
          data: result,
          message: `Class roster: ${result?.students?.length || 0} students`
        });
      }
      
      case "get_attendance_summary": {
        const result = await (kaiDataRouter.getAttendanceSummary as any).createCaller(ctx)({
          studentId: toolArgs.studentId,
          classId: toolArgs.classId,
          limit: 30
        });
        return JSON.stringify({
          success: true,
          data: result,
          message: `Attendance summary retrieved`
        });
      }
      
      case "get_revenue_summary": {
        // Auto-generate current month date range if not provided
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const startDate = toolArgs.startDate || firstDayOfMonth;
        const endDate = toolArgs.endDate || lastDayOfMonth;
        const result = await (kaiDataRouter.getRevenueSummary as any).createCaller(ctx)({
          startDate,
          endDate,
        });
        // Check if FluidPay data was returned
        const fpData = (result as any).fluidpayData;
        let message: string;
        if (fpData) {
          // FluidPay live data
          const totalDollars = fpData.totalDollars?.toFixed(2) ?? '0.00';
          const settledDollars = fpData.settledDollars?.toFixed(2) ?? '0.00';
          const pendingDollars = fpData.pendingDollars?.toFixed(2) ?? '0.00';
          const refundDollars = fpData.refundDollars?.toFixed(2) ?? '0.00';
          const txCount = result.totalTransactions || 0;
          message = `💳 **${fpData.month} ${fpData.year} Revenue (FluidPay)**\n\n` +
            `- **Total Collected:** $${totalDollars}\n` +
            `- **Settled:** $${settledDollars}\n` +
            `- **Pending:** $${pendingDollars}\n` +
            `- **Refunds:** $${refundDollars}\n` +
            `- **Transactions:** ${txCount}`;
        } else {
          const totalRevenueDollars = ((result.totalRevenue || 0) / 100).toFixed(2);
          const avgDollars = ((result.averageTransactionValue || 0) / 100).toFixed(2);
          const txCount = result.totalTransactions || 0;
          message = txCount === 0
            ? `No paid tuition records found from ${startDate} to ${endDate}. If you use FluidPay for payments, connect it so Kai can pull live payment data.`
            : `Revenue from ${startDate} to ${endDate}: $${totalRevenueDollars} total across ${txCount} transactions (avg $${avgDollars} per transaction).`;
        }
        return JSON.stringify({
          success: true,
          data: result,
          message
        });
      }

      case "update_user_name": {
        return await executeUpdateUserName(toolArgs, ctx);
      }

      case "send_sms_blast": {
        return await executeSmsBlast(toolArgs, ctx);
      }

      // ── Action tools ─────────────────────────────────────────────────────
      case "remove_student": {
        return await executeRemoveStudent(toolArgs, ctx);
      }

      case "add_lead": {
        return await executeAddLead(toolArgs, ctx);
      }

      case "update_lead_status": {
        return await executeUpdateLeadStatus(toolArgs, ctx);
      }

      case "mark_attendance": {
        return await executeMarkAttendance(toolArgs, ctx);
      }
      
      case "connect_fluidpay": {
        const result = await (kaiDataRouter.connectFluidPay as any).createCaller(ctx)({ apiKey: toolArgs.api_key });
        if (result.success) {
          return JSON.stringify({ success: true, message: '✅ FluidPay connected successfully! Your payment data will now appear in real-time.' });
        } else {
          return JSON.stringify({ success: false, message: `❌ Could not connect FluidPay: ${result.error}` });
        }
      }

      case "get_fluidpay_revenue": {
        const result = await (kaiDataRouter.getFluidPayRevenue as any).createCaller(ctx)({ year: toolArgs.year, month: toolArgs.month });
        if (!result.connected) {
          return JSON.stringify({ success: false, message: '⚠️ FluidPay is not connected. Please provide your FluidPay API key so I can connect it for you.' });
        }
        if (result.error) {
          return JSON.stringify({ success: false, message: `FluidPay error: ${result.error}` });
        }
        return JSON.stringify({
          success: true,
          data: result,
          message: `FluidPay revenue for ${result.month} ${result.year}: $${result.totalDollars?.toFixed(2)} total ($${result.settledDollars?.toFixed(2)} settled, $${result.pendingDollars?.toFixed(2)} pending) across ${result.transactionCount} transactions.`
        });
      }

      case "get_fluidpay_transactions": {
        const result = await (kaiDataRouter.getFluidPayTransactions as any).createCaller(ctx)({ limit: toolArgs.limit || 10 });
        if (!result.connected) {
          return JSON.stringify({ success: false, message: '⚠️ FluidPay is not connected. Please provide your FluidPay API key.' });
        }
        if (result.error) {
          return JSON.stringify({ success: false, message: `FluidPay error: ${result.error}` });
        }
        const txList = (result.transactions || []).slice(0, toolArgs.limit || 10).map((t: any) => ({
          id: t.id,
          amount: `$${((t.amount || 0) / 100).toFixed(2)}`,
          status: t.status,
          type: t.type,
          name: (() => {
            if (t.billing) {
              const n = `${t.billing.first_name || ''} ${t.billing.last_name || ''}`.trim();
              if (n) return n;
            }
            if (t.description && t.description.trim()) return t.description.trim();
            if (t.order_id && t.order_id.trim()) return `Order ${t.order_id.trim()}`;
            if (t.customer_id && t.customer_id.trim()) return `Customer ${t.customer_id.trim()}`;
            if (t.processor_id && t.processor_id.trim()) return `Tx ${t.processor_id.trim()}`;
            return `Txn ${(t.id || '').slice(-6)}`;
          })(),
          date: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Unknown',
          card: t.card?.masked_card || '',
        }));
        return JSON.stringify({ success: true, data: txList, message: `Recent FluidPay transactions retrieved.` });
      }

      case "invite_staff": {
        return await executeInviteStaff(toolArgs, ctx);
      }

      case "list_staff": {
        return await executeListStaff(toolArgs, ctx);
      }

      case "list_tuition_plans": {
        return await executeListTuitionPlans(ctx);
      }

      case "create_tuition_plan": {
        return await executeCreateTuitionPlan(toolArgs, ctx);
      }

      case "enroll_student_in_plan": {
        return await executeEnrollStudentInPlan(toolArgs, ctx);
      }

      case "get_student_billing_status": {
        return await executeGetStudentBillingStatus(toolArgs, ctx);
      }

      case "charge_student_tuition": {
        return await executeChargeStudentTuition(toolArgs, ctx);
      }

      // ── Kai Command Execution Engine ──────────────────────────────────────
      case "send_contact_message": {
        const { runCommandPipeline } = await import("./kai-command-engine");
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq: eqUser } = await import("drizzle-orm");
        const db2 = await getDb();
        let initiatedByName = ctx.user?.name || "Staff";
        if (db2 && ctx.user?.id) {
          const [u] = await db2.select({ name: users.name, preferredName: users.preferredName })
            .from(users).where(eqUser(users.id, ctx.user.id)).limit(1);
          if (u) initiatedByName = u.preferredName || u.name || initiatedByName;
        }
        const cmdResult = await runCommandPipeline({
          query: toolArgs.query,
          contactNameOverride: toolArgs.contact_name_override,
          programNameOverride: toolArgs.program_name_override,
          channelOverride: toolArgs.channel as "sms" | "email" | undefined,
          organizationId: ctx.currentOrganizationId,
          initiatedById: ctx.user.id,
          initiatedByName,
        });
        if (cmdResult.success) {
          const contactName = `${cmdResult.contact?.firstName} ${cmdResult.contact?.lastName}`.trim();
          const channel = (cmdResult.channel || "sms").toUpperCase();
          const programName = cmdResult.program?.name || "our programs";
          return JSON.stringify({
            success: true,
            data: {
              type: "command_execution_result",
              intent: cmdResult.intent,
              contact: cmdResult.contact,
              program: cmdResult.program,
              messageSent: cmdResult.messageSent,
              channel: cmdResult.channel,
              deliveryId: cmdResult.deliveryId,
              enrollmentLink: cmdResult.enrollmentLink,
              loggedActivityId: cmdResult.loggedActivityId,
            },
            message: `✅ Done. I sent ${contactName} the ${cmdResult.intent.replace(/_/g, ' ').toLowerCase()} by ${channel}. Message delivered${cmdResult.deliveryId ? ` (SID: ${cmdResult.deliveryId})` : ''}. Activity logged to CRM.\n\nWould you like me to follow up with ${contactName} tomorrow if they don't reply?`,
          });
        } else if (cmdResult.ambiguousContacts && cmdResult.ambiguousContacts.length > 1) {
          const options = cmdResult.ambiguousContacts
            .map((c, i) => `${i + 1}. ${c.firstName} ${c.lastName} (${c.type}) — ${c.phone || c.email || 'no contact info'}`)
            .join('\n');
          return JSON.stringify({
            success: false,
            data: { type: "contact_disambiguation", contacts: cmdResult.ambiguousContacts },
            message: `Found ${cmdResult.ambiguousContacts.length} contacts with that name. Which one did you mean?\n\n${options}\n\nReply with the number or full name to confirm.`,
          });
        } else if (cmdResult.isDuplicate) {
          return JSON.stringify({
            success: false,
            message: cmdResult.error || "Duplicate send blocked.",
          });
        } else {
          return JSON.stringify({
            success: false,
            message: cmdResult.error || "Command execution failed.",
          });
        }
      }

      case "resolve_contact": {
        const { resolveContact } = await import("./kai-command-engine");
        const matches = await resolveContact(toolArgs.name, ctx.currentOrganizationId);
        if (matches.length === 0) {
          return JSON.stringify({ success: false, message: `No contact named "${toolArgs.name}" found in the CRM.` });
        }
        const contactList = matches.map(c =>
          `• ${c.firstName} ${c.lastName} (${c.type}) — Phone: ${c.phone || 'N/A'} | Email: ${c.email || 'N/A'}`
        ).join('\n');
        return JSON.stringify({
          success: true,
          data: { contacts: matches },
          message: `Found ${matches.length} contact${matches.length > 1 ? 's' : ''} named "${toolArgs.name}":\n${contactList}`,
        });
      }

      case "get_programs_pricing": {
        const { resolveProgram } = await import("./kai-command-engine");
        const progs = await resolveProgram(
          toolArgs.program_name || "",
          null,
          ctx.currentOrganizationId
        );
        if (progs.length === 0) {
          return JSON.stringify({ success: false, message: "No active programs found in the CRM. Add programs in the Programs section." });
        }
        const summary = progs.map(p => {
          const price = p.price ? `$${(p.price / 100).toFixed(0)}/mo` : "Contact for pricing";
          const trial = p.trialType && p.trialType !== "none"
            ? ` | Trial: ${p.trialLengthDays} days ${p.trialPrice === 0 ? "FREE" : `$${((p.trialPrice || 0) / 100).toFixed(0)}`}`
            : "";
          const age = p.ageRange ? ` | Ages: ${p.ageRange}` : "";
          return `• **${p.name}**: ${price}${trial}${age}`;
        }).join('\n');
        return JSON.stringify({
          success: true,
          data: { programs: progs },
          message: `Here are your active programs:\n\n${summary}`,
        });
      }

      default:
        return JSON.stringify({
          success: false,
          message: `Unknown tool: ${toolName}`
        });
    }
  } catch (error) {
    console.error(`[Kai Tool Error] ${toolName}:`, error);
    return JSON.stringify({
      success: false,
      message: `Error executing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * Execute an SMS blast campaign with rate-limit retry logic
 */
async function executeSmsBlast(
  args: { message: string; target: string; filter?: string; delay_ms?: number },
  ctx: any
): Promise<string> {
  const { getDb } = await import("./db");
  const { students, leads } = await import("../drizzle/schema");
  const { eq, and, isNotNull, ne } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const orgId = ctx.currentOrganizationId;
  const delayMs = args.delay_ms ?? 1200;
  const message = args.message;
  const target = args.target || "leads";
  const filter = args.filter?.toLowerCase() || "";

  // Collect recipients
  type Recipient = { name: string; phone: string; type: "lead" | "student" };
  const recipients: Recipient[] = [];

  if (target === "leads" || target === "all") {
    let leadsQuery = db
      .select({ id: leads.id, firstName: leads.firstName, lastName: leads.lastName, phone: leads.phone, status: leads.status })
      .from(leads)
      .where(and(eq(leads.organizationId, orgId), isNotNull(leads.phone)));

    const allLeads = await leadsQuery;
    for (const lead of allLeads) {
      if (!lead.phone) continue;
      // Apply filter
      if (filter) {
        if (filter.includes("new") && lead.status !== "New Lead") continue;
        if (filter.includes("inactive") && lead.status !== "Lost/Winback") continue;
      }
      recipients.push({
        name: `${lead.firstName} ${lead.lastName}`.trim(),
        phone: lead.phone,
        type: "lead"
      });
    }
  }

  if (target === "students" || target === "all") {
    const allStudents = await db
      .select({ id: students.id, firstName: students.firstName, lastName: students.lastName, phone: students.phone, status: students.status })
      .from(students)
      .where(and(eq(students.organizationId, orgId), isNotNull(students.phone)));

    for (const student of allStudents) {
      if (!student.phone) continue;
      // Apply filter
      if (filter) {
        if (filter.includes("active") && !filter.includes("inactive") && student.status !== "Active") continue;
        if (filter.includes("inactive") && student.status !== "Inactive") continue;
        if (filter.includes("at-risk") || filter.includes("at risk")) {
          // At-risk = inactive or billing issues — include all for now
        }
      }
      recipients.push({
        name: `${student.firstName} ${student.lastName}`.trim(),
        phone: student.phone,
        type: "student"
      });
    }
  }

  // Check if Twilio is configured
  const twilioConfigured = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );

  // Send SMS to each recipient with retry logic
  const results: SmsBlastResult["recipients"] = [];
  let delivered = 0;
  let failed = 0;
  let rateLimited = 0;
  let skippedNoPhone = 0;

  for (const recipient of recipients) {
    if (!recipient.phone) {
      skippedNoPhone++;
      results.push({ name: recipient.name, phone: "N/A", status: "skipped", error: "No phone number" });
      continue;
    }

    // Personalize message
    const personalizedMessage = message.replace(/\[Name\]/gi, recipient.name.split(" ")[0]);

    if (twilioConfigured) {
      // Real SMS send with retry on rate limit
      let sent = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!sent && attempts < maxAttempts) {
        attempts++;
        try {
          const { sendSMS } = await import("./_core/twilio");
          const smsResult = await sendSMS({
            to: recipient.phone,
            body: personalizedMessage,
            organizationId: orgId
          });

          if (smsResult.success) {
            delivered++;
            results.push({ name: recipient.name, phone: recipient.phone, status: "delivered" });
            sent = true;
          } else if (smsResult.error?.includes("429") || smsResult.error?.includes("rate")) {
            // Rate limited — wait longer and retry
            rateLimited++;
            if (attempts < maxAttempts) {
              await new Promise(r => setTimeout(r, delayMs * 2));
            } else {
              results.push({ name: recipient.name, phone: recipient.phone, status: "rate_limited", error: "Rate limit exceeded after retries" });
            }
          } else {
            failed++;
            results.push({ name: recipient.name, phone: recipient.phone, status: "failed", error: smsResult.error });
            sent = true; // Don't retry non-rate-limit errors
          }
        } catch (err) {
          failed++;
          results.push({ name: recipient.name, phone: recipient.phone, status: "failed", error: err instanceof Error ? err.message : "Unknown error" });
          sent = true;
        }
      }
    } else {
      // Simulation mode — no Twilio credentials
      // Simulate realistic delivery: ~85% success, ~10% rate limited, ~5% failed
      const rand = Math.random();
      if (rand < 0.85) {
        delivered++;
        results.push({ name: recipient.name, phone: recipient.phone, status: "delivered" });
      } else if (rand < 0.95) {
        rateLimited++;
        results.push({ name: recipient.name, phone: recipient.phone, status: "rate_limited", error: "HTTP 429 (simulated)" });
      } else {
        failed++;
        results.push({ name: recipient.name, phone: recipient.phone, status: "failed", error: "Delivery failed (simulated)" });
      }
    }

    // Delay between sends to respect rate limits
    if (recipients.indexOf(recipient) < recipients.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  const blastResult: SmsBlastResult = {
    type: "sms_blast_result",
    message,
    target,
    filter: args.filter,
    totalTargeted: recipients.length,
    delivered,
    failed,
    rateLimited,
    skippedNoPhone,
    recipients: results,
    retryAvailable: rateLimited > 0,
    retryCount: rateLimited
  };

  const summary = twilioConfigured
    ? `SMS blast complete: ${delivered} delivered, ${failed} failed, ${rateLimited} rate-limited out of ${recipients.length} total.`
    : `SMS blast simulated (Twilio not configured): ${delivered} would be delivered, ${rateLimited} rate-limited, ${failed} failed out of ${recipients.length} total.`;

  console.log(`[Kai SMS Blast] ${summary}`);

  return JSON.stringify({
    success: true,
    data: blastResult,
    message: summary
  });
}

/**
 * Update the user's display name in the database
 */
async function executeUpdateUserName(
  args: { name: string },
  ctx: any
): Promise<string> {
  const { getDb } = await import("./db");
  const { users } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const newName = args.name?.trim();
  if (!newName) {
    return JSON.stringify({ success: false, message: "Name cannot be empty" });
  }

  const userId = ctx.user?.id;
  if (!userId) {
    return JSON.stringify({ success: false, message: "User not authenticated" });
  }

  await db
    .update(users)
    .set({ preferredName: newName })
    .where(eq(users.id, userId));

  return JSON.stringify({
    success: true,
    data: { preferredName: newName },
    message: `Got it! I'll call you ${newName} from now on. Your legal name remains unchanged for billing purposes.`,
    action: "refresh_user"
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Action tool implementations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove (archive) a student — Admin+ only (permission already checked upstream)
 */
async function executeRemoveStudent(
  args: { studentId: number; studentName: string; reason?: string },
  ctx: any
): Promise<string> {
  const { getDb } = await import("./db");
  const { students } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const orgId = ctx.currentOrganizationId;

  // Verify the student belongs to this org
  const [existing] = await db
    .select({ id: students.id, firstName: students.firstName, lastName: students.lastName })
    .from(students)
    .where(and(eq(students.id, args.studentId), eq(students.organizationId, orgId)))
    .limit(1);

  if (!existing) {
    return JSON.stringify({
      success: false,
      message: `Student "${args.studentName}" (ID: ${args.studentId}) was not found in your organization.`,
    });
  }

  const fullName = `${existing.firstName} ${existing.lastName}`.trim();

  // Archive the student (set status to Inactive rather than hard-delete)
  await db
    .update(students)
    .set({
      status: "Inactive",
      updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    })
    .where(eq(students.id, args.studentId));

  return JSON.stringify({
    success: true,
    action: "student_archived",
    message: `✅ **${fullName}** has been archived and removed from the active roster.${args.reason ? ` Reason: ${args.reason}` : ""} Their records are preserved for history.`,
  });
}

/**
 * Add a new lead — Manager+ (permission already checked upstream)
 */
async function executeAddLead(
  args: {
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    source?: string;
    interestedProgram?: string;
    notes?: string;
  },
  ctx: any
): Promise<string> {
  const { getDb } = await import("./db");
  const { leads } = await import("../drizzle/schema");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const orgId = ctx.currentOrganizationId;
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  const [inserted] = await db
    .insert(leads)
    .values({
      firstName: args.firstName,
      lastName: args.lastName || "",
      email: args.email?.toLowerCase() || null,
      phone: args.phone?.replace(/[^0-9+]/g, "") || null,
      status: "New Lead",
      source: args.source || "Kai",
      interestedProgram: args.interestedProgram || null,
      notes: args.notes || null,
      organizationId: orgId,
      createdAt: now,
      updatedAt: now,
    })
    .$returningId();

  const fullName = `${args.firstName} ${args.lastName || ""}`.trim();

  return JSON.stringify({
    success: true,
    action: "lead_added",
    data: { leadId: (inserted as any)?.id },
    message: `✅ New lead **${fullName}** has been added to the CRM as a **New Lead**.${args.email ? ` Email: ${args.email}` : ""}${args.phone ? ` Phone: ${args.phone}` : ""}`,
  });
}

/**
 * Update a lead's pipeline status — Manager+ (permission already checked upstream)
 */
async function executeUpdateLeadStatus(
  args: { leadId: number; leadName: string; status: string },
  ctx: any
): Promise<string> {
  const { getDb } = await import("./db");
  const { leads } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const orgId = ctx.currentOrganizationId;
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  // Verify lead belongs to this org
  const [existing] = await db
    .select({ id: leads.id, firstName: leads.firstName, lastName: leads.lastName, status: leads.status })
    .from(leads)
    .where(and(eq(leads.id, args.leadId), eq(leads.organizationId, orgId)))
    .limit(1);

  if (!existing) {
    return JSON.stringify({
      success: false,
      message: `Lead "${args.leadName}" (ID: ${args.leadId}) was not found in your organization.`,
    });
  }

  const oldStatus = existing.status;
  const fullName = `${existing.firstName} ${existing.lastName || ""}`.trim();

  await db
    .update(leads)
    .set({ status: args.status as any, updatedAt: now })
    .where(eq(leads.id, args.leadId));

  return JSON.stringify({
    success: true,
    action: "lead_status_updated",
    message: `✅ **${fullName}**'s pipeline stage has been updated from **${oldStatus}** → **${args.status}**.`,
  });
}

/**
 * Mark student attendance — Instructor+ (permission already checked upstream)
 */
async function executeMarkAttendance(
  args: { studentId: number; studentName: string; classId?: number; status: string; date?: string },
  ctx: any
): Promise<string> {
  const { getDb } = await import("./db");
  const { studentAttendance, students } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const orgId = ctx.currentOrganizationId;

  // Verify student belongs to this org
  const [existing] = await db
    .select({ id: students.id, firstName: students.firstName, lastName: students.lastName })
    .from(students)
    .where(and(eq(students.id, args.studentId), eq(students.organizationId, orgId)))
    .limit(1);

  if (!existing) {
    return JSON.stringify({
      success: false,
      message: `Student "${args.studentName}" (ID: ${args.studentId}) was not found in your organization.`,
    });
  }

  const fullName = `${existing.firstName} ${existing.lastName || ""}`.trim();
  const attendanceDate = args.date || new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  try {
    await db.insert(studentAttendance).values({
      studentId: args.studentId,
      classId: args.classId || null,
      date: attendanceDate,
      status: args.status as any,
      organizationId: orgId,
      createdAt: now,
      updatedAt: now,
    } as any);
  } catch (err: any) {
    // If duplicate entry, update instead
    if (err?.code === "ER_DUP_ENTRY" || err?.message?.includes("Duplicate")) {
      return JSON.stringify({
        success: false,
        message: `Attendance for **${fullName}** on ${attendanceDate} has already been recorded.`,
      });
    }
    throw err;
  }

  const statusEmoji = args.status === "present" ? "✅" : args.status === "late" ? "⏰" : "❌";
  return JSON.stringify({
    success: true,
    action: "attendance_marked",
    message: `${statusEmoji} **${fullName}** marked as **${args.status}** for ${attendanceDate}.`,
  });
}

/**
 * Invite a new staff member: create their account, add to teamMembers, send invitation email
 */
export async function executeInviteStaff(
  args: {
    firstName: string;
    lastName?: string;
    email: string;
    role?: string;
    phone?: string;
    sendEmail?: boolean;
  },
  ctx: any
): Promise<string> {
  const { getDb } = await import("./db");
  const { users, teamMembers, organizationUsers } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const bcrypt = await import("bcryptjs");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const orgId = ctx.user?.organizationId || ctx?.currentOrganizationId;
  if (!orgId) return JSON.stringify({ success: false, message: "No organization found." });

  const email = args.email?.trim().toLowerCase();
  if (!email) return JSON.stringify({ success: false, message: "Email is required to send an invitation." });

  const firstName = args.firstName?.trim();
  const lastName = args.lastName?.trim() || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const role = args.role || "instructor";

  // Check if user already exists
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return JSON.stringify({
      success: false,
      message: `⚠️ A user with email **${email}** already exists in the system. They can log in at /staff/login.`,
    });
  }

  // Generate a temporary password
  const tempPassword = `Dojo${Math.floor(1000 + Math.random() * 9000)}!`;
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  const openId = `staff_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  // Create user account
  await db.insert(users).values({
    email,
    password: hashedPassword,
    name: fullName,
    preferredName: firstName,
    provider: "local",
    role: "staff",
    openId,
    organizationId: orgId,
    mustChangePassword: 1,
  } as any);

  // Fetch the new user
  const newUserRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const newUser = newUserRows[0];

  if (newUser) {
    // Link user to organization
    try {
      await db.insert(organizationUsers).values({
        userId: newUser.id,
        organizationId: orgId,
        role: role as any,
      } as any);
    } catch (_e) {
      // Ignore duplicate link errors
    }

    // Add to teamMembers for display in Staff page
    const roleMap: Record<string, string> = {
      instructor: "instructor", coach: "coach", trainer: "trainer",
      assistant: "assistant", manager: "manager", front_desk: "front_desk", owner: "owner",
    };
    try {
      await db.insert(teamMembers).values({
        name: fullName,
        role: (roleMap[role] || "instructor") as any,
        email,
        phone: args.phone || null,
        organizationId: orgId,
        isActive: 1,
      } as any);
    } catch (_e) {
      // Non-fatal if teamMembers insert fails
    }
  }

  // Send invitation email
  const shouldSendEmail = args.sendEmail !== false;
  let emailStatus = "Email not sent (sendEmail=false).";
  if (shouldSendEmail) {
    try {
      const { sendEmail } = await import("./_core/sendgrid");
      // Get org name for the email
      const { organizations } = await import("../drizzle/schema");
      const orgRows = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
      const orgName = orgRows[0]?.name || "your dojo";
      // Use VITE_APP_URL if set, otherwise fall back to the deployed domain
      // VITE_FRONTEND_FORGE_API_URL is the AI API endpoint, NOT the app URL — do not use it here
      const appBaseUrl = process.env.VITE_APP_URL || 'https://dojo-flow.ai';
      const loginUrl = `${appBaseUrl}/staff/login`;

      const emailResult = await sendEmail({
        to: { email, name: fullName },
        subject: `You've been invited to join ${orgName} on DojoFlow`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #1a1a2e; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">DojoFlow</h1>
              <p style="color: #aaa; margin: 4px 0 0;">Staff Invitation</p>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1a1a2e; margin-top: 0;">Welcome, ${firstName}!</h2>
              <p style="color: #444;">You've been added as a <strong>${role.replace(/_/g, ' ')}</strong> at <strong>${orgName}</strong>. Your account is ready.</p>
              <div style="background: #f8f9fa; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 8px; color: #666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Credentials</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #666; width: 140px;">Email:</td><td style="padding: 6px 0; font-weight: bold; color: #1a1a2e;">${email}</td></tr>
                  <tr><td style="padding: 6px 0; color: #666;">Temporary Password:</td><td style="padding: 6px 0;"><code style="background:#e8e8e8; padding: 3px 8px; border-radius: 4px; font-size: 15px; letter-spacing: 1px;">${tempPassword}</code></td></tr>
                </table>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" style="background: #e63946; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">Log In to DojoFlow →</a>
              </div>
              <p style="color: #888; font-size: 13px; text-align: center;">Or copy this link: <a href="${loginUrl}" style="color: #e63946;">${loginUrl}</a></p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">Please log in and change your password as soon as possible. If you have questions, contact your dojo administrator.</p>
            </div>
          </div>
        `,
        text: `Welcome to DojoFlow!\n\nYou've been added as a ${role.replace(/_/g, ' ')} at ${orgName}.\n\nLogin URL: ${loginUrl}\nEmail: ${email}\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password as soon as possible.`,
        organizationId: orgId,
      });
      emailStatus = emailResult.success
        ? `✅ Invitation email sent to **${email}**.`
        : `⚠️ Account created but email failed: ${emailResult.error}`;
    } catch (err: any) {
      emailStatus = `⚠️ Account created but email failed: ${err.message}`;
    }
  }

  return JSON.stringify({
    success: true,
    action: "staff_invited",
    message: `✅ **${fullName}** has been added as a **${role.replace(/_/g, ' ')}**.\n\n${emailStatus}\n\nThey can log in at /staff/login using their email and temporary password.`,
    data: { name: fullName, email, role, tempPassword: shouldSendEmail ? "(sent via email)" : tempPassword },
  });
}

/**
 * List all staff members for this organization
 */
export async function executeListStaff(
  args: { role?: string },
  ctx: any
): Promise<string> {
  const { getDb } = await import("./db");
  const { teamMembers } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const orgId = ctx.user?.organizationId || ctx?.currentOrganizationId;
  if (!orgId) return JSON.stringify({ success: false, message: "No organization found." });

  const rows = await db.select().from(teamMembers).where(eq(teamMembers.organizationId, orgId));
  const filtered = args.role
    ? rows.filter((r: any) => r.role?.toLowerCase() === args.role?.toLowerCase())
    : rows;

  if (filtered.length === 0) {
    return JSON.stringify({
      success: true,
      data: [],
      message: args.role
        ? `No staff members with role "${args.role}" found.`
        : "No staff members found. You can add staff by saying \"invite [name] as instructor\".",
    });
  }

  const list = filtered.map((s: any) => ({
    name: s.name,
    role: s.role,
    email: s.email || "—",
    phone: s.phone || "—",
    active: s.isActive ? "Active" : "Inactive",
  }));

  return JSON.stringify({
    success: true,
    data: list,
    message: `**${filtered.length} staff member${filtered.length !== 1 ? "s" : ""}** found:\n${list.map((s: any) => `• **${s.name}** — ${s.role} (${s.email})`).join("\n")}`,
  });
}


// ── Tuition Billing Executors ────────────────────────────────────────────────

async function resolveOrgIdForKai(ctx: any): Promise<number | null> {
  const direct = ctx.user?.organizationId || ctx?.currentOrganizationId;
  if (direct && direct !== 1) return direct; // skip demo org 1
  if (direct === 1 || !direct) {
    // If resolved to demo org or nothing, scan ALL dojo_settings for a real org with FluidPay key
    try {
      const { getDb } = await import("./db");
      const { dojoSettings } = await import("../drizzle/schema");
      const db = await getDb();
      if (!db) return direct || null;
      const allSettings = await db.select().from(dojoSettings).limit(50);
      for (const row of allSettings) {
        const key = (row as any)?.fluidpayApiKey;
        const orgId = (row as any)?.organizationId;
        if (key && key.length > 10 && orgId && orgId !== 1) {
          console.log('[resolveOrgIdForKai] Found real org with FluidPay key:', orgId);
          return orgId;
        }
      }
      // No FluidPay key found, fall back to user membership
      const { organizationUsers } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      if (!ctx.user?.id) return direct || null;
      const memberships = await db
        .select({ organizationId: organizationUsers.organizationId })
        .from(organizationUsers)
        .where(eq(organizationUsers.userId, ctx.user.id))
        .limit(1);
      return memberships[0]?.organizationId ?? direct ?? null;
    } catch {
      return direct || null;
    }
  }
  return direct;
}

export async function executeListTuitionPlans(ctx: any): Promise<string> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const orgId = await resolveOrgIdForKai(ctx);
  if (!orgId) return JSON.stringify({ success: false, message: "No organization found." });

  const plans = await db.execute(
    `SELECT id, name, description, amount_cents, frequency, is_active FROM tuition_plans WHERE organization_id = ${orgId} AND is_active = 1 ORDER BY amount_cents ASC`
  ) as any;
  const rows = Array.isArray(plans) ? plans : (plans.rows || []);

  if (!rows.length) {
    return JSON.stringify({ success: true, data: [], message: "No tuition plans created yet. You can create one by saying 'create a monthly plan for $99'." });
  }

  const list = rows.map((p: any) => ({
    id: p.id,
    name: p.name,
    amountDollars: (parseInt(p.amount_cents) / 100),
    frequency: p.frequency,
    description: p.description || "",
  }));

  const summary = list.map((p: any) => `• **${p.name}** — $${p.amountDollars.toFixed(2)}/${p.frequency} (ID: ${p.id})`).join("\n");
  return JSON.stringify({ success: true, data: list, message: `**${list.length} tuition plan${list.length !== 1 ? "s" : ""}**:\n${summary}` });
}

export async function executeCreateTuitionPlan(
  args: { name: string; amountDollars: number; frequency?: string; description?: string },
  ctx: any
): Promise<string> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const orgId = await resolveOrgIdForKai(ctx);
  if (!orgId) return JSON.stringify({ success: false, message: "No organization found." });

  const freq = args.frequency || "monthly";
  const amount = parseFloat(String(args.amountDollars));
  if (isNaN(amount) || amount <= 0) return JSON.stringify({ success: false, message: "Invalid amount. Please provide a positive dollar amount." });

  const amountCents = Math.round(amount * 100);
  await db.execute(
    `INSERT INTO tuition_plans (organization_id, name, description, amount_cents, frequency, is_active, created_at) VALUES (${orgId}, ${JSON.stringify(args.name)}, ${args.description ? JSON.stringify(args.description) : "NULL"}, ${amountCents}, ${JSON.stringify(freq)}, 1, NOW())`
  );

  return JSON.stringify({
    success: true,
    message: `✅ **"${args.name}"** plan created — $${amount.toFixed(2)}/${freq}. You can now enroll students in this plan from their profile or by asking me to enroll them.`,
  });
}

export async function executeEnrollStudentInPlan(
  args: { studentId: number; studentName: string; planId: number; planName: string },
  ctx: any
): Promise<string> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const orgId = await resolveOrgIdForKai(ctx);
  if (!orgId) return JSON.stringify({ success: false, message: "No organization found." });

  // Verify plan belongs to org
  const planRows = await db.execute(
    `SELECT id, name, amount_cents, frequency FROM tuition_plans WHERE id = ${args.planId} AND organization_id = ${orgId} AND is_active = 1`
  ) as any;
  const plans = Array.isArray(planRows) ? planRows : (planRows.rows || []);
  if (!plans.length) return JSON.stringify({ success: false, message: `Plan not found. Use 'list tuition plans' to see available plans.` });

  const plan = plans[0];
  const planAmountDollars = (parseInt(plan.amount_cents) / 100).toFixed(2);

  // Check for existing active enrollment
  const existingRows = await db.execute(
    `SELECT id FROM student_billing_enrollments WHERE student_id = ${args.studentId} AND plan_id = ${args.planId} AND status = 'active'`
  ) as any;
  const existing = Array.isArray(existingRows) ? existingRows : (existingRows.rows || []);
  if (existing.length) {
    return JSON.stringify({ success: false, message: `${args.studentName} is already enrolled in "${plan.name}".` });
  }

  // Create enrollment
  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  await db.execute(
    `INSERT INTO student_billing_enrollments (student_id, plan_id, organization_id, status, next_billing_date, created_at) VALUES (${args.studentId}, ${args.planId}, ${orgId}, 'active', '${nextBilling.toISOString().slice(0, 10)}', NOW())`
  );

  return JSON.stringify({
    success: true,
    message: `✅ **${args.studentName}** enrolled in **"${plan.name}"** ($${planAmountDollars}/${plan.frequency}). Next billing: ${nextBilling.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. To charge their card, they need a payment method on file — add it via their student profile.`,
  });
}

export async function executeGetStudentBillingStatus(
  args: { studentId: number; studentName: string },
  ctx: any
): Promise<string> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const enrollRows = await db.execute(
    `SELECT e.id, e.status, e.next_billing_date, p.name as plan_name, p.amount_cents, p.frequency, e.fluidpay_customer_id, e.card_last4, e.card_brand
     FROM student_billing_enrollments e
     JOIN tuition_plans p ON e.plan_id = p.id
     WHERE e.student_id = ${args.studentId}
     ORDER BY e.created_at DESC`
  ) as any;
  const enrollments = Array.isArray(enrollRows) ? enrollRows : (enrollRows.rows || []);

  const paymentRows = await db.execute(
    `SELECT amount_cents, status, paid_at, description FROM student_tuition_payments WHERE student_id = ${args.studentId} ORDER BY created_at DESC LIMIT 5`
  ) as any;
  const payments = Array.isArray(paymentRows) ? paymentRows : (paymentRows.rows || []);

  if (!enrollments.length) {
    return JSON.stringify({ success: true, message: `${args.studentName} has no tuition plan assigned. Enroll them with 'enroll [name] in [plan name]'.` });
  }

  const activeEnrollments = enrollments.filter((e: any) => e.status === "active");
  const totalMonthlyCents = activeEnrollments.reduce((sum: number, e: any) => sum + parseInt(e.amount_cents || 0), 0);
  const totalMonthly = totalMonthlyCents / 100;
  const hasCard = activeEnrollments.some((e: any) => e.card_last4);

  let msg = `**${args.studentName} — Billing Status**\n\n`;
  msg += `**Active Plans:** ${activeEnrollments.length}\n`;
  msg += `**Monthly Total:** $${totalMonthly.toFixed(2)}\n`;
  msg += `**Card on File:** ${hasCard ? `✅ ${activeEnrollments.find((e: any) => e.card_last4)?.card_brand || "Card"} •••• ${activeEnrollments.find((e: any) => e.card_last4)?.card_last4}` : "❌ No card on file"}\n\n`;

  if (activeEnrollments.length) {
    msg += `**Plans:**\n`;
    for (const e of activeEnrollments) {
      msg += `• ${e.plan_name} — $${(parseInt(e.amount_cents) / 100).toFixed(2)}/${e.frequency}`;
      if (e.next_billing_date) msg += ` (next: ${new Date(e.next_billing_date).toLocaleDateString()})`;
      msg += "\n";
    }
  }

  if (payments.length) {
    msg += `\n**Recent Payments:**\n`;
    for (const p of payments) {
      const date = p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "—";
      msg += `• $${(parseInt(p.amount_cents) / 100).toFixed(2)} — ${p.status} (${date})\n`;
    }
  }

  return JSON.stringify({ success: true, message: msg });
}

export async function executeChargeStudentTuition(
  args: { studentId: number; studentName: string; amountDollars?: number },
  ctx: any
): Promise<string> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const orgId = await resolveOrgIdForKai(ctx);
  if (!orgId) return JSON.stringify({ success: false, message: "No organization found." });

  // Get active enrollment with card
  const enrollRows = await db.execute(
    `SELECT e.id, e.fluidpay_customer_id, e.card_last4, e.card_brand, p.name as plan_name, p.amount_cents
     FROM student_billing_enrollments e
     JOIN tuition_plans p ON e.plan_id = p.id
     WHERE e.student_id = ${args.studentId} AND e.status = 'active' AND e.fluidpay_customer_id IS NOT NULL
     LIMIT 1`
  ) as any;
  const enrollments = Array.isArray(enrollRows) ? enrollRows : (enrollRows.rows || []);

  if (!enrollments.length) {
    return JSON.stringify({ success: false, message: `Cannot charge ${args.studentName} — either they have no active tuition plan or no card on file. Add a card via their student profile first.` });
  }

  const enrollment = enrollments[0];
  const amount = args.amountDollars || (parseInt(enrollment.amount_cents) / 100);

  // Get FluidPay API key for org
  const settingsRows = await db.execute(
    `SELECT fluidpay_api_key FROM dojo_settings WHERE organization_id = ${orgId} LIMIT 1`
  ) as any;
  const settings = Array.isArray(settingsRows) ? settingsRows : (settingsRows.rows || []);
  const apiKey = settings[0]?.fluidpay_api_key;

  if (!apiKey) {
    return JSON.stringify({ success: false, message: "FluidPay is not connected. Connect it via Settings → Payments first." });
  }

  // Charge via FluidPay customer vault
  try {
    const response = await fetch("https://app.fluidpay.com/api/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": apiKey },
      body: JSON.stringify({
        type: "sale",
        amount: Math.round(amount * 100),
        currency: "USD",
        vault_id: enrollment.fluidpay_customer_id,
        description: `Tuition: ${enrollment.plan_name} — ${args.studentName}`,
      }),
    });

    const result = await response.json() as any;

    if (result.status === "success" || result.data?.status === "pending_settlement" || result.data?.status === "approved") {
      const txId = result.data?.id || result.id;
      // Record payment
      const amountCentsToRecord = Math.round(amount * 100);
      await db.execute(
        `INSERT INTO student_tuition_payments (student_id, enrollment_id, organization_id, amount_cents, status, fluidpay_transaction_id, description, paid_at, created_at)
         VALUES (${args.studentId}, ${enrollment.id}, ${orgId}, ${amountCentsToRecord}, 'success', ${txId ? JSON.stringify(String(txId)) : "NULL"}, ${JSON.stringify(`Tuition: ${enrollment.plan_name}`)}, NOW(), NOW())`
      );
      return JSON.stringify({
        success: true,
        message: `✅ **$${amount.toFixed(2)} charged** to ${args.studentName}'s ${enrollment.card_brand || "card"} •••• ${enrollment.card_last4} for **${enrollment.plan_name}**. Transaction ID: ${txId || "N/A"}`,
      });
    } else {
      const errMsg = result.msg || result.message || result.data?.response_body?.card?.processor_response_text || "Payment declined";
      // Record failed attempt
      const failedAmountCents = Math.round(amount * 100);
      await db.execute(
        `INSERT INTO student_tuition_payments (student_id, enrollment_id, organization_id, amount_cents, status, description, created_at)
         VALUES (${args.studentId}, ${enrollment.id}, ${orgId}, ${failedAmountCents}, 'failed', ${JSON.stringify(`Failed: ${errMsg}`)}, NOW())`
      );
      return JSON.stringify({ success: false, message: `❌ Payment failed for ${args.studentName}: ${errMsg}` });
    }
  } catch (err: any) {
    return JSON.stringify({ success: false, message: `Error charging card: ${err.message}` });
  }
}
