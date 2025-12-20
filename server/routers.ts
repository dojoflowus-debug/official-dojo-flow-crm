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
import { kioskDirectRouter } from "./kioskDirectRouter";
import { kioskSettingsRouter } from "./kioskSettingsRouter";
import { kioskRouter } from "./kioskRouter";
import { membershipPlansRouter } from "./membershipPlansRouter";
import { classEntitlementsRouter } from "./classEntitlementsRouter";
import { oneTimeFeesRouter } from "./oneTimeFeesRouter";
import { discountsRouter } from "./discountsRouter";
import { addOnsRouter } from "./addOnsRouter";
import { merchandiseRouter } from "./merchandiseRouter";
import { kaiDataRouter } from "./kaiDataRouter";
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
  
  // File upload for attachments
  upload: router({
    // Upload a file attachment (image or document)
    uploadAttachment: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 data URL
        fileType: z.string(), // MIME type
        fileSize: z.number(), // Size in bytes
        context: z.enum(['kai-command', 'message', 'general']).default('general'),
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import("./storage");
        
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (input.fileSize > maxSize) {
          throw new Error('File size exceeds 10MB limit');
        }
        
        // Validate file type
        const allowedTypes = [
          // Images
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
          // Documents
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          // Spreadsheets
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
          'application/vnd.ms-excel', // xls
          'text/csv', // csv
          'application/octet-stream', // fallback for xlsx when browser doesn't detect type
        ];
        
        // Also check by file extension for xlsx files that may have wrong MIME type
        const isSpreadsheetByExtension = 
          input.fileName.toLowerCase().endsWith('.xlsx') ||
          input.fileName.toLowerCase().endsWith('.xls') ||
          input.fileName.toLowerCase().endsWith('.csv');
        
        if (!allowedTypes.includes(input.fileType) && !isSpreadsheetByExtension) {
          throw new Error(`File type not supported: ${input.fileType}. Allowed: images (jpg, png, gif, webp), documents (pdf, doc, docx, txt), and spreadsheets (xlsx, xls, csv)`);
        }
        
        // Extract base64 data from data URL
        const base64Match = input.fileData.match(/^data:[^;]+;base64,(.+)$/);
        if (!base64Match) {
          throw new Error('Invalid file data format');
        }
        
        const buffer = Buffer.from(base64Match[1], 'base64');
        
        // Generate unique key with timestamp and random suffix
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const userId = ctx.user?.id || 'anonymous';
        const key = `attachments/${input.context}/${userId}/${timestamp}-${randomSuffix}-${sanitizedFileName}`;
        
        // Upload to S3
        const result = await storagePut(key, buffer, input.fileType);
        
        return {
          success: true,
          url: result.url,
          key: result.key,
          fileName: input.fileName,
          fileType: input.fileType,
          fileSize: input.fileSize,
        };
      }),
    
    // Get allowed file types
    getAllowedTypes: publicProcedure
      .query(() => {
        return {
          images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
          documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
          spreadsheets: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'],
          maxSize: 10 * 1024 * 1024, // 10MB
          maxSizeLabel: '10MB',
        };
      }),
  }),
  setupWizard: setupWizardRouter,
  kioskDirect: kioskDirectRouter,
  kioskSettings: kioskSettingsRouter,
  kiosk: kioskRouter,
  billing: billingRouter,
  membershipPlans: membershipPlansRouter,
  classEntitlements: classEntitlementsRouter,
  oneTimeFees: oneTimeFeesRouter,
  discounts: discountsRouter,
  addOns: addOnsRouter,
  merchandise: merchandiseRouter,
  kaiData: kaiDataRouter,
  webhook: webhookRouter,
  campaigns: campaignsRouter,
  automation: automationRouter,
  conversations: conversationsRouter,
  smsReminders: smsReminderRouter,
  auth: router({
    // User profile endpoint
    getCurrentUser: authRouter.getCurrentUser,
    
    // Kiosk settings endpoint (uses raw mysql2 to bypass Drizzle connection issues)
    getKioskSettings: publicProcedure.query(async () => {
      try {
        const mysql = await import('mysql2/promise');
        const connection = await mysql.default.createConnection(process.env.DATABASE_URL!);
        
        const [rows] = await connection.execute<mysql.RowDataPacket[]>(
          'SELECT businessName, logoSquare FROM dojo_settings LIMIT 1'
        );
        
        await connection.end();
        
        if (rows.length === 0) {
          return {
            businessName: 'DojoFlow',
            logoSquare: null,
          };
        }
        
        return {
          businessName: rows[0].businessName || 'DojoFlow',
          logoSquare: rows[0].logoSquare || null,
        };
      } catch (error) {
        console.error('[Kiosk Settings] Database error:', error);
        return {
          businessName: 'DojoFlow',
          logoSquare: null,
        };
      }
    }),
    
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
    
    // Get all staff members for mention dropdown
    getAll: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        limit: z.number().optional().default(10),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { teamMembers } = await import("../drizzle/schema");
        const { eq, like, or, sql } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { staff: [] };
        
        let query = db.select().from(teamMembers).where(eq(teamMembers.isActive, 1));
        
        if (input.search && input.search.length > 0) {
          const searchPattern = `%${input.search}%`;
          query = db.select().from(teamMembers).where(
            sql`${teamMembers.isActive} = 1 AND (${teamMembers.name} LIKE ${searchPattern} OR ${teamMembers.addressAs} LIKE ${searchPattern} OR ${teamMembers.role} LIKE ${searchPattern})`
          );
        }
        
        const staff = await query.limit(input.limit);
        
        return {
          staff: staff.map(s => ({
            id: s.id,
            name: s.addressAs || s.name,
            fullName: s.name,
            role: s.role.charAt(0).toUpperCase() + s.role.slice(1).replace('_', ' '),
            email: s.email,
            photoUrl: s.photoUrl || null,
          }))
        };
      }),
    
    // Update staff member photo
    updatePhoto: publicProcedure
      .input(z.object({
        id: z.number(),
        photoUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { teamMembers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.update(teamMembers)
          .set({ photoUrl: input.photoUrl })
          .where(eq(teamMembers.id, input.id));
        
        return { success: true };
      }),
    
    // Get single staff member by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { teamMembers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return null;
        
        const [staff] = await db.select().from(teamMembers).where(eq(teamMembers.id, input.id));
        if (!staff) return null;
        
        return {
          id: staff.id,
          name: staff.name,
          addressAs: staff.addressAs,
          role: staff.role,
          email: staff.email,
          phone: staff.phone,
          photoUrl: staff.photoUrl,
          focusAreas: staff.focusAreas,
          isActive: staff.isActive,
        };
      }),

    // Get active instructors for class assignment dropdown
    getInstructors: publicProcedure
      .query(async () => {
        const { getDb } = await import("./db");
        const { teamMembers } = await import("../drizzle/schema");
        const { eq, and, or, sql } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { instructors: [] };
        
        // Get active team members who are instructors, coaches, trainers, or assistants
        const instructorRoles = ['instructor', 'coach', 'trainer', 'assistant', 'owner', 'manager'];
        const instructors = await db.select({
          id: teamMembers.id,
          name: teamMembers.name,
          addressAs: teamMembers.addressAs,
          role: teamMembers.role,
          photoUrl: teamMembers.photoUrl,
          email: teamMembers.email,
        }).from(teamMembers).where(
          sql`${teamMembers.isActive} = 1 AND ${teamMembers.role} IN ('instructor', 'coach', 'trainer', 'assistant', 'owner', 'manager')`
        );
        
        return {
          instructors: instructors.map(i => ({
            id: i.id,
            name: i.addressAs || i.name,
            fullName: i.name,
            role: i.role.charAt(0).toUpperCase() + i.role.slice(1).replace('_', ' '),
            photoUrl: i.photoUrl || null,
            email: i.email,
          }))
        };
      }),
  }),

  // Classes router for class-related operations
  classes: router({
    // Get students enrolled in a specific class
    getEnrolledStudents: publicProcedure
      .input(z.object({
        classId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { classEnrollments, students } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return [];
        
        const enrollments = await db.select({
          studentId: classEnrollments.studentId,
          student: students
        })
          .from(classEnrollments)
          .leftJoin(students, eq(classEnrollments.studentId, students.id))
          .where(and(
            eq(classEnrollments.classId, input.classId),
            eq(classEnrollments.status, 'active')
          ));
        
        return enrollments.map(e => ({
          id: e.student?.id,
          firstName: e.student?.firstName,
          lastName: e.student?.lastName,
          program: e.student?.program,
          photoUrl: e.student?.photoUrl
        })).filter(s => s.id);
      }),
  }),

  // Messaging router for @mentions and directed messages
  messaging: router({
    // Get classes for mention dropdown (bulk messaging)
    getClassesForMention: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        limit: z.number().optional().default(5),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { classes, classEnrollments } = await import("../drizzle/schema");
        const { eq, like, sql } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { classes: [] };
        
        // Get classes with student counts
        let query;
        if (input.search && input.search.length > 0) {
          const searchPattern = `%${input.search}%`;
          query = db.select({
            id: classes.id,
            name: classes.name,
            schedule: classes.schedule,
            studentCount: sql<number>`(SELECT COUNT(*) FROM class_enrollments WHERE class_enrollments.classId = ${classes.id})`,
          }).from(classes).where(like(classes.name, searchPattern));
        } else {
          query = db.select({
            id: classes.id,
            name: classes.name,
            schedule: classes.schedule,
            studentCount: sql<number>`(SELECT COUNT(*) FROM class_enrollments WHERE class_enrollments.classId = ${classes.id})`,
          }).from(classes);
        }
        
        const result = await query.limit(input.limit);
        
        return {
          classes: result.map(c => ({
            id: c.id,
            name: c.name,
            schedule: c.schedule || '',
            studentCount: Number(c.studentCount) || 0,
          }))
        };
      }),
    
    // Send a directed message from @mention
    sendDirectedMessage: protectedProcedure
      .input(z.object({
        recipientType: z.enum(['student', 'staff', 'group']),
        recipientId: z.number(),
        content: z.string().min(1),
        subject: z.string().optional(),
        sourceConversationId: z.number().optional(),
        sourceMessageId: z.number().optional(),
        kaiMentioned: z.boolean().default(false),
        attachments: z.array(z.object({
          url: z.string(),
          name: z.string(),
          type: z.string(),
          size: z.number(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { directedMessages, studentMessages, staffMessages } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const senderName = ctx.user?.name || 'Unknown';
        const senderId = ctx.user?.id || 0;
        
        // Create the directed message record
        const [directedMsg] = await db.insert(directedMessages).values({
          recipientType: input.recipientType,
          recipientId: input.recipientId,
          senderId,
          senderName,
          content: input.content,
          subject: input.subject,
          sourceConversationId: input.sourceConversationId,
          sourceMessageId: input.sourceMessageId,
          kaiMentioned: input.kaiMentioned ? 1 : 0,
          attachments: input.attachments ? JSON.stringify(input.attachments) : null,
          label: 'message',
        }).$returningId();
        
        // Also create a record in the appropriate inbox table
        if (input.recipientType === 'student') {
          await db.insert(studentMessages).values({
            studentId: input.recipientId,
            senderType: 'staff',
            senderId,
            senderName,
            subject: input.subject || 'New Message',
            content: input.content,
          });
        } else if (input.recipientType === 'staff') {
          await db.insert(staffMessages).values({
            staffId: input.recipientId,
            senderType: 'staff',
            senderId,
            senderName,
            subject: input.subject || 'New Message',
            content: input.content,
            attachments: input.attachments ? JSON.stringify(input.attachments) : null,
          });
        }
        
        return {
          success: true,
          messageId: directedMsg.id,
          kaiShouldRespond: input.kaiMentioned,
        };
      }),
    
    // Get staff inbox messages
    getStaffInbox: protectedProcedure
      .input(z.object({
        staffId: z.number().optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { staffMessages } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { messages: [], total: 0 };
        
        // Use provided staffId or try to get from user context
        const staffId = input.staffId;
        if (!staffId) return { messages: [], total: 0 };
        
        const messages = await db.select()
          .from(staffMessages)
          .where(eq(staffMessages.staffId, staffId))
          .orderBy(desc(staffMessages.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        return {
          messages,
          total: messages.length,
        };
      }),
    
    // Mark staff message as read
    markStaffMessageRead: protectedProcedure
      .input(z.object({
        messageId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { staffMessages } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.update(staffMessages)
          .set({ isRead: 1, readAt: new Date() })
          .where(eq(staffMessages.id, input.messageId));
        
        return { success: true };
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

    createNewStudentIntake: publicProcedure
      .input(z.object({
        schoolId: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        dateOfBirth: z.string(),
        parentGuardianName: z.string(),
        phoneNumber: z.string(),
        email: z.string().optional(),
        interests: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leads } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Create a new lead/student record flagged as "Kiosk Intake"
        const [newLead] = await db.insert(leads).values({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email || '',
          phone: input.phoneNumber,
          status: 'New Lead',
          source: 'Kiosk Intake',
          notes: `Date of Birth: ${input.dateOfBirth}\nParent/Guardian: ${input.parentGuardianName}${input.interests && input.interests.length > 0 ? `\nInterests: ${input.interests.join(', ')}` : ''}`,
          createdAt: new Date(),
        }).returning();
        
        return {
          success: true,
          leadId: newLead.id,
          message: 'Thank you! Our staff will finish your enrollment.'
        };
      }),
      
    // Theme Management
    getThemePresets: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { kioskThemePresets } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const presets = await db.select().from(kioskThemePresets).where(eq(kioskThemePresets.isActive, 1));
      return { presets };
    }),
    
    getSettings: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { kioskSettings } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get settings for default school (id=1)
      const settings = await db.select().from(kioskSettings).where(eq(kioskSettings.schoolId, 1)).limit(1);
      
      if (settings.length === 0) {
        // Create default settings if none exist
        const [newSettings] = await db.insert(kioskSettings).values({
          schoolId: 1,
          activeThemeId: 1, // Default theme
          backgroundBlur: 5,
          backgroundOpacity: 80,
        }).returning();
        return { settings: newSettings };
      }
      
      return { settings: settings[0] };
    }),
    
    updateSettings: publicProcedure
      .input(z.object({
        activeThemeId: z.number().optional(),
        customConfig: z.any().optional(),
        welcomeHeadline: z.string().max(50).optional(),
        welcomeSubtext: z.string().max(100).optional(),
        accentColor: z.string().max(7).optional(),
        logoLight: z.string().optional(),
        logoDark: z.string().optional(),
        backgroundBlur: z.number().min(0).max(100).optional(),
        backgroundOpacity: z.number().min(0).max(100).optional(),
        scheduledThemeStartDate: z.string().optional(),
        scheduledThemeEndDate: z.string().optional(),
        revertToThemeId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { kioskSettings } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Check if settings exist
        const existing = await db.select().from(kioskSettings).where(eq(kioskSettings.schoolId, 1)).limit(1);
        
        const updateData: any = {};
        if (input.activeThemeId !== undefined) updateData.activeThemeId = input.activeThemeId;
        if (input.customConfig !== undefined) updateData.customConfig = input.customConfig;
        if (input.welcomeHeadline !== undefined) updateData.welcomeHeadline = input.welcomeHeadline;
        if (input.welcomeSubtext !== undefined) updateData.welcomeSubtext = input.welcomeSubtext;
        if (input.accentColor !== undefined) updateData.accentColor = input.accentColor;
        if (input.logoLight !== undefined) updateData.logoLight = input.logoLight;
        if (input.logoDark !== undefined) updateData.logoDark = input.logoDark;
        if (input.backgroundBlur !== undefined) updateData.backgroundBlur = input.backgroundBlur;
        if (input.backgroundOpacity !== undefined) updateData.backgroundOpacity = input.backgroundOpacity;
        if (input.scheduledThemeStartDate) updateData.scheduledThemeStartDate = new Date(input.scheduledThemeStartDate);
        if (input.scheduledThemeEndDate) updateData.scheduledThemeEndDate = new Date(input.scheduledThemeEndDate);
        if (input.revertToThemeId !== undefined) updateData.revertToThemeId = input.revertToThemeId;
        
        if (existing.length > 0) {
          // Update existing settings
          await db.update(kioskSettings).set(updateData).where(eq(kioskSettings.schoolId, 1));
        } else {
          // Create new settings
          await db.insert(kioskSettings).values({
            schoolId: 1,
            ...updateData,
          });
        }
        
        return { success: true, message: 'Kiosk settings updated successfully' };
      }),
      
    getActiveTheme: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { kioskSettings, kioskThemePresets } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get current settings
      const settings = await db.select().from(kioskSettings).where(eq(kioskSettings.schoolId, 1)).limit(1);
      
      if (settings.length === 0 || !settings[0].activeThemeId) {
        // Return default theme
        const defaultTheme = await db.select().from(kioskThemePresets).where(eq(kioskThemePresets.id, 1)).limit(1);
        return { theme: defaultTheme[0] || null, settings: null };
      }
      
      // Check if scheduled theme should be active
      const now = new Date();
      const setting = settings[0];
      
      if (setting.scheduledThemeStartDate && setting.scheduledThemeEndDate) {
        const startDate = new Date(setting.scheduledThemeStartDate);
        const endDate = new Date(setting.scheduledThemeEndDate);
        
        if (now >= startDate && now <= endDate) {
          // Scheduled theme is active
          const theme = await db.select().from(kioskThemePresets).where(eq(kioskThemePresets.id, setting.activeThemeId)).limit(1);
          return { theme: theme[0] || null, settings: setting };
        } else if (now > endDate && setting.revertToThemeId) {
          // Scheduled theme expired, revert to default
          await db.update(kioskSettings)
            .set({ 
              activeThemeId: setting.revertToThemeId,
              scheduledThemeStartDate: null,
              scheduledThemeEndDate: null,
            })
            .where(eq(kioskSettings.schoolId, 1));
          
          const theme = await db.select().from(kioskThemePresets).where(eq(kioskThemePresets.id, setting.revertToThemeId)).limit(1);
          return { theme: theme[0] || null, settings: setting };
        }
      }
      
      // Return active theme
      const theme = await db.select().from(kioskThemePresets).where(eq(kioskThemePresets.id, setting.activeThemeId)).limit(1);
      return { theme: theme[0] || null, settings: setting };
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
      
    lookupByEmail: publicProcedure
      .input(z.object({
        email: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq, like } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Search for student by email
        const result = await db.select().from(students).where(like(students.email, `%${input.email}%`)).limit(1);
        
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
    
    // Add a note to a student's profile
    addNote: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        content: z.string(),
        noteType: z.enum(['manual', 'extraction', 'action_item', 'follow_up']).default('manual'),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        sourceConversationId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { studentNotes, students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Verify student exists
        const student = await db.select().from(students).where(eq(students.id, input.studentId)).limit(1);
        if (student.length === 0) {
          throw new Error('Student not found');
        }
        
        // Insert the note
        const result = await db.insert(studentNotes).values({
          studentId: input.studentId,
          content: input.content,
          noteType: input.noteType,
          priority: input.priority || 'medium',
          createdById: ctx.user.id,
          createdByName: ctx.user.name || 'Unknown',
          sourceConversationId: input.sourceConversationId || null,
        });
        
        return { 
          success: true, 
          noteId: result.insertId,
          studentName: `${student[0].firstName} ${student[0].lastName}`
        };
      }),
    
    // Get notes for a student
    getNotes: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { studentNotes } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const notes = await db.select()
          .from(studentNotes)
          .where(eq(studentNotes.studentId, input.studentId))
          .orderBy(desc(studentNotes.createdAt));
        
        return notes;
      }),
    
    // Mark a note as completed
    completeNote: protectedProcedure
      .input(z.object({
        noteId: z.number(),
        isCompleted: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { studentNotes } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.update(studentNotes)
          .set({ 
            isCompleted: input.isCompleted ? 1 : 0,
            completedAt: input.isCompleted ? new Date() : null
          })
          .where(eq(studentNotes.id, input.noteId));
        
        return { success: true };
      }),
  }),

  kai: router({
    // Get all conversations for the current user (excludes soft-deleted)
    getConversations: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, desc, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Filter out soft-deleted conversations (deletedAt is null)
        const conversations = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
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
          participantIds: JSON.stringify([ctx.user.id]),
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

    // Soft-delete a conversation (sets deletedAt timestamp)
    deleteConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation and it's not already deleted
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found or already deleted");
        }
        
        // Soft-delete by setting deletedAt timestamp
        await db.update(kaiConversations)
          .set({ deletedAt: new Date() })
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true, id: input.id };
      }),

    // Archive a conversation (sets status to 'archived')
    archiveConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation and it's not deleted
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found or deleted");
        }
        
        // Archive by setting status to 'archived'
        await db.update(kaiConversations)
          .set({ status: 'archived' })
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true, id: input.id };
      }),

    // Unarchive a conversation (sets status back to 'active')
    unarchiveConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation and it's not deleted
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found or deleted");
        }
        
        // Unarchive by setting status back to 'active'
        await db.update(kaiConversations)
          .set({ status: 'active' })
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true, id: input.id };
      }),

    // Rename a conversation
    renameConversation: protectedProcedure
      .input(z.object({ id: z.number(), title: z.string().min(1).max(500) }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation and it's not deleted
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found or deleted");
        }
        
        // Update the title
        await db.update(kaiConversations)
          .set({ title: input.title.trim() })
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true, id: input.id, title: input.title.trim() };
      }),

    // Summarize a conversation using AI
    summarizeConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        const { invokeLLM } = await import("./_core/llm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found");
        }
        
        // Get all messages in the conversation
        const messages = await db.select()
          .from(kaiMessages)
          .where(eq(kaiMessages.conversationId, input.conversationId))
          .orderBy(kaiMessages.createdAt);
        
        if (messages.length === 0) {
          throw new Error("No messages to summarize");
        }
        
        // Format messages for LLM
        const messageHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'Kai'}: ${m.content}`).join('\n\n');
        
        // Generate summary using LLM
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are an executive assistant for a martial arts dojo. Generate a concise executive summary of the following conversation. Focus on:
- Key topics discussed
- Important decisions or conclusions
- Action items mentioned
- Any concerns or issues raised

Format the summary with clear sections and bullet points where appropriate. Keep it professional and actionable.`
            },
            {
              role: 'user',
              content: `Please summarize this conversation:\n\n${messageHistory}`
            }
          ]
        });
        
        const summary = response.choices[0]?.message?.content || 'Unable to generate summary';
        
        // Save summary as a Kai message in the conversation
        const [savedMessage] = await db.insert(kaiMessages).values({
          conversationId: input.conversationId,
          role: 'assistant',
          content: `## 📋 Conversation Summary\n\n${summary}`,
          metadata: JSON.stringify({ type: 'summary', generatedAt: new Date().toISOString() })
        });
        
        // Update conversation last message
        await db.update(kaiConversations)
          .set({ 
            preview: 'Conversation Summary generated',
            lastMessageAt: new Date()
          })
          .where(eq(kaiConversations.id, input.conversationId));
        
        return { 
          success: true, 
          summary,
          messageId: savedMessage.insertId
        };
      }),

    // Extract structured data from a conversation using AI
    extractConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        const { invokeLLM } = await import("./_core/llm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found");
        }
        
        // Get all messages in the conversation
        const messages = await db.select()
          .from(kaiMessages)
          .where(eq(kaiMessages.conversationId, input.conversationId))
          .orderBy(kaiMessages.createdAt);
        
        if (messages.length === 0) {
          throw new Error("No messages to extract from");
        }
        
        // Format messages for LLM
        const messageHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'Kai'}: ${m.content}`).join('\n\n');
        
        // Extract structured data using LLM with JSON schema
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are an executive assistant for a martial arts dojo. Extract structured data from the conversation. Identify and categorize:

1. **Action Items**: Tasks that need to be completed
2. **Follow-ups**: Items that require follow-up communication or checking
3. **Decisions**: Any decisions that were made during the conversation
4. **Mentioned Students**: Names of any students mentioned (with context)
5. **Mentioned Staff**: Names of any staff/instructors mentioned (with context)
6. **Key Dates/Deadlines**: Any dates or deadlines mentioned
7. **Financial Items**: Any billing, payment, or financial matters discussed

Return the data as a structured JSON object.`
            },
            {
              role: 'user',
              content: `Please extract structured data from this conversation:\n\n${messageHistory}`
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'conversation_extraction',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  actionItems: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        task: { type: 'string' },
                        priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                        assignee: { type: 'string' }
                      },
                      required: ['task', 'priority', 'assignee'],
                      additionalProperties: false
                    }
                  },
                  followUps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        item: { type: 'string' },
                        deadline: { type: 'string' }
                      },
                      required: ['item', 'deadline'],
                      additionalProperties: false
                    }
                  },
                  decisions: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  mentionedStudents: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        context: { type: 'string' }
                      },
                      required: ['name', 'context'],
                      additionalProperties: false
                    }
                  },
                  mentionedStaff: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        context: { type: 'string' }
                      },
                      required: ['name', 'context'],
                      additionalProperties: false
                    }
                  },
                  keyDates: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        date: { type: 'string' },
                        description: { type: 'string' }
                      },
                      required: ['date', 'description'],
                      additionalProperties: false
                    }
                  },
                  financialItems: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['actionItems', 'followUps', 'decisions', 'mentionedStudents', 'mentionedStaff', 'keyDates', 'financialItems'],
                additionalProperties: false
              }
            }
          }
        });
        
        let extractedData;
        try {
          extractedData = JSON.parse(response.choices[0]?.message?.content || '{}');
        } catch {
          extractedData = {
            actionItems: [],
            followUps: [],
            decisions: [],
            mentionedStudents: [],
            mentionedStaff: [],
            keyDates: [],
            financialItems: []
          };
        }
        
        // Format extracted data as readable message
        let formattedContent = '## 📊 Conversation Extraction\n\n';
        
        if (extractedData.actionItems?.length > 0) {
          formattedContent += '### ✅ Action Items\n';
          extractedData.actionItems.forEach((item: any) => {
            const priorityEmoji = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
            formattedContent += `- ${priorityEmoji} **${item.task}** (Assigned: ${item.assignee})\n`;
          });
          formattedContent += '\n';
        }
        
        if (extractedData.followUps?.length > 0) {
          formattedContent += '### 📞 Follow-ups\n';
          extractedData.followUps.forEach((item: any) => {
            formattedContent += `- ${item.item} (Due: ${item.deadline})\n`;
          });
          formattedContent += '\n';
        }
        
        if (extractedData.decisions?.length > 0) {
          formattedContent += '### 🎯 Decisions\n';
          extractedData.decisions.forEach((item: string) => {
            formattedContent += `- ${item}\n`;
          });
          formattedContent += '\n';
        }
        
        if (extractedData.mentionedStudents?.length > 0) {
          formattedContent += '### 👤 Mentioned Students\n';
          
          // Look up student IDs for each mentioned student
          const { students } = await import("../drizzle/schema");
          const { like, or } = await import("drizzle-orm");
          
          for (const item of extractedData.mentionedStudents) {
            // Try to find the student in the database
            const nameParts = item.name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            let studentId = null;
            let studentMatch = null;
            
            if (firstName) {
              const matchingStudents = await db.select()
                .from(students)
                .where(or(
                  like(students.firstName, `%${firstName}%`),
                  like(students.lastName, `%${lastName || firstName}%`)
                ))
                .limit(1);
              
              if (matchingStudents.length > 0) {
                studentMatch = matchingStudents[0];
                studentId = studentMatch.id;
              }
            }
            
            // Add to formatted content with student ID for Save to Card button
            if (studentId) {
              formattedContent += `- **${item.name}** [STUDENT_ID:${studentId}]: ${item.context}\n`;
              // Store the student ID in the extracted data for frontend use
              item.studentId = studentId;
              item.fullName = `${studentMatch?.firstName} ${studentMatch?.lastName}`;
            } else {
              formattedContent += `- **${item.name}**: ${item.context}\n`;
            }
          }
          formattedContent += '\n';
        }
        
        if (extractedData.mentionedStaff?.length > 0) {
          formattedContent += '### 👥 Mentioned Staff\n';
          extractedData.mentionedStaff.forEach((item: any) => {
            formattedContent += `- **${item.name}**: ${item.context}\n`;
          });
          formattedContent += '\n';
        }
        
        if (extractedData.keyDates?.length > 0) {
          formattedContent += '### 📅 Key Dates\n';
          extractedData.keyDates.forEach((item: any) => {
            formattedContent += `- **${item.date}**: ${item.description}\n`;
          });
          formattedContent += '\n';
        }
        
        if (extractedData.financialItems?.length > 0) {
          formattedContent += '### 💰 Financial Items\n';
          extractedData.financialItems.forEach((item: string) => {
            formattedContent += `- ${item}\n`;
          });
          formattedContent += '\n';
        }
        
        // Check if anything was extracted
        const hasContent = Object.values(extractedData).some((arr: any) => arr?.length > 0);
        if (!hasContent) {
          formattedContent += '_No structured data could be extracted from this conversation._\n';
        }
        
        // Save extraction as a Kai message in the conversation
        const [savedMessage] = await db.insert(kaiMessages).values({
          conversationId: input.conversationId,
          role: 'assistant',
          content: formattedContent,
          metadata: JSON.stringify({ 
            type: 'extraction', 
            extractedData,
            generatedAt: new Date().toISOString() 
          })
        });
        
        // Update conversation last message
        await db.update(kaiConversations)
          .set({ 
            preview: 'Conversation data extracted',
            lastMessageAt: new Date()
          })
          .where(eq(kaiConversations.id, input.conversationId));
        
        return { 
          success: true, 
          extractedData,
          formattedContent,
          messageId: savedMessage.insertId
        };
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

    // Export conversation history
    exportConversations: protectedProcedure
      .input(z.object({
        conversationId: z.number().optional(), // If provided, export single conversation; otherwise export all
        format: z.enum(["json", "markdown", "csv"]).default("json"),
      }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, desc, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Get conversations
        let conversations;
        if (input.conversationId) {
          // Export single conversation
          conversations = await db.select()
            .from(kaiConversations)
            .where(and(
              eq(kaiConversations.id, input.conversationId),
              eq(kaiConversations.userId, ctx.user.id),
              isNull(kaiConversations.deletedAt)
            ))
            .limit(1);
        } else {
          // Export all conversations
          conversations = await db.select()
            .from(kaiConversations)
            .where(and(
              eq(kaiConversations.userId, ctx.user.id),
              isNull(kaiConversations.deletedAt)
            ))
            .orderBy(desc(kaiConversations.lastMessageAt));
        }
        
        if (conversations.length === 0) {
          throw new Error("No conversations found");
        }
        
        // Get messages for each conversation
        const exportData = [];
        for (const conversation of conversations) {
          const messages = await db.select()
            .from(kaiMessages)
            .where(eq(kaiMessages.conversationId, conversation.id))
            .orderBy(kaiMessages.createdAt);
          
          exportData.push({
            conversation,
            messages,
          });
        }
        
        // Format based on requested format
        let content: string;
        let filename: string;
        let mimeType: string;
        
        if (input.format === "json") {
          content = JSON.stringify(exportData, null, 2);
          filename = input.conversationId 
            ? `kai-conversation-${input.conversationId}.json`
            : `kai-conversations-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = "application/json";
        } else if (input.format === "markdown") {
          content = exportData.map(({ conversation, messages }) => {
            let md = `# ${conversation.title}\n\n`;
            md += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
            md += `**Last Message:** ${new Date(conversation.lastMessageAt).toLocaleString()}\n`;
            md += `**Status:** ${conversation.status}\n`;
            md += `**Category:** ${conversation.category}\n\n`;
            md += `---\n\n`;
            
            messages.forEach(msg => {
              md += `### ${msg.role === 'user' ? '👤 User' : '🤖 Kai'}\n`;
              md += `*${new Date(msg.createdAt).toLocaleString()}*\n\n`;
              md += `${msg.content}\n\n`;
            });
            
            return md;
          }).join('\n\n---\n\n');
          
          filename = input.conversationId
            ? `kai-conversation-${input.conversationId}.md`
            : `kai-conversations-${new Date().toISOString().split('T')[0]}.md`;
          mimeType = "text/markdown";
        } else {
          // CSV format
          content = "Conversation ID,Conversation Title,Message Role,Message Content,Created At\n";
          exportData.forEach(({ conversation, messages }) => {
            messages.forEach(msg => {
              const escapedContent = msg.content.replace(/"/g, '""').replace(/\n/g, ' ');
              content += `${conversation.id},"${conversation.title}",${msg.role},"${escapedContent}",${new Date(msg.createdAt).toISOString()}\n`;
            });
          });
          
          filename = input.conversationId
            ? `kai-conversation-${input.conversationId}.csv`
            : `kai-conversations-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = "text/csv";
        }
        
        return {
          content,
          filename,
          mimeType,
          count: exportData.length,
        };
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
    // Self-registration for new students
    register: publicProcedure
      .input(z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        email: z.string().email("Valid email is required"),
        phone: z.string().min(1, "Phone number is required"),
        dateOfBirth: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        programs: z.array(z.string()).optional(),
        experienceLevel: z.string().optional(),
        howDidYouHear: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createStudent, getStudentByEmail } = await import("./db");
        
        // Check if email already exists
        const existing = await getStudentByEmail(input.email);
        if (existing?.student) {
          throw new Error("An account with this email already exists. Please login instead.");
        }
        
        // Create the new student
        const newStudent = await createStudent({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          dateOfBirth: input.dateOfBirth || null,
          address: input.address || null,
          city: input.city || null,
          state: input.state || null,
          zipCode: input.zipCode || null,
          status: "trial",
          notes: `Self-registered. Programs: ${input.programs?.join(", ") || "None selected"}. Experience: ${input.experienceLevel || "Not specified"}. Source: ${input.howDidYouHear || "Not specified"}`,
        });
        
        return {
          success: true,
          student: newStudent,
          message: "Registration successful! We will contact you shortly to schedule your first class.",
        };
      }),

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

    // Enroll student in a class
    enrollInClass: publicProcedure
      .input(z.object({
        studentId: z.number(),
        classId: z.number(),
        smsRemindersEnabled: z.boolean().optional().default(true),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { classEnrollments, classes, students } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Check if already enrolled
        const existing = await db.select()
          .from(classEnrollments)
          .where(and(
            eq(classEnrollments.studentId, input.studentId),
            eq(classEnrollments.classId, input.classId),
            eq(classEnrollments.status, 'active')
          ))
          .limit(1);
        
        if (existing.length > 0) {
          return { success: false, message: 'Student is already enrolled in this class' };
        }
        
        // Create enrollment
        await db.insert(classEnrollments).values({
          studentId: input.studentId,
          classId: input.classId,
          smsRemindersEnabled: input.smsRemindersEnabled ? 1 : 0,
          status: 'active',
        });
        
        return { success: true, message: 'Student enrolled successfully' };
      }),

    // Unenroll student from a class
    unenrollFromClass: publicProcedure
      .input(z.object({
        studentId: z.number(),
        classId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { classEnrollments } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Update enrollment status to cancelled
        await db.update(classEnrollments)
          .set({ status: 'cancelled' })
          .where(and(
            eq(classEnrollments.studentId, input.studentId),
            eq(classEnrollments.classId, input.classId)
          ));
        
        return { success: true, message: 'Student unenrolled successfully' };
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
  }),

  // Classes router for schedule extraction and class management
  classes: router({
    // Extract schedule from uploaded file - robust parser with column detection
    extractSchedule: protectedProcedure
      .input(z.object({
        fileUrl: z.string().optional(),
        storageKey: z.string().optional(),
        fileType: z.string(),
        fileName: z.string(),
        columnMapping: z.object({
          name: z.number().optional(),
          day: z.number().optional(),
          startTime: z.number().optional(),
          endTime: z.number().optional(),
          instructor: z.number().optional(),
          room: z.number().optional(),
          level: z.number().optional(),
          capacity: z.number().optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        const xlsx = await import('xlsx');
        const { storageGetBuffer } = await import('./storage');
        
        // Helper function to normalize column names for matching
        const normalizeHeader = (h: string): string => {
          return h.toLowerCase().replace(/[^a-z0-9]/g, '');
        };
        
        // Column name variations for auto-detection (ordered by specificity - most specific first)
        // Use exact match patterns to avoid false positives (e.g., 'classid' matching 'class')
        const columnPatterns = {
          name: ['classname', 'programname', 'coursename', 'title', 'program', 'course', 'class', 'name'],
          day: ['dayofweek', 'weekday', 'days', 'day', 'schedule'],
          startTime: ['starttime', 'begintime', 'timefrom', 'start', 'begin', 'from'],
          endTime: ['endtime', 'finishtime', 'timeto', 'end', 'finish', 'to'],
          instructor: ['instructor', 'teacher', 'coach', 'staff', 'sensei', 'professor'],
          room: ['room', 'location', 'mat', 'studio', 'area', 'place'],
          level: ['level', 'difficulty', 'skilllevel', 'skill', 'grade', 'agerange'],
          capacity: ['maxcapacity', 'maxstudents', 'capacity', 'max', 'spots', 'size'],
        };
        
        // Columns to exclude from name detection (IDs, codes, etc.)
        const excludeFromName = ['classid', 'id', 'code', 'number', 'agerange'];
        
        // Helper to parse time strings
        const parseTime = (timeStr: string): string | null => {
          if (!timeStr) return null;
          const str = String(timeStr).trim();
          
          // Handle Excel time serial numbers (e.g., 0.6666666666666666 = 4:00 PM)
          if (!isNaN(Number(str)) && Number(str) < 1) {
            const totalMinutes = Math.round(Number(str) * 24 * 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
          
          // Try various time formats
          const patterns = [
            /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i,
            /^(\d{1,2})(am|pm)$/i,
            /^(\d{1,2})\s*(am|pm)$/i,
          ];
          
          for (const pattern of patterns) {
            const match = str.match(pattern);
            if (match) {
              let hours = parseInt(match[1]);
              const minutes = match[2] && !isNaN(parseInt(match[2])) ? parseInt(match[2]) : 0;
              const ampm = (match[3] || match[2] || '').toLowerCase();
              
              if (ampm === 'pm' && hours < 12) hours += 12;
              if (ampm === 'am' && hours === 12) hours = 0;
              
              return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
          }
          
          // Try 24-hour format
          const match24 = str.match(/^(\d{1,2}):(\d{2})$/);
          if (match24) {
            return `${match24[1].padStart(2, '0')}:${match24[2]}`;
          }
          
          return null;
        };
        
        // Helper to normalize day names
        const normalizeDay = (dayStr: string): string | null => {
          if (!dayStr) return null;
          const str = String(dayStr).toLowerCase().trim();
          const dayMap: Record<string, string> = {
            'mon': 'Mon', 'monday': 'Mon', 'm': 'Mon',
            'tue': 'Tue', 'tuesday': 'Tue', 'tues': 'Tue', 't': 'Tue',
            'wed': 'Wed', 'wednesday': 'Wed', 'w': 'Wed',
            'thu': 'Thu', 'thursday': 'Thu', 'thurs': 'Thu', 'th': 'Thu',
            'fri': 'Fri', 'friday': 'Fri', 'f': 'Fri',
            'sat': 'Sat', 'saturday': 'Sat', 's': 'Sat',
            'sun': 'Sun', 'sunday': 'Sun', 'su': 'Sun',
          };
          return dayMap[str] || null;
        };
        
        try {
          let arrayBuffer: ArrayBuffer;
          
          // Try to read from storage key first (more reliable), then fall back to URL
          if (input.storageKey) {
            try {
              console.log('[Schedule Extract] Reading from storage key:', input.storageKey);
              arrayBuffer = await storageGetBuffer(input.storageKey);
              console.log('[Schedule Extract] Got buffer, size:', arrayBuffer.byteLength);
            } catch (storageError: any) {
              console.error('[Schedule Extract] Storage read failed, trying URL:', storageError);
              // Fall back to URL if storage key fails
              if (input.fileUrl) {
                const response = await fetch(input.fileUrl);
                if (!response.ok) {
                  return { success: false, classes: [], confidence: 0, error: `Failed to fetch file: ${response.status} ${response.statusText}`, errorType: 'file_access' };
                }
                arrayBuffer = await response.arrayBuffer();
              } else {
                return { success: false, classes: [], confidence: 0, error: `Storage read failed: ${storageError.message}`, errorType: 'file_access' };
              }
            }
          } else if (input.fileUrl) {
            // Fetch from URL
            console.log('[Schedule Extract] Fetching from URL:', input.fileUrl);
            const response = await fetch(input.fileUrl);
            if (!response.ok) {
              return { success: false, classes: [], confidence: 0, error: `Failed to fetch file: ${response.status} ${response.statusText}`, errorType: 'file_access' };
            }
            arrayBuffer = await response.arrayBuffer();
          } else {
            return { success: false, classes: [], confidence: 0, error: 'No file URL or storage key provided', errorType: 'missing_input' };
          }
          
          console.log('[Schedule Extract] Parsing workbook...');
          const workbook = xlsx.read(arrayBuffer, { type: 'array' });
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with raw values
          const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
          
          console.log('[Schedule Extract] Sheet:', sheetName, 'Rows:', data.length);
          
          if (data.length < 2) {
            return { 
              success: false, 
              classes: [], 
              confidence: 0, 
              error: 'File appears to be empty or has no data rows', 
              rawHeaders: data[0] || [],
              errorType: 'empty_file'
            };
          }
          
          // Extract and normalize headers
          const rawHeaders = (data[0] || []).map(h => String(h || '').trim());
          const normalizedHeaders = rawHeaders.map(normalizeHeader);
          
          console.log('[Schedule Extract] Headers:', rawHeaders);
          
          // Auto-detect column mapping if not provided
          let mapping = input.columnMapping || {};
          const detectedMapping: Record<string, number> = {};
          const unmappedRequired: string[] = [];
          
          for (const [field, patterns] of Object.entries(columnPatterns)) {
            // Use provided mapping if available
            if (mapping[field as keyof typeof mapping] !== undefined) {
              detectedMapping[field] = mapping[field as keyof typeof mapping]!;
              continue;
            }
            
            // Try to auto-detect - first try exact match, then partial match
            let idx = -1;
            
            // First pass: exact match
            for (const pattern of patterns) {
              idx = normalizedHeaders.findIndex(h => h === pattern);
              if (idx !== -1) break;
            }
            
            // Second pass: partial match (but exclude ID columns for name field)
            if (idx === -1) {
              for (const pattern of patterns) {
                idx = normalizedHeaders.findIndex((h, i) => {
                  // Skip if already mapped to another field
                  if (Object.values(detectedMapping).includes(i)) return false;
                  // For name field, exclude ID-like columns
                  if (field === 'name' && excludeFromName.some(ex => h.includes(ex))) return false;
                  return h.includes(pattern);
                });
                if (idx !== -1) break;
              }
            }
            
            if (idx !== -1) {
              detectedMapping[field] = idx;
            } else if (['name', 'day', 'startTime', 'endTime'].includes(field)) {
              unmappedRequired.push(field);
            }
          }
          
          console.log('[Schedule Extract] Detected mapping:', detectedMapping);
          console.log('[Schedule Extract] Unmapped required:', unmappedRequired);
          
          // If we can't detect required columns, return with headers for manual mapping
          if (unmappedRequired.length > 0) {
            return {
              success: false,
              classes: [],
              confidence: 0,
              error: `Could not auto-detect columns: ${unmappedRequired.join(', ')}. Please map the columns manually.`,
              errorType: 'mapping_required',
              rawHeaders,
              detectedMapping,
              suggestColumnMapping: true,
              previewRows: data.slice(1, 6).map(row => row.map(cell => String(cell || '')))
            };
          }
          
          // Parse rows into classes
          const classes: any[] = [];
          const warnings: string[] = [];
          const rowErrors: { row: number; error: string }[] = [];
          
          for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.every(cell => !cell)) continue; // Skip empty rows
            
            const getValue = (field: string) => {
              const idx = detectedMapping[field];
              return idx !== undefined && row[idx] !== undefined ? String(row[idx]).trim() : '';
            };
            
            const name = getValue('name');
            const dayRaw = getValue('day');
            const startTimeRaw = getValue('startTime');
            const endTimeRaw = getValue('endTime');
            
            // Validate required fields
            if (!name) {
              rowErrors.push({ row: i + 1, error: 'Missing class name' });
              continue;
            }
            
            // Parse day - handle multiple days separated by comma or slash
            const dayParts = dayRaw.split(/[,\/&]/).map(d => d.trim()).filter(Boolean);
            const days = dayParts.map(normalizeDay).filter(Boolean) as string[];
            
            if (days.length === 0) {
              rowErrors.push({ row: i + 1, error: `Invalid day format: "${dayRaw}"` });
              continue;
            }
            
            // Parse times
            const startTime = parseTime(startTimeRaw);
            const endTime = parseTime(endTimeRaw);
            
            if (!startTime) {
              rowErrors.push({ row: i + 1, error: `Invalid start time: "${startTimeRaw}"` });
              continue;
            }
            
            if (!endTime) {
              rowErrors.push({ row: i + 1, error: `Invalid end time: "${endTimeRaw}"` });
              continue;
            }
            
            // Get optional fields
            const instructor = getValue('instructor') || undefined;
            const room = getValue('room') || undefined;
            const level = getValue('level') || 'All Levels';
            const capacityStr = getValue('capacity');
            const capacity = capacityStr ? parseInt(capacityStr) : undefined;
            
            // Create class entry for each day
            for (const day of days) {
              classes.push({
                name,
                dayOfWeek: day,
                startTime,
                endTime,
                instructor,
                location: room,
                level,
                maxCapacity: capacity || 20,
              });
            }
          }
          
          console.log('[Schedule Extract] Parsed', classes.length, 'classes,', rowErrors.length, 'errors');
          
          // Calculate confidence based on success rate
          const totalRows = data.length - 1;
          const successRate = totalRows > 0 ? (totalRows - rowErrors.length) / totalRows : 0;
          const confidence = Math.round(successRate * 100) / 100;
          
          if (classes.length === 0) {
            return {
              success: false,
              classes: [],
              confidence: 0,
              error: rowErrors.length > 0 
                ? `Could not parse any classes. Errors: ${rowErrors.slice(0, 3).map(e => `Row ${e.row}: ${e.error}`).join('; ')}` 
                : 'No valid class data found in the file.',
              errorType: 'parse_error',
              rawHeaders,
              detectedMapping,
              rowErrors: rowErrors.slice(0, 10),
            };
          }
          
          // Add warnings for row errors
          if (rowErrors.length > 0) {
            warnings.push(`${rowErrors.length} row(s) had errors and were skipped`);
          }
          
          return {
            success: true,
            classes,
            confidence,
            warnings,
            rawHeaders,
            detectedMapping,
            rowErrors: rowErrors.slice(0, 10),
          };
        } catch (error: any) {
          console.error('[Schedule Extract] Error:', error);
          
          // Provide specific error messages based on error type
          let errorMessage = 'Failed to extract schedule';
          let errorType = 'unknown';
          
          if (error.message?.includes('fetch') || error.message?.includes('storage')) {
            errorMessage = `Could not read the file: ${error.message}`;
            errorType = 'file_access';
          } else if (error.message?.includes('sheet') || error.message?.includes('workbook') || error.message?.includes('xlsx')) {
            errorMessage = 'Could not parse the spreadsheet. Please ensure it\'s a valid Excel or CSV file.';
            errorType = 'parse_error';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          return {
            success: false,
            classes: [],
            confidence: 0,
            error: errorMessage,
            errorType,
            rawHeaders: [],
          };
        }
      }),

    // Create classes from extracted schedule
    createClassesFromSchedule: protectedProcedure
      .input(z.object({
        classes: z.array(z.object({
          name: z.string(),
          dayOfWeek: z.string(),
          startTime: z.string(),
          endTime: z.string(),
          instructor: z.string().optional(),
          location: z.string().optional(),
          level: z.string().optional(),
          maxCapacity: z.number().optional(),
          notes: z.string().optional(),
        }))
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import('./db');
        const { classes } = await import('../drizzle/schema');
        
        const db = await getDb();
        if (!db) {
          return { success: false, createdCount: 0, error: 'Database not available' };
        }
        
        // Helper to format 24h time to 12h display format
        const formatTime = (time24: string): string => {
          const [hours, minutes] = time24.split(':').map(Number);
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const h12 = hours % 12 || 12;
          return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        };
        
        let createdCount = 0;
        const errors: string[] = [];
        const createdIds: number[] = [];
        
        for (const classData of input.classes) {
          try {
            // Format time for display (e.g., "4:00 PM - 5:00 PM")
            const timeDisplay = `${formatTime(classData.startTime)} - ${formatTime(classData.endTime)}`;
            
            console.log('[CreateClasses] Creating:', classData.name, classData.dayOfWeek, timeDisplay);
            
            // Only use fields that exist in the schema
            const result = await db.insert(classes).values({
              name: classData.name,
              dayOfWeek: classData.dayOfWeek,
              time: timeDisplay,
              instructor: classData.instructor || null,
              capacity: classData.maxCapacity || 20,
              isActive: 1,
              enrolled: 0,
            });
            
            // Get the inserted ID
            if (result.insertId) {
              createdIds.push(Number(result.insertId));
            }
            
            createdCount++;
          } catch (error: any) {
            console.error(`[CreateClasses] Failed to create class ${classData.name}:`, error);
            errors.push(`Failed to create ${classData.name}: ${error.message}`);
          }
        }
        
        console.log('[CreateClasses] Created', createdCount, 'classes, IDs:', createdIds);
        
        return {
          success: createdCount > 0,
          createdCount,
          createdIds,
          errors: errors.length > 0 ? errors : undefined
        };
      }),
  }),

  // Programs management router
  programs: router({
    // Get all programs
    list: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { programs } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const result = await db.select().from(programs).orderBy(desc(programs.createdAt));
      return result;
    }),

    // Get a single program by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { programs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const result = await db.select().from(programs).where(eq(programs.id, input.id));
        return result[0] || null;
      }),

    // Create a new program
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["membership", "class_pack", "drop_in", "private"]),
        ageRange: z.string().optional(),
        billing: z.enum(["monthly", "weekly", "per_session", "one_time"]).optional(),
        price: z.number().optional(),
        contractLength: z.string().optional(),
        maxSize: z.number().optional(),
        isCoreProgram: z.boolean().optional(),
        showOnKiosk: z.boolean().optional(),
        allowAutopilot: z.boolean().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { programs } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const result = await db.insert(programs).values({
          name: input.name,
          type: input.type,
          ageRange: input.ageRange,
          billing: input.billing,
          price: input.price,
          contractLength: input.contractLength,
          maxSize: input.maxSize || 20,
          isCoreProgram: input.isCoreProgram ? 1 : 0,
          showOnKiosk: input.showOnKiosk !== false ? 1 : 0,
          allowAutopilot: input.allowAutopilot ? 1 : 0,
          description: input.description,
          isActive: 1,
        });
        
        return { success: true, id: Number(result.insertId) };
      }),

    // Update an existing program
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        type: z.enum(["membership", "class_pack", "drop_in", "private"]).optional(),
        ageRange: z.string().optional(),
        billing: z.enum(["monthly", "weekly", "per_session", "one_time"]).optional(),
        price: z.number().optional(),
        contractLength: z.string().optional(),
        maxSize: z.number().optional(),
        isCoreProgram: z.boolean().optional(),
        showOnKiosk: z.boolean().optional(),
        allowAutopilot: z.boolean().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { programs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const { id, ...updates } = input;
        
        // Convert boolean fields to int
        const dbUpdates: any = { ...updates };
        if (typeof updates.isCoreProgram === 'boolean') dbUpdates.isCoreProgram = updates.isCoreProgram ? 1 : 0;
        if (typeof updates.showOnKiosk === 'boolean') dbUpdates.showOnKiosk = updates.showOnKiosk ? 1 : 0;
        if (typeof updates.allowAutopilot === 'boolean') dbUpdates.allowAutopilot = updates.allowAutopilot ? 1 : 0;
        if (typeof updates.isActive === 'boolean') dbUpdates.isActive = updates.isActive ? 1 : 0;
        
        await db.update(programs)
          .set(dbUpdates)
          .where(eq(programs.id, id));
        
        return { success: true };
      }),

    // Delete a program
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { programs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.delete(programs).where(eq(programs.id, input.id));
        
        return { success: true };
      }),
  }),
  
  // Smart Enrollment (Typeform-style + Kai-ready architecture)
  enrollment: router({    
    // Create new enrollment (draft)
    create: publicProcedure
      .input(z.object({
        source: z.enum(['kai', 'form', 'staff']).default('form'),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { enrollments } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const result = await db.insert(enrollments).values({
          source: input.source,
          status: 'draft',
          firstName: '',
          lastName: '',
        });
        
        // MySQL returns insertId in different formats depending on driver
        const enrollmentId = Number(result[0]?.insertId || result.insertId);
        
        // Fetch the created enrollment
        const { eq } = await import("drizzle-orm");
        const [enrollment] = await db.select().from(enrollments)
          .where(eq(enrollments.id, enrollmentId))
          .limit(1);
        
        return { success: true, enrollmentId: enrollment.id, enrollment };
      }),
    
    // Update enrollment step-by-step (Kai-ready: external control)
    updateStep: publicProcedure
      .input(z.object({
        enrollmentId: z.number(),
        stepId: z.string(), // e.g., 'student_info', 'contact_info', 'parent_info'
        data: z.any(), // Step-specific data
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { enrollments } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Map stepId to database fields
        const updateData: any = {};
        
        switch (input.stepId) {
          case 'student_info':
            if (input.data.firstName) updateData.firstName = input.data.firstName;
            if (input.data.lastName) updateData.lastName = input.data.lastName;
            if (input.data.dateOfBirth) updateData.dateOfBirth = new Date(input.data.dateOfBirth);
            if (input.data.age) updateData.age = input.data.age;
            break;
          
          case 'contact_info':
            if (input.data.phone) updateData.phone = input.data.phone;
            if (input.data.email) updateData.email = input.data.email;
            if (input.data.streetAddress) updateData.streetAddress = input.data.streetAddress;
            if (input.data.city) updateData.city = input.data.city;
            if (input.data.state) updateData.state = input.data.state;
            if (input.data.zipCode) updateData.zipCode = input.data.zipCode;
            break;
          
          case 'parent_info':
            if (input.data.guardianName) updateData.guardianName = input.data.guardianName;
            if (input.data.guardianRelationship) updateData.guardianRelationship = input.data.guardianRelationship;
            if (input.data.guardianPhone) updateData.guardianPhone = input.data.guardianPhone;
            if (input.data.guardianEmail) updateData.guardianEmail = input.data.guardianEmail;
            break;
          
          case 'program_interest':
            if (input.data.programInterest) updateData.programInterest = input.data.programInterest;
            if (input.data.experienceLevel) updateData.experienceLevel = input.data.experienceLevel;
            if (input.data.classType) updateData.classType = input.data.classType;
            break;
          
          case 'goals_motivation':
            if (input.data.goals) updateData.goals = input.data.goals;
            if (input.data.motivation) updateData.motivation = input.data.motivation;
            break;
          
          case 'medical_info':
            if (input.data.allergies) updateData.allergies = input.data.allergies;
            if (input.data.medicalConditions) updateData.medicalConditions = input.data.medicalConditions;
            if (input.data.emergencyContactName) updateData.emergencyContactName = input.data.emergencyContactName;
            if (input.data.emergencyContactPhone) updateData.emergencyContactPhone = input.data.emergencyContactPhone;
            break;
          
          case 'pricing':
            if (input.data.selectedMembershipPlan) updateData.selectedMembershipPlan = input.data.selectedMembershipPlan;
            if (input.data.pricingNotes) updateData.pricingNotes = input.data.pricingNotes;
            break;
          
          case 'waiver':
            if (input.data.waiverSigned !== undefined) updateData.waiverSigned = input.data.waiverSigned;
            if (input.data.waiverSignature) updateData.waiverSignature = input.data.waiverSignature;
            if (input.data.waiverSignedAt) updateData.waiverSignedAt = new Date(input.data.waiverSignedAt);
            if (input.data.consentGiven !== undefined) updateData.consentGiven = input.data.consentGiven;
            break;
        }
        
        updateData.updatedAt = new Date();
        
        await db.update(enrollments)
          .set(updateData)
          .where(eq(enrollments.id, input.enrollmentId));
        
        return { success: true };
      }),
    
    // Get enrollment by ID (for resume capability)
    get: publicProcedure
      .input(z.object({
        enrollmentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { enrollments } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const enrollment = await db.select().from(enrollments).where(eq(enrollments.id, input.enrollmentId)).limit(1);
        
        if (enrollment.length === 0) {
          throw new Error('Enrollment not found');
        }
        
        return { enrollment: enrollment[0] };
      }),
    
    // Submit enrollment (finalize)
    submit: publicProcedure
      .input(z.object({
        enrollmentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { enrollments, leads, students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get enrollment
        const enrollment = await db.select().from(enrollments).where(eq(enrollments.id, input.enrollmentId)).limit(1);
        
        if (enrollment.length === 0) {
          throw new Error('Enrollment not found');
        }
        
        const enroll = enrollment[0];
        
        // Validate required fields
        if (!enroll.firstName || !enroll.lastName) {
          throw new Error('Student name is required');
        }
        
        if (!enroll.waiverSigned) {
          throw new Error('Waiver must be signed');
        }
        
        // Create lead record
        const [lead] = await db.insert(leads).values({
          firstName: enroll.firstName,
          lastName: enroll.lastName,
          email: enroll.email || '',
          phone: enroll.phone || '',
          status: 'New Lead',
          source: enroll.source === 'kai' ? 'Kai Enrollment' : 'Kiosk Enrollment',
          notes: `Program Interest: ${enroll.programInterest || 'Not specified'}\nExperience: ${enroll.experienceLevel || 'Not specified'}\nGoals: ${enroll.goals || 'Not specified'}`,
          createdAt: new Date(),
        }).returning();
        
        // Update enrollment status
        await db.update(enrollments)
          .set({ 
            status: 'submitted',
            submittedAt: new Date(),
          })
          .where(eq(enrollments.id, input.enrollmentId));
        
        return { 
          success: true, 
          leadId: lead.id,
          message: 'Enrollment submitted successfully! Our staff will contact you soon.'
        };
      }),
    
    // Kai-guided conversation
    kaiConverse: publicProcedure
      .input(z.object({
        enrollmentId: z.number(),
        userMessage: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { enrollments } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { invokeLLM } = await import("./_core/llm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get current enrollment state
        const enrollment = await db.select().from(enrollments)
          .where(eq(enrollments.id, input.enrollmentId))
          .limit(1);
        
        if (enrollment.length === 0) {
          throw new Error('Enrollment not found');
        }
        
        const currentData = enrollment[0];
        
        // Build conversation context
        const conversationHistory = currentData.conversationTranscript 
          ? JSON.parse(currentData.conversationTranscript as string)
          : [];
        
        // Determine what fields are still needed
        const missingFields = [];
        if (!currentData.firstName || !currentData.lastName) missingFields.push('student_name');
        if (!currentData.dateOfBirth && !currentData.age) missingFields.push('date_of_birth_or_age');
        if (!currentData.phone && !currentData.email) missingFields.push('contact_info');
        if (!currentData.streetAddress) missingFields.push('address');
        
        // Check if guardian info needed (if under 18)
        const needsGuardian = currentData.age && currentData.age < 18;
        if (needsGuardian && !currentData.guardianName) missingFields.push('guardian_info');
        
        if (!currentData.programInterest) missingFields.push('program_interest');
        if (!currentData.experienceLevel) missingFields.push('experience_level');
        if (!currentData.goals) missingFields.push('goals_motivation');
        if (!currentData.emergencyContactName) missingFields.push('emergency_contact');
        if (!currentData.selectedMembershipPlan) missingFields.push('membership_plan');
        if (!currentData.waiverSigned) missingFields.push('waiver_signature');
        
        const isComplete = missingFields.length === 0;
        
        // Build system prompt for Kai
        const systemPrompt = `You are Kai, a friendly enrollment assistant for DojoFlow martial arts school.

Your role:
- Guide the user through enrollment by asking ONE question at a time
- Extract information from user responses using the provided JSON schema
- Be conversational but efficient
- Adapt questions based on previous answers (e.g., skip parent info if adult)
- Never ask for information already collected

Current enrollment progress:
${JSON.stringify({
  firstName: currentData.firstName,
  lastName: currentData.lastName,
  age: currentData.age,
  dateOfBirth: currentData.dateOfBirth,
  phone: currentData.phone,
  email: currentData.email,
  address: currentData.streetAddress ? 'collected' : 'missing',
  guardianInfo: needsGuardian ? (currentData.guardianName ? 'collected' : 'missing') : 'not needed',
  programInterest: currentData.programInterest,
  experienceLevel: currentData.experienceLevel,
  goals: currentData.goals ? 'collected' : 'missing',
  emergencyContact: currentData.emergencyContactName ? 'collected' : 'missing',
  membershipPlan: currentData.selectedMembershipPlan,
  waiverSigned: currentData.waiverSigned,
}, null, 2)}

Missing fields: ${missingFields.join(', ')}

Instructions:
1. If user just provided information, acknowledge it warmly
2. Ask for the NEXT missing field using natural language
3. Extract any information from the user's message into the JSON response
4. Keep responses brief (2-3 sentences max)
5. For waiver, explain it's required and ask for digital signature confirmation
6. When all fields collected, congratulate them and confirm submission

Membership plans available:
- Kids (Ages 6-12): $99/month
- Teens (Ages 13-17): $119/month  
- Adults (18+): $139/month
- Family (2+ members): $249/month`;
        
        // Call LLM with structured output
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: input.userMessage },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'enrollment_extraction',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  kai_response: { type: 'string', description: 'Kai\'s conversational response to the user' },
                  extracted_data: {
                    type: 'object',
                    properties: {
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      dateOfBirth: { type: 'string' },
                      age: { type: 'number' },
                      phone: { type: 'string' },
                      email: { type: 'string' },
                      streetAddress: { type: 'string' },
                      city: { type: 'string' },
                      state: { type: 'string' },
                      zipCode: { type: 'string' },
                      guardianName: { type: 'string' },
                      guardianRelationship: { type: 'string' },
                      guardianPhone: { type: 'string' },
                      guardianEmail: { type: 'string' },
                      programInterest: { type: 'string' },
                      experienceLevel: { type: 'string' },
                      classType: { type: 'string' },
                      goals: { type: 'string' },
                      motivation: { type: 'string' },
                      allergies: { type: 'string' },
                      medicalConditions: { type: 'string' },
                      emergencyContactName: { type: 'string' },
                      emergencyContactPhone: { type: 'string' },
                      selectedMembershipPlan: { type: 'string' },
                      waiverSigned: { type: 'boolean' },
                      consentGiven: { type: 'boolean' },
                    },
                    required: [],
                    additionalProperties: false,
                  },
                  is_complete: { type: 'boolean', description: 'True if all required fields are now collected' },
                },
                required: ['kai_response', 'extracted_data', 'is_complete'],
                additionalProperties: false,
              },
            },
          },
        });
        
        const result = JSON.parse(response.choices[0].message.content || '{}');
        
        // Update enrollment with extracted data
        const updateData: any = {};
        const extracted = result.extracted_data || {};
        
        if (extracted.firstName) updateData.firstName = extracted.firstName;
        if (extracted.lastName) updateData.lastName = extracted.lastName;
        if (extracted.dateOfBirth) updateData.dateOfBirth = new Date(extracted.dateOfBirth);
        if (extracted.age) updateData.age = extracted.age;
        if (extracted.phone) updateData.phone = extracted.phone;
        if (extracted.email) updateData.email = extracted.email;
        if (extracted.streetAddress) updateData.streetAddress = extracted.streetAddress;
        if (extracted.city) updateData.city = extracted.city;
        if (extracted.state) updateData.state = extracted.state;
        if (extracted.zipCode) updateData.zipCode = extracted.zipCode;
        if (extracted.guardianName) updateData.guardianName = extracted.guardianName;
        if (extracted.guardianRelationship) updateData.guardianRelationship = extracted.guardianRelationship;
        if (extracted.guardianPhone) updateData.guardianPhone = extracted.guardianPhone;
        if (extracted.guardianEmail) updateData.guardianEmail = extracted.guardianEmail;
        if (extracted.programInterest) updateData.programInterest = extracted.programInterest;
        if (extracted.experienceLevel) updateData.experienceLevel = extracted.experienceLevel;
        if (extracted.classType) updateData.classType = extracted.classType;
        if (extracted.goals) updateData.goals = extracted.goals;
        if (extracted.motivation) updateData.motivation = extracted.motivation;
        if (extracted.allergies) updateData.allergies = extracted.allergies;
        if (extracted.medicalConditions) updateData.medicalConditions = extracted.medicalConditions;
        if (extracted.emergencyContactName) updateData.emergencyContactName = extracted.emergencyContactName;
        if (extracted.emergencyContactPhone) updateData.emergencyContactPhone = extracted.emergencyContactPhone;
        if (extracted.selectedMembershipPlan) updateData.selectedMembershipPlan = extracted.selectedMembershipPlan;
        if (extracted.waiverSigned !== undefined) {
          updateData.waiverSigned = extracted.waiverSigned ? 1 : 0;
          if (extracted.waiverSigned) {
            updateData.waiverSignedAt = new Date();
          }
        }
        if (extracted.consentGiven !== undefined) updateData.consentGiven = extracted.consentGiven ? 1 : 0;
        
        // Update conversation history
        conversationHistory.push(
          { role: 'user', content: input.userMessage },
          { role: 'assistant', content: result.kai_response }
        );
        updateData.conversationTranscript = JSON.stringify(conversationHistory);
        
        // Save to database
        await db.update(enrollments)
          .set(updateData)
          .where(eq(enrollments.id, input.enrollmentId));
        
        // If complete, submit enrollment
        if (result.is_complete) {
          // Auto-submit
          const updatedEnrollment = await db.select().from(enrollments)
            .where(eq(enrollments.id, input.enrollmentId))
            .limit(1);
          
          if (updatedEnrollment.length > 0 && updatedEnrollment[0].waiverSigned) {
            const { leads } = await import("../drizzle/schema");
            const enroll = updatedEnrollment[0];
            
            // Create lead
            await db.insert(leads).values({
              firstName: enroll.firstName,
              lastName: enroll.lastName,
              email: enroll.email || '',
              phone: enroll.phone || '',
              status: 'New Lead',
              source: 'Kai Enrollment',
              notes: `Program Interest: ${enroll.programInterest || 'Not specified'}\nExperience: ${enroll.experienceLevel || 'Not specified'}\nGoals: ${enroll.goals || 'Not specified'}`,
              createdAt: new Date(),
            });
            
            // Update enrollment status
            await db.update(enrollments)
              .set({ 
                status: 'submitted',
                submittedAt: new Date(),
              })
              .where(eq(enrollments.id, input.enrollmentId));
          }
        }
        
        return {
          kaiResponse: result.kai_response,
          extractedData: extracted,
          isComplete: result.is_complete || false,
        };
      }),
    
    // Validate step data (reusable by Kai)
    validateStep: publicProcedure
      .input(z.object({
        stepId: z.string(),
        data: z.any(),
      }))
      .query(({ input }) => {
        const errors: string[] = [];
        
        switch (input.stepId) {
          case 'student_info':
            if (!input.data.firstName) errors.push('First name is required');
            if (!input.data.lastName) errors.push('Last name is required');
            if (!input.data.dateOfBirth && !input.data.age) errors.push('Date of birth or age is required');
            break;
          
          case 'contact_info':
            if (!input.data.phone && !input.data.email) errors.push('Phone or email is required');
            if (input.data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.data.email)) {
              errors.push('Invalid email format');
            }
            break;
          
          case 'parent_info':
            // Only required if student is under 18
            if (input.data.requiresGuardian) {
              if (!input.data.guardianName) errors.push('Guardian name is required for students under 18');
              if (!input.data.guardianPhone && !input.data.guardianEmail) {
                errors.push('Guardian contact information is required');
              }
            }
            break;
          
          case 'waiver':
            if (!input.data.waiverSigned) errors.push('Waiver must be signed');
            if (!input.data.consentGiven) errors.push('Consent must be given');
            break;
        }
        
        return { valid: errors.length === 0, errors };
      }),
  }),
});

export type AppRouter = typeof appRouter;
