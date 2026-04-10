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
      description: "Get list of at-risk students (those with low attendance or payment issues)",
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
      description: "Get all classes with enrollment and capacity info",
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
      description: "Get revenue statistics and financial summary",
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
          limit: 5
        });
        return JSON.stringify({
          success: true,
          data: result,
          message: `Found ${result?.length || 0} students matching "${toolArgs.query}"`
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
          .where(eq(students.organizationId, ctx.user.organizationId));
        
        return JSON.stringify({
          success: true,
          data: { count: result.length },
          message: `You have ${result.length} students enrolled.`
        });
      }
      
      case "get_at_risk_students": {
        const result = await (kaiDataRouter.listAtRiskStudents as any).createCaller(ctx)({
          limit: 10
        });
        return JSON.stringify({
          success: true,
          data: result,
          message: `Found ${result?.length || 0} at-risk students`
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
        return JSON.stringify({
          success: true,
          data: result,
          message: `Found ${result?.length || 0} classes`
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
        const result = await (kaiDataRouter.getRevenueSummary as any).createCaller(ctx)({});
        return JSON.stringify({
          success: true,
          data: result,
          message: `Revenue summary retrieved`
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
          name: t.billing ? `${t.billing.first_name || ''} ${t.billing.last_name || ''}`.trim() : 'Unknown',
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

  const orgId = ctx.user.organizationId;
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

  const orgId = ctx.user.organizationId;

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

  const orgId = ctx.user.organizationId;
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

  const orgId = ctx.user.organizationId;
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

  const orgId = ctx.user.organizationId;

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
      const loginUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL ? process.env.VITE_FRONTEND_FORGE_API_URL.replace('/api', '') : 'https://dojo-flow.ai'}/staff/login`;

      const emailResult = await sendEmail({
        to: { email, name: fullName },
        subject: `You've been invited to join ${orgName} on DojoFlow`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">Welcome to DojoFlow, ${firstName}!</h2>
            <p>You've been added as a <strong>${role.replace(/_/g, ' ')}</strong> at <strong>${orgName}</strong>.</p>
            <p>Here are your login credentials:</p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> <code style="background:#e0e0e0;padding:2px 6px;border-radius:4px;">${tempPassword}</code></p>
            </div>
            <p style="color: #666;">Please log in and change your password as soon as possible.</p>
            <p>If you have any questions, contact your dojo administrator.</p>
          </div>
        `,
        text: `Welcome to DojoFlow!\n\nYou've been added as a ${role} at ${orgName}.\n\nLogin URL: ${loginUrl}\nEmail: ${email}\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password.`,
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
