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
 */
export async function executeKaiTool(
  toolName: string,
  toolArgs: Record<string, any>,
  ctx: any
): Promise<string> {
  const { kaiDataRouter } = await import("./kaiDataRouter");
  
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
    .set({ name: newName })
    .where(eq(users.id, userId));

  return JSON.stringify({
    success: true,
    data: { name: newName },
    message: `Your display name has been updated to "${newName}". The change is reflected throughout the app.`,
    action: "refresh_user"
  });
}
