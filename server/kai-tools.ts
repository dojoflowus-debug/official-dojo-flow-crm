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
  }
];

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
