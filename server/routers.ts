import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { setupWizardRouter } from "./setupWizardRouter";
import { billingRouter } from "./billingRouter";
import { webhookRouter } from "./webhookRouter";
import { campaignsRouter } from "./campaignsRouter";
import { automationRouter } from "./automationRouter";
import { conversationsRouter } from "./conversationsRouter";
import { authRouter } from "./authRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { getActiveStaffPins, updateStaffPinLastUsed, createStaffPin, getAllStaffPins, updateStaffPin, toggleStaffPinActive, deleteStaffPin } from "./db";

// Helper functions for CRM queries
async function executeCRMFunction(name: string, args: any) {
  const { getDashboardStats, searchStudents, getKioskCheckIns, getKioskVisitors, getKioskWaivers } = await import("./db");
  
  switch (name) {
    case 'get_student_count':
      const stats = await getDashboardStats();
      return { count: stats?.total_students || 0, status: args.status || 'all' };
    
    case 'find_student':
      const students = await searchStudents(args.query);
      if (students.length > 0) {
        const student = students[0];
        return {
          type: 'student_lookup',
          student: {
            first_name: student.firstName,
            last_name: student.lastName,
            belt_rank: student.beltRank,
            status: student.status,
            email: student.email,
            phone: student.phone,
            age: student.age,
            membership_status: student.membershipStatus,
          }
        };
      }
      return { error: 'Student not found' };
    
    case 'get_revenue':
      const revenueStats = await getDashboardStats();
      return { revenue: revenueStats?.monthly_revenue || 0, period: args.period || 'month' };
    
    case 'get_leads':
      const leadStats = await getDashboardStats();
      return { count: leadStats?.total_leads || 0, status: args.status || 'all' };
    
    case 'find_lead':
      const { getDb } = await import("./db");
      const { leads } = await import("../drizzle/schema");
      const { like, or } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) return { error: 'Database not available' };
      
      // Search leads by name
      const searchResults = await db.select().from(leads)
        .where(
          or(
            like(leads.firstName, `%${args.query}%`),
            like(leads.lastName, `%${args.query}%`)
          )
        )
        .limit(1);
      
      if (searchResults.length > 0) {
        const lead = searchResults[0];
        return {
          type: 'lead_lookup',
          lead: {
            first_name: lead.firstName,
            last_name: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            status: lead.status,
            source: lead.source,
            notes: lead.notes,
          }
        };
      }
      return { error: 'Lead not found' };
    
    case 'get_checkins':
      const checkIns = await getKioskCheckIns();
      return { count: checkIns?.length || 0, period: args.period || 'today' };
    
    case 'get_classes':
      return {
        classes: [
          { time: '4:00 PM', name: 'Kids Karate', ages: '6-12' },
          { time: '5:30 PM', name: 'Teen Martial Arts', ages: '13-17' },
          { time: '7:00 PM', name: 'Adult Kickboxing', ages: '18+' },
        ],
        date: args.date || 'today'
      };
    
    case 'get_inactive_students':
      // TODO: Implement actual inactive student query
      return { count: 0, days: args.days, message: 'Feature coming soon' };
    
    default:
      return { error: 'Unknown function' };
  }
}

