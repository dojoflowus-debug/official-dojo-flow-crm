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
import { smsReminderRouter } from "./smsReminderRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
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
  smsReminders: smsReminderRouter,
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
            lead_score: lead.leadScore,
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
    
    // Lead Activities - Timeline
    getActivities: publicProcedure
      .input(z.object({
        leadId: z.number(),
        limit: z.number().optional().default(50),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leadActivities } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const activities = await db.select()
          .from(leadActivities)
          .where(eq(leadActivities.leadId, input.leadId))
          .orderBy(desc(leadActivities.createdAt))
          .limit(input.limit);
        
        return activities;
      }),
    
    addActivity: publicProcedure
      .input(z.object({
        leadId: z.number(),
        type: z.enum(["call", "email", "sms", "note", "status_change", "meeting", "task"]),
        title: z.string().optional(),
        content: z.string().optional(),
        previousStatus: z.string().optional(),
        newStatus: z.string().optional(),
        callDuration: z.number().optional(),
        callOutcome: z.enum(["answered", "voicemail", "no_answer", "busy", "wrong_number"]).optional(),
        isAutomated: z.boolean().optional().default(false),
        createdByName: z.string().optional(),
        metadata: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leadActivities } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const result = await db.insert(leadActivities).values({
          leadId: input.leadId,
          type: input.type,
          title: input.title,
          content: input.content,
          previousStatus: input.previousStatus,
          newStatus: input.newStatus,
          callDuration: input.callDuration,
          callOutcome: input.callOutcome,
          isAutomated: input.isAutomated ? 1 : 0,
          createdByName: input.createdByName || "System",
          metadata: input.metadata,
        });
        
        // Update lead score after adding activity
        const { updateLeadScore } = await import("./leadScoring");
        await updateLeadScore(input.leadId);
        
        return { success: true, id: result.insertId };
      }),
    
    // Lead Scoring
    getScore: publicProcedure
      .input(z.object({
        leadId: z.number(),
      }))
      .query(async ({ input }) => {
        const { calculateLeadScore, getScoreColor, getScoreLabel } = await import("./leadScoring");
        
        const score = await calculateLeadScore(input.leadId);
        return {
          score,
          color: getScoreColor(score),
          label: getScoreLabel(score),
        };
      }),
    
    recalculateScore: publicProcedure
      .input(z.object({
        leadId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { updateLeadScore, getScoreColor, getScoreLabel } = await import("./leadScoring");
        
        const score = await updateLeadScore(input.leadId);
        return {
          success: true,
          score,
          color: getScoreColor(score),
          label: getScoreLabel(score),
        };
      }),
    
    recalculateAllScores: publicProcedure
      .mutation(async () => {
        const { recalculateAllLeadScores } = await import("./leadScoring");
        
        const result = await recalculateAllLeadScores();
        return {
          success: true,
          ...result,
        };
      }),
    
    // Get all leads with scores for sorting
    getAllWithScores: publicProcedure
      .input(z.object({
        sortBy: z.enum(["score", "created", "updated"]).optional().default("created"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leads } = await import("../drizzle/schema");
        const { desc, asc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        let orderBy;
        const orderFn = input.sortOrder === "asc" ? asc : desc;
        
        switch (input.sortBy) {
          case "score":
            orderBy = orderFn(leads.leadScore);
            break;
          case "updated":
            orderBy = orderFn(leads.updatedAt);
            break;
          default:
            orderBy = orderFn(leads.createdAt);
        }
        
        const allLeads = await db.select().from(leads).orderBy(orderBy);
        
        return allLeads.map(lead => ({
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          status: lead.status,
          source: lead.source,
          leadScore: lead.leadScore,
          leadScoreUpdatedAt: lead.leadScoreUpdatedAt,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        }));
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
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        dateOfBirth: z.date().optional().nullable(),
        age: z.number().optional().nullable(),
        beltRank: z.string().optional().nullable(),
        status: z.string().optional(),
        membershipStatus: z.string().optional().nullable(),
        program: z.string().optional().nullable(),
        // Address fields
        streetAddress: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        zipCode: z.string().optional().nullable(),
        // Geocoded coordinates
        latitude: z.string().optional().nullable(),
        longitude: z.string().optional().nullable(),
        // Parent/Guardian fields
        guardianName: z.string().optional().nullable(),
        guardianRelationship: z.string().optional().nullable(),
        guardianPhone: z.string().optional().nullable(),
        guardianEmail: z.string().email().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { geocodeAddress } = await import("./geocoding");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const { id, ...updateData } = input;
        
        // Filter out undefined values to avoid overwriting with null
        const cleanedData: Record<string, any> = {};
        for (const [key, value] of Object.entries(updateData)) {
          if (value !== undefined) {
            cleanedData[key] = value;
          }
        }
        
        // Check if address fields are being updated and geocode if needed
        const hasAddressUpdate = 
          updateData.streetAddress !== undefined ||
          updateData.city !== undefined ||
          updateData.state !== undefined ||
          updateData.zipCode !== undefined;
        
        if (hasAddressUpdate) {
          // Get current student data to merge with new address
          const [currentStudent] = await db.select().from(students).where(eq(students.id, id));
          
          if (currentStudent) {
            const addressToGeocode = {
              streetAddress: updateData.streetAddress ?? currentStudent.streetAddress ?? undefined,
              city: updateData.city ?? currentStudent.city ?? undefined,
              state: updateData.state ?? currentStudent.state ?? undefined,
              zipCode: updateData.zipCode ?? currentStudent.zipCode ?? undefined,
            };
            
            // Only geocode if we have enough address info
            if (addressToGeocode.city || addressToGeocode.zipCode) {
              console.log('[Student Update] Geocoding address:', addressToGeocode);
              const geocodeResult = await geocodeAddress(addressToGeocode);
              
              if (geocodeResult) {
                cleanedData.latitude = geocodeResult.latitude;
                cleanedData.longitude = geocodeResult.longitude;
                console.log('[Student Update] Geocoded to:', geocodeResult.latitude, geocodeResult.longitude);
              }
            }
          }
        }
        
        await db.update(students).set(cleanedData).where(eq(students.id, id));
        
        return { success: true, geocoded: hasAddressUpdate };
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
    // Get all conversations for the current user
    getConversations: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const conversations = await db.select()
          .from(kaiConversations)
          .where(eq(kaiConversations.userId, ctx.user.id))
          .orderBy(desc(kaiConversations.lastMessageAt));
        
        return conversations;
      }),

    // Get messages for a specific conversation
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id)
          ))
          .limit(1);
        
        if (!conversation) throw new Error("Conversation not found");
        
        const messages = await db.select()
          .from(kaiMessages)
          .where(eq(kaiMessages.conversationId, input.conversationId))
          .orderBy(kaiMessages.createdAt);
        
        return messages;
      }),

    // Create a new conversation
    createConversation: protectedProcedure
      .input(z.object({
        title: z.string().optional(),
      }).optional())
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [result] = await db.insert(kaiConversations).values({
          userId: ctx.user.id,
          title: input?.title || "New Conversation",
        });
        
        return { id: result.insertId };
      }),

    // Add a message to a conversation
    addMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
        metadata: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id)
          ))
          .limit(1);
        
        if (!conversation) throw new Error("Conversation not found");
        
        // Insert the message
        const [result] = await db.insert(kaiMessages).values({
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
          metadata: input.metadata,
        });
        
        // Update conversation with preview and timestamp
        const preview = input.content.substring(0, 200);
        await db.update(kaiConversations)
          .set({
            preview,
            lastMessageAt: new Date(),
            // Auto-update title from first user message if still "New Conversation"
            ...(conversation.title === "New Conversation" && input.role === "user" 
              ? { title: input.content.substring(0, 50) + (input.content.length > 50 ? "..." : "") }
              : {}),
          })
          .where(eq(kaiConversations.id, input.conversationId));
        
        return { id: result.insertId };
      }),

    // Update conversation (title, status, category, priority)
    updateConversation: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        status: z.enum(["active", "archived"]).optional(),
        category: z.enum(["kai", "growth", "billing", "operations", "general"]).optional(),
        priority: z.enum(["neutral", "attention", "urgent"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { id, ...updates } = input;
        
        await db.update(kaiConversations)
          .set(updates)
          .where(and(
            eq(kaiConversations.id, id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true };
      }),

    // Delete a conversation
    deleteConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Delete messages first
        await db.delete(kaiMessages)
          .where(eq(kaiMessages.conversationId, input.id));
        
        // Delete conversation
        await db.delete(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true };
      }),

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

  // Student Portal Router
  studentPortal: router({
    // Request password reset
    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        const { getStudentByEmail, createPasswordResetToken, getStudentById } = await import("./db");
        
        // Find student by email
        const studentData = await getStudentByEmail(input.email);
        if (!studentData || !studentData.student) {
          // Don't reveal if email exists for security
          return { success: true, message: "If an account exists with this email, you will receive a password reset link." };
        }
        
        // Create reset token
        const tokenData = await createPasswordResetToken(studentData.student.id);
        if (!tokenData) {
          return { success: false, error: "Failed to create reset token" };
        }
        
        // In production, send email here. For demo, return the token.
        // The token would be sent via email with a link like:
        // /student-reset-password?token=xxx
        console.log(`Password reset token for ${input.email}: ${tokenData.token}`);
        
        return {
          success: true,
          message: "If an account exists with this email, you will receive a password reset link.",
          // For demo purposes only - remove in production
          _demoToken: tokenData.token,
          _demoExpiresAt: tokenData.expiresAt,
        };
      }),

    // Validate reset token
    validateResetToken: publicProcedure
      .input(z.object({
        token: z.string(),
      }))
      .query(async ({ input }) => {
        const { validateResetToken, getStudentById } = await import("./db");
        
        const validation = await validateResetToken(input.token);
        if (!validation.valid || !validation.studentId) {
          return { valid: false, error: validation.error };
        }
        
        // Get student info for display
        const student = await getStudentById(validation.studentId);
        
        return {
          valid: true,
          studentEmail: student?.email,
          studentName: student?.firstName,
        };
      }),

    // Reset password with token
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      }))
      .mutation(async ({ input }) => {
        const { resetStudentPassword } = await import("./db");
        return await resetStudentPassword(input.token, input.newPassword);
      }),

    // Login endpoint
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { verifyStudentLogin } = await import("./db");
        return await verifyStudentLogin(input.email, input.password);
      }),

    // Get student dashboard data
    getDashboardData: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getStudentPortalData } = await import("./db");
        const data = await getStudentPortalData(input.studentId);
        if (!data) {
          throw new Error('Student not found');
        }
        return data;
      }),

    // Get student by email (for login lookup)
    getByEmail: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .query(async ({ input }) => {
        const { getStudentByEmail } = await import("./db");
        return await getStudentByEmail(input.email);
      }),

    // Get attendance history
    getAttendanceHistory: publicProcedure
      .input(z.object({
        studentId: z.number(),
        limit: z.number().optional().default(30),
      }))
      .query(async ({ input }) => {
        const { getStudentAttendanceHistory } = await import("./db");
        return await getStudentAttendanceHistory(input.studentId, input.limit);
      }),

    // Get upcoming classes for a student
    getUpcomingClasses: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { classEnrollments, classes } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const enrollments = await db.select({
          enrollment: classEnrollments,
          class: classes
        })
          .from(classEnrollments)
          .leftJoin(classes, eq(classEnrollments.classId, classes.id))
          .where(and(
            eq(classEnrollments.studentId, input.studentId),
            eq(classEnrollments.status, 'active')
          ));
        
        return enrollments.map(e => ({
          id: e.class?.id,
          name: e.class?.name,
          time: e.class?.time,
          dayOfWeek: e.class?.dayOfWeek,
          instructor: e.class?.instructor,
          enrollmentId: e.enrollment.id
        })).filter(c => c.id);
      }),

    // Record check-in and update belt progress
    checkIn: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb, updateBeltProgressAfterCheckIn } = await import("./db");
        const { students, kioskCheckIns } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get student info
        const student = await db.select().from(students).where(eq(students.id, input.studentId)).limit(1);
        
        if (student.length === 0) {
          return { success: false, message: 'Student not found' };
        }
        
        // Record check-in
        const fullName = `${student[0].firstName} ${student[0].lastName}`;
        await db.insert(kioskCheckIns).values({
          studentId: input.studentId,
          studentName: fullName,
          timestamp: new Date(),
        });
        
        // Update belt progress
        await updateBeltProgressAfterCheckIn(input.studentId);
        
        return {
          success: true,
          message: `Checked in ${fullName}`,
          student: student[0]
        };
      }),

    // Create student account
    createAccount: publicProcedure
      .input(z.object({
        studentId: z.number(),
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        const { createStudentAccount } = await import("./db");
        const bcrypt = await import("bcryptjs");
        
        const passwordHash = await bcrypt.hash(input.password, 10);
        return await createStudentAccount(input.studentId, input.email, passwordHash);
      }),

    // ============================================
    // Belt Test Procedures
    // ============================================

    // Get upcoming belt tests for student's next belt level
    getUpcomingBeltTests: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getDb, getUpcomingBeltTests } = await import("./db");
        const { beltProgress } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { tests: [], nextBelt: null };
        
        // Get student's next belt
        const progress = await db.select().from(beltProgress).where(eq(beltProgress.studentId, input.studentId)).limit(1);
        if (progress.length === 0) {
          return { tests: [], nextBelt: null };
        }
        
        const nextBelt = progress[0].nextBelt;
        const tests = await getUpcomingBeltTests(nextBelt);
        
        return { tests, nextBelt, currentProgress: progress[0] };
      }),

    // Check eligibility for a specific belt test
    checkBeltTestEligibility: publicProcedure
      .input(z.object({
        studentId: z.number(),
        testId: z.number(),
      }))
      .query(async ({ input }) => {
        const { checkBeltTestEligibility } = await import("./db");
        return await checkBeltTestEligibility(input.studentId, input.testId);
      }),

    // Register for a belt test
    registerForBeltTest: publicProcedure
      .input(z.object({
        studentId: z.number(),
        testId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { registerForBeltTest } = await import("./db");
        return await registerForBeltTest(input.studentId, input.testId);
      }),

    // Cancel belt test registration
    cancelBeltTestRegistration: publicProcedure
      .input(z.object({
        studentId: z.number(),
        testId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { cancelBeltTestRegistration } = await import("./db");
        return await cancelBeltTestRegistration(input.studentId, input.testId);
      }),

    // Get student's belt test registrations
    getMyBeltTestRegistrations: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getStudentBeltTestRegistrations } = await import("./db");
        return await getStudentBeltTestRegistrations(input.studentId);
      }),

    // Create Stripe checkout session for belt test payment
    createBeltTestPayment: publicProcedure
      .input(z.object({
        studentId: z.number(),
        testId: z.number(),
        successUrl: z.string(),
        cancelUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { checkBeltTestEligibility, getDb } = await import("./db");
        const { createBeltTestCheckoutSession } = await import("./stripe");
        const { students, beltTests, beltProgress, beltTestRegistrations } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        // Check eligibility first
        const eligibility = await checkBeltTestEligibility(input.studentId, input.testId);
        if (!eligibility.eligible) {
          return { success: false, error: eligibility.reason };
        }
        
        const db = await getDb();
        if (!db) return { success: false, error: 'Database not available' };
        
        // Get student info
        const studentResult = await db.select().from(students).where(eq(students.id, input.studentId)).limit(1);
        if (studentResult.length === 0) {
          return { success: false, error: 'Student not found' };
        }
        const student = studentResult[0];
        
        // Get test info
        const testResult = await db.select().from(beltTests).where(eq(beltTests.id, input.testId)).limit(1);
        if (testResult.length === 0) {
          return { success: false, error: 'Belt test not found' };
        }
        const test = testResult[0];
        
        // Get belt progress
        const progressResult = await db.select().from(beltProgress).where(eq(beltProgress.studentId, input.studentId)).limit(1);
        const progress = progressResult[0];
        
        // Check if test is free
        if (!test.fee || test.fee === 0) {
          // Free registration - register directly
          await db.insert(beltTestRegistrations).values({
            testId: input.testId,
            studentId: input.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            currentBelt: progress?.currentBelt || 'White',
            attendanceAtRegistration: progress?.qualifiedAttendance || 0,
            classesAtRegistration: progress?.qualifiedClasses || 0,
            status: 'registered',
            paymentStatus: 'waived',
            amountPaid: 0,
          });
          
          // Update test registration count
          await db.update(beltTests)
            .set({ 
              currentRegistrations: test.currentRegistrations + 1,
              updatedAt: new Date()
            })
            .where(eq(beltTests.id, input.testId));
          
          return { success: true, free: true };
        }
        
        // Create Stripe checkout session
        try {
          const session = await createBeltTestCheckoutSession({
            testId: input.testId,
            testName: test.name,
            studentId: input.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            studentEmail: student.email || '',
            amount: test.fee,
            successUrl: input.successUrl,
            cancelUrl: input.cancelUrl,
          });
          
          // Create pending registration
          await db.insert(beltTestRegistrations).values({
            testId: input.testId,
            studentId: input.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            currentBelt: progress?.currentBelt || 'White',
            attendanceAtRegistration: progress?.qualifiedAttendance || 0,
            classesAtRegistration: progress?.qualifiedClasses || 0,
            status: 'registered',
            paymentStatus: 'pending',
            stripeSessionId: session.id,
            amountPaid: test.fee,
          });
          
          // Update test registration count
          await db.update(beltTests)
            .set({ 
              currentRegistrations: test.currentRegistrations + 1,
              updatedAt: new Date()
            })
            .where(eq(beltTests.id, input.testId));
          
          return { 
            success: true, 
            checkoutUrl: session.url,
            sessionId: session.id
          };
        } catch (error: any) {
          console.error('Stripe checkout error:', error);
          return { success: false, error: error.message || 'Payment processing failed' };
        }
      }),

    // Verify payment completion
    verifyBeltTestPayment: publicProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .query(async ({ input }) => {
        const { getCheckoutSession } = await import("./stripe");
        const { getDb } = await import("./db");
        const { beltTestRegistrations } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        try {
          const session = await getCheckoutSession(input.sessionId);
          
          if (session.payment_status === 'paid') {
            // Update registration payment status
            const db = await getDb();
            if (db) {
              await db.update(beltTestRegistrations)
                .set({ 
                  paymentStatus: 'paid',
                  stripePaymentIntentId: session.payment_intent as string,
                  updatedAt: new Date()
                })
                .where(eq(beltTestRegistrations.stripeSessionId, input.sessionId));
            }
            
            return { success: true, paid: true };
          }
          
          return { success: true, paid: false, status: session.payment_status };
        } catch (error: any) {
          console.error('Payment verification error:', error);
          return { success: false, error: error.message };
        }
      }),

    // ============================================
    // Messaging Procedures
    // ============================================

    // Get all messages for a student
    getMessages: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getStudentMessages } = await import("./db");
        return await getStudentMessages(input.studentId);
      }),

    // Get a single message with thread
    getMessage: publicProcedure
      .input(z.object({
        messageId: z.number(),
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getStudentMessageById, getMessageThread, markMessageAsRead } = await import("./db");
        
        // Mark as read
        await markMessageAsRead(input.messageId, input.studentId);
        
        // Get message and thread
        const message = await getStudentMessageById(input.messageId, input.studentId);
        const thread = await getMessageThread(input.messageId, input.studentId);
        
        return { message, thread };
      }),

    // Send a message (from student)
    sendMessage: publicProcedure
      .input(z.object({
        studentId: z.number(),
        subject: z.string().optional(),
        content: z.string().min(1),
        parentMessageId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { sendStudentMessage } = await import("./db");
        return await sendStudentMessage(input);
      }),

    // Get unread message count
    getUnreadCount: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getUnreadMessageCount } = await import("./db");
        return await getUnreadMessageCount(input.studentId);
      }),

    // Mark message as read
    markAsRead: publicProcedure
      .input(z.object({
        messageId: z.number(),
        studentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { markMessageAsRead } = await import("./db");
        return await markMessageAsRead(input.messageId, input.studentId);
      }),

    // Delete a message (only student's own messages)
    deleteMessage: publicProcedure
      .input(z.object({
        messageId: z.number(),
        studentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { deleteStudentMessage } = await import("./db");
        return await deleteStudentMessage(input.messageId, input.studentId);
      }),

    // ============================================
    // Multi-School Support
    // ============================================

    // Get schools a student is enrolled in
    // For now, returns the single dojo settings as the only school
    // In a multi-tenant system, this would query a student_schools junction table
    getStudentSchools: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { dojoSettings, students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { schools: [], studentName: null };
        
        // Get student info
        const studentResult = await db.select().from(students).where(eq(students.id, input.studentId)).limit(1);
        const student = studentResult[0];
        
        // Get dojo settings (single school for now)
        const settingsResult = await db.select().from(dojoSettings).limit(1);
        const settings = settingsResult[0];
        
        if (!settings) {
          return { schools: [], studentName: student?.firstName || null };
        }
        
        // Return single school based on dojo settings
        const schools = [{
          id: 1,
          name: settings.businessName || settings.schoolName || 'My Dojo',
          city: settings.city || 'Unknown',
          state: settings.state || 'Unknown',
          logoUrl: settings.logoSquare || null,
          lastAccessed: new Date(),
          isPinned: true,
        }];
        
        return { 
          schools, 
          studentName: student?.firstName || null,
          singleSchool: true // Flag indicating only one school
        };
      }),

    // Search schools for onboarding
    searchSchools: publicProcedure
      .input(z.object({
        query: z.string().min(2),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) return { schools: [] };
        
        // For now, return the single dojo if it matches the query
        const settingsResult = await db.select().from(dojoSettings).limit(1);
        const settings = settingsResult[0];
        
        if (!settings) return { schools: [] };
        
        const schoolName = settings.businessName || settings.schoolName || '';
        const query = input.query.toLowerCase();
        
        // Check if school matches query
        if (
          schoolName.toLowerCase().includes(query) ||
          (settings.city && settings.city.toLowerCase().includes(query)) ||
          (settings.zipCode && settings.zipCode.includes(query))
        ) {
          return {
            schools: [{
              id: 1,
              name: schoolName,
              address: settings.addressLine1 || '',
              city: settings.city || '',
              state: settings.state || '',
              logoUrl: settings.logoSquare || null,
            }]
          };
        }
        
        return { schools: [] };
      }),

    // Request to join a school (for new students)
    requestToJoin: publicProcedure
      .input(z.object({
        schoolId: z.number(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        dateOfBirth: z.string(),
        program: z.enum(['kids', 'teens', 'adults']),
        emergencyContactName: z.string().optional(),
        emergencyContactPhone: z.string().optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) return { success: false, error: 'Database not available' };
        
        // Age validation
        const PROGRAM_AGE_RANGES = {
          kids: { min: 4, max: 12 },
          teens: { min: 13, max: 17 },
          adults: { min: 18, max: 120 },
        };
        
        const birthDate = new Date(input.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        // Check minimum age
        if (age < PROGRAM_AGE_RANGES.kids.min) {
          return { success: false, error: `Students must be at least ${PROGRAM_AGE_RANGES.kids.min} years old to enroll` };
        }
        
        // Check age matches program
        const range = PROGRAM_AGE_RANGES[input.program];
        if (age < range.min || age > range.max) {
          return { 
            success: false, 
            error: `Age ${age} is outside the ${input.program} program range (${range.min}-${range.max} years)` 
          };
        }
        
        // Guardian required for minors (under 18)
        const isMinor = age < 18;
        if (isMinor) {
          if (!input.emergencyContactName || !input.emergencyContactName.trim()) {
            return { success: false, error: 'Parent/Guardian name is required for students under 18' };
          }
          if (!input.emergencyContactPhone || !input.emergencyContactPhone.trim()) {
            return { success: false, error: 'Parent/Guardian phone is required for students under 18' };
          }
        }
        
        try {
          // Create new student
          const result = await db.insert(students).values({
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            dateOfBirth: new Date(input.dateOfBirth),
            program: input.program,
            guardianName: input.emergencyContactName,
            guardianPhone: input.emergencyContactPhone,
            photoUrl: input.photoUrl,
            status: 'Active',
            beltRank: 'White',
            membershipStatus: 'Trial',
          });
          
          const studentId = result[0].insertId;
          
          return {
            success: true,
            studentId,
            message: `Welcome to the dojo, ${input.firstName}!`
          };
        } catch (error: any) {
          console.error('Error creating student:', error);
          return { success: false, error: error.message || 'Failed to create account' };
        }
      }),

    // Upload profile photo to S3
    uploadProfilePhoto: publicProcedure
      .input(z.object({
        // Base64 encoded image data
        imageData: z.string(),
        // MIME type (image/jpeg, image/png, etc.)
        mimeType: z.string(),
        // Optional: existing student ID for updates
        studentId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        
        try {
          // Generate unique file key
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const extension = input.mimeType.split('/')[1] || 'jpg';
          const prefix = input.studentId ? `student-${input.studentId}` : 'new-student';
          const fileKey = `profile-photos/${prefix}-${timestamp}-${randomSuffix}.${extension}`;
          
          // Convert base64 to buffer
          const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');
          
          // Upload to S3
          const { url } = await storagePut(fileKey, imageBuffer, input.mimeType);
          
          return {
            success: true,
            url,
            fileKey,
          };
        } catch (error: any) {
          console.error('Error uploading profile photo:', error);
          return { success: false, error: error.message || 'Failed to upload photo' };
        }
      }),

    // Update student photo URL in database
    updateStudentPhoto: publicProcedure
      .input(z.object({
        studentId: z.number(),
        photoUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (!db) return { success: false, error: 'Database not available' };
        
        try {
          await db.update(students)
            .set({ photoUrl: input.photoUrl })
            .where(eq(students.id, input.studentId));
          
          return { success: true };
        } catch (error: any) {
          console.error('Error updating student photo:', error);
          return { success: false, error: error.message || 'Failed to update photo' };
        }
      }),

    // Update student contact information
    updateStudentContactInfo: publicProcedure
      .input(z.object({
        studentId: z.number(),
        phone: z.string().optional(),
        guardianName: z.string().optional(),
        guardianPhone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        if (!db) return { success: false, error: 'Database not available' };
        
        // Phone validation helper
        const validatePhone = (phone: string): boolean => {
          const digits = phone.replace(/\D/g, '');
          return digits.length === 0 || digits.length === 10;
        };
        
        // Validate phone numbers
        if (input.phone && !validatePhone(input.phone)) {
          return { success: false, error: 'Phone number must be exactly 10 digits' };
        }
        if (input.guardianPhone && !validatePhone(input.guardianPhone)) {
          return { success: false, error: 'Emergency phone must be exactly 10 digits' };
        }
        
        try {
          const updateData: Record<string, string> = {};
          if (input.phone !== undefined) updateData.phone = input.phone;
          if (input.guardianName !== undefined) updateData.guardianName = input.guardianName;
          if (input.guardianPhone !== undefined) updateData.guardianPhone = input.guardianPhone;
          
          if (Object.keys(updateData).length === 0) {
            return { success: false, error: 'No fields to update' };
          }
          
          await db.update(students)
            .set(updateData)
            .where(eq(students.id, input.studentId));
          
          return { success: true };
        } catch (error: any) {
          console.error('Error updating student contact info:', error);
          return { success: false, error: error.message || 'Failed to update contact info' };
        }
      }),

    // Get waiver template for a program
    getWaiverTemplate: publicProcedure
      .input(z.object({
        programId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { waiverTemplates } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        const { getDb } = await import("./db");
        
        const db = await getDb();
        if (!db) return { waiver: null };
        
        try {
          // First try to get program-specific waiver, then fall back to default
          let waiver = null;
          
          if (input.programId) {
            const programWaivers = await db.select()
              .from(waiverTemplates)
              .where(and(
                eq(waiverTemplates.programId, input.programId),
                eq(waiverTemplates.isActive, 1)
              ))
              .limit(1);
            waiver = programWaivers[0];
          }
          
          // Fall back to default waiver (no programId)
          if (!waiver) {
            const defaultWaivers = await db.select()
              .from(waiverTemplates)
              .where(and(
                isNull(waiverTemplates.programId),
                eq(waiverTemplates.isActive, 1)
              ))
              .limit(1);
            waiver = defaultWaivers[0];
          }
          
          // If still no waiver, get any active waiver
          if (!waiver) {
            const anyWaivers = await db.select()
              .from(waiverTemplates)
              .where(eq(waiverTemplates.isActive, 1))
              .limit(1);
            waiver = anyWaivers[0];
          }
          
          return { waiver };
        } catch (error: any) {
          console.error('Error fetching waiver template:', error);
          return { waiver: null };
        }
      }),

    // Sign a waiver
    signWaiver: publicProcedure
      .input(z.object({
        studentId: z.number(),
        programId: z.number().optional(),
        waiverTemplateId: z.number(),
        signerType: z.enum(['student', 'guardian']),
        signerName: z.string(),
        signerEmail: z.string().optional(),
        signatureData: z.string(), // Base64 encoded signature image
      }))
      .mutation(async ({ input }) => {
        const { signedWaivers, programs, programEnrollments, studentDocuments, waiverTemplates } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { getDb } = await import("./db");
        
        const db = await getDb();
        if (!db) return { success: false, error: 'Database not available' };
        
        try {
          // Insert signed waiver record
          const result = await db.insert(signedWaivers).values({
            studentId: input.studentId,
            waiverTemplateId: input.waiverTemplateId,
            programId: input.programId || null,
            signerType: input.signerType,
            signerName: input.signerName,
            signerEmail: input.signerEmail || null,
            signatureData: input.signatureData,
            signedAt: new Date(),
          });
          
          const signedWaiverId = Number(result.insertId);
          
          // Get program config to determine next step
          let nextStep = 'success';
          let enrollmentId = null;
          
          if (input.programId) {
            const programResults = await db.select()
              .from(programs)
              .where(eq(programs.id, input.programId))
              .limit(1);
            const program = programResults[0];
            
            if (program) {
              // Determine enrollment type and status
              let enrollmentType: 'paid' | 'free_trial' | 'prorated_trial' | 'instructor_approval' = 'paid';
              let status: 'pending_payment' | 'pending_approval' | 'trial' | 'active' = 'pending_payment';
              
              if (program.approvalRequired) {
                enrollmentType = 'instructor_approval';
                status = 'pending_approval';
                nextStep = 'pending_approval';
              } else if (program.trialType === 'free') {
                enrollmentType = 'free_trial';
                status = 'trial';
                nextStep = 'success';
              } else if (program.trialType === 'prorated') {
                enrollmentType = 'prorated_trial';
                status = 'pending_payment';
                nextStep = 'payment';
              } else if (program.paymentRequired) {
                enrollmentType = 'paid';
                status = 'pending_payment';
                nextStep = 'payment';
              } else {
                status = 'active';
                nextStep = 'success';
              }
              
              // Create or update enrollment
              const trialStartDate = (program.trialType === 'free' || program.trialType === 'prorated') ? new Date() : null;
              const trialEndDate = trialStartDate && program.trialLengthDays 
                ? new Date(trialStartDate.getTime() + program.trialLengthDays * 24 * 60 * 60 * 1000)
                : null;
              
              const enrollmentResult = await db.insert(programEnrollments).values({
                studentId: input.studentId,
                programId: input.programId,
                status,
                enrollmentType,
                trialStartDate,
                trialEndDate,
                trialLengthDays: program.trialLengthDays || null,
                signedWaiverId,
              });
              
              enrollmentId = Number(enrollmentResult.insertId);
            }
          }
          
          // Get waiver template and student info for PDF generation
          const waiverTemplateResult = await db.select()
            .from(waiverTemplates)
            .where(eq(waiverTemplates.id, input.waiverTemplateId))
            .limit(1);
          const waiverTemplate = waiverTemplateResult[0];
          
          // Get student info for PDF
          const { students } = await import("../drizzle/schema");
          const studentResult = await db.select()
            .from(students)
            .where(eq(students.id, input.studentId))
            .limit(1);
          const student = studentResult[0];
          
          // Generate PDF with embedded signature
          let pdfUrl = '';
          let pdfKey = '';
          try {
            const { generateWaiverPdf } = await import('./pdfService');
            const isMinor = student?.dateOfBirth 
              ? (new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear()) < 18
              : false;
            
            const pdfResult = await generateWaiverPdf({
              studentId: input.studentId,
              studentName: student ? `${student.firstName} ${student.lastName}` : input.signerName,
              studentEmail: student?.email || input.signerEmail,
              studentDob: student?.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : undefined,
              waiverTitle: waiverTemplate?.title || 'Liability Waiver',
              waiverContent: waiverTemplate?.content || 'Waiver content not available.',
              signatureDataUrl: input.signatureData,
              signerName: input.signerName,
              signedAt: new Date(),
              isMinor,
              // Guardian signature would be passed separately if needed
            });
            pdfUrl = pdfResult.url;
            pdfKey = pdfResult.key;
          } catch (pdfError) {
            console.error('PDF generation failed:', pdfError);
            // Continue without PDF - signature data is still stored
          }
          
          // Create document record for the signed waiver PDF
          await db.insert(studentDocuments).values({
            studentId: input.studentId,
            documentType: 'waiver',
            title: waiverTemplate?.title || 'Liability Waiver',
            description: `Signed by ${input.signerName} on ${new Date().toLocaleDateString()}`,
            fileUrl: pdfUrl || input.signatureData, // Use PDF URL or fallback to signature data
            fileKey: pdfKey || null,
            mimeType: pdfUrl ? 'application/pdf' : 'image/png',
            fileSize: null,
            isImmutable: 1,
            relatedType: 'signed_waiver',
            relatedId: signedWaiverId,
          });
          
          return { 
            success: true, 
            signedWaiverId,
            enrollmentId,
            nextStep,
          };
        } catch (error: any) {
          console.error('Error signing waiver:', error);
          return { success: false, error: error.message || 'Failed to sign waiver' };
        }
      }),

    // Get student documents
    getStudentDocuments: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { studentDocuments } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        const { getDb } = await import("./db");
        
        const db = await getDb();
        if (!db) return { documents: [] };
        
        try {
          const docs = await db.select()
            .from(studentDocuments)
            .where(eq(studentDocuments.studentId, input.studentId))
            .orderBy(desc(studentDocuments.createdAt));
          
          return { documents: docs };
        } catch (error: any) {
          console.error('Error fetching student documents:', error);
          return { documents: [] };
        }
      }),

    // Get student enrollment status
    getEnrollmentStatus: publicProcedure
      .input(z.object({
        studentId: z.number(),
        programId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { programEnrollments } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const { getDb } = await import("./db");
        
        const db = await getDb();
        if (!db) return { enrollment: null };
        
        try {
          let query = db.select()
            .from(programEnrollments)
            .where(eq(programEnrollments.studentId, input.studentId));
          
          if (input.programId) {
            query = db.select()
              .from(programEnrollments)
              .where(and(
                eq(programEnrollments.studentId, input.studentId),
                eq(programEnrollments.programId, input.programId)
              ));
          }
          
          const enrollments = await query.orderBy(desc(programEnrollments.createdAt)).limit(1);
          const enrollment = enrollments[0];
          
          // Calculate trial days remaining if applicable
          let trialDaysRemaining = null;
          if (enrollment?.trialEndDate) {
            const now = new Date();
            const endDate = new Date(enrollment.trialEndDate);
            trialDaysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          }
          
          return { 
            enrollment,
            trialDaysRemaining,
          };
        } catch (error: any) {
          console.error('Error fetching enrollment status:', error);
          return { enrollment: null };
        }
      }),

    // Get program by ID
    getProgramById: publicProcedure
      .input(z.object({
        programId: z.number(),
      }))
      .query(async ({ input }) => {
        const { programs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { getDb } = await import("./db");
        
        const db = await getDb();
        if (!db) return { program: null };
        
        try {
          const result = await db.select()
            .from(programs)
            .where(eq(programs.id, input.programId))
            .limit(1);
          
          return { program: result[0] || null };
        } catch (error: any) {
          console.error('Error fetching program:', error);
          return { program: null };
        }
      }),

    // Create enrollment checkout session
    createEnrollmentCheckout: publicProcedure
      .input(z.object({
        studentId: z.number(),
        programId: z.number(),
        enrollmentId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { programs, students, programEnrollments } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { getDb } = await import("./db");
        const Stripe = (await import("stripe")).default;
        
        const db = await getDb();
        if (!db) return { success: false, error: 'Database not available' };
        
        try {
          // Get student and program info
          const studentResult = await db.select().from(students).where(eq(students.id, input.studentId)).limit(1);
          const student = studentResult[0];
          if (!student) return { success: false, error: 'Student not found' };
          
          const programResult = await db.select().from(programs).where(eq(programs.id, input.programId)).limit(1);
          const program = programResult[0];
          if (!program) return { success: false, error: 'Program not found' };
          
          // If program is free or doesn't require payment, skip checkout
          if (!program.paymentRequired || program.trialType === 'free') {
            // Update enrollment status to active/trial
            if (input.enrollmentId) {
              await db.update(programEnrollments)
                .set({ status: program.trialType === 'free' ? 'trial' : 'active' })
                .where(eq(programEnrollments.id, input.enrollmentId));
            }
            return { success: true, nextStep: 'success' };
          }
          
          // Calculate amount
          const monthlyPrice = program.monthlyPrice || 0;
          const trialDays = program.trialLengthDays || 0;
          const isProrated = program.trialType === 'prorated';
          const amount = isProrated && trialDays > 0 
            ? Math.round((monthlyPrice / 30) * trialDays) 
            : monthlyPrice;
          
          // Create Stripe checkout session
          const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
          if (!stripeSecretKey) {
            return { success: false, error: 'Payment system not configured' };
          }
          
          const stripe = new Stripe(stripeSecretKey);
          
          const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [{
              price_data: {
                currency: 'usd',
                product_data: {
                  name: program.name,
                  description: isProrated 
                    ? `${trialDays}-day prorated trial` 
                    : 'Monthly membership',
                },
                unit_amount: amount,
              },
              quantity: 1,
            }],
            customer_email: student.email || undefined,
            metadata: {
              studentId: input.studentId.toString(),
              programId: input.programId.toString(),
              enrollmentId: input.enrollmentId?.toString() || '',
              type: 'enrollment',
            },
            success_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/student-onboarding-success?studentId=${input.studentId}&enrollmentId=${input.enrollmentId || ''}`,
            cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/student-payment?studentId=${input.studentId}&programId=${input.programId}&enrollmentId=${input.enrollmentId || ''}`,
          });
          
          return { 
            success: true, 
            checkoutUrl: session.url,
            sessionId: session.id,
          };
        } catch (error: any) {
          console.error('Error creating checkout session:', error);
          return { success: false, error: error.message || 'Failed to create checkout session' };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