function formatFunctionResults(results: any[]): string {
  if (results.length === 0) return 'No results found.';
  
  const result = results[0];
  
  if (result.error) {
    return `I couldn't find that information: ${result.error}`;
  }
  
  if (result.type === 'student_lookup') {
    const s = result.student;
    return `Found ${s.first_name} ${s.last_name}: ${s.belt_rank} belt, ${s.status}, ${s.membership_status} membership.`;
  }
  
  if (result.count !== undefined) {
    return `Found ${result.count} results.`;
  }
  
  if (result.revenue !== undefined) {
    return `Revenue: $${result.revenue}`;
  }
  
  return JSON.stringify(result);
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  setupWizard: setupWizardRouter,
  billing: billingRouter,
  webhook: webhookRouter,
  campaigns: campaignsRouter,
  automation: automationRouter,
  conversations: conversationsRouter,
  auth: router({
    // User profile endpoint
    getCurrentUser: authRouter.getCurrentUser,
    
    // Legacy endpoints
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Staff PIN validation for kiosk access
  staff: router({
    validatePin: publicProcedure
      .input(z.object({
        pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits"),
      }))
      .mutation(async ({ input }) => {
        const { pin } = input;
        
        // Get all active staff PINs from database
        const staffPins = await getActiveStaffPins();
        
        if (staffPins.length === 0) {
          // No PINs in database - allow default PIN 1234 for initial setup
          if (pin === "1234") {
            return {
              valid: true,
              staffName: "Default Admin",
              message: "Using default PIN. Please create staff PINs in settings."
            };
          }
          return {
            valid: false,
            message: "Invalid PIN"
          };
        }
        
        // Check PIN against all active staff PINs
        for (const staffPin of staffPins) {
          const isMatch = await bcrypt.compare(pin, staffPin.pinHash);
          if (isMatch) {
            // Update last used timestamp
            await updateStaffPinLastUsed(staffPin.id);
            
            return {
              valid: true,
              staffName: staffPin.name,
              role: staffPin.role,
              message: "Access granted"
            };
          }
        }
        
        return {
          valid: false,
          message: "Invalid PIN"
        };
      }),
    
    createPin: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required"),
        pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits"),
        role: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { name, pin, role } = input;
        
        // Hash the PIN before storing
        const pinHash = await bcrypt.hash(pin, 10);
        
        await createStaffPin({
          name,
          pinHash,
          role: role || "staff",
          isActive: 1,
        });
        
        return {
          success: true,
          message: `PIN created for ${name}`
        };
      }),
    
    listPins: publicProcedure
      .query(async () => {
        const pins = await getAllStaffPins();
        // Remove pinHash from response for security
        return pins.map(({ pinHash, ...pin }) => pin);
      }),
    
    updatePin: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1, "Name is required"),
        pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits").optional(),
        role: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, name, pin, role } = input;
        
        const updates: any = { name, role };
        
        // Only update PIN if provided
        if (pin) {
          updates.pinHash = await bcrypt.hash(pin, 10);
        }
        
        await updateStaffPin(id, updates);
        
        return {
          success: true,
          message: `PIN updated for ${name}`
        };
      }),
    
    toggleActive: publicProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.number().min(0).max(1),
      }))
      .mutation(async ({ input }) => {
        const { id, isActive } = input;
        
        await toggleStaffPinActive(id, isActive);
        
        return {
          success: true,
          message: isActive ? "PIN activated" : "PIN deactivated"
        };
      }),
    
    deletePin: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { id } = input;
        
        await deleteStaffPin(id);
        
        return {
          success: true,
          message: "PIN deleted successfully"
        };
      }),
  }),

  // CRM Dashboard APIs
  dashboard: router({
    stats: publicProcedure.query(async () => {
      const { getDashboardStats } = await import("./db");
      const stats = await getDashboardStats();
      return stats || {
        total_students: 0,
        monthly_revenue: 0,
        total_leads: 0,
        todays_classes: []
      };
    }),
    
    getLeads: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { leads } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get all leads
      const allLeads = await db.select().from(leads);
      return allLeads;
    }),
  }),

  leadSources: router({
    list: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { leadSources } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get all lead sources ordered by displayOrder
      const sources = await db.select().from(leadSources).orderBy(leadSources.displayOrder);
      return sources;
    }),
    
    toggle: publicProcedure
      .input(z.object({
        id: z.number(),
        enabled: z.number().min(0).max(1),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leadSources } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.update(leadSources)
          .set({ enabled: input.enabled })
          .where(eq(leadSources.id, input.id));
        
        return { success: true };
      }),
  }),

  leads: router({
    getByStatus: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { leads } = await import("../drizzle/schema");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get all leads
      const allLeads = await db.select().from(leads);
      
      // Group by status (map database enum values to frontend keys)
      const grouped = {
        new_lead: [],
        attempting_contact: [],
        contact_made: [],
        intro_scheduled: [],
        offer_presented: [],
        enrolled: [],
        nurture: [],
        lost_winback: [],
      };
      
      allLeads.forEach(lead => {
        const statusKey = lead.status.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
        if (grouped[statusKey]) {
          grouped[statusKey].push({
            id: lead.id,
            first_name: lead.firstName,
            last_name: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            status: statusKey,
            source: lead.source,
            notes: lead.notes,
            created_at: lead.createdAt,
            updated_at: lead.updatedAt,
          });
        }
      });
      
      return grouped;
    }),
    
    create: publicProcedure
      .input(z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        source: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leads } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const result = await db.insert(leads).values({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          source: input.source,
          notes: input.notes,
          status: "New Lead",
        });
        
        const newLeadId = result.insertId;
        
        // Trigger automation for new lead (async, don't wait)
        const { triggerAutomation } = await import("./services/automationEngine");
        triggerAutomation("new_lead", "lead", newLeadId).catch((err) => {
          console.error('[Leads] Automation trigger error:', err);
        });
        
        return { success: true, id: newLeadId };
      }),
    
    updateStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leads } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Map frontend key to database enum value
        const statusMap = {
          'new_lead': 'New Lead',
          'attempting_contact': 'Attempting Contact',
          'contact_made': 'Contact Made',
          'intro_scheduled': 'Intro Scheduled',
          'offer_presented': 'Offer Presented',
          'enrolled': 'Enrolled',
          'nurture': 'Nurture',
          'lost_winback': 'Lost/Winback',
        };
        
        const dbStatus = statusMap[input.status] || input.status;
        
        await db.update(leads)
          .set({ status: dbStatus })
          .where(eq(leads.id, input.id));
        
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leads } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.delete(leads).where(eq(leads.id, input.id));
        
        return { success: true };
      }),
  }),

  kiosk: router({
    checkIns: publicProcedure.query(async () => {
      const { getKioskCheckIns } = await import("./db");
      const data = await getKioskCheckIns();
      return { data };
    }),
    
    visitors: publicProcedure.query(async () => {
      const { getKioskVisitors } = await import("./db");
      const data = await getKioskVisitors();
      return { data };
    }),
    
    waivers: publicProcedure.query(async () => {
      const { getKioskWaivers } = await import("./db");
      const data = await getKioskWaivers();
      return { data };
    }),
    
    recordCheckIn: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students, kioskCheckIns } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get student info
        const student = await db.select().from(students).where(eq(students.id, input.studentId)).limit(1);
        
        if (student.length === 0) {
          return {
            success: false,
            message: 'Student not found'
          };
        }
        
        // Record check-in
        const fullName = `${student[0].firstName} ${student[0].lastName}`;
        await db.insert(kioskCheckIns).values({
          studentId: input.studentId,
          studentName: fullName,
          timestamp: new Date(),
        });
        
        return {
          success: true,
          student: {
            ...student[0],
            name: fullName
          },
          message: `Welcome, ${fullName}!`
        };
      }),
  }),
  
  students: router({
    list: publicProcedure
      .query(async () => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get all students
        const allStudents = await db.select().from(students);
        return allStudents;
      }),
    
    lookupByPhone: publicProcedure
      .input(z.object({
        phone: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq, like } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Search for student by phone
        const result = await db.select().from(students).where(like(students.phone, `%${input.phone}%`)).limit(1);
        
        if (result.length > 0) {
          return {
            student: result[0]
          };
        }
        
        return {
          student: null,
          message: 'Student not found'
        };
      }),
      
    searchStudents: publicProcedure
      .input(z.object({
        query: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { searchStudents } = await import("./db");
        const students = await searchStudents(input.query);
        
        return {
          students
        };
      }),
    
    stats: publicProcedure
      .query(async () => {
        const { getDashboardStats } = await import("./db");
        const stats = await getDashboardStats();
        return {
          total: stats?.total_students || 0,
          active: stats?.total_students || 0,
          overdue: 0,
          newThisMonth: 0
        };
      }),
    
    create: publicProcedure
      .input(z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        dateOfBirth: z.date().optional(),
        age: z.number().optional(),
        beltRank: z.string().optional(),
        status: z.string().optional(),
        membershipStatus: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const newStudent = await db.insert(students).values({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email || null,
          phone: input.phone || null,
          dateOfBirth: input.dateOfBirth || null,
          age: input.age || null,
          beltRank: input.beltRank || 'White',
          status: input.status || 'Active',
          membershipStatus: input.membershipStatus || 'Active',
        });
        
        return { success: true, id: newStudent.insertId };
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        dateOfBirth: z.date().optional(),
        age: z.number().optional(),
        beltRank: z.string().optional(),
        status: z.string().optional(),
        membershipStatus: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const { id, ...updateData } = input;
        await db.update(students).set(updateData).where(eq(students.id, id));
        
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.delete(students).where(eq(students.id, input.id));
        
        return { success: true };
      }),
  }),

  kai: router({
    chat: publicProcedure
      .input(z.object({
        message: z.string(),
        avatarName: z.string().optional(),
        conversation_id: z.string().optional(),
        context: z.any().optional(),
        conversationHistory: z.array(z.object({
          role: z.enum(['user', 'assistant', 'system']),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const { message, avatarName = 'Kai', conversationHistory = [] } = input;
        
        // Use OpenAI GPT-4 for conversational AI
        const { chatWithKai } = await import("./services/openai");
        
        try {
          const aiResponse = await chatWithKai(message, conversationHistory, avatarName);
          
          // If GPT-4 wants to call functions, execute them
          if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
            const functionResults: any[] = [];
            
            for (const call of aiResponse.functionCalls) {
              const result = await executeCRMFunction(call.name, call.arguments);
              functionResults.push(result);
            }
            
            // Return the AI response with function results
            return {
              response: aiResponse.response || formatFunctionResults(functionResults),
              action_result: functionResults[0], // For backwards compatibility
            };
          }
          
          return {
            response: aiResponse.response,
          };
        } catch (error) {
          console.error('[Kai Chat] Error:', error);
          // Fallback to keyword-based parsing if OpenAI fails
          const lowerMessage = message.toLowerCase();
        
        // Student lookup
        if (lowerMessage.includes('find') || lowerMessage.includes('lookup') || lowerMessage.includes('search')) {
          const { searchStudents } = await import("./db");
          
          // Extract potential name from message
          const words = message.split(' ');
          const nameQuery = words.slice(1).join(' '); // Skip first word (find/lookup/search)
          
          const students = await searchStudents(nameQuery);
          
          if (students.length > 0) {
            const student = students[0];
            return {
              response: `I found ${student.firstName} ${student.lastName}'s information. Here are the details:`,
              action_result: {
                type: "student_lookup",
                student: {
                  first_name: student.firstName,
                  last_name: student.lastName,
                  belt_rank: student.beltRank,
                  status: student.status,
                  email: student.email,
                  phone: student.phone,
                  age: student.age,
                  membership_status: student.membershipStatus,
                }
              }
            };
          } else {
            return {
              response: `I couldn't find any students matching "${nameQuery}". Please try a different name or check the spelling.`
            };
          }
        }
        
        // Stats queries
        if (lowerMessage.includes('how many students') || lowerMessage.includes('total students')) {
          const { getDashboardStats } = await import("./db");
          const stats = await getDashboardStats();
          return {
            response: `You currently have ${stats?.total_students || 0} active students in your dojo.`
          };
        }
        
        if (lowerMessage.includes('revenue') || lowerMessage.includes('money')) {
          const { getDashboardStats } = await import("./db");
          const stats = await getDashboardStats();
          return {
            response: `Your monthly revenue is $${stats?.monthly_revenue || 0}.`
          };
        }
        
        if (lowerMessage.includes('leads')) {
          const { getDashboardStats } = await import("./db");
          const stats = await getDashboardStats();
          return {
            response: `You have ${stats?.total_leads || 0} active leads in your pipeline.`
          };
        }
        
        // Kiosk check-ins
        if (lowerMessage.includes('check-in') || lowerMessage.includes('checkin') || lowerMessage.includes('check in')) {
          const { getKioskCheckIns } = await import("./db");
          const checkIns = await getKioskCheckIns();
          return {
            response: `There have been ${checkIns?.length || 0} check-ins today at the kiosk.`
          };
        }
        
        // Kiosk visitors
        if (lowerMessage.includes('visitor') || lowerMessage.includes('new visitor')) {
          const { getKioskVisitors } = await import("./db");
          const visitors = await getKioskVisitors();
          return {
            response: `You have ${visitors?.length || 0} new visitors today.`
          };
        }
        
        // Waivers
        if (lowerMessage.includes('waiver')) {
          const { getKioskWaivers } = await import("./db");
          const waivers = await getKioskWaivers();
          return {
            response: `${waivers?.length || 0} waivers have been signed today.`
          };
        }
        
        // Classes
        if (lowerMessage.includes('class') && (lowerMessage.includes('today') || lowerMessage.includes('schedule'))) {
          return {
            response: "Today's class schedule: 4:00 PM - Kids Karate (Ages 6-12), 5:30 PM - Teen Martial Arts, 7:00 PM - Adult Kickboxing. Would you like more details about any class?"
          };
        }
        
        // Greeting responses
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage === 'hi' || lowerMessage.includes('hey')) {
          return {
            response: `Hello! I'm ${avatarName}, your AI dojo assistant. I can help you check student information, view statistics, manage check-ins, and more. What would you like to know?`
          };
        }
        
        // Default response
        return {
          response: `I'm ${avatarName}, your AI assistant. I can help you with:\n• Finding student information\n• Checking statistics (students, revenue, leads)\n• Viewing today's check-ins and visitors\n• Checking class schedules\n• Managing waivers\n\nWhat would you like to know?`
        };
        }
      }),
  }),

  // Subscription and credits management
  // Dojo Settings API
  settings: router({
    getSettings: publicProcedure
      .query(async () => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get settings (single row with id=1)
        const result = await db.select().from(dojoSettings).limit(1);
        
        if (result.length === 0) {
          // Return default empty settings if none exist
          return {
            schoolName: '',
            contactEmail: '',
            contactPhone: '',
            website: '',
            timezone: 'America/New_York',
            instructorTitle: '',
            instructorFirstName: '',
            instructorLastName: '',
            martialArtsStyle: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'United States',
            weatherApiKey: '',
            enableWeatherAlerts: 1,
            hasOutdoorClasses: 0,
            heatIndexThreshold: 95,
            airQualityThreshold: 150,
            paymentProvider: '',
            stripeApiKey: '',
            stripePublishableKey: '',
            stripeWebhookSecret: '',
            squareAccessToken: '',
            squareLocationId: '',
            setupCompleted: 0,
          };
        }
        
        return result[0];
      }),
    
    // Alias for getSettings (used by auth system)
    getDojoSettings: publicProcedure
      .query(async () => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get settings (single row with id=1)
        const result = await db.select().from(dojoSettings).limit(1);
        
        if (result.length === 0) {
          return { setupCompleted: 0 };
        }
        
        return result[0];
      }),
    
    updateSettings: publicProcedure
      .input(z.object({
        schoolName: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        website: z.string().optional(),
        timezone: z.string().optional(),
        instructorTitle: z.string().optional(),
        instructorFirstName: z.string().optional(),
        instructorLastName: z.string().optional(),
        martialArtsStyle: z.string().optional(),
        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        weatherApiKey: z.string().optional(),
        enableWeatherAlerts: z.number().optional(),
        hasOutdoorClasses: z.number().optional(),
        heatIndexThreshold: z.number().optional(),
        airQualityThreshold: z.number().optional(),
        paymentProvider: z.string().optional(),
        stripeApiKey: z.string().optional(),
        stripePublishableKey: z.string().optional(),
        stripeWebhookSecret: z.string().optional(),
        squareAccessToken: z.string().optional(),
        squareLocationId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Check if settings exist
        const existing = await db.select().from(dojoSettings).limit(1);
        
        if (existing.length === 0) {
          // Create new settings row
          await db.insert(dojoSettings).values({
            ...input,
            setupCompleted: 0,
          });
        } else {
          // Update existing settings
          await db.update(dojoSettings)
            .set({
              ...input,
              updatedAt: new Date(),
            });
        }
        
        return {
          success: true,
          message: 'Settings updated successfully'
        };
      }),
    
    completeSetup: publicProcedure
      .mutation(async () => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Mark setup as completed
        await db.update(dojoSettings)
          .set({
            setupCompleted: 1,
            updatedAt: new Date(),
          });
        
        return {
          success: true,
          message: 'Setup completed successfully'
        };
      }),
    
    getSetupStatus: publicProcedure
      .query(async () => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const result = await db.select().from(dojoSettings).limit(1);
        
        if (result.length === 0) {
          return { completed: false };
        }
        
        return { completed: result[0].setupCompleted === 1 };
      }),
  }),

  subscription: router({
    creditsBalance: publicProcedure
      .query(async () => {
        // TODO: Implement actual credit tracking in database
        // For now, return mock data to remove the connection error
        return {
          current_balance: 10000,
          monthly_allocation: 15000,
          usage_this_month: 5000,
          reset_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
